import os
import pandas as pd
import joblib
from flask import Blueprint, request, jsonify, send_file, make_response, after_this_request
from werkzeug.utils import secure_filename
from datetime import datetime
from fpdf import FPDF
from io import BytesIO

# --- IMPORT UTILS ---
from utils.pcap_to_csv import convert_pcap_to_csv
from utils.model_selector import load_model

offline_bp = Blueprint("offline_bp", __name__)


# --- CONFIGURATION ---
UPLOAD_DIR = "uploads"
SAMPLE_DIR = "sample"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

ALLOWED_EXT = {"csv", "pcap"}

# --- FEATURE DEFINITIONS (As per your Model Logs) ---
# --- UPDATED FEATURE DEFINITIONS ---
BCC_FEATURES = [
    "protocol",
    "src_port",
    "dst_port",
    "duration",
    "packets_count",
    "fwd_packets_count",
    "bwd_packets_count",
    "total_payload_bytes",
    "total_header_bytes",
    "bytes_rate",
    "packets_rate",
    "syn_flag_counts",
    "ack_flag_counts",
    "rst_flag_counts",
    "fin_flag_counts",
]

CICIDS_FEATURES = [
    "Protocol", "Dst Port", "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts",
    "TotLen Fwd Pkts", "TotLen Bwd Pkts", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean",
    "Flow IAT Mean", "Fwd PSH Flags", "Fwd URG Flags", "Fwd IAT Mean"
]

def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

# --- ROUTE: DOWNLOAD SAMPLE ---
@offline_bp.route("/sample/<model_type>", methods=["GET"])
def download_sample(model_type):
    file_path = os.path.join(SAMPLE_DIR, f"{model_type}_sample.csv")
    if not os.path.exists(file_path):
        return jsonify(success=False, message="Sample file missing"), 404
    return send_file(file_path, as_attachment=True)

# --- ROUTE: PREDICT ---
@offline_bp.route("/predict", methods=["POST"])
def offline_predict():
    if "file" not in request.files:
        return jsonify(success=False, message="No file uploaded"), 400

    file = request.files["file"]
    model_type = request.form.get("model", "bcc")

    if not allowed(file.filename):
        return jsonify(success=False, message="Unsupported file type"), 400

    filename = secure_filename(file.filename)
    saved_path = os.path.join(UPLOAD_DIR, filename)
    file.save(saved_path)

    # Cleanup logic to keep the server clean
    @after_this_request
    def cleanup(response):
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as e:
            print(f"Cleanup Error: {e}")
        return response

    # 1. Load Data
    try:
        # If PCAP, you'd call your converter here. For now, assuming CSV load.
        df = pd.read_csv(saved_path)
        if df.empty:
            return jsonify(success=False, message="CSV has no data!"), 400
    except Exception as e:
        return jsonify(success=False, message=f"Error reading CSV: {str(e)}"), 400

    # 2. Flexible Feature Mapping & Flag Extraction
    # Renames common CSV headers to the specific technical names the model expects
    # 2. Flexible Feature Mapping (Translate to EXACT fit-time names)
    # 2. Flexible Feature Mapping
    mapping = {
        'Protocol': 'protocol', 'proto': 'protocol',
        'Source Port': 'src_port',
        'Destination Port': 'dst_port',
        'Flow Duration': 'duration', 'flow_duration': 'duration',
        'Total Fwd Packets': 'fwd_packets_count', 'total_fwd_pkts': 'fwd_packets_count',
        'Total Bwd Packets': 'bwd_packets_count', 'total_bwd_pkts': 'bwd_packets_count',
        'Total Length of Fwd Packets': 'total_payload_bytes', 'payload_len': 'total_payload_bytes',
        'fwd_header_len': 'total_header_bytes', 'header_len': 'total_header_bytes',
        'Flow Bytes/s': 'bytes_rate', 'rate': 'bytes_rate',
        'Flow Pkts/s': 'packets_rate',
        'syn': 'syn_flag_counts', 'ack': 'ack_flag_counts', 
        'rst': 'rst_flag_counts', 'fin': 'fin_flag_counts'
    }
    df = df.rename(columns=mapping)

    # Calculate packets_count if missing
    if 'packets_count' not in df.columns and 'fwd_packets_count' in df.columns:
        df['packets_count'] = df['fwd_packets_count'] + df.get('bwd_packets_count', 0)

    # --- FLAG EXTRACTION LOGIC ---
    flag_map = {
        'syn_flag_counts': 'syn', 
        'ack_flag_counts': 'ack', 
        'rst_flag_counts': 'rst', 
        'fin_flag_counts': 'fin'
    }

    for model_name, csv_name in flag_map.items():
        if model_name not in df.columns:
            if 'flags' in df.columns:
                # Handle String flags safely
                if df['flags'].dtype == object:
                    df[model_name] = df['flags'].str.lower().str.contains(csv_name).astype(int)
                else:
                    # Fallback for numeric or missing flag data
                    df[model_name] = 0
            else:
                df[model_name] = 0

    # 3. Model Loading & Feature Alignment
    try:
        model_data = load_model(model_type)
        if not model_data or model_data.get('model') is None:
            return jsonify(success=False, message="Model failed to load. Check Hub connection."), 500

        model = model_data['model']
        expected = BCC_FEATURES if model_type == "bcc" else CICIDS_FEATURES
        
        # 🚀 SAFETY PADDING: Fill missing features with 0 to prevent "CRITICAL_ERROR"
        for col in expected:
            if col not in df.columns:
                df[col] = 0 
                
    except Exception as e:
        return jsonify(success=False, message=f"Model Initialization Error: {str(e)}"), 500
    

    # 4. Prediction Logic
    try:
        # 1. Map protocols first!
        proto_map = {'TCP': 6, 'UDP': 17, 'ICMP': 1, 'tcp': 6, 'udp': 17, 'icmp': 1}
        df['protocol'] = df['protocol'].apply(lambda x: proto_map.get(x, x) if isinstance(x, str) else x)

        # 2. Reorder columns
        input_data = df[expected] 
    
        if model_type == "bcc":
            scaler = model_data.get('scaler')
            encoder = model_data.get('encoder')
        
            # Ensure all columns are numeric before scaling
            numeric_input = input_data.apply(pd.to_numeric, errors='coerce').fillna(0)
        
            # 3. Scale features
            scaled_data = scaler.transform(numeric_input.values) # Now it's all floats!
            preds = model.predict(scaled_data)
        
            labels = encoder.inverse_transform(preds)

        # 5. Result Formatting for React Frontend
        df["prediction"] = labels
        class_counts = df["prediction"].value_counts().to_dict()
        
        # Convert all labels to strings for JSON serializability
        results = [{"index": i, "class": str(lbl)} for i, lbl in enumerate(labels)]
        
        # Save results for the PDF report generator
        df.to_csv(os.path.join(UPLOAD_DIR, "last_results.csv"), index=False)

        return jsonify({
            "success": True, 
            "classCounts": class_counts, 
            "results": results,
            "total_processed": len(df)
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify(success=False, message=f"Prediction Engine Failure: {str(e)}"), 500

# --- ROUTE: PDF REPORT (MEMORY SAFE) ---
@offline_bp.route("/report", methods=["GET"])
def offline_report():
    result_file = os.path.join(UPLOAD_DIR, "last_results.csv")
    if not os.path.exists(result_file):
        return jsonify(success=False, message="Run prediction first"), 400

    df = pd.read_csv(result_file)
    class_counts = df["prediction"].value_counts().to_dict()

    # Generate PDF in memory
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "AI-NIDS Offline Threat Analysis Report", ln=True, align='C')
    pdf.ln(10)

    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    pdf.ln(5)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Classification Summary:", ln=True)
    pdf.set_font("Arial", size=12)
    
    for cls, count in class_counts.items():
        pdf.cell(0, 8, f"- {cls}: {count} occurrences", ln=True)

    # Convert to bytes for response (no local file saving)
    response = make_response(pdf.output(dest='S').encode('latin-1'))
    response.headers.set('Content-Disposition', 'attachment', filename='offline_report.pdf')
    response.headers.set('Content-Type', 'application/pdf')
    return response


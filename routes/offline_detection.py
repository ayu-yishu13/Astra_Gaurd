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

BCC_FEATURES = [
    "proto","src_port","dst_port","flow_duration","total_fwd_pkts","total_bwd_pkts",
    "flags_numeric","payload_len","header_len","rate","iat","syn","ack","rst","fin"
]

CICIDS_FEATURES = [
    "Protocol","Dst Port","Flow Duration","Tot Fwd Pkts","Tot Bwd Pkts",
    "TotLen Fwd Pkts","TotLen Bwd Pkts","Fwd Pkt Len Mean","Bwd Pkt Len Mean",
    "Flow IAT Mean","Fwd PSH Flags","Fwd URG Flags","Fwd IAT Mean"
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

    # Cleanup: Delete the uploaded file after the response is sent
    @after_this_request
    def cleanup(response):
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as e:
            print(f"Cleanup Error: {e}")
        return response

    # PCAP to CSV Conversion
    if filename.lower().endswith(".pcap"):
        try:
            saved_path = convert_pcap_to_csv(saved_path)
        except Exception as e:
            return jsonify(success=False, message=f"PCAP conversion failed: {str(e)}"), 500

    # Load Data
    try:
        df = pd.read_csv(saved_path)
        if df.empty:
            return jsonify(success=False, message="CSV has no data!"), 400
    except Exception as e:
        return jsonify(success=False, message=f"Error reading CSV: {str(e)}"), 400

    # 🚀 SECURE MODEL LOADING
    try:
        model_data = load_model(model_type)
        if not model_data or 'model' not in model_data or model_data['model'] is None:
            raise ValueError("Model object is None. Check version compatibility in requirements.txt")

        model = model_data['model']
        
        if model_type == "bcc":
            encoder = model_data.get('encoder')
            scaler = model_data.get('scaler')
            if not encoder or not scaler:
                raise ValueError("BCC model requires encoder and scaler but they were not found.")
            expected = BCC_FEATURES
        else:
            expected = CICIDS_FEATURES
    except Exception as e:
        return jsonify(success=False, message=f"Model failure: {str(e)}"), 500

    # Feature Verification
    missing = [c for c in expected if c not in df.columns]
    if missing:
        return jsonify(success=False, message=f"Missing features: {missing}"), 400

    # Prediction Logic
    try:
        input_data = df[expected]
        if model_type == "bcc":
            scaled = scaler.transform(input_data)
            preds = model.predict(scaled)
            labels = encoder.inverse_transform(preds)
        else:
            labels = model.predict(input_data)

        df["prediction"] = labels
        class_counts = df["prediction"].value_counts().to_dict()
        results = [{"index": i, "class": lbl} for i, lbl in enumerate(labels)]

        # Save results for PDF generation
        result_file = os.path.join(UPLOAD_DIR, "last_results.csv")
        df.to_csv(result_file, index=False)

        return jsonify(success=True, classCounts=class_counts, results=results)
    except Exception as e:
        return jsonify(success=True, message=f"Prediction failed: {str(e)}"), 500

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


import os
import pandas as pd
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from datetime import datetime
import joblib
from fpdf import FPDF
from utils.pcap_to_csv import convert_pcap_to_csv

offline_bp = Blueprint("offline_bp", __name__)

UPLOAD_DIR = "uploads"
SAMPLE_DIR = "sample"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

ALLOWED_EXT = {"csv", "pcap"}

# Features
BCC_FEATURES = [
    "proto","src_port","dst_port","flow_duration","total_fwd_pkts","total_bwd_pkts",
    "flags_numeric","payload_len","header_len","rate","iat","syn","ack","rst","fin"
]

CICIDS_FEATURES = [
    "Protocol","Dst Port","Flow Duration","Tot Fwd Pkts","Tot Bwd Pkts",
    "TotLen Fwd Pkts","TotLen Bwd Pkts","Fwd Pkt Len Mean","Bwd Pkt Len Mean",
    "Flow IAT Mean","Fwd PSH Flags","Fwd URG Flags","Fwd IAT Mean"
]

# Models
bcc_model = joblib.load("ml_models/realtime_model.pkl")
bcc_encoder = joblib.load("ml_models/realtime_encoder.pkl")
bcc_scaler = joblib.load("ml_models/realtime_scaler.pkl")

cicids_model = joblib.load("ml_models/rf_pipeline.joblib")


def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


# 📌 Sample CSV Download
@offline_bp.route("/sample/<model>", methods=["GET"])
def download_sample(model):
    file_path = None
    if model == "bcc":
        file_path = os.path.join(SAMPLE_DIR, "bcc_sample.csv")
    elif model == "cicids":
        file_path = os.path.join(SAMPLE_DIR, "cicids_sample.csv")
    else:
        return jsonify(success=False, message="Invalid model"), 400

    if not os.path.exists(file_path):
        return jsonify(success=False, message="Sample file missing"), 404

    return send_file(file_path, as_attachment=True)


# 📌 Prediction API
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

    # PCAP Conversion
    if filename.lower().endswith(".pcap"):
        saved_path = convert_pcap_to_csv(saved_path)
    

    df = pd.read_csv(saved_path)
    # Prevent empty CSV prediction
    if df.shape[0] == 0:
        return jsonify(success=False, message="CSV has no data rows to analyze!"), 400
    
    expected = BCC_FEATURES if model_type == "bcc" else CICIDS_FEATURES

    missing = [c for c in expected if c not in df.columns]
    if missing:
        return jsonify(success=False, message=f"Missing features: {missing}")

    df = df[expected]

    if model_type == "bcc":
        scaled = bcc_scaler.transform(df)
        preds = bcc_model.predict(scaled)
        labels = bcc_encoder.inverse_transform(preds)
    else:
        labels = cicids_model.predict(df)

    df["prediction"] = labels
    class_counts = df["prediction"].value_counts().to_dict()

    results = [{"index": i, "class": lbl} for i, lbl in enumerate(labels)]

    result_file = os.path.join(UPLOAD_DIR, "last_results.csv")
    df.to_csv(result_file, index=False)

    return jsonify(success=True, classCounts=class_counts, results=results)


# 📌 PDF Report Generation
@offline_bp.route("/report", methods=["GET"])
def offline_report():
    result_file = os.path.join(UPLOAD_DIR, "last_results.csv")
    if not os.path.exists(result_file):
        return jsonify(success=False, message="Run prediction first"), 400

    df = pd.read_csv(result_file)
    class_counts = df["prediction"].value_counts().to_dict()

    pdf_path = os.path.join(UPLOAD_DIR, "offline_report.pdf")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "AI-NIDS Offline Threat Analysis Report", ln=True)

    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, f"Generated: {datetime.now()}", ln=True)
    pdf.ln(5)

    for c, v in class_counts.items():
        pdf.cell(0, 8, f"{c}: {v}", ln=True)

    pdf.output(pdf_path)
    return send_file(pdf_path, as_attachment=True)



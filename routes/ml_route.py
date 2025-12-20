# ==========================================================
# backend/routes/ml_route.py
# Adaptive AI Framework - ML Route for NIDS Intelligence
# ==========================================================

from flask import Blueprint, request, jsonify
import threading
import time
import os
import joblib
import random
from datetime import datetime
from flask_cors import cross_origin
import numpy as np

ml_bp = Blueprint("ml_bp", __name__)

ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_models"))

# In-memory global stores
MODELS = {}
RETRAIN_STATUS = {"running": False, "progress": 0, "message": "", "last_result": None}
METRICS_CACHE = {}

# Your NIDS feature list (15)
FEATURE_NAMES = [
    "protocol", "src_port", "dst_port", "duration", "packets_count",
    "fwd_packets_count", "bwd_packets_count", "total_payload_bytes",
    "total_header_bytes", "bytes_rate", "packets_rate",
    "syn_flag_counts", "ack_flag_counts", "rst_flag_counts", "fin_flag_counts"
]

# ==========================================================
# 🧠 Model Management
# ==========================================================

def try_load_models():
    """Load models from disk (if available)."""
    global MODELS
    MODELS = {}
    try:
        files = os.listdir(ML_DIR)
    except Exception:
        files = []

    for fname in files:
        if fname.endswith(".pkl"):
            name = os.path.splitext(fname)[0]
            try:
                m = joblib.load(os.path.join(ML_DIR, fname))
                MODELS[name] = {"obj": m, "name": name, "path": os.path.join(ML_DIR, fname)}
            except Exception as e:
                MODELS[name] = {"obj": None, "name": name, "path": os.path.join(ML_DIR, fname), "load_error": str(e)}

try_load_models()

def model_summary(name, entry):
    obj = entry.get("obj")
    info = {
        "id": name,
        "name": name,
        "type": type(obj).__name__ if obj is not None else "Unknown",
        "accuracy": None,
        "f1_score": None,
        "dataset": "unknown",
        "status": "Active" if obj is not None else "Unavailable",
        "last_trained": None,
    }
    meta = getattr(obj, "metadata", None)
    if isinstance(meta, dict):
        info.update({
            "accuracy": meta.get("accuracy"),
            "f1_score": meta.get("f1_score"),
            "dataset": meta.get("dataset"),
            "last_trained": meta.get("last_trained"),
        })
    return info

# ==========================================================
# 📦 ROUTES
# ==========================================================

@ml_bp.route("/ml/models", methods=["GET"])
def list_models():
    """Return all available models."""
    try_load_models()
    out = [model_summary(name, entry) for name, entry in MODELS.items()]

    if not out:
        out = [{
            "id": "placeholder_model",
            "name": "Placeholder Detector",
            "type": "Simulated",
            "accuracy": 92.1,
            "f1_score": 0.90,
            "dataset": "Simulated-NIDS",
            "status": "Active",
            "last_trained": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }]
    return jsonify(out)


@ml_bp.route("/ml/metrics", methods=["GET"])
def get_metrics():
    """Return metrics like accuracy history & class distribution."""
    if METRICS_CACHE:
        return jsonify(METRICS_CACHE)

    accuracy_history = [
        {"epoch": i + 1, "accuracy": round(0.8 + i * 0.04 + random.random() * 0.01, 3)}
        for i in range(10)
    ]
    class_distribution = {
        "Normal": 1500,
        "DDoS": 420,
        "PortScan": 260,
        "Botnet": 140,
        "VPN": 120,
        "TOR": 90
    }
    METRICS_CACHE.update({
        "accuracy_history": accuracy_history,
        "class_distribution": class_distribution
    })
    return jsonify(METRICS_CACHE)

# ==========================================================
# 🔮 PREDICTION ENDPOINT
# ==========================================================

def safe_predict_with_model(model_entry, features):
    """Try to predict with a loaded model."""
    obj = model_entry.get("obj")
    if obj is None:
        return None
    try:
        if isinstance(features, dict):
            features_list = [features.get(k, 0) for k in FEATURE_NAMES]
        else:
            features_list = features
        X = [features_list]

        if hasattr(obj, "predict_proba"):
            probs = obj.predict_proba(X)[0]
            pred_idx = int(np.argmax(probs))
            pred_label = obj.classes_[pred_idx] if hasattr(obj, "classes_") else str(pred_idx)
            return {"prediction": str(pred_label), "confidence": float(round(probs[pred_idx], 4))}
        else:
            pred = obj.predict(X)[0]
            return {"prediction": str(pred), "confidence": 1.0}
    except Exception:
        return None


@ml_bp.route("/ml/predict-test", methods=["POST"])
def predict_test():
    """Accept feature dict and return prediction result."""
    data = request.get_json() or {}
    features = data.get("features") or data.get("sample")
    model_name = data.get("model")

    try:
        if not features:
            return jsonify({"error": "No features provided"}), 400

        try_load_models()
        chosen = None
        if model_name and model_name in MODELS:
            chosen = MODELS[model_name]
        else:
            for k, e in MODELS.items():
                if e.get("obj") is not None:
                    chosen = e
                    break

        if chosen:
            res = safe_predict_with_model(chosen, features)
            if res:
                res.update({"model_used": chosen.get("name")})
                return jsonify(res)

        # Fallback simulated prediction
        classes = ["Normal", "DDoS", "PortScan", "Botnet", "VPN", "TOR"]
        pred = random.choice(classes)
        confidence = round(random.uniform(0.7, 0.99), 3)
        return jsonify({
            "prediction": pred,
            "confidence": confidence,
            "model_used": "SimulatedDetector",
            "used_features": FEATURE_NAMES
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================================
# ⚙️ RETRAIN SIMULATION
# ==========================================================

def _retrain_job(model_id=None, epochs=6):
    RETRAIN_STATUS["running"] = True
    RETRAIN_STATUS["progress"] = 0
    RETRAIN_STATUS["message"] = "Starting retrain..."
    best_acc = 0.0
    try:
        for e in range(1, epochs + 1):
            RETRAIN_STATUS["message"] = f"Epoch {e}/{epochs}..."
            for p in range(5):
                time.sleep(0.45)
                RETRAIN_STATUS["progress"] = int(((e - 1) * 100 / epochs) + (p + 1) * (100 / (epochs * 5)))
            best_acc = round(0.85 + (e * 0.02) + random.random() * 0.01, 4)
            RETRAIN_STATUS["message"] = f"Epoch {e} finished. acc: {best_acc}"
        RETRAIN_STATUS["message"] = "Finalizing..."
        time.sleep(0.6)
        RETRAIN_STATUS["last_result"] = {
            "accuracy": best_acc,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        METRICS_CACHE.setdefault("accuracy_history", []).append({
            "epoch": len(METRICS_CACHE.get("accuracy_history", [])) + 1,
            "accuracy": best_acc
        })
    except Exception as e:
        RETRAIN_STATUS["message"] = f"Error: {e}"
    finally:
        RETRAIN_STATUS["running"] = False
        RETRAIN_STATUS["progress"] = 100


@ml_bp.route("/ml/retrain", methods=["POST"])
def retrain():
    """Start retraining in background thread."""
    if RETRAIN_STATUS.get("running"):
        return jsonify({"error": "Retrain already in progress"}), 409
    payload = request.get_json() or {}
    model_id = payload.get("model")
    epochs = int(payload.get("epochs", 6))
    t = threading.Thread(target=_retrain_job, args=(model_id, epochs), daemon=True)
    t.start()
    return jsonify({"message": "Retrain started", "epochs": epochs})


@ml_bp.route("/ml/retrain/status", methods=["GET"])
def retrain_status():
    """Get retrain progress."""
    return jsonify(RETRAIN_STATUS)

# ==========================================================
# 🧩 FEATURE IMPORTANCE
# ==========================================================

@ml_bp.route("/feature-importance/<model_id>", methods=["GET"])
@cross_origin()
def feature_importance(model_id):
    """Return actual or simulated feature importances."""
    try:
        try_load_models()
        entry = MODELS.get(model_id)
        mdl = entry.get("obj") if entry else None

        fi = []
        if mdl is not None and hasattr(mdl, "feature_importances_"):
            arr = np.array(getattr(mdl, "feature_importances_")).flatten()
            arr = arr[:len(FEATURE_NAMES)]
            for i, v in enumerate(arr):
                fi.append({"feature": FEATURE_NAMES[i], "importance": float(v)})
        elif mdl is not None and hasattr(mdl, "coef_"):
            arr = np.abs(np.array(getattr(mdl, "coef_")).flatten())
            arr = arr[:len(FEATURE_NAMES)]
            total = float(np.sum(arr)) or 1.0
            for i, v in enumerate(arr):
                fi.append({"feature": FEATURE_NAMES[i], "importance": float(v / total * 100.0)})
        else:
            simulated = {
                "protocol": 8.2,
                "src_port": 7.1,
                "dst_port": 6.4,
                "duration": 10.5,
                "packets_count": 7.8,
                "fwd_packets_count": 6.9,
                "bwd_packets_count": 6.5,
                "total_payload_bytes": 9.8,
                "total_header_bytes": 8.6,
                "bytes_rate": 9.9,
                "packets_rate": 9.1,
                "syn_flag_counts": 5.3,
                "ack_flag_counts": 4.9,
                "rst_flag_counts": 3.8,
                "fin_flag_counts": 3.2
            }
            fi = [{"feature": f, "importance": float(v)} for f, v in simulated.items()]

        return jsonify({"model_id": model_id, "feature_importance": fi})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


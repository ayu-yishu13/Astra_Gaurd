# backend/routes/predict_route.py
from flask import Blueprint, request, jsonify
import time
import numpy as np
import pandas as pd
from utils.model_selector import load_model, get_active_model
from utils.logger import classify_risk

predict_bp = Blueprint("predict", __name__)

@predict_bp.route("/", methods=["GET"])
def info():
    active = get_active_model()
    return jsonify({
        "message": "POST JSON to /api/predict/ to get model prediction.",
        "active_model": active,
        "note": "For 'bcc' model send ordered features or dict; for 'cicids' send named features matching artifacts['features']."
    })

@predict_bp.route("/", methods=["POST"])
def predict():
    active = get_active_model()
    mdl = load_model(active)

    if active == "bcc":
        model = mdl.get("model")
        scaler = mdl.get("scaler")
        encoder = mdl.get("encoder")

        if model is None or scaler is None or encoder is None:
            return jsonify({"error": "BCC model/scaler/encoder not loaded on server."}), 500

        data = request.get_json(force=True, silent=True)
        if data is None:
            return jsonify({"error": "No JSON body provided"}), 400

        # Accept either list/array or dict of features
        # You must keep the same feature order as used in training (15 values)
        if isinstance(data, dict):
            # if the client provides named keys, try to coerce to ordered list
            # fallback: take values in insertion order
            vals = list(data.values())
        else:
            vals = list(data)

        try:
            X = np.array([float(v) for v in vals], dtype=float).reshape(1, -1)
        except Exception as e:
            return jsonify({"error": f"Failed to coerce input to numeric vector: {e}"}), 400

        try:
            Xs = scaler.transform(X)
        except Exception:
            # fallback: try prediction without scaler
            Xs = X

        try:
            pred_idx = model.predict(Xs)[0]
            conf = None
            if hasattr(model, "predict_proba"):
                conf = float(np.max(model.predict_proba(Xs))) * 100.0
            label = encoder.inverse_transform([int(pred_idx)])[0]
            risk = classify_risk(label)
            return jsonify({
                "prediction": str(label),
                "confidence": round(conf, 2) if conf is not None else None,
                "risk_level": risk
            })
        except Exception as e:
            return jsonify({"error": f"Model predict failed: {str(e)}"}), 500

    elif active == "cicids":
        obj = mdl.get("artifacts", None)
        model = mdl.get("model", None)
        if model is None or obj is None:
            return jsonify({"error": "CICIDS model or artifacts not available on server."}), 500

        # artifacts expected to have 'features' and 'scaler'
        features = obj.get("features") or obj.get("features_used") or obj.get("feature_list")
        scaler = obj.get("scaler") or obj.get("scaler_object")

        if not features or scaler is None:
            return jsonify({"error": "CICIDS artifacts missing features or scaler."}), 500

        data = request.get_json(force=True, silent=True)
        if data is None:
            return jsonify({"error": "No JSON body provided"}), 400

        # Accept dict of named features or list
        if isinstance(data, dict):
            # build row using artifacts feature order (missing -> 0)
            row = [float(data.get(f, 0)) for f in features]
        else:
            # list or array
            try:
                row = [float(x) for x in data]
            except Exception as e:
                return jsonify({"error": "Provided input must be array or dict of numbers."}), 400

            if len(row) != len(features):
                return jsonify({"error": f"Expecting {len(features)} features for cicids: {features}"}), 400

        X_df = pd.DataFrame([row], columns=features)
        try:
            Xs = scaler.transform(X_df)
        except Exception:
            Xs = X_df.values

        try:
            pred = model.predict(Xs)[0]
            conf = None
            if hasattr(model, "predict_proba"):
                conf = float(np.max(model.predict_proba(Xs))) * 100.0
            # label may already be string; try safe conversion
            try:
                label = str(pred)
            except Exception:
                label = repr(pred)

            risk = classify_risk(label)
            return jsonify({
                "prediction": label,
                "confidence": round(conf, 2) if conf else None,
                "risk_level": risk
            })
        except Exception as e:
            return jsonify({"error": f"CICIDS predict failed: {str(e)}"}), 500

    else:
        return jsonify({"error": "Unknown active model"}), 500



# backend/routes/ml_switch_route.py
from flask import Blueprint, request, jsonify
from utils.model_selector import set_active_model, get_active_model, load_model

ml_switch = Blueprint("ml_switch", __name__)

@ml_switch.route("/active", methods=["GET"])
def active():
    return jsonify({"active_model": get_active_model()})

@ml_switch.route("/select", methods=["POST"])
def select():
    data = request.get_json(force=True, silent=True) or {}
    model = data.get("model")
    if model not in ("bcc", "cicids"):
        return jsonify({"error": "model must be 'bcc' or 'cicids'"}), 400
    try:
        set_active_model(model)
        # attempt load to give quick feedback
        info = load_model(model)
        return jsonify({"message": f"Active model set to {model}", "loaded": bool(info)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@ml_switch.route("/health", methods=["GET"])
def health():
    import numpy as np
    import pandas as pd

    active = get_active_model()
    bundle = load_model(active)

    model = bundle.get("model")
    artifacts = bundle.get("artifacts")

    # Default responses
    artifact_keys = list(artifacts.keys()) if artifacts else []
    features = None
    feature_count = 0
    test_prediction = "N/A"

    # ------------------------------------------
    # CICIDS HEALTH CHECK
    # ------------------------------------------
    if active == "cicids":
        if artifacts and "features" in artifacts:
            features = artifacts["features"]
            feature_count = len(features)

        try:
            # generate a zero vector
            X = np.zeros((1, feature_count))
            scaler = artifacts.get("scaler")
            if scaler:
                X = scaler.transform(X)

            pred = model.predict(X)[0]
            test_prediction = str(pred)

        except Exception as e:
            test_prediction = f"Error: {str(e)}"

    # ------------------------------------------
    # BCC HEALTH CHECK
    # ------------------------------------------
    elif active == "bcc":
        try:
            # Create minimal fake BCC packet feature vector: 15 values
            X = np.zeros((1, 15))

            scaler = bundle.get("scaler")
            encoder = bundle.get("encoder")

            if scaler:
                Xs = scaler.transform(X)
            else:
                Xs = X

            pred_raw = model.predict(Xs)[0]

            if encoder:
                pred = encoder.inverse_transform([int(pred_raw)])[0]
            else:
                pred = str(pred_raw)

            test_prediction = f"OK: {pred}"

        except Exception as e:
            test_prediction = f"Error: {str(e)}"

    # ------------------------------------------
    # Build response
    # ------------------------------------------
    return {
        "active_model": active,
        "model_loaded": model is not None,
        "artifact_keys": artifact_keys,
        "feature_count": feature_count,
        "features": features,
        "test_prediction": test_prediction
    }



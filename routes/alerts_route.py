from flask import Blueprint, jsonify
from flask_cors import cross_origin
from utils.logger import get_recent_events
from utils.risk_engine import compute_risk_score
from datetime import datetime

alerts_bp = Blueprint("alerts", __name__)

# ---------------------------------------------------------
# Deduce risk based on prediction (simple + stable)
# ---------------------------------------------------------
def classify_risk(prediction):
    if prediction in ["TOR", "I2P", "ZERONET", "FREENET"]:
        return "High"
    if prediction in ["VPN"]:
        return "Medium"
    return "Low"


@alerts_bp.route("/alerts", methods=["GET"])
@cross_origin()
def get_alerts():
    """
    Returns ONLY real alerts (Medium + High)
    with stable risk scoring and time sorting.
    Fully compatible with optimized logger.
    """
    try:
        raw_events = get_recent_events()
        alerts = []

        for e in raw_events:
            pred = e.get("prediction", "Unknown")

            # -------------------------------
            # Recompute Risk
            # -------------------------------
            risk = classify_risk(pred)

            if risk == "Low":
                continue  # do NOT include normal traffic

            # -------------------------------
            # Stable risk score (0-100)
            # -------------------------------
            try:
                risk_score = compute_risk_score(e)
            except:
                # fallback scoring
                risk_score = 90 if risk == "High" else 60

            # -------------------------------
            # Build alert payload
            # -------------------------------
            alerts.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "time": e.get("time"),
                "src_ip": e.get("src_ip"),
                "dst_ip": e.get("dst_ip"),
                "sport": e.get("sport", "—"),
                "dport": e.get("dport", "—"),
                "proto": e.get("proto", "-"),
                "prediction": pred,
                "risk_level": risk,
                "risk_score": risk_score,
            })

        # ------------------------------------------------
        # Sort newest first (based on event time)
        # ------------------------------------------------
        alerts = sorted(alerts, key=lambda x: x["time"], reverse=True)

        return jsonify({
            "count": len(alerts),
            "alerts": alerts[:150],  # limit for UI performance
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    except Exception as err:
        print("❌ Alerts API error:", err)
        return jsonify({"error": str(err)}), 500


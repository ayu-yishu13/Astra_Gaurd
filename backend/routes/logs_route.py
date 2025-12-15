from flask import Blueprint, send_file, jsonify, request
import os
from utils.logger import (
    BCC_LOG_FILE,
    CICIDS_LOG_FILE,
    LOG_FILE,
    get_recent_events,
    get_model_stats,
    clear_last_events,
    delete_by_prediction,
    delete_by_index,
    get_active_model
)

logs_bp = Blueprint("logs", __name__)


# -------------------------------
# DOWNLOAD CSV LOG FILE (global)
# -------------------------------
@logs_bp.route("/download", methods=["GET"])
def download_logs():
    model = request.args.get("model")

    # MODEL-SPECIFIC CSVs
    if model == "bcc":
        path = BCC_LOG_FILE
    elif model == "cicids":
        path = CICIDS_LOG_FILE
    else:
        # fallback — global CSV
        path = LOG_FILE

    if not os.path.exists(path):
        return jsonify({"error": "Log file not found"}), 404

    return send_file(
        path,
        as_attachment=True,
        download_name=f"{model}_logs.csv" if model else "traffic_logs.csv",
        mimetype="text/csv",
    )



# -------------------------------
# DOWNLOAD MODEL-SPECIFIC JSON
# -------------------------------
@logs_bp.route("/download/json", methods=["GET"])
def download_json_logs():
    try:
        model = request.args.get("model", get_active_model())
        events = get_recent_events(model)
        return jsonify({"model": model, "count": len(events), "events": events})
    except Exception as e:
        print("❌ JSON log fetch error:", e)
        return jsonify({"error": "Failed to fetch logs"}), 500


# -------------------------------
# CLEAR MODEL-WISE LAST N EVENTS
# -------------------------------
@logs_bp.route("/clear", methods=["POST"])
def clear_logs():
    try:
        model = request.args.get("model", get_active_model())
        n = int(request.args.get("n", 50))

        clear_last_events(model, n)

        print(f"🧹 Cleared last {n} events for model={model}")
        return jsonify({"status": "ok", "deleted": n, "model": model})
    except Exception as e:
        print("❌ Clear logs error:", e)
        return jsonify({"error": str(e)}), 500


# -------------------------------
# CLEAR MODEL-WISE BY PREDICTION
# -------------------------------
@logs_bp.route("/clear_pred", methods=["POST"])
def clear_pred():
    pred = request.args.get("pred")
    model = request.args.get("model", get_active_model())

    if not pred:
        return jsonify({"error": "Missing 'pred' parameter"}), 400

    try:
        delete_by_prediction(model, pred)
        print(f"🧹 Deleted all events for prediction={pred} in model={model}")
        return jsonify({"status": "ok", "deleted_pred": pred, "model": model})
    except Exception as e:
        print("❌ Clear prediction error:", e)
        return jsonify({"error": str(e)}), 500


# -------------------------------
# DELETE ONE ROW MODEL-WISE
# -------------------------------
@logs_bp.route("/delete_one", methods=["POST"])
def delete_one():
    try:
        model = request.args.get("model", get_active_model())
        idx = int(request.args.get("index", -1))

        ok = delete_by_index(model, idx)

        if ok:
            print(f"🗑️ Deleted row index={idx} from model={model}")
            return jsonify({"status": "ok", "index": idx, "model": model})
        else:
            return jsonify({"status": "invalid index", "index": idx}), 400
    except Exception as e:
        print("❌ Delete row error:", e)
        return jsonify({"error": str(e)}), 500


# -------------------------------
# MODEL-WISE LOG STATUS
# -------------------------------
@logs_bp.route("/status", methods=["GET"])
def log_status():
    try:
        model = request.args.get("model", get_active_model())
        counts = get_model_stats(model)
        total = sum(counts.values())

        return jsonify({
            "model": model,
            "total_events": total,
            "by_class": counts
        })
    except Exception as e:
        print("❌ Log status error:", e)
        return jsonify({"error": str(e)}), 500


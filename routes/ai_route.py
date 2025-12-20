# routes/ai_route.py
# --------------------------------------
from flask import Blueprint, request, jsonify
from utils.ai_engine import explain_threat, summarize_events
from utils.logger import get_recent_events, get_active_model

ai_bp = Blueprint("ai_bp", __name__)


@ai_bp.route("/explain", methods=["POST"])
def ai_explain():
    """
    Body: JSON event (one row from table)
    Returns: {"explanation": "..."}
    """
    data = request.get_json() or {}
    try:
        text = explain_threat(data)
        return jsonify({"ok": True, "explanation": text})
    except Exception as e:
        print("AI explain error:", e)
        return jsonify({"ok": False, "error": str(e)}), 500


@ai_bp.route("/summary", methods=["GET"])
def ai_summary():
    """
    Query: ?model=bcc&n=200
    Returns: {"ok": True, "summary": "..."}
    """
    model = request.args.get("model", get_active_model())
    n = int(request.args.get("n", 200))

    try:
        events = get_recent_events(model, n)
        text = summarize_events(events, model=model)
        return jsonify({"ok": True, "summary": text, "count": len(events), "model": model})
    except Exception as e:
        print("AI summary error:", e)
        return jsonify({"ok": False, "error": str(e)}), 500

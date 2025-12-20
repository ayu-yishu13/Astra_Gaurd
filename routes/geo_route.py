# ==========================================
# 🌍 GEO ROUTE — Adaptive AI NIDS
# ------------------------------------------
# ✅ /api/geo/resolve?ip=<ip>
# ✅ /api/geo/recent
# ==========================================

from flask import Blueprint, jsonify, request
from utils.geo_lookup import get_geo_info, enrich_event_with_geo
from utils.logger import get_recent_events

geo_bp = Blueprint("geo", __name__)

# 🔹 Resolve a single IP (for IPInfoModal)
@geo_bp.route("/resolve")
def resolve_ip():
    ip = request.args.get("ip")
    if not ip:
        return jsonify({"error": "Missing IP parameter"}), 400
    info = get_geo_info(ip)
    return jsonify(info), 200


# 🔹 Return recent events enriched with geo (for map)
@geo_bp.route("/recent")
def geo_recent():
    try:
        events = get_recent_events()
        geo_events = [enrich_event_with_geo(e) for e in events[-200:]]
        return jsonify(geo_events), 200
    except Exception as e:
        print("⚠️ Geo recent error:", e)
        return jsonify({"error": str(e)}), 500

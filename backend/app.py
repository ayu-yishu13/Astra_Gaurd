# =============================================================
# FILE: app.py
# Optimized Flask + SocketIO entry (threading mode, no debug)
# =============================================================
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import os  # <-- ADDED: For reading environment variables


# lightweight logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)
logging.getLogger('socketio').setLevel(logging.ERROR)


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# Use threading mode to avoid eventlet monkey-patch issues with Scapy/IO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


# Mail initialization is left as-is but keep credentials out of source in production
try:
    from extensions import mail
    app.config.update(
        MAIL_SERVER="smtp.gmail.com",
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        # --- SECURITY FIX: Fetch credentials from environment variables ---
        MAIL_USERNAME=os.environ.get("MAIL_USERNAME"), 
        MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD"),
        # -----------------------------------------------------------------
        MAIL_DEFAULT_SENDER=("Adaptive AI NIDS", os.environ.get("MAIL_USERNAME"))
    )
    mail.init_app(app)

except Exception:
# If mail is not available in dev/test, continue gracefully
    pass


# lazy import of sniffer so import side-effects are minimal
sniffer = None


def _get_sniffer():
    global sniffer
    if sniffer is None:
        from capture.live_manager import sniffer as _s
        sniffer = _s
    return sniffer


# Register blueprints lazily to avoid heavy imports at startup
def register_blueprints(app):
    from importlib import import_module


    routes = [
        ("routes.live_route", "live_bp", "/api/live"),
        ("routes.logs_route", "logs_bp", "/api/logs"),
        ("routes.predict_route", "predict_bp", "/api/predict"),
        ("routes.reports_route", "reports_bp", "/api/reports"),
        ("routes.ip_lookup_route", "ip_lookup_bp", "/api/ip"),
        ("routes.geo_route", "geo_bp", "/api/geo"),
        ("routes.alerts_route", "alerts_bp", "/api"),
        ("routes.system_info", "system_bp", "/api"),
        ("routes.ml_route", "ml_bp", "/api"),
        ("routes.traffic_routes", "traffic_bp", "/api"),
        ("routes.ml_switch_route","ml_switch","/api/model"),
        ("routes.manual_predict_route","manual_predict","/api"),
        ("routes.ai_route","ai_bp","/api/ai"),
        ("routes.chat_route","chat_bp","/api"),
        ("routes.offline_detection","offline_bp","/api/offline")
    ]

    for module_name, varname, prefix in routes:
        try:
            mod = import_module(module_name)
            bp = getattr(mod, varname)
            app.register_blueprint(bp, url_prefix=prefix)
            print(f"✅ Registered route: {module_name} -> {prefix}")

        except Exception as e:
            print(f"⚠️ Skipping {module_name}: {e}")

register_blueprints(app)


@app.route("/")
def home():
    s = _get_sniffer()
    return jsonify({
    "status": "✅ Backend Active",
    "capture_running": s.is_running() if s else False,
    "tip": "Use /api/live/start and /api/live/stop to control capture"
    })


# --- REMOVED: The local run block is removed. Gunicorn will handle startup on Render. ---
if __name__ == "__main__":
     print("🚀 Starting Adaptive AI NIDS Backend (threading mode)...")
#     # Run without debug — debug spawns extra processes and uses more CPU
     socketio.run(app, host="0.0.0.0", port=5000, debug=False)


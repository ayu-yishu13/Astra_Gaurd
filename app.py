import eventlet
eventlet.monkey_patch()

import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import os
import socket

# lightweight logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)
logging.getLogger('socketio').setLevel(logging.ERROR)

app = Flask(__name__)

# UPDATED: More robust CORS for deployment
CORS(app, resources={r"/api/*": {"origins": "*"}})

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Mail initialization
try:
    from extensions import mail
    app.config.update(
        MAIL_SERVER="smtp.gmail.com",
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.environ.get("MAIL_USERNAME"), 
        MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD"),
        MAIL_DEFAULT_SENDER=("Adaptive AI NIDS", os.environ.get("MAIL_USERNAME"))
    )
    mail.init_app(app)
except Exception:
    pass

sniffer = None

def _get_sniffer():
    global sniffer
    if sniffer is None:
        try:
            # CLOUD GUARD: Don't import sniffer if on a cloud server that blocks raw sockets
            # Render and Hugging Face usually set specific env variables
            if os.environ.get("RENDER") or os.environ.get("SPACE_ID"):
                print("⚠️ Cloud environment detected. Skipping sniffer initialization.")
                return None
            
            from capture.live_manager import sniffer as _s
            sniffer = _s
        except Exception as e:
            print(f"⚠️ Could not initialize sniffer: {e}")
            return None
    return sniffer

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
    # Detect environment for frontend awareness
    is_cloud = os.environ.get("RENDER") or os.environ.get("SPACE_ID")
    s = _get_sniffer()
    
    return jsonify({
        "status": "✅ Backend Active",
        "env": "cloud" if is_cloud else "local",
        "capture_capability": "limited" if is_cloud else "full",
        "capture_running": s.is_running() if s else False,
        "tip": "Live sniffing requires local deployment."
    })

if __name__ == "__main__":
    print("🚀 Starting Adaptive AI NIDS Backend...")
    # 7860 is the magic number for Hugging Face
    socketio.run(app, host="0.0.0.0", port=7860, debug=False)


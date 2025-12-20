# ==============================================================
# live_route.py — Flask routes for controlling live capture
# ==============================================================

from flask import Blueprint, jsonify, request
from capture.live_manager import sniffer
import numpy as np
import math


live_bp = Blueprint("live_bp", __name__)

@live_bp.route("/start")
def start_live():
    iface = request.args.get("iface")
    sniffer.start(iface=iface)
    return jsonify({"status": "started", "running": sniffer.is_running()})

@live_bp.route("/stop")
def stop_live():
    sniffer.stop()
    return jsonify({"status": "stopped", "running": sniffer.is_running()})

@live_bp.route("/status")
def status():
    return jsonify({"running": sniffer.is_running()})

@live_bp.route("/recent")
def recent():
    events = sniffer.recent()

    safe_events = []
    for e in events:
        safe = {}
        for k, v in e.items():
            
            # convert numpy ints/floats to python native
            if isinstance(v, (np.generic,)):
                v = v.item()

            # replace None / NaN with string
            if v is None or (isinstance(v, float) and math.isnan(v)):
                v = "Unknown"

            safe[str(k)] = v

        safe_events.append(safe)

    return jsonify({"events": safe_events}), 200

@live_bp.route("/stats")
def stats():
    return jsonify(sniffer.stats())

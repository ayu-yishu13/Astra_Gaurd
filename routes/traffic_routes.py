# traffic_routes.py
from flask import Blueprint, jsonify
from utils.logger import get_recent_events, summarize_counts
from flow_builder import build_flows

traffic_bp = Blueprint("traffic_bp", __name__)

@traffic_bp.route("traffic/flows")
def flows():
    """Return aggregated flows from recent network events."""
    events = get_recent_events(2000)
    flows = build_flows(events)
    return jsonify({"flows": flows})


@traffic_bp.route("traffic/protocols")
def protocols():
    """Return protocol distribution."""
    events = get_recent_events(2000)
    counts = {"TCP": 0, "UDP": 0, "Other": 0}

    for e in events:
        proto = e.get("proto", "").upper()
        if proto == "TCP":
            counts["TCP"] += 1
        elif proto == "UDP":
            counts["UDP"] += 1
        else:
            counts["Other"] += 1

    return jsonify(counts)


@traffic_bp.route("traffic/bandwidth")
def bandwidth():
    """
    Returns packet count per second for the last ~30 records.
    Used for bandwidth line chart.
    """
    events = get_recent_events(200)
    timeline = {}

    for e in events:
        t = e.get("time")
        timeline[t] = timeline.get(t, 0) + 1

    graph = [{"time": k, "value": v} for k, v in timeline.items()]

    return jsonify(graph)

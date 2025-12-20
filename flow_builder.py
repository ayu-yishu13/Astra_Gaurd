# flow_builder.py
from collections import defaultdict

def build_flows(events):
    flows = defaultdict(lambda: {
        "src_ip": "",
        "dst_ip": "",
        "sport": "",
        "dport": "",
        "proto": "",
        "packets": 0,
        "bytes": 0,
        "first_seen": "",
        "last_seen": "",
    })

    for e in events:
        key = (e["src_ip"], e["dst_ip"], e["sport"], e["dport"], e["proto"])
        f = flows[key]

        f["src_ip"] = e["src_ip"]
        f["dst_ip"] = e["dst_ip"]
        f["sport"] = e["sport"]
        f["dport"] = e["dport"]
        f["proto"] = e["proto"]

        f["packets"] += 1
        f["bytes"] += 1500   # approximation (or use real payload length if available)

        # Update timestamps
        if not f["first_seen"]:
            f["first_seen"] = e.get("time")
        f["last_seen"] = e.get("time")

    return list(flows.values())

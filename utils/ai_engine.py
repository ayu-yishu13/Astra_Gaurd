# utils/ai_engine.py
# -----------------------------------------
# Lightweight "AI" engine using rules + templates
# No heavy ML model – safe for your laptop 🙂

from collections import Counter
from datetime import datetime


def _normalize_label(label: str) -> str:
    return str(label or "Unknown").strip().upper()


# 1️⃣ Explain a single threat/event
def explain_threat(event: dict) -> str:
    """
    Takes a single event dict (from logger / recent())
    and returns a human-readable explanation.
    """

    label = _normalize_label(event.get("prediction"))
    risk_level = str(event.get("risk_level", "Low")).title()
    src_ip = event.get("src_ip") or event.get("src") or "Unknown source"
    dst_ip = event.get("dst_ip") or event.get("dst") or "Unknown destination"
    proto = event.get("proto", "Unknown")
    sport = event.get("sport") or event.get("src_port") or "?"
    dport = event.get("dport") or event.get("dst_port") or "?"

    # Simple knowledge base
    explanations = {
        "VPN": (
            "Traffic from {src} to {dst} over {proto} looks like VPN usage. "
            "VPN tunnels encrypt traffic and can hide the real origin of an attacker. "
            "Review if this VPN endpoint is expected for this host."
        ),
        "TOR": (
            "Traffic appears to be routed through the Tor anonymity network. "
            "Tor is commonly used to hide attacker identity. "
            "Investigate the host at {src} and check if Tor usage is allowed."
        ),
        "I2P": (
            "Detected I2P (Invisible Internet Project) style traffic. "
            "I2P is an anonymity network similar to Tor and can be abused for C2 channels."
        ),
        "FREENET": (
            "Traffic resembles Freenet P2P anonymity network. "
            "Such networks can be used to exchange illegal or malicious content."
        ),
        "ZERONET": (
            "ZeroNet-like traffic detected. ZeroNet hosts sites over a P2P network. "
            "This may bypass normal web filtering and logging."
        ),
        # CICIDS-style examples – extend as you like
        "DOS HULK": (
            "High-rate HTTP traffic typical of DoS-Hulk attack was detected. "
            "This can exhaust web server resources and cause service disruption."
        ),
        "DOS SLOWLORIS": (
            "Slowloris-style DoS traffic detected. It keeps many HTTP connections open "
            "to slowly exhaust server connection limits."
        ),
        "BOT": (
            "Behavior suggests the host may be part of a botnet. "
            "Correlate with outbound connections and run malware scans on {src}."
        ),
        "BENIGN": (
            "This flow is classified as BENIGN. No immediate malicious pattern detected, "
            "but you should still monitor for anomalies over time."
        ),
    }

    # Pick best match (exact or substring)
    text = None
    if label in explanations:
        text = explanations[label]
    else:
        for k, v in explanations.items():
            if k in label:
                text = v
                break

    if text is None:
        text = (
            "The traffic is classified as '{label}' with a risk level of {risk}. "
            "Review source {src} → destination {dst}, protocol {proto}, "
            "and ports {sport} → {dport} for suspicious patterns."
        )

    return text.format(
        label=label,
        risk=risk_level,
        src=src_ip,
        dst=dst_ip,
        proto=proto,
        sport=sport,
        dport=dport,
    )


# 2️⃣ Summarize multiple events (for report)
def summarize_events(events, model: str = "bcc") -> str:
    """
    Takes a list of events and returns a high-level English summary.
    """

    if not events:
        return "No recent events available for summary."

    labels = [_normalize_label(e.get("prediction")) for e in events]
    counts = Counter(labels)
    total = len(events)

    high_risk_keywords = [
        "DDOS", "DOS", "BRUTE", "SQL", "BOT", "INFILTRATION", "HULK",
        "SLOWLORIS", "SLOWHTTPTEST"
    ]
    high_risk = sum(
        c for lbl, c in counts.items()
        if any(k in lbl for k in high_risk_keywords)
    )

    tor_like = sum(
        counts.get(lbl, 0) for lbl in ["TOR", "I2P", "ZERONET", "FREENET", "VPN"]
    )

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Build readable summary
    parts = [
        f"AI Summary generated at {ts} for model '{model.upper()}'.",
        f"Total analysed events: {total}.",
    ]

    if high_risk:
        parts.append(
            f"High-risk attacks detected: {high_risk} events "
            f"({', '.join(k for k in counts.keys() if any(x in k for x in high_risk_keywords))})."
        )
    else:
        parts.append("No high-risk attack pattern strongly detected in this window.")

    if tor_like:
        parts.append(
            f"Anonymity or tunneling traffic (VPN/TOR/I2P/etc.) observed in {tor_like} events. "
            "Verify if this usage is expected and authorized."
        )

    # top 3 labels
    top3 = counts.most_common(3)
    label_str = ", ".join(f"{lbl}: {cnt}" for lbl, cnt in top3)
    parts.append(f"Top traffic classes: {label_str}.")

    if model == "bcc":
        parts.append(
            "BCC model focuses on live packet patterns; consider correlating with host logs "
            "for deeper forensic analysis."
        )
    else:
        parts.append(
            "CICIDS model analyses flow-level statistics; consider exporting flows for "
            "offline investigation if anomalies increase."
        )

    return " ".join(parts)

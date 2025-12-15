# risk_engine.py (Optimized)
# - Accepts optional `recent_events` to avoid repeated disk/IO calls
# - Uses light-weight counters and caching for frequency checks
# - Returns (level, score) as before

import random
import time
from utils.logger import get_recent_events

# small in-memory cache for source counts to avoid repeated scans
_SRC_CACHE = {
    "ts": 0,
    "counts": {},
    "ttl": 2.0  # seconds
}


def _build_source_cache(recent_events):
    counts = {}
    for e in recent_events:
        s = e.get("src_ip")
        if s:
            counts[s] = counts.get(s, 0) + 1
    return counts


def compute_risk_score(evt, recent_events=None):
    """Compute adaptive risk score (0–100).

    If `recent_events` is provided, it is used directly. Otherwise `get_recent_events()`
    is called once (limited inside the function).
    """
    label = (evt.get("prediction") or "").upper()
    src_ip = evt.get("src_ip") or ""

    base_map = {
        "TOR": 90,
        "I2P": 85,
        "ZERONET": 70,
        "VPN": 55,
        "FREENET": 60,
        "HTTP": 30,
        "DNS": 25,
    }
    base = base_map.get(label, 35)

    # get recent events once if not provided
    if recent_events is None:
        recent_events = get_recent_events()

    # try cached counts for short TTL
    now = time.time()
    if now - _SRC_CACHE.get("ts", 0) > _SRC_CACHE.get("ttl", 2.0) or not _SRC_CACHE.get("counts"):
        _SRC_CACHE["counts"] = _build_source_cache(recent_events)
        _SRC_CACHE["ts"] = now

    freq = _SRC_CACHE["counts"].get(src_ip, 0)

    freq_boost = 0
    if freq >= 3:
        freq_boost = 5
    if freq >= 6:
        freq_boost = 15

    noise = random.randint(-3, 3)

    score = min(100, max(0, base + freq_boost + noise))

    if score >= 80:
        level = "High"
    elif score >= 50:
        level = "Medium"
    else:
        level = "Low"

    return level, score


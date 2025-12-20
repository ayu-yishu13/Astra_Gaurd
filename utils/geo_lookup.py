# utils/geo_lookup.py
# ==========================================
# 🌍 GEO LOOKUP UTILITY — Robust version
# - Uses ipwho.is
# - Validates inputs
# - Caches results
# - Graceful fallback for bad/ private IPs
# ==========================================

import requests
from functools import lru_cache
import re
import time

# Public API (no API key)
GEO_API = "https://ipwho.is/{ip}"

# Regex for private/reserved IPv4 blocks + simple IPv4/IPv6 check
_IPV4_RE = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")
_IPV6_RE = re.compile(r"^[0-9a-fA-F:]+$")

PRIVATE_IP_RANGES = [
    re.compile(r"^127\."),               # localhost
    re.compile(r"^10\."),                # private
    re.compile(r"^192\.168\."),          # private
    re.compile(r"^172\.(1[6-9]|2[0-9]|3[0-1])\."),  # private block
    re.compile(r"^0\."),                 # invalid
    re.compile(r"^255\."),               # broadcast/reserved
]

# Cache size tuned to common usage (increase if you have many distinct IPs)
@lru_cache(maxsize=2000)
def get_geo_info(ip: str) -> dict:
    """Return geolocation info for an IP address (string-safe, cached, fallback)."""
    # Normalize
    try:
        ip_raw = ip
        if ip is None:
            return _default_geo(ip, "Empty IP")
        ip = str(ip).strip()
    except Exception:
        return _default_geo(ip, "Invalid IP")

    # Quick checks
    if ip == "" or ip.lower() in ("unknown", "n/a", "na", "local", "localhost"):
        return _default_geo(ip, "Unknown")

    # If it's clearly not an IPv4/IPv6 string, avoid calling external API
    if not (_IPV4_RE.match(ip) or _IPV6_RE.match(ip)):
        return _default_geo(ip, "Not an IP")

    # Private/reserved check
    if any(r.match(ip) for r in PRIVATE_IP_RANGES):
        return {
            "ip": ip,
            "country": "Local",
            "city": "Private Network",
            "lat": 0.0,
            "lon": 0.0,
        }

    # Query remote API (with timeout + basic retry)
    try:
        # simple single attempt with timeout; if you need reliability add a tiny backoff/retry
        res = requests.get(GEO_API.format(ip=ip), timeout=4)
        if res.status_code == 200:
            data = res.json()
            # ipwho.is returns {"success": false, "message": "..."} for invalid
            if data.get("success", True) is False:
                return _default_geo(ip, data.get("message", "Invalid IP"))
            return {
                "ip": ip,
                "country": data.get("country", "Unknown"),
                "city": data.get("city", "Unknown"),
                "lat": float(data.get("latitude") or 0.0),
                "lon": float(data.get("longitude") or 0.0),
            }
        # non-200 -> fallback
        print(f"⚠️ Geo lookup failed for {ip} (status {res.status_code})")
    except Exception as e:
        # network errors, DNS issues, etc.
        print(f"⚠️ Geo lookup error for {ip}: {e}")

    return _default_geo(ip, "Unknown")


def _default_geo(ip: str, reason="Unknown"):
    """Return default location info when lookup fails."""
    return {
        "ip": ip,
        "country": reason,
        "city": "Unknown",
        "lat": 0.0,
        "lon": 0.0,
    }


def enrich_event_with_geo(evt: dict) -> dict:
    """
    Given an event dict that contains 'src_ip' and 'dst_ip' (or similar keys),
    attach src/dst city, country, lat, lon fields.
    This function is safe to call synchronously, but consider async enrichment
    when running on a hot packet-processing loop (see optional snippet below).
    """
    try:
        # Accept multiple possible keys (compatibility)
        src_ip = evt.get("src_ip") or evt.get("src") or evt.get("srcIP") or ""
        dst_ip = evt.get("dst_ip") or evt.get("dst") or evt.get("dstIP") or ""

        # Normalize to string before calling get_geo_info
        src_ip = str(src_ip).strip() if src_ip is not None else ""
        dst_ip = str(dst_ip).strip() if dst_ip is not None else ""

        # Get geo info (cached)
        src_info = get_geo_info(src_ip)
        dst_info = get_geo_info(dst_ip)

        evt.update({
            "src_country": src_info["country"],
            "dst_country": dst_info["country"],
            "src_city": src_info["city"],
            "dst_city": dst_info["city"],
            "src_lat": src_info["lat"],
            "src_lon": src_info["lon"],
            "dst_lat": dst_info["lat"],
            "dst_lon": dst_info["lon"],
        })
    except Exception as e:
        # Keep it quiet but informative
        print(f"⚠️ Geo enrichment failed for event: {e}")

    return evt


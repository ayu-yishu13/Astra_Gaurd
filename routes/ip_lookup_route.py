import requests
import ipaddress
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime

ip_lookup_bp = Blueprint("ip_lookup", __name__)

# 🔹 Cache lookups to reduce API load
_ip_cache = {}

# ======================================
# 🚨 RISK CLASSIFIER
# ======================================
def _guess_risk(org_name: str):
    org = (org_name or "").lower()
    if any(k in org for k in ["tor", "anonym", "i2p"]):
        return {"level": "High", "score": 95, "reason": "Anonymizing service (TOR/I2P detected)"}
    if any(k in org for k in ["vpn", "proxy", "tunnel"]):
        return {"level": "Medium", "score": 80, "reason": "VPN or proxy-based routing"}
    if any(k in org for k in ["aws", "gcp", "digitalocean", "azure", "oracle"]):
        return {"level": "Medium", "score": 70, "reason": "Cloud-hosted server (possible C2 or proxy)"}
    return {"level": "Low", "score": 40, "reason": "Likely clean residential or enterprise IP"}


# ======================================
# ⚙️ IP DATA NORMALIZATION
# ======================================
def _normalize_data(ip, d: dict, api_source: str):
    """Unify structure across ipapi.co and ipwho.is"""
    if not d:
        return {"error": "No data"}

    try:
        if api_source == "ipapi":
            org = d.get("org", "")
            return {
                "ip": ip,
                "city": d.get("city"),
                "region": d.get("region"),
                "country_name": d.get("country_name"),
                "continent_code": d.get("continent_code"),
                "org": org,
                "asn": d.get("asn"),
                "version": d.get("version", "IPv4"),
                "latitude": float(d.get("latitude", 0)),
                "longitude": float(d.get("longitude", 0)),
                "timezone": d.get("timezone"),
                "risk": _guess_risk(org),
                "flag": f"https://flagsapi.com/{d.get('country_code','US')}/flat/32.png"
            }
        elif api_source == "ipwhois":
            org = d.get("connection", {}).get("isp", "")
            return {
                "ip": ip,
                "city": d.get("city"),
                "region": d.get("region"),
                "country_name": d.get("country"),
                "continent_code": d.get("continent"),
                "org": org,
                "asn": d.get("connection", {}).get("asn"),
                "version": d.get("type", "IPv4"),
                "latitude": float(d.get("latitude", 0)),
                "longitude": float(d.get("longitude", 0)),
                "timezone": d.get("timezone"),
                "risk": _guess_risk(org),
                "flag": f"https://flagsapi.com/{d.get('country_code','US')}/flat/32.png"
            }
    except Exception:
        pass

    return {"error": "Normalization failed"}


# ======================================
# 🔍 LOOKUP (PRIVATE or PUBLIC)
# ======================================
def lookup_ip_data(ip: str):
    """Internal helper for backend components (non-JSON)."""
    try:
        if not ip:
            return {"error": "Empty IP"}

        # Check cache first
        if ip in _ip_cache:
            return _ip_cache[ip]

        # Handle local/private IPs
        if ipaddress.ip_address(ip).is_private:
            info = {
                "ip": ip,
                "city": "Bengaluru",
                "region": "Private Range",
                "country_name": "India",
                "org": "Local Device",
                "asn": "LAN",
                "version": "IPv4",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "risk": {"level": "Low", "score": 20, "reason": "Private/local IP"},
                "flag": "https://flagsapi.com/IN/flat/32.png"
            }
            _ip_cache[ip] = info
            return info

        # === Try ipapi.co ===
        try:
            r = requests.get(f"https://ipapi.co/{ip}/json/", timeout=4)
            if r.ok:
                d = r.json()
                if not d.get("error"):
                    info = _normalize_data(ip, d, "ipapi")
                    _ip_cache[ip] = info
                    return info
        except Exception:
            pass

        # === Fallback: ipwho.is ===
        try:
            r = requests.get(f"https://ipwho.is/{ip}", timeout=4)
            d = r.json()
            if d.get("success"):
                info = _normalize_data(ip, d, "ipwhois")
                _ip_cache[ip] = info
                return info
        except Exception:
            pass

    except Exception as e:
        return {"error": str(e)}

    return {"error": "Could not fetch IP info"}


# ======================================
# 🌍 EXTERNAL API ENDPOINT
# ======================================
@ip_lookup_bp.route("/lookup/<ip>", methods=["GET"])
@cross_origin()
def lookup_ip(ip):
    """Public API: Look up an IP's geolocation + threat risk."""
    data = lookup_ip_data(ip)
    if "error" in data:
        return jsonify(data), 404

    data["lookup_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return jsonify(data)


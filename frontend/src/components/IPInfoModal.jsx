import React, { useEffect, useState } from "react";

export default function IPInfoModal({ ip, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState({
    level: "Unknown",
    score: 0,
    reason: "Unverified",
  });

  useEffect(() => {
    if (!ip) return;

    // Reset state for new IP
    setInfo(null);
    setRisk({ level: "Unknown", score: 0, reason: "Unverified" });
    setLoading(true);

    // ✅ Private / Local IP detection
    const privateRanges = [
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^239\./, // multicast
    ];

    if (privateRanges.some((r) => r.test(ip))) {
      setInfo({
        city: "Local Network",
        region: "Private or Multicast Range",
        country_name: "N/A",
        org: "Local Device",
        asn: "LAN",
        version: "IPv4",
        latitude: "-",
        longitude: "-",
      });
      setRisk({
        level: "Low",
        score: 5,
        reason: "Private / local or multicast IP",
      });
      setLoading(false);
      return;
    }

    // ✅ Backend lookup (new route)
fetch(`http://127.0.0.1:5000/api/geo/resolve?ip=${ip}`)
  .then(async (res) => {
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Lookup failed");
    }
    return res.json();
  })
  .then((data) => {
    setInfo(data);
    setRisk({
      level:
        data.country === "Local"
          ? "Low"
          : data.country === "Unknown"
          ? "Medium"
          : "Low",
      score: data.country === "Unknown" ? 40 : 15,
      reason: `Detected in ${data.country || "Unknown"}`,
    });
  })
  .catch((err) => {
    console.warn("⚠️ Geo lookup failed:", err.message);
    setInfo({
      city: "Unknown",
      country_name: "Unknown",
      org: "No data",
      latitude: "-",
      longitude: "-",
    });
    setRisk({
      level: "Low",
      score: 10,
      reason: "No threat detected / lookup failed",
    });
  })
  .finally(() => setLoading(false));
  }, [ip]);

  if (!ip) return null;

  // ✅ Helper for dynamic color
  const riskColor =
    risk.level === "High"
      ? "text-red-400"
      : risk.level === "Medium"
      ? "text-yellow-400"
      : "text-green-400";

  const riskBarColor =
    risk.level === "High"
      ? "bg-red-500"
      : risk.level === "Medium"
      ? "bg-yellow-400"
      : "bg-green-400";

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-cyber-panel/90 border border-cyan-400/30 rounded-xl p-5 w-96 text-slate-200 shadow-lg relative">
        <h2 className="text-lg font-semibold text-cyan-400 mb-3">
          🌐 IP Info — {ip}
        </h2>

        {loading ? (
          <p className="text-slate-400 text-sm animate-pulse">
            Fetching IP intelligence...
          </p>
        ) : info ? (
          <div className="space-y-2 text-sm">
            <p>
              <b>City:</b> {info.city || "Unknown"}
            </p>
            <p>
              <b>Region:</b> {info.region || "Unknown"}
            </p>
            <p>
              <b>Country:</b> {info.country_name || "Unknown"}
            </p>
            <p>
              <b>ISP:</b> {info.org || "Unknown"}
            </p>
            <p>
              <b>ASN:</b> {info.asn || "N/A"}
            </p>
            <p>
              <b>IP Type:</b> {info.version}
            </p>
            <p>
              <b>Coordinates:</b> {info.latitude}, {info.longitude}
            </p>
          </div>
        ) : (
          <p className="text-red-400 text-sm">
            Could not fetch IP intelligence data.
          </p>
        )}

        {/* Risk / Threat assessment */}
        {!loading && (
          <div className="mt-4 border-t border-cyan-400/10 pt-3">
            <h4 className="text-sm text-slate-300 mb-1">Threat Assessment</h4>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${riskColor}`}>
                {risk.level} Risk ({risk.score}%)
              </span>
              <span className="text-xs text-slate-400 max-w-[180px] text-right">
                {risk.reason}
              </span>
            </div>

            {/* Risk Progress Bar */}
            <div className="w-full bg-slate-700/40 rounded-full mt-2 h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${riskBarColor}`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-5 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg border border-cyan-400/30 w-full text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}



import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  RefreshCcw,
  FileDown,
  Ban,
  Eye,
  Search,
  Activity,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ChatAssistant from "./ChatAssistant";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import GaugeChart from "react-gauge-chart";

const riskColor = {
  High: "#ff0059",
  Medium: "#fbbf24",
  Low: "#00e5ff",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // ----------------------------------------------------------
  // FETCH ALERTS
  // ----------------------------------------------------------
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:5000/api/alerts");
      const data = await res.json();

      if (data?.alerts) {

        // Fix risk_score for any weird format
        setAlerts(
          data.alerts.map((a) => ({
            ...a,
           risk_score: (() => {
  let s = a.risk_score;

  // Case 1: Array like ["High", 93]
  if (Array.isArray(s)) {
    const last = s[s.length - 1]; // numeric value is always last
    return Number(last) || 0;
  }

  // Case 2: String like "['High', 93]"
  if (typeof s === "string") {
    const nums = s.match(/\d+/g); // extract all numbers
    if (nums && nums.length > 0) {
      return Number(nums[nums.length - 1]); // last numeric value
    }
    return 0;
  }

  // Case 3: Already numeric
  return Number(s) || 0;
})(),

          }))
        );
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 6000);
    return () => clearInterval(t);
  }, []);

  // ----------------------------------------------------------
  // FILTERING
  // ----------------------------------------------------------
  const filtered = alerts.filter((a) => {
    const matchesFilter = filter === "All" || a.risk_level === filter;
    const term = search.toLowerCase();

    const matchesSearch =
      a.src_ip?.toLowerCase().includes(term) ||
      a.dst_ip?.toLowerCase().includes(term) ||
      a.prediction?.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  // ----------------------------------------------------------
  // AVERAGE RISK FOR GAUGE
  // ----------------------------------------------------------
  const avgRisk = (() => {
    const scores = filtered
      .map((a) => Number(a.risk_score))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 100);

    if (scores.length === 0) return 0;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  })();

  // ----------------------------------------------------------
  // TREND CHART DATA
  // ----------------------------------------------------------
  const chartData = Object.entries(
    filtered.reduce((acc, a) => {
      const t = a.time || "00:00:00"; // KEEPING a.time per your request
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {})
  ).map(([time, count]) => ({ time, count }));

  // ----------------------------------------------------------
  // EXPORT CSV
  // ----------------------------------------------------------
  const exportCSV = () => {
    const csv = [
      ["Time", "Source IP", "Destination IP", "Prediction", "Risk", "Score"],
      ...filtered.map((a) => [
        a.time,
        a.src_ip,
        a.dst_ip,
        a.prediction,
        a.risk_level,
        a.risk_score,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `alerts_${Date.now()}.csv`;
    a.click();
  };

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="p-6 relative">
      <Toaster position="bottom-right" />

      <h2 className="py-4 text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 text-transparent bg-clip-text neon-text">
            Alert Security
          </h2>

      {/* HEADER */}
      <div className=" PY-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
          <ShieldAlert size={20} /> AI Security Alerts
        </h2>

        <div className="flex flex-wrap gap-2">
          {["All", "High", "Medium", "Low"].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                filter === r
                  ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
                  : "bg-black/40 border border-[var(--accent)]/10 text-slate-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-black/30 border border-[var(--accent)]/20 rounded-lg px-3 py-1.5">
            <Search size={14} className="text-[var(--accent)] mr-2" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-[var(--accent)] outline-none"
            />
          </div>

          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="px-3 py-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] text-sm flex items-center gap-1"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-emerald-600/10 border border-emerald-400/20 rounded-lg text-emerald-300 text-sm flex items-center gap-1"
          >
            <FileDown size={14} /> Export
          </button>
        </div>
      </div>

      {/* WIDGETS */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* GAUGE */}
        <div className="bg-black/40 border border-[var(--accent)]/20 rounded-xl p-3 flex flex-col items-center">
          <h3 className="text-[var(--accent)] text-sm mb-2">Threat Level</h3>

          <GaugeChart
            id="risk-meter"
            nrOfLevels={3}
            colors={["#00e5ff", "#fbbf24", "#ff0059"]}
            percent={Math.min(Math.max((avgRisk || 0) / 100, 0), 1)}
            arcsLength={[0.5, 0.3, 0.2]}
            arcPadding={0.01}
            arcWidth={0.3}
            needleColor="white"
            cornerRadius={3}
            textColor="var(--accent)"
            style={{ width: "330px", height: "190px" }}
          />

          <p className="text-xs text-slate-400 mt-1">
            Avg Risk Score:{" "}
            <span className="text-[var(--accent)]">{avgRisk}%</span>
          </p>
        </div>

        {/* ALERTS OVER TIME */}
        <div className="bg-black/40 border border-[var(--accent)]/20 rounded-xl p-3">
          <h3 className="text-[var(--accent)] text-sm mb-2 flex items-center gap-1">
            <Activity size={14} /> Alerts Over Time
          </h3>

          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#001122",
                  border: "1px solid var(--accent)",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* QUICK COUNTS */}
        <div className="bg-gradient-to-br from-black/60 to-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl p-6 grid grid-cols-3 text-center">
          <div>
            <p className="text-sm text-slate-400">High</p>
            <p className="text-3xl text-[var(--accent)] font-bold">
              {filtered.filter((a) => a.risk_level === "High").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Medium</p>
            <p className="text-3xl text-[var(--accent)]/80 font-bold">
              {filtered.filter((a) => a.risk_level === "Medium").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Low</p>
            <p className="text-3xl text-[var(--accent)]/60 font-bold">
              {filtered.filter((a) => a.risk_level === "Low").length}
            </p>
          </div>
        </div>
      </div>

      {/* ALERT TABLE */}
      <div className="bg-black/50 border border-[var(--accent)]/20 rounded-xl max-h-[55vh] overflow-y-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="sticky top-0 bg-black/80 text-xs uppercase text-[var(--accent)] border-b border-[var(--accent)]/20">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Source IP</th>
              <th className="px-4 py-3">Destination IP</th>
              <th className="px-4 py-3">Prediction</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-slate-500"
                >
                  {loading ? "Fetching alerts..." : "No alerts yet."}
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--accent)]/10 hover:bg-[var(--accent)]/5 transition"
                >
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">
                    {a.time}
                  </td>

                  <td className="px-4 py-2 font-mono text-[var(--accent)]">
                    {a.src_ip}
                  </td>

                  <td className="px-4 py-2 font-mono text-[var(--accent)]">
                    {a.dst_ip}
                  </td>

                  <td className="px-4 py-2">{a.prediction}</td>

                  <td className="px-4 py-2">
                    <span
                      className="px-2 py-1 rounded-lg border text-xs font-semibold"
                      style={{
                        color: riskColor[a.risk_level],
                        borderColor: `${riskColor[a.risk_level]}55`,
                      }}
                    >
                      {a.risk_level} ({a.risk_score}%)
                    </span>
                  </td>

                  <td className="px-4 py-2 text-right flex justify-end gap-3">
                    <button
                      onClick={() =>
                        toast(`⛔ Blocking IP: ${a.src_ip}`, {
                          icon: "🧱",
                          style: { background: "#220000", color: "#ff6666" },
                        })
                      }
                      className="text-[var(--accent)] hover:text-[var(--accent)]/80"
                    >
                      <Ban size={14} />
                    </button>

                    <button
                      onClick={() =>
                        toast(`📄 Exporting Report: ${a.prediction}`, {
                          icon: "📘",
                          style: {
                            background: "#001122",
                            color: "var(--accent)",
                          },
                        })
                      }
                      className="text-[var(--accent)] hover:text-[var(--accent)]/80"
                    >
                      <FileDown size={14} />
                    </button>

                    <button
                      onClick={() =>
                        window.open(`/flow?type=${a.prediction}`, "_blank")
                      }
                      className="text-emerald-300 hover:text-emerald-200"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ChatAssistant />
    </div>
  );
}




/* Add to index.css:
@keyframes pulse-slow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}
*/


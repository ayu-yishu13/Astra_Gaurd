import React, { useEffect, useState } from "react";
import {
  FileText,
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCcw,
  BarChart3,
  Mail,
  Send,
  PieChart,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ChatAssistant from "./ChatAssistant";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Pie,
  PieChart as PieChartComp,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [attackTrend, setAttackTrend] = useState([]);
  const [reportDistribution, setReportDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const COLORS = ["#00e5ff", "#00ff99", "#fbbf24", "#ff0059"];

  // 🧠 Fetch available reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:5000/api/reports/list");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      toast.error("Failed to load reports");
      console.error("Report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Fetch chart data
// 📊 Fetch chart data
  const fetchCharts = async () => {
    try {
      const trendRes = await fetch("http://127.0.0.1:5000/api/reports/trend");
      const trendData = await trendRes.json();
      setAttackTrend(trendData);

      const distRes = await fetch("http://127.0.0.1:5000/api/reports/distribution");
      const distData = await distRes.json();
      // ✅ Convert object → array for PieChart
      const distArray = Object.entries(distData).map(([name, value]) => ({ name, value }));
      setReportDistribution(distArray);
  } catch (err) {
    console.error("Chart fetch error:", err);
  }
};


  useEffect(() => {
    fetchReports();
    fetchCharts();
  }, []);

  // 📥 Download report
  const handleDownload = (r) => {
    if (!r.endpoint) {
      toast.error("No download link found");
      return;
    }
    window.open(r.endpoint, "_blank");
    toast.success(`Downloading ${r.name}`);
  };

  // 🗑 Delete report (frontend only)
  const handleDelete = (id) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast("🗑️ Report deleted successfully", {
      style: { background: "#001122", color: "var(--accent)" },
    });
  };

  // 📧 Send summary email
  const handleSendEmail = async () => {
    if (!email.trim()) return toast.error("Enter a valid email!");
    setSending(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) toast.success(result.message || `Email sent to ${email}`);
      else toast.error(result.error || "Failed to send email");
    } catch (err) {
      toast.error("Error sending email");
      console.error("Email send error:", err);
    } finally {
      setSending(false);
    }
  };

  // Filtered list
  const filteredReports =
    filter === "All" ? reports : reports.filter((r) => r.type === filter);

  return (
    <div className="p-6 space-y-8 relative">
      <Toaster position="bottom-right" />
      {/* 🌫️ Subtle Glow Background */}
      <div
        className="absolute inset-0 animate-pulse-slow pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in srgb, var(--accent) 25%, transparent) 8%, transparent 75%)",
          opacity: 0.25,
        }}
      ></div>

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-[var(--accent)] flex items-center gap-2">
          <FileText size={22} /> Intelligence Reports Center
        </h2>
        <button
          onClick={() => {
            fetchReports();
            fetchCharts();
            toast("🔁 Refreshed reports & charts", {
              icon: "⚙️",
              style: { background: "#001122", color: "var(--accent)" },
            });
          }}
          className="flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/20 transition"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* FILTER + EMAIL SECTION */}
      <div className="flex flex-wrap items-center justify-between bg-black/40 border border-[var(--accent)]/20 rounded-xl p-4 gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Filter size={14} className="text-[var(--accent)]" />
          <span>Filter Reports:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/30 border border-[var(--accent)]/20 rounded px-2 py-1 text-[var(--accent)]"
          >
            <option>All</option>
            <option>System Health</option>
            <option>Threat Intelligence</option>
            <option>Network Analysis</option>
            <option>Access Logs</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Send summary to email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black/30 border border-[var(--accent)]/20 rounded px-3 py-1 text-[var(--accent)] placeholder-slate-500"
          />
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/20 transition"
          >
            {sending ? <Mail size={14} className="animate-pulse" /> : <Send size={14} />}
            {sending ? "Sending..." : "Email Reports"}
          </button>
        </div>
      </div>

      {/* REPORTS TABLE */}
      <div className="bg-black/40 border border-[var(--accent)]/20 rounded-xl p-4">
        <h3 className="text-[var(--accent)] text-sm mb-3 flex items-center gap-2">
          <BarChart3 size={14} /> Generated Reports
        </h3>
        {loading ? (
          <p className="text-center text-[var(--accent)] py-10 animate-pulse">
            ⚙️ Loading reports...
          </p>
        ) : filteredReports.length === 0 ? (
          <p className="text-center text-slate-500 py-10">
            No reports available for this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase text-[var(--accent)] border-b border-[var(--accent)]/20">
                <tr>
                  <th className="px-3 py-2">Report Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--accent)]/10 hover:bg-[var(--accent)]/5 transition"
                  >
                    <td className="px-3 py-2 text-[var(--accent)] font-mono truncate">
                      {r.name}
                    </td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.size}</td>
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleDownload(r)}
                        className="text-emerald-400 hover:text-emerald-300"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => toast.info(`Preview not available for ${r.name}`)}
                        className="text-cyan-400 hover:text-cyan-300"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-rose-400 hover:text-rose-300"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Threat Trend */}
        <div className="bg-black/40 border border-[var(--accent)]/20 rounded-xl p-5">
          <h3 className="text-[var(--accent)] text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Attack Trend Overview
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={attackTrend}>
              <XAxis dataKey="date" stroke="var(--accent)" />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#001122",
                  border: "1px solid var(--accent)",
                  borderRadius: "6px",
                }}
              />
              {attackTrend.length > 0 &&
                Object.keys(attackTrend[0])
                  .filter((key) => key !== "date")
                  .map((key, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={key}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Report Type Distribution */}
        <div className="bg-black/40 border border-[var(--accent)]/20 rounded-xl p-5">
          <h3 className="text-[var(--accent)] text-sm mb-3 flex items-center gap-2">
            <PieChart size={14} /> Report Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChartComp>
              <Pie
                data={reportDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
              >
                {reportDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChartComp>
          </ResponsiveContainer>
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
}



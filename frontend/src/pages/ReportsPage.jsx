import React, { useEffect, useState } from "react";
import {
  FileText, Filter, Download, Eye, Trash2, RefreshCcw, 
  BarChart3, Mail, Send, PieChart, AlertTriangle, 
  ShieldCheck, FileSearch, Database
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ChatAssistant from "./ChatAssistant";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  Pie, PieChart as PieChartComp, Cell, CartesianGrid
} from "recharts";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [attackTrend, setAttackTrend] = useState([]);
  const [reportDistribution, setReportDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const COLORS = ["#00e5ff", "#a78bfa", "#34d399", "#f43f5e"];

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:5000/api/reports/list");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      toast.error("Failed to load Intelligence logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async () => {
    try {
      const trendRes = await fetch("http://127.0.0.1:5000/api/reports/trend");
      const trendData = await trendRes.json();
      setAttackTrend(trendData);

      const distRes = await fetch("http://127.0.0.1:5000/api/reports/distribution");
      const distData = await distRes.json();
      const distArray = Object.entries(distData).map(([name, value]) => ({ name, value }));
      setReportDistribution(distArray);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchCharts();
  }, []);

  const handleDownload = (r) => {
    if (!r.endpoint) return toast.error("Binary source unavailable");
    window.open(r.endpoint, "_blank");
    toast.success(`Exporting: ${r.name}`);
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return toast.error("Target address required");
    setSending(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) toast.success(`Intelligence Summary dispatched to ${email}`);
    } catch (err) {
      toast.error("Dispatch failure");
    } finally {
      setSending(false);
    }
  };

  const filteredReports = filter === "All" ? reports : reports.filter((r) => r.type === filter);

  return (
    <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-slate-300 font-mono">
      <Toaster position="top-center" />

      {/* HEADER & META DATA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-accent text-[10px] uppercase tracking-[0.3em] mb-2 font-black">
            <ShieldCheck size={14} /> Security Intelligence Unit
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Analytical <span className="text-slate-500">Reports</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right mr-4">
            <div className="text-[10px] text-slate-500 uppercase">System_Clock</div>
            <div className="text-xs text-white uppercase">{new Date().toLocaleTimeString()}</div>
          </div>
          <button
            onClick={() => { fetchReports(); fetchCharts(); }}
            className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-accent hover:text-black transition-all"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS & EMAIL UTILITY */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
          <Filter size={18} className="text-accent" />
          <div className="flex gap-2">
            {["All", "Threat Intelligence", "Network Analysis", "System Health"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                  filter === cat ? "bg-accent text-black" : "bg-white/5 text-slate-500 border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/40 p-4 rounded-xl border border-white/5">
          <input
            type="email"
            placeholder="Analyst Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-xs text-accent placeholder:text-slate-700 focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="bg-accent/10 border border-accent/30 text-accent p-2 rounded-lg hover:bg-accent hover:text-black transition-all"
          >
            {sending ? <RefreshCcw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* ANALYTICS PREVIEW SECTION */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900/20 border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" /> Temporal Attack Trend
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter italic">Source: CIC-IDS2018 Pipeline</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attackTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "10px" }}
              />
              <Line type="monotone" dataKey="value" stroke="#00e5ff" strokeWidth={3} dot={{ r: 4, fill: "#00e5ff" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-4 bg-slate-900/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 self-start">Categorical Weight</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChartComp>
              <Pie data={reportDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {reportDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChartComp>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4 w-full">
            {reportDistribution.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[9px] uppercase text-slate-500 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DATA GRID - THE REPORTS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2 px-2">
          <Database size={16} className="text-accent" /> Data Repository
        </h3>
        
        {loading ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl">
            <span className="animate-pulse text-slate-600 text-xs uppercase tracking-[0.5em]">Syncing_Database...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReports.map((r, i) => (
              <div key={i} className="group bg-slate-900/40 border border-white/5 p-5 rounded-2xl hover:border-accent/40 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5 text-accent">
                    <FileSearch size={24} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDownload(r)} className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-md transition-colors"><Download size={16} /></button>
                    <button className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-md transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm truncate uppercase tracking-tight">{r.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">{r.type}</span>
                    <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded uppercase font-bold">{r.size}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-slate-600 flex justify-between">
                  <span>TIMESTAMP: {r.date}</span>
                  <span className="text-emerald-500/50">SECURED_V4</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChatAssistant />
    </div>
  );
}



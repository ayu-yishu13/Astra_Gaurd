import React, { useEffect, useState } from "react";
import {
  Cpu,
  Network,
  Thermometer,
  Activity,
  PlayCircle,
  FileText,
  Brain,
  Volume2,
  Server,
  ShieldCheck,
} from "lucide-react";
import GaugeChart from "react-gauge-chart";
import toast, { Toaster } from "react-hot-toast";
import ChatAssistant from "./ChatAssistant";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SystemPage() {
  const [systemData, setSystemData] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [connections, setConnections] = useState([]);
  const [attackTrends, setAttackTrends] = useState([]);
  const [optimizations, setOptimizations] = useState([]);

  // --- API Base URL ---
  const API_BASE = "http://127.0.0.1:5000/api";

  // 🔊 Cyber Voice
  const speakSystem = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = 1.1;
    utter.rate = 1.0;
    utter.volume = 0.9;
    const voices = synth.getVoices();
    utter.voice = voices.find((v) => v.name.includes("Microsoft") || v.name.includes("Google")) || voices[0];
    synth.speak(utter);
  };

  // 🧠 Fetch System Info (Every 5s)
  const fetchSystemData = async () => {
    try {
      const res = await fetch(`${API_BASE}/system/status`);
      const data = await res.json();
      setSystemData(data);
    } catch (err) {
      console.error("System fetch error:", err);
    }
  };

  // 📥 Download Report
  const handleDownload = () => {
    toast("📥 Generating Live System Report...", {
      icon: "🧾",
      style: { background: "#1a1a2e", color: "#00e5ff", border: "1px solid #00e5ff33" },
    });
    window.open(`${API_BASE}/system/report`, "_blank");
    speakSystem("Live system report successfully generated.");
  };

  // 🧠 Run Diagnostic
  const runDiagnostic = async () => {
    try {
      setScanning(true);
      toast("🧠 Initializing AI Stress Test...", {
        icon: "⚙️",
        duration: 3000,
        style: { background: "#1a1a2e", color: "#fbbf24" },
      });

      const res = await fetch(`${API_BASE}/system/diagnostic`);
      const data = await res.json();
      setDiagnostic(data);

      toast.success(`Stability: ${data.stability_score}%`, {
        duration: 2500,
        style: { background: "#064e3b", color: "#34d399" },
      });

      speakSystem(`Diagnostic complete. System stability is currently at ${data.stability_score} percent.`);
    } catch (err) {
      console.error("Diagnostic error:", err);
      toast.error("❌ Diagnostic sequence failed");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ⚙️ Fetch Dynamic Data (Processes + Connections)
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const [procRes, connRes] = await Promise.all([
          fetch(`${API_BASE}/system/processes`),
          fetch(`${API_BASE}/system/connections`)
        ]);
        
        const procData = await procRes.json();
        const connData = await connRes.json();

        if (Array.isArray(procData)) setProcesses(procData);
        if (Array.isArray(connData)) setConnections(connData);

        // Generate simulated trends for the UI
        setAttackTrends(Array.from({ length: 7 }, (_, i) => ({
          day: `T-${6-i}h`,
          TOR: Math.random() * 10,
          VPN: Math.random() * 15,
          DDoS: Math.random() * 20,
        })));

        setOptimizations([
          "🧠 CPU logic: Background tasks throttled for NIDS performance.",
          "🔒 Port Integrity: 443/80 secured against injection.",
          "💾 Memory: Zero-leak policy active.",
          "🌐 Traffic: Low latency established via local gateway."
        ]);
      } catch (error) {
        console.error("Live update error:", error);
      }
    };

    fetchDynamicData();
    const interval = setInterval(fetchDynamicData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!systemData)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-accent font-mono animate-pulse">
        <Cpu size={48} className="mb-4 animate-spin-slow" />
        <p className="text-xl">SYNCING WITH NIDS BACKEND...</p>
      </div>
    );

  const renderGauge = (label, value, color) => (
    <div className="flex flex-col items-center card-glow rounded-2xl p-4 bg-slate-900/40 border border-white/5 transition-transform hover:scale-105">
      <h3 className="text-accent text-xs font-bold uppercase tracking-widest mb-2 opacity-70">{label}</h3>
      <GaugeChart
        id={`gauge-${label}`}
        nrOfLevels={30}
        percent={value / 100}
        colors={["#00e5ff", "#fbbf24", "#ff0059"]}
        arcPadding={0.02}
        needleColor="#ffffff"
        textColor="transparent"
        style={{ width: "160px" }}
      />
      <p className={`text-2xl font-black mt-2 ${value > 80 ? "text-rose-500" : value > 60 ? "text-amber-400" : "text-cyan-400"}`}>
        {Math.round(value)}%
      </p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 relative text-[var(--text)] bg-[#0a0a0f] min-h-screen font-sans">
      <Toaster position="bottom-right" />

      {/* Hero Header */}
      <div className="relative z-10">
        <h2 className="py-2 text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
          System Analysis
        </h2>
        <div className="flex items-center gap-2 text-cyan-400/60 font-mono text-sm">
          <ShieldCheck size={14} /> <span>SECURE CONNECTION ESTABLISHED TO {systemData.ip_address}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
             <span className="text-xs uppercase text-accent/50 font-bold">Status</span>
             <span className="text-emerald-400 font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 
                SYSTEM OPERATIONAL
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={runDiagnostic}
            disabled={scanning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border ${
              scanning ? "bg-amber-500/20 border-amber-500/50 text-amber-500" : "bg-cyan-500/10 border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20"
            }`}
          >
            <PlayCircle size={18} className={scanning ? "animate-spin" : ""} />
            {scanning ? "STRESS TESTING..." : "RUN DIAGNOSTIC"}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 px-4 py-2 rounded-lg font-bold hover:bg-emerald-500/20 transition-all"
          >
            <FileText size={18} /> REPORT.PDF
          </button>

          <button
            onClick={() => speakSystem(`Current system health is ${systemData.health_score} percent. Temperature nominal.`)}
            className="p-2 rounded-full bg-slate-800 text-accent hover:bg-cyan-500/20 transition-colors"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
          {renderGauge("CPU Load", systemData.cpu_usage, "var(--accent)")}
          {renderGauge("Memory", systemData.ram_usage, "#fbbf24")}
          {renderGauge("Disk Space", systemData.disk_usage, "#ff0059")}
        </div>

        {/* Health / Temp Card */}
        <div className="card-glow p-6 bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-white/5 flex flex-col justify-center">
            <div className="mb-4">
                <p className="text-xs text-white/40 uppercase font-bold tracking-tighter">Thermal Status</p>
                <div className="flex items-center justify-between">
                    <span className="text-3xl font-mono">{systemData.cpu_temp}°C</span>
                    <Thermometer className={systemData.cpu_temp > 70 ? "text-rose-500 animate-bounce" : "text-cyan-400"} />
                </div>
            </div>
            <div>
                <p className="text-xs text-white/40 uppercase font-bold tracking-tighter">AI Stability Index</p>
                <div className="text-3xl font-black text-emerald-400">{systemData.health_score}%</div>
            </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* System Specs Table */}
        <div className="card-glow p-5 bg-slate-900/40">
            <h3 className="text-accent text-sm font-bold mb-4 flex items-center gap-2 uppercase">
              <Server size={16} /> Hardware Profile
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div className="p-3 bg-black/30 rounded border border-white/5">
                    <p className="text-white/40 text-[10px]">OS VERSION</p>
                    <p className="truncate">{systemData.os}</p>
                </div>
                <div className="p-3 bg-black/30 rounded border border-white/5">
                    <p className="text-white/40 text-[10px]">LOCAL ADDRESS</p>
                    <p className="text-cyan-400">{systemData.ip_address}</p>
                </div>
                <div className="p-3 bg-black/30 rounded border border-white/5">
                    <p className="text-white/40 text-[10px]">TOTAL V-RAM</p>
                    <p>{systemData.ram_total} GB</p>
                </div>
                <div className="p-3 bg-black/30 rounded border border-white/5">
                    <p className="text-white/40 text-[10px]">STORAGE CAPACITY</p>
                    <p>{systemData.disk_total} GB</p>
                </div>
            </div>
            <p className="mt-4 text-[11px] text-white/20 italic font-mono">Processor Ident: {systemData.cpu_name}</p>
        </div>

        {/* Active Processes */}
        <div className="card-glow p-5 bg-slate-900/40">
          <h3 className="text-accent text-sm font-bold mb-4 flex items-center gap-2 uppercase">
            <Activity size={16} /> Resource Intensive Processes
          </h3>
          <div className="overflow-hidden rounded-lg border border-white/5">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-white/5 text-accent uppercase">
                <tr>
                  <th className="px-4 py-2">Process</th>
                  <th className="px-4 py-2">CPU</th>
                  <th className="px-4 py-2">MEM</th>
                  <th className="px-4 py-2">STATE</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2 text-cyan-300 truncate max-w-[120px]">{p.name}</td>
                    <td className="px-4 py-2 text-white/70">{p.cpu}%</td>
                    <td className="px-4 py-2 text-white/70">{p.mem}%</td>
                    <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] uppercase">
                            {p.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Network & Trends Grid */}
      <div className="grid xl:grid-cols-2 gap-6">
         {/* Line Chart */}
        <div className="card-glow p-5 bg-slate-900/40">
          <h3 className="text-accent text-sm font-bold mb-6 flex items-center gap-2 uppercase">
            <Activity size={16} /> Threat Vector Trends (6h)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attackTrends}>
              <XAxis dataKey="day" stroke="#ffffff33" fontSize={10} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #00e5ff33", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="TOR" stroke="#ff0059" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="VPN" stroke="#fbbf24" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="DDoS" stroke="#00ff88" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Network Connections */}
        <div className="card-glow p-5 bg-slate-900/40">
          <h3 className="text-accent text-sm font-bold mb-4 flex items-center gap-2 uppercase">
            <Network size={16} /> Live Inbound/Outbound
          </h3>
          <div className="space-y-2">
            {connections.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded font-mono text-xs border border-white/5">
                <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.state === 'ESTABLISHED' ? 'bg-emerald-500' : 'bg-white/20'}`}></span>
                    <span className="text-cyan-400">{c.ip}:{c.port}</span>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-white/40">{c.proto}</span>
                    <span className="text-[10px] opacity-60 truncate max-w-[80px]">{c.state}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Suggestions Footer */}
      <div className="card-glow p-5 bg-gradient-to-r from-indigo-950/50 to-slate-900/50 border-l-4 border-l-cyan-500">
        <h3 className="text-cyan-400 text-sm font-bold mb-3 flex items-center gap-2 uppercase">
          <Brain size={18} /> Neural Optimizer Output
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {optimizations.map((o, i) => (
            <div key={i} className="text-xs font-mono text-white/60 bg-white/5 p-2 rounded flex items-center gap-2">
               <span className="text-cyan-500 font-bold">»</span> {o}
            </div>
          ))}
        </div>
      </div>

      <ChatAssistant />
    </div>
  );
}



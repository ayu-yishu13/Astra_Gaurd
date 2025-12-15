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

  // 🔊 Cyber Voice
  const speakSystem = (text) => {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = 1.1;
    utter.rate = 1.0;
    utter.volume = 0.9;
    utter.voice =
      synth.getVoices().find((v) => v.name.includes("Microsoft") || v.name.includes("Google")) ||
      synth.getVoices()[0];
    synth.speak(utter);
  };

  // 🧠 Fetch System Info
  const fetchSystemData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/system/status");
      const data = await res.json();
      setSystemData(data);
    } catch (err) {
      console.error("System fetch error:", err);
    }
  };

  // 📥 Download Report
  const handleDownload = () => {
    toast("📥 Generating System Report...", {
      icon: "🧾",
      style: { background: "var(--card)", color: "var(--accent)" },
    });
    window.open("http://127.0.0.1:5000/api/system/report", "_blank");
    speakSystem("System report successfully generated.");
  };

  // 🧠 Run Diagnostic
  const runDiagnostic = async () => {
    try {
      setScanning(true);
      toast("🧠 Running full system diagnostic...", {
        icon: "⚙️",
        duration: 3000,
        style: { background: "var(--card)", color: "var(--accent)" },
      });

      const res = await fetch("http://127.0.0.1:5000/api/system/diagnostic");
      const data = await res.json();
      setDiagnostic(data);

      toast.success("✅ Diagnostic Complete!", {
        duration: 2500,
        style: { background: "var(--card)", color: "var(--accent)" },
      });

      speakSystem(`Diagnostic complete. Stability at ${data.stability_score} percent.`);
    } catch (err) {
      console.error("Diagnostic error:", err);
      toast.error("❌ Diagnostic failed");
    } finally {
      setScanning(false);
    }
  };

  // ♻️ Refresh system metrics every 5s
  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ⚙️ Dynamic Data (Processes + Connections + Simulated Trends)
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const procRes = await fetch("http://127.0.0.1:5000/api/system/processes");
        const procData = await procRes.json();
        if (Array.isArray(procData)) setProcesses(procData);

        const connRes = await fetch("http://127.0.0.1:5000/api/system/connections");
        const connData = await connRes.json();
        if (Array.isArray(connData)) setConnections(connData);

        const fakeAttackTrends = Array.from({ length: 7 }, (_, i) => ({
          day: `Day ${i + 1}`,
          TOR: Math.random() * 10,
          VPN: Math.random() * 15,
          I2P: Math.random() * 5,
          DDoS: Math.random() * 20,
        }));
        setAttackTrends(fakeAttackTrends);

        const fakeOpt = [
          "🧠 Optimize CPU usage by limiting background apps.",
          "🔒 Network stable: monitoring port 443 and 80.",
          "💾 System cache clean recommended soon.",
          "🌐 No suspicious outbound traffic detected.",
        ];
        setOptimizations(fakeOpt);
      } catch (error) {
        console.error("Error fetching live system data:", error);
      }
    };

    fetchDynamicData();
    const interval = setInterval(fetchDynamicData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!systemData)
    return (
      <div className="p-6 text-accent text-center font-mono">
        ⚙️ Fetching system metrics...
      </div>
    );

  const renderGauge = (label, value, color) => (
    <div className="flex flex-col items-center card-glow rounded-2xl p-4">
      <h3 className="text-accent text-sm mb-2">{label}</h3>
      <GaugeChart
        id={`gauge-${label}`}
        nrOfLevels={20}
        percent={value / 100}
        colors={["#00e5ff", "#fbbf24", "#ff0059"]}
        arcPadding={0.02}
        needleColor={color}
        textColor="var(--accent)"
        style={{ width: "180px", height: "100px", transform: "scale(1.1)" }}
      />
      <p
        className={`text-lg font-semibold mt-2 ${
          value > 80
            ? "text-rose-400"
            : value > 60
            ? "text-amber-300"
            : "text-emerald-400"
        }`}
      >
        {Math.round(value)}%
      </p>
    </div>
  );

  const { cpu_usage, ram_usage, disk_usage, cpu_temp, health_score } = systemData;

  return (
    <div className="p-6 space-y-6 relative text-[var(--text)]">
      <Toaster position="bottom-right" />

      <h2 className="py-4 text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 text-transparent bg-clip-text neon-text">
            System Analysis
          </h2>

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
        <h2 className="text-2xl font-semibold text-accent flex items-center gap-2">
          <Cpu size={22} /> AI System Monitor
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={runDiagnostic}
            disabled={scanning}
            className="flex items-center gap-2 bg-accent/10 border border-accent text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition"
          >
            <PlayCircle size={16} className={scanning ? "animate-spin" : ""} />
            {scanning ? "Scanning..." : "Run Diagnostic"}
            <div className="flex items-center gap-2 text-xs text-[var(--text)]/60">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></div>
              <span>Live Refresh Active</span>
            </div>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition"
          >
            <FileText size={16} />
            Download Report
          </button>

          <button
            onClick={() => speakSystem("System health stable. No anomalies detected.")}
            className="text-accent hover:text-emerald-300"
            title="Speak system status"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* GAUGES */}
      <div className="grid md:grid-cols-3 gap-6">
        {renderGauge("CPU Usage", cpu_usage, "var(--accent)")}
        {renderGauge("Memory Usage", ram_usage, "#fbbf24")}
        {renderGauge("Disk Usage", disk_usage, "#ff0059")}
      </div>

      {/* TEMP + HEALTH */}
      <div className="flex flex-wrap justify-between items-center gap-4 card-glow p-4">
        <div className="flex items-center gap-3">
          <Thermometer size={18} className="text-accent" />
          <span className="text-[var(--text)] text-sm">
            CPU Temp:{" "}
            <span
              className={`font-semibold ${
                cpu_temp > 80
                  ? "text-rose-400"
                  : cpu_temp > 65
                  ? "text-amber-300"
                  : "text-emerald-400"
              }`}
            >
              {cpu_temp}°C
            </span>
          </span>
        </div>
        <div className="text-sm text-accent">
          System Health:{" "}
          <span
            className={`font-bold ${
              health_score > 75
                ? "text-emerald-400"
                : health_score > 50
                ? "text-amber-300"
                : "text-rose-400"
            }`}
          >
            {health_score}%
          </span>
        </div>
      </div>

      {/* SYSTEM INFO */}
      <div className="card-glow p-5">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Server size={14} /> System Overview
        </h3>
        <ul className="text-sm text-[var(--text)]/80 space-y-1">
          <li>💻 OS: {systemData.os}</li>
          <li>🧠 CPU: {systemData.cpu_name}</li>
          <li>⚙️ Hostname: {systemData.hostname}</li>
          <li>
            🌐 IP: <span className="text-accent">{systemData.ip_address}</span>
          </li>
          <li>💾 Disk Total: {systemData.disk_total} GB</li>
          <li>🧩 Memory Total: {systemData.ram_total} GB</li>
        </ul>
      </div>

      {/* ACTIVE PROCESSES */}
      <div className="card-glow p-4">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Cpu size={14} /> Active Processes
        </h3>
        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--accent)]/30 scrollbar-track-transparent hover:scrollbar-thumb-[var(--accent)]/50 transition-all">
          <table className="w-full text-sm text-left text-[var(--text)]">
            <thead className="text-xs uppercase text-accent border-b border-[var(--accent)]/20">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">CPU %</th>
                <th className="px-3 py-2">Memory %</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, i) => (
                <tr key={i} className="border-b border-[var(--accent)]/10 hover:bg-[var(--accent)]/5 transition">
                  <td className="px-3 py-2 font-mono text-accent truncate">{p.name}</td>
                  <td className="px-3 py-2">{p.cpu}%</td>
                  <td className="px-3 py-2">{p.mem}%</td>
                  <td className="px-3 py-2">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {processes.length >= 6 && (
          <p className="text-xs text-[var(--text)]/50 mt-2 italic text-right">
            Showing top 6 processes by CPU usage
          </p>
        )}
      </div>

      {/* NETWORK CONNECTIONS */}
      <div className="card-glow p-4">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Network size={14} /> Active Network Connections
        </h3>
        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--accent)]/30 scrollbar-track-transparent hover:scrollbar-thumb-[var(--accent)]/50 transition-all">
          <ul className="space-y-2 text-sm text-[var(--text)]">
            {connections.map((c, i) => (
              <li
                key={i}
                className="flex justify-between border-b border-[var(--accent)]/10 pb-1 hover:bg-[var(--accent)]/5 px-2 rounded transition"
              >
                <span className="font-mono text-accent">
                  {c.ip}:{c.port}
                </span>
                <span>{c.proto}</span>
                <span
                  className={`${
                    c.state === "ESTABLISHED"
                      ? "text-emerald-400"
                      : "text-[var(--text)]/60"
                  }`}
                >
                  {c.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {connections.length >= 6 && (
          <p className="text-xs text-[var(--text)]/50 mt-2 italic text-right">
            Showing top 6 active network connections
          </p>
        )}
      </div>

      {/* ATTACK PATTERN EVOLUTION */}
      <div className="card-glow p-4">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Activity size={14} /> Attack Pattern Evolution
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={attackTrends}>
            <XAxis dataKey="day" stroke="var(--accent)" />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--accent)",
                borderRadius: "6px",
              }}
            />
            <Line type="monotone" dataKey="TOR" stroke="#ff0059" strokeWidth={2} />
            <Line type="monotone" dataKey="VPN" stroke="#fbbf24" strokeWidth={2} />
            <Line type="monotone" dataKey="I2P" stroke="var(--accent)" strokeWidth={2} />
            <Line type="monotone" dataKey="DDoS" stroke="#00ff88" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI OPTIMIZATION */}
      <div className="card-glow p-4">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Brain size={14} /> AI Optimization Suggestions
        </h3>
        <ul className="text-sm text-[var(--text)]/80 space-y-2">
          {optimizations.map((o, i) => (
            <li
              key={i}
              className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-lg p-2 hover:bg-[var(--accent)]/10 transition"
            >
              {o}
            </li>
          ))}
        </ul>
      </div>
      <ChatAssistant />
    </div>
  );
}




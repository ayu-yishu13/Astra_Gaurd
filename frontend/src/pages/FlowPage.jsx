import React, { useMemo, useState, useEffect, useRef } from "react";
import ChatAssistant from "./ChatAssistant";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Shield, Lock, Server, Activity, Wifi, Play, Pause, Zap, Radar, RefreshCcw, FileDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast, { Toaster } from "react-hot-toast"; // Fixed missing import

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const pid = (n) => `p_${n.replace(/\s+/g, "_")}`;

export default function FlowPage() {
  const query = useQuery();
  const type = (query.get("type") || "TOR").toUpperCase();
  const navigate = useNavigate();

  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [highlightDetection, setHighlightDetection] = useState(false);
  const [logs, setLogs] = useState([]);
  const [replayActive, setReplayActive] = useState(false);
  const [activeTab, setActiveTab] = useState("behavior");
  const [activeStage, setActiveStage] = useState(0);
  const flowRef = useRef(null);
  const [accentColor, setAccentColor] = useState(
    getComputedStyle(document.body).getPropertyValue("--accent") || "#00e5ff"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newAccent = getComputedStyle(document.body).getPropertyValue("--accent");
      setAccentColor(newAccent.trim());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!paused && !replayActive) {
        const t = new Date().toLocaleTimeString();
        const fake = `[${t}] ${type} flow → ${Math.random() > 0.6 ? "⚠️ Suspicious" : "✅ Normal"}`;
        setLogs((p) => [fake, ...p.slice(0, 10)]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [paused, replayActive, type]);

  const flow = useMemo(() => {
    const titleMap = {
      TOR: "TOR Network Attack Flow",
      I2P: "I2P Encrypted Flow",
      VPN: "VPN Tunnel Simulation",
      FREENET: "Freenet Data Flow",
      ZERONET: "ZeroNet P2P Flow",
    };

    const nodes = [
      { id: "attacker", label: "Origin", x: 100, y: 200, icon: <Activity size={16} /> },
      { id: "entry", label: "Entry", x: 300, y: 120, icon: <Lock size={16} /> },
      { id: "relay", label: "Relay", x: 550, y: 150, icon: <Wifi size={16} /> },
      { id: "exit", label: "Exit", x: 800, y: 200, icon: <Lock size={16} /> },
      { id: "victim", label: "Victim", x: 1050, y: 250, icon: <Server size={16} /> },
      { id: "detection", label: "AI", x: 1250, y: 250, icon: <Shield size={16} /> },
    ];

    const paths = [
      "M100 200 C200 100, 240 100, 300 120",
      "M300 120 C400 100, 480 120, 550 150",
      "M550 150 C650 160, 720 180, 800 200",
      "M800 200 C950 240, 1000 260, 1050 250",
      "M1050 250 C1150 260, 1200 260, 1250 250",
    ];

    return { title: titleMap[type], nodes, paths };
  }, [type]);

  useEffect(() => {
    if (replayActive) {
      let stage = 0;
      const interval = setInterval(() => {
        setActiveStage(stage);
        stage++;
        if (stage > flow.nodes.length) {
          clearInterval(interval);
          setReplayActive(false);
        }
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [replayActive, flow.nodes.length]);

  const exportPDF = async () => {
    const el = flowRef.current;
    const canvas = await html2canvas(el);
    const pdf = new jsPDF("landscape", "pt", [canvas.width, canvas.height]);
    pdf.addImage(canvas, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${type}_Flow_Report.pdf`);
  };

  const compareData = [
    { name: "TOR", risk: 85, detection: 92 },
    { name: "VPN", risk: 65, detection: 75 },
    { name: "I2P", risk: 75, detection: 88 },
    { name: "Freenet", risk: 50, detection: 70 },
  ];

  return (
    <div ref={flowRef} className="relative min-h-screen bg-[var(--card)] text-[var(--text)] overflow-x-hidden pb-32">
      <Toaster position="bottom-right" />
      <div className="absolute inset-0 blur-3xl opacity-20 pointer-events-none animate-pulse"
        style={{ background: `radial-gradient(circle at 50% 50%, ${accentColor}55 0%, transparent 70%)` }} />

      {/* Responsive Header */}
      <header className="flex flex-wrap items-center justify-between p-4 md:p-6 relative z-10 gap-4">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[var(--card)]/50 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] text-sm">
          ← Back
        </button>
        <h2 className="text-xl md:text-3xl font-bold text-[var(--accent)] text-center flex-1 md:flex-none">
          {flow.title}
        </h2>
        <button onClick={exportPDF} className="px-3 py-2 bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] flex items-center gap-2 text-sm">
          <FileDown size={16} /> <span className="hidden sm:inline">Export</span>
        </button>
      </header>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 relative z-10">
        
        {/* SVG Flow - Makes it scrollable on tiny screens, scales on tablets */}
        <div className="flex-1 overflow-x-auto lg:overflow-visible bg-black/20 rounded-2xl border border-white/5 p-4">
          <div className="min-w-[800px] lg:min-w-full">
            <svg viewBox="0 0 1350 400" width="100%" className="h-auto max-h-[500px]">
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={highlightDetection ? "#ff0044" : accentColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.3" />
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>

              <g stroke="url(#flowGrad)" strokeWidth="3.5" fill="none" filter="url(#glow)">
                {flow.paths.map((path, i) => {
                  const pathId = pid(`${type}_${i}`);
                  return (
                    <g key={pathId}>
                      <path id={pathId} d={path} strokeLinecap="round" opacity={replayActive && i > activeStage ? 0.15 : 0.8} />
                      {!paused && Array.from({ length: 5 }).map((_, j) => (
                        <circle key={j} r="4" fill={highlightDetection ? "#ff0044" : accentColor}>
                          <animateMotion dur={`${speed}s`} repeatCount="indefinite" begin={`${j * 0.7}s`}><mpath href={`#${pathId}`} /></animateMotion>
                        </circle>
                      ))}
                    </g>
                  );
                })}
              </g>

              {flow.nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="26" fill={accentColor} opacity={activeStage >= i || !replayActive ? 0.35 : 0.15} stroke={accentColor} strokeWidth="1.5" filter="url(#glow)" />
                  <foreignObject x={n.x - 10} y={n.y - 10} width="20" height="20">
                    <div className="flex items-center justify-center w-full h-full text-[var(--text)]">{n.icon}</div>
                  </foreignObject>
                  <text x={n.x} y={n.y + 45} textAnchor="middle" fontSize="12" fill="var(--text)" className="font-bold">{n.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Responsive Logs Panel */}
        <div className="w-full lg:w-80 h-64 lg:h-[500px] bg-[var(--card)]/70 border border-[var(--accent)]/30 rounded-xl p-3 text-xs font-mono overflow-y-auto backdrop-blur-sm">
          <h4 className="text-[var(--accent)] font-semibold mb-2 flex items-center gap-2 sticky top-0 bg-[var(--card)] py-1">
            <Radar size={14} /> Live Logs
          </h4>
          {logs.map((log, i) => (
            <div key={i} className="border-b border-[var(--accent)]/10 pb-1 py-1">{log}</div>
          ))}
        </div>
      </div>

      {/* Timeline - Horizontal Scroll on Mobile */}
      <div className="mt-8 px-4 md:px-10 overflow-x-auto pb-4">
        <h3 className="text-lg text-[var(--accent)] font-semibold mb-4">Attack Timeline</h3>
        <div className="flex items-center gap-4 md:gap-8 min-w-max">
          {flow.nodes.map((n, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full transition-all duration-500 ${i <= activeStage ? "bg-[var(--accent)] scale-125 shadow-[0_0_10px_var(--accent)]" : "bg-slate-700"}`}></div>
              <p className="text-[10px] mt-2 text-[var(--text)]/60">{n.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs & Comparison - Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-10 mt-6 mb-10">
  <div className="flex flex-col gap-3">
    {/* Tactical Tab Navigation */}
    <div className="flex flex-wrap gap-2">
      {["behavior", "detection", "mitigation", "dataset"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 overflow-hidden
            ${activeTab === tab 
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" 
              : "text-[var(--text)]/40 hover:text-[var(--text)]/80 border-b border-white/5"}`}
        >
          {activeTab === tab && (
            <span className="absolute inset-0 bg-[var(--accent)]/5 animate-pulse" />
          )}
          {tab}
        </button>
      ))}
    </div>

    {/* Content Terminal Window */}
    <div className="relative group">
      {/* Decorative Brackets */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)]/30 group-hover:border-[var(--accent)] transition-colors" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[var(--accent)]/30 group-hover:border-[var(--accent)] transition-colors" />
      
      <div className="bg-[var(--card)]/80 backdrop-blur-md border border-white/5 p-6 min-h-[160px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--accent)] animate-ping" />
            <span className="text-[9px] font-mono text-[var(--accent)] tracking-[0.3em] uppercase">
              Sector_{activeTab}_Analysis
            </span>
          </div>
          
          <div className="font-mono text-sm leading-relaxed text-[var(--text)]/90 border-l-2 border-[var(--accent)]/20 pl-4 py-1">
            {activeTab === "behavior" && (
              <p><span className="text-[var(--accent)] font-bold">REPORT:</span> {type} utilizes a decentralized layered encryption mesh. Every node transition re-encapsulates the payload, creating a "Matryoshka" effect that obfuscates the original source IP and prevents packet-level correlation.</p>
            )}
            {activeTab === "detection" && (
              <p><span className="text-[var(--accent)] font-bold">NEURAL_SIG:</span> AstraGuard AI employs recurrent feature extraction to identify microscopic jitter and inter-arrival time (IAT) variances unique to {type} tunnels, achieving an F1-score of 0.94.</p>
            )}
            {activeTab === "mitigation" && (
              <p><span className="text-[var(--accent)] font-bold">DEFENSE:</span> Automated Null-Route triggers are prepared for localized clusters. Implementing dynamic circuit breaking and TLS-fingerprint filtering to strip {type} obfuscation layers at the edge gateway.</p>
            )}
            {activeTab === "dataset" && (
              <p><span className="text-[var(--accent)] font-bold">SOURCE:</span> Synthesized from 1.4TB of telemetry including CICIDS2017, Darknet-2020, and live-captured PCAPs. Distribution covers 18 distinct traffic classes with supervised labeling.</p>
            )}
          </div>
        </div>

        {/* Bottom Metadata Line */}
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-40">
          <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--accent)]">Security Level: Level_4_Clearance</span>
          <span className="text-[8px] font-bold text-[var(--accent)]">ID: {Math.random().toString(16).substr(2, 8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  </div>
 


<div className="bg-[var(--card)]/70 p-6 rounded-xl border border-[var(--accent)]/30 h-[350px] relative overflow-hidden group">
  {/* Decorative background scan line */}
  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,229,255,0.1)_50%)] bg-[length:100%_4px] animate-pulse" />
  
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-6 flex items-center gap-2">
    <Activity size={14} className="animate-pulse" /> Threat Propensity vs. Detection Accuracy
  </h3>

  <ResponsiveContainer width="100%" height="85%">
    <BarChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        {/* Gradient for Detection Bars */}
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={1} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.2} />
        </linearGradient>
        {/* Gradient for Risk Bars */}
        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2} />
        </linearGradient>
      </defs>

      <CartesianGrid 
        strokeDasharray="0" 
        vertical={false} 
        stroke="rgba(255,255,255,0.05)" 
      />
      
      <XAxis 
        dataKey="name" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fill: 'var(--text)', fontSize: 10, fontWeight: 'bold' }} 
        dy={10}
      />
      
      <YAxis 
        axisLine={false} 
        tickLine={false} 
        tick={{ fill: 'var(--text)', opacity: 0.4, fontSize: 9 }} 
      />

      <Tooltip 
        cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
        contentStyle={{ 
          backgroundColor: 'rgba(10,10,10,0.95)', 
          border: '1px solid var(--accent)', 
          borderRadius: '8px',
          fontSize: '11px',
          backdropFilter: 'blur(10px)'
        }} 
        itemStyle={{ fontWeight: 'bold', textTransform: 'uppercase' }}
      />

      {/* Main Bars with Glow Effect */}
      <Bar 
        dataKey="risk" 
        fill="url(#riskGrad)" 
        radius={[2, 2, 0, 0]} 
        barSize={12}
      />
      <Bar 
        dataKey="detection" 
        fill="url(#barGrad)" 
        radius={[2, 2, 0, 0]} 
        barSize={12}
      />
    </BarChart>
  </ResponsiveContainer>
  
  {/* Legend Overlay */}
  <div className="absolute bottom-4 right-6 flex gap-4">
     <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
        <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Risk Index</span>
     </div>
     <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
        <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">AI Confidence</span>
     </div>
  </div>
</div>
      </div>

      {/* Responsive Floating Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl bg-[var(--card)]/90 backdrop-blur-xl px-4 py-3 border border-[var(--accent)]/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setPaused(!paused)} className="text-[var(--accent)] flex items-center gap-3 font-bold">Pause
            {paused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button onClick={() => setReplayActive(true)} className="text-[var(--accent)] font-bold gap-3 flex items-center">Refresh
            <RefreshCcw size={18} />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[19px] text-[var(--accent)]">
          <Zap size={14} /> Speed
          <input type="range" min="2" max="10" value={speed} onChange={(e) => setSpeed(e.target.value)} className="accent-[var(--accent)] w-20" />
        </div>

        <button onClick={() => setHighlightDetection(!highlightDetection)}
          className={`px-3 py-1.5 text-cyan-500 font-bold rounded-lg border transition-all ${highlightDetection ? "bg-rose-600 border-rose-500 text-white" : "border-[var(--accent)]/30 text-[var(--accent)]"}`}>
          {highlightDetection ? "DETECTION ACTIVE" : "ISOLATE THREAT"}
        </button>
      </div>

      <ChatAssistant />
    </div>
  );
}
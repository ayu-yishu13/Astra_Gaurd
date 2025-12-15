import React, { useMemo, useState, useEffect, useRef } from "react";
import ChatAssistant from "./ChatAssistant";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Server,
  Activity,
  Wifi,
  Play,
  Pause,
  Zap,
  Radar,
  RefreshCcw,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  // 🌀 Listen for theme color changes (syncs with system theme)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newAccent = getComputedStyle(document.body).getPropertyValue("--accent");
      setAccentColor(newAccent.trim());
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // 🧠 Generate sample logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (!paused && !replayActive) {
        const t = new Date().toLocaleTimeString();
        const fake = `[${t}] ${["TOR", "VPN", "I2P"][Math.floor(Math.random() * 3)]} flow → ${
          Math.random() > 0.6 ? "⚠️ Suspicious" : "✅ Normal"
        }`;
        setLogs((p) => [fake, ...p.slice(0, 10)]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [paused, replayActive]);

  // 🎯 Flow definitions
  const flow = useMemo(() => {
    const titleMap = {
      TOR: "TOR Network Attack Flow Simulation",
      I2P: "I2P Encrypted Communication Flow",
      VPN: "VPN Tunnel Obfuscation Simulation",
      FREENET: "Freenet Decentralized Data Flow",
      ZERONET: "ZeroNet Peer-to-Peer Data Flow",
    };

    const nodes = [
      { id: "attacker", label: "Attacker Origin", x: 100, y: 200, icon: <Activity size={16} /> },
      { id: "entry", label: "Entry Node", x: 280, y: 120, icon: <Lock size={16} /> },
      { id: "relay", label: "Relay Network", x: 500, y: 150, icon: <Wifi size={16} /> },
      { id: "exit", label: "Exit Node", x: 720, y: 200, icon: <Lock size={16} /> },
      { id: "victim", label: "Victim System", x: 940, y: 250, icon: <Server size={16} /> },
      { id: "detection", label: "Detection AI", x: 1160, y: 250, icon: <Shield size={16} /> },
    ];

    const paths = [
      "M100 200 C200 100, 240 100, 280 120",
      "M280 120 C380 100, 460 120, 500 150",
      "M500 150 C600 160, 660 180, 720 200",
      "M720 200 C820 240, 880 260, 940 250",
      "M940 250 C1040 260, 1100 260, 1160 250",
    ];

    return { title: titleMap[type], nodes, paths };
  }, [type]);

  // 🎞️ Replay Animation
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
  }, [replayActive]);

  // 🧾 Export as PDF
  const exportPDF = async () => {
    const el = flowRef.current;
    const canvas = await html2canvas(el);
    const pdf = new jsPDF("landscape", "pt", [canvas.width, canvas.height]);
    pdf.addImage(canvas, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${type}_Flow_Report.pdf`);
  };

  // 📊 Comparison data
  const compareData = [
    { name: "TOR", risk: 85, detection: 92 },
    { name: "VPN", risk: 65, detection: 75 },
    { name: "I2P", risk: 75, detection: 88 },
    { name: "Freenet", risk: 50, detection: 70 },
    { name: "ZeroNet", risk: 60, detection: 73 },
  ];

  return (
    <div
      ref={flowRef}
      className="relative min-h-screen bg-[var(--card)] text-[var(--text)] overflow-hidden transition-colors duration-500"
    >
      {/* Subtle animated theme glow */}
      <div
        className="absolute inset-0 blur-3xl opacity-20 pointer-events-none animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accentColor}55 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-6 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[var(--card)]/50 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/10 transition"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-bold text-[var(--accent)] tracking-wide drop-shadow-lg">
          {flow.title}
        </h2>
        <button
          onClick={exportPDF}
          className="px-3 py-2 bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/30 flex items-center gap-2"
        >
          <FileDown size={16} /> Export Report
        </button>
      </div>

      {/* Flow Diagram */}
      <div className="flex justify-center items-start gap-6 px-6 relative z-10">
        <div className="flex-1 flex justify-center relative">
          <svg viewBox="0 0 1300 400" width="100%" height="600">
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={highlightDetection ? "#ff0044" : accentColor}
                  stopOpacity="0.9"
                />
                <stop
                  offset="100%"
                  stopColor={accentColor}
                  stopOpacity="0.3"
                />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g stroke="url(#flowGrad)" strokeWidth="3.5" fill="none" filter="url(#glow)">
              {flow.paths.map((path, i) => {
                const pathId = pid(`${flow.title}_${i}`);
                return (
                  <g key={pathId}>
                    <path
                      id={pathId}
                      d={path}
                      strokeLinecap="round"
                      opacity={replayActive && i > activeStage ? 0.15 : 0.8}
                    />
                    {!paused &&
                      Array.from({ length: 5 }).map((_, j) => (
                        <circle key={j} r="4" fill={highlightDetection ? "#ff0044" : accentColor} opacity="0.9">
                          <animateMotion
                            dur={`${speed}s`}
                            repeatCount="indefinite"
                            begin={`${j * 0.7}s`}
                          >
                            <mpath href={`#${pathId}`} />
                          </animateMotion>
                        </circle>
                      ))}
                  </g>
                );
              })}
            </g>

            {flow.nodes.map((n, i) => (
              <g key={i}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="26"
                  fill={accentColor}
                  opacity={activeStage >= i || !replayActive ? 0.35 : 0.15}
                  stroke={accentColor}
                  strokeWidth="1.5"
                  filter="url(#glow)"
                />
                <foreignObject x={n.x - 10} y={n.y - 10} width="20" height="20">
                  <div className="flex items-center justify-center w-full h-full text-[var(--text)]">
                    {n.icon}
                  </div>
                </foreignObject>
                <text
                  x={n.x}
                  y={n.y + 45}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--text)"
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Logs */}
        <div className="w-80 h-[600px] bg-[var(--card)]/70 border border-[var(--accent)]/30 rounded-xl p-3 text-xs font-mono overflow-y-auto backdrop-blur-sm">
          <h4 className="text-[var(--accent)] font-semibold mb-2 flex items-center gap-2">
            <Radar size={14} /> Live Logs
          </h4>
          {logs.map((log, i) => (
            <div key={i} className="border-b border-[var(--accent)]/10 pb-1">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8 px-10">
        <h3 className="text-lg text-[var(--accent)] font-semibold mb-2">Attack Timeline</h3>
        <div className="flex items-center gap-8">
          {flow.nodes.map((n,i)=>(
            <div key={i} className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${i<=activeStage?"bg-[var(--accent)]":"bg-slate-700"}`}></div>
              <p className="text-xs mt-1 text-[var(--text)]/60">{n.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 px-10">
        <div className="flex gap-4 text-sm mb-3">
          {["behavior","detection","mitigation","dataset"].map((tab)=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`px-3 py-2 rounded-md border ${activeTab===tab?"border-[var(--accent)] text-[var(--accent)]":"border-slate-700 text-[var(--text)]/60"}`}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="bg-[var(--card)]/70 border border-[var(--accent)]/20 rounded-xl p-4 text-sm leading-relaxed text-[var(--text)]/90">
          {activeTab==="behavior" && (
            <p>{type} uses layered obfuscation to hide packet origin and route through multiple relays...</p>
          )}
          {activeTab==="detection" && (
            <p>AI model monitors statistical anomalies in flow metadata to classify {type} traffic with 90%+ accuracy.</p>
          )}
          {activeTab==="mitigation" && (
            <p>Network segmentation, DNS filtering, and retraining are key mitigations for {type}-based intrusions.</p>
          )}
          {activeTab==="dataset" && (
            <p>Trained on CICIDS2017 + Darknet + custom captures across 18-class distribution including VPN, TOR, I2P.</p>
          )}
        </div>
      </div>


      {/* Comparison Chart */}
      <div className="mt-10 px-10">
        <h3 className="text-lg font-semibold text-[var(--accent)] mb-3">Attack Comparison Metrics</h3>
        <div className="bg-[var(--card)]/70 p-4 rounded-xl border border-[var(--accent)]/30 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
              <XAxis dataKey="name" stroke="var(--text)"/>
              <YAxis stroke="var(--text)"/>
              <Tooltip/>
              <Bar dataKey="risk" fill="#f43f5e" name="Risk Level"/>
              <Bar dataKey="detection" fill="var(--accent)" name="Detection Accuracy"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--card)]/80 backdrop-blur-md px-6 py-3 border border-[var(--accent)]/30 rounded-2xl flex items-center gap-5 shadow-lg z-50">
        <button
          onClick={() => setPaused(!paused)}
          className="text-[var(--accent)] flex items-center gap-2 hover:opacity-80 transition"
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
          {paused ? "Play" : "Pause"}
        </button>
        <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
          <Zap size={16} /> Speed:
          <input
            type="range"
            min="2"
            max="10"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="accent-[var(--accent)] w-28"
          />
          <span>{speed}s</span>
        </div>
        <button
          onClick={() => setReplayActive(true)}
          className="text-[var(--accent)] flex items-center gap-2 hover:opacity-80 transition"
        >
          <RefreshCcw size={16} /> Replay Flow
        </button>
        <button
          onClick={() => setHighlightDetection(!highlightDetection)}
          className={`px-3 py-1 text-sm rounded-lg border ${
            highlightDetection
              ? "bg-rose-600/30 border-rose-500/40 text-rose-300"
              : "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]"
          }`}
        >
          {highlightDetection ? "Detection ON 🔴" : "Highlight Detection"}
        </button>
      </div>
      <ChatAssistant />
    </div>
  );
}






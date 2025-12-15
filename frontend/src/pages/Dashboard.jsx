import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Shield,
  Cpu,
  Wifi,
  Activity,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import NeonShield from "../components/NeonShield";
import { useNavigate } from "react-router-dom";
import ChatAssistant from "./ChatAssistant";

// Cyber palette
const COLORS = ["#00e5ff", "#ff0059", "#a78bfa", "#fbbf24", "#10b981"];

export default function Dashboard() {

  const location = useLocation();
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [mlModels, setMlModels] = useState([]);
  const [loading, setLoading] = useState(true);



  // -------------------------------
  // BACK TO TOP BUTTON STATE
  // -------------------------------
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // find the real scroll container
    const scrollContainer = document.querySelector("main.flex-1.overflow-auto");

    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollContainer.scrollTop > 300) setShowTop(true);
      else setShowTop(false);
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Backend fetch
  const loadData = async () => {
    try {
      const [sys, ml, th] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/system/status").then((r) => r.json()),
        fetch("http://127.0.0.1:5000/api/ml/models").then((r) => r.json()),
        fetch("http://127.0.0.1:5000/api/live/stats").then((r) => r.json()),
      ]);

      setSystemStats(sys || {});
      setMlModels(Array.isArray(ml) ? ml : []);
      setThreats(
        Object.entries(th || {}).map(([k, v]) => ({
          name: k.toUpperCase(),
          value: v,
        }))
      );
    } catch (err) {
      console.error("Dashboard Error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <div className="relative">
        {/* ============================
            CYBER BACKGROUND
        ============================= */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Gradient Base */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(140deg, rgba(3,6,23,0.75) 0%, rgba(9,19,39,0.7) 40%, rgba(10,26,54,0.6) 75%, rgba(15,7,33,0.65) 100%)",
            }}
          />

          {/* Hex Grid */}
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-screen"
            style={{
              backgroundImage:
                "url('https://raw.githubusercontent.com/ayushatlas/assets/main/hexgrid/hexgrid-light.png')",
              backgroundSize: "350px",
              backgroundRepeat: "repeat",
            }}
          />

          {/* Left Cyan Glow */}
          <div className="absolute left-10 top-40 w-[450px] h-[450px] bg-cyan-400/15 blur-[180px]" />

          {/* Right Purple Glow */}
          <div className="absolute right-10 top-10 w-[420px] h-[420px] bg-purple-500/12 blur-[180px]" />

          {/* Floating Particles */}
          {[...Array(70)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full drift-slow"
              style={{
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                background: `rgba(150, 220, 255, ${0.45 + Math.random() * 0.4})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                filter: "blur(2px)",
                animationDuration: `${6 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.6 + Math.random() * 0.3,
              }}
            />
          ))}
        </div>

        {/* ============================
                 HERO HEADER
        ============================= */}
        <header className="relative mb-24">
          {/* HERO CONTENT */}
          <div className="relative z-20 container mx-auto px-8 pt-24 pb-24 lg:ml-1">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* LEFT TEXT */}
              <div className="space-y-7">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full border border-accent/50 shadow-neon">
                    <Shield size={24} className="text-accent" />
                  </div>
                  <span className="text-sm text-slate-300/80 tracking-wide">
                    AstraGuard AI • Adaptive NIDS
                  </span>
                </div>

                <h1
                  className="text-[70px] leading-[76px] font-extrabold tracking-tight"
                  style={{
                    textShadow:
                      "0 0 30px rgba(0,229,255,0.75), 0 0 12px rgba(0,229,255,0.5)",
                  }}
                >
                  <span className="text-accent">Protect</span> Your <br /> Systems
                </h1>

                <div className="w-full overflow-hidden">
                  <div className="neon-wave" />
                </div>

                <p className="text-slate-300/85 text-lg max-w-xl leading-relaxed">
                  Our adaptive AI framework provides real-time packet inspection,
                  threat detection, ML classification and security analytics.
                </p>

                <div className="flex items-center gap-4 pt-3">
                  <button
                    onClick={() => navigate("/livetraffic")}
                    className="px-6 py-3 rounded-xl bg-accent text-black font-semibold text-lg shadow-neon hover:scale-[1.03] transition"
                  >
                    Get Started
                  </button>

                  <button
                    onClick={() => navigate("/threats")}
                    className="px-6 py-3 rounded-xl border border-accent/40 text-accent text-lg hover:bg-accent/10 transition"
                  >
                    Learn more
                  </button>
                </div>
              </div>

              {/* RIGHT Floating Shield */}
              <div className="relative w-full flex justify-center items-center h-[420px]">
                <div className="flex items-center gap-3 absolute -top-10">
                  <div className="p-2 rounded-full border border-accent/50 shadow-neon">
                    <Radio size={24} className="text-accent" />
                  </div>
                  <span className="text-sm text-slate-300/80">
                    Cyber • Security
                  </span>
                </div>

                <div
                  className="relative w-[90%] h-[380px] rounded-3xl
                    border border-accent/25 backdrop-blur-xl shadow-[0_0_40px_rgba(0,229,255,0.25)]
                    overflow-hidden"
                >
                  <NeonShield />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ============================
            MAIN DASHBOARD PANEL
        ============================= */}
        <main className="container mx-auto px-6 -mt-20 relative z-30">
          <div className="glass-shell p-6 rounded-3xl border border-accent/20">
            <div className="flex justify-between items-center border-b border-accent/10 pb-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
                  <Shield size={22} /> Cyber SOC Dashboard
                </h1>
                <p className="text-slate-300/70 text-sm">
                  Real-time overview of AI NIDS operations
                </p>
              </div>
            </div>

            {/* System + ML + Network */}
            <div className="grid md:grid-cols-3 gap-5 mb-6">
              {/* System */}
              <div className="cyber-card p-5 border border-accent/20">
                <h3 className="text-accent font-semibold mb-2 flex items-center gap-2">
                  <Cpu size={16} /> System Status
                </h3>
                {loading ? (
                  <p className="text-slate-500">Loading...</p>
                ) : (
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>CPU Usage: {systemStats?.cpu_usage ?? "N/A"}%</li>
                    <li>RAM Usage: {systemStats?.ram_usage ?? "N/A"}%</li>
                    <li>Disk Usage: {systemStats?.disk_usage ?? "N/A"}%</li>
                    <li>
                      Active Interfaces: {systemStats?.interfaces?.length ?? 0}
                    </li>
                  </ul>
                )}
              </div>

              {/* ML Models */}
              <div className="cyber-card p-5 border border-accent/20">
                <h3 className="text-accent font-semibold mb-2 flex items-center gap-2">
                  <Activity size={16} /> ML Model Status
                </h3>
                {mlModels.length > 0 ? (
                  <ul className="text-sm text-slate-300 space-y-1">
                    {mlModels.map((m, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{m.name}</span>
                        <span className="text-accent">
                          {m.accuracy ?? "N/A"}%
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No models loaded</p>
                )}
              </div>

              {/* Live Threats */}
              <div className="cyber-card p-5 border border-accent/20">
                <h3 className="text-accent font-semibold mb-2 flex items-center gap-2">
                  <Wifi size={16} /> Live Network Health
                </h3>
                {threats.length > 0 ? (
                  <ul className="text-sm text-slate-300 space-y-1">
                    {threats.map((t, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{t.name}</span>
                        <span className="text-rose-300">{t.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">Awaiting live data</p>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Pie */}
              <div className="cyber-card border border-accent/15 p-5">
                <h3 className="text-accent mb-2 font-semibold">
                  Threat Class Distribution (Pie)
                </h3>
                <div className="h-64">
                  {threats.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={threats}
                          dataKey="value"
                          outerRadius={90}
                          label
                        >
                          {threats.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-500 text-center mt-20">
                      No data yet
                    </p>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="cyber-card border border-accent/15 p-5">
                <h3 className="text-accent mb-2 font-semibold">
                  Threat Count Overview (Bar)
                </h3>
                <div className="h-64">
                  {threats.length > 0 ? (
                    <ResponsiveContainer>
                      <BarChart data={threats}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.05}
                        />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="#00e5ff"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-500 text-center mt-20">
                      Awaiting input
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* =========================================================
            PREMIUM CYBER FOOTER
        ========================================================= */}
        <footer className="mt-24 bg-[#030617]/95 border-t border-accent/20 relative">
          {/* GRID BG */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              opacity: 0.06,
              backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 39px, rgba(255,255,255,0.02) 40px),
                 repeating-linear-gradient(90deg, transparent 0px, transparent 39px, rgba(255,255,255,0.02) 40px)`,
              backgroundSize: "40px 40px",
              pointerEvents: "none",
            }}
          />

          <div className="relative container mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12 z-10">
            {/* COLUMN 1 — BRAND */}
            <div>
              <h2 className="text-accent text-3xl font-bold mb-3">
                AI-NIDS
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Adaptive AI-powered Network Intrusion Detection System built for
                real-time threat detection, flow intelligence, and cyber defense
                automation.
              </p>

              {/* Social Icons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() =>
                    window.open("https://github.com/yishu13", "_blank")
                  }
                  className="p-2 rounded-full border border-accent/40 hover:bg-accent/10 text-accent transition"
                >
                  {/* GitHub Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 .5C5.73.5.75 5.48.75 11.76c0 4.93 3.19 9.11 7.61 10.59.56.1.77-.24.77-.54 0-.27-.01-1-.02-1.96-3.09.67-3.74-1.49-3.74-1.49-.5-1.27-1.22-1.61-1.22-1.61-.99-.67.08-.66.08-.66 1.1.08 1.67 1.13 1.67 1.13.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.47-.28-5.07-1.24-5.07-5.49 0-1.21.43-2.2 1.13-2.98-.11-.28-.49-1.4.11-2.92 0 0 .92-.29 3.02 1.14 10.45 10.45 0 0 1 2.75-.37c.93.01 1.86.12 2.75.37 2.1-1.43 3.01-1.14 3.01-1.14.6 1.52.22 2.64.11 2.92.7.78 1.13 1.77 1.13 2.98 0 4.26-2.61 5.21-5.09 5.48.39.33.74.98.74 1.98 0 1.43-.01 2.58-.01 2.93 0 .3.2.65.78.54C19.06 20.87 22.25 16.69 22.25 11.76 22.25 5.48 17.27.5 12 .5z" />
                  </svg>
                </button>

                <button
                  onClick={() =>
                    window.open(
                      "https://www.linkedin.com/in/ayushrai13",
                      "_blank"
                    )
                  }
                  className="p-2 rounded-full border border-accent/40 hover:bg-accent/10 text-accent transition"
                >
                  {/* LinkedIn */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001zM3 9h4v12H3zM9 9h3.8v1.6h.1c.5-.9 1.8-1.9 3.7-1.9C21.2 8.7 22 10.9 22 14.1V21h-4v-6.1c0-1.6-.6-2.7-2-2.7-1.1 0-1.7.8-2 1.6-.1.2-.1.6-.1.9V21H9z" />
                  </svg>
                </button>

                <button
                  onClick={() => window.open("https://discord.com", "_blank")}
                  className="p-2 rounded-full border border-accent/40 hover:bg-accent/10 text-accent transition"
                >
                  {/* Discord */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 3H4C2.9 3 2 3.9 2 5v12c0 1.1.9 2 2 2h13l-1-3 2.5 1 2.5-1 1 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* COLUMN 2 */}
            <div>
              <h3 className="text-accent font-semibold mb-3 text-lg">
                Platform
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li
                  className="hover:text-accent cursor-pointer"
                  onClick={() => navigate("/livetraffic")}
                >
                  Live Traffic
                </li>
                <li
                  className="hover:text-accent cursor-pointer"
                  onClick={() => navigate("/alerts")}
                >
                  AI Alerts Engine
                </li>
                <li
                  className="hover:text-accent cursor-pointer"
                  onClick={() => navigate("/flow")}
                >
                  Flow Analyzer
                </li>
                <li
                  className="hover:text-accent cursor-pointer"
                  onClick={() => navigate("/reports")}
                >
                  Report Generator
                </li>
              </ul>
            </div>

            {/* COLUMN 3 */}
            <div>
              <h3 className="text-accent font-semibold mb-3 text-lg">
                Security Suite
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="hover:text-accent cursor-pointer">
                  Threat Intelligence
                </li>
                <li className="hover:text-accent cursor-pointer">
                  Anomaly Detection
                </li>
                <li className="hover:text-accent cursor-pointer">
                  Geo-IP Mapping
                </li>
                <li className="hover:text-accent cursor-pointer">
                  Packet Capture Engine
                </li>
              </ul>
            </div>

            {/* COLUMN 4 */}
            <div>
              <h3 className="text-accent font-semibold mb-3 text-lg">
                Resources
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="hover:text-accent cursor-pointer">
                  Documentation
                </li>
                <li className="hover:text-accent cursor-pointer">
                  API Reference
                </li>
                <li
                  className="hover:text-accent cursor-pointer"
                  onClick={() => navigate("/support")}
                >
                  Support Center
                </li>
                <li className="hover:text-accent cursor-pointer">
                  Community
                </li>
              </ul>
            </div>
          </div>

          {/* BADGES */}
          <div className="relative flex justify-center gap-6 py-4 z-10">
            <div className="w-12 h-12 bg-white/5 rounded-full border border-accent/25 flex items-center justify-center text-xs text-slate-300">
              SOC2
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-full border border-accent/25 flex items-center justify-center text-xs text-slate-300">
              ISO
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="border-t border-accent/10 py-4 text-center text-slate-500 text-sm relative z-10">
            © {new Date().getFullYear()} AI-NIDS • Adaptive Cyber Defense
            Framework
          </div>
        </footer>
      </div>

      {/* =========================================================
         FLOATING BACK-TO-TOP BUTTON (shows only after 300px)
      ========================================================= */}
      {showTop && (
        <button
          onClick={() => {
            const scrollContainer = document.querySelector(
              "main.flex-1.overflow-auto"
            );
            scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`
      fixed bottom-12 left-1/2 -translate-x-1/2
      z-[20000] w-16 h-16
      rounded-full flex items-center justify-center
      bg-gradient-to-br from-[#0ff] to-[#00a2ff] bg-opacity-20 backdrop-blur-xl
      border border-cyan-300/40
      shadow-[0_0_25px_rgba(0,229,255,0.45),0_0_45px_rgba(0,229,255,0.15)]
      hover:shadow-[0_0_35px_rgba(0,229,255,0.85),0_0_55px_rgba(0,229,255,0.35)]
      hover:scale-[1.18] hover:rotate-3
      transition-all duration-300 animate-[pulse_2s_infinite]
       overflow-hidden
    `}
        >
          <span
            className="
        absolute inset-0 rounded-full
        bg-gradient-to-r from-transparent via-white/40 to-transparent
        opacity-0 animate-[shine_2s_infinite]
      "
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_8px_#00eaff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19V5m0 0l-6 6m6-6l6 6"
            />
          </svg>
        </button>
      )}

      <ChatAssistant />
    </>
  );
}



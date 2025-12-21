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

const COLORS = ["#00e5ff", "#ff0059", "#a78bfa", "#fbbf24", "#10b981"];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [mlModels, setMlModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector("main.flex-1.overflow-auto");
    if (!scrollContainer) return;
    const handleScroll = () => {
      if (scrollContainer.scrollTop > 300) setShowTop(true);
      else setShowTop(false);
    };
    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

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
        {/* CYBER BACKGROUND */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ background: "linear-gradient(140deg, rgba(3,6,23,0.75) 0%, rgba(9,19,39,0.7) 40%, rgba(10,26,54,0.6) 75%, rgba(15,7,33,0.65) 100%)" }} />
          <div className="absolute inset-0 opacity-[0.035] mix-blend-screen" style={{ backgroundImage: "url('https://raw.githubusercontent.com/ayushatlas/assets/main/hexgrid/hexgrid-light.png')", backgroundSize: "350px" }} />
          <div className="absolute left-0 lg:left-10 top-40 w-[300px] lg:w-[450px] h-[300px] lg:h-[450px] bg-cyan-400/15 blur-[120px] lg:blur-[180px]" />
          <div className="absolute right-0 lg:right-10 top-10 w-[280px] lg:w-[420px] h-[280px] lg:h-[420px] bg-purple-500/12 blur-[120px] lg:blur-[180px]" />
        </div>

        {/* HERO HEADER */}
        <header className="relative mb-12 lg:mb-24">
          <div className="relative z-20 container mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-20 lg:pb-24 lg:ml-1">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              
              {/* LEFT TEXT */}
              <div className="space-y-6 lg:space-y-7 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="p-2 rounded-full border border-accent/50 shadow-neon">
                    <Shield size={20} className="text-accent" />
                  </div>
                  <span className="text-xs lg:text-sm text-slate-300/80 tracking-wide uppercase">
                    AstraGuard AI • Adaptive NIDS
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-[70px] lg:leading-[76px] font-extrabold tracking-tight"
                  style={{ textShadow: "0 0 30px rgba(0,229,255,0.75), 0 0 12px rgba(0,229,255,0.5)" }}>
                  <span className="text-accent">Protect</span> Your <br /> Systems
                </h1>

                <div className="w-full overflow-hidden opacity-50 lg:opacity-100">
                  <div className="neon-wave" />
                </div>

                <p className="text-slate-300/85 text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Our adaptive AI framework provides real-time packet inspection,
                  threat detection, and security analytics.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
                  <button onClick={() => navigate("/livetraffic")}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-accent text-black font-bold text-lg shadow-neon active:scale-95 transition">
                    Get Started
                  </button>
                  <button onClick={() => navigate("/threats")}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl border border-accent/40 text-accent text-lg hover:bg-accent/10 transition">
                    Learn more
                  </button>
                </div>
              </div>

              {/* RIGHT Floating Shield - Hidden on small mobile to save space */}
              <div className="relative w-full hidden sm:flex justify-center items-center h-[300px] lg:h-[420px]">
                <div className="relative w-[95%] lg:w-[90%] h-full rounded-3xl border border-accent/25 backdrop-blur-xl shadow-[0_0_40px_rgba(0,229,255,0.25)] overflow-hidden">
                  <NeonShield />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD PANEL */}
        <main className="container mx-auto px-4 lg:px-6 -mt-10 lg:-mt-20 relative z-30">
          <div className="glass-shell p-4 lg:p-6 rounded-3xl border border-accent/20 bg-black/40 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-accent/10 pb-4 mb-6 gap-2">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-accent flex items-center gap-2">
                  <Shield size={22} /> Cyber SOC Dashboard
                </h1>
                <p className="text-slate-300/70 text-xs lg:text-sm">
                  Real-time AI NIDS operations
                </p>
              </div>
            </div>

            {/* System + ML + Network - Stack on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
              <div className="cyber-card p-5 border border-accent/20 bg-accent/5">
                <h3 className="text-accent font-semibold mb-3 flex items-center gap-2">
                  <Cpu size={16} /> System Status
                </h3>
                {loading ? <p className="animate-pulse text-slate-500">Scanning...</p> : (
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex justify-between"><span>CPU Usage:</span> <span className="text-accent font-mono">{systemStats?.cpu_usage ?? "0"}%</span></li>
                    <li className="flex justify-between"><span>RAM Usage:</span> <span className="text-accent font-mono">{systemStats?.ram_usage ?? "0"}%</span></li>
                    <li className="flex justify-between"><span>Disk Usage:</span> <span className="text-accent font-mono">{systemStats?.disk_usage ?? "0"}%</span></li>
                  </ul>
                )}
              </div>

              <div className="cyber-card p-5 border border-accent/20 bg-accent/5">
                <h3 className="text-accent font-semibold mb-3 flex items-center gap-2">
                  <Activity size={16} /> ML Model Status
                </h3>
                {mlModels.length > 0 ? (
                  <ul className="text-sm text-slate-300 space-y-2">
                    {mlModels.map((m, i) => (
                      <li key={i} className="flex justify-between border-b border-white/5 pb-1 last:border-0">
                        <span>{m.name}</span>
                        <span className="text-accent font-mono">{m.accuracy ?? "98.2"}%</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-slate-500 text-xs">No models active</p>}
              </div>

              <div className="cyber-card p-5 border border-accent/20 bg-accent/5 md:col-span-2 lg:col-span-1">
                <h3 className="text-accent font-semibold mb-3 flex items-center gap-2">
                  <Wifi size={16} /> Network Health
                </h3>
                {threats.length > 0 ? (
                  <ul className="text-sm text-slate-300 space-y-2">
                    {threats.slice(0, 3).map((t, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="truncate mr-2">{t.name}</span>
                        <span className="text-rose-400 font-mono">{t.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-slate-500 text-xs">Awaiting traffic...</p>}
              </div>
            </div>

            {/* Charts - Stacks on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="cyber-card border border-accent/15 p-4 lg:p-5 h-[320px] lg:h-[380px]">
                <h3 className="text-accent mb-4 font-semibold text-sm lg:text-base uppercase tracking-wider">
                  Threat Class Distribution
                </h3>
                <div className="h-full pb-10">
                  {threats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={threats} dataKey="value" outerRadius="80%" innerRadius="60%" paddingAngle={5}>
                          {threats.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0)" />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#030617', border: '1px solid #00e5ff', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-slate-500">No Data</div>}
                </div>
              </div>

              <div className="cyber-card border border-accent/15 p-4 lg:p-5 h-[320px] lg:h-[380px]">
                <h3 className="text-accent mb-4 font-semibold text-sm lg:text-base uppercase tracking-wider">
                  Threat Count Overview
                </h3>
                <div className="h-full pb-10">
                  {threats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={threats}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(0,229,255,0.05)' }} contentStyle={{ backgroundColor: '#030617', border: '1px solid #00e5ff' }} />
                        <Bar dataKey="value" fill="#00e5ff" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-slate-500">Awaiting input</div>}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER - Now fully responsive */}
        <footer className="mt-24 bg-[#030617]/95 border-t border-accent/20 relative">
          <div className="relative container mx-auto px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 z-10 text-center sm:text-left">
            <div>
              <h2 className="text-accent text-2xl lg:text-3xl font-bold mb-3">AI-NIDS</h2>
              <p className="text-slate-400 text-sm leading-relaxed mx-auto sm:mx-0 max-w-xs">
                Adaptive AI-powered Network Intrusion Detection System built for real-time defense.
              </p>
              <div className="flex justify-center sm:justify-start gap-4 mt-6">
                 {/* Socials remain same but centered for mobile */}
                 <button onClick={() => window.open("https://github.com/yishu13", "_blank")} className="p-2 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.75 5.48.75 11.76c0 4.93 3.19 9.11 7.61 10.59.56.1.77-.24.77-.54 0-.27-.01-1-.02-1.96-3.09.67-3.74-1.49-3.74-1.49-.5-1.27-1.22-1.61-1.22-1.61-.99-.67.08-.66.08-.66 1.1.08 1.67 1.13 1.67 1.13.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.47-.28-5.07-1.24-5.07-5.49 0-1.21.43-2.2 1.13-2.98-.11-.28-.49-1.4.11-2.92 0 0 .92-.29 3.02 1.14 10.45 10.45 0 0 1 2.75-.37c.93.01 1.86.12 2.75.37 2.1-1.43 3.01-1.14 3.01-1.14.6 1.52.22 2.64.11 2.92.7.78 1.13 1.77 1.13 2.98 0 4.26-2.61 5.21-5.09 5.48.39.33.74.98.74 1.98 0 1.43-.01 2.58-.01 2.93 0 .3.2.65.78.54C19.06 20.87 22.25 16.69 22.25 11.76 22.25 5.48 17.27.5 12 .5z" /></svg>
                 </button>
                 <button onClick={() => window.open("https://www.linkedin.com/in/ayushrai13", "_blank")} className="p-2 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001zM3 9h4v12H3zM9 9h3.8v1.6h.1c.5-.9 1.8-1.9 3.7-1.9C21.2 8.7 22 10.9 22 14.1V21h-4v-6.1c0-1.6-.6-2.7-2-2.7-1.1 0-1.7.8-2 1.6-.1.2-.1.6-.1.9V21H9z" /></svg>
                 </button>
              </div>
            </div>

            {/* Footer columns: stack on small, 2x2 on medium */}
            <div className="hidden sm:block">
              <h3 className="text-accent font-semibold mb-3">Platform</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="hover:text-accent cursor-pointer" onClick={() => navigate("/livetraffic")}>Live Traffic</li>
                <li className="hover:text-accent cursor-pointer" onClick={() => navigate("/alerts")}>AI Alerts</li>
              </ul>
            </div>
            
            <div className="hidden lg:block">
              <h3 className="text-accent font-semibold mb-3">Security</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>Threat Intel</li>
                <li>Anomaly Detection</li>
              </ul>
            </div>

            <div className="hidden lg:block">
              <h3 className="text-accent font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>Documentation</li>
                <li>Support Center</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-accent/10 py-6 text-center text-slate-500 text-xs">
            © {new Date().getFullYear()} AI-NIDS • Adaptive Cyber Defense
          </div>
        </footer>
      </div>

      {/* FLOATING BACK-TO-TOP BUTTON */}
      {showTop && (
        <button
          onClick={() => {
            const scrollContainer = document.querySelector("main.flex-1.overflow-auto");
            scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="fixed bottom-6 lg:bottom-12 left-1/2 -translate-x-1/2 z-[200] w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center bg-accent/20 backdrop-blur-xl border border-accent/40 shadow-neon active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
          </svg>
        </button>
      )}

      <ChatAssistant />
    </>
  );
}


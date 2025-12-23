import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import {
  Shield, Cpu, Wifi, Activity, Github, Linkedin,
  Server, Terminal, Globe, Zap, AlertTriangle, Lock
} from "lucide-react";
import { X, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NeonShield from "../components/NeonShield";
import ChatAssistant from "./ChatAssistant";
import CicidsImg from "../assests/fig4_acc.png";
import BccImg from "../assests/fig3_loss.png";
import LiveImg from "../assests/dashboard.png";

const COLORS = ["#00e5ff", "#ff0059", "#a78bfa", "#fbbf24", "#10b981"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [mlModels, setMlModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [packetCount, setPacketCount] = useState(1240500);
  const [logs, setLogs] = useState([
    "[OK] Neural_Engine_Symmetry_Check... PASS",
    "[INFO] Establishing encrypted tunnel to Node_Alpha...",
    "[WARN] Anomalous handshake detected at Gateway_7"
  ]);

  // --- DATA FALLBACKS ---
  const dummyThreats = [
    { name: "DDOS", value: 45 }, { name: "MALWARE", value: 32 },
    { name: "PORT SCAN", value: 18 }, { name: "BRUTE FORCE", value: 12 }
  ];
  const displayThreats = threats.length > 0 ? threats : dummyThreats;
  const displayML = mlModels.length > 0 ? mlModels : [
    { name: "Neural_Kernel_v4", accuracy: 98.4 },
    { name: "Behavior_Pulse", accuracy: 96.2 },
    { name: "Heuristic_Lab", accuracy: 99.1 }
  ];

  // --- LOGIC: SIMULATED LIVE FEED ---
  useEffect(() => {
    const logInterval = setInterval(() => {
      const messages = [
        `[INFO] Packet scrutinized: ${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        `[OK] Filtered traffic from ${Math.floor(Math.random()*255)}.168.${Math.floor(Math.random()*255)}.1`,
        `[WARN] Latency spike in sector_${Math.floor(Math.random()*9)}`,
        `[SEC] Mitigated potential ${displayThreats[Math.floor(Math.random()*displayThreats.length)].name} attempt`
      ];
      setLogs(prev => [messages[Math.floor(Math.random()*messages.length)], ...prev].slice(0, 8));
      setPacketCount(prev => prev + Math.floor(Math.random() * 50));
    }, 3000);
    return () => clearInterval(logInterval);
  }, [displayThreats]);

  // --- 3D TILT LOGIC ---
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.setProperty('--rotateX', `${rotateX}deg`);
    card.style.setProperty('--rotateY', `${rotateY}deg`);
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.setProperty('--rotateX', `0deg`);
    e.currentTarget.style.setProperty('--rotateY', `0deg`);
  };

  const loadData = async () => {
    try {
      const [sys, ml, th] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/system/status").then(r => r.json()),
        fetch("http://127.0.0.1:5000/api/ml/models").then(r => r.json()),
        fetch("http://127.0.0.1:5000/api/live/stats").then(r => r.json()),
      ]);
      setSystemStats(sys);
      setMlModels(Array.isArray(ml) ? ml : []);
      setThreats(Object.entries(th || {}).map(([k, v]) => ({ name: k.toUpperCase(), value: v })));
      setIsSimulated(false);
    } catch (err) {
      setIsSimulated(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen text-slate-200 font-sans selection:bg-accent selection:text-black z-10">
      {/* 1. DYNAMIC BACKGROUND LAYER */}
<div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden bg-[#030617]">
  {/* The Grid Layer */}
  <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(var(--accent) 0.5px, transparent 0.5px)", backgroundSize: "40px 40px" }} />
  
  {/* NeonShield Moved Here: Positioned in the center-right behind the main panel */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] opacity-40 blur-[2px] -z-0 h-[800px]">
    <NeonShield />
  </div>

  {/* Ambient Glows */}
  <div className="absolute left-[-10%] top-[10%] w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full animate-pulse" />
  <div className="absolute right-[10%] bottom-[10%] w-[400px] h-[400px] bg-purple-500/10 blur-[150px] rounded-full animate-bounce" style={{ animationDuration: '10s' }} />
</div>

{/* 2. HERO SECTION - MURF.AI INSPIRED REDESIGN */}
<header className="relative  pb-20 lg:pt-12 lg:pb-20 overflow-hidden">
  <div className="container mx-auto px-6 lg:px-12 relative z-10">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      
      {/* LEFT COLUMN: THE CONTENT (6/12 Width) */}
      <div className="lg:col-span-7 text-center lg:text-left space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-accent/80">Neural_Engine_v4.0_Active</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl xl:text-9xl font-black tracking-tighter  leading-[0.85]">
  <span className=" text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-[#a78bfa] to-[#ff0059] drop-shadow-[0_0_30px_rgba(167,139,250,0.3)] italic ">Network</span> <br /></h1>
    <span className="text-transparent italic text-8xl bg-clip-text bg-gradient-to-r from-[#00e5ff] via-[#a78bfa] to-[#ff0059] drop-shadow-[0_0_30px_rgba(167,139,250,0.3)]">
    Intrusion
  </span>

        
        <p className="text-slate-400 text-lg md:text-xl font-mono leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-2 border-accent/20 pl-6 italic">
          &gt; Analyzing global packet telemetry in real-time. <br />
          &gt; Heuristic layers: <span className="text-emerald-400 font-bold">SYNCHRONIZED</span>
        </p>

        <div className="flex flex-wrap justify-center lg:justify-start gap-5 pt-4">
          <button 
            onClick={() => navigate("/livetraffic")} 
            className="px-10 py-5 bg-gradient-to-r border-white/10 border-2 from-accent to-blue-600 text-[var(--accent)] font-black uppercase tracking-tighter hover:scale-105 hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all duration-300 active:scale-95"
          >
            Live Traffic
          </button>
          <button 
            onClick={() => navigate("/threats")} 
            className="px-10 py-5 border-2 border-white/10 text-white font-black uppercase tracking-tighter hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all active:scale-95"
          >
            System Docs
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: TECHNICAL PERFORMANCE METRICS */}
<div className="lg:col-span-5 relative hidden lg:block hover:shadow-[0_0_40px_rgba(0,229,255,0.5)]">
  <div className="rounded-xl border border-indigo-500/30 bg-[#05091a] p-8 shadow-2xl font-mono relative overflow-hidden">
    
    {/* Header Area: Primary Model */}
    <div className="flex justify-between items-start mb-8 pb-6  border-indigo-500/30 border-b-4">
      <div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Architecture_01</div>
        <div className="text-2xl font-black text-white italic">DNN <span className="text-xs font-normal not-italic text-slate-500">/ Deep Neural Network</span></div>
      </div>
      <div className="text-right">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Benchmark</div>
        <div className="text-2xl font-black text-emerald-500 italic text-glow-sm">93%</div>
      </div>
    </div>

    {/* Dataset & Model Comparison Grid */}
    <div className="space-y-8">
      {/* CIC-IDS2018 Section */}
      <div className="space-y-3">
        <div className="flex justify-between text-[10px] uppercase">
          <span className="text-slate-400">Dataset: <span className="text-white">CIC-IDS2018</span></span>
          <span className="text-slate-500">Loss: 0.042</span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-slate-400 w-[93%]" />
        </div>
      </div>

      {/* LightGBM / BCC Darknet Section */}
      <div className="pt-4 border-t-4 border-indigo-500/30 ">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Architecture_02</div>
            <div className="text-xl font-bold text-white uppercase italic tracking-tighter">LightGBM</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">BCC_Darknet</div>
            <div className="text-xl font-bold text-accent italic">96%</div>
          </div>
        </div>
        <div className="h-1.5 w-full bg-orange-500 rounded-full overflow-hidden">
          <div className="h-full bg-accent w-[90%]" />
        </div>
      </div>
    </div>

    {/* Technical Footer: Training Metadata */}
    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 pb-4 border-t-4 border-indigo-500/30 border-b-4">
      <div className="space-y-1 text-left ">
        <div className="text-slate-500 uppercase text-[10px]">Input_Vector</div>
        <div className="text-white font-bold tracking-widest font-mono italic">SHAPE(None, 78)</div>
      </div>
      <div className="space-y-1 text-right">
        <div className="text-slate-500 uppercase text-[10px]">Optimization</div>
        <div className="text-white font-bold tracking-widest font-mono italic">ADAM_GRADIENT</div>
      </div>
    </div>

    {/* Final Console Output */}
    <div className="mt-6 p-3 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-slate-600">
      <div className="flex gap-2">
        <span className="text-blue-500">[SYS]</span> 
        Initializing Multi-Layer Perceptron... 
      </div>
      <div className="flex gap-2 animate-pulse">
        <span className="text-emerald-500">[OK]</span> 
        Weights Loaded Successfully.
      </div>
    </div>
  </div>
</div>
</div>
  </div>
</header>

{/* 2.5 PROJECT INSIGHT (The "Murf" Style Section) */}
<section className="container mx-auto px-6 mb-24 relative z-10">
  <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0a0f29] to-[#030617] border border-white/5 p-10 md:p-20 shadow-2xl">
    
    {/* Visual Accent: Soft Glow */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />

    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <div>
          <h4 className="text-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-4">Development_Project</h4>
          <h2 className="text-4xl md:text-6xl font-black text-orange-500 leading-[1.1] italic uppercase tracking-tighter">
            Transparent <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-slate-500">Security Insight</span>
          </h2>
        </div>

        <p className="text-slate-400 text-lg font-mono leading-relaxed max-w-xl">
          AstraGuard simplifies complex network telemetry into a unified visual experience. 
          By monitoring live traffic flows and applying baseline heuristic analysis, we help 
          identify patterns and common threat vectors.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => window.open("https://github.com/yishu13")}
            className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-tighter hover:bg-accent transition-all duration-300"
          >
            <Github size={20} />
            <span>GitHub</span>
          </button>

          <button 
            onClick={() => window.open("https://huggingface.co")}
            className="group flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-bold uppercase tracking-tighter hover:bg-white/5 transition-all duration-300"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🤗</span>
            <span>Hugging Face</span>
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Visual Element */}
      <div className="relative hidden lg:block">
        <div className="relative z-10 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl border-t-accent/30">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Astra_Shield_v1.0</div>
          </div>
          
          <div className="space-y-6">
            <div className="h-2 w-3/4 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent animate-pulse w-[65%]" />
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent/40 w-[40%]" />
            </div>
            <div className="pt-4 border-t border-white/5">
               <div className="text-[10px] font-mono text-accent uppercase mb-2">Neural_Engine_Status</div>
               <div className="text-2xl font-mono text-white">98.2% <span className="text-[10px] text-slate-500 uppercase">Accuracy</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* 3. TACTICAL INFO BAR (DENSITY ADDITION) */}
      <div className="container mx-auto px-6 -mt-30 mb-20 grid grid-cols-2 md:grid-cols-4 gap-4 z-40 relative">
        {[
          { label: "Packets Scanned", val: packetCount.toLocaleString(), icon: <Globe size={16}/> },
          { label: "Uptime", val: "99.98%", icon: <Activity size={16}/> },
          { label: "Threats Blocked", val: "12,402", icon: <Shield size={16}/> },
          { label: "Nodes Active", val: "24/24", icon: <Server size={16}/> }
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/60 backdrop-blur-xl group hover:border-accent/50 transition-all text-[var(--accent)]">
            <div className="flex items-center gap-3 text-[var(--accent)] mb-2">
              {item.icon} <span className=" uppercase font-bold text-orange-600 tracking-widest">{item.label}</span>
            </div>
            <div className="text-xl font-mono font-bold text-[var(--accent)] group-hover:text-accent transition-colors">{item.val}</div>
          </div>
        ))}
      </div>

        {/* 3.5 FEATURE SPOTLIGHT SECTION */}
<section className="container mx-auto px-6 mb-20 relative z-10">
  <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0a0f29] to-[#030617] border border-white/5 p-8 md:p-16">
    
    {/* Background Decorative Glow */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -mr-64 -mt-64" />

    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h4 className="text-accent font-mono text-xs uppercase tracking-[0.4em] mb-4">Astra_Studio_v1</h4>
        <h2 className="text-4xl md:text-5xl font-black  leading-tight mb-6 italic uppercase text-[var(--accent)] ">
          Network Intrusion  <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500"> Based On Two Dataset </span>
        </h2>
        <p className="text-slate-400 text-lg font-mono mb-10 leading-relaxed">
          Transition from raw data to actionable intelligence using our Neural Interface. 
    Visualize live traffic flows and utilize baseline heuristic models to categorize 
    network activity and identify common threat vectors.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => window.open("https://github.com/ayu-yishu13")}
            className="px-8 py-4 bg-white text-black font-black uppercase tracking-tighter hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <Github size={18} /> Github
          </button>
          <button 
            onClick={() => window.open("https://huggingface.co/CodebaseAi")}
            className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-tighter hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <span className="text-xl">🤗</span> Hugging Face
          </button>
        </div>
      </div>

      {/* The "Visual Card" - Mimicking the Murf.ai right side */}
      <div className="relative">
        <div className="relative z-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-2 shadow-2xl">
           <img 
             src="/path-to-your-ui-preview.png" 
             alt="Interface Preview" 
             className="rounded-xl opacity-80"
           />
        </div>
        {/* Floating "Magic" Card */}
        <div className="absolute -bottom-6 -left-6 z-20 w-48 p-4 rounded-xl border border-accent/30 bg-[#030617] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
             <span className="text-[10px] font-mono text-slate-400">Neural_Sync</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-accent w-3/4" />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
          {/* 3. TECHNICAL IMPLEMENTATION - FIGMA INSPIRED */}
      <section className="container mx-auto px-6 mb-24 relative z-10">
        <div className="mb-12">
          <h3 className="text-5xl italic font-bold uppercase tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-slate-500">
            Technical Implementation
          </h3>
          <div className="h-1 w-12 bg-slate-700" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { img: CicidsImg, title: "Model Validation", label: "93% ACCURACY", color: "text-emerald-500", desc: "Performance metrics for the Deep Neural Network (DNN) trained on the CIC-IDS2018 dataset.", num: "01" },
            { img: LiveImg, title: "Packet Ingestion", label: "REAL-TIME", color: "text-cyan-400", desc: "Visualization of incoming flow features before classification by the LightGBM engine.", num: "02" },
            { img: BccImg, title: "Darknet Analysis", label: "96% ACCURACY", color: "text-amber-500", desc: "Identifying malicious patterns using the BCC Darknet dataset with ensemble learning.", num: "03" }
          ].map((item, i) => (
            <div 
              key={i} 
              className="group relative cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => setSelectedInsight(item)}
              style={{
                transform: 'perspective(1000px) rotateX(var(--rotateX, 0deg)) rotateY(var(--rotateY, 0deg))',
                transition: 'transform 0.1s ease-out',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Subtle Background Glow */}
              <div className="absolute -inset-2 bg-gradient-to-b from-slate-800/50 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative space-y-4 pointer-events-none">
                <div className="relative aspect-video rounded-xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-500 group-hover:-translate-y-2">
                  
                  {/* Window Top Bar */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-white/5 border-b border-white/5 flex items-center px-3 gap-1.5 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    <span className="text-[8px] font-mono text-slate-500 ml-2 uppercase tracking-widest">nids_module_{item.num}.sys</span>
                  </div>

                  <img 
                    src={item.img}
                    alt={item.title} 
                    className="object-cover w-full h-full mt-6 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 opacity-60 group-hover:opacity-100"
                  />

                  <div className={`absolute bottom-3 right-3 px-3 py-1 backdrop-blur-md bg-black/40 rounded-full text-[9px] font-black ${item.color} border border-white/10 shadow-xl`}>
                    {item.label}
                  </div>

                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-1/2 w-full -translate-y-full group-hover:animate-[scan_2s_linear_infinite]" />
                </div>

                <div className="px-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-600">{item.num}</span>
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">{item.title}</h4>
                  </div>
                  <p className="text-slate-500 text-[11px] font-mono leading-relaxed group-hover:text-slate-400 transition-colors">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 4. PRIMARY DASHBOARD PANEL */}
      <main className="container mx-auto px-4 lg:px-6 pb-20 relative z-10">
        <div className="glass-shell p-6 lg:p-10 rounded-[2rem] border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          
          {/* Subtle Corner Deco */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />

          {/* Section: Status & Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            
            {/* System Resource Gauges */}
            <div className="lg:col-span-4 space-y-8 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Cpu size={14} /> Neural Load
                </h3>
                <span className="text-[8px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Nominal</span>
              </div>
              
              {[
                { label: "Cortex Processing", val: systemStats?.cpu_usage ?? (isSimulated ? "32" : "0") },
                { label: "Synaptic Memory", val: systemStats?.ram_usage ?? (isSimulated ? "54" : "0") },
                { label: "Buffer Capacity", val: systemStats?.disk_usage ?? (isSimulated ? "18" : "0") }
              ].map((s, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400">
                    <span>{s.label}</span>
                    <span className="text-accent">{s.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-blue-500 transition-all duration-1000 shadow-[0_0_10px_var(--accent)]" style={{ width: `${s.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Model Intelligence */}
            <div className="lg:col-span-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <Activity size={14} /> Logic Core Confidence
              </h3>
              <div className="space-y-4">
                {displayML.map((m, i) => (
                  <div key={i} className="group flex justify-between items-center p-3 rounded-xl border border-white/5 bg-black/20 hover:border-accent/30 transition-all">
                    <span className="text-xs font-mono text-slate-300 italic">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${m.accuracy}%` }} />
                      </div>
                      <span className="text-emerald-400 font-mono text-xs">{m.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Threat Feed */}
            <div className="lg:col-span-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <AlertTriangle size={14} /> Priority Intercepts
              </h3>
              <div className="space-y-3">
                {displayThreats.slice(0, 3).map((t, i) => (
                  <div key={i} className="group relative flex justify-between items-center p-3 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 transition-all">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Type_{t.name}</div>
                      <div className="text-rose-400 font-bold text-sm tracking-tight">{t.value} Attempts</div>
                    </div>
                    <button className="p-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded transition-all active:scale-90">
                      <Lock size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
              <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8">Classification Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={displayThreats} dataKey="value" outerRadius="100%" innerRadius="75%" paddingAngle={10}>
                      {displayThreats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #00e5ff', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
              <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8">Temporal Analysis</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayThreats}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.03} vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} tick={{ fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section: The Live Terminal Feed */}
          <div className="rounded-2xl border border-white/5 bg-black/80 p-5 font-mono">
            <div className="flex items-center gap-2 mb-4 text-accent/60">
              <Terminal size={14} />
              <span className="text-[10px] uppercase tracking-[0.4em]">Root@NIDS_AstraGuard:~# Live_Feed</span>
            </div>
            <div className="space-y-1 h-32 overflow-hidden flex flex-col-reverse">
              {logs.map((log, i) => (
                <div key={i} className={`text-[11px] ${log.includes('[WARN]') ? 'text-amber-500' : log.includes('[SEC]') ? 'text-rose-500' : 'text-slate-500'}`}>
                   {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-24 border-t border-white/5 bg-[#030617] py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-6 group cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/40 flex items-center justify-center group-hover:bg-accent group-hover:text-orange-700 text-accent transition-all">
                  <Shield size={20} />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">AI-NIDS</h2>
              </div>
              <p className="text-slate-500 font-mono text-[10px] uppercase leading-relaxed mb-8 max-w-sm">
    <span className="text-accent/60 font-bold">// ENCRYPTED SESSION ACTIVE</span> <br />
    AstraGuard is a decentralized neural defense platform monitoring global packet telemetry. 
    Neural-layer packet filtering enabled via Secure_V4 Protocol. 
    Heuristic mitigation active across 24 edge nodes.
  </p>
              <div className="flex gap-4 text-accent">
                <button onClick={() => window.open("https://github.com/yishu13")} className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:border-accent transition-all text-slate-400 hover:text-accent">
                  <Github size={20} />
                </button>
                <button onClick={() => window.open("https://linkedin.com/in/ayushrai13")} className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:border-accent transition-all text-slate-400 hover:text-accent">
                  <Linkedin size={20} />
                </button>
              </div>
            </div>
            
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {[
                { title: "Network", links: ["Live Traffic", "AI Alerts", "Protocol Analysis"] },
                { title: "Intelligence", links: ["Threat Maps", "Core Logs", "ML Training"] },
                { title: "Support", links: ["Documentation", "API Spec", "Whitepaper"] }
              ].map((group, i) => (
                <div key={i}>
                  <h4 className="text-accent text-[10px] font-black uppercase tracking-widest mb-6 italic">{group.title}</h4>
                  <ul className="space-y-4">
                    {group.links.map((link, j) => (
                      <li key={j} className="text-xs text-slate-500 hover:text-white cursor-pointer transition-colors font-mono">&gt; {link}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">Global_Status: Online</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">
              © {new Date().getFullYear()} ASTRAGUARD // PROTOCOL_V.04
            </div>
          </div>
        </div>
      </footer>

      <ChatAssistant />

      {/* FULL SCREEN TECHNICAL INSPECTION MODAL */}
{selectedInsight && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
    {/* Backdrop with Figma-style heavy blur */}
    <div 
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
      onClick={() => setSelectedInsight(null)}
    />

    <div className="relative w-full max-w-6xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row animate-in slide-in-from-top-8 duration-500">
      
      {/* Close Button */}
      <button 
        onClick={() => setSelectedInsight(null)}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-rose-500/20 text-white rounded-full transition-colors"
      >
        <X size={24} />
      </button>

      {/* Left Side: Large Image View */}
      <div className="flex-[2] bg-black flex items-center justify-center relative overflow-hidden group">
        <img 
          src={selectedInsight.img} 
          className="w-full h-full object-contain" 
          alt="Technical Detail" 
        />
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Right Side: Technical Annotations & Metadata */}
      <div className="flex-1 p-8 border-l border-white/10 flex flex-col justify-between bg-slate-900/50">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <ShieldAlert className="text-cyan-400" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-tighter">System Inspection</p>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">{selectedInsight.title}</h3>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h5 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Detailed Analysis</h5>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "{selectedInsight.desc}"
              </p>
            </div>

            {/* Mock Technical Data Points */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase">Confidence Score</p>
                <p className={`text-lg font-bold ${selectedInsight.color}`}>{selectedInsight.label}</p>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase">Process ID</p>
                <p className="text-lg font-bold text-white font-mono">PID_992{selectedInsight.num}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
          <button className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-widest transition-all">
            Download Log
          </button>
          <button 
            onClick={() => setSelectedInsight(null)}
            className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
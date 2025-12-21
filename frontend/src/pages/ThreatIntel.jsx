import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { 
  Shield, Lock, EyeOff, Globe2, Server, FileWarning, 
  Cpu, Zap, GitPullRequest, Key, Database, CloudSnow, 
  AlertTriangle, Globe, Search 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import "react-circular-progressbar/dist/styles.css";

// Assets
import vpnImg from "../assests/vpn.jpg";
import torImg from "../assests/tor.png";
import i2pImg from "../assests/i2p.png";
import freenetImg from "../assests/freenet.png";
import zeronetImg from "../assests/zeronet.png";
import hulkImg from "../assests/Dos_Attacks-hulk.jpeg";
import slowlorisImg from "../assests/Slowloris_DDOS.png";
import httpImg from "../assests/Dos-HTTPtest.jpg";
import bruteforceImg from "../assests/BTUTEFORCE.png";
import hoic from "../assests/HOIC.jpeg";
import loic from "../assests/LOic.jpeg";
import sql from "../assests/sql.jpeg";
import web from "../assests/web.jpeg";
import xss from "../assests/XXs.png";
import ChatAssistant from "./ChatAssistant";

// ---------- BCC threats ----------
const THREATS_BCC = {
  VPN: {
    title: "Virtual Private Network (VPN)",
    desc: "VPNs create an encrypted tunnel between client and server, hiding source IPs and traffic content. Attackers use VPNs to evade detection and obfuscate origin.",
    icon: <Shield size={44} className="text-[var(--accent)]" />,
    image: vpnImg,
    risk: "Medium",
    usage: "Seen across many evasive campaigns",
  },
  TOR: {
    title: "The Onion Router (TOR)",
    desc: "TOR anonymizes traffic using layered encryption across relays; it is commonly used for command-and-control and data exfiltration.",
    icon: <Lock size={44} className="text-[var(--accent)]" />,
    image: torImg,
    risk: "High",
    usage: "Common in targeted anonymity usage",
  },
  I2P: {
    title: "Invisible Internet Project (I2P)",
    desc: "I2P aims for anonymous P2P connections and is used by advanced threat actors for hidden data transfer.",
    icon: <EyeOff size={44} className="text-[var(--accent)]" />,
    image: i2pImg,
    risk: "High",
    usage: "Used in selected APT scenarios",
  },
  FREENET: {
    title: "Freenet",
    desc: "Freenet is a decentralized file-sharing network sometimes used for hosting malicious payloads and leaked data.",
    icon: <Server size={44} className="text-[var(--accent)]" />,
    image: freenetImg,
    risk: "Medium",
    usage: "Occasional in malware hosting",
  },
  ZERONET: {
    title: "ZeroNet",
    desc: "ZeroNet leverages Bitcoin identities and BitTorrent protocols for decentralized websites.",
    icon: <Globe2 size={44} className="text-[var(--accent)]" />,
    image: zeronetImg,
    risk: "Medium",
    usage: "Seen in hacktivist operations",
  },
};

// ---------- CICIDS threats ----------
const THREATS_CICIDS = {
  "Benign": {
    title: "Benign Traffic",
    desc: "Normal, expected network activity produced by legitimate users and services.",
    icon: <Globe size={44} className="text-[var(--accent)]" />,
    risk: "Low",
    usage: "Baseline traffic in datasets",
  },
  "DoS – Hulk": {
    title: "DoS – Hulk",
    desc: "HULK floods web servers with unique HTTP requests to exhaust resources using randomized parameters.",
    icon: <Zap size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: hulkImg,
    usage: "Common DoS web attack",
  },
  "DoS – SlowHTTPTest": {
    title: "DoS – SlowHTTPTest",
    desc: "Holds connections open by sending headers/data very slowly to exhaust server connection slots.",
    icon: <FileWarning size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: httpImg,
    usage: "Low-and-slow DoS tool",
  },
  "DoS – GoldenEye": {
    title: "DoS – GoldenEye",
    desc: "Application-layer DoS that sends malicious HTTP traffic to overwhelm servers.",
    icon: <Cpu size={44} className="text-[var(--accent)]" />,
    risk: "High",
    usage: "Application-layer DoS",
  },
  "DoS – Slowloris": {
    title: "DoS – Slowloris",
    desc: "Sends partial HTTP headers to keep many connections open and starve web servers of resources.",
    icon: <Key size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: slowlorisImg,
    usage: "Low-volume DoS technique",
  },
  "FTP – BruteForce": {
    title: "FTP – BruteForce",
    desc: "Repeatedly trying username/password combinations to gain access to FTP services.",
    icon: <GitPullRequest size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: bruteforceImg,
    usage: "Credential brute-forcing",
  },
  "SSH – BruteForce": {
    title: "SSH – BruteForce",
    desc: "SSH brute-force attacks attempt many credential combinations to gain shell access.",
    icon: <Lock size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: bruteforceImg,
    usage: "Common remote-access attack",
  },
  "DDoS – HOIC": {
    title: "DDoS – HOIC",
    desc: "Volumetric DDoS tool generating massive concurrent HTTP requests to disrupt services.",
    icon: <CloudSnow size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: hoic,
    usage: "Volumetric DDoS campaigns",
  },
  "DDoS – LOIC UDP": {
    title: "DDoS – LOIC UDP",
    desc: "Generates UDP floods that saturate link bandwidth and cause service interruption.",
    icon: <Zap size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: loic,
    usage: "UDP flood DDoS",
  },
  "Brute Force – Web": {
    title: "Brute Force – Web",
    desc: "Targets web login endpoints or weak authentication mechanisms to gain access.",
    icon: <AlertTriangle size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: web,
    usage: "Application-level credential attacks",
  },
  "Brute Force – XSS": {
    title: "Brute Force – XSS",
    desc: "Web attack attempts focusing on injection-like payloads and attempted exploitation.",
    icon: <FileWarning size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: xss,
    usage: "Web exploitation attempts",
  },
  "SQL Injection": {
    title: "SQL Injection",
    desc: "Attack where user-supplied data manipulates backend SQL queries to steal data.",
    icon: <Database size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: sql,
    usage: "Critical web exploit",
  },
  "Infiltration": {
    title: "Infiltration",
    desc: "Multi-stage intrusion where attackers establish footholds and move laterally.",
    icon: <Shield size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: xss,
    usage: "APT-style lateral movement",
  },
  "Bot": {
    title: "Bot Activity",
    desc: "Automated traffic including scraping, credential stuffing, or crawler-like behaviour.",
    icon: <Globe size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: web,
    usage: "Automated misuse",
  },
};

const makeChartDataFromCounts = (counts) =>
  Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));

const CICIDS_COUNTS = {
  BENIGN: 40000, Bot: 8000, "DoS attacks-Hulk": 8000, 
  "DoS attacks-SlowHTTPTest": 8000, Infilteration: 8000, 
  "DoS attacks-GoldenEye": 8000, "DoS attacks-Slowloris": 8000, 
  "FTP-BruteForce": 8000, "SSH-Bruteforce": 8000, 
  "DDOS attack-HOIC": 8000, "DDOS attack-LOIC-UDP": 1730, 
  "Brute Force -Web": 611, "Brute Force -XSS": 230, "SQL Injection": 87,
};

export default function ThreatIntelInteractive() {
  const [mode, setMode] = useState("bcc");
  const [selected, setSelected] = useState("VPN");
  const [compare, setCompare] = useState("TOR");
  const [query, setQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [showQuizResult, setShowQuizResult] = useState(null);

  const navigate = useNavigate();

  const threats = mode === "bcc" ? THREATS_BCC : THREATS_CICIDS;
  const keys = useMemo(() => Object.keys(threats), [threats]);

  React.useEffect(() => {
    setSelected((prev) => (keys.includes(prev) ? prev : keys[0]));
    setCompare((prev) => (keys.includes(prev) ? prev : keys[1] || keys[0]));
  }, [mode, keys]);

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const t = threats[k];
      const matchQuery = t.title.toLowerCase().includes(query.toLowerCase()) || k.toLowerCase().includes(query.toLowerCase());
      const matchRisk = filterRisk === "All" || t.risk === filterRisk;
      return matchQuery && matchRisk;
    });
  }, [query, filterRisk, threats, keys]);

  const threat = threats[selected] || {};
  const compareThreat = threats[compare] || {};
  const chartData = mode === "cicids" ? makeChartDataFromCounts(CICIDS_COUNTS).slice(0, 8) : [];

  const quizQuestions = {
    ...(mode === "bcc"
      ? {
          VPN: { question: "VPNs primarily encrypt traffic at which layer?", answer: "Network" },
          TOR: { question: "TOR hidden services use which TLD?", answer: ".onion" },
          I2P: { question: "I2P's routing technique is commonly called?", answer: "Garlic Routing" },
          FREENET: { question: "Freenet is primarily used for?", answer: "Decentralized file sharing" },
          ZERONET: { question: "ZeroNet commonly pairs with which crypto identity?", answer: "Bitcoin" },
        }
      : {
          Benign: { question: "Benign traffic indicates what?", answer: "Normal" },
          "DoS – Hulk": { question: "HULK targets which layer?", answer: "Application" },
          "DoS – SlowHTTPTest": { question: "SlowHTTPTest is what type of DoS?", answer: "Low-and-slow" },
          "DoS – GoldenEye": { question: "GoldenEye targets which service type?", answer: "Web" },
          "DoS – Slowloris": { question: "Slowloris attempts to exhaust which server resource?", answer: "Connections" },
          "FTP – BruteForce": { question: "FTP brute-force aims to obtain what?", answer: "Credentials" },
          "SSH – BruteForce": { question: "SSH brute-force usually targets which service?", answer: "SSH" },
          "DDoS – HOIC": { question: "HOIC is primarily what kind of attack?", answer: "Volumetric" },
          "DDoS – LOIC UDP": { question: "LOIC UDP generates what traffic?", answer: "UDP flood" },
          "Brute Force – Web": { question: "Web brute force targets which endpoint?", answer: "Login" },
          "Brute Force – XSS": { question: "XSS brute attempts to inject what?", answer: "Script" },
          "SQL Injection": { question: "SQL Injection attacks target which backend?", answer: "Database" },
          Infiltration: { question: "Infiltration often leads to what stage?", answer: "Lateral movement" },
          Bot: { question: "Bot activity is typically automated or manual?", answer: "Automated" },
        }),
  };

  const handleQuizSubmit = () => {
    const q = quizQuestions[selected];
    if (!q) return;
    const correct = quizAnswer.trim().toLowerCase() === q.answer.toLowerCase();
    setShowQuizResult({ correct });
    setTimeout(() => setShowQuizResult(null), 2500);
  };

  return (
    // Replace the opening div and header section with this:
<div className="min-h-screen bg-transparent text-slate-200 p-4 md:p-8 lg:-ml-10 pt-20 lg:pt-10 relative overflow-x-hidden">
  {/* Subtle background glow */}
  <div className="absolute inset-0 pointer-events-none"
    style={{ background: "radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.03) 0%, transparent 70%)" }} />

  {/* Header Section */}
  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10">
    <div>
      <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text filter drop-shadow-[0_0_8px_rgba(0,229,255,0.2)]">
        Threat Intelligence
      </h1>
      <div className="flex items-center gap-2 mt-2">
         <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
         <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">
           Active Database: {mode === 'bcc' ? 'BCC-HTTP-2019' : 'CIC-IDS-2017'}
         </p>
      </div>
    </div>
    <button onClick={() => navigate(`/flow?type=${encodeURIComponent(selected)}`)}
      className="px-6 py-2 bg-transparent border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/10 transition-all font-bold text-xs uppercase tracking-widest">
      Initialize Flow Analysis
    </button>
  </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="flex gap-2">
          {["bcc", "cicids"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded border text-xs font-bold transition-all uppercase ${mode === m ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]" : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600"}`}>
              {m} View
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="FILTER THREATS..." value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-black/60 border border-slate-800 pl-10 pr-4 py-2 rounded text-sm text-cyan-400 outline-none focus:border-cyan-500/50 transition-all" />
          </div>
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-black/60 border border-slate-800 px-3 py-2 rounded text-xs text-slate-400 outline-none">
            <option>All Risks</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
      </div>

      {/* Selection Row */}
      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
        {filteredKeys.map((key) => (
          <button key={key} onClick={() => setSelected(key)}
            className={`px-3 py-1.5 rounded border text-[10px] font-mono transition-all ${selected === key ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-black/20 border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            {key}
          </button>
        ))}
      </div>

      {/* Main Analysis Terminal */}
      <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.01}>
        <div className="bg-black/40 border border-slate-800 rounded-xl p-6 mb-6 relative overflow-hidden backdrop-blur-sm">
           <div className="absolute top-0 right-0 p-4 opacity-2">{threat.icon}</div>
           <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-32 h-32 flex-shrink-0">
                <CircularProgressbar 
                  value={threat.risk === "High" ? 90 : threat.risk === "Medium" ? 65 : 35} 
                  text={threat.risk} 
                  styles={buildStyles({ pathColor: "#06b6d4", textColor: "#06b6d4", trailColor: "#1e293b", textSize: '16px' })} 
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{threat.title}</h2>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base border-l-2 border-cyan-500/30 pl-4">
                  {threat.desc}
                </p>
                <div className="mt-4 inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-500 uppercase tracking-tighter">
                  Intelligence Source: {threat.usage}
                </div>
              </div>
           </div>
        </div>
      </Tilt>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="bg-black/40 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Compare Module</h4>
            <select value={compare} onChange={(e) => setCompare(e.target.value)} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px] text-cyan-400">
              {keys.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <h5 className="text-cyan-400 font-bold mb-1">{compareThreat.title}</h5>
          <p className="text-slate-500 text-xs leading-relaxed">{compareThreat.desc?.substring(0, 180)}...</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/20 to-black/40 border border-cyan-500/20 rounded-xl p-6 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} className="fill-cyan-400" /> Analyst Verification</h4>
          <p className="text-slate-300 text-sm mb-4 italic">"{(quizQuestions[selected] && quizQuestions[selected].question) || "Select a threat to begin verification."}"</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Enter response..." value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)} className="flex-1 bg-black/60 border border-slate-800 rounded px-4 py-2 text-sm text-cyan-400 focus:border-cyan-500/50 outline-none" />
            <button onClick={handleQuizSubmit} className="px-6 py-2 bg-cyan-500 text-black font-bold rounded text-xs uppercase hover:bg-cyan-400 transition-colors">Verify</button>
          </div>
          <AnimatePresence>
            {showQuizResult !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
                className={`mt-4 text-center py-2 rounded text-[10px] font-bold tracking-widest uppercase border ${showQuizResult.correct ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-rose-500/10 border-rose-500/50 text-rose-400"}`}>
                {showQuizResult.correct ? "Identity Confirmed: Access Granted" : `Access Denied: Required Key "${quizQuestions[selected]?.answer}"`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="mt-12 opacity-50"><ChatAssistant /></div>
    </div>
  );
}



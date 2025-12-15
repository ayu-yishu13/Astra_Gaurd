// src/pages/ThreatIntelSwitcher.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { Shield, Lock, EyeOff, Globe2, Server, FileWarning, Cpu, Zap, GitPullRequest, Key, Database, CloudSnow, AlertTriangle, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import "react-circular-progressbar/dist/styles.css";

// optional images — replace paths if needed
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



/*
 ThreatIntelSwitcher.jsx
 - Two modes: BCC (your existing) and CICIDS (new)
 - Hybrid naming for CICIDS (Option C)
 - Comparison + Quiz present for both datasets
 - Styling kept identical to your BCC page
*/

// ---------- BCC threats (existing simplified) ----------
const THREATS_BCC = {
  VPN: {
    title: "Virtual Private Network (VPN)",
    desc:
      "VPNs create an encrypted tunnel between client and server, hiding source IPs and traffic content. Attackers use VPNs to evade detection and obfuscate origin. Many malicious flows appear as legitimate VPN traffic and can hide beaconing patterns. Look for unusual geo-locations or sudden new endpoints in VPN sessions. Combine host telemetry + flow analysis to find misuse.",
    icon: <Shield size={44} className="text-[var(--accent)]" />,
    image: vpnImg,
    risk: "Medium",
    usage: "Seen across many evasive campaigns",
  },
  TOR: {
    title: "The Onion Router (TOR)",
    desc:
      "TOR anonymizes traffic using layered encryption across relays; it is commonly used for command-and-control and data exfiltration. TOR exit nodes change frequently so detection relies on known relay lists or traffic fingerprinting. High-risk for ransomware or darknet tool delivery. Often paired with secondary obfuscation such as tunneling. Monitor long-lived connections and unusual destination ports.",
    icon: <Lock size={44} className="text-[var(--accent)]" />,
    image: torImg,
    risk: "High",
    usage: "Common in targeted anonymity usage",
  },
  I2P: {
    title: "Invisible Internet Project (I2P)",
    desc:
      "I2P aims for anonymous P2P connections and is used by advanced threat actors for hidden data transfer. Because it uses different protocols than TOR, detection is harder and relies on signature-based patterns or known endpoint lists. Expect intermittent bursts of traffic and P2P-like flows. Treat as high suspicion and correlate with host artifacts.",
    icon: <EyeOff size={44} className="text-[var(--accent)]" />,
    image: i2pImg,
    risk: "High",
    usage: "Used in selected APT scenarios",
  },
  FREENET: {
    title: "Freenet",
    desc:
      "Freenet is a decentralized file-sharing network sometimes used for hosting malicious payloads and leaked data. Traffic can be noisy; detection focuses on unusual download/exfil patterns and unfamiliar peers. Risk is moderate but can be a vector for persistent malware propagation. Use endpoint file scanning to complement network indicators.",
    icon: <Server size={44} className="text-[var(--accent)]" />,
    image: freenetImg,
    risk: "Medium",
    usage: "Occasional in malware hosting",
  },
  ZERONET: {
    title: "ZeroNet",
    desc:
      "ZeroNet leverages Bitcoin identities and BitTorrent protocols for decentralized websites — used by hacktivists and for anonymous content hosting. Traffic fingerprints often include torrent-like handshakes and irregular port usage. Treat connections to ZeroNet peers with caution and cross-check with threat intel feeds.",
    icon: <Globe2 size={44} className="text-[var(--accent)]" />,
    image: zeronetImg,
    risk: "Medium",
    usage: "Seen in hacktivist operations",
  },
};

// ---------- CICIDS threats (14 classes, hybrid naming - Option C) ----------
const THREATS_CICIDS = {
  "Benign": {
    title: "Benign Traffic",
    desc:
      "Normal, expected network activity produced by legitimate users and services. It includes routine web browsing, DNS queries, and application traffic. Benign classification helps train models and filter false positives for detection. Always verify baselines — benign patterns vary by environment. Use whitelisting and behavior baselines to avoid noisy alerts.",
    icon: <Globe size={44} className="text-[var(--accent)]" />,
    risk: "Low",
    usage: "Baseline traffic in datasets",
  },
  "DoS – Hulk": {
    title: "DoS – Hulk",
    desc:
      "HULK (HTTP Unbearable Load King) floods web servers with unique HTTP requests to exhaust resources. It uses randomized parameters to bypass caching and make mitigation harder. Detection focuses on request rate, high CPU/memory on web servers, and anomalous user-agent patterns. Rate limiting and WAF tuning can reduce impact. For forensic analysis, check server logs for repeated unique URIs.",
    icon: <Zap size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: hulkImg,
    usage: "Common DoS web attack",
  },
  "DoS – SlowHTTPTest": {
    title: "DoS – SlowHTTPTest",
    desc:
      "SlowHTTPTest holds connections open by sending headers/data very slowly to exhaust server connection slots. It mimics a low-and-slow client and can evade simple rate-based counters. Look for many half-open connections or long-lived slow POST/GET requests. Mitigation includes connection timeouts and reverse proxies that detect low throughput.",
    icon: <FileWarning size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: httpImg,
    usage: "Low-and-slow DoS tool",
  },
  "DoS – GoldenEye": {
    title: "DoS – GoldenEye",
    desc:
      "GoldenEye is another application-layer DoS that sends malicious HTTP traffic to overwhelm servers. It's similar to HULK but has different request patterns and concurrency behavior. Monitor for spikes in request volume or abnormal error rates. Defenses include autoscaling, traffic shaping, and WAF rules targeted to payload patterns.",
    icon: <Cpu size={44} className="text-[var(--accent)]" />,
    risk: "High",
    usage: "Application-layer DoS",
  },
  "DoS – Slowloris": {
    title: "DoS – Slowloris",
    desc:
      "Slowloris sends partial HTTP headers to keep many connections open and starve web servers of resources. It differs from volumetric attacks by using few packets and many open sockets. Detection looks for many concurrent slow connections from few IPs. Mitigation with reverse proxies and connection throttling helps reduce exposure to Slowloris.",
    icon: <Key size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: slowlorisImg,
    usage: "Low-volume DoS technique",
  },
  "FTP – BruteForce": {
    title: "FTP – BruteForce",
    desc:
      "Brute-force attempts target FTP credentials by repeatedly trying username/password combinations. Signs include many login attempts from single source IPs or bursts of credential retries across accounts. Harden systems with strong password policy, lockouts, and MFA where possible. Correlate with successful logins and subsequent suspicious file transfers.",
    icon: <GitPullRequest size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: bruteforceImg,
    usage: "Credential brute-forcing",
  },
  "SSH – BruteForce": {
    title: "SSH – BruteForce",
    desc:
      "SSH brute-force attacks attempt many credential combinations to gain shell access. Identifiable by repeated connection attempts and authentication failures. Use fail2ban, key-based auth, and rate limits to prevent compromise. Alert on successful logins after many failures and check for unusual post-auth behavior.",
    icon: <Lock size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: bruteforceImg,
    usage: "Common remote-access attack",
  },
  "DDoS – HOIC": {
    title: "DDoS – HOIC",
    desc:
      "HOIC (High Orbit Ion Cannon) is a volumetric DDoS tool generating massive concurrent HTTP requests to disrupt services. It typically uses many clients in coordinated bursts. Detection shows high bandwidth usage and saturation across network links. Upstream mitigation and scrubbing services are common defenses. Monitor for repeated attack campaigns from multiple origins.",
    icon: <CloudSnow size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: hoic,
    usage: "Volumetric DDoS campaigns",
  },
  "DDoS – LOIC UDP": {
    title: "DDoS – LOIC UDP",
    desc:
      "LOIC (Low Orbit Ion Cannon) can generate UDP floods that saturate link bandwidth. Traffic is mostly random UDP packets to target ports, causing network drop and service interruption. Rate-based detection and volumetric monitoring identify LOIC UDP floods. Employ blackholing and DDoS mitigation appliances for robust protection.",
    icon: <Zap size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: loic,
    usage: "UDP flood DDoS",
  },
  "Brute Force – Web": {
    title: "Brute Force – Web",
    desc:
      "Web brute-force targets web login endpoints or weak authentication mechanisms to gain access. Look for numerous POST requests to login URIs, varying credentials, or rapid failed attempts. Use CAPTCHA, account lockouts, and behavioral analytics to detect these attacks. After compromise, look for privilege escalation or admin panel access.",
    icon: <AlertTriangle size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: web,
    usage: "Application-level credential attacks",
  },
  "Brute Force – XSS": {
    title: "Brute Force – XSS",
    desc:
      "This class (dataset-labeled) represents web attack attempts focusing on injection-like payloads; treat as suspicious input patterns and attempted exploitation. Detection relies on payload signatures and context-based WAF rules. Validate and sanitize inputs on the server. Monitor for successful script execution and subsequent data exfiltration.",
    icon: <FileWarning size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: xss,
    usage: "Web exploitation attempts",
  },
  "SQL Injection": {
    title: "SQL Injection",
    desc:
      "SQL injection is an attack where user-supplied data manipulates backend SQL queries — can lead to data theft or modification. Detect via payloads containing SQL keywords, repeated similar requests, or unusual query response patterns. Harden apps with prepared statements and parameterized queries. Triage by checking database logs after detection.",
    icon: <Database size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: sql,
    usage: "Critical web exploit",
  },
  "Infiltration": {
    title: "Infiltration",
    desc:
      "Infiltration covers multi-stage intrusion activity where attackers establish footholds and move laterally. Look for anomalous internal connections, credential reuse, and unusual process execution. Combine endpoint telemetry, network flows, and identity logs for comprehensive detection. Post-detection, isolate affected hosts and perform forensic triage.",
    icon: <Shield size={44} className="text-[var(--accent)]" />,
    risk: "High",
    image: xss,
    usage: "APT-style lateral movement",
  },
  "Bot": {
    title: "Bot Activity",
    desc:
      "Automated bot traffic includes scraping, credential stuffing, or crawler-like behaviour. It often shows predictable intervals, similar UA strings, or repeated URIs. Differentiate benign crawlers from malicious bots using rate, origin, and behavioral heuristics. Protect resources with bot management and rate limiting.",
    icon: <Globe size={44} className="text-[var(--accent)]" />,
    risk: "Medium",
    image: web,
    usage: "Automated misuse",
  },
};

// ---------- Utility: prepare chart data from class-count map ----------
const makeChartDataFromCounts = (counts) =>
  Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));

// small mock counts for CICIDS (from your provided map)
const CICIDS_COUNTS = {
  BENIGN: 40000,
  Bot: 8000,
  "DoS attacks-Hulk": 8000,
  "DoS attacks-SlowHTTPTest": 8000,
  Infilteration: 8000,
  "DoS attacks-GoldenEye": 8000,
  "DoS attacks-Slowloris": 8000,
  "FTP-BruteForce": 8000,
  "SSH-Bruteforce": 8000,
  "DDOS attack-HOIC": 8000,
  "DDOS attack-LOIC-UDP": 1730,
  "Brute Force -Web": 611,
  "Brute Force -XSS": 230,
  "SQL Injection": 87,
};

// ---------- Main Component ----------
export default function ThreatIntelInteractive() {
  const [mode, setMode] = useState("bcc"); // "bcc" | "cicids"
  const [selected, setSelected] = useState("VPN"); // default for BCC
  const [compare, setCompare] = useState("TOR");
  const [query, setQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [showQuizResult, setShowQuizResult] = useState(null);

  const navigate = useNavigate();

  const threats = mode === "bcc" ? THREATS_BCC : THREATS_CICIDS;
  const keys = useMemo(() => Object.keys(threats), [threats]);

  // keep selected sensible when switching modes
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
  const chartData = mode === "cicids" ? makeChartDataFromCounts(CICIDS_COUNTS).slice(0, 8) : []; // show partial if needed

  const quizQuestions = {
    // BCC / CICIDS both support a small quiz map; for CICIDS use class-specific Qs (simple)
    ...(mode === "bcc"
      ? {
          VPN: { question: "VPNs primarily encrypt traffic at which layer?", answer: "Network" },
          TOR: { question: "TOR hidden services use which TLD?", answer: ".onion" },
          I2P: { question: "I2P's routing technique is commonly called?", answer: "Garlic Routing" },
          FREENET: { question: "Freenet is primarily used for?", answer: "Decentralized file sharing" },
          ZERONET: { question: "ZeroNet commonly pairs with which crypto identity?", answer: "Bitcoin" },
        }
      : {
          // CICIDS sample quiz questions (pick per-class)
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
    if (!q) {
      setShowQuizResult({ correct: false });
      setTimeout(() => setShowQuizResult(null), 2000);
      return;
    }
    const correct = quizAnswer.trim().toLowerCase() === q.answer.toLowerCase();
    setShowQuizResult({ correct });
    setTimeout(() => setShowQuizResult(null), 2500);
  };

  return (
    <div className="p-6 space-y-6 relative">
      
      {/* subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse-slow"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in srgb, var(--accent) 30%, transparent) 30%, transparent 90%)",
          opacity: 0.12,
        }}
      />

      {/* Title + Flow Button Row */}
<div className="flex items-center justify-between w-full relative z-10">
  
  {/* Heading */}
  <h1 className=" relative z-20 text-5xl md:text-6xl lg:text-7xl font-extrabold 
    bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 
    text-transparent bg-clip-text neon-text leading-tight">
    Threat Intelligence
  </h1>

  {/* Right-Aligned Button */}
  <button
    onClick={() => navigate(`/flow?type=${encodeURIComponent(compare)}`)}
    className="
      px-5 py-2 
      bg-black/30
      backdrop-blur-md
      border border-[var(--accent)]/30
      text-[var(--accent)]
      rounded-lg
      hover:bg-black/50
      shadow-lg hover:shadow-[0_0_25px_var(--accent)]
      transition-all
      text-xl
      ml-auto
    "
  >
    View Flow
  </button>

</div>




      {/* Mode toggle */}

      <div className="flex items-center py-4 gap-3 z-10 relative">
        <button
          onClick={() => setMode("bcc")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            mode === "bcc"
              ? "bg-[var(--accent)]/30 border-[var(--accent)]/50 text-[var(--accent)]"
              : "bg-black/20 border-[var(--accent)]/10 text-slate-400 hover:bg-[var(--accent)]/10"
          }`}
        >
          BCC View
        </button>

        <button
          onClick={() => setMode("cicids")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            mode === "cicids"
              ? "bg-[var(--accent)]/30 border-[var(--accent)]/50 text-[var(--accent)]"
              : "bg-black/20 border-[var(--accent)]/10 text-slate-400 hover:bg-[var(--accent)]/10"
          }`}
        >
          CICIDS View
        </button>

        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Search threats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-black/40 border border-[var(--accent)]/20 px-3 py-2 rounded-lg text-sm text-[var(--accent)] outline-none"
          />
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-black/40 border border-[var(--accent)]/20 px-3 py-2 rounded-lg text-sm text-[var(--accent)] outline-none"
          >
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      <div className="relative w-full h-1.5 bg-cyan-500/10 rounded-full overflow-hidden z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 animate-[pulse_2s_linear_infinite] blur-[1px]" />
            </div>

      {/* threat buttons */}
      <div className="flex flex-wrap gap-3 relative z-10">
        {filteredKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              selected === key
                ? "bg-[var(--accent)]/30 border-[var(--accent)]/50 text-[var(--accent)]"
                : "bg-black/20 border-[var(--accent)]/10 text-slate-400 hover:bg-[var(--accent)]/10"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* main card */}
      <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.02} transitionSpeed={1000}>
        <motion.div
          className="relative p-6 rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/15 to-black/60 shadow-[0_0_25px_var(--accent)_0.15] cursor-grab overflow-hidden"
          whileTap={{ cursor: "grabbing" }}
        >
          {threat.image && (
            <motion.img
              src={threat.image}
              alt={threat.title}
              className="absolute top-0 right-0 opacity-8 w-full h-full object-cover pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.06 }}
            />
          )}

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              {threat.icon}
              <div>
                <h3 className="text-xl font-semibold text-[var(--accent)]">{threat.title}</h3>
                <p className="text-slate-400 text-sm italic">{(threat.desc?.split(". ").slice(0, 2).join(". ") || "No description available.") + "."}</p>
              </div>
            </div>

            <div className="w-24 h-24 mx-auto my-4">
              <CircularProgressbar
                value={threat.risk === "High" ? 90 : threat.risk === "Medium" ? 65 : 35}
                text={threat.risk}
                styles={buildStyles({
                  pathColor: "var(--accent)",
                  textColor: "var(--accent)",
                  trailColor: "#111",
                })}
              />
            </div>

            {/* optional small chart (only for CICIDS to show class counts) */}
            {mode === "cicids" && (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="var(--accent)" />
                    <YAxis hide />
                    <Bar dataKey="value" fill="var(--accent)" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-slate-400 text-sm mt-2">Top CICIDS counts (sample)</p>
              </div>
            )}

            <p className="text-center text-slate-400 text-sm mt-2">{threat.usage}</p>
          </div>
        </motion.div>
      </Tilt>

      {/* comparison + details */}
      <motion.div layout className="grid md:grid-cols-2 gap-6 mt-4 relative z-10" transition={{ duration: 0.3 }}>
        <motion.div className="p-4 bg-black/40 rounded-xl border border-[var(--accent)]/20">
          <h4 className="text-[var(--accent)] font-semibold mb-2">{threat.title}</h4>
          <p className="text-slate-400 text-sm">{threat.desc}</p>
        </motion.div>

        <motion.div className="p-4 bg-black/40 rounded-xl border border-[var(--accent)]/20">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-[var(--accent)] font-semibold mr-auto">Compare</h4>
            <select
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
              className="bg-black/40 border border-[var(--accent)]/20 px-3 py-1 rounded-lg text-sm text-[var(--accent)] outline-none"
            >
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <button
              className="ml-3 px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] text-sm"
              onClick={() => navigate(`/flow?type=${encodeURIComponent(compare)}`)}
            >
              Flow
            </button>
          </div>

          <h5 className="text-sm text-[var(--accent)] mb-1">{compareThreat.title}</h5>
          <p className="text-slate-400 text-sm">{compareThreat.desc}</p>
        </motion.div>
      </motion.div>

      {/* quiz */}
      <div className="mt-6 bg-black/40 border border-[var(--accent)]/20 rounded-xl p-4 relative z-10">
        <h4 className="text-[var(--accent)] font-semibold mb-2">🎯 Analyst Quiz</h4>
        <p className="text-slate-400 text-sm mb-3">{(quizQuestions[selected] && quizQuestions[selected].question) || "No question for this class."}</p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Your answer..."
            value={quizAnswer}
            onChange={(e) => setQuizAnswer(e.target.value)}
            className="flex-1 bg-black/40 border border-[var(--accent)]/20 rounded-lg px-3 py-2 text-[var(--accent)] text-sm outline-none"
          />
          <button
            onClick={handleQuizSubmit}
            className="px-4 py-2 bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-lg hover:bg-[var(--accent)]/30 text-[var(--accent)] text-sm"
          >
            Submit
          </button>
        </div>

        <AnimatePresence>
          {showQuizResult !== null && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-3 font-semibold ${showQuizResult.correct ? "text-emerald-400" : "text-rose-400"}`}
            >
              {showQuizResult.correct ? "✅ Correct!" : `❌ Incorrect! Correct answer: ${quizQuestions[selected]?.answer || "—"}`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <ChatAssistant />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  Settings, ToggleLeft, ToggleRight, Wifi, Save, RefreshCcw, Brain, Zap,
  FileDown, Palette, Bell, Sliders, ShieldAlert, HardDrive, UploadCloud, Users,
  Activity, Database, ShieldCheck, Globe, Lock, History, Server, Cpu, Layers
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { settings, setSettings, saveSettings, user } = useAuth();
  
  // Logic State
  const [theme, setTheme] = useState(settings?.theme ?? "Cyber Blue");
  const [autoRefresh, setAutoRefresh] = useState(settings?.autoRefresh ?? true);
  const [soundAlerts, setSoundAlerts] = useState(settings?.soundAlerts ?? true);
  const [aiSensitivity, setAiSensitivity] = useState(settings?.aiSensitivity ?? 70);
  const [responseMode, setResponseMode] = useState(settings?.responseMode ?? "Semi-Auto");
  const [encryptionLevel, setEncryptionLevel] = useState("AES-256");
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [activeThreatDataset, setActiveThreatDataset] = useState("CICIDS2018");
  
  const fileInputRef = useRef(null);

  const applyTheme = (t) => {
    const body = document.body;
    body.classList.remove("theme-cyber", "theme-crimson", "theme-emerald", "theme-default");
    const themeMap = { "Cyber Blue": "theme-cyber", "Crimson Dark": "theme-crimson", "Emerald Matrix": "theme-emerald", "Default": "theme-default" };
    body.classList.add(themeMap[t] || "theme-default");
  };

  const handleSave = async () => {
    const newSettings = { ...settings, theme, autoRefresh, aiSensitivity, responseMode };
    await saveSettings(newSettings);
    toast.success("All systems synchronized successfully.");
  };

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 relative z-10 bg-transparent">
      <Toaster position="bottom-right" />

      {/* --- TOP BAR / OVERVIEW --- */}
      <div className="glass-shell p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-accent/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
            <Settings className="animate-spin-slow text-accent" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent tracking-tighter uppercase">Command Center</h1>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">User: {user?.displayName || "Operator_01"} // Auth: Level_Alpha</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="px-8 py-3 bg-accent text-black font-black uppercase text-xs rounded-xl hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LEFT COLUMN: SYSTEM & SECURITY --- */}
        <div className="space-y-6">
          
          {/* THEME & VISUALS */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Palette size={14} /> Interface Skins
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {["Cyber Blue", "Crimson Dark", "Emerald Matrix", "Default"].map((t) => (
                <button key={t} onClick={() => { setTheme(t); applyTheme(t); }}
                  className={`py-3 text-[10px] font-bold uppercase rounded-xl border transition-all ${theme === t ? 'border-accent bg-accent/20 text-accent shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'}`}>
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* CORE PERFORMANCE */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Zap size={14} /> Global System Prefs
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5">
                <span className="text-xs font-bold opacity-70">Real-Time Data Streaming</span>
                <button onClick={() => setAutoRefresh(!autoRefresh)} className="text-accent">
                  {autoRefresh ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="opacity-20" />}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5">
                <span className="text-xs font-bold opacity-70">Auditory Alert Feedback</span>
                <button onClick={() => setSoundAlerts(!soundAlerts)} className="text-accent">
                  {soundAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="opacity-20" />}
                </button>
              </div>
            </div>
          </section>

          {/* SECURITY & PRIVACY */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Lock size={14} /> Advanced Security
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[9px] uppercase opacity-40 mb-2">Encryption Algorithm</p>
                <select value={encryptionLevel} onChange={(e) => setEncryptionLevel(e.target.value)}
                  className="bg-transparent text-xs font-bold text-accent outline-none w-full appearance-none">
                  <option value="AES-256">AES-256-GCM (Hardware Accelerated)</option>
                  <option value="ChaCha20">ChaCha20-Poly1305</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase">Network Stealth Proxy</span>
                  <span className="text-[8px] opacity-40 font-mono">Routing through {proxyEnabled ? "Active Nodes" : "Direct Link"}</span>
                </div>
                <button onClick={() => setProxyEnabled(!proxyEnabled)} className="text-accent">
                  {proxyEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="opacity-20" />}
                </button>
              </div>
            </div>
          </section>

          {/* HARDWARE TELEMETRY */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Cpu size={14} /> Hardware Resources
            </h3>
            <div className="space-y-4 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="opacity-50 uppercase">Processor Load</span>
                <span className="text-emerald-400">12.4% / Normal</span>
              </div>
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[12%] shadow-[0_0_10px_#34d399]"></div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50 uppercase">Neural Cache (8GB)</span>
                <span className="text-accent">2.1 GB Static</span>
              </div>
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent h-full w-[26%] shadow-[0_0_10px_var(--accent)]"></div>
              </div>
            </div>
          </section>
        </div>

        {/* --- RIGHT COLUMN: AI, DATA & LOGS --- */}
        <div className="space-y-6">
          
          {/* AI NEURAL PARAMS */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Brain size={14} /> AI Inference Engine
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Threat Sensitivity</span>
                <span className="text-accent">{aiSensitivity}%</span>
              </div>
              <input type="range" min="30" max="100" value={aiSensitivity} onChange={(e) => setAiSensitivity(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-accent" />
              <div className="grid grid-cols-3 gap-2">
                {["Passive", "Semi-Auto", "Fully Auto"].map(mode => (
                  <button key={mode} onClick={() => setResponseMode(mode)}
                    className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${responseMode === mode ? 'bg-accent/20 border-accent text-accent' : 'border-white/5 opacity-30 hover:opacity-100'}`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* MODEL & DATASET MANAGEMENT */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Database size={14} /> Model Architecture
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <p className="text-[9px] uppercase opacity-40 mb-1">Active Dataset</p>
                  <select value={activeThreatDataset} onChange={(e) => setActiveThreatDataset(e.target.value)}
                    className="bg-transparent text-xs font-bold text-accent outline-none w-full">
                    <option value="CICIDS2018">CICIDS 2018</option>
                    <option value="BCC">BCC Traffic</option>
                  </select>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <p className="text-[9px] uppercase opacity-40 mb-1">Model Version</p>
                  <p className="text-xs font-bold">RF_XENON_v4.2</p>
                </div>
              </div>
              <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-accent/20 rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-accent/5 cursor-pointer transition-all">
                <input type="file" ref={fileInputRef} className="hidden" />
                <UploadCloud className="text-accent opacity-50" />
                <span className="text-[10px] font-black uppercase">Inject Custom Weights</span>
              </div>
            </div>
          </section>

          {/* AUDIT TRAIL */}
          <section className="card-glow p-6">
            <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <History size={14} /> System Audit Trail
            </h3>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scroll">
              {[
                { t: '12:04', m: 'Firewall: Blocked IP 192.168.1.5' },
                { t: '11:58', m: 'Model: Weights updated from cloud' },
                { t: '11:42', m: 'Admin: Session authorized' },
                { t: '10:15', m: 'System: Integrity check pass' },
              ].map((log, i) => (
                <div key={i} className="flex gap-3 text-[9px] font-mono border-b border-white/5 pb-2">
                  <span className="text-accent">[{log.t}]</span>
                  <span className="opacity-60 uppercase">{log.m}</span>
                </div>
              ))}
            </div>
          </section>

          {/* DANGER ZONE */}
          <div className="grid grid-cols-2 gap-4">
            <button className="py-4 border border-accent/30 bg-accent/5 text-accent rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all flex flex-col items-center gap-2">
              <FileDown size={20} /> Export Sync
            </button>
            <button className="py-4 border border-rose-500/30 bg-rose-500/5 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all flex flex-col items-center gap-2">
              <RefreshCcw size={20} /> Purge Node
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
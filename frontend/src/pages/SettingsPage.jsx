// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Wifi,
  Save,
  RefreshCcw,
  Brain,
  Zap,
  FileDown,
  Palette,
  Bell,
  Sliders,
  ShieldAlert,
  HardDrive,
  UploadCloud,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// ---------- DEFAULT HELPERS (no shared reference issues) ----------

const createDefaultThreatRules = () => ({
  // CICIDS2018 classes (from your list, ignoring counts)
  cicids2018: {
    BENIGN: true,
    Bot: true,
    "DoS attacks-Hulk": true,
    "DoS attacks-SlowHTTPTest": true,
    Infilteration: true,
    "DoS attacks-GoldenEye": true,
    "DoS attacks-Slowloris": true,
    "FTP-BruteForce": true,
    "SSH-Bruteforce": true,
    "DDOS attack-HOIC": true,
    "DDOS attack-LOIC-UDP": true,
    "Brute Force -Web": true,
    "Brute Force -XSS": true,
    "SQL Injection": true,
  },
  // BCC classes
  bcc: {
    Freenet: true,
    TOR: true,
    ZERONET: true,
    I2P: true,
    VPN: true,
  },
});

const createDefaultCaptureSettings = () => ({
  interface: "AUTO",
  protocol: "ANY",
  maxPackets: 5000,
  sampleRate: "1x",
});

const createDefaultRetention = () => ({
  logDays: 7,
  anonymizeIP: false,
  autoPurge: true,
});

const createDefaultNotifications = () => ({
  enablePopup: true,
  emailAlerts: false,
  email: "",
  criticalThreshold: 10,
});

const createDefaultModelConfig = () => ({
  activeDataset: "CICIDS2018", // or "BCC"
  activeModelName: "CICIDS2018_Default",
  customModelName: "",
  lastUpdated: null,
});

export default function SettingsPage() {
  const { settings, setSettings, saveSettings, user } = useAuth();

  // Core settings from context
  const [autoRefresh, setAutoRefresh] = useState(settings.autoRefresh);
  const [soundAlerts, setSoundAlerts] = useState(settings.soundAlerts);
  const [aiSensitivity, setAiSensitivity] = useState(settings.aiSensitivity);
  const [responseMode, setResponseMode] = useState(settings.responseMode);
  const [ipConfig, setIpConfig] = useState(settings.ipConfig);
  const [portConfig, setPortConfig] = useState(settings.portConfig);
  const [theme, setTheme] = useState(settings.theme);
  const [backupProgress, setBackupProgress] = useState(0);

  // New enterprise settings
  const [threatRules, setThreatRules] = useState(createDefaultThreatRules);
  const [captureSettings, setCaptureSettings] = useState(
    createDefaultCaptureSettings
  );
  const [retention, setRetention] = useState(createDefaultRetention);
  const [notificationSettings, setNotificationSettings] = useState(
    createDefaultNotifications
  );
  const [modelConfig, setModelConfig] = useState(createDefaultModelConfig);

  // UI-only state
  const [activeThreatDataset, setActiveThreatDataset] =
    useState("CICIDS2018"); // "CICIDS2018" | "BCC"
  const [modelFile, setModelFile] = useState(null);

  // 🧠 Load from Firestore on login/settings change
  useEffect(() => {
    if (settings) {
      setAutoRefresh(settings.autoRefresh);
      setSoundAlerts(settings.soundAlerts);
      setAiSensitivity(settings.aiSensitivity);
      setResponseMode(settings.responseMode);
      setIpConfig(settings.ipConfig);
      setPortConfig(settings.portConfig);
      setTheme(settings.theme);
      applyTheme(settings.theme);

      setThreatRules(
        settings.threatRules || createDefaultThreatRules()
      );
      setCaptureSettings(
        settings.captureSettings || createDefaultCaptureSettings()
      );
      setRetention(
        settings.retention || createDefaultRetention()
      );
      setNotificationSettings(
        settings.notificationSettings ||
          createDefaultNotifications()
      );
      setModelConfig(
        settings.modelConfig || createDefaultModelConfig()
      );
    }
  }, [settings]);

  // 🎨 Apply theme globally
  const applyTheme = (selectedTheme) => {
    const body = document.body;
    body.classList.remove(
      "theme-cyber",
      "theme-crimson",
      "theme-emerald",
      "theme-default"
    );
    switch (selectedTheme) {
      case "Cyber Blue":
        body.classList.add("theme-cyber");
        break;
      case "Crimson Dark":
        body.classList.add("theme-crimson");
        break;
      case "Emerald Matrix":
        body.classList.add("theme-emerald");
        break;
      default:
        body.classList.add("theme-default");
    }
  };

  // 💾 Save to Firestore (extended)
  const handleSave = async () => {
    const newSettings = {
      autoRefresh,
      soundAlerts,
      aiSensitivity,
      responseMode,
      ipConfig,
      portConfig,
      theme,

      // new enterprise sections
      threatRules,
      captureSettings,
      retention,
      notificationSettings,
      modelConfig,
    };

    setSettings(newSettings);
    await saveSettings(newSettings); // 🔥 Saves to Firestore
    toast.success("✅ Settings saved");
  };

  // Backup to local file (for download)
  const handleBackup = () => {
    toast("🧬 Generating system backup...", { icon: "💾" });
    setBackupProgress(0);
    let progress = 0;
    const timer = setInterval(() => {
      progress += 10;
      setBackupProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        toast.success("✅ Backup completed!");
        const blob = new Blob(
          [JSON.stringify(settings, null, 2)],
          { type: "application/json" }
        );
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "nids_system_backup.json";
        link.click();
      }
    }, 200);
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ Reset all settings to default?")) return;

    const def = {
      theme: "Cyber Blue",
      autoRefresh: true,
      soundAlerts: true,
      aiSensitivity: 70,
      responseMode: "Semi-Auto",
      ipConfig: "127.0.0.1",
      portConfig: "5000",

      threatRules: createDefaultThreatRules(),
      captureSettings: createDefaultCaptureSettings(),
      retention: createDefaultRetention(),
      notificationSettings: createDefaultNotifications(),
      modelConfig: createDefaultModelConfig(),
    };

    setSettings(def);
    await saveSettings(def);
    applyTheme("Cyber Blue");
    setThreatRules(def.threatRules);
    setCaptureSettings(def.captureSettings);
    setRetention(def.retention);
    setNotificationSettings(def.notificationSettings);
    setModelConfig(def.modelConfig);
    toast.success("✅ Settings restored to default");
  };

  // Threat rule toggler
  const handleToggleRule = (datasetKey, ruleKey) => {
    setThreatRules((prev) => ({
      ...prev,
      [datasetKey]: {
        ...prev[datasetKey],
        [ruleKey]: !prev[datasetKey][ruleKey],
      },
    }));
  };

  // Model upload (no backend, safe)
  const handleModelUpload = () => {
    if (!modelFile) {
      toast.error("Please select a model file first.");
      return;
    }

    const updated = {
      ...modelConfig,
      customModelName: modelFile.name,
      lastUpdated: new Date().toISOString(),
    };

    setModelConfig(updated);
    toast.success(
      "✅ Custom model registered (metadata saved in settings)."
    );
  };

  const currentThreatKey =
    activeThreatDataset === "CICIDS2018" ? "cicids2018" : "bcc";
  const currentThreatRules = threatRules[currentThreatKey] || {};

  return (
    <div className="p-6 space-y-6 relative text-[var(--text)]">
      <Toaster position="bottom-right" />
      <div
        className="absolute inset-0 animate-pulse-slow pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in srgb, var(--accent) 25%, transparent) 8%, transparent 75%)",
          opacity: 0.25,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center relative z-10">
        <h2 className="text-2xl font-semibold text-accent flex items-center gap-2">
          <Settings size={22} /> System Configuration
        </h2>
        <button
          onClick={handleSave}
          className="px-3 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg hover:bg-cyan-500/30 text-cyan-300 flex items-center gap-2"
        >
          <Save size={14} /> Save
        </button>
      </div>

      {/* ⚙️ SYSTEM PREFERENCES */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Zap size={14} /> System Preferences
        </h3>
        <div className="flex flex-wrap gap-6 text-sm text-[var(--text)]/80">
          {/* Auto Refresh */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:text-accent"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
            Auto Refresh
          </div>

          {/* Sound Alerts */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:text-accent"
            onClick={() => setSoundAlerts(!soundAlerts)}
          >
            {soundAlerts ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
            Sound Alerts
          </div>

          {/* Data Retention */}
          <div className="flex items-center gap-2">
            <span>Data Retention:</span>
            <select
              value={retention.logDays}
              onChange={(e) =>
                setRetention((prev) => ({
                  ...prev,
                  logDays: Number(e.target.value),
                }))
              }
              className="bg-card border border-accent rounded px-2 py-1 text-accent"
            >
              <option value={1}>24 Hours</option>
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          {/* Anonymize IP */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:text-accent"
            onClick={() =>
              setRetention((prev) => ({
                ...prev,
                anonymizeIP: !prev.anonymizeIP,
              }))
            }
          >
            {retention.anonymizeIP ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
            Anonymize IP Addresses
          </div>
        </div>
      </div>

      {/* 🎨 THEME SETTINGS */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Palette size={14} /> Theme & Appearance
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text)]/80 items-center">
          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              applyTheme(e.target.value);
            }}
            className="bg-card border border-accent rounded px-3 py-2 text-accent"
          >
            <option>Cyber Blue</option>
            <option>Crimson Dark</option>
            <option>Emerald Matrix</option>
            <option>Default</option>
          </select>
          <span className="text-xs text-[var(--text)]/50 italic">
            Instantly applies across all pages
          </span>
        </div>
      </div>

      {/* 🧠 AI BEHAVIOR */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Brain size={14} /> AI Behavior Settings
        </h3>
        <div className="space-y-4 text-sm text-[var(--text)]/80">
          <div>
            <p className="mb-2">AI Sensitivity: {aiSensitivity}%</p>
            <input
              type="range"
              min="30"
              max="100"
              value={aiSensitivity}
              onChange={(e) => setAiSensitivity(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>
          <div>
            <p className="mb-2">Threat Response Mode:</p>
            <select
              value={responseMode}
              onChange={(e) => setResponseMode(e.target.value)}
              className="bg-card border border-accent rounded px-2 py-1 text-accent"
            >
              <option>Passive</option>
              <option>Semi-Auto</option>
              <option>Fully Auto</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🌐 NETWORK SETTINGS */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Wifi size={14} /> Network Configuration
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text)]/80">
          <div>
            <p>Server IP</p>
            <input
              type="text"
              value={ipConfig}
              onChange={(e) => setIpConfig(e.target.value)}
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            />
          </div>
          <div>
            <p>Server Port</p>
            <input
              type="text"
              value={portConfig}
              onChange={(e) => setPortConfig(e.target.value)}
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            />
          </div>
        </div>
        <button
          onClick={() =>
            toast.success("✅ Network settings saved (local)!")
          }
          className="mt-4 px-4 py-2 bg-accent/20 border border-accent text-accent rounded-lg hover:bg-accent/30 transition flex items-center gap-2"
        >
          <Save size={14} /> Save Configuration
        </button>
      </div>

      {/* 🛡️ THREAT RULE MANAGER */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <ShieldAlert size={14} /> Threat Rule Manager
        </h3>

        {/* Dataset switch */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-[var(--text)]/80">
          <button
            className={`px-3 py-1.5 rounded-full border ${
              activeThreatDataset === "CICIDS2018"
                ? "border-accent bg-accent/20 text-accent"
                : "border-slate-500/40 hover:border-accent/50"
            }`}
            onClick={() => setActiveThreatDataset("CICIDS2018")}
          >
            CICIDS 2018 Rules
          </button>
          <button
            className={`px-3 py-1.5 rounded-full border ${
              activeThreatDataset === "BCC"
                ? "border-accent bg-accent/20 text-accent"
                : "border-slate-500/40 hover:border-accent/50"
            }`}
            onClick={() => setActiveThreatDataset("BCC")}
          >
            BCC Rules
          </button>
          <span className="text-[11px] text-[var(--text)]/50 italic">
            Toggle which classes should trigger alerts for the active
            model.
          </span>
        </div>

        {/* Rules */}
        <div className="grid md:grid-cols-3 gap-3 text-sm text-[var(--text)]/85">
          {Object.keys(currentThreatRules).map((ruleKey) => (
            <button
              key={ruleKey}
              onClick={() =>
                handleToggleRule(currentThreatKey, ruleKey)
              }
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                currentThreatRules[ruleKey]
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-slate-600/60 bg-card/40 hover:border-accent/50"
              }`}
            >
              <span className="truncate mr-2">{ruleKey}</span>
              {currentThreatRules[ruleKey] ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 📡 PACKET CAPTURE SETTINGS */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <HardDrive size={14} /> Packet Capture Settings
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text)]/80">
          <div>
            <p className="mb-1">Capture Interface</p>
            <select
              value={captureSettings.interface}
              onChange={(e) =>
                setCaptureSettings((prev) => ({
                  ...prev,
                  interface: e.target.value,
                }))
              }
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            >
              <option value="AUTO">Auto Detect</option>
              <option value="eth0">eth0</option>
              <option value="wlan0">wlan0</option>
            </select>
          </div>
          <div>
            <p className="mb-1">Protocol Filter</p>
            <select
              value={captureSettings.protocol}
              onChange={(e) =>
                setCaptureSettings((prev) => ({
                  ...prev,
                  protocol: e.target.value,
                }))
              }
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            >
              <option value="ANY">Any</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="HTTP">HTTP</option>
              <option value="TLS">TLS</option>
            </select>
          </div>
          <div>
            <p className="mb-1">Max Packets per Session</p>
            <input
              type="number"
              value={captureSettings.maxPackets}
              onChange={(e) =>
                setCaptureSettings((prev) => ({
                  ...prev,
                  maxPackets: Number(e.target.value) || 0,
                }))
              }
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            />
          </div>
          <div>
            <p className="mb-1">Sampling Rate</p>
            <select
              value={captureSettings.sampleRate}
              onChange={(e) =>
                setCaptureSettings((prev) => ({
                  ...prev,
                  sampleRate: e.target.value,
                }))
              }
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            >
              <option value="1x">1x (Full)</option>
              <option value="2x">2x</option>
              <option value="5x">5x</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔔 NOTIFICATION SETTINGS */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Bell size={14} /> Notification Settings
        </h3>
        <div className="space-y-4 text-sm text-[var(--text)]/80">
          <div
            className="flex items-center gap-3 cursor-pointer hover:text-accent"
            onClick={() =>
              setNotificationSettings((prev) => ({
                ...prev,
                enablePopup: !prev.enablePopup,
              }))
            }
          >
            {notificationSettings.enablePopup ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
            Enable In-App Popup Alerts
          </div>

          <div
            className="flex items-center gap-3 cursor-pointer hover:text-accent"
            onClick={() =>
              setNotificationSettings((prev) => ({
                ...prev,
                emailAlerts: !prev.emailAlerts,
              }))
            }
          >
            {notificationSettings.emailAlerts ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
            Email Alerts
          </div>

          <div>
            <p className="mb-1">Alert Email Address</p>
            <input
              type="email"
              value={notificationSettings.email}
              onChange={(e) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="analyst@example.com"
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            />
          </div>

          <div>
            <p className="mb-1">Critical Alert Threshold (per minute)</p>
            <input
              type="number"
              value={notificationSettings.criticalThreshold}
              onChange={(e) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  criticalThreshold: Number(e.target.value) || 0,
                }))
              }
              className="w-full bg-card border border-accent rounded px-2 py-1 text-accent"
            />
          </div>
        </div>
      </div>

      {/* 🤖 MODEL & DATASET MANAGEMENT */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Sliders size={14} /> Model & Dataset Management
        </h3>
        <div className="space-y-4 text-sm text-[var(--text)]/80">
          {/* Dataset selection */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs uppercase tracking-[0.15em] text-[var(--text)]/60">
              Active Dataset:
            </span>
            <button
              className={`px-3 py-1.5 rounded-full border ${
                modelConfig.activeDataset === "CICIDS2018"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-slate-500/40 hover:border-accent/50"
              }`}
              onClick={() =>
                setModelConfig((prev) => ({
                  ...prev,
                  activeDataset: "CICIDS2018",
                  activeModelName: "CICIDS2018_Default",
                }))
              }
            >
              CICIDS 2018
            </button>
            <button
              className={`px-3 py-1.5 rounded-full border ${
                modelConfig.activeDataset === "BCC"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-slate-500/40 hover:border-accent/50"
              }`}
              onClick={() =>
                setModelConfig((prev) => ({
                  ...prev,
                  activeDataset: "BCC",
                  activeModelName: "BCC_Default",
                }))
              }
            >
              BCC
            </button>
          </div>

          {/* Upload Model */}
          <div className="grid md:grid-cols-[2fr_auto] gap-3 items-center">
            <div>
              <p className="mb-1 flex items-center gap-2">
                <UploadCloud size={14} /> Upload Custom Model (.pkl/.joblib)
              </p>
              <input
                type="file"
                accept=".pkl,.joblib,.onnx"
                onChange={(e) => setModelFile(e.target.files[0] || null)}
                className="w-full text-xs text-[var(--text)]/70 bg-card border border-accent/40 rounded px-2 py-1 file:mr-3 file:px-2 file:py-1 file:text-xs file:rounded file:bg-accent/20 file:border-none file:text-accent"
              />
            </div>
            <button
              onClick={handleModelUpload}
              className="h-[38px] px-4 py-2 bg-accent/20 border border-accent text-accent rounded-lg hover:bg-accent/30 transition flex items-center gap-2 justify-center"
            >
              <Brain size={14} /> Register Model
            </button>
          </div>

          <div className="text-xs text-[var(--text)]/60">
            <p>Active model: {modelConfig.activeModelName}</p>
            {modelConfig.customModelName && (
              <p>
                Custom model:{" "}
                <span className="text-accent">
                  {modelConfig.customModelName}
                </span>{" "}
                {modelConfig.lastUpdated && (
                  <span>
                    (updated{" "}
                    {new Date(
                      modelConfig.lastUpdated
                    ).toLocaleString()}
                    )
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 👥 USER & ACCESS OVERVIEW (UI-ONLY) */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <Users size={14} /> User & Access Overview
        </h3>
        <div className="text-sm text-[var(--text)]/80 space-y-2">
          <div className="flex justify-between border-b border-slate-600/40 pb-1 text-xs text-[var(--text)]/60 uppercase tracking-[0.12em]">
            <span>User</span>
            <span>Role</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{user?.displayName || "Current Operator"}</span>
            <span className="text-accent text-xs px-2 py-1 rounded-full border border-accent/50">
              Operator
            </span>
          </div>
          <p className="text-[11px] text-[var(--text)]/50 mt-2 italic">
            Role-based access can be integrated with your auth provider
            in a future enhancement.
          </p>
        </div>
      </div>

      {/* Backup & Reset */}
      <div className="card-glow rounded-xl p-5 relative z-10">
        <h3 className="text-accent text-sm mb-3 flex items-center gap-2">
          <FileDown size={14} /> Backup & Reset
        </h3>
        <div className="flex flex-wrap gap-4 items-center text-sm text-[var(--text)]/80">
          <button
            onClick={handleBackup}
            className="px-4 py-2 bg-[var(--accent)]/20 border border-[var(--accent)] text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/30 transition flex items-center gap-2"
          >
            <FileDown size={14} /> Backup Settings
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-rose-600/20 border border-rose-400/30 text-rose-300 rounded-lg hover:bg-rose-600/30 transition flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Reset to Default
          </button>
        </div>
        {backupProgress > 0 && backupProgress < 100 && (
          <div className="mt-3 w-full bg-[var(--accent)]/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent)] h-2 animate-pulse"
              style={{ width: `${backupProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

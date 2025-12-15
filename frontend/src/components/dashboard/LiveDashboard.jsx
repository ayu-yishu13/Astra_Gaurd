import React, { useEffect, useState, useContext, useRef } from "react";
import Controls from "./Controls.jsx";
import LiveTable from "./LiveTable.jsx";
import ChatAssistant from "../../pages/ChatAssistant.jsx";
import StatsPanel from "./StatsPanel.jsx";
import { Download, Loader2, MessageSquare } from "lucide-react";
import { socket } from "../../socket.js";
import {
  getRecent,
  getStats,
  download_logs,
  switchModel,
  getActiveModel,
  getStatus
} from "../../api.js";
import { AlertContext } from "../../context/AlertContext.jsx";
import ThreatFeed from "./ThreatFeed";
import ThreatTimeline from "./ThreatTimeline";
import TopIPs from "./TopIPs";
import TopCountries from "./TopCountries";
import Sparkline from "./Sparkline";

export default function LiveDashboard() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [threatCount, setThreatCount] = useState(0);
  const { pushAlert } = useContext(AlertContext);

  const [model, setModel] = useState("bcc");
  const [snifferRunning, setSnifferRunning] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const [tableKey, setTableKey] = useState(0);
  const eventBufferRef = useRef([]);

  // ============================================================
  // INIT LOAD: Active model + sniffer status
  // ============================================================
  useEffect(() => {
    (async () => {
      const res = await getActiveModel();
      if (res?.model) setModel(res.model);

      const st = await getStatus();
      setSnifferRunning(st?.running === true);
    })();
  }, []);

  // ============================================================
  // MODEL SWITCH (backend + UI reset)
  // ============================================================
  useEffect(() => {
    const doSwitch = async () => {
      setSwitching(true);
      setModelReady(false);

      setRows([]);
      setStats({});
      setThreatCount(0);
      eventBufferRef.current = [];
      setTableKey((k) => k + 1);

      const res = await switchModel(model);

      if (!res?.error) {
        pushAlert(`${model.toUpperCase()} model activated`, "info");
        setModelReady(true);
      } else {
        pushAlert("Model switch failed!", "danger");
      }

      setSwitching(false);
    };

    doSwitch();
  }, [model]);

  // ============================================================
  // INITIAL FETCH (after model switch)
  // ============================================================
  useEffect(() => {
    if (!modelReady) return;
    (async () => {
      const [r1, r2] = await Promise.all([
        getRecent(model),
        getStats(model)
      ]);

      setRows(Array.isArray(r1?.events) ? r1.events : []);
      setStats(r2 || {});
    })();
  }, [model, modelReady]);

  // ============================================================
  // SOCKET LIVE EVENTS
  // ============================================================
  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("new_event", (payload) => {
      if (!modelReady || switching) return;
      const events = payload?.items ?? [];
      if (events.length) eventBufferRef.current.push(...events);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_event");
    };
  }, [modelReady, switching]);

  // ============================================================
  // BUFFER TO UI processing
  // ============================================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (!modelReady) return;
      if (!eventBufferRef.current.length) return;

      const batch = eventBufferRef.current.splice(0, 50);

      setRows((prev) => [...batch, ...prev].slice(0, 180));

      setStats((prev) => {
        const next = { ...prev };
        batch.forEach((evt) => {
          const label = (evt.prediction || "UNKNOWN").toUpperCase();
          next[label] = (next[label] || 0) + 1;
        });
        return next;
      });

      batch.forEach((evt) => {
        const label = (evt.prediction || "").toUpperCase();
        const isThreat = (model === "bcc" && ["TOR","I2P","ZERONET"].includes(label)) ||
                         (model === "cicids" && label !== "BENIGN");
        if (isThreat) setThreatCount((c) => c + 1);
      });

      setLastUpdate(new Date().toLocaleTimeString());
    }, 1200);

    return () => clearInterval(interval);
  }, [model, modelReady]);

  // ============================================================
  // AI Assistant Handler (local popup)
  // ============================================================
  const askAISummary = async () => {
    const dangerous = rows.filter(evt => {
      const label = (evt.prediction || "").toUpperCase();
      return (model === "bcc" && ["TOR","I2P","ZERONET"].includes(label)) ||
             (model === "cicids" && label !== "BENIGN");
    });

    alert(`AI Summary:
Danger Events: ${dangerous.length}
Recent Threat Types: ${dangerous.slice(0, 5).map(e => e.prediction).join(", ")}`);
  };

  // ============================================================
  // RENDER UI
  // ============================================================
  return (
    <div className="space-y-5">
      <h2 className="py-6 text-5xl md:text-6xl font-extrabold text-transparent bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text">
        Live Capture
      </h2>

      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-200">
        Active Model: {model.toUpperCase()}
      </div>

      {/* Model Toggle */}
      <div className="flex gap-3 mb-4">
        <button
          disabled={snifferRunning || switching}
          className={`px-4 py-2 rounded-lg border ${
            model === "bcc" ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300" :
            "bg-black/20 border-cyan-400/20 text-slate-400"
          }`}
          onClick={() => setModel("bcc")}
        >
          {switching && model === "bcc" && <Loader2 className="animate-spin" size={16} />}
          BCC Model
        </button>

        <button
          disabled={snifferRunning || switching}
          className={`px-4 py-2 rounded-lg border ${
            model === "cicids" ? "bg-purple-500/20 border-purple-400/50 text-purple-300" :
            "bg-black/20 border-purple-400/20 text-slate-400"
          }`}
          onClick={() => setModel("cicids")}
        >
          {switching && model === "cicids" && <Loader2 className="animate-spin" size={16} />}
          CICIDS Model
        </button>

        {/* 🧠 AI Button */}
        <button
          onClick={askAISummary}
          className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-400/40 text-yellow-300 flex items-center gap-2 hover:bg-yellow-500/20"
        >
          <MessageSquare size={16} />
          AI Assist
        </button>
      </div>

      <Controls />

      {/* Status + Logs */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl text-cyan-400 font-semibold">
          {model === "bcc" ? "Realtime BCC Monitor" : "Realtime CICIDS Monitor"}
        </h3>

        <button
          onClick={() => download_logs(model)}
          className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-2"
        >
          <Download size={16} /> Logs
        </button>
      </div>

      <StatsPanel stats={stats} />

      <LiveTable key={tableKey} rows={rows} />

      <ChatAssistant />


      {/* VISUAL ANALYTICS BACK ADDED */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <ThreatFeed key={`${tableKey}-feed`} events={rows} />
        <ThreatTimeline key={`${tableKey}-timeline`} events={rows} />
        <Sparkline key={`${tableKey}-spark`} events={rows} />
        <TopIPs key={`${tableKey}-ips`} events={rows} />
        <TopCountries key={`${tableKey}-countries`} events={rows} />
      </div>

      <p className="text-xs text-slate-400 text-right">
        Last packet: <span className="text-cyan-300">{lastUpdate || "Waiting…"}</span>
      </p>
    </div>
  );
}



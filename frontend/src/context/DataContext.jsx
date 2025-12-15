import React, { createContext, useState, useEffect } from "react";
import { getRecent, getStats } from "../api";
import { socket } from "../socket";

export const LiveDataContext = createContext();

export function LiveDataProvider({ children }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [threatCount, setThreatCount] = useState(0);
  const [running, setRunning] = useState(false);

  // Load saved data
  useEffect(() => {
    const r = JSON.parse(localStorage.getItem("live_rows") || "[]");
    const s = JSON.parse(localStorage.getItem("live_stats") || "{}");
    if (r.length) setRows(r);
    if (Object.keys(s).length) setStats(s);
  }, []);

  // Fetch from backend on mount
  useEffect(() => {
    (async () => {
      const [r1, r2] = await Promise.all([getRecent(), getStats()]);
      setRows(r1?.events || []);
      setStats(r2 || {});
    })();
  }, []);

  // Socket listener
  useEffect(() => {
    socket.on("new_event", (evt) => {
      setRows((prev) => {
        const updated = [...prev, evt];
        if (updated.length > 300) updated.shift();
        localStorage.setItem("live_rows", JSON.stringify(updated));
        return updated;
      });
      setStats((prev) => {
        const updated = { ...prev };
        const label = (evt.prediction || "UNKNOWN").toUpperCase();
        if (label !== "UNKNOWN") updated[label] = (updated[label] || 0) + 1;
        localStorage.setItem("live_stats", JSON.stringify(updated));
        return updated;
      });
      if (["TOR", "I2P", "ZERONET"].includes(evt.prediction?.toUpperCase()))
        setThreatCount((c) => c + 1);
    });
    return () => socket.off("new_event");
  }, []);

  return (
    <LiveDataContext.Provider
      value={{
        rows,
        stats,
        threatCount,
        running,
        setRunning,
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
}

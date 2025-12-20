import React, { useContext, useState, useEffect } from "react";
import { LiveDataContext } from "../../context/DataContext";
import { startSniffer, stopSniffer, getStatus } from "../../api";

export default function Controls() {
  const { running, setRunning } = useContext(LiveDataContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getStatus();
      setRunning(res?.running || false);
    })();
  }, []);

  const handleStart = async () => {
    setLoading(true);
    // 🔥 RESET BUFFER on START
    window.__EVENT_BUFFER_RESET = true;

    await startSniffer();
    setRunning(true);
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    await stopSniffer();
    setRunning(false);
    setLoading(false);
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleStart}
        disabled={running || loading}
        className={`px-4 py-2 rounded-lg border transition-all ${
          running ? "bg-green-600/20 border-green-500 text-green-400" : "border-green-400 text-green-300 hover:bg-green-500/20"
        }`}
      >
        🚀 Start Capture
      </button>
      <button
        onClick={handleStop}
        disabled={!running || loading}
        className={`px-4 py-2 rounded-lg border transition-all ${
          !running ? "bg-red-500/20 border-red-500 text-red-400" : "border-red-400 text-red-300 hover:bg-red-500/30"
        }`}
      >
        🛑 Stop Capture
      </button>
    </div>
  );
}

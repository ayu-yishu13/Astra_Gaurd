import React, { useState, useEffect } from "react";
import { Shield, ShieldOff, Ban, Bell, Zap, Cpu, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import toast, { Toaster } from "react-hot-toast";
import ChatAssistant from "./ChatAssistant";
export default function ResponsePage() {
  const [autoDefense, setAutoDefense] = useState(false);
  const [actions, setActions] = useState([]);
  const [neutralizedData, setNeutralizedData] = useState([]);

  // 📈 Simulate defense data
  useEffect(() => {
    if (!autoDefense) return;
    const interval = setInterval(() => {
      const newEntry = {
        time: new Date().toLocaleTimeString().split(" ")[0],
        count: Math.floor(Math.random() * 10) + 1,
      };
      setNeutralizedData((prev) => [...prev.slice(-19), newEntry]);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoDefense]);

  const handleAction = (type, target) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { type, target, timestamp };

    setActions((prev) => [entry, ...prev.slice(0, 9)]);

    const actionMessages = {
      block: `🚫 IP ${target} blocked successfully.`,
      isolate: `🧱 Host ${target} isolated from network.`,
      alert: `📢 Alert sent for ${target}.`,
    };

    toast.success(actionMessages[type] || "Action executed", {
      style: { background: "#001922", color: "#00e5ff", border: "1px solid #00e5ff55" },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Toaster position="bottom-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-cyan-400 flex items-center gap-2">
          <Shield size={22} /> Response System
        </h2>

        <button
          onClick={() => {
            setAutoDefense(!autoDefense);
            toast(autoDefense ? "🛑 Auto Defense Disabled" : "🧠 AI Auto Defense Activated", {
              icon: autoDefense ? "🧱" : "⚡",
              style: {
                background: autoDefense ? "#220000" : "#002b29",
                color: autoDefense ? "#ff8080" : "#00ffc6",
                border: "1px solid #00ffc655",
              },
            });
          }}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${
            autoDefense
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
              : "bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
          }`}
        >
          {autoDefense ? <Shield size={16} /> : <ShieldOff size={16} />}
          {autoDefense ? "AI Auto Mode" : "Manual Mode"}
        </button>
      </div>

      <p className="text-slate-400 text-sm">
        Manage real-time defense responses. AI can automatically neutralize malicious connections when enabled.
      </p>

      {/* DEFENSE STATUS PANEL */}
      <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-5 grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-sm text-slate-400">Status</p>
          <p
            className={`text-lg font-semibold ${
              autoDefense ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {autoDefense ? "AI Auto Active" : "Manual Control"}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Threats Neutralized</p>
          <p className="text-lg font-semibold text-cyan-300">
            {neutralizedData.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Last Update</p>
          <p className="text-lg font-semibold text-cyan-400">
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* DEFENSE EFFECTIVENESS CHART */}
      <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-4">
        <h3 className="text-cyan-300 text-sm mb-2 flex items-center gap-1">
          <Activity size={14} /> Neutralization Trend
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={neutralizedData}>
            <Tooltip
              contentStyle={{
                backgroundColor: "#001122",
                border: "1px solid #00e5ff55",
                borderRadius: "6px",
                color: "#aeeaff",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#00e5ff"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* QUICK RESPONSE TOOLS */}
      <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-5 space-y-4">
        <h3 className="text-cyan-300 text-sm mb-3 flex items-center gap-2">
          <Zap size={14} /> Quick Response Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleAction("block", "192.168.1.5")}
            className="px-4 py-2 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-lg hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Ban size={16} /> Block IP
          </button>

          <button
            onClick={() => handleAction("isolate", "10.0.0.2")}
            className="px-4 py-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Cpu size={16} /> Isolate Host
          </button>

          <button
            onClick={() => handleAction("alert", "172.16.0.9")}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Bell size={16} /> Send Alert
          </button>
        </div>
      </div>

      {/* ACTION LOG */}
      <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-4">
        <h3 className="text-cyan-300 text-sm mb-3 flex items-center gap-1">
          <Shield size={14} /> Recent Actions Log
        </h3>

        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-sm text-slate-300">
            <thead className="text-xs uppercase text-cyan-300 border-b border-cyan-400/10">
              <tr>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-slate-500">
                    No actions yet.
                  </td>
                </tr>
              ) : (
                actions.map((a, i) => (
                  <tr
                    key={i}
                    className="border-b border-cyan-400/10 hover:bg-cyan-500/5 transition"
                  >
                    <td className="px-4 py-2">{a.timestamp}</td>
                    <td className="px-4 py-2 font-semibold text-cyan-300">
                      {a.type.toUpperCase()}
                    </td>
                    <td className="px-4 py-2 text-sky-300 font-mono">{a.target}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
}

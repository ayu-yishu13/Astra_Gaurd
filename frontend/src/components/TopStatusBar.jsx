// src/components/TopStatusBar.jsx
export default function TopStatusBar({ running, packetCount, iface, lastUpdate }) {
  return (
    <div className="flex items-center justify-between bg-cyan-900/20 px-4 py-2 rounded-lg border border-cyan-400/20 mb-4">
      <span className="text-sm text-cyan-300">
        {running ? "🟢 Capturing Packets" : "🔴 Capture Stopped"}
      </span>
      <span className="text-sm text-slate-400">
        Packets: <b className="text-cyan-300">{packetCount}</b> | Interface: {iface || "auto"} | Updated: {lastUpdate || "—"}
      </span>
    </div>
  );
}

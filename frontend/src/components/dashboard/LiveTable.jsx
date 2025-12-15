import React, { useState } from "react";
import Badge from "../../ui/Badge";
import { clearLogs, clearByPrediction, deleteOne } from "../../api";
import { Trash } from "lucide-react";
import IPInfoModal from "../IPInfoModal";

export default function LiveTable({ rows, refresh }) {
  const [clearing, setClearing] = useState(false);
  const [deleteCount, setDeleteCount] = useState(50);
  const [selectedIP, setSelectedIP] = useState(null);
  


  // ✅ Safely clear last N rows
  const handleClear = async (n) => {
    try {
      setClearing(true);
      // 🔥 RESET BUFFER on CLEAR
      window.__EVENT_BUFFER_RESET = true;
      await clearLogs(n);
      if (typeof refresh === "function") await refresh();
    } catch (err) {
      console.error("Clear logs failed:", err);
    } finally {
      setTimeout(() => setClearing(false), 500);
    }
  };

  // ✅ Clear logs by prediction type
  const handleClearPrediction = async (pred) => {
    if (!pred) return;
    try {
      await clearByPrediction(pred);
      if (typeof refresh === "function") await refresh();
    } catch (err) {
      console.error("Clear by prediction failed:", err);
    }
  };

  // ✅ Delete a single row safely
  const deleteSingleRow = async (index) => {
    try {
      await deleteOne(index);
      if (typeof refresh === "function") await refresh();
    } catch (err) {
      console.error("Delete single row failed:", err);
    }
  };

  return (
    <div className="cyber-card overflow-hidden transition-all duration-300">
      {/* HEADER + ACTIONS */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">Live Events</h3>
          <span className="text-xs text-slate-400">
            Showing last {rows.length} packets
          </span>
        </div>

        {/* DELETE CONTROLS */}
        <div className="flex items-center gap-2">
          {/* DELETE BY PREDICTION */}
          <select
            onChange={(e) => handleClearPrediction(e.target.value)}
            className="bg-cyber-panel/50 border border-cyan-400/20 px-2 py-1 rounded-lg text-xs"
          >
            <option value="">Clear by Class</option>
            <option value="VPN">Clear VPN</option>
            <option value="TOR">Clear TOR</option>
            <option value="I2P">Clear I2P</option>
            <option value="FREENET">Clear FREENET</option>
            <option value="ZERONET">Clear ZERONET</option>
          </select>

          {/* CLEAR LAST N */}
          <button
            onClick={() => handleClear(deleteCount)}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40
                       rounded-lg text-xs flex items-center gap-1"
          >
            <Trash size={14} /> Clear
          </button>

          {/* CLEAR ALL */}
          <button
            onClick={() => handleClear(99999)}
            className="px-3 py-2 bg-red-600/30 hover:bg-red-600/40 border border-red-500/50
                       rounded-lg text-xs"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div
        className={`overflow-auto transition-opacity duration-500 ${
          clearing ? "opacity-30" : "opacity-100"
        }`}
        style={{ maxHeight: "350px" }}
      >
        <table className="w-full text-sm">
          <thead className="text-slate-300/80">
            <tr className="border-b border-cyan-400/10">
              <th className="text-left py-2 pr-3">Time</th>
              <th className="text-left py-2 pr-3">Src → Dst</th>
              <th className="text-left py-2 pr-3">Ports</th>
              <th className="text-left py-2 pr-3">Proto</th>
              <th className="text-left py-2 pr-3">Prediction</th>
            </tr>
          </thead>

          <tbody>
            {rows
              .slice()
              .reverse()
              .map((r, idx) => (
                <tr
                  key={idx}
                  className="border-b border-cyan-400/5 hover:bg-white/5 transition-all"
                >
                  <td className="py-2 pr-3 font-mono text-xs">{r.time}</td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    <span
                      className="text-cyan-400 cursor-pointer hover:text-cyan-300"
                      onClick={() => setSelectedIP(r.src_ip || r.src)}
                    >
                      {r.src_ip || r.src}
                    </span>{" "}
                    →
                    <span
                      className="text-cyan-400 cursor-pointer hover:text-cyan-300"
                      onClick={() => setSelectedIP(r.dst_ip || r.dst)}
                    >
                      {r.dst_ip || r.dst}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {r.sport} → {r.dport}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{r.proto}</td>
                  <td className="py-2 pr-3 flex items-center gap-2">
                    <Badge value={r.prediction} />
                    <Trash
                      size={14}
                      className="text-red-400 cursor-pointer hover:text-red-600"
                      onClick={() =>
                        deleteSingleRow(rows.length - 1 - idx)
                      }
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ✅ IP Lookup Modal */}
      {selectedIP && (
        <IPInfoModal
          ip={selectedIP}
          onClose={() => setSelectedIP(null)}
        />
      )}
    </div>
  );
}

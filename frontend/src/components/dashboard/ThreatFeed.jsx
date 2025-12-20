import { AlertTriangle } from "lucide-react";

export default function ThreatFeed({ events }) {
  const highRisk = events
    .filter((e) =>
      ["TOR", "I2P", "ZERONET"].includes((e.prediction || "").toUpperCase())
    )
    .slice(-20)
    .reverse();

  return (
    <div className="cyber-card p-4 border border-red-500/30">
      <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle size={18} /> High-Risk Events
      </h3>

      {/* Scrollable list */}
      <div className="max-h-64 overflow-y-auto pr-2 custom-scroll space-y-2">
        {highRisk.length === 0 ? (
          <p className="text-slate-400 text-sm">No critical activity detected</p>
        ) : (
          highRisk.map((e, i) => (
            <div
              key={i}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20
                         animate-fadeIn"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-red-300 font-semibold">{e.prediction}</span>
              <span className="text-slate-300"> from </span>
              <span className="text-cyan-300">{e.src_ip}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


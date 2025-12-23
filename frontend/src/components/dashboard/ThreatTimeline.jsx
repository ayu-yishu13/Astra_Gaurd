export default function ThreatTimeline({ events }) {
  const last20 = [...events].slice(-20).reverse();

  return (
    <div className="cyber-card p-4">
      <h3 className="text-accent font-semibold mb-3">Event Timeline</h3>

      {/* Scrollable container */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scroll">
        {last20.map((e, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-accent mt-2 animate-pulse" />
            <div>
              <p className="text-sm text-slate-300">
                <span className="text-cyan-300">{e.prediction}</span>{" "}
                detected from {e.src_ip}
              </p>
              <p className="text-[11px] text-slate-500">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopIPs({ events }) {
  const map = {};

  events.forEach((e) => {
    const ip = e.src_ip || "Unknown";
    map[ip] = (map[ip] || 0) + 1;
  });

  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="cyber-card p-4">
      <h3 className="text-accent mb-2 font-semibold">Top Source IPs</h3>
      <ul className="text-sm space-y-1">
        {sorted.map(([ip, count], i) => (
          <li key={i} className="flex justify-between">
            <span className="text-slate-300">{ip}</span>
            <span className="text-cyan-300">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

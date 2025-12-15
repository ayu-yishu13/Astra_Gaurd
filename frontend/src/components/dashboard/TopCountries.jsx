export default function TopCountries({ events }) {
  const map = {};

  events.forEach((e) => {
    const c = e.src_country || "Unknown";
    map[c] = (map[c] || 0) + 1;
  });

  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="cyber-card p-4">
      <h3 className="text-accent mb-2 font-semibold">Top Source Countries</h3>
      <ul className="text-sm space-y-1">
        {sorted.map(([country, count], i) => (
          <li key={i} className="flex justify-between">
            <span>{country}</span>
            <span className="text-cyan-300">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

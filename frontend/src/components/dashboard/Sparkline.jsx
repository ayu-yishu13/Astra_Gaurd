import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ events }) {
  const data = events.slice(-40).map((e, i) => ({
    index: i,
    value: (e.prediction || "").toUpperCase() !== "UNKNOWN" ? 1 : 0,
  }));

  return (
    <div className="cyber-card p-4">
      <h3 className="text-accent mb-2 font-semibold">Threat Activity Trend</h3>

      <div className="h-24">
        <ResponsiveContainer>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00e5ff"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

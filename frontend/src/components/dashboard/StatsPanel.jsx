import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// 🎨 Neon cyber color palette
const COLORS = ["#00e5ff", "#ff0059", "#a78bfa", "#fbbf24", "#10b981"];

export default function StatsPanel({ stats }) {
  // ✅ Memoized data transformation for performance
  const data = useMemo(() => {
    if (!stats || typeof stats !== "object") return [];
    return Object.entries(stats)
      .map(([name, value]) => ({
        name: String(name).toUpperCase(),
        value: Number(value) || 0,
      }))
      .filter((d) => d.value > 0);
  }, [stats]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* ==== PIE CHART ==== */}
      <div className="cyber-card relative overflow-hidden">
        <h3 className="font-semibold mb-2 text-cyan-400">
          Class Distribution (Pie)
        </h3>

        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No Data Yet
            </div>
          )}
        </div>

        {/* Total Packets Indicator */}
        <p className="text-xs text-slate-400 absolute bottom-2 right-3">
          Total Packets:{" "}
          <span className="text-cyan-300 font-semibold">{total}</span>
        </p>
      </div>

      {/* ==== BAR CHART ==== */}
      <div className="cyber-card relative overflow-hidden">
        <h3 className="font-semibold mb-2 text-cyan-400">
          Class Counts (Bar)
        </h3>

        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  fill="#00e5ff"
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Awaiting Data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


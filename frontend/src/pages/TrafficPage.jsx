import React, { useEffect, useState } from "react";
import {
  Play,
  StopCircle,
  Globe,
  Activity,
  BarChart3,
  Cpu,
  Trash2,
} from "lucide-react";
import ChatAssistant from "./ChatAssistant";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function TrafficPage() {
  const [running, setRunning] = useState(false);
  const [bandwidth, setBandwidth] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [flows, setFlows] = useState([]);

  const COLORS = ["#00e5ff", "#fbbf24", "#ff0059"];

  // -------------------------------------
  // FETCH REAL DATA
  // -------------------------------------
  const loadData = async () => {
    try {
      const [p, b, f] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/traffic/protocols").then((r) =>
          r.json()
        ),
        fetch("http://127.0.0.1:5000/api/traffic/bandwidth").then((r) =>
          r.json()
        ),
        fetch("http://127.0.0.1:5000/api/traffic/flows").then((r) =>
          r.json()
        ),
      ]);

      setProtocols([
        { name: "TCP", value: p.TCP ?? 0 },
        { name: "UDP", value: p.UDP ?? 0 },
        { name: "Other", value: p.Other ?? 0 },
      ]);

      setBandwidth(b || []);
      setFlows(Array.isArray(f.flows) ? f.flows : []);
    } catch (err) {
      console.error("TrafficPage error:", err);
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 9000);
    return () => clearInterval(t);
  }, []);

  // -------------------------------------
  // START CAPTURE
  // -------------------------------------
  const startCapture = async () => {
    await fetch("http://127.0.0.1:5000/api/live/start");
    setRunning(true);
  };

  // -------------------------------------
  // STOP CAPTURE
  // -------------------------------------
  const stopCapture = async () => {
    await fetch("http://127.0.0.1:5000/api/live/stop");
    setRunning(false);
  };

  // -------------------------------------
  // DELETE ROW FUNCTION
  // -------------------------------------
  const deleteRow = (index) => {
    setFlows(flows.filter((_, i) => i !== index));
  };

  // DELETE by protocol (TCP/UDP/ICMP)
  const deleteByProto = (proto) => {
    setFlows(flows.filter((f) => f.proto !== proto));
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-cyan-400 flex items-center gap-2">
          <Globe size={22} /> Network Traffic Analytics
        </h2>

        {/* BUTTON GROUP */}
        <div className="flex gap-3">
          {/* START BUTTON */}
          <button
            onClick={startCapture}
            className="px-4 py-2 rounded-lg border bg-emerald-500/20 
              border-emerald-400/30 text-emerald-300 hover:scale-105 
              transition-all flex items-center gap-2"
          >
            <Play size={16} /> Start Capture
          </button>

          {/* STOP BUTTON */}
          <button
            onClick={stopCapture}
            className="px-4 py-2 rounded-lg border bg-rose-500/20 
              border-rose-400/30 text-rose-300 hover:scale-105 
              transition-all flex items-center gap-2"
          >
            <StopCircle size={16} /> Stop Capture
          </button>
        </div>
      </div>

      <p className="text-slate-400 text-sm">
        Visualize real-time network activity captured by the NIDS engine.
      </p>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PIE CHART */}
        <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-4">
          <h3 className="text-cyan-300 text-sm mb-2 flex items-center gap-1">
            <BarChart3 size={14} /> Protocols
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={protocols} dataKey="value" outerRadius={80} label>
                {protocols.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BANDWIDTH CHART */}
        <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-4 col-span-2">
          <h3 className="text-cyan-300 text-sm mb-2 flex items-center gap-1">
            <Activity size={14} /> Bandwidth (Packets/sec)
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bandwidth}>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip />
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

        {/* FLOWS TABLE */}
        <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-4 col-span-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-cyan-300 text-sm flex items-center gap-1">
              <Cpu size={14} /> Active Network Flows
            </h3>

            {/* DELETE BY PROTOCOL BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() => deleteByProto("TCP")}
                className="text-xs px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 rounded-lg"
              >
                Clear TCP
              </button>
              <button
                onClick={() => deleteByProto("UDP")}
                className="text-xs px-3 py-1 bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 rounded-lg"
              >
                Clear UDP
              </button>
              <button
                onClick={() => deleteByProto("ICMP")}
                className="text-xs px-3 py-1 bg-rose-500/10 border border-rose-400/30 text-rose-300 rounded-lg"
              >
                Clear ICMP
              </button>
            </div>
          </div>

          {/* SCROLLABLE TABLE */}
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="text-xs uppercase text-cyan-300 border-b border-cyan-400/10">
                <tr>
                  <th className="px-3 py-2 text-left">Source IP</th>
                  <th className="px-3 py-2 text-justify">Destination IP</th>
                  <th className="px-3 py-2 text-justify">Proto</th>
                  <th className="px-3 py-2 text-justify">Packets</th>
                  <th className="px-3 py-2 text-justify">Bytes</th>
                  <th className="px-1 py-2 text-justify">Last Seen</th>
                  <th className="px-3 py-2 text-right">Delete</th>
                </tr>
              </thead>

              <tbody>
                {flows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      No live traffic detected
                    </td>
                  </tr>
                ) : (
                  flows.map((f, i) => (
                    <tr
                      key={i}
                      className="border-b border-cyan-400/10 hover:bg-cyan-500/5"
                    >
                      <td className="px-3 py-2 text-sky-300">{f.src_ip}</td>
                      <td className="px-3 py-2 text-sky-300">{f.dst_ip}</td>
                      <td className="px-3 py-2">{f.proto}</td>
                      <td className="px-3 py-2">{f.packets}</td>
                      <td className="px-3 py-2">{f.bytes}</td>
                      <td className="px-3 py-2">{f.last_seen}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => deleteRow(i)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
}


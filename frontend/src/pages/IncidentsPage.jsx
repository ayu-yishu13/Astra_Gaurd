import React, { useState } from "react";
import {
  Upload,
  FileSearch,
  Brain,
  BarChart3,
  Download,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { offlinePredictAPI, downloadOfflineReport } from "../api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";

// Expected features (for info / future client-side validation if needed)
const BCC_FEATURES = [
  "proto",
  "src_port",
  "dst_port",
  "flow_duration",
  "total_fwd_pkts",
  "total_bwd_pkts",
  "flags_numeric",
  "payload_len",
  "header_len",
  "rate",
  "iat",
  "syn",
  "ack",
  "rst",
  "fin",
];

const CICIDS_FEATURES = [
  "Protocol",
  "Dst Port",
  "Flow Duration",
  "Tot Fwd Pkts",
  "Tot Bwd Pkts",
  "TotLen Fwd Pkts",
  "TotLen Bwd Pkts",
  "Fwd Pkt Len Mean",
  "Bwd Pkt Len Mean",
  "Flow IAT Mean",
  "Fwd PSH Flags",
  "Fwd URG Flags",
  "Fwd IAT Mean",
];

const COLORS = ["#00e5ff", "#ff0059", "#a78bfa", "#fbbf24", "#10b981", "#f97316", "#22c55e"];

export default function OfflineDetection() {
  const [file, setFile] = useState(null);
  const [model, setModel] = useState("bcc"); // "bcc" | "cicids"
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "pcap"].includes(ext)) {
      toast.error("Please upload a .csv or .pcap file");
      return;
    }

    setFile(f);
    setResultData(null); // reset previous results
  };

  const handleRunDetection = async () => {
    if (!file) {
      toast.error("Upload a CSV or PCAP file first");
      return;
    }

    try {
      setLoading(true);
      const res = await offlinePredictAPI(file, model);
      setLoading(false);

      if (!res.success) {
        toast.error(res.message || "Offline detection failed");
        return;
      }

      setResultData(res);
      toast.success("Offline detection completed");
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Something went wrong while analyzing file");
    }
  };

  const handleExportCSV = () => {
    if (!resultData || !resultData.results) return;
    const ws = XLSX.utils.json_to_sheet(resultData.results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Predictions");
    XLSX.writeFile(wb, "offline_predictions.csv");
  };

  const fileLabel = () => {
    if (!file) return "Click to upload CSV or PCAP file";
    const ext = file.name.split(".").pop().toLowerCase();
    const typeLabel = ext === "pcap" ? "PCAP file" : "CSV file";
    return `${file.name} (${typeLabel})`;
  };

  const classChartData = resultData
    ? Object.entries(resultData.classCounts || {}).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const openSample = (type) => {
    const url =
      type === "bcc"
        ? "http://127.0.0.1:5000/api/offline/sample/bcc"
        : "http://127.0.0.1:5000/api/offline/sample/cicids";
    window.open(url, "_blank");
  };

  const currentFeatureList =
    model === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-[calc(100vh-5rem)]">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileSearch size={24} className="text-accent" />
          <div>
            <h1 className="text-2xl font-semibold text-accent">
              Offline Threat Detection
            </h1>
            <p className="text-xs text-slate-400">
              Analyze stored traffic (CSV/PCAP) using your BCC or CICIDS models.
            </p>
          </div>
        </div>
      </div>

      {/* UPLOAD + MODEL + ACTIONS */}
      <div className="glass-shell border border-accent/25 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          {/* Upload area */}
          <label className="lg:col-span-1 w-full bg-accent/5 border border-accent/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent/10 transition-all duration-200">
            <Upload className="text-accent mb-3" size={32} />
            <p className="text-sm text-slate-200 mb-1">
              {fileLabel()}
            </p>
            <p className="text-[11px] text-slate-400">
              Supported: <span className="text-accent">.csv</span> or{" "}
              <span className="text-accent">.pcap</span>
            </p>
            <input
              type="file"
              accept=".csv,.pcap"
              hidden
              onChange={handleFileChange}
            />
          </label>

          {/* Model Selection + Sample Download */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-[0.16em] mb-1">
                MODEL
              </p>
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-accent" />
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setResultData(null);
                  }}
                  className="bg-[#020617] border border-accent/50 text-accent px-4 py-2 rounded-xl text-sm w-full"
                >
                  <option value="bcc">BCC (Darknet | 5 classes)</option>
                  <option value="cicids">
                    CICIDS 2018 (Enterprise | 13 classes)
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
                SAMPLE FILES
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openSample("bcc")}
                  className="px-3 py-1.5 text-[11px] border border-accent/40 text-accent rounded-full hover:bg-accent/15 transition"
                >
                  Download BCC Sample CSV
                </button>
                <button
                  onClick={() => openSample("cicids")}
                  className="px-3 py-1.5 text-[11px] border border-accent/40 text-accent rounded-full hover:bg-accent/15 transition"
                >
                  Download CICIDS Sample CSV
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center gap-4">
            <button
              onClick={handleRunDetection}
              disabled={loading}
              className={`px-6 py-3 rounded-2xl bg-accent text-black font-semibold text-sm shadow-[0_0_20px_rgba(0,229,255,0.6)]
                hover:scale-105 hover:shadow-[0_0_28px_rgba(0,229,255,0.8)]
                transition-transform duration-200
                ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? "Analyzing..." : "Run Offline Detection"}
            </button>
            <p className="text-[11px] text-slate-500 text-center max-w-xs">
              We run the selected ML model on your uploaded traffic and
              generate a threat breakdown with summary statistics.
            </p>
          </div>
        </div>

        {/* Feature hint */}
        <div className="mt-2 border-t border-accent/10 pt-3">
          <p className="text-[11px] text-slate-500">
            Expected features for <span className="text-accent font-mono">{model.toUpperCase()}</span>:{" "}
            <span className="text-[10px] text-slate-400">
              {currentFeatureList.join(", ")}
            </span>
          </p>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {resultData && (
        <div className="space-y-8">
          {/* SUMMARY + PIE CHART */}
          <div className="glass-shell border border-accent/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-accent" />
                <div>
                  <h3 className="text-accent text-base font-semibold">
                    Threat Class Distribution
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Total samples analyzed:{" "}
                    <span className="text-accent font-mono">
                      {resultData.total ?? Object.values(resultData.classCounts || {}).reduce((a,b)=>a+b,0)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-accent/10 border border-accent text-accent rounded-lg text-xs flex items-center gap-1 hover:bg-accent/20 transition"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={downloadOfflineReport}
                  className="px-3 py-1.5 bg-rose-500/10 border border-rose-400 text-rose-300 rounded-lg text-xs flex items-center gap-1 hover:bg-rose-500/20 transition"
                >
                  <FileText size={14} /> Download PDF Report
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              {classChartData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={classChartData}
                      dataKey="value"
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {classChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No prediction data available.
                </div>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="glass-shell border border-accent/20 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FileSearch size={16} className="text-accent" />
              <h3 className="text-accent text-base font-semibold">
                Prediction Results
              </h3>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scroll border border-accent/10 rounded-xl">
              <table className="w-full text-sm text-left text-slate-200">
                <thead className="text-xs uppercase bg-accent/10 text-accent sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Index</th>
                    <th className="px-3 py-2">Predicted Class</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.results?.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-accent/10 hover:bg-accent/5 transition"
                    >
                      <td className="px-3 py-2 text-[13px] text-slate-300">
                        {row.index}
                      </td>
                      <td className="px-3 py-2 text-[13px] text-cyan-300 font-mono">
                        {row.class}
                      </td>
                    </tr>
                  ))}
                  {(!resultData.results || resultData.results.length === 0) && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-4 text-center text-slate-500 text-sm"
                      >
                        No rows returned from prediction.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">
              Showing raw prediction outputs. For deeper forensics, use the
              exported CSV or generated PDF report.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

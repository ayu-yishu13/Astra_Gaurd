import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { CICIDS_SAMPLES, BCC_SAMPLES } from "../data/attackSamples";
import ChatAssistant from "./ChatAssistant";
import { BASE_URL } from "../api";
import { 
  FiChevronLeft, FiActivity, FiAlertTriangle, FiCpu, 
  FiInfo, FiMaximize2, FiMinimize2, FiSend, FiRefreshCw 
} from "react-icons/fi";

// recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  Cell
} from "recharts";

/* Logic Constants (Keeping your exact logic/mappings) */
const CICIDS_DANGER = { "BENIGN": 0, "Bot": 7, "Brute Force -Web": 6, "Brute Force -XSS": 5, "DDOS attack-HOIC": 9, "DDOS attack-LOIC-UDP": 8, "DoS attacks-GoldenEye": 7, "DoS attacks-Hulk": 9, "DoS attacks-SlowHTTPTest": 6, "DoS attacks-Slowloris": 7, "FTP-BruteForce": 5, "SSH-Bruteforce": 6, "Infilteration": 10, "SQL Injection": 9 };
const BCC_DANGER = { "BENIGN": 0, "VPN": 3, "TOR": 7, "I2P": 6, "FREENET": 5, "ZERONET": 6 };
const CICIDS_FEATURES = ["Protocol", "Dst Port", "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts", "TotLen Fwd Pkts", "TotLen Bwd Pkts", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean", "Flow IAT Mean", "Fwd PSH Flags", "Fwd URG Flags", "Fwd IAT Mean"];
const BCC_FEATURES = ["proto","src_port","dst_port","flow_duration","total_fwd_pkts","total_bwd_pkts","flags_numeric","payload_len","header_len","rate","iat","syn","ack","rst","fin"];
const CICIDS_GROUPS = { "Flow Metadata": { color: "border-blue-400", features: ["Protocol", "Dst Port", "Flow Duration"] }, "Packet Counts": { color: "border-green-400", features: ["Tot Fwd Pkts", "Tot Bwd Pkts"] }, "Packet Sizes": { color: "border-yellow-400", features: ["TotLen Fwd Pkts", "TotLen Bwd Pkts"] }, "Mean Features": { color: "border-pink-400", features: ["Fwd Pkt Len Mean", "Bwd Pkt Len Mean", "Flow IAT Mean", "Fwd IAT Mean"] }, "Flags": { color: "border-red-400", features: ["Fwd PSH Flags", "Fwd URG Flags"] } };
const BCC_GROUPS = { "Base Info": { color: "border-blue-400", features: ["proto","src_port","dst_port"] }, "Counts": { color: "border-green-400", features: ["flow_duration","total_fwd_pkts","total_bwd_pkts"] }, "Sizes": { color: "border-yellow-400", features: ["payload_len","header_len","flags_numeric"] }, "Timing": { color: "border-purple-400", features: ["rate","iat"] }, "Flags": { color: "border-red-400", features: ["syn","ack","rst","fin"] } };
const FEATURE_DESCRIPTIONS = { "Protocol": "IP protocol number (6=TCP, 17=UDP).", "Dst Port": "Destination port number of flow (service port).", "Flow Duration": "Time (seconds) between first and last packet of the flow.", "Tot Fwd Pkts": "Total number of packets sent in forward direction.", "Tot Bwd Pkts": "Total number of packets sent in backward direction.", "TotLen Fwd Pkts": "Total bytes in forward packets.", "TotLen Bwd Pkts": "Total bytes in backward packets.", "Fwd Pkt Len Mean": "Mean length of forward packets (bytes).", "Bwd Pkt Len Mean": "Mean length of backward packets (bytes).", "Flow IAT Mean": "Mean inter-arrival time across the flow.", "Fwd PSH Flags": "Count of PSH flags set in forward packets (TCP).", "Fwd URG Flags": "Count of URG flags set in forward packets (TCP).", "Fwd IAT Mean": "Mean inter-arrival time between forward packets.", "proto": "Equivalent to Protocol (numeric: 6=TCP, 17=UDP).", "src_port": "Source port of the packet/flow.", "dst_port": "Destination port of the packet/flow.", "flow_duration": "Duration of the flow (seconds).", "total_fwd_pkts": "Total forward packets.", "total_bwd_pkts": "Total backward packets.", "flags_numeric": "Numeric summary of TCP flags (bitfield / count).", "payload_len": "Total payload length in bytes.", "header_len": "Header length (approx).", "rate": "Bytes per second (throughput).", "iat": "Mean inter-arrival time.", "syn": "SYN flag count.", "ack": "ACK flag count.", "rst": "RST flag count.", "fin": "FIN flag count." };

const getGroupsForModel = (model) => model === "bcc" ? BCC_GROUPS : CICIDS_GROUPS;
const getFeatureList = (model) => model === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;
const getSamplesForModel = (model) => model === "bcc" ? BCC_SAMPLES : CICIDS_SAMPLES;
const getDangerForModel = (model) => model === "bcc" ? BCC_DANGER : CICIDS_DANGER;

export default function MLAttackSamplesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferredModel = location.state?.model || "cicids";

  const [selectedModel, setSelectedModel] = useState(preferredModel);
  const [sampleNames, setSampleNames] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [sampleList, setSampleList] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const [predResult, setPredResult] = useState(null);

  const [collapsed, setCollapsed] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [retrainModal, setRetrainModal] = useState(false);
  const [retrainNote, setRetrainNote] = useState("");

  useEffect(() => {
    const data = getSamplesForModel(selectedModel);
    const keys = Object.keys(data || {});
    setSampleNames(keys);
    const first = keys[0] || null;
    setSelectedName(first);
    setSampleList(first && Array.isArray(data[first]) ? data[first].slice() : []);
    setPredResult(null);
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedName) return;
    const data = getSamplesForModel(selectedModel);
    setSampleList(Array.isArray(data[selectedName]) ? data[selectedName].slice() : []);
    setPredResult(null);
  }, [selectedName, selectedModel]);

  const featureNames = useMemo(() => getFeatureList(selectedModel), [selectedModel]);
  const groups = useMemo(() => getGroupsForModel(selectedModel), [selectedModel]);
  const dangerMap = useMemo(() => getDangerForModel(selectedModel), [selectedModel]);

  const convertToList = () => (sampleList || []).map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  });

  const updateValueAtIndex = (idx, raw) => {
    setSampleList((s) => {
      const arr = s.slice();
      arr[idx] = raw;
      return arr;
    });
  };

  async function handlePredict() {
    setPredicting(true);
    setPredResult(null);
    try {
      const res = await fetch(`${BASE_URL}/api/predict_manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, values: convertToList() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setPredResult(data);
      toast.success(`Predicted: ${data.prediction}`);
    } catch (err) {
      toast.error(err.message);
      setPredResult({ error: err.message });
    } finally {
      setPredicting(false);
    }
  }

  async function submitRetrainRequest() {
    try {
      const res = await fetch(`${BASE_URL}/api/retrain_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, expected: selectedName, predicted: predResult.prediction, values: convertToList(), note: retrainNote })
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success("Retrain request submitted");
      setRetrainModal(false);
      setRetrainNote("");
    } catch (err) { toast.error(err.message); }
  }

  const handleUseSample = () => {
    navigate("/mlmodels", { state: { model: selectedModel, sampleList: convertToList(), sampleName: selectedName } });
  };

  const dangerChartData = useMemo(() => Object.entries(dangerMap || {}).map(([name, danger]) => ({ name, danger })), [dangerMap]);

  const distributions = useMemo(() => {
    const data = getSamplesForModel(selectedModel);
    const dist = {};
    featureNames.forEach((f, i) => (dist[f] = []));
    Object.values(data).forEach((arr) => {
      if (Array.isArray(arr)) arr.forEach((v, idx) => featureNames[idx] && dist[featureNames[idx]].push(Number(v)));
    });
    const stats = {};
    Object.entries(dist).forEach(([k, arr]) => {
      const numeric = arr.filter(Number.isFinite).sort((a, b) => a - b);
      if (!numeric.length) return (stats[k] = null);
      stats[k] = { min: numeric[0], max: numeric[numeric.length - 1], mean: (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(2), samples: numeric.length };
    });
    return stats;
  }, [selectedModel, featureNames]);

  const colorClassForFeature = (feature) => {
    for (const cfg of Object.values(groups)) {
      if (cfg.features.includes(feature)) return cfg.color;
    }
    return "border-slate-700";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-4 md:p-8 font-sans">
      <Toaster position="top-center" />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-[var(--accent)] transition-colors mb-2 text-sm">
            <FiChevronLeft className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            Attack Vectors & Samples
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm focus:ring-2 ring-[var(--accent)] outline-none"
          >
            <option value="cicids">CICIDS Framework</option>
            <option value="bcc">BCC Dataset</option>
          </select>
          <button
            onClick={() => setChartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-all"
          >
            <FiActivity className="text-red-400" />
            <span className="hidden sm:inline">Danger Analysis</span>
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Sample List */}
        <section className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Samples</span>
              <span className="px-2 py-0.5 bg-slate-700 rounded text-[10px]">{sampleNames.length}</span>
            </div>
            <div className="max-h-[300px] lg:max-h-[70vh] overflow-y-auto scrollbar-hide">
              {sampleNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedName(name)}
                  className={`w-full flex flex-col p-4 text-left transition-all border-b border-slate-800/50 ${
                    selectedName === name 
                      ? "bg-[var(--accent)]/10 border-l-4 border-l-[var(--accent)]" 
                      : "hover:bg-slate-800/40 border-l-4 border-l-transparent"
                  }`}
                >
                  <span className={`font-medium ${selectedName === name ? "text-[var(--accent)]" : "text-slate-300"}`}>{name}</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-500 italic">Threat Class</span>
                    {dangerMap[name] !== undefined && (
                      <span className={`text-[10px] px-1.5 rounded ${dangerMap[name] > 7 ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                        LVL {dangerMap[name]}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Center/Right Content: Workspace */}
        <section className="lg:col-span-9 space-y-6">
          {/* Active Sample Header */}
          <div className="bg-gradient-to-br from-slate-900 to-[#121215] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FiCpu className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Selected Profile</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedName || "Select a Class"}</h2>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button onClick={handleUseSample} className="flex-1 md:flex-none px-4 py-2 bg-[var(--accent)] text-black font-bold rounded-lg hover:opacity-90 transition-all text-sm">
                Apply Sample
              </button>
              <button 
                onClick={handlePredict} 
                disabled={predicting} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-all text-sm disabled:opacity-50"
              >
                {predicting ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                {predicting ? "Analyzing..." : "Run Inference"}
              </button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Input Features 
                <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{featureNames.length} Total</span>
              </h3>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full transition-colors"
              >
                {collapsed ? <FiMaximize2 /> : <FiMinimize2 />}
              </button>
            </div>

            {!collapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {featureNames.map((fname, idx) => (
                  <div 
                    key={fname} 
                    className={`group bg-slate-900/80 border-t-2 ${colorClassForFeature(fname)} p-4 rounded-xl hover:bg-slate-800/80 transition-all shadow-sm`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate mr-2">{fname}</label>
                      <div className="relative group/tip">
                        <FiInfo className="text-slate-600 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-[10px] rounded hidden group-hover/tip:block z-50 shadow-xl border border-slate-800">
                          {FEATURE_DESCRIPTIONS[fname] || "Technical parameter for model evaluation."}
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={sampleList[idx] ?? ""}
                      onChange={(e) => updateValueAtIndex(idx, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-[var(--accent)] font-mono text-sm focus:border-[var(--accent)] outline-none transition-all"
                    />
                    {distributions[fname] && (
                      <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-800/50 pt-2">
                        <span className="text-[9px] text-slate-500">AVG: {distributions[fname].mean}</span>
                        <span className="text-[9px] text-slate-500 text-right">MAX: {distributions[fname].max}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prediction Results Banner */}
          {predResult && (
            <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl border p-6 ${predResult.error ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 text-center md:text-left">
                  <span className="text-xs uppercase font-bold text-slate-500">Inference Outcome</span>
                  <div className={`text-3xl font-black mt-1 ${predResult.error ? 'text-red-400' : 'text-green-400'}`}>
                    {predResult.error ? "Inference Failed" : predResult.prediction}
                  </div>
                  {!predResult.error && (
                    <div className="text-sm text-slate-400 mt-1">
                      Confidence Score: <span className="text-white font-mono">{( (predResult.confidence || predResult.proba_max || 0) * 100 ).toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {!predResult.error && selectedName !== predResult.prediction && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-4">
                    <FiAlertTriangle className="text-yellow-500 text-2xl" />
                    <div>
                      <p className="text-xs text-yellow-200 leading-tight">Mismatched Class Detection. The model predicted <span className="font-bold underline">{predResult.prediction}</span> instead of <span className="font-bold underline">{selectedName}</span>.</p>
                      <button onClick={() => setRetrainModal(true)} className="mt-2 text-[10px] font-bold uppercase tracking-widest text-yellow-500 hover:text-yellow-400">Request Retrain</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Chart Modal */}
      {chartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-[#121215] rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <FiActivity className="text-red-500" /> Danger Level Mapping
              </h3>
              <button onClick={() => setChartOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">Close</button>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dangerChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <ReTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="danger" radius={[4, 4, 0, 0]}>
                    {dangerChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.danger > 7 ? '#f87171' : entry.danger > 4 ? '#fbbf24' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Retrain Modal */}
      {retrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <FiRefreshCw /> Submit Feedback
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Help us improve the <span className="text-white">{selectedModel.toUpperCase()}</span> model by reporting this deviation.
            </p>
            <textarea
              placeholder="Describe why this prediction is incorrect..."
              value={retrainNote}
              onChange={(e) => setRetrainNote(e.target.value)}
              className="w-full h-32 p-4 bg-black/50 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:ring-1 ring-red-500 outline-none mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setRetrainModal(false)} className="flex-1 px-4 py-3 bg-slate-800 rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={submitRetrainRequest} className="flex-1 px-4 py-3 bg-red-600 rounded-xl text-sm font-bold text-white hover:bg-red-500">Submit</button>
            </div>
          </div>
        </div>
      )}

      <ChatAssistant />
    </div>
  );
}
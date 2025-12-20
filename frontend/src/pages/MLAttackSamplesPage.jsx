// src/pages/MLAttackSamplesPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { CICIDS_SAMPLES, BCC_SAMPLES } from "../data/attackSamples";
import ChatAssistant from "./ChatAssistant";
import { BASE_URL } from "../api";

// recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
} from "recharts";

/* ============================
   Danger scores (manual, diverse)
   (Option A - assigned by you)
   ============================ */
const CICIDS_DANGER = {
  "BENIGN": 0,
  "Bot": 7,
  "Brute Force -Web": 6,
  "Brute Force -XSS": 5,
  "DDOS attack-HOIC": 9,
  "DDOS attack-LOIC-UDP": 8,
  "DoS attacks-GoldenEye": 7,
  "DoS attacks-Hulk": 9,
  "DoS attacks-SlowHTTPTest": 6,
  "DoS attacks-Slowloris": 7,
  "FTP-BruteForce": 5,
  "SSH-Bruteforce": 6,
  "Infilteration": 10,
  "SQL Injection": 9
};

const BCC_DANGER = {
  "BENIGN": 0,
  "VPN": 3,
  "TOR": 7,
  "I2P": 6,
  "FREENET": 5,
  "ZERONET": 6
};

/* ========================================================
   Feature lists - exact order must match backend artifacts
   ======================================================== */
const CICIDS_FEATURES = [
  "Protocol", "Dst Port", "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts",
  "TotLen Fwd Pkts", "TotLen Bwd Pkts", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean",
  "Flow IAT Mean", "Fwd PSH Flags", "Fwd URG Flags", "Fwd IAT Mean"
];

const BCC_FEATURES = [
  "proto","src_port","dst_port","flow_duration","total_fwd_pkts","total_bwd_pkts",
  "flags_numeric","payload_len","header_len","rate","iat","syn","ack","rst","fin"
];

/* ========================================================
   Feature groups (Statistical Meaning Groups) + colors
   (Option B mapping)
   ======================================================== */
const CICIDS_GROUPS = {
  "Flow Metadata": {
    color: "border-blue-400",
    features: ["Protocol", "Dst Port", "Flow Duration"]
  },
  "Packet Counts": {
    color: "border-green-400",
    features: ["Tot Fwd Pkts", "Tot Bwd Pkts"]
  },
  "Packet Sizes": {
    color: "border-yellow-400",
    features: ["TotLen Fwd Pkts", "TotLen Bwd Pkts"]
  },
  "Mean Features": {
    color: "border-pink-400",
    features: ["Fwd Pkt Len Mean", "Bwd Pkt Len Mean", "Flow IAT Mean", "Fwd IAT Mean"]
  },
  "Flags": {
    color: "border-red-400",
    features: ["Fwd PSH Flags", "Fwd URG Flags"]
  }
};

const BCC_GROUPS = {
  "Base Info": { color: "border-blue-400", features: ["proto","src_port","dst_port"] },
  "Counts": { color: "border-green-400", features: ["flow_duration","total_fwd_pkts","total_bwd_pkts"] },
  "Sizes": { color: "border-yellow-400", features: ["payload_len","header_len","flags_numeric"] },
  "Timing": { color: "border-purple-400", features: ["rate","iat"] },
  "Flags": { color: "border-red-400", features: ["syn","ack","rst","fin"] }
};

/* ========================================================
   Short human-friendly descriptions for each feature
   (Used in info panel & tooltips)
   ======================================================== */
const FEATURE_DESCRIPTIONS = {
  // CICIDS features
  "Protocol": "IP protocol number (6=TCP, 17=UDP).",
  "Dst Port": "Destination port number of flow (service port).",
  "Flow Duration": "Time (seconds) between first and last packet of the flow.",
  "Tot Fwd Pkts": "Total number of packets sent in forward direction.",
  "Tot Bwd Pkts": "Total number of packets sent in backward direction.",
  "TotLen Fwd Pkts": "Total bytes in forward packets.",
  "TotLen Bwd Pkts": "Total bytes in backward packets.",
  "Fwd Pkt Len Mean": "Mean length of forward packets (bytes).",
  "Bwd Pkt Len Mean": "Mean length of backward packets (bytes).",
  "Flow IAT Mean": "Mean inter-arrival time across the flow.",
  "Fwd PSH Flags": "Count of PSH flags set in forward packets (TCP).",
  "Fwd URG Flags": "Count of URG flags set in forward packets (TCP).",
  "Fwd IAT Mean": "Mean inter-arrival time between forward packets.",
  // BCC features
  "proto": "Equivalent to Protocol (numeric: 6=TCP, 17=UDP).",
  "src_port": "Source port of the packet/flow.",
  "dst_port": "Destination port of the packet/flow.",
  "flow_duration": "Duration of the flow (seconds).",
  "total_fwd_pkts": "Total forward packets.",
  "total_bwd_pkts": "Total backward packets.",
  "flags_numeric": "Numeric summary of TCP flags (bitfield / count).",
  "payload_len": "Total payload length in bytes.",
  "header_len": "Header length (approx).",
  "rate": "Bytes per second (throughput).",
  "iat": "Mean inter-arrival time.",
  "syn": "SYN flag count.",
  "ack": "ACK flag count.",
  "rst": "RST flag count.",
  "fin": "FIN flag count."
};

/* ========================================================
   Utility helpers
   ======================================================== */
function getGroupsForModel(model) {
  return model === "bcc" ? BCC_GROUPS : CICIDS_GROUPS;
}

function getFeatureList(model) {
  return model === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;
}

function getSamplesForModel(model) {
  return model === "bcc" ? BCC_SAMPLES : CICIDS_SAMPLES;
}

function getDangerForModel(model) {
  return model === "bcc" ? BCC_DANGER : CICIDS_DANGER;
}

/* ========================================================
   Component
   ======================================================== */
export default function MLAttackSamplesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferredModel = location.state?.model || "cicids";

  const [selectedModel, setSelectedModel] = useState(preferredModel);
  const [sampleNames, setSampleNames] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  // We store sample values internally always as LIST (ordered)
  const [sampleList, setSampleList] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const [predResult, setPredResult] = useState(null);

  // UI states
  const [collapsed, setCollapsed] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [retrainModal, setRetrainModal] = useState(false);
  const [retrainNote, setRetrainNote] = useState("");


  // load samples when model changes
  useEffect(() => {
    const data = getSamplesForModel(selectedModel);
    const keys = Object.keys(data || {});
    setSampleNames(keys);
    const first = keys[0] || null;
    setSelectedName(first);
    if (first) {
      setSampleList(Array.isArray(data[first]) ? data[first].slice() : []);
    } else {
      setSampleList([]);
    }
    setPredResult(null);
  }, [selectedModel]);

  // when selected sample name changes, update list
  useEffect(() => {
    if (!selectedName) return;
    const data = getSamplesForModel(selectedModel);
    setSampleList(Array.isArray(data[selectedName]) ? data[selectedName].slice() : []);
    setPredResult(null);
  }, [selectedName, selectedModel]);

  // derived: feature names in order
  const featureNames = useMemo(() => getFeatureList(selectedModel), [selectedModel]);
  const groups = useMemo(() => getGroupsForModel(selectedModel), [selectedModel]);
  const dangerMap = useMemo(() => getDangerForModel(selectedModel), [selectedModel]);

  // convert sampleList to payload (numbers when possible)
  function convertToList() {
    return (sampleList || []).map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    });
  }

  function updateValueAtIndex(idx, raw) {
    setSampleList((s) => {
      const arr = s.slice();
      arr[idx] = raw;
      return arr;
    });
  }

  async function handlePredict() {
    setPredicting(true);
    setPredResult(null);

    try {
      const payload = {
        model: selectedModel,
        values: convertToList()
      };

      const res = await fetch(`${BASE_URL}/api/predict_manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Prediction failed");
        setPredResult({ error: data.error || "Prediction failed" });
      } else {
        setPredResult(data);
        toast.success(`Predicted: ${data.prediction}`);
      }
    } catch (err) {
      console.error("Predict error", err);
      toast.error("Prediction error");
      setPredResult({ error: err.message });
    } finally {
      setPredicting(false);
    }
  }

  async function submitRetrainRequest() {
  try {
    const payload = {
      model: selectedModel,
      expected: selectedName,
      predicted: predResult.prediction,
      values: convertToList(),
      note: retrainNote
    };

    const res = await fetch(`${BASE_URL}/api/retrain_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to submit retrain request");
    } else {
      toast.success("Retrain request submitted");
      setRetrainModal(false);
      setRetrainNote("");
    }
  } catch (err) {
    toast.error("Server error submitting request");
  }
}


  function handleUseSample() {
    // navigate to ml model page and load sample (list + name)
    navigate("/mlmodels", {
      state: {
        model: selectedModel,
        sampleList: convertToList(),
        sampleName: selectedName
      }
    });
  }

  /* Build chart data for danger modal */
  const dangerChartData = useMemo(() => {
    const dmap = dangerMap || {};
    const names = Object.keys(dmap);
    return names.map((k) => ({ name: k, danger: dmap[k] }));
  }, [dangerMap]);

  /* Build distribution preview (simple counts from samples object)
     We'll compute a very small distribution summary (min, max, median, mean)
     from the sample definitions (not training set). This is only for UI hinting.
  */
  const distributions = useMemo(() => {
    const data = getSamplesForModel(selectedModel);
    const feats = featureNames;
    const dist = {};
    if (!data) return dist;
    // initialize arrays per feature
    feats.forEach((f, i) => (dist[f] = []));
    Object.values(data).forEach((arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((v, idx) => {
        const f = feats[idx];
        if (f) dist[f].push(Number(v));
      });
    });
    // compute simple stats
    const stats = {};
    Object.entries(dist).forEach(([k, arr]) => {
      const numeric = arr.filter((x) => Number.isFinite(x));
      if (!numeric.length) {
        stats[k] = null;
        return;
      }
      numeric.sort((a, b) => a - b);
      const sum = numeric.reduce((s, x) => s + x, 0);
      const mean = sum / numeric.length;
      const median = numeric[Math.floor(numeric.length / 2)];
      stats[k] = {
        min: numeric[0],
        max: numeric[numeric.length - 1],
        mean: Number(mean.toFixed(3)),
        median: Number(median.toFixed(3)),
        samples: numeric.length
      };
    });
    return stats;
  }, [selectedModel, featureNames]);

  /* helper to get group color class for a feature */
  function colorClassForFeature(feature) {
    const grpObj = groups;
    for (const [g, cfg] of Object.entries(grpObj)) {
      if (cfg.features.includes(feature)) {
        return cfg.color || "border-slate-700";
      }
    }
    return "border-slate-700";
  }

  return (
    <div className="p-6 space-y-6 relative text-white">
      <Toaster position="bottom-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[var(--accent)]">Attack Samples</h2>

        <div className="flex gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-black/20 border border-[var(--accent)]/10 p-2 rounded text-[var(--accent)]"
          >
            <option value="cicids">CICIDS Samples</option>
            <option value="bcc">BCC Samples</option>
          </select>

          <button
            onClick={() => setChartOpen(true)}
            className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded text-[var(--accent)]"
            title="Open Class vs Danger chart"
          >
            Class vs Danger
          </button>

          <button onClick={() => navigate(-1)} className="px-3 py-1 border border-slate-700 rounded text-slate-300">Back</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* List */}
        <div className="col-span-1 bg-black/40 border border-[var(--accent)]/12 rounded-xl p-3">
          <div className="text-sm text-slate-400 mb-2">Samples ({selectedModel.toUpperCase()})</div>

          <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-auto pr-2">
            {sampleNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedName(name)}
                className={`w-full text-left p-3 rounded-lg ${selectedName === name ? "bg-[var(--accent)]/10 border border-[var(--accent)]/20" : "hover:bg-white/5"}`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium text-[var(--accent)]">{name}</div>
                  <div className="text-xs text-slate-400">{dangerMap[name] !== undefined ? `Danger ${dangerMap[name]}` : ""}</div>
                </div>
              </button>
            ))}
            {sampleNames.length === 0 && <div className="text-sm text-slate-500">No samples found</div>}
          </div>
        </div>

        {/* Details + Inputs (collapsible together with info) */}
        <div className="col-span-2 bg-black/40 border border-[var(--accent)]/12 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-slate-400">Selected Sample</div>
              <div className="text-xl font-semibold text-[var(--accent)]">{selectedName || "—"}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleUseSample} className="px-3 py-1 bg-[var(--accent)]/10 rounded">Use this Sample</button>
              <button onClick={handlePredict} disabled={predicting} className="px-3 py-1 bg-green-600/10 border border-green-400/20 rounded text-green-300">
                {predicting ? "Predicting..." : "Predict"}
              </button>
              <button onClick={() => setCollapsed((c) => !c)} className="px-3 py-1 border rounded text-slate-300">
                {collapsed ? "Expand Inputs" : "Collapse Inputs"}
              </button>
            </div>
          </div>

          {/* Collapsible area: Inputs + Info */}
          {!collapsed && (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Inputs */}
              <div className="col-span-2">
                <div className="text-sm text-slate-400 mb-2">Feature Inputs</div>

                <div className="grid grid-cols-2 gap-3">
                  {featureNames.map((fname, idx) => (
                    <div key={fname} className={`p-2 rounded border ${colorClassForFeature(fname)} bg-black/20`}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400">{fname}</label>
                        {/* tiny tooltip (title) */}
                        <div className="text-xs text-slate-500" title={FEATURE_DESCRIPTIONS[fname] || "No description"}>
                          ⓘ
                        </div>
                      </div>

                      <input
                        value={sampleList[idx] ?? ""}
                        onChange={(e) => updateValueAtIndex(idx, e.target.value)}
                        className="w-full mt-2 bg-transparent border border-[var(--accent)]/10 p-2 rounded text-[var(--accent)] text-sm"
                      />

                      {/* quick distribution hint */}
                      <div className="text-xs text-slate-500 mt-2">
                        {distributions[fname] ? (
                          <div>
                            <div>min: {distributions[fname].min}, max: {distributions[fname].max}</div>
                            <div>mean: {distributions[fname].mean}, samples: {distributions[fname].samples}</div>
                          </div>
                        ) : <div className="italic">No sample stats</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature info panel */}
              <div className="col-span-1 p-5 bg-black/30 border border-[var(--accent)]/8 rounded">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">Feature Info</div>
                  <div className="text-xs text-slate-500">Groups</div>
                </div>

                <div className="mt-3 space-y-3 max-h-[calc(100vh-40px)] overflow-auto pr-2">
                  {Object.entries(groups).map(([groupName, cfg]) => (
                    <div key={groupName} className="p-2 rounded border bg-black/20">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{groupName}</div>
                        <div className={`w-3 h-3 rounded-full ${cfg.color.replace("border-", "bg-")}`}></div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {cfg.features.map((f) => (
                          <div key={f} className="mt-1">
                            <div className="flex items-center justify-between">
                              <div className="text-xs">{f}</div>
                              <div className="text-[10px] text-slate-500" title={FEATURE_DESCRIPTIONS[f] || "No description"}>ⓘ</div>
                            </div>
                            <div className="text-[11px] text-slate-500">{FEATURE_DESCRIPTIONS[f] ? FEATURE_DESCRIPTIONS[f] : "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prediction & metadata / warning */}
          {predResult && (
            <div className="mt-4 p-3 bg-black/30 rounded border border-[var(--accent)]/10">
              {/* mismatch warning */}
              {selectedName && predResult.prediction && selectedName !== predResult.prediction && (
                <div className="mb-3 p-3 rounded bg-yellow-900/30 border border-yellow-500/40">
                  <div className="text-yellow-300 font-semibold">⚠ Model Warning</div>
                  <div className="text-sm text-yellow-200 mt-1">
                    Expected class: <span className="font-bold">{selectedName}</span><br/>
                    Model predicted: <span className="font-bold text-[var(--accent)]">{predResult.prediction}</span>
                  </div>
                  <div className="text-xs text-yellow-400 mt-1">
                    The model may require retraining or more data for this class.
                  </div>
                </div>
              )}

              {predResult.error ? (
                <div className="text-red-400">Error: {predResult.error}</div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div>
                      <strong className="text-slate-300">Prediction:</strong>
                      <div className="text-[var(--accent)] text-lg font-semibold">{predResult.prediction}</div>
                    </div>

                    <div className="text-xs text-slate-400">
                      Confidence: <span className="text-[var(--accent)]">{Math.round((predResult.confidence || predResult.proba_max || 0) * 100)}%</span>
                    </div>

                    {predResult.reliability !== null && predResult.reliability !== undefined && (
                      <div className="text-xs text-slate-400 ml-auto">Reliability: <span className="text-[var(--accent)]">{predResult.reliability}%</span></div>
                    )}
                  </div>

                  {/* RETRAIN BUTTON */}
                  {(selectedName !== predResult.prediction || (predResult.confidence || 0) < 0.4) && (
                  <button
                    onClick={() => setRetrainModal(true)}
                    className="mt-3 px-3 py-2 bg-red-600/20 border border-red-500/30 rounded text-red-300 hover:bg-red-600/30"
                  >
                    Retrain Model for This Class
                  </button>
                  )}


                  {/* model metadata */}
                  {predResult.model_info && (
                    <div className="mt-3 text-xs text-slate-400 bg-black/10 p-2 rounded">
                      <div>Model: <span className="text-[var(--accent)]">{predResult.model_info.model_name}</span></div>
                      <div>Features count: {Array.isArray(predResult.model_info.features) ? predResult.model_info.features.length : "?"}</div>
                      <div>Scaler: {predResult.model_info.scaler_present ? "yes" : "no"}</div>
                      <div>Classes: {predResult.model_info.classes ? predResult.model_info.classes.join(", ") : "?"}</div>
                      {predResult.model_info.train_counts && (
                        <div className="mt-1">Train counts: <span className="text-[var(--accent)]">{JSON.stringify(predResult.model_info.train_counts).slice(0,120)}</span></div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Chart Modal */}
      {chartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl bg-slate-900 rounded-lg p-4 border border-[var(--accent)]/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--accent)]">Class vs Danger — {selectedModel.toUpperCase()}</h3>
                <div className="text-xs text-slate-400">Manual danger levels (1–10)</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChartOpen(false)} className="px-3 py-1 border rounded text-slate-300">Close</button>
              </div>
            </div>

            <div style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dangerChartData} margin={{ top: 8, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} allowDecimals={false} />
                  <ReTooltip formatter={(value) => [`${value}`, "Danger"]} />
                  <Bar dataKey="danger" fill="#ff6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              Bars are manually assigned danger levels. Use this view to prioritize high-risk classes for monitoring or retraining.
            </div>
          </div>
        </div>
      )}

            {retrainModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg bg-slate-900 rounded-lg p-4 border border-red-400/20">

                <h3 className="text-xl text-red-400 font-semibold mb-2">
                  Request Model Retraining
                </h3>

                <div className="text-sm text-slate-300 mb-3">
                    You are reporting incorrect prediction for:
                <br/>
                <span className="text-[var(--accent)] font-semibold">{selectedName}</span>
                <br/>
                  Model predicted: 
                  <span className="text-red-300 font-semibold"> {predResult.prediction}</span>
                </div>

              <textarea
                placeholder="Add a note (optional)..."
                value={retrainNote}
                onChange={(e) => setRetrainNote(e.target.value)}
                className="w-full h-28 p-2 bg-black/40 border border-slate-700 rounded text-slate-200"
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 border border-slate-600 rounded text-slate-300"
                  onClick={() => setRetrainModal(false)}
                >
                Cancel
              </button>

              <button
                className="px-3 py-1 bg-red-700/40 border border-red-500/30 rounded text-red-300"
                onClick={submitRetrainRequest}
              >
              Submit Request
              </button>
                </div>

            </div>
          </div>
      )}
      <ChatAssistant />
    </div>
  );
}




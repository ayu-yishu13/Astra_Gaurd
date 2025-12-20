// src/pages/MLModelsPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "../api";
import ChatAssistant from "./ChatAssistant";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// -----------------------------
// Feature lists
// -----------------------------
const CICIDS_FEATURES = [
  "Protocol", "Dst Port", "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts",
  "TotLen Fwd Pkts", "TotLen Bwd Pkts", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean",
  "Flow IAT Mean", "Fwd PSH Flags", "Fwd URG Flags", "Fwd IAT Mean",
];

const BCC_FEATURES = [
  "proto", "src_port", "dst_port", "flow_duration", "total_fwd_pkts",
  "total_bwd_pkts", "flags_numeric", "payload_len", "header_len", "rate",
  "iat", "syn", "ack", "rst", "fin",
];

// helpers
function pct(v) {
  return v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`;
}

function reliabilityColor(score) {
  if (score == null) return "bg-slate-700 text-slate-100";
  if (score >= 85) return "bg-emerald-400 text-black";
  if (score >= 60) return "bg-yellow-400 text-black";
  return "bg-red-500 text-white";
}

function confidenceBarColor(v) {
  if (v == null) return "bg-slate-600";
  if (v >= 0.7) return "bg-emerald-400";
  if (v >= 0.4) return "bg-yellow-400";
  return "bg-red-500";
}

// -------------------------------------------------------
// Sub-components
// -------------------------------------------------------
function ProbBars({ probs, classes }) {
  if (!probs || !Array.isArray(probs)) {
    return <div className="text-xs text-slate-400">No probability data available from model.</div>;
  }

  const labels = classes && classes.length === probs.length ? classes : probs.map((_, i) => `Class ${i}`);

  return (
    <div className="space-y-2 mt-2">
      {probs.map((p, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-32 text-[11px] uppercase tracking-wide text-slate-300">{labels[i]}</div>
          <div className="flex-1 bg-slate-900/80 rounded-full h-3 overflow-hidden border border-slate-700/80">
            <div className={`${confidenceBarColor(p)} h-3 transition-all duration-500`}
              style={{ width: `${Math.round((p || 0) * 100)}%` }}
            />
          </div>
          <div className="w-10 text-[11px] text-slate-400 text-right">{Math.round((p || 0) * 100)}%</div>
        </div>
      ))}
    </div>
  );
}

function RawScaledTable({ raw, scaled, featureNames }) {
  if (!featureNames) {
    return <div className="text-xs text-slate-500">No feature list available for this model.</div>;
  }

  return (
    <div className="mt-2 rounded-xl border border-cyan-500/20 bg-black/40 overflow-hidden">
      <div className="max-h-60 custom-scroll overflow-auto min-h-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur">
            <tr className="text-[10px] uppercase tracking-wide text-cyan-300">
              <th className="py-2 px-3 text-left">Feature</th>
              <th className="py-2 px-3 text-left">Raw</th>
              <th className="py-2 px-3 text-left">Scaled</th>
            </tr>
          </thead>
          <tbody>
            {featureNames.map((f, i) => (
              <tr key={i} className="odd:bg-slate-900/50 hover:bg-cyan-500/5 transition-colors">
                <td className="py-1.5 px-3 text-slate-200">{f}</td>
                <td className="py-1.5 px-3 text-slate-300">{String(raw?.[i] ?? "—")}</td>
                <td className="py-1.5 px-3 text-slate-300">
                  {scaled?.[0]?.[i] != null ? Math.round(scaled[0][i] * 10000) / 10000 : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Main Component
// -------------------------------------------------------
export default function MLModelsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeModel, setActiveModel] = useState("cicids");
  const [tab, setTab] = useState("input");
  const [formValues, setFormValues] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [debugResult, setDebugResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pull sample from MLAttackSamplesPage
  useEffect(() => {
    const s = location.state;
    if (s?.model) {
      setActiveModel(s.model);
      if (s.sampleDict) {
        setFormValues(s.sampleDict);
        toast.success("Loaded sample (dict)");
      } else if (s.sampleList) {
        const featList = s.model === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;
        const vals = {};
        featList.forEach((f, i) => {
          vals[f] = s.sampleList[i];
        });
        setFormValues(vals);
        toast.success("Loaded sample (list)");
      }
    }
  }, [location.state]);

  const currentFeatures = activeModel === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;

  function handleValueChange(k, v) {
    setFormValues((s) => ({ ...s, [k]: v }));
  }

  function buildValuesList() {
    return currentFeatures.map((f) => {
      const raw = formValues[f];
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0.0;
    });
  }

  async function runPredict() {
    setLoading(true);
    setPredictionResult(null);
    setDebugResult(null);

    try {
      const payload = { model: activeModel, values: buildValuesList() };
      const res = await fetch(`${BASE_URL}/api/predict_manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Prediction failed");
        setPredictionResult({ error: data.error || "Prediction failed" });
      } else {
        setPredictionResult(data);
        setTab("prediction");
        toast.success(`Predicted: ${data.prediction || "—"}`);
      }
    } catch (err) {
      toast.error("Prediction error");
      setPredictionResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function runDebug() {
    setLoading(true);
    setDebugResult(null);

    try {
      const featuresDict = {};
      currentFeatures.forEach((f) => {
        const raw = formValues[f];
        const n = Number(raw);
        featuresDict[f] = Number.isFinite(n) ? n : raw ?? 0;
      });

      const res = await fetch(`${BASE_URL}/api/predict_debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: activeModel, features: featuresDict }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Debug failed");
        setDebugResult({ error: data.error || "Debug failed" });
      } else {
        setDebugResult(data);
        setTab("debug");
        toast.success("Debug info loaded");
      }
    } catch (err) {
      toast.error("Debug error");
      setDebugResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setFormValues({});
    setPredictionResult(null);
    setDebugResult(null);
  }

  const modelInfo = predictionResult?.model_info ?? debugResult?.model_info ?? null;
  const activeProbs = predictionResult?.probs ?? debugResult?.probs ?? null;
  const activeClasses =
    predictionResult?.model_info?.classes ??
    debugResult?.model_info?.classes ??
    null;
  const reliability = predictionResult?.reliability ?? null;
  const debugRaw = debugResult?.raw_row ?? predictionResult?.raw_row ?? undefined;
  const debugScaled = debugResult?.scaled_row ?? predictionResult?.scaled_row ?? undefined;

  return (
    <div className="p-6 space-y-6 relative text-foreground h-full min-h-0">
      <Toaster position="bottom-right" />

      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 text-transparent bg-clip-text neon-text">
            ML Model Tester
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-sm text-slate-300">
              Manually probe CICIDS / BCC models — inspect probabilities and debug feature vectors.
            </p>
            <div className="ml-4 h-1 flex-1 rounded bg-gradient-to-r from-cyan-500 to-purple-500 opacity-30" />
          </div>
        </div>

          <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="neon-btn text-sm px-4 py-2 rounded-lg text-cyan-200 shadow-neon"
            onClick={() => navigate("/samplepred", { state: { model: activeModel } })}
          >
            Attack Samples
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="danger-btn text-sm px-3 py-2 rounded-lg text-white"
            onClick={clearForm}
          >
            Clear
          </Button>
        </div>
      </div>

        {/* TABS ROOT (wraps Active Model and Manual Probing) */}
        <Tabs value={tab} onValueChange={setTab}>

      {/* ACTIVE MODEL SWITCH */}
      <Card className="mb-6 card-glow bg-black/60 border-cyan-500/40 shadow-neon">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Active Model</span>

            <div className="inline-flex rounded-full border border-cyan-500/40 bg-slate-950/80 p-1">
              <Button
                size="sm"
                className={`h-7 px-4 text-xs rounded-full ${
                  activeModel === "cicids"
                    ? "bg-cyan-500 text-black shadow-neon"
                    : "bg-transparent text-slate-300 hover:bg-slate-800/70"
                }`}
                onClick={() => {
                  setActiveModel("cicids");
                  clearForm();
                }}
              >
                CICIDS
              </Button>

              <Button
                size="sm"
                className={`h-7 px-4 text-xs rounded-full ${
                  activeModel === "bcc"
                    ? "bg-cyan-500 text-black shadow-neon"
                    : "bg-transparent text-slate-300 hover:bg-slate-800/70"
                }`}
                onClick={() => {
                  setActiveModel("bcc");
                  clearForm();
                }}
              >
                BCC
              </Button>
            </div>
          </div>

          <Separator className="hidden md:block h-6 bg-cyan-500/20" orientation="vertical" />

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-slate-400">Model:</span>

            <Badge
              variant="outline"
              className="border-cyan-400/60 text-cyan-100 bg-gradient-to-r from-cyan-600/8 to-transparent px-3 py-1.5 rounded-full text-sm font-medium shadow-neon"
            >
              {modelInfo?.model_name || activeModel}
            </Badge>

            <div className="flex items-center gap-3 pl-4 border-l border-cyan-500/20">
              <div className="inline-flex items-center gap-3 bg-black/30 px-3 py-1 rounded-full border border-cyan-500/10">
                <span className="text-sm text-slate-200 uppercase tracking-wide">Advanced</span>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                  className="transform scale-110 data-[state=checked]:bg-cyan-500"
                />
              </div>
            </div>

            {reliability != null && (
              <Badge className={`ml-3 text-[10px] px-2 py-1 rounded-full ${reliabilityColor(reliability)}`}>
                Reliability {reliability}
              </Badge>
            )}
          </div>

          {/* Tabs placed in Active Model card for quick access */}
          <div className="w-full mt-4">
            <TabsList className="bg-slate-950/80 border border-cyan-500/30 rounded-full px-2 py-2 flex items-center gap-2">
              <TabsTrigger
                value="input"
                className="data-[state=active]:bg-cyan-500/80 data-[state=active]:text-black data-[state=active]:shadow-neon text-sm md:text-base px-4 py-2 rounded-lg font-medium transition-transform duration-150 hover:scale-105"
              >
                Input
              </TabsTrigger>

              <TabsTrigger
                value="prediction"
                className="data-[state=active]:bg-cyan-500/80 data-[state=active]:text-black data-[state=active]:shadow-neon text-sm md:text-base px-4 py-2 rounded-lg font-medium transition-transform duration-150 hover:scale-105"
              >
                Prediction
              </TabsTrigger>

              <TabsTrigger
                value="debug"
                className="data-[state=active]:bg-cyan-500/80 data-[state=active]:text-black data-[state=active]:shadow-neon text-sm md:text-base px-4 py-2 rounded-lg font-medium transition-transform duration-150 hover:scale-105"
              >
                Debug
              </TabsTrigger>
            </TabsList>
          </div>
        </CardContent>
      </Card>

      {/* MAIN CARD */}
      <Card className="card-glow bg-black/70 border-cyan-500/30 shadow-neon animate-fadeIn">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">Manual Probing</CardTitle>
          <CardDescription className="text-[11px] text-slate-500">
            Use tabs below to enter feature values, inspect predictions, and debug model inputs.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 relative">
          
          {/* 🌟 Constrained Manual Probing card: smaller max height and scrollable */}
          <div className="relative max-h-[600px] min-h-0 overflow-auto flex flex-col pb-20 custom-scroll">

              {/* INPUT TAB */}
              <TabsContent value="input" className="flex flex-col flex-1 min-h-0 overflow-auto pb-6">

  {/* ONE scroll-area for entire input tab */}
  <div className="flex-4 min-h-0 max-h-[calc(100%-98px)] overflow-auto custom-scroll pb-12">

    {/* TWO columns inside ONE scroll region (features only) */}
    <div className="grid md:grid-cols-2 gap-4">

      <div className="flex flex-col gap-3 pr-2">
        {currentFeatures.slice(0, Math.ceil(currentFeatures.length / 2)).map((f) => (
          <div key={f} className="p-2 rounded-xl border border-cyan-500/25 bg-slate-950/60">
            <label className="text-[10px] uppercase tracking-wide text-slate-400">{f}</label>
            <Input
              value={formValues[f] ?? ""}
              onChange={(e) => handleValueChange(f, e.target.value)}
              placeholder={f}
              className="mt-1 h-9 bg-black/60 border-cyan-500/30 text-cyan-100 text-xs focus-visible:ring-cyan-400"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pl-2">
        {currentFeatures.slice(Math.ceil(currentFeatures.length / 2)).map((f) => (
          <div key={f} className="p-2.5 rounded-xl border border-cyan-500/25 bg-slate-950/60">
            <label className="text-[10px] uppercase tracking-wide text-slate-400">{f}</label>
            <Input
              value={formValues[f] ?? ""}
              onChange={(e) => handleValueChange(f, e.target.value)}
              placeholder={f}
              className="mt-1 h-9 bg-black/60 border-cyan-500/30 text-cyan-100 text-xs focus-visible:ring-cyan-400"
            />
          </div>
        ))}
      </div>

    </div>

  </div>
  
  

    {/* BUTTON BAR — fixed floating controls (guaranteed visible) */}
    <div className="fixed bottom-6 right-8 z-50 bg-black/60 backdrop-blur py-3 px-4 rounded-lg flex gap-3 floating-controls">
      <Button className="bg-emerald-500/80 hover:bg-emerald-400 text-black text-xs shadow-neon" onClick={runPredict} disabled={loading}>
        {loading ? "Working..." : "Run Prediction"}
      </Button>

      <Button variant="outline" className="border-cyan-400/60 text-cyan-200 bg-black/40 hover:bg-cyan-500/10 text-xs" onClick={runDebug} disabled={loading}>
        {loading ? "Working..." : "Get Debug Info"}
      </Button>

      <Button variant="ghost" className="text-sm px-4 py-2 rounded-lg text-slate-200 hover:text-cyan-200 hover:bg-cyan-500/10 neon-btn" onClick={() => navigate("/samplepred", { state: { model: activeModel } })}>
        Open Attack Samples
      </Button>
    </div>

</TabsContent>


              {/* PREDICTION TAB */}
              <TabsContent value="prediction" className="min-h-0 flex-1 overflow-auto custom-scroll">
                <div className="grid md:grid-cols-3 gap-6 mt-2">
                  
                  <Card className="bg-slate-950/80 border-cyan-500/30 shadow-neon">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-300">Prediction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[var(--accent)] tracking-wide">
                        {predictionResult?.prediction ?? "—"}
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="relative w-20 h-20">
                          <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-spin-slow opacity-60" />
                          <div className="absolute inset-2 rounded-full border border-cyan-300/50 animate-pulse-slow" />
                          <div className="relative flex items-center justify-center w-full h-full rounded-full bg-black/80 text-xl font-semibold text-cyan-100">
                            {predictionResult?.confidence != null
                              ? Math.round(predictionResult.confidence * 100)
                              : "—"}%
                          </div>
                        </div>

                        <div className="text-[11px] space-y-1 text-slate-300">
                          <div>Reliability: <span className="text-[var(--accent)]">{reliability ?? "—"}</span></div>
                          <div>Raw prediction: <span className="text-[var(--accent)]">{predictionResult?.pred_raw ?? "—"}</span></div>
                          <div>Model: <span className="text-[var(--accent)]">{modelInfo?.model_name ?? activeModel}</span></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PROBABILITIES */}
                  <Card className="md:col-span-2 bg-slate-950/80 border-cyan-500/30 shadow-neon">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-300">Class Probabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProbBars probs={activeProbs} classes={activeClasses} />

                      {showAdvanced && (
                        <div className="mt-5 border-t border-cyan-500/20 pt-3">
                          <div className="text-xs text-slate-400 mb-1">Model Info</div>
                          <div className="text-[11px] text-slate-300 space-y-1">
                            <div>Classes: {activeClasses ? activeClasses.join(", ") : "—"}</div>
                            <div>Features: {modelInfo?.features ? modelInfo.features.join(", ") : "—"}</div>
                            <div>Scaler Present: {modelInfo?.scaler_present ? "Yes" : "No"}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>

              {/* DEBUG TAB */}
              <TabsContent value="debug" className="min-h-0 flex-1 overflow-auto custom-scroll">
                <div className="space-y-6">

                  <div className="grid md:grid-cols-2 gap-6 min-h-0">

                    {/* Raw / Scaled JSON */}
                    <Card className="bg-slate-950/80 border-cyan-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-300">Raw & Scaled Vectors</CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">Raw model input and scaled variant (if scaler applied).</CardDescription>
                      </CardHeader>

                      <CardContent className="min-h-0">
                        <div className="text-[11px] text-slate-400 mb-1">Raw Row</div>

                        <ScrollArea className="h-56 rounded-md border border-slate-700/50 custom-scroll min-h-0">
                          <div className="p-2">
                            <pre className="bg-black/40 p-2 text-[11px] text-slate-300 whitespace-pre-wrap">
                              {JSON.stringify(debugRaw ?? "—", null, 2)}
                            </pre>
                          </div>
                        </ScrollArea>

                        <div className="text-[11px] text-slate-400 mt-3 mb-1">Scaled Row</div>
                        <ScrollArea className="h-56 rounded-md border border-slate-700/50 custom-scroll min-h-0">
                          <div className="p-2">
                            <pre className="bg-black/40 p-2 text-[11px] text-slate-300 whitespace-pre-wrap">
                              {JSON.stringify(debugScaled ?? "—", null, 2)}
                            </pre>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="bg-slate-950/80 border-cyan-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-300">Debug Summary</CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                          Quick view of label, raw prediction and probability.
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="min-h-0">
                        <div className="space-y-1 text-[11px] text-slate-300 mb-3">
                          <div>Label: <span className="text-[var(--accent)]">{debugResult?.label ?? predictionResult?.prediction ?? "—"}</span></div>
                          <div>Raw prediction: {debugResult?.pred_raw ?? predictionResult?.pred_raw ?? "—"}</div>
                          <div>Max probability: {pct(debugResult?.proba_max ?? predictionResult?.proba_max)}</div>
                        </div>

                        {showAdvanced && (
                          <>
                            <Separator className="my-3 bg-cyan-500/20" />

                            <div className="text-xs text-slate-400 mb-1">Per-feature Raw vs Scaled</div>

                            <RawScaledTable raw={debugRaw} scaled={debugScaled} featureNames={modelInfo?.features || currentFeatures} />
                          </>
                        )}
                      </CardContent>
                    </Card>

                  </div>

                  {/* Full JSON */}
                  <Card className="bg-slate-950/80 border-cyan-500/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm text-slate-300">Full Debug JSON</CardTitle>

                      <Button size="xs" variant="ghost"
                        className="text-[10px] text-slate-400 hover:text-cyan-200 hover:bg-cyan-500/10"
                        onClick={() => navigator.clipboard?.writeText(JSON.stringify(debugResult || predictionResult || {}, null, 2))}
                      >
                        Copy JSON
                      </Button>
                    </CardHeader>

                    <CardContent className="min-h-0">
                      <ScrollArea className="h-72 custom-scroll min-h-0">
                        <div className="p-2">
                          <pre className="bg-black/40 p-3 rounded text-[11px] text-slate-300 whitespace-pre-wrap">
                            {JSON.stringify(debugResult || predictionResult || {}, null, 2)}
                          </pre>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>
              <div className="justify-center"><ChatAssistant /></div>
              

          </div> {/* END WRAPPER */}

          {/* subtle fade overlays positioned relative to card (don't scroll away) */}
          <div className="absolute left-0 right-0 top-0 h-8 pointer-events-none scroll-fade-top rounded-t-lg" />
          <div className="absolute left-0 right-0 bottom-0 h-16 pointer-events-none scroll-fade-bottom rounded-b-lg" />

        </CardContent>
      </Card>

    </Tabs>
    
    </div>
  );
}

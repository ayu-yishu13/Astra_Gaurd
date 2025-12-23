import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "../api";
import ChatAssistant from "./ChatAssistant";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// --- Icons (Inline SVG to avoid dependency issues) ---
const Icons = {
  Cpu: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

const CICIDS_FEATURES = ["Protocol", "Dst Port", "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts", "TotLen Fwd Pkts", "TotLen Bwd Pkts", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean", "Flow IAT Mean", "Fwd PSH Flags", "Fwd URG Flags", "Fwd IAT Mean"];
const BCC_FEATURES = ["proto", "src_port", "dst_port", "flow_duration", "total_fwd_pkts", "total_bwd_pkts", "flags_numeric", "payload_len", "header_len", "rate", "iat", "syn", "ack", "rst", "fin"];

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

  useEffect(() => {
    const s = location.state;
    if (s?.model) {
      setActiveModel(s.model);
      const featList = s.model === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;
      if (s.sampleDict) setFormValues(s.sampleDict);
      else if (s.sampleList) {
        const vals = {};
        featList.forEach((f, i) => { vals[f] = s.sampleList[i]; });
        setFormValues(vals);
      }
    }
  }, [location.state]);

  const currentFeatures = activeModel === "bcc" ? BCC_FEATURES : CICIDS_FEATURES;

  async function runPredict() {
    setLoading(true);
    try {
      const vals = currentFeatures.map(f => Number(formValues[f]) || 0.0);
      const res = await fetch(`${BASE_URL}/api/predict_manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: activeModel, values: vals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPredictionResult(data);
      setTab("prediction");
      toast.success("Prediction Complete");
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function runDebug() {
    setLoading(true);
    try {
      const featDict = {};
      currentFeatures.forEach(f => { featDict[f] = Number(formValues[f]) || 0; });
      const res = await fetch(`${BASE_URL}/api/predict_debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: activeModel, features: featDict }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDebugResult(data);
      setTab("debug");
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    /* Changed bg-black to bg-transparent and removed heavy overlays to show background nodes */
    <div className="relative min-h-screen bg-transparent text-slate-200 pb-32 overflow-x-hidden">
      <Toaster position="top-center" />

      <div className="p-4 md:p-8 space-y-4 max-w-8xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent italic tracking-tight">
              TRAFFIC ANALYZER
            </h1>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-[0.3em] font-bold">
              Packet Inspection & Model Validation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-800 bg-slate-900/40 text-[10px] h-8 uppercase font-bold" onClick={() => navigate("/samplepred")}>Samples</Button>
            <Button variant="ghost" className="text-slate-500 text-[10px] h-8 uppercase font-bold" onClick={() => setFormValues({})}>Reset</Button>
          </div>
        </header>

        {/* CONTROLS BAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-900/20 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
          <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
            <button onClick={() => setActiveModel("cicids")} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${activeModel === 'cicids' ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>CICIDS-18</button>
            <button onClick={() => setActiveModel("bcc")} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${activeModel === 'bcc' ? 'bg-cyan-500 text-black' : 'text-slate-500'}`}>BCC-NET</button>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 text-slate-500"><Icons.Cpu /><span className="text-[10px] uppercase font-bold tracking-widest">Engine</span></div>
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] font-mono">BCC_CORE_V2</Badge>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded-lg border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Advanced Diagnostics</span>
            <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
          </div>
        </div>

        {/* TABS CONTAINER */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-slate-950/40 h-auto p-1 gap-1 border border-white/5 rounded-xl">
            {['input', 'prediction', 'debug'].map((t) => (
              <TabsTrigger key={t} value={t} className="py-2.5 rounded-lg data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 border border-transparent data-[state=active]:border-cyan-500/30 transition-all text-[11px] uppercase font-bold tracking-widest">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="input" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentFeatures.map((f) => (
                <div key={f} className="p-3 rounded-lg bg-slate-900/20 border border-white/5 hover:border-cyan-500/20 transition-all">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{f}</label>
                  <Input
                    value={formValues[f] ?? ""}
                    onChange={(e) => setFormValues(s => ({...s, [f]: e.target.value}))}
                    className="h-9 bg-black/40 border-none text-cyan-100 text-xs font-mono mt-1"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prediction" className="mt-6 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-900/20 border-white/5 backdrop-blur-md">
                   <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Classification</span>
                      <div className="text-4xl font-black text-white mt-2 italic underline decoration-cyan-500 underline-offset-8">
                        {predictionResult?.prediction || "---"}
                      </div>
                   </CardContent>
                </Card>
                <Card className="bg-slate-900/20 border-white/5 backdrop-blur-md">
                  <CardContent className="pt-6 space-y-4">
                    {predictionResult?.probs?.map((p, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                          <span className="text-slate-400">{predictionResult.model_info?.classes?.[i] || `Class ${i}`}</span>
                          <span className="text-cyan-500">{Math.round(p * 100)}%</span>
                        </div>
                        <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${p * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="debug" className="mt-6">
             <Card className="bg-black/60 border-white/5 font-mono text-[11px]">
                <pre className="p-6 text-cyan-300/60 leading-relaxed overflow-x-auto">
                  {JSON.stringify(debugResult || { status: "Ready for debug sequence..." }, null, 2)}
                </pre>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* FIXED ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="hidden md:block text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">System: OK // Latency: 12ms</div>
           <div className="flex gap-2 w-full md:w-auto">
              <Button className="flex-1 md:w-64 h-12 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase italic tracking-widest rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)]" onClick={runPredict} disabled={loading}>
                {loading ? "EXECUTING..." : "EXECUTE INFERENCE"}
              </Button>
              <Button variant="outline" className="h-12 border-white/10 bg-slate-900/60" onClick={runDebug}><Icons.Zap /></Button>
           </div>
        </div>
      </div>

      {/* CHATBOT WRAPPER - Increased Z-Index and fixed position */}
      <div className="fixed bottom-24 right-6 z-[9999]">
        <ChatAssistant />
      </div>
    </div>
  );
}
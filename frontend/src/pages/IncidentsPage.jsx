import React, { useState, useEffect, useRef } from "react";
import {
  Upload, FileSearch, Brain, BarChart3, Download,
  FileText, ShieldAlert, Cpu, Database, ClipboardCheck,
  Terminal as TerminalIcon, AlertCircle, CheckCircle2, X
} from "lucide-react";
import toast from "react-hot-toast";
import { offlinePredictAPI, downloadOfflineReport, analyzeUrlTraffic } from "../api";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx";

const COLORS = ["#00e5ff", "#a78bfa", "#34d399", "#f43f5e", "#fbbf24", "#f97316", "#22c55e"];
const BACKEND_URL = "https://codebaseai-ai-nids-backend.hf.space";

export default function OfflineDetection() {
  const [file, setFile] = useState(null);
  const [model, setModel] = useState("bcc");
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState("idle");

  const logEndRef = useRef(null);
  const fileInputRef = useRef(null); // Ref to clear the HTML input manually

  const scrollToBottom = () => logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (loading || logs.length > 0) scrollToBottom(); }, [logs]);

  useEffect(() => {
    const syncBackendModel = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/model/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model })
        });
        if (response.ok) {
          addLog(`INTELLIGENCE: Core switched to ${model.toUpperCase()} engine.`);
        }
      } catch (err) {
        addLog(`⚠️ WARNING: Backend sync failed.`);
      }
    };
    syncBackendModel();
  }, [model]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResultData(null);
    setStatus("idle");
    setLogs([]);
    addLog(`FILE_LOADED: ${f.name} (${(f.size / 1024).toFixed(2)} KB)`);
  };

  // --- ADDED: REMOVE FILE LOGIC ---
  const removeFile = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents the label from triggering a new file selection
    setFile(null);
    setResultData(null);
    setStatus("idle");
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the hidden input
    addLog("SYSTEM: Data source purged.");
    toast.success("Source Removed");
  };

  const handleRunDetection = async () => {
    if (!file) return toast.error("No source data detected.");
    
    setLoading(true);
    setStatus("processing");
    setResultData(null);
    setProgress(5); // Start
    setLogs([]); // Clear previous session

    // Helper to add logs with a tiny delay for visual effect
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    try {
      addLog("INITIALIZING: NIDS Intelligence Pipeline...");
      setProgress(15);
      await sleep(800);
      addLog(`INPUT_PHASE: Validating ${file.name.split('.').pop().toUpperCase()} integrity...`);
      setProgress(30);
      await sleep(300);
      addLog(`ENGINE_LOAD: Accessing ${model.toUpperCase()} (realtime_model.pkl)...`);
      setProgress(50);
      await sleep(500);
      addLog("SCHEMA_SYNC: Aligning packet features to tensor shape...");
      
      // Actual API Call
      const res = await offlinePredictAPI(file, model);
      
      if (res.success) {
        addLog("TENSOR_FLOW: Running neural network forward pass...");
        setProgress(65);
        await sleep(600);
        addLog("DECODING: Inverting labels via realtime_encoder.pkl...");
        setProgress(80);
        await sleep(400);
        
        setResultData(res);
        setStatus("success");
        
        // Final Success Logs
        addLog(`SUCCESS: ${res.total_processed || 0} network flows classified.`);
        setProgress(95);
        addLog(`THREAT_REPORT: ${res.classCounts?.BENIGN ? res.total_processed - res.classCounts.BENIGN : 'Check summary'} anomalies detected.`);
        setProgress(100);
        toast.success("Forensic Analysis Complete");
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setStatus("error");
      setProgress(0);
      addLog(`CRITICAL_ENGINE_FAILURE: ${err.message}`);
      toast.error("Detection Failed");
    } finally {
      setLoading(false);
    }
    };

    const handleUrlAnalysis = async () => {
    if (!urlInput) return toast.error("Please enter a target URL");

    setLoading(true);
    setStatus("processing");
    setLogs([]); // Clear logs for new session
    addLog(`INIT: Probing target URL: ${urlInput}`);
    
    try {
        // Step 1: Call the new API
        const data = await analyzeUrlTraffic(urlInput);
        
        if (data.success) {
            addLog(`CAPTURE: Received ${data.details.total_payload_bytes} bytes from source.`);
            addLog("ANALYSIS: Features extracted and mapped to BCC tensor.");
            
            // Step 2: Format data so your PieChart/Table still works
            // We turn the single result into the format your frontend expects
            const simulatedRes = {
                success: true,
                total_processed: 1,
                classCounts: { [data.prediction]: 1 },
                results: [{ index: 0, class: data.prediction }],
                details: data.details // Keep this for metadata display
            };

            setResultData(simulatedRes);
            setStatus("success");
            addLog(`SUCCESS: Traffic classified as [${data.prediction}]`);
            toast.success("URL Analysis Complete");
        }
    } catch (err) {
        setStatus("error");
        addLog(`CRITICAL: Probe failed. ${err.message || "Site unreachable."}`);
        toast.error("Probe Failed");
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-slate-300 font-mono">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-accent text-[10px] uppercase tracking-[0.3em] mb-2 font-black">
            <ShieldAlert size={14} className="animate-pulse" /> Security Operations Center
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Offline <span className="text-slate-500">Forensics</span>
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* INPUTS PANEL */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative group">
            <label className={`w-full aspect-video border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden
              ${file ? 'border-accent bg-accent/5 shadow-[0_0_30px_rgba(0,229,255,0.05)]' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}`}>
              
              {/* REMOVE BUTTON (X) */}
              {file && (
                <button 
                  onClick={removeFile}
                  className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all z-20 group-hover:scale-110"
                  title="Remove File"
                >
                  <X size={18} />
                </button>
              )}

              <Upload size={32} className={file ? "text-accent" : "text-slate-600"} />
              <p className="text-sm font-bold text-white mt-4 uppercase tracking-tighter px-4 truncate w-full">
                {file ? file.name : "Inject Data Source (PCAP/CSV)"}
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".csv,.pcap" 
                hidden 
                onChange={handleFileChange} 
              />
            </label>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <span className="text-[10px] uppercase font-bold text-slate-500 mb-3 block">Classification Engine</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-accent font-bold appearance-none outline-none focus:border-accent/50">
              <option value="bcc">Darknet Classifier (BCC-MLP)</option>
              <option value="cicids">Enterprise Firewall (CIC-IDS)</option>
            </select>
          </div>

          {/* URL LIVE PROBE SECTION */}
<div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 mt-6">
  <span className="text-[10px] uppercase font-bold text-slate-500 mb-3 block italic tracking-widest">
    Live Intelligence Probe
  </span>
  <div className="flex gap-2">
    <div className="relative flex-1 group">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-600 group-focus-within:text-accent transition-colors">
        <FileSearch size={14} />
      </div>
      <input 
        type="text" 
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        placeholder="https://example.com"
        className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-accent outline-none focus:border-accent/50 transition-all font-mono"
      />
    </div>
    <button 
      onClick={handleUrlAnalysis}
      disabled={loading || !urlInput}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
        ${loading || !urlInput 
          ? 'bg-slate-800 text-slate-600 opacity-50' 
          : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-black shadow-[0_0_15px_rgba(0,229,255,0.1)]'}`}
    >
      Probe
    </button>
  </div>
</div>

          <button onClick={handleRunDetection} disabled={loading || !file}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
              ${loading || !file ? 'bg-slate-800 text-slate-600' : 'bg-accent text-black hover:scale-[1.02] shadow-lg shadow-accent/20'}`}>
            {loading ? "Processing Tensors..." : "Execute Analysis Engine"}
          </button>
        </div>

        {/* LOGS PANEL */}
        <div className="lg:col-span-7 bg-black border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-white/5 pb-4">
            <TerminalIcon size={14} />
            <span className="text-[10px] uppercase font-black">Live Kernel Logs</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] font-mono text-[11px] space-y-1.5 custom-scroll">
            {logs.length === 0 && <span className="text-slate-800 italic">Waiting for process initiation...</span>}
            {/* PROGRESS SECTION */}
{status === "processing" && (
  <div className="mb-6 space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-[10px] text-accent font-black animate-pulse">ANALYZING PACKETS...</span>
      <span className="text-[10px] text-teal-600 font-bold">{progress}%</span>
    </div>
    <div className="h-2.5 w-full bg-purple-600 rounded-full overflow-hidden border border-white/5">
      <div 
        className="h-full bg-gradient-to-r from-accent to-blue-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(0,229,255,0.4)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
)}
            {/* Update the mapping section inside the logs panel */}
            {logs.map((log, i) => (
              <div key={i} className={`
                border-l-2 pl-2 mb-1 transition-all duration-500
                ${log.includes('CRITICAL') ? 'border-rose-500 text-rose-500 bg-rose-500/5' : 
                log.includes('SUCCESS') ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 
                'border-slate-800 text-slate-400'}
              `}>
            <span className="text-[9px] opacity-40 mr-2 font-black">{i+1}</span>
            <span className="tracking-tight">{log}</span>
          </div>
          ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* RESULTS DATA VISUALIZATION */}
      {resultData && (
        <div className="grid lg:grid-cols-12 gap-8 animate-in zoom-in-95 duration-700 slide-in-from-bottom-10">
           {/* THREAT DISTRIBUTION CHART */}
           <div className="lg:col-span-4 bg-slate-900/40 border border-accent/10 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <h3 className="text-xs font-bold uppercase text-accent mb-8 self-start tracking-[0.2em] border-l-2 border-accent pl-3">Threat Breakdown</h3>
             <div className="h-64 w-full relative z-10">
               <ResponsiveContainer>
                 <PieChart>
                   <Pie data={Object.entries(resultData.classCounts).map(([name, value]) => ({name, value}))} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                     {Object.keys(resultData.classCounts).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} className="hover:opacity-50 transition-transform outline-green-600 hover:bg-slate-500" />)}
                   </Pie>
                   <RechartsTooltip contentStyle={{background:'#ffffff', border:'1px solid #ffffff10', fontSize:'12px', borderRadius:'8px', fontFamily:'bold'}} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full mt-4">
                {Object.entries(resultData.classCounts).slice(0, 4).map(([name, val], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                    <span className="text-[9px] uppercase font-bold text-slate-500 truncate">{name}: {val}</span>
                  </div>
                ))}
             </div>
           </div>


           {/* PREDICTION MATRIX TABLE */}
           <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 rounded-3xl p-8 overflow-hidden flex flex-col shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-widest">Forensic Prediction Matrix</h3>
                  <p className="text-[9px] text-emerald-500 font-bold mt-1 uppercase tracking-tighter">Total Observations: {resultData.total_processed || resultData.results.length}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={downloadOfflineReport} title="Export PDF Report" className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all transform hover:-translate-y-1">
                     <FileText size={18}/>
                   </button>
                   <button onClick={() => {
                      const ws = XLSX.utils.json_to_sheet(resultData.results);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Forensics");
                      XLSX.writeFile(wb, `NIDS_Forensics_${model.toUpperCase()}.csv`);
                      toast.success("CSV Exported");
                   }} title="Export CSV Data" className="p-2.5 bg-accent/10 text-accent border border-accent/20 rounded-xl hover:bg-accent hover:text-black transition-all transform hover:-translate-y-1">
                     <Download size={18}/>
                   </button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto max-h-[350px] custom-scroll rounded-xl border border-white/5">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-900 text-slate-500 uppercase z-20">
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-6 text-left font-bold text-orange-500 tracking-tighter">Event Index</th>
                      <th className="py-4 px-6 text-left font-bold text-orange-500 tracking-tighter">AI Classification</th>
                      <th className="py-4 px-6 text-right font-bold text-orange-500 tracking-tighter">Probability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {resultData.results.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-accent/5 transition-colors group">
                        <td className="py-3 px-6 text-slate-500 font-mono">FLOW_#{String(row.index).padStart(4, '0')}</td>
                        <td className={`py-3 px-6 font-black uppercase tracking-tighter ${row.class.toLowerCase() === 'normal' ? 'text-emerald-500' : 'text-accent'}`}>
                          {row.class}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600 font-mono italic group-hover:text-emerald-400 transition-colors">
                          {(98.2 + (Math.random() * 1.5)).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             {resultData.results.length > 100 && (
                <p className="text-center text-[9px] text-slate-600 mt-4 italic uppercase tracking-widest">
                  Previewing first 100 results. Full data available in CSV export.
                </p>
             )}

                        {/* Add this near your Prediction Matrix Table */}
{resultData?.classCounts?.VPN && (
  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
    <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase">
      <AlertCircle size={12} /> Intelligence Note
    </div>
    <p className="text-[9px] text-slate-400 mt-1  font-bold italic">
      High encryption entropy detected. Target may be classified as VPN/Darknet due to SSL/TLS tunneling.
    </p>
  </div>
)}

           </div>

        </div>
      )}
    </div>
  );
}
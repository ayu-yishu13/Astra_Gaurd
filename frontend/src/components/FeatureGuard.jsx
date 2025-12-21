import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, Github, Terminal, ShieldAlert, 
  Copy, Check, Search, Cpu, Globe, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FeatureGuard = ({ children, requireLocal = false }) => {
  const [isLocal, setIsLocal] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const local = false;
    setIsLocal(local);

    if (requireLocal && !local) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setShowPopup(true);
      }, 5500); 
      return () => clearTimeout(timer);
    }
  }, [requireLocal]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLocal || !requireLocal) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-hidden">
      {/* Background Content (Blurred) */}
      <div className="blur-2xl pointer-events-none opacity-10 grayscale scale-105 transition-all duration-1000">
        {children}
      </div>

      <AnimatePresence mode="wait">
        {/* --- SCANNING STATE --- */}
        {isScanning && (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-6"
          >
            <div className="relative w-40 h-40 mb-8">
              {/* Radar Rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border border-cyan-500/30 rounded-full"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-2 border-cyan-500 rounded-full flex items-center justify-center bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Cpu className="text-cyan-400 animate-pulse" size={40} />
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-cyan-100 font-mono tracking-[0.3em] uppercase text-sm font-bold">Hardware Probe Active</h2>
              <div className="flex items-center justify-center gap-2 text-cyan-800 font-mono text-[10px]">
                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                CHECKING KERNEL INTERFACES...
              </div>
            </div>

            {/* Simulated Log */}
            <div className="mt-8 w-full max-w-xs bg-black/50 border border-white/5 p-3 rounded font-mono text-[9px] text-slate-500 h-24 overflow-hidden">
               <motion.div animate={{ y: [-100, 0] }} transition={{ duration: 4, ease: "linear" }}>
                  <p>[INFO] Initializing handshake...</p>
                  <p className="text-cyan-900">[OK] v4.19.0-x86_64 detected</p>
                  <p>[ERR] Device /dev/null/promisc not found</p>
                  <p>[INFO] Scanning for local NICs...</p>
                  <p className="text-rose-900">[WARN] Remote environment detected</p>
                  <p>[INFO] Attempting hardware bypass...</p>
               </motion.div>
            </div>
          </motion.div>
        )}

        {/* --- RESTRICTION MODAL --- */}
        {showPopup && !isScanning && (
          <motion.div 
            key="popup"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-xl bg-[#0b1120] border border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-950/40 to-transparent p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/20">
                    <ShieldAlert className="text-rose-500" size={16} />
                  </div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">Environment Error: 403</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
              </div>

              <div className="p-6 md:p-10">
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter uppercase italic flex items-center gap-3">
                    <span className="text-cyan-500 text-sm not-italic font-mono bg-cyan-500/10 px-2 py-1 rounded">PROXIED</span>
                    LOCAL ONLY
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed font-light">
                    The <span className="text-cyan-400 font-medium">AstraGuard Kernel</span> is currently running in an isolated cloud environment. Packet sniffing and live hardware monitoring require a <span className="underline decoration-cyan-500/30">Direct Local Link</span>.
                  </p>
                </div>

                {/* Commands Terminal */}
                <div className="space-y-3 mb-8">
                  {[
                    { id: 'clone', label: 'SOURCE', cmd: 'git clone https://github.com/ayu-yishu13/Astra_Gaurd.git' },
                    { id: 'run', label: 'RUNTIME', cmd: 'python main.py --mode live' }
                  ].map((item) => (
                    <div key={item.id} className="group flex items-center justify-between bg-black/40 border border-white/5 hover:border-cyan-500/30 rounded-lg p-4 transition-all">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-tighter">{item.label}</span>
                        <code className="text-cyan-100 font-mono text-xs truncate pr-4">{item.cmd}</code>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(item.cmd, item.id)}
                        className={`flex-shrink-0 p-2 rounded-md transition-all ${copiedId === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                      >
                        {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => window.open('https://github.com/ayu-yishu13/Astra_Gaurd.git', '_blank')}
                    className="flex items-center justify-center gap-2 bg-cyan-500 text-black py-4 rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-white transition-all group"
                  >
                    <Github size={16} />
                    Download Agent
                  </button>
                  <button 
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center gap-2 border border-slate-800 text-slate-500 py-4 rounded-lg font-bold uppercase text-xs tracking-[0.2em] hover:bg-slate-800/50 hover:text-slate-300 transition-all"
                  >
                    <Globe size={16} />
                    Return Home
                  </button>
                </div>
                
                <p className="mt-8 text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest opacity-50">
                  System: ASTRAGUARD-SHIELD-V1 // KERNEL-LOCKED
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureGuard;
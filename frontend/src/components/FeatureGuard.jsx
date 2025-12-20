import React, { useState, useEffect } from "react";
import { AlertTriangle, Github, Terminal, ShieldAlert, Copy, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FeatureGuard = ({ children, requireLocal = false }) => {
  const [isLocal, setIsLocal] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const local = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    setIsLocal(local);

    if (requireLocal && !local) {
      // Feature 2: Simulated System Scan
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setShowPopup(true);
      }, 2000); // 2 second scan time
      return () => clearTimeout(timer);
    }
  }, [requireLocal]);

  // Feature 1: Copy to Clipboard Function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLocal || !requireLocal) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-[#020617]">
      <div className="blur-xl pointer-events-none opacity-20 grayscale">{children}</div>

      <AnimatePresence mode="wait">
        {/* Feature 2: Scanning UI */}
        {isScanning && (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="relative w-24 h-24 mb-6">
               <motion.div 
                 animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="absolute inset-0 border-t-2 border-b-2 border-cyan-500 rounded-full"
               />
               <Search className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={32} />
            </div>
            <h2 className="text-cyan-100 font-mono tracking-widest uppercase text-sm">Initializing Hardware Probe...</h2>
            <p className="text-cyan-800 font-mono text-xs mt-2">Checking local network interfaces (NICs)</p>
          </motion.div>
        )}

        {/* Feature 1: Restructured UI with Copy Buttons */}
        {showPopup && !isScanning && (
          <motion.div 
            key="popup"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          >
            <div className="relative w-full max-w-lg bg-[#0b1120] border border-cyan-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              
              <div className="bg-cyan-900/20 p-4 flex items-center gap-3 border-b border-cyan-500/20">
                <ShieldAlert className="text-cyan-400" size={20} />
                <span className="text-cyan-100 font-mono text-[11px] uppercase tracking-widest">Hardware Exception</span>
              </div>

              <div className="p-8">
                <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">
                   Hardware <span className="text-cyan-400">Not Linked</span>
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Remote deployment detected. To sniff live packets, the kernel requires direct access to your local hardware.
                </p>

                {/* Terminal with Copy Buttons */}
                <div className="bg-black/60 rounded border border-cyan-500/10 p-5 mb-8 font-mono text-xs space-y-4">
                   <div className="flex items-center justify-between group">
                      <span className="text-emerald-400">$ git clone https://github.com/ayu-yishu13/Astra_Gaurd.git</span>
                      <button onClick={() => copyToClipboard("git clone https://github.com/ayu-yishu13/Astra_Gaurd.git")} className="text-cyan-600 hover:text-cyan-300">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                   </div>
                   <div className="flex items-center justify-between group">
                      <span className="text-cyan-400">$ python main.py --mode live</span>
                      <button onClick={() => copyToClipboard("python main.py --mode live")} className="text-cyan-600 hover:text-cyan-300">
                        <Copy size={14} />
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.open('https://github.com/ayu-yishu13/Astra_Gaurd.git', '_blank')} className="bg-cyan-500 text-black py-3 rounded font-black uppercase text-xs tracking-widest hover:bg-white transition-all">
                    Get Agent
                  </button>
                  <button onClick={() => window.history.back()} className="border border-slate-700 text-slate-400 py-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureGuard;
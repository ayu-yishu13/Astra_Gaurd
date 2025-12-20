import React, { useState, useEffect } from "react";
import { AlertTriangle, Github, Terminal, ShieldAlert, Cpu, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FeatureGuard = ({ children, requireLocal = false }) => {
  const [isLocal, setIsLocal] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const local = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    setIsLocal(local);
    if (requireLocal && !local) setShowPopup(true);
  }, [requireLocal]);

  if (isLocal || !requireLocal) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-hidden">
      {/* Blurred background content */}
      <div className="blur-xl pointer-events-none opacity-20 grayscale">
        {children}
      </div>

      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            {/* Holographic Card */}
            <motion.div 
              initial={{ scale: 0.9, y: 20, rotateX: 15 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              className="relative w-full max-w-lg overflow-hidden"
            >
              {/* Animated Border Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-transparent to-purple-500 opacity-20 animate-pulse" />
              
              <div className="relative bg-[#0b1120]/90 border border-cyan-500/30 rounded-lg p-1 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                
                {/* Header Bar */}
                <div className="bg-cyan-900/20 border-b border-cyan-500/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="text-cyan-400 animate-pulse" size={24} />
                    <span className="text-cyan-100 font-mono tracking-widest text-sm uppercase">Access Restricted</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  </div>
                </div>

                <div className="p-8">
                  <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter uppercase">
                    Hardware <span className="text-cyan-400">Not Found</span>
                  </h2>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    System detected <span className="text-cyan-300 font-mono">REMOTE_HOST_DEPLOYMENT</span>. 
                    Sniffing requires direct Kernel access to physical NICs. Browsers block low-level socket IO for security.
                  </p>

                  {/* Terminal Section */}
                  <div className="relative bg-black/60 rounded border border-cyan-500/10 p-5 mb-8 font-mono text-[13px] group">
                    <div className="absolute top-2 right-2 text-[10px] text-cyan-700 uppercase">Local Shell</div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-cyan-600">❯</span>
                        <span className="text-slate-300 italic">deploy_agent --init</span>
                      </div>
                      <div className="flex gap-2 text-emerald-400/80">
                        <ChevronRight size={14} /> 
                        <span>git clone https://github.com/ayu-yishu13/Astra_Gaurd.git</span>
                      </div>
                      <div className="flex gap-2 text-cyan-400/80">
                        <ChevronRight size={14} /> 
                        <span>python main.py --interface eth0</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => window.open('https://github.com/ayu-yishu13/NetraIDS', '_blank')}
                      className="group relative flex items-center justify-center gap-2 bg-cyan-500 text-black py-3 rounded font-black uppercase text-xs tracking-widest hover:bg-white transition-all overflow-hidden"
                    >
                      <Github size={16} /> 
                      Clone Agent
                    </button>
                    
                    <button 
                      onClick={() => window.history.back()}
                      className="border border-slate-700 text-slate-400 py-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Footer Scanning Animation */}
                <div className="h-1 w-full bg-cyan-900/30 relative overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-1/2"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureGuard;
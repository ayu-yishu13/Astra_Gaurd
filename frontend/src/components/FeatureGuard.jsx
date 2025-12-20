// FeatureGuard.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, Github, Monitor, Terminal } from "lucide-react";

const FeatureGuard = ({ children, requireLocal = false }) => {
  const [isLocal, setIsLocal] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Detect environment
    const local = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    setIsLocal(local);
    
    // Only show popup if it's required AND we are not local
    if (requireLocal && !local) {
      setShowPopup(true);
    }
  }, [requireLocal]);

  // If we are local, or the feature doesn't require local access, show content normally
  if (isLocal || !requireLocal) return <>{children}</>;

  return (
    <div className="relative min-h-screen">
      {/* Background content is blurred for "Demo" look */}
      <div className="blur-lg pointer-events-none opacity-50">
        {children}
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#0b1120] border-2 border-cyan-500/50 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(6,182,212,0.4)]">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertTriangle size={28} />
              <h2 className="text-2xl font-bold">Local Agent Required</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              This page requires <b>Live Network Sniffing</b>. To protect privacy, browsers cannot access your hardware. Please run the project locally.
            </p>

            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-cyan-900/50 mb-6">
              <p className="text-emerald-400">$ git clone [Your-Repo-URL]</p>
              <p className="text-blue-400">$ cd nids-project</p>
              <p className="text-purple-400">$ python app.py --mode live</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => window.open('https://github.com/your-repo', '_blank')} className="flex-1 bg-cyan-600 py-3 rounded-xl font-bold hover:bg-cyan-500 transition-all flex items-center justify-center gap-2">
                <Github size={18}/> GitHub
              </button>
              <button onClick={() => window.history.back()} className="flex-1 bg-gray-800 py-3 rounded-xl font-bold hover:bg-gray-700 transition-all text-gray-400">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureGuard;
import React, { useContext } from "react";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { AlertContext } from "../context/AlertContext.jsx";

export default function Alerts() {
  const { alerts, removeAlert } = useContext(AlertContext);

  const COLORS = {
    info: "border-blue-400/40 bg-blue-500/10 text-blue-300",
    warn: "border-yellow-400/40 bg-yellow-500/10 text-yellow-300",
    danger: "border-red-400/40 bg-red-500/10 text-red-300",
  };

  const ICONS = {
    info: <Info size={16} />,
    warn: <AlertTriangle size={16} />,
    danger: <ShieldAlert size={16} />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 w-64 max-h-96 overflow-y-auto pointer-events-none">
      {alerts.map(a => (
        <div
          key={a.id}
          className={`pointer-events-auto cyber-card flex items-center gap-2 px-3 py-2 
                     border rounded-xl shadow-neon animate-fade
                     ${COLORS[a.type]}`}
          onClick={() => removeAlert(a.id)}
        >
          {ICONS[a.type]}
          <span className="text-xs">{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

import { createContext, useState, useRef } from "react";

export const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const lastAlertTime = useRef({}); // per-class cooldown

  const COOLDOWN = 8000; // 8 seconds per class

  const pushAlert = (msg, type = "info", key = "general") => {
    const now = Date.now();

    if (lastAlertTime.current[key] && now - lastAlertTime.current[key] < COOLDOWN)
      return; // skip spam alerts

    lastAlertTime.current[key] = now;

    const id = now;
    setAlerts(prev => [...prev, { id, msg, type }]);

    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, pushAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

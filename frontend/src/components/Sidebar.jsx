// src/components/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity, AlertTriangle, FileText, Info, Settings, TrafficCone,
  MonitorCog, GitBranchMinus, BrickWallShield, ChevronLeft, ChevronRight,
  MoonStar, LayoutDashboard, X
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed, isMobileOpen, setIsMobileOpen }) {
  const sidebarRef = useRef(null);
  const canvasRef = useRef(null);
  const [time, setTime] = useState("");

  // System Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Neural Network Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const sidebar = sidebarRef.current;
    if (!canvas || !sidebar) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let width = sidebar.clientWidth;
    let height = sidebar.clientHeight;
    let rafId = null;
    let particles = [];
    const COUNT = Math.max(18, Math.floor((width * height) / 10000));

    function resize() {
      if (!sidebar) return;
      width = sidebar.clientWidth;
      height = sidebar.clientHeight;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 0.5,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      for (let p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 230, 255, 0.25)"; // Softer particles
        ctx.fill();
      }
      rafId = requestAnimationFrame(step);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(sidebar);
    resize(); step();
    return () => { if (rafId) cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [collapsed]); // Re-run when collapsed changes to fix canvas scale

  const navItems = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/livetraffic", label: "Live Traffic", icon: <Activity size={18} /> },
    { to: "/threats", label: "Threat Intelligence", icon: <Info size={18} /> },
    { to: "/alerts", label: "Alerts", icon: <AlertTriangle size={18} /> },
    { to: "/incidents", label: "Offline Detection", icon: <BrickWallShield size={18} /> },
    { to: "/traffic", label: "Traffic Analysis", icon: <TrafficCone size={18} /> },
    { to: "/response", label: "Response System", icon: <GitBranchMinus size={18} /> },
    { to: "/mlmodels", label: "ML Model", icon: <MoonStar size={18} /> },
    { to: "/reports", label: "Reports", icon: <FileText size={18} /> },
    { to: "/system", label: "System Info", icon: <MonitorCog size={18} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-[160] transition-all duration-300 ease-in-out flex flex-col
          border-r border-cyan-500/20 bg-[#020617]/95 backdrop-blur-2xl
          ${collapsed ? "w-20" : "w-64"}
          ${isMobileOpen ? "translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.8)]" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10 opacity-40" />

        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
               <span className="text-[14px] font-extrabold text-cyan-400">⚡</span>
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="animate-in fade-in duration-500">
                <div className="text-lg font-black text-white tracking-tighter uppercase">Astra<span className="text-cyan-500">Guard</span></div>
                <div className="text-[9px] text-cyan-700 font-mono font-bold uppercase tracking-widest leading-none">AI • SHIELD v1.0</div>
              </div>
            )}
          </div>
          
          {/* Close button - Mobile */}
          <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden custom-scroll space-y-1 mt-4">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"}
              `}
            >
              <div className="shrink-0 transition-transform group-hover:scale-110">{icon}</div>
              {(!collapsed || isMobileOpen) && <span className="truncate font-medium tracking-tight text-xs uppercase font-mono">{label}</span>}
              
              {/* Active Indicator Dot */}
              <NavLink to={to} className={({ isActive }) => isActive ? "absolute right-3 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" : "hidden"} />
            </NavLink>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/5 bg-black/40">
          <div className="flex flex-col gap-1.5">
            {(!collapsed || isMobileOpen) ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="text-[10px] text-cyan-500 font-mono tracking-widest font-bold">{time}</div>
                <div className="text-[8px] text-slate-600 uppercase tracking-widest font-mono">System Localized // IN</div>
              </div>
            ) : (
              <div className="text-[8px] text-slate-700 font-mono text-center">v1.0</div>
            )}
          </div>
        </div>

        {/* DESKTOP COLLAPSE TOGGLE */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute right-[-12px] top-24 w-6 h-6 rounded-full bg-[#020617] border border-cyan-500/30 text-cyan-500 items-center justify-center hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}

// src/components/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity, AlertTriangle, FileText, Info, Settings, TrafficCone,
  MonitorCog, GitBranchMinus, BrickWallShield, ChevronLeft, ChevronRight,
  MoonStar, LayoutDashboard, X, Menu
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed, isMobileOpen, setIsMobileOpen }) {
  const sidebarRef = useRef(null);
  const canvasRef = useRef(null);
  const [time, setTime] = useState("");

  // clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Canvas Animation Logic (Kept as per your original code)
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
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
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
        ctx.fillStyle = "rgba(0, 230, 255, 0.5)";
        ctx.fill();
      }
      rafId = requestAnimationFrame(step);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(sidebar);
    resize(); step();
    return () => { if (rafId) cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [collapsed]);

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
      {/* MOBILE OVERLAY: Blurs background when sidebar is open on mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out
          border-r-2 border-[var(--accent)]/14 bg-[#030b17]/90 backdrop-blur-xl
          ${collapsed ? "w-20" : "w-64"}
          /* MOBILE LOGIC: Slide out of screen on mobile unless isMobileOpen is true */
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10" />

        {/* HEADER */}
        <div className="p-4 border-b border-[var(--accent)]/12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-extrabold text-[var(--accent)]">⚡</span>
            {(!collapsed || isMobileOpen) && (
              <div>
                <div className="text-xl font-bold text-[var(--accent)]">NIDS</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Cyber Defense</div>
              </div>
            )}
          </div>
          
          {/* Close button - Only visible on Mobile */}
          <button className="lg:hidden text-slate-400" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden custom-scroll space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsMobileOpen(false)} // Close sidebar on mobile after clicking
              className={({ isActive }) => `
                group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm
                ${isActive 
                  ? "bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]" 
                  : "text-slate-300 hover:bg-[var(--accent)]/5 hover:text-white"}
              `}
            >
              <div className="shrink-0">{icon}</div>
              {(!collapsed || isMobileOpen) && <span className="truncate font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-[var(--accent)]/12 bg-black/20">
          <div className="flex flex-col gap-1">
            {(!collapsed || isMobileOpen) ? (
              <>
                <div className="text-[11px] text-[var(--accent)] font-mono tracking-widest">{time}</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest">© 2025 Future Lelouch</div>
              </>
            ) : (
              <div className="text-[9px] text-slate-500 text-center">© 25</div>
            )}
          </div>
        </div>

        {/* DESKTOP COLLAPSE TOGGLE (Hidden on Mobile) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute right-[-14px] top-20 w-7 h-7 rounded-full bg-[#030b17] border border-[var(--accent)]/30 text-[var(--accent)] items-center justify-center hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}


// src/components/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  FileText,
  Info,
  Settings,
  TrafficCone,
  MonitorCog,
  GitBranchMinus,
  BrickWallShield,
  ChevronLeft,
  ChevronRight,
  MoonStar,
  LayoutDashboard,
} from "lucide-react";

/**
 * Sidebar with mini-constellation canvas (B3)
 *
 * Props:
 *   - collapsed: boolean
 *   - setCollapsed: function
 */
export default function Sidebar({ collapsed, setCollapsed }) {
  const sidebarRef = useRef(null);
  const canvasRef = useRef(null);
  const [time, setTime] = useState("");

  // clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // mini-constellation canvas (node+line) - optimized for sidebar
  useEffect(() => {
    const canvas = canvasRef.current;
    const sidebar = sidebarRef.current;
    if (!canvas || !sidebar) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let width = sidebar.clientWidth;
    let height = sidebar.clientHeight;
    let rafId = null;
    let particles = [];
    const COUNT = Math.max(18, Math.floor((width * height) / 10000)); // scale nodes by size

    // Resize handler
    function resize() {
      width = sidebar.clientWidth;
      height = sidebar.clientHeight;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // recreate particles to adapt density
      initParticles();
    }

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function initParticles() {
      particles = [];
      const n = COUNT;
      for (let i = 0; i < n; i++) {
        particles.push({
          x: rand(10, width - 10),
          y: rand(10, height - 10),
          vx: rand(-0.15, 0.15),
          vy: rand(-0.15, 0.15),
          size: rand(0.8, 2.2),
          hue: rand(170, 200), // cyan-ish
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      // draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const MAX = Math.min(120, Math.max(70, (width + height) / 15));
          if (dist < MAX) {
            const alpha = 0.12 * (1 - dist / MAX);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(40,220,210, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // draw nodes
      for (let p of particles) {
        // move
        p.x += p.vx;
        p.y += p.vy;

        // gentle wrap/bounce
        if (p.x < -6) p.x = width + 6;
        if (p.x > width + 6) p.x = -6;
        if (p.y < -6) p.y = height + 6;
        if (p.y > height + 6) p.y = -6;

        // glow circle
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
        grad.addColorStop(0, `rgba(0,230,255,0.95)`);
        grad.addColorStop(0.2, `rgba(0,230,255,0.55)`);
        grad.addColorStop(1, `rgba(0,230,255,0.02)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // center bright dot
        ctx.beginPath();
        ctx.fillStyle = `rgba(220,255,255,0.95)`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    }

    // ResizeObserver to respond to sidebar size changes (collapse/expand)
    const ro = new ResizeObserver(resize);
    ro.observe(sidebar);

    resize();
    step(); // start animation

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarRef, canvasRef, collapsed]);

  // navigation items
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
    <aside
      ref={sidebarRef}
      aria-label="Main navigation"
      className={`fixed top-0 left-0 h-screen
        ${collapsed ? "w-20" : "w-64"}
        bg-[#030b17]/50 backdrop-blur-xl
        flex flex-col z-50 transition-all duration-300
        border-r-2 border-[var(--accent)]/14
        shadow-[inset_0_0_18px_rgba(0,229,255,0.06)]
      `}
    >
      {/* background canvas (mini constellation) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />

      {/* double neon border / decorative rings */}
      <div
        className="absolute inset-0 pointer-events-none -z-5"
        style={{
          boxShadow:
            "inset 0 0 2px rgba(0,230,255,0.06), inset 0 0 30px rgba(0,230,255,0.03)",
        }}
      />

      {/* HEADER */}
      <div className="p-4 border-b border-[var(--accent)]/12 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-extrabold text-[var(--accent)]">⚡</span>
            {!collapsed && (
              <div>
                <div className="text-xl font-bold text-[var(--accent)] leading-tight">NIDS</div>
                <div className="text-[11px] text-slate-400">Cyber Defense</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                navigator.onLine ? "bg-emerald-400 animate-pulse" : "bg-rose-500 animate-ping"
              }`}
            />
            {!collapsed && (
              <div className="text-xs text-slate-400">{navigator.onLine ? "LIVE" : "OFFLINE"}</div>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="mt-3 text-xs text-slate-400">
            <div className="flex justify-between items-center">
              <span className="text-[var(--accent)]">Host:</span>
              <span className="font-mono text-[var(--accent)] text-right">{window.location.hostname}</span>
            </div>
            <div className="mt-2 relative h-1.5 bg-gradient-to-r from-transparent to-transparent rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 opacity-30 blur-sm" />
              <div className="mt-2 text-[10px] text-slate-500">Monitoring anomalies…</div>
            </div>
          </div>
        )}
      </div>

      {/* NAV - scrollable */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden custom-scroll">
  <div className="space-y-1">

    {navItems.map(({ to, label, icon }, index) => (
      <div key={to}>

        <NavLink
          to={to}
          title={collapsed ? label : ""}
          className={({ isActive }) =>
            `
              group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm relative
              ${isActive
                ? "bg-[var(--accent)]/18 border border-[var(--accent)]/28 text-[var(--accent)] shadow-[0_0_10px_rgba(0,230,255,0.06)]"
                : "text-slate-300 hover:bg-[var(--accent)]/6 hover:border hover:border-[var(--accent)]/18"}
            `
          }
        >

          <div className="w-5 h-5 flex items-center justify-center text-[var(--accent)]">
            {icon}
          </div>

          {!collapsed && <span className="truncate">{label}</span>}

          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-[3.4rem] top-1/2 -translate-y-1/2 opacity-0 
                            group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <div className="bg-black/75 text-[var(--accent)] border border-[var(--accent)]/30 
                              px-2 py-1 rounded text-xs whitespace-nowrap shadow-md">
                {label}
              </div>
            </div>
          )}

        </NavLink>

        {/* Divider line (between items) */}
        {index < navItems.length - 1 && (
          <div className="h-px w-full bg-white/100  my-3"></div>
        )}

      </div>
    ))}

  </div>
</nav>


      {/* FOOTER */}
      <div className="p-3 border-t border-[var(--accent)]/12 shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="text-[10px] text-slate-400">© 2025 Future Lelouch</div>
              <div className="text-[11px] text-[var(--accent)] font-mono">{time}</div>
            </>
          ) : (
            <div className="text-[10px] text-slate-400 text-center w-full">© 2025</div>
          )}
        </div>
      </div>

      {/* collapse/expand toggle */}
      <button
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-[-12px] bottom-6 w-8 h-8 rounded-full bg-[var(--accent)]/12 border border-[var(--accent)]/30 text-[var(--accent)] shadow-[0_6px_18px_rgba(0,230,255,0.06)] flex items-center justify-center transition-transform hover:scale-110"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}


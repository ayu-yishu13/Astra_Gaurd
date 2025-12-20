import React, { useState } from "react";
import { Shield, Search, User, ChevronDown, RefreshCcw, LogOut, CurrencyIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ onRefresh }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="relative z-20 border-b border-accent/20  backdrop-blur-xl py-4 shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
      <div className="container mx-auto px-4 py-3 mb-2 flex items-center gap-6">

        {/* Brand */}
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl border border-accent/50 bg-accent/10 shadow-neon group-hover:bg-accent/20 transition">
            <CurrencyIcon size={20} className="text-accent" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-accent tracking-[0.22em] uppercase">
              ASTRAGUARD
            </span>
            <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
              AI • NIDS
            </span>
          </div>
        </button>

        {/* Main Nav */}
        <div className="hidden lg:flex items-center gap-4 text-sm text-slate-300 ml-4">

          {[
            { path: "/", label: "Dashboard" },
            { path: "/livetraffic", label: "Live Traffic" },
            { path: "/flow", label: "Flow Analyzer" },
            { path: "/alerts", label: "Alerts" },
            { path: "/threats", label: "Threat Intel" },
            { path: "/reports", label: "Reports" },
            { path: "/system", label: "System" },
            { path: "/mlmodels", label: "ML Models" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                location.pathname === item.path
                  ? "text-accent bg-accent/10 shadow-[0_0_10px_rgba(0,229,255,0.35)]"
                  : "text-slate-300 hover:text-accent hover:bg-accent/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/40 bg-white/5 focus-within:ring-1 focus-within:ring-accent/60 transition">
            <Search size={16} className="text-accent/80" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dashboard..."
              className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-40"
            />
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-accent/40 bg-white/5 hover:bg-accent/10 transition"
            >
              <div className="w-8 h-8 rounded-full border border-accent/40 bg-accent/10 flex items-center justify-center">
                <User size={16} className="text-accent" />
              </div>
              <div className="hidden sm:flex flex-col items-start max-w-[130px]">
                <span className="text-[10px] text-slate-400 uppercase tracking-[0.16em]">
                  Operator
                </span>
                <span className="text-xs text-accent font-medium truncate">
                  {user?.displayName || "Analyst"}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-accent/30 bg-[#020617]/95 shadow-lg py-1 text-sm z-40">
                {onRefresh && (
                  <>
                    <button
                      onClick={() => {
                        onRefresh();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/10 text-slate-200"
                    >
                      <RefreshCcw size={14} className="text-accent" />
                      <span>Reload data</span>
                    </button>
                    <div className="border-t border-slate-700/60 my-1" />
                  </>
                )}

                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/15 text-red-300"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

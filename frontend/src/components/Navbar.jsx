import React, { useState } from "react";
import { Shield, Search, User, ChevronDown, RefreshCcw, LogOut, CurrencyIcon, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ onRefresh }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // New state for mobile menu

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/livetraffic", label: "Live Traffic" },
    { path: "/flow", label: "Flow Analyzer" },
    { path: "/alerts", label: "Alerts" },
    { path: "/threats", label: "Threat Intel" },
    { path: "/reports", label: "Reports" },
    { path: "/system", label: "System" },
    { path: "/mlmodels", label: "ML Models" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false); // Close mobile menu on click
  };

  return (
    <nav className="relative z-[50] border-b border-accent/20 backdrop-blur-xl py-2 lg:py-4 shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
      <div className="container mx-auto px-4 flex items-center justify-between lg:justify-start gap-4 lg:gap-6">
        
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 rounded-lg border border-accent/30 text-accent"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 lg:gap-3 group">
          <div className="p-1.5 lg:p-2 rounded-xl border border-accent/50 bg-accent/10 shadow-neon group-hover:bg-accent/20 transition">
            <CurrencyIcon size={18} className="text-accent" />
          </div>
          <div className="flex flex-col leading-tight text-left">
            <span className="text-[12px] lg:text-sm font-semibold text-accent tracking-[0.15em] lg:tracking-[0.22em] uppercase">
              ASTRAGUARD
            </span>
            <span className="text-[9px] lg:text-[11px] text-slate-400 uppercase tracking-[0.12em] lg:tracking-[0.18em]">
              AI • NIDS
            </span>
          </div>
        </button>

        {/* Main Nav (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-300 ml-4">
          {navLinks.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
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
        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          {/* Search (Hidden on small mobile) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/40 bg-white/5 focus-within:ring-1 focus-within:ring-accent/60 transition">
            <Search size={14} className="text-accent/80" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-24 lg:w-40"
            />
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 lg:px-2 lg:py-1.5 rounded-full border border-accent/40 bg-white/5 hover:bg-accent/10 transition"
            >
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-accent/40 bg-accent/10 flex items-center justify-center">
                <User size={14} className="text-accent" />
              </div>
              <div className="hidden md:flex flex-col items-start max-w-[100px]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Operator
                </span>
                <span className="text-xs text-accent font-medium truncate w-full text-left">
                  {user?.displayName || "Analyst"}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-44 rounded-xl border border-accent/30 bg-[#020617] shadow-2xl py-2 text-sm z-50 animate-in fade-in zoom-in duration-200">
                {onRefresh && (
                  <>
                    <button
                      onClick={() => {
                        onRefresh();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/10 text-slate-200 transition"
                    >
                      <RefreshCcw size={14} className="text-accent" />
                      <span>Reload data</span>
                    </button>
                    <div className="border-t border-slate-700/60 my-1" />
                  </>
                )}

                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/15 text-red-300 transition"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {menuOpen && (
        <div className="lg:hidden absolute top-[100%] left-0 w-full bg-[#020617]/95 border-b border-accent/20 backdrop-blur-2xl animate-in slide-in-from-top duration-300 overflow-hidden shadow-2xl">
          <div className="flex flex-col p-4 gap-2">
            {navLinks.map((item, i) => (
              <button
                key={i}
                onClick={() => handleNavigate(item.path)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? "text-accent bg-accent/10 border border-accent/20 shadow-neon-sm"
                    : "text-slate-300 hover:text-accent hover:bg-accent/5"
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Search - shown only in menu */}
            <div className="flex sm:hidden items-center gap-3 px-4 py-3 mt-2 rounded-xl border border-accent/20 bg-white/5">
                <Search size={16} className="text-accent" />
                <input 
                    type="text" 
                    placeholder="Search systems..." 
                    className="bg-transparent text-sm text-slate-200 focus:outline-none w-full"
                />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
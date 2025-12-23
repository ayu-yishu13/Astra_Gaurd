import React, { useState } from "react";
import { Search, User, ChevronDown, RefreshCcw, LogOut, Menu, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ onRefresh, setIsMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <nav className="fixed top-0 left-0 right-0 lg:left-0 z-[100] border-b border-cyan-500/10 backdrop-blur-md bg-[#020617]/80 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
        
        {/* LEFT SECTION: Mobile Toggle & Brand */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle: This triggers the Sidebar */}
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Brand: Visible on Mobile, hidden on Laptop (since sidebar has it) */}
          <div className="flex lg:hidden items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-500" />
            <span className="text-sm font-black text-white tracking-tighter uppercase">
              ASTRA<span className="text-cyan-500">GUARD</span>
            </span>
          </div>

          {/* Desktop Status Indicator */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 ml-64">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest font-bold">System Online // Node_01</span>
          </div>
        </div>

        {/* RIGHT SECTION: Search & Profile */}
        <div className="flex items-center gap-3 lg:gap-6">
          
          {/* Enhanced Search Bar */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-white/5 bg-white/5 focus-within:border-cyan-500/50 transition-all group">
            <Search size={14} className="text-slate-500 group-focus-within:text-cyan-400" />
            <input
              type="text"
              placeholder="QUICK SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none w-32 lg:w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#020617]"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 p-1 pr-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
                <User size={16} className="text-cyan-400" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase leading-none mb-1">Operator</span>
                <span className="text-xs text-white font-medium">{user?.displayName?.split(' ')[0] || "Analyst"}</span>
              </div>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl border border-white/10 bg-[#0b1120] shadow-[0_10px_40px_rgba(0,0,0,0.7)] py-2 text-sm z-[110] animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-white/5 mb-2">
                   <p className="text-[10px] text-slate-500 font-mono">AUTH_LEVEL: ADMIN</p>
                </div>
                
                {onRefresh && (
                  <button onClick={() => { onRefresh(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-500/10 text-slate-300 transition-colors group">
                    <RefreshCcw size={14} className="text-cyan-500 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Sync Database</span>
                  </button>
                )}

                <button onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-500/10 text-rose-400 transition-colors">
                  <LogOut size={14} />
                  <span>Terminate Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
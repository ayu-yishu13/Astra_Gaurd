// src/components/Header.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <div className="flex items-center justify-between p-3">
      <div className="text-cyan-300 font-bold">NIDS Cyber Defense</div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-300">{user?.email}</div>
        <button onClick={logout} className="px-3 py-1 bg-rose-500/10 rounded">Logout</button>
      </div>
    </div>
  );
}

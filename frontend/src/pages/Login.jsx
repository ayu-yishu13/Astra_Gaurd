// src/pages/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  async function doSubmit(e) {
    e.preventDefault();
    setWorking(true);

    try {
      if (mode === "login") {
        await login(email, pw);
        toast.success("Welcome back!");
      } else {
        await register(email, pw, name);
        toast.success("Account created!");
      }
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="bottom-right" />

      {/* Floating cyber glow background */}
      <div className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(0,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(180,80,255,0.08) 0%, transparent 40%)",
        }}
      />

      {/* ⭐ Draggable + Tilt Login Card */}
      <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} glareEnable={false} scale={1.02}>
        <motion.div
          drag
          dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
          className="
            w-[420px]
            p-8
            rounded-2xl
            backdrop-blur-xl
            bg-black/40
            border border-cyan-400/30
            shadow-[0_0_20px_rgba(0,230,255,0.25)]
          "
        >
          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-1 bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent tracking-wide">
            Adaptive AI NIDS
          </h1>
          <p className="text-center text-slate-400 text-xs mb-6">
            Secure Access Portal
          </p>

          {/* Login/Register Toggle */}
          <div className="flex justify-center gap-6 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`pb-1 px-2 text-sm transition-all border-b-2 ${
                mode === "login"
                  ? "border-cyan-300 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-cyan-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`pb-1 px-2 text-sm transition-all border-b-2 ${
                mode === "register"
                  ? "border-cyan-300 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-cyan-200"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={doSubmit} className="space-y-4">

            {/* Name Field (register only) */}
            {mode === "register" && (
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-cyan-300/20">
                <User className="text-cyan-300" />
                <input
                  required
                  type = "name"
                  placeholder="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-cyan-100"
                />
              </div>
            )}

            {/* Email */}
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-cyan-300/20">
              <Mail className="text-cyan-300" />
              <input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-cyan-100"
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-cyan-300/20">
              <Lock className="text-cyan-300" />
              <input
                required
                type="password"
                placeholder="Password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="flex-1 bg-transparent outline-none text-cyan-100"
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={working}
              className="
                w-full py-2 mt-2
                bg-cyan-500/20
                border border-cyan-400/40
                rounded-lg
                text-cyan-200
                hover:bg-cyan-500/30
                transition-all
                font-medium
              "
            >
              {working ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>

            <p className="text-[10px] text-center text-slate-500 mt-2">
              Secure access only. Unauthorized use is prohibited.
            </p>
          </form>
        </motion.div>
      </Tilt>
    </div>
  );
}


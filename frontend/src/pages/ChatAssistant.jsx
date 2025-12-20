import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { BASE_URL } from "../api.js";

// Display name for the model (shown in header)
const CHAT_MODEL_LABEL = "Llama-3.1-8B-Instant (Groq)";

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello, I’m your NIDS assistant. Ask me about threats, logs, models, or anything security-related! ⚡",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const messagesEndRef = useRef(null);
  const bootAudioRef = useRef(null);

  // -------- Boot sound when opening ----------
  useEffect(() => {
    if (isOpen) {
      // lazy init audio
      if (!bootAudioRef.current) {
        bootAudioRef.current = new Audio("../../ai_bootup.mp3");
      }
      try {
        bootAudioRef.current.currentTime = 0;
        bootAudioRef.current.play();
      } catch (e) {
        // ignore autoplay errors
        console.warn("Boot sound blocked by browser:", e);
      }
    }
  }, [isOpen]);

  // -------- Auto-scroll to latest message ----------
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // -------- Send message to backend ----------
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setErrorText("");
    setLoading(true);

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const replyText =
        typeof data.reply === "string"
          ? data.reply
          : "I received your message, but the reply format was unexpected.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setErrorText("AI is unreachable right now. Please try again in a bit.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach the AI backend. Check your internet / API key and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -------- Small helper for message bubble style ----------
  const bubbleClass = (role) =>
    role === "user"
      ? "bg-cyan-500/20 border border-cyan-400/40 self-end"
      : "bg-slate-800/80 border border-slate-600/60 self-start";

  const textClass = (role) =>
    role === "user" ? "text-cyan-100" : "text-slate-100";

  return (
    <>
      {/* Floating Jarvis orb button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full w-14 h-14 bg-cyan-500/20 border border-cyan-400/60 shadow-lg shadow-cyan-500/40 flex items-center justify-center hover:bg-cyan-500/40 transition-transform duration-200 hover:scale-105 backdrop-blur"
      >
        <div className="relative flex items-center justify-center">
          {/* Glowing orb */}
          <div className="w-10 h-10 rounded-full bg-cyan-400/30 blur-[2px] animate-ping" />
          <div className="absolute w-9 h-9 rounded-full border border-cyan-300/60 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-cyan-100" />
          </div>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          {/* Chat panel */}
          <div className="w-full md:w-[520px] h-[80vh] md:h-[72vh] max-w-full bg-slate-900/95 border border-cyan-400/40 rounded-t-3xl md:rounded-3xl shadow-2xl shadow-cyan-500/30 flex flex-col overflow-hidden animate-[slideUp_0.25s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/70 bg-slate-900/80">
              <div className="flex items-center gap-3">
                {/* Jarvis orb avatar */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-300/60 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-100" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-cyan-300/20 animate-ping" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-cyan-100">
                    NIDS AI Assistant
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Model:{" "}
                    <span className="text-cyan-300">{CHAT_MODEL_LABEL}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800/80 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto custom-scrollbar">
              {/* Bootup caption */}
              <p className="text-[11px] text-center text-slate-400 mb-1">
                System online · You can ask things like{" "}
                <span className="text-cyan-300">
                  “Explain this alert” or “Summarize current threats”
                </span>
              </p>

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${bubbleClass(
                      m.role
                    )}`}
                  >
                    <p className={textClass(m.role)}>{m.content}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl bg-slate-800/80 border border-slate-600/60 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce [animation-delay:0.12s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce [animation-delay:0.24s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error text */}
            {errorText && (
              <div className="px-4 py-1 text-[11px] text-rose-300 bg-rose-900/20 border-t border-rose-800/50">
                {errorText}
              </div>
            )}

            {/* Input area */}
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/90">
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your NIDS, alerts, attacks, or networks..."
                  className="flex-1 resize-none rounded-2xl bg-slate-900/80 border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 max-h-32"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className={`px-3 py-2 rounded-2xl text-sm font-medium flex items-center gap-1 transition-colors ${
                    loading || !input.trim()
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                      Thinking
                    </>
                  ) : (
                    <>
                      Send
                      <MessageCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Small keyframe for slideUp (if not using global CSS) */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

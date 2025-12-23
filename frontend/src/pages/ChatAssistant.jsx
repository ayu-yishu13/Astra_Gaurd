import React, { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, X, Sparkles, Send, ShieldAlert, 
  Terminal, Zap, Fingerprint, Activity, Volume2, VolumeX, Cpu, Download, Mic, MicOff, Volume1 
} from "lucide-react";
import { jsPDF } from "jspdf";
import { BASE_URL } from "../api.js";
import boot from "../assests/ai_bootup.mp3";

const CHAT_MODEL_LABEL = "Llama-3.1-8B-Instant";

const SUGGESTIONS = [
  "Explain SQL Injection",
  "Analyze Port 443",
  "Summarize Threats",
  "Network Health Check"
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false); // For Mic
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "SYSTEM ONLINE: NIDS Intelligence Layer Active. Secure connection established. How can I assist with your perimeter defense today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const messagesEndRef = useRef(null);
  const bootAudio = useRef(null);
  const clickAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"));
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleScroll = () => {
  if (!scrollContainerRef.current) return;
  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
  // If user is more than 100px from the bottom, they are "scrolled up"
  const isUp = scrollHeight - scrollTop - clientHeight > 100;
  setShowScrollButton(isUp);
};

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

  // Natural Text-to-Speech Function
  const speakMessage = (text, index) => {
  if (isMuted) return; // Respect the mute toggle
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  // Find the best available lady voice
  const ladyVoice = voices.find(v => 
    v.name.includes("Google US English") || 
    v.name.includes("Female") || 
    v.name.includes("Zira") || // Windows
    v.name.includes("Samantha") || // macOS/iOS
    v.name.includes("Microsoft Aria") // Modern Windows/Edge
  );

  if (ladyVoice) {
    utterance.voice = ladyVoice;
  }

  // Settings for a "Natural AI" feel
  utterance.pitch = 1.1; // Slightly higher pitch sounds more feminine
  utterance.rate = 1.5;   // Normal speed
  utterance.volume = 1.0;

  utterance.onstart = () => setSpeakingIndex(index);
  utterance.onend = () => setSpeakingIndex(null);
  utterance.onerror = () => setSpeakingIndex(null);

  window.speechSynthesis.speak(utterance);
};

  const startListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const downloadChatLog = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    doc.setFont("courier", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 150, 150);
    doc.text("NIDS AI SECURITY REPORT", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${timestamp}`, 20, 28);
    doc.line(20, 32, 190, 32);
    let yOffset = 45;
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "OPERATOR: " : "NIDS_AI: ";
      const lines = doc.splitTextToSize(`${role}${msg.content}`, 170);
      if (yOffset + (lines.length * 7) > 280) { doc.addPage(); yOffset = 20; }
      doc.setFont("helvetica", "bold"); doc.text(role, 20, yOffset);
      doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(msg.content, 150), 45, yOffset);
      yOffset += (lines.length * 6) + 5;
    });
    doc.save(`NIDS_Report_${Date.now()}.pdf`);
  };

  useEffect(() => {
    bootAudio.current = new Audio(boot);
    bootAudio.current.load();
  }, []);

  useEffect(() => {
    if (isOpen && !isMuted) {
      if (bootAudio.current) {
        bootAudio.current.currentTime = 0;
        bootAudio.current.play().catch(() => {});
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, isMuted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || input.trim();
    if (!textToSend || loading) return;

    if (!isMuted) clickAudio.current.play().catch(() => {});
    setErrorText("");
    setLoading(true);
    setInput("");

    const userMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const promptWithLimit = `${textToSend} (IMPORTANT: Provide a concise response strictly between 50 to 70 words.)`;
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptWithLimit }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Protocol error." }]);
    } catch (err) {
      setErrorText("UPLINK_FAILURE: Backend unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher */}
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-40 group flex items-center justify-center">
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition-opacity animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-2xl overflow-hidden">
          <Fingerprint className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 transition-all">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={() => setIsOpen(false)} />

          <div className="relative w-full md:w-[600px] h-[calc(100vh-100px)] md:h-[80vh] mt-[80px] md:mt-0 bg-slate-900/90 md:border md:border-cyan-500/30 md:rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            {/* Header */}
            <div className="relative px-6 py-4 border-b border-cyan-500/20 bg-slate-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">NIDS_CORE_AI <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /></h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-cyan-500/70 font-mono tracking-tighter uppercase">Neural Link: <span className="text-emerald-400">Stable</span></p>
                    <span className="text-slate-600 text-[10px]">|</span>
                    <Cpu size={10} className="text-cyan-50" />
                    <span className="text-[10px] text-cyan-500/70 font-mono tracking-tighter">{CHAT_MODEL_LABEL}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadChatLog} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-emerald-400 transition-colors" title="Download Report"><Download size={18} /></button>
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-cyan-400 transition-colors">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-rose-400"><X className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Messages Area */}
<div 
  ref={scrollContainerRef}
  onScroll={handleScroll}
  className="relative flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
>
  {messages.map((m, idx) => (
    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl font-mono text-xs md:text-sm leading-relaxed shadow-xl
        ${m.role === "user" ? "bg-cyan-600 text-slate-950 rounded-tr-none font-bold" : "bg-slate-800/90 text-cyan-50 border border-cyan-500/20 rounded-tl-none"}`}
      >
        <span className={`absolute -top-5 left-0 text-[9px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-cyan-400 left-auto right-0' : 'text-slate-500'}`}>
          {m.role === 'user' ? 'Operator' : 'AI_System'}
        </span>
        {m.content}
        
        {m.role === "assistant" && (
          <button 
            onClick={() => speakMessage(m.content, idx)}
            className={`mt-2 text-[10px] flex items-center gap-1 transition-all
              ${speakingIndex === idx ? "text-emerald-400 animate-pulse font-bold" : "text-cyan-400/60 hover:text-cyan-400"}`}
          >
            <Volume1 size={14} className={speakingIndex === idx ? "scale-125" : ""} />
            {speakingIndex === idx ? "RECITING ANALYSIS..." : "Listen to Analysis"}
          </button>
        )}
      </div>
    </div>
  ))}

  {loading && (
    <div className="flex justify-start animate-pulse">
      <div className="bg-slate-800/50 border border-cyan-500/20 px-4 py-3 rounded-2xl rounded-tl-none">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  )}

  {/* Hidden Anchor for Auto-Scrolling */}
  <div ref={messagesEndRef} />

  {/* Floating "New Message" Indicator */}
  {showScrollButton && (
    <div className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none">
      <button 
        onClick={scrollToBottom}
        className="pointer-events-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 animate-bounce"
      >
        <ShieldAlert size={12} />
        New Intelligence Log Available ↓
      </button>
    </div>
  )}
</div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 border-t border-cyan-500/20 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase tracking-tighter flex items-center gap-2">
                    <Zap size={10} /> {s}
                  </button>
                ))}
              </div>

              <form className="flex items-center gap-3 bg-slate-950 border border-white/10 p-2 rounded-2xl focus-within:border-cyan-500/50 transition-all" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <button 
                  type="button" 
                  onClick={startListening}
                  className={`pl-2 transition-colors ${isListening ? 'text-rose-500 animate-pulse' : 'text-cyan-500/50 hover:text-cyan-400'}`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Execute command..."}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-cyan-50 placeholder:text-slate-600 font-mono py-2"
                />
                <button type="submit" disabled={loading || !input.trim()} className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 disabled:opacity-30 transition-all hover:scale-105 flex items-center gap-2 font-bold text-xs">
                  <span className="hidden md:block">SEND</span> <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
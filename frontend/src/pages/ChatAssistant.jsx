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
  "Network Health Check",
  "Why this Project",
  "What is DSA"
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const speakMessage = (text, index) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const ladyVoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Female") || 
      v.name.includes("Zira") || 
      v.name.includes("Samantha") || 
      v.name.includes("Microsoft Aria")
    );
    if (ladyVoice) utterance.voice = ladyVoice;
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => setSpeakingIndex(index);
    utterance.onend = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening) recognitionRef.current.stop();
    else {
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
    let yOffset = 45;
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "OPERATOR: " : "NIDS_AI: ";
      const lines = doc.splitTextToSize(`${role}${msg.content}`, 170);
      if (yOffset + (lines.length * 7) > 280) { doc.addPage(); yOffset = 20; }
      doc.text(role, 20, yOffset);
      doc.text(doc.splitTextToSize(msg.content, 150), 45, yOffset);
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

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || input.trim();
    if (!textToSend || loading) return;
    if (!isMuted) clickAudio.current.play().catch(() => {});
    setLoading(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: textToSend }]);

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
      <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 group flex items-center justify-center">
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition-opacity animate-pulse" />
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-2xl overflow-hidden">
          <Fingerprint className="w-7 h-7 md:w-8 md:h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
      </button>

        {isOpen && (
  /* 1. Centered floating wrapper with padding on all sides */
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
    
    {/* 2. Backdrop */}
    <div 
      className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity" 
      onClick={() => setIsOpen(false)} 
    />

    {/* 3. Floating Container: w-[95%] and h-[80dvh] ensures gaps on top/bottom/left/right */}
    <div className="relative w-[95%] md:w-[600px] h-[80dvh] md:h-[85vh] bg-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 rounded-3xl border border-cyan-500/30 shadow-2xl">
      
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-cyan-500/20 bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest">NIDS_CORE_AI</h3>
            <p className="text-[9px] md:text-[10px] text-cyan-500/70 font-mono">Neural Link: <span className="text-emerald-400">Stable</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={downloadChatLog} className="p-2 text-slate-400 hover:text-emerald-400"><Download size={16} /></button>
          {/* Mute/Unmute Toggle Restored */}
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-slate-400">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-rose-400"><X className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
      >
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl font-mono text-[11px] md:text-sm shadow-xl
              ${m.role === "user" ? "bg-cyan-600 text-slate-950 rounded-tr-none" : "bg-slate-800/90 text-cyan-50 border border-cyan-500/20 rounded-tl-none"}`}
            >
              {m.content}
              {/* Voice: Listen Button Restored */}
              {m.role === "assistant" && (
                <button onClick={() => speakMessage(m.content, idx)} className="mt-2 text-[10px] flex items-center gap-1 text-cyan-400/60 hover:text-cyan-400">
                  <Volume1 size={14} /> {speakingIndex === idx ? "Speaking..." : "Listen"}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-slate-900 border-t border-cyan-500/20 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar flex-nowrap">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handleSend(s)} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-[9px] font-bold text-cyan-400 flex items-center gap-1">
              <Zap size={10} /> {s}
            </button>
          ))}
        </div>

        <form className="flex items-center gap-2 bg-slate-950 border border-white/10 p-1.5 rounded-2xl" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          {/* Voice: Mic Button Restored */}
          <button 
            type="button" 
            onClick={startListening} 
            className={`p-2 transition-colors ${isListening ? 'text-rose-500 animate-pulse' : 'text-cyan-500/50 hover:text-cyan-400'}`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Execute command..."}
            className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-cyan-50 font-mono px-2"
          />
          
          <button type="submit" disabled={loading || !input.trim()} className="p-2 md:px-4 md:py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-[10px] md:text-xs hover:bg-cyan-400 transition-colors">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  </div>
)}

    </>
  );
}
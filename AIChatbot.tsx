import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! I am **CivicTwin AI**, your digital twin neighborhood assistant. I have real-time access to our active reports and prediction models.\n\nAsk me anything about current issues, priority alerts, or local municipal interventions!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chats
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle message send
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) throw new Error("Chat api failed");
      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: "assistant",
        text: "I apologize, but my neural link is experiencing latency. Please check your network connection and retry.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggestive quick prompts
  const quickPrompts = [
    "What is happening in my neighborhood?",
    "Which issue should the municipality prioritize?",
    "Summarize this week's reports."
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-full shadow-2xl flex items-center justify-center cursor-pointer relative group border border-cyan-400"
      >
        <MessageSquare className="w-6 h-6 text-slate-950" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900 animate-pulse">
          AI
        </span>
      </motion.button>

      {/* Floating Chat Box sliding container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[520px] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md"
          >
            {/* Header */}
            <div className="bg-slate-900/60 p-4 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-950 border border-cyan-800/40 rounded-lg">
                  <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm font-mono tracking-wide">CIVICTWIN ASSISTANT</h3>
                  <span className="text-[10px] text-emerald-400 font-mono block">● GRID NODE ACTIVE</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition bg-transparent border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages body list */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans leading-relaxed">
              {messages.map((msg) => {
                const isBot = msg.sender === "assistant";
                return (
                  <div key={msg.id} className={`flex items-start gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}>
                    <div className={`p-1.5 rounded-lg border ${
                      isBot ? "bg-slate-900 border-slate-850 text-slate-300" : "bg-cyan-950 border-cyan-800 text-cyan-200"
                    }`}>
                      {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    
                    <div className={`max-w-[75%] rounded-2xl p-3 ${
                      isBot ? "bg-slate-900/50 border border-slate-850/80 text-slate-200" : "bg-cyan-500 text-slate-950 font-medium"
                    }`}>
                      {/* Robust styling of bold markers in bot response text */}
                      <p className="whitespace-pre-line text-xs">
                        {msg.text.split("**").map((chunk, i) => (
                          i % 2 === 1 ? <strong key={i} className={isBot ? "text-cyan-400" : "font-extrabold"}>{chunk}</strong> : chunk
                        ))}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg border bg-slate-900 border-slate-850 text-slate-300">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-3 text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Gemini is compiling response...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested quick Prompts HUD footer */}
            {messages.length === 1 && (
              <div className="p-3 bg-slate-950 border-t border-slate-900 space-y-1.5 shrink-0">
                <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider block">Suggested Inquiries</span>
                <div className="flex flex-col gap-1">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left font-mono text-[10px] bg-slate-900 border border-slate-850 hover:border-cyan-500 hover:text-cyan-400 p-2 rounded-lg text-slate-400 transition"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3.5 border-t border-slate-850 bg-slate-900/40 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about neighborhood flood risk..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

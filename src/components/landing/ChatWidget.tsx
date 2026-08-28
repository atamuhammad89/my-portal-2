"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Calendar, ChevronRight, RotateCcw, Sparkles, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "💰 What are your pricing plans?",
  "🤖 How do AI voice agents work?",
  "📅 How can I book a live demo?",
  "🏥 What industries do you support?",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [chatId, setChatId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session and greeting on mount
  useEffect(() => {
    const savedChatId = typeof window !== "undefined" ? sessionStorage.getItem("callautomate_retell_chat_id") : null;
    if (savedChatId) {
      setChatId(savedChatId);
    }

    setMessages([
      {
        id: "msg_welcome",
        text: "Hello! 👋 I'm the CallAutomate AI assistant. How can I help you automate your business phone operations today?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const handleResetChat = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("callautomate_retell_chat_id");
    }
    setChatId("");
    setMessages([
      {
        id: "msg_welcome_reset",
        text: "Chat reset! How else can I assist you with CallAutomate AI voice agents?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageText = textToSend.trim();
    const userMsgObj: Message = {
      id: `user_${Date.now()}`,
      text: userMessageText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageText,
          chatId: chatId || undefined,
        }),
      });

      const data = await res.json();
      const botResponseText = data?.output || "Thank you for reaching out! How else can I help?";

      const returnedChatId = data?.chatId || data?.sessionId;
      if (returnedChatId && returnedChatId !== chatId) {
        setChatId(returnedChatId);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("callautomate_retell_chat_id", returnedChatId);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          text: botResponseText,
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          text: "I experienced a temporary connection issue. You can book a 1-on-1 demo call at https://yumnahhasan.youcanbook.me/ or reach us at support@callautomate.ai",
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPromptClick = (promptText: string) => {
    sendMessage(promptText);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper to render message text with Markdown bullet points and booking links
  const renderMessageContent = (text: string, isBot: boolean) => {
    const hasBookingLink = text.includes("youcanbook.me");
    let displayContent = text;

    // Split lines for basic bullet formatting
    const lines = displayContent.split("\n");

    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, lidx) => {
          // Check for bullet list syntax (* or -)
          const trimmed = line.trim();
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const bulletText = trimmed.substring(2);
            return (
              <div key={lidx} className="flex items-start gap-2 ml-1">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{renderFormattedText(bulletText)}</span>
              </div>
            );
          }
          if (line === "") return <div key={lidx} className="h-1" />;
          return <p key={lidx}>{renderFormattedText(line)}</p>;
        })}

        {hasBookingLink && isBot && (
          <div className="mt-3 bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-3.5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-xs text-white">Book 1-on-1 Voice Strategy Demo</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              Schedule a personalized walkthrough with our voice automation specialists.
            </p>
            <a
              href="https://yumnahhasan.youcanbook.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <span>Select Date & Time</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  };

  // Utility to handle bold markdown **text**
  const renderFormattedText = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div 
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 flex items-center group shrink-0 max-w-[calc(100vw-1rem)]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[92vw] sm:w-[380px] md:w-[410px] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[540px] max-h-[82vh] animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_#4ADE80]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm block">CallAutomate AI</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Live
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] block">Sub-300ms Voice & Support Assistant</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Conversation"
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/60">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isBot ? "items-start" : "items-end"}`}>
                <div className="flex items-end gap-2 max-w-[88%]">
                  {msg.isBot && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl shadow-sm ${
                      msg.isBot
                        ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                        : "bg-indigo-600 text-white rounded-tr-xs"
                    }`}
                  >
                    {renderMessageContent(msg.text, msg.isBot)}
                  </div>
                </div>

                <span className="text-[9.5px] font-mono text-slate-400 mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 font-medium ml-1">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (Only show if less than 3 user messages) */}
          {messages.filter((m) => !m.isBot).length < 2 && !isLoading && (
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_PROMPTS.map((promptText, pidx) => (
                <button
                  key={pidx}
                  onClick={() => handleQuickPromptClick(promptText)}
                  className="text-[11px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer"
                >
                  {promptText}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about CallAutomate..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-40 shrink-0 cursor-pointer shadow-md"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-indigo-400" />}
            </button>
          </form>

        </div>
      )}

      {/* Hover Hint Tooltip Badge */}
      {!isOpen && (
        <div
          className={`mr-3 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 hidden sm:flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            showTooltip ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>Talk to our AI Assistant</span>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Talk to our AI Assistant"
        className="relative h-12 w-12 sm:h-14 sm:w-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border border-slate-700/60 group shrink-0"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <Bot className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
              1
            </span>
          </>
        )}
      </button>
    </div>
  );
}

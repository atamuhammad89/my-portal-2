"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Calendar, ChevronRight } from "lucide-react";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm the CallAutomate AI assistant. How can I help you automate your phone operations today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, isBot: false, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      let botResponse = "Our AI voice agents handle 24/7 inbound calls, reservations, and customer support. You can test live calls or book a demo at https://yumnahhasan.youcanbook.me/";
      if (userMsg.toLowerCase().includes("pricing")) {
        botResponse = "CallAutomate pricing starts at $99/mo with 30-Day Free Trial included. View our pricing section above for plan options!";
      } else if (userMsg.toLowerCase().includes("demo") || userMsg.toLowerCase().includes("book")) {
        botResponse = "You can book a live 1-on-1 strategy call with our voice experts at https://yumnahhasan.youcanbook.me/";
      }

      setMessages((prev) => [...prev, { text: botResponse, isBot: true, timestamp: new Date() }]);
      setIsLoading(false);
    }, 600);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] max-h-[80vh] animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                AI
              </div>
              <div>
                <span className="text-white font-semibold text-sm block">CallAutomate AI</span>
                <span className="text-slate-400 text-xs block">Live Assistant</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => {
              const hasLink = msg.text.includes("youcanbook.me");
              const cleanText = msg.text.replace(/https:\/\/yumnahhasan\.youcanbook\.me\/?/g, "").trim();

              return (
                <div key={idx} className={`flex flex-col ${msg.isBot ? "items-start" : "items-end"}`}>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%] ${msg.isBot ? "bg-white border border-slate-200 text-slate-800 rounded-tl-none" : "bg-indigo-600 text-white rounded-tr-none"}`}>
                    <p className="whitespace-pre-wrap">{cleanText || msg.text}</p>
                    {hasLink && msg.isBot && (
                      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-900 text-xs">Book Strategy Demo</span>
                        </div>
                        <a
                          href="https://yumnahhasan.youcanbook.me/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                          <span>View Times</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{formatTime(msg.timestamp)}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none text-slate-900 placeholder:text-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 text-indigo-400" />}
      </button>
    </div>
  );
}

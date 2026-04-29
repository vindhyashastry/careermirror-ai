"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { authFetch, useAuthStore } from '@/services/auth-store';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api';

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: 'assistant', content: 'Hi there! Im your CareerMirror AI Assistant. Ask me anything about your resume, market trends, or interview prep.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleATSScore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // First, get the raw metrics to show in chat
      const res = await authFetch(`/dashboard-data`);
      const data = await res.json();

      if (!res.ok) throw new Error('Failed to fetch data');

      const msg = `**ATS Analysis for ${user?.full_name}:**\n\n` +
        `• **Overall Score:** ${data.score}%\n` +
        `• **Authenticity:** ${data.authenticity_score}%\n` +
        `• **Skills Detected:** ${data.skills?.length || 0}\n\n` +
        `*Your full Strategy Report is downloading automatically...*`;

      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);

      // Trigger automatic download
      const reportRes = await authFetch(`/assistant/ats-report`);
      if (reportRes.ok) {
        const blob = await reportRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CareerMirror_ATS_Report_${user?.full_name?.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not generate ATS analysis.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await authFetch(`/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!res.ok) throw new Error('Failed to fetch response');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'I could not process that request.' }]);
    } catch (e) {
      console.error(e);
      toast.error('AI Assistant is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
            className="fixed bottom-20 right-8 w-[420px] h-[550px] bg-[#F0F4FF] border-4 border-white rounded-[3rem] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/90 backdrop-blur-md p-7 flex justify-between items-center border-b-4 border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight">Mirror AI</h3>
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Career Strategist</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Quick Actions Capsules */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto custom-scrollbar-hide bg-white/50">
              {[
                { label: 'ATS Score', icon: ShieldCheck, action: handleATSScore },
                { label: 'GitHub Audit', icon: Send, action: () => setInput('Analyze my GitHub: https://github.com/') },
                { label: 'Project Ideas', icon: MessageSquare, action: () => { setInput('Suggest 3 trending project ideas for my profile.'); sendMessage(); } }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-primary/10 rounded-full whitespace-nowrap text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <item.icon size={12} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-transparent scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.1),inset_4px_4px_8px_rgba(255,255,255,0.2)]'
                    : 'bg-white border-2 border-white/50 text-slate-700 rounded-tl-sm shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]'
                    }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-white/50 p-4 rounded-[2rem] rounded-tl-sm shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/30 backdrop-blur-xl border-t-4 border-white/40">
              <div className="flex gap-3 bg-white/80 p-3 rounded-[2rem] border-2 border-white shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask Mirror AI..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-12 h-12 bg-primary text-primary-foreground rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

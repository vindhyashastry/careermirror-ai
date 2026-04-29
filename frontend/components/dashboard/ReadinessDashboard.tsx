"use client";

import React from 'react';
import { useReadinessStore } from '@/services/readiness-store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ShieldCheck, Target, AlertTriangle, Zap, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export const ReadinessDashboard = () => {
  const { score, skills, gaps, hiddenGaps, authenticityScore } = useReadinessStore();

  const skillData = [
    { subject: 'Technical Depth', A: score, fullMark: 100 },
    { subject: 'Authenticity', A: authenticityScore, fullMark: 100 },
    { subject: 'Market Fit', A: 75, fullMark: 100 },
    { subject: 'Soft Skills', A: 60, fullMark: 100 },
    { subject: 'System Design', A: 45, fullMark: 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl">
      {/* Main Score & Radar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Readiness Profile</h2>
            <p className="text-slate-400">Based on industry-standard role graphs</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-5xl font-black text-indigo-500">{score.toFixed(0)}%</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Total Readiness</div>
          </div>
        </div>

        <div className="h-[400px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Radar
                name="Candidate"
                dataKey="A"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Side Panels */}
      <div className="lg:col-span-4 space-y-8">
        {/* Authenticity Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck className="text-indigo-400" />
            <h3 className="font-bold text-lg text-indigo-300">Authenticity Score</h3>
          </div>
          <div className="text-3xl font-bold mb-2">{authenticityScore}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${authenticityScore}%` }} />
          </div>
          <p className="text-xs text-indigo-400/70 mt-3">
            Signals: Project deployment, unique contributions, and testing exposure detected.
          </p>
        </motion.div>

        {/* Gaps Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="text-orange-400" />
            <h3 className="font-bold text-lg text-slate-200">Critical Skill Gaps</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {gaps.length > 0 ? gaps.map((gap, i) => (
              <span key={i} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                {gap}
              </span>
            )) : <span className="text-slate-500 italic">No critical gaps detected</span>}
          </div>
        </motion.div>

        {/* Hidden Gaps (Inferred) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <BrainCircuit className="text-pink-400" />
            <h3 className="font-bold text-lg text-slate-200">Hidden Expectations</h3>
          </div>
          <ul className="space-y-2">
            {hiddenGaps.map((gap, i) => (
              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                <Zap className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                {gap}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/services/auth-store';
import { API_BASE } from '@/lib/api';
import { Info, TrendingUp, AlertCircle, ChevronRight, Activity } from 'lucide-react';

export const MarketHeatmap = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch heatmap data or use mock
    setData([
      { skill: 'React', demand: 90, gap: 10 },
      { skill: 'Node.js', demand: 85, gap: 20 },
      { skill: 'Python', demand: 95, gap: 5 },
      { skill: 'FastAPI', demand: 80, gap: 30 }
    ]);
  }, []);

  return (
    <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground mb-2 flex items-center gap-3">
            <Activity className="text-primary w-6 h-6" /> Market Heatmap
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Live demand vs your proficiency.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item, idx) => (
          <div key={idx} className="bg-muted rounded-[1.5rem] p-6 text-center shadow-inner border border-border">
            <h3 className="font-bold text-foreground mb-2">{item.skill}</h3>
            <div className="flex flex-col gap-1 items-center justify-center">
              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Demand: {item.demand}%</span>
              <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Gap: {item.gap}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

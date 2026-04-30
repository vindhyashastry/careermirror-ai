"use client";

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { authFetch } from '@/services/auth-store';
import { Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MarketHeatmap = () => {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch('/market-heatmap');
        if (res.ok) {
          const json = await res.json();
          setHeatmapData(json);
        }
      } catch (e) {
        console.error("Failed to fetch heatmap:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium italic">Mapping market intelligence...</p>
      </div>
    );
  }

  if (!heatmapData) return null;

  const { roles, categories, matrix } = heatmapData;

  // Flatten matrix into [cat_idx, role_idx, demand]
  const formattedData = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      formattedData.push([c, r, matrix[r][c].demand || 0]);
    }
  }

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderWidth: 0,
      textStyle: { color: '#1e293b', fontWeight: 'bold' },
      formatter: (params: any) => {
        const role = roles[params.data[1]];
        const cat = categories[params.data[0]];
        const val = params.data[2];
        return `<div class="p-2">
          <div class="text-[10px] uppercase text-slate-400 font-black">${role}</div>
          <div class="text-sm text-slate-800 font-black">${cat}</div>
          <div class="mt-1 text-primary font-black">Demand: ${val}/5</div>
        </div>`;
      }
    },
    grid: {
      top: '10%',
      bottom: '15%',
      left: '15%',
      right: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      splitArea: { show: true },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold',
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'category',
      data: roles,
      splitArea: { show: true },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold'
      }
    },
    visualMap: {
      min: 0,
      max: 5,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: [
          '#f1f5f9', // slate-100
          '#e2e8f0', // slate-200
          '#93c5fd', // blue-300
          '#3b82f6', // blue-500 (primary)
          '#1d4ed8'  // blue-700
        ]
      },
      textStyle: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 10
      }
    },
    series: [
      {
        name: 'Market Demand',
        type: 'heatmap',
        data: formattedData,
        label: {
          show: true,
          fontSize: 10,
          fontWeight: 'bold',
          color: '#1e293b'
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground mb-2 flex items-center gap-3">
            <Activity className="text-primary w-6 h-6" /> Market Intelligence Matrix
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Real-time demand mapping across your technical ecosystem.</p>
        </div>
      </div>
      
      <div className="h-[450px] w-full">
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
      
      <div className="mt-6 flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
          AI Insights: Cloud-native skills are currently showing a 40% higher demand in your target roles.
        </p>
      </div>
    </motion.div>
  );
};

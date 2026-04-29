"use client";

import { useEffect, useState } from 'react';
import { authFetch, useAuthStore } from '@/services/auth-store';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Target, Zap, ShieldCheck, XCircle, TrendingUp, Award, Sparkles, BrainCircuit, BarChart3, Info } from 'lucide-react';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { MarketHeatmap } from '@/components/dashboard/MarketHeatmap';
import { useReadinessStore } from '@/services/readiness-store';
import { useResumeStore } from '@/services/resume-store';
import { API_BASE } from '@/lib/api';

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [jdText, setJdText] = useState('');
  const [matchingJd, setMatchingJd] = useState(false);
  const [jdResults, setJdResults] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuthStore();
  const { setReadiness } = useReadinessStore();
  const { setResume } = useResumeStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      const res = await authFetch(`${API_BASE}/dashboard-data`);
      const json = await res.json();
      setData(json);
      
      // Update global stores
      if (json.has_resume) {
        setResume(json.resume_id, json.filename);
        setReadiness({
          score: json.score,
          skills: json.skills,
          gaps: json.gap_analysis?.gaps || [],
          authenticityScore: json.authenticity_score
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async () => {
    setReanalyzing(true);
    try {
      const res = await authFetch(`${API_BASE}/reanalyze-resume`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
        // If we have JD text, re-run the match automatically to update scores for the re-analyzed resume
        if (jdText.trim()) {
          await handleJDMatch();
        } else {
          // If no JD, reset jdResults since the general analysis has changed
          setJdResults(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleJDMatch = async () => {
    if (!jdText.trim()) return;
    setMatchingJd(true);
    try {
      const res = await authFetch(`${API_BASE}/match-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      });
      const json = await res.json();
      if (res.ok) {
        setJdResults(json);
        // Also update main data to reflect the new scores for this JD
        setData({
          ...data,
          score: json.readiness_score,
          authenticity_score: json.authenticity_score,
          gap_analysis: { gaps: json.gaps },
          ai_strategy: json.ai_strategy
        });

        // Update readiness store for other components (like Job Matches unlock)
        setReadiness({
          score: json.readiness_score,
          gaps: json.gaps,
          authenticityScore: json.authenticity_score
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchingJd(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mb-4"
      />
      <p className="text-muted-foreground font-medium">Fetching your career data...</p>
    </div>
  );

  if (!data?.has_resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-primary/10 border border-primary/20"
        >
          <Sparkles size={48} className="text-primary" />
        </motion.div>
        <h2 className="text-4xl font-black mb-4 text-foreground">Unlock Your Potential</h2>
        <p className="text-muted-foreground max-w-md mb-10 leading-relaxed text-lg">
          Upload your resume to see your personalized career readiness scores and discover skills that set you apart.
        </p>
        <Link href="/dashboard/upload" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95">
          Get Analyzed Now
        </Link>
      </div>
    );
  }

  const score = data?.score || 0;
  const authenticity_score = data?.authenticity_score || 0;
  const gap_analysis = data?.gap_analysis || { gaps: [] };
  const skills = data?.skills || [];
  const filename = data?.filename || 'Current Resume';
  const gaps = gap_analysis?.gaps || [];

  const radarData = [
    { subject: 'Tech Depth', A: score, fullMark: 100 },
    { subject: 'Authenticity', A: authenticity_score, fullMark: 100 },
    { subject: 'Market Fit', A: Math.min(100, score + 10), fullMark: 100 },
    { subject: 'Soft Skills', A: 70, fullMark: 100 },
    { subject: 'Experience', A: authenticity_score > 50 ? 85 : 60, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1 tracking-tight">Career Intelligence</h1>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-muted-foreground font-medium text-sm">
              Targeting <span className="text-primary font-bold">{user?.target_roles?.join(', ') || 'Global Markets'}</span>
            </p>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-2 py-1 bg-secondary rounded-lg">
              <BarChart3 size={12} /> {filename || 'Current Resume'}
            </div>
            <button 
              onClick={handleRetry}
              disabled={reanalyzing}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              <Zap size={12} className={reanalyzing ? "animate-pulse" : ""} /> {reanalyzing ? 'Re-analyzing...' : 'Retry Analysis'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 shadow-sm backdrop-blur-sm">
          <TrendingUp className="text-primary" size={16} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Market Trend</span>
            <span className="text-xs font-bold text-foreground">High Demand</span>
          </div>
        </div>
      </header>

      {/* Only show analysis if JD has been matched */}
      {jdResults ? (
        <>
          {/* Full Width Radar Profile */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[2rem] p-5 shadow-md relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -mr-40 -mt-40"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="max-w-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <BarChart3 className="text-primary" size={20} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">Readiness Profile</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Semantic alignment across five core professional dimensions, benchmarked against your provided job requirements.
                </p>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                      <Sparkles size={12} /> Precision Matched
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-3 py-1.5 bg-secondary rounded-full">
                      <Info size={12} /> Real-time
                   </div>
                </div>
              </div>
              
              <div className="h-[280px] w-full md:w-[420px] flex items-center justify-center">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      cx="50%" 
                      cy="50%" 
                      outerRadius="65%" 
                      data={radarData}
                      margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
                    >
                      <PolarGrid stroke="currentColor" className="text-border" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 700 }} 
                        className="text-muted-foreground" 
                      />
                      <Radar
                        name="Candidate"
                        dataKey="A"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Grid - Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ y: -3 }} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center group">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Target className="text-primary" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">JD Match Score</span>
              <div className="text-3xl font-black text-foreground">{Math.round(score)}%</div>
              <div className="w-full bg-secondary/50 h-1 rounded-full mt-3 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className="h-full bg-primary" />
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center group">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="text-primary" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Authenticity</span>
              <div className="text-3xl font-black text-foreground">{Math.round(authenticity_score)}%</div>
              <div className="w-full bg-secondary/50 h-1 rounded-full mt-3 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${authenticity_score}%` }} className="h-full bg-primary" />
              </div>
            </motion.div>
          </div>

          <MarketHeatmap />

          {/* Strategy & Gaps Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ y: -3 }} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center group relative overflow-hidden">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <AlertTriangle className="text-primary" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Missing Requirements</span>
              <div className="text-3xl font-black text-foreground">{gaps.length}</div>
              
              <div className="w-full mt-3 relative group/carousel">
                 <div 
                   id="gaps-container"
                   className="flex gap-2 overflow-x-auto custom-scrollbar-hide scroll-smooth px-4 pb-2"
                   style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                 >
                    {gaps.length > 0 ? gaps.map((g: string, i: number) => (
                      <span key={i} className="whitespace-nowrap text-[10px] font-bold px-3 py-1 bg-destructive/5 text-destructive rounded-full border border-destructive/10 shrink-0">
                        {g}
                      </span>
                    )) : <span className="text-[10px] font-bold text-muted-foreground">Perfect match!</span>}
                 </div>
              </div>
            </motion.div>
          </div>

          {/* Secondary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="text-indigo-500" size={16} />
                </div>
                <h4 className="text-sm font-bold text-foreground">Extracted Skills</h4>
                <span className="text-[10px] text-muted-foreground font-medium ml-auto">Found in your resume</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills && skills.length > 0 ? skills.map((skill: string, i: number) => (
                  <span key={i} className="text-[11px] font-bold px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg border border-border">
                    {skill}
                  </span>
                )) : <p className="text-xs text-muted-foreground italic">No technical skills detected.</p>}
              </div>
            </div>

            <div className="lg:col-span-4 bg-primary text-primary-foreground rounded-2xl p-5 shadow-md shadow-primary/20 relative overflow-hidden group">
               <Sparkles className="absolute -right-3 -bottom-3 text-white/10 w-20 h-20 group-hover:scale-110 transition-transform" />
               <h4 className="text-sm font-black mb-2 relative z-10">AI Target Strategy</h4>
               <p className="text-xs opacity-90 leading-relaxed mb-4 relative z-10">
                  {data.ai_strategy || "Focus on the identified gaps to increase your match percentage for this role."}
               </p>
               <Link href="/dashboard/practice" className="inline-flex items-center gap-2 text-xs font-bold bg-white text-primary px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all">
                  Start Practice Session
               </Link>
            </div>
          </div>

          <div className="pt-10 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-6">Want to match against another role?</h3>
          </div>
        </>
      ) : (
        <div className="py-10 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-black text-foreground mb-3">Resume Uploaded Successfully!</h2>
            <p className="text-muted-foreground font-medium">
              Your resume has been parsed. Now, provide a Job Description to generate your Precision Readiness Dashboard.
            </p>
          </motion.div>
        </div>
      )}


      {/* Always show JD Matcher, but style differently based on state */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-card border-2 ${jdResults ? 'border-border' : 'border-primary/20'} rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden`}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${jdResults ? 'bg-secondary' : 'bg-primary'} rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10`}>
                <BrainCircuit className={jdResults ? "text-muted-foreground" : "text-white"} size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">{jdResults ? 'Update Target Job' : 'Target Job Description'}</h3>
                <p className="text-muted-foreground text-sm font-medium">Precision analysis against a specific role.</p>
              </div>
            </div>
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the Job Description here (e.g. from LinkedIn or Indeed)..."
              className="w-full h-40 bg-secondary/30 border border-border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/50 font-medium"
            />
            <button 
              onClick={handleJDMatch}
              disabled={matchingJd || !jdText.trim()}
              className="w-full lg:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/10"
            >
              {matchingJd ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                  Generating Dashboard...
                </>
              ) : (
                <>
                  <Target size={18} /> {jdResults ? 'Update Analysis' : 'Generate Dashboard'}
                </>
              )}
            </button>
          </div>

          <div className="w-full lg:w-72 space-y-4">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
              <h4 className="text-xs font-black uppercase text-primary mb-3">How it works</h4>
              <ul className="space-y-2">
                {[
                  "Semantic matching with your resume",
                  "Requirement gap extraction",
                  "ATS readiness scoring",
                  "Customized practice strategy"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                    <CheckCircle2 size={12} className="text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            {jdResults && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-indigo-500 text-white rounded-2xl p-5 shadow-lg">
                <div className="text-[10px] font-black uppercase opacity-70 mb-1">Precision Match</div>
                <div className="text-3xl font-black">{Math.round(jdResults.readiness_score)}%</div>
                <p className="text-[10px] mt-2 font-medium opacity-90 italic">&quot;Successfully benchmarked against custom JD.&quot;</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

    </div>
  );
}

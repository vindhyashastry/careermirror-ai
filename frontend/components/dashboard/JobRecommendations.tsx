"use client";

import React, { useEffect } from 'react';
import { useJobStore, JobMatch } from '@/services/job-store';
import { useReadinessStore } from '@/services/readiness-store';
import { useResumeStore } from '@/services/resume-store';
import { authFetch } from '@/services/auth-store';
import { Briefcase, MapPin, Building, ExternalLink, Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export const JobRecommendations = () => {
  const router = useRouter();
  const { jobs, loading, setJobs, setLoading, hasFetched } = useJobStore();
  const { score } = useReadinessStore();
  const { resumeId } = useResumeStore();

  const threshold = 70; // Readiness threshold to unlock jobs
  const isLocked = score < threshold;

  useEffect(() => {
    const fetchJobs = async () => {
      if (!resumeId || isLocked || hasFetched) return;

      setLoading(true);
      try {
        const response = await authFetch(`http://127.0.0.1:8000/match-jobs?resume_id=${resumeId}`);
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [resumeId, isLocked, hasFetched, setJobs, setLoading]);

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-[2.5rem] shadow-lg">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 relative shadow-inner">
          <Lock className="text-muted-foreground w-10 h-10" />
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-xs font-black text-primary-foreground shadow-lg shadow-primary/20">
            {threshold}%
          </div>
        </div>
        <h2 className="text-3xl font-black mb-4 text-foreground tracking-tight">Access Locked</h2>
        <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed font-medium">
          Your current readiness score is <strong className="text-primary">{score.toFixed(0)}%</strong>.
          You need to reach at least <strong className="text-primary">{threshold}%</strong> to unlock premium job recommendations.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard/practice')}
            className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all shadow-xl shadow-primary/10 active:scale-95"
          >
            Improve Score with AI Practice
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Analyzing market trends and matching your verified skills...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">


      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {jobs.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-card/30 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Briefcase className="text-muted-foreground/40 w-10 h-10" />
            </div>
            <p className="text-muted-foreground font-bold text-lg mb-2">The AI is still scanning...</p>
            <p className="text-muted-foreground/60 text-sm max-w-xs">No perfect matches yet. Try polishing your skills in the Practice section to unlock more opportunities.</p>
          </div>
        ) : (
          jobs.map((job: JobMatch, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
              whileHover={{ y: -4, rotate: index % 2 === 0 ? 0.5 : -0.5 }}
              className="bg-card border border-border/50 rounded-2xl p-5 transition-all group shadow-sm hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden flex flex-col"
            >
              {/* Score Badge Overlay */}
              <div className="absolute top-0 right-0 p-3">
                <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[9px] font-black border border-primary/20">
                  {(job.similarity * 100).toFixed(0)}% MATCH
                </div>
              </div>

              {/* Icon Section */}
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Briefcase className="text-primary" size={18} />
              </div>

              {/* Content */}
              <div className="flex-1 mb-4">
                <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors mb-2 leading-tight pr-12">
                  {job.title}
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground/80 font-bold text-xs">
                    <Building size={11} className="text-primary/60" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 font-medium text-[10px]">
                      <MapPin size={11} />
                      <span>{job.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-border/50">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-3 py-2.5 bg-secondary/50 hover:bg-primary hover:text-primary-foreground rounded-xl transition-all font-black text-[10px] uppercase tracking-widest group/btn"
                >
                  Apply Directly
                  <div className="w-5 h-5 bg-background/20 rounded-md flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                    <ExternalLink size={10} />
                  </div>
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

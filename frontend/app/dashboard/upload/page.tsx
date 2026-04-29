"use client";

import { ResumeUpload } from '@/components/dashboard/ResumeUpload';
import { motion } from 'framer-motion';
import { FileText, Sparkles, User as UserIcon, Target as TargetIcon, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore, authFetch } from '@/services/auth-store';

export default function UploadPage() {
  const { user, setUser } = useAuthStore();
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state with global user
  useEffect(() => {
    if (user) {
      setTargetRole(user.target_roles?.[0] || '');
      setExperienceLevel(user.role || 'professional');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const res = await authFetch('http://127.0.0.1:8000/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_roles: [targetRole],
          role: experienceLevel
        })
      });
      
      if (res.ok && user) {
        // Update global store immediately
        setUser({
          ...user,
          target_roles: [targetRole],
          role: experienceLevel
        });
      }
    } catch (e) {
      console.error("Failed to update profile specs", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 text-center relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8">
          <Sparkles size={14} className="animate-pulse" />
          Intelligence Engine 2.4
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-foreground mb-6 tracking-tight">
          Analyze Your <span className="text-primary italic">Potential.</span>
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          Upload your resume below to begin your personalized career intelligence audit.
        </p>
      </motion.div>

      {/* Hero Upload Zone */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-16"
      >
        <div className="max-w-4xl mx-auto">
          <ResumeUpload />
        </div>
      </motion.div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Specifications Form - Now as secondary context */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-7 bg-card/50 backdrop-blur-md border border-border p-10 rounded-[3rem] shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-2xl font-black text-foreground mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <TargetIcon className="text-primary" size={20} />
            </div>
            Refine Your Audit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Target Role</label>
              <div className="relative group/input">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  onBlur={handleUpdateProfile}
                  placeholder="e.g. Senior Backend Engineer" 
                  className="w-full bg-background/50 border-2 border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-primary transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Current Focus</label>
              <div className="relative group/input">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={18} />
                <select 
                  value={experienceLevel}
                  onChange={(e) => {
                    setExperienceLevel(e.target.value);
                    setTimeout(handleUpdateProfile, 100);
                  }}
                  className="w-full bg-background/50 border-2 border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-primary transition-all appearance-none outline-none"
                >
                  <option value="student">Student / Intern</option>
                  <option value="graduate">New Graduate</option>
                  <option value="professional">Experienced Professional</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-[10px] text-muted-foreground font-bold bg-secondary/50 px-4 py-2 rounded-xl w-fit">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Specs are synchronized with your AI profile automatically.
          </div>
        </motion.div>
        
        {/* Process Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="bg-gradient-to-br from-card to-secondary/30 border border-border p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
            <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-3">
              <FileText className="text-primary" size={22} />
              The Pipeline
            </h3>
            <div className="space-y-6">
              {[
                { label: "Semantic Extraction", text: "Multi-layered parsing of text & structures." },
                { label: "Market Alignment", text: "Benchmarking against 10k+ tech requirements." },
                { label: "Inference Engine", text: "Identifying implicit gaps and hidden skills." }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-black">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground mb-1">{step.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary p-1 rounded-[3rem]">
            <div className="bg-card rounded-[2.8rem] p-8 flex items-center gap-5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="text-primary" size={28} />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">GPT-4o Optimized</p>
                <p className="text-xs text-muted-foreground font-medium">Ready for high-precision technical auditing.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

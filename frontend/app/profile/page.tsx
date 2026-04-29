"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, authFetch } from '@/services/auth-store';
import { API_BASE } from '@/lib/api';
import { Loader2, Save, FileText, Clock, User as UserIcon, LogOut, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, checkSession, logout } = useAuthStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Profile form state
  const [role, setRole] = useState('student');
  const [targetRoles, setTargetRoles] = useState('');
  const [prefLang, setPrefLang] = useState('');
  const [careerInterests, setCareerInterests] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setRole(user.role || 'student');
      setTargetRoles(user.target_roles?.join(', ') || '');
      setPrefLang(user.preferred_language || '');
      setCareerInterests(user.career_interests?.join(', ') || '');
      fetchResumes();
    }
  }, [user, loading, router]);

  const fetchResumes = async () => {
    try {
      const res = await authFetch(`/my-resumes`);
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const tr = targetRoles.split(',').map(r => r.trim()).filter(Boolean);
    const ci = careerInterests.split(',').map(c => c.trim()).filter(Boolean);
    
    try {
      const res = await authFetch(`/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          target_roles: tr,
          preferred_language: prefLang,
          career_interests: ci
        }),
      });
      if (res.ok) {
        await checkSession();
        alert('Profile updated successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shadow-inner">
              <UserIcon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">{user.full_name}</h1>
              <p className="text-muted-foreground font-medium text-lg">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="px-8 py-3 bg-secondary text-foreground hover:bg-muted rounded-2xl font-bold transition-all shadow-sm border border-border">
              Back to Dashboard
            </Link>
            <button onClick={logout} className="px-8 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-2xl font-bold flex items-center gap-2 transition-all border border-destructive/20">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Profile Editor - Now more compact */}
          <div className="lg:col-span-7 bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                <Sparkles className="text-primary" size={20} /> Preferences
              </h2>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/20">
                AI Customization
              </span>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-5 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Status</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm text-foreground font-bold shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="graduate">Recent Graduate</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Tech</label>
                  <input 
                    type="text" 
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value)}
                    placeholder="Python, TS..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm text-foreground font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Roles</label>
                <input 
                  type="text" 
                  value={targetRoles}
                  onChange={(e) => setTargetRoles(e.target.value)}
                  placeholder="Frontend Developer, Data Scientist..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm text-foreground font-bold shadow-inner" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Career Interests</label>
                <textarea 
                  value={careerInterests}
                  onChange={(e) => setCareerInterests(e.target.value)}
                  placeholder="AI, FinTech, Open Source..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm text-foreground font-bold shadow-inner min-h-[80px] resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 active:scale-95 mt-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sync Preferences
              </button>
            </form>
          </div>

          {/* Resume History */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-card border border-border rounded-[3rem] p-10 shadow-lg flex-1">
              <h2 className="text-2xl font-black text-foreground mb-8 flex items-center gap-3">
                <FileText className="text-primary" size={24} /> History
              </h2>
              
              {loadingResumes ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-[2.5rem]">
                  <p className="font-bold">No resumes yet</p>
                  <Link href="/dashboard/upload" className="text-primary font-black hover:underline mt-2 inline-block">Get Analyzed</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {resumes.sort((a, b) => b.version - a.version).map((res) => (
                    <motion.div 
                      key={res.id} 
                      whileHover={{ x: 5 }}
                      className="p-6 bg-background border border-border rounded-3xl flex justify-between items-center group transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground flex items-center gap-2 truncate">
                          {res.filename}
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20 shrink-0">
                            v{res.version}
                          </span>
                        </h4>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1 uppercase tracking-tighter">
                          <Clock size={10} /> {new Date(res.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                          {res.skills.length} SKILLS
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] p-8">
               <h4 className="font-black text-emerald-600 uppercase text-xs tracking-widest mb-3">Pro Tip</h4>
               <p className="text-sm text-emerald-800/80 font-medium leading-relaxed">
                  Keeping your target roles updated ensures our <strong>Job Match Engine</strong> and <strong>AI Practice Questions</strong> remain hyper-relevant to your goals.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { useResumeStore } from '@/services/resume-store';
import { useReadinessStore } from '@/services/readiness-store';
import { useAuthStore, authFetch } from '@/services/auth-store';
import { Upload, FileText, CheckCircle, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

export const ResumeUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const setResume = useResumeStore((state) => state.setResume);
  const setReadiness = useReadinessStore((state) => state.setReadiness);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleUpload = async (file: File) => {
    if (loading) return; // Prevent multiple uploads at a time
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading resume to backend...');
      const response = await authFetch('/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log('Backend response from /upload-resume:', data);
      
      if (!response.ok) {
        console.error('Backend returned an error status:', response.status, data);
        throw new Error(data.detail || 'Failed to upload resume');
      }
      
      setResume(data.resume_id, file.name);
      setReadiness({
        score: data.readiness_score,
        skills: data.skills,
        gaps: data.gaps,
        hiddenGaps: data.hidden_gaps,
        authenticityScore: data.authenticity_score,
      });
      
      // Redirect to dashboard where the real data is fetched
      router.push('/dashboard');
    } catch (error) {
      console.error('Upload failed with error:', error);
      alert(`Upload failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (loading || !user) return; // Prevent if loading or not logged in
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  if (!user) {
    return (
      <div className="relative border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center bg-muted/20 backdrop-blur-xl">
        <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold mb-2 text-foreground">Login Required</h3>
        <p className="text-muted-foreground text-center max-w-xs mb-8">
          You must be logged in to upload a resume and receive your verified Readiness Score.
        </p>
        <Link href="/login" className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div 
      className={`relative group cursor-pointer border-2 border-dashed rounded-[3rem] p-20 transition-all duration-500 flex flex-col items-center justify-center bg-card/40 backdrop-blur-2xl overflow-hidden ${dragActive ? 'border-primary bg-primary/10 scale-[1.01] shadow-2xl shadow-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/40 shadow-xl'}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {loading ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Analyzing skills & detecting gaps...</p>
        </div>
      ) : (
        <>
          <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-[2rem] flex items-center justify-center mb-8 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-2xl shadow-primary/20 relative">
            <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Upload className="w-10 h-10 text-white relative z-10" />
          </div>
          <h3 className="text-3xl font-black mb-3 text-foreground tracking-tight">Drop Your Career Story</h3>

          <p className="text-muted-foreground text-center max-w-xs mb-8">
            Supports PDF and DOCX files. After upload, provide a Job Description for a targeted Precision Match analysis.
          </p>
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => {
              if (e.target.files && !loading) handleUpload(e.target.files[0]);
              e.target.value = '';
            }}
            accept=".pdf"
            disabled={loading}
            multiple={false}
          />
          <button className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95">
            Select File
          </button>

        </>
      )}
    </div>
  );
};

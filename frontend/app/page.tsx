"use client";

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { motion } from 'framer-motion';
import { Target, Zap, ShieldCheck, ArrowRight, BarChart3, Briefcase } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: "Real-time Readiness Score",
      description: "Get a live percentage of how ready you are for your dream role based on current market demands.",
      icon: Target,
      color: "text-indigo-400"
    },
    {
      title: "Hidden Gap Detection",
      description: "Our AI identifies implicit skills recruiters expect that aren't explicitly listed in job descriptions.",
      icon: Zap,
      color: "text-amber-400"
    },
    {
      title: "Authenticity Analysis",
      description: "Verify the depth of your experience and ensure your resume projects true professional mastery.",
      icon: ShieldCheck,
      color: "text-emerald-400"
    },
    {
      title: "Smart Job Matching",
      description: "Connect with roles that actually fit your profile, skipping the noise and focusing on high-probability leads.",
      icon: Briefcase,
      color: "text-blue-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[150px] animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent">
              Bridge the Gap Between <br /> <span className="text-primary">Skills and Success</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              CareerMirror AI uses advanced language models to analyze your resume against real-world industry benchmarks. Discover hidden gaps, verify your readiness, and land your dream job faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register" className="group px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-lg flex items-center gap-2 transition-all shadow-xl shadow-primary/20 active:scale-95">
                Start Your Analysis
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard" className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-2xl font-bold text-lg transition-all active:scale-95">
                View Demo Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-card border border-border/50 rounded-3xl hover:border-primary/30 transition-all group shadow-sm hover:shadow-md"
              >
                <div className={`w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-primary" size={28} />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brief Description Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-8">How it works?</h2>
            <div className="space-y-8">
              {[
                { step: "01", title: "Upload Resume", text: "Securely upload your resume in PDF or DOCX format." },
                { step: "02", title: "AI Analysis", text: "Our LLMs cross-reference your skills with thousands of job descriptions." },
                { step: "03", title: "Get Insights", text: "Receive a detailed report on readiness, gaps, and recommendations." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <span className="text-primary font-black text-2xl">{item.step}</span>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
             <div className="aspect-square bg-primary/5 border border-border rounded-[3rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/5">
                <BarChart3 size={120} className="text-primary/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
             </div>
             {/* Floating UI Elements for Premium Look */}
             <div className="absolute -top-10 -right-10 bg-card border border-border p-6 rounded-2xl shadow-xl animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-foreground">Readiness: 87%</span>
                </div>
             </div>
             <div className="absolute -bottom-10 -left-10 bg-card border border-border p-6 rounded-2xl shadow-xl animate-bounce duration-[4000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-bold text-foreground">Skill Gap: Docker</span>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-border text-center">
        <p className="text-muted-foreground text-sm">© 2026 CareerMirror AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

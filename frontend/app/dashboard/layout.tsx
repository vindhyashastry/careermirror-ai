"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/services/auth-store';
import { LayoutDashboard, Upload, Briefcase, BrainCircuit, User, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, checkSession, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-black"
        >
          Mirroring...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="flex pt-20 h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-72 bg-muted/30 border-r border-border hidden lg:flex flex-col p-6">
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Navigation</h2>
            <nav className="space-y-2">
              {[
                { href: '/dashboard/upload', label: 'Upload Resume', icon: Upload },
                { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
                { href: '/dashboard/practice', label: 'The Forge', icon: BrainCircuit },
                { href: '/dashboard/jobs', label: 'Job Matches', icon: Briefcase },
              ].map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center justify-between group px-4 py-3 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon size={20} />
                      <span className="font-bold text-sm">{link.label}</span>
                    </div>
                    <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-4 bg-secondary/50 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {user.full_name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Link href="/profile" className="flex items-center justify-center gap-2 w-full py-2 bg-background hover:bg-muted rounded-xl text-xs font-bold transition-colors border border-border">
              <User size={14} />
              View Profile
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-40 flex items-center justify-around px-2">
          {[
            { href: '/dashboard/upload', label: 'Upload', icon: Upload },
            { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
            { href: '/dashboard/practice', label: 'Forge', icon: BrainCircuit },
            { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
          ].map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <link.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

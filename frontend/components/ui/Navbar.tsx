"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, LayoutDashboard, Upload, Home, User } from 'lucide-react';
import { useAuthStore } from '@/services/auth-store';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Resume', href: '/dashboard/upload', icon: Upload },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <GraduationCap className="text-primary-foreground" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            CareerMirror
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border border-border hover:bg-accent transition-colors">
                <User size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{user.full_name.split(' ')[0]}</span>
              </Link>
              <button 
                onClick={logout}
                className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-full transition-all shadow-lg shadow-primary/20 active:scale-95">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

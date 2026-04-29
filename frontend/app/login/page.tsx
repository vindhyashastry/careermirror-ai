"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, setToken } from '@/services/auth-store';
import { API_BASE } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Briefcase, ChevronRight, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const checkSession = useAuthStore(state => state.checkSession);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const m = searchParams.get('mode');
      if (m === 'login' || m === 'signup') {
        setMode(m as 'login' | 'signup');
      }
    }
  }, []);

  const validatePasswordStrength = (pwd: string) => {
    const hasNumber = /\d/.test(pwd);
    const hasChar = /[a-zA-Z]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return hasNumber && hasChar && hasSpecial && pwd.length >= 8;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !validatePasswordStrength(password)) {
      setError('Password must be 8+ chars and include numbers, letters, and special characters.');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, full_name: fullName, role };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        await checkSession();
        router.push('/profile');
      } else {
        const data = await res.json();
        setError(data.detail || `${mode} failed`);
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6 font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div
        layout
        className="w-full max-w-xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] p-10 relative"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            {mode === 'signup' ? 'Join CareerMirror' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 mt-2">
            {mode === 'signup' ? 'Start your AI-powered career journey' : 'Resume your career growth where you left off'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2"
          >
            <ShieldCheck size={18} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {mode === 'signup' && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>

          {mode === 'signup' && (
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none shadow-inner"
              >
                <option value="student">Student</option>
                <option value="graduate">Recent Graduate</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : (
              <>
                {mode === 'signup' ? 'Create Account' : 'Sign In'} <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-500">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError('');
              }}
              className="text-indigo-600 font-bold hover:underline"
            >
              {mode === 'signup' ? 'Log in' : 'Create one'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import { create } from 'zustand';
import { API_BASE } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role?: string;
  skills?: string;
  career_interests?: string[];
  target_roles?: string[];
  preferred_language?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  loading: true,
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, loading: false });
  },
  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        set({ user, loading: false });
      } else {
        get().logout();
      }
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },
  checkSession: async () => {
    return get().checkAuth();
  }
}));

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Use API_BASE for relative URLs
  const finalUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(finalUrl, {
    ...options,
    headers
  });
};

export const setToken = (token: string) => useAuthStore.getState().setToken(token);
export const logout = () => useAuthStore.getState().logout();

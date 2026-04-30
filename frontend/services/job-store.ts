import { create } from 'zustand';

export interface JobMatch {
  title: string;
  company: string;
  location?: string;
  url: string;
  logo?: string;
  similarity: number;
}

interface JobState {
  jobs: JobMatch[];
  loading: boolean;
  hasFetched: boolean;
  setJobs: (jobs: JobMatch[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  loading: false,
  hasFetched: false,
  setJobs: (jobs) => set({ jobs, hasFetched: true, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

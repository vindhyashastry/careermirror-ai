import { create } from 'zustand';

interface ReadinessState {
  score: number;
  skills: string[];
  gaps: string[];
  hiddenGaps: string[];
  authenticityScore: number;
  loading: boolean;
  setReadiness: (data: Partial<ReadinessState>) => void;
}

export const useReadinessStore = create<ReadinessState>((set) => ({
  score: 0,
  skills: [],
  gaps: [],
  hiddenGaps: [],
  authenticityScore: 0,
  loading: false,
  setReadiness: (data) => set((state) => ({ ...state, ...data })),
}));

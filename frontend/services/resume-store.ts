import { create } from 'zustand';

interface ResumeState {
  resumeId: number | null;
  filename: string | null;
  isUploaded: boolean;
  setResume: (id: number, filename: string) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumeId: null,
  filename: null,
  isUploaded: false,
  setResume: (id, filename) => set({ resumeId: id, filename, isUploaded: true }),
  reset: () => set({ resumeId: null, filename: null, isUploaded: false }),
}));

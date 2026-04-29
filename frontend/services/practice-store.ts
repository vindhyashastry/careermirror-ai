import { create } from 'zustand';

interface Question {
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface PracticeState {
  questions: Question[];
  currentStep: number;
  loading: boolean;
  setQuestions: (questions: Question[]) => void;
  nextStep: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  questions: [],
  currentStep: 0,
  loading: false,
  setQuestions: (questions) => set({ questions, currentStep: 0 }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
}));

"use client";

import React, { useState, useEffect } from 'react';
import { usePracticeStore } from '@/services/practice-store';
import { useReadinessStore } from '@/services/readiness-store';
import { authFetch } from '@/services/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, CheckCircle2, XCircle, Sparkles, Loader2 } from 'lucide-react';

export const PracticeSession = () => {
  const { gaps } = useReadinessStore();
  const { questions, setQuestions, loading } = usePracticeStore();
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const startSession = async () => {
    setStarted(true);
    // Fetch from backend
    try {
      console.log('Fetching practice questions from backend...');
      const response = await authFetch(`http://127.0.0.1:8000/practice-questions?role=Backend&weak_skills=${gaps.join(',')}`);
      
      const data = await response.json();
      console.log('Backend response from /practice-questions:', data);
      
      if (!response.ok) {
        console.error('Backend returned an error status:', response.status, data);
        throw new Error(data.detail || 'Failed to fetch questions');
      }
      
      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        console.error('Expected array of questions, got:', data);
        setQuestions([]);
      }
    } catch (e) {
      console.error('Failed to fetch practice questions:', e);
      alert(`Failed to fetch questions: ${e}`);
    }
  };

  const currentQuestion = questions && questions.length > 0 ? questions[currentIdx] : null;

  if (started && !loading && questions.length > 0 && !currentQuestion && currentIdx < questions.length) {
    // This shouldn't happen but good for safety
    return <div>Loading question...</div>;
  }

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setCurrentIdx(prev => prev + 1);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-[2.5rem] shadow-lg">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <Sparkles className="text-primary w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black mb-4 text-foreground tracking-tight">Adaptive Practice</h2>
        <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed font-medium">
          We&apos;ve generated custom questions based on your gaps in <b>{gaps.slice(0, 3).join(', ')}</b>. 
          Ready to verify your depth?
        </p>
        <button 
          onClick={startSession}
          className="px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95"
        >
          Generate Questions <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-lg">LLM is generating custom challenges tailored to your profile...</p>
      </div>
    );
  }

  if (currentIdx >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-[3rem] shadow-xl animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 shadow-inner">
          <CheckCircle2 className="text-emerald-500 w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black mb-4 text-foreground">Session Complete!</h2>
        <p className="text-muted-foreground text-center max-w-sm mb-10 font-medium">Your readiness score has been updated based on your performance. Great work!</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="px-5 py-2 bg-muted rounded-full text-xs font-black text-muted-foreground uppercase tracking-widest border border-border shadow-sm">
          Challenge {currentIdx + 1} / {questions.length}
        </span>
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 w-12 rounded-full transition-all duration-500 ${i <= currentIdx ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-muted border border-border'}`} />
          ))}
        </div>
      </div>

      <motion.div 
        key={currentIdx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-card border border-border rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Brain className="text-primary" size={20} />
          </div>
          <span className="text-primary font-black uppercase text-sm tracking-widest">{currentQuestion.type}</span>
        </div>
        
        <h3 className="text-3xl font-black text-foreground mb-12 leading-tight relative z-10">
          {currentQuestion.question}
        </h3>

        <div className="grid grid-cols-1 gap-5 relative z-10">
          {currentQuestion.options ? (
            currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={showFeedback}
                className={`w-full p-6 rounded-[1.5rem] text-left border-2 transition-all flex justify-between items-center group font-bold ${
                  showFeedback 
                    ? opt === currentQuestion.correct_answer 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-md' 
                      : opt === selectedAnswer ? 'border-destructive bg-destructive/10 text-destructive shadow-md' : 'border-border opacity-50'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5 text-foreground hover:translate-x-2'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    showFeedback && opt === currentQuestion.correct_answer ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span>{opt}</span>
                </div>
                {showFeedback && opt === currentQuestion.correct_answer && <CheckCircle2 className="text-emerald-500" size={24} />}
                {showFeedback && opt === selectedAnswer && opt !== currentQuestion.correct_answer && <XCircle className="text-destructive" size={24} />}
              </button>
            ))
          ) : (
            <div className="space-y-6">
               <textarea 
                className="w-full bg-background border border-border rounded-[2rem] p-8 min-h-[250px] focus:outline-none focus:border-primary/50 text-foreground font-medium shadow-inner"
                placeholder="Type your explanation or architectural strategy here..."
               />
               <button 
                onClick={() => setShowFeedback(true)}
                disabled={showFeedback}
                className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
               >
                 Submit Analysis
               </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 p-8 bg-primary/5 rounded-[2rem] border border-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-primary" />
              </div>
              <h4 className="font-black text-primary uppercase text-sm tracking-widest mb-3">AI Explanation</h4>
              <p className="text-foreground leading-relaxed font-medium">
                {currentQuestion.explanation}
              </p>
              <button 
                onClick={nextQuestion}
                className="mt-8 flex items-center gap-3 text-primary font-black hover:gap-5 transition-all group"
              >
                Next Challenge <ArrowRight size={20} className="group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

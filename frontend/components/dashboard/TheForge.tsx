"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Code2,
  ChevronRight,
  Lock,
  Zap,
  Terminal,
  Trophy,
  Info
} from 'lucide-react';
import { useAuthStore, authFetch } from '@/services/auth-store';
import { API_BASE } from '@/lib/api';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import ReactConfetti from 'react-confetti';

// Types
interface MCQ {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Scenario {
  title: string;
  statement: string;
  task: string;
  initial_code: string;
  solution: string;
  explanation: string;
}

type Step = 'selection' | 'mcq' | 'scenario' | 'result';

export const TheForge = () => {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('selection');
  const [subject, setSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Tempering the Forge...');
  const [showDelayedLoader, setShowDelayedLoader] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      timeout = setTimeout(() => setShowDelayedLoader(true), 4000);
    } else {
      setShowDelayedLoader(false);
    }
    return () => clearTimeout(timeout);
  }, [loading]);

  // MCQ state
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>('easy');
  const [timeLeft, setTimeLeft] = useState(16 * 60); // 16 minutes

  // Scenario state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [scenarioGrade, setScenarioGrade] = useState<{ score: number, feedback: string } | null>(null);
  const [scenarioTimeLeft, setScenarioTimeLeft] = useState(5 * 60);
  const [showSqlInfo, setShowSqlInfo] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Test/Check state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ score: number, feedback: string, is_correct: boolean } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step === 'scenario' && !scenarioGrade) {
      scenarioTimerRef.current = setInterval(() => {
        setScenarioTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(scenarioTimerRef.current!);
            submitScenario();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (scenarioTimerRef.current) clearInterval(scenarioTimerRef.current);
    };
  }, [step, scenarioGrade, currentScenarioIdx]);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Suggested subjects based on role
  const getSuggestedSubjects = () => {
    if (!user) return [];
    const role = user.role?.toLowerCase() || '';
    const targetRoles = (user.target_roles ?? []).map(r => r.toLowerCase());

    if (role === 'backend' || targetRoles.some(r => r.includes('backend'))) {
      return ['Java', 'Python', 'SQL', 'FastAPI', 'REST API', 'Node.js', 'PostgreSQL'];
    }
    if (role === 'frontend' || targetRoles.some(r => r.includes('frontend'))) {
      return ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'CSS Grid', 'JavaScript'];
    }
    return ['Python', 'JavaScript', 'SQL', 'Git', 'Data Structures'];
  };

  const subjects = getSuggestedSubjects();

  // MCQ Timer
  useEffect(() => {
    if (step === 'mcq' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleCompleteMCQ();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Logic to start session
  const startSession = async (chosenSubject: string) => {
    const sub = chosenSubject || customSubject;
    if (!sub) return;
    setSubject(sub);
    setLoading(true);
    setLoadingMessage('Tempering the MCQ set...');

    try {
      // Fetch initial Easy questions (Reduced count for speed on CPU)
      const res = await authFetch(`${API_BASE}/arena/questions?subject=${sub}&difficulty=easy&count=5`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        // One retry silently
        const retry = await authFetch(`${API_BASE}/arena/questions?subject=${sub}&difficulty=easy&count=5`);
        const retryData = await retry.json();
        setQuestions(Array.isArray(retryData) ? retryData : []);
      } else {
        setQuestions(data);
      }
      setStep('mcq');
    } catch (e) {
      toast.error("Failed to heat the forge. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);

    const isCorrect = answer === questions[currentIdx].correct_answer;
    if (isCorrect) {
      const points = difficulty === 'easy' ? 1 : 2;
      setMcqScore(prev => prev + points);

      // Level up logic
      // Removed medium level toast for Groq speed
    }
  };

  const nextQuestion = () => {
    if (loading) return; // Hard guard

    const nextIdx = currentIdx + 1;
    console.log(`[TheForge] Moving to index ${nextIdx}, Current Questions: ${questions.length}`);
    if (nextIdx === 5 && questions.length === 5) {
      fetchMoreQuestions('medium');
    } else if (nextIdx === 10 && questions.length === 10) {
      fetchMoreQuestions('medium');
    }

    if (nextIdx >= 15) {
      handleCompleteMCQ();
    } else if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // If we ran out but haven't hit 15, trigger fetch and show loading
      const loadNext = async () => {
        setLoading(true);
        setLoadingMessage('Tempering the next batch of questions...');
        try {
          await fetchMoreQuestions(nextIdx >= 10 ? 'medium' : 'easy');
          // Auto-advance if fetch succeeded
          setCurrentIdx(nextIdx);
          setSelectedAnswer(null);
          setShowFeedback(false);
        } catch (e) {
          toast.error("Forge connectivity error. Try clicking again.");
        } finally {
          setLoading(false);
        }
      };
      loadNext();
    }
  };

  const fetchMoreQuestions = async (diff: 'easy' | 'medium') => {
    try {
      // Collect all current question topics/texts to avoid repeats
      const excludeStr = encodeURIComponent(questions.map(q => q.question).join('|'));
      const res = await authFetch(`${API_BASE}/arena/questions?subject=${subject}&difficulty=${diff}&count=5&exclude=${excludeStr}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(prev => [...prev, ...data]);
        if (diff === 'medium') setDifficulty('medium');
      } else {
        // Retry
        const retry = await authFetch(`${API_BASE}/arena/questions?subject=${subject}&difficulty=${diff}&count=5`);
        const retryData = await retry.json();
        if (Array.isArray(retryData)) setQuestions(prev => [...prev, ...retryData]);
      }
    } catch (e) {
      console.error("Fetch failed", e);
    }
  };

  const handleCompleteMCQ = async () => {
    if (loading || step === 'scenario') return; // Guard against multiple triggers

    setLoading(true);
    setLoadingMessage('MCQs Complete! Preparing your 3-Scenario Gauntlet...');
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await authFetch(`${API_BASE}/arena/scenarios?subject=${subject}&count=3`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setScenarios(data);
        setCurrentScenarioIdx(0);
        setUserCode(data[0].initial_code);
        setScenarioTimeLeft(5 * 60);
        setStep('scenario');
      } else {
        toast.error("Forge is out of fuel. Retrying...");
      }
    } catch (e) {
      toast.error("Failed to generate scenarios.");
    } finally {
      setLoading(false);
    }
  };

  const [totalScenarioScore, setTotalScenarioScore] = useState(0);

  const runTest = async () => {
    const currentScenario = scenarios[currentScenarioIdx];
    if (!currentScenario || testing) return;
    setTesting(true);
    try {
      const res = await authFetch(`http://127.0.0.1:8000/arena/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          task: currentScenario.task,
          user_code: userCode,
          solution: currentScenario.solution
        })
      });
      const result = await res.json();
      setTestResult(result);
      if (result.is_correct) {
        toast.success("Test passed! You're ready to verify.");
      } else {
        toast.error("Test failed. Check the feedback and try again.");
      }
    } catch (e) {
      toast.error("Test execution failed.");
    } finally {
      setTesting(false);
    }
  };

  const submitScenario = async () => {
    const currentScenario = scenarios[currentScenarioIdx];
    if (!currentScenario) return;
    setLoading(true);
    setLoadingMessage('AI is evaluating your solution...');
    try {
      const res = await authFetch(`http://127.0.0.1:8000/arena/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          task: currentScenario.task,
          user_code: userCode,
          solution: currentScenario.solution
        })
      });
      const result = await res.json();
      setScenarioGrade(result);
      setTotalScenarioScore(prev => prev + (result.score || 0));
      toast.success("Evaluation complete!");
    } catch (e) {
      toast.error("Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextScenario = () => {
    const nextIdx = currentScenarioIdx + 1;
    if (nextIdx < scenarios.length) {
      setCurrentScenarioIdx(nextIdx);
      setUserCode(scenarios[nextIdx].initial_code);
      setScenarioGrade(null);
      setTestResult(null); // Reset test results
      setScenarioTimeLeft(5 * 60);
      setShowSqlInfo(false);
    }
  };

  const handleCompleteScenario = async () => {
    setLoading(true);
    setLoadingMessage('Finalizing your performance report...');
    try {
      const finalTotal = mcqScore + totalScenarioScore;
      await saveScore(finalTotal);
      setStep('result');
    } catch (e) {
      console.error(e);
      setStep('result'); // Fallback to show result even if save fails
    } finally {
      setLoading(false);
    }
  };

  const saveScore = async (score: number) => {
    try {
      await authFetch(`${API_BASE}/practice/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      toast.success("Readiness score updated!");
    } catch (e) {
      console.error("Failed to save score:", e);
    }
  };

  // Render Helpers
  const renderSelection = () => (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-border pb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-foreground tracking-tighter">The Forge</h2>
          <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest opacity-70">
            Select a subject capsule to begin your technical tempering.
          </p>
        </div>

        {/* Custom Preference in the right corner */}
        <div className="flex gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Custom Subject..."
            className="bg-transparent border-none rounded-xl px-4 py-2 text-xs font-bold focus:outline-none w-48"
          />
          <button
            onClick={() => startSession(customSubject)}
            disabled={!customSubject || loading}
            className="bg-primary text-primary-foreground p-2 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => startSession(s)}
            disabled={loading}
            className="px-6 py-3 bg-card border border-border rounded-full hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-black shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2 group uppercase tracking-widest"
          >
            {s}
          </button>
        ))}
      </div>

      {showDelayedLoader && (
        <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in duration-500">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">{loadingMessage}</p>
        </div>
      )}
    </div>
  );

  const renderMCQ = () => {
    const q = questions[currentIdx];
    if (!q) {
      return (
        <div className="max-w-xl mx-auto text-center py-20 space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-destructive" size={40} />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tighter">Forge Misfire</h2>
          <p className="text-muted-foreground font-medium text-sm">
            We couldn't generate technical questions for <span className="text-primary font-bold">{subject}</span> at this moment.
          </p>
          <button
            onClick={() => setStep('selection')}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            Try Another Subject
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{subject}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase">Phase 01: MCQ</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-black text-sm">
            <span className={timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-foreground'}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Square MCQ Card */}
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[2rem] p-8 shadow-xl aspect-square flex flex-col justify-between"
          >
            <div>
              <div className="mb-6 flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Question {currentIdx + 1}/15</span>
                <div className="flex gap-1">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className={`h-1 w-2 rounded-full ${i <= currentIdx ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-6 leading-tight">
                {q.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-xl text-left border transition-all text-xs font-bold ${showFeedback
                    ? opt === q.correct_answer
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700'
                      : opt === selectedAnswer ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border opacity-50'
                    : 'border-border hover:border-primary/50 hover:bg-secondary text-foreground'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Integrated Next Button for MCQ */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <button
                    onClick={nextQuestion}
                    disabled={loading}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Tempering...
                      </>
                    ) : (
                      <>
                        Next Phase <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Explanation Card (Simplified) */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 shadow-lg h-full"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xs uppercase tracking-widest text-foreground">Technical Analysis</span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderScenario = () => {
    const currentScenario = scenarios[currentScenarioIdx];
    if (!currentScenario) return null;

    return (
      <div className="max-w-6xl mx-auto space-y-6 flex flex-col h-[calc(100vh-220px)]">
        {/* Header: Question + Timer */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground tracking-tighter">Challenge {currentScenarioIdx + 1}: {currentScenario.title}</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${scenarioTimeLeft < 60 ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : 'bg-primary/10 text-primary border-primary/20'}`}>
              {formatTime(scenarioTimeLeft)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{subject} Terminal</span>
          </div>
        </div>

        {/* Unified Terminal Card */}
        <div className="flex-1 bg-card border border-border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 h-full divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Scenario Side */}
            <div className="lg:col-span-2 p-8 overflow-y-auto custom-scrollbar space-y-6 bg-muted/20">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Mission Statement</h3>
                <p className="text-sm text-foreground font-medium leading-relaxed">{currentScenario.statement}</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Specific Task</h3>
                <div className="p-5 bg-background border border-border rounded-2xl text-xs font-bold leading-relaxed text-foreground shadow-sm italic">
                  {currentScenario.task}
                </div>
              </div>

              {testResult && !scenarioGrade && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-2xl border-2 ${testResult.is_correct ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-[10px] uppercase flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${testResult.is_correct ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
                      Test Run Result
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">&quot;{testResult.feedback}&quot;</p>
                </motion.div>
              )}

              {scenarioGrade && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl border-2 ${scenarioGrade.score >= 2 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-[10px] uppercase">Final AI Evaluation</span>
                    <span className={`text-xl font-black ${scenarioGrade.score >= 2 ? 'text-emerald-500' : 'text-amber-500'}`}>{scenarioGrade.score}/3</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">&quot;{scenarioGrade.feedback}&quot;</p>
                </motion.div>
              )}
            </div>

            {/* Editor Side */}
            <div className="lg:col-span-3 flex flex-col bg-background">
              <div className="flex-1 min-h-[300px]">
                <Editor
                  height="100%"
                  language={subject.toLowerCase() === 'sql' ? 'sql' : 'javascript'}
                  theme="vs-dark"
                  value={userCode}
                  onChange={(v) => setUserCode(v || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: { top: 20 },
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: !!scenarioGrade
                  }}
                />
              </div>
              <div className="p-6 border-t border-border bg-card flex justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Runtime Environment v2.4</p>
                </div>

                {!scenarioGrade ? (
                  <div className="flex gap-3">
                    <button
                      onClick={runTest}
                      disabled={loading || testing}
                      className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest border border-border hover:bg-secondary/80 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {testing ? <Loader2 className="animate-spin" size={14} /> : <Terminal size={14} />}
                      Run Check
                    </button>
                    <button
                      onClick={submitScenario}
                      disabled={loading || testing}
                      className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                      Verify Implementation
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={currentScenarioIdx === scenarios.length - 1 ? handleCompleteScenario : handleNextScenario}
                    disabled={loading}
                    className="px-8 py-3 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                    {currentScenarioIdx === scenarios.length - 1 ? 'Conclude Session' : 'Next Challenge'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const totalScore = mcqScore + (scenarioGrade?.score || 0);
    const maxScore = 15 + 3; // 15 for MCQ (avg easy+med), 3 for scenario
    const percentage = Math.min(100, Math.round((totalScore / 25) * 100)); // Normalized

    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-12 animate-in zoom-in duration-700">
        <ReactConfetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />

        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/20">
            <Trophy className="text-primary w-12 h-12" />
          </div>
          <h2 className="text-5xl font-black text-foreground">Session Complete!</h2>
          <p className="text-muted-foreground text-lg font-medium">You have emerged from The Forge with a mastery level of {percentage}%</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-8 bg-card border border-border rounded-[2.5rem] shadow-sm">
            <span className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">MCQ Score</span>
            <span className="text-4xl font-black text-primary">{mcqScore}</span>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 italic">Points contributed to Readiness</p>
          </div>
          <div className="p-8 bg-card border border-border rounded-[2.5rem] shadow-sm">
            <span className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Scenario Grade</span>
            <span className="text-4xl font-black text-emerald-500">{scenarioGrade?.score || 0}/3</span>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 italic">Based on AI evaluation</p>
          </div>
        </div>

        <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] text-left space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={20} />
            <h3 className="font-black uppercase text-sm tracking-widest">AI Feedback</h3>
          </div>
          <p className="text-foreground font-medium leading-relaxed italic">
            &quot;{scenarioGrade?.feedback || "Great effort! Your technical depth is showing significant improvement in core concepts."}&quot;
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
        >
          Return to Hub
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-[600px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "anticipate" }}
        >
          {step === 'selection' && renderSelection()}
          {step === 'mcq' && renderMCQ()}
          {step === 'scenario' && renderScenario()}
          {step === 'result' && renderResult()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

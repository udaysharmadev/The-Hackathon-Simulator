'use client';

/**
 * @file ResultScreen — Final results display
 * @description Animated score counter, category breakdowns with progress bars,
 * mock judge feedback cards, confetti-like decorative dots, and Play Again /
 * Share Results CTAs.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { RotateCcw, Share2, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { generatePRD } from '@/lib/prdGenerator';
import { JUDGES } from '@/data/judges';
import { generateJudgeFeedback } from '@/data/judgeComments';
import { classifyProjectArchetype } from '@/lib/archetypes';

// ─── Score categories ───────────────────────────────────────────────────────────

const CATEGORIES: { key: 'innovation' | 'execution' | 'design' | 'pitch'; label: string; color: string }[] = [
  { key: 'innovation', label: 'Innovation', color: 'bg-neon-purple' },
  { key: 'execution', label: 'Execution', color: 'bg-neon-blue' },
  { key: 'design', label: 'Design', color: 'bg-neon-pink' },
  { key: 'pitch', label: 'Pitch', color: 'bg-neon-orange' },
];

// ─── Confetti dot generator ─────────────────────────────────────────────────────

function ConfettiDots() {
  // Generate a fixed set of floating dots on mount using useState
  const [dots] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 4,
      size: 3 + Math.random() * 5,
      color: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'][
        i % 6
      ],
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
            opacity: 0.4,
          }}
          initial={{ y: '110vh' }}
          animate={{ y: '-10vh' }}
          transition={{
            delay: dot.delay,
            duration: dot.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated counter hook ──────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const {
    judgeFeedback,
    selectedProblem,
    solutionDirection,
    usp,
    techStack,
    features,
    businessModel,
    mentorHintsUsed,
    currentJudge,
    unlockedAchievements,
    chaosHistory,
    gameMode,
    difficulty,
    activeModifiers,
    score,
    resetGame,
  } = useGameStore();

  const [isPrdModalOpen, setIsPrdModalOpen] = useState(false);
  const [prdLoadingStep, setPrdLoadingStep] = useState(0);
  const [compiledPrd, setCompiledPrd] = useState("");
  const [prdCopied, setPrdCopied] = useState(false);

  const prdLogs = [
    "PREPARING STARTUP BRIEF V1.0...",
    "EXTRACTING HACKATHON BUILD DECISIONS...",
    "ANALYZING PROJECT ARCHETYPE METRICS...",
    "RESOLVING TECHNOLOGY INTEGRATION LAYERS...",
    "INTEGRATING UNIQUE ADVANTAGE (USP)...",
    "ESTIMATING REVENUE TIER ECONOMICS...",
    "ASSESSING RISK & OPERATIONAL ROADMAP...",
    "GENERATING PRODUCT REQUIREMENTS BRIEF...",
    "STARTUP BRIEF SUCCESSFULLY CREATED."
  ];

  useEffect(() => {
    if (!isPrdModalOpen) return;

    setPrdLoadingStep(0);
    setCompiledPrd("");

    let apiResponseMarkdown = "";
    let ticksCompleted = false;

    // Trigger the server-side fetch immediately in the background
    fetch("/api/generate-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        judgeFeedback,
        selectedProblem,
        solutionDirection,
        usp,
        techStack,
        features,
        businessModel,
        mentorHintsUsed,
        currentJudge,
        unlockedAchievements,
        chaosHistory,
        gameMode,
        difficulty,
        activeModifiers,
        score,
        grade,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        apiResponseMarkdown = data.markdown || "";
        if (ticksCompleted) {
          setCompiledPrd(apiResponseMarkdown);
          setPrdLoadingStep(prdLogs.length - 1);
        }
      })
      .catch((err) => {
        console.error(err);
        const localPrd = generatePRD({
          judgeFeedback,
          selectedProblem,
          solutionDirection,
          usp,
          techStack,
          features,
          businessModel,
          mentorHintsUsed,
          currentJudge,
          unlockedAchievements,
          chaosHistory,
          gameMode,
          difficulty,
          activeModifiers,
          score,
        } as any);
        apiResponseMarkdown = `> [!WARNING]\n> **AI_COMPILATION_ERROR // LOCAL FALLBACK ACTIVE:**\n> ${err.message || "Network offline"}\n\n${localPrd}`;
        if (ticksCompleted) {
          setCompiledPrd(apiResponseMarkdown);
          setPrdLoadingStep(prdLogs.length - 1);
        }
      });

    // Run the terminal animation tick sequence
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= prdLogs.length - 2) {
        clearInterval(interval);
        ticksCompleted = true;
        setPrdLoadingStep(prdLogs.length - 2);
        // Complete when the API is done
        if (apiResponseMarkdown !== "") {
          setCompiledPrd(apiResponseMarkdown);
          setPrdLoadingStep(prdLogs.length - 1);
        }
      } else {
        setPrdLoadingStep(currentStep);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [isPrdModalOpen]);

  const handleCopyPrd = () => {
    navigator.clipboard.writeText(compiledPrd).then(() => {
      setPrdCopied(true);
      setTimeout(() => setPrdCopied(false), 1500);
    });
  };

  const handleDownloadPrd = () => {
    const startupName = selectedProblem?.title.split(" ")[0] || "Nova";
    const blob = new Blob([compiledPrd], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${startupName}_PRD.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const feedback = judgeFeedback.find(fb => fb.judgeId === currentJudge?.id) || judgeFeedback[judgeFeedback.length - 1];
  const finalScore100 = feedback?.score || 0;

  const getGrade = (score: number) => {
    if (score >= 94) return "S";
    if (score >= 84) return "A";
    if (score >= 72) return "B";
    if (score >= 60) return "C";
    if (score >= 48) return "D";
    return "F";
  };
  const grade = getGrade(finalScore100);

  const archetype = classifyProjectArchetype({
    techStack,
    features,
    usp,
    businessModel,
    solutionDirection,
  });

  const [aiRoast, setAiRoast] = useState<string>("");
  const [loadingRoast, setLoadingRoast] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedProblem || !currentJudge) return;

    setLoadingRoast(true);
    setAiRoast("");

    fetch("/api/generate-roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemStatement: selectedProblem.description,
        solutionDirection: solutionDirection,
        techStack: techStack.map(t => t.name),
        usp: usp,
        businessModel: businessModel,
        mustHaveFeatures: features.map(f => f.name),
        judge: currentJudge.name,
        judgePersonality: currentJudge.personality,
        archetype: archetype.name,
        grade: grade,
        score: finalScore100,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.roast) {
          setAiRoast(data.roast);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch AI roast:", err);
      })
      .finally(() => {
        setLoadingRoast(false);
      });
  }, [selectedProblem, currentJudge, solutionDirection, techStack, usp, businessModel, features, archetype.name, grade, finalScore100]);

  // ─── Typed feedback entry ─────────────────────────────────────────────────────
  interface FeedbackEntry {
    judgeId: string;
    name: string;
    avatar: string;
    avatarImage?: string;
    score: number;
    comment: string;
    highlight: string;
    isLead: boolean;
  }

  // Resolve the 3-judge panel for display
  const displayFeedbacks = (() => {
    if (!judgeFeedback || judgeFeedback.length === 0) return [];
    
    // Find the lead feedback
    const leadFb = judgeFeedback.find(fb => fb.judgeId === currentJudge?.id) || judgeFeedback[judgeFeedback.length - 1];
    if (!leadFb) return [];

    const leadJudgeProfile = JUDGES.find(j => j.id === leadFb.judgeId) || currentJudge || JUDGES[0];

    const results: FeedbackEntry[] = [{
      judgeId: leadFb.judgeId,
      name: leadJudgeProfile.name,
      avatar: leadJudgeProfile.avatar,
      avatarImage: leadJudgeProfile.avatarImage,
      score: leadFb.score,
      comment: loadingRoast ? "⏱️ DRAWING DYNAMIC JURY FEEDBACK CRITIQUE..." : (aiRoast || leadFb.comment),
      highlight: leadFb.highlight,
      isLead: true,
    }];
    
    // Get other feedbacks from the store
    const othersInStore = judgeFeedback.filter(fb => fb.judgeId !== leadFb.judgeId);
    
    if (othersInStore.length >= 2) {
      othersInStore.slice(0, 2).forEach(fb => {
        const jProfile = JUDGES.find(j => j.id === fb.judgeId);
        if (jProfile) {
          results.push({
            judgeId: fb.judgeId,
            name: jProfile.name,
            avatar: jProfile.avatar,
            avatarImage: jProfile.avatarImage,
            score: fb.score,
            comment: fb.comment,
            highlight: fb.highlight,
            isLead: false,
          });
        }
      });
    } else {
      // Fallback: Dynamically generate feedbacks for two other judges if missing
      const usedIds = new Set(results.map(r => r.judgeId));
      const remainingJudges = JUDGES.filter(j => !usedIds.has(j.id));
      
      remainingJudges.slice(0, 2).forEach(j => {
        const finalInnovation = score.innovation || 20;
        const finalExecution = score.execution || 20;
        const finalDesign = score.design || 20;
        const finalPitch = score.pitch || 20;
        
        let weightedScore =
          finalInnovation * j.scoringWeights.innovation +
          finalExecution * j.scoringWeights.execution +
          finalDesign * j.scoringWeights.design +
          finalPitch * j.scoringWeights.pitch;
          
        if (j.id === "judge-chaos") {
          weightedScore += 5;
        }
        
        const judgeScore = Math.max(0, Math.min(Math.round(weightedScore + (score.bonus || 0)), 100));
        
        const fbResult = generateJudgeFeedback(j.id, judgeScore, {
          techStack,
          features,
          usp,
          businessModel,
          problem: selectedProblem,
          solutionDirection,
          generatedBusinessModels: useGameStore.getState().generatedBusinessModels,
          generatedAdvisorAdvice: useGameStore.getState().generatedAdvisorAdvice,
        });
        
        results.push({
          judgeId: j.id,
          name: j.name,
          avatar: j.avatar,
          avatarImage: j.avatarImage,
          score: judgeScore,
          comment: fbResult.comment,
          highlight: fbResult.highlight || "Valid architectural execution.",
          isLead: false,
        });
      });
    }
    
    return results;
  })();



  const renderFormattedText = (text: string) => {
    if (!text) return "";
    const parts = text.split("**");
    return parts.map((part, i) => {
      const isBold = i % 2 === 1;
      if (part.includes("`")) {
        const codeParts = part.split("`");
        const mapped = codeParts.map((cp, j) => {
          if (j % 2 === 1) {
            return <code key={j} className="bg-neutral-200 border border-neutral-300 px-1 py-0.5 rounded text-neutral-800 font-mono text-[9px]">{cp}</code>;
          }
          return cp;
        });
        return isBold ? <strong key={i} className="font-bold text-neutral-900">{mapped}</strong> : <span key={i}>{mapped}</span>;
      }
      return isBold ? <strong key={i} className="font-bold text-neutral-900">{part}</strong> : <span key={i}>{part}</span>;
    });
  };

  const showPrdSection = (grade === "S" || grade === "A" || grade === "B") && finalScore100 >= 72;

  const displayTotal = useCountUp(score.total);

  return (
    <div className="relative flex h-full flex-col items-center gap-10 overflow-y-auto px-4 py-12">
      {/* Confetti overlay */}
      <ConfettiDots />

      {/* Hero total score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-2"
      >
        <Sparkles className="h-8 w-8 text-neon-cyan" />
        <h1 className="text-glow-cyan text-5xl font-extrabold tracking-tight text-neon-cyan sm:text-7xl">
          {displayTotal}
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Total Score
        </p>
      </motion.div>

      {/* Score breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="glass-card z-10 w-full max-w-md space-y-4 p-6"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Score Breakdown
        </h2>

        {CATEGORIES.map(({ key, label, color }) => {
          const val = score[key];
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{label}</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {val}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className={cn('absolute inset-y-0 left-0 rounded-full', color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}

        {/* Bonus row */}
        {score.bonus > 0 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-sm text-muted-foreground">Bonus</span>
            <Badge className="bg-neon-green/15 text-neon-green ring-1 ring-neon-green/30 font-mono">
              +{score.bonus}
            </Badge>
          </div>
        )}
      </motion.div>

      {/* Judge feedback cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="z-10 w-full max-w-2xl space-y-4"
      >
        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Judge Feedback
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {displayFeedbacks.map((fb, i) => (
            <motion.div
              key={fb.judgeId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }}
              className={cn(
                "glass-card flex flex-col gap-3 p-4 relative transition-all duration-300",
                fb.isLead && "glass-card-strong border-neon-purple ring-1 ring-neon-purple/20 glow-purple"
              )}
            >
              {/* Lead Judge Badge Indicator */}
              {fb.isLead && (
                <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[8px] font-bold bg-neon-purple/20 text-neon-purple px-1 py-0.5 rounded uppercase tracking-wider select-none">
                  👑 LEAD
                </div>
              )}

              {/* Judge header */}
              <div className="flex items-center gap-2.5 pr-10">
                {/* Avatar photo or emoji fallback */}
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  {fb.avatarImage ? (
                    <Image
                      src={fb.avatarImage}
                      alt={fb.name}
                      fill
                      className="object-cover object-top"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 text-lg">
                      {fb.avatar}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{fb.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Score: {fb.score}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <div className="flex items-start gap-1.5">
                <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {fb.comment}
                </p>
              </div>

              {/* Highlight */}
              <Badge
                variant="secondary"
                className="w-fit text-[10px] mt-auto"
              >
                ✨ {fb.highlight}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Startup PRD Generator Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className={`z-10 w-full max-w-2xl bg-white space-y-4 shadow-sm select-none relative overflow-hidden text-left transition-all duration-300 ${
          showPrdSection ? "border-2 border-double border-neutral-900" : "border border-dashed border-neutral-300 opacity-80"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
          <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">STARTUP_ACCELERATION_GATES</span>
          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
            showPrdSection ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-500"
          }`}>
            {showPrdSection ? "VENTURE QUALIFIED" : "🔒 LOCKED"}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className={`text-sm font-black uppercase flex items-center gap-1.5 ${showPrdSection ? "text-neutral-900" : "text-neutral-400"}`}>
            {showPrdSection ? "🚀 This Idea Has Potential" : "🔒 Startup PRD Generator"}
          </h3>
          <p className="text-[11px] text-neutral-600 font-sans font-light leading-relaxed">
            {showPrdSection 
              ? "The judges believe this project is worth exploring further. Generate a startup-grade Product Requirements Document based on your hackathon decisions."
              : "Get a grade B or above to unlock this startup product generator."
            }
          </p>
        </div>

        <Button
          onClick={() => {
            if (!showPrdSection) return;
            setIsPrdModalOpen(true);
          }}
          disabled={!showPrdSection}
          className={`w-full font-mono text-xs h-9 border focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
            showPrdSection 
              ? "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 cursor-pointer" 
              : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
          }`}
        >
          {showPrdSection ? "DOWNLOAD STARTUP PRD" : "DOWNLOAD STARTUP PRD (LOCKED)"}
        </Button>
      </motion.div>

      {/* Startup PRD Generator Overlay Modal */}
      {isPrdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-3xl bg-white border-2 border-neutral-900 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col gap-4 overflow-hidden relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-450">STARTUP_PRD_GENERATOR</span>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  prdLoadingStep === prdLogs.length - 1 ? "bg-emerald-600 text-white" : "bg-neutral-900 text-white animate-pulse"
                }`}>
                  {prdLoadingStep === prdLogs.length - 1 ? "READY" : "GENERATING"}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsPrdModalOpen(false);
                }}
                className="text-neutral-400 hover:text-neutral-900 font-mono text-xs font-bold cursor-pointer transition-colors focus:outline-none"
              >
                [ESC_CLOSE]
              </button>
            </div>

            {/* Title */}
            <div className="text-left space-y-1">
              <h2 className="text-xl font-black uppercase text-neutral-900">
                Startup PRD Generator
              </h2>
              <p className="text-[10px] text-muted-foreground font-mono">
                Decisions ledger parsed into product requirements parameters.
              </p>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-hidden min-h-[350px] flex flex-col">
              {prdLoadingStep < prdLogs.length - 1 ? (
                /* Sequential Compilation Logs View */
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="text-center font-mono text-xs text-neutral-500 uppercase tracking-widest animate-pulse mb-2">
                    GENERATING STARTUP BRIEF...
                  </div>
                  
                  <div className="bg-neutral-950 p-4 rounded font-mono text-[10px] text-neutral-100 min-h-[180px] flex flex-col justify-between shadow-inner">
                    <div className="space-y-1 text-left">
                        {prdLogs.slice(0, prdLoadingStep + 1).map((log, i) => (
                          <div key={i} className={log.includes("SUCCESSFUL") || log.includes("CREATED") ? "text-emerald-400 font-bold" : "text-neutral-300"}>
                            {i === prdLoadingStep ? (
                              <span className="typewriter-cursor">
                                {`> [SYSTEM] ${log}`}
                              </span>
                            ) : (
                              `> [SYSTEM] ${log}`
                            )}
                          </div>
                        ))}
                    </div>
                    <div className="w-full bg-neutral-800 h-1 rounded overflow-hidden mt-3">
                      <div 
                        className="bg-neutral-100 h-full transition-all duration-300" 
                        style={{ width: `${(prdLoadingStep / (prdLogs.length - 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* PRD Compiled Document View */
                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                  <div className="flex-1 border border-neutral-300 p-5 bg-stone-50 rounded text-left overflow-y-auto font-sans text-xs text-neutral-855 space-y-3.5 leading-relaxed select-text shadow-inner max-h-[45vh]">
                    {compiledPrd.split("\n").map((line, idx) => {
                      if (line.startsWith("# ")) {
                        return <h1 key={idx} className="text-base font-black text-neutral-900 border-b-2 border-neutral-950 pb-1 mt-5 first:mt-0 font-mono tracking-tight uppercase">{line.replace("# ", "")}</h1>;
                      }
                      if (line.startsWith("## ")) {
                        return <h2 key={idx} className="text-xs font-bold text-neutral-900 border-b border-dashed border-neutral-300 pb-0.5 mt-4 uppercase tracking-wider font-mono">{line.replace("## ", "")}</h2>;
                      }
                      if (line.startsWith("### ")) {
                        return <h3 key={idx} className="text-xs font-bold text-neutral-850 mt-3.5 uppercase font-mono">{line.replace("### ", "")}</h3>;
                      }
                      if (line.startsWith("* **") || line.startsWith("- **")) {
                        const prefix = line.startsWith("* **") ? "* **" : "- **";
                        const clean = line.replace(prefix, "").split("**: ");
                        return (
                          <div key={idx} className="flex gap-2 pl-3">
                            <span className="text-neutral-400 font-mono text-[9px] mt-0.5">•</span>
                            <span>
                              <strong className="text-neutral-900 font-mono text-[10px] uppercase font-bold">{clean[0]}</strong>
                              {clean[1] ? ": " : ""}
                              {clean[1] ? renderFormattedText(clean[1]) : ""}
                            </span>
                          </div>
                        );
                      }
                      if (line.startsWith("* ") || line.startsWith("- ")) {
                        const prefix = line.startsWith("* ") ? "* " : "- ";
                        return (
                          <div key={idx} className="flex gap-2 pl-3">
                            <span className="text-neutral-400 font-mono text-[9px] mt-0.5">•</span>
                            <span>{renderFormattedText(line.replace(prefix, ""))}</span>
                          </div>
                        );
                      }
                      if (line.startsWith("> [!")) {
                        const isNote = line.includes("NOTE");
                        return (
                          <div key={idx} className={`p-3 border-l-2 rounded-r font-mono text-[9px] my-2 ${
                            isNote ? "bg-neutral-50 border-neutral-900 text-neutral-800" : "bg-amber-50 border-amber-500 text-amber-900"
                          }`}>
                            <span className="font-bold uppercase block mb-1">
                              {isNote ? "💡 ORGANIZER NOTE:" : "⚠️ WARNING:"}
                            </span>
                            {renderFormattedText(compiledPrd.split("\n")[idx + 1]?.replace("> ", "") || "")}
                          </div>
                        );
                      }
                      if (line.startsWith("> ")) {
                        if (compiledPrd.split("\n")[idx - 1]?.startsWith("> [!")) return null;
                        return <blockquote key={idx} className="p-2 border-l-2 border-neutral-900 pl-3 italic text-neutral-600 bg-neutral-50/50 font-serif my-2">{renderFormattedText(line.replace("> ", ""))}</blockquote>;
                      }
                      if (line.trim() === "") return null;
                      return <p key={idx} className="font-sans text-[11px] leading-relaxed text-neutral-700">{renderFormattedText(line)}</p>;
                    })}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-3 gap-2 border-t border-neutral-200 pt-3">
                    <Button
                      onClick={handleCopyPrd}
                      variant="outline"
                      className="font-mono text-[10px] h-9 border border-neutral-900 cursor-pointer focus:outline-none"
                    >
                      {prdCopied ? "[COPIED TO CLIPBOARD]" : "COPY MARKDOWN"}
                    </Button>
                    <Button
                      onClick={handleDownloadPrd}
                      variant="outline"
                      className="font-mono text-[10px] h-9 border border-neutral-900 cursor-pointer focus:outline-none"
                    >
                      DOWNLOAD PRD
                    </Button>
                    <Button
                      onClick={() => {
                        setIsPrdModalOpen(false);
                      }}
                      className="font-mono text-[10px] h-9 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-900 cursor-pointer focus:outline-none"
                    >
                      CLOSE GENERATOR
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="z-10 flex flex-wrap items-center justify-center gap-3"
      >
        <Link href="/" onClick={resetGame}>
          <Button
            className="gap-2 bg-neon-blue/90 px-5 text-sm font-semibold text-white hover:bg-neon-blue"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </Link>

        {/* TODO: Implement share functionality (clipboard / social) */}
        <Button
          variant="outline"
          className="gap-2 px-5 text-sm"
          onClick={() => {
            /** Placeholder — share results */
          }}
        >
          <Share2 className="h-4 w-4" />
          Share Results
        </Button>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, STAGE_ORDER } from "@/store/gameStore";
import GameLayout from "@/components/game/GameLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Terminal,
  Clock,
  Trophy,
  HelpCircle,
  Briefcase,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Hammer,
  FileText,
  UserCheck,
  Percent,
  CheckCircle,
} from "lucide-react";
import type { GameStage, Problem, TechItem, Feature, Judge } from "@/types/game";

// ─── Standard Reusable Placeholder Stage Wrapper ───────────────────────────

function PlaceholderStageCard({
  stageKey,
  title,
  subtitle,
  children,
}: {
  stageKey: GameStage;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const { nextStage, previousStage, difficulty } = useGameStore();
  const currentIndex = STAGE_ORDER.indexOf(stageKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto px-4 py-8"
    >
      <div className="w-full bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.015)] p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Stage metadata tags */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/85">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
            STAGE_{String(currentIndex + 1).padStart(2, "0")}//{stageKey.toUpperCase()}
          </span>
          {difficulty && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 uppercase">
              DIFF: {difficulty}
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-neutral-900 mb-2">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-md mx-auto font-light leading-relaxed">
          {subtitle}
        </p>

        {children && <div className="mb-8 w-full">{children}</div>}

        {/* Tactile navigation controls */}
        <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={previousStage}
            disabled={currentIndex === 0 || stageKey === 'results'}
            className="font-mono text-xs h-8"
          >
            &lt; BACK
          </Button>

          <div className="hidden sm:flex gap-1.5">
            {STAGE_ORDER.map((s, idx) => (
              <div
                key={s}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex
                    ? "bg-neutral-800"
                    : idx < currentIndex
                    ? "bg-neutral-400"
                    : "bg-neutral-200"
                }`}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={nextStage}
            disabled={currentIndex === STAGE_ORDER.length - 1 || !difficulty}
            className="font-mono text-xs h-8 border border-neutral-900"
          >
            CONTINUE &gt;
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 12 Stage-Specific Placeholder Views ───────────────────────────────────

function DifficultyStage() {
  const { setDifficulty, difficulty } = useGameStore();

  const options = [
    { key: "easy", name: "EASY_MODE.SH", desc: "10 min timer // 1.0x scoring multiplier" },
    { key: "medium", name: "MEDIUM_MODE.SH", desc: "7 min timer // 1.15x scoring multiplier" },
    { key: "hard", name: "HARD_MODE.SH", desc: "5 min timer // 1.30x scoring multiplier" },
    { key: "dev", name: "DEBUG_MODE.SH", desc: "60s timer // 1.00x scoring multiplier (dev)" },
  ] as const;

  return (
    <PlaceholderStageCard
      stageKey="difficulty"
      title="Select Difficulty"
      subtitle="Establish the global timer duration and scoring multipliers. Deeper difficulty tiers reduce compile budgets and increase event frequencies."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setDifficulty(opt.key)}
            className={`flex flex-col text-left p-4 rounded-md border transition-all ${
              difficulty === opt.key
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-mono text-xs font-bold text-neutral-900 tracking-wider">
              {opt.name}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-light">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </PlaceholderStageCard>
  );
}

const mockProblems: Problem[] = [
  {
    id: "prob-01",
    title: "EcoTrack Ledger",
    description: "Build a highly scalable carbon footprint compiler for corporate clients to offset energy expenditures in real-time.",
    category: "sustainability",
    difficulty: "beginner",
    constraints: ["High API latency limits", "Needs zero-trust auditing logs"],
    bonusObjectives: ["Integrate solar arrays metrics", "Allow direct off-chain exports"],
  },
  {
    id: "prob-02",
    title: "MindBridge AI",
    description: "Assemble an autonomous cognitive journal to support early-stage stress markers detection with offline-first indexing.",
    category: "healthtech",
    difficulty: "intermediate",
    constraints: ["HIPAA-compliant client storage", "Low local memory overhead"],
    bonusObjectives: ["Speech emotion analytics integration", "Provide dynamic therapist sync"],
  },
];

function ProblemRevealStage() {
  const { selectedProblem, selectProblem } = useGameStore();

  // Pick first problem automatically if nothing chosen yet
  useEffect(() => {
    if (!selectedProblem) {
      selectProblem(mockProblems[0]);
    }
  }, [selectedProblem, selectProblem]);

  return (
    <PlaceholderStageCard
      stageKey="problemReveal"
      title="Review Challenge"
      subtitle="Analyze your randomly generated hackathon problem statement. Prioritize objectives to maximize innovation scores."
    >
      <div className="space-y-4 text-left max-w-md mx-auto">
        <div className="flex gap-2">
          {mockProblems.map((prob) => (
            <button
              key={prob.id}
              onClick={() => selectProblem(prob)}
              className={`flex-1 p-3 rounded-md border font-mono text-[10px] tracking-wider transition-all uppercase ${
                selectedProblem?.id === prob.id
                  ? "border-neutral-900 bg-neutral-50 font-bold"
                  : "border-neutral-200 hover:border-neutral-300 bg-white text-muted-foreground"
              }`}
            >
              {prob.title}
            </button>
          ))}
        </div>

        {selectedProblem && (
          <div className="p-4 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-3 font-mono text-[11px] leading-relaxed">
            <div>
              <span className="text-neutral-400">CHALLENGE:</span>{" "}
              <span className="font-bold text-neutral-900">{selectedProblem.title.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-neutral-400">CATEGORY:</span>{" "}
              <span className="text-neutral-800">{selectedProblem.category.toUpperCase()}</span>
            </div>
            <p className="text-neutral-600 border-t border-dashed border-border pt-2 text-[10px] font-sans">
              {selectedProblem.description}
            </p>
            <div className="border-t border-dashed border-border pt-2">
              <span className="text-neutral-400">CONSTRAINTS:</span>
              <ul className="list-disc list-inside text-neutral-700 text-[10px] mt-1 space-y-0.5">
                {selectedProblem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </PlaceholderStageCard>
  );
}

function SolutionDirectionStage() {
  const { solutionDirection, setSolutionDirection } = useGameStore();

  const options = [
    { id: "web-light", name: "Lightweight Web Interface", desc: "Focuses on instant loading metrics (+Design, +Execution)" },
    { id: "ai-heavy", name: "AI Agent Coprocessor", desc: "Utilizes cognitive model stacks (+Innovation, -Execution)" },
    { id: "ledger-secure", name: "Immutable Hash Ledger", desc: "Prioritizes high security indexing (+Innovation, -Design)" },
  ];

  useEffect(() => {
    if (!solutionDirection) {
      setSolutionDirection(options[0].id);
    }
  }, [solutionDirection, setSolutionDirection, options]);

  return (
    <PlaceholderStageCard
      stageKey="solutionDirection"
      title="Solution Direction"
      subtitle="Establish the technical architecture layout. This determines the category synergy weights in your build pipeline."
    >
      <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSolutionDirection(opt.id)}
            className={`p-3 rounded-md border flex items-center justify-between transition-all ${
              solutionDirection === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300 bg-white"
            }`}
          >
            <div>
              <span className="font-bold text-neutral-900 block">{opt.name.toUpperCase()}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5 block font-light font-sans">{opt.desc}</span>
            </div>
            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
              solutionDirection === opt.id ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
            }`}>
              {solutionDirection === opt.id && <div className="w-1 h-1 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>
    </PlaceholderStageCard>
  );
}

const mockTechItems: TechItem[] = [
  { id: "tech-next", name: "NextJS", icon: "Code", category: "frontend", difficulty: 2, synergies: ["tech-tailwind", "tech-postgres"] },
  { id: "tech-tailwind", name: "TailwindCSS", icon: "Paint", category: "frontend", difficulty: 1, synergies: ["tech-next"] },
  { id: "tech-postgres", name: "PostgreSQL", icon: "Database", category: "database", difficulty: 2, synergies: ["tech-next"] },
  { id: "tech-openai", name: "OpenAI API", icon: "Cpu", category: "ai", difficulty: 3, synergies: ["tech-next"] },
];

function TechStackStage() {
  const { techStack, addTechItem, removeTechItem } = useGameStore();

  const handleToggle = (item: TechItem) => {
    if (techStack.some((t) => t.id === item.id)) {
      removeTechItem(item.id);
    } else {
      addTechItem(item);
    }
  };

  return (
    <PlaceholderStageCard
      stageKey="techStack"
      title="Build Tech Stack"
      subtitle="Assemble frontend, database, and cognitive libraries. Complementary dev tools unlock mutual framework synergies."
    >
      <div className="space-y-4 max-w-md mx-auto text-left font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          {mockTechItems.map((tech) => {
            const isSelected = techStack.some((t) => t.id === tech.id);
            return (
              <button
                key={tech.id}
                onClick={() => handleToggle(tech)}
                className={`p-3 rounded-md border flex items-center justify-between transition-all ${
                  isSelected
                    ? "border-neutral-900 bg-neutral-50 font-bold"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <span>{tech.name.toUpperCase()}</span>
                <span className="text-[9px] text-muted-foreground uppercase">{tech.category}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-md border border-neutral-200 bg-neutral-50/50">
          <span className="text-neutral-400 block text-[9px] mb-2 uppercase">CURRENT_STACK ({techStack.length}/5):</span>
          {techStack.length === 0 ? (
            <span className="text-neutral-400 text-[10px] italic">[EMPTY_STACK_PIPELINE]</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 rounded border border-neutral-300 bg-white text-[9px] font-bold text-neutral-800"
                >
                  {t.name.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlaceholderStageCard>
  );
}

function UspStage() {
  const { usp, setUsp } = useGameStore();

  const options = [
    { id: "usp-offline", name: "Offline-First Sync", desc: "Guarantees low-friction performance indicators (+Design)" },
    { id: "usp-privacy", name: "Zero-Trust Encryption", desc: "Establishes compliance-ready credentials (+Execution)" },
    { id: "usp-automated", name: "1-Click Agent Integration", desc: "Enables fast consumer scaling (+Innovation)" },
  ];

  useEffect(() => {
    if (!usp) {
      setUsp(options[0].id);
    }
  }, [usp, setUsp, options]);

  return (
    <PlaceholderStageCard
      stageKey="usp"
      title="Define USP"
      subtitle="Isolate your unique selling proposition. Highlighting a central competitive advantage boosts pitching scores."
    >
      <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setUsp(opt.id)}
            className={`p-3 rounded-md border flex items-center justify-between transition-all ${
              usp === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300 bg-white"
            }`}
          >
            <div>
              <span className="font-bold text-neutral-900 block">{opt.name.toUpperCase()}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5 block font-sans font-light">{opt.desc}</span>
            </div>
            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
              usp === opt.id ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
            }`}>
              {usp === opt.id && <div className="w-1 h-1 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>
    </PlaceholderStageCard>
  );
}

const mockBacklogFeatures: Feature[] = [
  { id: "feat-auth", name: "Dynamic OAuth System", description: "Secures client login pipelines", effort: "low", impact: "high" },
  { id: "feat-dash", name: "Interactive Analytics UI", description: "Renders real-time offset grids", effort: "medium", impact: "high" },
  { id: "feat-export", name: "Monospace Audit Exports", description: "Compiles JSON metrics sheets", effort: "low", impact: "medium" },
];

function FeaturesStage() {
  const { features, reorderFeatures } = useGameStore();

  useEffect(() => {
    if (features.length === 0) {
      reorderFeatures(mockBacklogFeatures);
    }
  }, [features, reorderFeatures]);

  return (
    <PlaceholderStageCard
      stageKey="features"
      title="Prioritize Backlog"
      subtitle="Order feature priority queues. Top features get built first during code compiles, directly impacting Execution metrics."
    >
      <div className="space-y-3 max-w-sm mx-auto text-left font-mono text-[11px]">
        <span className="text-neutral-400 block text-[9px] uppercase">BACKLOG_PRIORITY:</span>
        <div className="space-y-2">
          {features.map((feat, idx) => (
            <div
              key={feat.id}
              className="p-3 bg-white border border-neutral-200 rounded-md flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-bold">#{idx + 1}</span>
                <span className="font-bold text-neutral-900">{feat.name.toUpperCase()}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 uppercase">
                IMP: {feat.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PlaceholderStageCard>
  );
}

function MentorStage() {
  const { mentorName, setMentorName } = useGameStore();

  const mentors = [
    { name: "Dr. Vikram Patel", role: "Principal Cloud Engineer", tip: "Modularizes databases to prevent high scaling costs" },
    { name: "Sophia Mercer", role: "VP of Startup Design", tip: "Refines grids padding to simplify dashboard readability" },
  ];

  useEffect(() => {
    if (!mentorName) {
      setMentorName(mentors[0].name);
    }
  }, [mentorName, setMentorName]);

  return (
    <PlaceholderStageCard
      stageKey="mentor"
      title="Consult Mentor"
      subtitle="Seek technical advice from industry veterans. Mentors unlock specific optimization templates but draw a minor penalty on scoring weights."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left font-mono text-[11px]">
        {mentors.map((ment) => (
          <button
            key={ment.name}
            onClick={() => setMentorName(ment.name)}
            className={`p-4 rounded-md border text-left transition-all ${
              mentorName === ment.name
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900 block">{ment.name.toUpperCase()}</span>
            <span className="text-[9px] text-muted-foreground uppercase block mt-0.5">{ment.role}</span>
            <p className="text-[10px] text-neutral-600 font-sans font-light mt-3 border-t border-dashed border-border pt-2 leading-relaxed">
              "{ment.tip}"
            </p>
          </button>
        ))}
      </div>
    </PlaceholderStageCard>
  );
}

function BusinessModelStage() {
  const { businessModel, setBusinessModel } = useGameStore();

  const options = [
    { id: "saas-subscription", name: "SaaS Recurring Tiers", desc: "Charges monthly fees per active nodes (+Execution)" },
    { id: "open-source", name: "OS License Sponsorship", desc: "Builds developer community frameworks (+Innovation)" },
    { id: "transactional", name: "Off-Chain Gas Fees", desc: "Deducts micro-transaction percentages (+Pitch)" },
  ];

  useEffect(() => {
    if (!businessModel) {
      setBusinessModel(options[0].id);
    }
  }, [businessModel, setBusinessModel, options]);

  return (
    <PlaceholderStageCard
      stageKey="businessModel"
      title="Business Architecture"
      subtitle="Synthesize your operational model. Aligning monetization strategies with problem profiles elevates judge pitching grades."
    >
      <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setBusinessModel(opt.id)}
            className={`p-3 rounded-md border flex items-center justify-between transition-all ${
              businessModel === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300 bg-white"
            }`}
          >
            <div>
              <span className="font-bold text-neutral-900 block">{opt.name.toUpperCase()}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5 block font-sans font-light">{opt.desc}</span>
            </div>
            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
              businessModel === opt.id ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
            }`}>
              {businessModel === opt.id && <div className="w-1 h-1 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>
    </PlaceholderStageCard>
  );
}

function PitchPrepStage() {
  const { pitchText, setPitchText } = useGameStore();

  const wordCount = pitchText.trim() === "" ? 0 : pitchText.trim().split(/\s+/).length;

  return (
    <PlaceholderStageCard
      stageKey="pitchPrep"
      title="Prepare Pitch"
      subtitle="Summarize your product value statement. The elevator pitch must be highly focused and stay below the 30-word limit."
    >
      <div className="space-y-3 max-w-md mx-auto text-left font-mono text-[11px]">
        <span className="text-neutral-400 block text-[9px] uppercase">ELEVATOR_PITCH_PROMPT:</span>
        <textarea
          value={pitchText}
          onChange={(e) => setPitchText(e.target.value)}
          placeholder="Our application builds decentralized carbon offset ledgers..."
          className="w-full h-24 p-3 bg-white border border-neutral-200 rounded-md focus:border-neutral-800 outline-none text-neutral-800 font-sans font-light leading-relaxed"
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>LIMIT: 30 WORDS MAX</span>
          <span className={wordCount > 30 ? "text-red-500 font-bold" : "text-neutral-500 font-bold"}>
            WORDS: {wordCount}/30
          </span>
        </div>
      </div>
    </PlaceholderStageCard>
  );
}

const mockJudges: Judge[] = [
  { id: "jdg-chen", name: "Victoria Chen", avatar: "🦈", title: "Managing Partner, VC", expertise: ["market"], personality: "tough", scoringWeights: { innovation: 0.3, execution: 0.2, design: 0.2, pitch: 0.3 } },
  { id: "jdg-gray", name: "Marcus Gray", avatar: "🎨", title: "Principal Product Designer", expertise: ["ux"], personality: "creative", scoringWeights: { innovation: 0.2, execution: 0.2, design: 0.4, pitch: 0.2 } },
];

function JudgeSpinStage() {
  const { judgeSpinState, setJudgeSpinState, nextStage } = useGameStore();

  const triggerSpin = () => {
    setJudgeSpinState("spinning");
    setTimeout(() => {
      setJudgeSpinState("done");
      nextStage();
    }, 1500);
  };

  return (
    <PlaceholderStageCard
      stageKey="judgeSpin"
      title="Jury Order Selection"
      subtitle="Initiate the compiler spin to randomize evaluation sequencing. Order affects cumulative stress and feedback multipliers."
    >
      <div className="flex flex-col items-center justify-center gap-6 max-w-sm mx-auto">
        <div className="relative w-36 h-36 rounded-full border border-neutral-300 flex items-center justify-center bg-white shadow-sm overflow-hidden">
          {/* Mock wheel division circles */}
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg select-none">
            {judgeSpinState === "spinning" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-2xl"
              >
                🌀
              </motion.div>
            ) : judgeSpinState === "done" ? (
              <span className="text-2xl">🎯</span>
            ) : (
              <span className="text-2xl">⚖️</span>
            )}
          </div>
        </div>

        <Button
          onClick={triggerSpin}
          disabled={judgeSpinState === "spinning"}
          className="font-mono text-xs w-full max-w-xs border border-neutral-900"
        >
          {judgeSpinState === "spinning" ? "ROULETTE_SPINNING..." : "TRIGGER_SPIN_ROULETTE.EXE"}
        </Button>
      </div>
    </PlaceholderStageCard>
  );
}

function JudgingStage() {
  const { updateScore, nextStage } = useGameStore();
  const [isEvaluating, setIsEvaluating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEvaluating(false);
      // Automatically generate some mock metrics grades
      updateScore("innovation", Math.floor(Math.random() * 20) + 70);
      updateScore("execution", Math.floor(Math.random() * 20) + 70);
      updateScore("design", Math.floor(Math.random() * 20) + 75);
      updateScore("pitch", Math.floor(Math.random() * 25) + 65);
      updateScore("bonus", 15);
    }, 2000);
    return () => clearTimeout(timer);
  }, [updateScore]);

  return (
    <PlaceholderStageCard
      stageKey="judging"
      title="Jury Evaluation"
      subtitle="Jury assessment in progress. Standardizing developer architectures against evaluation templates."
    >
      <div className="flex flex-col items-center justify-center gap-6 max-w-sm mx-auto">
        {isEvaluating ? (
          <div className="space-y-4 w-full text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="p-3 bg-neutral-100 rounded-md border border-neutral-200 inline-block"
            >
              <Hammer className="w-8 h-8 text-neutral-800" />
            </motion.div>
            <div className="font-mono text-xs text-muted-foreground animate-pulse">
              ANALYZING_CODE_SYNERGIES...
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full text-center">
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 inline-block font-mono text-[10px] font-bold">
              COMPILER_SUCCESS: EVALUATION_COMPLETE
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Jury assessments successfully parsed. Click below to compile calculations sheets.
            </p>
            <Button
              onClick={nextStage}
              className="font-mono text-xs w-full border border-neutral-900"
            >
              COMPILE_METRICS_SHEETS.SH
            </Button>
          </div>
        )}
      </div>
    </PlaceholderStageCard>
  );
}

function ResultsStage() {
  const { score, difficulty, resetGame } = useGameStore();

  return (
    <PlaceholderStageCard
      stageKey="results"
      title="Jury Metrics sheet"
      subtitle="Hackathon simulation complete. Review category breakdowns and aggregate efficiency marks below."
    >
      <div className="space-y-4 max-w-md mx-auto text-left font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-neutral-200 rounded-md">
            <span className="text-neutral-400 block text-[9px] uppercase">TOTAL_SCORE:</span>
            <span className="text-xl sm:text-2xl font-black text-neutral-900">{score.total} pts</span>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-md">
            <span className="text-neutral-400 block text-[9px] uppercase">DIFFICULTY_TIER:</span>
            <span className="text-xl sm:text-2xl font-black text-neutral-900 uppercase">
              {difficulty || "MEDIUM"}
            </span>
          </div>
        </div>

        <div className="p-4 bg-neutral-50/50 border border-neutral-200 rounded-md space-y-2">
          <span className="text-neutral-400 block text-[9px] mb-2 uppercase">METRICS_BREAKDOWN:</span>
          
          <div className="flex justify-between items-center py-1 border-b border-dashed border-border/80">
            <span className="text-neutral-600">INNOVATION_MARK:</span>
            <span className="font-bold text-neutral-900">{score.innovation}/100</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-dashed border-border/80">
            <span className="text-neutral-600">EXECUTION_MARK:</span>
            <span className="font-bold text-neutral-900">{score.execution}/100</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-dashed border-border/80">
            <span className="text-neutral-600">DESIGN_MARK:</span>
            <span className="font-bold text-neutral-900">{score.design}/100</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-dashed border-border/80">
            <span className="text-neutral-600">PITCH_MARK:</span>
            <span className="font-bold text-neutral-900">{score.pitch}/100</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-neutral-600">COMPILER_BONUSES:</span>
            <span className="font-bold text-neutral-900">+{score.bonus} pts</span>
          </div>
        </div>

        <Button
          onClick={resetGame}
          className="w-full font-mono text-xs h-10 border border-neutral-900 mt-6"
        >
          REBOOT_COMPILER_SIMULATOR.SH
        </Button>
      </div>
    </PlaceholderStageCard>
  );
}

// ─── Floating Dev Debug Panel Component ─────────────────────────────────────

function DevDebugPanel() {
  const {
    stage,
    isTimerPaused,
    globalTimeRemaining,
    globalTotalTime,
    score,
    jumpToStage,
    pauseTimer,
    resumeTimer,
    resetGame,
    nextStage,
  } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-2 text-[10px] font-mono uppercase bg-neutral-900 text-white rounded shadow border border-neutral-800 hover:bg-neutral-800 transition-all cursor-pointer"
      >
        [DEV_DEBUG_PANEL]
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-card border border-neutral-400 rounded-lg shadow-xl p-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2 font-bold text-neutral-900">
        <span>DEV_DEBUG_PANEL.SH</span>
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500 font-bold cursor-pointer">[X]</button>
      </div>

      <div className="space-y-1 text-[11px] mb-3 text-neutral-700">
        <div>STAGE: <span className="font-bold text-neutral-900">{stage}</span></div>
        <div>TIMER: <span className="font-bold text-neutral-900">{formatTime(globalTimeRemaining)} / {formatTime(globalTotalTime)}</span> ({isTimerPaused ? "PAUSED" : "ACTIVE"})</div>
        <div>SCORE_TOTAL: <span className="font-bold text-neutral-900">{score.total} pts</span></div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <Button
          size="xs"
          variant="outline"
          onClick={isTimerPaused ? resumeTimer : pauseTimer}
          className="text-[10px] h-7"
        >
          {isTimerPaused ? "RESUME_TIME" : "PAUSE_TIME"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={nextStage}
          className="text-[10px] h-7"
        >
          SKIP_STAGE
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={resetGame}
          className="text-[10px] col-span-2 h-7"
        >
          RESET_SIMULATOR
        </Button>
      </div>

      <div className="border-t border-border pt-2">
        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
          JUMP_TO_STAGE:
        </label>
        <select
          value={stage}
          onChange={(e) => jumpToStage(e.target.value as GameStage)}
          className="w-full bg-white border border-border text-[11px] rounded p-1"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Condtional Stage Orchestrator / GamePage ───────────────────────────

export default function GamePage() {
  const { stage, isGameStarted, startGame, tickTimer, isTimerPaused } = useGameStore();

  // Auto-start global simulation when page mounts
  useEffect(() => {
    if (!isGameStarted) {
      startGame();
    }
  }, [isGameStarted, startGame]);

  // Bind the global countdown interval system
  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, tickTimer]);

  /** Renders the correct lightweight placeholder stage conditionally */
  const renderStageContent = () => {
    switch (stage) {
      case "difficulty":
        return <DifficultyStage key="difficulty" />;
      case "problemReveal":
        return <ProblemRevealStage key="problemReveal" />;
      case "solutionDirection":
        return <SolutionDirectionStage key="solutionDirection" />;
      case "techStack":
        return <TechStackStage key="techStack" />;
      case "usp":
        return <UspStage key="usp" />;
      case "features":
        return <FeaturesStage key="features" />;
      case "mentor":
        return <MentorStage key="mentor" />;
      case "businessModel":
        return <BusinessModelStage key="businessModel" />;
      case "pitchPrep":
        return <PitchPrepStage key="pitchPrep" />;
      case "judgeSpin":
        return <JudgeSpinStage key="judgeSpin" />;
      case "judging":
        return <JudgingStage key="judging" />;
      case "results":
        return <ResultsStage key="results" />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <span className="font-mono text-xs text-muted-foreground animate-pulse">
              INITIALIZING_COMPILER_DRIVERS...
            </span>
          </div>
        );
    }
  };

  return (
    <GameLayout>
      <div className="relative w-full h-full min-h-screen">
        <AnimatePresence mode="wait">{renderStageContent()}</AnimatePresence>
        <DevDebugPanel />
      </div>
    </GameLayout>
  );
}

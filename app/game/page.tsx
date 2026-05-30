"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, STAGE_ORDER } from "@/store/gameStore";
import GameLayout from "@/components/game/GameLayout";
import { Button } from "@/components/ui/button";
import { PROBLEMS } from "@/data/problems";
import { JUDGES } from "@/data/judges";
import { TECH_POOL, TECH_WEIGHTS } from "@/data/techItems";
import { TECH_REGISTRY, getSlotForCategory, toStoreId, toRegistryId, TechRegistryItem } from "@/data/techRegistry";
import { getRecommendations } from "@/lib/recommendations";
import { ARCHITECTURE_TEMPLATES } from "@/data/architectureTemplates";
import { DraggableCard } from "@/components/drag-drop/DraggableCard";
import { DropZone } from "@/components/drag-drop/DropZone";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Terminal,
  Clock,
  Trophy,
  Sparkles,
  Zap,
  Hammer,
  RotateCcw,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Check,
} from "lucide-react";
import type { GameStage, Problem, TechItem, Feature } from "@/types/game";
import { CHAOS_EVENTS } from "@/data/chaosEvents";
import { MODIFIERS } from "@/data/modifiers";
import { generateJudgeFeedback } from "@/data/judgeComments";
import { classifyProjectArchetype } from "@/lib/archetypes";
import { generatePRD } from "@/lib/prdGenerator";
import {
  playMutedClick,
  playSubtleHover,
  playSnapSound,
  playWarningTick,
  playWheelSpinClick,
  playScoreChord,
  playUnlockArpeggio
} from "@/lib/sound";

// --- Standard Reusable Stage Wrapper ---------------------------------------

function GameplayStageCard({
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
  const { nextStage, previousStage, difficulty, globalTimeRemaining, activeModifiers, gameMode } = useGameStore();
  const currentIndex = STAGE_ORDER.indexOf(stageKey);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[75vh] max-w-4xl mx-auto px-4 py-8"
    >
      <div className="w-full bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.015)] p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Stage metadata tags */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/85">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
              STAGE_{String(currentIndex + 1).padStart(2, "0")}//{stageKey.toUpperCase()}
            </span>
            {gameMode && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-900 text-white uppercase font-bold">
                MODE: {gameMode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {difficulty && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 uppercase font-bold">
                DIFF: {difficulty}
              </span>
            )}
            {difficulty && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-900 text-white font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(globalTimeRemaining)}
              </span>
            )}
          </div>
        </div>

        {/* Modifiers List Indicators */}
        {activeModifiers && activeModifiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-start mb-6 text-left border-b border-dashed border-border/60 pb-3 select-none">
            <span className="font-mono text-[9px] uppercase text-neutral-400 mr-2 self-center">ACTIVE_MODIFIERS:</span>
            {activeModifiers.map((modId) => {
              const mod = MODIFIERS.find((m) => m.id === modId);
              return (
                <span
                  key={modId}
                  title={mod?.description}
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-50/50 border border-amber-200 text-amber-700 font-bold hover:bg-amber-100 transition-colors cursor-help"
                >
                  ⚠️ {mod?.name.toUpperCase()}
                </span>
              );
            })}
          </div>
        )}

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
            onClick={() => {
              playMutedClick();
              previousStage();
            }}
            onMouseEnter={playSubtleHover}
            disabled={currentIndex === 0 || stageKey === 'results'}
            className="font-mono text-xs h-8 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none"
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
            onClick={() => {
              playMutedClick();
              nextStage();
            }}
            onMouseEnter={playSubtleHover}
            disabled={currentIndex === STAGE_ORDER.length - 1 || !difficulty}
            className="font-mono text-xs h-8 border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none"
          >
            CONTINUE &gt;
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Stage 1: Difficulty Phase ---------------------------------------------

function DifficultyStage() {
  const { setDifficulty, difficulty, gameMode } = useGameStore();

  const options = [
    { key: "easy", name: "EASY_COMPILE.EXE", desc: gameMode === 'speedrun' ? "3 min speedrun budget // 1.0x baseline modifier" : "10 min compile budget // 1.0x baseline modifier" },
    { key: "medium", name: "MEDIUM_COMPILE.EXE", desc: gameMode === 'speedrun' ? "3 min speedrun budget // 1.15x efficiency multiplier" : "7 min compile budget // 1.15x efficiency multiplier" },
    { key: "hard", name: "HARD_COMPILE.EXE", desc: gameMode === 'speedrun' ? "3 min speedrun budget // 1.30x structural speed multiplier" : "5 min compile budget // 1.30x structural speed multiplier" },
    { key: "dev", name: "DEV_DEBUG.SH", desc: gameMode === 'speedrun' ? "3 min speedrun budget // 1.00x test build modifier" : "60 seconds compile budget // 1.00x test build modifier" },
  ] as const;

  return (
    <GameplayStageCard
      stageKey="difficulty"
      title="Select Difficulty"
      subtitle="Select a difficulty profile. Dynamic schedules governs available seconds, event complexities, and aggregate compile speeds."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => {
              playMutedClick();
              setDifficulty(opt.key);
            }}
            onMouseEnter={playSubtleHover}
            className={`flex flex-col text-left p-4 rounded-md border transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
              difficulty === opt.key
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
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
    </GameplayStageCard>
  );
}

// --- Stage 2: Problem Reveal Phase ------------------------------------------

function ProblemRevealStage() {
  const { selectedProblem, selectProblem } = useGameStore();
  const [shuffling, setShuffling] = useState(false);

  const rollRandomProblem = useCallback(() => {
    setShuffling(true);
    let index = 0;
    const interval = setInterval(() => {
      index = Math.floor(Math.random() * PROBLEMS.length);
      selectProblem(PROBLEMS[index]);
      playWheelSpinClick();
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      setShuffling(false);
    }, 1000);
  }, [selectProblem]);

  // Select problem automatically on load if none selected
  useEffect(() => {
    if (!selectedProblem) {
      rollRandomProblem();
    }
  }, [selectedProblem, rollRandomProblem]);

  return (
    <GameplayStageCard
      stageKey="problemReveal"
      title="Problem Reveal"
      subtitle="Review the assigned startup challenge statement. Shuffling is available to redraw alternative requirements grids."
    >
      <div className="space-y-4 text-left max-w-md mx-auto font-mono text-[11px] leading-relaxed">
        <div className="flex justify-end">
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              playMutedClick();
              rollRandomProblem();
            }}
            onMouseEnter={playSubtleHover}
            disabled={shuffling}
            className="text-[10px] h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1 ${shuffling ? 'animate-spin' : ''}`} />
            SHUFFLE_STATEMENT.EXE
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {selectedProblem && (
            <motion.div
              key={selectedProblem.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-4"
            >
              <div>
                <span className="text-neutral-400">PROBLEM_NAME:</span>{" "}
                <span className="font-bold text-neutral-900 uppercase">{selectedProblem.title}</span>
              </div>
              <div>
                <span className="text-neutral-400">CATEGORY:</span>{" "}
                <span className="font-bold text-neutral-800 uppercase px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px]">
                  {selectedProblem.category}
                </span>
              </div>
              <p className="text-neutral-700 border-t border-dashed border-border pt-3 text-[11px] font-sans font-light">
                {selectedProblem.description}
              </p>
              
              <div className="border-t border-dashed border-border pt-3 space-y-1">
                <span className="text-neutral-400 font-bold block text-[10px]">COMPILE_CONSTRAINTS:</span>
                <ul className="list-disc list-inside text-neutral-700 text-[10px] space-y-1 font-sans font-light">
                  {selectedProblem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {selectedProblem.judgingHint && (
                <div className="border-t border-dashed border-border pt-3">
                  <span className="text-neutral-400 font-bold block text-[10px] mb-1">JUDGING_CLUE:</span>
                  <div className="p-2.5 rounded bg-amber-50/30 border border-amber-200/50 text-[10px] text-amber-800 font-sans font-light leading-relaxed">
                    💡 {selectedProblem.judgingHint}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 3: Solution Direction Phase --------------------------------------

function SolutionDirectionStage() {
  const { solutionDirection, setSolutionDirection, updateScore } = useGameStore();

  const options = [
    { id: "web-app", name: "Web Application", desc: "Compile lightweight modular sites (+Design, +Feasibility)" },
    { id: "mobile-app", name: "Mobile Application", desc: "Build native offline study tools (+Design, +Execution)" },
    { id: "ai-solution", name: "AI Solution", desc: "Assemble localized cognitive pipelines (+Innovation, +PitchPotential)" },
    { id: "iot-product", name: "IoT Hardware Product", desc: "Program micro-controllers & sensors (+Innovation, -Execution)" },
    { id: "platform", name: "Service Platform", desc: "Design shared micro-services lattices (+Execution, +Innovation)" },
    { id: "marketplace", name: "Trading Marketplace", desc: "Build automated peer exchange pools (+PitchPotential, +Feasibility)" },
  ];

  const handleSelect = (id: string) => {
    setSolutionDirection(id);
    
    // Apply hidden scoring updates immediately based on project option chosen
    if (id === "web-app") {
      updateScore("design", 15);
      updateScore("execution", 10);
      updateScore("innovation", 5);
      updateScore("pitch", 5);
    } else if (id === "mobile-app") {
      updateScore("design", 10);
      updateScore("execution", 15);
      updateScore("innovation", 5);
      updateScore("pitch", 5);
    } else if (id === "ai-solution") {
      updateScore("innovation", 25);
      updateScore("execution", 5);
      updateScore("design", 5);
      updateScore("pitch", 20);
    } else if (id === "iot-product") {
      updateScore("innovation", 20);
      updateScore("execution", 8);
      updateScore("design", 5);
      updateScore("pitch", 12);
    } else if (id === "platform") {
      updateScore("execution", 18);
      updateScore("innovation", 12);
      updateScore("design", 5);
      updateScore("pitch", 5);
    } else if (id === "marketplace") {
      updateScore("pitch", 20);
      updateScore("execution", 10);
      updateScore("innovation", 5);
      updateScore("design", 5);
    }
  };

  useEffect(() => {
    if (!solutionDirection) {
      handleSelect(options[0].id);
    }
  }, [solutionDirection]);

  return (
    <GameplayStageCard
      stageKey="solutionDirection"
      title="Solution Direction"
      subtitle="Establish the primary architecture layout. Option profile choices inject specific baseline score offsets to hidden multipliers."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              playMutedClick();
              handleSelect(opt.id);
            }}
            onMouseEnter={playSubtleHover}
            className={`p-4 rounded-md border flex flex-col transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
              solutionDirection === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900">{opt.name.toUpperCase()}</span>
            <span className="text-[10px] text-muted-foreground mt-1 font-sans font-light leading-relaxed">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 4: Tech Stack Phase ----------------------------------------------

function TechStackStage() {
  const { techStack, addTechItem, removeTechItem, updateScore, solutionDirection, usp, selectedProblem } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' (compatible), 'all-bypass' (show all), 'recommended', 'synergic'
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const selectedIds = new Set(techStack.map((t) => t.id));

  // Get active contextual template based on chosen solution direction
  const activeTemplate = ARCHITECTURE_TEMPLATES[solutionDirection || 'web-app'] || ARCHITECTURE_TEMPLATES['web-app'];

  // Initialize selected slot ID to first slot in the active template
  useEffect(() => {
    if (activeTemplate && activeTemplate.slots.length > 0) {
      setSelectedSlotId(activeTemplate.slots[0].id);
    }
  }, [solutionDirection, activeTemplate]);

  // Find active slot metadata
  const activeSlotMeta = activeTemplate.slots.find(s => s.id === selectedSlotId);

  // Get dynamic domain-aware recommendations
  const recommendedStack = getRecommendations(solutionDirection, usp, selectedProblem?.category);

  // Check if an item is synergic with currently slotted items
  const isSynergic = useCallback((item: TechRegistryItem) => {
    const currentSlottedIds = new Set(techStack.map((t) => toRegistryId(t.id)));
    if (currentSlottedIds.has(item.id)) return false;

    for (const selId of currentSlottedIds) {
      const selRegItem = TECH_REGISTRY.find((x) => x.id === selId);
      if (selRegItem && selRegItem.synergy.includes(item.id)) {
        return true;
      }
      if (item.synergy.includes(selId)) {
        return true;
      }
    }
    return false;
  }, [techStack]);

  // Dynamic live score compiler based on active tech stack and synergies
  const recalculateTechScores = useCallback((currentStack: TechItem[]) => {
    let innovation = 50;
    let feasibility = 60; // execution base
    let design = 55;
    let pitchPotential = 50; // pitch base
    let bonus = 0;

    // Apply individual tech weights lookup from the expanded registry
    currentStack.forEach((tech) => {
      const regId = toRegistryId(tech.id);
      const regItem = TECH_REGISTRY.find((item) => item.id === regId);
      if (regItem) {
        innovation += regItem.innovationWeight;
        feasibility += regItem.executionWeight;
        design += regItem.designWeight;
        pitchPotential += regItem.pitchWeight;
      }
    });

    // Check specific stack synergies using registry IDs
    const ids = new Set(currentStack.map((t) => toRegistryId(t.id)));
    
    // Synergy A: Next.js + Vercel
    if (ids.has("reg-next") && ids.has("reg-vercel")) {
      feasibility += 12;
      bonus += 5;
    }
    
    // Synergy B: OpenAI + Pinecone
    if (ids.has("reg-openai") && ids.has("reg-pinecone")) {
      innovation += 14;
      bonus += 5;
    }

    // Synergy C: Prisma + Postgres
    if (ids.has("reg-prisma") && ids.has("reg-postgres")) {
      feasibility += 8;
      bonus += 3;
    }

    // Synergy D: ESP32 + TensorFlow
    if (ids.has("reg-esp32") && ids.has("reg-tensorflow")) {
      innovation += 16;
      bonus += 5;
    }

    // Conflicts
    // Conflict 1: MongoDB + Prisma
    if (ids.has("reg-mongodb") && ids.has("reg-prisma")) {
      feasibility -= 10;
    }

    // Conflict 2: Arduino + Cloud/SaaS
    const hasSaaS = ids.has("reg-vercel") || ids.has("reg-netlify") || ids.has("reg-clerk") || ids.has("reg-stripe");
    if (ids.has("reg-arduino") && hasSaaS) {
      feasibility -= 15;
    }

    // Overengineering: If selected stack has >= 4 items of difficulty >= 4
    let difficultCount = 0;
    currentStack.forEach((tech) => {
      const regId = toRegistryId(tech.id);
      const regItem = TECH_REGISTRY.find((item) => item.id === regId);
      if (regItem && regItem.difficultyScore >= 4) {
        difficultCount++;
      }
    });
    if (difficultCount >= 4) {
      feasibility -= 15;
    }

    // Dynamic slot priorities checking for penalties & bonuses
    let missingRequiredCount = 0;
    let populatedRecommendedCount = 0;

    activeTemplate.slots.forEach((slot) => {
      const isSlotted = currentStack.some((t) => t.category === slot.id);
      if (slot.priority === 'required' && !isSlotted) {
        missingRequiredCount++;
      } else if (slot.priority === 'recommended' && isSlotted) {
        populatedRecommendedCount++;
      }
    });

    // Apply Required penalties: -15 per missing slot
    feasibility -= (missingRequiredCount * 15);

    // Apply Recommended bonuses: +5 per populated slot
    innovation += (populatedRecommendedCount * 5);

    updateScore("innovation", Math.max(0, Math.min(innovation, 100)));
    updateScore("execution", Math.max(0, Math.min(feasibility, 100)));
    updateScore("design", Math.max(0, Math.min(design, 100)));
    updateScore("pitch", Math.max(0, Math.min(pitchPotential, 100)));
    updateScore("bonus", bonus);
  }, [updateScore, activeTemplate]);

  const handleToggleTech = (regItem: TechRegistryItem) => {
    const storeId = toStoreId(regItem.id);
    if (selectedIds.has(storeId)) {
      const nextStack = techStack.filter((t) => t.id !== storeId);
      removeTechItem(storeId);
      recalculateTechScores(nextStack);
    } else {
      // Find a suitable slot dynamically for this technology
      let targetSlotId = selectedSlotId;
      let targetSlotMeta = activeSlotMeta;
      
      const isSlotCompatible = (slot: typeof activeTemplate.slots[number]) => {
        return slot.compatibleCategories.includes(regItem.category);
      };

      // If active slot is not compatible, search for a compatible slot in the template
      if (!targetSlotId || !targetSlotMeta || !isSlotCompatible(targetSlotMeta)) {
        // Find first empty compatible slot
        const emptyCompatible = activeTemplate.slots.find(
          (s) => isSlotCompatible(s) && !techStack.some((t) => t.category === s.id)
        );
        if (emptyCompatible) {
          targetSlotId = emptyCompatible.id;
          targetSlotMeta = emptyCompatible;
        } else {
          // Find first compatible slot (even if occupied)
          const firstCompatible = activeTemplate.slots.find((s) => isSlotCompatible(s));
          if (firstCompatible) {
            targetSlotId = firstCompatible.id;
            targetSlotMeta = firstCompatible;
          }
        }
      }

      if (targetSlotId && targetSlotMeta) {
        // Eject duplicate if any
        const duplicate = techStack.find((t) => t.category === targetSlotId);
        if (duplicate) {
          removeTechItem(duplicate.id);
        }

        const tech: TechItem = {
          id: storeId,
          name: regItem.name,
          icon: 'layers',
          category: targetSlotId,
          difficulty: regItem.difficultyScore,
          synergies: regItem.synergy.map(toStoreId),
        };

        const nextStack = [...techStack.filter((t) => t.category !== targetSlotId), tech];
        addTechItem(tech);
        recalculateTechScores(nextStack);
      }
    }
  };

  const handleToggleSlottedItem = (slottedItem: TechItem) => {
    const nextStack = techStack.filter((t) => t.id !== slottedItem.id);
    removeTechItem(slottedItem.id);
    recalculateTechScores(nextStack);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const regItem = TECH_REGISTRY.find((t) => t.id === active.id);
    if (!regItem) return;

    const targetSlotId = over.id as string; // The dynamic slot ID!
    const storeId = toStoreId(regItem.id);

    const item: TechItem = {
      id: storeId,
      name: regItem.name,
      icon: 'layers',
      category: targetSlotId, // Slotted category (can trigger validation warning if it violates resolved category)
      difficulty: regItem.difficultyScore,
      synergies: regItem.synergy.map(toStoreId),
    };

    if (!selectedIds.has(item.id)) {
      const duplicate = techStack.find((t) => t.category === item.category);
      if (duplicate) {
        removeTechItem(duplicate.id);
      }
      
      const nextStack = [...techStack.filter((t) => t.category !== item.category), item];
      addTechItem(item);
      recalculateTechScores(nextStack);
      playSnapSound();
    }
  };

  // Tabs for Visual categorization
  const tabs = [
    { id: 'all', label: 'ALL_TECH.EXE' },
    { id: 'frontend', label: 'FRONTEND.SYS' },
    { id: 'backend', label: 'BACKEND.SYS' },
    { id: 'database', label: 'DATABASE.SYS' },
    { id: 'devops', label: 'INFRA_DEVOPS.SYS' },
    { id: 'ai', label: 'AI_COPROCESSOR.SYS' },
    { id: 'hardware', label: 'IoT_HARDWARE.SYS' },
    { id: 'apis', label: 'APIs_SERVICES.SYS' },
  ];

  // Quick Filters
  const quickFilters = [
    { id: 'all', label: 'COMPATIBLE_ONLY' },
    { id: 'all-bypass', label: 'SHOW_ALL_LIBRARY' },
    { id: 'recommended', label: '★ RECOMMENDED' },
    { id: 'synergic', label: '⚡ SYNERGIC_BOOST' },
  ];

  // Filter tech items based on Active Tab, Search Query, Quick Filters, and Selected Slot Compatibilities
  const filteredTechRegistry = TECH_REGISTRY.filter((tech) => {
    // 1. Solution-Aware Filtering: Show only compatible solutions
    if (solutionDirection && !tech.compatibleSolutions.includes(solutionDirection as any)) {
      return false;
    }

    // 2. Contextual Tech Filtering: Only show technologies matching current slot role
    if (activeSlotMeta && activeFilter !== 'all-bypass') {
      if (!activeSlotMeta.compatibleCategories.includes(tech.category)) {
        return false;
      }
    }

    // 3. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = tech.name.toLowerCase().includes(q);
      const matchTags = tech.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchTags) return false;
    }

    // 4. Category Tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'frontend' && !['Frontend', 'Design / UI', 'AR / VR', 'Mobile'].includes(tech.category)) return false;
      if (activeTab === 'backend' && !['Backend', 'Realtime / Messaging', 'Automation'].includes(tech.category)) return false;
      if (activeTab === 'database' && !['Database', 'Blockchain / Web3'].includes(tech.category)) return false;
      if (activeTab === 'devops' && !['Hosting / Infra', 'DevOps'].includes(tech.category)) return false;
      if (activeTab === 'ai' && !['AI / ML'].includes(tech.category)) return false;
      if (activeTab === 'hardware' && !['IoT / Hardware'].includes(tech.category)) return false;
      if (activeTab === 'apis' && !['Authentication', 'Payments', 'Analytics', 'Productivity APIs'].includes(tech.category)) return false;
    }

    // 5. Quick filter
    if (activeFilter === 'recommended') {
      if (!recommendedStack.techIds.includes(tech.id)) return false;
    }
    if (activeFilter === 'synergic') {
      if (!isSynergic(tech)) return false;
    }

    return true;
  });

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <GameplayStageCard
        stageKey="techStack"
        title="Assemble Tech Stack"
        subtitle={`Configure the dynamic ${activeTemplate.solutionName} architecture. Select slots on the right to filter recommended tech, or drag chips into zones.`}
      >
        <div className="space-y-4 max-w-4xl mx-auto text-left font-mono text-[11px]">
          
          {/* Recommended Stack Box */}
          {recommendedStack && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-900 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1">
                  ★ RECOMMENDED_ARCHITECTURAL_PRESET:
                </span>
                <span className="text-[8px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-mono">
                  USP: {usp?.toUpperCase() || "N/A"}
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 font-sans italic leading-relaxed font-light">
                "{recommendedStack.why}"
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-neutral-400 text-[8px] uppercase self-center font-mono">SUGGESTED:</span>
                {recommendedStack.techIds.map((techId) => {
                  const regItem = TECH_REGISTRY.find((item) => item.id === techId);
                  if (!regItem) return null;
                  const isSlotted = selectedIds.has(toStoreId(techId));
                  return (
                    <button
                      key={techId}
                      onClick={() => {
                        playMutedClick();
                        handleToggleTech(regItem);
                      }}
                      onMouseEnter={playSubtleHover}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono border transition-all duration-150 ${
                        isSlotted
                          ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {regItem.name.toUpperCase()} {isSlotted ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playMutedClick();
                  setActiveTab(tab.id);
                }}
                onMouseEnter={playSubtleHover}
                className={`px-2 py-1 rounded text-[9px] border transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pb-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH_TECH_LIBRARY..."
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded text-[10px] font-mono uppercase tracking-wider focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-1 self-start sm:self-auto">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    playMutedClick();
                    setActiveFilter(filter.id);
                  }}
                  onMouseEnter={playSubtleHover}
                  className={`px-2.5 py-1 rounded-full text-[9px] border transition-all duration-150 ${
                    activeFilter === filter.id
                      ? "bg-neutral-100 text-neutral-900 border-neutral-900 font-bold"
                      : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Drag-Drop Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Available Tech (Left Panel) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 block text-[9px] uppercase tracking-wider">
                  LIBRARY: {activeSlotMeta ? `${activeSlotMeta.label.toUpperCase()} COMPATIBLE` : 'ALL'} ({filteredTechRegistry.length} ITEMS):
                </span>
                {activeSlotMeta && activeFilter !== 'all-bypass' && (
                  <span className="text-[8px] text-neutral-500 font-normal">
                    [FILTER_ACTIVE: CLICK SLOTS TO CHANGE TARGET]
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredTechRegistry.map((tech) => {
                  const storeId = toStoreId(tech.id);
                  const isSelected = selectedIds.has(storeId);
                  const isRecommended = recommendedStack?.techIds.includes(tech.id);
                  const hasSynergy = isSynergic(tech);

                  return (
                    <DraggableCard key={tech.id} id={tech.id} data={{ ...tech }}>
                      <button
                        onClick={() => {
                          playMutedClick();
                          handleToggleTech(tech);
                        }}
                        onMouseEnter={playSubtleHover}
                        className={`w-full text-left flex flex-col p-2.5 rounded-md border transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
                          isSelected
                            ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold animate-[pulse_3s_infinite]"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-1">
                          <span className="font-bold text-neutral-900 block truncate">{tech.name}</span>
                          {isRecommended && (
                            <span className="text-[8px] bg-neutral-900 text-white px-1 rounded font-bold uppercase shrink-0">
                              ★ REC
                            </span>
                          )}
                          {!isRecommended && hasSynergy && (
                            <span className="text-[8px] bg-neutral-100 text-neutral-900 border border-neutral-300 px-1 rounded font-bold uppercase shrink-0">
                              ⚡ SYNERGY
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-muted-foreground uppercase mt-0.5 tracking-wider font-light truncate">
                          {tech.category} • DIF: {tech.difficultyScore}
                        </span>
                      </button>
                    </DraggableCard>
                  );
                })}
                {filteredTechRegistry.length === 0 && (
                  <div className="col-span-full py-8 text-center text-neutral-400 italic text-[10px]">
                    [NO_COMPATIBLE_TECHNOLOGY_FOUND]
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Architecture Slots (Right Panel) */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-neutral-400 block text-[9px] uppercase tracking-wider">
                {activeTemplate.solutionName.toUpperCase()}_SLOTS (DRAG_HERE):
              </span>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {activeTemplate.slots.map((slot) => {
                  const slottedItem = techStack.find((t) => t.category === slot.id);

                  // Checking category warnings dynamically
                  let warningMessage: string | null = null;
                  if (slottedItem) {
                    const regId = toRegistryId(slottedItem.id);
                    const regItem = TECH_REGISTRY.find((item) => item.id === regId);
                    if (regItem) {
                      const isCompatible = slot.compatibleCategories.includes(regItem.category);
                      if (!isCompatible) {
                        warningMessage = `belongs in other roles!`;
                      }
                    }
                  }

                  const isSelected = selectedSlotId === slot.id;

                  // Render priority badges beautifully
                  const getPriorityBadge = (priority: typeof slot.priority) => {
                    switch (priority) {
                      case 'required':
                        return (
                          <span className="text-[8px] bg-red-100 text-red-700 border border-red-300 px-1 rounded font-bold uppercase shrink-0">
                            REQUIRED
                          </span>
                        );
                      case 'recommended':
                        return (
                          <span className="text-[8px] bg-neutral-100 text-neutral-800 border border-neutral-300 px-1 rounded font-bold uppercase shrink-0">
                            RECOMMENDED
                          </span>
                        );
                      case 'optional':
                      default:
                        return (
                          <span className="text-[8px] text-neutral-400 font-light lowercase italic shrink-0">
                            (optional)
                          </span>
                        );
                    }
                  };

                  return (
                    <div 
                      key={slot.id} 
                      onClick={() => {
                        playMutedClick();
                        setSelectedSlotId(slot.id);
                      }}
                      className={`cursor-pointer transition-all duration-150 rounded-md p-0.5 ${
                        isSelected 
                          ? "ring-1 ring-neutral-900 bg-neutral-50/40" 
                          : "hover:bg-neutral-50/20"
                      }`}
                    >
                      <DropZone
                        id={slot.id}
                        label={slot.label}
                        capacity={1}
                        currentCount={slottedItem ? 1 : 0}
                      >
                        {slottedItem ? (
                          <div className={`p-2 bg-white border rounded-md flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                            warningMessage ? "border-amber-600 bg-amber-50/20" : "border-neutral-900"
                          } ${isSelected ? "ring-1 ring-offset-1 ring-neutral-900" : ""}`}>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-neutral-900 text-[10px] truncate">
                                  {slottedItem.name.toUpperCase()}
                                </span>
                                {getPriorityBadge(slot.priority)}
                              </div>
                              <span className="text-[7.5px] text-muted-foreground uppercase font-light">
                                {slot.label} Connected
                              </span>
                              {warningMessage && (
                                <span className="text-amber-700 font-bold block mt-0.5 text-[7.5px] tracking-wide animate-pulse">
                                  ⚠ MISMATCH: {warningMessage.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent select slot trigger
                                playMutedClick();
                                handleToggleSlottedItem(slottedItem);
                              }}
                              onMouseEnter={playSubtleHover}
                              className="h-5 w-10 font-mono text-[8px] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none shrink-0 ml-2"
                            >
                              EJECT
                            </Button>
                          </div>
                        ) : (
                          <div className={`text-[9.5px] italic text-center py-2 border border-dashed rounded-md transition-all ${
                            isSelected 
                              ? "border-neutral-900 bg-neutral-50 text-neutral-800" 
                              : "border-neutral-200 text-neutral-400 hover:border-neutral-300"
                          }`}>
                            <div className="flex items-center justify-between px-3 w-full">
                              <span className="truncate">{slot.emptyGuidance}</span>
                              {getPriorityBadge(slot.priority)}
                            </div>
                          </div>
                        )}
                      </DropZone>
                    </div>
                  );
                })}
              </div>

              {/* Slot Details Explanation Box */}
              {activeSlotMeta && (
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-md space-y-1 font-sans text-[10px]">
                  <div className="flex items-center justify-between font-mono font-bold text-[9px] uppercase tracking-wider text-neutral-800">
                    <span>⚙ ROLE_DETAILS: {activeSlotMeta.label.toUpperCase()}</span>
                    <span className="text-neutral-400 font-light text-[8px]">
                      ID: {activeSlotMeta.id.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-neutral-600 font-light leading-relaxed">
                    {activeSlotMeta.description}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-[8.5px] font-mono text-neutral-500">
                    <span className="uppercase text-[8px]">COMPATIBLE_LAYERS:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeSlotMeta.compatibleCategories.map((cat) => (
                        <span key={cat} className="px-1 border border-neutral-300 rounded text-neutral-700 bg-white">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </GameplayStageCard>
    </DndContext>
  );
}

// --- Stage 5: USP Phase -----------------------------------------------------

function UspStage() {
  const { usp, setUsp, updateScore } = useGameStore();

  const options = [
    { key: "Fastest", name: "FASTEST_SPEED.EXE", desc: "Build quick compiling prototypes // +18 Feasibility/Execution, -5 Innovation" },
    { key: "Cheapest", name: "CHEAPEST_COST.EXE", desc: "Minimize cloud costs completely // +15 Feasibility/Execution, -5 Design" },
    { key: "Most Scalable", name: "MOST_SCALABLE.EXE", desc: "High baseline server throughput // +12 Feasibility/Execution, +10 PitchPotential" },
    { key: "AI-powered", name: "AI_COPROCESSOR.EXE", desc: "Integrate cognitive search pipelines // +25 Innovation, -5 Design, -5 Execution" },
    { key: "Sustainable", name: "SUSTAINABLE_OFFSET.EXE", desc: "High environmental offset footprint // +20 Innovation, +15 PitchPotential" },
    { key: "Hyper-personalized", name: "HYPER_PERSONALIZED.EXE", desc: "Granular user experience panels // +20 Design, +10 PitchPotential, -5 Execution" },
    { key: "Community-first", name: "COMMUNITY_FIRST.EXE", desc: "High focus on cooperative meshes // +20 PitchPotential, +12 Innovation, -5 Execution" },
  ] as const;

  const handleSelect = (key: typeof options[number]['key']) => {
    setUsp(key);
    
    // Apply immediate hidden score modifier tradeoffs
    const weights = {
      'Fastest': { innovation: 50, execution: 75, design: 55, pitch: 50 },
      'Cheapest': { innovation: 55, execution: 70, design: 50, pitch: 50 },
      'Most Scalable': { innovation: 60, execution: 68, design: 55, pitch: 60 },
      'AI-powered': { innovation: 80, execution: 55, design: 50, pitch: 65 },
      'Sustainable': { innovation: 75, execution: 60, design: 55, pitch: 65 },
      'Hyper-personalized': { innovation: 60, execution: 55, design: 75, pitch: 60 },
      'Community-first': { innovation: 65, execution: 55, design: 60, pitch: 70 },
    }[key];

    updateScore("innovation", weights.innovation);
    updateScore("execution", weights.execution);
    updateScore("design", weights.design);
    updateScore("pitch", weights.pitch);
  };

  useEffect(() => {
    if (!usp) {
      handleSelect("Cheapest");
    }
  }, [usp]);

  return (
    <GameplayStageCard
      stageKey="usp"
      title="Define Unique Selling Prop"
      subtitle="Define your project's competitive advantage. Card choices introduce hidden tradeoffs between Innovation, Execution, and Pitch Potential."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => {
              playMutedClick();
              handleSelect(opt.key);
            }}
            onMouseEnter={playSubtleHover}
            className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
              usp === opt.key
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900 block">{opt.name}</span>
            <span className="text-[9px] text-muted-foreground mt-2 block font-sans font-light leading-relaxed">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 6: Feature Prioritization Phase ----------------------------------

const MOCK_BACKLOG_POOL: Feature[] = [
  { id: "feat-ai", name: "AI Assistant", description: "Secures search logs", effort: "medium", impact: "high" },
  { id: "feat-chat", name: "Interactive Chat", description: "Peer messaging streams", effort: "low", impact: "high" },
  { id: "feat-maps", name: "Campus Maps Grid", description: "Indoor study coordinates", effort: "medium", impact: "medium" },
  { id: "feat-analytics", name: "Emissions Analytics", description: "Live telemetry dashboards", effort: "medium", impact: "high" },
  { id: "feat-game", name: "Study Gamification", description: "Streaks and study locks", effort: "low", impact: "medium" },
  { id: "feat-lead", name: "Emissions Leaderboard", description: "Direct community matches", effort: "low", impact: "medium" },
  { id: "feat-pay", name: "Micro Loans Payments", description: "Secured transactions checkouts", effort: "high", impact: "high" },
  { id: "feat-notif", name: "Urgent Notifications", description: "Offline push channels", effort: "low", impact: "medium" },
  { id: "feat-voice", name: "Local Voice Assistant", description: " Dialect audio synthesizer", effort: "high", impact: "high" },
  { id: "feat-ar", name: "AR Navigation View", description: "Virtual indoor coordinate overlays", effort: "high", impact: "high" },
];

function FeaturesStage() {
  const { reorderFeatures, updateScore, score } = useGameStore();

  const [buckets, setBuckets] = useState<Record<string, 'must' | 'nice' | 'overkill'>>({
    'feat-ai': 'must',
    'feat-chat': 'must',
    'feat-maps': 'nice',
    'feat-analytics': 'nice',
    'feat-game': 'nice',
    'feat-lead': 'overkill',
    'feat-pay': 'overkill',
    'feat-notif': 'nice',
    'feat-voice': 'overkill',
    'feat-ar': 'overkill',
  });

  const recalculateFeatureScores = useCallback((nextBuckets: Record<string, 'must' | 'nice' | 'overkill'>) => {
    let execution = 60;
    let design = 55;
    let innovation = 50;
    let bonus = 0;

    const items = Object.entries(nextBuckets);
    const mustCount = items.filter(([_, b]) => b === 'must').length;

    // 1. Over-scoping penalty
    if (mustCount > 3) {
      execution -= 18;
      design -= 5;
    }
    // 2. Balanced scoping bonus
    if (mustCount === 2 || mustCount === 3) {
      execution += 15;
      design += 10;
      bonus += 5;
    }
    // 3. Smart scoping bonus (placing heavy things in overkill)
    if (nextBuckets['feat-ar'] === 'overkill') {
      execution += 6;
      bonus += 3;
    }
    if (nextBuckets['feat-voice'] === 'overkill') {
      execution += 6;
      bonus += 3;
    }
    // 4. Critical features in must-have
    if (nextBuckets['feat-chat'] === 'must' || nextBuckets['feat-ai'] === 'must') {
      design += 5;
    }

    updateScore("execution", Math.min(execution, 100));
    updateScore("design", Math.min(design, 100));
    updateScore("innovation", Math.min(innovation, 100));
    updateScore("bonus", bonus);
  }, [updateScore]);

  // Click trigger to cycle feature buckets
  const handleCycleBucket = (id: string) => {
    const nextBuckets = { ...buckets };
    const current = nextBuckets[id];
    nextBuckets[id] = current === 'must' ? 'nice' : current === 'nice' ? 'overkill' : 'must';
    
    setBuckets(nextBuckets);
    recalculateFeatureScores(nextBuckets);
    
    // Save flat array of must-have features in Zustand backlog features
    const mustList = MOCK_BACKLOG_POOL.filter(f => nextBuckets[f.id] === 'must');
    reorderFeatures(mustList);
    playSnapSound();
  };

  // Drag and drop end trigger
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const targetBucket = over.id as 'must' | 'nice' | 'overkill';
    const nextBuckets = { ...buckets, [active.id]: targetBucket };

    setBuckets(nextBuckets);
    recalculateFeatureScores(nextBuckets);

    const mustList = MOCK_BACKLOG_POOL.filter(f => nextBuckets[f.id] === 'must');
    reorderFeatures(mustList);
    playSnapSound();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <GameplayStageCard
        stageKey="features"
        title="Backlog Prioritization"
        subtitle="Prioritize product backlogs. Drag cards into scoping buckets or click them to cycle columns. Scope bloat severely penalizes compile execution."
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-4xl mx-auto text-left font-mono text-[11px]">
          {/* Backlog pool (1 col) */}
          <div className="lg:col-span-1 space-y-3">
            <span className="text-neutral-400 block text-[9px] uppercase">BACKLOG_POOL (CLICK_CYCLE):</span>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {MOCK_BACKLOG_POOL.map((feat) => {
                const b = buckets[feat.id];
                return (
                  <DraggableCard key={feat.id} id={feat.id} data={{ ...feat }}>
                    <button
                      onClick={() => handleCycleBucket(feat.id)}
                      onMouseEnter={playSubtleHover}
                      className="w-full text-left p-2.5 bg-white border border-neutral-200 rounded flex flex-col justify-between hover:border-neutral-400 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
                    >
                      <span className="font-bold text-neutral-900 block truncate">{feat.name}</span>
                      <span className="text-[8px] text-muted-foreground mt-1 block uppercase">
                        COL: {b === 'must' ? 'MUST_HAVE' : b === 'nice' ? 'NICE_TO_HAVE' : 'OVERKILL'}
                      </span>
                    </button>
                  </DraggableCard>
                );
              })}
            </div>
          </div>

          {/* 3 Columns Buckets (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-3">
            {(['must', 'nice', 'overkill'] as const).map((col) => {
              const items = MOCK_BACKLOG_POOL.filter(f => buckets[f.id] === col);
              return (
                <DropZone
                  key={col}
                  id={col}
                  label={col === 'must' ? 'Must Have' : col === 'nice' ? 'Nice to Have' : 'Overkill'}
                  currentCount={items.length}
                >
                  <div className="space-y-1.5 min-h-[250px] py-1">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 bg-white border border-neutral-300 rounded flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      >
                        <span className="font-bold text-neutral-800 text-[10px] truncate">{it.name.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </DropZone>
              );
            })}
          </div>
        </div>
      </GameplayStageCard>
    </DndContext>
  );
}

// --- Stage 7: Mentor Phase --------------------------------------------------

function MentorStage() {
  const { techStack, solutionDirection, usp, features, updateScore, activeModifiers } = useGameStore();
  const [isConsulted, setIsConsulted] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  const isMentorLocked = activeModifiers.includes("NO_MENTOR");

  const handleConsult = () => {
    if (isMentorLocked) return;
    setIsConsulted(true);

    const generatedTips: string[] = [];

    // Analyze state to generate highly tailored tips
    // Tip 1: Stack & Solution Direction Match
    const ids = new Set(techStack.map((t) => t.id));
    if (solutionDirection === 'ai-solution' && !ids.has('tech-openai') && !ids.has('tech-gemini')) {
      generatedTips.push("⚠️ STACK_WARN: You are compiling an AI Solution but omitted OpenAI and Gemini API models from your pipeline.");
    } else if (solutionDirection === 'iot-product' && !ids.has('tech-esp32') && !ids.has('tech-arduino')) {
      generatedTips.push("⚠️ STACK_WARN: IoT Hardware products require ESP32/Arduino integration to verify baseline physical compiles.");
    } else {
      generatedTips.push("✅ STACK_ALIGNED: Framework choices display adequate category coverage for your selected project direction.");
    }

    // Tip 2: USP & Stack Match
    if (usp === 'Fastest' && ids.has('tech-aws')) {
      generatedTips.push("⚠️ USP_ALIGN_WARN: Setting 'Fastest' USP while deploying on AWS has latency overheads. Vercel would host faster.");
    } else if (usp === 'Sustainable' && ids.has('tech-next')) {
      generatedTips.push("✅ USP_ALIGNED: Sustainability objectives coupled with Next.js static generation are highly carbon efficient.");
    } else {
      generatedTips.push("💡 USP_TIP: Align unique selling propositions strictly with stack constraints to trigger judge pitch multipliers.");
    }

    // Tip 3: Scoping backlog
    if (features.length > 3) {
      generatedTips.push("⚠️ SCOPE_WARN: Your backlog has severe scope bloat. Consider ejecting features into Overkill to restore Execution.");
    } else {
      generatedTips.push("✅ SCOPE_ALIGNED: Compact Must-Have features secure high baseline feasibility indices. Excellent work.");
    }

    setTips(generatedTips);

    // Apply minor advisor reliance scoring penalty (representative of consult costs)
    updateScore("pitch", Math.max(0, useGameStore.getState().score.pitch - 3));
    updateScore("bonus", useGameStore.getState().score.bonus + 5);
    useGameStore.setState({ mentorHintsUsed: 1 });
    playScoreChord();
  };

  return (
    <GameplayStageCard
      stageKey="mentor"
      title="Consult Mentor Advisor"
      subtitle="Interact with advisors once. Mentors provide context-aware feedback pointing out stack discrepancies, at the expense of a minor pitch penalty."
    >
      <div className="max-w-md mx-auto space-y-5 text-left font-mono text-[11px]">
        {!isConsulted ? (
          <div className="text-center py-6 bg-white border border-neutral-200 rounded-md shadow-sm space-y-4">
            <span className="text-[28px]">{isMentorLocked ? "🚫" : "🧠"}</span>
            <h3 className="font-bold text-neutral-900 uppercase">
              {isMentorLocked ? "ADVISOR_MESH_MUTED" : "ADVISOR_MESH_READY"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-sans font-light">
              {isMentorLocked
                ? "Hardcore mode has offline locked advisor panels. You must proceed strictly without reviews."
                : "Click below to boot the cognitive evaluator. This will analyze your active stack and backlog pipelines."}
            </p>
            <Button
              onClick={() => {
                playMutedClick();
                handleConsult();
              }}
              onMouseEnter={playSubtleHover}
              disabled={isMentorLocked}
              className="font-mono text-xs border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
            >
              {isMentorLocked ? "MENTOR_ACCESS_MUTED" : "RUN_MENTOR_AUDIT.EXE"}
            </Button>
          </div>
        ) : (
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-md text-white shadow-xl space-y-4 leading-relaxed font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-emerald-400 font-bold">COMPILER_MENTOR_AUDIT: DONE</span>
              <span className="text-neutral-500 text-[9px]">[ONE_TIME_USE_EXPIRED]</span>
            </div>

            <div className="space-y-3">
              {tips.map((tip, idx) => (
                <div key={idx} className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[10px] text-neutral-200">
                  {tip}
                </div>
              ))}
            </div>

            <div className="text-[9px] text-neutral-400 pt-2 border-t border-neutral-800 text-center font-sans font-light">
              Audit loaded. Score penalty applied: PITCH -3 pts // COMPILER_BONUS +5 pts.
            </div>
          </div>
        )}
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 8: Business Model Phase ------------------------------------------

function BusinessModelStage() {
  const { businessModel, setBusinessModel, selectedProblem, usp, solutionDirection, updateScore } = useGameStore();

  const options = [
    { id: "Freemium", name: "Freemium Accounts", desc: "Free core profiles with premium upgrades (+Consumer Fit)" },
    { id: "Subscription", name: "SaaS Subscription Tiers", desc: "Operational licensing charges (+Scalable Fit)" },
    { id: "Marketplace", name: "Marketplace Commission", desc: "Peer trade processing percentages (+Market Fit)" },
    { id: "B2B SaaS", name: "B2B SaaS Hubs", desc: "Corporate nodes integration agreements (+Corporate Fit)" },
    { id: "Commission", name: "Transaction Commissions", desc: "Dynamic checkout cuts (+Fintech Fit)" },
    { id: "Government Partnership", name: "Government Sponsorship", desc: "Public carbon offsets sponsorship (+Gov Fit)" },
    { id: "Ads", name: "Ad network grids", desc: "Consumer eyeballs monetization (+Platform Fit)" },
  ] as const;

  const handleSelect = (id: typeof options[number]['id']) => {
    setBusinessModel(id);

    // Contextual operational alignment fit score calculations
    let pitch = 65;
    let execution = 60;

    // Gov fits sustainability / campus problems
    if (id === "Government Partnership" && (selectedProblem?.category === "sustainability" || selectedProblem?.category === "smart-campus")) {
      pitch += 20;
    }
    // B2B SaaS fits Scalable corporate solutions
    if (id === "B2B SaaS" && (usp === "Most Scalable" || selectedProblem?.id === "prob-learnflow")) {
      pitch += 18;
      execution += 5;
    }
    // Freemium fits mobile app directions
    if (id === "Freemium" && solutionDirection === "mobile-app") {
      pitch += 12;
    }

    updateScore("pitch", Math.min(pitch, 100));
    updateScore("execution", Math.min(execution, 100));
  };

  useEffect(() => {
    if (!businessModel) {
      handleSelect("Freemium");
    }
  }, [businessModel]);

  return (
    <GameplayStageCard
      stageKey="businessModel"
      title="Business Model Setup"
      subtitle="Determine the operational business model template. Aligning operational models with problem statements unlocks maximum Pitch grades."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              playMutedClick();
              handleSelect(opt.id);
            }}
            onMouseEnter={playSubtleHover}
            className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
              businessModel === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900 block">{opt.name}</span>
            <span className="text-[9px] text-muted-foreground mt-2 block font-sans font-light leading-relaxed">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 9: Pitch Prep Phase ----------------------------------------------

function PitchPrepStage() {
  const {
    selectedProblem,
    solutionDirection,
    usp,
    techStack,
    features,
    businessModel,
    pitchText,
    setPitchText,
  } = useGameStore();

  const techNames = techStack.map((t) => t.name).join(", ");
  const featureNames = features.map((f) => f.name).join(", ");

  const defaultPitch = `Hello, we are tackling the "${
    selectedProblem?.title || "assigned"
  }" challenge. Our solution is a ${
    solutionDirection || "digital product"
  } engineered to be ${
    usp ? `the "${usp}"` : "highly optimized"
  } version in the market. Powered by a robust stack of ${
    techNames || "modern frameworks"
  }, we deliver value using a ${
    businessModel || "tailored"
  } revenue strategy. This directly solves constraints like "${
    selectedProblem?.constraints?.[0] || "core system complexity"
  }" while leveraging our must-have features: ${
    featureNames || "optimized workflow"
  }.`;

  const talkingPoints = [
    `Engineered using ${techNames || "highly specialized components"} for maximum compiler throughput and scalability.`,
    `Focused competitive advantage centered on the "${usp || "optimized value"}" unique selling proposition.`,
    `Sustainable unit economics backed by a robust ${businessModel || "validated"} monetization loop.`,
  ];

  useEffect(() => {
    if (!pitchText) {
      setPitchText(defaultPitch);
    }
  }, [pitchText, defaultPitch, setPitchText]);

  return (
    <GameplayStageCard
      stageKey="pitchPrep"
      title="Compile Final Pitch"
      subtitle="Synthesize your project choices into an elevator pitch. Customize your pitch statement below to prepare for the jury evaluation panel."
    >
      <div className="max-w-xl mx-auto text-left font-mono text-[11px] space-y-4">
        {/* Dynamic Project Details Monospace summary */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md space-y-2">
          <span className="text-neutral-400 block text-[9px] uppercase border-b border-neutral-200 pb-1 mb-2">PROJECT_MANIFEST.TXT</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-[10px]">
            <div><span className="text-neutral-400">PROBLEM:</span> <span className="text-neutral-900 font-bold">{selectedProblem?.title.toUpperCase()}</span></div>
            <div><span className="text-neutral-400">CATEGORY:</span> <span className="text-neutral-900 font-bold uppercase">{selectedProblem?.category}</span></div>
            <div><span className="text-neutral-400">DIRECTION:</span> <span className="text-neutral-900 font-bold uppercase">{solutionDirection}</span></div>
            <div><span className="text-neutral-400">USP:</span> <span className="text-neutral-900 font-bold uppercase">{usp}</span></div>
            <div><span className="text-neutral-400">MODEL:</span> <span className="text-neutral-900 font-bold uppercase">{businessModel}</span></div>
            <div><span className="text-neutral-400">FEATURES:</span> <span className="text-neutral-900 font-bold">{features.length} IN_BACKLOG</span></div>
          </div>
        </div>

        {/* Dynamic Elevator Pitch Generator */}
        <div className="space-y-1">
          <span className="text-neutral-400 block text-[9px] uppercase">30_SECOND_ELEVATOR_PITCH.SH</span>
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows={5}
            className="w-full p-3 bg-white border border-neutral-900 rounded-md font-sans text-xs text-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none leading-relaxed shadow-inner"
            placeholder="Write your custom elevator pitch..."
          />
        </div>

        {/* Key Talking Points */}
        <div className="space-y-2 border-t border-dashed border-border pt-3">
          <span className="text-neutral-400 block text-[9px] uppercase">KEY_DEMO_TALKING_POINTS.TXT</span>
          <ul className="space-y-1.5">
            {talkingPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-neutral-700 font-sans font-light text-xs">
                <span className="text-neutral-900 font-mono text-[10px] mt-0.5">[{i + 1}]</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 10: Judge Wheel --------------------------------------------------

function JudgeSpinStage() {
  const { currentJudge, setCurrentJudge, judgeSpinState, setJudgeSpinState, nextStage } = useGameStore();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (currentJudge && judgeSpinState === "done") {
      const idx = JUDGES.findIndex((j) => j.id === currentJudge.id);
      if (idx !== -1) {
        const sliceAngle = 360 / JUDGES.length;
        setRotation(360 - (idx * sliceAngle + sliceAngle / 2));
      }
    }
  }, [currentJudge, judgeSpinState]);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setJudgeSpinState("spinning");
    playMutedClick();

    const randomIndex = Math.floor(Math.random() * JUDGES.length);
    const selected = JUDGES[randomIndex];

    const sliceAngle = 360 / JUDGES.length;
    const spins = 6;
    const targetAngle = spins * 360 + (360 - (randomIndex * sliceAngle + sliceAngle / 2));
    
    setRotation(targetAngle);

    // Dynamic, decelerating mechanical spin click ticks
    let activeSpin = true;
    const playSpinTicks = () => {
      let tickDelay = 25; // fast start
      const maxDelay = 300; // slow limit
      
      const tick = () => {
        if (!activeSpin) return;
        playWheelSpinClick();
        tickDelay *= 1.14; // decelerate exponentially
        if (tickDelay < maxDelay) {
          setTimeout(tick, tickDelay);
        }
      };
      setTimeout(tick, tickDelay);
    };
    playSpinTicks();

    setTimeout(() => {
      activeSpin = false;
      setSpinning(false);
      setJudgeSpinState("done");
      setCurrentJudge(selected);
      playSnapSound(); // tactile snap land!
    }, 2500);
  };

  return (
    <GameplayStageCard
      stageKey="judgeSpin"
      title="Spin Judge Wheel"
      subtitle="Engage the jury selector roulette. A randomized, expert judge profile will be selected to grade your project manifest."
    >
      <div className="max-w-md mx-auto flex flex-col items-center justify-center font-mono text-[11px] space-y-6">
        {/* SVG Wheel Roulette Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Top Pointer */}
          <div className="absolute -top-2 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-neutral-900 drop-shadow-sm" />

          {/* SVG Circle Wheel */}
          <div
            className="w-full h-full rounded-full border-2 border-neutral-900 overflow-hidden shadow-md bg-white"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 2.5s cubic-bezier(0.15, 0.85, 0.35, 1)" : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {JUDGES.map((jg, idx) => {
                const angle = 360 / JUDGES.length;
                const startAngle = idx * angle;
                const endAngle = (idx + 1) * angle;

                const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                  return {
                    x: centerX + radius * Math.cos(angleInRadians),
                    y: centerY + radius * Math.sin(angleInRadians),
                  };
                };

                const start = polarToCartesian(100, 100, 96, startAngle);
                const end = polarToCartesian(100, 100, 96, endAngle);
                const largeArcFlag = angle <= 180 ? "0" : "1";

                const d = [
                  "M", 100, 100,
                  "L", start.x, start.y,
                  "A", 96, 96, 0, largeArcFlag, 1, end.x, end.y,
                  "Z"
                ].join(" ");

                const fillColor = idx % 2 === 0 ? "#ffffff" : "#f4f4f5";
                const textAngle = startAngle + angle / 2 - 90;
                const textPos = polarToCartesian(100, 100, 60, startAngle + angle / 2);

                return (
                  <g key={jg.id} className="select-none">
                    <path
                      d={d}
                      fill={fillColor}
                      stroke="#171717"
                      strokeWidth="1.5"
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      transform={`rotate(${textAngle + 90}, ${textPos.x}, ${textPos.y})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-mono text-[9px] font-bold fill-neutral-900"
                    >
                      {jg.avatar} {jg.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="16" fill="#171717" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Control Button / Selection Info */}
        <div className="w-full text-center space-y-4">
          {judgeSpinState === "idle" && (
            <Button
              onClick={spinWheel}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 w-full max-w-[200px] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
            >
              ⚡ SPIN_ROULETTE.EXE
            </Button>
          )}

          {judgeSpinState === "spinning" && (
            <div className="text-xs text-muted-foreground animate-pulse py-2">
              🎲 SHUFFLING_JURY_CHANNELS...
            </div>
          )}

                    {judgeSpinState === "done" && currentJudge && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md w-full text-left space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentJudge.avatar}</span>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase">SELECTED_JUDGE:</span>
                  <span className="font-bold text-neutral-900 text-sm uppercase">{currentJudge.name}</span>
                  <span className="text-[10px] text-muted-foreground block font-sans font-light leading-none mt-0.5">{currentJudge.title}</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-border pt-2 text-[10px] text-neutral-600 font-sans font-light leading-relaxed">
                Expertise: {currentJudge.expertise.join(", ")}
              </div>
              
              <Button
                onClick={() => {
                  playMutedClick();
                  nextStage();
                }}
                onMouseEnter={playSubtleHover}
                className="font-mono text-xs border border-neutral-900 w-full mt-2 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
              >
                SUBMIT_TO_JURY.SH
              </Button>
            </div>
          )}
        </div>
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 11: Dynamic Judging Engine ----------------------------------------

function JudgingStage() {
  const {
    currentJudge,
    score,
    techStack,
    usp,
    solutionDirection,
    businessModel,
    features,
    mentorHintsUsed,
    addJudgeFeedback,
    judgeFeedback,
    nextStage,
    activeModifiers,
    gameMode,
  } = useGameStore();

  const [loadingStep, setLoadingStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [evaluationComplete, setEvaluationComplete] = useState(false);

  const stagedSteps = [
    {
      key: "architecture",
      label: "Reviewing Architecture",
      getLog: () => {
        const techs = techStack.map(t => t.name).join(", ");
        return `Scanning tech stack: [${techs || "None Selected"}]. Checking framework synergies...`;
      }
    },
    {
      key: "scope",
      label: "Validating Scope",
      getLog: () => {
        const must = features.length;
        return `Auditing prioritized backlog components. Found ${must} scoped features...`;
      }
    },
    {
      key: "business",
      label: "Assessing Business Fit",
      getLog: () => {
        return `Matching positioning: "${usp || "N/A"}" combined with "${businessModel || "N/A"}" monetization...`;
      }
    },
    {
      key: "execution",
      label: "Evaluating Execution",
      getLog: () => {
        return `Integrating ${currentJudge?.name || "Evaluator"}'s specialized weights and parameters...`;
      }
    }
  ];

  useEffect(() => {
    if (evaluationComplete || !currentJudge) return;

    let step = 0;
    playWheelSpinClick(); // initial tick
    const interval = setInterval(() => {
      if (step < 3) {
        setCompletedSteps(prev => [...prev, stagedSteps[step].key]);
        step++;
        setLoadingStep(step);
        playWheelSpinClick();
      } else {
        setCompletedSteps(["architecture", "scope", "business", "execution"]);
        clearInterval(interval);
        performEvaluation();
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [currentJudge]);

  const performEvaluation = () => {
    if (!currentJudge) return;

    const weights = currentJudge.scoringWeights;
    const baseInnovation = score.innovation;
    const baseExecution = score.execution;
    const baseDesign = score.design;
    const basePitch = score.pitch;

    let finalInnovation = baseInnovation;
    let finalExecution = baseExecution;
    let finalDesign = baseDesign;
    let finalPitch = basePitch;
    let finalBonus = score.bonus;

    const techIds = new Set(techStack.map((t) => t.id));

    // Evaluate Modifiers tradeoffs
    activeModifiers.forEach((modId) => {
      switch (modId) {
        case "NO_AI_TOOLS":
          if (techIds.has("tech-openai") || techIds.has("tech-gemini") || usp === "AI-powered") {
            finalInnovation = Math.max(0, finalInnovation - 25);
            finalExecution = Math.max(0, finalExecution - 15);
          }
          break;
        case "BOOTSTRAP_ONLY":
          if (techIds.has("tech-aws") || techIds.has("tech-postgres")) {
            finalExecution = Math.max(0, finalExecution - 20);
          }
          break;
        case "MOBILE_ONLY":
          if (solutionDirection !== "mobile-app") {
            finalExecution = Math.max(0, finalExecution - 25);
          }
          break;
        case "WEB_ONLY":
          if (solutionDirection !== "web-app") {
            finalExecution = Math.max(0, finalExecution - 25);
          }
          break;
        case "AI_ONLY":
          if (solutionDirection !== "ai-solution") {
            finalExecution = Math.max(0, finalExecution - 25);
          }
          break;
        case "LIMITED_BUDGET":
          finalExecution = Math.max(0, finalExecution - 15);
          break;
        case "GREEN_FIRST":
          if (usp === "Sustainable" || businessModel === "Government Partnership") {
            finalBonus += 15;
          }
          break;
        case "USER_SENSITIVE":
          if (finalDesign >= 80) {
            finalDesign = Math.min(100, finalDesign + 15);
          } else {
            finalDesign = Math.max(0, finalDesign - 25);
          }
          break;
        case "TECH_WIZARD":
          finalBonus += score.bonus;
          break;
        case "FAST_SHIP":
          if (features.length > 2) {
            finalExecution = Math.max(0, finalExecution - 20);
          }
          break;
        case "NO_MENTOR":
          if (mentorHintsUsed > 0) {
            finalPitch = Math.max(0, finalPitch - 30);
          }
          break;
        case "OPEN_SOURCE":
          finalInnovation = Math.max(0, finalInnovation - 15);
          break;
        case "MONETIZE_NOW":
          if (businessModel === "Freemium" || businessModel === "Ads") {
            finalPitch = Math.max(0, finalPitch - 20);
          }
          break;
        case "SECURITY_FIRST":
          if (!techIds.has("tech-supabase") || !techIds.has("tech-postgres")) {
            finalExecution = Math.max(0, finalExecution - 20);
          }
          break;
        case "MINIMALIST":
          if (features.length !== 2) {
            finalDesign = Math.max(0, finalDesign - 15);
          }
          break;
        case "CLOUD_NATIVE":
          if (!techIds.has("tech-vercel") || !techIds.has("tech-aws")) {
            finalInnovation = Math.max(0, finalInnovation - 15);
          }
          break;
        case "ACCESSIBILITY_MANDATE":
          finalDesign = Math.max(0, finalDesign - 15);
          break;
      }
    });

    let weightedScore =
      finalInnovation * weights.innovation +
      finalExecution * weights.execution +
      finalDesign * weights.design +
      finalPitch * weights.pitch;

    if (currentJudge.id === "judge-chaos") {
      const chaosOffset = Math.floor(Math.random() * 41) - 20; // -20 to +20
      weightedScore += chaosOffset;
    }

    let finalScoreVal = weightedScore + finalBonus;

    // Hardcore judging penalty (multiplier 0.85)
    const isHardcore = activeModifiers.includes("HARDCORE_JUDGE") || gameMode === "hardcore";
    if (isHardcore) {
      finalScoreVal = finalScoreVal * 0.85;
    }

    finalScoreVal = Math.max(0, Math.min(finalScoreVal, 100));

    const derivedStrengths: string[] = [];
    const derivedWeaknesses: string[] = [];

    if (techIds.has("tech-next") && techIds.has("tech-vercel")) {
      derivedStrengths.push("Excellent Next.js + Vercel deployment infrastructure synergy.");
    }
    if ((techIds.has("tech-openai") || techIds.has("tech-gemini")) && techIds.has("tech-next")) {
      derivedStrengths.push("Cutting-edge integration of AI models with responsive frontend frameworks.");
    }
    if (techIds.has("tech-esp32") && techIds.has("tech-arduino")) {
      derivedStrengths.push("High-fidelity matching of physical IoT boards with core IDE compilers.");
    }
    if (techIds.has("tech-supabase") && techIds.has("tech-postgres")) {
      derivedStrengths.push("Robust scalable database architecture matching PostgreSQL latency speeds.");
    }

    if (features.length === 2 || features.length === 3) {
      derivedStrengths.push("Extremely lean and disciplined product scoping boundary rules.");
    } else if (features.length > 3) {
      derivedWeaknesses.push("Severe product scope bloat. Team tried compiling too many Must-Have components.");
    } else if (features.length < 2) {
      derivedWeaknesses.push("Under-scoped roadmap. MVP fails to meet baseline hackathon requirements.");
    }

    const selectedProb = useGameStore.getState().selectedProblem;
    if (businessModel === "Government Partnership" && (selectedProb?.category === "sustainability" || selectedProb?.category === "smart-campus")) {
      derivedStrengths.push("Outstanding strategic fit matching public sponsorship with carbon offset problems.");
    }
    if (businessModel === "B2B SaaS" && (usp === "Most Scalable" || selectedProb?.id === "prob-learnflow")) {
      derivedStrengths.push("Excellent monetization alignment combining high-scale hosting with corporate licensing.");
    }

    if (solutionDirection === "ai-solution" && !techIds.has("tech-openai") && !techIds.has("tech-gemini")) {
      derivedWeaknesses.push("Critical stack gap: Selected AI Solution direction but failed to integrate large language models.");
    }
    if (solutionDirection === "iot-product" && !techIds.has("tech-esp32") && !techIds.has("tech-arduino")) {
      derivedWeaknesses.push("Critical stack gap: Selected IoT Hardware direction but failed to allocate microcontrollers.");
    }

    if (usp === "Fastest" && techIds.has("tech-aws")) {
      derivedWeaknesses.push("Deployment latency overhead: Chosen AWS servers contradict the extreme speed USP.");
    }

    if (mentorHintsUsed > 0) {
      derivedWeaknesses.push("Mentor advisor reliance: Small penalty assessed for consultation reliance.");
    }

    if (derivedStrengths.length < 2) {
      derivedStrengths.push("Consistent architectural execution boundaries.");
      derivedStrengths.push("Clear strategic path outlining MVP focus areas.");
    }
    if (derivedWeaknesses.length < 2) {
      derivedWeaknesses.push("Slight optimization room left in the core query pipeline.");
      derivedWeaknesses.push("Monetization channels could benefit from extra community validation.");
    }

    const finalStrengths = derivedStrengths.slice(0, 2);

    // Call our new generated feedback comments database
    const feedbackResult = generateJudgeFeedback(currentJudge.id, finalScoreVal, {
      techStack,
      features,
      usp,
      businessModel,
      problem: selectedProb,
      solutionDirection,
    });

    const highlight = finalStrengths[0];

    addJudgeFeedback({
      judgeId: currentJudge.id,
      score: finalScoreVal,
      comment: feedbackResult.comment,
      highlight,
    });

    // Record results and update stats
    useGameStore.getState().updateStats(finalScoreVal);
    playScoreChord(); // trigger dynamic score chord!
    setEvaluationComplete(true);
  };

  return (
    <GameplayStageCard
      stageKey="judging"
      title="Jury Evaluation"
      subtitle="The selected judge is evaluating your project manifest under the compiler lens."
    >
      <div className="max-w-md mx-auto text-left font-mono text-[11px] space-y-4">
        {!evaluationComplete ? (
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-md text-white shadow-xl space-y-4 leading-relaxed font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-amber-400 font-bold animate-pulse">COMPILER_EVALUATION_IN_PROGRESS</span>
              <span className="text-neutral-500 text-[9px]">[STAGED_REVIEW]</span>
            </div>

            <div className="space-y-3 py-1 font-mono text-[10px]">
              {stagedSteps.map((step, idx) => {
                const isActive = loadingStep === idx;
                const isDone = completedSteps.includes(step.key);
                return (
                  <div key={step.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={isDone ? "text-emerald-400 font-bold" : isActive ? "text-amber-400 animate-pulse font-bold" : "text-neutral-600"}>
                          {isDone ? "[✓]" : isActive ? "[▶]" : "[ ]"}
                        </span>
                        <span className={isDone ? "text-neutral-105 font-bold" : isActive ? "text-amber-300 font-bold animate-pulse" : "text-neutral-500"}>
                          {step.label.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500">
                        {isDone ? "COMPLETE" : isActive ? "PARSING..." : "QUEUED"}
                      </span>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="pl-6 text-[9px] text-neutral-400 italic leading-normal"
                      >
                        &gt; {step.getLog()}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white border border-neutral-300 rounded-md shadow-sm space-y-4 leading-relaxed">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
              <span className="text-3xl">{currentJudge?.avatar}</span>
              <div>
                <span className="text-neutral-400 block text-[8px] uppercase font-bold">EVALUATOR:</span>
                <span className="font-bold text-neutral-900 text-xs uppercase">{currentJudge?.name}</span>
                <span className="text-[9px] text-neutral-500 block font-sans font-light">{currentJudge?.title}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-neutral-400 block text-[8px] uppercase font-bold">JURY_FEEDBACK_COMMENT:</span>
              <p className="text-[11px] text-neutral-800 font-sans italic bg-neutral-50 p-3 border border-neutral-200 rounded leading-relaxed">
                "{judgeFeedback[judgeFeedback.length - 1]?.comment}"
              </p>
            </div>

            <div className="p-2.5 bg-neutral-900 border border-neutral-900 rounded text-center text-white">
              <span className="text-[9px] text-neutral-400 block uppercase font-mono tracking-wider mb-0.5">COMPUTED_SCORE_INDEX</span>
              <span className="text-2xl font-black">{judgeFeedback[judgeFeedback.length - 1]?.score}/100</span>
            </div>

            <Button
              onClick={() => {
                playMutedClick();
                nextStage();
              }}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 w-full focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
            >
              LOAD_RESULTS_DASHBOARD.SH
            </Button>
          </div>
        )}
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 12: Final Results & Achievements ----------------------------------

const ACHIEVEMENTS_LIST = [
  { id: "scope-master", name: "Scope Master", desc: "Must-Have features count: 2 or 3" },
  { id: "startup-brain", name: "Startup Brain", desc: "Monetization matches Problem type" },
  { id: "technical-wizard", name: "Technical Wizard", desc: "Activate >= 2 stack synergies" },
  { id: "judge-favorite", name: "Judge Favorite", desc: "Earn score of >= 90/100" },
  { id: "speed-builder", name: "Speed Builder", desc: "Choose extreme Fastest USP" },
  { id: "ai-pioneer", name: "AI Pioneer", desc: "Combine AI models with AI USP" },
  { id: "chaos-survivor", name: "Chaos Survivor", desc: "Faced >= 2 negative events & survived" },
{ id: "frugal-founder", name: "Frugal Founder", desc: "Freemium plus Cheapest USP" },
  { id: "lean-mean", name: "Lean & Mean", desc: "2 features, small stack (<= 3 items)" },
  { id: "omniscient", name: "Omniscient", desc: "Used the mentor advisor audit" },
  { id: "crisis-manager", name: "Crisis Manager", desc: "Resolved >= 2 negative events & score >= 80" },
  { id: "lucky-builder", name: "Lucky Builder", desc: "Faced >= 1 lucky break & score >= 85" },
  { id: "pivot-master", name: "Pivot Master", desc: "Executed a last-minute project pivot" },
];

function ResultsStage() {
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
    unlockAchievement,
    resetGame,
    chaosHistory,
    gameMode,
    difficulty,
    activeModifiers,
    score,
  } = useGameStore();

  const [copied, setCopied] = useState(false);

  // Startup PRD Generator States
  const [isPrdModalOpen, setIsPrdModalOpen] = useState(false);
  const [prdLoadingStep, setPrdLoadingStep] = useState(0);
  const [compiledPrd, setCompiledPrd] = useState("");
  const [prdCopied, setPrdCopied] = useState(false);

  const prdLogs = [
    "INITIALIZING_STARTUP_COMPILER_V1.0...",
    "EXTRACTING_DECISIONS_MANIFEST...",
    "COMPILING_ARCHETYPE_METRICS...",
    "RESOLVING_TECH_COMPATIBILITY_LAYERS...",
    "INTEGRATING_USP_VALUE_LOOPS...",
    "SIMULATING_MONETIZATION_ECONOMICS...",
    "ASSESSING_CHAOS_FALLBACK_RISKS...",
    "GENERATING_VENTURE_PRD_MARKDOWN...",
    "COMPILATION_SUCCESSFUL."
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
      playSnapSound();
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
    playSnapSound();
  };

  const feedback = judgeFeedback[judgeFeedback.length - 1];
  const finalScore100 = feedback?.score || 0;
  const displayScore = (finalScore100 / 2).toFixed(1);

  const getGrade = (score: number) => {
    if (score >= 94) return "S";
    if (score >= 84) return "A";
    if (score >= 72) return "B";
    if (score >= 60) return "C";
    if (score >= 48) return "D";
    return "F";
  };
  const grade = getGrade(finalScore100);

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

  const archetype = classifyProjectArchetype({
    techStack,
    features,
    usp,
    businessModel,
    solutionDirection,
  });

  // Run achievement checks when results mount
  useEffect(() => {
    if (!feedback) return;

    const countBefore = useGameStore.getState().unlockedAchievements.length;

    // 1. Scope Master
    if (features.length === 2 || features.length === 3) {
      unlockAchievement("scope-master");
    }

    // 2. Startup Brain
    let startupBrainSynergy = false;
    if (businessModel === "Government Partnership" && (selectedProblem?.category === "sustainability" || selectedProblem?.category === "smart-campus")) {
      startupBrainSynergy = true;
    }
    if (businessModel === "B2B SaaS" && (usp === "Most Scalable" || selectedProblem?.id === "prob-learnflow")) {
      startupBrainSynergy = true;
    }
    if (businessModel === "Freemium" && solutionDirection === "mobile-app") {
      startupBrainSynergy = true;
    }
    if (startupBrainSynergy) {
      unlockAchievement("startup-brain");
    }

    // 3. Technical Wizard
    const ids = new Set(techStack.map((t) => t.id));
    let synergiesCount = 0;
    if (ids.has("tech-next") && ids.has("tech-vercel")) synergiesCount++;
    if ((ids.has("tech-openai") || ids.has("tech-gemini")) && ids.has("tech-next")) synergiesCount++;
    if (ids.has("tech-esp32") && ids.has("tech-arduino")) synergiesCount++;
    if (ids.has("tech-supabase") && ids.has("tech-postgres")) synergiesCount++;
    if (synergiesCount >= 2) {
      unlockAchievement("technical-wizard");
    }

    // 4. Judge Favorite
    if (finalScore100 >= 90) {
      unlockAchievement("judge-favorite");
    }

    // 5. Speed Builder
    if (usp === "Fastest") {
      unlockAchievement("speed-builder");
    }

    // 6. AI Pioneer
    if (usp === "AI-powered" && (ids.has("tech-openai") || ids.has("tech-gemini"))) {
      unlockAchievement("ai-pioneer");
    }

    // 7. Chaos Survivor
    const triggeredEvents = CHAOS_EVENTS.filter(e => chaosHistory.includes(e.id));
    const resolvedNegativeCount = triggeredEvents.filter(e => e.category === 'technical' || e.category === 'team').length;
    const resolvedLuckyCount = triggeredEvents.filter(e => e.category === 'lucky').length;

    if ((currentJudge?.id === "judge-chaos" && finalScore100 >= 70) || resolvedNegativeCount >= 2) {
      unlockAchievement("chaos-survivor");
    }

    // 8. Frugal Founder
    if (usp === "Cheapest" && businessModel === "Freemium") {
      unlockAchievement("frugal-founder");
    }

    // 9. Lean & Mean
    if (features.length === 2 && techStack.length <= 3) {
      unlockAchievement("lean-mean");
    }

    // 10. Omniscient
    if (mentorHintsUsed > 0) {
      unlockAchievement("omniscient");
    }

    // 11. Crisis Manager
    if (resolvedNegativeCount >= 2 && finalScore100 >= 80) {
      unlockAchievement("crisis-manager");
    }

    // 12. Lucky Builder
    if (resolvedLuckyCount >= 1 && finalScore100 >= 85) {
      unlockAchievement("lucky-builder");
    }

    // 13. Pivot Master
    if (chaosHistory.includes("team-pivot-executed")) {
      unlockAchievement("pivot-master");
    }

    // Compare count after evaluation to play sound!
    setTimeout(() => {
      const countAfter = useGameStore.getState().unlockedAchievements.length;
      if (countAfter > countBefore) {
        playUnlockArpeggio();
      }
    }, 80);
  }, [feedback, unlockAchievement, chaosHistory, currentJudge, finalScore100]);

  const getStrengthsAndWeaknesses = () => {
    const derivedStrengths: string[] = [];
    const derivedWeaknesses: string[] = [];

    const techIds = new Set(techStack.map((t) => t.id));
    if (techIds.has("tech-next") && techIds.has("tech-vercel")) {
      derivedStrengths.push("Excellent Next.js + Vercel deployment infrastructure synergy.");
    }
    if ((techIds.has("tech-openai") || techIds.has("tech-gemini")) && techIds.has("tech-next")) {
      derivedStrengths.push("Cutting-edge integration of AI models with Next.js frontend.");
    }
    if (techIds.has("tech-esp32") && techIds.has("tech-arduino")) {
      derivedStrengths.push("High-fidelity matching of physical IoT boards with compilers.");
    }
    if (techIds.has("tech-supabase") && techIds.has("tech-postgres")) {
      derivedStrengths.push("Robust database architecture matching PostgreSQL latency speeds.");
    }

    if (features.length === 2 || features.length === 3) {
      derivedStrengths.push("Extremely lean and disciplined product scoping boundary rules.");
    } else if (features.length > 3) {
      derivedWeaknesses.push("Severe product scope bloat. Team tried compiling too many components.");
    } else if (features.length < 2) {
      derivedWeaknesses.push("Under-scoped roadmap. MVP fails to meet baseline requirements.");
    }

    if (businessModel === "Government Partnership" && (selectedProblem?.category === "sustainability" || selectedProblem?.category === "smart-campus")) {
      derivedStrengths.push("Outstanding strategic fit matching public sponsorship with offsets problem.");
    }
    if (businessModel === "B2B SaaS" && (usp === "Most Scalable" || selectedProblem?.id === "prob-learnflow")) {
      derivedStrengths.push("Excellent monetization alignment combining B2B SaaS licensing with scale.");
    }

    if (solutionDirection === "ai-solution" && !techIds.has("tech-openai") && !techIds.has("tech-gemini")) {
      derivedWeaknesses.push("Critical stack gap: AI Solution direction without AI models.");
    }
    if (solutionDirection === "iot-product" && !techIds.has("tech-esp32") && !techIds.has("tech-arduino")) {
      derivedWeaknesses.push("Critical stack gap: IoT Hardware direction without microcontrollers.");
    }

    if (usp === "Fastest" && techIds.has("tech-aws")) {
      derivedWeaknesses.push("Deployment latency: AWS servers contradict Fastest USP.");
    }

    if (mentorHintsUsed > 0) {
      derivedWeaknesses.push("Mentor advisor reliance: Assessment penalty for auditor reliance.");
    }

    if (derivedStrengths.length < 2) {
      derivedStrengths.push("Consistent architectural execution boundaries.");
      derivedStrengths.push("Clear strategic path outlining MVP focus areas.");
    }
    if (derivedWeaknesses.length < 2) {
      derivedWeaknesses.push("Slight optimization room left in the core query pipeline.");
      derivedWeaknesses.push("Monetization channels could benefit from extra validation.");
    }

    return {
      strengths: derivedStrengths.slice(0, 2),
      weaknesses: derivedWeaknesses.slice(0, 2),
    };
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses();

  const generateAsciiCard = () => {
    const divider = "+------------------------------------------+";
    const borderTop = divider;
    const borderBottom = divider;
    
    const formatLine = (label: string, value: string) => {
      const lineContent = `| ${label}: ${value}`;
      const padding = 42 - lineContent.length;
      return lineContent + " ".repeat(Math.max(0, padding)) + " |";
    };

    return [
      borderTop,
      formatLine("THE HACKATHON SIMULATOR", "v1.2"),
      divider,
      formatLine("PROBLEM", selectedProblem?.title.toUpperCase() || "N/A"),
      formatLine("DIRECTION", (solutionDirection || "N/A").toUpperCase()),
      formatLine("ARCHETYPE", archetype.name.toUpperCase()),
      formatLine("USP", (usp || "N/A").toUpperCase()),
      formatLine("MODEL", (businessModel || "N/A").toUpperCase()),
      divider,
      formatLine("JUDGE", (currentJudge?.name || "N/A").toUpperCase()),
      formatLine("FINAL SCORE", `${displayScore}/50 (GRADE ${grade})`),
      divider,
      formatLine("ACHIEVEMENTS", `${unlockedAchievements.length}/13 UNLOCKED`),
      borderBottom
    ].join("\n");
  };

  const copyToClipboard = () => {
    const cardText = generateAsciiCard();
    navigator.clipboard.writeText(cardText).then(() => {
      setCopied(true);
      playSnapSound();
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <GameplayStageCard
      stageKey="results"
      title="Hackathon Results"
      subtitle="Jury evaluation complete. Review your archetype metrics, specialist feedback, and unlocked achievements."
    >
      <div className="max-w-2xl mx-auto text-left font-mono text-[11px] space-y-6">
        
        {/* Results Main Banner Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-neutral-900 border border-neutral-900 rounded text-center text-white flex flex-col justify-center shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-1 font-bold">FINAL_SCORE_INDEX</span>
            <span className="text-3xl font-black">{displayScore} <span className="text-xs font-normal text-neutral-400">/ 50</span></span>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded text-center flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-2">LETTER_GRADE</span>
            <motion.div
              initial={{ scale: 3.5, rotate: -35, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 10, delay: 0.3 }}
              className="px-4 py-1.5 border-2 border-double border-neutral-900 text-neutral-900 font-mono text-2xl font-black uppercase tracking-wider rounded select-none shadow-[2px_2px_0px_#1e1e1e]"
            >
              {grade}
            </motion.div>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded text-center flex flex-col justify-center shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-1">JURY_VERDICT</span>
            <span className="text-xs font-bold text-neutral-800 uppercase truncate">
              {finalScore100 >= 70 ? "✅ PROJECT APPROVED" : "❌ COMPILE FAILED"}
            </span>
          </div>
        </div>

        {/* Project Archetype Card */}
        <div className="border-2 border-double border-neutral-900 p-5 bg-white space-y-4 shadow-sm select-none">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">PROJECT_ARCHETYPE_CLASSIFICATION</span>
            <span className="text-[8px] bg-neutral-900 text-white font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {archetype.id}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] text-neutral-400 block uppercase font-mono tracking-tight leading-none font-bold">ARCHETYPE CATEGORY</span>
            <h3 className="text-lg font-black uppercase text-neutral-900 leading-none">{archetype.name}</h3>
            <span className="text-[10px] text-neutral-500 font-sans italic block mt-0.5">{archetype.subtitle}</span>
          </div>

          <p className="text-[11px] text-neutral-600 font-sans font-light leading-relaxed">
            {archetype.description}
          </p>

          <div className="border-t border-dashed border-neutral-200 pt-3 space-y-2.5">
            <span className="text-[8px] text-neutral-400 block uppercase font-bold tracking-wider mb-1">ARCHETYPE COMPILER METRICS</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-[9px]">
              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>TECHNICAL DEPTH:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.techDepth}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.techDepth}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>BUSINESS ACUTENESS:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.businessAcuteness}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.businessAcuteness}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>DESIGN FINESSE:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.designFinesse}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.designFinesse}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>SHIPPING SCRAPPINESS:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.shippingScrappiness}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.shippingScrappiness}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Run Summary metadata card */}
        <div className="p-4 bg-stone-50 border border-neutral-200 rounded text-left font-mono text-[10px] space-y-2 select-none relative overflow-hidden shadow-sm">
          <div className="absolute top-1 right-2 text-[8px] text-neutral-300 font-bold">RUN_SUMMARY_MANIFEST</div>
          <span className="text-neutral-400 block text-[8px] uppercase border-b border-neutral-200 pb-1 mb-2 font-bold">RUN SUMMARY</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 text-[10px]">
            <div><span className="text-neutral-400">PLAY MODE:</span> <span className="text-neutral-900 font-bold uppercase">{gameMode}</span></div>
            <div><span className="text-neutral-400">DIFFICULTY:</span> <span className="text-neutral-900 font-bold uppercase">{difficulty || "N/A"}</span></div>
            <div><span className="text-neutral-400">CHAOS EVENTS:</span> <span className="text-neutral-900 font-bold uppercase">
              {CHAOS_EVENTS.filter((e) => chaosHistory.includes(e.id) && (e.category === "technical" || e.category === "team")).length}
            </span></div>
            <div><span className="text-neutral-400">MENTOR USED:</span> <span className="text-neutral-900 font-bold uppercase">{mentorHintsUsed > 0 ? "YES" : "NO"}</span></div>
            <div><span className="text-neutral-400">JURY EVALUATOR:</span> <span className="text-neutral-900 font-bold uppercase">{currentJudge?.name || "N/A"}</span></div>
            <div>
              <span className="text-neutral-400 block">ACTIVE MODIFIERS:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeModifiers && activeModifiers.length > 0 ? (
                  activeModifiers.map((modId) => {
                    const mod = MODIFIERS.find(m => m.id === modId);
                    return (
                      <span key={modId} className="bg-white border border-neutral-250 px-1 py-0.5 rounded text-[8px] uppercase text-neutral-600 font-bold">
                        {mod?.name || modId}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-neutral-400 italic">[NONE]</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-neutral-200 pt-4">
          <div className="space-y-2">
            <span className="text-emerald-600 block text-[9px] uppercase font-bold">+++ PROJECT_STRENGTHS:</span>
            <ul className="space-y-1.5">
              {strengths.map((str, idx) => (
                <li key={idx} className="flex gap-2 text-neutral-800 font-sans font-light text-[11px]">
                  <span className="text-emerald-600 font-mono text-[9px] mt-0.5">[+]</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-rose-600 block text-[9px] uppercase font-bold">--- PROJECT_WEAKNESSES:</span>
            <ul className="space-y-1.5">
              {weaknesses.map((wk, idx) => (
                <li key={idx} className="flex gap-2 text-neutral-800 font-sans font-light text-[11px]">
                  <span className="text-rose-600 font-mono text-[9px] mt-0.5">[-]</span>
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Judge Quote of the Run Card */}
        {currentJudge && (
          <div className="p-5 bg-neutral-50 border border-neutral-300 rounded-md relative select-none shadow-[0_1px_3px_rgba(0,0,0,0.015)] overflow-hidden space-y-4">
            <div className="absolute -top-3 -right-2 text-7xl text-neutral-200/50 font-serif pointer-events-none select-none">
              "
            </div>
            
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">JURY_QUOTE_OF_THE_RUN</span>
              <span className="text-[8px] font-sans text-neutral-500 uppercase font-bold">MEMO // {currentJudge.personality}</span>
            </div>

            <p className="text-xs text-neutral-850 font-sans italic relative z-10 leading-relaxed pt-1 select-text">
              "{feedback?.comment}"
            </p>

            <div className="flex items-center gap-2.5 pt-2 border-t border-dashed border-neutral-200">
              <span className="text-2xl">{currentJudge.avatar}</span>
              <div>
                <span className="font-bold text-neutral-900 text-[10px] uppercase block leading-none mb-1">{currentJudge.name}</span>
                <span className="text-[8px] text-neutral-500 font-sans font-light block leading-none">{currentJudge.title}</span>
              </div>
            </div>
          </div>
        )}

        {/* Startup PRD Generator Section */}
        {(() => {
          const isQualified = (grade === "S" || grade === "A" || grade === "B") && finalScore100 >= 72;
          return (
            <div className={`p-5 bg-white space-y-4 shadow-sm select-none relative overflow-hidden transition-all duration-300 ${
              isQualified ? "border-2 border-double border-neutral-900" : "border border-dashed border-neutral-300 opacity-80"
            }`}>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">STARTUP_ACCELERATION_GATES</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isQualified ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-500"
                }`}>
                  {isQualified ? "VENTURE QUALIFIED" : "🔒 LOCKED"}
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h3 className={`text-sm font-black uppercase flex items-center gap-1.5 ${isQualified ? "text-neutral-900" : "text-neutral-400"}`}>
                  {isQualified ? "🚀 This Idea Has Potential" : "🔒 Startup PRD Generator"}
                </h3>
                <p className="text-[11px] text-neutral-600 font-sans font-light leading-relaxed">
                  {isQualified 
                    ? "The judges believe this project is worth exploring further. Generate a startup-grade Product Requirements Document based on your hackathon decisions."
                    : "Get a grade B or above to unlock this startup product compiler."
                  }
                </p>
              </div>

              <Button
                onClick={() => {
                  if (!isQualified) return;
                  playMutedClick();
                  setIsPrdModalOpen(true);
                }}
                disabled={!isQualified}
                onMouseEnter={isQualified ? playSubtleHover : undefined}
                className={`w-full font-mono text-xs h-9 border focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
                  isQualified 
                    ? "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 cursor-pointer" 
                    : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                }`}
              >
                {isQualified ? "GENERATE_STARTUP_PRD.EXE" : "GENERATE_STARTUP_PRD.EXE (LOCKED)"}
              </Button>
            </div>
          );
        })()}

        {/* Achievements Grid */}
        <div className="border-t border-dashed border-neutral-200 pt-4">
          <span className="text-neutral-400 block text-[9px] uppercase mb-3">GLOBAL_ACHIEVEMENTS_DECRYPTION:</span>
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]"
          >
            {ACHIEVEMENTS_LIST.map((ac) => {
              const isUnlocked = unlockedAchievements.includes(ac.id);
              return (
                <motion.div
                  key={ac.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  className={`p-2.5 rounded border flex items-center justify-between transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
                    isUnlocked
                      ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                      : "border-neutral-250 bg-white text-neutral-400 border-dashed"
                  }`}
                >
                  <div className="text-left">
                    <span className="block uppercase tracking-tight">{ac.name}</span>
                    <span className={`text-[8px] font-sans font-light block mt-0.5 leading-none ${isUnlocked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {ac.desc}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-100/10">
                    {isUnlocked ? "[UNLOCKED]" : "[LOCKED]"}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Shareable Result Card */}
        <div className="border-t border-dashed border-neutral-200 pt-4 space-y-2">
          <span className="text-neutral-400 block text-[9px] uppercase">SHAREABLE_SOCIAL_MANIFEST.ASCII</span>
          <pre className="p-3 bg-neutral-900 text-neutral-100 rounded text-[9px] font-mono leading-tight text-left overflow-x-auto whitespace-pre select-all">
            {generateAsciiCard()}
          </pre>
          <Button
            onClick={copyToClipboard}
            onMouseEnter={playSubtleHover}
            variant="outline"
            className="w-full font-mono text-xs border border-neutral-900 h-8 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer"
          >
            {copied ? "[MANIFEST_COPIED_TO_CLIPBOARD.TXT]" : "COPY_MANIFEST_ASCII.EXE"}
          </Button>
        </div>

        {/* Action Controls */}
        <div className="border-t border-neutral-200 pt-4">
          <Button
            onClick={() => {
              playMutedClick();
              resetGame();
            }}
            onMouseEnter={playSubtleHover}
            className="w-full font-mono text-xs border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer animate-pulse"
          >
            🔄 REBOOT_SIMULATOR.EXE
          </Button>
        </div>

        {/* Startup PRD Generator Overlay Modal */}
        {isPrdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in select-none">
            <div className="w-full max-w-3xl bg-white border-2 border-neutral-900 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col gap-4 overflow-hidden relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400">PRD_MANIFEST_COMPILER</span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    prdLoadingStep === prdLogs.length - 1 ? "bg-emerald-600 text-white" : "bg-neutral-900 text-white animate-pulse"
                  }`}>
                    {prdLoadingStep === prdLogs.length - 1 ? "READY" : "COMPILING"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    playMutedClick();
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
                  Startup PRD Compiler
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
                      COMPILING_STARTUP_ARGUMENTS...
                    </div>
                    
                    <div className="bg-neutral-950 p-4 rounded font-mono text-[10px] text-neutral-100 min-h-[180px] flex flex-col justify-between shadow-inner">
                      <div className="space-y-1 text-left">
                        {prdLogs.slice(0, prdLoadingStep + 1).map((log, i) => (
                          <div key={i} className={log.includes("SUCCESSFUL") ? "text-emerald-400 font-bold" : "text-neutral-300"}>
                            {i === prdLoadingStep ? (
                              <span className="typewriter-cursor">
                                {`> [SYS] ${log}`}
                              </span>
                            ) : (
                              `> [SYS] ${log}`
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
                    <div className="flex-1 border border-neutral-300 p-5 bg-stone-50 rounded text-left overflow-y-auto font-sans text-xs text-neutral-850 space-y-3.5 leading-relaxed select-text shadow-inner max-h-[45vh]">
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
                                {isNote ? "💡 NOTE_MANIFEST:" : "⚠️ WARNING_MANIFEST:"}
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
                        onMouseEnter={playSubtleHover}
                        variant="outline"
                        className="font-mono text-[10px] h-9 border border-neutral-900 cursor-pointer focus:outline-none"
                      >
                        {prdCopied ? "[COPIED_TO_CLIPBOARD.TXT]" : "COPY_MARKDOWN.TXT"}
                      </Button>
                      <Button
                        onClick={handleDownloadPrd}
                        onMouseEnter={playSubtleHover}
                        variant="outline"
                        className="font-mono text-[10px] h-9 border border-neutral-900 cursor-pointer focus:outline-none"
                      >
                        DOWNLOAD_PRD.MD
                      </Button>
                      <Button
                        onClick={() => {
                          playMutedClick();
                          setIsPrdModalOpen(false);
                        }}
                        onMouseEnter={playSubtleHover}
                        className="font-mono text-[10px] h-9 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-900 cursor-pointer focus:outline-none"
                      >
                        CLOSE_MANIFEST.EXE
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </GameplayStageCard>
  );
}

// ─── Floating Dev Debug Panel ──────────────────────────────────────────────

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
        
        <div className="mt-2 pt-2 border-t border-dashed border-border/80 text-[10px] space-y-0.5">
          <div className="font-bold text-neutral-900 uppercase">HIDDEN_SCORES:</div>
          <div className="flex justify-between"><span>INNOVATION:</span><span>{score.innovation}/100</span></div>
          <div className="flex justify-between"><span>EXECUTION/FEAS:</span><span>{score.execution}/100</span></div>
          <div className="flex justify-between"><span>DESIGN:</span><span>{score.design}/100</span></div>
          <div className="flex justify-between"><span>PITCH_POTENTIAL:</span><span>{score.pitch}/100</span></div>
          <div className="flex justify-between font-bold text-neutral-800 pt-0.5"><span>COMPILER_BONUS:</span><span>+{score.bonus} pts</span></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 pt-2 border-t border-border/60 text-[10px]">
        <span className="font-bold text-neutral-500 uppercase">SYNTH_SOUND:</span>
        <button
          onClick={() => {
            playMutedClick();
            useGameStore.getState().toggleSound();
          }}
          className={`px-2 py-0.5 rounded border font-mono text-[9px] font-bold cursor-pointer ${
            useGameStore.getState().soundEnabled
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-neutral-100 text-neutral-400 border-neutral-200"
          }`}
        >
          {useGameStore.getState().soundEnabled ? "ON" : "MUTED"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3 pt-2 border-t border-border/60">
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            playMutedClick();
            if (isTimerPaused) resumeTimer(); else pauseTimer();
          }}
          className="text-[10px] h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
        >
          {isTimerPaused ? "RESUME_TIME" : "PAUSE_TIME"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            playMutedClick();
            nextStage();
          }}
          className="text-[10px] h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
        >
          SKIP_STAGE
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={() => {
            playMutedClick();
            resetGame();
          }}
          className="text-[10px] col-span-2 h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
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

// --- Chaos Event Interruption Modal ------------------------------------------

function ChaosEventOverlay() {
  const { activeChaosEvent, resolveChaosEvent } = useGameStore();

  useEffect(() => {
    if (activeChaosEvent) {
      // Play warning ticker sound when modal initiates
      playWarningTick();
    }
  }, [activeChaosEvent]);

  if (!activeChaosEvent) return null;

  const getCategoryTag = (cat: string) => {
    switch (cat) {
      case "technical":
        return "[TECHNICAL_FIRE]";
      case "team":
        return "[TEAM_CHAOS]";
      case "lucky":
        return "[LUCKY_BREAK]";
      case "judge":
        return "[JURY_SURPRISE]";
      default:
        return "[INCIDENT]";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "technical":
        return "text-rose-600 border-rose-250 bg-rose-50/60";
      case "team":
        return "text-amber-600 border-amber-250 bg-amber-50/60";
      case "lucky":
        return "text-emerald-600 border-emerald-250 bg-emerald-50/60";
      case "judge":
        return "text-indigo-600 border-indigo-250 bg-indigo-50/60";
      default:
        return "text-neutral-600 border-neutral-200 bg-neutral-50/50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 overflow-y-auto font-mono text-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-stone-50 border-2 border-neutral-900 rounded-lg shadow-2xl p-6 sm:p-8 text-left"
      >
        {/* Terminal warning banner */}
        <div className="text-center mb-6 select-none font-bold text-neutral-900 leading-tight">
          <div>=============================================</div>
          <div className="text-neutral-900 tracking-wider flex items-center justify-center gap-1.5 py-1">
            <AlertTriangle className="w-4 h-4 animate-pulse text-amber-600" />
            <span>⚠ CRITICAL HACKATHON INCIDENT DETECTED</span>
          </div>
          <div>=============================================</div>
        </div>

        {/* Event Header Info */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-border/80">
          <span className="text-[10px] text-muted-foreground">
            EVENT_ID: {activeChaosEvent.id.toUpperCase()}
          </span>
          <span
            className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider ${getCategoryColor(
              activeChaosEvent.category
            )}`}
          >
            {getCategoryTag(activeChaosEvent.category)}
          </span>
        </div>

        <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 mb-3 border-b border-dashed border-border/80 pb-2">
          {activeChaosEvent.title}
        </h3>

        <p className="text-[10px] text-neutral-700 leading-relaxed mb-6 bg-white p-3.5 border border-neutral-250 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)]">
          {activeChaosEvent.description}
        </p>

        {/* Choice buttons */}
        <div className="space-y-3">
          <span className="text-neutral-400 block text-[9px] uppercase tracking-wider">
            CHOOSE_TACTICAL_ACTION.EXE:
          </span>
          {activeChaosEvent.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => {
                playMutedClick();
                resolveChaosEvent(index);
              }}
              onMouseEnter={playSubtleHover}
              className="w-full text-left p-3.5 bg-white border border-neutral-250 rounded hover:border-neutral-900 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none flex flex-col cursor-pointer"
            >
              <div className="flex items-start justify-between w-full">
                <span className="font-bold text-neutral-900 tracking-tight text-[11px] uppercase">
                  &gt; {choice.label}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded border border-neutral-200 font-mono tracking-wider">
                  ACTION_0{index + 1}
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 font-sans font-light leading-relaxed">
                {choice.description}
              </p>

              {choice.effectText && (
                <div className="mt-3 text-[9px] text-neutral-900 font-mono flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-250 w-fit">
                  <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span className="font-bold">EFFECTS:</span> {choice.effectText}
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Conditional Stage Orchestrator / GamePage ---------------------------

export default function GamePage() {
  const { stage, isGameStarted, startGame, tickTimer, isTimerPaused, activeChaosEvent } = useGameStore();

  useEffect(() => {
    if (!isGameStarted) {
      startGame();
    }
  }, [isGameStarted, startGame]);

  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      tickTimer();
      const remaining = useGameStore.getState().globalTimeRemaining;
      if (remaining > 0 && remaining <= 60) {
        if (remaining <= 10) {
          playWarningTick(); // tick every second in final 10 seconds
        } else if (remaining % 10 === 0) {
          playWarningTick(); // tick every 10 seconds in final minute
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, tickTimer]);

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
        <AnimatePresence>
          {activeChaosEvent && <ChaosEventOverlay />}
        </AnimatePresence>
        <DevDebugPanel />
      </div>
    </GameLayout>
  );
}

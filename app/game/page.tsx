"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, STAGE_ORDER, isRoleRelevantForStage, checkTeammateGating } from "@/store/gameStore";
import GameLayout from "@/components/game/GameLayout";
import { Button } from "@/components/ui/button";
import { PROBLEMS } from "@/data/problems";
import { JUDGES } from "@/data/judges";
import { TECH_POOL, TECH_WEIGHTS } from "@/data/techItems";
import { TECH_REGISTRY, getSlotForCategory, toStoreId, toRegistryId, TechRegistryItem } from "@/data/techRegistry";
import { getRecommendations } from "@/lib/recommendations";
import { ARCHITECTURE_TEMPLATES } from "@/data/architectureTemplates";
import { generateUSPOptions, generateFeatureBacklog, generateBusinessModels, generateAdvisorAdvice, generateCustomElevatorPitch } from "@/lib/projectStrategyGenerator";
import { getDailySeed } from "@/lib/dailyChallenge";
import { DraggableCard } from "@/components/drag-drop/DraggableCard";
import { DropZone } from "@/components/drag-drop/DropZone";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
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
import type { GameStage, Problem, TechItem, Feature, Teammate } from "@/types/game";
import { AVAILABLE_SLIDES, evaluatePitchDeck } from "@/lib/pitchDeckEvaluator";
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
  playUnlockArpeggio,
  playMilestoneUnlock,
  playCategoryComplete,
  playWinTheme,
  playLoseTheme,
  playRevealTension,
  playRevealSuccess
} from "@/lib/sound";

// --- Standard Reusable Stage Wrapper ---------------------------------------

function GameplayStageCard({
  stageKey,
  title,
  subtitle,
  children,
  disableNext = false,
}: {
  stageKey: GameStage;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  disableNext?: boolean;
}) {
  const router = useRouter();
  const { nextStage, previousStage, difficulty, globalTimeRemaining, activeModifiers, gameMode, resetGame } = useGameStore();
  const currentIndex = STAGE_ORDER.indexOf(stageKey);
  const [isAbortOpen, setIsAbortOpen] = useState(false);

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
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
              {stageKey === 'difficulty' ? 'GETTING STARTED' : 
               stageKey === 'results' ? 'HACKATHON CONCLUDED' : 
               `ROUND ${currentIndex} of 11`
              } // {
                stageKey === 'difficulty' ? 'CHOOSE PACING' : 
                stageKey === 'problemReveal' ? 'CHOOSE TRACK' : 
                stageKey === 'solutionDirection' ? 'SOLUTION FORMAT' : 
                stageKey === 'techStack' ? 'TECH STACK' : 
                stageKey === 'usp' ? 'UNIQUE ADVANTAGE' : 
                stageKey === 'features' ? 'FEATURE PRIORITIZATION' : 
                stageKey === 'pitchDeck' ? 'PITCH STORYBOARD' : 
                stageKey === 'mentor' ? 'MENTOR REVIEW' : 
                stageKey === 'businessModel' ? 'BUSINESS MODEL' : 
                stageKey === 'pitchPrep' ? 'PITCH SCRIPT' : 
                stageKey === 'judgeSpin' ? 'JURY DRAW' : 
                stageKey === 'judging' ? 'PITCH STAGE' : 'FINAL RESULTS'
              }
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
                PACE: {difficulty}
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
            <span className="font-mono text-[9px] uppercase text-neutral-400 mr-2 self-center">HACKATHON RULE MODIFIERS:</span>
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
        <div className="flex items-center justify-between border-t border-border pt-6 mt-6 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playMutedClick();
                if (currentIndex === 0) {
                  resetGame();
                  router.push("/");
                } else {
                  previousStage();
                }
              }}
              onMouseEnter={playSubtleHover}
              disabled={stageKey === 'results'}
              className="font-mono text-xs h-8 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none cursor-pointer"
            >
              &lt; BACK
            </Button>

            {currentIndex >= 1 && stageKey !== 'results' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  playMutedClick();
                  setIsAbortOpen(true);
                }}
                onMouseEnter={playSubtleHover}
                className="font-mono text-xs h-8 bg-red-50/50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 transition-all duration-150 cursor-pointer"
              >
                GIVE UP
              </Button>
            )}
          </div>

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
            disabled={currentIndex === STAGE_ORDER.length - 1 || !difficulty || disableNext}
            className="font-mono text-xs h-8 border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none cursor-pointer"
          >
            NEXT ROUND &gt;
          </Button>
        </div>
      </div>

      {/* Abort simulation confirmation modal */}
      <AnimatePresence>
        {isAbortOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-card border border-neutral-300 rounded-lg shadow-2xl p-6 m-4 font-mono text-xs text-left"
            >
              <h3 className="text-sm font-black uppercase text-red-600 mb-2 flex items-center gap-1.5">
                🚨 LEAVE HACKATHON
              </h3>
              <p className="text-neutral-600 mb-6 font-sans font-light leading-relaxed">
                Are you sure you want to give up on this hackathon? You will lose all your progress, build decisions, and scores in this run.
              </p>
              
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    playMutedClick();
                    setIsAbortOpen(false);
                  }}
                  className="font-mono text-[10px] h-8 cursor-pointer"
                >
                  KEEP BUILDING
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    playMutedClick();
                    resetGame();
                    setIsAbortOpen(false);
                    router.push("/");
                  }}
                  className="font-mono text-[10px] h-8 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  YES, GIVE UP
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Preset Data for Team System -------------------------------------------

const AVATAR_PRESETS = [
  { emoji: "👨‍💻", gender: "male" as const, label: "Male Developer" },
  { emoji: "👩‍💻", gender: "female" as const, label: "Female Developer" },
  { emoji: "🧑‍💻", gender: "nonbinary" as const, label: "Nonbinary Developer" },
  { emoji: "👨‍🎨", gender: "male" as const, label: "Male Designer" },
  { emoji: "👩‍🎨", gender: "female" as const, label: "Female Designer" },
  { emoji: "🧑‍🎨", gender: "nonbinary" as const, label: "Nonbinary Designer" },
  { emoji: "👨‍💼", gender: "male" as const, label: "Male Founder" },
  { emoji: "👩‍💼", gender: "female" as const, label: "Female Founder" },
  { emoji: "🧑‍💼", gender: "nonbinary" as const, label: "Nonbinary Founder" },
  { emoji: "👨‍🔬", gender: "male" as const, label: "Male Researcher" },
  { emoji: "👩‍🔬", gender: "female" as const, label: "Female Researcher" },
  { emoji: "🧑‍🔬", gender: "nonbinary" as const, label: "Nonbinary Researcher" },
];

const ROLE_PRESETS = [
  "Backend Developer",
  "Frontend Developer",
  "UI/UX Designer",
  "Product Strategist",
  "User Researcher",
  "Pitch Specialist",
  "Chaiwala"
];

const PERSONALITY_PRESETS = [
  "Builder",
  "Perfectionist",
  "Dreamer",
  "Founder",
  "Designer"
] as const;

function TeamFormationStage() {
  const { setupTeam, nextStage } = useGameStore();

  const [playerName, setPlayerName] = useState("Lead Builder");
  const [playerAvatar, setPlayerAvatar] = useState("🧑‍💻");
  
  const [teammates, setTeammates] = useState<Teammate[]>([
    {
      id: "teammate-1",
      name: "Anjali",
      avatar: "👩‍💻",
      gender: "female",
      role: "Backend Developer",
      personality: "Builder",
      helpTokenUsed: false,
      contribution: { innovation: 0, execution: 0, design: 0, pitch: 0 }
    }
  ]);

  const [errorMsg, setErrorMsg] = useState("");

  const handleAddTeammate = () => {
    if (teammates.length >= 5) {
      setErrorMsg("Maximum team size is 6 members including yourself.");
      return;
    }
    setErrorMsg("");
    
    const randomAvatar = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
    const randomRole = ROLE_PRESETS[Math.floor(Math.random() * ROLE_PRESETS.length)];
    const randomPersonality = PERSONALITY_PRESETS[Math.floor(Math.random() * PERSONALITY_PRESETS.length)];
    const NAMES = ["Dev", "Alex", "Sam", "Zoe", "Vikram", "Yuki", "Chloe", "Sarah", "Raj", "Nisha"];
    const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];

    setTeammates(prev => [
      ...prev,
      {
        id: `teammate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: randomName,
        avatar: randomAvatar.emoji,
        gender: randomAvatar.gender,
        role: randomRole,
        personality: randomPersonality,
        helpTokenUsed: false,
        contribution: { innovation: 0, execution: 0, design: 0, pitch: 0 }
      }
    ]);
    playMutedClick();
  };

  const handleRemoveTeammate = (id: string) => {
    if (teammates.length <= 1) {
      setErrorMsg("Minimum team size is 2 members including yourself.");
      return;
    }
    setErrorMsg("");
    setTeammates(prev => prev.filter(t => t.id !== id));
    playMutedClick();
  };

  const handleAssembleTeam = () => {
    if (!playerName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    const hasInvalidTeammate = teammates.some(t => !t.name.trim() || !t.role || !t.avatar);
    if (hasInvalidTeammate) {
      setErrorMsg("All teammates must have a name, role, and avatar assigned.");
      return;
    }

    setupTeam(playerName, playerAvatar, teammates);
    nextStage();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith("avatar-preset-") && overId === "avatar-drop-player") {
      const idx = parseInt(activeId.replace("avatar-preset-", ""));
      const preset = AVATAR_PRESETS[idx];
      if (preset) {
        setPlayerAvatar(preset.emoji);
        playSnapSound();
      }
    } else if (activeId.startsWith("avatar-preset-") && overId.startsWith("avatar-drop-")) {
      const idx = parseInt(activeId.replace("avatar-preset-", ""));
      const teammateId = overId.replace("avatar-drop-", "");
      const preset = AVATAR_PRESETS[idx];
      if (preset) {
        setTeammates(prev => prev.map(t => t.id === teammateId ? { ...t, avatar: preset.emoji, gender: preset.gender } : t));
        playSnapSound();
      }
    } else if (activeId.startsWith("role-preset-") && overId.startsWith("role-drop-")) {
      const idx = parseInt(activeId.replace("role-preset-", ""));
      const teammateId = overId.replace("role-drop-", "");
      const roleName = ROLE_PRESETS[idx];
      if (roleName) {
        setTeammates(prev => prev.map(t => t.id === teammateId ? { ...t, role: roleName } : t));
        playSnapSound();
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <GameplayStageCard
        stageKey="teamFormation"
        title="Assemble Your Hackathon Crew"
        subtitle="Every successful startup begins with a balanced team. Assign avatars, roles, and personalities. Drag presets onto slots or use dropdown selectors."
      >
        <div className="space-y-6 max-w-4xl mx-auto text-left font-mono text-xs">
          
          {errorMsg && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-750 rounded font-bold uppercase text-[10px] tracking-wider select-none text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Teammates List */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Player Card */}
              <div className="p-4 border-2 border-neutral-900 rounded-md bg-neutral-50/50 space-y-3 relative">
                <span className="absolute top-2 right-2 text-[8px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                  TEAM LEAD
                </span>
                
                <h4 className="font-bold text-neutral-950 uppercase text-[10px]">Leader Profile</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-450 uppercase block font-bold">Your Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none bg-white font-sans text-xs"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-450 uppercase block font-bold">Avatar</label>
                    <DropZone id="avatar-drop-player" hideDefaultEmpty emptyLabel="AVATAR" currentCount={1} capacity={1}>
                      <div className="w-12 h-12 flex items-center justify-center text-2xl border border-neutral-350 bg-white rounded relative hover:bg-neutral-50 transition-colors cursor-pointer">
                        {playerAvatar}
                        <select
                          value={playerAvatar}
                          onChange={(e) => setPlayerAvatar(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        >
                          {AVATAR_PRESETS.map((av, idx) => (
                            <option key={idx} value={av.emoji}>{av.emoji} ({av.label})</option>
                          ))}
                        </select>
                      </div>
                    </DropZone>
                  </div>
                </div>
              </div>

              {/* Added Teammates List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <h4 className="font-bold text-neutral-950 uppercase text-[10px]">Crew Roster ({teammates.length + 1}/6)</h4>
                  <Button
                    size="xs"
                    onClick={handleAddTeammate}
                    disabled={teammates.length >= 5}
                    className="h-7 text-[9px] border border-neutral-900"
                  >
                    + ADD MEMBER
                  </Button>
                </div>

                <div className="space-y-3">
                  {teammates.map((t, index) => (
                    <div key={t.id} className="p-4 border border-neutral-300 rounded bg-white relative space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-950 uppercase text-[9px]">Crew Member #{index + 1}</span>
                        <button
                          onClick={() => handleRemoveTeammate(t.id)}
                          className="text-red-650 hover:text-red-700 text-[10px] font-bold"
                        >
                          [REMOVE]
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Name input */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-450 uppercase block font-bold">Name</label>
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => {
                              setTeammates(prev => prev.map(item => item.id === t.id ? { ...item, name: e.target.value } : item));
                            }}
                            className="w-full px-2 py-1.5 border border-neutral-300 rounded focus:border-neutral-900 focus:outline-none bg-white font-sans text-xs"
                            placeholder="Teammate name"
                          />
                        </div>

                        {/* Avatar dropzone */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-450 uppercase block font-bold">Avatar</label>
                          <DropZone id={`avatar-drop-${t.id}`} hideDefaultEmpty emptyLabel="AVATAR" currentCount={t.avatar ? 1 : 0} capacity={1}>
                            <div className="w-12 h-12 flex items-center justify-center text-2xl border border-neutral-300 rounded bg-white relative hover:bg-neutral-50 transition-colors cursor-pointer">
                              {t.avatar}
                              <select
                                value={t.avatar}
                                onChange={(e) => {
                                  const av = AVATAR_PRESETS.find(a => a.emoji === e.target.value);
                                  if (av) {
                                    setTeammates(prev => prev.map(item => item.id === t.id ? { ...item, avatar: av.emoji, gender: av.gender } : item));
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              >
                                {AVATAR_PRESETS.map((av, idx) => (
                                  <option key={idx} value={av.emoji}>{av.emoji} ({av.label})</option>
                                ))}
                              </select>
                            </div>
                          </DropZone>
                        </div>

                        {/* Role and Personality */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-450 uppercase block font-bold">Role</label>
                            <DropZone id={`role-drop-${t.id}`} hideDefaultEmpty emptyLabel="ROLE" currentCount={t.role ? 1 : 0} capacity={1}>
                              <div className="relative border border-neutral-300 rounded bg-white p-1 text-[10px] uppercase font-mono text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                                {t.role || "Assign Role"}
                                <select
                                  value={t.role || ""}
                                  onChange={(e) => {
                                    setTeammates(prev => prev.map(item => item.id === t.id ? { ...item, role: e.target.value } : item));
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                >
                                  <option value="" disabled>Select Role</option>
                                  {ROLE_PRESETS.map((role, idx) => (
                                    <option key={idx} value={role}>{role}</option>
                                  ))}
                                </select>
                              </div>
                            </DropZone>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-450 uppercase block font-bold">Personality</label>
                            <div className="relative border border-neutral-300 rounded bg-white p-1.5 text-[10px] uppercase font-mono text-center">
                              {t.personality}
                              <select
                                value={t.personality}
                                onChange={(e) => {
                                  setTeammates(prev => prev.map(item => item.id === t.id ? { ...item, personality: e.target.value as any } : item));
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer text-center"
                              >
                                {PERSONALITY_PRESETS.map((p, idx) => (
                                  <option key={idx} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Drag & Drop Preset Banks */}
            <div className="space-y-5 p-4 border border-neutral-250 rounded-md bg-neutral-50/50">
              
              {/* Role Presets Bank */}
              <div className="space-y-2">
                <span className="text-[9px] text-neutral-450 uppercase font-bold tracking-wider block border-b border-neutral-200 pb-1">
                  DRAGGABLE ROLES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((role, idx) => (
                    <DraggableCard
                      key={`role-${idx}`}
                      id={`role-preset-${idx}`}
                      className="border border-neutral-300 bg-white hover:bg-neutral-50 px-2 py-1 text-[9px] font-mono uppercase select-none rounded cursor-grab"
                    >
                      {role}
                    </DraggableCard>
                  ))}
                </div>
              </div>

              {/* Avatar Presets Bank */}
              <div className="space-y-2">
                <span className="text-[9px] text-neutral-450 uppercase font-bold tracking-wider block border-b border-neutral-200 pb-1">
                  DRAGGABLE AVATARS
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {AVATAR_PRESETS.map((av, idx) => (
                    <DraggableCard
                      key={`avatar-${idx}`}
                      id={`avatar-preset-${idx}`}
                      className="border border-neutral-300 bg-white hover:bg-neutral-50 p-1.5 text-base text-center select-none rounded flex items-center justify-center cursor-grab"
                    >
                      {av.emoji}
                    </DraggableCard>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-250 pt-3 text-[9px] text-neutral-400 leading-normal font-sans font-light">
                Drag roles or avatars directly onto your teammates to assign them, or click them to select from dropdown lists.
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <Button
              onClick={handleAssembleTeam}
              className="font-mono text-xs h-9 px-6 bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800 cursor-pointer"
            >
              ASSEMBLE TEAM &gt;
            </Button>
          </div>

        </div>
      </GameplayStageCard>
    </DndContext>
  );
}

// --- Stage 1: Difficulty Phase ---------------------------------------------

function DifficultyStage() {
  const { setDifficulty, difficulty, gameMode } = useGameStore();

  const options = [
    { key: "easy", name: "RELAXED BUILD (EASY)", desc: gameMode === 'speedrun' ? "3-minute countdown // 1.0x score multiplier" : "10-minute countdown // 1.0x score multiplier. Perfect for planning and exploring." },
    { key: "medium", name: "STANDARD HACK (MEDIUM)", desc: gameMode === 'speedrun' ? "3-minute countdown // 1.15x score multiplier" : "7-minute countdown // 1.15x score multiplier. The classic high-pressure hackathon pace." },
    { key: "hard", name: "CRUNCH TIME (HARD)", desc: gameMode === 'speedrun' ? "3-minute countdown // 1.30x score multiplier" : "5-minute countdown // 1.30x score multiplier. Quick decisions and maximum intensity." },
    { key: "dev", name: "SPEED BUILD (DEV)", desc: gameMode === 'speedrun' ? "3-minute countdown // 1.00x score multiplier" : "60-second countdown // 1.00x score multiplier. Developer test run pace." },
  ] as const;

  return (
    <GameplayStageCard
      stageKey="difficulty"
      title="Choose Your Pace"
      subtitle="Decide how much time you want to budget for this hackathon. A shorter clock gives you less time to make decisions, but it increases your final score multiplier."
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
      title="Round 1: Choose a Challenge"
      subtitle="Every great hackathon project starts with a real-world problem. Shuffle the challenge statement until you find one that inspires you. The timer starts when you accept."
    >
      <div className="space-y-4 text-left max-w-md mx-auto font-mono text-[11px] leading-relaxed">
        {/* Notice of timer start */}
        <div className="p-3 rounded border border-neutral-900 bg-neutral-50/50 text-center font-mono text-[10px] text-neutral-800 tracking-wide select-none uppercase font-bold">
          ⏱️ STATUS: READY // THE TIMER WILL START AS SOON AS YOU ACCEPT A CHALLENGE.
        </div>

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
            DRAW ANOTHER CHALLENGE
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
                <span className="text-neutral-400">CHALLENGE:</span>{" "}
                <span className="font-bold text-neutral-900 uppercase">{selectedProblem.title}</span>
              </div>
              <div>
                <span className="text-neutral-400">TRACK:</span>{" "}
                <span className="font-bold text-neutral-800 uppercase px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px]">
                  {selectedProblem.category}
                </span>
              </div>
              <p className="text-neutral-700 border-t border-dashed border-border pt-3 text-[11px] font-sans font-light">
                {selectedProblem.description}
              </p>
              
              <div className="border-t border-dashed border-border pt-3 space-y-1">
                <span className="text-neutral-400 font-bold block text-[10px]">TRACK RULES:</span>
                <ul className="list-disc list-inside text-neutral-700 text-[10px] space-y-1 font-sans font-light">
                  {selectedProblem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {selectedProblem.judgingHint && (
                <div className="border-t border-dashed border-border pt-3">
                  <span className="text-neutral-400 font-bold block text-[10px] mb-1">JUDGES' TIP:</span>
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
    { id: "web-app", name: "Web Application", desc: "Build responsive web apps. High marks for design and feasibility." },
    { id: "mobile-app", name: "Mobile Application", desc: "Create native mobile apps. Emphasizes design and device execution." },
    { id: "ai-solution", name: "AI Solution", desc: "Assemble smart cognitive pipelines. Exceptional innovation and pitch potential." },
    { id: "iot-product", name: "IoT Hardware Product", desc: "Program micro-controllers & sensors. Extreme innovation, harder to execute." },
    { id: "platform", name: "Service Platform", desc: "Design shared microservice layers. High scores for execution and architecture." },
    { id: "marketplace", name: "Trading Marketplace", desc: "Build automated peer exchanges. Outstanding pitch potential and feasibility." },
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
      title="Round 2: Define Your Solution"
      subtitle="Choose the format of your solution. Your format shapes your baseline stack slots and influences how judges evaluate your execution and design."
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
  const { techStack, addTechItem, removeTechItem, updateScore, solutionDirection, usp, primaryUsp, generatedUSPs, selectedProblem, setActiveTechTab } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Synchronize active tab to the Zustand store
  useEffect(() => {
    setActiveTechTab(activeTab);
  }, [activeTab, setActiveTechTab]);

  // Auto-scroll the slots panel to the newly selected slot
  useEffect(() => {
    if (!selectedSlotId) return;
    const el = slotRefs.current[selectedSlotId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSlotId]);

  // Maps a slot's compatibleCategories to the closest tab id
  const getTabForSlot = (slot: typeof activeTemplate.slots[number]): string => {
    const cats = slot.compatibleCategories;
    if (cats.some(c => ['Frontend', 'Design / UI', 'AR / VR', 'Mobile'].includes(c))) return 'frontend';
    if (cats.some(c => ['Backend', 'Realtime / Messaging', 'Automation'].includes(c))) return 'backend';
    if (cats.some(c => ['Database', 'Blockchain / Web3'].includes(c))) return 'database';
    if (cats.some(c => ['Hosting / Infra', 'DevOps'].includes(c))) return 'devops';
    if (cats.some(c => ['AI / ML'].includes(c))) return 'ai';
    if (cats.some(c => ['IoT / Hardware'].includes(c))) return 'hardware';
    if (cats.some(c => ['Authentication', 'Payments', 'Analytics', 'Productivity APIs'].includes(c))) return 'apis';
    return 'all';
  };

  // After placing a tech, jump to the next empty slot and update tab
  const autoAdvanceToNextSlot = (filledSlotId: string, currentStack: typeof techStack) => {
    const slots = activeTemplate.slots;
    const filledIdx = slots.findIndex(s => s.id === filledSlotId);
    // Look for next unfilled slot after the one just filled
    const nextSlot =
      slots.slice(filledIdx + 1).find(s => !currentStack.some(t => t.category === s.id)) ||
      slots.find(s => s.id !== filledSlotId && !currentStack.some(t => t.category === s.id));
    if (nextSlot) {
      setSelectedSlotId(nextSlot.id);
      setActiveTab(getTabForSlot(nextSlot));
    }
  };

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

  // Find primary USP key for tech recommendation synergies
  const primaryUspObj = generatedUSPs.find(u => u.name === primaryUsp);
  const uspKey = primaryUspObj ? primaryUspObj.key : (usp || 'Fastest');

  // Get dynamic domain-aware recommendations
  const recommendedStack = getRecommendations(solutionDirection, uspKey, selectedProblem?.category);

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
        // Auto-advance to next empty slot
        autoAdvanceToNextSlot(targetSlotId, nextStack);
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
      // Auto-advance to next empty slot after drag-drop
      autoAdvanceToNextSlot(targetSlotId, nextStack);
    }
  };

  // Tabs for Visual categorization
  const tabs = [
    { id: 'all', label: 'ALL TECH' },
    { id: 'frontend', label: 'FRONTEND' },
    { id: 'backend', label: 'BACKEND' },
    { id: 'database', label: 'DATABASE' },
    { id: 'devops', label: 'INFRASTRUCTURE' },
    { id: 'ai', label: 'AI & DATA' },
    { id: 'hardware', label: 'HARDWARE' },
    { id: 'apis', label: 'SERVICES & APIs' },
  ];

  // Quick Filters
  const quickFilters = [
    { id: 'all', label: 'SUITABLE FOR SLOT' },
    { id: 'all-bypass', label: 'SHOW ALL TECH' },
    { id: 'recommended', label: '★ RECOMMENDED' },
    { id: 'synergic', label: '⚡ STACK SYNERGIES' },
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
        title="Round 3: Choose Your Tech Stack"
        subtitle={`Build your architecture from the available library. Select slot cards on the right to see matching technologies, or drag cards directly into slots.`}
      >
        <div className="space-y-4 max-w-4xl mx-auto text-left font-mono text-[11px]">
          
          {/* Recommended Stack Box */}
          {recommendedStack && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-900 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1">
                  ★ ORGANIZER RECOMMENDATION:
                </span>
                <span className="text-[8px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-mono">
                  USP: {usp?.toUpperCase() || "N/A"}
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 font-sans italic leading-relaxed font-light">
                "{recommendedStack.why}"
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-neutral-400 text-[8px] uppercase self-center font-mono">SUGGESTED TECH:</span>
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
                placeholder="SEARCH TECHNOLOGIES..."
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
                AVAILABLE TECHNOLOGIES: {activeSlotMeta ? `${activeSlotMeta.label.toUpperCase()} COMPATIBLE` : 'ALL'} ({filteredTechRegistry.length} ITEMS):
              </span>
              {activeSlotMeta && activeFilter !== 'all-bypass' && (
                <span className="text-[8px] text-neutral-500 font-normal">
                  [FILTER ACTIVE: CLICK SLOTS TO CHANGE TARGET]
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
                  [NO MATCHING TECHNOLOGIES FOUND]
                </div>
              )}
            </div>
          </div>

            {/* Dynamic Architecture Slots (Right Panel) */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-neutral-400 block text-[9px] uppercase tracking-wider">
                YOUR PROJECT ARCHITECTURE (DRAG HERE):
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
                      ref={(el) => { slotRefs.current[slot.id] = el; }}
                      onClick={() => {
                        playMutedClick();
                        setSelectedSlotId(slot.id);
                      }}
                      className="cursor-pointer"
                    >
                      <DropZone
                        id={slot.id}
                        label={slot.label}
                        capacity={1}
                        currentCount={slottedItem ? 1 : 0}
                        hideDefaultEmpty={true}
                        className={cn(
                          isSelected && "ring-1 ring-neutral-900 bg-neutral-50/50"
                        )}
                      >
                        {slottedItem ? (
                          <motion.div
                            initial={{ scale: 0.97, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className={cn(
                              "p-2.5 rounded-md flex items-center justify-between shadow-md transition-all duration-300 select-none bg-neutral-900 border text-white",
                              warningMessage ? "border-amber-600" : "border-neutral-950",
                              isSelected ? "ring-1 ring-offset-1 ring-neutral-900" : ""
                            )}
                          >
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white text-[10.5px] tracking-wide truncate">
                                  {slottedItem.name.toUpperCase()}
                                </span>
                                {getPriorityBadge(slot.priority)}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[7.5px] text-neutral-400 tracking-wide font-light uppercase">
                                <span>Active</span>
                                <span className="text-neutral-700">|</span>
                                <span>Connected to {slot.label}</span>
                              </div>
                              {warningMessage && (
                                <span className="text-amber-500 font-bold block mt-1 text-[7.5px] tracking-wide animate-pulse">
                                  ⚠ UNUSUAL FIT: {warningMessage.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent select slot trigger
                                playMutedClick();
                                handleToggleSlottedItem(slottedItem);
                              }}
                              onMouseEnter={playSubtleHover}
                              className="px-2 py-0.5 font-mono text-[8px] bg-neutral-800 border border-neutral-700 hover:border-red-900 hover:text-red-400 rounded transition-all duration-200 shrink-0 ml-2 text-neutral-300 cursor-pointer uppercase font-bold"
                            >
                              REMOVE
                            </button>
                          </motion.div>
                        ) : (
                          <div className="text-[9.5px] py-1.5 flex items-center justify-between px-2 w-full select-none text-neutral-450">
                            <span className="truncate">{slot.emptyGuidance}</span>
                            {getPriorityBadge(slot.priority)}
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
                    <span>⚙ SLOT ROLE: {activeSlotMeta.label.toUpperCase()}</span>
                    <span className="text-neutral-400 font-light text-[8px]">
                      ROLE: {activeSlotMeta.id.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-neutral-600 font-light leading-relaxed">
                    {activeSlotMeta.description}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-[8.5px] font-mono text-neutral-500">
                    <span className="uppercase text-[8px]">COMPATIBLE CATEGORIES:</span>
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
  const { 
    primaryUsp, 
    secondaryUsp, 
    setPrimaryUsp, 
    setSecondaryUsp, 
    updateScore, 
    generatedUSPs, 
    setGeneratedUSPs, 
    selectedProblem, 
    solutionDirection, 
    techStack, 
    gameMode,
    team,
    activeTeammateAdvice,
    useTeammateHelp,
    triggerCrewVote,
    hasCrewVotedThisStage,
    stage
  } = useGameStore();

  const [loading, setLoading] = useState(false);
  const [selectedUspToVote, setSelectedUspToVote] = useState<string>('');
  const [voteRole, setVoteRole] = useState<'primary' | 'secondary'>('primary');

  useEffect(() => {
    if (generatedUSPs.length > 0 && !selectedUspToVote) {
      setSelectedUspToVote(generatedUSPs[0].name);
    }
  }, [generatedUSPs, selectedUspToVote]);

  useEffect(() => {
    if (generatedUSPs.length === 0 && selectedProblem) {
      setLoading(true);
      const seed = gameMode === 'daily' ? getDailySeed().toString() : undefined;
      
      fetch("/api/generate-usps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedProblem,
          solutionDirection,
          techStack,
          gameMode,
          seed
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("USP API call failed");
        return res.json();
      })
      .then(data => {
        if (data.usps && data.usps.length > 0) {
          setGeneratedUSPs(data.usps);
        } else {
          const fallback = generateUSPOptions(selectedProblem, solutionDirection, techStack, gameMode, seed);
          setGeneratedUSPs(fallback);
        }
      })
      .catch(err => {
        console.error("API error for USPs, using offline fallback", err);
        const fallback = generateUSPOptions(selectedProblem, solutionDirection, techStack, gameMode, seed);
        setGeneratedUSPs(fallback);
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [generatedUSPs, selectedProblem, solutionDirection, techStack, gameMode, setGeneratedUSPs]);

  const handleSelectPrimary = (opt: any) => {
    if (secondaryUsp === opt.name) {
      setSecondaryUsp(null);
    }
    setPrimaryUsp(opt.name);
  };

  const handleSelectSecondary = (opt: any) => {
    if (primaryUsp === opt.name) {
      setPrimaryUsp(null);
    }
    setSecondaryUsp(opt.name);
  };

  useEffect(() => {
    const primaryObj = generatedUSPs.find(u => u.name === primaryUsp);
    const secondaryObj = generatedUSPs.find(u => u.name === secondaryUsp);

    if (primaryObj) {
      const innovation = Math.min(100, primaryObj.innovation + Math.floor((secondaryObj?.innovation || 0) * 0.5));
      const execution = Math.min(100, primaryObj.execution + Math.floor((secondaryObj?.execution || 0) * 0.5));
      const design = Math.min(100, primaryObj.design + Math.floor((secondaryObj?.design || 0) * 0.5));
      const pitch = Math.min(100, primaryObj.pitch + Math.floor((secondaryObj?.pitch || 0) * 0.5));

      updateScore("innovation", innovation);
      updateScore("execution", execution);
      updateScore("design", design);
      updateScore("pitch", pitch);
    } else {
      if (generatedUSPs.length > 0 && !primaryUsp) {
        setPrimaryUsp(generatedUSPs[0].name);
      }
    }
  }, [primaryUsp, secondaryUsp, generatedUSPs, updateScore, setPrimaryUsp]);

  if (loading) {
    return (
      <GameplayStageCard
        stageKey="usp"
        title="Round 4: Choose Your Unique Advantage"
        subtitle="Generating custom startup advantages tailored strictly to your problem statement and tech stack..."
      >
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-800"></div>
          <span className="font-mono text-[10px] text-muted-foreground animate-pulse uppercase tracking-wider">
            Generating dynamic advantages...
          </span>
        </div>
      </GameplayStageCard>
    );
  }

  return (
    <GameplayStageCard
      stageKey="usp"
      title="Round 4: Choose Your Unique Advantage"
      subtitle="Select a primary advantage and optionally a secondary advantage. Your startup points will blend according to your combined advantages!"
    >
      {/* Dynamic HUD showing current selections */}
      <div className="max-w-2xl mx-auto mb-6 p-4 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-[10px] grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <div>
          <span className="font-bold text-neutral-500 block uppercase">★ PRIMARY ADVANTAGE:</span>
          <span className="font-black text-neutral-900 text-[12px] mt-1 block">
            {primaryUsp ? primaryUsp.toUpperCase() : "NONE SELECTED (REQUIRED)"}
          </span>
        </div>
        <div>
          <span className="font-bold text-amber-600 block uppercase">☆ SECONDARY ADVANTAGE (BONUS):</span>
          <span className="font-black text-amber-700 text-[12px] mt-1 block">
            {secondaryUsp ? secondaryUsp.toUpperCase() : "NONE SELECTED"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left font-mono text-[11px]">
        {generatedUSPs.map((opt) => {
          const isPrimary = primaryUsp === opt.name;
          const isSecondary = secondaryUsp === opt.name;

          return (
            <div
              key={opt.key}
              onMouseEnter={playSubtleHover}
              className={`relative p-5 rounded-lg border text-left flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] ${
                isPrimary
                  ? "border-neutral-900 bg-neutral-50/80 shadow-md ring-1 ring-neutral-900"
                  : isSecondary
                    ? "border-amber-600/50 bg-amber-50/20 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-400 bg-white"
              }`}
            >
              {isPrimary && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold font-mono tracking-tight bg-neutral-900 text-neutral-100 rounded select-none">
                  ★ PRIMARY
                </span>
              )}
              {isSecondary && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold font-mono tracking-tight bg-amber-600 text-white rounded select-none">
                  ☆ SECONDARY
                </span>
              )}

              <div>
                <span className="font-bold text-neutral-900 block text-[12px] pr-12 leading-tight">
                  {opt.name}
                </span>
                <span className="text-[10px] text-muted-foreground mt-2 block font-sans font-light leading-relaxed">
                  {opt.desc}
                  <span className="block mt-3 font-mono text-[8px] text-emerald-600 select-none leading-normal">
                    ▲ ADVANTAGE: {opt.advantages}
                  </span>
                  <span className="block mt-1.5 font-mono text-[8px] text-rose-500 select-none leading-normal">
                    ▼ CHALLENGE: {opt.challenges}
                  </span>
                </span>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-dashed border-neutral-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playMutedClick();
                    handleSelectPrimary(opt);
                  }}
                  className={`flex-1 py-1.5 rounded text-[9px] font-bold font-mono cursor-pointer transition-all duration-150 border text-center ${
                    isPrimary
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  PRIMARY
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playMutedClick();
                    handleSelectSecondary(opt);
                  }}
                  className={`flex-1 py-1.5 rounded text-[9px] font-bold font-mono cursor-pointer transition-all duration-150 border text-center ${
                    isSecondary
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  SECONDARY
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 👥 CREW COLLABORATION ENGINE */}
      {team.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto border-2 border-neutral-900 bg-neutral-900 text-white rounded-lg p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] select-none">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
            <div className="text-left font-mono">
              <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">👥 CREW COLLABORATION ENGINE</span>
              <span className="text-[9px] text-neutral-450 block font-light leading-normal">
                Leverage your team's unique perspectives and roles to validate our product direction.
              </span>
            </div>
            <span className="text-[8px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded uppercase font-bold tracking-wide font-mono">
              STAGE: USP VALIDATION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Ask Strategist/Product advice */}
            <div className="p-3 bg-neutral-950 border border-neutral-850 rounded flex flex-col justify-between text-left space-y-3">
              <div className="space-y-1">
                <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wide block font-mono">💬 CONSULT TEAM SPECIALIST</span>
                <p className="text-[9px] text-neutral-400 font-light font-sans leading-relaxed">
                  Ask a Product Strategist, Designer, or Researcher to evaluate choices and deliver custom, inline recommendations.
                </p>
              </div>

              {(() => {
                const strategistTeammate = team.find(t => {
                  const r = (t.role || "").toLowerCase();
                  return r.includes('strategist') || r.includes('founder') || r.includes('business') || r.includes('designer') || r.includes('ux') || r.includes('researcher');
                });

                if (strategistTeammate) {
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-lg">{strategistTeammate.avatar}</span>
                        <div className="text-left">
                          <span className="font-bold text-[9px] text-white block leading-none">{strategistTeammate.name}</span>
                          <span className="text-[7.5px] text-neutral-400 uppercase tracking-tight">{strategistTeammate.role}</span>
                        </div>
                      </div>
                      <Button
                        size="xs"
                        onClick={() => {
                          playMutedClick();
                          useTeammateHelp(strategistTeammate.id, stage);
                        }}
                        disabled={strategistTeammate.helpTokenUsed || !!activeTeammateAdvice[strategistTeammate.id]}
                        className="w-full bg-amber-500 text-neutral-950 hover:bg-amber-400 border-none font-bold text-[8.5px] font-mono tracking-wider uppercase h-7 cursor-pointer"
                      >
                        {activeTeammateAdvice[strategistTeammate.id]
                          ? "PROPOSAL PENDING IN CHAT..."
                          : strategistTeammate.helpTokenUsed
                            ? "ADVICE TOKEN CONSUMED"
                            : `ASK FOR ${strategistTeammate.name.toUpperCase()}'S ADVICE`}
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="p-3 border border-dashed border-neutral-800 rounded bg-neutral-900/50 text-center py-6">
                    <span className="text-[8.5px] text-neutral-500 font-bold block uppercase tracking-wide font-mono">🔒 NO STRATEGIST IN CREW</span>
                    <span className="text-[7.5px] text-neutral-650 block mt-1 font-sans">
                      Hire a Product Strategist or Designer in Lobby next run to unlock expert consulting.
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Column 2: Cast a Crew-wide Poll Vote */}
            <div className="p-3 bg-neutral-950 border border-neutral-850 rounded flex flex-col justify-between text-left space-y-3">
              <div className="space-y-1">
                <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wide block font-mono">🗳️ TRIGGER CREW-WIDE POLL</span>
                <p className="text-[9px] text-neutral-400 font-light font-sans leading-relaxed">
                  Select a unique advantage and assign it as Primary or Secondary to run a customized crew-wide alignment poll.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* USP Selection Dropdown */}
                <div className="space-y-1">
                  <label className="text-[7.5px] text-neutral-400 font-bold uppercase block tracking-wider font-mono">SELECT USP TO VOTE ON:</label>
                  <select
                    value={selectedUspToVote}
                    onChange={(e) => setSelectedUspToVote(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-850 text-white rounded px-2 py-1 text-[9px] font-mono focus:outline-none focus:border-emerald-600 tracking-wide"
                  >
                    {generatedUSPs.map((u) => (
                      <option key={u.key || u.name} value={u.name} className="bg-neutral-950 text-white font-mono">
                        {u.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Switch: Primary vs Secondary */}
                <div className="space-y-1">
                  <label className="text-[7.5px] text-neutral-400 font-bold uppercase block tracking-wider font-mono">ASSIGN USP ROLE FOR POLL:</label>
                  <div className="flex gap-1 border border-neutral-850 p-0.5 rounded bg-neutral-900">
                    <button
                      type="button"
                      onClick={() => setVoteRole('primary')}
                      className={`flex-1 py-1 rounded text-[8px] font-bold font-mono tracking-wider transition-all duration-150 border-none cursor-pointer uppercase ${
                        voteRole === 'primary' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-transparent text-neutral-400 hover:text-white'
                      }`}
                    >
                      Primary USP
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoteRole('secondary')}
                      className={`flex-1 py-1 rounded text-[8px] font-bold font-mono tracking-wider transition-all duration-150 border-none cursor-pointer uppercase ${
                        voteRole === 'secondary' 
                          ? 'bg-amber-600 text-white shadow-sm' 
                          : 'bg-transparent text-neutral-400 hover:text-white'
                      }`}
                    >
                      Secondary USP
                    </button>
                  </div>
                </div>

                <Button
                  size="xs"
                  onClick={() => {
                    playMutedClick();
                    triggerCrewVote('usp', selectedUspToVote, voteRole);
                  }}
                  disabled={!selectedUspToVote}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-500 border-none font-bold text-[8.5px] font-mono tracking-wider uppercase h-7 cursor-pointer"
                >
                  ⚡ INITIATE CREW VOTE
                </Button>

                {hasCrewVotedThisStage[stage] && (
                  <div className="text-center font-bold text-[7.5px] text-emerald-400 uppercase tracking-widest font-mono pt-1 animate-pulse">
                    ✓ LAST POLL RECORDED IN CHAT FEED (+5 POINT PITCH BONUS LOCKED)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </GameplayStageCard>
  );
}

// --- Stage 6: Feature Prioritization Phase ----------------------------------

function FeaturesStage() {
  const { 
    features,
    reorderFeatures, 
    updateScore, 
    generatedBacklog, 
    setGeneratedBacklog, 
    generatedUSPs, 
    primaryUsp, 
    selectedProblem, 
    solutionDirection, 
    techStack,
    gameMode
  } = useGameStore();

  const [buckets, setBuckets] = useState<Record<string, 'must' | 'nice' | 'overkill' | 'backlog'>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // Find selected USP object
  const selectedUspObj = generatedUSPs.find(u => u.name === primaryUsp) || null;

  const recalculateFeatureScores = useCallback((nextBuckets: Record<string, 'must' | 'nice' | 'overkill' | 'backlog'>) => {
    let execution = 60;
    let design = 55;
    let innovation = 50;
    let bonus = 0;

    // Filter items into lists
    const mustItems = generatedBacklog.filter(f => nextBuckets[f.id] === 'must');
    const niceItems = generatedBacklog.filter(f => nextBuckets[f.id] === 'nice');
    const overkillItems = generatedBacklog.filter(f => nextBuckets[f.id] === 'overkill');

    const mustCount = mustItems.length;

    // 1. Calculate build effort footprint
    const totalMustEffort = mustItems.reduce((sum, f) => {
      const eff = f.effort === 'high' ? 3 : f.effort === 'medium' ? 2 : 1;
      return sum + eff;
    }, 0);

    // 2. Scoping evaluation
    if (totalMustEffort > 6) {
      // Scope bloat penalty!
      execution -= 18;
      design -= 5;
    } else if (totalMustEffort >= 4 && totalMustEffort <= 6) {
      // Balanced scope bonus!
      execution += 15;
      design += 10;
      bonus += 5;
    } else if (mustCount > 0 && totalMustEffort < 4) {
      // Under-scoped penalty!
      innovation -= 10;
    }

    // 3. Smart scoping bonus (placing high effort in Overkill/Nice to Have)
    const overkillHighEffortCount = [...niceItems, ...overkillItems].filter(f => f.effort === 'high').length;
    if (overkillHighEffortCount > 0) {
      execution += Math.min(overkillHighEffortCount * 6, 12);
      bonus += Math.min(overkillHighEffortCount * 3, 6);
    }

    // 4. Critical features design bonus (high impact + high innovation in Must-Have)
    const highValueMustCount = mustItems.filter(f => f.impact === 'high' && f.innovationScore >= 50).length;
    if (highValueMustCount > 0) {
      design += highValueMustCount * 5;
      innovation += highValueMustCount * 8;
    }

    // 5. Feature Dependency checking
    mustItems.forEach(f => {
      if (f.dependsOn && !mustItems.some(x => x.id === f.dependsOn)) {
        // Missing dependency! Severe execution penalty!
        execution -= 15;
      }
    });

    updateScore("execution", Math.max(0, Math.min(execution, 100)));
    updateScore("design", Math.max(0, Math.min(design, 100)));
    updateScore("innovation", Math.max(0, Math.min(innovation, 100)));
    updateScore("bonus", bonus);
  }, [generatedBacklog, updateScore]);

  // 1. Dynamic Features Backlog Generation on stage load
  useEffect(() => {
    if (generatedBacklog.length === 0 && selectedProblem) {
      const seed = gameMode === 'daily' ? getDailySeed().toString() : undefined;
      const backlog = generateFeatureBacklog(selectedProblem, solutionDirection, selectedUspObj, techStack, seed);
      setGeneratedBacklog(backlog);
    }
  }, [generatedBacklog, selectedProblem, solutionDirection, selectedUspObj, techStack, gameMode, setGeneratedBacklog]);

  // 2. Synchronize local buckets state with Zustand store features
  useEffect(() => {
    if (generatedBacklog.length > 0) {
      const persistedMustIds = new Set(features.map(f => f.id));
      setBuckets(prev => {
        let changed = false;
        const next = { ...prev };
        
        generatedBacklog.forEach(f => {
          const isMustInStore = persistedMustIds.has(f.id);
          const currentBucket = next[f.id];
          
          if (isMustInStore && currentBucket !== 'must') {
            next[f.id] = 'must';
            changed = true;
          } else if (!isMustInStore && currentBucket === 'must') {
            next[f.id] = 'backlog';
            changed = true;
          } else if (next[f.id] === undefined) {
            next[f.id] = 'backlog';
            changed = true;
          }
        });
        
        if (changed) {
          // Defer to avoid state update during render warning
          setTimeout(() => {
            recalculateFeatureScores(next);
          }, 0);
          return next;
        }
        return prev;
      });
    }
  }, [features, generatedBacklog, recalculateFeatureScores]);

  // Click trigger to cycle feature buckets (touch fallback)
  const handleCycleBucket = (id: string) => {
    const nextBuckets = { ...buckets };
    const current = nextBuckets[id] || 'backlog';
    
    // Cycle: backlog -> must -> nice -> overkill -> backlog
    nextBuckets[id] = 
      current === 'backlog' ? 'must' : 
      current === 'must' ? 'nice' : 
      current === 'nice' ? 'overkill' : 
      'backlog';
    
    setBuckets(nextBuckets);
    recalculateFeatureScores(nextBuckets);
    
    // Save flat array of must-have features in Zustand backlog features
    const mustList = generatedBacklog.filter(f => nextBuckets[f.id] === 'must');
    reorderFeatures(mustList);
    playSnapSound();
  };

  // Drag and drop end trigger
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    let targetBucket: 'must' | 'nice' | 'overkill' | 'backlog';
    const overIdStr = over.id as string;

    if (overIdStr === 'backlog' || overIdStr === 'must' || overIdStr === 'nice' || overIdStr === 'overkill') {
      targetBucket = overIdStr;
    } else {
      // Dropped on a card! Find which bucket that target card belongs to.
      targetBucket = buckets[overIdStr] || 'backlog';
    }

    const nextBuckets = { ...buckets, [active.id]: targetBucket };

    setBuckets(nextBuckets);
    recalculateFeatureScores(nextBuckets);

    const mustList = generatedBacklog.filter(f => nextBuckets[f.id] === 'must');
    reorderFeatures(mustList);
    playSnapSound();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: any) => {
    playSubtleHover();
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEndWithActive = (event: DragEndEvent) => {
    handleDragEnd(event);
    setActiveId(null);
  };

  const activeFeat = activeId ? generatedBacklog.find(f => f.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWithActive}
      onDragCancel={handleDragCancel}
    >
      <GameplayStageCard
        stageKey="features"
        title="Round 5: Prioritize Your Features"
        subtitle="Time is ticking. You can't build everything in a weekend. Drag backlog features into priority buckets. Be careful: overloading 'Core MVP' will hurt your execution quality."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left font-mono text-[11px]">
          {([
            { id: 'backlog', label: 'Feature Pool', empty: 'Empty Pool' },
            { id: 'must', label: 'Core MVP', empty: 'Empty Slot' },
            { id: 'nice', label: 'Stretch Goals', empty: 'Empty Slot' },
            { id: 'overkill', label: 'Skip for Now', empty: 'Empty Slot' },
          ] as const).map((col) => {
            const items = generatedBacklog.filter(f => buckets[f.id] === col.id);
            return (
              <div key={col.id} className="flex flex-col space-y-2">
                <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">
                  {col.label.toUpperCase()} ({items.length}):
                </span>
                
                <DropZone
                  id={col.id}
                  currentCount={items.length}
                  hideDefaultEmpty={false}
                  emptyLabel={col.empty}
                  className="bg-neutral-50/20 rounded-lg p-2 h-[460px] overflow-y-auto pr-1.5 border border-transparent hover:border-neutral-200/40 transition-colors"
                >
                  <div className="space-y-1.5 py-1 select-none">
                    {items.map((feat) => (
                      <DraggableCard key={feat.id} id={feat.id} data={{ ...feat }} className="p-2.5">
                        <button
                          type="button"
                          onClick={() => handleCycleBucket(feat.id)}
                          onMouseEnter={playSubtleHover}
                          className="w-full text-left flex flex-col focus:outline-none"
                          aria-label={`Cycle column for ${feat.name}`}
                        >
                          <span className="font-bold text-neutral-900 text-[10px] leading-tight block">
                            {feat.name.toUpperCase()}
                          </span>
                          <span className="text-[7.5px] font-sans text-muted-foreground mt-1.5 block font-light leading-normal line-clamp-2">
                            {feat.description}
                          </span>
                          <div className="flex items-center gap-1.5 mt-2.5 text-[7px] tracking-wide font-mono uppercase">
                            <span className="text-neutral-400">COMPLEXITY:</span>
                            <span className={cn(
                              feat.effort === 'low' ? 'text-emerald-600 font-bold' :
                              feat.effort === 'medium' ? 'text-amber-600 font-bold' :
                              'text-rose-600 font-bold'
                            )}>
                              {feat.effort === 'low' ? 'EASY BUILD' :
                               feat.effort === 'medium' ? 'MODERATE BUILD' :
                               'AMBITIOUS BUILD'}
                            </span>
                            <span className="text-neutral-350">|</span>
                            <span className="text-neutral-400">IMPACT:</span>
                            <span className="text-neutral-900 font-bold">{feat.impact}</span>
                          </div>
                        </button>
                      </DraggableCard>
                    ))}
                  </div>
                </DropZone>
              </div>
            );
          })}
        </div>
      </GameplayStageCard>
      <DragOverlay>
        {activeFeat ? (
          <div className="glass-card-strong rounded-xl p-2.5 shadow-xl shadow-neutral-400/25 ring-1 ring-neutral-300/80 text-left flex flex-col select-none max-w-[240px] bg-white border border-neutral-200">
            <span className="font-bold text-neutral-900 text-[10px] leading-tight block">
              {activeFeat.name.toUpperCase()}
            </span>
            <span className="text-[7.5px] font-sans text-muted-foreground mt-1.5 block font-light leading-normal line-clamp-2">
              {activeFeat.description}
            </span>
            <div className="flex items-center gap-1.5 mt-2.5 text-[7px] tracking-wide font-mono uppercase">
              <span className="text-neutral-400">COMPLEXITY:</span>
              <span className={cn(
                activeFeat.effort === 'low' ? 'text-emerald-600 font-bold' :
                activeFeat.effort === 'medium' ? 'text-amber-600 font-bold' :
                'text-rose-600 font-bold'
              )}>
                {activeFeat.effort === 'low' ? 'EASY BUILD' :
                 activeFeat.effort === 'medium' ? 'MODERATE BUILD' :
                 'AMBITIOUS BUILD'}
              </span>
              <span className="text-neutral-350">|</span>
              <span className="text-neutral-400">IMPACT:</span>
              <span className="text-neutral-900 font-bold">{activeFeat.impact}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// --- Update v1.5: Pitch Deck Builder Phase Stage
function PitchDeckStage() {
  const { pitchDeck, setPitchDeck, pitchDeckScore, deckNarrativeQuality, deckArchetype } = useGameStore();

  const [activeLibraryTab, setActiveLibraryTab] = useState<'all' | 'intro' | 'problem-solution' | 'technology' | 'business' | 'closing'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [consoleMsg, setConsoleMsg] = useState<string>("STORYBOARD ANALYZER ONLINE: READY TO PARSE PITCH STORY FLOW");

  // Ensure deck is initialized as 8 slots
  useEffect(() => {
    if (pitchDeck.length !== 8) {
      const initialized = Array(8).fill("");
      // copy over any existing values up to 8
      pitchDeck.forEach((val, idx) => {
        if (idx < 8) initialized[idx] = val;
      });
      setPitchDeck(initialized);
    }
  }, [pitchDeck, setPitchDeck]);

  const evaluation = evaluatePitchDeck(pitchDeck);

  const handleToggleSlideLeftPanel = (slideId: string) => {
    const nextDeck = [...pitchDeck];
    const existingIdx = nextDeck.indexOf(slideId);
    if (existingIdx !== -1) {
      // Remove it
      nextDeck[existingIdx] = "";
      setPitchDeck(nextDeck);
      playSnapSound();
      setConsoleMsg(`Removed slide: ${AVAILABLE_SLIDES.find(s => s.id === slideId)?.name.toUpperCase()}`);
    } else {
      // Find first empty slot
      const emptyIdx = nextDeck.indexOf("");
      if (emptyIdx !== -1) {
        nextDeck[emptyIdx] = slideId;
        setPitchDeck(nextDeck);
        playSnapSound();
        setConsoleMsg(`Added slide: ${AVAILABLE_SLIDES.find(s => s.id === slideId)?.name.toUpperCase()} to storyboard position ${emptyIdx + 1}`);
      } else {
        playWarningTick();
        setConsoleMsg("Warning: Pitch deck is full (maximum 8 slides). Remove a slide before adding a new one.");
      }
    }
  };

  const handleRemoveSlot = (slotIdx: number) => {
    const nextDeck = [...pitchDeck];
    const removedId = nextDeck[slotIdx];
    nextDeck[slotIdx] = "";
    setPitchDeck(nextDeck);
    playSnapSound();
    if (removedId) {
      setConsoleMsg(`Removed slide: ${AVAILABLE_SLIDES.find(s => s.id === removedId)?.name.toUpperCase()} from storyboard position ${slotIdx + 1}`);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const nextDeck = [...pitchDeck];
    const overIdStr = over.id as string;
    const targetIdx = parseInt(overIdStr.replace("slot-", ""), 10);

    if (isNaN(targetIdx)) return;

    const activeIdStr = active.id as string;

    if (activeIdStr.startsWith("slot-")) {
      // Reordering between slots!
      const sourceIdx = parseInt(activeIdStr.replace("slot-", ""), 10);
      if (isNaN(sourceIdx)) return;

      const temp = nextDeck[sourceIdx];
      nextDeck[sourceIdx] = nextDeck[targetIdx];
      nextDeck[targetIdx] = temp;

      setPitchDeck(nextDeck);
      playSnapSound();
      setConsoleMsg(`Swapped storyboard positions: ${sourceIdx + 1} and ${targetIdx + 1}`);
    } else {
      // Dragging from available slides list
      const slideId = activeIdStr;
      
      // If it is already in another slot, clear it there (move it)
      const existingIdx = nextDeck.indexOf(slideId);
      if (existingIdx !== -1) {
        nextDeck[existingIdx] = "";
      }

      nextDeck[targetIdx] = slideId;
      setPitchDeck(nextDeck);
      playSnapSound();
      setConsoleMsg(`Placed slide: ${AVAILABLE_SLIDES.find(s => s.id === slideId)?.name.toUpperCase()} on storyboard position ${targetIdx + 1}`);
    }
  };

  // Filter components list
  const filteredSlides = AVAILABLE_SLIDES.filter(s => {
    if (activeLibraryTab !== 'all' && s.category !== activeLibraryTab) return false;
    if (searchQuery.trim() !== "") {
      const matchQuery = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(matchQuery) || 
             s.description.toLowerCase().includes(matchQuery);
    }
    return true;
  });

  const slottedCount = pitchDeck.filter(s => s !== "").length;
  const remainingCount = 8 - slottedCount;

  // Real-form story metrics checklist HUD (non-blocking)
  const hasOpening = pitchDeck[0] !== "";
  const hasProblemOrJourney = pitchDeck.includes('problem') || pitchDeck.includes('user-journey') || pitchDeck.includes('customer-persona');
  const hasSolutionOrDemo = pitchDeck.includes('solution') || pitchDeck.includes('demo') || pitchDeck.includes('prototype-screens');
  const hasTechDepth = pitchDeck.includes('tech-stack') || pitchDeck.includes('architecture');
  const hasBizModel = pitchDeck.includes('business-model') || pitchDeck.includes('revenue') || pitchDeck.includes('gtm');
  const hasClosingAtEnd = pitchDeck[7] !== "";

  // Always enable continue navigation for free-form storytelling creative freedom
  const disableNext = false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Storytelling Presentation Positions
  const getSlotGuide = (idx: number) => {
    switch (idx) {
      case 0: return { label: "OPENING POSITION", type: "intro" };
      case 7: return { label: "CLOSING POSITION", type: "closing" };
      default: return { label: `STORYTELLING SECTION ${idx}`, type: "section" };
    }
  };

  const tabs = [
    { id: 'all', label: 'ALL SLIDES' },
    { id: 'intro', label: 'INTRO' },
    { id: 'problem-solution', label: 'STORY' },
    { id: 'technology', label: 'TECH' },
    { id: 'business', label: 'BUSINESS' },
    { id: 'closing', label: 'CLOSING' }
  ] as const;

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <GameplayStageCard
        stageKey="pitchDeck"
        title="Round 6: Build Your Pitch Deck"
        subtitle="Prepare your story before facing the judges. Drag slide cards into your pitch storyboard positions. A cohesive narrative structure will win over the jury."
        disableNext={disableNext}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto text-left font-mono text-[11px]">
          
          {/* Left Panel: Available Components with Search & Tabs (5 cols) */}
          <div className="lg:col-span-5 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">SLIDE LIBRARY:</span>
              <span className="text-[8px] bg-neutral-100 border border-neutral-250 px-1 py-0.5 rounded text-neutral-600 font-bold uppercase tracking-tight select-none">
                {slottedCount} / 8 SLIDES ADDED
              </span>
            </div>

            {/* Search Input bar */}
            <input
              type="text"
              placeholder="SEARCH SLIDES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-250 text-neutral-800 text-[10px] p-2 rounded focus:outline-none focus:border-neutral-400 font-mono"
            />

            {/* Visual Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-2 select-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLibraryTab(tab.id)}
                  onMouseEnter={playSubtleHover}
                  className={`px-1.5 py-0.5 border text-[7.5px] uppercase rounded font-bold font-mono tracking-tight transition-colors cursor-pointer ${
                    activeLibraryTab === tab.id
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-white border-neutral-200 text-neutral-550 hover:border-neutral-350"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[420px] border border-neutral-200 p-2 rounded bg-neutral-50/30">
              {filteredSlides.length > 0 ? (
                filteredSlides.map((slide) => {
                  const isSlotted = pitchDeck.includes(slide.id);
                  return (
                    <DraggableCard key={slide.id} id={slide.id} data={{ ...slide }}>
                      <button
                        onClick={() => handleToggleSlideLeftPanel(slide.id)}
                        onMouseEnter={playSubtleHover}
                        className={`w-full text-left p-2.5 rounded border transition-all duration-150 transform hover:-translate-y-0.5 flex items-start gap-2.5 ${
                          isSlotted
                            ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                            : "bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400"
                        }`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border font-bold text-[8px] uppercase ${
                          isSlotted ? "bg-white border-white text-neutral-950" : "border-neutral-300 text-neutral-400"
                        }`}>
                          {isSlotted ? "✓" : "+"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[10px] truncate block uppercase text-neutral-900 tracking-tight leading-none">{slide.name}</span>
                            <span className={`text-[7px] uppercase px-1 rounded font-bold font-mono tracking-tight shrink-0 ${
                              isSlotted ? "bg-neutral-800 text-white border border-neutral-700" : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                            }`}>
                              {slide.category}
                            </span>
                          </div>
                          <p className={`text-[8.5px] font-sans mt-1.5 font-light leading-normal ${
                            isSlotted ? "text-neutral-300" : "text-muted-foreground"
                          }`}>
                            {slide.description}
                          </p>
                        </div>
                      </button>
                    </DraggableCard>
                  );
                })
              ) : (
                <div className="text-center py-8 text-neutral-400 italic">
                  [NO MATCHING SLIDES FOUND]
                </div>
              )}
            </div>
          </div>

          {/* Center Panel: Storytelling Positions Board (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">YOUR PITCH STORYBOARD:</span>
            
            <div className="grid grid-cols-1 gap-2 border border-neutral-200 p-2.5 rounded bg-white max-h-[480px] overflow-y-auto">
              {Array(8).fill("").map((_, idx) => {
                const slideId = pitchDeck[idx];
                const slottedSlide = slideId ? AVAILABLE_SLIDES.find(s => s.id === slideId) : null;
                const guide = getSlotGuide(idx);
                
                return (
                  <React.Fragment key={`slot-container-${idx}`}>
                    <DropZone
                      id={`slot-${idx}`}
                      label={guide.label}
                      currentCount={slottedSlide ? 1 : 0}
                      hideDefaultEmpty={true}
                    >
                      {slottedSlide ? (
                        <DraggableCard id={`slot-${idx}`} data={{ index: idx, slideId }}>
                          <div className="p-2.5 bg-neutral-900 border border-neutral-900 rounded flex items-start justify-between shadow-sm hover:border-neutral-800 transition-colors select-none text-white text-[10px]">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="font-mono font-bold text-amber-400 text-[8.5px] uppercase shrink-0 mt-0.5">
                                [{idx === 0 ? "OPENING" : idx === 7 ? "CLOSING" : `SLIDE ${idx + 1}`}]
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold uppercase tracking-wide truncate block">{slottedSlide.name}</span>
                                  <span className="text-[7px] uppercase px-1 rounded bg-neutral-800 text-neutral-300 font-mono tracking-tight shrink-0 font-bold">
                                    {slottedSlide.category}
                                  </span>
                                </div>
                                <p className="text-[8px] text-neutral-400 font-sans mt-1 leading-normal font-light truncate">
                                  {slottedSlide.description}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSlot(idx);
                              }}
                              onMouseEnter={playSubtleHover}
                              className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded font-bold font-mono text-[9px] uppercase transition-colors shrink-0 leading-none cursor-pointer"
                              title="Remove slide"
                            >
                              [×]
                            </button>
                          </div>
                        </DraggableCard>
                      ) : (
                        <div className="p-2 border border-dashed border-neutral-200 rounded flex flex-col justify-center min-h-[44px] select-none text-[9px] hover:border-neutral-400 hover:bg-neutral-50/30 transition-all duration-300">
                          <span className="font-mono text-neutral-450 uppercase tracking-tight font-bold text-[8px]">
                            Storyboard Position {idx + 1}
                          </span>
                          <p className="text-[7.5px] text-muted-foreground font-sans mt-0.5 leading-none italic uppercase">
                            + Add Slide
                          </p>
                        </div>
                      )}
                    </DropZone>
                    {idx < 7 && (
                      <div className="flex justify-center items-center py-0.5 select-none animate-pulse">
                        <span className="text-neutral-300 font-bold text-[10px]">&darr;</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Status Panel: Storytelling HUD & Real-Time Terminal (3 cols) */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            
            {/* Checklist HUD (Non-blocking visual aids) */}
            <div className="p-3 border border-neutral-300 rounded bg-white space-y-2.5 shadow-sm">
              <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-200 pb-1 block">
                STORY METRICS
              </span>
              
              <div className="space-y-1.5 font-mono text-[9.5px]">
                <div className="flex items-center gap-1.5">
                  <span className={hasOpening ? "text-emerald-600 font-bold" : "text-neutral-300"}>
                    {hasOpening ? "[✓]" : "[ ]"}
                  </span>
                  <span className={hasOpening ? "text-neutral-800 font-bold" : "text-neutral-400"}>
                    OPENING SLIDE
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={hasProblemOrJourney ? "text-emerald-600 font-bold" : "text-neutral-300"}>
                    {hasProblemOrJourney ? "[✓]" : "[ ]"}
                  </span>
                  <span className={hasProblemOrJourney ? "text-neutral-800 font-bold" : "text-neutral-400"}>
                    PROBLEM OR JOURNEY
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={hasSolutionOrDemo ? "text-emerald-600 font-bold" : "text-neutral-300"}>
                    {hasSolutionOrDemo ? "[✓]" : "[ ]"}
                  </span>
                  <span className={hasSolutionOrDemo ? "text-neutral-800 font-bold" : "text-neutral-400"}>
                    SOLUTION OR DEMO
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={hasTechDepth ? "text-emerald-600 font-bold" : "text-neutral-300"}>
                    {hasTechDepth ? "[✓]" : "[ ]"}
                  </span>
                  <span className={hasTechDepth ? "text-neutral-800 font-bold" : "text-neutral-400"}>
                    TECH ARCHITECTURE
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={hasBizModel ? "text-emerald-600 font-bold" : "text-neutral-300"}>
                    {hasBizModel ? "[✓]" : "[ ]"}
                  </span>
                  <span className={hasBizModel ? "text-neutral-800 font-bold" : "text-neutral-400"}>
                    MONETIZATION / BIZ
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={hasClosingAtEnd ? "text-emerald-600 font-bold" : "text-neutral-300"}>
                    {hasClosingAtEnd ? "[✓]" : "[ ]"}
                  </span>
                  <span className={hasClosingAtEnd ? "text-neutral-800 font-bold" : "text-neutral-400"}>
                    CLOSING SLIDE
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Archetype Live Monitor */}
            <div className="p-3 border border-neutral-300 rounded bg-white space-y-2 shadow-sm">
              <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-200 pb-1 block">
                PITCH STORYBOARD ANALYSIS
              </span>
              
              <div className="space-y-1 font-mono text-[9px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">PITCH TYPE:</span>
                  <span className="font-bold text-neutral-900 uppercase">{deckArchetype}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">STORY STRUCTURE:</span>
                  <span className={`font-bold uppercase ${
                    deckNarrativeQuality === 'Legendary'
                      ? "text-emerald-600"
                      : deckNarrativeQuality === 'Persuasive'
                      ? "text-blue-600"
                      : deckNarrativeQuality === 'Coherent'
                      ? "text-amber-600"
                      : "text-red-500 animate-pulse"
                  }`}>{deckNarrativeQuality}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-1.5 mt-1 border-dashed">
                  <span className="text-neutral-800 font-bold">STORY QUALITY SCORE:</span>
                  <span className="font-bold text-neutral-950 text-xs">{pitchDeckScore} / 100</span>
                </div>
              </div>
            </div>

            {/* Terminal Console Log */}
            <div className="flex-1 flex flex-col p-3 bg-neutral-950 border border-neutral-900 rounded shadow-md text-white font-mono text-[9px] min-h-[140px] overflow-hidden">
              <span className="text-neutral-500 uppercase border-b border-neutral-805 pb-1 mb-2 font-bold flex items-center gap-1 select-none">
                <Terminal className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                STORYBOARD CONSOLE
              </span>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono leading-relaxed select-text">
                <span className="text-amber-400 block">&gt; {consoleMsg}</span>
                
                {evaluation.feedback.length > 0 ? (
                  evaluation.feedback.map((log, i) => {
                    const isWarn = log.includes("Missing") || log.includes("before") || log.includes("penalty") || log.includes("muddled") || log.includes("Vaporware") || log.includes("Duplicate") || log.includes("Dry");
                    return (
                      <span key={i} className={`block leading-normal ${
                        isWarn ? "text-red-400 font-bold" : "text-neutral-305 font-normal"
                      }`}>
                        {isWarn ? "⚠️ " : "✓ "}{log}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-neutral-600 italic block">
                    [Your storyboard is currently empty. Add slides to analyze your pitch structure.]
                  </span>
                )}
              </div>
            </div>
            
          </div>

        </div>
      </GameplayStageCard>
    </DndContext>
  );
}

// --- Stage 7: Mentor Phase --------------------------------------------------

function MentorStage() {
  const { 
    techStack, 
    solutionDirection, 
    usp, 
    features, 
    activeModifiers,
    generatedAdvisorAdvice,
    setGeneratedAdvisorAdvice,
    applyAdvisorAdvice,
    rejectAdvisorAdvice,
    selectedProblem,
    gameMode,
    pitchDeck,
    businessModel,
    generatedBusinessModels,
    mentorConfidence,
  } = useGameStore();

  const isMentorLocked = activeModifiers.includes("NO_MENTOR");

  // 1. Procedurally generate co-founder advice cards on stage load
  useEffect(() => {
    if (generatedAdvisorAdvice.length === 0 && selectedProblem) {
      const seed = gameMode === 'daily' ? getDailySeed().toString() : undefined;
      const advice = generateAdvisorAdvice(
        selectedProblem, 
        solutionDirection, 
        usp, 
        features, 
        techStack, 
        gameMode, 
        seed,
        pitchDeck,
        businessModel,
        generatedBusinessModels
      );
      setGeneratedAdvisorAdvice(advice);
    }
  }, [generatedAdvisorAdvice, selectedProblem, solutionDirection, usp, features, techStack, gameMode, setGeneratedAdvisorAdvice, pitchDeck, businessModel, generatedBusinessModels]);

  // Determine assessment text based on mentorConfidence score
  let assessmentQuote = "A solid hackathon contender. Good scope discipline and logical deck structure.";
  if (mentorConfidence < 40) {
    assessmentQuote = "Honestly, I wouldn't touch this project with a ten-foot pole. Scrap it or pivot immediately.";
  } else if (mentorConfidence < 70) {
    assessmentQuote = "It has some potential, but the execution is currently highly questionable. Respond to feedback.";
  } else if (mentorConfidence >= 90) {
    assessmentQuote = "I would personally bet on this project. This is a potential winner.";
  }

  return (
    <GameplayStageCard
      stageKey="mentor"
      title="Round 7: Mentoring Round"
      subtitle="Industry mentors have reviewed your progress. They'll suggest strategic improvements to your technology stack, product scope, or business model. You can follow their advice or stick to your plan."
    >
      <div className="max-w-xl mx-auto font-mono text-[11px] space-y-4">
        {isMentorLocked ? (
          <div className="text-center py-6 bg-white border border-neutral-200 rounded-md shadow-sm space-y-4">
            <span className="text-[28px]">🚫</span>
            <h3 className="font-bold text-neutral-900 uppercase">
              MENTORS UNAVAILABLE
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-sans font-light">
              Hardcore mode doesn't allow external guidance. You are entirely on your own.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            {/* Mentor Confidence HUD */}
            <div className="p-4 bg-neutral-950 text-neutral-50 border border-neutral-800 rounded-md space-y-2">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-1.5">
                <span className="text-neutral-400 font-bold uppercase tracking-wider text-[9px]">MENTOR CONFIDENCE RATING</span>
                <span className={`text-[13px] font-bold ${mentorConfidence >= 70 ? 'text-emerald-400' : (mentorConfidence >= 40 ? 'text-amber-400' : 'text-red-400')}`}>
                  {mentorConfidence} / 100
                </span>
              </div>
              <p className="text-[9.5px] italic text-neutral-300 font-sans leading-relaxed">
                "{assessmentQuote}"
              </p>
            </div>

            <span className="text-neutral-400 block text-[9px] uppercase border-b border-neutral-200 pb-1 mb-2">MENTOR ADVICE STREAMS ({generatedAdvisorAdvice.length}):</span>
            
            <div className="space-y-3">
              {generatedAdvisorAdvice.map((adv) => {
                const persona = adv.mentorPersona || { name: "Co-Founder", role: "Strategic Advisor", avatar: "👤" };
                return (
                  <div key={adv.id} className="p-4 bg-white border border-neutral-200 rounded-md flex flex-col justify-between space-y-3 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[20px] select-none">{persona.avatar}</span>
                        <div>
                          <div className="flex gap-2 items-center">
                            <h4 className="font-bold text-neutral-900 uppercase text-[11px]">{persona.name}</h4>
                            <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded text-[7.5px] font-bold uppercase">
                              {persona.role}
                            </span>
                          </div>
                          <span className="text-neutral-400 text-[8px] uppercase font-bold block mt-0.5">RECOMMENDS: {adv.title}</span>
                          <p className="text-[9.5px] text-neutral-700 mt-2 font-mono leading-relaxed bg-neutral-50 border-l-2 border-neutral-300 pl-2.5 py-1">
                            "{adv.explanation}"
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {adv.status === 'applied' && (
                          <span className="px-2 py-0.5 border border-emerald-500 rounded text-emerald-600 font-bold uppercase text-[7.5px] whitespace-nowrap bg-emerald-50">
                            ● ADVICE FOLLOWED
                          </span>
                        )}
                        {adv.status === 'rejected' && (
                          <span className="px-2 py-0.5 border border-red-400 rounded text-red-500 font-bold uppercase text-[7.5px] whitespace-nowrap bg-red-50">
                            ● ADVICE IGNORED
                          </span>
                        )}
                        {adv.status === 'pending' && (
                          <span className="px-2 py-0.5 border border-amber-400 rounded text-amber-500 font-bold uppercase text-[7.5px] whitespace-nowrap bg-amber-50">
                            ● MENTOR WAITING
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-dashed border-neutral-200 pt-2.5 text-[9px]">
                      <div>
                        <span className="text-neutral-400 block uppercase text-[7.5px] font-bold">EXPECTED BENEFIT:</span>
                        <span className="text-neutral-800 font-sans">{adv.expectedImpact}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block uppercase text-[7.5px] font-bold">CONSIDERATIONS:</span>
                        <span className="text-amber-600 font-mono font-bold">{adv.tradeoffs}</span>
                      </div>
                    </div>

                    {adv.status === 'pending' && (
                      <div className="flex gap-2 pt-1 border-t border-dashed border-neutral-100 mt-1">
                        <button
                          onClick={() => {
                            playScoreChord();
                            applyAdvisorAdvice(adv.id);
                          }}
                          onMouseEnter={playSubtleHover}
                          className="px-3 py-1 border border-neutral-900 bg-neutral-900 text-white rounded text-[9px] uppercase tracking-wider font-bold hover:bg-neutral-800 transition cursor-pointer"
                        >
                          [FOLLOW ADVICE]
                        </button>
                        <button
                          onClick={() => {
                            playMutedClick();
                            rejectAdvisorAdvice(adv.id);
                          }}
                          onMouseEnter={playSubtleHover}
                          className="px-3 py-1 border border-neutral-300 bg-white text-neutral-600 rounded text-[9px] uppercase tracking-wider font-bold hover:border-neutral-500 hover:text-neutral-800 transition cursor-pointer"
                        >
                          [IGNORE ADVICE]
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </GameplayStageCard>
  );
}

// --- Stage 8: Business Model Phase ------------------------------------------

function BusinessModelStage() {
  const { 
    businessModel, 
    setBusinessModel, 
    generatedBusinessModels, 
    setGeneratedBusinessModels, 
    selectedProblem, 
    usp, 
    solutionDirection, 
    techStack, 
    features, 
    gameMode,
    updateScore,
    team,
    activeTeammateAdvice,
    useTeammateHelp,
    triggerCrewVote,
    hasCrewVotedThisStage,
    stage
  } = useGameStore();

  const [selectedModelToVote, setSelectedModelToVote] = useState<string>('');

  useEffect(() => {
    if (generatedBusinessModels.length > 0 && !selectedModelToVote) {
      setSelectedModelToVote(generatedBusinessModels[0].id);
    }
  }, [generatedBusinessModels, selectedModelToVote]);

  // 1. Procedurally generate business models on stage load
  useEffect(() => {
    if (generatedBusinessModels.length === 0 && selectedProblem) {
      const seed = gameMode === 'daily' ? getDailySeed().toString() : undefined;
      const models = generateBusinessModels(selectedProblem, solutionDirection, usp, features, techStack, gameMode, seed);
      setGeneratedBusinessModels(models);
    }
  }, [generatedBusinessModels, selectedProblem, solutionDirection, usp, features, techStack, gameMode, setGeneratedBusinessModels]);

  const handleSelect = (opt: any) => {
    setBusinessModel(opt.id);

    // Apply dynamic fit scoring
    let pitch = 70;
    let execution = 70;

    if (opt.riskLevel === 'Low') {
      execution += 15;
    } else if (opt.riskLevel === 'High') {
      pitch += 20;
      execution -= 10;
    } else {
      pitch += 10;
      execution += 5;
    }

    updateScore("pitch", Math.max(0, Math.min(pitch, 100)));
    updateScore("execution", Math.max(0, Math.min(execution, 100)));

    // Regenerate pitch in real time
    const updatedState = useGameStore.getState();
    const nextPitch = generateCustomElevatorPitch(
      updatedState.selectedProblem,
      updatedState.solutionDirection,
      updatedState.usp,
      updatedState.features,
      opt,
      updatedState.generatedAdvisorAdvice,
      updatedState.techStack
    );
    useGameStore.setState({ pitchText: nextPitch });
  };

  useEffect(() => {
    if (!businessModel && generatedBusinessModels.length > 0) {
      handleSelect(generatedBusinessModels[0]);
    }
  }, [businessModel, generatedBusinessModels]);

  const activeModel = generatedBusinessModels.find(m => m.id === businessModel) || null;

  return (
    <GameplayStageCard
      stageKey="businessModel"
      title="Round 8: Business Model Round"
      subtitle="Your project needs a path to sustainability. Choose how your project creates value, who pays for it, and how it can grow beyond the hackathon."
    >
      <div className="max-w-4xl mx-auto space-y-6 text-left font-mono text-[11px]">
        {/* Model grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {generatedBusinessModels.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                playMutedClick();
                handleSelect(opt);
              }}
              onMouseEnter={playSubtleHover}
              className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
                businessModel === opt.id
                  ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
                  : "border-neutral-200 hover:border-neutral-400 bg-white"
              }`}
            >
              <div>
                <span className="font-bold text-neutral-900 block text-[11px]">{opt.name.toUpperCase()}</span>
                <span className="text-[8px] text-neutral-450 italic block mt-1 font-sans">
                  Value Prop: {opt.valueProp}
                </span>
                <span className="text-[9px] text-muted-foreground mt-2 block font-sans font-light leading-relaxed">
                  {opt.desc}
                </span>
                <div className="mt-2 space-y-1 select-none">
                  <span className="block text-[8px] text-emerald-600 font-mono leading-normal">
                    ▲ STRENGTH: {opt.potentialStrengths}
                  </span>
                  <span className="block text-[8px] text-rose-500 font-mono leading-normal">
                    ▼ RISK: {opt.potentialRisks}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-dashed border-neutral-200 flex justify-between items-center text-[8.5px]">
                <span className="text-neutral-400 uppercase">RISK LEVEL:</span>
                <span className={`font-bold uppercase ${
                  opt.riskLevel === 'Low' ? 'text-emerald-600' :
                  opt.riskLevel === 'High' ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {opt.riskLevel}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected model details - Revenue Strategy Grid */}
        {activeModel && (
          <div className="p-5 bg-neutral-900 border border-neutral-950 text-white rounded-md shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-emerald-400 font-bold text-[12px] uppercase">● YOUR REVENUE STRATEGY: {activeModel.name.toUpperCase()}</span>
              <span className="text-neutral-500 text-[8px]">[STRATEGIC ALIGNMENT]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-500 block uppercase text-[8px]">TARGET CUSTOMER:</span>
                <span className="text-neutral-200 font-sans text-[10px] leading-relaxed">{activeModel.customer}</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-500 block uppercase text-[8px]">VALUE EXCHANGE:</span>
                <span className="text-neutral-200 font-sans text-[10px] leading-relaxed">{activeModel.monetization}</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-500 block uppercase text-[8px]">PRICING STRUCTURE:</span>
                <span className="text-emerald-400 block font-mono text-[10px] font-bold mt-1">{activeModel.pricingStructure}</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-500 block uppercase text-[8px]">FUTURE ROADMAP:</span>
                <span className="text-neutral-200 font-sans text-[10px] leading-relaxed">{activeModel.growthStrategy}</span>
              </div>
            </div>
            
            <div className="border-t border-neutral-800 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <span className="text-emerald-400 block uppercase text-[8px] font-bold">▲ KEY STRENGTH:</span>
                <span className="text-neutral-200 font-sans text-[10px] leading-relaxed">{activeModel.potentialStrengths}</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <span className="text-rose-400 block uppercase text-[8px] font-bold">▼ CRITICAL RISK:</span>
                <span className="text-neutral-200 font-sans text-[10px] leading-relaxed">{activeModel.potentialRisks}</span>
              </div>
            </div>
            
            <div className="text-[8px] text-neutral-400 border-t border-neutral-800 pt-2 text-center font-sans font-light">
              Revenue strategy successfully linked to your elevator pitch. Commercial viability verified.
            </div>
          </div>
        )}

        {/* 👥 CREW COLLABORATION ENGINE */}
        {team.length > 0 && (
          <div className="mt-8 border-2 border-neutral-900 bg-neutral-900 text-white rounded-lg p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] select-none">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="text-left font-mono">
                <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">👥 CREW COLLABORATION ENGINE</span>
                <span className="text-[9px] text-neutral-450 block font-light leading-normal">
                  Leverage your team's unique perspectives and roles to validate our product direction.
                </span>
              </div>
              <span className="text-[8px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded uppercase font-bold tracking-wide font-mono">
                STAGE: BUSINESS MODEL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: Ask Strategist/Product advice */}
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded flex flex-col justify-between text-left space-y-3">
                <div className="space-y-1">
                  <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wide block font-mono">💬 CONSULT TEAM SPECIALIST</span>
                  <p className="text-[9px] text-neutral-400 font-light font-sans leading-relaxed">
                    Ask a Product Strategist, Designer, or Researcher to evaluate choices and deliver custom, inline recommendations.
                  </p>
                </div>

                {(() => {
                  const strategistTeammate = team.find(t => {
                    const r = (t.role || "").toLowerCase();
                    return r.includes('strategist') || r.includes('founder') || r.includes('business') || r.includes('designer') || r.includes('ux') || r.includes('researcher');
                  });

                  if (strategistTeammate) {
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 p-1.5 rounded bg-neutral-900 border border-neutral-800">
                          <span className="text-lg">{strategistTeammate.avatar}</span>
                          <div className="text-left">
                            <span className="font-bold text-[9px] text-white block leading-none">{strategistTeammate.name}</span>
                            <span className="text-[7.5px] text-neutral-400 uppercase tracking-tight">{strategistTeammate.role}</span>
                          </div>
                        </div>
                        <Button
                          size="xs"
                          onClick={() => {
                            playMutedClick();
                            useTeammateHelp(strategistTeammate.id, stage);
                          }}
                          disabled={strategistTeammate.helpTokenUsed || !!activeTeammateAdvice[strategistTeammate.id]}
                          className="w-full bg-amber-500 text-neutral-950 hover:bg-amber-400 border-none font-bold text-[8.5px] font-mono tracking-wider uppercase h-7 cursor-pointer"
                        >
                          {activeTeammateAdvice[strategistTeammate.id]
                            ? "PROPOSAL PENDING IN CHAT..."
                            : strategistTeammate.helpTokenUsed
                              ? "ADVICE TOKEN CONSUMED"
                              : `ASK FOR ${strategistTeammate.name.toUpperCase()}'S ADVICE`}
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 border border-dashed border-neutral-800 rounded bg-neutral-900/50 text-center py-6">
                      <span className="text-[8.5px] text-neutral-500 font-bold block uppercase tracking-wide font-mono">🔒 NO STRATEGIST IN CREW</span>
                      <span className="text-[7.5px] text-neutral-650 block mt-1 font-sans">
                        Hire a Product Strategist or Designer in Lobby next run to unlock expert consulting.
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Column 2: Cast a Crew-wide Poll Vote */}
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded flex flex-col justify-between text-left space-y-3">
                <div className="space-y-1">
                  <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wide block font-mono">🗳️ TRIGGER CREW-WIDE POLL</span>
                  <p className="text-[9px] text-neutral-400 font-light font-sans leading-relaxed">
                    Select a business model option to trigger an immediate, role-specific crew poll on its commercial viability.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Model Selection Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[7.5px] text-neutral-400 font-bold uppercase block tracking-wider font-mono">SELECT STRATEGY TO VOTE ON:</label>
                    <select
                      value={selectedModelToVote}
                      onChange={(e) => setSelectedModelToVote(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 text-white rounded px-2 py-1 text-[9px] font-mono focus:outline-none focus:border-emerald-600 tracking-wide"
                    >
                      {generatedBusinessModels.map((m) => (
                        <option key={m.id} value={m.id} className="bg-neutral-950 text-white font-mono">
                          {m.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="xs"
                    onClick={() => {
                      playMutedClick();
                      triggerCrewVote('businessModel', selectedModelToVote);
                    }}
                    disabled={!selectedModelToVote}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500 border-none font-bold text-[8.5px] font-mono tracking-wider uppercase h-7 cursor-pointer"
                  >
                    ⚡ INITIATE CREW VOTE
                  </Button>

                  {hasCrewVotedThisStage[stage] && (
                    <div className="text-center font-bold text-[7.5px] text-emerald-400 uppercase tracking-widest font-mono pt-1 animate-pulse">
                      ✓ LAST POLL RECORDED IN CHAT FEED (+5 POINT PITCH BONUS LOCKED)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
    generatedBusinessModels,
    generatedAdvisorAdvice,
    pitchText,
    setPitchText,
  } = useGameStore();

  const activeModel = generatedBusinessModels.find(m => m.id === businessModel) || null;

  // 1. Procedurally generate the high-caliber pitch on initial mount if empty
  useEffect(() => {
    if (!pitchText && selectedProblem) {
      const pitch = generateCustomElevatorPitch(
        selectedProblem,
        solutionDirection,
        usp,
        features,
        activeModel,
        generatedAdvisorAdvice,
        techStack
      );
      setPitchText(pitch);
    }
  }, [pitchText, selectedProblem, solutionDirection, usp, features, activeModel, generatedAdvisorAdvice, techStack, setPitchText]);

  const handleResetPitch = () => {
    playMutedClick();
    const pitch = generateCustomElevatorPitch(
      selectedProblem,
      solutionDirection,
      usp,
      features,
      activeModel,
      generatedAdvisorAdvice,
      techStack
    );
    setPitchText(pitch);
  };

  const talkingPoints = [
    `Stack Architecture: ${techStack.slice(0, 3).map(t => t.name).join(", ") || "Optimized layers"} backing our ${solutionDirection || "core MVP"}.`,
    `Unique Selling Proposition: Differentiated via "${usp || "standard strategy"}".`,
    `Business Strategy: Monetizing through ${activeModel?.name || "tailored models"} targeting ${activeModel?.customer || "our base customer segment"}.`,
  ];

  return (
    <GameplayStageCard
      stageKey="pitchPrep"
      title="Round 9: Prepare Your Pitch"
      subtitle="Review the summary of your project decisions. Read through your default elevator pitch script and customize it to make it your own."
    >
      <div className="max-w-xl mx-auto text-left font-mono text-[11px] space-y-4">
        {/* Dynamic Project Details Monospace summary */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md space-y-2">
          <span className="text-neutral-400 block text-[9px] uppercase border-b border-neutral-200 pb-1 mb-2 font-bold">PROJECT OVERVIEW</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-[10px]">
            <div><span className="text-neutral-400">PROBLEM:</span> <span className="text-neutral-900 font-bold">{selectedProblem?.title.toUpperCase()}</span></div>
            <div><span className="text-neutral-400">TRACK:</span> <span className="text-neutral-900 font-bold uppercase">{selectedProblem?.category}</span></div>
            <div><span className="text-neutral-400">FORMAT:</span> <span className="text-neutral-900 font-bold uppercase">{solutionDirection}</span></div>
            <div><span className="text-neutral-400">USP:</span> <span className="text-neutral-900 font-bold uppercase">{usp}</span></div>
            <div><span className="text-neutral-400">MODEL:</span> <span className="text-neutral-900 font-bold uppercase">{activeModel?.name || "N/A"}</span></div>
            <div><span className="text-neutral-400">FEATURES:</span> <span className="text-neutral-900 font-bold">{features.length} IN BACKLOG</span></div>
          </div>
        </div>

        {/* Dynamic Elevator Pitch Generator */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 block text-[9px] uppercase font-bold">YOUR 30-SECOND ELEVATOR PITCH</span>
            <button
              onClick={handleResetPitch}
              onMouseEnter={playSubtleHover}
              className="text-neutral-500 hover:text-neutral-900 text-[8px] font-bold uppercase border border-neutral-200 hover:border-neutral-400 px-2 py-0.5 rounded bg-white transition cursor-pointer"
            >
              [RESTORE DEFAULT PITCH]
            </button>
          </div>
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows={6}
            className="w-full p-3 bg-white border border-neutral-900 rounded-md font-sans text-xs text-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none leading-relaxed shadow-inner mt-1"
            placeholder="Write your custom elevator pitch..."
          />
        </div>

        {/* Key Talking Points */}
        <div className="space-y-2 border-t border-dashed border-border pt-3">
          <span className="text-neutral-400 block text-[9px] uppercase font-bold">KEY PRESENTATION TALKING POINTS</span>
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
      title="Round 10: Spin for Your Lead Judge"
      subtitle="Face the panel. Spin the wheel to draw your lead judge. Each judge has distinct expertise and grades your project using different criteria weights."
    >
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center font-mono text-[11px] space-y-6">
        {/* SVG Wheel Roulette Container — bigger, with avatar images */}
        <div className="relative w-[360px] h-[360px] flex items-center justify-center">
          {/* Top Pointer */}
          <div className="absolute -top-3 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-neutral-900 drop-shadow-sm" />

          {/* SVG Circle Wheel */}
          <div
            className="w-full h-full rounded-full border-2 border-neutral-900 overflow-hidden shadow-lg bg-white"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 2.5s cubic-bezier(0.15, 0.85, 0.35, 1)" : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                {JUDGES.map((jg) => (
                  <clipPath key={`clip-${jg.id}`} id={`clip-${jg.id}`}>
                    <circle cx="100" cy="100" r="28" />
                  </clipPath>
                ))}
              </defs>
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

                // Alternate slice colours
                const fillColors = ["#fafafa", "#f0f0f0", "#e8e8e8", "#f5f5f5", "#ebebeb"];
                const fillColor = fillColors[idx % fillColors.length];

                // Centre of the avatar image in the slice
                const imgRadius = 58;
                const midAngle = startAngle + angle / 2;
                const imgCenter = polarToCartesian(100, 100, imgRadius, midAngle);
                const imgSize = 22; // half-size for image element
                const textAngle = midAngle - 90;

                // Name label — pushed past avatar edge (avatar: center 58 + radius 22 = 80)
                const labelPos = polarToCartesian(100, 100, 89, midAngle);

                return (
                  <g key={jg.id} className="select-none">
                    {/* Slice background */}
                    <path
                      d={d}
                      fill={fillColor}
                      stroke="#171717"
                      strokeWidth="1.5"
                    />

                    {/* Avatar image centred in slice */}
                    {jg.avatarImage && (
                      <image
                        href={jg.avatarImage}
                        x={imgCenter.x - imgSize}
                        y={imgCenter.y - imgSize}
                        width={imgSize * 2}
                        height={imgSize * 2}
                        clipPath={`url(#clip-img-${jg.id})`}
                        preserveAspectRatio="xMidYMid slice"
                        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))" }}
                      />
                    )}

                    {/* Name label */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      transform={`rotate(${textAngle + 90}, ${labelPos.x}, ${labelPos.y})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ fontSize: "7px", fontWeight: "700", fill: "#171717", fontFamily: "monospace" }}
                    >
                      {jg.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}

              {/* Extra clip paths for avatar images positioned correctly in slices */}
              <defs>
                {JUDGES.map((jg, idx) => {
                  const angle = 360 / JUDGES.length;
                  const midAngle = idx * angle + angle / 2;
                  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
                  };
                  const imgCenter = polarToCartesian(100, 100, 58, midAngle);
                  return (
                    <clipPath key={`clip-img-${jg.id}`} id={`clip-img-${jg.id}`}>
                      <circle cx={imgCenter.x} cy={imgCenter.y} r="22" />
                    </clipPath>
                  );
                })}
              </defs>

              {/* Centre hub */}
              <circle cx="100" cy="100" r="14" fill="#171717" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Control Button / Selection Info */}
        <div className="w-full text-center space-y-4">
          {judgeSpinState === "idle" && (
            <Button
              onClick={spinWheel}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 w-full max-w-[220px] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer"
            >
              ⚡ DRAW LEAD JUDGE
            </Button>
          )}

          {judgeSpinState === "spinning" && (
            <div className="text-xs text-muted-foreground animate-pulse py-2 font-mono">
              🎲 ASSEMBLING THE JURY PANEL...
            </div>
          )}

          {judgeSpinState === "done" && currentJudge && (
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl w-full text-left space-y-4 font-mono">
              {/* Selected judge avatar + info row */}
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-900 shadow-md">
                  {currentJudge.avatarImage ? (
                    <Image
                      src={currentJudge.avatarImage}
                      alt={currentJudge.name}
                      fill
                      className="object-cover object-top"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-2xl">
                      {currentJudge.avatar}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">YOUR LEAD JUDGE:</span>
                  <span className="font-bold text-neutral-900 text-base uppercase block leading-tight">{currentJudge.name}</span>
                  <span className="text-[10px] text-muted-foreground block font-sans font-light leading-snug mt-0.5">{currentJudge.title}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border pt-3 text-[10px] text-neutral-600 font-sans font-light leading-relaxed">
                Expertise: {currentJudge.expertise.join(", ")}
              </div>

              <Button
                onClick={() => {
                  playMutedClick();
                  nextStage();
                }}
                onMouseEnter={playSubtleHover}
                className="font-mono text-xs border border-neutral-900 w-full mt-2 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer"
              >
                SUBMIT PROJECT TO JUDGES
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
    deckNarrativeQuality,
    roastText,
    setRoastText,
  } = useGameStore();

  const [loadingStep, setLoadingStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [evaluationComplete, setEvaluationComplete] = useState(false);

  const stagedSteps = [
    {
      key: "innovation",
      label: "Evaluating Innovation",
      getLog: () => {
        return `Checking originality. Analyzing chosen unique advantage: "${usp || "None"}".`;
      }
    },
    {
      key: "execution",
      label: "Evaluating Execution Quality",
      getLog: () => {
        return `Checking framework implementation depth. Scoped features: ${features.length} Must-Have components.`;
      }
    },
    {
      key: "business",
      label: "Assessing Business Viability",
      getLog: () => {
        return `Analyzing market strategy. Monetization framework: "${businessModel || "None"}".`;
      }
    },
    {
      key: "pitch",
      label: "Measuring Pitch Strength",
      getLog: () => {
        return `Reviewing pitch deck structure. Narrative quality: "${deckNarrativeQuality || "Unstructured"}".`;
      }
    },
    {
      key: "roast",
      label: "Compling dyanmic roast",
      getLog: () => {
        return roastText ? "Dynamic jury roast commentary compiled successfully." : `Connecting to lead judge cognitive core to compile brutal commentary...`;
      }
    }
  ];

  // Pause the game countdown timer during the judging evaluation phase
  useEffect(() => {
    useGameStore.getState().pauseTimer();
  }, []);

  // Run evaluation immediately on mount
  useEffect(() => {
    if (currentJudge) {
      performEvaluation();
    }
  }, [currentJudge]);

  // Terminal visual animation ticker sequence
  useEffect(() => {
    if (!currentJudge) return;

    let step = 0;
    let waitAttempts = 0;
    const MAX_WAIT_ATTEMPTS = 3; // Wait at most 3 ticks (4.5s) on step 4

    playRevealTension(); // Initial suspense tick
    const interval = setInterval(() => {
      if (step < 4) {
        setCompletedSteps(prev => [...prev, stagedSteps[step].key]);
        playRevealSuccess(); // Checkmark reveal sound
        step++;
        setLoadingStep(step);
        setTimeout(() => {
          if (step < 5) {
            playRevealTension(); // Next category suspense sound
          }
        }, 150);
      } else {
        // Step 4 is "roast". Wait until roastText is pre-fetched and non-empty!
        const latestState = useGameStore.getState();
        const currentRoast = latestState.roastText;
        if (currentRoast !== "") {
          setCompletedSteps(["innovation", "execution", "business", "pitch", "roast"]);
          playRevealSuccess(); // Last category checkmark sound
          clearInterval(interval);
          setEvaluationComplete(true);
        } else {
          waitAttempts++;
          if (waitAttempts >= MAX_WAIT_ATTEMPTS) {
            console.warn("Jury roast pre-fetch timed out on UI animation. Using fallback comment.");
            const fallbackComment = latestState.judgeFeedback[latestState.judgeFeedback.length - 1]?.comment || 
              "An interesting prototype with solid groundwork, but the lead judge decided to pass on roasting this submission.";
            // Set the fallback comment in store so it can be displayed in results page
            latestState.setRoastText(fallbackComment);
            setCompletedSteps(["innovation", "execution", "business", "pitch", "roast"]);
            playRevealSuccess(); // Last category checkmark sound
            clearInterval(interval);
            setEvaluationComplete(true);
          }
        }
      }
    }, 1500);

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

    const isHardcore = activeModifiers.includes("HARDCORE_JUDGE") || gameMode === "hardcore";

    const derivedStrengths: string[] = [];
    const derivedWeaknesses: string[] = [];

    if (techIds.has("tech-next") && techIds.has("tech-vercel")) {
      derivedStrengths.push("Excellent Next.js + Vercel deployment infrastructure synergy.");
    }
    if ((techIds.has("tech-openai") || techIds.has("tech-gemini")) && techIds.has("tech-next")) {
      derivedStrengths.push("Cutting-edge integration of AI models with responsive frontend frameworks.");
    }
    if (techIds.has("tech-esp32") && techIds.has("tech-arduino")) {
      derivedStrengths.push("High-fidelity matching of physical IoT boards with local development environments.");
    }
    if (techIds.has("tech-supabase") && techIds.has("tech-postgres")) {
      derivedStrengths.push("Robust scalable database architecture matching PostgreSQL latency speeds.");
    }

    if (features.length === 2 || features.length === 3) {
      derivedStrengths.push("Extremely lean and disciplined product scoping boundary rules.");
    } else if (features.length > 3) {
      derivedWeaknesses.push("Severe product scope bloat. Team tried to build too many Must-Have components.");
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
    const highlight = finalStrengths[0] || "Consistent architectural execution boundaries.";

    // 1. Evaluate other panel judges first, saving them to the store
    JUDGES.forEach(j => {
      if (j.id !== currentJudge.id) {
        let otherWeightedScore =
          finalInnovation * j.scoringWeights.innovation +
          finalExecution * j.scoringWeights.execution +
          finalDesign * j.scoringWeights.design +
          finalPitch * j.scoringWeights.pitch;

        if (j.id === "judge-chaos") {
          const chaosOffset = Math.floor(Math.random() * 21) - 10; // ±10 modifier
          otherWeightedScore += chaosOffset;
        }

        let otherScoreVal = otherWeightedScore + finalBonus;
        if (isHardcore) {
          otherScoreVal = otherScoreVal * 0.85;
        }
        otherScoreVal = Math.max(0, Math.min(Math.round(otherScoreVal), 100));

        const otherFeedbackResult = generateJudgeFeedback(j.id, otherScoreVal, {
          techStack,
          features,
          usp,
          businessModel,
          problem: selectedProb,
          solutionDirection,
          pitchDeck: useGameStore.getState().pitchDeck,
          pitchDeckScore: useGameStore.getState().pitchDeckScore,
          deckNarrativeQuality: useGameStore.getState().deckNarrativeQuality,
          deckArchetype: useGameStore.getState().deckArchetype,
          generatedBusinessModels: useGameStore.getState().generatedBusinessModels,
          generatedAdvisorAdvice: useGameStore.getState().generatedAdvisorAdvice,
        });

        addJudgeFeedback({
          judgeId: j.id,
          score: otherScoreVal,
          comment: otherFeedbackResult.comment,
          highlight: finalStrengths[0] || "Valid architectural execution.",
        });
      }
    });

    // 2. Evaluate selected lead judge last!
    let leadWeightedScore =
      finalInnovation * weights.innovation +
      finalExecution * weights.execution +
      finalDesign * weights.design +
      finalPitch * weights.pitch;

    if (currentJudge.id === "judge-chaos") {
      const chaosOffset = Math.floor(Math.random() * 21) - 10; // ±10 modifier
      leadWeightedScore += chaosOffset;
    }

    let finalScoreVal = leadWeightedScore + finalBonus;
    if (isHardcore) {
      finalScoreVal = finalScoreVal * 0.85;
    }
    finalScoreVal = Math.max(0, Math.min(Math.round(finalScoreVal), 100));

    const getGrade = (score: number) => {
      if (score >= 94) return "S";
      if (score >= 84) return "A";
      if (score >= 72) return "B";
      if (score >= 60) return "C";
      if (score >= 48) return "D";
      return "F";
    };

    const feedbackResult = generateJudgeFeedback(currentJudge.id, finalScoreVal, {
      techStack,
      features,
      usp,
      businessModel,
      problem: selectedProb,
      solutionDirection,
      pitchDeck: useGameStore.getState().pitchDeck,
      pitchDeckScore: useGameStore.getState().pitchDeckScore,
      deckNarrativeQuality: useGameStore.getState().deckNarrativeQuality,
      deckArchetype: useGameStore.getState().deckArchetype,
      generatedBusinessModels: useGameStore.getState().generatedBusinessModels,
      generatedAdvisorAdvice: useGameStore.getState().generatedAdvisorAdvice,
    });

    addJudgeFeedback({
      judgeId: currentJudge.id,
      score: finalScoreVal,
      comment: feedbackResult.comment,
      highlight,
    });

    const archetype = classifyProjectArchetype({
      techStack,
      features,
      usp,
      businessModel,
      solutionDirection,
    });

    // Pre-fetch dynamic roast in background during terminal judging phase
    setRoastText("");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800); // Strict 2.8s client-side timeout!

    fetch("/api/generate-roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        problemStatement: selectedProb?.description,
        solutionDirection: solutionDirection,
        techStack: techStack.map(t => t.name),
        usp: usp,
        businessModel: businessModel,
        mustHaveFeatures: features.map(f => f.name),
        judge: currentJudge.name,
        judgePersonality: currentJudge.personality,
        archetype: archetype.name,
        grade: getGrade(finalScoreVal),
        score: finalScoreVal,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.roast) {
          setRoastText(data.roast);
        } else {
          setRoastText(feedbackResult.comment || "An interesting prototype with solid groundwork, but the lead judge decided to pass on roasting this submission.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch AI roast:", err);
        // Fall back directly to the rich contextual offline comment
        setRoastText(feedbackResult.comment || "The evaluation server went offline, but the jury was impressed by your execution strategy.");
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    // Record results and update stats using the lead judge's score
    useGameStore.getState().updateStats(finalScoreVal);
    playScoreChord(); // trigger dynamic score chord!
  };

  return (
    <GameplayStageCard
      stageKey="judging"
      title="Round 11: Pitch and Demo"
      subtitle="Take the stage. The lead judge is reviewing your project pitch, architecture, and backlog decisions."
    >
      <div className="max-w-md mx-auto text-left font-mono text-[11px] space-y-4">
        {!evaluationComplete ? (
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-md text-white shadow-xl space-y-4 leading-relaxed font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-amber-400 font-bold animate-pulse">PITCH PRESENTATION IN PROGRESS</span>
              <span className="text-neutral-500 text-[9px]">[JURY REVIEWING]</span>
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
                        <span className={isDone ? "text-neutral-100 font-bold" : isActive ? "text-amber-300 font-bold animate-pulse" : "text-neutral-500"}>
                          {step.label.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-505">
                        {isDone ? "COMPLETE" : isActive ? "REVIEWING..." : "QUEUED"}
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
              <span className="text-neutral-400 block text-[8px] uppercase font-bold">JURY VERDICT:</span>
              <p className="text-[11px] text-neutral-800 font-sans italic bg-neutral-50 p-3 border border-neutral-200 rounded leading-relaxed">
                "{judgeFeedback[judgeFeedback.length - 1]?.comment}"
              </p>
            </div>

            <div className="p-2.5 bg-neutral-900 border border-neutral-900 rounded text-center text-white">
              <span className="text-[9px] text-neutral-450 block uppercase font-mono tracking-wider mb-0.5">JUDGE'S SCORE:</span>
              <span className="text-2xl font-black">{judgeFeedback[judgeFeedback.length - 1]?.score}/100</span>
            </div>

            <Button
              onClick={() => {
                playMutedClick();
                nextStage();
              }}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 w-full focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer"
            >
              SEE FINAL RESULTS
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
    pitchDeck,
    pitchDeckScore,
    deckNarrativeQuality,
    deckArchetype,
    roastText,
  } = useGameStore();

  const [copied, setCopied] = useState(false);

  // Startup PRD Generator States
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

  useEffect(() => {
    if (!feedback) return;
    const projectGrade = getGrade(feedback.score);
    if (projectGrade === "S" || projectGrade === "A") {
      playWinTheme();
    } else if (projectGrade === "D" || projectGrade === "F") {
      playLoseTheme();
    } else {
      playScoreChord();
    }
  }, [feedback]);

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

  // AI Roast is pre-compiled and fetched during the judging terminal phase, so we use roastText directly!

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
      derivedStrengths.push("High-fidelity matching of physical IoT boards with software architecture.");
    }
    if (techIds.has("tech-supabase") && techIds.has("tech-postgres")) {
      derivedStrengths.push("Robust database architecture matching PostgreSQL latency speeds.");
    }

    if (features.length === 2 || features.length === 3) {
      derivedStrengths.push("Extremely lean and disciplined product scoping boundary rules.");
    } else if (features.length > 3) {
      derivedWeaknesses.push("Severe product scope bloat. Team tried to build too many components.");
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
      title="Final Round: Hackathon Results"
      subtitle="Jury evaluation complete. Review your project metrics, expert feedback, and unlocked achievements."
    >
      <div className="max-w-2xl mx-auto text-left font-mono text-[11px] space-y-6">
        
        {/* Results Main Banner Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-neutral-900 border border-neutral-900 rounded text-center text-white flex flex-col justify-center shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-1 font-bold">FINAL SCORE</span>
            <span className="text-3xl font-black">{displayScore} <span className="text-xs font-normal text-neutral-400">/ 50</span></span>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded text-center flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-2">FINAL GRADE</span>
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
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-1">JURY VERDICT</span>
            <span className="text-xs font-bold text-neutral-800 uppercase truncate">
              {finalScore100 >= 70 ? "✅ PROJECT APPROVED" : "❌ SUBMISSION REJECTED"}
            </span>
          </div>
        </div>

        {/* Project Archetype Card */}
        <div className="border-2 border-double border-neutral-900 p-5 bg-white space-y-4 shadow-sm select-none">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">PROJECT CLASSIFICATION</span>
            <span className="text-[8px] bg-neutral-900 text-white font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {archetype.id}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] text-neutral-400 block uppercase font-mono tracking-tight leading-none font-bold">PROJECT CATEGORY</span>
            <h3 className="text-lg font-black uppercase text-neutral-900 leading-none">{archetype.name}</h3>
            <span className="text-[10px] text-neutral-500 font-sans italic block mt-0.5">{archetype.subtitle}</span>
          </div>

          <p className="text-[11px] text-neutral-600 font-sans font-light leading-relaxed">
            {roastText || archetype.description}
          </p>

          <div className="border-t border-dashed border-neutral-200 pt-3 space-y-2.5">
            <span className="text-[8px] text-neutral-400 block uppercase font-bold tracking-wider mb-1">PROJECT CRITERIA METRICS</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-[9px]">
              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>TECHNICAL FEASIBILITY:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.techDepth}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.techDepth}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>BUSINESS SUSTAINABILITY:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.businessAcuteness}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.businessAcuteness}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>USER EXPERIENCE:</span>
                  <span className="font-bold text-neutral-900">{archetype.radarStats.designFinesse}%</span>
                </div>
                <div className="w-full bg-neutral-100 border border-neutral-250 h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-neutral-950 h-full" style={{ width: `${archetype.radarStats.designFinesse}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-neutral-500">
                  <span>HACKATHON SCRAPPINESS:</span>
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
          <div className="absolute top-1 right-2 text-[8px] text-neutral-300 font-bold">HACKATHON RUN SUMMARY</div>
          <span className="text-neutral-400 block text-[8px] uppercase border-b border-neutral-200 pb-1 mb-2 font-bold">RUN SUMMARY</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 text-[10px]">
            <div><span className="text-neutral-400">PLAY MODE:</span> <span className="text-neutral-900 font-bold uppercase">{gameMode}</span></div>
            <div><span className="text-neutral-400">TIMER PACING:</span> <span className="text-neutral-900 font-bold uppercase">{difficulty || "N/A"}</span></div>
            <div><span className="text-neutral-400">CHAOS COMPLICATIONS:</span> <span className="text-neutral-900 font-bold uppercase">
              {CHAOS_EVENTS.filter((e) => chaosHistory.includes(e.id) && (e.category === "technical" || e.category === "team")).length}
            </span></div>
            <div><span className="text-neutral-400">MENTOR REVIEWED:</span> <span className="text-neutral-900 font-bold uppercase">{mentorHintsUsed > 0 ? "YES" : "NO"}</span></div>
            <div><span className="text-neutral-400">LEAD EVALUATOR:</span> <span className="text-neutral-900 font-bold uppercase">{currentJudge?.name || "N/A"}</span></div>
            <div>
              <span className="text-neutral-400 block">SPECIAL RULES APPLIED:</span>
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

        {/* Pitch Deck Storytelling Audit Panel */}
        {(() => {
          const deckEval = evaluatePitchDeck(pitchDeck);
          const getStoryGrade = (score: number) => {
            if (score >= 90) return "S";
            if (score >= 80) return "A";
            if (score >= 65) return "B";
            if (score >= 50) return "C";
            if (score >= 35) return "D";
            return "F";
          };
          const storyGrade = getStoryGrade(deckEval.score);

          return (
            <div className="border-2 border-double border-neutral-900 p-5 bg-white space-y-4 shadow-sm select-none rounded">
              
              {/* Header block */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">PITCH STORYBOARD FEEDBACK</span>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] bg-neutral-900 text-white font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    STORY STRUCTURE: {deckEval.archetype.toUpperCase()}
                  </span>
                  <span className="text-[8px] border border-neutral-900 text-neutral-950 font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    STORY GRADE: {storyGrade}
                  </span>
                </div>
              </div>

              {/* Main metrics row */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 bg-stone-50/50 border border-neutral-200 rounded">
                  <span className="text-[8px] text-neutral-450 block uppercase mb-1">STORY SCORE</span>
                  <span className="text-base font-bold text-neutral-900">{deckEval.score} / 100</span>
                </div>
                <div className="p-2 bg-stone-50/50 border border-neutral-200 rounded">
                  <span className="text-[8px] text-neutral-450 block uppercase mb-1">STORY FLOW</span>
                  <span className="text-xs font-bold text-neutral-800 uppercase">{deckEval.quality}</span>
                </div>
                <div className="p-2 bg-stone-50/50 border border-neutral-200 rounded">
                  <span className="text-[8px] text-neutral-450 block uppercase mb-1">TOTAL SLIDES</span>
                  <span className="text-xs font-bold text-neutral-800 uppercase">{pitchDeck.filter(s => s !== "").length} slides</span>
                </div>
              </div>

              {/* Sub-score Bars (Narrative Analysis) */}
              <div className="border-t border-dashed border-neutral-200 pt-3.5 space-y-2.5">
                <span className="text-[8px] text-neutral-400 block uppercase font-bold tracking-wider mb-1">NARRATIVE ANALYSIS</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-[9px]">
                  
                  <div>
                    <div className="flex justify-between mb-0.5 text-neutral-500">
                      <span>LOGICAL FLOW:</span>
                      <span className="font-bold text-neutral-900">{deckEval.subScores.logicalFlow}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-neutral-250 h-1 rounded-sm overflow-hidden">
                      <div className="bg-neutral-950 h-full" style={{ width: `${deckEval.subScores.logicalFlow}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-neutral-500">
                      <span>STORYTELLING ARCS:</span>
                      <span className="font-bold text-neutral-900">{deckEval.subScores.storytelling}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-neutral-250 h-1 rounded-sm overflow-hidden">
                      <div className="bg-neutral-950 h-full" style={{ width: `${deckEval.subScores.storytelling}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-neutral-500">
                      <span>TECHNICAL VALIDATION:</span>
                      <span className="font-bold text-neutral-900">{deckEval.subScores.techDepth}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-neutral-250 h-1 rounded-sm overflow-hidden">
                      <div className="bg-neutral-950 h-full" style={{ width: `${deckEval.subScores.techDepth}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-neutral-500">
                      <span>BUSINESS ACUTENESS:</span>
                      <span className="font-bold text-neutral-900">{deckEval.subScores.bizThinking}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-neutral-250 h-1 rounded-sm overflow-hidden">
                      <div className="bg-neutral-950 h-full" style={{ width: `${deckEval.subScores.bizThinking}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-neutral-500">
                      <span>CLARITY & STRUCTURE:</span>
                      <span className="font-bold text-neutral-900">{deckEval.subScores.clarity}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-neutral-250 h-1 rounded-sm overflow-hidden">
                      <div className="bg-neutral-950 h-full" style={{ width: `${deckEval.subScores.clarity}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-neutral-500">
                      <span>PERSUASION POWER:</span>
                      <span className="font-bold text-neutral-900">{deckEval.subScores.persuasion}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-neutral-250 h-1 rounded-sm overflow-hidden">
                      <div className="bg-neutral-950 h-full" style={{ width: `${deckEval.subScores.persuasion}%` }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* Narrative Strengths & Weaknesses Logs */}
              <div className="border-t border-dashed border-neutral-200 pt-3 space-y-1.5 font-mono text-[9px]">
                <span className="text-[8px] text-neutral-400 block uppercase font-bold tracking-wider mb-1">STORYBOARD FEEDBACK</span>
                {deckEval.feedback.length > 0 ? (
                  <div className="space-y-1.5 leading-normal max-h-[140px] overflow-y-auto pr-1">
                    {deckEval.feedback.map((log, i) => {
                      const isWarn = log.includes("Missing") || log.includes("before") || log.includes("penalty") || log.includes("muddled") || log.includes("Vaporware") || log.includes("Duplicate") || log.includes("Dry");
                      return (
                        <div key={i} className="flex gap-1.5">
                          <span className={isWarn ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                            {isWarn ? "[-]" : "[+]"}
                          </span>
                          <span className={isWarn ? "text-neutral-600" : "text-neutral-800"}>
                            {log}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-neutral-400 italic block">[NO AUDIT FEEDBACK GENERATED]</span>
                )}
              </div>

            </div>
          );
        })()}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-neutral-200 pt-4">
          <div className="space-y-2">
            <span className="text-emerald-600 block text-[9px] uppercase font-bold">+++ PROJECT STRENGTHS:</span>
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
            <span className="text-rose-600 block text-[9px] uppercase font-bold">--- AREAS FOR IMPROVEMENT:</span>
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
              <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">JUDGE'S CRITIQUE</span>
              <span className="text-[8px] font-sans text-neutral-500 uppercase font-bold">MEMO // {currentJudge.personality}</span>
            </div>

            <p className="text-xs text-neutral-850 font-sans italic relative z-10 leading-relaxed pt-1 select-text">
              "{roastText || feedback?.comment || "No critique available."}"
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
                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">STARTUP ACCELERATION INITIATIVE</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isQualified ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-500"
                }`}>
                  {isQualified ? "VENTURE QUALIFIED" : "🔒 LOCKED"}
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h3 className={`text-sm font-black uppercase flex items-center gap-1.5 ${isQualified ? "text-neutral-900" : "text-neutral-400"}`}>
                  {isQualified ? "🚀 This Idea Has Venture Potential" : "🔒 Startup PRD Generator"}
                </h3>
                <p className="text-[11px] text-neutral-600 font-sans font-light leading-relaxed">
                  {isQualified 
                    ? "The judges believe this project is worth exploring further. Generate a startup-grade Product Requirements Document based on your hackathon decisions."
                    : "Get a grade B or above to unlock this startup product generator."
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
                {isQualified ? "DOWNLOAD STARTUP PRD" : "DOWNLOAD STARTUP PRD (LOCKED)"}
              </Button>
            </div>
          );
        })()}

        {/* Achievements Grid */}
        <div className="border-t border-dashed border-neutral-200 pt-4">
          <span className="text-neutral-400 block text-[9px] uppercase mb-3">GLOBAL ACHIEVEMENTS UNLOCKED:</span>
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
          <span className="text-neutral-400 block text-[9px] uppercase">SHAREABLE SCORECARD (ASCII)</span>
          <pre className="p-3 bg-neutral-900 text-neutral-100 rounded text-[9px] font-mono leading-tight text-left overflow-x-auto whitespace-pre select-all">
            {generateAsciiCard()}
          </pre>
          <Button
            onClick={copyToClipboard}
            onMouseEnter={playSubtleHover}
            variant="outline"
            className="w-full font-mono text-xs border border-neutral-900 h-8 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer"
          >
            {copied ? "[SCORECARD COPIED]" : "COPY SCORECARD"}
          </Button>
        </div>

        {/* Action Controls */}
        <div className="border-t border-neutral-200 pt-4 flex flex-col gap-2.5">
          <Button
            onClick={() => {
              playMutedClick();
              resetGame();
            }}
            onMouseEnter={playSubtleHover}
            className="w-full font-mono text-xs border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer"
          >
            🔄 RESTART HACKATHON
          </Button>

          <Link href="/" className="w-full">
            <Button
              onClick={() => {
                playMutedClick();
                resetGame();
              }}
              onMouseEnter={playSubtleHover}
              variant="outline"
              className="w-full font-mono text-xs border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none cursor-pointer hover:bg-neutral-50"
            >
              🏠 RETURN TO LOBBY
            </Button>
          </Link>
        </div>

        {/* Startup PRD Generator Overlay Modal */}
        {isPrdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in select-none">
            <div className="w-full max-w-3xl bg-white border-2 border-neutral-900 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col gap-4 overflow-hidden relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400">STARTUP_PRD_GENERATOR</span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    prdLoadingStep === prdLogs.length - 1 ? "bg-emerald-600 text-white" : "bg-neutral-900 text-white animate-pulse"
                  }`}>
                    {prdLoadingStep === prdLogs.length - 1 ? "READY" : "GENERATING"}
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
                        onMouseEnter={playSubtleHover}
                        variant="outline"
                        className="font-mono text-[10px] h-9 border border-neutral-900 cursor-pointer focus:outline-none"
                      >
                        {prdCopied ? "[COPIED TO CLIPBOARD]" : "COPY MARKDOWN"}
                      </Button>
                      <Button
                        onClick={handleDownloadPrd}
                        onMouseEnter={playSubtleHover}
                        variant="outline"
                        className="font-mono text-[10px] h-9 border border-neutral-900 cursor-pointer focus:outline-none"
                      >
                        DOWNLOAD PRD
                      </Button>
                      <Button
                        onClick={() => {
                          playMutedClick();
                          setIsPrdModalOpen(false);
                        }}
                        onMouseEnter={playSubtleHover}
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
    hasFinishedOnce
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
        className="fixed bottom-8 right-6 z-50 flex items-center gap-1.5 px-3 py-2 rounded-md bg-neutral-950 text-white border border-neutral-850 shadow-lg text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-900 transition-all cursor-pointer font-mono"
      >
        🛠️ TIME MACHINE & STATS
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-6 z-50 w-72 bg-card border border-neutral-400 rounded-lg shadow-xl p-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2 font-bold text-neutral-900">
        <span>🛠️ TIME PORTAL & STATS</span>
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500 font-bold cursor-pointer">[X]</button>
      </div>
      <p className="text-[8.5px] text-neutral-500 leading-tight mb-3 italic font-sans">
        💡 Use this Time Machine to jump back to any selection stage to refine your tech, adjust features, or optimize your USP/Business Model to improve your final score!
      </p>

      <div className="space-y-1 text-[11px] mb-3 text-neutral-700">
        <div>STAGE: <span className="font-bold text-neutral-900">{stage}</span></div>
        <div>TIMER: <span className="font-bold text-neutral-900">{formatTime(globalTimeRemaining)} / {formatTime(globalTotalTime)}</span> ({isTimerPaused ? "PAUSED" : "ACTIVE"})</div>
        
        <div className="mt-2 pt-2 border-t border-dashed border-border/80 text-[10px] space-y-0.5">
          <div className="font-bold text-neutral-900 uppercase">HIDDEN_SCORES:</div>
          <div className="flex justify-between"><span>INNOVATION:</span><span>{score.innovation}/100</span></div>
          <div className="flex justify-between"><span>EXECUTION/FEAS:</span><span>{score.execution}/100</span></div>
          <div className="flex justify-between"><span>DESIGN:</span><span>{score.design}/100</span></div>
          <div className="flex justify-between"><span>PITCH_POTENTIAL:</span><span>{score.pitch}/100</span></div>
          <div className="flex justify-between font-bold text-neutral-800 pt-0.5"><span>BONUS_POINTS:</span><span>+{score.bonus} pts</span></div>
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
          {STAGE_ORDER.filter((s) => {
            const isEvaluationStage = ['judgeSpin', 'judging', 'results'].includes(s);
            if (isEvaluationStage) {
              return hasFinishedOnce || stage === 'results';
            }
            return true;
          }).map((s) => (
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
            CHOOSE TACTICAL ACTION:
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

function ProjectHealthDashboard() {
  const { stage, score, techStack, features, usp, businessModel, pitchDeckScore } = useGameStore();

  const currentIdx = STAGE_ORDER.indexOf(stage);
  const isInnovationActive = currentIdx >= STAGE_ORDER.indexOf('techStack');
  const isFeasibilityActive = currentIdx >= STAGE_ORDER.indexOf('usp');
  const isExecutionActive = currentIdx >= STAGE_ORDER.indexOf('pitchDeck');
  const isPitchActive = currentIdx >= STAGE_ORDER.indexOf('mentor');
  const isViabilityActive = currentIdx >= STAGE_ORDER.indexOf('pitchPrep');

  const innovation = Math.max(0, Math.min(100, score.innovation));
  const execution = Math.max(0, Math.min(100, score.execution));

  const techDifficultySum = techStack.reduce((sum, t) => sum + (t.difficulty || 0), 0);
  const highEffortFeaturesCount = features.filter(f => f.effort === 'high').length;
  const feasibility = Math.max(10, Math.min(100, 95 - (techDifficultySum * 3.5) - (highEffortFeaturesCount * 12)));

  const hasUsp = !!usp;
  const hasBizModel = !!businessModel;
  const pitchVal = pitchDeckScore || score.pitch || 45;
  const viability = Math.round(
    (hasUsp ? 30 : 0) + (hasBizModel ? 30 : 0) + (pitchVal * 0.4)
  );

  const pitchStrength = Math.max(pitchDeckScore, score.pitch);

  const activeStatus = {
    INNOVATION: isInnovationActive,
    EXECUTION: isExecutionActive,
    'TECH FEASIBILITY': isFeasibilityActive,
    'BIZ VIABILITY': isViabilityActive,
    'PITCH STRENGTH': isPitchActive,
  };

  const [analyzingCategories, setAnalyzingCategories] = useState<Record<string, boolean>>({});
  const [highlightedCategories, setHighlightedCategories] = useState<Record<string, boolean>>({});

  const prevActiveRef = useRef<Record<string, boolean>>({});
  const completionTriggers = useRef<Set<string>>(new Set());

  // 1. Detect newly activated categories
  useEffect(() => {
    const newlyActivated: string[] = [];
    Object.entries(activeStatus).forEach(([label, active]) => {
      if (active && !prevActiveRef.current[label]) {
        newlyActivated.push(label);
      }
    });

    if (newlyActivated.length > 0) {
      setAnalyzingCategories(prev => {
        const next = { ...prev };
        newlyActivated.forEach(lbl => {
          next[lbl] = true;
        });
        return next;
      });

      playMilestoneUnlock();

      setHighlightedCategories(prev => {
        const next = { ...prev };
        newlyActivated.forEach(lbl => {
          next[lbl] = true;
        });
        return next;
      });

      newlyActivated.forEach(lbl => {
        setTimeout(() => {
          setAnalyzingCategories(prev => {
            const next = { ...prev };
            delete next[lbl];
            return next;
          });
        }, 1500);

        setTimeout(() => {
          setHighlightedCategories(prev => {
            const next = { ...prev };
            delete next[lbl];
            return next;
          });
        }, 3000);
      });
    }

    prevActiveRef.current = { ...activeStatus };
  }, [isInnovationActive, isFeasibilityActive, isExecutionActive, isPitchActive, isViabilityActive]);

  // 2. Play category completion triggers when metrics change
  useEffect(() => {
    const metrics = [
      { label: 'INNOVATION', value: innovation },
      { label: 'EXECUTION', value: execution },
      { label: 'TECH FEASIBILITY', value: feasibility },
      { label: 'BIZ VIABILITY', value: viability },
      { label: 'PITCH STRENGTH', value: pitchStrength }
    ];

    metrics.forEach(m => {
      const active = activeStatus[m.label as keyof typeof activeStatus];
      if (!active || analyzingCategories[m.label]) return;

      const val = m.value;
      let threshold: string | null = null;
      if (val >= 95) threshold = 'outstanding';
      else if (val >= 85) threshold = 'excellent';
      else if (val >= 70) threshold = 'healthy';

      if (threshold) {
        const key = `${m.label}-${threshold}`;
        if (!completionTriggers.current.has(key)) {
          completionTriggers.current.add(key);
          playCategoryComplete();
          
          setHighlightedCategories(prev => ({ ...prev, [m.label]: true }));
          setTimeout(() => {
            setHighlightedCategories(prev => {
              const next = { ...prev };
              delete next[m.label];
              return next;
            });
          }, 2000);
        }
      }
    });
  }, [innovation, execution, feasibility, viability, pitchStrength, analyzingCategories]);

  const getMeterBar = (val: number) => {
    const filled = Math.round(val / 10);
    return {
      bar: '█'.repeat(filled) + '░'.repeat(10 - filled),
      color: val >= 70 ? 'text-emerald-500' : val >= 40 ? 'text-amber-500' : 'text-rose-500'
    };
  };

  const metrics = [
    { label: 'INNOVATION', value: innovation },
    { label: 'EXECUTION', value: execution },
    { label: 'TECH FEASIBILITY', value: feasibility },
    { label: 'BIZ VIABILITY', value: viability },
    { label: 'PITCH STRENGTH', value: pitchStrength }
  ];

  return (
    <div className="max-w-4xl mx-auto mb-4 p-3 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/60 text-white rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.25)] font-mono text-[10px] sticky top-2 z-30 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-2">
        <span className="text-neutral-400 font-bold uppercase tracking-wider">▲ PROJECT HEALTH MONITOR</span>
        <span className="text-neutral-500 text-[8px] animate-pulse">● LIVE TELEMETRY</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map((m) => {
          const active = activeStatus[m.label as keyof typeof activeStatus];
          const analyzing = analyzingCategories[m.label];
          const highlighted = highlightedCategories[m.label];
          const { bar, color } = getMeterBar(m.value);

          return (
            <div
              key={m.label}
              className={cn(
                "p-2 bg-neutral-950 rounded border transition-all duration-300 space-y-1",
                highlighted ? "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "border-neutral-800",
                analyzing ? "border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse" : ""
              )}
            >
              <span className="text-neutral-500 block text-[8px] tracking-tight">{m.label}</span>
              {analyzing ? (
                <span className="block font-bold tracking-tight text-[11px] font-mono leading-none text-amber-500">
                  ANALYZING...
                </span>
              ) : !active ? (
                <span className="block font-mono text-[9px] text-neutral-600 leading-none">
                  NOT EVALUATED
                </span>
              ) : (
                <span className={`block font-bold tracking-tight text-[11px] font-mono leading-none ${color}`}>
                  {bar}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Conditional Stage Orchestrator / GamePage ---------------------------

// ─── Persistent Team Panel (Left Sidebar) ────────────────────────────────────
function PersistentTeamPanel({
  team, playerName, playerAvatar, activeTeamTab, setActiveTeamTab,
  teamChatMessages, unreadChatCount, activeTeammateAdvice, clearUnreadChatCount,
  resolveTeamChatMessageChoice, useTeammateHelp, stage, state, getMessageTypeBadge
}: any) {
  const [isMinimized, setIsMinimized] = useState(false);
  const { applyTeammateAdvice, rejectTeammateAdvice } = useGameStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [selectedUspToVote, setSelectedUspToVote] = useState<string>('');
  const [voteRole, setVoteRole] = useState<'primary' | 'secondary'>('primary');
  const [selectedModelToVote, setSelectedModelToVote] = useState<string>('');

  const getRoleCategory = (role: string): string => {
    const r = role.toLowerCase();
    if (r.includes('chaiwala') || r.includes('chai')) return 'chaiwala';
    if (r.includes('ai engineer') || r.includes('ai specialist') || r.includes('ml engineer') || r.includes('data scientist') || r.includes('machine learning') || (r.includes('ai') && !r.includes('assistant'))) return 'ai';
    if (r.includes('designer') || r.includes('ux') || r.includes('ui ') || r.includes('product design')) return 'designer';
    if (r.includes('frontend') || r.includes('front-end') || r.includes('front end')) return 'frontend';
    if (r.includes('backend') || r.includes('database') || r.includes('full stack') || r.includes('fullstack') || r.includes('developer') || r.includes(' dev') || r.startsWith('dev')) return 'backend';
    if (r.includes('strategist') || r.includes('founder') || r.includes('business') || r.includes('co-founder') || r.includes('analyst')) return 'strategist';
    if (r.includes('pitch') || r.includes('marketing') || r.includes('sales')) return 'pitch';
    if (r.includes('researcher') || r.includes('research')) return 'researcher';
    return 'general';
  };

  const getSpecialtyFitBadge = (teammate: any) => {
    if (stage !== 'techStack') return null;

    const roleCat = getRoleCategory(teammate.role || '');
    const activeTab = state.activeTechTab || 'all';

    let bonusPts = 0;
    if (activeTab === 'frontend') {
      if (roleCat === 'frontend' || roleCat === 'designer') bonusPts = 2;
      else if (roleCat === 'backend') bonusPts = -1;
    } else if (activeTab === 'backend' || activeTab === 'database') {
      if (roleCat === 'backend') bonusPts = 2;
      else if (roleCat === 'frontend' || roleCat === 'designer') bonusPts = -1;
    } else if (activeTab === 'ai') {
      if (roleCat === 'ai') bonusPts = 2;
    } else if (activeTab === 'devops') {
      if (roleCat === 'frontend' || roleCat === 'designer' || roleCat === 'backend') bonusPts = 2;
    }

    if (bonusPts === 2) {
      return (
        <span className="text-[7.5px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded uppercase tracking-wider animate-[pulse_2s_infinite]">
          ▲ +2 PTS FIT BONUS
        </span>
      );
    } else if (bonusPts === -1) {
      return (
        <span className="text-[7.5px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded uppercase tracking-wider animate-[pulse_1s_infinite]">
          ▼ -1 PTS BAD CHOICE
        </span>
      );
    } else {
      return (
        <span className="text-[7.5px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-200 px-1 py-0.5 rounded uppercase tracking-wider">
          ● +0 PTS GENERAL FIT
        </span>
      );
    }
  };

  useEffect(() => {
    if (state.generatedUSPs && state.generatedUSPs.length > 0 && !selectedUspToVote) {
      setSelectedUspToVote(state.generatedUSPs[0].name);
    }
  }, [state.generatedUSPs, selectedUspToVote]);

  useEffect(() => {
    if (state.generatedBusinessModels && state.generatedBusinessModels.length > 0 && !selectedModelToVote) {
      setSelectedModelToVote(state.generatedBusinessModels[0].id);
    }
  }, [state.generatedBusinessModels, selectedModelToVote]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (!isMinimized && activeTeamTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [teamChatMessages.length, activeTeamTab, isMinimized]);

  // Auto-switch to chat tab on new unread message
  useEffect(() => {
    if (unreadChatCount > 0 && !isMinimized) {
      // Only switch if not already on chat
    }
  }, [unreadChatCount]);

  // Clear unread count when on chat tab and panel is open
  useEffect(() => {
    if (!isMinimized && activeTeamTab === 'chat') {
      clearUnreadChatCount();
    }
  }, [isMinimized, activeTeamTab, teamChatMessages.length, clearUnreadChatCount]);

  return (
    <div
      className={cn(
        "fixed left-0 top-14 bottom-8 z-40 flex flex-col bg-white border-r border-neutral-200 shadow-lg font-mono select-none transition-all duration-300",
        isMinimized ? "w-10" : "w-72"
      )}
    >
      {/* Panel Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-neutral-200 bg-neutral-950 text-white px-2 py-2 flex-shrink-0",
        isMinimized ? "flex-col gap-2 px-1 py-3" : "flex-row"
      )}>
        {isMinimized ? (
          <>
            <span className="text-base">👥</span>
            {unreadChatCount > 0 && (
              <span className="text-[8px] font-bold text-red-400 bg-red-900/40 rounded px-1">{unreadChatCount}</span>
            )}
            <button
              onClick={() => { playMutedClick(); setIsMinimized(false); }}
              className="text-neutral-400 hover:text-white text-[10px] transition-colors"
              title="Expand team panel"
            >
              ▶
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👥</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block leading-none">CREW</span>
                <span className="text-[8px] text-neutral-400 uppercase">{team.length + 1} members</span>
              </div>
              {unreadChatCount > 0 && (
                <span className="text-[8px] font-bold text-white bg-red-600 rounded-full px-1.5 py-0.5 ml-1">
                  {unreadChatCount}
                </span>
              )}
            </div>
            <button
              onClick={() => { playMutedClick(); setIsMinimized(true); }}
              className="text-neutral-400 hover:text-white text-[10px] transition-colors"
              title="Minimize team panel"
            >
              ◀
            </button>
          </>
        )}
      </div>

      {/* Panel Body — hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Tab Selector */}
          <div className="flex border-b border-neutral-200 flex-shrink-0">
            <button
              onClick={() => { playMutedClick(); setActiveTeamTab('crew'); }}
              className={`flex-1 py-1.5 text-center text-[9px] font-bold uppercase transition-all border-b-2 ${
                activeTeamTab === 'crew'
                  ? 'border-neutral-900 text-neutral-900 bg-neutral-50'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900 bg-transparent'
              }`}
            >
              CREW
            </button>
            <button
              onClick={() => { playMutedClick(); setActiveTeamTab('chat'); }}
              className={`flex-1 py-1.5 text-center text-[9px] font-bold uppercase transition-all border-b-2 relative ${
                activeTeamTab === 'chat'
                  ? 'border-neutral-900 text-neutral-900 bg-neutral-50'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900 bg-transparent'
              }`}
            >
              CHAT {unreadChatCount > 0 && <span className="ml-0.5 text-red-600">●</span>}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTeamTab === 'crew' ? (
              <div className="p-2 space-y-2">
                {/* Player Card */}
                <div className="p-2 border border-neutral-200 rounded bg-neutral-50 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{playerAvatar}</span>
                    <div>
                      <span className="font-bold text-neutral-900 text-[10px] block leading-none">{playerName}</span>
                      <span className="text-[8px] text-neutral-450 uppercase">Team Lead (You)</span>
                    </div>
                  </div>
                </div>

                {/* Teammates */}
                {team.map((t: any) => {
                  const hasAdvice = !!activeTeammateAdvice[t.id];
                  const gating = checkTeammateGating(t, state);
                  return (
                    <div key={t.id} className="p-2 border border-neutral-200 rounded bg-white space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{t.avatar}</span>
                          <div>
                            <span className="font-bold text-neutral-900 text-[10px] block leading-none">{t.name}</span>
                            <span className="text-[8px] text-neutral-450 uppercase leading-none">{t.role}</span>
                          </div>
                        </div>
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-500 uppercase flex-shrink-0">
                          {t.personality}
                        </span>
                      </div>

                      {/* Compact contribution grid */}
                      <div className="grid grid-cols-4 gap-0.5 border-t border-dashed border-neutral-150 pt-1 text-[7px] text-center font-bold text-neutral-500">
                        <div>
                          <span className="block text-neutral-400 uppercase text-[6px]">INN</span>
                          <span className={t.contribution.innovation > 0 ? "text-purple-600" : ""}>+{t.contribution.innovation}</span>
                        </div>
                        <div>
                          <span className="block text-neutral-400 uppercase text-[6px]">EXE</span>
                          <span className={t.contribution.execution > 0 ? "text-blue-600" : ""}>+{t.contribution.execution}</span>
                        </div>
                        <div>
                          <span className="block text-neutral-400 uppercase text-[6px]">DES</span>
                          <span className={t.contribution.design > 0 ? "text-pink-600" : ""}>+{t.contribution.design}</span>
                        </div>
                        <div>
                          <span className="block text-neutral-400 uppercase text-[6px]">PIT</span>
                          <span className={t.contribution.pitch > 0 ? "text-orange-600" : ""}>+{t.contribution.pitch}</span>
                        </div>
                      </div>

                      {/* Specialty Fit Badge */}
                      {stage === 'techStack' && (
                        <div className="flex justify-center pt-1 border-t border-dashed border-neutral-150">
                          {getSpecialtyFitBadge(t)}
                        </div>
                      )}

                      {/* Status + Action */}
                      <div className="flex items-center justify-between border-t border-neutral-100 pt-1.5">
                        {!t.helpTokenUsed ? (
                          gating.isGated ? (
                            <span className="text-[7px] text-neutral-400 uppercase font-mono">{getSubtleGatingStatus?.(t) || "Watching..."}</span>
                          ) : (
                            <Button
                              size="xs"
                              onClick={() => {
                                playMutedClick();
                                useTeammateHelp(t.id, stage);
                                setActiveTeamTab('chat');
                              }}
                              disabled={hasAdvice}
                              className="text-[8px] h-5 px-1.5 w-full border border-neutral-900 cursor-pointer disabled:opacity-50"
                            >
                              {hasAdvice ? "PENDING..." : "ASK ADVICE"}
                            </Button>
                          )
                        ) : (
                          <span className="text-[7px] text-neutral-400 uppercase font-mono">Token used</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {teamChatMessages.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400 text-[9px]">
                    No messages yet.
                  </div>
                ) : (
                  teamChatMessages.map((msg: any) => {
                    const isResolved = msg.discussion?.resolved;
                    const chosenIdx = msg.discussion?.chosenIndex;
                    const badge = getMessageTypeBadge(msg.type);
                    return (
                      <div key={msg.id} className="p-2 border border-neutral-200 rounded bg-white space-y-1.5">
                        <div className="flex items-center justify-between border-b border-dashed border-neutral-150 pb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{msg.senderAvatar}</span>
                            <span className="font-bold text-neutral-900 text-[9px] uppercase leading-none">{msg.senderName}</span>
                          </div>
                          <span className="text-[7px] text-neutral-400 flex-shrink-0">{msg.timestamp}</span>
                        </div>

                        {badge && (
                          <span className={cn("inline-flex items-center gap-0.5 text-[7px] font-bold px-1 py-0.5 rounded border uppercase tracking-wide", badge.bg)}>
                            {badge.icon} {badge.label}
                          </span>
                        )}

                        {msg.type === 'poll' && msg.pollDetails ? (
                          <div className="p-2 border border-emerald-500/30 bg-emerald-950/90 text-white rounded space-y-2 mt-1 text-[9px] leading-relaxed font-mono shadow-inner select-none">
                            <div className="flex items-center justify-between border-b border-emerald-800 pb-1 uppercase tracking-wider text-[8px] text-emerald-400">
                              <span>🗳️ CREW POLL RESOLUTION</span>
                              <span className="text-[7.5px] bg-emerald-900/50 text-emerald-300 px-1 py-0.2 rounded font-sans tracking-normal font-bold">
                                {msg.pollDetails.subjectDesc.toUpperCase()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-neutral-400 text-[8px] uppercase block tracking-widest leading-none font-bold">PROPOSED STRATEGY:</span>
                              <span className="text-emerald-100 font-bold block text-[10px] border-b border-emerald-900 pb-1 leading-tight font-sans">
                                {msg.pollDetails.subjectTitle}
                              </span>
                            </div>
                            <div className="space-y-1 text-[8.5px] font-sans">
                              <span className="text-neutral-400 text-[8px] uppercase block tracking-widest leading-none font-mono font-bold">VOTE LEDGER:</span>
                              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                                {msg.pollDetails.votesList.map((v: any, vIdx: number) => (
                                  <div key={vIdx} className="p-1 rounded bg-neutral-900/60 border border-neutral-850 flex flex-col gap-0.5 leading-normal">
                                    <div className="flex items-center justify-between text-[8px]">
                                      <span className="font-bold text-white uppercase">{v.avatar} {v.name} ({v.role})</span>
                                      <span className={cn(
                                        "px-1 py-0.2 rounded text-[7px] font-mono font-black uppercase",
                                        v.vote === 'YES' ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
                                      )}>{v.vote}</span>
                                    </div>
                                    <p className="text-[7.5px] text-neutral-350 italic font-light font-sans">"{v.rationale}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-emerald-800/80 pt-1.5 space-y-1 mt-1 text-center">
                              <div className="flex justify-between items-center text-[8.5px]">
                                <span className="text-neutral-400 uppercase font-mono text-[7.5px]">CONSENSUS RATIO:</span>
                                <span className="font-bold text-white">{msg.pollDetails.yesCount} YES / {msg.pollDetails.noCount} NO ({msg.pollDetails.consensusPct}% Alignment)</span>
                              </div>
                              <div className="w-full bg-emerald-950 border border-emerald-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${msg.pollDetails.consensusPct}%` }} />
                              </div>
                              <div className={cn(
                                "p-1 rounded text-center font-bold text-[8.5px] uppercase mt-1.5 font-mono tracking-wider flex items-center justify-center gap-1 leading-none border",
                                msg.pollDetails.approved 
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60" 
                                  : "bg-red-950/40 text-red-400 border-red-900/60"
                              )}>
                                {msg.pollDetails.approved ? (
                                  <>🟢 APPROVED (+5 POINT PITCH BONUS LOCKED)</>
                                ) : (
                                  <>🔴 WARNING: CONSENSUS REJECTED</>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : msg.type === 'suggestion' && msg.adviceDetails ? (
                          <div className="p-2 border border-purple-200 bg-purple-50/40 rounded space-y-2 mt-1 text-[9px] leading-relaxed">
                            <div className="font-bold text-purple-900 border-b border-purple-150 pb-0.5 uppercase tracking-wide font-mono text-[8px] flex items-center justify-between">
                              <span>💡 TEAMMATE PROPOSAL</span>
                              <span className="text-[7.5px] bg-purple-100 text-purple-800 px-1 py-0.2 rounded font-normal font-sans tracking-normal select-none">
                                {msg.adviceDetails.title}
                              </span>
                            </div>
                            <div className="space-y-1.5 font-sans text-neutral-750">
                              <div>
                                <strong className="font-mono text-neutral-500 text-[8px] uppercase block tracking-wider leading-tight">Observation:</strong> 
                                <span className="font-light">{msg.adviceDetails.observation}</span>
                              </div>
                              <div>
                                <strong className="font-mono text-neutral-500 text-[8px] uppercase block tracking-wider leading-tight">Concern:</strong> 
                                <span className="font-light">{msg.adviceDetails.concern}</span>
                              </div>
                              <div>
                                <strong className="font-mono text-purple-950 text-[8px] uppercase block tracking-wider leading-tight">Recommendation:</strong> 
                                <span className="font-semibold text-purple-900">{msg.adviceDetails.recommendation}</span>
                              </div>
                              <div>
                                <strong className="font-mono text-neutral-500 text-[8px] uppercase block tracking-wider leading-tight">Expected Outcome:</strong> 
                                <span className="font-light">{msg.adviceDetails.expectedImpact}</span>
                              </div>
                              {msg.adviceDetails.tradeoffs && (
                                <div>
                                  <strong className="font-mono text-neutral-500 text-[8px] uppercase block tracking-wider leading-tight">Tradeoffs:</strong> 
                                  <span className="font-light italic text-neutral-550">{msg.adviceDetails.tradeoffs}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9px] text-neutral-700 leading-relaxed font-sans">{msg.text}</p>
                        )}

                        {msg.changeSummary && (
                          <div className="p-1.5 rounded border border-neutral-200 bg-neutral-50 font-mono text-[8px] space-y-1">
                            <div className="font-bold text-neutral-900 uppercase text-[7px] border-b border-dashed border-neutral-200 pb-0.5">⚙ ACTION COMPLETED</div>
                            <div>
                              <span className="text-neutral-500 uppercase text-[6px] block">After:</span>
                              <div className="text-emerald-700 font-bold break-all">{msg.changeSummary.after}</div>
                            </div>
                            {msg.changeSummary.reason && (
                              <div className="text-neutral-500 text-[7px]">{msg.changeSummary.reason}</div>
                            )}
                          </div>
                        )}

                        {msg.discussion && (
                          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded space-y-1">
                            <span className="text-[7px] font-bold text-neutral-500 uppercase block">
                              {isResolved ? "✓ Resolved" : "⚡ Action Required"}
                            </span>
                            {isResolved && chosenIdx !== undefined && msg.discussion.choices[chosenIdx] && (
                              <div className="text-[8px] text-neutral-600 font-sans">
                                <span className="font-bold">{msg.discussion.choices[chosenIdx].label}:</span>{" "}
                                {msg.discussion.choices[chosenIdx].outcomeText}
                              </div>
                            )}
                            {!isResolved && (
                              <div className="flex flex-col gap-1">
                                {msg.discussion.choices.map((choice: any, cIdx: number) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => { playMutedClick(); resolveTeamChatMessageChoice(msg.id, cIdx); }}
                                    className="text-left p-1 border border-neutral-300 rounded hover:bg-neutral-100 text-[8px] transition-all cursor-pointer font-sans"
                                  >
                                    <span className="font-bold text-neutral-900 block">{choice.label}</span>
                                    <span className="text-neutral-500 text-[7px] font-light leading-tight">{choice.description}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Crew Collaboration Actions in Chat Panel */}
                {(stage === 'usp' || stage === 'businessModel') && (
                  <div className="p-2 border border-neutral-800 rounded-md bg-neutral-950 text-white space-y-2 mb-2 select-none text-[8.5px] font-mono">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-1 uppercase tracking-wider text-amber-500 font-bold">
                      <span>⚡ CREW COLLABORATION BOARD</span>
                      <span className="text-[7.5px] bg-neutral-900 text-neutral-400 px-1 py-0.2 rounded font-normal font-sans tracking-normal">
                        STAGE: {stage === 'usp' ? 'USP' : 'BIZ MODEL'}
                      </span>
                    </div>

                    <div className="flex gap-1.5 border-b border-neutral-800 pb-1.5">
                      {/* Consult Specialist Button */}
                      {(() => {
                        const strategistTeammate = team.find((t: any) => {
                          const r = (t.role || "").toLowerCase();
                          return r.includes('strategist') || r.includes('founder') || r.includes('business') || r.includes('designer') || r.includes('ux') || r.includes('researcher');
                        });

                        if (strategistTeammate) {
                          const hasAdvice = !!activeTeammateAdvice[strategistTeammate.id];
                          return (
                            <button
                              disabled={strategistTeammate.helpTokenUsed || hasAdvice}
                              onClick={() => {
                                playMutedClick();
                                useTeammateHelp(strategistTeammate.id, stage);
                              }}
                              className="flex-1 bg-amber-500 text-neutral-950 font-bold uppercase tracking-wider rounded border-none py-1 hover:bg-amber-400 disabled:opacity-50 text-[8px] cursor-pointer"
                            >
                              {hasAdvice ? "PENDING..." : strategistTeammate.helpTokenUsed ? "USED" : `CONSULT ${strategistTeammate.name.toUpperCase()}`}
                            </button>
                          );
                        }
                        return (
                          <button
                            disabled
                            className="flex-1 bg-neutral-800 text-neutral-500 rounded border-none py-1 text-[7.5px] cursor-not-allowed"
                            title="No specialist in crew"
                          >
                            🔒 NO SPECIALIST
                          </button>
                        );
                      })()}
                    </div>

                    {stage === 'usp' ? (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="space-y-0.5">
                          <span className="text-[7px] text-neutral-400 uppercase tracking-wider block font-bold">SELECT USP TO VOTE ON:</span>
                          <select
                            value={selectedUspToVote}
                            onChange={(e) => setSelectedUspToVote(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white rounded px-1.5 py-0.5 text-[8px] font-mono focus:outline-none focus:border-emerald-600"
                          >
                            {(state.generatedUSPs || []).map((u: any) => (
                              <option key={u.key || u.name} value={u.name} className="bg-neutral-950 text-white font-mono">
                                {u.name.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[7px] text-neutral-400 uppercase tracking-wider block font-bold">ROLE:</span>
                          <div className="flex gap-1 border border-neutral-855 p-0.5 rounded bg-neutral-900">
                            <button
                              type="button"
                              onClick={() => setVoteRole('primary')}
                              className={`flex-1 py-0.5 rounded text-[7.5px] font-bold font-mono tracking-wider border-none cursor-pointer uppercase ${
                                voteRole === 'primary' 
                                  ? 'bg-emerald-600 text-white shadow-sm' 
                                  : 'bg-transparent text-neutral-400 hover:text-white'
                              }`}
                            >
                              Primary
                            </button>
                            <button
                              type="button"
                              onClick={() => setVoteRole('secondary')}
                              className={`flex-1 py-0.5 rounded text-[7.5px] font-bold font-mono tracking-wider border-none cursor-pointer uppercase ${
                                voteRole === 'secondary' 
                                  ? 'bg-amber-600 text-white shadow-sm' 
                                  : 'bg-transparent text-neutral-400 hover:text-white'
                              }`}
                            >
                              Secondary
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            playMutedClick();
                            const { triggerCrewVote } = useGameStore.getState();
                            triggerCrewVote('usp', selectedUspToVote, voteRole);
                          }}
                          className="w-full bg-emerald-600 text-white font-bold uppercase tracking-wider rounded border-none py-1 hover:bg-emerald-500 text-[8px] cursor-pointer mt-1"
                        >
                          🗳️ ASK TEAM TO VOTE
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="space-y-0.5">
                          <span className="text-[7px] text-neutral-400 uppercase tracking-wider block font-bold">SELECT STRATEGY TO VOTE ON:</span>
                          <select
                            value={selectedModelToVote}
                            onChange={(e) => setSelectedModelToVote(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white rounded px-1.5 py-0.5 text-[8px] font-mono focus:outline-none focus:border-emerald-600"
                          >
                            {(state.generatedBusinessModels || []).map((m: any) => (
                              <option key={m.id} value={m.id} className="bg-neutral-950 text-white font-mono">
                                {m.name.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            playMutedClick();
                            const { triggerCrewVote } = useGameStore.getState();
                            triggerCrewVote('businessModel', selectedModelToVote);
                          }}
                          className="w-full bg-emerald-600 text-white font-bold uppercase tracking-wider rounded border-none py-1 hover:bg-emerald-500 text-[8px] cursor-pointer mt-1"
                        >
                          🗳️ ASK TEAM TO VOTE
                        </button>
                      </div>
                    )}

                    {state.hasCrewVotedThisStage && state.hasCrewVotedThisStage[stage] && (
                      <div className="text-center font-bold text-[7px] text-emerald-400 uppercase tracking-widest font-mono pt-1 animate-pulse">
                        ✓ POLL RESOLVED IN CHAT (+5 PTS ADDED)
                      </div>
                    )}
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-neutral-200 px-2 py-1.5 flex-shrink-0 bg-neutral-50">
            <p className="text-[7px] text-neutral-400 leading-tight font-sans">
              {activeTeamTab === 'crew'
                ? "Teammates give advice once per hackathon."
                : "Resolve debates to update your project strategy."
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Persistent Team Panel helper forward ref ────────────────────────────────
function getSubtleGatingStatus(teammate: any) {
  // This is a module-level stub; the real impl is defined inside GamePage
  return "Watching...";
}

function TeammateAdviceNotification() {
  return null; // Completely moved inline to persistent team chat window!
}

function TeamChatMomentModal() {
  const { activeTeamChatMoment, resolveTeamChatMoment } = useGameStore();
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);

  if (!activeTeamChatMoment) return null;

  const currentChoice = selectedChoiceIdx !== null ? activeTeamChatMoment.choices[selectedChoiceIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-mono text-xs select-none">
      <div className="w-full max-w-lg bg-card border-2 border-neutral-900 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 text-left relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-250 pb-2 mb-4">
          <span className="text-[9px] text-neutral-450 uppercase font-bold tracking-wider">💬 Team Chat Moment</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-white font-bold uppercase">DISCORD_CHAT</span>
        </div>

        <h3 className="text-sm font-black uppercase text-neutral-900 mb-4">
          {activeTeamChatMoment.title}
        </h3>

        {/* Chat dialogue bubbles */}
        <div className="space-y-3 mb-6 bg-neutral-50 border border-neutral-200 rounded p-4 max-h-[220px] overflow-y-auto">
          {/* Teammate A bubble */}
          <div className="flex gap-2">
            <span className="text-xl shrink-0 mt-0.5">{activeTeamChatMoment.teammateA.avatar}</span>
            <div className="space-y-0.5">
              <span className="font-bold text-neutral-900 text-[10px] block leading-none">{activeTeamChatMoment.teammateA.name}</span>
              <p className="text-[11px] text-neutral-700 bg-white border border-neutral-200 rounded-r-md rounded-bl-md px-2.5 py-1.5 font-sans font-light leading-relaxed">
                {activeTeamChatMoment.teammateA.statement}
              </p>
            </div>
          </div>

          {/* Teammate B bubble */}
          <div className="flex gap-2 justify-end">
            <div className="space-y-0.5 text-right flex flex-col items-end">
              <span className="font-bold text-neutral-900 text-[10px] block leading-none">{activeTeamChatMoment.teammateB.name}</span>
              <p className="text-[11px] text-neutral-700 bg-white border border-neutral-200 rounded-l-md rounded-br-md px-2.5 py-1.5 font-sans font-light leading-relaxed text-left animate-fade-in">
                {activeTeamChatMoment.teammateB.statement}
              </p>
            </div>
            <span className="text-xl shrink-0 mt-0.5">{activeTeamChatMoment.teammateB.avatar}</span>
          </div>
        </div>

        {!showOutcome ? (
          /* Choices phase */
          <div className="space-y-2">
            <p className="text-[9px] text-neutral-450 uppercase mb-1 font-bold">CHOOSE A RESOLUTION:</p>
            {activeTeamChatMoment.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playMutedClick();
                  setSelectedChoiceIdx(idx);
                  setShowOutcome(true);
                }}
                className="w-full text-left p-3 rounded border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 transition-all cursor-pointer font-sans"
              >
                <strong className="font-mono text-xs uppercase block text-neutral-900 tracking-wide mb-0.5">
                  {choice.label}
                </strong>
                <span className="text-[10px] text-neutral-600 font-light leading-tight block">
                  {choice.description}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Outcome phase */
          <div className="space-y-4">
            <div className="p-4 rounded border border-neutral-900 bg-neutral-50/50 space-y-2">
              <span className="text-[9px] text-neutral-450 uppercase font-bold font-mono">RESOLVED DECISION OUTCOME</span>
              <p className="text-neutral-800 font-sans font-light leading-relaxed text-[11px]">
                {currentChoice?.outcomeText}
              </p>

              {/* Modifier summary */}
              {currentChoice?.modifiers && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-neutral-250 select-none">
                  {Object.entries(currentChoice.modifiers).map(([stat, val]) => {
                    if (!val) return null;
                    return (
                      <span key={stat} className="px-1.5 py-0.5 rounded bg-neutral-900 text-white font-mono text-[9px] font-bold uppercase">
                        {stat}: {val > 0 ? `+${val}` : val}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                playMutedClick();
                if (selectedChoiceIdx !== null) {
                  resolveTeamChatMoment(selectedChoiceIdx);
                }
              }}
              className="w-full font-mono text-xs h-9 bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800 cursor-pointer"
            >
              RESUME WORK
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  const state = useGameStore();
  const {
    stage,
    isGameStarted,
    startGame,
    tickTimer,
    isTimerPaused,
    activeChaosEvent,
    selectedProblem,
    activeTeamChatMoment,
    useTeammateHelp,
    activeTeammateAdvice,
    team,
    playerName,
    playerAvatar,
    teamChatMessages,
    unreadChatCount,
    clearUnreadChatCount,
    resolveTeamChatMessageChoice,
  } = state;

  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<'crew' | 'chat'>('crew');

  const getMessageTypeBadge = (type?: string) => {
    switch (type) {
      case 'suggestion':
        return { label: 'Suggestion', icon: '💡', bg: 'bg-purple-50 text-purple-750 border-purple-200' };
      case 'warning':
        return { label: 'Warning', icon: '⚠️', bg: 'bg-amber-50 text-amber-750 border-amber-200' };
      case 'disagreement':
        return { label: 'Discussion', icon: '💬', bg: 'bg-blue-50 text-blue-750 border-blue-200' };
      case 'contribution':
        return { label: 'Contribution', icon: '✅', bg: 'bg-emerald-50 text-emerald-750 border-emerald-250' };
      case 'action_completed':
        return { label: 'Action Completed', icon: '🛠️', bg: 'bg-neutral-50 text-neutral-800 border-neutral-300' };
      case 'info':
        return { label: 'Info', icon: 'ℹ️', bg: 'bg-sky-50 text-sky-750 border-sky-200' };
      case 'waiting':
        return { label: 'Waiting', icon: '⏳', bg: 'bg-neutral-50 text-neutral-500 border-neutral-200' };
      default:
        return null;
    }
  };

  const getSubtleGatingStatus = (teammate: Teammate) => {
    const role = (teammate.role || "").toLowerCase();
    if (role.includes("backend") || role.includes("database") || role.includes("developer") || role.includes("full stack") || role.includes("fullstack") || role.startsWith("dev")) {
      return "Watching architecture.";
    }
    if (role.includes("designer") || role.includes("ux") || role.includes("ui ") || role.includes("product design") || role.includes("frontend") || role.includes("front-end")) {
      return "Watching product decisions.";
    }
    if (role.includes("strategist") || role.includes("founder") || role.includes("business") || role.includes("co-founder") || role.includes("analyst")) {
      return "Watching business model.";
    }
    if ((role.includes("ai") && !role.includes("assistant")) || role.includes("ml") || role.includes("machine learning") || role.includes("data scientist")) {
      return "Watching AI direction.";
    }
    if (role.includes("researcher") || role.includes("research")) {
      return "Watching project selection.";
    }
    if (role.includes("pitch") || role.includes("marketing") || role.includes("sales")) {
      return "Watching pitch deck.";
    }
    return "Watching project details.";
  };

  useEffect(() => {
    if (isTeamDrawerOpen && activeTeamTab === 'chat') {
      clearUnreadChatCount();
    }
  }, [isTeamDrawerOpen, activeTeamTab, clearUnreadChatCount]);

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
      case "teamFormation":
        return <TeamFormationStage key="teamFormation" />;
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
      case "pitchDeck":
        return <PitchDeckStage key="pitchDeck" />;
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
              PREPARING SIMULATOR SESSION...
            </span>
          </div>
        );
    }
  };

  const showTeamPanel = selectedProblem && stage !== 'results' && stage !== 'teamFormation';

  return (
    <GameLayout>
      <div className="relative w-full h-full min-h-screen pb-16">
        {selectedProblem && stage !== 'results' && <ProjectHealthDashboard />}
        {selectedProblem && stage !== 'results' && <TeammateAdviceNotification />}
        
        <AnimatePresence mode="wait">{renderStageContent()}</AnimatePresence>
        
        <AnimatePresence>
          {activeChaosEvent && <ChaosEventOverlay />}
        </AnimatePresence>

        {/* Persistent Left Team Panel */}
        {showTeamPanel && (
          <PersistentTeamPanel
            team={team}
            playerName={playerName}
            playerAvatar={playerAvatar}
            activeTeamTab={activeTeamTab}
            setActiveTeamTab={setActiveTeamTab}
            teamChatMessages={teamChatMessages}
            unreadChatCount={unreadChatCount}
            activeTeammateAdvice={activeTeammateAdvice}
            clearUnreadChatCount={clearUnreadChatCount}
            resolveTeamChatMessageChoice={resolveTeamChatMessageChoice}
            useTeammateHelp={useTeammateHelp}
            stage={stage}
            state={state}
            getMessageTypeBadge={getMessageTypeBadge}
          />
        )}

        {/* Team Chat Moment Modal */}
        <AnimatePresence>
          {activeTeamChatMoment && <TeamChatMomentModal />}
        </AnimatePresence>
        
        <DevDebugPanel />
      </div>
    </GameLayout>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import GameLayout from "@/components/game/GameLayout";
import ProblemReveal from "@/components/game/ProblemReveal";
import JudgeWheel from "@/components/game/JudgeWheel";
import { TechStackDnD } from "@/components/drag-drop/TechStackDnD";
import { FeaturePriorityDnD } from "@/components/drag-drop/FeaturePriorityDnD";
import { Button } from "@/components/ui/button";
import {
  Hammer,
  Loader2,
  ChevronRight,
  Coffee,
  Bug,
  Sparkles,
} from "lucide-react";

/**
 * Building Phase placeholder component.
 * Shows a simulated "building" state with progress indicators.
 *
 * TODO: Implement actual building phase gameplay with:
 * - Random events (bugs, mentor visits, feature requests)
 * - Decision cards for handling events
 * - Progress bar showing project completion
 * - Mini-game interactions
 */
function BuildingPhase() {
  const { nextPhase } = useGameStore();

  const buildingEvents = [
    { icon: <Coffee className="w-5 h-5" />, text: "Team grabbing coffee...", color: "text-neon-orange" },
    { icon: <Bug className="w-5 h-5" />, text: "Squashing a critical bug...", color: "text-red-400" },
    { icon: <Sparkles className="w-5 h-5" />, text: "Adding final polish...", color: "text-neon-purple" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full gap-8 px-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="p-4 rounded-2xl bg-neon-blue/10 border border-neon-blue/20"
      >
        <Hammer className="w-12 h-12 text-neon-blue" />
      </motion.div>

      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Building in Progress...</h2>
        <p className="text-muted-foreground max-w-md">
          Your team is working hard to bring the project to life. Hang tight!
        </p>
      </div>

      {/* Simulated build events */}
      <div className="glass-card p-6 max-w-md w-full space-y-4">
        {buildingEvents.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.5 }}
            className="flex items-center gap-3"
          >
            <div className={event.color}>{event.icon}</div>
            <span className="text-sm">{event.text}</span>
            {i === buildingEvents.length - 1 && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
            )}
          </motion.div>
        ))}
      </div>

      <Button
        onClick={nextPhase}
        className="bg-neon-blue hover:bg-neon-blue/90 text-white glow-blue"
      >
        Skip to Judging
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>

      <p className="text-xs text-muted-foreground">
        {/* TODO: Remove skip button and auto-advance when timer runs out */}
        Building phase will auto-complete when time runs out
      </p>
    </motion.div>
  );
}

/**
 * Game Page — The Hackathon Simulator
 *
 * Main gameplay page that renders different components based on the
 * current game phase from the Zustand store.
 *
 * Phase flow:
 * LOBBY → PROBLEM_REVEAL → TECH_STACK → FEATURE_PRIORITY → BUILDING → JUDGING → RESULTS
 */
export default function GamePage() {
  const { phase, isGameStarted, startGame } = useGameStore();
  const router = useRouter();

  // Auto-start game when page loads if not started
  useEffect(() => {
    if (!isGameStarted) {
      startGame();
    }
  }, [isGameStarted, startGame]);

  /**
   * Renders the appropriate component based on the current game phase.
   * Uses AnimatePresence for smooth transitions between phases.
   */
  const renderPhaseContent = () => {
    switch (phase) {
      case "PROBLEM_REVEAL":
        return <ProblemReveal key="problem-reveal" />;

      case "TECH_STACK":
        return <TechStackDnD key="tech-stack" />;

      case "FEATURE_PRIORITY":
        return <FeaturePriorityDnD key="feature-priority" />;

      case "BUILDING":
        return <BuildingPhase key="building" />;

      case "JUDGING":
        return <JudgeWheel key="judging" />;

      case "RESULTS":
        // Redirect to results page for the full experience
        router.push("/results");
        return null;

      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-neon-blue mx-auto" />
              <p className="text-muted-foreground">
                Initializing simulation...
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <GameLayout>
      <AnimatePresence mode="wait">{renderPhaseContent()}</AnimatePresence>
    </GameLayout>
  );
}

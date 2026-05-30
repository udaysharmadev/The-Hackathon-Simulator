'use client';

/**
 * @file GameLayout — Main game layout wrapper
 * @description Full-screen container with grid-pattern overlay, top header bar
 * (logo, phase stepper, timer), scrollable content area with AnimatePresence,
 * and a bottom status bar showing the current score.
 */

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/store/gameStore';
import GameTimer from './GameTimer';
import type { GamePhase } from '@/types/game';

// ─── Phase metadata ─────────────────────────────────────────────────────────────

/** Human-readable labels & order for the stepper */
const PHASES: { key: GamePhase; label: string }[] = [
  { key: 'LOBBY', label: 'Lobby' },
  { key: 'PROBLEM_REVEAL', label: 'Problem' },
  { key: 'TECH_STACK', label: 'Tech Stack' },
  { key: 'FEATURE_PRIORITY', label: 'Features' },
  { key: 'BUILDING', label: 'Building' },
  { key: 'JUDGING', label: 'Judging' },
  { key: 'RESULTS', label: 'Results' },
];

// ─── Props ──────────────────────────────────────────────────────────────────────

interface GameLayoutProps {
  children: ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function GameLayout({ children }: GameLayoutProps) {
  const phase = useGameStore((s) => s.phase);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const totalTime = useGameStore((s) => s.totalTime);
  const score = useGameStore((s) => s.score);

  const currentIndex = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="animated-gradient-bg grid-pattern relative flex h-screen flex-col overflow-hidden">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="glass-card-strong relative z-20 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-2 sm:px-6">
        {/* Left — Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-blue/10">
            <Terminal className="h-4 w-4 text-neon-blue" />
          </div>
          <span className="text-glow-blue hidden text-sm font-bold tracking-wider sm:block">
            HACKATHON SIM
          </span>
        </div>

        {/* Center — Phase Stepper */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Game phase">
          {PHASES.map((p, i) => {
            const isCurrent = p.key === phase;
            const isCompleted = i < currentIndex;

            return (
              <div key={p.key} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`mx-1 h-px w-4 transition-colors ${
                      isCompleted ? 'bg-neon-green/60' : 'bg-white/10'
                    }`}
                  />
                )}

                <Badge
                  variant={isCurrent ? 'default' : 'secondary'}
                  className={
                    isCurrent
                      ? 'bg-neon-blue/20 text-neon-blue ring-1 ring-neon-blue/30'
                      : isCompleted
                        ? 'bg-neon-green/10 text-neon-green/70'
                        : 'opacity-50'
                  }
                >
                  {p.label}
                </Badge>
              </div>
            );
          })}
        </nav>

        {/* Center fallback for mobile — current phase only */}
        <div className="md:hidden">
          <Badge className="bg-neon-blue/20 text-neon-blue ring-1 ring-neon-blue/30">
            {PHASES[currentIndex]?.label ?? phase}
          </Badge>
        </div>

        {/* Right — Timer */}
        <div className="flex items-center">
          {totalTime > 0 ? (
            <GameTimer
              timeRemaining={timeRemaining}
              totalTime={totalTime}
              size="sm"
            />
          ) : (
            <div className="h-8 w-20" /> /* spacer when no timer */
          )}
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Status Bar ──────────────────────────────────────────── */}
      <footer className="glass-card-strong relative z-20 flex items-center justify-between rounded-none border-x-0 border-b-0 px-4 py-1.5 sm:px-6">
        <span className="text-xs text-muted-foreground">
          Phase {currentIndex + 1} / {PHASES.length}
        </span>

        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-neon-orange" />
          <span className="text-glow-cyan font-mono text-sm font-semibold text-neon-cyan">
            {score.total}
          </span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      </footer>
    </div>
  );
}

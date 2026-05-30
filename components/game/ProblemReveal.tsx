'use client';

/**
 * @file ProblemReveal — Dramatic problem-statement selection screen
 * @description Shows 3 problem cards from the problem pool for the player to
 * choose from. Each card reveals with a staggered Framer Motion animation and
 * includes a difficulty indicator, constraints, and bonus objectives.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Star, Zap, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { PROBLEMS } from '@/data/problems';
import { cn } from '@/lib/utils';
import type { Problem } from '@/types/game';

// ─── Category color map ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<Problem['category'], string> = {
  fintech: 'bg-neon-orange/15 text-neon-orange ring-neon-orange/30',
  healthtech: 'bg-neon-green/15 text-neon-green ring-neon-green/30',
  edtech: 'bg-neon-blue/15 text-neon-blue ring-neon-blue/30',
  sustainability: 'bg-emerald-500/15 text-emerald-400 ring-emerald-400/30',
  'social-impact': 'bg-neon-pink/15 text-neon-pink ring-neon-pink/30',
};

const DIFFICULTY_LEVELS: Record<Problem['difficulty'], number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const DIFFICULTY_COLORS: Record<Problem['difficulty'], string> = {
  beginner: 'text-neon-green',
  intermediate: 'text-neon-orange',
  advanced: 'text-red-400',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ProblemReveal() {
  const selectProblem = useGameStore((s) => s.selectProblem);
  const nextPhase = useGameStore((s) => s.nextPhase);

  /** Take the first 3 problems from the pool */
  const problems = PROBLEMS.slice(0, 3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleAccept = () => {
    const chosen = problems.find((p) => p.id === selectedId);
    if (!chosen) return;
    selectProblem(chosen);
    nextPhase();
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-10">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="typewriter-cursor text-glow-blue text-2xl font-bold tracking-tight sm:text-3xl">
          Choose Your Challenge
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select one problem statement to tackle during the hackathon.
        </p>
      </motion.div>

      {/* Problem cards */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        <AnimatePresence>
          {problems.map((problem, i) => {
            const isSelected = selectedId === problem.id;
            const diffLevel = DIFFICULTY_LEVELS[problem.difficulty];

            return (
              <motion.button
                key={problem.id}
                type="button"
                onClick={() => setSelectedId(problem.id)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15, duration: 0.45, ease: 'easeOut' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'glass-card relative flex flex-col items-start gap-4 p-6 text-left transition-all duration-200',
                  isSelected && 'glass-card-strong glow-blue border-neon-blue/30',
                )}
                aria-pressed={isSelected}
              >
                {/* Category + difficulty row */}
                <div className="flex w-full items-center justify-between">
                  <Badge
                    className={cn(
                      'ring-1',
                      CATEGORY_COLORS[problem.category],
                    )}
                  >
                    {problem.category}
                  </Badge>

                  {/* Difficulty dots */}
                  <div className="flex items-center gap-1" title={problem.difficulty}>
                    {[1, 2, 3].map((d) => (
                      <div
                        key={d}
                        className={cn(
                          'h-2 w-2 rounded-full transition-colors',
                          d <= diffLevel
                            ? DIFFICULTY_COLORS[problem.difficulty]
                            : 'bg-white/10',
                          d <= diffLevel && 'shadow-[0_0_6px_currentColor]',
                        )}
                        style={
                          d <= diffLevel
                            ? { backgroundColor: 'currentColor' }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-foreground">
                  {problem.title}
                </h2>

                {/* Description */}
                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {problem.description}
                </p>

                {/* Constraints */}
                <div className="w-full space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Constraints
                  </span>
                  {problem.constraints.slice(0, 2).map((c, ci) => (
                    <div key={ci} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      <span className="text-[11px] leading-tight text-muted-foreground">
                        {c}
                      </span>
                    </div>
                  ))}
                  {problem.constraints.length > 2 && (
                    <span className="text-[10px] text-muted-foreground/60">
                      +{problem.constraints.length - 2} more…
                    </span>
                  )}
                </div>

                {/* Bonus Objectives */}
                <div className="w-full space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Bonus Objectives
                  </span>
                  {problem.bonusObjectives.slice(0, 2).map((b, bi) => (
                    <div key={bi} className="flex items-start gap-1.5">
                      <Star className="mt-0.5 h-3 w-3 shrink-0 text-neon-orange" />
                      <span className="text-[11px] leading-tight text-muted-foreground">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Selected check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-neon-blue shadow-lg shadow-neon-blue/30"
                  >
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Accept CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedId ? 1 : 0.4 }}
        transition={{ duration: 0.25 }}
      >
        <Button
          onClick={handleAccept}
          disabled={!selectedId}
          className={cn(
            'glow-blue gap-2 bg-neon-blue/90 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-neon-blue',
            !selectedId && 'pointer-events-none',
          )}
        >
          Accept Challenge
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

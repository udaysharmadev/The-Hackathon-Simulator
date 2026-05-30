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
import { RotateCcw, Share2, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';

// ─── Score categories ───────────────────────────────────────────────────────────

const CATEGORIES: { key: 'innovation' | 'execution' | 'design' | 'pitch'; label: string; color: string }[] = [
  { key: 'innovation', label: 'Innovation', color: 'bg-neon-purple' },
  { key: 'execution', label: 'Execution', color: 'bg-neon-blue' },
  { key: 'design', label: 'Design', color: 'bg-neon-pink' },
  { key: 'pitch', label: 'Pitch', color: 'bg-neon-orange' },
];

// ─── Mock judge feedback (placeholder until game logic is implemented) ──────────

const MOCK_FEEDBACK = [
  {
    judgeId: 'judge-shark',
    name: 'Victoria Chen',
    avatar: '🦈',
    score: 82,
    comment: 'Impressive market awareness. The unit economics need more thought, but the vision is compelling.',
    highlight: 'Clear value proposition',
  },
  {
    judgeId: 'judge-artist',
    name: 'Marcus Rivera',
    avatar: '🎨',
    score: 90,
    comment: 'Beautiful interface with thoughtful micro-interactions. Accessibility could use a pass.',
    highlight: 'Outstanding visual design',
  },
  {
    judgeId: 'judge-tech',
    name: 'Dr. Priya Kapoor',
    avatar: '⚡',
    score: 75,
    comment: 'Solid architecture choices. I would have liked to see better error-handling and test coverage.',
    highlight: 'Clean code structure',
  },
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
  const score = useGameStore((s) => s.score);
  const resetGame = useGameStore((s) => s.resetGame);

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
          {MOCK_FEEDBACK.map((fb, i) => (
            <motion.div
              key={fb.judgeId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }}
              className="glass-card flex flex-col gap-3 p-4"
            >
              {/* Judge header */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{fb.avatar}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{fb.name}</p>
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
                className="w-fit text-[10px]"
              >
                ✨ {fb.highlight}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

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

'use client';

/**
 * @file GameTimer — Premium circular countdown timer
 * @description Renders an SVG circular progress ring with animated stroke-dashoffset,
 * a digital MM:SS readout, and color transitions based on the remaining time percentage.
 *
 * Color scheme:
 *  - > 50% remaining → neon green (#10b981)
 *  - 25-50% remaining → amber/warning (#f59e0b)
 *  - < 25% remaining → red/urgent (#ef4444) with pulse animation
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Size presets ───────────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm: 80,
  md: 120,
  lg: 160,
} as const;

const STROKE_MAP = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;

const FONT_SIZE_MAP = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
} as const;

const LABEL_SIZE_MAP = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
} as const;

// ─── Props ──────────────────────────────────────────────────────────────────────

interface GameTimerProps {
  /** Seconds remaining on the clock */
  timeRemaining: number;
  /** Total seconds for the current phase */
  totalTime: number;
  /** Visual size preset (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to render a text label beneath the timer */
  showLabel?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Format seconds into MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Determine the accent color based on remaining-time percentage */
function getTimerColor(pct: number): string {
  if (pct > 0.5) return '#10b981'; // neon green
  if (pct > 0.25) return '#f59e0b'; // amber / warning
  return '#ef4444'; // red / urgent
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function GameTimer({
  timeRemaining,
  totalTime,
  size = 'md',
  showLabel = false,
}: GameTimerProps) {
  const diameter = SIZE_MAP[size];
  const stroke = STROKE_MAP[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const pct = totalTime > 0 ? timeRemaining / totalTime : 0;
  const dashOffset = circumference * (1 - pct);
  const color = getTimerColor(pct);
  const isUrgent = pct <= 0.25 && totalTime > 0;

  /** Memoised glow filter so we only recalculate when color changes */
  const filterId = useMemo(() => `timer-glow-${size}`, [size]);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* SVG ring + digital readout */}
      <div className="relative" style={{ width: diameter, height: diameter }}>
        <svg
          width={diameter}
          height={diameter}
          className="-rotate-90"
          viewBox={`0 0 ${diameter} ${diameter}`}
        >
          {/* Glow filter */}
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />

          {/* Animated progress arc */}
          <motion.circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            filter={`url(#${filterId})`}
          />
        </svg>

        {/* Digital time */}
        <motion.div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-mono font-bold',
            FONT_SIZE_MAP[size],
          )}
          style={{ color }}
          animate={isUrgent ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={
            isUrgent
              ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          {formatTime(timeRemaining)}
        </motion.div>
      </div>

      {/* Optional label */}
      {showLabel && (
        <span
          className={cn(
            'uppercase tracking-widest text-muted-foreground',
            LABEL_SIZE_MAP[size],
          )}
        >
          Time Remaining
        </span>
      )}
    </div>
  );
}

'use client';

/**
 * @file DecisionCard — Reusable choice card with premium glass styling
 * @description A glassmorphism card used whenever the player must pick between
 * options (tech stack items, features, strategies, etc.). Supports selected,
 * disabled, and idle states with animated transitions.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Glow color mapping ────────────────────────────────────────────────────────

const GLOW_CLASSES: Record<string, string> = {
  blue: 'glow-blue border-neon-blue/30',
  cyan: 'glow-cyan border-neon-cyan/30',
  green: 'glow-green border-neon-green/30',
  purple: 'glow-purple border-neon-purple/30',
};

const BORDER_IDLE: Record<string, string> = {
  blue: 'hover:border-neon-blue/20',
  cyan: 'hover:border-neon-cyan/20',
  green: 'hover:border-neon-green/20',
  purple: 'hover:border-neon-purple/20',
};

// ─── Props ──────────────────────────────────────────────────────────────────────

interface DecisionCardProps {
  /** Card heading */
  title: string;
  /** Supporting copy beneath the title */
  description: string;
  /** Icon element rendered prominently at the top */
  icon: React.ReactNode;
  /** Whether this option is currently selected */
  selected?: boolean;
  /** Whether interaction is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Glow accent color (default: 'blue') */
  glowColor?: 'blue' | 'cyan' | 'green' | 'purple';
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function DecisionCard({
  title,
  description,
  icon,
  selected = false,
  disabled = false,
  onClick,
  glowColor = 'blue',
}: DecisionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        // Base glass card
        'glass-card relative flex w-full cursor-pointer flex-col items-center gap-3 p-6 text-left transition-all duration-200',
        // Idle border hint on hover
        !selected && !disabled && BORDER_IDLE[glowColor],
        // Selected state — stronger glow + border
        selected && GLOW_CLASSES[glowColor],
        selected && 'glass-card-strong',
        // Disabled state
        disabled && 'pointer-events-none opacity-40',
      )}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-lg transition-colors',
          selected && 'bg-white/10',
        )}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className={cn(
          'text-center text-sm font-semibold text-foreground transition-colors',
          selected && 'text-white',
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Selected indicator dot */}
      {selected && (
        <motion.div
          layoutId="decision-selected-dot"
          className={cn(
            'absolute -top-1 -right-1 h-3 w-3 rounded-full',
            glowColor === 'blue' && 'bg-neon-blue',
            glowColor === 'cyan' && 'bg-neon-cyan',
            glowColor === 'green' && 'bg-neon-green',
            glowColor === 'purple' && 'bg-neon-purple',
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

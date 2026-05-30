'use client';

/**
 * @file DraggableCard — Generic draggable card component.
 *
 * Wraps any content in a glass-styled card that can participate in
 * @dnd-kit drag-and-drop interactions. Provides polished visual feedback:
 * lift-on-grab, shadow depth, opacity shift, and cursor state changes.
 *
 * @example
 * ```tsx
 * <DraggableCard id="tech-react" data={{ category: 'frontend' }}>
 *   <span>React</span>
 * </DraggableCard>
 * ```
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────────

export interface DraggableCardProps {
  /** Unique identifier used by @dnd-kit to track this draggable */
  id: string;
  /** Content rendered inside the card */
  children: React.ReactNode;
  /** Arbitrary data payload attached to the drag event */
  data?: Record<string, unknown>;
  /** Additional CSS classes merged onto the outer wrapper */
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────────

/**
 * A generic draggable card that integrates with @dnd-kit's `DndContext`.
 *
 * Visual feedback states:
 * - **Idle** — glass card at rest, `cursor-grab`
 * - **Dragging** — card lifts (translateY -4px), gains a neon shadow,
 *   opacity reduces to 0.85, `cursor-grabbing`
 *
 * Framer Motion `spring` transition ensures a smooth pickup / drop feel.
 */
export function DraggableCard({
  id,
  children,
  data,
  className,
}: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id, data });

  // Convert @dnd-kit transform to inline CSS translate
  const dndStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={dndStyle}
      // Framer Motion handles visual enhancements on top of the dnd transform
      animate={{
        scale: isDragging ? 1.04 : 1,
        y: isDragging ? -4 : 0,
        opacity: isDragging ? 0.85 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 25,
        mass: 0.8,
      }}
      className={cn(
        // Base glass card styling
        'glass-card relative rounded-xl p-3',
        // Shadow & glow when dragging
        isDragging
          ? 'shadow-lg shadow-neon-blue/25 ring-1 ring-neon-blue/40 z-50'
          : 'shadow-md z-0',
        // Cursor states
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        // Smooth transition for non-framer properties
        'transition-shadow duration-200',
        className,
      )}
      {...listeners}
      {...attributes}
    >
      {children}
    </motion.div>
  );
}

export default DraggableCard;

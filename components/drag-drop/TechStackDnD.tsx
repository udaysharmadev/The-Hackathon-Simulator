'use client';

/**
 * @file TechStackDnD — Tech stack builder with drag-and-drop.
 *
 * Allows the player to assemble a tech stack by browsing categorised tech
 * items and dragging (or clicking) them into a "My Stack" drop zone.
 * Connected to the Zustand game store for persistence.
 *
 * TODO: Implement full DnD transfer logic via DndContext onDragEnd.
 * TODO: Add synergy indicators when complementary tech is combined.
 * TODO: Enforce max tech-stack budget (e.g., 5 items).
 * TODO: Add search / filter within categories.
 */

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Server,
  Database,
  Cloud,
  Brain,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Globe,
  Wind,
  Code2,
  Hexagon,
  Container,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import type { TechItem } from '@/types/game';
import { DraggableCard } from './DraggableCard';
import { DropZone } from './DropZone';
import { Button } from '@/components/ui/button';

// ─── Local Tech Data ────────────────────────────────────────────────────────────

/** Category metadata for grouping and display */
const CATEGORIES = [
  { key: 'frontend' as const, label: 'Frontend', icon: Globe, color: 'text-neon-cyan' },
  { key: 'backend' as const, label: 'Backend', icon: Server, color: 'text-neon-green' },
  { key: 'database' as const, label: 'Database', icon: Database, color: 'text-neon-purple' },
  { key: 'devops' as const, label: 'DevOps', icon: Cloud, color: 'text-neon-orange' },
  { key: 'ai' as const, label: 'AI', icon: Brain, color: 'text-neon-pink' },
] as const;

/**
 * Sample tech items available for selection.
 *
 * Each item maps to a {@link TechItem} from `@/types/game`.
 * Synergies are left as TODO placeholders.
 */
const AVAILABLE_TECH: TechItem[] = [
  // Frontend
  { id: 'react', name: 'React', icon: 'layers', category: 'frontend', difficulty: 2, synergies: ['node', 'vercel'] },
  { id: 'vue', name: 'Vue', icon: 'wind', category: 'frontend', difficulty: 2, synergies: ['node'] },
  { id: 'svelte', name: 'Svelte', icon: 'hexagon', category: 'frontend', difficulty: 3, synergies: ['vercel'] },

  // Backend
  { id: 'node', name: 'Node.js', icon: 'code2', category: 'backend', difficulty: 2, synergies: ['react', 'mongodb'] },
  { id: 'python', name: 'Python', icon: 'code2', category: 'backend', difficulty: 2, synergies: ['postgresql', 'ai-recs'] },
  { id: 'go', name: 'Go', icon: 'code2', category: 'backend', difficulty: 4, synergies: ['docker', 'postgresql'] },

  // Database
  { id: 'postgresql', name: 'PostgreSQL', icon: 'database', category: 'database', difficulty: 3, synergies: ['python', 'go'] },
  { id: 'mongodb', name: 'MongoDB', icon: 'database', category: 'database', difficulty: 2, synergies: ['node'] },
  { id: 'redis', name: 'Redis', icon: 'database', category: 'database', difficulty: 2, synergies: ['node', 'docker'] },

  // DevOps
  { id: 'docker', name: 'Docker', icon: 'container', category: 'devops', difficulty: 3, synergies: ['go', 'aws'] },
  { id: 'aws', name: 'AWS', icon: 'cloud', category: 'devops', difficulty: 4, synergies: ['docker'] },
  { id: 'vercel', name: 'Vercel', icon: 'cloud', category: 'devops', difficulty: 1, synergies: ['react', 'svelte'] },
];

/** Map icon string names to Lucide components for rendering */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  wind: Wind,
  hexagon: Hexagon,
  code2: Code2,
  database: Database,
  container: Container,
  cloud: Cloud,
  server: Server,
  brain: Brain,
};

// ─── Difficulty Dots ────────────────────────────────────────────────────────────

/** Renders 1-5 difficulty dots */
function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" title={`Difficulty: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            i < level ? 'bg-neon-cyan' : 'bg-white/15',
          )}
        />
      ))}
    </div>
  );
}

// ─── Tech Item Card (inner content) ─────────────────────────────────────────────

function TechItemContent({
  item,
  isSelected,
}: {
  item: TechItem;
  isSelected: boolean;
}) {
  const IconComponent = ICON_MAP[item.icon] || Layers;
  const categoryMeta = CATEGORIES.find((c) => c.key === item.category);

  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          'bg-white/[0.06] transition-colors',
          isSelected && 'bg-neon-cyan/15',
        )}
      >
        <IconComponent
          className={cn(
            'h-4 w-4',
            isSelected ? 'text-neon-cyan' : categoryMeta?.color ?? 'text-white/60',
          )}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <span
          className={cn(
            'text-sm font-medium leading-none truncate',
            isSelected ? 'text-white' : 'text-white/80',
          )}
        >
          {item.name}
        </span>
        <DifficultyDots level={item.difficulty} />
      </div>

      {/* Selected badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-neon-green/20"
          >
            <Check className="h-3 w-3 text-neon-green" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * Tech stack builder screen.
 *
 * Layout:
 * - **Left panel** — available tech grouped by category
 * - **Right panel** — "My Stack" drop zone with selected items
 * - **Bottom** — "Continue" button to advance to FEATURE_PRIORITY
 *
 * Currently uses click-to-toggle as the primary interaction.
 * DnD transfer is wired but simplified (TODO: full collision-based transfer).
 */
export function TechStackDnD() {
  const techStack = useGameStore((s) => s.techStack);
  const addTechItem = useGameStore((s) => s.addTechItem);
  const removeTechItem = useGameStore((s) => s.removeTechItem);
  const nextPhase = useGameStore((s) => s.nextPhase);

  const [activeId, setActiveId] = useState<string | null>(null);
  const MAX_STACK_SIZE = 5;

  // Sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const selectedIds = new Set(techStack.map((t) => t.id));

  /** Toggle a tech item in/out of the stack (click fallback) */
  const toggleItem = useCallback(
    (item: TechItem) => {
      if (selectedIds.has(item.id)) {
        removeTechItem(item.id);
      } else if (techStack.length < MAX_STACK_SIZE) {
        addTechItem(item);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [techStack, addTechItem, removeTechItem],
  );

  /** Group available items by category */
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: AVAILABLE_TECH.filter((t) => t.category === cat.key),
  }));

  // ── DnD Handlers ────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  /**
   * Handle drop event.
   *
   * TODO: Implement full collision-based transfer logic.
   * For now, if an item is dropped over the 'my-stack' zone, toggle it.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // If dropped on "my-stack" zone, add the item
    if (over.id === 'my-stack') {
      const item = AVAILABLE_TECH.find((t) => t.id === active.id);
      if (item && !selectedIds.has(item.id) && techStack.length < MAX_STACK_SIZE) {
        addTechItem(item);
      }
    }

    // TODO: If dropped back on the source area, remove from stack
    // TODO: Handle dropping on specific category zones
  };

  // Active item for DragOverlay
  const activeItem = activeId
    ? AVAILABLE_TECH.find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-1">
            Build Your Tech Stack
          </h2>
          <p className="text-sm text-white/50">
            Choose up to {MAX_STACK_SIZE} technologies. Drag them to your stack or click to toggle.
          </p>
        </motion.div>

        {/* ── Main Layout ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Source: Available Tech (Left - 3 cols) ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-5"
          >
            {grouped.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.key}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon className={cn('h-4 w-4', category.color)} />
                    <span className={cn('text-xs font-semibold uppercase tracking-wider', category.color)}>
                      {category.label}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Tech items grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {category.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <DraggableCard
                          key={item.id}
                          id={item.id}
                          data={{ ...item }}
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => toggleItem(item)}
                            aria-label={`${isSelected ? 'Remove' : 'Add'} ${item.name}`}
                          >
                            <TechItemContent item={item} isSelected={isSelected} />
                          </button>
                        </DraggableCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── Target: My Stack (Right - 2 cols) ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <DropZone
              id="my-stack"
              label="My Stack"
              capacity={MAX_STACK_SIZE}
              currentCount={techStack.length}
            >
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {techStack.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="glass-card p-3 flex items-center gap-3 group"
                    >
                      {/* Position number */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neon-cyan/10 text-xs font-bold text-neon-cyan tabular-nums">
                        {index + 1}
                      </span>

                      <TechItemContent item={item} isSelected={false} />

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeTechItem(item.id)}
                        className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </DropZone>

            {/* Synergy hint */}
            {techStack.length >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-2 rounded-lg bg-neon-purple/10 px-3 py-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-neon-purple" />
                <span className="text-xs text-neon-purple">
                  {/* TODO: Calculate and display actual synergy bonuses */}
                  Synergy bonuses will be calculated based on your stack
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── Continue Button ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-2"
        >
          <Button
            onClick={nextPhase}
            disabled={techStack.length === 0}
            className={cn(
              'group relative px-8 py-3 text-sm font-semibold',
              'bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan',
              'border border-neon-cyan/30 hover:border-neon-cyan/50',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-all duration-300',
            )}
          >
            <span className="flex items-center gap-2">
              Continue
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Button>
        </motion.div>
      </div>

      {/* ── Drag Overlay ─────────────────────────────────────────────────── */}
      <DragOverlay>
        {activeItem ? (
          <div className="glass-card-strong rounded-xl p-3 shadow-xl shadow-neon-blue/20 ring-1 ring-neon-blue/40">
            <TechItemContent item={activeItem} isSelected={selectedIds.has(activeItem.id)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TechStackDnD;

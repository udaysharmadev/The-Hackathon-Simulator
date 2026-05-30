'use client';

/**
 * @file FeaturePriorityDnD — Feature priority sorter with drag-and-drop.
 *
 * Allows the player to reorder a list of features by priority using
 * @dnd-kit/sortable. Dragging items automatically updates their priority
 * number (1, 2, 3…) and persists the order to the Zustand game store.
 *
 * TODO: Add effort/impact scoring that affects build phase outcomes.
 * TODO: Visualise the effort-vs-impact tradeoff as a 2×2 matrix.
 * TODO: Add "auto-sort by impact" and "auto-sort by effort" buttons.
 */

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  GripVertical,
  Lock,
  Shield,
  MessageCircle,
  BarChart3,
  CreditCard,
  Bell,
  Brain,
  Zap,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import type { Feature } from '@/types/game';
import { Button } from '@/components/ui/button';

// ─── Sample Features ────────────────────────────────────────────────────────────

/**
 * Default features used when the store has none.
 * In production these would come from the selected problem statement.
 */
const DEFAULT_FEATURES: Feature[] = [
  {
    id: 'auth',
    name: 'User Authentication',
    description: 'Secure login with OAuth, email/password, and MFA support',
    effort: 'medium',
    impact: 'high',
  },
  {
    id: 'chat',
    name: 'Real-time Chat',
    description: 'WebSocket-powered messaging with typing indicators',
    effort: 'high',
    impact: 'medium',
  },
  {
    id: 'dashboard',
    name: 'Dashboard Analytics',
    description: 'Interactive charts and KPI tracking with real-time updates',
    effort: 'medium',
    impact: 'high',
  },
  {
    id: 'payments',
    name: 'Payment Integration',
    description: 'Stripe-powered checkout with subscription billing',
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Browser and mobile push notifications for key events',
    effort: 'low',
    impact: 'medium',
  },
  {
    id: 'ai-recs',
    name: 'AI Recommendations',
    description: 'ML-powered content and action recommendations',
    effort: 'high',
    impact: 'high',
  },
];

/** Map feature IDs to Lucide icons */
const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  auth: Shield,
  chat: MessageCircle,
  dashboard: BarChart3,
  payments: CreditCard,
  notifications: Bell,
  'ai-recs': Brain,
};

/** Effort level → color mapping */
const EFFORT_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-neon-green/15', text: 'text-neon-green' },
  medium: { bg: 'bg-neon-orange/15', text: 'text-neon-orange' },
  high: { bg: 'bg-neon-pink/15', text: 'text-neon-pink' },
};

/** Impact level → color mapping */
const IMPACT_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-white/10', text: 'text-white/50' },
  medium: { bg: 'bg-neon-blue/15', text: 'text-neon-blue' },
  high: { bg: 'bg-neon-purple/15', text: 'text-neon-purple' },
};

// ─── Sortable Feature Item ──────────────────────────────────────────────────────

interface SortableFeatureProps {
  feature: Feature;
  priority: number;
}

/**
 * A single sortable feature row with a drag handle, name, and effort/impact badges.
 * Uses @dnd-kit's `useSortable` hook for positioning transforms.
 */
function SortableFeatureItem({ feature, priority }: SortableFeatureProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const FeatureIcon = FEATURE_ICONS[feature.id] || Zap;
  const effortStyle = EFFORT_STYLES[feature.effort];
  const impactStyle = IMPACT_STYLES[feature.impact];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'glass-card rounded-xl p-4 transition-shadow duration-200',
        isDragging
          ? 'shadow-lg shadow-neon-blue/20 ring-1 ring-neon-blue/30 z-50 opacity-90'
          : 'shadow-md z-0',
      )}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        {/* ── Drag Handle ──────────────────────────────────────────────── */}
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={cn(
            'flex h-8 w-6 shrink-0 items-center justify-center rounded-md',
            'text-white/30 hover:text-white/60 hover:bg-white/[0.06]',
            'transition-colors cursor-grab active:cursor-grabbing',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan/50',
          )}
          aria-label={`Reorder ${feature.name}`}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* ── Priority Number ──────────────────────────────────────────── */}
        <motion.div
          key={priority}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            'text-xs font-bold tabular-nums',
            priority === 1
              ? 'bg-neon-cyan/20 text-neon-cyan'
              : priority === 2
                ? 'bg-neon-blue/15 text-neon-blue'
                : 'bg-white/10 text-white/50',
          )}
        >
          {priority}
        </motion.div>

        {/* ── Feature Icon ─────────────────────────────────────────────── */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
          <FeatureIcon className="h-4 w-4 text-white/60" />
        </div>

        {/* ── Name + Description ───────────────────────────────────────── */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-medium text-white truncate">
            {feature.name}
          </span>
          <span className="text-xs text-white/40 truncate hidden sm:block">
            {feature.description}
          </span>
        </div>

        {/* ── Effort Badge ─────────────────────────────────────────────── */}
        <div
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            effortStyle.bg,
            effortStyle.text,
          )}
          title={`Effort: ${feature.effort}`}
        >
          {feature.effort}
        </div>

        {/* ── Impact Badge ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0" title={`Impact: ${feature.impact}`}>
          <TrendingUp
            className={cn(
              'h-3 w-3',
              impactStyle.text,
            )}
          />
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider',
              impactStyle.text,
            )}
          >
            {feature.impact}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Card for Overlay ────────────────────────────────────────────────────

/** Non-interactive version of the feature card used in DragOverlay */
function FeatureOverlayCard({ feature }: { feature: Feature }) {
  const FeatureIcon = FEATURE_ICONS[feature.id] || Zap;
  const effortStyle = EFFORT_STYLES[feature.effort];
  const impactStyle = IMPACT_STYLES[feature.impact];

  return (
    <div className="glass-card-strong rounded-xl p-4 shadow-xl shadow-neon-blue/20 ring-1 ring-neon-blue/40">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md text-white/30">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
          <FeatureIcon className="h-4 w-4 text-white/60" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-medium text-white truncate">{feature.name}</span>
        </div>
        <div
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            effortStyle.bg,
            effortStyle.text,
          )}
        >
          {feature.effort}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <TrendingUp className={cn('h-3 w-3', impactStyle.text)} />
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', impactStyle.text)}>
            {feature.impact}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * Feature priority sorter screen.
 *
 * - Renders a sortable list of features that can be reordered via drag-and-drop.
 * - Priority numbers (1, 2, 3…) auto-update based on position.
 * - Connected to Zustand store via `reorderFeatures`.
 * - "Lock Priorities" button advances to the BUILDING phase.
 */
export function FeaturePriorityDnD() {
  const storeFeatures = useGameStore((s) => s.features);
  const reorderFeatures = useGameStore((s) => s.reorderFeatures);
  const nextPhase = useGameStore((s) => s.nextPhase);

  // Use store features if available, otherwise use defaults
  const [features, setFeatures] = useState<Feature[]>(
    storeFeatures.length > 0 ? storeFeatures : DEFAULT_FEATURES,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const featureIds = features.map((f) => f.id);

  // ── DnD Handlers ────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = features.findIndex((f) => f.id === active.id);
      const newIndex = features.findIndex((f) => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(features, oldIndex, newIndex);
      setFeatures(reordered);

      // Persist to store
      reorderFeatures(reordered);
    },
    [features, reorderFeatures],
  );

  /** Lock the priorities and advance to the next phase */
  const handleLockPriorities = useCallback(() => {
    // Ensure the store has the latest order
    reorderFeatures(features);
    nextPhase();
  }, [features, reorderFeatures, nextPhase]);

  const activeFeature = activeId
    ? features.find((f) => f.id === activeId)
    : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-1">
          Prioritize Features
        </h2>
        <p className="text-sm text-white/50">
          Drag to reorder. Top features get built first — choose wisely.
        </p>
      </motion.div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-wider text-white/40"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-green" />
          Low Effort
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-orange" />
          Med Effort
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-pink" />
          High Effort
        </div>
        <div className="mx-1 h-3 w-px bg-white/15" />
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-2.5 w-2.5 text-neon-purple" />
          Impact
        </div>
      </motion.div>

      {/* ── Sortable List ────────────────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={featureIds} strategy={verticalListSortingStrategy}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            {features.map((feature, index) => (
              <SortableFeatureItem
                key={feature.id}
                feature={feature}
                priority={index + 1}
              />
            ))}
          </motion.div>
        </SortableContext>

        {/* ── Drag Overlay ──────────────────────────────────────────────── */}
        <DragOverlay>
          {activeFeature ? (
            <FeatureOverlayCard feature={activeFeature} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Lock Priorities Button ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex justify-center pt-2"
      >
        <Button
          onClick={handleLockPriorities}
          className={cn(
            'group relative px-8 py-3 text-sm font-semibold',
            'bg-neon-green/20 hover:bg-neon-green/30 text-neon-green',
            'border border-neon-green/30 hover:border-neon-green/50',
            'transition-all duration-300',
          )}
        >
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Lock Priorities
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Button>
      </motion.div>
    </div>
  );
}

export default FeaturePriorityDnD;

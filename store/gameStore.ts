/**
 * @fileoverview Zustand store for The Hackathon Simulator game state.
 *
 * Manages the complete lifecycle of a hackathon simulation game including:
 * - Phase progression (LOBBY → PROBLEM_REVEAL → … → RESULTS)
 * - Problem selection, tech-stack building, and feature prioritization
 * - Timer countdown per phase
 * - Score tracking and judge feedback
 * - Game events / activity log
 *
 * @module store/gameStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  GameState,
  GameActions,
  GamePhase,
  Problem,
  TechItem,
  Feature,
} from '@/types/game';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Ordered list of all game phases.
 * The game progresses through these phases sequentially.
 */
const PHASE_ORDER: GamePhase[] = [
  'LOBBY',
  'PROBLEM_REVEAL',
  'TECH_STACK',
  'FEATURE_PRIORITY',
  'BUILDING',
  'JUDGING',
  'RESULTS',
];

/**
 * Duration (in seconds) allocated to each game phase.
 * A duration of `0` means the phase has no countdown timer.
 */
const PHASE_DURATIONS: Record<GamePhase, number> = {
  LOBBY: 0,
  PROBLEM_REVEAL: 60,
  TECH_STACK: 120,
  FEATURE_PRIORITY: 90,
  BUILDING: 300,
  JUDGING: 60,
  RESULTS: 0,
};

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

/**
 * Default / initial state used when the game is first loaded or reset.
 */
const initialState: GameState = {
  phase: 'LOBBY',
  selectedProblem: null,
  techStack: [],
  features: [],
  timeRemaining: 0,
  totalTime: 0,
  score: {
    innovation: 0,
    execution: 0,
    design: 0,
    pitch: 0,
    bonus: 0,
    total: 0,
  },
  currentJudge: null,
  judgeFeedback: [],
  mentorHintsUsed: 0,
  events: [],
  isGameStarted: false,
  isGameOver: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Primary Zustand store for The Hackathon Simulator.
 *
 * Combines {@link GameState} (data) with {@link GameActions} (mutations).
 * Wrapped with the `devtools` middleware so every action is inspectable in the
 * Redux DevTools browser extension.
 *
 * @example
 * ```tsx
 * import { useGameStore } from '@/store/gameStore';
 *
 * function StartButton() {
 *   const startGame = useGameStore((s) => s.startGame);
 *   return <button onClick={startGame}>Start Game</button>;
 * }
 * ```
 */
export const useGameStore = create<GameState & GameActions>()(
  devtools(
    (set, get) => ({
      // ── Spread initial state fields ──────────────────────────────────
      ...initialState,

      // ── Actions ──────────────────────────────────────────────────────

      /**
       * Transition from LOBBY to the first active phase (PROBLEM_REVEAL)
       * and start the countdown timer.
       *
       * TODO: Emit a 'GAME_STARTED' GameEvent for the activity log.
       * TODO: Trigger background music / SFX via an audio manager.
       */
      startGame: () =>
        set(
          {
            ...initialState,
            phase: 'PROBLEM_REVEAL',
            isGameStarted: true,
            timeRemaining: PHASE_DURATIONS.PROBLEM_REVEAL,
            totalTime: PHASE_DURATIONS.PROBLEM_REVEAL,
          },
          false,
          'startGame',
        ),

      /**
       * Advance to the next phase in {@link PHASE_ORDER}.
       * Automatically sets the timer for the incoming phase.
       * No-op if the game is already on the last phase (RESULTS).
       *
       * TODO: Validate that required data is present before advancing
       *       (e.g., problem must be selected before leaving PROBLEM_REVEAL).
       * TODO: Award phase-completion bonuses or trigger random GameEvents.
       */
      nextPhase: () => {
        const { phase } = get();
        const currentIndex = PHASE_ORDER.indexOf(phase);

        if (currentIndex < PHASE_ORDER.length - 1) {
          const nextPhase = PHASE_ORDER[currentIndex + 1];
          const duration = PHASE_DURATIONS[nextPhase];

          set(
            {
              phase: nextPhase,
              timeRemaining: duration,
              totalTime: duration,
            },
            false,
            'nextPhase',
          );
        }
      },

      /**
       * Set the currently selected hackathon problem.
       *
       * @param problem - The {@link Problem} chosen by the player.
       *
       * TODO: Generate AI-powered problem description variants.
       */
      selectProblem: (problem: Problem) =>
        set({ selectedProblem: problem }, false, 'selectProblem'),

      /**
       * Add a technology to the player's tech stack.
       *
       * @param item - The {@link TechItem} to add.
       *
       * TODO: Enforce max tech-stack size / budget constraints.
       * TODO: Apply synergy bonuses when complementary items are selected.
       */
      addTechItem: (item: TechItem) =>
        set(
          (state) => ({
            techStack: [...state.techStack, item],
          }),
          false,
          'addTechItem',
        ),

      /**
       * Remove a technology from the player's tech stack by its ID.
       *
       * @param itemId - Unique identifier of the {@link TechItem} to remove.
       *
       * TODO: Recalculate synergy bonuses after removal.
       */
      removeTechItem: (itemId: string) =>
        set(
          (state) => ({
            techStack: state.techStack.filter((t) => t.id !== itemId),
          }),
          false,
          'removeTechItem',
        ),

      /**
       * Replace the entire features list (used after drag-and-drop reorder).
       *
       * @param features - The reordered array of {@link Feature} items.
       *
       * TODO: Recalculate estimated completion % based on new priority order.
       */
      reorderFeatures: (features: Feature[]) =>
        set({ features }, false, 'reorderFeatures'),

      /**
       * Decrement the phase timer by one second.
       * Clamps to a minimum of `0` — it will never go negative.
       *
       * Should be called once per second by an external `setInterval`.
       *
       * TODO: Auto-advance to the next phase when timeRemaining hits 0.
       * TODO: Trigger "time is running out!" event at configurable thresholds.
       */
      tickTimer: () =>
        set(
          (state) => ({
            timeRemaining: Math.max(0, state.timeRemaining - 1),
          }),
          false,
          'tickTimer',
        ),

      /**
       * Manually override the remaining time for the current phase.
       *
       * @param time - New time remaining in seconds.
       *
       * Useful for mentor hints that grant bonus time or for debugging.
       */
      setTimeRemaining: (time: number) =>
        set({ timeRemaining: time }, false, 'setTimeRemaining'),

      /**
       * End the game and jump straight to the RESULTS phase.
       *
       * TODO: Calculate final {@link ScoreBreakdown} based on problem fit,
       *       tech-stack choices, feature completion, and judge evaluations.
       * TODO: Persist high scores to local storage or a backend leaderboard.
       * TODO: Generate AI judge feedback (JudgeFeedback[]).
       */
      endGame: () =>
        set({ isGameOver: true, phase: 'RESULTS' }, false, 'endGame'),

      /**
       * Reset the entire store back to {@link initialState}.
       * Called when the player chooses to play again.
       *
       * TODO: Optionally archive the previous run's data for history view.
       */
      resetGame: () => set(initialState, false, 'resetGame'),
    }),
    { name: 'HackathonSimulator' },
  ),
);

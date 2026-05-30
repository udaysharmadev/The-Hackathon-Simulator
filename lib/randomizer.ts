/**
 * @file Randomizer utilities for The Hackathon Simulator
 * @description Helper functions for introducing controlled randomness into
 * the game — from shuffling arrays to rolling for random events.
 */

import type { GameEvent, GamePhase } from '@/types/game';

// ─── Core Random Utilities (Fully Implemented) ─────────────────────────────────

/**
 * Pick a single random element from an array.
 *
 * @template T - Type of array elements
 * @param arr - Non-empty array to pick from
 * @returns A randomly selected element
 * @throws {Error} If the array is empty
 *
 * @example
 * ```ts
 * const winner = pickRandom(['Alice', 'Bob', 'Charlie']);
 * ```
 */
export function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('Cannot pick from an empty array');
  }
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

/**
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * Returns a new shuffled array — the original is not mutated.
 *
 * @template T - Type of array elements
 * @param arr - Array to shuffle
 * @returns A new array with elements in random order
 *
 * @example
 * ```ts
 * const deck = shuffle([1, 2, 3, 4, 5]);
 * ```
 */
export function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ─── Game-Specific Random Functions (Stubbed) ───────────────────────────────────

/**
 * Determine whether a random event should trigger during the current phase.
 *
 * @param phase - The current game phase
 * @returns `true` if an event should fire, `false` otherwise
 *
 * TODO: Implement phase-aware probability curves:
 *   - BUILDING phase: highest event frequency (~30% per tick)
 *   - TECH_STACK / FEATURE_PRIORITY: moderate (~15%)
 *   - LOBBY / RESULTS: no random events
 *   - Scale probability based on how many events have already occurred
 *     (diminishing returns to prevent event spam)
 */
export function generateEventChance(phase: GamePhase): boolean {
  // Placeholder: 20% flat chance, no events in non-active phases
  const inactivePhases: GamePhase[] = ['LOBBY', 'RESULTS'];
  if (inactivePhases.includes(phase)) return false;

  return Math.random() < 0.2;
}

/**
 * Roll to determine whether a mentor appears with a hint.
 *
 * @returns `true` if a mentor hint should be shown
 *
 * TODO: Implement smart mentor logic:
 *   - Base probability: ~25% per phase transition
 *   - Increase probability if the player is struggling (low score trajectory)
 *   - Decrease if the player has already used many hints (diminishing returns)
 *   - Never show more than 2 hints in a single phase
 */
export function rollForMentor(): boolean {
  // Placeholder: flat 25% chance
  return Math.random() < 0.25;
}

/**
 * Generate a random game event with narrative flavor.
 *
 * @returns A randomly selected GameEvent
 *
 * TODO: Implement a proper event pool system:
 *   - Maintain separate pools for positive, negative, and neutral events
 *   - Weight selection toward neutral events (~50%), then positive (~30%), negative (~20%)
 *   - Track which events have already fired to avoid repeats
 *   - Some events should have prerequisites (e.g., "server crash" only if using backend tech)
 *   - Apply the event's `effect` to the actual game state
 */
export function getRandomEvent(): GameEvent {
  // Placeholder: return from a small inline pool
  const events: GameEvent[] = [
    {
      id: 'evt-coffee',
      type: 'positive',
      title: 'Coffee Boost! ☕',
      description:
        'A volunteer drops off fresh espresso at your table. You feel energized and focused.',
      effect: '+5 minutes to the clock',
    },
    {
      id: 'evt-wifi',
      type: 'negative',
      title: 'Wi-Fi Dropout 📡',
      description:
        'The venue Wi-Fi goes down for a few minutes. Your npm install is stuck.',
      effect: '-3 minutes from the clock',
    },
    {
      id: 'evt-mentor-visit',
      type: 'positive',
      title: 'Mentor Drop-In 🧑‍🏫',
      description:
        'A senior engineer stops by and gives you a quick architecture tip.',
      effect: '+10 to execution score',
    },
    {
      id: 'evt-scope-creep',
      type: 'negative',
      title: 'Scope Creep 🐛',
      description:
        'You realize your MVP has ballooned. Time to cut features or pay the price.',
      effect: '-1 feature slot',
    },
    {
      id: 'evt-pizza',
      type: 'neutral',
      title: 'Pizza Time! 🍕',
      description:
        'Pizza arrives for everyone. You take a well-deserved break.',
      effect: 'No mechanical effect — just vibes',
    },
    {
      id: 'evt-sponsor-api',
      type: 'positive',
      title: 'Sponsor API Access 🔑',
      description:
        'A sponsor gives your team early access to their premium API. New possibilities open up.',
      effect: '+15 to innovation score',
    },
    {
      id: 'evt-merge-conflict',
      type: 'negative',
      title: 'Merge Conflict Nightmare 😱',
      description:
        'A gnarly merge conflict eats into your build time. Git blame is pointing at you.',
      effect: '-5 minutes from the clock',
    },
  ];

  return pickRandom(events);
}

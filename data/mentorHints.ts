/**
 * @file Mentor hint data
 * @description A pool of mentor hints that can appear during each game phase.
 * Hints vary in helpfulness and category, providing guidance on
 * technical decisions, design choices, strategy, and motivation.
 */

import type { MentorHint } from '@/types/game';

/** All available mentor hints, organized across game phases */
export const MENTOR_HINTS: MentorHint[] = [
  // ── LOBBY phase ───────────────────────────────────────────────────────────
  {
    id: 'hint-lobby-1',
    phase: 'LOBBY',
    message:
      'Welcome to the hackathon! Remember — it\'s not about building the most features, it\'s about solving a real problem well.',
    helpfulness: 'medium',
    category: 'strategy',
  },

  // ── PROBLEM_REVEAL phase ──────────────────────────────────────────────────
  {
    id: 'hint-problem-1',
    phase: 'PROBLEM_REVEAL',
    message:
      'Pick a problem you\'re genuinely excited about. Passion shows in the demo and judges notice.',
    helpfulness: 'high',
    category: 'strategy',
  },
  {
    id: 'hint-problem-2',
    phase: 'PROBLEM_REVEAL',
    message:
      'Read the constraints carefully — the best hacks lean into limitations rather than fighting them.',
    helpfulness: 'high',
    category: 'strategy',
  },

  // ── TECH_STACK phase ──────────────────────────────────────────────────────
  {
    id: 'hint-tech-1',
    phase: 'TECH_STACK',
    message:
      'Choose technologies you already know. A hackathon is not the time to learn a new framework from scratch.',
    helpfulness: 'high',
    category: 'technical',
  },
  {
    id: 'hint-tech-2',
    phase: 'TECH_STACK',
    message:
      'Look for synergies in your stack — tools that integrate well together will save you hours of glue code.',
    helpfulness: 'medium',
    category: 'technical',
  },
  {
    id: 'hint-tech-3',
    phase: 'TECH_STACK',
    message:
      'Don\'t over-engineer. A monolith that works beats a microservices architecture that\'s half-finished.',
    helpfulness: 'medium',
    category: 'technical',
  },

  // ── FEATURE_PRIORITY phase ────────────────────────────────────────────────
  {
    id: 'hint-feature-1',
    phase: 'FEATURE_PRIORITY',
    message:
      'Prioritize high-impact, low-effort features first. Judges want to see a polished core, not a pile of half-built features.',
    helpfulness: 'high',
    category: 'strategy',
  },
  {
    id: 'hint-feature-2',
    phase: 'FEATURE_PRIORITY',
    message:
      'Think about the "wow moment" in your demo. Build toward that one feature that makes the audience lean forward.',
    helpfulness: 'medium',
    category: 'design',
  },

  // ── BUILDING phase ────────────────────────────────────────────────────────
  {
    id: 'hint-build-1',
    phase: 'BUILDING',
    message:
      'Ship ugly, then polish. Get your core flow working end-to-end before touching CSS.',
    helpfulness: 'high',
    category: 'strategy',
  },
  {
    id: 'hint-build-2',
    phase: 'BUILDING',
    message:
      'You\'re halfway through! Take a 2-minute stretch break — your brain will thank you.',
    helpfulness: 'low',
    category: 'motivation',
  },
  {
    id: 'hint-build-3',
    phase: 'BUILDING',
    message:
      'If something has been broken for more than 15 minutes, cut it and move on. Scope is your enemy.',
    helpfulness: 'high',
    category: 'strategy',
  },

  // ── JUDGING phase ─────────────────────────────────────────────────────────
  {
    id: 'hint-judging-1',
    phase: 'JUDGING',
    message:
      'Lead with the problem, not the tech. Judges want to know WHY before HOW.',
    helpfulness: 'high',
    category: 'strategy',
  },
  {
    id: 'hint-judging-2',
    phase: 'JUDGING',
    message:
      'Make eye contact with the judges (metaphorically). Confidence sells — even if your code is held together with duct tape.',
    helpfulness: 'medium',
    category: 'motivation',
  },

  // ── RESULTS phase ─────────────────────────────────────────────────────────
  {
    id: 'hint-results-1',
    phase: 'RESULTS',
    message:
      'Win or lose, you just built something in a few hours that most people couldn\'t build in weeks. Be proud.',
    helpfulness: 'low',
    category: 'motivation',
  },
];

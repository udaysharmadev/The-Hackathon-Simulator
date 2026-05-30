/**
 * @file Scoring engine for The Hackathon Simulator
 * @description Calculates scores, generates judge feedback, and evaluates
 * tech synergies and time bonuses. Currently uses placeholder logic
 * with TODO markers for full gameplay implementation.
 */

import type {
  GameState,
  Judge,
  JudgeFeedback,
  ScoreBreakdown,
  TechItem,
} from '@/types/game';

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Maximum score for any single category */
const MAX_CATEGORY_SCORE = 100;

/** Base score awarded before modifiers */
const BASE_SCORE = 50;

// ─── Score Calculation ──────────────────────────────────────────────────────────

/**
 * Calculate the full score breakdown based on the current game state.
 *
 * @param state - The current game state to evaluate
 * @returns A complete ScoreBreakdown with all categories and total
 *
 * TODO: Implement real scoring logic:
 *   - Innovation: weight by problem difficulty, tech novelty, and bonus objectives completed
 *   - Execution: evaluate feature completion rate, tech stack coherence, time management
 *   - Design: factor in feature impact scores and UI-related tech choices
 *   - Pitch: scale by judge personality match and presentation quality events
 *   - Bonus: sum bonus objectives met, synergy multipliers, and event bonuses
 */
export function calculateScore(state: GameState): ScoreBreakdown {
  // Placeholder: generate reasonable scores based on number of choices made
  const techCount = state.techStack.length;
  const featureCount = state.features.length;
  const hasBonus = state.events.some((e) => e.type === 'positive');

  const innovation = Math.min(
    MAX_CATEGORY_SCORE,
    BASE_SCORE + techCount * 5 + featureCount * 3
  );
  const execution = Math.min(
    MAX_CATEGORY_SCORE,
    BASE_SCORE + featureCount * 6
  );
  const design = Math.min(
    MAX_CATEGORY_SCORE,
    BASE_SCORE + featureCount * 4
  );
  const pitch = Math.min(MAX_CATEGORY_SCORE, BASE_SCORE + techCount * 3);
  const bonus = hasBonus ? 10 : 0;
  const total = innovation + execution + design + pitch + bonus;

  return { innovation, execution, design, pitch, bonus, total };
}

// ─── Judge Feedback ─────────────────────────────────────────────────────────────

/**
 * Generate feedback from a specific judge based on the score breakdown.
 *
 * @param judge - The judge providing feedback
 * @param score - The evaluated score breakdown
 * @returns Personalized JudgeFeedback with score, comment, and highlight
 *
 * TODO: Implement personality-driven feedback generation:
 *   - 'tough': critical comments focusing on weaknesses, lower score variance
 *   - 'encouraging': uplifting language, highlights strengths even in low scores
 *   - 'technical': deep-dive on execution/architecture, ignores design fluff
 *   - 'creative': focuses on novelty and storytelling, rewards bold ideas
 *   - Apply scoringWeights to compute the judge's personal weighted score
 *   - Pull from a comment template pool based on score ranges
 */
export function getJudgeFeedback(
  judge: Judge,
  score: ScoreBreakdown
): JudgeFeedback {
  // Placeholder: weighted score using judge's preferences
  const weightedScore = Math.round(
    score.innovation * judge.scoringWeights.innovation +
      score.execution * judge.scoringWeights.execution +
      score.design * judge.scoringWeights.design +
      score.pitch * judge.scoringWeights.pitch +
      score.bonus
  );

  // Placeholder comments by personality
  const comments: Record<string, string> = {
    tough: 'Interesting concept, but I need to see stronger execution and clearer market fit.',
    encouraging:
      'Great energy and a thoughtful approach! I love the direction this is heading.',
    technical:
      'The architecture choices are reasonable. I\'d like to see more depth in the implementation.',
    creative:
      'Bold vision! The storytelling around this idea really pulls you in.',
  };

  const highlights: Record<string, string> = {
    tough: 'The problem framing was sharp.',
    encouraging: 'The team\'s enthusiasm really shines through.',
    technical: 'Solid technical foundation with room to scale.',
    creative: 'A genuinely original take on the problem space.',
  };

  return {
    judgeId: judge.id,
    score: weightedScore,
    comment: comments[judge.personality] ?? 'Solid work overall.',
    highlight: highlights[judge.personality] ?? 'Nice effort.',
  };
}

// ─── Tech Synergy ───────────────────────────────────────────────────────────────

/**
 * Calculate a synergy multiplier based on how well the chosen technologies
 * complement each other.
 *
 * @param techStack - The player's selected technologies
 * @returns A synergy score (0-1 normalized, where 1 = perfect synergy)
 *
 * TODO: Implement real synergy logic:
 *   - For each tech item, check how many of its `synergies` are present in the stack
 *   - Award partial credit for partial matches
 *   - Penalize conflicting/redundant choices (e.g., two ORMs)
 *   - Consider category coverage: bonus for having at least one from each category
 */
export function calculateTechSynergy(techStack: TechItem[]): number {
  if (techStack.length === 0) return 0;

  // Placeholder: simple ratio of fulfilled synergy links
  const techIds = new Set(techStack.map((t) => t.id));
  let fulfilledSynergies = 0;
  let totalSynergies = 0;

  for (const tech of techStack) {
    totalSynergies += tech.synergies.length;
    fulfilledSynergies += tech.synergies.filter((s) => techIds.has(s)).length;
  }

  if (totalSynergies === 0) return 0.5; // no synergy data = neutral

  return fulfilledSynergies / totalSynergies;
}

// ─── Time Bonus ─────────────────────────────────────────────────────────────────

/**
 * Calculate bonus points awarded for finishing with time to spare.
 *
 * @param timeRemaining - Seconds left on the clock
 * @param totalTime - Total seconds that were allocated
 * @returns A bonus score (0-20 range)
 *
 * TODO: Implement real time bonus curve:
 *   - Award more points for significant time remaining (e.g., > 25% left)
 *   - Diminishing returns — finishing with 90% time left is suspicious, not impressive
 *   - Factor in difficulty: harder problems should grant higher bonuses for finishing early
 *   - Possibly penalize if zero time remaining (rushed submission)
 */
export function calculateTimeBonus(
  timeRemaining: number,
  totalTime: number
): number {
  if (totalTime <= 0) return 0;

  const ratio = timeRemaining / totalTime;

  // Placeholder: linear bonus up to 20 points, capped at 50% time remaining
  const effectiveRatio = Math.min(ratio, 0.5);
  return Math.round(effectiveRatio * 40); // 0-20 range
}

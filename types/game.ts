/**
 * @file Core type definitions for The Hackathon Simulator
 * @description Defines all TypeScript interfaces and types used throughout the game,
 * including game phases, entities (problems, judges, tech items, features),
 * scoring structures, events, and the central game state.
 */

// ─── Game Phases ────────────────────────────────────────────────────────────────

/** All possible phases of the hackathon simulation */
export type GamePhase =
  | 'LOBBY'
  | 'PROBLEM_REVEAL'
  | 'TECH_STACK'
  | 'FEATURE_PRIORITY'
  | 'BUILDING'
  | 'JUDGING'
  | 'RESULTS';

/** All possible stages of the hackathon simulation conditional engine */
export type GameStage =
  | 'difficulty'
  | 'problemReveal'
  | 'solutionDirection'
  | 'techStack'
  | 'usp'
  | 'features'
  | 'mentor'
  | 'businessModel'
  | 'pitchPrep'
  | 'judgeSpin'
  | 'judging'
  | 'results';

// ─── Core Entities ──────────────────────────────────────────────────────────────

/** A hackathon problem statement that teams must solve */
export interface Problem {
  /** Unique identifier for the problem */
  id: string;
  /** Short title of the problem */
  title: string;
  /** Detailed description of the challenge */
  description: string;
  /** Domain category the problem belongs to */
  category: 'fintech' | 'healthtech' | 'edtech' | 'sustainability' | 'social-impact';
  /** Difficulty tier affecting scoring and complexity */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Hard constraints the solution must respect */
  constraints: string[];
  /** Optional stretch goals for bonus points */
  bonusObjectives: string[];
}

/** A hackathon judge who evaluates the final project */
export interface Judge {
  /** Unique identifier for the judge */
  id: string;
  /** Display name */
  name: string;
  /** Emoji avatar for the judge */
  avatar: string;
  /** Professional title */
  title: string;
  /** Areas of expertise */
  expertise: string[];
  /** Personality archetype that influences feedback tone */
  personality: 'tough' | 'encouraging' | 'technical' | 'creative';
  /** How this judge weights each scoring category (should sum to ~1.0) */
  scoringWeights: {
    innovation: number;
    execution: number;
    design: number;
    pitch: number;
  };
}

/** A hint from a mentor that can help the player during a specific phase */
export interface MentorHint {
  /** Unique identifier for the hint */
  id: string;
  /** Which game phase this hint is relevant to */
  phase: GamePhase;
  /** The hint message displayed to the player */
  message: string;
  /** How useful this hint is (affects scoring/strategy) */
  helpfulness: 'low' | 'medium' | 'high';
  /** What aspect of the hackathon this hint addresses */
  category: 'technical' | 'design' | 'strategy' | 'motivation';
}

/** A technology that can be added to the project's tech stack */
export interface TechItem {
  /** Unique identifier for the tech */
  id: string;
  /** Display name (e.g. "React", "PostgreSQL") */
  name: string;
  /** Lucide icon name for visual representation */
  icon: string;
  /** Technology layer/category */
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'ai';
  /** Complexity rating from 1 (easy) to 5 (expert) */
  difficulty: number;
  /** IDs of other TechItems that create positive synergy when combined */
  synergies: string[];
}

/** A product feature that can be built during the hackathon */
export interface Feature {
  /** Unique identifier for the feature */
  id: string;
  /** Short name of the feature */
  name: string;
  /** What this feature does */
  description: string;
  /** How much time/energy this feature takes to build */
  effort: 'low' | 'medium' | 'high';
  /** How much value this feature adds to the project */
  impact: 'low' | 'medium' | 'high';
  /** IDs of TechItems required to build this feature */
  requiredTech?: string[];
}

// ─── Scoring ────────────────────────────────────────────────────────────────────

/** Breakdown of scores across all judging categories */
export interface ScoreBreakdown {
  /** How novel and creative the solution is (0-100) */
  innovation: number;
  /** Quality of implementation and completeness (0-100) */
  execution: number;
  /** UI/UX quality and visual polish (0-100) */
  design: number;
  /** Quality of the demo presentation (0-100) */
  pitch: number;
  /** Extra points from bonus objectives and synergies */
  bonus: number;
  /** Aggregate total score */
  total: number;
}

/** Feedback from a single judge after evaluation */
export interface JudgeFeedback {
  /** ID of the judge providing feedback */
  judgeId: string;
  /** Numeric score from this judge */
  score: number;
  /** Written feedback comment */
  comment: string;
  /** One standout positive aspect the judge noticed */
  highlight: string;
}

// ─── Events ─────────────────────────────────────────────────────────────────────

/** A random event that occurs during the hackathon */
export interface GameEvent {
  /** Unique identifier for the event */
  id: string;
  /** Whether this event helps, hurts, or is neutral */
  type: 'positive' | 'negative' | 'neutral';
  /** Short event headline */
  title: string;
  /** Narrative description of what happened */
  description: string;
  /** Mechanical effect on the game state */
  effect: string;
}

// ─── Game State & Actions ───────────────────────────────────────────────────────

/** The complete state of a hackathon simulation run */
export interface GameState {
  /** Current stage of the game */
  stage: GameStage;
  /** Current phase of the game (legacy, kept for compatibility) */
  phase: GamePhase;
  /** Selected game difficulty */
  difficulty: 'easy' | 'medium' | 'hard' | 'dev' | null;
  /** The problem the player chose to solve, or null if not yet selected */
  selectedProblem: Problem | null;
  /** Solution direction chosen for the project */
  solutionDirection: string | null;
  /** Technologies chosen for the project */
  techStack: TechItem[];
  /** Unique Selling Proposition selected */
  usp: string | null;
  /** Features selected and prioritized for building */
  features: Feature[];
  /** Chosen mentor name */
  mentorName: string | null;
  /** Chosen business model */
  businessModel: string | null;
  /** Written elevator pitch text */
  pitchText: string;
  
  /** Seconds remaining in the current timed phase (legacy) */
  timeRemaining: number;
  /** Total seconds allocated for the current timed phase (legacy) */
  totalTime: number;

  /** Seconds remaining on the global game clock */
  globalTimeRemaining: number;
  /** Total seconds allocated for the game based on difficulty */
  globalTotalTime: number;
  /** Whether the global timer is currently paused */
  isTimerPaused: boolean;

  /** Current score breakdown */
  score: ScoreBreakdown;
  
  /** The judge currently evaluating, or null */
  currentJudge: Judge | null;
  /** Accumulated feedback from all judges */
  judgeFeedback: JudgeFeedback[];
  /** Current state of the judge spin wheel */
  judgeSpinState: 'idle' | 'spinning' | 'done';

  /** Number of mentor hints the player has consumed */
  mentorHintsUsed: number;
  /** Random events that have occurred this run */
  events: GameEvent[];
  /** Whether the game has been started */
  isGameStarted: boolean;
  /** Whether the game has ended */
  isGameOver: boolean;
}

/** Actions the player (or system) can dispatch to mutate game state */
export interface GameActions {
  /** Begin a new hackathon run */
  startGame: () => void;
  /** Set chosen difficulty and initialize timer */
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard' | 'dev') => void;
  
  /** Advance to the next game stage */
  nextStage: () => void;
  /** Advance to the next game phase (legacy) */
  nextPhase: () => void;
  /** Retreat to the previous game stage */
  previousStage: () => void;
  /** Jump directly to a specific game stage */
  jumpToStage: (stage: GameStage) => void;

  /** Choose a problem to solve */
  selectProblem: (problem: Problem) => void;
  /** Choose a solution direction */
  setSolutionDirection: (direction: string) => void;
  /** Add a technology to the tech stack */
  addTechItem: (item: TechItem) => void;
  /** Remove a technology from the tech stack by ID */
  removeTechItem: (itemId: string) => void;
  /** Set unique selling proposition */
  setUsp: (usp: string) => void;
  /** Reorder the feature priority list */
  reorderFeatures: (features: Feature[]) => void;
  /** Choose a mentor */
  setMentorName: (name: string) => void;
  /** Choose a business model */
  setBusinessModel: (model: string) => void;
  /** Set elevator pitch text */
  setPitchText: (text: string) => void;

  /** Decrement the global timer by one second */
  tickTimer: () => void;
  /** Pause the global timer */
  pauseTimer: () => void;
  /** Resume the global timer */
  resumeTimer: () => void;
  /** Manually set the remaining global time */
  setTimeRemaining: (time: number) => void;

  /** Update score categories */
  updateScore: (category: keyof Omit<ScoreBreakdown, 'total'>, value: number) => void;
  
  /** Set evaluation state */
  setCurrentJudge: (judge: Judge | null) => void;
  /** Add feedback from a judge */
  addJudgeFeedback: (feedback: JudgeFeedback) => void;
  /** Set judge spin state */
  setJudgeSpinState: (state: 'idle' | 'spinning' | 'done') => void;

  /** End the current game */
  endGame: () => void;
  /** Reset all state for a fresh run */
  resetGame: () => void;
}

/**
 * @fileoverview Zustand store for The Hackathon Simulator game state.
 *
 * Implements exactly 5 logical slices composed into a single unified store:
 * 1. coreSlice: Stage state machine, difficulty setting, drag-drop arrays, and navigation.
 * 2. timerSlice: Unified global countdown ticking, dynamically loaded difficulty seconds, pause/resume.
 * 3. scoringSlice: Categories and calculated total score tracking.
 * 4. mentorSlice: Count of warnings/hints utilized.
 * 5. judgingSlice: Active judge evaluation status, feedback logs, spin wheel states.
 *
 * Fully integrated with devtools for debugging and persist middleware for crash resilience.
 *
 * @module store/gameStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  GameState,
  GameActions,
  GameStage,
  GamePhase,
  Problem,
  TechItem,
  Feature,
  Judge,
  JudgeFeedback,
  ScoreBreakdown,
} from '@/types/game';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Stage order sequence for the simulator.
 */
export const STAGE_ORDER: GameStage[] = [
  'difficulty',
  'problemReveal',
  'solutionDirection',
  'techStack',
  'usp',
  'features',
  'mentor',
  'businessModel',
  'pitchPrep',
  'judgeSpin',
  'judging',
  'results',
];

/**
 * Seconds allocated for each difficulty level.
 */
export const DIFFICULTY_TIMERS = {
  easy: 10 * 60,   // 10 minutes (600s)
  medium: 7 * 60,  // 7 minutes (420s)
  hard: 5 * 60,   // 5 minutes (300s)
  dev: 60,         // 60 seconds (quick debugging)
};

/**
 * Legacy phase mapping for backwards compatibility with unchanged layout components.
 */
const mapStageToPhase = (stage: GameStage): GamePhase => {
  switch (stage) {
    case 'difficulty':
    case 'problemReveal':
      return 'PROBLEM_REVEAL';
    case 'solutionDirection':
    case 'techStack':
      return 'TECH_STACK';
    case 'usp':
    case 'features':
      return 'FEATURE_PRIORITY';
    case 'mentor':
    case 'businessModel':
    case 'pitchPrep':
      return 'BUILDING';
    case 'judgeSpin':
    case 'judging':
      return 'JUDGING';
    case 'results':
      return 'RESULTS';
    default:
      return 'LOBBY';
  }
};

const initialScore: ScoreBreakdown = {
  innovation: 0,
  execution: 0,
  design: 0,
  pitch: 0,
  bonus: 0,
  total: 0,
};

// ---------------------------------------------------------------------------
// Composed Initial State
// ---------------------------------------------------------------------------

const initialGameState = {
  stage: 'difficulty' as GameStage,
  phase: 'PROBLEM_REVEAL' as GamePhase,
  difficulty: null as 'easy' | 'medium' | 'hard' | 'dev' | null,
  selectedProblem: null as Problem | null,
  solutionDirection: null as string | null,
  techStack: [] as TechItem[],
  usp: null as string | null,
  features: [] as Feature[],
  mentorName: null as string | null,
  businessModel: null as string | null,
  pitchText: '',
  
  // Legacy countdown support
  timeRemaining: 0,
  totalTime: 0,

  // Sprint 2 Global Timer System
  globalTimeRemaining: 0,
  globalTotalTime: 0,
  isTimerPaused: true,

  // Scores & Analytics
  score: initialScore,
  
  // Evaluation
  currentJudge: null as Judge | null,
  judgeFeedback: [] as JudgeFeedback[],
  judgeSpinState: 'idle' as 'idle' | 'spinning' | 'done',

  // Mentors & events logs
  mentorHintsUsed: 0,
  events: [],
  isGameStarted: false,
  isGameOver: false,
};

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialGameState,

        // ─── coreSlice Actions ───
        
        startGame: () =>
          set(
            {
              ...initialGameState,
              isGameStarted: true,
              stage: 'difficulty',
              phase: mapStageToPhase('difficulty'),
            },
            false,
            'core/startGame'
          ),

        setDifficulty: (difficulty) => {
          const seconds = DIFFICULTY_TIMERS[difficulty];
          set(
            {
              difficulty,
              globalTotalTime: seconds,
              globalTimeRemaining: seconds,
              timeRemaining: seconds, // Legacy support
              totalTime: seconds,     // Legacy support
              isTimerPaused: false,
              stage: 'problemReveal',
              phase: mapStageToPhase('problemReveal'),
            },
            false,
            'core/setDifficulty'
          );
        },

        nextStage: () => {
          const { stage } = get();
          const currentIndex = STAGE_ORDER.indexOf(stage);
          if (currentIndex < STAGE_ORDER.length - 1) {
            const next = STAGE_ORDER[currentIndex + 1];
            set(
              {
                stage: next,
                phase: mapStageToPhase(next),
                isGameOver: next === 'results',
                isTimerPaused: next === 'results' ? true : get().isTimerPaused,
              },
              false,
              'core/nextStage'
            );
          }
        },

        nextPhase: () => {
          get().nextStage();
        },

        previousStage: () => {
          const { stage } = get();
          const currentIndex = STAGE_ORDER.indexOf(stage);
          if (currentIndex > 0) {
            const prev = STAGE_ORDER[currentIndex - 1];
            set(
              {
                stage: prev,
                phase: mapStageToPhase(prev),
              },
              false,
              'core/previousStage'
            );
          }
        },

        jumpToStage: (targetStage) => {
          set(
            {
              stage: targetStage,
              phase: mapStageToPhase(targetStage),
              isGameOver: targetStage === 'results',
              isTimerPaused: targetStage === 'results' ? true : get().isTimerPaused,
            },
            false,
            'core/jumpToStage'
          );
        },

        selectProblem: (problem) =>
          set({ selectedProblem: problem }, false, 'core/selectProblem'),

        setSolutionDirection: (direction) =>
          set({ solutionDirection: direction }, false, 'core/setSolutionDirection'),

        addTechItem: (item) =>
          set(
            (state) => ({
              techStack: [...state.techStack, item],
            }),
            false,
            'core/addTechItem'
          ),

        removeTechItem: (itemId) =>
          set(
            (state) => ({
              techStack: state.techStack.filter((t) => t.id !== itemId),
            }),
            false,
            'core/removeTechItem'
          ),

        setUsp: (usp) => set({ usp }, false, 'core/setUsp'),

        reorderFeatures: (features) => set({ features }, false, 'core/reorderFeatures'),

        setMentorName: (name) => set({ mentorName: name }, false, 'core/setMentorName'),

        setBusinessModel: (model) => set({ businessModel: model }, false, 'core/setBusinessModel'),

        setPitchText: (text) => set({ pitchText: text }, false, 'core/setPitchText'),

        resetGame: () =>
          set(
            {
              ...initialGameState,
            },
            false,
            'core/resetGame'
          ),

        // ─── timerSlice Actions ───

        tickTimer: () => {
          const { globalTimeRemaining, isTimerPaused, isGameOver, isGameStarted } = get();
          if (isTimerPaused || isGameOver || !isGameStarted) return;

          if (globalTimeRemaining <= 1) {
            // Time expired -> trigger results phase automatically
            set(
              {
                globalTimeRemaining: 0,
                timeRemaining: 0,
                isTimerPaused: true,
                isGameOver: true,
                stage: 'results',
                phase: mapStageToPhase('results'),
              },
              false,
              'timer/timeExpired'
            );
          } else {
            const nextTime = globalTimeRemaining - 1;
            set(
              {
                globalTimeRemaining: nextTime,
                timeRemaining: nextTime,
              },
              false,
              'timer/tick'
            );
          }
        },

        pauseTimer: () => set({ isTimerPaused: true }, false, 'timer/pause'),

        resumeTimer: () => set({ isTimerPaused: false }, false, 'timer/resume'),

        setTimeRemaining: (time) =>
          set(
            {
              globalTimeRemaining: time,
              timeRemaining: time,
            },
            false,
            'timer/setTimeRemaining'
          ),

        // ─── scoringSlice Actions ───

        updateScore: (category, value) =>
          set(
            (state) => {
              const nextScore = {
                ...state.score,
                [category]: value,
              };
              const total =
                nextScore.innovation +
                nextScore.execution +
                nextScore.design +
                nextScore.pitch +
                nextScore.bonus;

              return {
                score: {
                  ...nextScore,
                  total,
                },
              };
            },
            false,
            'scoring/updateScore'
          ),

        // ─── judgingSlice Actions ───

        setCurrentJudge: (judge) => set({ currentJudge: judge }, false, 'judging/setCurrentJudge'),

        addJudgeFeedback: (feedback) =>
          set(
            (state) => ({
              judgeFeedback: [...state.judgeFeedback, feedback],
            }),
            false,
            'judging/addJudgeFeedback'
          ),

        setJudgeSpinState: (spinState) =>
          set({ judgeSpinState: spinState }, false, 'judging/setJudgeSpinState'),

        // ─── Core Game Terminate ───

        endGame: () =>
          set(
            {
              isGameOver: true,
              stage: 'results',
              phase: mapStageToPhase('results'),
              isTimerPaused: true,
            },
            false,
            'core/endGame'
          ),
      }),
      {
        name: 'hackathon-simulator-sprint2-persist',
        partialize: (state) => ({
          difficulty: state.difficulty,
          stage: state.stage,
          selectedProblem: state.selectedProblem,
          solutionDirection: state.solutionDirection,
          techStack: state.techStack,
          usp: state.usp,
          features: state.features,
          mentorName: state.mentorName,
          businessModel: state.businessModel,
          pitchText: state.pitchText,
          globalTimeRemaining: state.globalTimeRemaining,
          globalTotalTime: state.globalTotalTime,
          isTimerPaused: state.isTimerPaused,
          score: state.score,
          judgeFeedback: state.judgeFeedback,
          isGameStarted: state.isGameStarted,
          isGameOver: state.isGameOver,
        }),
      }
    ),
    { name: 'HackathonSimulatorStore' }
  )
);

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
  ChaosEvent,
  GameStats,
  GeneratedBusinessModel,
  AdvisorAdvice,
  JudgeDecisionMemory,
  Teammate,
  TeamChatMoment,
  TeamChatMessage,
  TeammateDecision,
} from '@/types/game';
import { getRandomChaosEvent, CHAOS_EVENTS } from '@/data/chaosEvents';
import { getDailyChallenge } from '@/lib/dailyChallenge';
import { evaluatePitchDeck } from '@/lib/pitchDeckEvaluator';
import { TECH_REGISTRY, toRegistryId, toStoreId } from '@/data/techRegistry';
import { generateCustomElevatorPitch, calculateMentorConfidence } from '@/lib/projectStrategyGenerator';
import { ARCHITECTURE_TEMPLATES } from '@/data/architectureTemplates';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Stage order sequence for the simulator.
 */
export const STAGE_ORDER: GameStage[] = [
  'difficulty',
  'teamFormation',
  'problemReveal',
  'solutionDirection',
  'techStack',
  'usp',
  'features',
  'pitchDeck',
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
 * Phase relevance checker for teammate roles in Update v2.1.
 */
export function isRoleRelevantForStage(role: string | null, stage: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  
  if (r.includes("backend") || r.includes("ai engineer") || r.includes("ai specialist")) {
    return ['techStack', 'features'].includes(stage);
  }
  if (r.includes("frontend")) {
    return ['techStack', 'features', 'pitchDeck'].includes(stage);
  }
  if (r.includes("designer")) {
    return ['usp', 'pitchDeck', 'features'].includes(stage);
  }
  if (r.includes("strategist") || r.includes("founder")) {
    return ['businessModel', 'usp'].includes(stage);
  }
  if (r.includes("pitch")) {
    return ['pitchPrep', 'pitchDeck'].includes(stage);
  }
  if (r.includes("researcher")) {
    return ['problemReveal', 'solutionDirection'].includes(stage);
  }
  if (r.includes("chaiwala") || r.includes("chai")) {
    return ['techStack', 'features', 'mentor', 'businessModel', 'pitchPrep'].includes(stage);
  }
  return false;
}

/**
 * Helper to get a simulated time string from globalTimeRemaining and globalTotalTime.
 */
export function getSimulatedTime(globalTimeRemaining: number, globalTotalTime: number): string {
  if (globalTotalTime <= 0) return "Day 1, 09:00.";
  const elapsedRatio = Math.max(0, Math.min(1, 1 - (globalTimeRemaining / globalTotalTime)));
  const totalMinutes = 24 * 60;
  const elapsedMinutes = Math.floor(elapsedRatio * totalMinutes);
  const startMinutes = 9 * 60;
  const currentTotalMinutes = startMinutes + elapsedMinutes;
  
  const day = currentTotalMinutes >= 1440 ? 2 : 1;
  const hour = Math.floor((currentTotalMinutes % 1440) / 60);
  const minute = currentTotalMinutes % 60;
  
  const hourStr = String(hour).padStart(2, '0');
  const minStr = String(minute).padStart(2, '0');
  return `Day ${day}, ${hourStr}:${minStr}`;
}

/**
 * Helper to get a relevant teammate based on event type.
 */
export function getTeammateForEvent(team: Teammate[], event: string): Teammate | { id: string; name: string; avatar: string; } {
  if (!team || team.length === 0) {
    return { id: "teammate-fallback", name: "Riya", avatar: "👩‍💻" };
  }
  if (event === "tech_add" || event === "tech_remove") {
    const match = team.find(t => t.role?.toLowerCase().includes("backend") || t.role?.toLowerCase().includes("developer"));
    if (match) return match;
  }
  if (event === "backlog_change") {
    const match = team.find(t => t.role?.toLowerCase().includes("frontend") || t.role?.toLowerCase().includes("designer"));
    if (match) return match;
  }
  if (event === "usp_change" || event === "biz_model_change") {
    const match = team.find(t => t.role?.toLowerCase().includes("strategist") || t.role?.toLowerCase().includes("founder"));
    if (match) return match;
  }
  if (event === "mentor_advice") {
    const match = team.find(t => t.role?.toLowerCase().includes("pitch") || t.role?.toLowerCase().includes("user"));
    if (match) return match;
  }
  return team[Math.floor(Math.random() * team.length)];
}

/**
 * Character prompt metadata description.
 */
export interface CharacterPrompt {
  role: string;
  personality: string;
  expertise: string;
  commStyle: string;
}

/**
 * Returns character-specific profile configuration.
 */
export function getTeammateCharacter(name: string, role: string | null, personality: string): CharacterPrompt {
  const n = name.toLowerCase();
  const r = (role || "").toLowerCase();
  
  if (n.includes("tanmay") || r.includes("backend") || r.includes("database")) {
    return {
      role: "Backend Engineer",
      personality: "Pragmatic",
      expertise: "Relational modeling, server efficiency, scaling databases",
      commStyle: "Blunt, dislikes complex setups, calls out overengineering."
    };
  }
  if (n.includes("priya") || r.includes("designer") || r.includes("design") || r.includes("frontend")) {
    return {
      role: "UI/UX Designer",
      personality: "User-focused",
      expertise: "Interface clarity, human-computer interaction, visual design hierarchy",
      commStyle: "Detail-oriented, user advocate, challenges confusing layouts and complex UX."
    };
  }
  if (n.includes("riya") || r.includes("ai") || r.includes("ml") || r.includes("data scientist")) {
    return {
      role: "AI Engineer",
      personality: "Skeptical Optimizer",
      expertise: "Neural networks, model training, serverless model execution",
      commStyle: "Analytical, technical, questions weak AI integration and buzzword usage."
    };
  }
  if (r.includes("strategist") || r.includes("founder") || r.includes("business")) {
    return {
      role: "Product Strategist",
      personality: "ROI-driven",
      expertise: "Business viability, monetization funnels, startup metrics",
      commStyle: "Pragmatic, commercial, focuses strictly on customer value and revenue."
    };
  }
  if (r.includes("pitch")) {
    return {
      role: "Pitch Specialist",
      personality: "Charismatic Storyteller",
      expertise: "Narrative structure, presentation flow, public speaking",
      commStyle: "Energetic, focus on pacing, cuts dry technical descriptions for high-impact hooks."
    };
  }
  
  if (personality === "Builder") {
    return {
      role: role || "Developer",
      personality: "Pragmatic Builder",
      expertise: "Rapid prototyping, coding clean functions",
      commStyle: "Direct, prefers simple working prototypes over fancy designs."
    };
  } else if (personality === "Perfectionist") {
    return {
      role: role || "QA Engineer",
      personality: "Detail-oriented",
      expertise: "Error prevention, code quality, edge cases",
      commStyle: "Cautious, warns about potential bugs, opposes rushing implementations."
    };
  } else if (personality === "Dreamer") {
    return {
      role: role || "Visionary",
      personality: "Creative",
      expertise: "Out of the box ideation, future capabilities",
      commStyle: "Optimistic, uses visual storytelling, advocates for futuristic integrations."
    };
  } else if (personality === "Founder") {
    return {
      role: role || "Manager",
      personality: "ROI-focused Leader",
      expertise: "Milestone management, customer development",
      commStyle: "Decisive, business-oriented, pushes for speed and commercial viability."
    };
  }
  return {
    role: role || "Team Member",
    personality: "Collaborator",
    expertise: "General execution support",
    commStyle: "Supportive, constructive, aligns with the team lead."
  };
}

/**
 * Builds unified project context string to inform advice.
 */
export function buildProjectContext(state: GameState): string {
  const problemTitle = state.selectedProblem?.title || "None";
  const problemDesc = state.selectedProblem?.description || "None";
  const category = state.selectedProblem?.category || "None";
  const solutionType = state.solutionDirection || "None";
  const techNames = state.techStack.map(t => t.name).join(", ") || "None";
  const usp = state.usp || "None";
  const featuresList = state.features.map(f => `${f.name} (${f.effort} effort, ${f.impact} impact)`).join(", ") || "None";
  const pitchDeck = state.pitchDeck.join(", ") || "None";
  const businessModel = state.businessModel || "None";
  
  const techDifficultySum = state.techStack.reduce((sum, t) => sum + (t.difficulty || 0), 0);
  const highEffortFeaturesCount = state.features.filter(f => f.effort === 'high').length;
  const feasibility = Math.max(10, Math.min(100, 95 - (techDifficultySum * 3.5) - (highEffortFeaturesCount * 12)));
  const hasUsp = !!state.usp;
  const hasBizModel = !!state.businessModel;
  const pitchVal = state.pitchDeckScore || state.score.pitch || 45;
  const viability = Math.round((hasUsp ? 30 : 0) + (hasBizModel ? 30 : 0) + (pitchVal * 0.4));
  const health = `Innovation: ${state.score.innovation}%, Execution: ${state.score.execution}%, Feasibility: ${feasibility}%, Viability: ${viability}%`;
  
  const timerState = `${state.globalTimeRemaining} seconds remaining out of ${state.globalTotalTime}`;
  
  const mentorHistory = state.generatedAdvisorAdvice
    .filter(a => a.status === 'applied')
    .map(a => a.title)
    .join(", ") || "None";
    
  const teammateHistory = state.teamAdviceHistory
    ? state.teamAdviceHistory.filter(h => h.status === 'applied').map(h => h.title).join(", ")
    : "None";

  return `
Problem: "${problemDesc}" (Category: ${category})
Solution Type: ${solutionType}
Tech Stack: ${techNames}
USP: ${usp}
Backlog: [${featuresList}]
Pitch Deck: [${pitchDeck}]
Business Model: ${businessModel}
Mentor History: ${mentorHistory}
Teammate History: ${teammateHistory}
Timer: ${timerState}
Health: ${health}
`.trim();
}

/**
 * Play a Slack/Discord-style soft notification chime using the Web Audio API.
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    gain1.gain.setValueAtTime(0.10, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1000, now + 0.04);
    gain2.gain.setValueAtTime(0.08, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.14);
  } catch (e) {
    // Ignore audio context errors.
  }
}

/**
 * Checks context thresholds for a teammate.
 */
/** Pure role-based keyword matcher — returns a normalized role category from any role string */
function getRoleCategory(role: string): 'backend' | 'designer' | 'frontend' | 'strategist' | 'ai' | 'pitch' | 'researcher' | 'chaiwala' | 'general' {
  const r = role.toLowerCase();
  if (r.includes('chaiwala') || r.includes('chai')) return 'chaiwala';
  if (r.includes('ai engineer') || r.includes('ai specialist') || r.includes('ml engineer') || r.includes('data scientist') || r.includes('machine learning') || (r.includes('ai') && !r.includes('assistant'))) return 'ai';
  if (r.includes('designer') || r.includes('ux') || r.includes('ui ') || r.includes('product design')) return 'designer';
  if (r.includes('frontend') || r.includes('front-end') || r.includes('front end')) return 'frontend';
  if (r.includes('backend') || r.includes('database') || r.includes('full stack') || r.includes('fullstack') || r.includes('developer') || r.includes(' dev') || r.startsWith('dev')) return 'backend';
  if (r.includes('strategist') || r.includes('founder') || r.includes('business') || r.includes('co-founder') || r.includes('analyst')) return 'strategist';
  if (r.includes('pitch') || r.includes('marketing') || r.includes('sales')) return 'pitch';
  if (r.includes('researcher') || r.includes('research')) return 'researcher';
  return 'general';
}

export function checkTeammateGating(teammate: Teammate, state: GameState): { isGated: boolean; reason: string; } {
  if (state.stage === 'techStack') {
    return { isGated: false, reason: "Ready to advise on tech selection" };
  }
  if (isRoleRelevantForStage(teammate.role, state.stage)) {
    return { isGated: false, reason: "Ready to give advice" };
  }
  const role = (teammate.role || "").toLowerCase();
  const techStack = state.techStack || [];
  const hasUsp = !!state.usp || !!state.primaryUsp || !!state.secondaryUsp;
  const numFeatures = (state.features || []).length;
  const hasPitch = state.pitchDeck && state.pitchDeck.length > 0;
  const pitchCount = state.pitchDeck ? state.pitchDeck.length : 0;
  const cat = getRoleCategory(role);

  if (cat === 'backend') {
    const hasBackend = techStack.some(t => t.category === 'Backend' || t.category === 'backend');
    const hasDb = techStack.some(t => t.category === 'Database' || t.category === 'database');
    const hasHosting = techStack.some(t => t.category === 'Hosting / Infra' || t.category === 'Hosting' || t.category === 'devops');
    const hasThreeTech = techStack.length >= 3;
    if (hasBackend || hasDb || hasHosting || hasThreeTech) {
      return { isGated: false, reason: "Ready to review architecture" };
    }
    return { isGated: true, reason: "Watching architecture." };
  } else if (cat === 'designer' || cat === 'frontend') {
    if (hasUsp || numFeatures >= 3 || hasPitch) {
      return { isGated: false, reason: "Ready to review product design" };
    }
    return { isGated: true, reason: "Watching product decisions." };
  } else if (cat === 'pitch') {
    if (hasUsp || pitchCount >= 3) {
      return { isGated: false, reason: "Ready to review pitch deck" };
    }
    return { isGated: true, reason: "Waiting for pitch deck." };
  } else if (cat === 'strategist') {
    if (hasUsp || !!state.businessModel) {
      return { isGated: false, reason: "Ready to review business model" };
    }
    return { isGated: true, reason: "Watching business model." };
  } else if (cat === 'ai') {
    const hasAiTech = techStack.some(t => t.category === 'AI / ML' || t.category === 'ai');
    const hasAiSol = state.solutionDirection === 'ai-solution';
    if (hasAiTech || hasAiSol) {
      return { isGated: false, reason: "Ready to review AI features" };
    }
    return { isGated: true, reason: "Watching AI direction." };
  } else if (cat === 'researcher') {
    if (state.selectedProblem) {
      return { isGated: false, reason: "Ready to review project" };
    }
    return { isGated: true, reason: "Watching project selection." };
  } else {
    if (state.selectedProblem) {
      return { isGated: false, reason: "Ready to review project" };
    }
    return { isGated: true, reason: "Watching project details." };
  }
}

/**
 * Evaluates gating for all teammates and outputs context log updates.
 */
export function getUpdatedContextMessages(state: GameState): {
  teamChatMessages: TeamChatMessage[];
  lastContextState: Record<string, string>;
} {
  const nextMessages = [...state.teamChatMessages];
  const nextContextState = { ...state.lastContextState };

  state.team.forEach(t => {
    const { isGated, reason } = checkTeammateGating(t, state);
    if (isGated) {
      nextContextState[t.id] = reason;
    } else {
      nextContextState[t.id] = 'ready';
    }
  });

  return {
    teamChatMessages: nextMessages,
    lastContextState: nextContextState
  };
}

/**
 * Procedurally generates context-aware, non-generic advice.
 */
export function generateTeammateAdvice(teammateId: string, state: GameState): any {
  const teammate = state.team.find(t => t.id === teammateId);
  if (!teammate) return null;

  const role = teammate.role || "";
  const p = teammate.personality;
  const name = teammate.name;
  const cat = getRoleCategory(role);
  
  const problemTitle = state.selectedProblem?.title || "our prototype";
  const activeUsp = state.usp || "our value proposition";
  const activeModel = state.businessModel || "our business strategy";
  const techNames = state.techStack.map(t => t.name).join(", ");
  const numFeatures = state.features.length;

  // Helper: check if a tech exists in the current stack or the base pool
  const hasTechInStack = (nameFragment: string) =>
    state.techStack.some(t => t.name.toLowerCase().includes(nameFragment.toLowerCase()));

  let title = "Strategic Optimization";
  let observation = "";
  let concern = "";
  let recommendation = "";
  let expectedImpact = "";
  let tradeoffs = "";
  let modifiers = {} as any;
  let action = null as any;
  let logMessage = "";

  if (state.stage === 'techStack') {
    const tab = state.activeTechTab || 'all';
    
    if (tab === 'frontend') {
      if (cat === 'designer' || cat === 'frontend') {
        title = "Next.js Synergy Suggestion";
        observation = `We are choosing our Frontend stack for ${problemTitle}.`;
        concern = "Vanilla JS or basic templates are slow to develop and lack modular component layouts.";
        recommendation = "Let's select Next.js as our frontend framework. It gives us instant previews, modular layouts, and excellent design aesthetics!";
        expectedImpact = "Drastically boosts our visual presentation and UX scores (+2 PTS Fit Bonus).";
        tradeoffs = "Slightly higher initial boilerplate than HTML5.";
        modifiers = { design: 15, execution: 5, bonus: 2 };
        const nextItem = {
          id: "tech-next",
          name: "Next.js",
          icon: "layers",
          category: "Frontend",
          difficulty: 2,
          synergies: ["reg-vercel"]
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: nextItem }
        };
        logMessage = `${name} recommended Next.js for our frontend framework (+2 PTS).`;
      } else if (cat === 'backend') {
        title = "Legacy Raw HTML5 Suggestion";
        observation = `We are looking at frontend frameworks for ${problemTitle}.`;
        concern = "Backend developers prefer vanilla lightweight setups, but raw static files lack interactive responsiveness and modern polish.";
        recommendation = "Let's just use raw HTML5 and Vanilla Javascript. It has no setup overhead, though it will look basic and dry.";
        expectedImpact = "Improves execution speed, but severely damages design points (-1 PTS bad choice!).";
        tradeoffs = "Zero component reuse or modern animations.";
        modifiers = { design: -12, execution: 5, bonus: -1 };
        const htmlItem = {
          id: "tech-html5",
          name: "HTML5 / Vanilla JS",
          icon: "layers",
          category: "Frontend",
          difficulty: 1,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: htmlItem }
        };
        logMessage = `${name} gave suboptimal legacy HTML5 suggestion (-1 PTS).`;
      } else {
        title = "React UI Library Suggestion";
        observation = `We are designing our frontend interface layout for ${problemTitle}.`;
        concern = "We need standard, state-driven reusable components to build our dashboard widgets.";
        recommendation = "Let's add React as our client rendering library. It is clean, flexible, and has wide ecosystem support.";
        expectedImpact = "Provides structured rendering layouts (+0 PTS).";
        tradeoffs = "Requires setting up build bundlers.";
        modifiers = { design: 10, execution: 4, bonus: 0 };
        const reactItem = {
          id: "tech-react",
          name: "React",
          icon: "layers",
          category: "Frontend",
          difficulty: 2,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: reactItem }
        };
        logMessage = `${name} recommended React for the frontend (+0 PTS).`;
      }
    } else if (tab === 'backend') {
      if (cat === 'backend') {
        title = "Bun Runtime Recommendation";
        observation = `We are selecting our Backend controllers for ${problemTitle}.`;
        concern = "Normal Node.js runtime has slower startup times and more verbose setup APIs.";
        recommendation = "Let's add Bun as our backend controller! It compiles instantly, serves websockets incredibly fast, and runs with zero config.";
        expectedImpact = "Elevates execution feasibility and network performance (+2 PTS Fit Bonus).";
        tradeoffs = "Slightly newer runtime ecosystem.";
        modifiers = { execution: 15, innovation: 5, bonus: 2 };
        const bunItem = {
          id: "tech-bun",
          name: "Bun",
          icon: "layers",
          category: "Backend",
          difficulty: 2,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: bunItem }
        };
        logMessage = `${name} recommended Bun for high speed backend runtime (+2 PTS).`;
      } else if (cat === 'designer' || cat === 'frontend') {
        title = "Spring Boot Heavyweight Suggestion";
        observation = `We are looking at backend controllers for ${problemTitle}.`;
        concern = "Designers might want massive enterprise backends, but Java Spring Boot is extremely heavy and slow for a 24-hour sprint.";
        recommendation = "Let's use Spring Boot. It has bulletproof stability, though setting it up will waste hours of developer time.";
        expectedImpact = "Unnecessarily slows down our deployment velocity (-1 PTS bad choice!).";
        tradeoffs = "Extremely verbose boilerplate code.";
        modifiers = { execution: -10, innovation: 2, bonus: -1 };
        const springItem = {
          id: "tech-springboot",
          name: "Spring Boot",
          icon: "layers",
          category: "Backend",
          difficulty: 4,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: springItem }
        };
        logMessage = `${name} recommended heavyweight Spring Boot runtime (-1 PTS).`;
      } else {
        title = "Node.js API Server Setup";
        observation = `We are adding a backend runtime controller for ${problemTitle}.`;
        concern = "We need standard server endpoints to handle database requests cleanly.";
        recommendation = "Let's select Node.js as our API server. It is extremely popular, cohesive, and easy to connect to other systems.";
        expectedImpact = "Sets up stable database routing (+0 PTS).";
        tradeoffs = "Single-threaded execution loop.";
        modifiers = { execution: 8, innovation: 2, bonus: 0 };
        const nodeItem = {
          id: "tech-node",
          name: "Node.js",
          icon: "layers",
          category: "Backend",
          difficulty: 2,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: nodeItem }
        };
        logMessage = `${name} recommended standard Node.js server (+0 PTS).`;
      }
    } else if (tab === 'database') {
      if (cat === 'backend') {
        title = "Supabase Relational Mapping";
        observation = `We are picking database storage engines for ${problemTitle}.`;
        concern = "Setting up relational Postgres tables manually requires migrations and raw query connection code.";
        recommendation = "Let's add Supabase as our relational database. It serves direct Postgres queries with automatic API bindings!";
        expectedImpact = "Significantly speeds up data integration and table mapping (+2 PTS Fit Bonus).";
        tradeoffs = "Requires learning the Supabase SDK syntax.";
        modifiers = { execution: 14, design: 5, bonus: 2 };
        const supabaseItem = {
          id: "tech-supabase",
          name: "Supabase",
          icon: "layers",
          category: "Database",
          difficulty: 1,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: supabaseItem }
        };
        logMessage = `${name} recommended Supabase database backend (+2 PTS).`;
      } else if (cat === 'designer' || cat === 'frontend') {
        title = "MongoDB Document DB Selection";
        observation = `We are mapping relational data structures for ${problemTitle}.`;
        concern = "Frontenders love schema-less JSON docs, but forcing MongoDB to resolve relational mapping leads to clunky client-side joins.";
        recommendation = "Let's use MongoDB. It is schema-less and easy, though resolving relational connections will be extremely messy.";
        expectedImpact = "Increases database structural friction and search latency (-1 PTS bad choice!).";
        tradeoffs = "Loses relational foreign key constraints.";
        modifiers = { execution: 5, design: -5, bonus: -1 };
        const mongoItem = {
          id: "tech-mongodb",
          name: "MongoDB",
          icon: "layers",
          category: "Database",
          difficulty: 1,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: mongoItem }
        };
        logMessage = `${name} gave clunky document MongoDB suggestion (-1 PTS).`;
      } else {
        title = "PostgreSQL DB Engine Selection";
        observation = `We are mapping SQL tables for ${problemTitle}.`;
        concern = "We need standard, robust relational table safety to scale database transactions.";
        recommendation = "Let's add PostgreSQL as our SQL database server. It is extremely secure and handles relational constraints flawlessly.";
        expectedImpact = "Establishes a highly structured data schema (+0 PTS).";
        tradeoffs = "Requires manually executing table migrations.";
        modifiers = { execution: 10, bonus: 0 };
        const postgresItem = {
          id: "tech-postgres",
          name: "PostgreSQL",
          icon: "layers",
          category: "Database",
          difficulty: 2,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: postgresItem }
        };
        logMessage = `${name} recommended PostgreSQL engine (+0 PTS).`;
      }
    } else if (tab === 'ai') {
      if (cat === 'ai') {
        title = "Google Gemini Inference";
        observation = `We are selecting cognitive intelligence pipelines for ${problemTitle}.`;
        concern = "Standard APIs have higher cost and network latency for dynamic LLM content.";
        recommendation = "Let's select Google Gemini API Flash models! They are ultra-fast, cost-effective, and handle massive multimodal contexts beautifully.";
        expectedImpact = "Maximizes prototype innovation score and pitch value (+2 PTS Fit Bonus).";
        tradeoffs = "Slightly different SDK schemas than standard models.";
        modifiers = { innovation: 18, pitch: 10, bonus: 2 };
        const geminiItem = {
          id: "tech-gemini",
          name: "Gemini API",
          icon: "layers",
          category: "AI / ML",
          difficulty: 2,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: geminiItem }
        };
        logMessage = `${name} recommended high-speed Gemini API Flash models (+2 PTS).`;
      } else {
        title = "OpenAI API Core Integration";
        observation = `We are adding a model intelligence pipeline for ${problemTitle}.`;
        concern = "Integrating semantic features requires a highly popular API model.";
        recommendation = "Let's add OpenAI API GPT models to our stack. They are extremely popular with very solid developer documentation.";
        expectedImpact = "Provides strong cognitive features for the prototype (+0 PTS).";
        tradeoffs = "Slightly higher latency and execution cost.";
        modifiers = { innovation: 12, pitch: 5, bonus: 0 };
        const openaiItem = {
          id: "tech-openai",
          name: "OpenAI",
          icon: "layers",
          category: "AI / ML",
          difficulty: 2,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: openaiItem }
        };
        logMessage = `${name} recommended OpenAI API models (+0 PTS).`;
      }
    } else {
      if (cat === 'designer' || cat === 'frontend' || cat === 'backend') {
        title = "Vercel Cloud Deployment";
        observation = `We are selecting deployment infrastructures for ${problemTitle}.`;
        concern = "Deploying to raw cloud VPS machines manually wastes precious hackathon hours.";
        recommendation = "Let's select Vercel for serverless cloud hosting. It gives us instant preview URLs and seamless continuous deployments!";
        expectedImpact = "Drastically speeds up frontend publishing and validation (+2 PTS Fit Bonus).";
        tradeoffs = "Serverless execution time-limits.";
        modifiers = { execution: 12, bonus: 2 };
        const vercelItem = {
          id: "tech-vercel",
          name: "Vercel",
          icon: "layers",
          category: "Hosting / Infra",
          difficulty: 1,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: vercelItem }
        };
        logMessage = `${name} recommended Vercel cloud serverless deployment (+2 PTS).`;
      } else {
        title = "Netlify Static Hosting Setup";
        observation = `We are adding server deployment servers for ${problemTitle}.`;
        concern = "Publishing our static assets requires instant global routing.";
        recommendation = "Let's add Netlify static server hosting. It is fast, lightweight, and publishes client assets with one command.";
        expectedImpact = "Simplifies static file server setups (+0 PTS).";
        tradeoffs = "Loses dynamic custom backend server capabilities.";
        modifiers = { execution: 8, bonus: 0 };
        const netlifyItem = {
          id: "tech-netlify",
          name: "Netlify",
          icon: "layers",
          category: "Hosting / Infra",
          difficulty: 1,
          synergies: []
        };
        action = {
          type: 'add_tech_directly',
          payload: { techItem: netlifyItem }
        };
        logMessage = `${name} recommended Netlify static web hosting (+0 PTS).`;
      }
    }

    return {
      title,
      observation,
      concern,
      recommendation,
      expectedImpact,
      tradeoffs,
      modifiers,
      action,
      logMessage
    };
  }

  if (cat === 'backend') {
    const hasPostgres = state.techStack.some(t => t.id === 'tech-postgres' || t.name.toLowerCase().includes("postgres"));
    const hasSupabase = state.techStack.some(t => t.id === 'tech-supabase' || t.name.toLowerCase().includes("supabase"));
    const hasRedis = state.techStack.some(t => t.id === 'tech-redis' || t.name.toLowerCase().includes("redis"));
    const hasNext = state.techStack.some(t => t.id === 'tech-next' || t.name.toLowerCase().includes("next"));
    const hasExpress = state.techStack.some(t => t.id === 'tech-express' || t.name.toLowerCase().includes("express"));
    const hasNode = state.techStack.some(t => t.id === 'tech-node' || t.name.toLowerCase().includes("node"));
    const hasBun = state.techStack.some(t => t.id === 'tech-bun' || t.name.toLowerCase().includes("bun"));
    const hasGo = state.techStack.some(t => t.id === 'tech-go' || t.name.toLowerCase().includes("go"));
    
    // Check if we need backend selection help:
    const hasBackend = state.techStack.some(t => t.category === 'Backend' || t.category === 'backend');
    const hasDb = state.techStack.some(t => t.category === 'Database' || t.category === 'database');
    const hasFrontend = state.techStack.some(t => t.category === 'Frontend' || t.category === 'frontend');
    
    if (!hasBackend) {
      title = "Backend Runtime Selection";
      observation = `We are building a prototype for ${problemTitle} but haven't chosen a backend controller yet.`;
      concern = `Handling client API calls or orchestrating our ${numFeatures} features requires a highly responsive and lightweight runtime.`;
      recommendation = "Let's add Bun to our backend stack. It is ultra-fast, compiles instantly, and serves websockets with zero overhead.";
      expectedImpact = "Speeds up backend response times and local compilation.";
      tradeoffs = "Newer ecosystem than standard Node.js runtime.";
      modifiers = { execution: 14, innovation: 10 };
      const bunItem = {
        id: "tech-bun",
        name: "Bun",
        icon: "layers",
        category: "Backend",
        difficulty: 2,
        synergies: ["reg-react", "reg-supabase"]
      };
      action = {
        type: 'add_tech_directly',
        payload: { techItem: bunItem }
      };
      logMessage = `${name} recommended Bun for the backend controller.`;
    } else if (!hasDb) {
      title = "Database Integration Selection";
      observation = `We have selected backend runtimes for ${problemTitle}, but we haven't selected a relational or non-relational database yet.`;
      concern = `Storing user status and caching strategic inputs for our ${numFeatures} features requires a persistent data engine.`;
      recommendation = "Let's add Supabase to our database stack. It gives us PostgreSQL relational mapping with zero API config.";
      expectedImpact = "Instantly solves backend storage and analytical schemas.";
      tradeoffs = "Couples the backend database directly to a Supabase client setup.";
      modifiers = { execution: 14, design: 5, innovation: 6 };
      const supabaseItem = {
        id: "tech-supabase",
        name: "Supabase",
        icon: "layers",
        category: "Database",
        difficulty: 1,
        synergies: []
      };
      action = {
        type: 'add_tech_directly',
        payload: { techItem: supabaseItem }
      };
      logMessage = `${name} recommended Supabase as our database backend.`;
    } else if (!hasFrontend) {
      title = "Frontend Framework Selection";
      observation = `We are missing a cohesive component interface or rendering controller for ${problemTitle}.`;
      concern = "Without a strong, component-based reactive framework, we cannot coordinate modern user interfaces fluidly.";
      recommendation = "Let's add Next.js to our frontend stack. It provides automatic server rendering and super smooth routing.";
      expectedImpact = "Drastically enhances visual design points and interface speed.";
      tradeoffs = "Has a slightly higher learning curve than plain Javascript.";
      modifiers = { design: 15, execution: 8, innovation: 5 };
      const nextItem = {
        id: "tech-next",
        name: "Next.js",
        icon: "layers",
        category: "Frontend",
        difficulty: 2,
        synergies: ["reg-vercel"]
      };
      action = {
        type: 'add_tech_directly',
        payload: { techItem: nextItem }
      };
      logMessage = `${name} recommended Next.js as our frontend framework.`;
    } else if (hasGo && hasNode) {
      title = "Backend Architecture Consolidation";
      observation = `We are running both Node.js and Go (Gin) in our stack for ${problemTitle}.`;
      concern = "Managing multiple execution environments in a short 24-hour sprint creates massive deployment risk and team friction.";
      recommendation = "Let's remove Go (Gin) and standardize our backend on Node.js to keep our runtime cohesive.";
      expectedImpact = "Drastically reduces integration complexity.";
      tradeoffs = "Slightly reduces raw network execution speed.";
      modifiers = { execution: 18, innovation: -5 };
      action = {
        type: 'replace_tech_directly',
        payload: { removeName: 'Go', addTech: { id: "tech-node", name: "Node.js", icon: "layers", category: "Backend", difficulty: 2, synergies: [] } }
      };
      logMessage = `${name} consolidated backend stack to Node.js.`;
    } else if (hasPostgres) {
      title = "Database Schema Optimization";
      observation = `We are running PostgreSQL in our stack for the ${problemTitle} problem, with selected technologies: ${techNames || "None."}`;
      concern = `Writing raw SQL migrations and managing connections while implementing all ${numFeatures} backlog features is too slow for a 24-hour hackathon sprint.`;
      recommendation = "Let's replace PostgreSQL with MongoDB. It allows us to save records as flexible JSON without migrations, speeding up schema updates.";
      expectedImpact = "Speeds up schema updates and database queries.";
      tradeoffs = "Loses relational foreign key constraints.";
      modifiers = { execution: 15, design: -2 };
      const mongoItem = {
        id: "tech-mongodb",
        name: "MongoDB",
        icon: "layers",
        category: "Database",
        difficulty: 1,
        synergies: []
      };
      action = {
        type: 'replace_tech_directly',
        payload: {
          removeName: 'PostgreSQL',
          addTech: mongoItem
        }
      };
      logMessage = `${name} replaced PostgreSQL database with MongoDB.`;
    } else if (hasSupabase) {
      title = "Database Service Swap";
      observation = `We are using Supabase as our database backend for ${problemTitle}. Selected stack: ${techNames || "None."}`;
      concern = `Integrating Supabase client authentication and database listeners for all ${numFeatures} features adds too much client-side bundle weight.`;
      recommendation = "Let's swap Supabase with Firebase. It will let us utilize simpler SDK setups for state sync.";
      expectedImpact = "Simplifies state synchronization and SDK setups.";
      tradeoffs = "Loses PostgreSQL relational capabilities.";
      modifiers = { execution: 12, design: 2 };
      const firebaseItem = {
        id: "tech-firebase",
        name: "Firebase",
        icon: "layers",
        category: "Database",
        difficulty: 1,
        synergies: []
      };
      action = {
        type: 'replace_tech_directly',
        payload: {
          removeName: 'Supabase',
          addTech: firebaseItem
        }
      };
      logMessage = `${name} swapped Supabase database with Firebase.`;
    } else if (hasNext && !hasRedis) {
      title = "Database Caching Implementation";
      observation = `Our frontend uses Next.js to solve ${problemTitle}, but our database fetches are not cached.`;
      concern = `Repeated database queries for our ${numFeatures} features on every page load will slow down our demo response time.`;
      recommendation = "Let's add Redis to cache session queries and speed up the interface.";
      expectedImpact = "Significantly reduces latency in database responses.";
      tradeoffs = "Adds a small setup overhead for local caching.";
      modifiers = { execution: 10, design: 4 };
      const redisItem = {
        id: "tech-redis",
        name: "Redis",
        icon: "layers",
        category: "Database",
        difficulty: 2,
        synergies: ["reg-next"]
      };
      action = {
        type: 'add_tech_directly',
        payload: {
          techItem: redisItem
        }
      };
      logMessage = `${name} added Redis cache to the tech stack.`;
    } else {
      const lowestImpactFeature = state.features.length > 0 
        ? [...state.features].sort((a, b) => (a.impact === 'low' ? 0 : 1) - (b.impact === 'low' ? 0 : 1))[0]
        : null;
      const featName = lowestImpactFeature?.name || "nice-to-have features";
      
      title = "Backend Scope Reduction";
      observation = `We have prioritized backend-intensive features including ${featName} for our prototype.`;
      concern = "Building the full API endpoints for these features will leave us with no time for visual polish.";
      recommendation = `Let's remove the lower impact feature ${featName} from our backlog.`;
      expectedImpact = "Improves overall prototype feasibility and database safety.";
      tradeoffs = "Reduces features in scope.";
      modifiers = { execution: 10, design: 5, innovation: -5 };
      action = { type: 'reduce_scope', payload: {} };
      logMessage = `${name} pruned backend backlog feature ${featName}.`;
    }
  } else if (cat === 'ai') {
    title = "AI Model Selection Tuning";
    const hasOpenAI = hasTechInStack("openai");
    const hasGemini = hasTechInStack("gemini");
    
    if (hasOpenAI) {
      observation = `We are calling OpenAI API model endpoints for our solution solving ${problemTitle}.`;
      concern = "OpenAI API has higher response latency and model execution costs for dynamic UI content.";
      recommendation = "Let's replace OpenAI API with Gemini API to utilize Gemini Flash models, which are faster and cheaper.";
      expectedImpact = "Decreases response latency and improves prototype design polish.";
      tradeoffs = "Slight differences in text completion formats.";
      modifiers = { execution: 12, design: 5 };
      const geminiItem = { id: "tech-gemini", name: "Gemini API", icon: "brain", category: "ai" as const, difficulty: 2, synergies: [] };
      action = { type: 'replace_tech_directly', payload: { removeName: 'OpenAI', addTech: geminiItem } };
      logMessage = `${name} replaced OpenAI API with Gemini API.`;
    } else if (hasGemini) {
      observation = `We are calling Gemini API Flash model endpoints for ${problemTitle} with stack: ${techNames || "None."}`;
      concern = `Our prompting calls for all ${numFeatures} features might run slowly if we don't prune redundant input context.`;
      recommendation = "Let's remove any duplicate AI tools and focus strictly on Gemini Flash endpoints for speed.";
      expectedImpact = "Reduces execution risk and speeds up API calls.";
      tradeoffs = "Loses fallback model options.";
      modifiers = { execution: 10, innovation: 5 };
      action = { type: 'simplify_ai', payload: {} };
      logMessage = `${name} optimized the Gemini API pipeline.`;
    } else {
      observation = `We are building a prototype for ${problemTitle} without integrating any AI/LLM models.`;
      concern = "We need semantic capabilities to convince the judges of our product's intelligence and innovation.";
      recommendation = "Let's add Gemini API to our stack — it's fast, free to prototype with, and very impressive to judges.";
      expectedImpact = "Increases product innovation and wow-factor rating significantly.";
      tradeoffs = "Requires setting up environment API keys and writing prompt functions.";
      modifiers = { innovation: 18, execution: -5 };
      const geminiItem = { id: "tech-gemini", name: "Gemini API", icon: "brain", category: "ai" as const, difficulty: 2, synergies: [] };
      action = { type: 'add_tech_directly', payload: { techItem: geminiItem } };
      logMessage = `${name} added Gemini API to the tech stack.`;
    }
  } else if (cat === 'designer') {
    title = "UX Interface Optimization";
    const lowestImpactFeature = state.features.length > 0 
      ? [...state.features].sort((a, b) => (a.impact === 'low' ? 0 : 1) - (b.impact === 'low' ? 0 : 1))[0]
      : null;
    const featName = lowestImpactFeature?.name || "complex components";
    
    observation = `We are displaying our USP "${activeUsp}" via a complex feature set of ${numFeatures} features, including ${featName}.`;
    concern = `Users will be overwhelmed by too many features and abandon the onboarding flow. The UI needs more breathing room.`;
    recommendation = `As the designer, I'd say we drop the lower priority feature "${featName}" and focus on perfecting the core user journey.`;
    expectedImpact = "Guarantees a clean, polished UI that wows judges on first impression.";
    tradeoffs = "Reduces total feature count by one.";
    modifiers = { design: 15, execution: 5 };
    action = { type: 'reduce_scope', payload: {} };
    logMessage = `${name} pruned feature ${featName} to optimize UX landing page.`;
  } else if (cat === 'frontend') {
    title = "Frontend Stack Optimization";
    const hasReact = hasTechInStack("react");
    const hasNext = hasTechInStack("next");
    
    if (hasReact && !hasNext) {
      observation = `We are using React with custom routing for the ${problemTitle} problem.`;
      concern = `Setting up manual state management and routing for all ${numFeatures} features eats into our demo time.`;
      recommendation = "Migrating to Next.js gives us file-system routing and server components out of the box — way faster.";
      expectedImpact = "Speeds up the frontend build and gives us SEO-friendly routes for free.";
      tradeoffs = "Requires updating routing config files.";
      modifiers = { execution: 14, design: 5 };
      const nextItem = { id: "tech-next", name: "Next.js", icon: "layers", category: "frontend" as const, difficulty: 2, synergies: [] };
      action = { type: 'replace_tech_directly', payload: { removeName: 'React', addTech: nextItem } };
      logMessage = `${name} migrated the frontend stack from React to Next.js.`;
    } else {
      observation = `We have ${numFeatures} features in our backlog for ${problemTitle}.`;
      concern = "Building all these views will leave zero time for visual polish and animations.";
      recommendation = "Let's cut the lowest priority features and spend that time making the core screens look really sharp.";
      expectedImpact = "Better-looking UI with more polish = better design score.";
      tradeoffs = "Reduces total feature count.";
      modifiers = { execution: 10, design: 8 };
      action = { type: 'reduce_scope', payload: {} };
      logMessage = `${name} pruned frontend feature backlog.`;
    }
  } else if (cat === 'strategist') {
    title = "Revenue Model Pivot";
    observation = `Our current business model is "${activeModel}" and our USP is "${activeUsp}".`;
    concern = "Judges look for a clear, believable path to revenue. A vague model tanks the pitch score.";
    
    if (activeModel.toLowerCase().includes("sponsorship")) {
      recommendation = "Let's pivot to a Freemium model — free tier hooks users, paid tier converts power users. Much more scalable.";
      expectedImpact = "Shows recurring monthly revenue potential — judges love this narrative.";
      tradeoffs = "Need to define a clear feature paywall.";
      modifiers = { pitch: 15, execution: -5 };
      action = { type: 'change_biz_model', payload: { model: 'Freemium' } };
      logMessage = `${name} updated business model to Freemium.`;
    } else {
      recommendation = "Let's pitch a Local Sponsorship model — brands pay to reach our users. Zero friction for early adopters.";
      expectedImpact = "Immediate revenue story without charging users. Great for campus pilots.";
      tradeoffs = "Limits total addressable market.";
      modifiers = { pitch: 15, execution: -5 };
      action = { type: 'change_biz_model', payload: { model: 'Local Sponsorship' } };
      logMessage = `${name} updated business model to Local Sponsorship.`;
    }
  } else if (cat === 'pitch') {
    title = "Pitch Slide Restructuring";
    observation = `We have prioritized the following slide sequence: [${state.pitchDeck.join(", ") || "None."}], total ${state.pitchDeck.length} slides.`;
    concern = `The slide sequence is too technical and lacks a strong hook to showcase our technology stack: ${techNames || "None."}.`;
    
    if (state.pitchDeck.includes("demo")) {
      recommendation = "Let's reorder the deck to place the Demo slide right after the Problem slide.";
      expectedImpact = "Hooks the judges in the first ten seconds and boosts pitch rating.";
      tradeoffs = "Slides order will change.";
      modifiers = { pitch: 15, design: 5 };
      action = { type: 'reorder_pitch_deck', payload: {} };
      logMessage = `${name} reordered the pitch deck to place the Demo slide after the Problem slide.`;
    } else {
      recommendation = "Let's add a Demo slide to showcase our frontend prototype.";
      expectedImpact = "Improves overall presentation flow and pitch delivery.";
      tradeoffs = "Adds slide deck layout complexity.";
      modifiers = { pitch: 12, design: 5 };
      action = { type: 'add_slide_directly', payload: { slide: 'demo' } };
      logMessage = `${name} added a Demo slide to the pitch deck.`;
    }
  } else if (cat === 'researcher') {
    title = "User Research Insight";
    observation = `Our USP is "${activeUsp}" targeting the ${problemTitle} problem.`;
    concern = "The value proposition is too vague and generic. Judges want to see a specific, researched target audience.";
    recommendation = "Based on my research, let's narrow our USP to focus specifically on the student/campus demographic — more believable in a 24h build.";
    expectedImpact = "Sharpens target audience alignment and makes the innovation story more credible.";
    tradeoffs = "Reduces the total addressable market size claim.";
    modifiers = { innovation: 12, pitch: 5 };
    action = { type: 'change_usp', payload: { usp: 'Student-centric campus tools' } };
    logMessage = `${name} refined the USP based on user research.`;
  } else if (cat === 'chaiwala') {
    title = "Emergency Chai Break 🍵";
    observation = `The team has been heads-down on ${problemTitle} for hours.`;
    concern = "Developer fatigue is real — slow thinking, more bugs, worse decisions.";
    recommendation = "Chai break. Now. I'm serious. Ten minutes of cardamom chai resets the brain better than three hours of frustrated coding.";
    expectedImpact = "Boosts team morale, execution speed, and general vibe.";
    tradeoffs = "Ten minutes pause on coding.";
    modifiers = { execution: 10, design: 5, bonus: 5 };
    action = { type: 'boost_morale', payload: {} };
    logMessage = `${name} served Cardamom Chai to boost team morale.`;
  } else {
    title = "MVP Scope Trim";
    const lowestImpactFeature = state.features.length > 0 
      ? [...state.features].sort((a, b) => (a.impact === 'low' ? 0 : 1) - (b.impact === 'low' ? 0 : 1))[0]
      : null;
    const featName = lowestImpactFeature?.name || "nice-to-have features";
    observation = `We have ${numFeatures} features in our backlog: [${state.features.map(f => f.name).join(", ")}].`;
    concern = "We are over-scoped for a hackathon. Trying to build everything means delivering nothing polished.";
    recommendation = `Drop "${featName}" from the backlog. It's the lowest priority and we can always add it post-hackathon.`;
    expectedImpact = "More focused dev time on core features = better execution score.";
    tradeoffs = "One less feature to demo.";
    modifiers = { execution: 10, design: 5 };
    action = { type: 'reduce_scope', payload: {} };
    logMessage = `${name} trimmed the MVP scope by removing ${featName}.`;
  }

  const teammateHistory = state.teamAdviceHistory ? state.teamAdviceHistory.filter((h: any) => h.teammateId === teammateId) : [];
  let memoryIntroduction = "";
  if (teammateHistory.length > 0) {
    const lastChoice = teammateHistory[teammateHistory.length - 1];
    if (lastChoice.status === 'rejected') {
      memoryIntroduction = `Look, I still stand by my last suggestion ("${lastChoice.title}") but let's move on. `;
    } else {
      memoryIntroduction = `Good call applying "${lastChoice.title}" earlier. Building on that — `;
    }
  }

  // Build a clean, plain-language explanation without role/personality metadata
  let explanationText = `${memoryIntroduction}${observation} ${concern} ${recommendation}`;

  return {
    teammateId,
    title,
    explanation: explanationText,
    expectedImpact,
    tradeoffs,
    modifiers,
    action,
    observation,
    concern,
    recommendation,
    contributionLog: logMessage,
  };
}

/**
 * Legacy phase mapping for backwards compatibility with unchanged layout components.
 */
const mapStageToPhase = (stage: GameStage): GamePhase => {
  switch (stage) {
    case 'difficulty':
    case 'teamFormation':
    case 'problemReveal':
      return 'PROBLEM_REVEAL';
    case 'solutionDirection':
    case 'techStack':
      return 'TECH_STACK';
    case 'usp':
    case 'features':
    case 'pitchDeck':
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
  }
};

const compileDecisionMemory = (state: any): JudgeDecisionMemory => ({
  chosenUsp: state.usp,
  selectedTechIds: state.techStack.map((t: any) => toRegistryId(t.id)),
  mentorDecisions: state.generatedAdvisorAdvice.reduce((acc: any, adv: any) => {
    acc[adv.id] = adv.status;
    return acc;
  }, {} as Record<string, 'applied' | 'rejected' | 'pending'>),
  backlogFeatureIds: state.features.map((f: any) => f.id),
  businessModelChoice: state.businessModel,
  pitchStructureSlides: state.pitchDeck,
});

const TEAM_CHAT_MOMENTS = [
  {
    id: "chat-scope",
    title: "Backlog Dispute",
    teammateA: { name: "Riya", avatar: "🤖", statement: "Let's add advanced machine learning recommendations to our dashboard. It will impress the judges." },
    teammateB: { name: "Anjali", avatar: "👩‍💻", statement: "No way. We haven't even finished the database setup yet. We will end up presenting a broken demo." },
    choices: [
      {
        label: "Favour Riya (Add AI)",
        description: "Add ML recommendations to boost project innovation.",
        outcomeText: "Added ML recommendations. Innovation score increased, but execution risk rose.",
        modifiers: { innovation: 15, execution: -8 }
      },
      {
        label: "Favour Anjali (Focus Database)",
        description: "Focus on clean relational database routing and data schema.",
        outcomeText: "Focused on database routing. Execution score increased, but innovation was lowered.",
        modifiers: { execution: 12, innovation: -5 }
      },
      {
        label: "Compromise (Mock ML)",
        description: "Use a simple static dataset with mock recommendations.",
        outcomeText: "Mocked the AI feed. Design and pitch scores increased with zero build overhead.",
        modifiers: { design: 6, pitch: 6 }
      }
    ]
  },
  {
    id: "chat-pricing",
    title: "Monetization Strategy",
    teammateA: { name: "Sam", avatar: "👨‍💼", statement: "We need high monthly subscription plans to prove commercial viability." },
    teammateB: { name: "Priya", avatar: "👩‍🎨", statement: "A strict paywall will scare away all beta testers. We need a frictionless free tier." },
    choices: [
      {
        label: "Support Sam (Paid Tiers)",
        description: "Focus on corporate premium monetization structures.",
        outcomeText: "Implemented corporate plans. Business viability score boosted, pitch metrics slightly penalized.",
        modifiers: { pitch: -5, bonus: 10 }
      },
      {
        label: "Support Priya (Free Model)",
        description: "Implement a fully open-source or free user tier model.",
        outcomeText: "Selected free tier model. Pitch scores increased, but business viability is lower.",
        modifiers: { pitch: 15, design: 5, bonus: -5 }
      },
      {
        label: "Compromise (Sponsor Model)",
        description: "Keep it free for students but show localized campus sponsor links.",
        outcomeText: "Implemented campus sponsor wedge. Business viability and design metrics balanced.",
        modifiers: { pitch: 8, design: 8 }
      }
    ]
  },
  {
    id: "chat-tech",
    title: "Architecture Overhead",
    teammateA: { name: "David", avatar: "👨‍💻", statement: "Let's build a custom WebSockets real-time server for live state updates." },
    teammateB: { name: "Leo", avatar: "👨‍🎨", statement: "That's overkill for a 24-hour demo. A simple fetch interval is more than enough." },
    choices: [
      {
        label: "Build Sockets",
        description: "Dedicate time to live WebSocket sockets integration.",
        outcomeText: "Implemented live sockets. Technical stack score boosted, but execution penalty applied due to scope.",
        modifiers: { innovation: 12, execution: -8 }
      },
      {
        label: "Use Fetch Interval",
        description: "Stick to basic REST fetch intervals and keep code simple.",
        outcomeText: "Selected simple REST queries. Execution complexity decreased, design polish optimized.",
        modifiers: { execution: 12, design: 5 }
      },
      {
        label: "Compromise (Serverless Hook)",
        description: "Use serverless cloud triggers to fetch updates on-demand.",
        outcomeText: "Integrated serverless hooks. Execution and pitch variables optimized.",
        modifiers: { execution: 8, pitch: 8 }
      }
    ]
  }
];

const getNextTeamChatMoment = (history: string[], team: any[]): TeamChatMoment | null => {
  if (team.length < 2) return null;
  const available = TEAM_CHAT_MOMENTS.filter(m => !history.includes(m.id));
  if (available.length === 0) return null;

  const idx = Math.floor(Math.random() * available.length);
  const moment = { ...available[idx] };

  // Snapshot the original placeholder names from the template before overwriting
  const originalNameA = moment.teammateA.name;
  const originalNameB = moment.teammateB.name;

  const tA = team[1] || team[0];
  moment.teammateA = {
    name: tA.name,
    avatar: tA.avatar,
    statement: moment.teammateA.statement
  };

  const tB = team[2] || team[0];
  moment.teammateB = {
    name: tB.name,
    avatar: tB.avatar,
    statement: moment.teammateB.statement
  };

  // Replace hardcoded template names in choice labels and descriptions with actual teammate names
  moment.choices = moment.choices.map((choice: any) => ({
    ...choice,
    label: choice.label
      .replace(new RegExp(originalNameA, 'gi'), tA.name)
      .replace(new RegExp(originalNameB, 'gi'), tB.name),
    description: choice.description
      .replace(new RegExp(originalNameA, 'gi'), tA.name)
      .replace(new RegExp(originalNameB, 'gi'), tB.name),
  }));

  return moment;
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

const initialStats = {
  totalRuns: 0,
  bestScore: 0,
  averageScore: 0,
  favoriteStack: [] as string[],
  chaosSurvivalRate: 0,
  judgeWinRate: 0,
  chaosRunsFaced: 0,
  chaosRunsSurvived: 0,
  judgeWins: 0,
  techUsage: {} as Record<string, number>,
};

const initialGameState = {
  stage: 'difficulty' as GameStage,
  phase: 'PROBLEM_REVEAL' as GamePhase,
  difficulty: null as 'easy' | 'medium' | 'hard' | 'dev' | null,
  selectedProblem: null as Problem | null,
  solutionDirection: null as string | null,
  techStack: [] as TechItem[],
  usp: null as string | null,
  primaryUsp: null as string | null,
  secondaryUsp: null as string | null,
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
  hasFinishedOnce: false,
  unlockedAchievements: [] as string[],
  soundEnabled: true,
  activeChaosEvent: null as ChaosEvent | null,
  chaosHistory: [] as string[],
  gameMode: 'classic' as 'classic' | 'daily' | 'speedrun' | 'chaos' | 'hardcore',
  activeModifiers: [] as string[],
  dailyModifier: null as string | null,
  stats: initialStats,

  // Update v1.5: Pitch Deck Builder variables
  pitchDeck: [] as string[],
  pitchDeckScore: 0,
  deckNarrativeQuality: 'Fragmented',
  deckArchetype: 'Custom Deck',

  // Update :: AI Generated Project Design System variables
  generatedUSPs: [] as any[],
  generatedBacklog: [] as any[],

  // Update v1.7: AI Co-Founder System variables
  generatedBusinessModels: [] as GeneratedBusinessModel[],
  generatedAdvisorAdvice: [] as AdvisorAdvice[],
  mentorConfidence: 50,

  // Update v1.8: Hidden Scoring + Project Health Dashboard variables
  judgeDecisionMemory: null as JudgeDecisionMemory | null,
  roastText: "",

  // Update v2.0: Team System variables
  playerName: "",
  playerAvatar: "🧑‍💻",
  team: [] as Teammate[],
  activeTeamChatMoment: null as TeamChatMoment | null,
  teamChatHistory: [] as string[],
  activeTeammateAdvice: {} as Record<string, any>,
  teamAdviceHistory: [] as { teammateId: string; adviceId: string; title: string; stage: string; status: 'applied' | 'rejected'; }[],
  teamContributionLogs: [] as string[],
  teamChatMessages: [] as TeamChatMessage[],
  unreadChatCount: 0,
  teamTimeline: [] as { time: string; event: string; }[],
  triggeredThresholds: [] as string[],
  teammateDecisions: [] as TeammateDecision[],
  lastContextState: {} as Record<string, string>,
  isBackendLocked: false,
  hasCrewVotedThisStage: {} as Record<string, boolean>,
  activeTechTab: 'all',
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
          const isSpeedRun = get().gameMode === 'speedrun';
          const seconds = isSpeedRun ? 180 : DIFFICULTY_TIMERS[difficulty];
          set(
            {
              difficulty,
              globalTotalTime: seconds,
              globalTimeRemaining: seconds,
              timeRemaining: seconds, // Legacy support
              totalTime: seconds,     // Legacy support
              isTimerPaused: true,
              stage: 'teamFormation',
              phase: mapStageToPhase('teamFormation'),
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
            
            // Chaos Event or Team Chat check at transition gates (after 'problemReveal', 'techStack', 'features', 'businessModel')
            const gates: GameStage[] = ['problemReveal', 'techStack', 'features', 'businessModel'];
            if (gates.includes(stage)) {
              const isChaosMagnet = get().activeModifiers.includes('CHAOS_MAGNET') || get().gameMode === 'chaos';
              const triggerChance = isChaosMagnet ? 0.35 : 0.15;
              
              // 1. Team Chat Moment triggers first (20% chance if team size >= 2)
              const hasTeam = get().team.length >= 2;
              if (hasTeam && Math.random() <= 0.20) {
                const moment = getNextTeamChatMoment(get().teamChatHistory, get().team);
                if (moment) {
                  set({
                    activeTeamChatMoment: moment,
                    isTimerPaused: true,
                    stage: next,
                    phase: mapStageToPhase(next),
                    isGameOver: next === 'results',
                    hasFinishedOnce: get().hasFinishedOnce || next === 'results',
                    judgeDecisionMemory: compileDecisionMemory(get()),
                  }, false, 'core/nextStageWithTeamChat');
                  return;
                }
              }

              // 2. Fallback to Chaos Event
              if (Math.random() <= triggerChance) {
                const event = getRandomChaosEvent(get().chaosHistory);
                set(
                  {
                    activeChaosEvent: event,
                    isTimerPaused: true, // pause standard clock
                    stage: next,
                    phase: mapStageToPhase(next),
                    isGameOver: next === 'results',
                    hasFinishedOnce: get().hasFinishedOnce || next === 'results',
                    judgeDecisionMemory: compileDecisionMemory(get()),
                  },
                  false,
                  'core/nextStageWithChaos'
                );
                return;
              }
            }

            set(
              {
                stage: next,
                phase: mapStageToPhase(next),
                isGameOver: next === 'results',
                hasFinishedOnce: get().hasFinishedOnce || next === 'results',
                isTimerPaused: next === 'results' ? true : (stage === 'problemReveal' ? false : get().isTimerPaused),
                judgeDecisionMemory: compileDecisionMemory(get()),
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
              hasFinishedOnce: get().hasFinishedOnce || targetStage === 'results',
              isTimerPaused: targetStage === 'results' ? true : get().isTimerPaused,
            },
            false,
            'core/jumpToStage'
          );
        },

        selectProblem: (problem) =>
          set({ 
            selectedProblem: problem,
            usp: null,
            primaryUsp: null,
            secondaryUsp: null,
            features: [],
            generatedUSPs: [],
            generatedBacklog: [],
            generatedBusinessModels: [],
            generatedAdvisorAdvice: [],
            businessModel: null,
            pitchText: "",
            roastText: "",
          }, false, 'core/selectProblem'),

        setSolutionDirection: (direction) => {
          set({ 
            solutionDirection: direction,
            usp: null,
            primaryUsp: null,
            secondaryUsp: null,
            features: [],
            generatedUSPs: [],
            generatedBacklog: [],
            generatedBusinessModels: [],
            generatedAdvisorAdvice: [],
            businessModel: null,
            pitchText: "",
            roastText: "",
          }, false, 'core/setSolutionDirection');
          get().updateTeammateContext();
        },

        addTechItem: (item) => {
          set(
            (state) => ({
              techStack: [...state.techStack, item],
            }),
            false,
            'core/addTechItem'
          );
          get().triggerTeamChatMessage('tech_add', item);
          get().updateTeammateContext();
        },

        removeTechItem: (itemId) => {
          const item = get().techStack.find(t => t.id === itemId);
          set(
            (state) => ({
              techStack: state.techStack.filter((t) => t.id !== itemId),
            }),
            false,
            'core/removeTechItem'
          );
          if (item) {
            get().triggerTeamChatMessage('tech_remove', item);
          }
          get().updateTeammateContext();
        },

        setUsp: (usp) => {
          set({ usp }, false, 'core/setUsp');
          get().triggerTeamChatMessage('usp_change');
          get().updateTeammateContext();
        },

        setPrimaryUsp: (primaryUsp) => {
          set((state) => {
            const secondary = state.secondaryUsp;
            const blendedUsp = primaryUsp && secondary ? `Primary: ${primaryUsp} | Secondary: ${secondary}` : primaryUsp || secondary || null;
            setTimeout(() => { get().triggerTeamChatMessage('usp_change'); }, 0);
            return { primaryUsp, usp: blendedUsp };
          }, false, 'core/setPrimaryUsp');
          get().updateTeammateContext();
        },

        setSecondaryUsp: (secondaryUsp) => {
          set((state) => {
            const primary = state.primaryUsp;
            const blendedUsp = primary && secondaryUsp ? `Primary: ${primary} | Secondary: ${secondaryUsp}` : primary || secondaryUsp || null;
            setTimeout(() => { get().triggerTeamChatMessage('usp_change'); }, 0);
            return { secondaryUsp, usp: blendedUsp };
          }, false, 'core/setSecondaryUsp');
          get().updateTeammateContext();
        },

        reorderFeatures: (features) => {
          set({ features }, false, 'core/reorderFeatures');
          get().triggerTeamChatMessage('backlog_change');
        },

        setMentorName: (name) => set({ mentorName: name }, false, 'core/setMentorName'),

        setBusinessModel: (model) => {
          set({ businessModel: model }, false, 'core/setBusinessModel');
          get().triggerTeamChatMessage('biz_model_change');
          get().updateTeammateContext();
        },
        
        setPitchText: (text) => set({ pitchText: text }, false, 'core/setPitchText'),

        setPitchDeck: (slides) => {
          const evalRes = evaluatePitchDeck(slides);
          
          // Calculate unblended tech stack pitch potential
          const techStack = get().techStack;
          let techStackPitch = 50;
          techStack.forEach((tech) => {
            const regId = toRegistryId(tech.id);
            const regItem = TECH_REGISTRY.find((item) => item.id === regId);
            if (regItem) {
              techStackPitch += regItem.pitchWeight;
            }
          });
          techStackPitch = Math.max(0, Math.min(techStackPitch, 100));

          // Blended Pitch Score = 40% Tech Stack Pitch + 60% Pitch Deck Score
          const blendedPitch = Math.round((techStackPitch * 0.4) + (evalRes.score * 0.6));

          set({
            pitchDeck: slides,
            pitchDeckScore: evalRes.score,
            deckNarrativeQuality: evalRes.quality,
            deckArchetype: evalRes.archetype,
            score: {
              ...get().score,
              pitch: Math.max(0, Math.min(blendedPitch, 100))
            }
          }, false, 'core/setPitchDeck');
        },

        setGeneratedUSPs: (usps) => set({ generatedUSPs: usps }, false, 'core/setGeneratedUSPs'),
        setGeneratedBacklog: (backlog) => set({ generatedBacklog: backlog }, false, 'core/setGeneratedBacklog'),
        setGeneratedBusinessModels: (models) => set({ generatedBusinessModels: models }, false, 'core/setGeneratedBusinessModels'),
        setGeneratedAdvisorAdvice: (advice) => set({ generatedAdvisorAdvice: advice }, false, 'core/setGeneratedAdvisorAdvice'),
        setRoastText: (roastText) => set({ roastText }, false, 'core/setRoastText'),
        setActiveTechTab: (tab) => set({ activeTechTab: tab }, false, 'core/setActiveTechTab'),

        applyAdvisorAdvice: (adviceId) => {
          const state = get();
          const nextAdvice = state.generatedAdvisorAdvice.map(adv => {
            if (adv.id === adviceId) {
              return { ...adv, status: 'applied' as const };
            }
            return adv;
          });

          const targetAdvice = state.generatedAdvisorAdvice.find(a => a.id === adviceId);
          if (!targetAdvice) return;

          // 1. Apply score modifiers
          const mods = targetAdvice.scoreModifiers;
          const nextScore = { ...state.score };
          if (mods.innovation !== undefined) nextScore.innovation = Math.max(0, Math.min(100, nextScore.innovation + mods.innovation));
          if (mods.execution !== undefined) nextScore.execution = Math.max(0, Math.min(100, nextScore.execution + mods.execution));
          if (mods.design !== undefined) nextScore.design = Math.max(0, Math.min(100, nextScore.design + mods.design));
          if (mods.pitch !== undefined) nextScore.pitch = Math.max(0, Math.min(100, nextScore.pitch + mods.pitch));
          if (mods.bonus !== undefined) nextScore.bonus = nextScore.bonus + mods.bonus;

          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          // 2. Perform side effects
          let nextFeatures = [...state.features];
          let nextTechStack = [...state.techStack];
          let nextPitchDeck = [...state.pitchDeck];
          let nextGeneratedBusinessModels = [...state.generatedBusinessModels];
          let nextUsp = state.usp;

          const actionType = targetAdvice.action?.type;

          if (actionType === 'replace_tech') {
            const fromIds = targetAdvice.action?.payload?.from || [];
            const toId = targetAdvice.action?.payload?.to;
            if (toId) {
              const regItem = TECH_REGISTRY.find(r => r.id === toRegistryId(toId));
              if (regItem) {
                const storeId = toStoreId(regItem.id);
                if (fromIds.length > 0) {
                  nextTechStack = state.techStack.map(t => {
                    if (fromIds.includes(toRegistryId(t.id))) {
                      return {
                        id: storeId,
                        name: regItem.name,
                        icon: 'layers',
                        category: t.category,
                        difficulty: regItem.difficultyScore,
                        synergies: regItem.synergy.map(toStoreId),
                      };
                    }
                    return t;
                  });
                } else {
                  // Fallback Add Tech
                  const alreadyHas = state.techStack.some(t => toRegistryId(t.id) === toRegistryId(toId));
                  if (!alreadyHas) {
                    const categorySlot = regItem.category.toLowerCase().includes('frontend') ? 'frontend' : 
                                         (regItem.category.toLowerCase().includes('database') ? 'database' : 'backend');
                    const newItem: TechItem = {
                      id: storeId,
                      name: regItem.name,
                      icon: 'layers',
                      category: categorySlot,
                      difficulty: regItem.difficultyScore,
                      synergies: regItem.synergy.map(toStoreId),
                    };
                    nextTechStack = [...state.techStack.filter(t => t.category !== categorySlot), newItem];
                  }
                }
              }
            }
          } else if (actionType === 'remove_feature' || actionType === 'reduce_scope') {
            nextFeatures = state.features.filter((f: any) => f.impact !== 'low');
            const highEffortFeat = nextFeatures.find((f: any) => f.effort === 'high');
            if (highEffortFeat) {
              nextFeatures = nextFeatures.filter((f: any) => f.id !== highEffortFeat.id);
            }
          } else if (actionType === 'move_slide') {
            const addSlide = targetAdvice.action?.payload?.addSlide;
            if (addSlide) {
              if (!nextPitchDeck.includes(addSlide)) {
                const tyIdx = nextPitchDeck.indexOf('thank-you');
                if (tyIdx !== -1) {
                  nextPitchDeck.splice(tyIdx, 0, addSlide);
                } else {
                  nextPitchDeck.push(addSlide);
                }
              }
            } else {
              const fromSlide = targetAdvice.action?.payload?.from;
              const toSlide = targetAdvice.action?.payload?.to;
              if (fromSlide && toSlide && nextPitchDeck.includes(fromSlide) && nextPitchDeck.includes(toSlide)) {
                const fromIdx = nextPitchDeck.indexOf(fromSlide);
                const toIdx = nextPitchDeck.indexOf(toSlide);
                if (fromIdx < toIdx) {
                  const temp = nextPitchDeck[fromIdx];
                  nextPitchDeck[fromIdx] = nextPitchDeck[toIdx];
                  nextPitchDeck[toIdx] = temp;
                }
              }
            }
          } else if (actionType === 'focus_segment' || actionType === 'change_biz_model') {
            const segmentText = targetAdvice.action?.payload?.segment || 'Campus Pilot Focus';
            nextGeneratedBusinessModels = state.generatedBusinessModels.map(m => {
              if (m.id === state.businessModel) {
                return {
                  ...m,
                  customerSegment: `${m.customerSegment} (${segmentText})`,
                  pricingStructure: m.pricingStructure.includes("Premium") ? m.pricingStructure : `${m.pricingStructure} // Premium SaaS Admin: $49/user/mo`,
                };
              }
              return m;
            });
          }

          set({
            generatedAdvisorAdvice: nextAdvice,
            score: nextScore,
            features: nextFeatures,
            techStack: nextTechStack,
            pitchDeck: nextPitchDeck,
            generatedBusinessModels: nextGeneratedBusinessModels,
            usp: nextUsp,
          });

          // 3. Regenerate elevator pitch in real time
          const updatedState = get();
          const nextPitch = generateCustomElevatorPitch(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.generatedBusinessModels.find(m => m.id === updatedState.businessModel) || null,
            updatedState.generatedAdvisorAdvice,
            updatedState.techStack
          );

          // 4. Update mentor confidence score
          const nextConfidence = calculateMentorConfidence(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.techStack,
            updatedState.pitchDeck,
            updatedState.businessModel,
            updatedState.generatedBusinessModels,
            updatedState.generatedAdvisorAdvice
          );

          set({ 
            pitchText: nextPitch,
            mentorConfidence: nextConfidence
          });

          // Commented out to eliminate redundant teammate suggestions in chat:
          // const advisorAdvice = updatedState.generatedAdvisorAdvice.find(a => a.id === adviceId);
          // if (advisorAdvice) {
          //   get().triggerTeamChatMessage('mentor_advice', advisorAdvice);
          // }
        },

        rejectAdvisorAdvice: (adviceId) => {
          const state = get();
          const nextAdvice = state.generatedAdvisorAdvice.map(adv => {
            if (adv.id === adviceId) {
              return { ...adv, status: 'rejected' as const };
            }
            return adv;
          });

          set({ generatedAdvisorAdvice: nextAdvice });

          // Regenerate elevator pitch in real time
          const updatedState = get();
          const nextPitch = generateCustomElevatorPitch(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.generatedBusinessModels.find(m => m.id === updatedState.businessModel) || null,
            updatedState.generatedAdvisorAdvice,
            updatedState.techStack
          );

          // Recalculate mentor confidence score
          const nextConfidence = calculateMentorConfidence(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.techStack,
            updatedState.pitchDeck,
            updatedState.businessModel,
            updatedState.generatedBusinessModels,
            updatedState.generatedAdvisorAdvice
          );

          set({ 
            pitchText: nextPitch,
            mentorConfidence: nextConfidence
          });
        },

        resetGame: () =>
          set(
            (state) => ({
              ...initialGameState,
              unlockedAchievements: state.unlockedAchievements, // preserve across playthroughs
              soundEnabled: state.soundEnabled, // preserve sound preferences
              stats: state.stats, // preserve stats
            }),
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

            const { globalTotalTime } = get();
            const thresholds = [0.5, 0.3, 0.1];
            thresholds.forEach(ratio => {
              const targetSeconds = Math.floor(globalTotalTime * ratio);
              if (nextTime === targetSeconds) {
                get().triggerTeamChatMessage('timer_milestone', ratio);
              }
            });
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

        unlockAchievement: (id) =>
          set(
            (state) => {
              if (state.unlockedAchievements.includes(id)) return {};
              return {
                unlockedAchievements: [...state.unlockedAchievements, id],
              };
            },
            false,
            'core/unlockAchievement'
          ),

        toggleSound: () =>
          set(
            (state) => ({
              soundEnabled: !state.soundEnabled,
            }),
            false,
            'core/toggleSound'
          ),

        resolveChaosEvent: (choiceIndex) => {
          const { activeChaosEvent, score, globalTimeRemaining, chaosHistory } = get();
          if (!activeChaosEvent) return;

          const choice = activeChaosEvent.choices[choiceIndex];
          if (!choice) return;

          // Apply score modifiers
          const mods = choice.modifiers;
          
          // Modify score categories immediately
          const nextScore = { ...score };
          if (mods.innovation !== undefined) nextScore.innovation = Math.max(0, Math.min(100, nextScore.innovation + mods.innovation));
          if (mods.execution !== undefined) nextScore.execution = Math.max(0, Math.min(100, nextScore.execution + mods.execution));
          if (mods.design !== undefined) nextScore.design = Math.max(0, Math.min(100, nextScore.design + mods.design));
          if (mods.pitch !== undefined) nextScore.pitch = Math.max(0, Math.min(100, nextScore.pitch + mods.pitch));
          if (mods.bonus !== undefined) nextScore.bonus = nextScore.bonus + mods.bonus;
          
          const total =
            nextScore.innovation +
            nextScore.execution +
            nextScore.design +
            nextScore.pitch +
            nextScore.bonus;
          nextScore.total = total;

          // Adjust time remaining
          let timeOffset = mods.timeOffset || 0;
          if (timeOffset > 0 && get().activeModifiers.includes('SOLO_DEV')) {
            timeOffset = 0; // Solo Dev can't get teammate time boosts
          }
          const nextTime = Math.max(0, globalTimeRemaining + timeOffset);

          // Pushing the event ID to chaosHistory
          const nextHistory = [...chaosHistory, activeChaosEvent.id];
          if (activeChaosEvent.id === 'team-pivot-idea' && choiceIndex === 0) {
            nextHistory.push('team-pivot-executed');
          }

          // If nextTime <= 0, trigger results stage (game over)
          if (nextTime <= 0) {
            set({
              score: nextScore,
              globalTimeRemaining: 0,
              timeRemaining: 0,
              activeChaosEvent: null,
              chaosHistory: nextHistory,
              isTimerPaused: true,
              isGameOver: true,
              stage: 'results',
              phase: mapStageToPhase('results'),
            }, false, 'core/resolveChaosEventGameOver');
          } else {
            set({
              score: nextScore,
              globalTimeRemaining: nextTime,
              timeRemaining: nextTime,
              activeChaosEvent: null,
              chaosHistory: nextHistory,
              isTimerPaused: false, // resume timer
            }, false, 'core/resolveChaosEvent');
          }
          get().updateTeammateContext();
        },

        setGameMode: (mode) => {
          let activeMods: string[] = [];
          if (mode === 'hardcore') {
            activeMods = ['NO_MENTOR', 'HARDCORE_JUDGE'];
          } else if (mode === 'chaos') {
            activeMods = ['CHAOS_MAGNET'];
          }
          set(
            {
              gameMode: mode,
              activeModifiers: activeMods,
              dailyModifier: null,
            },
            false,
            'core/setGameMode'
          );
        },

        initializeDailyChallenge: () => {
          const { problem, difficulty, judge, modifier } = getDailyChallenge();
          const seconds = DIFFICULTY_TIMERS[difficulty];
          set(
            {
              gameMode: 'daily',
              activeModifiers: [modifier.id],
              dailyModifier: modifier.id,
              selectedProblem: problem,
              difficulty,
              currentJudge: judge,
              globalTotalTime: seconds,
              globalTimeRemaining: seconds,
              timeRemaining: seconds,
              totalTime: seconds,
              isTimerPaused: false,
              isGameStarted: true,
              stage: 'solutionDirection',
              phase: mapStageToPhase('solutionDirection'),
            },
            false,
            'core/initializeDailyChallenge'
          );
        },

        updateStats: (finalScore) => {
          const { stats, techStack, chaosHistory } = get();
          const totalRuns = stats.totalRuns + 1;
          const bestScore = Math.max(stats.bestScore, finalScore);
          const averageScore = Math.round(((stats.averageScore * stats.totalRuns + finalScore) / totalRuns) * 10) / 10;
          
          const nextTechUsage = { ...stats.techUsage };
          techStack.forEach((t) => {
            nextTechUsage[t.id] = (nextTechUsage[t.id] || 0) + 1;
          });

          const sortedTechIds = Object.entries(nextTechUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id]) => id);

          const facedNegCount = CHAOS_EVENTS.filter(
            (e) => chaosHistory.includes(e.id) && (e.category === 'technical' || e.category === 'team')
          ).length;

          let chaosRunsFaced = stats.chaosRunsFaced;
          let chaosRunsSurvived = stats.chaosRunsSurvived;
          if (facedNegCount >= 2) {
            chaosRunsFaced += 1;
            if (finalScore >= 70) {
              chaosRunsSurvived += 1;
            }
          }
          const chaosSurvivalRate = chaosRunsFaced > 0 ? Math.round((chaosRunsSurvived / chaosRunsFaced) * 100) : 0;

          let judgeWins = stats.judgeWins;
          if (finalScore >= 70) {
            judgeWins += 1;
          }
          const judgeWinRate = totalRuns > 0 ? Math.round((judgeWins / totalRuns) * 100) : 0;

          const updatedStats = {
            totalRuns,
            bestScore,
            averageScore,
            favoriteStack: sortedTechIds,
            chaosSurvivalRate,
            judgeWinRate,
            chaosRunsFaced,
            chaosRunsSurvived,
            judgeWins,
            techUsage: nextTechUsage,
          };

          set({ stats: updatedStats }, false, 'core/updateStats');
        },

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

        // ─── Team System Actions ───

        setupTeam: (playerName, playerAvatar, teammates) => {
          set({
            playerName,
            playerAvatar,
            team: teammates.map(t => ({
              ...t,
              helpTokenUsed: false,
              contribution: { innovation: 0, execution: 0, design: 0, pitch: 0 }
            }))
          }, false, 'team/setupTeam');
          get().updateTeammateContext();
        },

        useTeammateHelp: (teammateId, currentStage) => {
          const teammate = get().team.find(t => t.id === teammateId);
          if (!teammate || teammate.helpTokenUsed) return;

          const state = get();
          const gating = checkTeammateGating(teammate, state);
          if (gating.isGated) {
            return;
          }

          const updatedTeam = get().team.map(t => 
            t.id === teammateId ? { ...t, helpTokenUsed: true } : t
          );

          const adviceCard = generateTeammateAdvice(teammateId, state);
          if (!adviceCard) return;

          const timestamp = getSimulatedTime(state.globalTimeRemaining, state.globalTotalTime);
          const newMessage: TeamChatMessage = {
            id: teammateId + "-advice-" + Date.now(),
            senderId: teammateId,
            senderName: teammate.name,
            senderAvatar: teammate.avatar,
            text: `Proposed a recommendation: ${adviceCard.title}.`,
            timestamp,
            isRead: false,
            type: 'suggestion',
            adviceDetails: {
              title: adviceCard.title,
              observation: adviceCard.observation,
              concern: adviceCard.concern,
              recommendation: adviceCard.recommendation,
              expectedImpact: adviceCard.expectedImpact,
              tradeoffs: adviceCard.tradeoffs
            },
            discussion: {
              resolved: false,
              choices: [
                {
                  label: "Apply Suggestion",
                  description: adviceCard.recommendation,
                  outcomeText: "Followed teammate recommendation.",
                  modifiers: adviceCard.modifiers || {},
                  action: {
                    type: 'apply_teammate_advice',
                    payload: { teammateId }
                  }
                },
                {
                  label: "Ignore",
                  description: "Trust our own implementation design.",
                  outcomeText: "Teammate recommendation ignored.",
                  modifiers: {},
                  action: {
                    type: 'reject_teammate_advice',
                    payload: { teammateId }
                  }
                }
              ]
            }
          };

          set((s) => ({
            team: updatedTeam,
            activeTeammateAdvice: {
              ...s.activeTeammateAdvice,
              [teammateId]: adviceCard
            },
            teamChatMessages: [...s.teamChatMessages, newMessage],
            unreadChatCount: s.unreadChatCount + 1
          }), false, 'team/useTeammateHelp');

          playNotificationSound();
          get().updateTeammateContext();
        },

        applyTeammateAdvice: (teammateId) => {
          const advice = get().activeTeammateAdvice[teammateId];
          if (!advice) return;

          const mods = advice.modifiers || {};
          const currentScore = get().score;
          
          const nextScore = {
            innovation: Math.max(0, Math.min(100, currentScore.innovation + (mods.innovation || 0))),
            execution: Math.max(0, Math.min(100, currentScore.execution + (mods.execution || 0))),
            design: Math.max(0, Math.min(100, currentScore.design + (mods.design || 0))),
            pitch: Math.max(0, Math.min(100, currentScore.pitch + (mods.pitch || 0))),
            bonus: currentScore.bonus + (mods.bonus || 0),
            total: 0
          };
          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          const updatedTeam = get().team.map(t => {
            if (t.id === teammateId) {
              return {
                ...t,
                contribution: {
                  innovation: t.contribution.innovation + (mods.innovation || 0),
                  execution: t.contribution.execution + (mods.execution || 0),
                  design: t.contribution.design + (mods.design || 0),
                  pitch: t.contribution.pitch + (mods.pitch || 0)
                }
              };
            }
            return t;
          });

          const act = advice.action;
          let extraState: any = {};
          if (act) {
            if (act.type === 'replace_tech') {
              const fromList = act.payload.from;
              const toId = act.payload.to;
              const filteredStack = get().techStack.filter(t => !fromList.includes(toRegistryId(t.id)));
              const regItem = TECH_REGISTRY.find(r => r.id === toRegistryId(toId));
              if (regItem) {
                const activeTemplate = ARCHITECTURE_TEMPLATES[get().solutionDirection || 'web-app'] || ARCHITECTURE_TEMPLATES['web-app'];
                const slot = activeTemplate.slots.find(s => s.compatibleCategories.includes(regItem.category));
                const targetSlotId = slot ? slot.id : regItem.category;
                
                extraState.techStack = [...filteredStack, {
                  id: toStoreId(regItem.id),
                  name: regItem.name,
                  icon: 'layers',
                  category: targetSlotId,
                  difficulty: regItem.difficultyScore,
                  synergies: (regItem.synergy || []).map(toStoreId)
                }];
              }
            } else if (act.type === 'replace_tech_directly') {
              const removeName = act.payload?.removeName;
              const addTech = act.payload?.addTech;
              const filtered = get().techStack.filter(t => !t.name.toLowerCase().includes(removeName.toLowerCase()));
              const regItem = TECH_REGISTRY.find(r => r.name.toLowerCase() === addTech.name.toLowerCase() || r.id === toRegistryId(addTech.id));
              if (regItem) {
                const activeTemplate = ARCHITECTURE_TEMPLATES[get().solutionDirection || 'web-app'] || ARCHITECTURE_TEMPLATES['web-app'];
                const slot = activeTemplate.slots.find(s => s.compatibleCategories.includes(regItem.category));
                const targetSlotId = slot ? slot.id : regItem.category;
                
                extraState.techStack = [...filtered, {
                  id: toStoreId(regItem.id),
                  name: regItem.name,
                  icon: 'layers',
                  category: targetSlotId,
                  difficulty: regItem.difficultyScore,
                  synergies: (regItem.synergy || []).map(toStoreId)
                }];
              } else {
                extraState.techStack = [...filtered, addTech];
              }
            } else if (act.type === 'reduce_scope') {
              if (get().features.length > 0) {
                const sorted = [...get().features].sort((a, b) => {
                  const aVal = a.impact === 'low' ? 0 : a.impact === 'medium' ? 1 : 2;
                  const bVal = b.impact === 'low' ? 0 : b.impact === 'medium' ? 1 : 2;
                  return aVal - bVal;
                });
                const removedId = sorted[0].id;
                extraState.features = get().features.filter(f => f.id !== removedId);
              }
            } else if (act.type === 'change_usp') {
              extraState.usp = act.payload.usp;
            } else if (act.type === 'change_biz_model') {
              extraState.businessModel = act.payload.model;
            } else if (act.type === 'simplify_ai') {
              const complexAi = ['reg-langchain', 'reg-tensorflow', 'reg-pytorch', 'reg-huggingface'];
              const filteredStack = get().techStack.filter(t => !complexAi.includes(toRegistryId(t.id)));
              const geminiItem = TECH_REGISTRY.find(r => r.id === 'reg-gemini');
              if (geminiItem) {
                const activeTemplate = ARCHITECTURE_TEMPLATES[get().solutionDirection || 'web-app'] || ARCHITECTURE_TEMPLATES['web-app'];
                const slot = activeTemplate.slots.find(s => s.compatibleCategories.includes(geminiItem.category));
                const targetSlotId = slot ? slot.id : geminiItem.category;
                
                if (!filteredStack.some(x => x.id === toStoreId(geminiItem.id))) {
                  extraState.techStack = [...filteredStack, {
                    id: toStoreId(geminiItem.id),
                    name: geminiItem.name,
                    icon: 'layers',
                    category: targetSlotId,
                    difficulty: geminiItem.difficultyScore,
                    synergies: (geminiItem.synergy || []).map(toStoreId)
                  }];
                }
              }
            } else if (act.type === 'rewrite_pitch') {
              extraState.pitchText = "A high-impact demonstration of our solution, designed to hook the judges instantly.";
            } else if (act.type === 'reorder_pitch_deck') {
              const currentDeck = get().pitchDeck || [];
              if (currentDeck.includes('demo')) {
                const filtered = currentDeck.filter(s => s !== 'demo');
                const solutionIndex = filtered.indexOf('solution');
                if (solutionIndex !== -1) {
                  filtered.splice(solutionIndex + 1, 0, 'demo');
                } else {
                  filtered.unshift('demo');
                }
                extraState.pitchDeck = filtered;
              }
            } else if (act.type === 'add_tech_directly') {
              const techItem = act.payload?.techItem;
              const techId = act.payload?.techId;
              const targetId = techItem ? techItem.id : techId;
              const targetName = techItem ? techItem.name : '';
              
              const regItem = TECH_REGISTRY.find(r => r.id === toRegistryId(targetId) || (targetName && r.name.toLowerCase() === targetName.toLowerCase()));
              if (regItem) {
                const activeTemplate = ARCHITECTURE_TEMPLATES[get().solutionDirection || 'web-app'] || ARCHITECTURE_TEMPLATES['web-app'];
                const slot = activeTemplate.slots.find(s => s.compatibleCategories.includes(regItem.category));
                const targetSlotId = slot ? slot.id : regItem.category;
                
                const filteredStack = get().techStack.filter(x => toRegistryId(x.id) !== toRegistryId(regItem.id));
                extraState.techStack = [...filteredStack, {
                  id: toStoreId(regItem.id),
                  name: regItem.name,
                  icon: 'layers',
                  category: targetSlotId,
                  difficulty: regItem.difficultyScore,
                  synergies: (regItem.synergy || []).map(toStoreId)
                }];
              } else if (techItem) {
                extraState.techStack = [...get().techStack, techItem];
              }
            } else if (act.type === 'add_slide_directly') {
              const slide = act.payload.slide;
              const currentDeck = get().pitchDeck || [];
              if (!currentDeck.includes(slide)) {
                extraState.pitchDeck = [...currentDeck, slide];
              }
            }
          }

          const nextAdvice = { ...get().activeTeammateAdvice };
          delete nextAdvice[teammateId];

          const currentHistory = get().teamAdviceHistory || [];
          const nextHistory = [...currentHistory, {
            teammateId,
            adviceId: teammateId + '-' + get().stage,
            title: advice.title,
            stage: get().stage,
            status: 'applied' as const,
            modifiers: advice.modifiers
          }];

          const teammateName = get().team.find(t => t.id === teammateId)?.name || "Teammate";
          const newDecision: TeammateDecision = {
            teammateName,
            recommendation: advice.title,
            status: 'accepted',
            resultingChanges: advice.contributionLog || "Applied recommendation."
          };
          const nextDecisions = [...(get().teammateDecisions || []), newDecision];

          const logMsg = advice.contributionLog || "";
          const nextLogs = logMsg ? [...(get().teamContributionLogs || []), logMsg] : (get().teamContributionLogs || []);

          const timestamp = getSimulatedTime(get().globalTimeRemaining, get().globalTotalTime);
          const timelineEvent = `${teammateName}: Applied advice - "${advice.title}".`;
          const nextTimeline = [...(get().teamTimeline || []), {
            time: timestamp,
            event: timelineEvent
          }];

          set({
            score: nextScore,
            team: updatedTeam,
            activeTeammateAdvice: nextAdvice,
            teamAdviceHistory: nextHistory,
            teammateDecisions: nextDecisions,
            teamContributionLogs: nextLogs,
            teamTimeline: nextTimeline,
            ...extraState
          }, false, 'team/applyTeammateAdvice');

          get().triggerTeamChatMessage('teammate_advice', teammateId);
          get().updateTeammateContext();
        },

        rejectTeammateAdvice: (teammateId) => {
          const advice = get().activeTeammateAdvice[teammateId];
          const nextAdvice = { ...get().activeTeammateAdvice };
          delete nextAdvice[teammateId];

          let nextHistory = get().teamAdviceHistory || [];
          let nextDecisions = get().teammateDecisions || [];
          if (advice && !advice.isNotConfident) {
            nextHistory = [...nextHistory, {
              teammateId,
              adviceId: teammateId + '-' + get().stage,
              title: advice.title,
              stage: get().stage,
              status: 'rejected' as const,
              modifiers: advice.modifiers
            }];

            const teammateName = get().team.find(t => t.id === teammateId)?.name || "Teammate";
            const newDecision: TeammateDecision = {
              teammateName,
              recommendation: advice.title || "Teammate Suggestion",
              status: 'rejected',
              resultingChanges: "None."
            };
            nextDecisions = [...nextDecisions, newDecision];
          }

          set({ 
            activeTeammateAdvice: nextAdvice,
            teamAdviceHistory: nextHistory,
            teammateDecisions: nextDecisions
          }, false, 'team/rejectTeammateAdvice');
          get().updateTeammateContext();
        },

        resolveTeamChatMoment: (choiceIndex) => {
          const moment = get().activeTeamChatMoment;
          if (!moment) return;

          const choice = moment.choices[choiceIndex];
          const mods = choice.modifiers || {};
          const currentScore = get().score;

          const nextScore = {
            innovation: Math.max(0, Math.min(100, currentScore.innovation + (mods.innovation || 0))),
            execution: Math.max(0, Math.min(100, currentScore.execution + (mods.execution || 0))),
            design: Math.max(0, Math.min(100, currentScore.design + (mods.design || 0))),
            pitch: Math.max(0, Math.min(100, currentScore.pitch + (mods.pitch || 0))),
            bonus: currentScore.bonus + (mods.bonus || 0),
            total: 0
          };
          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          const nextHistory = [...get().teamChatHistory, moment.id];

          set({
            score: nextScore,
            teamChatHistory: nextHistory,
            activeTeamChatMoment: null
          }, false, 'team/resolveTeamChatMoment');
        },

        resolveTeamChatMessageChoice: (messageId, choiceIndex) => {
          const state = get();
          const message = state.teamChatMessages.find(m => m.id === messageId);
          if (!message || !message.discussion || message.discussion.resolved) return;

          const choice = message.discussion.choices[choiceIndex];
          if (!choice) return;

          const mods = choice.modifiers || {};
          const currentScore = state.score;

          const nextScore = {
            innovation: Math.max(0, Math.min(100, currentScore.innovation + (mods.innovation || 0))),
            execution: Math.max(0, Math.min(100, currentScore.execution + (mods.execution || 0))),
            design: Math.max(0, Math.min(100, currentScore.design + (mods.design || 0))),
            pitch: Math.max(0, Math.min(100, currentScore.pitch + (mods.pitch || 0))),
            bonus: currentScore.bonus + (mods.bonus || 0),
            total: 0
          };
          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          let extraState: any = {};
          const action = choice.action;
          let beforeText = "None.";
          let afterText = "None.";

          if (action) {
            if (action.type === 'apply_teammate_advice') {
              beforeText = "Teammate Advice: Pending.";
              get().applyTeammateAdvice(action.payload.teammateId);
              afterText = "Teammate Advice: Applied.";
            } else if (action.type === 'reject_teammate_advice') {
              beforeText = "Teammate Advice: Pending.";
              get().rejectTeammateAdvice(action.payload.teammateId);
              afterText = "Teammate Advice: Rejected.";
            } else if (action.type === 'apply_mentor_advice') {
              beforeText = "Mentor Suggestions: Pending.";
              get().applyAdvisorAdvice(action.payload.adviceId);
              afterText = "Mentor Suggestions: Applied.";
            } else if (action.type === 'remove_tech') {
              const techId = action.payload?.techId;
              const techName = state.techStack.find(t => t.id === techId)?.name || techId;
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              const newStack = state.techStack.filter(t => t.id !== techId);
              extraState.techStack = newStack;
              afterText = `Tech Stack: ${newStack.map(t => t.name).join(", ") || "None."} (Removed: ${techName})`;
            } else if (action.type === 'remove_tech_name') {
              const name = action.payload?.techName;
              const tech = state.techStack.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              if (tech) {
                const newStack = state.techStack.filter(t => t.id !== tech.id);
                extraState.techStack = newStack;
                afterText = `Tech Stack: ${newStack.map(t => t.name).join(", ") || "None."} (Removed: ${tech.name})`;
              } else {
                afterText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              }
            } else if (action.type === 'simplify_usp') {
              beforeText = `USP: "${state.usp || "None."}"`;
              extraState.usp = "Instant Student Group Matching Platform.";
              afterText = `USP: "Instant Student Group Matching Platform."`;
            } else if (action.type === 'prune_backlog' || action.type === 'reduce_scope_debate') {
              beforeText = `${state.features.length} Features in backlog.`;
              if (state.features.length > 0) {
                const sorted = [...state.features].sort((a, b) => {
                  const aVal = a.impact === 'low' ? 0 : a.impact === 'medium' ? 1 : 2;
                  const bVal = b.impact === 'low' ? 0 : b.impact === 'medium' ? 1 : 2;
                  return aVal - bVal;
                });
                const removed = sorted[0];
                const newFeatures = state.features.filter(f => f.id !== removed.id);
                extraState.features = newFeatures;
                afterText = `${newFeatures.length} Features in backlog (Removed: ${removed.name})`;
              } else {
                afterText = "0 Features in backlog.";
              }
            } else if (action.type === 'build_ambitious_mvp') {
              beforeText = `${state.features.length} Features in backlog.`;
              const advFeature = {
                id: `feat-adv-${Date.now()}`,
                name: "Advanced Real-time Analytics Dashboard",
                description: "High-fidelity database tracking metrics.",
                effort: 'high' as const,
                impact: 'high' as const
              };
              const newFeatures = [...state.features, advFeature];
              extraState.features = newFeatures;
              afterText = `${newFeatures.length} Features in backlog (Added: Advanced Real-time Analytics Dashboard)`;
            } else if (action.type === 'upgrade_architecture') {
              const techId = action.payload?.addedTechId;
              const techName = state.techStack.find(t => t.id === techId)?.name || "Advanced Tech";
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              const vercelItem = TECH_REGISTRY.find(r => r.id === 'reg-vercel');
              let nextStack = [...state.techStack];
              if (vercelItem && !nextStack.some(x => toRegistryId(x.id) === 'reg-vercel')) {
                nextStack.push({
                  id: toStoreId(vercelItem.id),
                  name: vercelItem.name,
                  icon: 'layers',
                  category: vercelItem.category,
                  difficulty: vercelItem.difficultyScore,
                  synergies: (vercelItem.synergy || []).map(toStoreId)
                });
              }
              extraState.techStack = nextStack;
              afterText = `Tech Stack: ${nextStack.map(t => t.name).join(", ")} (Kept: ${techName}, Added: Vercel)`;
            } else if (action.type === 'upgrade_architecture_redis') {
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              const redisItem = TECH_REGISTRY.find(r => r.id === 'reg-redis');
              let nextStack = [...state.techStack];
              if (redisItem && !nextStack.some(x => toRegistryId(x.id) === 'reg-redis')) {
                nextStack.push({
                  id: toStoreId(redisItem.id),
                  name: redisItem.name,
                  icon: 'layers',
                  category: redisItem.category,
                  difficulty: redisItem.difficultyScore,
                  synergies: (redisItem.synergy || []).map(toStoreId)
                });
              }
              extraState.techStack = nextStack;
              afterText = `Tech Stack: ${nextStack.map(t => t.name).join(", ")} (Added: Redis)`;
            } else if (action.type === 'lock_backend_remove') {
              const techId = action.payload?.techId;
              const techName = state.techStack.find(t => t.id === techId)?.name || techId;
              beforeText = `Backend: Flexible, Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              const newStack = state.techStack.filter(t => t.id !== techId);
              extraState.techStack = newStack;
              extraState.isBackendLocked = true;
              afterText = `Backend: Locked, Tech Stack: ${newStack.map(t => t.name).join(", ") || "None."} (Removed: ${techName})`;
            } else if (action.type === 'lock_backend_milestone') {
              beforeText = "Backend: Flexible.";
              extraState.isBackendLocked = true;
              afterText = "Backend: Locked.";
            } else if (action.type === 'focus_ux') {
              beforeText = `Pitch Deck: [${state.pitchDeck.join(", ")}], USP: "${state.usp || "None."}"`;
              const currentDeck = state.pitchDeck || [];
              let newDeck = [...currentDeck];
              if (newDeck.includes('demo')) {
                newDeck = newDeck.filter(s => s !== 'demo');
                const probIdx = newDeck.indexOf('problem');
                if (probIdx !== -1) {
                  newDeck.splice(probIdx + 1, 0, 'demo');
                } else {
                  newDeck.unshift('demo');
                }
              }
              extraState.pitchDeck = newDeck;
              extraState.usp = "Polished UI-first Landing Interface.";
              afterText = `Pitch Deck: [${newDeck.join(", ")}], USP: "Polished UI-first Landing Interface."`;
            } else if (action.type === 'focus_market') {
              beforeText = `Pitch Deck: [${state.pitchDeck.join(", ")}], Business Model: "${state.businessModel || "None."}"`;
              const currentDeck = state.pitchDeck || [];
              let newDeck = [...currentDeck];
              if (newDeck.includes('business')) {
                newDeck = newDeck.filter(s => s !== 'business');
                newDeck.unshift('business');
              }
              extraState.pitchDeck = newDeck;
              extraState.businessModel = "Emphasized Enterprise SaaS Model.";
              afterText = `Pitch Deck: [${newDeck.join(", ")}], Business Model: Emphasized Enterprise SaaS Model.`;
            } else if (action.type === 'enterprise_first') {
              beforeText = `Business Model: ${state.businessModel || "None."}`;
              extraState.businessModel = "Enterprise B2B Subscription";
              afterText = "Business Model: Enterprise B2B Subscription.";
            } else if (action.type === 'freemium_first') {
              beforeText = `Business Model: ${state.businessModel || "None."}`;
              extraState.businessModel = "Freemium Tier Model";
              afterText = "Business Model: Freemium Tier Model.";
            } else if (action.type === 'replace_tech_directly') {
              const removeName = action.payload?.removeName;
              const addTech = action.payload?.addTech;
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              const filtered = state.techStack.filter(t => !t.name.toLowerCase().includes(removeName.toLowerCase()));
              const newStack = [...filtered, addTech];
              extraState.techStack = newStack;
              afterText = `Tech Stack: ${newStack.map(t => t.name).join(", ") || "None."} (Replaced ${removeName} with ${addTech.name})`;
            } else if (action.type === 'add_tech_directly') {
              const techItem = action.payload?.techItem;
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              if (techItem && !state.techStack.some(t => t.name.toLowerCase() === techItem.name.toLowerCase())) {
                const newStack = [...state.techStack, techItem];
                extraState.techStack = newStack;
                afterText = `Tech Stack: ${newStack.map(t => t.name).join(", ") || "None."} (Added ${techItem.name})`;
              } else {
                afterText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              }
            } else if (action.type === 'reorder_pitch_slides') {
              beforeText = `Pitch Deck: [${state.pitchDeck.join(", ") || "None."}]`;
              const currentDeck = state.pitchDeck || [];
              let newDeck = [...currentDeck];
              if (newDeck.includes('demo')) {
                newDeck = newDeck.filter(s => s !== 'demo');
                const probIdx = newDeck.indexOf('problem');
                if (probIdx !== -1) {
                  newDeck.splice(probIdx + 1, 0, 'demo');
                } else {
                  newDeck.unshift('demo');
                }
              }
              extraState.pitchDeck = newDeck;
              afterText = `Pitch Deck: [${newDeck.join(", ") || "None."}] (Demo slide moved after Problem slide)`;
            } else if (action.type === 'merge_backlog') {
              beforeText = `${state.features.length} Features in backlog.`;
              const uniqueFeatures: any[] = [];
              const seenNames = new Set<string>();
              state.features.forEach(f => {
                const normName = f.name.toLowerCase().trim();
                if (!seenNames.has(normName)) {
                  seenNames.add(normName);
                  uniqueFeatures.push(f);
                }
              });
              if (uniqueFeatures.length === state.features.length && state.features.length > 0) {
                const sorted = [...state.features].sort((a, b) => {
                  const aVal = a.impact === 'low' ? 0 : a.impact === 'medium' ? 1 : 2;
                  const bVal = b.impact === 'low' ? 0 : b.impact === 'medium' ? 1 : 2;
                  return aVal - bVal;
                });
                uniqueFeatures.pop();
              }
              extraState.features = uniqueFeatures;
              afterText = `${uniqueFeatures.length} Features in backlog (Merged and simplified backlog items)`;
            } else if (action.type === 'simplify_architecture') {
              beforeText = `Tech Stack: ${state.techStack.map(t => t.name).join(", ") || "None."}`;
              if (state.techStack.length > 0) {
                const sorted = [...state.techStack].sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
                const highestDiff = sorted[0];
                const newStack = state.techStack.filter(t => t.id !== highestDiff.id);
                extraState.techStack = newStack;
                afterText = `Tech Stack: ${newStack.map(t => t.name).join(", ") || "None."} (Removed complex item: ${highestDiff.name})`;
              } else {
                afterText = `Tech Stack: None.`;
              }
            } else if (action.type === 'upgrade_business_model') {
              const model = action.payload?.model || "Enterprise B2B SaaS";
              beforeText = `Business Model: ${state.businessModel || "None."}`;
              extraState.businessModel = model;
              afterText = `Business Model: ${model} (Upgraded monetization strategy)`;
            }
          }

          const changeSummary = {
            before: beforeText,
            after: afterText,
            reason: choice.outcomeText || choice.description,
            senderName: message.senderName
          };

          const updatedMessages = state.teamChatMessages.map(m => {
            if (m.id === messageId) {
              return {
                ...m,
                changeSummary,
                discussion: m.discussion ? {
                  ...m.discussion,
                  resolved: true,
                  chosenIndex: choiceIndex
                } : undefined
              };
            }
            return m;
          });

          // Log team decisions & ownership
          const newDecision: TeammateDecision = {
            teammateName: message.senderName,
            recommendation: choice.label,
            status: choice.label.toLowerCase().includes("ignore") ? 'rejected' : 'accepted',
            resultingChanges: `${choice.outcomeText} (Before: ${beforeText} -> After: ${afterText})`
          };
          const nextDecisions = [...(state.teammateDecisions || []), newDecision];

          const timestamp = getSimulatedTime(state.globalTimeRemaining, state.globalTotalTime);
          const timelineEvent = `${message.senderName}: Resolved debate - "${choice.label}" -> ${choice.outcomeText}`;
          const nextTimeline = [...state.teamTimeline, {
            time: timestamp,
            event: timelineEvent
          }];

          set({
            score: nextScore,
            teamChatMessages: updatedMessages,
            teammateDecisions: nextDecisions,
            teamTimeline: nextTimeline,
            ...extraState
          }, false, 'team/resolveTeamChatMessageChoice');
          get().updateTeammateContext();
        },

        clearUnreadChatCount: () => {
          set({ unreadChatCount: 0 }, false, 'team/clearUnreadChatCount');
        },

        triggerTeamChatMessage: (event, payload) => {
          const state = get();
          const team = state.team;
          if (team.length === 0) return;

          const defaultTeammate = getTeammateForEvent(team, event);
          const timestamp = getSimulatedTime(state.globalTimeRemaining, state.globalTotalTime);

          let messageText = "";
          let debateChoices: any[] | undefined = undefined;
          let msgType: 'info' | 'suggestion' | 'warning' | 'disagreement' | 'contribution' | 'action_completed' | 'waiting' = 'info';
          let isSilent = true;

          const techDifficultySum = state.techStack.reduce((sum, t) => sum + (t.difficulty || 0), 0);
          const highEffortFeaturesCount = state.features.filter(f => f.effort === 'high').length;
          const feasibility = Math.max(10, Math.min(100, 95 - (techDifficultySum * 3.5) - (highEffortFeaturesCount * 12)));
          const hasUsp = !!state.usp;
          const hasBizModel = !!state.businessModel;
          const pitchVal = state.pitchDeckScore || state.score.pitch || 45;
          const viability = Math.round((hasUsp ? 30 : 0) + (hasBizModel ? 30 : 0) + (pitchVal * 0.4));

          const category = state.selectedProblem?.category || "general";
          const solution = state.solutionDirection || "solution";
          const techNames = state.techStack.map(t => t.name).join(", ");
          const uspText = state.usp || "no USP selected yet";
          const bizModel = state.businessModel || "no business model yet";

          // Role-based teammate lookup helpers — always finds by role, falls back to defaultTeammate
          const getTeammateByRole = (cat: 'backend' | 'designer' | 'frontend' | 'ai' | 'strategist' | 'pitch' | 'researcher' | 'general') => {
            const found = team.find(t => getRoleCategory(t.role || '') === cat);
            return found || defaultTeammate;
          };

          const backendMate = getTeammateByRole('backend');
          const designerMate = getTeammateByRole('designer') || getTeammateByRole('frontend');
          const aiMate = getTeammateByRole('ai');
          const strategistMate = getTeammateByRole('strategist');

          // Retrieve previous choices for context memory
          const decisions = state.teammateDecisions || [];
          const hasPreviouslyRejectedDatabase = decisions.some(d => d.status === 'rejected' && d.recommendation.toLowerCase().includes("database"));
          const hasPreviouslyAcceptedUX = decisions.some(d => d.status === 'accepted' && d.recommendation.toLowerCase().includes("ux"));

          let teammateToUse = defaultTeammate;

          if (event === 'tech_add') {
            const addedTech = payload as TechItem;
            if (!addedTech) return;
            const techNamesList = state.techStack.map(t => t.name.toLowerCase());
            const registryIds = state.techStack.map(t => toRegistryId(t.id));

            // Gather specific compatibility metrics
            const hasNext = registryIds.includes('reg-next') || techNamesList.includes('next.js');
            const hasVercel = registryIds.includes('reg-vercel') || techNamesList.includes('vercel');
            const hasPostgres = registryIds.includes('reg-postgres') || techNamesList.includes('postgresql');
            const hasClerk = registryIds.includes('reg-clerk') || techNamesList.includes('clerk');

            const hasNode = registryIds.includes('reg-node') || techNamesList.includes('node.js') || techNamesList.includes('express');
            const hasGo = registryIds.includes('reg-go') || techNamesList.includes('go');
            const hasSpring = registryIds.includes('reg-springboot') || techNamesList.includes('spring boot');

            const hasGemini = registryIds.includes('reg-gemini') || techNamesList.includes('gemini api');
            const hasOpenAI = registryIds.includes('reg-openai') || techNamesList.includes('openai');
            const hasClaude = registryIds.includes('reg-claude') || techNamesList.includes('claude');

            const hasFirebase = registryIds.includes('reg-firebase') || techNamesList.includes('firebase');
            const hasAWS = registryIds.includes('reg-aws') || techNamesList.includes('aws');
            const hasRailway = registryIds.includes('reg-railway') || techNamesList.includes('railway');

            // Count AI providers
            let aiCount = 0;
            if (hasGemini) aiCount++;
            if (hasOpenAI) aiCount++;
            if (hasClaude) aiCount++;

            // Count Hostings
            let hostCount = 0;
            if (hasFirebase) hostCount++;
            if (hasAWS) hostCount++;
            if (hasRailway) hostCount++;
            if (hasVercel) hostCount++;

            // Determine matching role for this technology
            const techCat = (addedTech.category || "").toLowerCase();
            let requiredRoleCat: 'backend' | 'designer' | 'frontend' | 'ai' | 'strategist' | 'pitch' | 'researcher' | null = null;
            
            if (techCat === 'database' || techCat === 'backend' || techCat === 'hosting' || techCat === 'devops' || techCat === 'hosting / infra') {
              requiredRoleCat = 'backend';
            } else if (techCat === 'ai / ml' || techCat === 'ai') {
              requiredRoleCat = 'ai';
            } else if (techCat === 'frontend' || techCat === 'ui/ux' || techCat === 'ui') {
              requiredRoleCat = 'designer'; // product designer or frontend
            } else if (techCat === 'library' || techCat === 'css' || techCat === 'styling') {
              requiredRoleCat = 'frontend';
            }

            // Find a real teammate in the crew who has the matching role category
            const matchingTeammate = team.find(t => {
              const teammateCat = getRoleCategory(t.role || '');
              if (requiredRoleCat === 'designer') {
                return teammateCat === 'designer' || teammateCat === 'frontend';
              }
              if (requiredRoleCat === 'frontend') {
                return teammateCat === 'frontend' || teammateCat === 'designer';
              }
              return teammateCat === requiredRoleCat;
            });

            // If there's no matching teammate for this technology category in the crew, we DO NOT post generic messages!
            if (!matchingTeammate) {
              messageText = "";
              return;
            }

            teammateToUse = matchingTeammate;

            // 1. CONFLICTING STACKS (any 3 backends)
            const backends = state.techStack.filter(t => t.category === 'Backend' || t.category === 'backend');
            if (backends.length >= 3 || (hasNode && hasGo && hasSpring)) {
              messageText = `Wait, what are we building for "${state.selectedProblem?.title || "our project"}"? We now have three backend philosophies competing with each other in the codebase. Let's simplify this.`;
              msgType = 'disagreement';
              isSilent = false;
              debateChoices = [
                {
                  label: "Simplify Architecture",
                  description: "Remove the most complex backend framework to avoid competition.",
                  outcomeText: "Simplified backend architecture by removing complex systems.",
                  modifiers: { execution: 15, innovation: -3 },
                  action: { type: 'simplify_architecture' }
                },
                {
                  label: "Ignore",
                  description: "Keep all three backend philosophies in the codebase.",
                  outcomeText: "Proceeded with multi-philosophy backend chaos.",
                  modifiers: { execution: -12 }
                }
              ];
            }
            // 2. MERN + GO
            else if (hasGo && hasNode) {
              messageText = `Why are we introducing Go for "${state.selectedProblem?.title || "our project"}" after already committing to Node.js? Stacking both JavaScript and Go creates massive runtime friction.`;
              msgType = 'disagreement';
              isSilent = false;
              debateChoices = [
                {
                  label: "Remove Go",
                  description: "Stick to Node.js backend environment.",
                  outcomeText: "Removed Go. Committed to Node.js backend environment.",
                  modifiers: { execution: 12, innovation: -4 },
                  action: { type: 'remove_tech_name', payload: { techName: "Go" } }
                },
                {
                  label: "Keep Both",
                  description: "Proceed with both Node.js and Go in stack.",
                  outcomeText: "Proceeded with both Node.js and Go systems.",
                  modifiers: { execution: -8 }
                }
              ];
            }
            // 3. MULTIPLE MODEL PROVIDERS (Gemini + OpenAI)
            else if (aiCount >= 2) {
              messageText = `We now have ${aiCount} AI providers in our stack for "${state.selectedProblem?.title || "our project"}". That's not AI-powered, that's just duplicate dependencies!`;
              msgType = 'warning';
              isSilent = false;
              debateChoices = [
                {
                  label: "Consolidate under Gemini",
                  description: "Remove other AI APIs and rely solely on Google Gemini.",
                  outcomeText: "Consolidated AI model pipeline under Gemini API.",
                  modifiers: { execution: 10, innovation: -2 },
                  action: { type: 'remove_tech_name', payload: { techName: hasOpenAI ? "OpenAI" : "Claude" } }
                },
                {
                  label: "Ignore",
                  description: "Retain multiple model provider SDKs.",
                  outcomeText: "Proceeded with redundant AI provider endpoints.",
                  modifiers: { execution: -6, bonus: 4 }
                }
              ];
            }
            // 4. OVER-HOSTING
            else if (hostCount >= 3) {
              messageText = `We're building a hackathon MVP, not a global multi-region cloud. Multiple hosting platforms for "${state.selectedProblem?.title || "our project"}" is overkill.`;
              msgType = 'warning';
              isSilent = false;
              debateChoices = [
                {
                  label: "Simplify Hosting",
                  description: "Remove the heavy AWS infrastructure layer.",
                  outcomeText: "Removed AWS from hosting options to simplify deployment pipeline.",
                  modifiers: { execution: 12, design: 2 },
                  action: { type: 'remove_tech_name', payload: { techName: "AWS" } }
                },
                {
                  label: "Ignore",
                  description: "Attempt to deploy across all hosting environments.",
                  outcomeText: "Proceeded with multi-cloud hosting deployment complexity.",
                  modifiers: { execution: -10 }
                }
              ];
            }
            // 5. CLEAN FULL STACK (Next.js + Vercel + PostgreSQL)
            else if (hasNext && hasVercel && hasPostgres) {
              messageText = `This architecture looks extremely clean for "${state.selectedProblem?.title || "our project"}". Next.js + Vercel + PostgreSQL is a highly robust and scalable production stack. Let's lock this in!`;
              msgType = 'contribution';
              isSilent = false;
            }
            // 6. Next.js + Vercel deployment synergy
            else if (hasNext && hasVercel) {
              messageText = `Next.js + Vercel is an outstanding combo for "${state.selectedProblem?.title || "our project"}". Instant serverless endpoints and preview URLs will make our demo stand out to the judges.`;
              msgType = 'contribution';
              isSilent = false;
            }
            // 7. Highly personalized role-appropriate tech addition reaction
            else {
              const projName = state.selectedProblem?.title || "our prototype";
              if (requiredRoleCat === 'backend') {
                messageText = `I see we added ${addedTech.name} to the backend stack. This fits perfectly for supporting data transactions and model persistence in ${projName}. Let's get it wired up!`;
              } else if (requiredRoleCat === 'ai') {
                messageText = `Adding ${addedTech.name} is a huge move for ${projName}! This gives us the semantic and cognitive capabilities we need to blow the judges away with AI features.`;
              } else if (requiredRoleCat === 'designer' || requiredRoleCat === 'frontend') {
                messageText = `Awesome, ${addedTech.name} added! I'll leverage this to craft a beautiful, fluid, and highly interactive interface for ${projName}.`;
              } else {
                messageText = `Let's integrate ${addedTech.name} into ${projName}. This will help keep our tech implementation details highly aligned.`;
              }
              msgType = 'info';
              isSilent = false; // Let the player see this beautiful personalized message!
            }
          } else if (event === 'tech_remove') {
            const removedTech = payload as TechItem;
            if (!removedTech) return;
            const techCat = (removedTech.category || "").toLowerCase();
            let requiredRoleCat: 'backend' | 'designer' | 'frontend' | 'ai' | 'strategist' | 'pitch' | 'researcher' | null = null;
            if (techCat === 'database' || techCat === 'backend' || techCat === 'hosting' || techCat === 'devops' || techCat === 'hosting / infra') {
              requiredRoleCat = 'backend';
            } else if (techCat === 'ai / ml' || techCat === 'ai') {
              requiredRoleCat = 'ai';
            } else if (techCat === 'frontend' || techCat === 'ui/ux' || techCat === 'ui') {
              requiredRoleCat = 'designer';
            } else if (techCat === 'library' || techCat === 'css' || techCat === 'styling') {
              requiredRoleCat = 'frontend';
            }

            const matchingTeammate = team.find(t => {
              const teammateCat = getRoleCategory(t.role || '');
              if (requiredRoleCat === 'designer') return teammateCat === 'designer' || teammateCat === 'frontend';
              if (requiredRoleCat === 'frontend') return teammateCat === 'frontend' || teammateCat === 'designer';
              return teammateCat === requiredRoleCat;
            });

            if (!matchingTeammate) {
              messageText = "";
              return;
            }

            teammateToUse = matchingTeammate;
            messageText = `Removed ${removedTech.name} from the stack. Simplifying our dev setup should help with feasibility on "${state.selectedProblem?.title || "our project"}".`;
            msgType = 'info';
            isSilent = false;
          } else if (event === 'backlog_change') {
            const highEffort = state.features.filter(f => f.effort === 'high');
            if (highEffort.length >= 2) {
              messageText = `Our backlog has multiple high-effort features: ${highEffort.map(f => f.name).join(", ")}. This will destroy our demo readiness. Let's prune our scope.`;
              msgType = 'warning';
              isSilent = false;
              debateChoices = [
                {
                  label: "Apply Suggestion",
                  description: "Trim high complexity features to build a clean working demo.",
                  outcomeText: "Scope trimmed. Pruned high priority backlog features.",
                  modifiers: { execution: 12, innovation: -5 },
                  action: { type: 'reduce_scope_debate' }
                },
                {
                  label: "Ignore",
                  description: "Keep all features and build an ambitious MVP.",
                  outcomeText: "Proceeded with large scope MVP features backlog.",
                  modifiers: { execution: -10 }
                }
              ];
              teammateToUse = designerMate;
            } else {
              messageText = `Backlog updated. We have ${state.features.length} features prioritized. Let's make sure we can ship all of them.`;
              msgType = 'info';
              isSilent = true;
              teammateToUse = designerMate;
            }
          } else if (event === 'usp_change') {
            // Unnecessary automated spams disabled per team lead request.
            // Explicit votes and strategist consulting are now user-triggered.
            messageText = "";
            return;
          } else if (event === 'biz_model_change') {
            // Unnecessary automated spams disabled per team lead request.
            messageText = "";
            return;
          } else if (event === 'mentor_advice') {
            const advice = payload as AdvisorAdvice;
            if (!advice) return;
            messageText = `Our mentor suggested: "${advice.title}". Tradeoffs: ${advice.tradeoffs}. Should we listen to them?`;
            msgType = 'suggestion';
            isSilent = false;
            debateChoices = [
              {
                label: "Apply Suggestion",
                description: "Follow the mentor's recommendation.",
                outcomeText: `Applied mentor advice for ${advice.title}.`,
                modifiers: advice.scoreModifiers,
                action: { type: 'apply_mentor_advice', payload: { adviceId: advice.id } }
              },
              {
                label: "Ignore",
                description: "Trust our own implementation design.",
                outcomeText: `Ignored mentor advice for ${advice.title}.`,
                modifiers: { bonus: -2 }
              }
            ];
            teammateToUse = aiMate;
          } else if (event === 'teammate_advice') {
            // Use the teammate who just gave the advice (passed as payload)
            const advisingTeammate = payload ? team.find(t => t.id === payload) || defaultTeammate : defaultTeammate;
            messageText = `Done — my advice has been applied. Let's review the changes before we proceed.`;
            msgType = 'action_completed';
            isSilent = false;
            teammateToUse = advisingTeammate;
          } else if (event === 'timer_milestone') {
            const ratio = payload as number;
            const pct = Math.round(ratio * 100);
            const triggeredKey = `timer-${pct}`;
            if (state.triggeredThresholds.includes(triggeredKey)) return;

            if (pct === 50) {
              messageText = `We are halfway through the hackathon. How is our backend demo looking? We have selected: ${techNames || "no technologies"}. Let's lock it down.`;
              msgType = 'warning';
              isSilent = false;
              debateChoices = [
                {
                  label: "Lock Backend",
                  description: "Freeze backend to prevent volatility.",
                  outcomeText: "Locked backend architecture.",
                  modifiers: { execution: 10 },
                  action: { type: 'lock_backend_milestone' }
                },
                {
                  label: "Upgrade Architecture",
                  description: "Swap stack or add Redis for database speed.",
                  outcomeText: "Upgraded stack with Redis caching layer.",
                  modifiers: { innovation: 5, execution: -4 },
                  action: { type: 'upgrade_architecture_redis' }
                }
              ];
              teammateToUse = backendMate;
            } else if (pct === 30) {
              messageText = `Only 30% time remaining. We should make sure we structure our pitch deck properly. Slide count: ${state.pitchDeck.length}.`;
              msgType = 'warning';
              isSilent = false;
              debateChoices = [
                {
                  label: "Focus UX",
                  description: "Prioritize layout polish and slide drafting.",
                  outcomeText: "Reordered slide flow to demo first and simplified USP wording.",
                  modifiers: { pitch: 12 },
                  action: { type: 'focus_ux' }
                },
                {
                  label: "Focus Market",
                  description: "Focus on commercial validation and pricing metrics.",
                  outcomeText: "Emphasized business slides and pricing model.",
                  modifiers: { design: 8, execution: 4 },
                  action: { type: 'focus_market' }
                }
              ];
              teammateToUse = designerMate;
            } else if (pct === 10) {
              messageText = `Final stretch. 10% time remaining. Stop all coding. We need to deploy the demo and practice the pitch.`;
              msgType = 'warning';
              isSilent = false;
              debateChoices = [
                {
                  label: "Focus Market",
                  description: "Practice the pitch slides and run scripts.",
                  outcomeText: "Emphasized business slides and pricing model.",
                  modifiers: { pitch: 10 },
                  action: { type: 'focus_market' }
                },
                {
                  label: "Lock Backend",
                  description: "Push one last hotfix and lock state.",
                  outcomeText: "Locked backend architecture and pushed hotfix.",
                  modifiers: { execution: 10, pitch: -4 },
                  action: { type: 'lock_backend_milestone' }
                }
              ];
              teammateToUse = strategistMate;
            }

            set({
              triggeredThresholds: [...state.triggeredThresholds, triggeredKey]
            }, false, 'team/triggerTimerThreshold');
          }

          if (!messageText) return;

          const newMessage: TeamChatMessage = {
            id: `chat-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderId: teammateToUse.id,
            senderName: teammateToUse.name,
            senderAvatar: teammateToUse.avatar,
            text: messageText,
            timestamp,
            isRead: isSilent,
            type: msgType,
            discussion: debateChoices ? {
              resolved: false,
              choices: debateChoices
            } : undefined
          };

          set({
            teamChatMessages: [...state.teamChatMessages, newMessage],
            unreadChatCount: isSilent ? state.unreadChatCount : state.unreadChatCount + 1
          }, false, 'team/triggerTeamChatMessage');

          if (!isSilent) {
            playNotificationSound();
          }
        },

        updateTeammateContext: () => {
          const state = get();
          const { teamChatMessages, lastContextState } = getUpdatedContextMessages(state);
          set({ teamChatMessages, lastContextState }, false, 'team/updateTeammateContext');
        },

        triggerCrewVote: (voteType, targetId, voteAs) => {
          const state = get();
          const team = state.team;
          if (team.length === 0) return;

          const timestamp = getSimulatedTime(state.globalTimeRemaining, state.globalTotalTime);

          // Get details of what we are voting on
          let subjectTitle = "";
          let subjectDesc = "";
          if (voteType === 'usp') {
            const activeUsp = state.generatedUSPs.find(u => u.id === targetId || u.name === targetId || u.key === targetId) || state.generatedUSPs[0];
            subjectTitle = activeUsp ? activeUsp.name : (state.usp || state.primaryUsp || "No USP Selected");
            subjectDesc = voteAs === 'secondary' ? "Secondary USP" : "Primary USP";
          } else {
            const activeModel = state.generatedBusinessModels.find(m => m.id === targetId || m.name === targetId) || state.generatedBusinessModels.find(m => m.id === state.businessModel) || state.generatedBusinessModels[0];
            subjectTitle = activeModel ? activeModel.name : "No Business Model Selected";
            subjectDesc = "Business Model Strategy";
          }

          let yesCount = 0;
          let noCount = 0;

          const votesList = team.map(t => {
            const cat = getRoleCategory(t.role || '');
            let vote = 'YES';
            let rationale = "";

            if (voteType === 'usp') {
              if (cat === 'backend') {
                vote = state.techStack.length > 2 ? 'YES' : 'NO';
                rationale = vote === 'YES' 
                  ? "Execution feasibility looks excellent; our database structures support this value proposition cleanly!" 
                  : "We have very few backend tools selected. Implementing this USP will require massive database overhead.";
              } else if (cat === 'designer') {
                vote = 'YES';
                rationale = "User feedback strongly validates this advantage! Onboarding flow will be super simple.";
              } else if (cat === 'ai') {
                vote = state.techStack.some(x => x.category === 'AI / ML') ? 'YES' : 'NO';
                rationale = vote === 'YES'
                  ? "Excellent synergy with our Gemini API endpoints. This is a true differentiator!"
                  : "We aren't using any AI tools. Calling this a unique advantage feels speculative.";
              } else if (cat === 'strategist') {
                vote = 'YES';
                rationale = "Strong alignment. This USP sets up a very high entry barrier for competitors.";
              } else {
                vote = 'YES';
                rationale = "Morale is high. This gives our pitch presentation a solid, memorable hook!";
              }
            } else {
              // businessModel
              if (cat === 'backend') {
                vote = 'YES';
                rationale = "Operational and hosting expenses align cleanly with this revenue framework.";
              } else if (cat === 'designer') {
                vote = 'YES';
                rationale = "Frictionless flow. Charging models don't block the onboarding UX.";
              } else if (cat === 'strategist') {
                vote = subjectTitle.toLowerCase().includes("saas") || subjectTitle.toLowerCase().includes("subscription") ? 'YES' : 'NO';
                rationale = vote === 'YES'
                  ? "Outstanding unit economics! Recurring B2B revenue is exactly what judges want to see."
                  : "A one-time transactional model has poor lifetime value (LTV). SaaS would be much more lucrative.";
              } else {
                vote = 'YES';
                rationale = "Great story. Gives the business viability pitch slides real credibility.";
              }
            }

            if (vote === 'YES') yesCount++; else noCount++;

            return {
              name: t.name,
              role: t.role || "",
              avatar: t.avatar,
              vote,
              rationale
            };
          });

          const totalVotes = team.length;
          const consensusPct = Math.round((yesCount / totalVotes) * 100);
          const approved = yesCount > noCount;

          const pollDetails = {
            subjectTitle,
            subjectDesc,
            voteAs,
            yesCount,
            noCount,
            consensusPct,
            approved,
            votesList
          };

          const newMessage: TeamChatMessage = {
            id: `crew-vote-${Date.now()}`,
            senderId: "team-lead",
            senderName: "Crew Poll Bot",
            senderAvatar: "🗳️",
            text: `🗳️ Crew Vote initiated on: ${subjectTitle}`,
            timestamp,
            isRead: false,
            type: 'poll',
            pollDetails
          };

          // Apply a small score boost if crew approves!
          let scoreBonus = 0;
          let extraState: any = {};
          if (approved) {
            scoreBonus = 5;
            const currentScore = state.score;
            extraState.score = {
              ...currentScore,
              bonus: currentScore.bonus + scoreBonus,
              total: currentScore.innovation + currentScore.execution + currentScore.design + currentScore.pitch + currentScore.bonus + scoreBonus
            };

            // Auto-apply USP or Business Model if approved!
            if (voteType === 'usp') {
              if (voteAs === 'secondary') {
                extraState.secondaryUsp = subjectTitle;
              } else {
                extraState.primaryUsp = subjectTitle;
                extraState.usp = subjectTitle;
              }
            } else {
              const activeModel = state.generatedBusinessModels.find(m => m.id === targetId || m.name === targetId);
              if (activeModel) {
                extraState.businessModel = activeModel.id;
              }
            }
          }

          set(s => ({
            teamChatMessages: [...s.teamChatMessages, newMessage],
            unreadChatCount: s.unreadChatCount + 1,
            hasCrewVotedThisStage: {
              ...s.hasCrewVotedThisStage,
              [state.stage]: true
            },
            ...extraState
          }), false, 'team/triggerCrewVote');

          playNotificationSound();
        },
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
          primaryUsp: state.primaryUsp,
          secondaryUsp: state.secondaryUsp,
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
          hasFinishedOnce: state.hasFinishedOnce,
          unlockedAchievements: state.unlockedAchievements,
          soundEnabled: state.soundEnabled,
          activeChaosEvent: state.activeChaosEvent,
          chaosHistory: state.chaosHistory,
          gameMode: state.gameMode,
          activeModifiers: state.activeModifiers,
          dailyModifier: state.dailyModifier,
          stats: state.stats,
          generatedUSPs: state.generatedUSPs,
          generatedBacklog: state.generatedBacklog,
          generatedBusinessModels: state.generatedBusinessModels,
          generatedAdvisorAdvice: state.generatedAdvisorAdvice,
          roastText: state.roastText,
          playerName: state.playerName,
          playerAvatar: state.playerAvatar,
          team: state.team,
          activeTeamChatMoment: state.activeTeamChatMoment,
          teamChatHistory: state.teamChatHistory,
          activeTeammateAdvice: state.activeTeammateAdvice,
          teamAdviceHistory: state.teamAdviceHistory,
          teamContributionLogs: state.teamContributionLogs,
          teamChatMessages: state.teamChatMessages,
          unreadChatCount: state.unreadChatCount,
          teamTimeline: state.teamTimeline,
          triggeredThresholds: state.triggeredThresholds,
          teammateDecisions: state.teammateDecisions,
          lastContextState: state.lastContextState,
          isBackendLocked: state.isBackendLocked,
          hasCrewVotedThisStage: state.hasCrewVotedThisStage,
          activeTechTab: state.activeTechTab,
        }),
      }
    ),
    { name: 'HackathonSimulatorStore' }
  )
);

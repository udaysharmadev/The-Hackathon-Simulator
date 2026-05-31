/**
 * @file Curated Database of exactly 10 premium, highly realistic Chaos Events for Update v1.2.
 * Includes authentic trade-offs affecting score categories and global timer pressure.
 *
 * @module data/chaosEvents
 */

import type { ChaosEvent } from "@/types/game";

export const CHAOS_EVENTS: ChaosEvent[] = [
  // ─── Technical Incidents (3 events) ─────────────────────────────────────────
  {
    id: "tech-api-rate",
    title: "API Rate Limit Hit",
    description: "The third-party model API you planned to use just rate-limited your sandbox access. The static data pipelines are dropping queries.",
    category: "technical",
    weight: 10,
    choices: [
      {
        label: "Simplify Features",
        description: "Strip out real-time queries. Build static mock pipelines instead.",
        effectText: "Execution +15, Innovation -10, Time remaining +30s",
        modifiers: { execution: 15, innovation: -10, timeOffset: 30 }
      },
      {
        label: "Push Through",
        description: "Re-index async requests and build a lightweight cache interface over the API.",
        effectText: "Innovation +15, Execution -10, Time remaining -45s",
        modifiers: { innovation: 15, execution: -10, timeOffset: -45 }
      }
    ]
  },
  {
    id: "tech-db-crash",
    title: "Database Crash",
    description: "Your local database cluster just corrupted due to un-indexed write locks on simultaneous local requests.",
    category: "technical",
    weight: 10,
    choices: [
      {
        label: "Patch Quickly",
        description: "Apply a simple local storage fallback state. Bypass the complex cluster entirely.",
        effectText: "Execution +12, Design -8, Time remaining +15s",
        modifiers: { execution: 12, design: -8, timeOffset: 15 }
      },
      {
        label: "Rebuild Properly",
        description: "Re-initialize the PostgreSQL tables and index schemas correctly from scratch.",
        effectText: "Design +15, Execution +10, Time remaining -60s",
        modifiers: { design: 15, execution: 10, timeOffset: -60 }
      }
    ]
  },
  {
    id: "team-coffee-spill",
    title: "Keyboard Coffee Spill",
    description: "A teammate accidentally knocks over an energy drink, soaking your primary coding mechanical keyboard.",
    category: "team",
    weight: 10,
    choices: [
      {
        label: "Use Laptop Keyboard",
        description: "Grind along on the cramped laptop keys. Typing efficiency drops.",
        effectText: "Execution -8, Time remaining -20s",
        modifiers: { execution: -8, timeOffset: -20 }
      },
      {
        label: "Borrow Backup Board",
        description: "Scout neighboring tables to borrow a spare keyboard. Costs presentation credits.",
        effectText: "Pitch -5, Time remaining +15s",
        modifiers: { pitch: -5, timeOffset: 15 }
      }
    ]
  },

  // ─── Team Incidents (3 events) ──────────────────────────────────────────────
  {
    id: "team-disappeared",
    title: "Teammate Disappeared",
    description: "Your primary visual frontend teammate went to get coffee and has logged off completely. They fell asleep.",
    category: "team",
    weight: 10,
    choices: [
      {
        label: "Cut Visual Scope",
        description: "Drop complex motion animations. Stick to basic structural grid layouts.",
        effectText: "Execution +12, Design -10, Time remaining +30s",
        modifiers: { execution: 12, design: -10, timeOffset: 30 }
      },
      {
        label: "Double Down Solo",
        description: "Write the interface CSS configurations yourself. Extremely exhausting.",
        effectText: "Design +12, Pitch -8, Time remaining -50s",
        modifiers: { design: 12, pitch: -8, timeOffset: -50 }
      }
    ]
  },
  {
    id: "team-pivot-idea",
    title: "Last-Minute Pivot",
    description: "Your teammate pitches a brilliant new application pivot direction. Implementing it requires discarding key backlog features.",
    category: "team",
    weight: 8,
    choices: [
      {
        label: "Execute Pivot",
        description: "Pivot the MVP now! Re-orient under a brand-new startup direction.",
        effectText: "Innovation +25, Execution -20, Design -10",
        modifiers: { innovation: 25, execution: -20, design: -10 }
      },
      {
        label: "Stay Focused",
        description: "Politely decline. Stay disciplined and focus strictly on your active backlog path.",
        effectText: "Execution +15, Innovation -5, Time remaining +15s",
        modifiers: { execution: 15, innovation: -5, timeOffset: 15 }
      }
    ]
  },
  {
    id: "team-mentor-unavail",
    title: "Mentor Unavailable",
    description: "The engineering advisor you planned to consult is locked in a private investor panel. No advice is reachable.",
    category: "team",
    weight: 10,
    choices: [
      {
        label: "Proceed Blindly",
        description: "Keep building the project according to current specifications without external feedback.",
        effectText: "Execution +5, Innovation +5",
        modifiers: { execution: 5, innovation: 5 }
      },
      {
        label: "Wait Near Rooms",
        description: "Wait patiently in the hallway. Costs precious time, but secures helpful visual metrics.",
        effectText: "Pitch +12, Time remaining -35s",
        modifiers: { pitch: 12, timeOffset: -35 }
      }
    ]
  },

  // ─── Lucky Breaks (2 events) ────────────────────────────────────────────────
  {
    id: "lucky-sponsor-api",
    title: "Sponsor API Unlocked",
    description: "Sponsors have released a highly optimized sandbox API with stellar local development wrappers.",
    category: "lucky",
    weight: 10,
    choices: [
      {
        label: "Adopt Sponsor API",
        description: "Integrate the model for instant innovation boosts and jury sponsorship matches.",
        effectText: "Innovation +20, Execution +5, Bonus +10",
        modifiers: { innovation: 20, execution: 5, bonus: 10 }
      },
      {
        label: "Ignore (Stay Lean)",
        description: "Stay focused on your active architecture configuration to avoid build complexity.",
        effectText: "Execution +10, Time remaining +15s",
        modifiers: { execution: 10, timeOffset: 15 }
      }
    ]
  },
  {
    id: "lucky-coffee-delivery",
    title: "Surprise Coffee Delivery",
    description: "An event organizer drops off a fresh tray of premium iced coffees right at your desk.",
    category: "lucky",
    weight: 10,
    choices: [
      {
        label: "Drink Up Instantly",
        description: "Developers surge in energy and focus levels.",
        effectText: "Execution +10, Time remaining +20s",
        modifiers: { execution: 10, timeOffset: 20 }
      },
      {
        label: "Distribute to Neighbors",
        description: "Build excellent relationships with adjacent startup teams.",
        effectText: "Pitch +12, Bonus +5",
        modifiers: { pitch: 12, bonus: 5 }
      }
    ]
  },

  // ─── Jury Surprises (2 events) ──────────────────────────────────────────────
  {
    id: "judge-sustainability",
    title: "New Jury Mandate: Sustainability",
    description: "The lead judge announces that environmental offset footprints now hold double weighting in scoring.",
    category: "judge",
    weight: 10,
    choices: [
      {
        label: "Optimize Green Operations",
        description: "Adopt low-emission server templates and throttle background sync loops.",
        effectText: "Innovation +12, Execution -10, Bonus +10",
        modifiers: { innovation: 12, execution: -10, bonus: 10 }
      },
      {
        label: "Highlight Eco USP",
        description: "Incorporate environmental metrics directly into your elevator pitch summary.",
        effectText: "Pitch +15, Design +5",
        modifiers: { pitch: 15, design: 5 }
      }
    ]
  },
  {
    id: "judge-pitch-cut",
    title: "New Jury Mandate: 1-Min Pitch Limit",
    description: "Jury just announced that demo pitches are strictly capped at 60 seconds. Heavy penalties for scope creep.",
    category: "judge",
    weight: 10,
    choices: [
      {
        label: "Condense Presentation",
        description: "Compact talking points. Omit complex database explanations.",
        effectText: "Pitch +15, Innovation -8",
        modifiers: { pitch: 15, innovation: -8 }
      },
      {
        label: "Focus on Features Demo",
        description: "Eject slides and perform a fast, direct prototype walkthrough.",
        effectText: "Execution +12, Pitch +8, Time remaining -20s",
        modifiers: { execution: 12, pitch: 8, timeOffset: -20 }
      }
    ]
  }
];

/** Selects a weighted random chaos event excluding already triggered ones */
export function getRandomChaosEvent(excludeIds: string[] = []): ChaosEvent {
  const available = CHAOS_EVENTS.filter((e) => !excludeIds.includes(e.id));
  const pool = available.length > 0 ? available : CHAOS_EVENTS;

  const totalWeight = pool.reduce((acc, e) => acc + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) {
      return event;
    }
  }
  return pool[0];
}

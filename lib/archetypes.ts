/**
 * @file Project Archetype Classifier for Update v1.2.
 * Classifies a completed hackathon run into one of 6 distinct archetypes based on:
 * - Tech stack size & items
 * - Backlog feature scope size
 * - Selected USP
 * - Selected Business Model
 *
 * @module lib/archetypes
 */

import type { TechItem, Feature } from "@/types/game";

export interface ArchetypeResult {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  colorClass: string;
  radarStats: {
    techDepth: number;
    businessAcuteness: number;
    designFinesse: number;
    shippingScrappiness: number;
  };
}

/**
 * Classifies the completed project state into an archetype.
 */
export function classifyProjectArchetype(params: {
  techStack: TechItem[];
  features: Feature[];
  usp: string | null;
  businessModel: string | null;
  solutionDirection: string | null;
}): ArchetypeResult {
  const { techStack, features, usp, businessModel } = params;
  
  const stackCount = techStack.length;
  const featureCount = features.length;
  
  const techIds = new Set(techStack.map((t) => t.id));
  const hasHardware = techIds.has("tech-esp32") || techIds.has("tech-arduino");
  const hasDevOpsBloat = techIds.has("tech-docker") && techIds.has("tech-aws");

  // 1. THE OVERENGINEER
  // Bloated tech stack (>= 4 items) and bloated feature scope (>= 4 must-haves) OR devops over-configurations
  if (stackCount >= 4 || hasDevOpsBloat) {
    return {
      id: "overengineer",
      name: "The Overengineer",
      subtitle: "System Architecture Maximizer",
      description: "You spent the hackathon setting up Docker containers, PostgreSQL connection pools, and AWS auto-scaling lattices. The project's architecture is enterprise-ready, but Uday Sharma is shaking his head in absolute frustration at the unnecessary bloat, while your actual app is essentially a beautiful loading spinner and a single login button. Elegant, but highly impractical for a 24-hour sprint.",
      colorClass: "border-neutral-900 bg-neutral-100 text-neutral-900",
      radarStats: {
        techDepth: 95,
        businessAcuteness: 20,
        designFinesse: 50,
        shippingScrappiness: 15,
      },
    };
  }

  // 2. THE MINIMALIST
  // Extremely disciplined backlog (exactly 2 features) and compact tech stack (<= 3 items)
  if (featureCount <= 2 && stackCount <= 3) {
    return {
      id: "minimalist",
      name: "The Minimalist",
      subtitle: "Surgical MVP Architect",
      description: "A masterclass in restraint. With exactly two core features and a highly surgical, lightweight stack (like Next.js + Vercel), you didn't waste a single keystroke. There is zero bloat, zero technical debt, and maximum focus. The judges are either deeply impressed by your discipline, or wondering if you fell asleep for 8 hours.",
      colorClass: "border-neutral-900 bg-white text-neutral-900",
      radarStats: {
        techDepth: 40,
        businessAcuteness: 60,
        designFinesse: 90,
        shippingScrappiness: 80,
      },
    };
  }

  // 3. THE HACKER
  // Scrappy focus: "Fastest" USP or simple stack, high speed
  if (usp === "Fastest") {
    return {
      id: "hacker",
      name: "The Hacker",
      subtitle: "Move Fast and Build Things",
      description: "You prioritized raw execution speed and absolute pragmatism. Your USP was raw velocity ('Fastest') and your code is held together by digital duct tape, inline comments, and stack overflow threads. There are probably massive memory leaks and security gaps, but the app builds, runs, and demoes perfectly. Absolute scrappy genius.",
      colorClass: "border-amber-900 bg-amber-50 text-amber-900",
      radarStats: {
        techDepth: 55,
        businessAcuteness: 45,
        designFinesse: 30,
        shippingScrappiness: 98,
      },
    };
  }

  // 4. THE HUSTLER
  // Business/monetization-first USP ("Cheapest" or business model like B2B SaaS / Marketplace)
  if (businessModel === "B2B SaaS" || businessModel === "Marketplace" || usp === "Cheapest") {
    return {
      id: "hustler",
      name: "The Hustler",
      subtitle: "Unit Economics Monetizer",
      description: "Margins, acquisition loops, and exit metrics are all you care about. Your project is designed as a cash-generating engine from Day 1, utilizing a highly transactional business model. Your pitch presentation is flawless, and Sejal is taking notes on your financial projections, even if the database is currently running on a local JSON file.",
      colorClass: "border-emerald-900 bg-emerald-50 text-emerald-900",
      radarStats: {
        techDepth: 35,
        businessAcuteness: 95,
        designFinesse: 60,
        shippingScrappiness: 70,
      },
    };
  }

  // 5. THE VISIONARY
  // High disruption: AI-powered, Sustainable, or Community-first USP
  if (usp === "AI-powered" || usp === "Sustainable" || usp === "Community-first") {
    return {
      id: "visionary",
      name: "The Visionary",
      subtitle: "Future Disruption Synthesizer",
      description: "You are building the future, today. By selecting a highly disruptive USP (AI-powered, Sustainable, or Community-first) and matching it with creative problem vectors, you aim to reshape campus life. The project is highly creative, and Bart is nodding along in agreement, even if the actual database backend is slightly unfinished.",
      colorClass: "border-blue-900 bg-blue-50 text-blue-900",
      radarStats: {
        techDepth: 70,
        businessAcuteness: 75,
        designFinesse: 85,
        shippingScrappiness: 50,
      },
    };
  }

  // 6. THE BUILDER (Balanced Default)
  return {
    id: "builder",
    name: "The Builder",
    subtitle: "Disciplined Product Craftsman",
    description: "The reliable craftsman. You didn't fall into the trap of overengineering, nor did you ship vaporware. You selected a perfectly balanced tech stack, a highly functional core feature backlog, and a cohesive business model. It's a robust, highly functional product that solves a real campus problem without any unnecessary fluff. Exceptionally balanced.",
    colorClass: "border-stone-900 bg-stone-50 text-stone-950",
    radarStats: {
      techDepth: 75,
      businessAcuteness: 70,
      designFinesse: 70,
      shippingScrappiness: 75,
    },
  };
}

/**
 * @file Curated database of 50+ highly contextual judge comment templates.
 * Provides distinct voices and parameters matching the active project state.
 *
 * @module data/judgeComments
 */

import type { TechItem, Feature, Problem } from "@/types/game";

export interface ContextState {
  techStack: TechItem[];
  features: Feature[];
  usp: string | null;
  businessModel: string | null;
  problem: Problem | null;
  solutionDirection: string | null;
}

export interface CommentResult {
  comment: string;
  highlight: string;
}

/**
 * Enhanced Comments Generator for v1.4 Custom Judges Pass.
 * Features 5 distinct professional profiles: Uday Sharma, Nishika, Jitu, Bart, and Sejal.
 */
export function generateJudgeFeedback(
  judgeId: string,
  score: number,
  state: ContextState
): CommentResult {
  const techIds = new Set(state.techStack.map((t) => t.id));
  const featureIds = new Set(state.features.map((f) => f.id));
  const isOverengineered = techIds.size >= 4 && state.features.length >= 4;
  const isMinimalist = state.features.length === 2 && techIds.size <= 3;
  const hasAI = techIds.has("tech-gemini") || techIds.has("tech-openai");
  const hasHardware = techIds.has("tech-esp32") || techIds.has("tech-arduino");

  // ---------------------------------------------------------
  // 1. Uday Sharma (EdTech Creator & Hackathon Specialist)
  // Focus: Speed, MVPs, EdTech, practicality, actual user validation.
  // ---------------------------------------------------------
  if (judgeId === "judge-builder") {
    if (score >= 90) {
      if (isMinimalist) {
        return {
          comment: "I love this minimalist approach! Good founders ship before they feel ready. You solved the core user pain point with exactly two features and a super clean deployment. Real users can start validating this tomorrow morning.",
          highlight: "Masterful minimalist execution with high speed-to-market focus."
        };
      }
      return {
        comment: "Excellent hackathon execution! The MVP is highly practical, extremely responsive, and focuses entirely on solving a real problem. No fluff, just direct user utility.",
        highlight: "Practical product scoping with high speed-to-market value."
      };
    }
    if (score >= 70) {
      if (isOverengineered) {
        return {
          comment: "You spent too much time designing architecture and not enough time solving the user's pain. Why do you need multi-cloud clusters and complex databases for a simple prototype? Real users care about utility, not your docker registries.",
          highlight: "Prototypes held back by early architectural overengineering."
        };
      }
      return {
        comment: "A decent functional build. It solves the core problem, but it needs a much tighter validation loop. Get it in front of a few active users immediately to see what they think.",
        highlight: "Sensible tech execution with a direct user workflow."
      };
    }
    return {
      comment: "Too much talking and planning, not enough shipping. Your prototype crashes on initial load due to unhandled database sync errors. Stop working on slides and focus on your MVP build.",
      highlight: "Unstable dependency routing and lack of functional MVP loop."
    };
  }

  // ---------------------------------------------------------
  // 2. Bart (Startup Founder)
  // Focus: Startup potential, PMF, customer discovery, differentiation.
  // ---------------------------------------------------------
  if (judgeId === "judge-founder") {
    if (score >= 90) {
      if (state.usp === "Community-first" || state.businessModel === "Marketplace") {
        return {
          comment: "This is a venture-scale startup opportunity. By starting with a community-first hook, you solve the cold-start problem and build an organic acquisition loop that competitors can't easily copy.",
          highlight: "Outstanding network effect distribution loops."
        };
      }
      return {
        comment: "Outstanding product strategy! You've identified a massive customer pain point, validated it with a highly focused MVP, and formulated a clear growth path. This can absolutely become a real company.",
        highlight: "Superb product-market fit and large initial addressable market."
      };
    }
    if (score >= 70) {
      if (state.usp === "Cheapest") {
        return {
          comment: "Being the cheapest is a race to the bottom, not a defensible startup moat. Who is your desperate customer? Focus less on price and more on why someone would pay for your product specifically.",
          highlight: "Cost-leader strategy is vulnerable to scaled competitors."
        };
      }
      return {
        comment: "A solid commercial foundation, but the market feels highly niche. Focus on your wedge product first, then map out how you can scale from this tiny sector into larger adjacent opportunities.",
        highlight: "Sensible wedge positioning with modest initial market scale."
      };
    }
    return {
      comment: "This is a classic solution looking for a problem. The customer discovery is non-existent, the value proposition is muddled, and I don't see anyone desperately paying money for this.",
      highlight: "Muddled value proposition and absent distribution plans."
    };
  }

  // ---------------------------------------------------------
  // 3. Nishika (Corporate Product Designer / UI-UX Specialist)
  // Focus: UI design, usability, onboarding, accessibility, user friction.
  // ---------------------------------------------------------
  if (judgeId === "judge-design") {
    if (score >= 90) {
      return {
        comment: "A visual masterpiece! The typography scale is perfectly cohesive, interactive containers are beautifully responsive, and the onboarding flow is completely frictionless. It's accessible and delightful to use.",
        highlight: "Pixel-perfect visual design and seamless screen responsiveness."
      };
    }
    if (score >= 70) {
      if (isOverengineered) {
        return {
          comment: "Impressive backend engineering, but the interface is a total cockpit. You've crammed logs, complex graphs, and dozens of options on a single dashboard, creating heavy cognitive load for the user.",
          highlight: "Cluttered visual hierarchy hampers usability."
        };
      }
      return {
        comment: "Highly functional screens with a clear layout. The buttons are highly interactive and forms are clean, though your headings would benefit from a bolder typographic contrast.",
        highlight: "Clean functional design with flat visual branding."
      };
    }
    return {
      comment: "The user flow is extremely confusing. Buttons overlap on mobile, form elements lack standard labels, and the onboarding is non-existent. You can't ignore accessibility and call it design.",
      highlight: "Heavy visual responsiveness and accessibility failures."
    };
  }

  // ---------------------------------------------------------
  // 4. Sejal (Business Analyst)
  // Focus: Monetization models, scalability, demand, sustainable revenue, risks.
  // ---------------------------------------------------------
  if (judgeId === "judge-investor") {
    if (score >= 90) {
      if (state.businessModel === "B2B SaaS" && (state.usp === "Most Scalable" || state.usp === "AI-powered")) {
        return {
          comment: "High margins, clear unit economics, and clean digital scalability. Coupling B2B enterprise SaaS subscriptions with automated software models makes this incredibly capital-efficient.",
          highlight: "Strong B2B SaaS unit economics and sustainable margins."
        };
      }
      return {
        comment: "A highly viable business concept! Your monetization channels are planned properly, operational costs are realistic, and the customer acquisition math stands up under analyst scrutiny.",
        highlight: "Logical operational plan and sustainable revenue channels."
      };
    }
    if (score >= 70) {
      if (state.businessModel === "Freemium") {
        return {
          comment: "A sensible freemium model to capture market attention, but your premium features lack conversion triggers. Where exactly is the revenue hook that will sustain operations long-term?",
          highlight: "Reasonable freemium funnel but lacks premium monetization triggers."
        };
      }
      return {
        comment: "The business model is reasonable, but you need to demonstrate faster customer acquisition loops to capture market share before capital-heavy platforms decide to copy you.",
        highlight: "Stable pricing structure with modest expansion potential."
      };
    }
    return {
      comment: "The unit economics are completely broken. You have high development query costs, thin margins, and a tiny market with no clear revenue streams. This is not a sustainable business.",
      highlight: "Broken commercial math and high initial operational risk."
    };
  }

  // ---------------------------------------------------------
  // 5. Jitu (Professor & Academic Mentor)
  // Focus: CS fundamentals, software engineering, architecture, technical feasibility.
  // ---------------------------------------------------------
  if (judgeId === "judge-chaos") {
    if (score >= 90) {
      if (hasHardware) {
        return {
          comment: "Exceptional engineering discipline! Your low-level serial registers are beautifully managed, the firmware compiles flawlessly without memory leaks, and the system is logically structured.",
          highlight: "Flawless embedded systems integration with proper data registers."
        };
      }
      return {
        comment: "A highly logical and technically sound solution. The database schema has clean indexing, the api endpoints follow standard architecture patterns, and your chosen technology stack is fully justified.",
        highlight: "Excellent systems architecture and strong engineering fundamentals."
      };
    }
    if (score >= 70) {
      if (isOverengineered) {
        return {
          comment: "The codebase displays decent technical skills, but the architecture lacks simplicity. You've introduced recursive containers and heavy frameworks when a simple SQLite script would suffice.",
          highlight: "Impressive database indexing held back by framework bloat."
        };
      }
      return {
        comment: "Solid software fundamentals. The API routes return appropriate response codes and elements are modular, though you should justify your data serialization methods more clearly.",
        highlight: "Stable modular code structures with clean interface routing."
      };
    }
    return {
      comment: "Severe engineering faults. I found numerous dangling connections, unhandled exceptions, and a complete lack of system modularity. You cannot build a scaling platform on a broken foundation.",
      highlight: "Dangling promise chains and unhandled runtime exceptions."
    };
  }

  // Final fallback
  return {
    comment: "Decent project demo. The concept is interesting but requires deeper validation of features, tech choices, and user workflows.",
    highlight: "Standard hackathon project with balanced execution."
  };
}

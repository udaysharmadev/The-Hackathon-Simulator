/**
 * @file Curated list of 21 special modifiers for Sprint v1.2
 *
 * @module data/modifiers
 */

export interface Modifier {
  id: string;
  name: string;
  description: string;
  effectDescription: string;
}

export const MODIFIERS: Modifier[] = [
  {
    id: "NO_AI_TOOLS",
    name: "No AI Tools",
    description: "OpenAI and Gemini APIs as well as the AI-powered USP are banned.",
    effectDescription: "Heavily penalizes score (-25 pts) if any AI tech stack items or AI USP are used."
  },
  {
    id: "BOOTSTRAP_ONLY",
    name: "Bootstrap Only",
    description: "No expensive cloud servers or heavy relational infrastructure.",
    effectDescription: "AWS and heavy PostgreSQL backends incur execution penalties (-20 pts)."
  },
  {
    id: "MOBILE_ONLY",
    name: "Mobile Only",
    description: "Must build a Mobile Application startup solution.",
    effectDescription: "Penalizes score (-20 pts) if a non-mobile solution direction is chosen."
  },
  {
    id: "WEB_ONLY",
    name: "Web Only",
    description: "Must build a Web Application startup solution.",
    effectDescription: "Penalizes score (-20 pts) if a non-web solution direction is chosen."
  },
  {
    id: "AI_ONLY",
    name: "AI Only",
    description: "Must build an AI-based cognitive pipeline solution.",
    effectDescription: "Penalizes score (-20 pts) if a non-AI solution direction is chosen."
  },
  {
    id: "LIMITED_BUDGET",
    name: "Limited Budget",
    description: "Frugal budget restricts infrastructure scoping.",
    effectDescription: "Reduces execution starting base index by -15."
  },
  {
    id: "GREEN_FIRST",
    name: "Green First",
    description: "High environmental sustainability priority today.",
    effectDescription: "Choosing the Sustainable USP or Green business models yields double synergy bonuses."
  },
  {
    id: "USER_SENSITIVE",
    name: "User Sensitive",
    description: "Extremely high standards for UI/UX visual polish.",
    effectDescription: "Grants +20 points if Design score is >= 80, otherwise subtracts -20 points."
  },
  {
    id: "TECH_WIZARD",
    name: "Tech Wizard",
    description: "High standard for framework pipeline integrations.",
    effectDescription: "Tech synergies (e.g. Next.js + Vercel) grant double synergy bonus points."
  },
  {
    id: "SOLO_DEV",
    name: "Solo Dev",
    description: "Coding solo. Teammate support is absent.",
    effectDescription: "Time additions from lucky break events are disabled."
  },
  {
    id: "FAST_SHIP",
    name: "Fast Ship",
    description: "Strict lean MVP focus. Only build absolute essentials.",
    effectDescription: "Penalizes score (-20 pts) if backlog contains more than 2 Must-Have features."
  },
  {
    id: "NO_MENTOR",
    name: "No Mentor Allowed",
    description: "Advisors are locked out. You must build without audit reliance.",
    effectDescription: "Mentor audit and tips are completely disabled."
  },
  {
    id: "OPEN_SOURCE",
    name: "Open Source Mandate",
    description: "All project modules must be published under public open source licenses.",
    effectDescription: "Failing to select the open source mandate choice penalizes innovation by -15."
  },
  {
    id: "MONETIZE_NOW",
    name: "Monetize Now",
    description: "Immediate aggressive monetization channels required.",
    effectDescription: "Muted models (Freemium or Ads) are penalized. B2B SaaS or Commissions preferred (-20 pts)."
  },
  {
    id: "SECURITY_FIRST",
    name: "Security First",
    description: "Strict data privacy standard. Encrypted clusters required.",
    effectDescription: "Requires Postgres + Supabase synergy in the stack, otherwise execution -20."
  },
  {
    id: "MINIMALIST",
    name: "Minimalist Backlog",
    description: "Product backlog must contain exactly 2 features.",
    effectDescription: "Failing to meet exact count penalizes design score by -15."
  },
  {
    id: "HARDCORE_JUDGE",
    name: "Strict Judging",
    description: "The evaluation panel is extremely critical today.",
    effectDescription: "Multiplies your final judge score by 0.85 (stricter grading)."
  },
  {
    id: "CRITICAL_PATH",
    name: "Critical Path Only",
    description: "No nice-to-have features allowed in this sprint.",
    effectDescription: "Penalizes execution by -15 if any features are mapped to Nice-to-Have."
  },
  {
    id: "CLOUD_NATIVE",
    name: "Cloud Native",
    description: "AWS and Vercel are both required in your architecture stack.",
    effectDescription: "Failing to select both Vercel and AWS penalizes innovation score by -15."
  },
  {
    id: "ACCESSIBILITY_MANDATE",
    name: "Accessibility First",
    description: "ARIA guidelines and keyboard outline focus are required.",
    effectDescription: "Selecting ARIA choice grants +15 Design, otherwise penalizes design by -15."
  },
  {
    id: "CHAOS_MAGNET",
    name: "Chaos Magnet",
    description: "Unstable environment triggers fires easily.",
    effectDescription: "Increases transition chaos event probability checks to 35%."
  }
];

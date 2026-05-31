import type { Problem, Feature, TechItem, GeneratedBusinessModel, AdvisorAdvice } from '@/types/game';
import { toRegistryId, toStoreId } from '@/data/techRegistry';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GeneratedUSP {
  key: "Fastest" | "Cheapest" | "Most Scalable" | "AI-powered" | "Sustainable" | "Hyper-personalized" | "Community-first";
  name: string;
  desc: string;
  innovation: number;
  execution: number;
  design: number;
  pitch: number;
  tradeoffInfo: string;
}

export interface GeneratedFeature extends Feature {
  dependsOn?: string; // ID of required feature
  dependsOnName?: string; // Display name of required feature
  innovationScore: number;
}

// ─── seeded random generator ──────────────────────────────────────────────────

function createSeededRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Curated Vocabulary ──────────────────────────────────────────────────────

const VERBS = [
  "Predict", "Optimize", "Automate", "Streamline", "Audit", "Decentralize",
  "Scale", "Personalize", "Secure", "Synthesize", "Visualize", "Coordinate"
];

const ADJECTIVES = [
  "real-time", "context-aware", "frictionless", "distributed", "collaborative",
  "data-driven", "peer-to-peer", "eco-friendly", "highly-adaptive", "privacy-first"
];

const CATEGORY_NOUNS: Record<string, string[]> = {
  edtech: [
    "study planner", "recall graph", "spaced review scheduler", "quiz deck builder",
    "lecture transcription pipeline", "hallucination firewall", "conceptual map", "skill matrix log"
  ],
  healthtech: [
    "clinical vital sync", "patient calendar", "sentiment mood tracker", "crisis alert router",
    "bed reservation locker", "HIPAA telemetry log", "stress marker tracker", "dispenser monitor"
  ],
  fintech: [
    "auditable expense split", "microlending cycle ledger", "double-entry ledger",
    "reputation scoring index", "retrospective savings engine", "debt-chain resolver", "audit reporter"
  ],
  sustainability: [
    "grid intensity tracker", "carbon offset ledger", "circular material tracer", "wattage optimizer",
    "agricultural soil monitor", "logistics carbon pathfinder", "emission calculator", "waste heat tracker"
  ],
  ai: [
    "multi-agent coprocessor", "cognitive voice dialect grid", "race condition debugger",
    "vector database retriever", "prompt firewall", "support logs index", "hallucination monitor"
  ],
  "smart-campus": [
    "dorm laundry queue tracker", "seat occupancy markers mesh", "seat reservation manager",
    "classroom coordinate mesh", "ambient noise indexer", "dining waste calculator", "load balancer"
  ]
};

// ─── USP Generator ──────────────────────────────────────────────────────────

/**
 * Procedurally generates 6-8 highly contextual USP options matching the project strategy.
 */
export function generateUSPOptions(
  problem: Problem | null,
  solutionDirection: string | null,
  techStack: TechItem[],
  gameMode: string,
  runSeed?: string
): GeneratedUSP[] {
  const seed = runSeed || (problem ? problem.id : "hackathon") + gameMode + techStack.map(t => t.id).join("");
  const rand = createSeededRandom(seed);

  const category = problem?.category || "ai";
  const nouns = CATEGORY_NOUNS[category] || CATEGORY_NOUNS.ai;

  const baseTemplates = [
    {
      key: "Fastest" as const,
      nameTpl: (noun: string) => `Zero-configuration ${noun} engine`,
      descTpl: (sol: string) => `Instant-compiling, low-latency ${sol || "prototype"} with minimal startup configs.`,
      innovation: 45, execution: 75, design: 55, pitch: 50
    },
    {
      key: "Cheapest" as const,
      nameTpl: (noun: string) => `Serverless, database-free ${noun}`,
      descTpl: (sol: string) => `Static offline files, avoiding complex cloud sync fees entirely.`,
      innovation: 50, execution: 70, design: 45, pitch: 50
    },
    {
      key: "Most Scalable" as const,
      nameTpl: (noun: string) => `Elastic event-driven ${noun} grid`,
      descTpl: (sol: string) => `Asynchronous edge queue mapping that handles high concurrent packet rates.`,
      innovation: 55, execution: 65, design: 50, pitch: 65
    },
    {
      key: "AI-powered" as const,
      nameTpl: (noun: string) => `Autonomous LLM-driven ${noun} agent`,
      descTpl: (sol: string) => `Deep cognitive vector classification for high innovation value.`,
      innovation: 80, execution: 50, design: 50, pitch: 65
    },
    {
      key: "Sustainable" as const,
      nameTpl: (noun: string) => `Carbon-neutral, eco-optimized ${noun}`,
      descTpl: (sol: string) => `High environmental offset footprints utilizing grid emissions sensors.`,
      innovation: 70, execution: 55, design: 55, pitch: 70
    },
    {
      key: "Hyper-personalized" as const,
      nameTpl: (noun: string) => `Context-adaptive dynamic ${noun}`,
      descTpl: (sol: string) => `Highly responsive screen visual designs tailored to student feedback profiles.`,
      innovation: 58, execution: 55, design: 78, pitch: 60
    },
    {
      key: "Community-first" as const,
      nameTpl: (noun: string) => `Cooperative peer-to-peer ${noun} mesh`,
      descTpl: (sol: string) => `Focuses on distributed local grids and open community trust loops.`,
      innovation: 65, execution: 55, design: 60, pitch: 72
    }
  ];

  // Pick random nouns and verbs to weave contextually
  const options = baseTemplates.map(tpl => {
    // Pick deterministic nouns/verbs based on seed
    const nounIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nounIdx];
    const noun = rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1);
    
    const name = tpl.nameTpl(noun);
    const desc = tpl.descTpl(solutionDirection || "application");

    // Add slight variance to standard modifier scores to encourage thinking (+/- 5 points)
    const variance = Math.floor(rand() * 11) - 5; // [-5, 5]
    
    // Apply standard Paper Terminal tradeoffs: high innovation decreases execution
    const baseInnovation = Math.max(20, Math.min(tpl.innovation + (tpl.key === "AI-powered" || tpl.key === "Sustainable" ? variance : -variance), 95));
    const baseExecution = Math.max(20, Math.min(tpl.execution + (tpl.key === "Fastest" || tpl.key === "Cheapest" ? variance : -variance), 95));
    const baseDesign = Math.max(20, Math.min(tpl.design + (tpl.key === "Hyper-personalized" ? variance : 0), 95));
    const basePitch = Math.max(20, Math.min(tpl.pitch + (tpl.key === "Community-first" ? variance : 0), 95));

    const tradeoffInfo = `// tradeoffs: ${baseInnovation >= 70 ? '+' : ''}${baseInnovation - 50} Innovation, ${baseExecution >= 70 ? '+' : ''}${baseExecution - 60} Execution, ${baseDesign >= 70 ? '+' : ''}${baseDesign - 55} Design`;

    return {
      key: tpl.key,
      name,
      desc,
      innovation: baseInnovation,
      execution: baseExecution,
      design: baseDesign,
      pitch: basePitch,
      tradeoffInfo
    };
  });

  // Shuffle and slice to get 6-7 options
  const count = 6 + Math.floor(rand() * 2); // 6 or 7
  return options.slice(0, count);
}

// ─── Backlog Generator ───────────────────────────────────────────────────────

/**
 * Procedurally generates a custom 10-12 feature backlog with dependency mappings,
 * distinct estimated build effort levels, and innovation tradeoffs.
 */
export function generateFeatureBacklog(
  problem: Problem | null,
  solutionDirection: string | null,
  chosenUSP: GeneratedUSP | null,
  techStack: TechItem[],
  runSeed?: string
): GeneratedFeature[] {
  const seed = (problem ? problem.id : "feat") + (chosenUSP ? chosenUSP.name : "usp") + (solutionDirection || "solution") + (runSeed || "classic");
  const rand = createSeededRandom(seed);

  const category = problem?.category || "ai";
  const nouns = CATEGORY_NOUNS[category] || CATEGORY_NOUNS.ai;

  // We will generate exactly 10 features:
  // - 4 Low complexity features (Base)
  // - 3 Medium complexity features
  // - 3 High complexity features (Advanced, some with dependencies)

  const features: GeneratedFeature[] = [];

  // ─── Generate 4 Low Complexity Baseline Features ───────────────────────────
  const baseVerbs = ["Secure", "Local", "Static", "Frictionless", "Manual", "Compact"];
  for (let i = 0; i < 4; i++) {
    const vIdx = Math.floor(rand() * baseVerbs.length);
    const verb = baseVerbs[vIdx];
    const nIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nIdx];
    
    const id = `feat-base-${i}-${rawNoun.slice(0, 5)}`;
    const name = `${verb} ${rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1)}`;
    const description = `Core telemetry logging layers and lightweight ${rawNoun} layouts for standard hackathon MVPs.`;
    
    features.push({
      id,
      name,
      description,
      effort: 'low',
      impact: rand() > 0.5 ? 'low' : 'medium',
      innovationScore: 10 + Math.floor(rand() * 15), // 10-25
    });
  }

  // ─── Generate 3 Medium Complexity Features ────────────────────────────────
  const medVerbs = ["Real-time", "Analytical", "Integrated", "Interactive", "Cooperative", "Responsive"];
  for (let i = 0; i < 3; i++) {
    const vIdx = Math.floor(rand() * medVerbs.length);
    const verb = medVerbs[vIdx];
    const nIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nIdx];
    
    const id = `feat-med-${i}-${rawNoun.slice(0, 5)}`;
    const name = `${verb} ${rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1)}`;
    const description = `Real-time synchronization grids and interactive analytics dashboards to parse student ${rawNoun} logs.`;
    
    features.push({
      id,
      name,
      description,
      effort: 'medium',
      impact: rand() > 0.4 ? 'medium' : 'high',
      innovationScore: 25 + Math.floor(rand() * 20), // 25-45
    });
  }

  // ─── Generate 3 High Complexity Advanced Features (some with dependencies) ─────
  const advVerbs = ["AI-driven", "Predictive", "Immersive AR", "Distributed Ledger", "Multi-Agent", "Autonomous"];
  for (let i = 0; i < 3; i++) {
    const vIdx = Math.floor(rand() * advVerbs.length);
    const verb = advVerbs[vIdx];
    const nIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nIdx];
    
    const id = `feat-adv-${i}-${rawNoun.slice(0, 5)}`;
    const name = `${verb} ${rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1)}`;
    const description = `Advanced machine learning pipelines and vector embeddings tracking dynamic ${rawNoun} records.`;
    
    // Pick one of the baseline features as a dependency (for 2 of the advanced features)
    let dependsOn: string | undefined;
    let dependsOnName: string | undefined;
    if (i < 2 && features.length > 0) {
      const baseFeats = features.filter(f => f.effort === 'low');
      if (baseFeats.length > 0) {
        const depFeat = baseFeats[Math.floor(rand() * baseFeats.length)];
        dependsOn = depFeat.id;
        dependsOnName = depFeat.name;
      }
    }

    features.push({
      id,
      name,
      description: description + (dependsOnName ? ` [REQUIRES: ${dependsOnName.toUpperCase()}]` : ""),
      effort: 'high',
      impact: 'high',
      innovationScore: 50 + Math.floor(rand() * 30), // 50-80
      dependsOn,
      dependsOnName
    });
  }

  return features;
}

/**
 * Procedurally generates 3-5 highly contextual business models matching the active project state,
 * along with detailed pricing strategies, target segments, and monetization logic.
 */
export function generateBusinessModels(
  problem: Problem | null,
  solutionDirection: string | null,
  usp: string | null,
  features: Feature[],
  techStack: TechItem[],
  gameMode: string,
  runSeed?: string
): GeneratedBusinessModel[] {
  const seed = runSeed || (problem ? problem.id : "biz") + gameMode + (usp || "standard") + techStack.map(t => t.id).join("");
  const rand = createSeededRandom(seed);

  const category = problem?.category || "ai";
  const problemTitle = problem ? problem.title : "Digital Solution";
  const solutionType = solutionDirection || "application";
  const rawUsp = usp || "highly optimized architecture";

  // Clean topic word extraction
  const titleWords = problemTitle.split(" ");
  const problemTopic = titleWords.length > 2 ? titleWords.slice(0, 3).join(" ") : problemTitle;

  const techNames = techStack.length > 0 
    ? techStack.slice(0, 3).map(t => t.name).join("/") 
    : "modern web stack";

  // We construct 4 models matching: Enterprise License, P2P Exchange, API Node, D2C Subscription
  const templates = [
    {
      id: "biz-model-0",
      name: `${problemTopic} Enterprise License`,
      desc: `Annual B2B enterprise license targeting institutional deployment of the ${solutionType} to address key pain points around "${problemTitle}".`,
      customer: `Institutional Managers, Site Directors, and Compliance Officers looking to resolve "${problemTitle}" automatically.`,
      valueProp: `Instantly coordinate ${problemTopic} compliance workflows with our proprietary "${rawUsp}" engine built on ${techNames}.`,
      monetization: `Annual tiered subscription fees charged per corporate node, school district, or regional department.`,
      riskLevel: "Low" as const,
      pricingStructure: `Starter: $1,200/yr // Professional: $4,800/yr // Enterprise: Custom Contract`,
      customerSegment: `Tier-1 Campus Administrators and Mid-market Corporate Directors`,
      revenueStream: `Recurring B2B Annual Software Licensing and Premium Technical Integration Credits`,
      growthStrategy: `Partner with local governance committees to run subsidized pilots, establishing a standard for procurement.`
    },
    {
      id: "biz-model-1",
      name: `${problemTopic} Exchange Node`,
      desc: `A commission-based transactional marketplace connecting individuals to exchange services or resources to solve "${problemTitle}".`,
      customer: `End-users, students, and local providers who need a frictionless marketplace to coordinate ${problemTopic} tasks.`,
      valueProp: `Decentralized transaction verification and dynamic matchmaking utilizing our ${rawUsp} network.`,
      monetization: `Assessing platform brokerage fees and premium search listing placements on transaction logs.`,
      riskLevel: "High" as const,
      pricingStructure: `Standard Listing: Free // Platform Brokerage Fee: 4.5% of transaction value // Premium Match: $2.99`,
      customerSegment: `Campus Community Peers and Local Retail Service Providers`,
      revenueStream: `Transactional Brokerage Commissions and Featured Merchant Visibility Subscriptions`,
      growthStrategy: `Seed initial transaction volume by distributing $5 test credits to the first 500 registered campus users.`
    },
    {
      id: "biz-model-2",
      name: `${problemTopic} Developer API Node`,
      desc: `High-availability cloud API node serving verified structured telemetry and query outputs for developers building on "${problemTitle}".`,
      customer: `Software engineers, data researchers, and enterprise IT teams integrating adjacent ${problemTopic} systems.`,
      valueProp: `Avoid building expensive custom backend layers by querying our lightweight ${rawUsp} endpoints built on ${techNames}.`,
      monetization: `Pay-as-you-go credit logs billed based on monthly API request volumes and custom database lookups.`,
      riskLevel: "Medium" as const,
      pricingStructure: `Developer: Free // Professional: $89/mo (up to 100k calls) // Scale Node: $0.001 per API request`,
      customerSegment: `Third-party Developers, Research Labs, and Corporate Systems Engineers`,
      revenueStream: `Metered API Request Fees and Dedicated Enterprise API Hosting SLAs`,
      growthStrategy: `Integrate with popular open-source dev suites to provide plug-and-play SDK modules for Slack/Discord.`
    },
    {
      id: "biz-model-3",
      name: `${problemTopic} Personal Copilot`,
      desc: `Freemium personal companion application providing automated scheduling, alert routines, and tracking to help individuals manage "${problemTitle}".`,
      customer: `Direct-to-consumer individual users seeking to resolve their personal pain points in "${problemTitle}".`,
      valueProp: `Boost efficiency and reduce daily stress using our context-aware, hyper-personalized "${rawUsp}" planner.`,
      monetization: `Recurring premium consumer subscription fees alongside micro-transaction unlocks for specialty routines.`,
      riskLevel: "Medium" as const,
      pricingStructure: `Base Tier: Free // Premium Access: $6.99/mo // Annual Pass: $49.99/yr`,
      customerSegment: `University Students, Young Professionals, and General Tech Consumers`,
      revenueStream: `Direct-to-Consumer Recurring Subscriptions and In-app Specialized Feature Unlocks`,
      growthStrategy: `Offer viral referral credits allowing users to unlock three months of Premium for every two friends onboarded.`
    }
  ];

  return templates;
}

/**
 * Procedurally generates 3-5 highly actionable co-founder advice cards,
 * complete with hidden tradeoffs, score metrics, and expected impacts.
 */
export function generateAdvisorAdvice(
  problem: Problem | null,
  solutionDirection: string | null,
  usp: string | null,
  features: Feature[],
  techStack: TechItem[],
  gameMode: string,
  runSeed?: string,
  pitchDeck?: string[],
  businessModel?: string | null,
  generatedBusinessModels?: GeneratedBusinessModel[]
): AdvisorAdvice[] {
  const seed = runSeed || (problem ? problem.id : "adv") + gameMode + (usp || "standard");
  const rand = createSeededRandom(seed);

  const adviceList: AdvisorAdvice[] = [];

  // 1. Detect Heavy Enterprise Infrastructure
  const heavyTechs = ['reg-springboot', 'reg-kubernetes', 'reg-kafka', 'reg-cassandra', 'reg-oracle'];
  const hasHeavyInfra = techStack.some(t => {
    const rId = toRegistryId(t.id);
    return heavyTechs.includes(rId);
  });

  if (hasHeavyInfra) {
    adviceList.push({
      id: "adv-replace-tech",
      title: "Simplify Bloated Tech Stack",
      explanation: `You selected Spring Boot, PostgreSQL, Kafka, or Kubernetes for a student-focused campus project. You're building enterprise infrastructure instead of a product. Switch to FastAPI or Node.js and deploy to Vercel or Supabase to spend the saved time actually improving your product demo.`,
      expectedImpact: "Removes complex backend infrastructure lockouts and speeds up build execution.",
      tradeoffs: "+20 Execution Feasibility, -5 Innovation.",
      status: 'pending',
      scoreModifiers: { execution: 20, innovation: -5 },
      mentorPersona: {
        name: "Dave Miller",
        role: "Senior Engineer",
        avatar: "💻",
        tone: "brutally_honest"
      },
      action: {
        type: 'replace_tech',
        payload: {
          from: ['reg-springboot', 'reg-kubernetes', 'reg-kafka', 'reg-cassandra', 'reg-oracle'],
          to: 'tech-fastapi'
        }
      }
    });
  }

  // 2. Detect Scope Creep
  const hasScopeCreep = features.length > 5 || features.filter(f => f.effort === 'high').length > 2;
  if (hasScopeCreep) {
    adviceList.push({
      id: "adv-reduce-scope",
      title: "Prune Bloated MVP Backlog",
      explanation: `Your backlog has ${features.length} features, including multiple high-effort tasks. This is a 24-hour hackathon, not a multi-month VC-backed startup milestone. Let's prune the low-impact Nice-to-Have features and consolidate your scope to secure demo stability.`,
      expectedImpact: "Prunes low-impact backlog nodes and secures execution stability.",
      tradeoffs: "+15 Execution Feasibility, -5 Innovation, +5 Design.",
      status: 'pending',
      scoreModifiers: { execution: 15, innovation: -5, design: 5 },
      mentorPersona: {
        name: "Marcus Vance",
        role: "Product Manager",
        avatar: "📋",
        tone: "direct"
      },
      action: {
        type: 'reduce_scope',
        payload: {}
      }
    });
  }

  // 3. Detect Slide Order Issues
  const hasSlideOrderIssue = pitchDeck && pitchDeck.includes('tech-stack') && pitchDeck.includes('problem') &&
    pitchDeck.indexOf('tech-stack') < pitchDeck.indexOf('problem');
  if (hasSlideOrderIssue) {
    adviceList.push({
      id: "adv-move-slide",
      title: "Fix Slide Deck Narrative Flow",
      explanation: `You put the Tech Stack slide before the Problem slide. You are explaining your database schema before the judges even know what customer pain point you are solving. Let's move the Problem slide to the very front.`,
      expectedImpact: "Reorders slides to present the problem context before technical details.",
      tradeoffs: "+15 Pitch Potential, +5 Design.",
      status: 'pending',
      scoreModifiers: { pitch: 15, design: 5 },
      mentorPersona: {
        name: "Sophia Patel",
        role: "Startup Founder",
        avatar: "🚀",
        tone: "coaching"
      },
      action: {
        type: 'move_slide',
        payload: { from: 'tech-stack', to: 'problem' }
      }
    });
  }

  // 4. Focus Customer Segment Strategy
  const activeModel = generatedBusinessModels && generatedBusinessModels.find(m => m.id === businessModel);
  const canFocusSegment = activeModel && !activeModel.customerSegment.includes("Campus Pilot");
  if (canFocusSegment) {
    adviceList.push({
      id: "adv-pilot-strategy",
      title: "Establish Campus Pilot Focus",
      explanation: `Your current customer segment strategy is far too broad for a 24-hour hackathon prototype. Selling annual enterprise contracts immediately is a pipe dream. Let's refine your business model to focus strictly on a high-margin Campus Pilot.`,
      expectedImpact: "Pivots value propositions and customer descriptions to local pilot markets.",
      tradeoffs: "+15 Pitch Potential, +5 Design, -5 Execution.",
      status: 'pending',
      scoreModifiers: { pitch: 15, design: 5, execution: -5 },
      mentorPersona: {
        name: "Elena Rostova",
        role: "Investor",
        avatar: "💰",
        tone: "strategic"
      },
      action: {
        type: 'focus_segment',
        payload: { segment: 'Campus Pilot Focus' }
      }
    });
  }

  // 5. Fallback Default Advice Cards if issues list is too small
  if (adviceList.length < 3) {
    // Add default Tech Moat card
    if (!techStack.some(t => t.id === 'tech-gemini' || t.id === 'tech-openai')) {
      adviceList.push({
        id: "adv-increase-differentiation",
        title: "Amplify Strategic Tech Moat",
        explanation: `Your active stack is clean, but lacks a high-innovation hook. In a competitive hackathon, adding LLM capabilities makes the demo feel like magic. Let's integrate the Gemini API to run a vector classification engine.`,
        expectedImpact: "Boosts competitive differentiation and judge wow-factor.",
        tradeoffs: "+25 Innovation, -10 Execution, +5 Pitch.",
        status: 'pending',
        scoreModifiers: { innovation: 25, execution: -10, pitch: 5 },
        mentorPersona: {
          name: "Alex 'Speedrun' Chen",
          role: "Hackathon Winner",
          avatar: "⚡",
          tone: "hyper"
        },
        action: {
          type: 'replace_tech',
          payload: { from: [], to: 'tech-gemini' }
        }
      });
    }

    // Add default Slide addition card
    if (pitchDeck && !pitchDeck.includes('user-journey')) {
      adviceList.push({
        id: "adv-user-journey",
        title: "Insert User Storyboard",
        explanation: `Your slides present features perfectly, but miss the human element. Let's insert a User Journey slide to trace a student persona experiencing the core benefit of the application.`,
        expectedImpact: "Improves storytelling and emotional hook for the judges.",
        tradeoffs: "+12 Pitch Potential, +5 Design.",
        status: 'pending',
        scoreModifiers: { pitch: 12, design: 5 },
        mentorPersona: {
          name: "Sophia Patel",
          role: "Startup Founder",
          avatar: "🚀",
          tone: "inspiring"
        },
        action: {
          type: 'move_slide',
          payload: { addSlide: 'user-journey' }
        }
      });
    }

    // Add default Premium Pricing model
    adviceList.push({
      id: "adv-customer-focus",
      title: "Adopt High-Margin Premium Tier",
      explanation: `Your monetization model is a bit weak on unit economics. Let's add a clear Premium SaaS subscription tier for administrators to show the judges you know how to scale.`,
      expectedImpact: "Polishes commercial pricing layout and increases business viability.",
      tradeoffs: "+10 Pitch Potential, +5 Execution.",
      status: 'pending',
      scoreModifiers: { pitch: 10, execution: 5 },
      mentorPersona: {
        name: "Elena Rostova",
        role: "Investor",
        avatar: "💰",
        tone: "calculating"
      },
      action: {
        type: 'focus_segment',
        payload: { segment: 'Premium SaaS Administrative Focus' }
      }
    });
  }

  // Ensure deterministic selection based on seed
  const count = Math.min(adviceList.length, 3 + Math.floor(rand() * 2));
  return adviceList.slice(0, count);
}

/**
 * Calculates a dynamic, choice-driven Mentor Confidence Score (0-100) based on stack complexity,
 * backlog features size, slide ordering, and followed/ignored advice cards.
 */
export function calculateMentorConfidence(
  problem: Problem | null,
  solutionDirection: string | null,
  usp: string | null,
  features: Feature[],
  techStack: TechItem[],
  pitchDeck: string[],
  businessModel: string | null,
  generatedBusinessModels: GeneratedBusinessModel[],
  adviceList: AdvisorAdvice[]
): number {
  let score = 50; // default baseline

  // 1. Tech Stack complexity deductions
  const heavyTechs = ['reg-springboot', 'reg-kubernetes', 'reg-kafka', 'reg-cassandra', 'reg-oracle'];
  let heavyCount = 0;
  techStack.forEach(t => {
    const rId = toRegistryId(t.id);
    if (heavyTechs.includes(rId)) {
      heavyCount++;
    }
  });
  score -= heavyCount * 15;

  if (techStack.length > 4) {
    score -= 10;
  } else if (techStack.length > 0 && heavyCount === 0) {
    score += 5; // clean stack bonus
  }

  // 2. Feature backlog deductions
  if (features.length > 5) {
    score -= 10;
  }
  const highEffortCount = features.filter(f => f.effort === 'high').length;
  if (highEffortCount > 2) {
    score -= 15;
  }
  const lowImpactCount = features.filter(f => f.impact === 'low').length;
  if (lowImpactCount === 0 && features.length > 0) {
    score += 8; // focused MVP bonus
  }

  // 3. Pitch Deck layout deductions
  if (pitchDeck && pitchDeck.length > 0) {
    const hasProblem = pitchDeck.includes('problem');
    const hasSolution = pitchDeck.includes('solution');
    const hasDemo = pitchDeck.includes('demo');

    if (!hasProblem) score -= 10;
    if (!hasSolution) score -= 10;
    if (!hasDemo) score -= 10;

    const probIdx = pitchDeck.indexOf('problem');
    const techIdx = pitchDeck.indexOf('tech-stack');
    if (hasProblem && techIdx !== -1 && probIdx !== -1 && techIdx < probIdx) {
      score -= 15; // Tech stack before problem statement!
    }
  }

  // 4. USP check
  if (!usp) {
    score -= 10;
  } else {
    score += 5;
  }

  // 5. Followed and Ignored Advice Adjustments
  if (adviceList && adviceList.length > 0) {
    adviceList.forEach(adv => {
      if (adv.status === 'applied') {
        score += 15;
      } else if (adv.status === 'rejected') {
        score -= 10;
      }
    });
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Procedurally generates a custom 30-second elevator pitch based on all active project metrics,
 * accepted advisor advice, and selected business models.
 */
export function generateCustomElevatorPitch(
  problem: Problem | null,
  solutionDirection: string | null,
  usp: string | null,
  features: Feature[],
  businessModel: GeneratedBusinessModel | null,
  adviceList: AdvisorAdvice[],
  techStack: TechItem[]
): string {
  if (!problem) return "Hello! We are working on a custom hackathon challenge.";

  const techNames = techStack.slice(0, 3).map(t => t.name).join(", ");
  const featureNames = features.slice(0, 2).map(f => f.name).join(", ");
  
  const adviceApplied = adviceList.filter(a => a.status === 'applied').map(a => a.title);
  const adviceClause = adviceApplied.length > 0 
    ? ` Listening to advisor feedback, we pivoted to structure this around a ${adviceApplied[0].toLowerCase()} plan.`
    : "";

  const bizClause = businessModel 
    ? ` We monetize via a ${businessModel.name} model, targeting ${businessModel.customer} as our wedge market, pricing at ${businessModel.pricingStructure.split(" // ")[0] || 'Starter Tiers'}.`
    : " We are refining our initial launch monetization plans.";

  const pitch = `Hello! We are tackling the "${problem.title}" challenge. Our solution is an AI-driven, context-aware ${solutionDirection || 'prototype'} built around our unique competitive advantage: ${usp || 'dynamic optimization'}. Powered by a production-ready stack utilizing ${techNames || 'modern frameworks'}, we deliver immediate value through our core modules: ${featureNames || 'optimized telemetry'}.${adviceClause}${bizClause} This gives us a massive wedge to capture PMF and scale our solution effectively.`;

  return pitch;
}


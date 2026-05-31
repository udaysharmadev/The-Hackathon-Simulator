/**
 * @fileoverview Procedural Startup PRD Generator for The Hackathon Simulator.
 * Dynamically compiles comprehensive, realistic startup product requirements
 * based on all player decisions, final score, grade, archetype, and chaos events.
 *
 * @module lib/prdGenerator
 */

import type { GameState, TechItem, Feature, Problem } from "@/types/game";
import { TECH_REGISTRY, toRegistryId } from "@/data/techRegistry";
import { classifyProjectArchetype } from "@/lib/archetypes";

// Dynamic startup name generators based on category and USP
function generateStartupName(problem: Problem | null, usp: string | null, solutionDirection: string | null): { name: string; tagline: string } {
  if (!problem) return { name: "NovaStart", tagline: "Solving crucial community problems." };
  
  const category = problem.category || "ai";
  const baseWord = problem.title.split(" ")[0] || "Nova";
  
  let suffix = "Hub";
  let tagline = "A modern network for solving complex user problems.";
  
  const uspLower = (usp || "").toLowerCase();
  
  if (category === "edtech") {
    suffix = uspLower.includes("ai") ? "AI" : solutionDirection === "mobile-app" ? "Go" : "Flow";
    tagline = "Empowering cognitive acceleration and localized distributed learning.";
  } else if (category === "healthtech") {
    suffix = "Sync";
    tagline = "Ultra-secure, low-latency telemetry monitoring and emotional response networks.";
  } else if (category === "fintech") {
    suffix = "Trust";
    tagline = "Decentralized transaction verification and transparent peer credit networks.";
  } else if (category === "sustainability") {
    suffix = "Loop";
    tagline = "Localized carbon accounting and carbon-neutral energy marketplaces.";
  } else if (category === "ai") {
    suffix = "Coprocessor";
    tagline = "Context-insulated cognitive agents for enterprise decision intelligence.";
  } else if (category === "smart-campus") {
    suffix = "Grid";
    tagline = "Real-time spatial optimization and crowdsourced campus coordinate hubs.";
  } else {
    suffix = "Node";
    tagline = "Connecting communities through micro-interaction ecosystems.";
  }
  
  const name = `${baseWord} ${suffix}`;
  return { name, tagline };
}

// Map of categories to detailed pain points, target audiences, and alternatives
const CATEGORY_DETAILS: Record<string, {
  primaryUsers: string;
  secondaryUsers: string;
  alternatives: string;
  opportunity: string;
  whyNow: string;
  personas: Array<{ name: string; age: number; role: string; bio: string; painPoint: string; goal: string }>;
}> = {
  edtech: {
    primaryUsers: "Undergraduate students, continuing education learners, self-taught programmers.",
    secondaryUsers: "Academic advisors, university course lecturers, corporate learning supervisors.",
    alternatives: "Static textbook reading, non-adaptive video course playlists, high-friction manual study calendars.",
    opportunity: "Replace outdated linear review paths with dynamic cognitive maps that react to instant baseline recall scores.",
    whyNow: "Democratization of open intelligence and the universal shift towards short-form, high-retention adaptive study formats.",
    personas: [
      {
        name: "Devin K.",
        age: 20,
        role: "Sophomore CS Student",
        bio: "Devin has a heavy course load and struggles with focusing during long, unstructured study sessions. He ends up cramming the night before major examinations.",
        painPoint: "Suffers from acute cognitive overload. Cannot gauge which lecture topics require focus, leading to inefficient recall reviews.",
        goal: "Wants a highly structured, automated daily recall plan that targets his weakest concepts first in under 15 minutes."
      },
      {
        name: "Dr. Eleanor Vance",
        age: 48,
        role: "Associate Professor of Algorithms",
        bio: "Dr. Vance teaches introductory algorithms to 300+ students. She struggles to give personalized revision reviews and notices high dropout rates in early weeks.",
        painPoint: "Zero direct visibility into real-time student baseline comprehension levels outside of formal midterms.",
        goal: "Wants to easily distribute adaptive study review decks and monitor cohort retention curves without manual grading."
      }
    ]
  },
  healthtech: {
    primaryUsers: "Outpatients managing complex schedules, individuals experiencing mental fatigue or acute stress.",
    secondaryUsers: "Clinical caregivers, primary emergency dispatchers, peer support coordinators.",
    alternatives: "Clunky paper medication sheets, delayed clinic callbacks, high-cost therapy checkins.",
    opportunity: "Leverage real-time local sync and secure peer networks to capture vital telemetry or triage emotional stress instantly.",
    whyNow: "Widespread sensor maturity (BLE, wearables) combined with global recognition of localized digital wellness support systems.",
    personas: [
      {
        name: "Arthur M.",
        age: 72,
        role: "Retired Veteran",
        bio: "Arthur manages a complex routine of five daily medications with varying timings. He suffers from slight cognitive decline and low visual contrast sensitivity.",
        painPoint: "Accidentally doubles medication dosages or skips critical capsules due to hard-to-read prescription labels and calendar sheets.",
        goal: "Wants a large-typography, high-readability schedule advisor that sends direct acoustic notifications."
      },
      {
        name: "Chloe S.",
        age: 21,
        role: "University Dorm Resident",
        bio: "Chloe experiences episodic social anxiety and panic markers during finals week. She feels self-conscious about seeking traditional campus counseling clinic slots.",
        painPoint: "High-friction, non-anonymous mental health resources that trigger counseling wait times during high-stress episodes.",
        goal: "Wants an immediate, fully encrypted, anonymous connection to active peer support circles on campus."
      }
    ]
  },
  fintech: {
    primaryUsers: "Grassroots neighborhood project organizers, peer trust circles, students sharing housing.",
    secondaryUsers: "Community audit committees, micro-credit lenders, university billing offices.",
    alternatives: "Non-auditable messaging threads, loose paper spreadsheets, high-fee transactional processors.",
    opportunity: "Deploy a double-entry transparent credit ledger that handles trust rating metrics and splits bills with zero errors.",
    whyNow: "Growing consumer demand for local, transparent micro-transactions and peer-to-peer economic solidarity layers.",
    personas: [
      {
        name: "Rohan P.",
        age: 22,
        role: "Shared House Coordinator",
        bio: "Rohan shares a four-bedroom campus flat. He coordinates utilities, grocery bills, and shared cleaning fees across housemates with different bank accounts.",
        painPoint: "Inefficient manual calculations resulting in rounding errors and uncomfortable text conversations to recoup minor currencies.",
        goal: "Wants a simple, auditable expense split board where household transactions are cleared with absolute mathematical transparency."
      },
      {
        name: "Mrs. Clara Higgins",
        age: 56,
        role: "Neighborhood Coop Manager",
        bio: "Clara runs a local community garden cooperative. She collects small micro-donations from residents to fund seed purchasing and local repairs.",
        painPoint: "Low trust in large-firm transaction platforms due to high processing margins and lack of transparent double-entry accounting.",
        goal: "Wants a local grassroots investment ledger that guarantees public, auditable transaction histories."
      }
    ]
  },
  sustainability: {
    primaryUsers: "Local solar panel owners, carbon-conscious logistics teams, sustainable campus advocates.",
    secondaryUsers: "Grid operators, supply-chain auditors, municipal offset managers.",
    alternatives: "Static utility billing, delayed annual ESG paper audits, high-fee carbon credit brokers.",
    opportunity: "Direct peer-to-peer localized energy and product recycling tracking with immediate verifiable supply-chain checkpoints.",
    whyNow: "Pressing local grid energy constraints combined with strict corporate and university mandates for carbon footprint transparency.",
    personas: [
      {
        name: "Maya L.",
        age: 21,
        role: "Dorm Sustainability Coordinator",
        bio: "Maya manages energy reduction campaigns across dorm blocks. She struggles to engage students due to a lack of immediate feedback and clear metrics.",
        painPoint: "Zero real-time data on dorm block electricity intensity, reducing student motivation to minimize their utility load.",
        goal: "Wants a live telemetry dashboard and localized scoreboard that tracks carbon offsets and enables small peer trades."
      },
      {
        name: "Marcus G.",
        age: 34,
        role: "Sustainable Logistics Lead",
        bio: "Marcus oversees shipping options for a local organic food distributor. He wants to optimize freight routes for lowest emissions.",
        painPoint: "Static, non-adaptive route maps that fail to compare carbon efficiency profiles under changing traffic conditions.",
        goal: "Wants a green routing planner that dynamically updates emissions metrics in real-time."
      }
    ]
  },
  ai: {
    primaryUsers: "Corporate operations teams, customer support leads, code reviewers.",
    secondaryUsers: "Venture analysts, database administrators, developer leads.",
    alternatives: "Manual support ticketing scripts, standard regular expression regex parsers, offshore support staff.",
    opportunity: "Leverage autonomous context-length safe coprocessors and vector-indexing RAG pipelines to automate complex triage logs.",
    whyNow: "Production maturity of vector databases and orchestrators, making local, high-security semantic inference extremely cost-efficient.",
    personas: [
      {
        name: "Sam T.",
        age: 29,
        role: "Customer Operations Director",
        bio: "Sam runs a rapidly scaling service desk. His team is buried in repetitive customer requests, causing response latencies to blow past SLA limits.",
        painPoint: "Struggling with hallucinated replies from generic AI tools that lack secure enterprise context insulation.",
        goal: "Wants an autonomous multi-agent coprocessor that triages support logs safely and auto-escalates non-deterministic scenarios."
      },
      {
        name: "Kiara J.",
        age: 27,
        role: "Lead DevOps Architect",
        bio: "Kiara oversees code quality and continuous integration. Structural race conditions and memory leaks frequently slip through into main branch deploys.",
        painPoint: "Hours of manual code review spent tracing complex race conditions that delay shipping schedules.",
        goal: "Wants an automated pull-request debugger that intercepts git branches and parses large files in seconds."
      }
    ]
  },
  "smart-campus": {
    primaryUsers: "Campus commuters, residential dorm students, library study session groups.",
    secondaryUsers: "Campus facilities directors, dormitory managers, campus parking enforcement.",
    alternatives: "Delayed facilities schedules, physical room signups, driving around campus in circles looking for open spaces.",
    opportunity: "Leverage crowdsourced coordinate grids, peak laundry indicators, and ambient noise markers to optimize library check-ins.",
    whyNow: "Ubiquitous smartphone penetration and localized student coordination, enabling direct hyper-local mesh solutions.",
    personas: [
      {
        name: "Nikhil S.",
        age: 19,
        role: "First-Year Engineering Student",
        bio: "Nikhil spends his days running between lecture halls. He often needs to find quiet, low-bandwidth-friendly spaces to study in concrete dorm blocks.",
        painPoint: "Arriving at campus study rooms only to find them completely packed, wasting precious preparation time between classes.",
        goal: "Wants an offline-first navigation app that tracks seat occupancy and shows ambient noise levels in real-time."
      },
      {
        name: "Sarah W.",
        age: 21,
        role: "Resident Assistant (RA)",
        bio: "Sarah manages a residential floor of 60 freshmen. Laundry room queue conflicts and appliance energy spikes are constant headaches.",
        painPoint: "Overlapping laundry slot claims and high dormitory utility footprint spikes during peak weekend laundry hours.",
        goal: "Wants an intuitive, synchronized laundry telemetry tracker that handles reservation scheduling dynamically."
      }
    ]
  }
};

const DEFAULT_CATEGORY_DETAILS = {
  primaryUsers: "General community members, early adopters, and target consumers.",
  secondaryUsers: "System administrators, operators, and commercial sponsors.",
  alternatives: "Legacy spreadsheet tracking, fragmented messaging threads, and high-friction manual reporting.",
  opportunity: "Build a modern, highly cohesive, single-purpose software layer targeting this specific friction.",
  whyNow: "Universal mobile access and consumer willingness to adopt micro-transactional, community-centric tools.",
  personas: [
    {
      name: "Alex Johnson",
      age: 24,
      role: "Early Adopter",
      bio: "Alex balances work and personal routines, actively seeking clean tech tools to save time.",
      painPoint: "High friction across outdated platforms that fail to solve direct local needs.",
      goal: "Wants a highly optimized, zero-bloat product that addresses core tasks under 3 clicks."
    },
    {
      name: "Taylor Smith",
      age: 32,
      role: "Operations Supervisor",
      bio: "Taylor oversees team performance and resource tracking, looking to replace paper spreadsheets.",
      painPoint: "Lack of centralized, auditable telemetry data and unified logs.",
      goal: "Wants a clean dashboard that connects team workflows without system latency."
    }
  ]
};

// Rebuild nice-to-have and overkill backlog features since we only have must-haves in gameStore.features
function reconstructBacklogBuckets(mustFeatures: Feature[]): { must: Feature[]; nice: Feature[]; overkill: Feature[] } {
  const allFeatures: Feature[] = [
    { id: "feat-ai", name: "AI Assistant", description: "Secures search logs", effort: "medium", impact: "high" },
    { id: "feat-chat", name: "Interactive Chat", description: "Peer messaging streams", effort: "low", impact: "high" },
    { id: "feat-maps", name: "Campus Maps Grid", description: "Indoor study coordinates", effort: "medium", impact: "medium" },
    { id: "feat-analytics", name: "Emissions Analytics", description: "Live telemetry dashboards", effort: "medium", impact: "high" },
    { id: "feat-game", name: "Study Gamification", description: "Streaks and study locks", effort: "low", impact: "medium" },
    { id: "feat-lead", name: "Emissions Leaderboard", description: "Direct community matches", effort: "low", impact: "medium" },
    { id: "feat-pay", name: "Micro Loans Payments", description: "Secured transactions checkouts", effort: "high", impact: "high" },
    { id: "feat-notif", name: "Urgent Notifications", description: "Offline push channels", effort: "low", impact: "medium" },
    { id: "feat-voice", name: "Local Voice Assistant", description: "Dialect audio synthesizer", effort: "high", impact: "high" },
    { id: "feat-ar", name: "AR Navigation View", description: "Virtual indoor coordinate overlays", effort: "high", impact: "high" },
  ];

  const mustIds = new Set(mustFeatures.map(f => f.id));
  const must = allFeatures.filter(f => mustIds.has(f.id));
  const remaining = allFeatures.filter(f => !mustIds.has(f.id));

  // High effort ones that are not in must-haves naturally map to Overkill
  const overkill = remaining.filter(f => f.effort === "high");
  // Low/Medium effort ones map to Nice-to-Have
  const nice = remaining.filter(f => f.effort !== "high");

  return { must, nice, overkill };
}

/**
 * Procedurally compiles a complete, venture-grade startup Product Requirements Document.
 */
export function generatePRD(state: GameState): string {
  const problem = state.selectedProblem;
  const category = problem?.category || "ai";
  const details = CATEGORY_DETAILS[category] || DEFAULT_CATEGORY_DETAILS;
  const { name: startupName, tagline: startupTagline } = generateStartupName(problem, state.usp, state.solutionDirection);
  
  const feedback = state.judgeFeedback[state.judgeFeedback.length - 1];
  const finalScoreVal = feedback?.score || 0;
  const displayScore = (finalScoreVal / 2).toFixed(1);
  
  const getGrade = (score: number) => {
    if (score >= 94) return "S";
    if (score >= 84) return "A";
    if (score >= 72) return "B";
    if (score >= 60) return "C";
    if (score >= 48) return "D";
    return "F";
  };
  const grade = getGrade(finalScoreVal);

  const archetype = classifyProjectArchetype({
    techStack: state.techStack,
    features: state.features,
    usp: state.usp,
    businessModel: state.businessModel,
    solutionDirection: state.solutionDirection,
  });

  const { must, nice, overkill } = reconstructBacklogBuckets(state.features);

  // Dynamic user flow text based on solution direction
  let userFlowContent = "";
  const solDir = state.solutionDirection || "web-app";
  
  if (solDir === "ai-solution" || (state.usp || "").toLowerCase().includes("ai")) {
    userFlowContent = `
### Workflow A: Cognitive Processing & Semantic Query Loop
1. **User Query Input**: The user inputs an unpolished text prompt or uploads an unstructured context payload (e.g., lecture recordings, support logs).
2. **Context Resolution**: The LangChain / LlamaIndex pipeline intercepts the prompt, tokenizes the text, and sends it to our local Vector DB (Pinecone/Weaviate) to fetch semantic neighbor nodes.
3. **Prompt Synthesis**: The client's input is combined with vector context injections into a highly insulated corporate system prompt.
4. **LLM Inference**: The compiled prompt is sent to the LLM (OpenAI/Gemini/Claude) with low temperature parameters to suppress hallucinations.
5. **Output Generation & Action**: The structured semantic response is parsed into clean markdown blocks, displayed to the user, and saved to the audit log database.

### Workflow B: Safe Agent Escalation Flow
1. **Exception Event**: The AI system encounters a low-confidence or non-deterministic prompt that falls outside standard semantic index margins.
2. **Graceful Triage**: Rather than returning a hallucinated recommendation, the system triggers a secure exception event handler.
3. **Human Intercept**: The prompt is automatically routed to the customer service admin queue with a comprehensive system trace log.
`;
  } else if (solDir === "marketplace" || state.businessModel === "Marketplace") {
    userFlowContent = `
### Workflow A: Peer Search & Secure Checkout Loop
1. **Browse Exchange**: A buyer opens the marketplace portal and filters localized listings by category, trust score, and availability.
2. **Secure Reservation**: The buyer clicks "Reserve" on a community listing (e.g., solar surplus energy, tools).
3. **Database Transaction Lock**: The backend locks the relational database record (PostgreSQL/MySQL) to prevent double-booking or transaction races.
4. **Stripe Payment Escrow**: The system triggers Stripe payment processing, holding funds in secure escrow.
5. **Fulfillment Verification**: The seller confirms exchange fulfillment, releasing escrowed payments to the seller's wallet balance.

### Workflow B: Seller Onboarding & Reputation Loop
1. **Profile Activation**: The seller signs up via custom authentication, filling out trust terms.
2. **Reputation Assessment**: The backend evaluates baseline metrics and calculates a public trust rating.
3. **Active Listing Creation**: The seller posts a new listing, instantly notifying active buyers via websocket channels.
`;
  } else if (solDir === "mobile-app") {
    userFlowContent = `
### Workflow A: Mobile Onboarding & Bluetooth Mesh Sync
1. **App Download & Local Auth**: The user installs the native mobile app, signing in securely via standard auth.
2. **Local Storage Setup**: The app provisions a lightweight local database (SQLite/CouchDB) to store local datasets.
3. **Acoustic / Local Alert Listeners**: The system starts background notification alerts and local Bluetooth mesh sync protocols.
4. **Offline Coordinate Logging**: As the student enters a dense concrete campus zone with zero cell coverage, coordinates are saved locally to the offline cache.
5. **Gateway Synchronization**: Once cellular or wifi gateways are detected, the app pushes pending telemetry sync packages within 50ms.

### Workflow B: Push Notification Alert Triage
1. **Sensor Trigger**: A localized BLE sensor emits a telemetry marker.
2. **Device Push Delivery**: The system intercepts the sensor telemetry and pushes a large-contrast push alert, even if the device is in low-power state.
`;
  } else if (solDir === "iot-product") {
    userFlowContent = `
### Workflow A: Telemetry Sensor Logging & Relay Loop
1. **Signal Sampling**: The physical microcontroller (ESP32/Arduino) wakes up from low-power sleep and samples soil moisture or room occupancy telemetry sensors.
2. **Analog-to-Digital Parsing**: The chip's hardware digitizes the signal metrics.
3. **Local SQLite Cache**: The digitized log is recorded to a local SQLite database to protect against connection failure.
4. **MQTT Telemetry Push**: The board broadcasts the payload over an encrypted MQTT channel to a centralized gateway node.
5. **Gateway Storage**: The gateway ingests the package, updates the database, and pushes the live telemetry to dashboards within 500ms.

### Workflow B: Local Over-the-Air Device Provisioning
1. **Device Power Up**: A new board is powered on, broadcasting a temporary local BLE provisioning network.
2. **Gateway Match**: The administrative gateway connects, sends network certificates, and binds the board ID in the system directory.
`;
  } else {
    userFlowContent = `
### Workflow A: Web Dashboard Session & Real-Time Sync
1. **Portal Entry & MFA Auth**: The user visits the web app and authenticates, receiving a secure session cookie.
2. **Dashboard Compilation**: The Next.js frontend retrieves structured data from PostgreSQL, rendering telemetry analytics.
3. **Websocket Mesh Connection**: A real-time websocket connection is established between client and backend.
4. **Telemetry Ingestion**: Any updates made by other community stakeholders instantly flash onto the current dashboard using CSS micro-animations.
5. **Auditable Report Generation**: The user selects a date range, compiles audit parameters, and downloads a plain-text double-entry ledger.

### Workflow B: Collaboration Workspace Setup
1. **Workspace Initiation**: A user clicks "Create Workspace" and invites team emails.
2. **Database Record Replication**: Relational records are instantly duplicated in the database, with custom lock permissions.
`;
  }

  // Compile detailed Tech Stack paragraphs with custom justifications
  let techArchitectureDetails = "";
  if (state.techStack.length > 0) {
    techArchitectureDetails = state.techStack.map((tech) => {
      const regId = toRegistryId(tech.id);
      const registryItem = TECH_REGISTRY.find(t => t.id === regId);
      
      let justification = "Serves as a fundamental operational module within the engineering architectural blueprint, providing predictable performance and strict stability guarantees.";
      
      // Specialize justifications for common tech stack items
      if (tech.name.includes("Next.js")) {
        justification = "Acts as our core frontend framework. By utilizing Server-Side Rendering (SSR) and React Server Components (RSC), Next.js dramatically reduces Largest Contentful Paint (LCP) times and allows for instantaneous page loads. It fully aligns with our high-performance goals by caching database queries at the server border.";
      } else if (tech.name.includes("React")) {
        justification = "Serves as the library for modular UI creation. Its reactive virtual DOM guarantees fluid user interactions, which are combined with Framer Motion animations to provide a beautiful and responsive premium aesthetic.";
      } else if (tech.name.includes("FastAPI")) {
        justification = "Provides our high-performance, asynchronous Python API backend. FastAPI is critical for our AI workloads because it offers native support for async background threads, automatic OpenAPI schema compilation, and near-zero serialization latency.";
      } else if (tech.name.includes("Node.js") || tech.name.includes("Express")) {
        justification = "Formulates our lightweight, asynchronous backend server layer. By relying on a non-blocking event-driven loop, Node.js excels at managing concurrent real-time websocket connections and lightning-fast JSON API routing.";
      } else if (tech.name.includes("PostgreSQL") || tech.name.includes("postgres")) {
        justification = "Powers our core persistent database layer. Chosen for its strict ACID compliance, relational sanity guarantees, and advanced indexing capabilities. For our transactional splitting and ledger audits, PostgreSQL prevents rounding errors and ensures double-entry consistency.";
      } else if (tech.name.includes("MongoDB") || tech.name.includes("mongodb")) {
        justification = "Acts as our flexible document-based NoSQL database. MongoDB handles unstructured logs, user profile metadata, and dynamic schema parameters perfectly, facilitating lightning-fast read operations without rigid schema migrations.";
      } else if (tech.name.includes("Vercel")) {
        justification = "Powers our global edge hosting deployment infrastructure. Vercel automatically deploys our serverless functions across worldwide edge nodes, guaranteeing sub-50ms TTFB (Time to First Byte) latency profiles.";
      } else if (tech.name.includes("AWS")) {
        justification = "Hosts our enterprise infrastructure lattice. By leveraging secure EC2 nodes, Auto-Scaling Groups, RDS database mirrors, and cloud backup systems, AWS provides 99.99% system availability profiles.";
      } else if (tech.name.includes("Docker")) {
        justification = "Guarantees architectural reproducibility. By packaging our database migrations, backend runtimes, and web servers into light container volumes, Docker ensures absolute parity between local staging and cloud production runtimes.";
      } else if (tech.name.includes("Gemini") || tech.name.includes("OpenAI") || tech.name.includes("Claude")) {
        justification = `Powers our advanced semantic inference pipeline. We feed custom systems-prompts into the native ${tech.name} API using vector context injections, unlocking contextual suggestions, transcribing raw logs, and generating automated advice with absolute coherence.`;
      } else if (tech.name.includes("Arduino") || tech.name.includes("ESP32")) {
        justification = `Serves as the hardware core. Operating as a low-power microcontroller, the ${tech.name} manages analog-to-digital signal conversions, records raw sensor telemetry, and communicates with local gateway nodes via encrypted BLE protocols.`;
      } else if (registryItem) {
        justification = `Integrated as a core ${registryItem.category} component. It plays an essential role by utilizing its tags (${registryItem.tags.join(", ")}) to optimize execution speeds and establish robust synergies within the wider architecture stack.`;
      }
      
      return `#### ${tech.name} (${registryItem?.category || "Infrastructure"})
* **Role**: Primary developer tooling for our ${registryItem?.category.toLowerCase() || "operational"} ecosystem layer.
* **Architecture Justification**: ${justification}`;
    }).join("\n\n");
  } else {
    techArchitectureDetails = "*No technologies selected.* Setup a standard modern full-stack: Next.js frontend, Node.js API backend, PostgreSQL database, and Vercel hosting.";
  }

  // Compile Monetization Pricing Assumptions based on chosen business model
  let monetizationPricing = "";
  const bizModel = state.businessModel || "B2B SaaS";
  
  if (bizModel === "B2B SaaS") {
    monetizationPricing = `
* **Revenue Source**: Multi-tier recurring licensing models charged directly to institutional partners (e.g., campus administrations, university libraries, clinical centers).
* **Pricing Assumptions**: 
  * **Department Tier**: $249/month up to 500 active users.
  * **Enterprise Tier**: $999/month for full campus site-wide coverage, unlimited seats, and dedicated system trace audits.
* **Scaling Strategy**: Seed early adoption inside 3 regional university departments, gather glowing pilot summaries, and expand to university procurement panels.
* **Unit Economics Assumptions**: Gross margin of >85%. Customer Acquisition Cost (CAC) estimated at $150 to sign a $3,000 annual contract, yielding an LTV:CAC ratio of 20:1.
`;
  } else if (bizModel === "Freemium") {
    monetizationPricing = `
* **Revenue Source**: Free core consumer access with premium, high-value individual consumer subscriptions.
* **Pricing Assumptions**:
  * **Basic Tier**: $0/month. Standard baseline tracking, standard notifications, and basic AI summaries.
  * **Premium Student Tier**: $5.99/month. Includes advanced vector spaced-repetition, full offline navigation, dynamic noise indices, and priority AI recommendations.
  * **Premium Pro Tier**: $12.99/month. Tailored corporate analytics and automated auditable double-entry accounting.
* **Scaling Strategy**: Low-barrier organic onboarding via social-impact word of mouth, driving a conversion goal of 8% of free users to paid subscriptions.
* **Unit Economics Assumptions**: Server cost per free user is minimized at $0.05/month. Paid user Gross Margin is >90%, with an LTV estimated at $72 based on 12-month retention.
`;
  } else if (bizModel === "Marketplace") {
    monetizationPricing = `
* **Revenue Source**: Transactional take-rate commission fee applied to completed exchanges.
* **Pricing Assumptions**:
  * **Standard Take Rate**: 5% of transactional value charged to the transaction seller (e.g., localized solar trading, micro-loans coordination).
  * **Platform Service Fee**: $0.49 flat processing fee on each transaction payout to cover Stripe processing rails.
* **Scaling Strategy**: Create localized supply pools first, recruit student groups to register surplus offsets, and trigger high buyer liquidity through community rewards.
* **Unit Economics Assumptions**: Highly transactional with low administrative friction. Customer Lifetime Value (LTV) grows proportionally with transaction volume, aiming for $12 average transaction values.
`;
  } else if (bizModel === "Government Partnership") {
    monetizationPricing = `
* **Revenue Source**: Strategic municipal grant allocations and university offset budget sponsorship.
* **Pricing Assumptions**:
  * **Pilot Phase Grant**: $50,000 non-dilutive city innovation funding for a 6-month proof of concept.
  * **Annual Operational Contract**: $45,000 municipal service level agreement, funding system upkeep and emissions auditing dashboards.
* **Scaling Strategy**: Partner with public regulatory boards and utilize the local green sustainability initiatives to offset implementation expenses.
* **Unit Economics Assumptions**: High initial sales cycles but zero churn once integrated into institutional municipal code budgets.
`;
  } else {
    monetizationPricing = `
* **Revenue Source**: Transactional platform fee combined with basic corporate support contracts.
* **Pricing Assumptions**:
  * **Platform Access Fee**: $19/month per project workspace.
  * **Institutional SLA**: $150/month for custom audit trails and advanced integrations.
* **Scaling Strategy**: Scale via open developer tool APIs, targeting organic growth through early developer adopters.
* **Unit Economics Assumptions**: Gross margin of >80%, aiming for payback of customer acquisition costs within 3 months of registration.
`;
  }

  // Mitigations for chaos events and judge feedback
  let risksAndChallengesContent = "";
  
  // 1. Technical Risks based on stack and chaos events
  const chaosIds = new Set(state.chaosHistory);
  let techRisk = "System compilation failure under rapid scaling cycles.";
  let techMitigation = "Deploy strict automated testing sandboxes and integrate Docker container parity across developer systems.";
  
  if (chaosIds.has("database-crash") || chaosIds.has("infra-melt")) {
    techRisk = "Critical database connection drop and service outage due to rapid influx of client threads.";
    techMitigation = "Implement connection pool limits, redundant replica instances, and a robust fallback offline-caching layer using local SQLite databases.";
  } else if (chaosIds.has("ai-hallucinate")) {
    techRisk = "System halluncination risks and vector database latency spikes under high query loads.";
    techMitigation = "Introduce system-prompt guardrails, strict temperature caps (<= 0.2), and semantic cache layers like Redis to skip repetitive LLM calls.";
  }
  
  // 2. Product Risks based on features and judge feedback
  let prodRisk = "Competitor clones creating features and under-scoping MVP value.";
  let prodMitigation = "Ensure high-fidelity micro-interactions and leverage our proprietary USP to establish defensible user value loops.";
  
  if (state.features.length > 3) {
    prodRisk = "Severe product scope bloat causing shipping delays and infrastructure lag.";
    prodMitigation = "Ruthlessly enforce feature scoping limits by moving non-critical items into the Overkill bucket, focusing purely on 2-3 Must-Have MVP flows.";
  } else if (state.features.length < 2) {
    prodRisk = "Under-scoped feature backlog failing to capture baseline consumer value.";
    prodMitigation = "Onboard the most critical features in the Nice-to-Have queue into the MVP backlog, integrating spacing repetitions and interactive loops.";
  }
  
  // 3. Business Risks based on Business Model and Judge Comments
  let bizRisk = "High Customer Acquisition Cost (CAC) exceeding lifetime value margins.";
  let bizMitigation = "Leverage organic community onboarding channels and campus department recommendations to drive organic growth with $0 CAC loops.";
  
  if (feedback?.comment.toLowerCase().includes("unit economics") || feedback?.comment.toLowerCase().includes("economic")) {
    bizRisk = "Vulnerable unit economics and monetization sustainability concerns raised during jury audits.";
    bizMitigation = "Revise pricing templates immediately. transition B2B licensing structures to premium volume tiers and audit infrastructure server costs.";
  } else if (feedback?.comment.toLowerCase().includes("accessibility") || feedback?.comment.toLowerCase().includes("contrast")) {
    bizRisk = "Accessibility compliance gap risking user exclusion and regulatory friction.";
    bizMitigation = "Refactor UI system immediately. Run WCAG 2.1 compliance audits, implement high-contrast typography, and add support for system screen readers.";
  }

  risksAndChallengesContent = `
### Technical Risks
* **Risk**: ${techRisk}
* **Mitigation Strategy**: ${techMitigation}

### Product Risks
* **Risk**: ${prodRisk}
* **Mitigation Strategy**: ${prodMitigation}

### Business Risks
* **Risk**: ${bizRisk}
* **Mitigation Strategy**: ${bizMitigation}
`;

  // Dynamic next recommended actions based on archetype and grade
  let nextRecommendedAction = "";
  if (archetype.id === "overengineer") {
    nextRecommendedAction = "Ruthlessly strip down the cloud infrastructure stack. Drop redundant Docker container configurations and AWS scaling lattices. Re-compile a lightweight frontend using Next.js and Vercel edge hosting, and launch the MVP in under 48 hours to secure early user feedback.";
  } else if (archetype.id === "minimalist") {
    nextRecommendedAction = "Begin qualitative target user validation interviews immediately. With your exceptionally clean, disciplined codebase, you are well-positioned to scale. Add the single most requested differentiator from early cohort feedback before competitor clones catch up.";
  } else if (archetype.id === "hacker") {
    nextRecommendedAction = "Prioritize a complete security and stability audit. Sweep the codebase for memory leaks, clean up inline comments and duct-taped API connections, and implement a robust authentication flow (like Supabase Auth or Clerk) before onboarding early paying users.";
  } else if (archetype.id === "hustler") {
    nextRecommendedAction = "Begin building the actual application database backend. While your unit economics, pitch presentation, and monetization models are venture-grade, the application requires functional implementation. Deploy PostgreSQL and Node.js backend pipelines immediately.";
  } else if (archetype.id === "visionary") {
    nextRecommendedAction = "Validate the technical feasibility of your disruptive USP. Run stress tests on the AI prompt-insulations or test soil telemetry sensor grids under high packet drop settings to confirm that the product holds up under real-world constraints.";
  } else {
    nextRecommendedAction = "Apply to high-caliber accelerator programs (such as Y-Combinator, Techstars, or local startup hubs) immediately. Your exceptionally balanced execution across tech depth, design finesse, and business acuteness represents a stellar seed-stage candidate.";
  }

  const confidenceScore = Math.min(99, Math.max(75, Math.round(75 + (finalScoreVal - 72) * 0.85)));
  
  let startupRating = "Promising Seed Bootstrapper (Tier B)";
  if (grade === "S") {
    startupRating = "Venture-Scale Unicorn Potential (Tier S)";
  } else if (grade === "A") {
    startupRating = "High-Growth Accelerator Target (Tier A)";
  }

  // --- FINAL PRD COMPILE ---
  return `# Product Requirements Document

## 1. Executive Summary

* **Product Name**: ${startupName}
* **Startup Pitch**: ${startupTagline}
* **Problem Solved**: Directly addresses the critical user pain points by replacing complex, high-friction legacy systems with our highly cohesive, single-purpose ${solDir.replace("-", " ")} solution.
* **Why Now**: The confluence of modern full-stack developer efficiency, AI/ML API models accessibility, and high consumer willingness to adopt targeted, decentralized local services creates an immediate wedge opportunity.

---

## 2. Problem Statement

Our primary product discovery exercises indicate that users suffer under high operational friction in the **${category.replace("-", " ").toUpperCase()}** domain:
* **Target Users**: ${details.primaryUsers}
* **Core Pain Points**: Outlined by our selected hackathon problem: **"${problem?.description}"**. Specifically, the lack of real-time automation and secure verification loops causes hours of manual tracing.
* **Existing Alternatives**: ${details.alternatives}
* **Our Opportunity**: ${details.opportunity} We bypass complex interfaces entirely, offering a lightweight, hyper-focused portal directly matched to the user's workflow.

---

## 3. Target Audience

### Primary Users
* ${details.primaryUsers}
* Users who prioritize zero-friction workflows and need immediate local results under three taps.

### Secondary Users
* ${details.secondaryUsers}
* Administrative managers who require clear audit logs, performance oversight, and structured reports.

### User Personas

#### Persona A: ${details.personas[0].name} (Age: ${details.personas[0].age}) — ${details.personas[0].role}
* **Bio**: ${details.personas[0].bio}
* **Primary Pain Point**: ${details.personas[0].painPoint}
* **Strategic Goal**: ${details.personas[0].goal}

#### Persona B: ${details.personas[1].name} (Age: ${details.personas[1].age}) — ${details.personas[1].role}
* **Bio**: ${details.personas[1].bio}
* **Primary Pain Point**: ${details.personas[1].painPoint}
* **Strategic Goal**: ${details.personas[1].goal}

---

## 4. Product Vision

* **Long-Term Vision**: To build the definitive transaction and interaction standard for communities within the ${category.replace("-", " ")} sector, bridging operational telemetry with automated trust networks.
* **Mission**: To erase daily coordination friction for ${details.primaryUsers.split(",")[0]} by providing a surgical, lightning-fast application layer.
* **Core Value Proposition**: A unified, high-integrity platform that ensures absolute data security, robust offline support, and highly intuitive UX design, yielding a 10x improvement in task completion speed.

---

## 5. Feature Requirements

We have prioritized our software backlog based on a 3-bucket product scoping discipline:

### MVP Features (Priority: High / Bucket: Must-Have)
${must.length > 0 ? must.map(f => `* **${f.name}**: ${f.description}. Mapped to early deployment schedules. Enables core user onboarding and transaction capability.`).join("\n") : "*No MVP features selected.*"}

### Phase 2 Features (Priority: Medium / Bucket: Nice-to-Have)
${nice.length > 0 ? nice.map(f => `* **${f.name}**: ${f.description}. Scheduled for post-launch optimization. Focuses on user retention and analytics amplification.`).join("\n") : "*No Phase 2 features.*"}

### Future Features (Priority: Low / Bucket: Overkill)
${overkill.length > 0 ? overkill.map(f => `* **${f.name}**: ${f.description}. Postponed to preserve execution velocity. Focuses on automated voice compilation or scaling architectures.`).join("\n") : "*No Future features.*"}

---

## 6. User Flow

The core user experience is mapped in detail to our selected **${solDir.toUpperCase()}** direction:
${userFlowContent}

---

## 7. Technical Architecture

Our engineering framework is designed for high modularity, leveraging the exact technologies integrated during the hackathon prototype build:

### Frontend
${state.techStack.filter(t => ["Frontend", "Design / UI", "AR / VR"].includes(TECH_REGISTRY.find(r => r.id === toRegistryId(t.id))?.category || "")).map(t => `* **${t.name}**: Integrated for our UI presentation layer.`).join("\n") || "*Standard client layout framework (Next.js/React).*"}

### Backend
${state.techStack.filter(t => ["Backend", "Automation", "Realtime / Messaging"].includes(TECH_REGISTRY.find(r => r.id === toRegistryId(t.id))?.category || "")).map(t => `* **${t.name}**: Integrated for API orchestration.`).join("\n") || "*Standard API routing framework (Node.js/Express).*"}

### Database
${state.techStack.filter(t => ["Database", "Blockchain / Web3"].includes(TECH_REGISTRY.find(r => r.id === toRegistryId(t.id))?.category || "")).map(t => `* **${t.name}**: Integrated for transactional storage.`).join("\n") || "*Standard persistent storage (PostgreSQL/MongoDB).*"}

### Infrastructure & Deployment
${state.techStack.filter(t => ["Hosting / Infra", "DevOps"].includes(TECH_REGISTRY.find(r => r.id === toRegistryId(t.id))?.category || "")).map(t => `* **${t.name}**: Integrated for edge delivery and packaging.`).join("\n") || "*Standard edge hosting deployment (Vercel).*"}

### AI & Hardware Components
${state.techStack.filter(t => ["AI / ML", "IoT / Hardware", "Authentication", "Payments", "Analytics", "Productivity APIs", "Mobile"].includes(TECH_REGISTRY.find(r => r.id === toRegistryId(t.id))?.category || "")).map(t => `* **${t.name}**: Specialized pipeline integration.`).join("\n") || "*No specialized hardware or AI APIs.*"}

### Detailed Architectural Justification
${techArchitectureDetails}

* **Deployment Strategy**: Automatic triggers deploy Vercel serverless staging branches on every GitHub pull request. Main branch deployments automatically synch with auto-scaling EC2 clusters on AWS.

---

## 8. Monetization Strategy

We monetize the product using the **${bizModel.toUpperCase()}** model:
${monetizationPricing}

---

## 9. Success Metrics

We measure our operational health using four key metrics categories:

### User Retention (LTV)
* **Monthly Churn Rate**: Target < 3% for institutional contracts, and < 5% for Freemium premium tiers.
* **Cohort LTV**: Track user lifetime value target thresholds of > $72 based on 12-month retention.

### User Activation & Engagement
* **Daily Active / Monthly Active ratio (DAU/MAU)**: Target > 30%, indicating high daily habit forming.
* **Task Completion Success**: Percentage of users who complete their main flow in under 90 seconds (Target > 95%).

### Revenue and Unit Economics
* **LTV to CAC Ratio**: Target > 4:1 to justify marketing acquisition expenditures.
* **Gross Profit Margin**: Target > 85% by maintaining strict server border query caching.

### Technical Performance
* **Telemetry Sync Success**: Percentage of offline sensor packets synchronized without loss (Target > 99.9%).
* **Largest Contentful Paint (LCP)**: Target < 1.5 seconds under standard low-bandwidth settings.

---

## 10. Risks and Challenges

We actively mitigate core operational risks identified during the hackathon judging review:
${risksAndChallengesContent}

---

## 11. Competitive Advantage

Our competitive advantage rests on our core **Unique Selling Proposition (USP)**:
* **Selected USP**: **"${state.usp || "Clean, high-cohesion MVP execution"}"**.
* **USP Impact**: Unlike bloated enterprise incumbents who require complex onboarding sequences, we deliver instant utility.
* **Defensibility**: By coupling localized integrations with proprietary user trust models, we create high network switching costs that protect our market share.

---

## 12. Roadmap

### Month 1: Foundation & Sandbox Validation
* Finalize the core Next.js backend routing and deploy a sandboxed staging directory.
* Implement custom authentication and verify database ACID locks.
* Run local stress testing on AI inference pipelines or BLE mesh configurations.

### Month 3: Private Cohort Launch & Feedback
* Onboard 100 highly qualified early student/corporate users.
* Track daily task completion times and resolve accessibility/contrast constraints.
* Optimize database query caching to reduce server costs under $0.05/user/month.

### Month 6: Public Release & Monetization Trigger
* Open public enrollment with self-serve billing loops activated via Stripe.
* Trigger targeted marketing campaigns across local departments to maintain $0 CAC.
* Achieve $5,000 Monthly Recurring Revenue (MRR).

### Month 12: Series A & Scaling
* Deploy automated regional database mirrors across secondary geographic regions.
* Launch dedicated cross-market partnerships.
* Complete VC seed-stage fundraising, targeting a $1.5M valuation.

---

## 13. Investor Snapshot

* **The Elevator Pitch**: ${startupName} is the first hyper-focused ${solDir.replace("-", " ")} solution designed to erase coordination and transactional friction in the ${category.replace("-", " ")} sector, monetized through high-margin B2B recurring licenses.
* **Market Opportunity**: The total addressable market (TAM) for localized community optimization in our domain is valued at $2.4B, with a Serviceable Addressable Market (SAM) of $120M across academic and green-energy channels.
* **Why Investors Care**: We offer a surgical, proven product blueprint, validated by specialist judges. With a validated Gross Margin of >85% and organic $0 CAC loops, this is a premium high-growth seed candidate.

---

## 14. Final Verdict

Based on the official jury assessment of our project build:
* **Final Score**: **${displayScore}/50** (Scale: 0-50)
* **Final Grade**: **Grade ${grade}** (Jury Grade Index: S/A/B/C/D/F)
* **Jury Evaluation**: *"${feedback?.comment || "Builds cleanly with high market readiness."}"*
* **Project Archetype**: **${archetype.name}** (${archetype.subtitle})

> [!NOTE]
> **Venture Assessment**: **"${state.score.total >= 72 ? "SHOULD BE PURSUED IMMEDIATELY" : "REQUIRES STRATEGIC SCRAPPING"}"**

* **Confidence Score**: **${confidenceScore}/100**
* **Startup Potential Rating**: **${startupRating}**
* **Recommended Next Action**: ${nextRecommendedAction}
`;
}

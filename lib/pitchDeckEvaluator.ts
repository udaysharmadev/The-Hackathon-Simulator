export interface SlideComponent {
  id: string;
  name: string;
  description: string;
  category: 'intro' | 'problem-solution' | 'technology' | 'business' | 'closing';
}

export const AVAILABLE_SLIDES: SlideComponent[] = [
  // Original 17 Slides
  { id: 'title', name: 'Title / Logo', description: 'Introduce your project name, team logo, and initial hook.', category: 'intro' },
  { id: 'problem', name: 'Problem', description: 'Clearly explain the urgent customer pain point and target user frustration.', category: 'problem-solution' },
  { id: 'solution', name: 'Solution', description: 'Present your concept and how it directly relieves the user pain.', category: 'problem-solution' },
  { id: 'usp', name: 'USP (Unique Selling Proposition)', description: 'Explain your secret sauce and why you stand out from options.', category: 'problem-solution' },
  { id: 'market', name: 'Market Size (TAM/SAM/SOM)', description: 'Demonstrate scale and addressable target revenue potential.', category: 'business' },
  { id: 'competitors', name: 'Competitor Analysis', description: 'Map out your competitive landscape and defensible product moats.', category: 'business' },
  { id: 'tech-stack', name: 'Tech Stack', description: 'Display the framework layers, databases, and microservices chosen.', category: 'technology' },
  { id: 'architecture', name: 'System Architecture', description: 'Showcase database mapping, API integrations, and scaling grids.', category: 'technology' },
  { id: 'demo', name: 'Demo Showcase', description: 'Walk through your live functional MVP flow and core UX layouts.', category: 'technology' },
  { id: 'business-model', name: 'Business Model', description: 'Details pricing, unit economics, and client acquisition channels.', category: 'business' },
  { id: 'revenue', name: 'Revenue Projection', description: 'Provide a clean three-year financial monetization roadmap.', category: 'business' },
  { id: 'traction', name: 'Traction & Validation', description: 'Show user validation survey results, test signups, or prototype logs.', category: 'business' },
  { id: 'impact', name: 'Social & Green Impact', description: 'Highlight sustainable offsets, carbon footprints, or social benefit.', category: 'closing' },
  { id: 'roadmap', name: 'Future Roadmap', description: 'Detail upcoming scope additions and development milestones.', category: 'closing' },
  { id: 'team', name: 'Team Profile', description: 'Highlight key developer skills and academic/corporate credits.', category: 'intro' },
  { id: 'references', name: 'References & Sources', description: 'Provide credit to external datasets, APIs, and literature sources.', category: 'closing' },
  { id: 'thank-you', name: 'Thank You / Q&A', description: 'Concluding slide calling for judge questions and team contact.', category: 'closing' },

  // New 14 Slides (Update v1.5 Refactor)
  { id: 'user-journey', name: 'User Journey', description: 'Step-by-step storyboard tracing a target user through their workflow.', category: 'problem-solution' },
  { id: 'customer-persona', name: 'Customer Persona', description: 'Profile of your ideal customer, detailing behaviors, age, and needs.', category: 'intro' },
  { id: 'prototype-screens', name: 'Prototype Screens', description: 'High-fidelity UI mockups and interactive wireframe screen maps.', category: 'technology' },
  { id: 'impact-metrics', name: 'Impact Metrics', description: 'Measurable social, environmental, or community wellness KPIs.', category: 'closing' },
  { id: 'gtm', name: 'Go-To-Market Strategy', description: 'Target user acquisition channels, launch wedge, and viral loops.', category: 'business' },
  { id: 'pilot-plan', name: 'Pilot Plan', description: 'Early roll-out strategy with local sandbox testing groups.', category: 'business' },
  { id: 'risk-analysis', name: 'Risk & Mitigation', description: 'Assessment of data leaks, scaling bugs, and operational risks.', category: 'business' },
  { id: 'future-scope', name: 'Future Scope', description: 'Stretch features, upcoming modules, and scalability roadmaps.', category: 'closing' },
  { id: 'why-now', name: 'Why Now?', description: 'Macro trends, tech tailwinds, and market urgency timing.', category: 'problem-solution' },
  { id: 'testimonials', name: 'User Testimonials', description: 'Quotes and reviews from prototype testers validating features.', category: 'problem-solution' },
  { id: 'key-insights', name: 'Key Insights', description: 'Major takeaways from target customer interviews and surveys.', category: 'problem-solution' },
  { id: 'success-metrics', name: 'Success Metrics', description: 'Operational key performance indicators (KPIs) to track product health.', category: 'business' },
  { id: 'growth-strategy', name: 'Growth Strategy', description: 'B2B enterprise scaling plans and strategic expansion horizons.', category: 'business' },
  { id: 'social-impact', name: 'Social Impact', description: 'Direct community benefits and carbon offsets of your solution.', category: 'closing' }
];

export interface PitchDeckEvaluation {
  score: number;
  quality: 'Fragmented' | 'Coherent' | 'Persuasive' | 'Legendary';
  archetype: 'Engineer Deck' | 'Founder Deck' | 'Investor Deck' | 'Research Deck' | 'Product Deck' | 'Designer Deck' | 'Balanced Deck' | 'Chaos Deck';
  feedback: string[];
  subScores: {
    clarity: number;
    logicalFlow: number;
    storytelling: number;
    techDepth: number;
    bizThinking: number;
    persuasion: number;
  };
}

/**
 * Free-form Narrative Intelligence Engine
 * Evaluates deck composition, storytelling arcs, flow dimensions, and context-switching.
 */
export function evaluatePitchDeck(slides: string[]): PitchDeckEvaluation {
  const feedback: string[] = [];
  const activeSlides = slides.filter(s => s !== "");

  // Default fallbacks if empty
  if (activeSlides.length === 0) {
    return {
      score: 10,
      quality: 'Fragmented',
      archetype: 'Chaos Deck',
      feedback: ["Deck outline is currently empty. Slot slide components to initialize your presentation flow."],
      subScores: { clarity: 10, logicalFlow: 10, storytelling: 10, techDepth: 10, bizThinking: 10, persuasion: 10 }
    };
  }

  // 1. Logical Flow (20% weight)
  let flowScore = 60;
  const hasProblem = activeSlides.includes('problem');
  const hasSolution = activeSlides.includes('solution');
  const probIdx = activeSlides.indexOf('problem');
  const solIdx = activeSlides.indexOf('solution');

  if (hasProblem && hasSolution) {
    if (probIdx < solIdx) {
      flowScore += 15;
      feedback.push("Problem before Solution: Excellent logical progression of pain-to-cure.");
    } else {
      flowScore -= 15;
      feedback.push("Solution before Problem: Presenting the cure before explaining the disease muddled the flow.");
    }
  }

  // Tech stack before problem check
  const techSlides = activeSlides.filter(s => s === 'tech-stack' || s === 'architecture' || s === 'demo');
  if (techSlides.length > 0 && hasProblem) {
    const earliestTechIdx = Math.min(...techSlides.map(s => activeSlides.indexOf(s)));
    if (earliestTechIdx < probIdx) {
      flowScore -= 15;
      feedback.push("Tech before Problem: Avoid leading with technical diagrams before stating the actual customer issue.");
    }
  }

  // Why Now? / Persona before Solution
  const introHooks = activeSlides.filter(s => s === 'why-now' || s === 'customer-persona');
  if (introHooks.length > 0 && hasSolution) {
    const earliestHookIdx = Math.min(...introHooks.map(s => activeSlides.indexOf(s)));
    if (earliestHookIdx < solIdx) {
      flowScore += 10;
      feedback.push("Context Hook before Solution: Setting the stage with personas or market urgency strengthened the hook.");
    }
  }

  // Business strategy after solution
  const bizPlan = activeSlides.filter(s => s === 'business-model' || s === 'revenue' || s === 'gtm' || s === 'growth-strategy');
  if (bizPlan.length > 0 && hasSolution) {
    const latestBizIdx = Math.max(...bizPlan.map(s => activeSlides.indexOf(s)));
    if (latestBizIdx > solIdx) {
      flowScore += 10;
      feedback.push("Strategic Follow-up: Business model plans placed cleanly after solution concept.");
    }
  }

  // Closing slide position
  const isClosingAtEnd = activeSlides[activeSlides.length - 1] === 'thank-you' || activeSlides[activeSlides.length - 1] === 'references';
  if (isClosingAtEnd) {
    flowScore += 10;
    feedback.push("Concluded on Closing: Clean editorial deck ending.");
  } else if (activeSlides.includes('thank-you') || activeSlides.includes('references')) {
    flowScore += 5;
    feedback.push("Closing Slide Displaced: Closing slide present, but not concluding the presentation.");
  }
  flowScore = Math.max(10, Math.min(flowScore, 100));


  // 2. Storytelling (20% weight)
  let storyScore = 40;
  const demoIdx = activeSlides.indexOf('demo');
  
  // Story Arc: Problem -> Solution -> Demo
  if (hasProblem && hasSolution && demoIdx !== -1) {
    if (probIdx < solIdx && solIdx < demoIdx) {
      storyScore += 25;
      feedback.push("Story Arc (Problem → Solution → Demo): Perfect product storytelling progression.");
    }
  }

  // Persona Arc: Customer Persona -> User Journey -> Solution
  const hasPersona = activeSlides.includes('customer-persona');
  const hasJourney = activeSlides.includes('user-journey');
  const personaIdx = activeSlides.indexOf('customer-persona');
  const journeyIdx = activeSlides.indexOf('user-journey');
  if (hasPersona && hasJourney && hasSolution) {
    if (personaIdx < journeyIdx && journeyIdx < solIdx) {
      storyScore += 20;
      feedback.push("User Arc (Persona → Journey → Solution): High user empathy story progression.");
    }
  }

  // Urgency Arc: Why Now? -> Problem -> Solution
  const hasWhyNow = activeSlides.includes('why-now');
  const whyNowIdx = activeSlides.indexOf('why-now');
  if (hasWhyNow && hasProblem && hasSolution) {
    if (whyNowIdx < probIdx && probIdx < solIdx) {
      storyScore += 15;
      feedback.push("Urgency Arc (Why Now? → Problem → Solution): Strong macro macroeconomic tailwinds setup.");
    }
  }

  // Testimonials or Pilot Validation
  if (activeSlides.includes('testimonials') || activeSlides.includes('pilot-plan')) {
    storyScore += 10;
    feedback.push("Validation Hook: Incorporating testimonials or pilots anchors assumptions in reality.");
  }

  // No storytelling slides at all
  const storyCount = activeSlides.filter(s => {
    const comp = AVAILABLE_SLIDES.find(item => item.id === s);
    return comp && (comp.category === 'problem-solution' || comp.id === 'customer-persona');
  }).length;

  if (storyCount === 0) {
    storyScore -= 30;
    feedback.push("Dry Technical Pitch: Lacks core storytelling, problems, or solutions. The pitch felt hollow.");
  }
  storyScore = Math.max(10, Math.min(storyScore, 100));


  // 3. Technical Depth (15% weight)
  let techScore = 30;
  const techCategories = activeSlides.filter(s => {
    const comp = AVAILABLE_SLIDES.find(item => item.id === s);
    return comp && (comp.category === 'technology' || comp.id === 'risk-analysis');
  });

  techScore += techCategories.length * 15;

  // Check technical consecutiveness (>= 3 tech slides in a row)
  let consecutiveTech = 0;
  let maxConsecutiveTech = 0;
  activeSlides.forEach(s => {
    const comp = AVAILABLE_SLIDES.find(item => item.id === s);
    if (comp && (comp.category === 'technology' || comp.id === 'risk-analysis')) {
      consecutiveTech++;
      if (consecutiveTech > maxConsecutiveTech) maxConsecutiveTech = consecutiveTech;
    } else {
      consecutiveTech = 0;
    }
  });

  if (maxConsecutiveTech >= 3) {
    techScore += 15;
    feedback.push("Deep Technical Deepdive: Consecutive architecture slides showcase extensive engineering mapping.");
  }

  if (techCategories.length === 0) {
    techScore = 10;
    feedback.push("No Technical Validation: Lacks architecture, tech stacks, or prototype screenshots.");
  }
  techScore = Math.max(10, Math.min(techScore, 100));


  // 4. Business Thinking (15% weight)
  let bizScore = 30;
  const bizCategories = activeSlides.filter(s => {
    const comp = AVAILABLE_SLIDES.find(item => item.id === s);
    return comp && (comp.category === 'business');
  });

  bizScore += bizCategories.length * 12;

  // Business consecutiveness (>= 3 business slides in a row)
  let consecutiveBiz = 0;
  let maxConsecutiveBiz = 0;
  activeSlides.forEach(s => {
    const comp = AVAILABLE_SLIDES.find(item => item.id === s);
    if (comp && comp.category === 'business') {
      consecutiveBiz++;
      if (consecutiveBiz > maxConsecutiveBiz) maxConsecutiveBiz = consecutiveBiz;
    } else {
      consecutiveBiz = 0;
    }
  });

  if (maxConsecutiveBiz >= 3) {
    bizScore += 15;
    feedback.push("Strong Commercial Focus: Consecutive business planning slides demonstrate rigorous operational scoping.");
  }

  // Wedge subsequence: market -> competitors -> business-model
  const hasMarket = activeSlides.includes('market');
  const hasCompetitors = activeSlides.includes('competitors');
  const hasBizModel = activeSlides.includes('business-model');
  if (hasMarket && hasCompetitors && hasBizModel) {
    const mIdx = activeSlides.indexOf('market');
    const cIdx = activeSlides.indexOf('competitors');
    const bmIdx = activeSlides.indexOf('business-model');
    if (mIdx < cIdx && cIdx < bmIdx) {
      bizScore += 20;
      feedback.push("Market Wedge Subsequence: TAM/SAM/SOM into moats and business models communicates clean scalability.");
    }
  }

  if (bizCategories.length === 0) {
    bizScore = 10;
    feedback.push("Neglected Business Case: Lacks monetization, revenue roadmaps, or market analysis.");
  }
  bizScore = Math.max(10, Math.min(bizScore, 100));


  // 5. Persuasion (15% weight)
  let persuasionScore = 50;
  if (activeSlides.includes('usp')) {
    persuasionScore += 15;
    feedback.push("USP highlight: Clear defensible differentiator pitched early.");
  }
  if (activeSlides.includes('traction') || activeSlides.includes('testimonials')) {
    persuasionScore += 15;
    feedback.push("Traction proofing: Demonstrating prototype feedback or signups creates high credibility.");
  }
  if (activeSlides.includes('impact') || activeSlides.includes('social-impact') || activeSlides.includes('impact-metrics')) {
    persuasionScore += 10;
    feedback.push("Impact Narrative: Highlighting social offsets or green metrics captures altruistic judge value.");
  }
  if (isClosingAtEnd) {
    persuasionScore += 10;
  }
  persuasionScore = Math.max(10, Math.min(persuasionScore, 100));


  // 6. Clarity (15% weight)
  let clarityScore = 85;
  
  // Rapid category switches penalty
  let categorySwitches = 0;
  for (let i = 0; i < activeSlides.length - 1; i++) {
    const compA = AVAILABLE_SLIDES.find(item => item.id === activeSlides[i]);
    const compB = AVAILABLE_SLIDES.find(item => item.id === activeSlides[i+1]);
    if (compA && compB && compA.category !== compB.category) {
      categorySwitches++;
    }
  }

  if (categorySwitches >= 5) {
    clarityScore -= (categorySwitches - 4) * 10;
    feedback.push("Rapid Context Switches: Alternating technical and business topics rapidly created visual fatigue.");
  }

  // Duplication penalty
  const uniqueSlides = new Set(activeSlides);
  const duplicates = activeSlides.length - uniqueSlides.size;
  if (duplicates > 0) {
    clarityScore -= duplicates * 15;
    feedback.push(`Duplicate Slides: Presenting duplicate slides (${duplicates}) muddled the time allocation.`);
  }

  // Balanced sequence bonus
  if (storyCount >= 1 && techCategories.length >= 1 && bizCategories.length >= 1) {
    clarityScore += 10;
    feedback.push("Balanced Pitch Outline: Clear mixture of storytelling, coding architecture, and business viability.");
  }
  clarityScore = Math.max(10, Math.min(clarityScore, 100));


  // Weighted score average compile
  const finalScore = Math.round(
    (clarityScore * 0.15) +
    (flowScore * 0.20) +
    (storyScore * 0.20) +
    (techScore * 0.15) +
    (bizScore * 0.15) +
    (persuasionScore * 0.15)
  );

  // Determine Quality
  let quality: PitchDeckEvaluation['quality'] = 'Fragmented';
  if (finalScore >= 90) quality = 'Legendary';
  else if (finalScore >= 75) quality = 'Persuasive';
  else if (finalScore >= 55) quality = 'Coherent';

  // Determine Storytelling Archetype
  let archetype: PitchDeckEvaluation['archetype'] = 'Balanced Deck';

  let totalTech = techCategories.length;
  let totalBiz = bizCategories.length;
  let totalStory = storyCount;

  if (totalTech >= 3 && totalBiz <= 1) {
    archetype = 'Engineer Deck';
  } else if (totalStory >= 3 && totalTech <= 1) {
    archetype = 'Founder Deck';
  } else if (totalBiz >= 3 && totalTech <= 1) {
    archetype = 'Investor Deck';
  } else if (activeSlides.includes('references') && hasProblem && (activeSlides.includes('impact') || activeSlides.includes('impact-metrics') || activeSlides.includes('social-impact')) && activeSlides.includes('competitors') && totalBiz <= 1) {
    archetype = 'Research Deck';
  } else if ((activeSlides.includes('user-journey') || activeSlides.includes('prototype-screens')) && activeSlides.includes('demo') && hasSolution && activeSlides.includes('key-insights')) {
    archetype = 'Product Deck';
  } else if (activeSlides.includes('customer-persona') && activeSlides.includes('user-journey') && activeSlides.includes('prototype-screens') && activeSlides.includes('demo')) {
    archetype = 'Designer Deck';
  } else if (finalScore < 45 || categorySwitches >= 6) {
    archetype = 'Chaos Deck';
  } else if (totalTech >= 2 && totalBiz >= 2 && totalStory >= 2) {
    archetype = 'Balanced Deck';
  }

  return {
    score: Math.max(10, Math.min(finalScore, 100)),
    quality,
    archetype,
    feedback,
    subScores: {
      clarity: clarityScore,
      logicalFlow: flowScore,
      storytelling: storyScore,
      techDepth: techScore,
      bizThinking: bizScore,
      persuasion: persuasionScore
    }
  };
}

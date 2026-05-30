/**
 * @file Hackathon problem statement data
 * @description A curated pool of 5 hackathon challenges across different domains.
 * Each problem includes constraints the solution must satisfy and bonus
 * objectives for extra points.
 */

import type { Problem } from '@/types/game';

/** All available hackathon problem statements */
export const PROBLEMS: Problem[] = [
  {
    id: 'prob-ecotrack',
    title: 'EcoTrack',
    description:
      'Build a personal carbon footprint tracker that helps users understand and reduce their environmental impact. The app should gamify sustainable choices, visualize emissions data in an intuitive way, and suggest actionable steps users can take in their daily lives to lower their carbon output.',
    category: 'sustainability',
    difficulty: 'intermediate',
    constraints: [
      'Must calculate carbon footprint from at least 3 lifestyle categories (transport, food, energy)',
      'Data visualizations must update in real-time as users log activities',
      'Must work offline-first — users in areas with poor connectivity should still be able to log data',
      'All carbon calculations must cite a verifiable data source or methodology',
    ],
    bonusObjectives: [
      'Add a social leaderboard where friends can compare their sustainability scores',
      'Integrate with a public API (e.g., electricity grid carbon intensity) for live data',
      'Include an AI-powered "green coach" that gives personalized tips',
    ],
  },
  {
    id: 'prob-mindbridge',
    title: 'MindBridge',
    description:
      'Create a peer-to-peer mental health support platform that connects people experiencing similar challenges. The platform should facilitate safe, anonymous conversations, provide coping resources, and know when to escalate to professional help. Privacy and emotional safety are paramount.',
    category: 'healthtech',
    difficulty: 'advanced',
    constraints: [
      'All conversations must be end-to-end encrypted and fully anonymous',
      'Must include a content moderation or safety-detection layer to flag crisis situations',
      'Users must be matched based on shared experiences, not randomly',
      'Must comply with basic accessibility guidelines (WCAG 2.1 AA)',
    ],
    bonusObjectives: [
      'Add a mood-tracking journal with sentiment analysis to surface trends',
      'Implement a "warm handoff" flow that connects users to licensed professionals',
      'Build a resource library of coping techniques filterable by condition',
    ],
  },
  {
    id: 'prob-learnloop',
    title: 'LearnLoop',
    description:
      "Design an adaptive learning platform powered by AI tutoring that adjusts difficulty and teaching style to each student's pace. The system should identify knowledge gaps, generate practice problems, and give encouraging, constructive feedback that keeps learners motivated.",
    category: 'edtech',
    difficulty: 'advanced',
    constraints: [
      'Must support at least 2 distinct learning modes (visual, text-based, quiz, etc.)',
      'The difficulty curve must adapt based on student performance within a session',
      'Progress must persist across sessions with clear visualizations of improvement',
    ],
    bonusObjectives: [
      'Add an AI tutor chatbot that explains concepts in multiple ways until the student understands',
      'Include a "study streak" gamification system with badges and milestones',
      'Support collaborative study rooms where peers can solve problems together',
    ],
  },
  {
    id: 'prob-payforward',
    title: 'PayForward',
    description:
      'Build a micro-lending platform that connects lenders with borrowers in underserved communities. The platform should make small loans accessible, transparent, and fair — reducing friction for borrowers while giving lenders visibility into the social impact of their contributions.',
    category: 'fintech',
    difficulty: 'intermediate',
    constraints: [
      'Loan terms must be displayed in plain language with no hidden fees',
      'Must include a trust/reputation system for both lenders and borrowers',
      'All financial calculations (interest, repayment schedules) must be transparent and auditable',
      'Must handle multiple currency formats and locales',
    ],
    bonusObjectives: [
      'Add an impact dashboard showing aggregate community metrics (jobs created, businesses funded)',
      'Implement a "pay it forward" chain where repaid loans auto-fund the next borrower',
    ],
  },
  {
    id: 'prob-safehaven',
    title: 'SafeHaven',
    description:
      'Create a disaster response coordination platform that helps affected communities, volunteers, and aid organizations communicate during emergencies. The tool should map needs to resources, coordinate volunteer deployment, and provide real-time situational awareness.',
    category: 'social-impact',
    difficulty: 'beginner',
    constraints: [
      'Must display an interactive map showing reported needs and available resources',
      'Should work on low-bandwidth connections and degrade gracefully',
      'Must support at least 2 user roles (affected person, volunteer/responder)',
    ],
    bonusObjectives: [
      "Add push-notification alerts for new emergencies or resource availability in a user's area",
      'Integrate weather or seismic API data for proactive warnings',
      'Include an offline mode that syncs when connectivity returns',
    ],
  },
];

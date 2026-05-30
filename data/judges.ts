/**
 * @file Curated Jury Panels Database
 *
 * Defines the 5 distinct hackathon judges with customizable personalities
 * and score category weights.
 *
 * @module data/judges
 */

import type { Judge } from '@/types/game';

export const JUDGES: Judge[] = [
  {
    id: 'judge-builder',
    name: 'Uday Sharma',
    avatar: '🔥',
    title: 'EdTech Creator & Hackathon Specialist',
    expertise: ['MVP Scoping', 'Rapid Prototyping', 'EdTech Products', 'User Validation', 'Product Practicality'],
    personality: 'technical',
    scoringWeights: {
      innovation: 0.25,
      execution: 0.40,
      design: 0.10,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-founder',
    name: 'Bart',
    avatar: '🚀',
    title: 'Startup Founder',
    expertise: ['Startup Building', 'Product Strategy', 'Growth Hack', 'Product-Market Fit', 'Customer Discovery'],
    personality: 'creative',
    scoringWeights: {
      innovation: 0.35,
      execution: 0.15,
      design: 0.10,
      pitch: 0.40,
    },
  },
  {
    id: 'judge-design',
    name: 'Nishika',
    avatar: '🎨',
    title: 'Corporate Product Designer / UI-UX Specialist',
    expertise: ['UI Design', 'UX Design', 'Accessibility Scales', 'User Flows', 'Design Systems'],
    personality: 'encouraging',
    scoringWeights: {
      innovation: 0.10,
      execution: 0.15,
      design: 0.50,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-investor',
    name: 'Sejal',
    avatar: '📊',
    title: 'Business Analyst',
    expertise: ['Business Strategy', 'Market Analysis', 'Revenue Models', 'Data-Driven Decisions', 'Process Optimization'],
    personality: 'tough',
    scoringWeights: {
      innovation: 0.15,
      execution: 0.30,
      design: 0.10,
      pitch: 0.45,
    },
  },
  {
    id: 'judge-chaos',
    name: 'Jitu',
    avatar: '🎓',
    title: 'Professor & Academic Mentor',
    expertise: ['Computer Science Fundamentals', 'Software Engineering', 'System Design', 'Technical Feasibility', 'Learning Outcomes'],
    personality: 'technical',
    scoringWeights: {
      innovation: 0.25,
      execution: 0.25,
      design: 0.25,
      pitch: 0.25,
    },
  },
];

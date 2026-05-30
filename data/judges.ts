/**
 * @file Hackathon judge profiles
 * @description Four judges with distinct personalities and scoring philosophies.
 * Each judge weights the four scoring categories differently, creating
 * varied and realistic evaluation dynamics.
 */

import type { Judge } from '@/types/game';

/** All available hackathon judges */
export const JUDGES: Judge[] = [
  {
    id: 'judge-shark',
    name: 'Victoria Chen',
    avatar: '🦈',
    title: 'Managing Partner, Apex Ventures',
    expertise: [
      'Venture Capital',
      'Market Sizing',
      'Unit Economics',
      'Growth Strategy',
    ],
    personality: 'tough',
    scoringWeights: {
      innovation: 0.35,
      execution: 0.30,
      design: 0.10,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-artist',
    name: 'Marcus Rivera',
    avatar: '🎨',
    title: 'Head of Design, Pixel & Co.',
    expertise: [
      'UI/UX Design',
      'Design Systems',
      'User Research',
      'Accessibility',
    ],
    personality: 'encouraging',
    scoringWeights: {
      innovation: 0.20,
      execution: 0.15,
      design: 0.45,
      pitch: 0.20,
    },
  },
  {
    id: 'judge-tech',
    name: 'Dr. Priya Kapoor',
    avatar: '⚡',
    title: 'CTO, NeuralScale Systems',
    expertise: [
      'Distributed Systems',
      'Machine Learning',
      'System Architecture',
      'Performance Engineering',
    ],
    personality: 'technical',
    scoringWeights: {
      innovation: 0.25,
      execution: 0.45,
      design: 0.10,
      pitch: 0.20,
    },
  },
  {
    id: 'judge-visionary',
    name: 'Alex Nakamura',
    avatar: '🚀',
    title: 'Founder & CEO, Moonshot Labs',
    expertise: [
      'Product Vision',
      'Storytelling',
      'Disruptive Innovation',
      'Community Building',
    ],
    personality: 'creative',
    scoringWeights: {
      innovation: 0.40,
      execution: 0.15,
      design: 0.15,
      pitch: 0.30,
    },
  },
];

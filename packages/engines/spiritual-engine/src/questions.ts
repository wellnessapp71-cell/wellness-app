/**
 * Spiritual question bank — 24 questions across 5 domains.
 *
 * Scoring: 0-4 (Never=0, Rarely=1, Sometimes=2, Often=3, Always=4)
 * Reverse-scored: Always=0, Often=1, Sometimes=2, Rarely=3, Never=4
 */

import type { SpiritualQuestion } from "@aura/types";

// ── Meaning & Purpose (5 questions) ─────────────────────────────

const MEANING_QUESTIONS: SpiritualQuestion[] = [
  {
    id: "m1",
    domain: "meaning",
    text: "I feel my life has a clear purpose",
    reverseScored: false,
  },
  {
    id: "m2",
    domain: "meaning",
    text: "I feel aligned with my personal values",
    reverseScored: false,
  },
  {
    id: "m3",
    domain: "meaning",
    text: "I find meaning in my daily activities",
    reverseScored: false,
  },
  {
    id: "m4",
    domain: "meaning",
    text: "I feel a sense of direction in my life",
    reverseScored: false,
  },
  {
    id: "m5",
    domain: "meaning",
    text: "I believe my actions contribute to something larger than myself",
    reverseScored: false,
  },
];

// ── Inner Peace & Emotional Settling (5 questions) ──────────────

const PEACE_QUESTIONS: SpiritualQuestion[] = [
  {
    id: "p1",
    domain: "peace",
    text: "I feel calm inside most days",
    reverseScored: false,
  },
  {
    id: "p2",
    domain: "peace",
    text: "I can let go of worries and settle my mind",
    reverseScored: false,
  },
  {
    id: "p3",
    domain: "peace",
    text: "I feel at ease with the pace of my life",
    reverseScored: false,
  },
  {
    id: "p4",
    domain: "peace",
    text: "I recover quickly from stressful situations",
    reverseScored: false,
  },
  {
    id: "p5",
    domain: "peace",
    text: "I feel emotionally settled even during uncertainty",
    reverseScored: false,
  },
];

// ── Mindful Presence (5 questions, Q3 reverse-scored) ───────────

const MINDFULNESS_QUESTIONS: SpiritualQuestion[] = [
  {
    id: "mi1",
    domain: "mindfulness",
    text: "I notice what I am feeling in my body throughout the day",
    reverseScored: false,
  },
  {
    id: "mi2",
    domain: "mindfulness",
    text: "I pay attention to sounds, smells, and textures around me",
    reverseScored: false,
  },
  {
    id: "mi3",
    domain: "mindfulness",
    text: "I often move through my day on autopilot",
    reverseScored: true, // Reverse-scored
  },
  {
    id: "mi4",
    domain: "mindfulness",
    text: "I take moments to pause and breathe during my day",
    reverseScored: false,
  },
  {
    id: "mi5",
    domain: "mindfulness",
    text: "I can redirect my attention when my mind wanders",
    reverseScored: false,
  },
];

// ── Connection (5 questions) ────────────────────────────────────

const CONNECTION_QUESTIONS: SpiritualQuestion[] = [
  {
    id: "c1",
    domain: "connection",
    text: "I feel connected to the people around me",
    reverseScored: false,
  },
  {
    id: "c2",
    domain: "connection",
    text: "I feel a sense of belonging in my community",
    reverseScored: false,
  },
  {
    id: "c3",
    domain: "connection",
    text: "I feel connected to nature or the world around me",
    reverseScored: false,
  },
  {
    id: "c4",
    domain: "connection",
    text: "I express gratitude toward others regularly",
    reverseScored: false,
  },
  {
    id: "c5",
    domain: "connection",
    text: "I feel connected to something larger than myself",
    reverseScored: false,
  },
];

// ── Daily Practices (4 questions) ───────────────────────────────

const PRACTICE_QUESTIONS: SpiritualQuestion[] = [
  {
    id: "pr1",
    domain: "practice",
    text: "I regularly practice meditation, prayer, or breathwork",
    reverseScored: false,
  },
  {
    id: "pr2",
    domain: "practice",
    text: "I set aside time for silence or reflection",
    reverseScored: false,
  },
  {
    id: "pr3",
    domain: "practice",
    text: "I engage in gratitude journaling or similar practices",
    reverseScored: false,
  },
  {
    id: "pr4",
    domain: "practice",
    text: "I spend time in nature intentionally for well-being",
    reverseScored: false,
  },
];

// ── Full question bank ──────────────────────────────────────────

export const SPIRITUAL_QUESTIONS: SpiritualQuestion[] = [
  ...MEANING_QUESTIONS,
  ...PEACE_QUESTIONS,
  ...MINDFULNESS_QUESTIONS,
  ...CONNECTION_QUESTIONS,
  ...PRACTICE_QUESTIONS,
];

export const QUESTIONS_BY_DOMAIN = {
  meaning: MEANING_QUESTIONS,
  peace: PEACE_QUESTIONS,
  mindfulness: MINDFULNESS_QUESTIONS,
  connection: CONNECTION_QUESTIONS,
  practice: PRACTICE_QUESTIONS,
} as const;

/** Total number of questions */
export const TOTAL_QUESTIONS = SPIRITUAL_QUESTIONS.length; // 24

/** Likert scale labels */
export const LIKERT_LABELS = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Always",
] as const;

/**
 * Indices in the full 24-question array that are reverse-scored.
 * Only mindfulness Q3 (index 12) is reverse-scored.
 */
export const REVERSE_SCORED_INDICES: number[] = SPIRITUAL_QUESTIONS
  .map((q, i) => (q.reverseScored ? i : -1))
  .filter((i) => i >= 0);

/** Domain ranges in the flat answer array */
export const DOMAIN_RANGES = {
  meaning:      { start: 0, count: 5 },
  peace:        { start: 5, count: 5 },
  mindfulness:  { start: 10, count: 5 },
  connection:   { start: 15, count: 5 },
  practice:     { start: 20, count: 4 },
} as const;

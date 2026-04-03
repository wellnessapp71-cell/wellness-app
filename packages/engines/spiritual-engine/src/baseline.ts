/**
 * Baseline scoring for the spiritual onboarding assessment.
 *
 * Per domain:
 *   1. Apply reverse-scoring where flagged
 *   2. Average all items in domain (0-4 range)
 *   3. Normalize to 0-100: (average / 4) * 100
 *
 * Composite score:
 *   totalScore = meaning * 0.25 + peace * 0.25 + mindfulness * 0.20
 *              + connection * 0.20 + practice * 0.10
 *
 * Band classification:
 *   80-100 → green  (strong inner calm)
 *   60-79  → yellow (healthy, needs consistency)
 *   40-59  → orange (mild gap, increase support)
 *   0-39   → red    (low inner calm, deeper support)
 */

import type { SpiritualBaseline, SpiritualBand, SpiritualDomain } from "@aura/types";
import { SPIRITUAL_DOMAIN_WEIGHTS } from "@aura/types";
import { DOMAIN_RANGES, SPIRITUAL_QUESTIONS } from "./questions";

// ─── Domain Scoring ─────────────────────────────────────────────

/**
 * Compute a single domain score (0-100) from raw answers.
 * Applies reverse-scoring where flagged.
 */
export function computeDomainScore(
  answers: number[],
  reverseIndices: number[]
): number {
  if (answers.length === 0) return 0;

  const adjusted = answers.map((val, i) => {
    const clamped = Math.max(0, Math.min(4, Math.round(val)));
    return reverseIndices.includes(i) ? 4 - clamped : clamped;
  });

  const average = adjusted.reduce((sum, v) => sum + v, 0) / adjusted.length;
  return Math.round((average / 4) * 100);
}

// ─── Band Classification ────────────────────────────────────────

/**
 * Classify a 0-100 score into a band.
 */
export function classifyBand(score: number): SpiritualBand {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}

// ─── Composite Score ────────────────────────────────────────────

/**
 * Compute the weighted composite inner calm score from 5 domain scores.
 */
export function computeInnerCalmScore(domainScores: {
  meaning: number;
  peace: number;
  mindfulness: number;
  connection: number;
  practice: number;
}): { totalScore: number; band: SpiritualBand; weakestDomain: SpiritualDomain } {
  const totalScore = Math.round(
    domainScores.meaning * SPIRITUAL_DOMAIN_WEIGHTS.meaning +
    domainScores.peace * SPIRITUAL_DOMAIN_WEIGHTS.peace +
    domainScores.mindfulness * SPIRITUAL_DOMAIN_WEIGHTS.mindfulness +
    domainScores.connection * SPIRITUAL_DOMAIN_WEIGHTS.connection +
    domainScores.practice * SPIRITUAL_DOMAIN_WEIGHTS.practice
  );

  const band = classifyBand(totalScore);

  // Find weakest domain
  const entries: [SpiritualDomain, number][] = [
    ["meaning", domainScores.meaning],
    ["peace", domainScores.peace],
    ["mindfulness", domainScores.mindfulness],
    ["connection", domainScores.connection],
    ["practice", domainScores.practice],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  const weakestDomain = entries[0][0];

  return { totalScore: Math.max(0, Math.min(100, totalScore)), band, weakestDomain };
}

// ─── Full Baseline Builder ──────────────────────────────────────

/**
 * Build a complete SpiritualBaseline from raw 24 answers + preferences.
 */
export function buildSpiritualBaseline(
  rawAnswers: number[],
  preferences: {
    preferredPracticeTime?: string | null;
    preferredSupportStyle?: string | null;
  } = {}
): SpiritualBaseline {
  if (rawAnswers.length !== 24) {
    throw new Error(`Expected 24 answers, got ${rawAnswers.length}`);
  }

  // Extract domain answers and compute per-domain scores
  const domainScores = {
    meaning: computeDomainScoreFromRaw(rawAnswers, "meaning"),
    peace: computeDomainScoreFromRaw(rawAnswers, "peace"),
    mindfulness: computeDomainScoreFromRaw(rawAnswers, "mindfulness"),
    connection: computeDomainScoreFromRaw(rawAnswers, "connection"),
    practice: computeDomainScoreFromRaw(rawAnswers, "practice"),
  };

  const { totalScore, band, weakestDomain } = computeInnerCalmScore(domainScores);

  return {
    meaningScore: domainScores.meaning,
    peaceScore: domainScores.peace,
    mindfulnessScore: domainScores.mindfulness,
    connectionScore: domainScores.connection,
    practiceScore: domainScores.practice,
    totalScore,
    band,
    weakestDomain,
    preferredPracticeTime: preferences.preferredPracticeTime ?? null,
    preferredSupportStyle: preferences.preferredSupportStyle ?? null,
    rawAnswers,
    createdAt: new Date().toISOString(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function computeDomainScoreFromRaw(
  allAnswers: number[],
  domain: SpiritualDomain
): number {
  const range = DOMAIN_RANGES[domain];
  const domainAnswers = allAnswers.slice(range.start, range.start + range.count);

  // Find reverse-scored indices within this domain slice
  const reverseIndices: number[] = [];
  for (let i = 0; i < range.count; i++) {
    const globalIndex = range.start + i;
    if (SPIRITUAL_QUESTIONS[globalIndex]?.reverseScored) {
      reverseIndices.push(i);
    }
  }

  return computeDomainScore(domainAnswers, reverseIndices);
}

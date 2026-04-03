/**
 * Lifestyle onboarding baseline scoring.
 *
 * Converts 36 raw answers (0-4 each) into per-domain scores (0-100),
 * a weighted composite score, band classification, and weakest domain.
 *
 * PRD v2 weights: Nutrition 18%, Sleep 18%, Movement 16%,
 * Hydration 12%, Digital 12%, Nature 12%, Routine 12%.
 */

import type {
  LifestyleDomain,
  LifestyleBand,
  LifestyleBaseline,
} from "@aura/types";

import {
  LIFESTYLE_SCORE_WEIGHTS,
  LIFESTYLE_DOMAINS,
} from "@aura/types";

import {
  DOMAIN_QUESTION_COUNTS,
  DOMAIN_START_INDEX,
  TOTAL_QUESTIONS,
} from "./questions";

// ─── Per-domain scoring ────────────────────────────────────────

/**
 * Extract raw answers for a single domain and compute a 0-100 score.
 * Each question is scored 0-4; the domain score = (sum / maxPossible) * 100.
 */
export function computeDomainScore(
  rawAnswers: number[],
  domain: LifestyleDomain
): number {
  const start = DOMAIN_START_INDEX[domain];
  const count = DOMAIN_QUESTION_COUNTS[domain];
  const maxPossible = count * 4; // each question max = 4

  let sum = 0;
  for (let i = start; i < start + count; i++) {
    const val = rawAnswers[i] ?? 0;
    sum += Math.max(0, Math.min(4, Math.round(val)));
  }

  return Math.round((sum / maxPossible) * 100);
}

/**
 * Compute all 7 domain scores from the 36 raw answers.
 */
export function computeAllDomainScores(
  rawAnswers: number[]
): Record<LifestyleDomain, number> {
  return {
    sleep: computeDomainScore(rawAnswers, "sleep"),
    nutrition: computeDomainScore(rawAnswers, "nutrition"),
    hydration: computeDomainScore(rawAnswers, "hydration"),
    movement: computeDomainScore(rawAnswers, "movement"),
    digital: computeDomainScore(rawAnswers, "digital"),
    nature: computeDomainScore(rawAnswers, "nature"),
    routine: computeDomainScore(rawAnswers, "routine"),
  };
}

// ─── Composite & classification ────────────────────────────────

/**
 * Weighted composite lifestyle score (0-100).
 */
export function computeCompositeScore(
  domainScores: Record<LifestyleDomain, number>
): number {
  let total = 0;
  for (const domain of LIFESTYLE_DOMAINS) {
    total += domainScores[domain] * LIFESTYLE_SCORE_WEIGHTS[domain];
  }
  return Math.round(total);
}

/**
 * Classify a 0-100 score into a colour band.
 * Green 80-100, Yellow 60-79, Orange 40-59, Red 0-39.
 */
export function classifyBand(score: number): LifestyleBand {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}

/**
 * Identify the weakest domain (lowest score).
 * Ties broken by weight (heavier domain is returned first — more impactful).
 */
export function findWeakestDomain(
  domainScores: Record<LifestyleDomain, number>
): LifestyleDomain {
  let weakest: LifestyleDomain = "sleep";
  let lowestScore = Infinity;

  for (const domain of LIFESTYLE_DOMAINS) {
    const score = domainScores[domain];
    if (
      score < lowestScore ||
      (score === lowestScore &&
        LIFESTYLE_SCORE_WEIGHTS[domain] > LIFESTYLE_SCORE_WEIGHTS[weakest])
    ) {
      lowestScore = score;
      weakest = domain;
    }
  }

  return weakest;
}

/**
 * Find the second weakest domain (for support domain in plan).
 */
export function findSecondWeakest(
  domainScores: Record<LifestyleDomain, number>
): LifestyleDomain {
  const weakest = findWeakestDomain(domainScores);
  let secondWeakest: LifestyleDomain = "sleep";
  let lowestScore = Infinity;

  for (const domain of LIFESTYLE_DOMAINS) {
    if (domain === weakest) continue;
    const score = domainScores[domain];
    if (
      score < lowestScore ||
      (score === lowestScore &&
        LIFESTYLE_SCORE_WEIGHTS[domain] > LIFESTYLE_SCORE_WEIGHTS[secondWeakest])
    ) {
      lowestScore = score;
      secondWeakest = domain;
    }
  }

  return secondWeakest;
}

// ─── Full baseline builder ─────────────────────────────────────

/**
 * Build a complete LifestyleBaseline from 36 raw answers.
 */
export function buildLifestyleBaseline(rawAnswers: number[]): LifestyleBaseline {
  if (rawAnswers.length !== TOTAL_QUESTIONS) {
    throw new Error(
      `Expected ${TOTAL_QUESTIONS} answers, got ${rawAnswers.length}`
    );
  }

  const domainScores = computeAllDomainScores(rawAnswers);
  const totalScore = computeCompositeScore(domainScores);

  return {
    sleepScore: domainScores.sleep,
    nutritionScore: domainScores.nutrition,
    hydrationScore: domainScores.hydration,
    movementScore: domainScores.movement,
    digitalScore: domainScores.digital,
    natureScore: domainScores.nature,
    routineScore: domainScores.routine,
    totalScore,
    band: classifyBand(totalScore),
    weakestDomain: findWeakestDomain(domainScores),
    rawAnswers,
    createdAt: new Date().toISOString(),
  };
}

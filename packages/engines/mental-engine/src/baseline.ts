/**
 * Baseline scoring for PHQ-9, GAD-7, stress scale, and mood baseline.
 * Uses clinically validated cutoffs to classify severity.
 */

import type {
  Phq9Severity,
  Gad7Severity,
  MentalBaseline,
  InterventionType,
  TriggerTag,
} from "@aura/types";

// ─── PHQ-9 Scoring ──────────────────────────────────────────────

/**
 * Compute PHQ-9 total score from 9 answers (each 0-3).
 * Range: 0–27
 */
export function computePhq9Score(answers: number[]): number {
  if (answers.length !== 9) {
    throw new Error(`PHQ-9 requires exactly 9 answers, got ${answers.length}`);
  }
  return answers.reduce((sum, val) => sum + Math.max(0, Math.min(3, Math.round(val))), 0);
}

/**
 * Classify PHQ-9 severity based on clinical cutoffs.
 * 0-4: minimal, 5-9: mild, 10-14: moderate, 15-19: moderately severe, 20-27: severe
 */
export function classifyPhq9Severity(score: number): Phq9Severity {
  if (score <= 4) return "minimal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  if (score <= 19) return "moderately_severe";
  return "severe";
}

/**
 * Convert PHQ-9 score to a 0-100 wellness scale (inverted: lower PHQ = better).
 */
export function phq9ToWellnessScale(score: number): number {
  const maxScore = 27;
  return Math.round(((maxScore - score) / maxScore) * 100);
}

/**
 * Check if PHQ-9 item 9 (self-harm ideation) is positive.
 * This is a critical safety signal.
 */
export function hasPhq9SelfHarmRisk(answers: number[]): boolean {
  return answers.length >= 9 && answers[8] > 0;
}

// ─── GAD-7 Scoring ──────────────────────────────────────────────

/**
 * Compute GAD-7 total score from 7 answers (each 0-3).
 * Range: 0–21
 */
export function computeGad7Score(answers: number[]): number {
  if (answers.length !== 7) {
    throw new Error(`GAD-7 requires exactly 7 answers, got ${answers.length}`);
  }
  return answers.reduce((sum, val) => sum + Math.max(0, Math.min(3, Math.round(val))), 0);
}

/**
 * Classify GAD-7 severity based on clinical cutoffs.
 * 0-4: minimal, 5-9: mild, 10-14: moderate, 15-21: severe
 */
export function classifyGad7Severity(score: number): Gad7Severity {
  if (score <= 4) return "minimal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  return "severe";
}

/**
 * Convert GAD-7 score to a 0-100 wellness scale (inverted: lower GAD = better).
 */
export function gad7ToWellnessScale(score: number): number {
  const maxScore = 21;
  return Math.round(((maxScore - score) / maxScore) * 100);
}

// ─── Stress & Mood Baseline ─────────────────────────────────────

/**
 * Normalize a 1-10 self-reported stress score to 0-100 wellness scale.
 * Inverted: stress 1 (low) = wellness 100, stress 10 (high) = wellness 0
 */
export function stressToWellnessScale(stressScore: number): number {
  const clamped = Math.max(1, Math.min(10, stressScore));
  return Math.round(((10 - clamped) / 9) * 100);
}

/**
 * Normalize a 1-10 self-reported mood score to 0-100 wellness scale.
 * Direct: mood 1 (low) = wellness 0, mood 10 (high) = wellness 100
 */
export function moodToWellnessScale(moodScore: number): number {
  const clamped = Math.max(1, Math.min(10, moodScore));
  return Math.round(((clamped - 1) / 9) * 100);
}

// ─── Composite Baseline Score ───────────────────────────────────

/**
 * Compute the baseline component score (0-100) from all baseline inputs.
 * This feeds into the 35% weight of the composite mental wellness score.
 *
 * Weighting within the baseline component:
 * - PHQ-9: 35%
 * - GAD-7: 30%
 * - Stress: 20%
 * - Mood: 15%
 */
export function computeBaselineScore(baseline: MentalBaseline): number {
  const phq9Well = phq9ToWellnessScale(baseline.phq9Score);
  const gad7Well = gad7ToWellnessScale(baseline.gad7Score);
  const stressWell = stressToWellnessScale(baseline.stressBase);
  const moodWell = moodToWellnessScale(baseline.moodBase);

  return Math.round(
    phq9Well * 0.35 +
    gad7Well * 0.30 +
    stressWell * 0.20 +
    moodWell * 0.15
  );
}

// ─── Full Baseline Builder ──────────────────────────────────────

/**
 * Parse raw questionnaire answers into a complete MentalBaseline.
 */
export function buildBaseline(params: {
  phq9Answers: number[];
  gad7Answers: number[];
  stressBase: number;
  moodBase: number;
  calmingPreferences: InterventionType[];
  priorTherapy: boolean;
  commonTriggers: TriggerTag[];
}): MentalBaseline {
  const phq9Score = computePhq9Score(params.phq9Answers);
  const gad7Score = computeGad7Score(params.gad7Answers);

  return {
    phq9Score,
    phq9Severity: classifyPhq9Severity(phq9Score),
    phq9Answers: params.phq9Answers,
    gad7Score,
    gad7Severity: classifyGad7Severity(gad7Score),
    gad7Answers: params.gad7Answers,
    stressBase: params.stressBase,
    moodBase: params.moodBase,
    calmingPreferences: params.calmingPreferences,
    priorTherapy: params.priorTherapy,
    commonTriggers: params.commonTriggers,
  };
}

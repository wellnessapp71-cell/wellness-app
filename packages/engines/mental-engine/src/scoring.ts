/**
 * 4-signal composite mental wellness score calculator.
 *
 * The mental wellness score blends four independent signals:
 * | Signal           | Weight | Input                                      |
 * |------------------|--------|--------------------------------------------|
 * | Baseline         | 35%    | PHQ-9, GAD-7, stress scale, mood baseline  |
 * | Daily check-ins  | 25%    | Mood, stress, energy, focus, sleep          |
 * | rPPG scan        | 20%    | Heart rate & stress index                  |
 * | Engagement       | 20%    | Practice completion, journaling, support    |
 *
 * Each component is normalized to 0-100 before weighting.
 */

import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  CopingSession,
  MentalJournalEntry,
  ContentProgressEntry,
  MentalWellnessScore,
} from "@aura/types";

import { MENTAL_SCORE_WEIGHTS } from "@aura/types";
import { computeBaselineScore } from "./baseline";

// ─── Component Scorers ──────────────────────────────────────────

/**
 * Compute the baseline component (0-100).
 * Directly delegates to baseline.ts.
 */
export function scoreBaselineComponent(baseline: MentalBaseline): number {
  return computeBaselineScore(baseline);
}

/**
 * Compute the daily check-in component (0-100).
 * Uses the average of the most recent check-ins (up to 7 days).
 *
 * Each check-in field is normalized to 0-100:
 * - mood (1-10) → direct mapping (higher = better)
 * - stress (1-10) → inverted (lower stress = better)
 * - anxiety (1-10) → inverted
 * - energy (1-10) → direct
 * - focus (1-10) → direct
 * - sleep (hours) → optimal 7-9 = 100, deviation reduces score
 */
export function scoreDailyComponent(checkIns: MentalDailyCheckIn[]): number {
  if (checkIns.length === 0) return 50; // neutral default

  const recent = checkIns.slice(-7);
  const scores = recent.map((c) => {
    const mood = ((c.moodScore - 1) / 9) * 100;
    const stress = ((10 - c.stressScoreManual) / 9) * 100;
    const anxiety = ((10 - c.anxietyScore) / 9) * 100;
    const energy = ((c.energyScore - 1) / 9) * 100;
    const focus = ((c.focusScore - 1) / 9) * 100;
    const sleep = scoreSleepHours(c.sleepHours);

    // Field weights within daily component
    return (
      mood * 0.25 +
      stress * 0.20 +
      anxiety * 0.15 +
      energy * 0.15 +
      focus * 0.10 +
      sleep * 0.15
    );
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Score sleep hours on a 0-100 scale.
 * Optimal: 7-9 hours = 100
 * Good: 6-7 or 9-10 = 75
 * Fair: 5-6 or 10-11 = 50
 * Poor: <5 or >11 = 25
 */
function scoreSleepHours(hours: number): number {
  if (hours >= 7 && hours <= 9) return 100;
  if (hours >= 6 && hours <= 10) return 75;
  if (hours >= 5 && hours <= 11) return 50;
  return 25;
}

/**
 * Compute the rPPG component (0-100).
 * Uses the most recent scan's stress index (inverted).
 * Signal quality is used as a confidence weight.
 */
export function scoreRppgComponent(scans: RppgScanResult[]): number {
  if (scans.length === 0) return 50; // neutral default when no scans available

  // Use up to 3 most recent scans, weighted by recency
  const recent = scans.slice(-3);
  const recencyWeights = recent.length === 1
    ? [1]
    : recent.length === 2
      ? [0.3, 0.7]
      : [0.15, 0.30, 0.55];

  let weightedSum = 0;
  let totalQualityWeight = 0;

  recent.forEach((scan, i) => {
    // Only include scans with acceptable signal quality
    if (scan.signalQuality >= 0.5) {
      const stressWellness = 100 - scan.stressIndex; // invert: low stress = high score
      const weight = recencyWeights[i] * scan.signalQuality;
      weightedSum += stressWellness * weight;
      totalQualityWeight += weight;
    }
  });

  if (totalQualityWeight === 0) return 50;
  return Math.round(weightedSum / totalQualityWeight);
}

/**
 * Compute the engagement component (0-100).
 * Measures how actively the user participates in their mental wellness journey.
 *
 * Scoring factors (over the last 7 days):
 * - Coping sessions completed: up to 30 points (1 session = 6 pts, max 5)
 * - Journal entries written: up to 25 points (1 entry = 5 pts, max 5)
 * - Check-in streak: up to 25 points (7/7 days = 25)
 * - Content progress: up to 20 points (any module progress counts)
 */
export function scoreEngagementComponent(params: {
  copingSessions: CopingSession[];
  journalEntries: MentalJournalEntry[];
  checkInCount: number;          // days checked in (0-7)
  contentProgress: ContentProgressEntry[];
}): number {
  const { copingSessions, journalEntries, checkInCount, contentProgress } = params;

  // Count completed coping sessions in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const recentCoping = copingSessions.filter(
    (s) => s.completed && s.completedAtIso >= sevenDaysAgoIso
  );
  const copingScore = Math.min(30, recentCoping.length * 6);

  const recentJournal = journalEntries.filter(
    (j) => j.createdAtIso >= sevenDaysAgoIso
  );
  const journalScore = Math.min(25, recentJournal.length * 5);

  const checkInScore = Math.round((Math.min(7, checkInCount) / 7) * 25);

  // Content progress: any module with > 0% counts
  const activeModules = contentProgress.filter((c) => c.progressPercent > 0);
  const averageProgress =
    activeModules.length > 0
      ? activeModules.reduce((sum, c) => sum + c.progressPercent, 0) / activeModules.length
      : 0;
  const contentScore = Math.round((averageProgress / 100) * 20);

  return Math.min(100, copingScore + journalScore + checkInScore + contentScore);
}

// ─── Composite Score ────────────────────────────────────────────

/**
 * Compute the full 4-signal composite mental wellness score.
 */
export function computeMentalWellnessScore(params: {
  userId: string;
  baseline: MentalBaseline;
  checkIns: MentalDailyCheckIn[];
  scans: RppgScanResult[];
  copingSessions: CopingSession[];
  journalEntries: MentalJournalEntry[];
  checkInDaysCount: number;
  contentProgress: ContentProgressEntry[];
}): MentalWellnessScore {
  const baselineComponent = scoreBaselineComponent(params.baseline);
  const dailyComponent = scoreDailyComponent(params.checkIns);
  const rppgComponent = scoreRppgComponent(params.scans);
  const engagementComponent = scoreEngagementComponent({
    copingSessions: params.copingSessions,
    journalEntries: params.journalEntries,
    checkInCount: params.checkInDaysCount,
    contentProgress: params.contentProgress,
  });

  const compositeScore = Math.round(
    baselineComponent * MENTAL_SCORE_WEIGHTS.baseline +
    dailyComponent * MENTAL_SCORE_WEIGHTS.daily +
    rppgComponent * MENTAL_SCORE_WEIGHTS.rppg +
    engagementComponent * MENTAL_SCORE_WEIGHTS.engagement
  );

  return {
    userId: params.userId,
    compositeScore: Math.max(0, Math.min(100, compositeScore)),
    baselineComponent,
    dailyComponent,
    rppgComponent,
    engagementComponent,
    calculatedAtIso: new Date().toISOString(),
  };
}

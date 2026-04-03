/**
 * Composite lifestyle wellness score calculator.
 *
 * Blends three signals:
 * | Signal         | Weight | Input                              |
 * |----------------|--------|------------------------------------|
 * | Baseline       | 40%    | Onboarding 36-question assessment  |
 * | Daily check-in | 40%    | Recent daily check-in averages     |
 * | Engagement     | 20%    | Check-in streak, log consistency   |
 *
 * Each component is normalized to 0-100 before weighting.
 * Trend adjustment: +5 for 10+ point week-over-week improvement, -5 for decline.
 */

import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleBand,
  LifestyleScoreRun,
} from "@aura/types";

import { computeCompositeScore, computeAllDomainScores, classifyBand } from "./baseline";

// ─── Signal weights ────────────────────────────────────────────

const SIGNAL_WEIGHTS = {
  baseline: 0.40,
  daily: 0.40,
  engagement: 0.20,
} as const;

// ─── Component scorers ────────────────────────────────────────

export function scoreBaselineComponent(baseline: LifestyleBaseline): number {
  return baseline.totalScore;
}

/**
 * Daily check-in component (0-100).
 * Averages the most recent 7 check-ins across all 7 domains.
 */
export function scoreDailyComponent(checkIns: LifestyleDailyCheckIn[]): number {
  if (checkIns.length === 0) return 50;

  const recent = checkIns.slice(-7);
  const scores = recent.map((c) => {
    const sleep = scoreSleepHours(c.sleepHours);
    const sleepQ = (c.sleepQuality / 10) * 100;
    const nutrition = scoreNutrition(c);
    const hydration = scoreHydration(c);
    const movement = scoreMovement(c);
    const digital = scoreDigital(c);
    const nature = scoreNature(c);
    const routine = scoreRoutine(c);

    // PRD weights: nutrition 18%, sleep 18%, movement 16%, hydration 12%, digital 12%, nature 12%, routine 12%
    return (
      sleep * 0.09 +
      sleepQ * 0.09 +
      nutrition * 0.18 +
      hydration * 0.12 +
      movement * 0.16 +
      digital * 0.12 +
      nature * 0.12 +
      routine * 0.12
    );
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function scoreEngagementComponent(params: {
  checkInCount: number;
  hasLoggedMeals: boolean;
  hasLoggedHydration: boolean;
  hasLoggedMovement: boolean;
}): number {
  const { checkInCount, hasLoggedMeals, hasLoggedHydration, hasLoggedMovement } = params;
  const streakScore = Math.round((Math.min(7, checkInCount) / 7) * 50);
  const logScore =
    (hasLoggedMeals ? 17 : 0) +
    (hasLoggedHydration ? 17 : 0) +
    (hasLoggedMovement ? 16 : 0);
  return Math.min(100, streakScore + logScore);
}

// ─── Composite score ──────────────────────────────────────────

export function computeLifestyleWellnessScore(params: {
  baseline: LifestyleBaseline;
  checkIns: LifestyleDailyCheckIn[];
  checkInDaysCount: number;
  hasLoggedMeals: boolean;
  hasLoggedHydration: boolean;
  hasLoggedMovement: boolean;
  previousWeekScore?: number;
}): LifestyleScoreRun {
  const baselineComponent = scoreBaselineComponent(params.baseline);
  const dailyComponent = scoreDailyComponent(params.checkIns);
  const engagementComponent = scoreEngagementComponent({
    checkInCount: params.checkInDaysCount,
    hasLoggedMeals: params.hasLoggedMeals,
    hasLoggedHydration: params.hasLoggedHydration,
    hasLoggedMovement: params.hasLoggedMovement,
  });

  let composite = Math.round(
    baselineComponent * SIGNAL_WEIGHTS.baseline +
    dailyComponent * SIGNAL_WEIGHTS.daily +
    engagementComponent * SIGNAL_WEIGHTS.engagement
  );

  // Trend adjustment per PRD: +5 for 10+ point improvement, -5 for 10+ decline
  if (params.previousWeekScore != null) {
    const delta = composite - params.previousWeekScore;
    if (delta >= 10) composite += 5;
    else if (delta <= -10) composite -= 5;
  }

  const totalScore = Math.max(0, Math.min(100, composite));
  const domainScores = computeAllDomainScores(params.baseline.rawAnswers);

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
    createdAt: new Date().toISOString(),
  };
}

// ─── Domain sub-scorers (0-100 from daily check-in fields) ────

function scoreSleepHours(hours: number): number {
  if (hours >= 7 && hours <= 9) return 100;
  if (hours >= 6 && hours <= 10) return 75;
  if (hours >= 5 && hours <= 11) return 50;
  return 25;
}

function scoreNutrition(c: LifestyleDailyCheckIn): number {
  const produce = Math.min(100, ((c.fruitServings ?? 0) + (c.vegServings ?? 0)) / 6 * 100);
  const meals = Math.min(100, (c.mealsEaten ?? c.fruitVegServings ?? 3) / 3 * 100);
  const processed = Math.max(0, 100 - (c.ultraProcessedServings ?? 0) * 25);
  return Math.round((produce * 0.4 + meals * 0.3 + processed * 0.3));
}

function scoreHydration(c: LifestyleDailyCheckIn): number {
  return Math.min(100, (c.waterMl / 2500) * 100);
}

function scoreMovement(c: LifestyleDailyCheckIn): number {
  const active = Math.min(100, ((c.activeMinutes ?? 0) / 30) * 100);
  const breaks = Math.min(100, ((c.movementBreaks ?? 0) / 4) * 100);
  return Math.round(active * 0.6 + breaks * 0.4);
}

function scoreDigital(c: LifestyleDailyCheckIn): number {
  const screenMin = c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60;
  const bedMin = c.bedtimeScreenMinutes ?? 30;
  const screen = Math.max(0, 100 - (screenMin / 240) * 100);
  const bed = Math.max(0, 100 - (bedMin / 60) * 100);
  return Math.round(screen * 0.5 + bed * 0.5);
}

function scoreNature(c: LifestyleDailyCheckIn): number {
  const outdoor = Math.min(100, ((c.outdoorMinutes ?? 0) / 20) * 100);
  const daylight = Math.min(100, ((c.morningDaylightMinutes ?? 0) / 10) * 100);
  return Math.round(outdoor * 0.6 + daylight * 0.4);
}

function scoreRoutine(c: LifestyleDailyCheckIn): number {
  const morningMap = { fully: 100, yes: 100, mostly: 75, partly: 50, no: 0 };
  const eveningMap = { fully: 100, yes: 100, mostly: 75, partly: 50, no: 0 };
  const morning = morningMap[c.morningRoutineDone ?? "no"] ?? 0;
  const evening = eveningMap[c.eveningRoutineDone ?? "no"] ?? 0;
  // Backward compat
  if (morning === 0 && evening === 0 && c.routineCompletion) {
    return c.routineCompletion === "yes" ? 100 : c.routineCompletion === "partly" ? 50 : 0;
  }
  return Math.round((morning + evening) / 2);
}

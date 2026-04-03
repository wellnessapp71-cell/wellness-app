/**
 * Lifestyle weekly review engine.
 *
 * Computes 7-day retrospective data and generates a LifestyleWeeklyReview.
 * Pure function — no side effects.
 *
 * PRD v2 Section 9 — weekly judgement criteria:
 * - Balanced meals 5-7 days = green
 * - Sleep 7+ hours 5-7 nights = green
 * - 150+ active minutes = green
 * - Hydration target 5+ days = green
 * - Screen under limit 5+ days = green
 * - Routine completed 5+ days = green
 */

import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleWeeklyReview,
} from "@aura/types";

import { computeCompositeScore, computeAllDomainScores } from "./baseline";
import { countCheckInDays } from "./checkin-analyzer";

// ─── Public API ────────────────────────────────────────────────

/**
 * Generate a weekly review from the last 7 days of check-ins + baseline.
 */
export function generateWeeklyReview(params: {
  baseline: LifestyleBaseline;
  checkIns: LifestyleDailyCheckIn[];
  previousScore?: number;
}): LifestyleWeeklyReview {
  const { baseline, checkIns, previousScore } = params;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);

  const cutoff = weekStart.toISOString().split("T")[0];
  const recent = checkIns.filter((c) => c.date >= cutoff);

  // Sleep: days with 7+ hours
  const goodSleepDays = recent.filter((c) => c.sleepHours >= 7).length;

  // Hydration: days with 2000+ ml
  const hydrationTargetDays = recent.filter((c) => c.waterMl >= 2000).length;

  // Meal logging: days where they checked in (proxy for logging)
  const mealLogDays = countCheckInDays(checkIns, 7);

  // Balanced meal days: days with 3+ meals and fruit+veg >= 4 servings
  const balancedMealDays = recent.filter((c) => {
    const meals = c.mealsEaten ?? c.fruitVegServings ?? 3;
    const produce = (c.fruitServings ?? 0) + (c.vegServings ?? 0);
    return meals >= 3 && produce >= 4;
  }).length;

  // Movement: days with 20+ active minutes
  const movementDays = recent.filter(
    (c) => (c.activeMinutes ?? 0) >= 20,
  ).length;

  // Strength/yoga days
  const strengthYogaDays = recent.filter(
    (c) => (c.strengthYogaDone ?? "no") !== "no",
  ).length;

  // Screen interference: days with screen time under limit (< 180 min non-work)
  const screenInterferenceDays = recent.filter((c) => {
    const screenMin =
      c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60;
    return screenMin >= 240; // 4+ hours = interference
  }).length;

  // Screen under limit days (< 3 hours non-work)
  const screenUnderLimitDays = recent.filter((c) => {
    const screenMin =
      c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60;
    return screenMin <= 180;
  }).length;

  // Outdoor days
  const outdoorDays = recent.filter((c) => {
    if (c.outdoorMinutes != null) return c.outdoorMinutes >= 10;
    return c.gotOutdoors === true;
  }).length;

  // Routine days: days with morning or evening routine completed
  const routineDays = recent.filter((c) => {
    const morning = c.morningRoutineDone ?? "no";
    const evening = c.eveningRoutineDone ?? "no";
    if (morning !== "no" || evening !== "no") {
      return (
        morning === "fully" ||
        morning === "yes" ||
        morning === "mostly" ||
        evening === "fully" ||
        evening === "yes" ||
        evening === "mostly"
      );
    }
    // Backward compat
    return c.routineCompletion === "yes";
  }).length;

  // Best/worst habits
  const helpedMost = identifyHelpedMost(recent);
  const blockedMost = identifyBlockedMost(recent);

  // Score change vs previous
  const currentDomainScores = computeAllDomainScores(baseline.rawAnswers);
  const currentTotal = computeCompositeScore(currentDomainScores);
  const scoreChange = previousScore != null ? currentTotal - previousScore : 0;

  return {
    id: generateId("wr"),
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: now.toISOString().split("T")[0],
    goodSleepDays,
    hydrationTargetDays,
    mealLogDays,
    balancedMealDays,
    movementDays,
    moderateActivityDays: movementDays,
    strengthYogaDays,
    screenInterferenceDays,
    screenUnderLimitDays,
    outdoorDays,
    routineDays,
    helpedMostHabit: helpedMost,
    blockedMostHabit: blockedMost,
    scoreChange,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Compare current week vs baseline to generate a summary message.
 * PRD Section 9 judgement: 5+ days in a domain = green for that domain.
 */
export function generateWeeklyInsight(review: LifestyleWeeklyReview): string {
  const insights: string[] = [];

  if (review.goodSleepDays >= 5) {
    insights.push("Great sleep consistency — 5+ nights at 7+ hours.");
  } else if (review.goodSleepDays <= 2) {
    insights.push("Sleep was low this week. Prioritize a consistent bedtime.");
  }

  if ((review.balancedMealDays ?? 0) >= 5) {
    insights.push("Balanced meals on 5+ days — strong nutrition week.");
  }

  if (review.hydrationTargetDays >= 5) {
    insights.push("Hydration was on target most days — keep it up.");
  }

  if (review.movementDays >= 5) {
    insights.push("Active on 5+ days — great movement consistency.");
  }

  if ((review.screenUnderLimitDays ?? 0) >= 5) {
    insights.push("Screen time stayed under control most days.");
  } else if (review.screenInterferenceDays >= 4) {
    insights.push(
      "Screen time was high on most days. Try a digital sunset routine.",
    );
  }

  if ((review.routineDays ?? 0) >= 5) {
    insights.push("Routines completed consistently this week.");
  }

  if (review.scoreChange > 0) {
    insights.push(
      `Your score improved by ${review.scoreChange} points this week.`,
    );
  } else if (review.scoreChange < 0) {
    insights.push(
      `Your score dipped by ${Math.abs(review.scoreChange)} points — a recovery week can help.`,
    );
  }

  return insights.length > 0
    ? insights[0]
    : "Keep checking in daily to build meaningful lifestyle insights.";
}

// ─── Helpers ──────────────────────────────────────────────────

function identifyHelpedMost(checkIns: LifestyleDailyCheckIn[]): string | null {
  if (checkIns.length === 0) return null;

  const avgSleep = avg(checkIns.map((c) => c.sleepHours));
  const avgWater = avg(checkIns.map((c) => c.waterMl));
  const activeRate =
    checkIns.filter((c) => (c.activeMinutes ?? 0) >= 20).length /
    checkIns.length;
  const outdoorRate =
    checkIns.filter((c) => {
      if (c.outdoorMinutes != null) return c.outdoorMinutes >= 10;
      return c.gotOutdoors === true;
    }).length / checkIns.length;
  const routineRate =
    checkIns.filter((c) => {
      const m = c.morningRoutineDone ?? "no";
      const e = c.eveningRoutineDone ?? "no";
      if (m !== "no" || e !== "no")
        return m === "fully" || m === "yes" || e === "fully" || e === "yes";
      return c.routineCompletion === "yes";
    }).length / checkIns.length;

  const scores: [string, number][] = [
    ["Sleep", avgSleep >= 7 ? 1 : 0],
    ["Hydration", avgWater >= 2000 ? 1 : 0],
    ["Movement", activeRate >= 0.5 ? 1 : 0],
    ["Nature", outdoorRate >= 0.5 ? 1 : 0],
    ["Routine", routineRate >= 0.5 ? 1 : 0],
  ];

  const best = scores.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
}

function identifyBlockedMost(checkIns: LifestyleDailyCheckIn[]): string | null {
  if (checkIns.length === 0) return null;

  const blockerCounts = new Map<string, number>();
  for (const c of checkIns) {
    for (const b of c.blockers) {
      blockerCounts.set(b, (blockerCounts.get(b) ?? 0) + 1);
    }
  }

  if (blockerCounts.size === 0) return null;
  return [...blockerCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}${Date.now().toString(36)}`;
}

/**
 * Lifestyle monthly review engine.
 *
 * Computes 30-day retrospective across all 7 domains,
 * determines per-domain improvement, and captures plan preference.
 *
 * PRD v2 monthly judgement: 3+ domains improve = plan working.
 */

import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleDomain,
  LifestyleMonthlyReview,
  LifestyleWeeklyReview,
} from "@aura/types";

import { LIFESTYLE_DOMAINS } from "@aura/types";

// ─── Public API ────────────────────────────────────────────────

/**
 * Generate a monthly review from 30 days of check-ins + weekly reviews.
 */
export function generateMonthlyReview(params: {
  baseline: LifestyleBaseline;
  checkIns: LifestyleDailyCheckIn[];
  weeklyReviews: LifestyleWeeklyReview[];
  planPreference: "simpler" | "same" | "advanced";
  month: string; // e.g. "2026-04"
}): LifestyleMonthlyReview {
  const { baseline, checkIns, weeklyReviews, planPreference, month } = params;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffIso = cutoff.toISOString().split("T")[0];
  const recent = checkIns.filter((c) => c.date >= cutoffIso);

  const sleepImproved = assessSleepImprovement(recent, baseline);
  const mealQualityImproved = assessNutritionImprovement(recent, baseline);
  const hydrationImproved = assessHydrationImprovement(recent, baseline);
  const movementImproved = assessMovementImprovement(recent, weeklyReviews);
  const screenBalanceImproved = assessScreenImprovement(recent, baseline);
  const natureImproved = assessNatureImprovement(recent, baseline);
  const routineImproved = assessRoutineImprovement(recent);

  // Determine most improved and worst domain
  const domainImprovements: Record<LifestyleDomain, boolean> = {
    sleep: sleepImproved,
    nutrition: mealQualityImproved,
    hydration: hydrationImproved,
    movement: movementImproved,
    digital: screenBalanceImproved,
    nature: natureImproved,
    routine: routineImproved,
  };

  const mostImprovedDomain = findMostImproved(recent, baseline);
  const worstDomain = findWorstDomain(recent, baseline);

  return {
    id: generateId("mr"),
    month,
    sleepImproved,
    mealQualityImproved,
    hydrationImproved,
    movementImproved,
    screenBalanceImproved,
    natureImproved,
    routineImproved,
    mostImprovedDomain,
    worstDomain,
    planPreference,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a monthly insight summary string.
 * PRD: 3+ domains improve = plan working.
 */
export function generateMonthlyInsight(review: LifestyleMonthlyReview): string {
  const improved: string[] = [];
  const declined: string[] = [];

  if (review.sleepImproved) improved.push("Sleep");
  else declined.push("Sleep");
  if (review.mealQualityImproved) improved.push("Nutrition");
  else declined.push("Nutrition");
  if (review.hydrationImproved) improved.push("Hydration");
  else declined.push("Hydration");
  if (review.movementImproved) improved.push("Movement");
  else declined.push("Movement");
  if (review.screenBalanceImproved) improved.push("Digital Balance");
  else declined.push("Digital Balance");
  if (review.natureImproved) improved.push("Nature");
  else declined.push("Nature");
  if (review.routineImproved) improved.push("Routine");
  else declined.push("Routine");

  // PRD: 3+ domains improve = plan is working
  if (improved.length >= 4) {
    return `Strong month! ${improved.join(", ")} all improved. Keep the momentum going.`;
  }
  if (improved.length >= 3) {
    return `Good progress — ${improved.join(", ")} improved this month. Your plan is working.`;
  }
  if (improved.length > 0) {
    return `${improved.join(" and ")} improved this month. Focus on ${declined[0]} next.`;
  }
  return "This was a tough month. Pick one area to focus on and build from there.";
}

// ─── Domain improvement assessors ──────────────────────────────

function assessSleepImprovement(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): boolean {
  if (checkIns.length < 7) return false;
  const avgSleep = avg(checkIns.map((c) => c.sleepHours));
  return avgSleep >= 7 || baseline.sleepScore >= 60;
}

function assessNutritionImprovement(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): boolean {
  if (checkIns.length < 7) return false;
  const avgProduce = avg(
    checkIns.map(
      (c) =>
        (c.fruitServings ?? 0) + (c.vegServings ?? 0) ||
        (c.fruitVegServings ?? 0),
    ),
  );
  return avgProduce >= 4 || baseline.nutritionScore >= 60;
}

function assessHydrationImprovement(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): boolean {
  if (checkIns.length < 7) return false;
  const avgWater = avg(checkIns.map((c) => c.waterMl));
  return avgWater >= 2000 || baseline.hydrationScore >= 60;
}

function assessMovementImprovement(
  checkIns: LifestyleDailyCheckIn[],
  weeklyReviews: LifestyleWeeklyReview[],
): boolean {
  if (checkIns.length < 7) return false;
  const avgActive = avg(checkIns.map((c) => c.activeMinutes ?? 0));
  // PRD: 150+ active min/week = green; daily avg ~21+ min
  if (avgActive >= 21) return true;
  if (weeklyReviews.length === 0) return false;
  const avgMovementDays = avg(weeklyReviews.map((r) => r.movementDays));
  return avgMovementDays >= 3;
}

function assessScreenImprovement(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): boolean {
  if (checkIns.length < 7) return false;
  const avgScreen = avg(
    checkIns.map(
      (c) => c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60,
    ),
  );
  return avgScreen <= 180 || baseline.digitalScore >= 60;
}

function assessNatureImprovement(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): boolean {
  if (checkIns.length < 7) return false;
  const outdoorRate =
    checkIns.filter((c) => {
      if (c.outdoorMinutes != null) return c.outdoorMinutes >= 10;
      return c.gotOutdoors === true;
    }).length / checkIns.length;
  return outdoorRate >= 0.5 || baseline.natureScore >= 60;
}

function assessRoutineImprovement(checkIns: LifestyleDailyCheckIn[]): boolean {
  if (checkIns.length < 7) return false;
  const completionRate =
    checkIns.filter((c) => {
      const m = c.morningRoutineDone ?? "no";
      const e = c.eveningRoutineDone ?? "no";
      if (m !== "no" || e !== "no") {
        return (
          m === "fully" ||
          m === "yes" ||
          m === "mostly" ||
          e === "fully" ||
          e === "yes" ||
          e === "mostly"
        );
      }
      return c.routineCompletion === "yes";
    }).length / checkIns.length;
  return completionRate >= 0.5;
}

// ─── Most improved / worst domain helpers ────────────────────

function findMostImproved(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): LifestyleDomain | null {
  if (checkIns.length < 7) return null;

  const domainDeltas: [LifestyleDomain, number][] = [
    [
      "sleep",
      avg(
        checkIns.map((c) =>
          c.sleepHours >= 7 ? 100 : c.sleepHours >= 6 ? 50 : 25,
        ),
      ) - baseline.sleepScore,
    ],
    [
      "nutrition",
      avg(
        checkIns.map((c) =>
          Math.min(
            100,
            (((c.fruitServings ?? 0) + (c.vegServings ?? 0)) / 6) * 100,
          ),
        ),
      ) - baseline.nutritionScore,
    ],
    [
      "hydration",
      avg(checkIns.map((c) => Math.min(100, (c.waterMl / 2500) * 100))) -
        baseline.hydrationScore,
    ],
    [
      "movement",
      avg(
        checkIns.map((c) => Math.min(100, ((c.activeMinutes ?? 0) / 30) * 100)),
      ) - baseline.movementScore,
    ],
    [
      "digital",
      avg(
        checkIns.map((c) => {
          const mins =
            c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60;
          return Math.max(0, 100 - (mins / 240) * 100);
        }),
      ) - baseline.digitalScore,
    ],
    [
      "nature",
      avg(
        checkIns.map((c) =>
          Math.min(100, ((c.outdoorMinutes ?? 0) / 20) * 100),
        ),
      ) - baseline.natureScore,
    ],
    [
      "routine",
      avg(
        checkIns.map((c) => {
          const m = c.morningRoutineDone ?? "no";
          const e = c.eveningRoutineDone ?? "no";
          const mScore =
            m === "fully" || m === "yes"
              ? 100
              : m === "mostly"
                ? 75
                : m === "partly"
                  ? 50
                  : 0;
          const eScore =
            e === "fully" || e === "yes"
              ? 100
              : e === "mostly"
                ? 75
                : e === "partly"
                  ? 50
                  : 0;
          return (mScore + eScore) / 2;
        }),
      ) - baseline.routineScore,
    ],
  ];

  const best = domainDeltas.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
}

function findWorstDomain(
  checkIns: LifestyleDailyCheckIn[],
  baseline: LifestyleBaseline,
): LifestyleDomain | null {
  if (checkIns.length < 7) return null;

  const domainDeltas: [LifestyleDomain, number][] = [
    [
      "sleep",
      avg(
        checkIns.map((c) =>
          c.sleepHours >= 7 ? 100 : c.sleepHours >= 6 ? 50 : 25,
        ),
      ) - baseline.sleepScore,
    ],
    [
      "nutrition",
      avg(
        checkIns.map((c) =>
          Math.min(
            100,
            (((c.fruitServings ?? 0) + (c.vegServings ?? 0)) / 6) * 100,
          ),
        ),
      ) - baseline.nutritionScore,
    ],
    [
      "hydration",
      avg(checkIns.map((c) => Math.min(100, (c.waterMl / 2500) * 100))) -
        baseline.hydrationScore,
    ],
    [
      "movement",
      avg(
        checkIns.map((c) => Math.min(100, ((c.activeMinutes ?? 0) / 30) * 100)),
      ) - baseline.movementScore,
    ],
    [
      "digital",
      avg(
        checkIns.map((c) => {
          const mins =
            c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60;
          return Math.max(0, 100 - (mins / 240) * 100);
        }),
      ) - baseline.digitalScore,
    ],
    [
      "nature",
      avg(
        checkIns.map((c) =>
          Math.min(100, ((c.outdoorMinutes ?? 0) / 20) * 100),
        ),
      ) - baseline.natureScore,
    ],
    [
      "routine",
      avg(
        checkIns.map((c) => {
          const m = c.morningRoutineDone ?? "no";
          const e = c.eveningRoutineDone ?? "no";
          const mScore =
            m === "fully" || m === "yes"
              ? 100
              : m === "mostly"
                ? 75
                : m === "partly"
                  ? 50
                  : 0;
          const eScore =
            e === "fully" || e === "yes"
              ? 100
              : e === "mostly"
                ? 75
                : e === "partly"
                  ? 50
                  : 0;
          return (mScore + eScore) / 2;
        }),
      ) - baseline.routineScore,
    ],
  ];

  const worst = domainDeltas.sort((a, b) => a[1] - b[1])[0];
  return worst[1] < 0 ? worst[0] : null;
}

// ─── Helpers ──────────────────────────────────────────────────

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}${Date.now().toString(36)}`;
}

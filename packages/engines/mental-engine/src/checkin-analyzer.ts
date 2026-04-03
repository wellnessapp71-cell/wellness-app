/**
 * Daily check-in trend analysis.
 *
 * Computes 7-day rolling averages, trend direction (improving/stable/declining),
 * top stress triggers, and most-used coping actions.
 */

import type {
  MentalDailyCheckIn,
  TrendDirection,
  FieldTrend,
  TrendAnalysis,
  TriggerTag,
  InterventionType,
} from "@aura/types";

// ─── Trend Direction ────────────────────────────────────────────

/**
 * Determine trend direction from a series of values.
 * Uses simple linear regression slope as the indicator.
 *
 * For "inverted" fields (stress, anxiety) where lower = better,
 * a negative slope means improvement.
 */
function detectTrend(values: number[], inverted = false): TrendDirection {
  if (values.length < 3) return "stable";

  // Simple linear regression slope
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, v, i) => sum + v * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Threshold: slope must be at least 0.15 per day to be considered a trend
  const threshold = 0.15;
  const effectiveSlope = inverted ? -slope : slope;

  if (effectiveSlope > threshold) return "improving";
  if (effectiveSlope < -threshold) return "declining";
  return "stable";
}

/**
 * Compute the percentage change between first half and second half averages.
 */
function computeChangePercent(values: number[]): number {
  if (values.length < 2) return 0;
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (avgFirst === 0) return 0;
  return Math.round(((avgSecond - avgFirst) / avgFirst) * 100);
}

// ─── Field Extraction ───────────────────────────────────────────

type CheckInField = "moodScore" | "stressScoreManual" | "anxietyScore" |
  "energyScore" | "focusScore" | "sleepHours";

const FIELD_CONFIG: { field: CheckInField; label: string; inverted: boolean }[] = [
  { field: "moodScore", label: "Mood", inverted: false },
  { field: "stressScoreManual", label: "Stress", inverted: true },
  { field: "anxietyScore", label: "Anxiety", inverted: true },
  { field: "energyScore", label: "Energy", inverted: false },
  { field: "focusScore", label: "Focus", inverted: false },
  { field: "sleepHours", label: "Sleep", inverted: false },
];

function extractFieldValues(
  checkIns: MentalDailyCheckIn[],
  field: CheckInField
): number[] {
  return checkIns.map((c) => c[field] as number);
}

function computeFieldTrend(
  checkIns: MentalDailyCheckIn[],
  config: { field: CheckInField; label: string; inverted: boolean }
): FieldTrend {
  const values = extractFieldValues(checkIns, config.field);
  const average =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : 0;

  return {
    field: config.label,
    values,
    average,
    direction: detectTrend(values, config.inverted),
    changePercent: computeChangePercent(
      config.inverted ? values.map((v) => -v) : values
    ),
  };
}

// ─── Trigger & Coping Analysis ──────────────────────────────────

function analyzeTopTriggers(
  checkIns: MentalDailyCheckIn[]
): { tag: TriggerTag; count: number }[] {
  const counts = new Map<TriggerTag, number>();

  for (const checkIn of checkIns) {
    for (const tag of checkIn.stressTriggerTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzeTopCopingActions(
  checkIns: MentalDailyCheckIn[]
): { action: InterventionType; count: number }[] {
  const counts = new Map<InterventionType, number>();

  for (const checkIn of checkIns) {
    if (checkIn.copingActionUsed) {
      counts.set(
        checkIn.copingActionUsed,
        (counts.get(checkIn.copingActionUsed) ?? 0) + 1
      );
    }
  }

  return Array.from(counts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Perform full trend analysis on a window of check-ins.
 *
 * @param userId - User identifier
 * @param checkIns - Check-ins sorted by date ascending
 * @param windowDays - Analysis window (typically 7 or 30)
 */
export function analyzeCheckInTrends(
  userId: string,
  checkIns: MentalDailyCheckIn[],
  windowDays: number = 7
): TrendAnalysis {
  // Filter to window
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffIso = cutoff.toISOString();

  const windowed = checkIns.filter((c) => c.dateIso >= cutoffIso);

  return {
    userId,
    windowDays,
    fields: FIELD_CONFIG.map((config) => computeFieldTrend(windowed, config)),
    topTriggers: analyzeTopTriggers(windowed),
    topCopingActions: analyzeTopCopingActions(windowed),
    analysisDateIso: new Date().toISOString(),
  };
}

/**
 * Get a rolling average for a specific field over the last N days.
 */
export function rollingAverage(
  checkIns: MentalDailyCheckIn[],
  field: CheckInField,
  days: number = 7
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const values = checkIns
    .filter((c) => c.dateIso >= cutoffIso)
    .map((c) => c[field] as number);

  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/**
 * Determine how many unique days the user has checked in during the last N days.
 */
export function countCheckInDays(
  checkIns: MentalDailyCheckIn[],
  days: number = 7
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const uniqueDays = new Set(
    checkIns
      .filter((c) => c.dateIso >= cutoffIso)
      .map((c) => c.dateIso.split("T")[0])
  );

  return uniqueDays.size;
}

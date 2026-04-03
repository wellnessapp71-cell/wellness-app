/**
 * Daily check-in trend analysis for lifestyle.
 *
 * Computes rolling averages, trend direction, and top blockers
 * from recent LifestyleDailyCheckIn entries.
 *
 * PRD v2: tracks all measurable daily fields across 7 domains.
 */

import type { LifestyleDailyCheckIn, LifestyleBlockerTag } from "@aura/types";

// ─── Trend direction ───────────────────────────────────────────

export type TrendDirection = "improving" | "stable" | "declining";

export interface FieldTrend {
  field: string;
  values: number[];
  average: number;
  direction: TrendDirection;
  changePercent: number;
}

export interface LifestyleTrendAnalysis {
  windowDays: number;
  fields: FieldTrend[];
  topBlockers: { tag: LifestyleBlockerTag; count: number }[];
  analysisDate: string;
}

/**
 * Detect trend via simple linear-regression slope.
 * For inverted fields (e.g. screen time), negative slope = improving.
 */
function detectTrend(values: number[], inverted = false): TrendDirection {
  if (values.length < 3) return "stable";

  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, v, i) => sum + v * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const threshold = 0.15;
  const effective = inverted ? -slope : slope;

  if (effective > threshold) return "improving";
  if (effective < -threshold) return "declining";
  return "stable";
}

function changePercent(values: number[]): number {
  if (values.length < 2) return 0;
  const mid = Math.floor(values.length / 2);
  const avgFirst = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const avgSecond =
    values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
  if (avgFirst === 0) return 0;
  return Math.round(((avgSecond - avgFirst) / avgFirst) * 100);
}

// ─── Field extraction ──────────────────────────────────────────

type CheckInField =
  | "sleepHours"
  | "sleepQuality"
  | "waterMl"
  | "activeMinutes"
  | "outdoorMinutes"
  | "morningDaylightMinutes"
  | "screenMinutesNonWork"
  | "bedtimeScreenMinutes"
  // Backward compat aliases
  | "fruitVegServings"
  | "screenHoursNonWork";

interface FieldConfig {
  field: CheckInField;
  label: string;
  inverted: boolean;
  /** Extractor for computed/nullable fields */
  extract?: (c: LifestyleDailyCheckIn) => number;
}

const FIELD_CONFIG: FieldConfig[] = [
  // Sleep domain
  { field: "sleepHours", label: "Sleep Hours", inverted: false },
  { field: "sleepQuality", label: "Sleep Quality", inverted: false },

  // Nutrition domain
  {
    field: "fruitVegServings",
    label: "Fruit & Veg Servings",
    inverted: false,
    extract: (c) =>
      (c.fruitServings ?? 0) + (c.vegServings ?? 0) ||
      (c.fruitVegServings ?? 0),
  },

  // Hydration domain
  { field: "waterMl", label: "Water Intake (ml)", inverted: false },

  // Movement domain
  {
    field: "activeMinutes",
    label: "Active Minutes",
    inverted: false,
    extract: (c) => c.activeMinutes ?? 0,
  },

  // Digital domain
  {
    field: "screenMinutesNonWork",
    label: "Screen Time (min)",
    inverted: true,
    extract: (c) => c.screenMinutesNonWork ?? (c.screenHoursNonWork ?? 2) * 60,
  },
  {
    field: "bedtimeScreenMinutes",
    label: "Bedtime Screen (min)",
    inverted: true,
    extract: (c) => c.bedtimeScreenMinutes ?? 30,
  },

  // Nature domain
  {
    field: "outdoorMinutes",
    label: "Outdoor Minutes",
    inverted: false,
    extract: (c) => c.outdoorMinutes ?? 0,
  },
  {
    field: "morningDaylightMinutes",
    label: "Morning Daylight (min)",
    inverted: false,
    extract: (c) => c.morningDaylightMinutes ?? 0,
  },
];

function computeFieldTrend(
  checkIns: LifestyleDailyCheckIn[],
  config: FieldConfig,
): FieldTrend {
  const values = config.extract
    ? checkIns.map(config.extract)
    : checkIns.map((c) => ((c as any)[config.field] as number) ?? 0);

  const average =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) /
        10
      : 0;

  return {
    field: config.label,
    values,
    average,
    direction: detectTrend(values, config.inverted),
    changePercent: changePercent(
      config.inverted ? values.map((v) => -v) : values,
    ),
  };
}

// ─── Blocker analysis ──────────────────────────────────────────

function analyzeBlockers(
  checkIns: LifestyleDailyCheckIn[],
): { tag: LifestyleBlockerTag; count: number }[] {
  const counts = new Map<LifestyleBlockerTag, number>();

  for (const c of checkIns) {
    for (const tag of c.blockers) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Full trend analysis over a window of check-ins.
 */
export function analyzeLifestyleTrends(
  checkIns: LifestyleDailyCheckIn[],
  windowDays: number = 7,
): LifestyleTrendAnalysis {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffIso = cutoff.toISOString().split("T")[0];

  const windowed = checkIns.filter((c) => c.date >= cutoffIso);

  return {
    windowDays,
    fields: FIELD_CONFIG.map((cfg) => computeFieldTrend(windowed, cfg)),
    topBlockers: analyzeBlockers(windowed),
    analysisDate: new Date().toISOString(),
  };
}

/**
 * Rolling average of a specific field over last N days.
 */
export function rollingAverage(
  checkIns: LifestyleDailyCheckIn[],
  field: CheckInField,
  days: number = 7,
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString().split("T")[0];

  const config = FIELD_CONFIG.find((c) => c.field === field);
  const filtered = checkIns.filter((c) => c.date >= cutoffIso);

  const values = config?.extract
    ? filtered.map(config.extract)
    : filtered.map((c) => ((c as any)[field] as number) ?? 0);

  if (values.length === 0) return 0;
  return (
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  );
}

/**
 * Count unique check-in days within the last N days.
 */
export function countCheckInDays(
  checkIns: LifestyleDailyCheckIn[],
  days: number = 7,
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString().split("T")[0];

  const uniqueDays = new Set(
    checkIns.filter((c) => c.date >= cutoffIso).map((c) => c.date),
  );
  return uniqueDays.size;
}

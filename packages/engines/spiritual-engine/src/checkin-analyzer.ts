/**
 * Daily check-in trend analysis for spiritual wellness.
 *
 * Judgement criteria from PRD Section 4:
 * - 0-2 calm = red
 * - 3-4 = orange
 * - 5-6 = yellow
 * - 7-10 = green
 * - Repeated "No" on practice/connection for several days = yellow/orange
 * - Worsening distress / inability to cope → escalate to human support
 */

import type {
  SpiritualDailyCheckIn,
  SpiritualTrendData,
  SpiritualTrendDirection,
  SpiritualBand,
  SpiritualAlert,
} from "@aura/types";

// ─── Calm Band Classification ───────────────────────────────────

/**
 * Classify a single day's calm score into a band.
 */
export function classifyCalmBand(calmScore: number): SpiritualBand {
  if (calmScore >= 7) return "green";
  if (calmScore >= 5) return "yellow";
  if (calmScore >= 3) return "orange";
  return "red";
}

// ─── Trend Detection ────────────────────────────────────────────

/**
 * Determine trend direction from a series of values.
 * Uses simple linear regression slope.
 */
function detectTrend(values: number[]): SpiritualTrendDirection {
  if (values.length < 3) return "stable";

  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, v, i) => sum + v * i, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return "stable";

  const slope = (n * sumXY - sumX * sumY) / denom;

  const threshold = 0.15;
  if (slope > threshold) return "improving";
  if (slope < -threshold) return "declining";
  return "stable";
}

// ─── Check-In Analysis ──────────────────────────────────────────

/**
 * Analyze check-in trends over a window of days.
 */
export function analyzeSpiritualCheckIns(
  checkIns: SpiritualDailyCheckIn[],
  days: number = 7
): SpiritualTrendData {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const windowed = checkIns.filter((c) => c.date >= cutoffIso.split("T")[0]);

  // Build daily arrays (fill up to 7 days)
  const calmTrend = buildDailyValues(windowed, (c) => c.calmScore, days);
  const practiceDaysTrend = buildDailyBooleans(windowed, (c) => c.didPractice, days);
  const connectionTrend = buildDailyValues(
    windowed,
    (c) => mapConnectionToNumber(c.feltConnected),
    days
  );

  // Count recent sessions and journals (these come from external data)
  const practiceSessionsCount = windowed.filter((c) => c.didPractice).length;

  const overallDirection = detectTrend(calmTrend);

  return {
    calmTrend,
    practiceDaysTrend,
    connectionTrend,
    practiceSessionsCount,
    journalEntriesCount: 0, // Filled by caller with actual journal data
    overallDirection,
  };
}

// ─── Alert Detection ────────────────────────────────────────────

/**
 * Detect alerts from a single check-in in context of recent history.
 */
export function detectDailyAlerts(
  checkIn: SpiritualDailyCheckIn,
  recentHistory: SpiritualDailyCheckIn[]
): SpiritualAlert[] {
  const alerts: SpiritualAlert[] = [];
  const now = new Date().toISOString();

  // Red: very low calm
  if (checkIn.calmScore <= 2) {
    alerts.push({
      alertId: generateAlertId(),
      level: "warning",
      reason: `Calm score of ${checkIn.calmScore}/10 indicates significant distress.`,
      createdAt: now,
    });
  }

  // Check for sustained low calm (3+ days at 0-2)
  const recent7 = recentHistory.slice(-7);
  const lowCalmDays = recent7.filter((c) => c.calmScore <= 2).length;
  if (lowCalmDays >= 3) {
    alerts.push({
      alertId: generateAlertId(),
      level: "critical",
      reason: `Low calm persists for ${lowCalmDays} of the last 7 days. Professional support recommended.`,
      createdAt: now,
    });
  }

  // Sustained no-practice + no-connection
  const noPractice = recent7.filter((c) => !c.didPractice).length;
  const noConnection = recent7.filter((c) => c.feltConnected === "no").length;
  if (noPractice >= 5 && noConnection >= 5) {
    alerts.push({
      alertId: generateAlertId(),
      level: "warning",
      reason: "Sustained lack of practice and connection. Consider simpler routine and support.",
      createdAt: now,
    });
  }

  // Worsening trend
  const calmValues = recent7.map((c) => c.calmScore);
  if (calmValues.length >= 5 && detectTrend(calmValues) === "declining") {
    const avgRecent = calmValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (avgRecent <= 4) {
      alerts.push({
        alertId: generateAlertId(),
        level: "warning",
        reason: "Declining calm trend over recent days. Plan adjustment recommended.",
        createdAt: now,
      });
    }
  }

  return alerts;
}

// ─── Rolling Average ────────────────────────────────────────────

/**
 * Compute rolling average of calm scores over the last N days.
 */
export function rollingCalmAverage(
  checkIns: SpiritualDailyCheckIn[],
  days: number = 7
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const recent = checkIns.filter((c) => c.date >= cutoffDate);
  if (recent.length === 0) return 0;

  return Math.round(
    (recent.reduce((sum, c) => sum + c.calmScore, 0) / recent.length) * 10
  ) / 10;
}

/**
 * Count unique check-in days in the last N days.
 */
export function countCheckInDays(
  checkIns: SpiritualDailyCheckIn[],
  days: number = 7
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const uniqueDays = new Set(
    checkIns
      .filter((c) => c.date >= cutoffDate)
      .map((c) => c.date.split("T")[0])
  );

  return uniqueDays.size;
}

// ─── Helpers ────────────────────────────────────────────────────

function mapConnectionToNumber(value: "yes" | "a_little" | "no"): number {
  if (value === "yes") return 10;
  if (value === "a_little") return 5;
  return 0;
}

function buildDailyValues(
  checkIns: SpiritualDailyCheckIn[],
  extractor: (c: SpiritualDailyCheckIn) => number,
  days: number
): number[] {
  const dayMap = new Map<string, number[]>();

  for (const c of checkIns) {
    const day = c.date.split("T")[0];
    const vals = dayMap.get(day) ?? [];
    vals.push(extractor(c));
    dayMap.set(day, vals);
  }

  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const vals = dayMap.get(key);
    result.push(
      vals && vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : 0
    );
  }

  return result;
}

function buildDailyBooleans(
  checkIns: SpiritualDailyCheckIn[],
  extractor: (c: SpiritualDailyCheckIn) => boolean,
  days: number
): boolean[] {
  const dayMap = new Map<string, boolean>();

  for (const c of checkIns) {
    const day = c.date.split("T")[0];
    if (extractor(c)) dayMap.set(day, true);
    else if (!dayMap.has(day)) dayMap.set(day, false);
  }

  const result: boolean[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push(dayMap.get(key) ?? false);
  }

  return result;
}

function generateAlertId(): string {
  return (
    "sa_" +
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}

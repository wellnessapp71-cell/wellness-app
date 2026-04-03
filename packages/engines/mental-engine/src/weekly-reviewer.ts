/**
 * Weekly review engine.
 *
 * Computes 7-day trend data, before/after baseline comparison,
 * and generates updated plan for the next week.
 */

import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  CopingSession,
  MentalJournalEntry,
  ContentProgressEntry,
  WeeklyReviewData,
  WeeklyTrendData,
  MentalWellnessPlan,
} from "@aura/types";

import { analyzeCheckInTrends, countCheckInDays } from "./checkin-analyzer";
import { generateMentalPlan } from "./plan-generator";

// ─── Weekly Review Generation ───────────────────────────────────

/**
 * Generate a complete weekly review with trend data and updated plan.
 */
export function generateWeeklyReview(params: {
  userId: string;
  baseline: MentalBaseline;
  checkIns: MentalDailyCheckIn[];
  scans: RppgScanResult[];
  copingSessions: CopingSession[];
  journalEntries: MentalJournalEntry[];
  contentProgress: ContentProgressEntry[];
  userNotes?: string;
}): WeeklyReviewData {
  const {
    userId,
    baseline,
    checkIns,
    scans,
    copingSessions,
    journalEntries,
    contentProgress,
    userNotes,
  } = params;

  // Compute trend data
  const trend = computeWeeklyTrend(checkIns, scans, copingSessions, journalEntries);

  // Generate updated plan for next week
  const newPlan = generateMentalPlan({
    baseline,
    recentCheckIns: checkIns.slice(-7),
    recentScans: scans.slice(-5),
    copingSessions,
    journalEntries,
    contentProgress,
  });
  newPlan.userId = userId;

  return {
    reviewId: generateId(),
    userId,
    trend,
    newPlanVersion: newPlan,
    notes: userNotes,
    reviewDateIso: new Date().toISOString(),
  };
}

// ─── Trend Computation ──────────────────────────────────────────

function computeWeeklyTrend(
  checkIns: MentalDailyCheckIn[],
  scans: RppgScanResult[],
  copingSessions: CopingSession[],
  journalEntries: MentalJournalEntry[]
): WeeklyTrendData {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString();

  const recentCheckIns = checkIns.filter((c) => c.dateIso >= cutoff);
  const recentScans = scans.filter((s) => s.scannedAtIso >= cutoff);
  const recentCoping = copingSessions.filter(
    (s) => s.completed && s.completedAtIso >= cutoff
  );
  const recentJournal = journalEntries.filter((j) => j.createdAtIso >= cutoff);

  // Build daily value arrays (pad with 0 for missing days)
  const moodTrend = buildDailyValues(recentCheckIns, (c) => c.moodScore);
  const stressTrend = buildDailyValues(recentCheckIns, (c) => c.stressScoreManual);
  const sleepTrend = buildDailyValues(recentCheckIns, (c) => c.sleepHours);
  const anxietyTrend = buildDailyValues(recentCheckIns, (c) => c.anxietyScore);
  const energyTrend = buildDailyValues(recentCheckIns, (c) => c.energyScore);
  const focusTrend = buildDailyValues(recentCheckIns, (c) => c.focusScore);

  // Count escalation events (stress >= 8 in check-ins or critical in scans)
  const escalations =
    recentCheckIns.filter((c) => c.stressScoreManual >= 8).length +
    recentScans.filter((s) => s.stressIndex >= 80).length;

  return {
    moodTrend,
    stressTrend,
    sleepTrend,
    anxietyTrend,
    energyTrend,
    focusTrend,
    scanFrequency: recentScans.length,
    copingSessionsCount: recentCoping.length,
    journalEntriesCount: recentJournal.length,
    escalationEvents: escalations,
  };
}

// ─── Comparison ─────────────────────────────────────────────────

/**
 * Compare current week's averages against baseline.
 * Returns percentage improvement for each field.
 */
export function compareToBaseline(
  baseline: MentalBaseline,
  checkIns: MentalDailyCheckIn[]
): {
  moodChange: number;          // positive = improved
  stressChange: number;        // positive = improved (lower stress)
  overallImproved: boolean;
  summary: string;
} {
  const recent = checkIns.slice(-7);
  if (recent.length === 0) {
    return {
      moodChange: 0,
      stressChange: 0,
      overallImproved: false,
      summary: "Not enough data for comparison yet. Keep checking in!",
    };
  }

  const avgMood = recent.reduce((s, c) => s + c.moodScore, 0) / recent.length;
  const avgStress = recent.reduce((s, c) => s + c.stressScoreManual, 0) / recent.length;

  // Mood: higher is better, so positive change = improvement
  const moodChange = Math.round((avgMood - baseline.moodBase) * 10) / 10;
  // Stress: lower is better, so negative change = improvement → invert for display
  const stressChange = Math.round((baseline.stressBase - avgStress) * 10) / 10;

  const overallImproved = moodChange > 0 || stressChange > 0;

  let summary: string;
  if (moodChange > 0 && stressChange > 0) {
    summary = `Great progress! Your mood improved by ${moodChange.toFixed(1)} points and stress decreased by ${stressChange.toFixed(1)} points compared to baseline.`;
  } else if (moodChange > 0) {
    summary = `Your mood improved by ${moodChange.toFixed(1)} points. Stress management is an area to focus on next week.`;
  } else if (stressChange > 0) {
    summary = `Your stress decreased by ${stressChange.toFixed(1)} points. Let's work on boosting your mood next week.`;
  } else {
    summary = "Your scores are holding steady. Consistency is key — keep up your daily practices.";
  }

  return { moodChange, stressChange, overallImproved, summary };
}

/**
 * Generate an insight message based on weekly data.
 */
export function generateWeeklyInsight(trend: WeeklyTrendData): string {
  const insights: string[] = [];

  // Sleep correlation
  const avgSleep = trend.sleepTrend.length > 0
    ? trend.sleepTrend.reduce((a, b) => a + b, 0) / trend.sleepTrend.length
    : 0;
  const avgStress = trend.stressTrend.length > 0
    ? trend.stressTrend.reduce((a, b) => a + b, 0) / trend.stressTrend.length
    : 0;

  if (avgSleep >= 7 && avgStress <= 5) {
    insights.push("Your stress improved on days you slept at least 7 hours.");
  }

  if (trend.copingSessionsCount >= 3 && avgStress <= 5) {
    insights.push("Regular calming exercises are correlated with your lower stress levels.");
  }

  if (trend.journalEntriesCount >= 3) {
    insights.push("Consistent journaling is helping you process emotions effectively.");
  }

  if (trend.scanFrequency >= 2) {
    insights.push("Regular stress scans help you stay aware of your stress patterns.");
  }

  if (trend.escalationEvents > 0) {
    insights.push(`${trend.escalationEvents} high-stress event(s) detected. Consider scheduling a counselor session.`);
  }

  return insights.length > 0
    ? insights[0]
    : "Keep checking in daily to build meaningful insights about your patterns.";
}

// ─── Helpers ────────────────────────────────────────────────────

function buildDailyValues(
  checkIns: MentalDailyCheckIn[],
  extractor: (c: MentalDailyCheckIn) => number
): number[] {
  const dayMap = new Map<string, number[]>();

  for (const c of checkIns) {
    const day = c.dateIso.split("T")[0];
    const vals = dayMap.get(day) ?? [];
    vals.push(extractor(c));
    dayMap.set(day, vals);
  }

  // Generate 7 days of values
  const result: number[] = [];
  for (let i = 6; i >= 0; i--) {
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

function generateId(): string {
  return (
    "wr_" +
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}

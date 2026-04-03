/**
 * Weekly review engine for spiritual wellness.
 *
 * Weekly judgement criteria from PRD Section 5:
 * - Low calm + low mindfulness + low practice adherence = orange
 * - Weak connection + weak purpose + weak practice = orange/red
 * - Improvement in one area but not others = keep plan, change dominant practice type
 */

import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualPracticeSession,
  SpiritualJournalEntry,
  SpiritualWeeklyReview,
  SpiritualWellnessPlan,
  SpiritualPracticeType,
  SpiritualBlockerTag,
} from "@aura/types";

import { analyzeSpiritualCheckIns, countCheckInDays } from "./checkin-analyzer";
import { generateSpiritualPlan } from "./plan-generator";

// ─── Weekly Review Generation ───────────────────────────────────

/**
 * Generate a complete weekly review from check-ins, sessions, journal.
 */
export function generateSpiritualWeeklyReview(
  checkIns: SpiritualDailyCheckIn[],
  sessions: SpiritualPracticeSession[],
  journalEntries: SpiritualJournalEntry[],
  baseline: SpiritualBaseline,
  userInput: {
    calmFrequency: number;       // 0-4
    presenceFrequency: number;   // 0-4
    practiceRecovery: number;    // 0-4
    gratitudeFrequency: number;  // 0-4
    connectionFrequency: number; // 0-4
    whatHelpedMost: SpiritualPracticeType | null;
    whatHurtMost: SpiritualBlockerTag | null;
    planIntensity: "increase" | "keep" | "reduce";
  }
): SpiritualWeeklyReview {
  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStartDate = new Date(now);
  weekStartDate.setDate(weekStartDate.getDate() - 7);
  const weekStart = weekStartDate.toISOString().split("T")[0];

  // Compute calm score change
  const cutoff = weekStartDate.toISOString();
  const thisWeekCheckIns = checkIns.filter(
    (c) => c.date >= cutoff.split("T")[0]
  );
  const lastWeekStart = new Date(weekStartDate);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekCheckIns = checkIns.filter(
    (c) =>
      c.date >= lastWeekStart.toISOString().split("T")[0] &&
      c.date < cutoff.split("T")[0]
  );

  const thisWeekAvg =
    thisWeekCheckIns.length > 0
      ? thisWeekCheckIns.reduce((s, c) => s + c.calmScore, 0) / thisWeekCheckIns.length
      : 0;
  const lastWeekAvg =
    lastWeekCheckIns.length > 0
      ? lastWeekCheckIns.reduce((s, c) => s + c.calmScore, 0) / lastWeekCheckIns.length
      : thisWeekAvg;

  const calmScoreChange = Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10;

  // Build engagement summary
  const checkInDays = countCheckInDays(checkIns, 7);
  const practiceCount = sessions.filter(
    (s) => s.completedAt >= cutoff
  ).length;
  const journalCount = journalEntries.filter(
    (j) => j.createdAt >= cutoff
  ).length;

  const engagementSummary = `Checked in ${checkInDays}/7 days, ${practiceCount} practice session(s), ${journalCount} journal entry/entries this week.`;

  return {
    id: generateId(),
    weekStart,
    weekEnd,
    calmFrequency: userInput.calmFrequency,
    presenceFrequency: userInput.presenceFrequency,
    practiceRecovery: userInput.practiceRecovery,
    gratitudeFrequency: userInput.gratitudeFrequency,
    connectionFrequency: userInput.connectionFrequency,
    whatHelpedMost: userInput.whatHelpedMost,
    whatHurtMost: userInput.whatHurtMost,
    planIntensity: userInput.planIntensity,
    calmScoreChange,
    engagementSummary,
    createdAt: new Date().toISOString(),
  };
}

// ─── Plan Change Decision ───────────────────────────────────────

/**
 * Determine whether the plan should be changed based on the weekly review.
 */
export function shouldChangePlan(
  review: SpiritualWeeklyReview,
  currentPlan: SpiritualWellnessPlan
): boolean {
  // User requested intensity change
  if (review.planIntensity !== "keep") return true;

  // Significant calm score decline
  if (review.calmScoreChange < -1) return true;

  // Very low review scores
  const avgReview =
    (review.calmFrequency +
      review.presenceFrequency +
      review.practiceRecovery +
      review.gratitudeFrequency +
      review.connectionFrequency) / 5;

  if (avgReview < 1.5) return true; // Average is less than "rarely"

  return false;
}

/**
 * Generate an insight message based on review data.
 */
export function generateWeeklyInsight(
  review: SpiritualWeeklyReview,
  baseline: SpiritualBaseline
): string {
  const insights: string[] = [];

  // Calm score change
  if (review.calmScoreChange > 0.5) {
    insights.push("Your calm improved this week — keep doing what works!");
  } else if (review.calmScoreChange < -0.5) {
    insights.push("Your calm decreased this week. Let's adjust your routine.");
  }

  // Practice helped
  if (review.whatHelpedMost) {
    const labels: Record<string, string> = {
      meditation: "meditation",
      breathwork: "breathwork",
      prayer: "prayer",
      gratitude: "gratitude practice",
      journaling: "journaling",
      nature: "nature time",
      soundscape: "soundscapes",
      silent_sitting: "silent sitting",
      kindness_act: "acts of kindness",
    };
    const label = labels[review.whatHelpedMost] ?? review.whatHelpedMost;
    insights.push(`${label.charAt(0).toUpperCase() + label.slice(1)} was your most helpful practice.`);
  }

  // Low gratitude or connection
  if (review.gratitudeFrequency <= 1) {
    insights.push("Try adding a gratitude moment to your daily routine.");
  }
  if (review.connectionFrequency <= 1) {
    insights.push("Connecting with others can boost your sense of calm.");
  }

  return insights.length > 0
    ? insights[0]
    : "Keep up your daily practices — consistency builds inner calm.";
}

// ─── Helpers ────────────────────────────────────────────────────

function generateId(): string {
  return (
    "swr_" +
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}

/**
 * Composite spiritual wellness score calculator.
 *
 * The spiritual wellness score blends four independent signals:
 * | Signal       | Weight | Input                                         |
 * |-------------|--------|-----------------------------------------------|
 * | Baseline    | 35%    | Most recent baseline totalScore                |
 * | Daily       | 25%    | Average calmScore from last 7 check-ins        |
 * | Engagement  | 20%    | Journal + live sessions + community activity    |
 * | Practice    | 20%    | Practice minutes + streak + nature time         |
 *
 * Each component is normalized to 0-100 before weighting.
 */

import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualPracticeSession,
  SpiritualJournalEntry,
  SpiritualScoreRun,
} from "@aura/types";
import { SPIRITUAL_SCORE_WEIGHTS } from "@aura/types";
import { classifyBand } from "./baseline";

// ─── Component Scorers ──────────────────────────────────────────

/**
 * Baseline component (0-100).
 * Uses the most recent baseline totalScore directly.
 */
export function scoreBaselineComponent(baseline: SpiritualBaseline): number {
  return Math.max(0, Math.min(100, baseline.totalScore));
}

/**
 * Daily check-in component (0-100).
 * Maps the average calmScore (0-10) from last 7 check-ins to 0-100.
 */
export function scoreDailyComponent(checkIns: SpiritualDailyCheckIn[]): number {
  if (checkIns.length === 0) return 50; // neutral default

  const recent = checkIns.slice(-7);
  const avgCalm = recent.reduce((sum, c) => sum + c.calmScore, 0) / recent.length;

  // Map 0-10 → 0-100
  return Math.round((avgCalm / 10) * 100);
}

/**
 * Engagement component (0-100).
 * Factors: journal entries, check-in consistency, community participation.
 *
 * - Journal entries this week: up to 40 points (3+ entries = 40)
 * - Check-in streak (last 7 days): up to 35 points
 * - General participation bonus: up to 25 points
 */
export function scoreEngagementComponent(params: {
  journalEntries: SpiritualJournalEntry[];
  checkInCount: number;
  liveSessionsAttended?: number;
}): number {
  const { journalEntries, checkInCount, liveSessionsAttended = 0 } = params;

  // Journal entries in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString();

  const recentJournals = journalEntries.filter((j) => j.createdAt >= cutoff);
  const journalScore = Math.min(40, Math.round((recentJournals.length / 3) * 40));

  // Check-in consistency
  const checkInScore = Math.round((Math.min(7, checkInCount) / 7) * 35);

  // Live sessions / community bonus
  const sessionScore = Math.min(25, liveSessionsAttended * 25);

  return Math.min(100, journalScore + checkInScore + sessionScore);
}

/**
 * Practice component (0-100).
 * Factors: practice minutes, streak, nature exposure.
 *
 * - Practice minutes this week: up to 40 points (70+ min = 40)
 * - Streak days: up to 35 points (7+ days = 35)
 * - Nature exposure minutes: up to 25 points (30+ min = 25)
 */
export function scorePracticeComponent(params: {
  sessions: SpiritualPracticeSession[];
  streakDays: number;
  natureMinutes?: number;
}): number {
  const { sessions, streakDays, natureMinutes = 0 } = params;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString();

  // Total practice minutes this week
  const recentSessions = sessions.filter((s) => s.completedAt >= cutoff);
  const totalMinutes = recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const minuteScore = Math.min(40, Math.round((totalMinutes / 70) * 40));

  // Streak
  const streakScore = Math.min(35, Math.round((streakDays / 7) * 35));

  // Nature exposure
  const natureScore = Math.min(25, Math.round((natureMinutes / 30) * 25));

  return Math.min(100, minuteScore + streakScore + natureScore);
}

// ─── Composite Score ────────────────────────────────────────────

/**
 * Compute the full composite spiritual wellness score.
 */
export function computeSpiritualWellnessScore(params: {
  baseline: SpiritualBaseline;
  checkIns: SpiritualDailyCheckIn[];
  sessions: SpiritualPracticeSession[];
  journalEntries: SpiritualJournalEntry[];
  checkInDaysCount?: number;
  streakDays?: number;
  natureMinutes?: number;
  liveSessionsAttended?: number;
}): SpiritualScoreRun {
  const {
    baseline,
    checkIns,
    sessions,
    journalEntries,
    checkInDaysCount,
    streakDays = 0,
    natureMinutes = 0,
    liveSessionsAttended = 0,
  } = params;

  const baselineComp = scoreBaselineComponent(baseline);
  const dailyComp = scoreDailyComponent(checkIns);
  const engagementComp = scoreEngagementComponent({
    journalEntries,
    checkInCount: checkInDaysCount ?? checkIns.length,
    liveSessionsAttended,
  });
  const practiceComp = scorePracticeComponent({
    sessions,
    streakDays,
    natureMinutes,
  });

  const totalScore = Math.round(
    baselineComp * SPIRITUAL_SCORE_WEIGHTS.baseline +
    dailyComp * SPIRITUAL_SCORE_WEIGHTS.daily +
    engagementComp * SPIRITUAL_SCORE_WEIGHTS.engagement +
    practiceComp * SPIRITUAL_SCORE_WEIGHTS.practice
  );

  const clamped = Math.max(0, Math.min(100, totalScore));
  const band = classifyBand(clamped);

  // Confidence: based on data availability
  const hasCheckIns = checkIns.length > 0;
  const hasSessions = sessions.length > 0;
  const hasJournal = journalEntries.length > 0;
  const dataSignals = [true, hasCheckIns, hasSessions, hasJournal].filter(Boolean).length;
  const confidence = Math.round((dataSignals / 4) * 100) / 100;

  return {
    meaningScore: baseline.meaningScore,
    peaceScore: baseline.peaceScore,
    mindfulnessScore: baseline.mindfulnessScore,
    connectionScore: baseline.connectionScore,
    practiceScore: baseline.practiceScore,
    totalScore: clamped,
    band,
    confidence,
    createdAt: new Date().toISOString(),
  };
}

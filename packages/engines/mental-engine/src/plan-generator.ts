/**
 * Mental wellness plan generator (rules engine).
 *
 * Takes baseline assessment + recent check-in data + scan results
 * and produces a personalized MentalWellnessPlan.
 */

import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  CopingSession,
  MentalJournalEntry,
  ContentProgressEntry,
  MentalWellnessPlan,
  InterventionType,
  AlertLevel,
  PlanGeneratorInput,
} from "@aura/types";

import { classifyStressLevel } from "./rppg-processor";
import { analyzeCheckInTrends, countCheckInDays } from "./checkin-analyzer";
import { hasPhq9SelfHarmRisk } from "./baseline";

// ─── Plan Generation ────────────────────────────────────────────

/**
 * Generate a personalized mental wellness plan from all available signals.
 */
export function generateMentalPlan(input: PlanGeneratorInput): MentalWellnessPlan {
  const {
    baseline,
    recentCheckIns,
    recentScans,
    copingSessions,
    journalEntries,
    contentProgress,
  } = input;

  const interventions = recommendInterventions(baseline, recentCheckIns, recentScans);
  const focusAreas = identifyFocusAreas(baseline, recentCheckIns);
  const weeklyGoals = generateWeeklyGoals(baseline, recentCheckIns, copingSessions, journalEntries);
  const suggestedModules = suggestLearningModules(baseline, contentProgress);
  const escalationRisk = assessEscalationRisk(baseline, recentCheckIns, recentScans);
  const checkinFrequency = determineCheckinFrequency(escalationRisk, baseline);

  return {
    userId: recentCheckIns[0]?.userId ?? baseline.phq9Answers.length > 0 ? "unknown" : "unknown",
    createdAtIso: new Date().toISOString(),
    checkinFrequency,
    recommendedInterventions: interventions,
    focusAreas,
    weeklyGoals,
    suggestedModules,
    escalationRisk,
  };
}

/**
 * Generate initial plan from baseline only (for onboarding).
 */
export function generateInitialPlan(
  userId: string,
  baseline: MentalBaseline
): MentalWellnessPlan {
  return generateMentalPlan({
    baseline,
    recentCheckIns: [],
    recentScans: [],
    copingSessions: [],
    journalEntries: [],
    contentProgress: [],
  });
}

// ─── Intervention Selection ─────────────────────────────────────

function recommendInterventions(
  baseline: MentalBaseline,
  checkIns: MentalDailyCheckIn[],
  scans: RppgScanResult[]
): InterventionType[] {
  const interventions = new Set<InterventionType>();

  // Always include user's calming preferences
  for (const pref of baseline.calmingPreferences) {
    interventions.add(pref);
  }

  // High stress → breathing + grounding
  if (baseline.stressBase >= 7) {
    interventions.add("breathing");
    interventions.add("grounding");
  }

  // High anxiety (GAD-7 moderate+) → body scan
  if (baseline.gad7Score >= 10) {
    interventions.add("body_scan");
    interventions.add("breathing");
  }

  // Depression indicators (PHQ-9 moderate+) → journal prompt + calm audio
  if (baseline.phq9Score >= 10) {
    interventions.add("journal_prompt");
    interventions.add("calm_audio");
  }

  // Recent scan shows high stress
  const latestScan = scans[scans.length - 1];
  if (latestScan) {
    const level = classifyStressLevel(latestScan.stressIndex);
    if (level === "high" || level === "critical") {
      interventions.add("breathing");
      interventions.add("grounding");
    }
  }

  // Recent check-ins show poor sleep → calm audio before bed
  const recentSleep = checkIns.slice(-7).map((c) => c.sleepHours);
  const avgSleep = recentSleep.length > 0
    ? recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length
    : 7;
  if (avgSleep < 6) {
    interventions.add("calm_audio");
  }

  // If nothing selected, default set
  if (interventions.size === 0) {
    interventions.add("breathing");
    interventions.add("journal_prompt");
  }

  return Array.from(interventions);
}

// ─── Focus Areas ────────────────────────────────────────────────

function identifyFocusAreas(
  baseline: MentalBaseline,
  checkIns: MentalDailyCheckIn[]
): string[] {
  const areas: string[] = [];

  if (baseline.phq9Score >= 10) areas.push("Depression management");
  if (baseline.gad7Score >= 10) areas.push("Anxiety reduction");
  if (baseline.stressBase >= 7) areas.push("Stress management");
  if (baseline.moodBase <= 4) areas.push("Mood improvement");

  // Analyze recent check-in averages
  if (checkIns.length >= 3) {
    const recent = checkIns.slice(-7);
    const avgEnergy = recent.reduce((s, c) => s + c.energyScore, 0) / recent.length;
    const avgFocus = recent.reduce((s, c) => s + c.focusScore, 0) / recent.length;
    const avgSleep = recent.reduce((s, c) => s + c.sleepHours, 0) / recent.length;

    if (avgEnergy < 4) areas.push("Energy boosting");
    if (avgFocus < 4) areas.push("Focus improvement");
    if (avgSleep < 6) areas.push("Sleep hygiene");
  }

  // Common triggers → specific focus areas
  if (baseline.commonTriggers.includes("work")) areas.push("Work-life balance");
  if (baseline.commonTriggers.includes("relationships")) areas.push("Relationship wellness");
  if (baseline.commonTriggers.includes("loneliness")) areas.push("Social connection");
  if (baseline.commonTriggers.includes("grief")) areas.push("Grief processing");

  // Deduplicate and limit
  return [...new Set(areas)].slice(0, 5);
}

// ─── Weekly Goals ───────────────────────────────────────────────

function generateWeeklyGoals(
  baseline: MentalBaseline,
  checkIns: MentalDailyCheckIn[],
  copingSessions: CopingSession[],
  journalEntries: MentalJournalEntry[]
): string[] {
  const goals: string[] = [];

  // Check-in consistency
  const checkInDays = countCheckInDays(checkIns, 7);
  if (checkInDays < 5) {
    goals.push("Complete daily check-ins at least 5 out of 7 days");
  } else {
    goals.push("Maintain daily check-in streak");
  }

  // Coping practices
  const recentCoping = copingSessions.filter(
    (s) => s.completed && isWithinDays(s.completedAtIso, 7)
  );
  if (recentCoping.length < 3) {
    goals.push("Complete at least 3 calming exercises this week");
  } else {
    goals.push("Try a new calming technique you haven't used before");
  }

  // Journaling
  const recentJournals = journalEntries.filter(
    (j) => isWithinDays(j.createdAtIso, 7)
  );
  if (recentJournals.length < 2) {
    goals.push("Write at least 2 journal entries this week");
  }

  // Stress-specific
  if (baseline.stressBase >= 7) {
    goals.push("Practice a breathing exercise when stress rises above 7");
  }

  // Sleep-specific
  if (baseline.moodBase <= 5) {
    goals.push("Track sleep hours and aim for 7-9 hours per night");
  }

  return goals.slice(0, 5);
}

// ─── Learning Module Suggestions ────────────────────────────────

function suggestLearningModules(
  baseline: MentalBaseline,
  contentProgress: ContentProgressEntry[]
): string[] {
  const completed = new Set(
    contentProgress.filter((c) => c.progressPercent >= 100).map((c) => c.moduleId)
  );
  const suggestions: string[] = [];

  // Map baseline severity to relevant categories
  if (baseline.stressBase >= 6 && !completed.has("stress_basics")) {
    suggestions.push("stress_basics");
  }
  if (baseline.phq9Score >= 10 && !completed.has("emotional_regulation_101")) {
    suggestions.push("emotional_regulation_101");
  }
  if (baseline.gad7Score >= 10 && !completed.has("anxiety_management")) {
    suggestions.push("anxiety_management");
  }
  if (baseline.commonTriggers.includes("sleep") && !completed.has("sleep_hygiene")) {
    suggestions.push("sleep_hygiene");
  }
  if (baseline.commonTriggers.includes("grief") && !completed.has("grief_processing")) {
    suggestions.push("grief_processing");
  }

  // Always suggest resilience building
  if (!completed.has("building_resilience")) {
    suggestions.push("building_resilience");
  }

  return suggestions.slice(0, 4);
}

// ─── Escalation Risk ───────────────────────────────────────────

function assessEscalationRisk(
  baseline: MentalBaseline,
  checkIns: MentalDailyCheckIn[],
  scans: RppgScanResult[]
): AlertLevel {
  // Critical: self-harm ideation
  if (hasPhq9SelfHarmRisk(baseline.phq9Answers)) return "critical";

  // Critical: severe depression + severe anxiety
  if (baseline.phq9Score >= 20 && baseline.gad7Score >= 15) return "critical";

  // Warning: sustained high stress in check-ins (3+ days above 8)
  const recent = checkIns.slice(-7);
  const highStressDays = recent.filter((c) => c.stressScoreManual >= 8).length;
  if (highStressDays >= 3) return "warning";

  // Warning: rPPG shows critical stress
  const latestScan = scans[scans.length - 1];
  if (latestScan && classifyStressLevel(latestScan.stressIndex) === "critical") {
    return "warning";
  }

  // Warning: moderate-severe depression or moderate anxiety
  if (baseline.phq9Score >= 15 || baseline.gad7Score >= 10) return "warning";

  return "info";
}

// ─── Check-in Frequency ─────────────────────────────────────────

function determineCheckinFrequency(
  risk: AlertLevel,
  baseline: MentalBaseline
): "daily" | "twice_daily" {
  if (risk === "critical") return "twice_daily";
  if (risk === "warning" && baseline.stressBase >= 8) return "twice_daily";
  return "daily";
}

// ─── Helpers ────────────────────────────────────────────────────

function isWithinDays(isoDate: string, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(isoDate) >= cutoff;
}

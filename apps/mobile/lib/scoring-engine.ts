/**
 * Unified scoring engine — recalculates each pillar score from ALL available user data.
 *
 * Every check-in field, session, journal entry, weight log, plan adherence, and
 * practice completion feeds into the score so that no user input is wasted.
 */

import { getOnboardingState, getSessionLogs, getWeightHistory, calculatePlanAdherence } from "./onboarding-store";
import { getMentalCheckInHistory, getLatestRppgScan, getCopingSessions, getJournalEntries, getSupportRequests, getMentalBaseline } from "./mental-store";
import { getSpiritualCheckInHistory, getPracticeSessions, getSpiritualJournals } from "./spiritual-store";
import { getLifestyleCheckIns } from "./lifestyle-store";
import { getActiveWorkoutPlan } from "./plan-store";
import { getProfile, updateScores } from "./user-store";
import { scoreMental } from "./pillar-scoring";

// ────────────────────────────────────────────────────────────────────────────
// Physical Score
// ────────────────────────────────────────────────────────────────────────────

/**
 * Physical score components (0-100 each):
 *   Fitness baseline (from questionnaire)       → 20%
 *   Daily check-in quality (mood, energy, etc.) → 20%
 *   Workout plan adherence                      → 25%
 *   Session performance (completion %)          → 20%
 *   Body trend (weight toward target)           → 15%
 */
export async function recalcPhysicalScore(): Promise<number> {
  const [state, profile, activePlan, sessionLogs, weightHistory] = await Promise.all([
    getOnboardingState(),
    getProfile(),
    getActiveWorkoutPlan(),
    getSessionLogs(),
    getWeightHistory(),
  ]);

  // 1. Fitness baseline (from questionnaire assessment)
  const fitnessBaseline = profile?.fitnessScore ?? profile?.scorePhysical ?? 50;

  // 2. Daily check-in quality (last 7 days)
  const checkIns = state.checkIns ?? [];
  let checkInScore = 50;
  if (checkIns.length > 0) {
    const recent = checkIns.slice(-7);
    const moodMap: Record<string, number> = { great: 100, good: 80, okay: 60, low: 35, bad: 15 };
    const energyMap: Record<string, number> = { high: 100, moderate: 70, low: 40, exhausted: 15 };

    const avgMood = recent.reduce((s, c) => s + (moodMap[c.mood] ?? 50), 0) / recent.length;
    const avgEnergy = recent.reduce((s, c) => s + (energyMap[c.energy] ?? 50), 0) / recent.length;
    const avgSleep = recent.reduce((s, c) => {
      // 7-9h ideal
      const h = c.sleepHours;
      return s + (h >= 7 && h <= 9 ? 100 : h >= 6 && h <= 10 ? 70 : 40);
    }, 0) / recent.length;
    const avgSleepQuality = recent.reduce((s, c) => s + ((c.sleepQuality - 1) / 4) * 100, 0) / recent.length;
    // Lower fatigue and soreness = better (inverted: 1=best → 100, 5=worst → 0)
    const avgFatigue = recent.reduce((s, c) => s + ((5 - c.fatigueLevel) / 4) * 100, 0) / recent.length;
    const avgSoreness = recent.reduce((s, c) => s + ((5 - c.soreness) / 4) * 100, 0) / recent.length;

    checkInScore = Math.round(
      avgMood * 0.2 + avgEnergy * 0.2 + avgSleep * 0.15 +
      avgSleepQuality * 0.15 + avgFatigue * 0.15 + avgSoreness * 0.15,
    );
  }

  // 3. Plan adherence
  let adherenceScore = 50;
  if (activePlan?.content) {
    const sessions = activePlan.content.sessions ?? activePlan.content.weekSessions ?? activePlan.content.schedule ?? {};
    const plannedDays = Object.keys(sessions);
    if (plannedDays.length > 0) {
      adherenceScore = calculatePlanAdherence(sessionLogs, plannedDays);
    }
  }

  // 4. Session performance (recent 7 sessions average completion %)
  let sessionScore = 50;
  if (sessionLogs.length > 0) {
    const recent = sessionLogs.slice(-7);
    sessionScore = Math.round(recent.reduce((s, l) => s + l.completionPercent, 0) / recent.length);
  }

  // 5. Weight trend toward target
  let weightScore = 50;
  const targetWeight = profile?.targetWeightKg ?? state.user?.targetWeightKg;
  if (targetWeight && weightHistory.length >= 2) {
    const latest = weightHistory[weightHistory.length - 1].weightKg;
    const previous = weightHistory[weightHistory.length - 2].weightKg;
    const distNow = Math.abs(latest - targetWeight);
    const distPrev = Math.abs(previous - targetWeight);
    // Moving toward target = good
    if (distNow < distPrev) weightScore = 80;
    else if (distNow === distPrev) weightScore = 60;
    else weightScore = 35;
    // Bonus: within 2kg of target
    if (distNow <= 2) weightScore = 95;
  } else if (weightHistory.length === 1 && targetWeight) {
    const dist = Math.abs(weightHistory[0].weightKg - targetWeight);
    weightScore = dist <= 2 ? 90 : dist <= 5 ? 70 : dist <= 10 ? 50 : 35;
  }

  const score = Math.round(
    fitnessBaseline * 0.20 +
    checkInScore * 0.20 +
    adherenceScore * 0.25 +
    sessionScore * 0.20 +
    weightScore * 0.15,
  );

  return clamp(score);
}

// ────────────────────────────────────────────────────────────────────────────
// Mental Score — uses existing 4-signal model, wired to all stores
// ────────────────────────────────────────────────────────────────────────────

export async function recalcMentalScore(): Promise<number> {
  const [baseline, checkIns, latestScan, sessions, journals, supportReqs] = await Promise.all([
    getMentalBaseline(),
    getMentalCheckInHistory(7),
    getLatestRppgScan(),
    getCopingSessions(),
    getJournalEntries(),
    getSupportRequests(),
  ]);

  // Use baseline if available, otherwise neutral defaults
  const baselineData = baseline
    ? {
        phq9Score: baseline.phq9Score ?? 9,
        gad7Score: baseline.gad7Score ?? 7,
        stressBase: baseline.stressBase ?? 5,
        moodBase: baseline.moodBase ?? 5,
      }
    : { phq9Score: 9, gad7Score: 7, stressBase: 5, moodBase: 5 };

  // Map check-ins to the format expected by scoreMental
  const recentCheckIns = checkIns.map((c: any) => ({
    moodScore: c.moodScore ?? 5,
    stressScoreManual: c.stressScoreManual ?? 5,
    anxietyScore: c.anxietyScore ?? 5,
    energyScore: c.energyScore ?? 5,
    focusScore: c.focusScore ?? 5,
    sleepHours: c.sleepHours ?? 7,
  }));

  // Count engagement in last 7 days
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter((s: any) => new Date(s.completedAtIso ?? s.createdAt ?? 0).getTime() > weekAgo);
  const recentJournals = journals.filter((j: any) => new Date(j.createdAtIso ?? j.createdAt ?? 0).getTime() > weekAgo);
  const recentSupport = supportReqs.filter((r: any) => new Date(r.createdAtIso ?? r.createdAt ?? 0).getTime() > weekAgo);

  const score = scoreMental(
    baselineData,
    recentCheckIns,
    latestScan ? { stressIndex: latestScan.stressIndex ?? 50 } : null,
    {
      copingSessionsCount: recentSessions.length,
      journalEntriesCount: recentJournals.length,
      supportRequestCount: recentSupport.length,
    },
  );

  return clamp(score);
}

// ────────────────────────────────────────────────────────────────────────────
// Spiritual Score
// ────────────────────────────────────────────────────────────────────────────

/**
 * Spiritual score components (0-100 each):
 *   Calm check-in average (calmScore 0-10)                 → 30%
 *   Practice consistency (sessions this week)               → 25%
 *   Self-report (didPractice, feltConnected, natureHelped)  → 20%
 *   Journal engagement (entries this week)                  → 15%
 *   Feeling quality (positive vs negative tags)             → 10%
 */
export async function recalcSpiritualScore(): Promise<number> {
  const [checkIns, sessions, journals] = await Promise.all([
    getSpiritualCheckInHistory(7),
    getPracticeSessions(),
    getSpiritualJournals(),
  ]);

  // 1. Calm score (0-10 mapped to 0-100)
  let calmScore = 50;
  if (checkIns.length > 0) {
    const avg = checkIns.reduce((s: number, c: any) => s + (c.calmScore ?? 5), 0) / checkIns.length;
    calmScore = Math.round(avg * 10);
  }

  // 2. Practice consistency (sessions in last 7 days, target: 5/week = 100)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter((s: any) => new Date(s.completedAtIso ?? s.createdAt ?? 0).getTime() > weekAgo);
  const practiceScore = Math.min(100, Math.round((recentSessions.length / 5) * 100));

  // 3. Self-report quality from check-ins
  let selfReportScore = 50;
  if (checkIns.length > 0) {
    const connectedMap: Record<string, number> = { yes: 100, a_little: 60, no: 20 };
    const natureMap: Record<string, number> = { yes: 100, a_little: 60, no: 20 };

    const avgPractice = checkIns.reduce((s: number, c: any) => s + (c.didPractice ? 100 : 20), 0) / checkIns.length;
    const avgConnected = checkIns.reduce((s: number, c: any) => s + (connectedMap[c.feltConnected] ?? 50), 0) / checkIns.length;
    const avgNature = checkIns.reduce((s: number, c: any) => s + (natureMap[c.natureOrReflectionHelped] ?? 50), 0) / checkIns.length;

    selfReportScore = Math.round((avgPractice + avgConnected + avgNature) / 3);
  }

  // 4. Journal engagement (entries in last 7 days, target: 3/week = 100)
  const recentJournals = journals.filter((j: any) => new Date(j.createdAtIso ?? j.createdAt ?? 0).getTime() > weekAgo);
  const journalScore = Math.min(100, Math.round((recentJournals.length / 3) * 100));

  // 5. Feeling quality (from check-in feeling tags)
  let feelingScore = 50;
  if (checkIns.length > 0) {
    const positiveSet = new Set(["peaceful", "grateful", "inspired"]);
    const negativeSet = new Set(["distracted", "heavy", "restless"]);
    let positiveCount = 0;
    let negativeCount = 0;
    for (const c of checkIns) {
      for (const f of (c as any).feelings ?? []) {
        if (positiveSet.has(f)) positiveCount++;
        if (negativeSet.has(f)) negativeCount++;
      }
    }
    const total = positiveCount + negativeCount;
    feelingScore = total > 0 ? Math.round((positiveCount / total) * 100) : 50;
  }

  const score = Math.round(
    calmScore * 0.30 +
    practiceScore * 0.25 +
    selfReportScore * 0.20 +
    journalScore * 0.15 +
    feelingScore * 0.10,
  );

  return clamp(score);
}

// ────────────────────────────────────────────────────────────────────────────
// Lifestyle Score — full 7-domain model
// ────────────────────────────────────────────────────────────────────────────

/**
 * Lifestyle score uses ALL 7 domains from check-ins:
 *   Sleep (18%), Nutrition (18%), Hydration (12%), Movement (16%),
 *   Digital Balance (12%), Nature & Light (12%), Routine (12%)
 */
export async function recalcLifestyleScore(): Promise<number> {
  const checkIns = await getLifestyleCheckIns();
  if (checkIns.length === 0) {
    // Fall back to profile's existing score
    const profile = await getProfile();
    return profile?.scoreLifestyle ?? 50;
  }

  // Use last 7 check-ins for scoring
  const recent = checkIns.slice(-7);

  // Average each domain across recent check-ins
  const avg = (fn: (c: any) => number) =>
    Math.round(recent.reduce((s, c) => s + fn(c), 0) / recent.length);

  // 1. Sleep (18%) — sleep hours + quality
  const sleepScore = avg((c) => {
    const h = c.sleepHours ?? 7;
    const q = c.sleepQuality ?? 5;
    const hourScore = h >= 7 && h <= 9 ? 100 : h >= 6 && h <= 10 ? 70 : 40;
    const qualityScore = ((q - 1) / 9) * 100; // 1-10 scale
    return hourScore * 0.6 + qualityScore * 0.4;
  });

  // 2. Nutrition (18%) — meals, fruits/veg, processed food
  const nutritionScore = avg((c) => {
    const mealsScore = Math.min(100, ((c.mealsEaten ?? 3) / 4) * 100);
    const fvScore = Math.min(100, ((c.fruitVegServings ?? 0) / 5) * 100);
    const processedPenalty = Math.max(0, ((c.ultraProcessedServings ?? 0) + (c.sugaryServings ?? 0)) * 10);
    const stressEatPenalty = c.stressEating === "yes" ? 15 : 0;
    const lateEatPenalty = (c.lateEatingCount ?? 0) * 10;
    return Math.max(0, (mealsScore * 0.3 + fvScore * 0.4 + 100 * 0.3) - processedPenalty - stressEatPenalty - lateEatPenalty);
  });

  // 3. Hydration (12%) — water intake + timing
  const hydrationScore = avg((c) => {
    const goalMap: Record<string, number> = { exceeded: 100, yes: 85, mostly: 65, partly: 40, no: 15 };
    const goalScore = goalMap[c.metWaterGoal ?? "no"] ?? 40;
    const beforeNoonBonus = (c.waterBeforeNoon ?? 0) * 10;
    const spanBonus = Math.min(20, ((c.hydrationSpanHours ?? 8) / 14) * 20);
    return Math.min(100, goalScore + beforeNoonBonus + spanBonus);
  });

  // 4. Movement (16%) — active minutes + breaks + strength
  const movementScore = avg((c) => {
    const activeScore = Math.min(100, ((c.activeMinutes ?? 0) / 30) * 100);
    const breakScore = Math.min(100, ((c.movementBreaks ?? 0) / 4) * 100);
    const strengthBonus = c.strengthOrYoga || c.strengthYogaDone === "moderate" ? 20 : 0;
    const sittingPenalty = Math.max(0, ((c.sittingMinutesMax ?? 120) - 90) / 90) * 20;
    return Math.min(100, (activeScore * 0.5 + breakScore * 0.3 + strengthBonus) - sittingPenalty);
  });

  // 5. Digital Balance (12%) — screen time + bedtime screen
  const digitalScore = avg((c) => {
    const screenHrs = c.screenHoursNonWork ?? (c.screenMinutesNonWork ?? 120) / 60;
    const screenScore = screenHrs <= 2 ? 100 : screenHrs <= 4 ? 75 : screenHrs <= 6 ? 50 : 25;
    const bedtimeScore = (c.bedtimeScreenMinutes ?? 30) <= 15 ? 100 : (c.bedtimeScreenMinutes ?? 30) <= 30 ? 70 : 35;
    const focusMap: Record<string, number> = { mostly: 100, partly: 60, no: 20 };
    const focusScore = focusMap[c.usedFocusMode ?? "no"] ?? 40;
    return screenScore * 0.4 + bedtimeScore * 0.3 + focusScore * 0.3;
  });

  // 6. Nature & Light (12%) — outdoor time + morning daylight
  const natureScore = avg((c) => {
    const outdoorScore = Math.min(100, ((c.outdoorMinutes ?? 0) / 30) * 100);
    const daylightScore = Math.min(100, ((c.morningDaylightMinutes ?? 0) / 15) * 100);
    return outdoorScore * 0.6 + daylightScore * 0.4;
  });

  // 7. Routine (12%) — morning + evening routine completion
  const routineScore = avg((c) => {
    const morningMap: Record<string, number> = { fully: 100, mostly: 75, partly: 45, no: 10 };
    const eveningMap: Record<string, number> = { fully: 100, mostly: 75, partly: 45, no: 10 };
    const m = morningMap[c.morningRoutineDone ?? "no"] ?? 30;
    const e = eveningMap[c.eveningRoutineDone ?? "no"] ?? 30;
    const wakeBonus = Math.min(20, ((c.sameWakeTimeDays ?? 0) / 7) * 20);
    return Math.min(100, (m + e) / 2 + wakeBonus);
  });

  const score = Math.round(
    sleepScore * 0.18 +
    nutritionScore * 0.18 +
    hydrationScore * 0.12 +
    movementScore * 0.16 +
    digitalScore * 0.12 +
    natureScore * 0.12 +
    routineScore * 0.12,
  );

  return clamp(score);
}

// ────────────────────────────────────────────────────────────────────────────
// Unified recalculation — call after any check-in or session
// ────────────────────────────────────────────────────────────────────────────

export async function recalcAllScores(): Promise<{
  physical: number;
  mental: number;
  spiritual: number;
  lifestyle: number;
}> {
  const [physical, mental, spiritual, lifestyle] = await Promise.all([
    recalcPhysicalScore(),
    recalcMentalScore(),
    recalcSpiritualScore(),
    recalcLifestyleScore(),
  ]);

  await updateScores({ physical, mental, spiritual, lifestyle });

  return { physical, mental, spiritual, lifestyle };
}

function clamp(score: number): number {
  return Math.min(100, Math.max(0, score));
}

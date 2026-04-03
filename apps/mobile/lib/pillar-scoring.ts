/**
 * Pure functions for computing 4-pillar wellness scores from questionnaire answers.
 * Scores are in the range 0–100.
 */

/** PHQ-9: 9 questions, each 0–3. Lower = better mental health. */
export function scorePhq9(answers: number[]): number {
  const total = answers.reduce((a, b) => a + b, 0);
  const maxScore = 9 * 3; // 27
  // Invert: 27 = worst (0), 0 = best (100)
  return Math.round(((maxScore - total) / maxScore) * 100);
}

/** PSS-4: 4 questions, each 0–4. Lower = less stressed. */
export function scorePss(answers: number[]): number {
  const total = answers.reduce((a, b) => a + b, 0);
  const maxScore = 4 * 4; // 16
  return Math.round(((maxScore - total) / maxScore) * 100);
}

/** Lifestyle: sleep, alcohol frequency (0-4), tobacco (boolean), screen hours */
export function scoreLifestyle(params: {
  sleepHours: number;
  alcoholFrequency: number; // 0=never,1=rarely,2=monthly,3=weekly,4=daily
  tobacco: boolean;
  screenHours: number;
}): number {
  const { sleepHours, alcoholFrequency, tobacco, screenHours } = params;

  // Sleep: ideal 7-9h = 100, <5 or >10 = 50
  const sleepScore =
    sleepHours >= 7 && sleepHours <= 9
      ? 100
      : sleepHours >= 6 && sleepHours <= 10
        ? 75
        : 50;

  // Alcohol: 0=100, 4=20
  const alcoholScore = Math.round(100 - alcoholFrequency * 20);

  // Tobacco: non-smoker = 100, smoker = 30
  const tobaccoScore = tobacco ? 30 : 100;

  // Screen time: <4h = 100, 4-8 = 70, 8+ = 40
  const screenScore = screenHours < 4 ? 100 : screenHours <= 8 ? 70 : 40;

  return Math.round(
    (sleepScore * 0.35 + alcoholScore * 0.25 + tobaccoScore * 0.25 + screenScore * 0.15)
  );
}

/** Spiritual: 3 questions, each 0–4 (0=never, 4=always). Higher = more engaged. */
export function scoreSpiritual(answers: number[]): number {
  const total = answers.reduce((a, b) => a + b, 0);
  const maxScore = answers.length * 4;
  return Math.round((total / maxScore) * 100);
}

/**
 * Mental score — 4-signal weighted composite model.
 *
 * Weights:
 *   baseline (PHQ-9 + GAD-7 + stress + mood)  →  35%
 *   daily check-ins (7-day rolling average)    →  25%
 *   rPPG stress scan (inverted stress index)   →  20%
 *   engagement (sessions, journal, support)    →  20%
 */
export function scoreMental(
  baseline: {
    phq9Score: number;    // 0–27
    gad7Score: number;    // 0–21
    stressBase: number;   // 1–10
    moodBase: number;     // 1–10
  },
  recentCheckIns: {
    moodScore: number;      // 1–10
    stressScoreManual: number; // 1–10
    anxietyScore: number;   // 1–10
    energyScore: number;    // 1–10
    focusScore: number;     // 1–10
    sleepHours: number;
  }[],
  latestRppgScan: { stressIndex: number } | null,
  engagement: {
    copingSessionsCount: number;
    journalEntriesCount: number;
    supportRequestCount: number;
  },
): number {
  // ── Baseline component (35%) ──────────────────────────────────────────────
  const phq9Norm = Math.round(((27 - baseline.phq9Score) / 27) * 100);
  const gad7Norm = Math.round(((21 - baseline.gad7Score) / 21) * 100);
  const stressNorm = Math.round(((10 - baseline.stressBase) / 9) * 100);
  const moodNorm = Math.round(((baseline.moodBase - 1) / 9) * 100);
  const baselineScore = Math.round((phq9Norm + gad7Norm + stressNorm + moodNorm) / 4);

  // ── Daily check-in component (25%) ───────────────────────────────────────
  let dailyScore = 50; // neutral default when no check-ins
  if (recentCheckIns.length > 0) {
    const last7 = recentCheckIns.slice(-7);
    const avg = (field: keyof typeof last7[0]) =>
      last7.reduce((sum, c) => sum + (c[field] as number), 0) / last7.length;
    const moodAvg = Math.round(((avg("moodScore") - 1) / 9) * 100);
    const stressAvg = Math.round(((10 - avg("stressScoreManual")) / 9) * 100);
    const anxietyAvg = Math.round(((10 - avg("anxietyScore")) / 9) * 100);
    const energyAvg = Math.round(((avg("energyScore") - 1) / 9) * 100);
    const focusAvg = Math.round(((avg("focusScore") - 1) / 9) * 100);
    const sleepAvg = Math.min(100, Math.round((avg("sleepHours") / 9) * 100));
    dailyScore = Math.round(
      (moodAvg + stressAvg + anxietyAvg + energyAvg + focusAvg + sleepAvg) / 6,
    );
  }

  // ── rPPG component (20%) — invert stress index so higher = better ─────────
  const rppgScore = latestRppgScan != null
    ? Math.round(100 - latestRppgScan.stressIndex)
    : 50; // neutral default when no scan

  // ── Engagement component (20%) ────────────────────────────────────────────
  // Cap each signal: sessions (max 14/week), journal (max 7), support (max 3)
  const sessionScore = Math.min(100, Math.round((engagement.copingSessionsCount / 14) * 100));
  const journalScore = Math.min(100, Math.round((engagement.journalEntriesCount / 7) * 100));
  const supportScore = Math.min(100, Math.round((engagement.supportRequestCount / 3) * 100));
  const engagementScore = Math.round((sessionScore + journalScore + supportScore) / 3);

  return Math.round(
    baselineScore * 0.35 +
    dailyScore * 0.25 +
    rppgScore * 0.20 +
    engagementScore * 0.20,
  );
}

/** Legacy overload: simple PHQ-9 + PSS mental score for backward compatibility */
export function scoreMentalSimple(phq9Answers: number[], pssAnswers: number[]): number {
  const phq = scorePhq9(phq9Answers);
  const pss = scorePss(pssAnswers);
  return Math.round(phq * 0.6 + pss * 0.4);
}

export interface QuestionnaireAnswers {
  phq9: number[]; // 9 items, 0-3
  pss: number[]; // 4 items, 0-4
  sleepHours: number;
  alcoholFrequency: number;
  tobacco: boolean;
  screenHours: number;
  spiritualAnswers: number[]; // 3 items, 0-4
}

export interface PillarScores {
  physical: number;
  mental: number;
  spiritual: number;
  lifestyle: number;
}

/**
 * Compute all 4 pillar scores from questionnaire answers.
 * Physical is always 50 at this point — filled in after the physical intake.
 * Mental uses the legacy simple model (PHQ-9 + PSS) at onboarding time;
 * the full 4-signal model is used after daily check-ins and scans are available.
 */
export function computePillarScores(answers: QuestionnaireAnswers): PillarScores {
  return {
    physical: 50, // placeholder until physical questionnaire is done
    mental: scoreMentalSimple(answers.phq9, answers.pss),
    spiritual: scoreSpiritual(answers.spiritualAnswers),
    lifestyle: scoreLifestyle({
      sleepHours: answers.sleepHours,
      alcoholFrequency: answers.alcoholFrequency,
      tobacco: answers.tobacco,
      screenHours: answers.screenHours,
    }),
  };
}

/** Overall wellness score (average of 4 pillars) */
export function overallScore(scores: PillarScores): number {
  return Math.round(
    (scores.physical + scores.mental + scores.spiritual + scores.lifestyle) / 4
  );
}

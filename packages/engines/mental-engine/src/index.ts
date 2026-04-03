/**
 * @aura/mental-engine — barrel export
 *
 * Pure-logic engine for the mental wellness module.
 * No API code, no database code, no UI code.
 */

// ── Baseline scoring (PHQ-9, GAD-7, stress, mood) ──
export {
  computePhq9Score,
  classifyPhq9Severity,
  phq9ToWellnessScale,
  hasPhq9SelfHarmRisk,
  computeGad7Score,
  classifyGad7Severity,
  gad7ToWellnessScale,
  stressToWellnessScale,
  moodToWellnessScale,
  computeBaselineScore,
  buildBaseline,
} from "./baseline";

// ── 4-signal composite scoring ──
export {
  scoreBaselineComponent,
  scoreDailyComponent,
  scoreRppgComponent,
  scoreEngagementComponent,
  computeMentalWellnessScore,
} from "./scoring";

// ── Check-in trend analysis ──
export {
  analyzeCheckInTrends,
  rollingAverage,
  countCheckInDays,
} from "./checkin-analyzer";

// ── rPPG result processing ──
export {
  MIN_SIGNAL_QUALITY,
  HR_MIN,
  HR_MAX,
  STRESS_THRESHOLDS,
  validateScanResult,
  classifyStressLevel,
  getStressDescription,
  getResultCopy,
  stressIndexToWellness,
  classifyHeartRateZone,
  compareScanResults,
} from "./rppg-processor";
export type { StressLevel } from "./rppg-processor";

// ── Plan generation ──
export {
  generateMentalPlan,
  generateInitialPlan,
} from "./plan-generator";

// ── Intervention recommendations ──
export {
  recommendInterventionsByStress,
  recommendInterventionsByLevel,
  getBestIntervention,
  recommendForUser,
} from "./intervention-recommender";

// ── Weekly review ──
export {
  generateWeeklyReview,
  compareToBaseline,
  generateWeeklyInsight,
} from "./weekly-reviewer";

// ── Alert engine ──
export {
  detectAlerts,
  getHighestAlertLevel,
  getUnresolvedAlerts,
} from "./alert-engine";

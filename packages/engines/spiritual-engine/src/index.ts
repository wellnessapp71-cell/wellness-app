/**
 * @aura/spiritual-engine — barrel export
 *
 * Pure-logic engine for the spiritual wellness module.
 * No API code, no database code, no UI code.
 */

// ── Question bank ──
export {
  SPIRITUAL_QUESTIONS,
  QUESTIONS_BY_DOMAIN,
  TOTAL_QUESTIONS,
  LIKERT_LABELS,
  REVERSE_SCORED_INDICES,
  DOMAIN_RANGES,
} from "./questions";

// ── Baseline scoring (5 domains → composite) ──
export {
  computeDomainScore,
  classifyBand,
  computeInnerCalmScore,
  buildSpiritualBaseline,
} from "./baseline";

// ── Composite scoring ──
export {
  scoreBaselineComponent,
  scoreDailyComponent,
  scoreEngagementComponent,
  scorePracticeComponent,
  computeSpiritualWellnessScore,
} from "./scoring";

// ── Check-in trend analysis ──
export {
  classifyCalmBand,
  analyzeSpiritualCheckIns,
  detectDailyAlerts,
  rollingCalmAverage,
  countCheckInDays,
} from "./checkin-analyzer";

// ── Plan generation ──
export {
  generateSpiritualPlan,
  generateInitialPlan,
} from "./plan-generator";

// ── AI coach ──
export {
  generateCoachMessage,
} from "./coach";

// ── Weekly review ──
export {
  generateSpiritualWeeklyReview,
  shouldChangePlan,
  generateWeeklyInsight,
} from "./weekly-reviewer";

// ── Alert engine ──
export {
  detectAlerts,
  getHighestAlertLevel,
} from "./alert-engine";

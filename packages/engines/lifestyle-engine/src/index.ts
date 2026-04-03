/**
 * @aura/lifestyle-engine — barrel export
 *
 * Pure-logic engine for the lifestyle wellness module.
 * No API code, no database code, no UI code.
 */

// ── Question bank ──
export {
  LIFESTYLE_QUESTIONS,
  DOMAIN_QUESTION_COUNTS,
  DOMAIN_START_INDEX,
  TOTAL_QUESTIONS,
} from "./questions";

// ── Baseline scoring (onboarding) ──
export {
  computeDomainScore,
  computeAllDomainScores,
  computeCompositeScore,
  classifyBand,
  findWeakestDomain,
  findSecondWeakest,
  buildLifestyleBaseline,
} from "./baseline";

// ── Composite scoring (baseline + daily + engagement) ──
export {
  scoreBaselineComponent,
  scoreDailyComponent,
  scoreEngagementComponent,
  computeLifestyleWellnessScore,
} from "./scoring";

// ── Plan generation ──
export {
  generateLifestylePlan,
  generateInitialLifestylePlan,
} from "./plan-generator";

// ── Check-in trend analysis ──
export {
  analyzeLifestyleTrends,
  rollingAverage,
  countCheckInDays,
} from "./checkin-analyzer";
export type {
  TrendDirection,
  FieldTrend,
  LifestyleTrendAnalysis,
} from "./checkin-analyzer";

// ── Weekly review ──
export {
  generateWeeklyReview,
  generateWeeklyInsight,
} from "./weekly-reviewer";

// ── Monthly review ──
export {
  generateMonthlyReview,
  generateMonthlyInsight,
} from "./monthly-reviewer";

// ── AI coach ──
export {
  generateCoachMessage,
  generateDomainCoachMessage,
} from "./coach";

/**
 * Lifestyle / Daily Wellness types.
 *
 * 7-domain balanced measurable model (PRD v2):
 * Nutrition 18%, Sleep 18%, Movement 16%, Hydration 12%,
 * Digital 12%, Nature 12%, Routine 12%.
 *
 * Answer bands: Very Low=0, Low=1, Moderate=2, High=3, Very High=4.
 * Score bands: Green 80-100, Yellow 60-79, Orange 40-59, Red 0-39.
 */

// ── Domain identifiers ──────────────────────────────────────────

export type LifestyleDomain =
  | "sleep"
  | "nutrition"
  | "hydration"
  | "movement"
  | "digital"
  | "nature"
  | "routine";

export type LifestyleBand = "green" | "yellow" | "orange" | "red";

export const LIFESTYLE_DOMAINS: LifestyleDomain[] = [
  "sleep",
  "nutrition",
  "hydration",
  "movement",
  "digital",
  "nature",
  "routine",
];

export const LIFESTYLE_DOMAIN_LABELS: Record<LifestyleDomain, string> = {
  sleep: "Sleep & Recovery",
  nutrition: "Nutrition",
  hydration: "Hydration",
  movement: "Movement",
  digital: "Digital Balance",
  nature: "Nature & Light",
  routine: "Routine",
};

export const LIFESTYLE_DOMAIN_ICONS: Record<LifestyleDomain, string> = {
  sleep: "😴",
  nutrition: "🍎",
  hydration: "💧",
  movement: "🚶",
  digital: "📱",
  nature: "🌿",
  routine: "🔄",
};

export const LIFESTYLE_SCORE_WEIGHTS: Record<LifestyleDomain, number> = {
  nutrition: 0.18,
  sleep: 0.18,
  movement: 0.16,
  hydration: 0.12,
  digital: 0.12,
  nature: 0.12,
  routine: 0.12,
};

// ── Blocker tags ────────────────────────────────────────────────

export const LIFESTYLE_BLOCKER_TAGS = [
  "work",
  "travel",
  "stress",
  "social",
  "fatigue",
  "other",
] as const;

export type LifestyleBlockerTag = (typeof LIFESTYLE_BLOCKER_TAGS)[number];

// ── Supporting types ────────────────────────────────────────────

export type RoutineType = "morning" | "afternoon" | "evening";

export const DRINK_TYPES = [
  "water",
  "tea",
  "coffee",
  "juice",
  "electrolyte",
  "other",
] as const;

export type DrinkType = (typeof DRINK_TYPES)[number];

export const MOVEMENT_BREAK_TYPES = [
  "walk",
  "stretch",
  "stand",
  "stairs",
  "micro_activity",
] as const;

export type MovementBreakType = (typeof MOVEMENT_BREAK_TYPES)[number];

// ── Onboarding question definition ─────────────────────────────

export interface LifestyleQuestion {
  id: string;
  domain: LifestyleDomain;
  text: string;
  options: { label: string; value: number }[];
  reverseScored: boolean;
}

// ── Baseline (output of onboarding assessment) ─────────────────

export interface LifestyleBaseline {
  sleepScore: number;
  nutritionScore: number;
  hydrationScore: number;
  movementScore: number;
  digitalScore: number;
  natureScore: number;
  routineScore: number;
  totalScore: number;
  band: LifestyleBand;
  weakestDomain: LifestyleDomain;
  rawAnswers: number[];
  createdAt: string;
}

// ── Daily check-in (measurable fields per PRD Section 8) ───────

export interface LifestyleDailyCheckIn {
  id: string;
  date: string;
  // Sleep
  sleepHours: number;
  sleepQuality: number; // 0-10
  // Nutrition
  mealsEaten: number;
  fruitServings: number;
  vegServings: number;
  proteinFiberMeals: number;
  ultraProcessedServings: number;
  sugaryServings: number;
  lateEatingCount: number; // times eaten after 9 PM
  stressEating: "no" | "slightly" | "moderately" | "strongly" | "very_strongly";
  // Hydration
  waterMl: number;
  waterBeforeNoon: number; // times
  hydrationSpanHours: number;
  metWaterGoal: "no" | "partly" | "mostly" | "yes" | "exceeded";
  // Movement
  activeMinutes: number;
  sittingMinutesMax: number; // longest sit without break
  movementBreaks: number;
  strengthYogaDone: "no" | "light" | "moderate" | "good" | "strong";
  // Digital
  screenMinutesNonWork: number;
  bedtimeScreenMinutes: number;
  notificationsAfter8pm: number;
  usedFocusMode: "no" | "once" | "partly" | "mostly" | "fully";
  // Nature
  outdoorMinutes: number;
  morningDaylightMinutes: number;
  // Routine
  morningRoutineDone: "no" | "partly" | "mostly" | "yes" | "fully";
  eveningRoutineDone: "no" | "partly" | "mostly" | "yes" | "fully";
  sameWakeTimeDays: number; // 0-7
  // Blockers
  blockers: LifestyleBlockerTag[];
  createdAt: string;

  // ── Backward compat aliases (deprecated, use new fields) ──
  /** @deprecated Use fruitServings + vegServings */
  fruitVegServings: number;
  /** @deprecated Use screenMinutesNonWork / 60 */
  screenHoursNonWork: number;
  /** @deprecated Use outdoorMinutes > 0 */
  gotOutdoors: boolean;
  /** @deprecated Use morningRoutineDone */
  routineCompletion: "yes" | "partly" | "no";
}

// ── Weekly review ──────────────────────────────────────────────

export interface LifestyleWeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  balancedMealDays: number;
  hydrationTargetDays: number;
  goodSleepDays: number;
  moderateActivityDays: number;
  strengthYogaDays: number;
  screenUnderLimitDays: number;
  outdoorDays: number;
  routineDays: number;
  helpedMostHabit: string | null;
  blockedMostHabit: string | null;
  scoreChange: number;
  createdAt: string;

  // ── Backward compat (deprecated) ──
  /** @deprecated Use balancedMealDays */
  mealLogDays: number;
  /** @deprecated Use moderateActivityDays */
  movementDays: number;
  /** @deprecated Use screenUnderLimitDays */
  screenInterferenceDays: number;
}

// ── Monthly review ─────────────────────────────────────────────

export interface LifestyleMonthlyReview {
  id: string;
  month: string;
  sleepImproved: boolean;
  mealQualityImproved: boolean;
  hydrationImproved: boolean;
  movementImproved: boolean;
  screenBalanceImproved: boolean;
  natureImproved: boolean;
  routineImproved: boolean;
  mostImprovedDomain: LifestyleDomain | null;
  worstDomain: LifestyleDomain | null;
  planPreference: "simpler" | "same" | "advanced";
  createdAt: string;
}

// ── Lifestyle profile / goals ──────────────────────────────────

export interface LifestyleGoals {
  sleepGoalHours: number;
  waterGoalMl: number;
  movementGoalMinutes: number;
  screenLimitMinutes: number;
  preferredRoutineTime: RoutineType;
}

// ── Adaptive plan ──────────────────────────────────────────────

export interface LifestyleWellnessPlan {
  dailyAnchorHabit: string;
  recoveryHabit: string;
  weeklyGoal: string;
  trendInsight: string;
  bestNextAction: string;
  followUpTime: string;
  expertRecommendation: string | null;
  focusDomain: LifestyleDomain;
  supportDomain: LifestyleDomain | null;
  band: LifestyleBand;
  createdAt: string;
}

// ── AI coach message ───────────────────────────────────────────

export interface LifestyleCoachMessage {
  text: string;
  band: LifestyleBand;
  weakDomain: LifestyleDomain;
  suggestedAction: string | null;
}

// ── Score run (for history) ────────────────────────────────────

export interface LifestyleScoreRun {
  sleepScore: number;
  nutritionScore: number;
  hydrationScore: number;
  movementScore: number;
  digitalScore: number;
  natureScore: number;
  routineScore: number;
  totalScore: number;
  band: LifestyleBand;
  createdAt: string;
}

// ── Domain-specific log types ──────────────────────────────────

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  qualityScore: number;
  latencyMinutes: number;
  wakeups: number;
  notes: string | null;
  createdAt: string;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  calories: number | null;
  proteinG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  foodQualityFlag: "good" | "fair" | "poor";
  createdAt: string;
}

export interface HydrationLog {
  id: string;
  date: string;
  drinkType: DrinkType;
  volumeMl: number;
  caffeineFlag: boolean;
  createdAt: string;
}

export interface MovementLog {
  id: string;
  date: string;
  steps: number | null;
  activeMinutes: number;
  sedentaryMinutes: number | null;
  breakType: MovementBreakType | null;
  createdAt: string;
}

export interface DigitalBalanceLog {
  id: string;
  date: string;
  screenTimeMinutes: number;
  bedtimeScreenMinutes: number;
  notificationCount: number | null;
  focusSessionCount: number;
  createdAt: string;
}

export interface NatureLog {
  id: string;
  date: string;
  outdoorMinutes: number;
  lightMinutes: number;
  greenSpaceMinutes: number;
  moodAfterScore: number | null;
  createdAt: string;
}

export interface RoutineCompletion {
  id: string;
  date: string;
  routineType: RoutineType;
  habitName: string;
  completed: boolean;
  streakDay: number;
  createdAt: string;
}

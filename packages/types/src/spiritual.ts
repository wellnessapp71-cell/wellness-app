// ═══════════════════════════════════════════════════════════════
// Spiritual / Inner Calm — Type Definitions
// ═══════════════════════════════════════════════════════════════

// ── Domain identifiers ──────────────────────────────────────────
export type SpiritualDomain = "meaning" | "peace" | "mindfulness" | "connection" | "practice";

// ── Score band (maps to adaptive plan routing) ──────────────────
export type SpiritualBand = "green" | "yellow" | "orange" | "red";

// ── Feeling chips for daily check-in ────────────────────────────
export const SPIRITUAL_FEELING_TAGS = [
  "peaceful", "distracted", "heavy", "grateful", "restless", "inspired",
] as const;
export type SpiritualFeelingTag = (typeof SPIRITUAL_FEELING_TAGS)[number];

// ── Calm blockers ───────────────────────────────────────────────
export const SPIRITUAL_BLOCKER_TAGS = [
  "work", "conflict", "phone_overload", "loneliness", "worry", "health", "other",
] as const;
export type SpiritualBlockerTag = (typeof SPIRITUAL_BLOCKER_TAGS)[number];

// ── Practice types ──────────────────────────────────────────────
export const SPIRITUAL_PRACTICE_TYPES = [
  "meditation", "breathwork", "prayer", "gratitude", "journaling",
  "nature", "soundscape", "silent_sitting", "kindness_act",
] as const;
export type SpiritualPracticeType = (typeof SPIRITUAL_PRACTICE_TYPES)[number];

// ── Content categories ──────────────────────────────────────────
export const SPIRITUAL_CONTENT_CATEGORIES = [
  "sleep", "stress_release", "focus", "gratitude", "anxiety_relief",
  "self_compassion", "chakra", "silent_sitting",
] as const;
export type SpiritualContentCategory = (typeof SPIRITUAL_CONTENT_CATEGORIES)[number];

// ── Onboarding question definition ──────────────────────────────
export interface SpiritualQuestion {
  id: string;
  domain: SpiritualDomain;
  text: string;
  reverseScored: boolean;
}

// ── Baseline (output of onboarding assessment) ──────────────────
export interface SpiritualBaseline {
  meaningScore: number;       // 0-100
  peaceScore: number;         // 0-100
  mindfulnessScore: number;   // 0-100
  connectionScore: number;    // 0-100
  practiceScore: number;      // 0-100
  totalScore: number;         // 0-100 weighted composite
  band: SpiritualBand;
  weakestDomain: SpiritualDomain;
  preferredPracticeTime: string | null;    // "morning" | "evening" | "anytime"
  preferredSupportStyle: string | null;    // "guided" | "self_directed" | "community"
  rawAnswers: number[];       // all 24 answers (0-4 each)
  createdAt: string;
}

// ── Daily check-in ──────────────────────────────────────────────
export interface SpiritualDailyCheckIn {
  id: string;
  date: string;                            // ISO date
  calmScore: number;                       // 0-10 slider
  didPractice: boolean;                    // meditation/prayer/breathwork/quiet
  feltConnected: "yes" | "a_little" | "no";
  natureOrReflectionHelped: "yes" | "a_little" | "no";
  blockers: SpiritualBlockerTag[];
  feelings: SpiritualFeelingTag[];
  createdAt: string;
}

// ── Practice session log ────────────────────────────────────────
export interface SpiritualPracticeSession {
  id: string;
  type: SpiritualPracticeType;
  contentId: string | null;
  durationMinutes: number;
  completedAt: string;
  rating: number | null;       // 1-5
}

// ── Journal / gratitude / reflection entry ──────────────────────
export interface SpiritualJournalEntry {
  id: string;
  promptType: "free" | "gratitude" | "reflection";
  moodTag: SpiritualFeelingTag | null;
  gratitudeText: string | null;
  reflectionText: string | null;
  whatBroughtCalm: string | null;
  whatTriggeredDiscomfort: string | null;
  whatHelped: string | null;
  createdAt: string;
}

// ── Weekly review ───────────────────────────────────────────────
export interface SpiritualWeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  calmFrequency: number;       // 0-4 (never..very_often)
  presenceFrequency: number;   // 0-4
  practiceRecovery: number;    // 0-4
  gratitudeFrequency: number;  // 0-4
  connectionFrequency: number; // 0-4
  whatHelpedMost: SpiritualPracticeType | null;
  whatHurtMost: SpiritualBlockerTag | null;
  planIntensity: "increase" | "keep" | "reduce";
  calmScoreChange: number;
  engagementSummary: string | null;
  createdAt: string;
}

// ── Adaptive plan ───────────────────────────────────────────────
export interface SpiritualWellnessPlan {
  primaryGoal: string;
  dailyAnchorHabit: string;
  recoveryAction: string;
  weeklyReflectionPrompt: string;
  liveExpertSuggestion: string | null;
  contentBundle: string[];
  followUpDate: string;
  focusDomain: SpiritualDomain;
  band: SpiritualBand;
  escalationRisk: "info" | "warning" | "critical";
  createdAt: string;
}

// ── AI coach message ────────────────────────────────────────────
export interface SpiritualCoachMessage {
  text: string;
  band: SpiritualBand;
  suggestedAction: string | null;
}

// ── Score run (for history) ─────────────────────────────────────
export interface SpiritualScoreRun {
  meaningScore: number;
  peaceScore: number;
  mindfulnessScore: number;
  connectionScore: number;
  practiceScore: number;
  totalScore: number;
  band: SpiritualBand;
  confidence: number;    // 0-1
  createdAt: string;
}

// ── Trend data (for analysis) ───────────────────────────────────
export type SpiritualTrendDirection = "improving" | "stable" | "declining";

export interface SpiritualTrendData {
  calmTrend: number[];            // 7 values
  practiceDaysTrend: boolean[];   // 7 values
  connectionTrend: number[];      // 7 values (mapped from yes/a_little/no)
  practiceSessionsCount: number;
  journalEntriesCount: number;
  overallDirection: SpiritualTrendDirection;
}

// ── Alert ────────────────────────────────────────────────────────
export interface SpiritualAlert {
  alertId: string;
  level: "info" | "warning" | "critical";
  reason: string;
  createdAt: string;
}

// ── Domain weights for composite scoring ────────────────────────
export const SPIRITUAL_DOMAIN_WEIGHTS = {
  meaning: 0.25,
  peace: 0.25,
  mindfulness: 0.20,
  connection: 0.20,
  practice: 0.10,
} as const;

// ── Composite score weights ─────────────────────────────────────
export const SPIRITUAL_SCORE_WEIGHTS = {
  baseline: 0.35,
  daily: 0.25,
  engagement: 0.20,
  practice: 0.20,
} as const;

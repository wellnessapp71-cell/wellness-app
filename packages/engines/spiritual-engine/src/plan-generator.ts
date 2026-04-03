/**
 * Adaptive plan generator for the spiritual wellness module.
 *
 * Rules by domain weakness:
 * - Meaning: Purpose prompts, values-alignment journaling, kindness challenge
 * - Peace: Breathing/stillness/guided meditation, bedtime calm routine
 * - Mindfulness: Body-awareness check-ins, micro pause notifications, attention training
 * - Connection: Gratitude/relationship prompts, community/live sessions, nature sessions
 * - Practice: Reduce routine length, one-tap actions, streak protection, easy entry
 *
 * Routing by band:
 * - Green: maintain habits, praise consistency, offer advanced practices
 * - Yellow: recommend one focused habit + short routine
 * - Orange: reduce complexity, increase guided support, suggest live expert
 * - Red: stop normal flow, route to human support / crisis pathway
 */

import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualWellnessPlan,
  SpiritualBand,
  SpiritualDomain,
} from "@aura/types";

// ─── Plan Generation ────────────────────────────────────────────

/**
 * Generate a personalized spiritual wellness plan from baseline + recent check-ins.
 */
export function generateSpiritualPlan(
  baseline: SpiritualBaseline,
  checkIns: SpiritualDailyCheckIn[],
  preferences?: { preferredPracticeTime?: string | null }
): SpiritualWellnessPlan {
  const { band, weakestDomain } = baseline;

  const primaryGoal = getPrimaryGoal(weakestDomain, band);
  const dailyAnchorHabit = getAnchorHabit(weakestDomain, band);
  const recoveryAction = getRecoveryAction(weakestDomain, band);
  const weeklyReflectionPrompt = getReflectionPrompt(weakestDomain);
  const liveExpertSuggestion = getLiveExpertSuggestion(band);
  const contentBundle = getContentBundle(weakestDomain, band);
  const escalationRisk = assessEscalationRisk(baseline, checkIns);

  // Follow-up in 7 days
  const followUp = new Date();
  followUp.setDate(followUp.getDate() + 7);

  return {
    primaryGoal,
    dailyAnchorHabit,
    recoveryAction,
    weeklyReflectionPrompt,
    liveExpertSuggestion,
    contentBundle,
    followUpDate: followUp.toISOString().split("T")[0],
    focusDomain: weakestDomain,
    band,
    escalationRisk,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate initial plan from baseline only (for onboarding).
 */
export function generateInitialPlan(
  baseline: SpiritualBaseline
): SpiritualWellnessPlan {
  return generateSpiritualPlan(baseline, []);
}

// ─── Goal by Domain ─────────────────────────────────────────────

function getPrimaryGoal(domain: SpiritualDomain, band: SpiritualBand): string {
  if (band === "red") {
    return "Reconnect with calm through gentle, guided support";
  }

  const goals: Record<SpiritualDomain, string> = {
    meaning: "Rediscover your sense of purpose through daily reflection",
    peace: "Build a daily stillness routine for inner calm",
    mindfulness: "Develop present-moment awareness through micro-practices",
    connection: "Strengthen your sense of belonging and gratitude",
    practice: "Establish a simple, consistent daily practice",
  };

  return goals[domain];
}

// ─── Anchor Habits ──────────────────────────────────────────────

function getAnchorHabit(domain: SpiritualDomain, band: SpiritualBand): string {
  if (band === "red" || band === "orange") {
    // Simplified habits for struggling users
    return "1-minute calm breathing reset — anytime you feel overwhelmed, tap to breathe";
  }

  const habits: Record<SpiritualDomain, string> = {
    meaning: "Write one sentence about what gave your day meaning before bed",
    peace: "5-minute guided breathing or stillness session each morning",
    mindfulness: "Three 1-minute pause-and-notice moments throughout the day",
    connection: "Express gratitude to one person daily (text, call, or thought)",
    practice: "1-minute morning reset — just sit, breathe, and set an intention",
  };

  return habits[domain];
}

// ─── Recovery Actions ───────────────────────────────────────────

function getRecoveryAction(domain: SpiritualDomain, band: SpiritualBand): string {
  if (band === "red") {
    return "Connect with a support professional — tap here for help";
  }

  const actions: Record<SpiritualDomain, string> = {
    meaning: "Open a values-alignment journal prompt and write freely for 3 minutes",
    peace: "Start a 3-minute guided breathing session with calming soundscape",
    mindfulness: "Do a 60-second body scan — notice 5 things you can feel right now",
    connection: "Send a kind message to someone you care about",
    practice: "Do one-tap 1-minute reset instead of your full routine",
  };

  return actions[domain];
}

// ─── Reflection Prompts ─────────────────────────────────────────

function getReflectionPrompt(domain: SpiritualDomain): string {
  const prompts: Record<SpiritualDomain, string> = {
    meaning: "What moments this week made you feel most aligned with your values?",
    peace: "When did you feel most calm this week, and what contributed to it?",
    mindfulness: "What did you notice this week that you might usually miss?",
    connection: "Who or what made you feel most connected this week?",
    practice: "What practice felt most natural this week, and why?",
  };

  return prompts[domain];
}

// ─── Live Expert Suggestions ────────────────────────────────────

function getLiveExpertSuggestion(band: SpiritualBand): string | null {
  if (band === "red") {
    return "We strongly recommend a session with a wellness counselor. Tap to schedule.";
  }
  if (band === "orange") {
    return "A guided session with a meditation teacher could help. Explore live sessions.";
  }
  return null;
}

// ─── Content Bundles ────────────────────────────────────────────

function getContentBundle(domain: SpiritualDomain, band: SpiritualBand): string[] {
  const base: Record<SpiritualDomain, string[]> = {
    meaning: ["purpose_journaling", "values_alignment", "kindness_challenge"],
    peace: ["guided_meditation", "breathing_basics", "bedtime_calm"],
    mindfulness: ["body_awareness", "attention_training", "present_moment_log"],
    connection: ["gratitude_practice", "community_intro", "nature_walk"],
    practice: ["meditation_101", "breathwork_basics", "silent_sitting_intro"],
  };

  const bundle = [...base[domain]];

  // Add easier content for lower bands
  if (band === "orange" || band === "red") {
    bundle.unshift("quick_calm_reset");
  }

  // Add advanced content for green band
  if (band === "green") {
    bundle.push("advanced_meditation", "chakra_exploration");
  }

  return bundle;
}

// ─── Escalation Risk ────────────────────────────────────────────

function assessEscalationRisk(
  baseline: SpiritualBaseline,
  checkIns: SpiritualDailyCheckIn[]
): "info" | "warning" | "critical" {
  // Critical: very low composite score
  if (baseline.totalScore < 20) return "critical";

  // Warning: low score or sustained low calm in check-ins
  if (baseline.totalScore < 40) return "warning";

  const recent = checkIns.slice(-7);
  const lowCalmDays = recent.filter((c) => c.calmScore <= 2).length;
  if (lowCalmDays >= 3) return "warning";

  // Sustained inability to practice + no connection
  const noPracticeDays = recent.filter((c) => !c.didPractice).length;
  const noConnectionDays = recent.filter((c) => c.feltConnected === "no").length;
  if (noPracticeDays >= 5 && noConnectionDays >= 5) return "warning";

  return "info";
}

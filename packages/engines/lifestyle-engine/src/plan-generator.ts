/**
 * Lifestyle adaptive plan generator (rules engine).
 *
 * Takes baseline + recent check-ins and produces a LifestyleWellnessPlan.
 * Pure function — no side effects.
 *
 * PRD v2: if multiple domains are weak, choose one primary + one support domain.
 */

import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleDomain,
  LifestyleBand,
  LifestyleWellnessPlan,
} from "@aura/types";

import { classifyBand, computeAllDomainScores, findWeakestDomain, findSecondWeakest } from "./baseline";

// ─── Anchor habit rules by domain ──────────────────────────────

const ANCHOR_HABITS: Record<LifestyleDomain, Record<LifestyleBand, string>> = {
  sleep: {
    red: "Set a fixed bedtime alarm and put screens away 30 min before.",
    orange: "Keep a consistent bedtime within 30 min every night.",
    yellow: "Add a 5-minute wind-down routine before bed.",
    green: "Maintain your sleep routine — it's working well.",
  },
  nutrition: {
    red: "Eat at least one improved meal today with protein and produce.",
    orange: "Plan one balanced meal with protein, fiber, and healthy fat.",
    yellow: "Log every meal today to stay aware of food choices.",
    green: "Keep up your balanced eating — try a new healthy recipe.",
  },
  hydration: {
    red: "Drink a glass of water first thing in the morning.",
    orange: "Set 3 water reminders through the day.",
    yellow: "Carry a water bottle and refill it at least twice.",
    green: "Maintain hydration consistency — you're doing great.",
  },
  movement: {
    red: "Take a 10-minute walk today — any movement counts.",
    orange: "Aim for 20 minutes of movement and one stretch break.",
    yellow: "Add a short strength or mobility session this week.",
    green: "Keep your movement habit — try adding variety.",
  },
  digital: {
    red: "Set a screen-free hour before bed tonight.",
    orange: "Turn off non-essential notifications for 2 hours.",
    yellow: "Try a focus mode session during your most productive time.",
    green: "Your digital balance is solid — maintain the routine.",
  },
  nature: {
    red: "Spend 10 minutes outdoors today, even just on a doorstep.",
    orange: "Get morning daylight within 30 min of waking up.",
    yellow: "Add an outdoor walk during a break today.",
    green: "Great nature exposure — keep getting outside daily.",
  },
  routine: {
    red: "Pick one anchor habit and do it at the same time today.",
    orange: "Complete your morning or evening routine fully today.",
    yellow: "Keep your wake time consistent for 5 days this week.",
    green: "Your routine is strong — keep it consistent.",
  },
};

// ─── Recovery habit rules ──────────────────────────────────────

const RECOVERY_HABITS: Record<LifestyleDomain, string> = {
  sleep: "If you missed sleep last night, take a 20-min nap before 3 PM.",
  nutrition: "If you had an off day, start fresh with a healthy breakfast tomorrow.",
  hydration: "If hydration dipped, drink 500 ml in the next 2 hours.",
  movement: "If you skipped movement, do a 5-min stretch right now.",
  digital: "If screen time was high, take a 15-min screen break now.",
  nature: "If you missed outdoor time, step outside for 5 minutes now.",
  routine: "If routine slipped, pick one habit to complete before bed.",
};

// ─── Weekly goal rules ─────────────────────────────────────────

const WEEKLY_GOALS: Record<LifestyleDomain, Record<LifestyleBand, string>> = {
  sleep: {
    red: "Sleep 7+ hours on at least 3 nights this week.",
    orange: "Sleep 7+ hours on at least 5 nights.",
    yellow: "Keep bedtime within 30 min every night this week.",
    green: "Maintain 7+ hours every night with consistent timing.",
  },
  nutrition: {
    red: "Eat 3 balanced meals on at least 3 days this week.",
    orange: "Log meals at least 4 days and add produce to each meal.",
    yellow: "Hit 4+ servings of fruit/veg daily for 5 days.",
    green: "Maintain balanced meals and try one new healthy recipe.",
  },
  hydration: {
    red: "Drink at least 1.5 L of water daily for 4 days.",
    orange: "Hit hydration target 5 out of 7 days.",
    yellow: "Stay consistent with hydration — no late-day catch-ups.",
    green: "Maintain daily hydration target all 7 days.",
  },
  movement: {
    red: "Move for at least 15 min on 3 days this week.",
    orange: "Accumulate 150+ moderate activity minutes this week.",
    yellow: "Add 2 strength/yoga/mobility sessions this week.",
    green: "Keep 5+ active days and vary activity types.",
  },
  digital: {
    red: "Have at least 3 screen-free evenings this week.",
    orange: "Keep non-work screen time under 3 hours on 5 days.",
    yellow: "Use focus mode at least once daily for 5 days.",
    green: "Maintain digital sunset routine every evening.",
  },
  nature: {
    red: "Spend 10+ minutes outdoors on at least 3 days.",
    orange: "Get outdoor time on 5 days this week.",
    yellow: "Get morning light and outdoor time on 5+ days.",
    green: "Maintain daily outdoor exposure and morning daylight.",
  },
  routine: {
    red: "Complete morning or evening routine on 3 days.",
    orange: "Complete both routines on 5 days.",
    yellow: "Follow same wake time for 5+ days.",
    green: "Maintain full morning and evening routines daily.",
  },
};

// ─── Trend insight templates ───────────────────────────────────

function generateTrendInsight(
  domain: LifestyleDomain,
  band: LifestyleBand,
  checkIns: LifestyleDailyCheckIn[]
): string {
  if (checkIns.length < 3) {
    return "Keep checking in daily so we can spot patterns in your lifestyle.";
  }

  const recent = checkIns.slice(-7);

  if (domain === "sleep") {
    const avgSleep = recent.reduce((s, c) => s + c.sleepHours, 0) / recent.length;
    if (avgSleep < 6) return "Your sleep has averaged under 6 hours — this affects all other domains.";
    if (avgSleep >= 7) return "Your sleep is solid — this boosts recovery and energy.";
    return "Your sleep is improving but not yet consistent.";
  }

  const blockerCounts = new Map<string, number>();
  for (const c of recent) {
    for (const b of c.blockers) {
      blockerCounts.set(b, (blockerCounts.get(b) ?? 0) + 1);
    }
  }
  const topBlocker = [...blockerCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topBlocker && topBlocker[1] >= 3) {
    return `"${topBlocker[0]}" has been your top blocker ${topBlocker[1]} times this week — plan around it.`;
  }

  if (band === "green") return "You're in a strong position — focus on maintaining consistency.";
  if (band === "red") return "There's room for improvement — small daily changes add up fast.";
  return "You're making progress — keep building on what's working.";
}

function generateExpertRecommendation(
  domain: LifestyleDomain,
  band: LifestyleBand
): string | null {
  if (band !== "red") return null;

  const recs: Record<LifestyleDomain, string> = {
    sleep: "Consider consulting a sleep specialist if poor sleep persists beyond 2 weeks.",
    nutrition: "A session with a registered dietitian could help build a sustainable meal plan.",
    hydration: "If chronic dehydration persists, check with your doctor for underlying causes.",
    movement: "A physiotherapist can help design a safe starting exercise plan.",
    digital: "Consider a digital wellness coach or screen-time management app.",
    nature: "Even brief outdoor time improves mood — consider scheduling nature walks.",
    routine: "A wellness coach can help establish sustainable daily routines.",
  };
  return recs[domain];
}

// ─── Public API ────────────────────────────────────────────────

export function generateLifestylePlan(params: {
  baseline: LifestyleBaseline;
  checkIns: LifestyleDailyCheckIn[];
}): LifestyleWellnessPlan {
  const { baseline, checkIns } = params;

  const domainScores = computeAllDomainScores(baseline.rawAnswers);
  const focusDomain = findWeakestDomain(domainScores);
  const focusBand = classifyBand(domainScores[focusDomain]);

  // PRD: if multiple domains are weak, choose one primary + one support
  const supportDomain = findSecondWeakest(domainScores);
  const supportBand = classifyBand(domainScores[supportDomain]);
  const hasSupportDomain = supportBand === "red" || supportBand === "orange";

  return {
    dailyAnchorHabit: ANCHOR_HABITS[focusDomain][focusBand],
    recoveryHabit: RECOVERY_HABITS[focusDomain],
    weeklyGoal: WEEKLY_GOALS[focusDomain][focusBand],
    trendInsight: generateTrendInsight(focusDomain, focusBand, checkIns),
    bestNextAction: ANCHOR_HABITS[focusDomain][focusBand],
    followUpTime: focusBand === "red" ? "evening" : "morning",
    expertRecommendation: generateExpertRecommendation(focusDomain, focusBand),
    focusDomain,
    supportDomain: hasSupportDomain ? supportDomain : null,
    band: focusBand,
    createdAt: new Date().toISOString(),
  };
}

export function generateInitialLifestylePlan(
  baseline: LifestyleBaseline
): LifestyleWellnessPlan {
  return generateLifestylePlan({ baseline, checkIns: [] });
}

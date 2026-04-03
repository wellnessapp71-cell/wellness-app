/**
 * Lifestyle AI coach — response templates by band and domain.
 *
 * PRD v2 coach rules:
 * - One recommendation at a time
 * - Always name the weakest domain
 * - Use band-specific language: Green, Yellow, Orange, Red
 * - If nutrition + sleep/mood both poor, connect to mental/physical support
 * - If repeated risk patterns, switch to human-support routing
 */

import type {
  LifestyleBand,
  LifestyleDomain,
  LifestyleCoachMessage,
  LifestyleBaseline,
} from "@aura/types";

import { LIFESTYLE_DOMAIN_LABELS } from "@aura/types";
import { findWeakestDomain, computeAllDomainScores, classifyBand } from "./baseline";

// ─── Band-specific messages (PRD Section 13) ───────────────────

const BAND_MESSAGES: Record<LifestyleBand, string[]> = {
  green: [
    "Your routine is steady. Keep the meals, sleep, and movement habits that are working.",
    "Your lifestyle habits are strong. Small refinements can take you even further.",
    "Excellent work! Consistency is your superpower right now.",
  ],
  yellow: [
    "One part of your day is slipping. Let's fix just that one habit today.",
    "Good progress! Focus on your weakest area for the biggest improvement.",
    "You're building solid habits. Stay consistent and you'll see results.",
  ],
  orange: [
    "Your current pattern is affecting recovery. Let's simplify the next 7 days.",
    "Focus on your anchor habit — one consistent change makes a big difference.",
    "Don't try to fix everything at once. Pick one thing and build from there.",
  ],
  red: [
    "Your routine needs support now. Let's reduce load and connect you to help.",
    "Small daily wins add up. Start with the easiest habit to build momentum.",
    "You're here, and that's what matters. Let's build one habit at a time.",
  ],
};

const DOMAIN_SUGGESTIONS: Record<LifestyleDomain, Record<LifestyleBand, string>> = {
  sleep: {
    red: "Try setting a bedtime alarm 8 hours before you need to wake up.",
    orange: "Keep your bedtime within a 30-minute window every night.",
    yellow: "Add a wind-down routine — dim lights, no screens, calm activity.",
    green: "Your sleep is solid. Consider tracking sleep quality for deeper insight.",
  },
  nutrition: {
    red: "Start by adding one fruit or vegetable to each meal.",
    orange: "Try meal prepping one balanced lunch this week.",
    yellow: "Log your meals for 3 days to spot patterns.",
    green: "Great nutrition habits! Try experimenting with new healthy recipes.",
  },
  hydration: {
    red: "Keep a water bottle visible at your desk or bag at all times.",
    orange: "Set 3 water reminders: morning, midday, and afternoon.",
    yellow: "Track your intake — aim for 2L+ consistently.",
    green: "Hydration is on point. Consider adding electrolytes on active days.",
  },
  movement: {
    red: "Start with a 10-minute walk — any movement counts.",
    orange: "Aim for 20-minute movement sessions, 3 times this week.",
    yellow: "Add a strength or flexibility session to your weekly routine.",
    green: "Strong movement habits! Mix up activities to prevent plateaus.",
  },
  digital: {
    red: "Set a screen-free hour before bed starting tonight.",
    orange: "Use focus mode during your peak productivity hours.",
    yellow: "Try a notification-free morning for the first hour after waking.",
    green: "Great digital balance. Keep the digital sunset routine going.",
  },
  nature: {
    red: "Step outside for 10 minutes today — even a doorstep counts.",
    orange: "Get morning daylight within 30 minutes of waking.",
    yellow: "Add an outdoor walk to your daily routine.",
    green: "Great nature exposure. Keep getting outside daily.",
  },
  routine: {
    red: "Pick one anchor habit and do it at the same time every day.",
    orange: "Build a simple 3-step morning routine and do it for 5 days.",
    yellow: "Keep your wake time consistent — it anchors everything else.",
    green: "Your routines are strong. Consider adding a gratitude moment.",
  },
};

// ─── Public API ────────────────────────────────────────────────

export function generateCoachMessage(
  baseline: LifestyleBaseline
): LifestyleCoachMessage {
  const domainScores = computeAllDomainScores(baseline.rawAnswers);
  const weakDomain = findWeakestDomain(domainScores);
  const band = classifyBand(domainScores[weakDomain]);

  const messages = BAND_MESSAGES[baseline.band];
  const text = messages[Math.floor(Math.random() * messages.length)];
  const suggestion = DOMAIN_SUGGESTIONS[weakDomain][band];

  return {
    text,
    band: baseline.band,
    weakDomain,
    suggestedAction: suggestion,
  };
}

export function generateDomainCoachMessage(
  domain: LifestyleDomain,
  band: LifestyleBand
): LifestyleCoachMessage {
  const messages = BAND_MESSAGES[band];
  const text = messages[Math.floor(Math.random() * messages.length)];

  return {
    text: `${LIFESTYLE_DOMAIN_LABELS[domain]}: ${text}`,
    band,
    weakDomain: domain,
    suggestedAction: DOMAIN_SUGGESTIONS[domain][band],
  };
}

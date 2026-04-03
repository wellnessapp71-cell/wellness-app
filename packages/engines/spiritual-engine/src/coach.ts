/**
 * AI coach response templates for the spiritual wellness module.
 *
 * Response templates by band (PRD Section 8):
 * - Green: positive reinforcement, advanced practice suggestions
 * - Yellow: gentle nudge, one short practice suggestion
 * - Orange: heavier support, simpler plan, live expert suggestion
 * - Red: immediate support routing, crisis pathway
 *
 * Context inputs: current band, weakest domain, last 3 days trend,
 * most recent trigger, recent practice history, user preference, support availability.
 */

import type {
  SpiritualBand,
  SpiritualDomain,
  SpiritualCoachMessage,
  SpiritualTrendDirection,
} from "@aura/types";

// ─── Coach Message Generation ───────────────────────────────────

/**
 * Generate a contextual AI coach message based on the user's current state.
 */
export function generateCoachMessage(
  band: SpiritualBand,
  weakestDomain: SpiritualDomain,
  recentTrend: SpiritualTrendDirection,
  trigger?: string | null
): SpiritualCoachMessage {
  // Band-specific base messages
  const baseMessage = getBaseMessage(band);
  const trendMessage = getTrendMessage(band, recentTrend);
  const domainSuggestion = getDomainSuggestion(weakestDomain, band);
  const triggerResponse = trigger ? getTriggerResponse(trigger, band) : null;

  // Combine messages
  const parts = [baseMessage];
  if (trendMessage) parts.push(trendMessage);
  if (triggerResponse) parts.push(triggerResponse);

  return {
    text: parts.join(" "),
    band,
    suggestedAction: domainSuggestion,
  };
}

// ─── Base Messages by Band ──────────────────────────────────────

function getBaseMessage(band: SpiritualBand): string {
  const messages: Record<SpiritualBand, string[]> = {
    green: [
      "You are doing well today. Keep the routine that is helping you.",
      "Your inner calm is strong. Consider exploring a new practice.",
      "Beautiful consistency! You're building deep inner resilience.",
    ],
    yellow: [
      "Your inner calm is a little lower than usual. Let's do one short practice now.",
      "You're on a good path. A quick moment of stillness could help right now.",
      "Your calm is holding steady — a breathing exercise might give you a boost.",
    ],
    orange: [
      "This week looks heavy. I recommend a simpler plan and a live session with an expert.",
      "Your calm has been lower recently. Let's focus on just one easy practice today.",
      "Things feel tough right now. That's okay — even one minute of calm breathing helps.",
    ],
    red: [
      "I want to help you reach support now. Tap here to connect with a professional.",
      "You're going through a difficult time. Professional support is available right now.",
      "Your well-being matters. Let's connect you with someone who can help immediately.",
    ],
  };

  const options = messages[band];
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Trend Messages ─────────────────────────────────────────────

function getTrendMessage(
  band: SpiritualBand,
  trend: SpiritualTrendDirection
): string | null {
  if (band === "red") return null; // Don't distract from support routing

  if (trend === "improving") {
    return "Your calm has been improving — great work maintaining your practices.";
  }
  if (trend === "declining") {
    if (band === "orange") {
      return "I notice your calm has been trending down. Let's simplify your routine.";
    }
    return "Your calm dipped a bit recently. A short reset could help you get back on track.";
  }

  return null; // stable — no extra message needed
}

// ─── Domain Suggestions ─────────────────────────────────────────

function getDomainSuggestion(
  domain: SpiritualDomain,
  band: SpiritualBand
): string {
  if (band === "red") {
    return "Connect with support — tap to talk with a professional";
  }

  const suggestions: Record<SpiritualDomain, Record<string, string>> = {
    meaning: {
      green: "Try a deeper values-alignment journaling session",
      yellow: "Write one sentence about what gave your day meaning",
      orange: "Open a simple purpose reflection prompt",
    },
    peace: {
      green: "Explore an advanced guided meditation",
      yellow: "Do a 5-minute breathing exercise",
      orange: "Start a 1-minute calm reset",
    },
    mindfulness: {
      green: "Try a mindful walk with full attention to your senses",
      yellow: "Take three 1-minute pause-and-notice breaks today",
      orange: "Do a 60-second body scan right now",
    },
    connection: {
      green: "Share a gratitude message with someone you care about",
      yellow: "Express gratitude to one person today",
      orange: "Think of someone who cares about you — send them a kind thought",
    },
    practice: {
      green: "Try a longer meditation or a new practice type",
      yellow: "Do your daily 1-minute reset practice",
      orange: "Just tap the 1-minute reset button — that's enough for today",
    },
  };

  const bandKey = band === "green" ? "green" : band === "yellow" ? "yellow" : "orange";
  return suggestions[domain][bandKey];
}

// ─── Trigger Responses ──────────────────────────────────────────

function getTriggerResponse(trigger: string, band: SpiritualBand): string | null {
  if (band === "red") return null;

  const responses: Record<string, string> = {
    work: "Work stress is common — a brief breathing break between tasks can help.",
    conflict: "Conflicts are hard. A moment of stillness can help you respond rather than react.",
    phone_overload: "Try a 5-minute phone-free breathing pause to reset.",
    loneliness: "Connection matters. Consider reaching out to someone or joining a community session.",
    worry: "When worry builds, grounding exercises can bring you back to the present moment.",
    health: "Health concerns are stressful. Be gentle with yourself and prioritize rest.",
    other: "Whatever you're facing, even one minute of calm can make a difference.",
  };

  return responses[trigger] ?? null;
}

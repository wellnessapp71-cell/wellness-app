/**
 * Intervention recommender.
 *
 * Given a stress level (from rPPG scan or manual check-in),
 * recommend 3-5 calming interventions ranked by relevance.
 */

import type {
  InterventionType,
  InterventionRecommendation,
  MentalBaseline,
} from "@aura/types";

import { classifyStressLevel, type StressLevel } from "./rppg-processor";

// ─── Intervention Database ──────────────────────────────────────

interface InterventionDef {
  type: InterventionType;
  title: string;
  description: string;
  durationMinutes: number;
  stressLevels: StressLevel[];   // which stress levels this is recommended for
  basePriority: number;           // lower = higher priority
}

const INTERVENTIONS: InterventionDef[] = [
  {
    type: "breathing",
    title: "Guided Breathing",
    description: "4-7-8 pattern breathing to activate your parasympathetic nervous system and reduce acute stress.",
    durationMinutes: 3,
    stressLevels: ["moderate", "high", "critical"],
    basePriority: 1,
  },
  {
    type: "grounding",
    title: "5-4-3-2-1 Grounding",
    description: "Engage your five senses to anchor yourself in the present moment and interrupt anxious thought loops.",
    durationMinutes: 5,
    stressLevels: ["high", "critical"],
    basePriority: 2,
  },
  {
    type: "body_scan",
    title: "Body Scan Relaxation",
    description: "Progressive muscle awareness from feet to head, releasing tension stored in your body.",
    durationMinutes: 5,
    stressLevels: ["moderate", "high"],
    basePriority: 3,
  },
  {
    type: "calm_audio",
    title: "Calming Sounds",
    description: "Nature soundscapes — rain, ocean waves, or forest ambiance — to create a peaceful environment.",
    durationMinutes: 3,
    stressLevels: ["low", "moderate", "high"],
    basePriority: 4,
  },
  {
    type: "journal_prompt",
    title: "Quick Journal",
    description: "Write one sentence about how you feel right now. Externalizing thoughts reduces their intensity.",
    durationMinutes: 2,
    stressLevels: ["low", "moderate"],
    basePriority: 5,
  },
];

// ─── Recommendation Engine ──────────────────────────────────────

/**
 * Recommend interventions based on a stress index (0-100).
 * Returns 3-5 recommendations sorted by priority.
 */
export function recommendInterventionsByStress(
  stressIndex: number,
  userPreferences?: InterventionType[]
): InterventionRecommendation[] {
  const stressLevel = classifyStressLevel(stressIndex);
  return recommendInterventionsByLevel(stressLevel, userPreferences);
}

/**
 * Recommend interventions based on a classified stress level.
 */
export function recommendInterventionsByLevel(
  stressLevel: StressLevel,
  userPreferences?: InterventionType[]
): InterventionRecommendation[] {
  // Filter to interventions suitable for this stress level
  const suitable = INTERVENTIONS.filter((i) =>
    i.stressLevels.includes(stressLevel)
  );

  // Score and sort
  const scored = suitable.map((intervention) => {
    let priority = intervention.basePriority;

    // Boost priority if user prefers this type
    if (userPreferences?.includes(intervention.type)) {
      priority -= 2; // lower = more preferred
    }

    // Boost breathing and grounding for critical stress
    if (
      stressLevel === "critical" &&
      (intervention.type === "breathing" || intervention.type === "grounding")
    ) {
      priority -= 1;
    }

    const reason = generateReason(intervention.type, stressLevel);

    return {
      type: intervention.type,
      title: intervention.title,
      description: intervention.description,
      durationMinutes: intervention.durationMinutes,
      priority: Math.max(1, priority),
      reason,
    };
  });

  // Sort by priority (ascending = more important first)
  scored.sort((a, b) => a.priority - b.priority);

  // Renumber priorities to be 1-N
  return scored.map((r, i) => ({ ...r, priority: i + 1 })).slice(0, 5);
}

/**
 * Get the single best intervention for a given stress index.
 */
export function getBestIntervention(
  stressIndex: number,
  userPreferences?: InterventionType[]
): InterventionRecommendation {
  const recommendations = recommendInterventionsByStress(stressIndex, userPreferences);
  return recommendations[0] ?? {
    type: "breathing",
    title: "Guided Breathing",
    description: "Take a moment to breathe deeply and center yourself.",
    durationMinutes: 3,
    priority: 1,
    reason: "Breathing exercises help regulate your nervous system.",
  };
}

/**
 * Recommend interventions using baseline preferences + current state.
 */
export function recommendForUser(
  baseline: MentalBaseline,
  currentStressIndex: number
): InterventionRecommendation[] {
  return recommendInterventionsByStress(
    currentStressIndex,
    baseline.calmingPreferences
  );
}

// ─── Reason Generation ──────────────────────────────────────────

function generateReason(type: InterventionType, level: StressLevel): string {
  switch (type) {
    case "breathing":
      if (level === "critical") {
        return "Your stress is significantly elevated. Controlled breathing is the fastest way to activate your relaxation response.";
      }
      return "Breathing exercises help lower your heart rate and reduce cortisol levels.";

    case "grounding":
      if (level === "critical") {
        return "Grounding can interrupt the fight-or-flight response by re-engaging your sensory awareness.";
      }
      return "The 5-4-3-2-1 technique helps anchor you in the present moment.";

    case "body_scan":
      return "A body scan helps you identify and release physical tension you may not be aware of.";

    case "calm_audio":
      if (level === "low") {
        return "Ambient sounds can help maintain your relaxed state and improve focus.";
      }
      return "Nature sounds help reduce cortisol and create a calming environment.";

    case "journal_prompt":
      return "Writing about your feelings externalizes them, reducing their emotional intensity.";
  }
}

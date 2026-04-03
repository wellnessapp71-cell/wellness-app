/**
 * GET /api/mental/content — Get learning library modules
 *
 * Returns a static catalog of mental wellness learning content.
 * In production, these would be stored in a CMS or database.
 */

import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";

interface LearningModuleDef {
  moduleId: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: string;
  recommendedTimeOfDay: string;
  order: number;
}

const LEARNING_MODULES: LearningModuleDef[] = [
  {
    moduleId: "stress_basics",
    title: "Understanding Stress",
    description: "Learn what stress does to your body and mind, and why some stress is actually helpful.",
    category: "stress",
    duration: "5 min",
    difficulty: "beginner",
    recommendedTimeOfDay: "morning",
    order: 1,
  },
  {
    moduleId: "breathing_101",
    title: "Breathing Techniques 101",
    description: "Master three proven breathing patterns: box breathing, 4-7-8, and slow diaphragmatic breathing.",
    category: "stress",
    duration: "8 min",
    difficulty: "beginner",
    recommendedTimeOfDay: "anytime",
    order: 2,
  },
  {
    moduleId: "sleep_hygiene",
    title: "Sleep Hygiene Foundations",
    description: "Build a bedtime routine that signals your brain to wind down. Covers blue light, temperature, and timing.",
    category: "sleep",
    duration: "7 min",
    difficulty: "beginner",
    recommendedTimeOfDay: "evening",
    order: 3,
  },
  {
    moduleId: "emotional_regulation_101",
    title: "Emotional Regulation Basics",
    description: "Learn to notice, name, and navigate emotions without being overwhelmed by them.",
    category: "emotional_regulation",
    duration: "10 min",
    difficulty: "beginner",
    recommendedTimeOfDay: "morning",
    order: 4,
  },
  {
    moduleId: "boundary_setting",
    title: "Setting Healthy Boundaries",
    description: "How to say no, protect your energy, and maintain relationships while respecting your limits.",
    category: "boundaries",
    duration: "8 min",
    difficulty: "intermediate",
    recommendedTimeOfDay: "morning",
    order: 5,
  },
  {
    moduleId: "anxiety_management",
    title: "Managing Anxiety",
    description: "Cognitive reframing, worry scheduling, and exposure basics to reduce the grip of anxiety.",
    category: "stress",
    duration: "12 min",
    difficulty: "intermediate",
    recommendedTimeOfDay: "morning",
    order: 6,
  },
  {
    moduleId: "self_worth",
    title: "Building Self-Worth",
    description: "Challenge inner critics with evidence-based exercises. Self-compassion practices included.",
    category: "self_worth",
    duration: "10 min",
    difficulty: "intermediate",
    recommendedTimeOfDay: "morning",
    order: 7,
  },
  {
    moduleId: "grief_processing",
    title: "Processing Grief & Loss",
    description: "Understanding the stages of grief. Journaling prompts and self-care strategies during loss.",
    category: "grief",
    duration: "12 min",
    difficulty: "intermediate",
    recommendedTimeOfDay: "evening",
    order: 8,
  },
  {
    moduleId: "building_resilience",
    title: "Building Resilience",
    description: "Develop adaptive coping skills, growth mindset, and post-adversity recovery strategies.",
    category: "resilience",
    duration: "10 min",
    difficulty: "intermediate",
    recommendedTimeOfDay: "morning",
    order: 9,
  },
  {
    moduleId: "sleep_advanced",
    title: "Advanced Sleep Optimization",
    description: "Sleep debt, circadian rhythm alignment, and when to seek professional sleep assessment.",
    category: "sleep",
    duration: "10 min",
    difficulty: "advanced",
    recommendedTimeOfDay: "evening",
    order: 10,
  },
  {
    moduleId: "mindfulness_daily",
    title: "Daily Mindfulness Practice",
    description: "A 5-minute daily mindfulness routine you can do anywhere. Builds awareness and reduces reactivity.",
    category: "emotional_regulation",
    duration: "5 min",
    difficulty: "beginner",
    recommendedTimeOfDay: "morning",
    order: 11,
  },
  {
    moduleId: "relationship_wellness",
    title: "Relationship Wellness",
    description: "Communication patterns, conflict resolution, and maintaining connection under stress.",
    category: "boundaries",
    duration: "10 min",
    difficulty: "intermediate",
    recommendedTimeOfDay: "afternoon",
    order: 12,
  },
];

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  let modules = LEARNING_MODULES;
  if (category) {
    modules = modules.filter((m) => m.category === category);
  }

  return ok({
    count: modules.length,
    modules: modules.sort((a, b) => a.order - b.order),
  });
}

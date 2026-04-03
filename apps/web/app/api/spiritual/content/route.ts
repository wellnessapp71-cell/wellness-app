/**
 * GET /api/spiritual/content — Get spiritual content library
 *
 * Returns a static catalog of spiritual wellness content.
 * In production, these would be stored in a CMS or database.
 */

import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";

interface SpiritualContentDef {
  contentId: string;
  title: string;
  description: string;
  category: string;
  type: string;
  duration: string;
  difficulty: string;
  free: boolean;
  order: number;
}

const SPIRITUAL_CONTENT: SpiritualContentDef[] = [
  {
    contentId: "meditation_101",
    title: "Introduction to Meditation",
    description: "A gentle guide to starting a meditation practice. Learn to sit, breathe, and be present.",
    category: "silent_sitting",
    type: "meditation",
    duration: "5 min",
    difficulty: "beginner",
    free: true,
    order: 1,
  },
  {
    contentId: "breathwork_basics",
    title: "Breathwork Fundamentals",
    description: "Master box breathing, 4-7-8, and calm breath techniques for instant stress relief.",
    category: "stress_release",
    type: "breathwork",
    duration: "8 min",
    difficulty: "beginner",
    free: true,
    order: 2,
  },
  {
    contentId: "gratitude_practice",
    title: "Daily Gratitude Practice",
    description: "Transform your mindset with a simple daily gratitude ritual. Includes guided prompts.",
    category: "gratitude",
    type: "journaling",
    duration: "5 min",
    difficulty: "beginner",
    free: true,
    order: 3,
  },
  {
    contentId: "guided_meditation",
    title: "Guided Relaxation Meditation",
    description: "A soothing guided meditation to release tension and find inner peace.",
    category: "stress_release",
    type: "meditation",
    duration: "10 min",
    difficulty: "beginner",
    free: true,
    order: 4,
  },
  {
    contentId: "bedtime_calm",
    title: "Bedtime Calm Routine",
    description: "Wind down with a gentle body scan and breathing exercise designed for better sleep.",
    category: "sleep",
    type: "meditation",
    duration: "12 min",
    difficulty: "beginner",
    free: true,
    order: 5,
  },
  {
    contentId: "body_awareness",
    title: "Body Awareness Check-In",
    description: "Learn to tune into physical sensations and develop mindful body awareness.",
    category: "self_compassion",
    type: "meditation",
    duration: "7 min",
    difficulty: "beginner",
    free: true,
    order: 6,
  },
  {
    contentId: "purpose_journaling",
    title: "Finding Your Purpose",
    description: "Guided journaling prompts to explore your values, passions, and sense of meaning.",
    category: "gratitude",
    type: "journaling",
    duration: "10 min",
    difficulty: "intermediate",
    free: true,
    order: 7,
  },
  {
    contentId: "values_alignment",
    title: "Values Alignment Journal",
    description: "Reflect on whether your daily actions align with your core values.",
    category: "self_compassion",
    type: "journaling",
    duration: "8 min",
    difficulty: "intermediate",
    free: false,
    order: 8,
  },
  {
    contentId: "advanced_meditation",
    title: "Advanced Meditation Techniques",
    description: "Explore loving-kindness, visualization, and open awareness meditation.",
    category: "silent_sitting",
    type: "meditation",
    duration: "20 min",
    difficulty: "advanced",
    free: false,
    order: 9,
  },
  {
    contentId: "chakra_exploration",
    title: "Chakra Energy Awareness",
    description: "A guided tour through the seven chakras with meditation and breathwork.",
    category: "chakra",
    type: "meditation",
    duration: "15 min",
    difficulty: "advanced",
    free: false,
    order: 10,
  },
  {
    contentId: "nature_walk",
    title: "Mindful Nature Walk",
    description: "Transform your daily walk into a mindfulness practice. Notice, breathe, connect.",
    category: "focus",
    type: "nature",
    duration: "15 min",
    difficulty: "beginner",
    free: true,
    order: 11,
  },
  {
    contentId: "anxiety_breathing",
    title: "Breathing for Anxiety Relief",
    description: "Specific breathing patterns designed to calm the nervous system during anxiety.",
    category: "anxiety_relief",
    type: "breathwork",
    duration: "6 min",
    difficulty: "beginner",
    free: true,
    order: 12,
  },
  {
    contentId: "quick_calm_reset",
    title: "1-Minute Calm Reset",
    description: "When everything feels overwhelming, this 60-second practice brings you back.",
    category: "stress_release",
    type: "breathwork",
    duration: "1 min",
    difficulty: "beginner",
    free: true,
    order: 0,
  },
  {
    contentId: "kindness_challenge",
    title: "7-Day Kindness Challenge",
    description: "Small daily acts of kindness that boost your sense of connection and meaning.",
    category: "self_compassion",
    type: "kindness_act",
    duration: "5 min/day",
    difficulty: "beginner",
    free: true,
    order: 13,
  },
];

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const type = url.searchParams.get("type");
  const freeOnly = url.searchParams.get("free") === "true";

  let content = SPIRITUAL_CONTENT;
  if (category) {
    content = content.filter((c) => c.category === category);
  }
  if (type) {
    content = content.filter((c) => c.type === type);
  }
  if (freeOnly) {
    content = content.filter((c) => c.free);
  }

  return ok({
    count: content.length,
    content: content.sort((a, b) => a.order - b.order),
  });
}

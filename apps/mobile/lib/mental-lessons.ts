import type {
  LearningCategory,
  LearningDifficulty,
  LearningModule,
  LearningTime,
} from "@aura/types";

type GeneratedLessonJson = {
  title: string;
  slides: Array<{
    text: string;
    audio: string;
  }>;
};

export interface LessonSlide {
  text: string;
  audio: number;
}

export interface MentalLessonModule extends LearningModule {
  slides: LessonSlide[];
}

type ModuleMeta = {
  moduleId: string;
  title: string;
  description: string;
  category: LearningCategory;
  duration: string;
  difficulty: LearningDifficulty;
  recommendedTimeOfDay: LearningTime;
  order: number;
};

const understandingStress = require("../../../data/understanding_stress.json") as GeneratedLessonJson;
const breathingTechniques = require("../../../data/breathing_techniques_101.json") as GeneratedLessonJson;
const sleepHygiene = require("../../../data/sleep_hygiene_foundations.json") as GeneratedLessonJson;
const emotionalRegulation = require("../../../data/emotional_regulation_basics.json") as GeneratedLessonJson;
const healthyBoundaries = require("../../../data/setting_healthy_boundaries.json") as GeneratedLessonJson;
const managingAnxiety = require("../../../data/managing_anxiety.json") as GeneratedLessonJson;
const selfWorth = require("../../../data/building_self_worth.json") as GeneratedLessonJson;
const griefLoss = require("../../../data/processing_grief_loss.json") as GeneratedLessonJson;
const resilience = require("../../../data/building_resilience.json") as GeneratedLessonJson;
const advancedSleep = require("../../../data/advanced_sleep_optimization.json") as GeneratedLessonJson;
const mindfulness = require("../../../data/daily_mindfulness_practice.json") as GeneratedLessonJson;
const relationships = require("../../../data/relationship_wellness.json") as GeneratedLessonJson;

const META: ModuleMeta[] = [
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

const LESSON_ASSETS: Record<string, { json: GeneratedLessonJson; audio: number[] }> = {
  stress_basics: {
    json: understandingStress,
    audio: [
      require("../../../audio/understanding_stress_0.mp3"),
      require("../../../audio/understanding_stress_1.mp3"),
      require("../../../audio/understanding_stress_2.mp3"),
      require("../../../audio/understanding_stress_3.mp3"),
      require("../../../audio/understanding_stress_4.mp3"),
      require("../../../audio/understanding_stress_5.mp3"),
    ],
  },
  breathing_101: {
    json: breathingTechniques,
    audio: [
      require("../../../audio/breathing_techniques_101_0.mp3"),
      require("../../../audio/breathing_techniques_101_1.mp3"),
      require("../../../audio/breathing_techniques_101_2.mp3"),
      require("../../../audio/breathing_techniques_101_3.mp3"),
      require("../../../audio/breathing_techniques_101_4.mp3"),
      require("../../../audio/breathing_techniques_101_5.mp3"),
    ],
  },
  sleep_hygiene: {
    json: sleepHygiene,
    audio: [
      require("../../../audio/sleep_hygiene_foundations_0.mp3"),
      require("../../../audio/sleep_hygiene_foundations_1.mp3"),
      require("../../../audio/sleep_hygiene_foundations_2.mp3"),
      require("../../../audio/sleep_hygiene_foundations_3.mp3"),
      require("../../../audio/sleep_hygiene_foundations_4.mp3"),
      require("../../../audio/sleep_hygiene_foundations_5.mp3"),
    ],
  },
  emotional_regulation_101: {
    json: emotionalRegulation,
    audio: [
      require("../../../audio/emotional_regulation_basics_0.mp3"),
      require("../../../audio/emotional_regulation_basics_1.mp3"),
      require("../../../audio/emotional_regulation_basics_2.mp3"),
      require("../../../audio/emotional_regulation_basics_3.mp3"),
      require("../../../audio/emotional_regulation_basics_4.mp3"),
      require("../../../audio/emotional_regulation_basics_5.mp3"),
    ],
  },
  boundary_setting: {
    json: healthyBoundaries,
    audio: [
      require("../../../audio/setting_healthy_boundaries_0.mp3"),
      require("../../../audio/setting_healthy_boundaries_1.mp3"),
      require("../../../audio/setting_healthy_boundaries_2.mp3"),
      require("../../../audio/setting_healthy_boundaries_3.mp3"),
      require("../../../audio/setting_healthy_boundaries_4.mp3"),
      require("../../../audio/setting_healthy_boundaries_5.mp3"),
    ],
  },
  anxiety_management: {
    json: managingAnxiety,
    audio: [
      require("../../../audio/managing_anxiety_0.mp3"),
      require("../../../audio/managing_anxiety_1.mp3"),
      require("../../../audio/managing_anxiety_2.mp3"),
      require("../../../audio/managing_anxiety_3.mp3"),
      require("../../../audio/managing_anxiety_4.mp3"),
      require("../../../audio/managing_anxiety_5.mp3"),
    ],
  },
  self_worth: {
    json: selfWorth,
    audio: [
      require("../../../audio/building_self_worth_0.mp3"),
      require("../../../audio/building_self_worth_1.mp3"),
      require("../../../audio/building_self_worth_2.mp3"),
      require("../../../audio/building_self_worth_3.mp3"),
      require("../../../audio/building_self_worth_4.mp3"),
      require("../../../audio/building_self_worth_5.mp3"),
    ],
  },
  grief_processing: {
    json: griefLoss,
    audio: [
      require("../../../audio/processing_grief_loss_0.mp3"),
      require("../../../audio/processing_grief_loss_1.mp3"),
      require("../../../audio/processing_grief_loss_2.mp3"),
      require("../../../audio/processing_grief_loss_3.mp3"),
      require("../../../audio/processing_grief_loss_4.mp3"),
      require("../../../audio/processing_grief_loss_5.mp3"),
    ],
  },
  building_resilience: {
    json: resilience,
    audio: [
      require("../../../audio/building_resilience_0.mp3"),
      require("../../../audio/building_resilience_1.mp3"),
      require("../../../audio/building_resilience_2.mp3"),
      require("../../../audio/building_resilience_3.mp3"),
      require("../../../audio/building_resilience_4.mp3"),
      require("../../../audio/building_resilience_5.mp3"),
    ],
  },
  sleep_advanced: {
    json: advancedSleep,
    audio: [
      require("../../../audio/advanced_sleep_optimization_0.mp3"),
      require("../../../audio/advanced_sleep_optimization_1.mp3"),
      require("../../../audio/advanced_sleep_optimization_2.mp3"),
      require("../../../audio/advanced_sleep_optimization_3.mp3"),
      require("../../../audio/advanced_sleep_optimization_4.mp3"),
      require("../../../audio/advanced_sleep_optimization_5.mp3"),
    ],
  },
  mindfulness_daily: {
    json: mindfulness,
    audio: [
      require("../../../audio/daily_mindfulness_practice_0.mp3"),
      require("../../../audio/daily_mindfulness_practice_1.mp3"),
      require("../../../audio/daily_mindfulness_practice_2.mp3"),
      require("../../../audio/daily_mindfulness_practice_3.mp3"),
      require("../../../audio/daily_mindfulness_practice_4.mp3"),
      require("../../../audio/daily_mindfulness_practice_5.mp3"),
    ],
  },
  relationship_wellness: {
    json: relationships,
    audio: [
      require("../../../audio/relationship_wellness_0.mp3"),
      require("../../../audio/relationship_wellness_1.mp3"),
      require("../../../audio/relationship_wellness_2.mp3"),
      require("../../../audio/relationship_wellness_3.mp3"),
      require("../../../audio/relationship_wellness_4.mp3"),
      require("../../../audio/relationship_wellness_5.mp3"),
    ],
  },
};

function buildLessonSlides(moduleId: string): LessonSlide[] {
  const lesson = LESSON_ASSETS[moduleId];
  return lesson.json.slides.map((slide, index) => ({
    text: slide.text,
    audio: lesson.audio[index],
  }));
}

export const MENTAL_LESSONS: MentalLessonModule[] = META.map((module) => ({
  ...module,
  title: LESSON_ASSETS[module.moduleId].json.title || module.title,
  content: "",
  slides: buildLessonSlides(module.moduleId),
}));

export const MENTAL_LESSONS_BY_ID: Record<string, MentalLessonModule> = Object.fromEntries(
  MENTAL_LESSONS.map((lesson) => [lesson.moduleId, lesson]),
);

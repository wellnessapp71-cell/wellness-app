/**
 * Lifestyle onboarding question bank — 36 measurable questions across 7 domains.
 *
 * Each question has 5 options scored 0-4 (Very Low=0, Low=1, Moderate=2, High=3, Very High=4).
 * Reverse-scored items: higher raw value = worse habit, so scoring is inverted.
 *
 * Aligned with PRD v2 balanced measurable model.
 */

import type { LifestyleQuestion } from "@aura/types";

// ── A. Sleep and Recovery (7 questions) ─────────────────────────

const SLEEP_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "sleep_1",
    domain: "sleep",
    text: "How many hours did you sleep last night?",
    options: [
      { label: "Less than 5", value: 0 },
      { label: "5–6", value: 1 },
      { label: "6–7", value: 2 },
      { label: "7–8", value: 3 },
      { label: "8+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "sleep_2",
    domain: "sleep",
    text: "How consistent is your bedtime?",
    options: [
      { label: "Very inconsistent", value: 0 },
      { label: "Inconsistent", value: 1 },
      { label: "Somewhat consistent", value: 2 },
      { label: "Mostly consistent", value: 3 },
      { label: "Very consistent", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "sleep_3",
    domain: "sleep",
    text: "How many times do you wake up during the night?",
    options: [
      { label: "4+", value: 0 },
      { label: "3", value: 1 },
      { label: "2", value: 2 },
      { label: "1", value: 3 },
      { label: "0", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "sleep_4",
    domain: "sleep",
    text: "Do you use screens in the 30 minutes before bed?",
    options: [
      { label: "Every night", value: 0 },
      { label: "Often", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Rarely", value: 3 },
      { label: "Never", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "sleep_5",
    domain: "sleep",
    text: "Do you consume caffeine or alcohol within 6 hours of sleep?",
    options: [
      { label: "Very often", value: 0 },
      { label: "Often", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Rarely", value: 3 },
      { label: "Never", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "sleep_6",
    domain: "sleep",
    text: "Do you complete a wind-down routine before bed?",
    options: [
      { label: "No", value: 0 },
      { label: "Partly", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Mostly", value: 3 },
      { label: "Fully", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "sleep_7",
    domain: "sleep",
    text: "How restorative is your sleep?",
    options: [
      { label: "Poor", value: 0 },
      { label: "Fair", value: 1 },
      { label: "Moderate", value: 2 },
      { label: "Good", value: 3 },
      { label: "Excellent", value: 4 },
    ],
    reverseScored: false,
  },
];

// ── B. Nutrition and Meal Quality (8 questions) ─────────────────

const NUTRITION_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "nutr_1",
    domain: "nutrition",
    text: "How many meals did you eat today?",
    options: [
      { label: "0", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "nutr_2",
    domain: "nutrition",
    text: "How many fruit servings did you eat today?",
    options: [
      { label: "0", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "nutr_3",
    domain: "nutrition",
    text: "How many vegetable servings did you eat today?",
    options: [
      { label: "0", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "nutr_4",
    domain: "nutrition",
    text: "How many meals contained protein and fiber?",
    options: [
      { label: "0", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "nutr_5",
    domain: "nutrition",
    text: "How many ultra-processed food servings did you eat today?",
    options: [
      { label: "4+", value: 0 },
      { label: "3", value: 1 },
      { label: "2", value: 2 },
      { label: "1", value: 3 },
      { label: "0", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "nutr_6",
    domain: "nutrition",
    text: "How many sugary drinks or desserts did you have today?",
    options: [
      { label: "4+", value: 0 },
      { label: "3", value: 1 },
      { label: "2", value: 2 },
      { label: "1", value: 3 },
      { label: "0", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "nutr_7",
    domain: "nutrition",
    text: "How many times did you eat after 9 PM?",
    options: [
      { label: "3+", value: 0 },
      { label: "2", value: 1 },
      { label: "1", value: 2 },
      { label: "0", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "nutr_8",
    domain: "nutrition",
    text: "Did stress change how you ate today?",
    options: [
      { label: "Very strongly", value: 0 },
      { label: "Strongly", value: 1 },
      { label: "Moderately", value: 2 },
      { label: "Slightly", value: 3 },
      { label: "No", value: 4 },
    ],
    reverseScored: true,
  },
];

// ── C. Hydration (4 questions) ──────────────────────────────────

const HYDRATION_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "hydr_1",
    domain: "hydration",
    text: "How much water or healthy fluid did you drink today?",
    options: [
      { label: "Very Low", value: 0 },
      { label: "Low", value: 1 },
      { label: "Moderate", value: 2 },
      { label: "High", value: 3 },
      { label: "Very High", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "hydr_2",
    domain: "hydration",
    text: "How many times did you drink water before noon?",
    options: [
      { label: "0", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "hydr_3",
    domain: "hydration",
    text: "How many hours passed between your first and last drink today?",
    options: [
      { label: "Under 4 hours", value: 0 },
      { label: "4–6 hours", value: 1 },
      { label: "6–10 hours", value: 2 },
      { label: "10–14 hours", value: 3 },
      { label: "14+ hours (spread all day)", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "hydr_4",
    domain: "hydration",
    text: "Did you meet your water goal today?",
    options: [
      { label: "No", value: 0 },
      { label: "Partly", value: 1 },
      { label: "Mostly", value: 2 },
      { label: "Yes", value: 3 },
      { label: "Exceeded", value: 4 },
    ],
    reverseScored: false,
  },
];

// ── D. Movement and Sedentary Balance (5 questions) ─────────────

const MOVEMENT_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "move_1",
    domain: "movement",
    text: "How many steps did you take today?",
    options: [
      { label: "Under 1,000", value: 0 },
      { label: "1,000–3,000", value: 1 },
      { label: "3,000–5,000", value: 2 },
      { label: "5,000–7,000", value: 3 },
      { label: "7,000+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "move_2",
    domain: "movement",
    text: "How many minutes of moderate activity did you do today?",
    options: [
      { label: "0", value: 0 },
      { label: "1–10", value: 1 },
      { label: "10–20", value: 2 },
      { label: "20–30", value: 3 },
      { label: "30+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "move_3",
    domain: "movement",
    text: "How many minutes did you sit without a break at any one time?",
    options: [
      { label: "120+", value: 0 },
      { label: "90–120", value: 1 },
      { label: "60–90", value: 2 },
      { label: "30–60", value: 3 },
      { label: "Under 30", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "move_4",
    domain: "movement",
    text: "How many movement breaks did you take today?",
    options: [
      { label: "0", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4+", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "move_5",
    domain: "movement",
    text: "Did you do strength, yoga, or mobility today?",
    options: [
      { label: "No", value: 0 },
      { label: "Light", value: 1 },
      { label: "Moderate", value: 2 },
      { label: "Good", value: 3 },
      { label: "Strong", value: 4 },
    ],
    reverseScored: false,
  },
];

// ── E. Digital Balance (4 questions) ────────────────────────────

const DIGITAL_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "digi_1",
    domain: "digital",
    text: "How many minutes of screen time did you use outside work today?",
    options: [
      { label: "240+ min", value: 0 },
      { label: "180–240 min", value: 1 },
      { label: "120–180 min", value: 2 },
      { label: "60–120 min", value: 3 },
      { label: "Under 60 min", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "digi_2",
    domain: "digital",
    text: "How many minutes of screen time did you use in the 60 minutes before bed?",
    options: [
      { label: "60+ min", value: 0 },
      { label: "31–60 min", value: 1 },
      { label: "16–30 min", value: 2 },
      { label: "1–15 min", value: 3 },
      { label: "0 min", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "digi_3",
    domain: "digital",
    text: "How many notifications did you receive after 8 PM?",
    options: [
      { label: "20+", value: 0 },
      { label: "11–20", value: 1 },
      { label: "6–10", value: 2 },
      { label: "1–5", value: 3 },
      { label: "0", value: 4 },
    ],
    reverseScored: true,
  },
  {
    id: "digi_4",
    domain: "digital",
    text: "Did you use focus mode or digital sunset today?",
    options: [
      { label: "No", value: 0 },
      { label: "Once", value: 1 },
      { label: "Partly", value: 2 },
      { label: "Mostly", value: 3 },
      { label: "Fully", value: 4 },
    ],
    reverseScored: false,
  },
];

// ── F. Nature & Light (3 questions) ─────────────────────────────

const NATURE_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "natr_1",
    domain: "nature",
    text: "How many minutes did you spend outdoors today?",
    options: [
      { label: "0", value: 0 },
      { label: "1–5 min", value: 1 },
      { label: "5–10 min", value: 2 },
      { label: "10–20 min", value: 3 },
      { label: "20+ min", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "natr_2",
    domain: "nature",
    text: "How many minutes of morning daylight did you get today?",
    options: [
      { label: "0", value: 0 },
      { label: "1–5 min", value: 1 },
      { label: "5–10 min", value: 2 },
      { label: "10–20 min", value: 3 },
      { label: "20+ min", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "natr_3",
    domain: "nature",
    text: "Did you spend at least 10 minutes outside today?",
    options: [
      { label: "No", value: 0 },
      { label: "Partly", value: 1 },
      { label: "Mostly indoors with some daylight", value: 2 },
      { label: "Yes", value: 3 },
      { label: "Yes, more than once", value: 4 },
    ],
    reverseScored: false,
  },
];

// ── G. Routine and Stability (5 questions) ──────────────────────

const ROUTINE_QUESTIONS: LifestyleQuestion[] = [
  {
    id: "rout_1",
    domain: "routine",
    text: "Did you complete a morning routine today?",
    options: [
      { label: "No", value: 0 },
      { label: "Partly", value: 1 },
      { label: "Mostly", value: 2 },
      { label: "Yes", value: 3 },
      { label: "Fully", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "rout_2",
    domain: "routine",
    text: "Did you complete an evening wind-down routine today?",
    options: [
      { label: "No", value: 0 },
      { label: "Partly", value: 1 },
      { label: "Mostly", value: 2 },
      { label: "Yes", value: 3 },
      { label: "Fully", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "rout_3",
    domain: "routine",
    text: "How many days this week did you follow the same wake time?",
    options: [
      { label: "0 days", value: 0 },
      { label: "1–2 days", value: 1 },
      { label: "3–4 days", value: 2 },
      { label: "5–6 days", value: 3 },
      { label: "7 days", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "rout_4",
    domain: "routine",
    text: "How consistent is your morning routine timing?",
    options: [
      { label: "No stable routine", value: 0 },
      { label: "Major drift", value: 1 },
      { label: "Minor drift", value: 2 },
      { label: "Mostly consistent", value: 3 },
      { label: "Very consistent", value: 4 },
    ],
    reverseScored: false,
  },
  {
    id: "rout_5",
    domain: "routine",
    text: "How consistent is your evening routine timing?",
    options: [
      { label: "No routine", value: 0 },
      { label: "Late or inconsistent", value: 1 },
      { label: "Some drift", value: 2 },
      { label: "Mostly consistent", value: 3 },
      { label: "Consistent and early enough for sleep", value: 4 },
    ],
    reverseScored: false,
  },
];

// ── Assembled question bank ─────────────────────────────────────

/**
 * All 36 lifestyle onboarding questions, grouped by domain.
 * Order: Sleep(7) → Nutrition(8) → Hydration(4) → Movement(5)
 *        → Digital(4) → Nature(3) → Routine(5)
 */
export const LIFESTYLE_QUESTIONS: LifestyleQuestion[] = [
  ...SLEEP_QUESTIONS,
  ...NUTRITION_QUESTIONS,
  ...HYDRATION_QUESTIONS,
  ...MOVEMENT_QUESTIONS,
  ...DIGITAL_QUESTIONS,
  ...NATURE_QUESTIONS,
  ...ROUTINE_QUESTIONS,
];

/** Question count per domain (for indexing into rawAnswers). */
export const DOMAIN_QUESTION_COUNTS = {
  sleep: 7,
  nutrition: 8,
  hydration: 4,
  movement: 5,
  digital: 4,
  nature: 3,
  routine: 5,
} as const;

/** Starting index in LIFESTYLE_QUESTIONS for each domain. */
export const DOMAIN_START_INDEX = {
  sleep: 0,       // 0–6
  nutrition: 7,   // 7–14
  hydration: 15,  // 15–18
  movement: 19,   // 19–23
  digital: 24,    // 24–27
  nature: 28,     // 28–30
  routine: 31,    // 31–35
} as const;

export const TOTAL_QUESTIONS = 36;

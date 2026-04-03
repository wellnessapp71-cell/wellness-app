import type {
  FitnessAssessmentExerciseScore,
  FitnessAssessmentInput,
  FitnessAssessmentResult,
  FitnessLevel,
} from "@aura/types";

const ASSESSMENT_QUESTIONS = {
  push_ups: {
    responseKey: "pushUps",
    weights: { male: 1, female: 1.2, other: 1.1 },
    scoring: {
      beginner: [0, 10],
      intermediate: [11, 25],
      advanced: [26, 50],
      expert: [51, 100],
    },
  },
  pull_ups: {
    responseKey: "pullUps",
    weights: { male: 1, female: 1.5, other: 1.25 },
    scoring: {
      beginner: [0, 3],
      intermediate: [4, 8],
      advanced: [9, 15],
      expert: [16, 30],
    },
  },
  squats: {
    responseKey: "squats",
    weights: { male: 1, female: 1, other: 1 },
    scoring: {
      beginner: [0, 15],
      intermediate: [16, 30],
      advanced: [31, 50],
      expert: [51, 100],
    },
  },
  plank: {
    responseKey: "plankSeconds",
    weights: { male: 1, female: 1.1, other: 1.05 },
    scoring: {
      beginner: [0, 30],
      intermediate: [31, 60],
      advanced: [61, 120],
      expert: [121, 300],
    },
  },
  burpees: {
    responseKey: "burpees",
    weights: { male: 1, female: 1.2, other: 1.1 },
    scoring: {
      beginner: [0, 5],
      intermediate: [6, 12],
      advanced: [13, 20],
      expert: [21, 35],
    },
  },
} as const;

const FITNESS_LEVELS: Record<FitnessLevel, { min: number; max: number; description: string }> = {
  beginner: { min: 0, max: 30, description: "Just starting your fitness journey." },
  intermediate: { min: 31, max: 60, description: "Regular exerciser with a solid foundation." },
  advanced: { min: 61, max: 85, description: "Experienced and strong." },
  expert: { min: 86, max: 100, description: "Elite fitness level." },
};

const RECOMMENDATIONS: Record<FitnessLevel, string[]> = {
  beginner: [
    "Start with basic bodyweight exercises.",
    "Focus on form before intensity.",
    "Aim for 3 to 4 workouts per week.",
  ],
  intermediate: [
    "Add structured resistance training.",
    "Increase training frequency gradually.",
    "Use progressive overload.",
  ],
  advanced: [
    "Use more advanced programming and recovery.",
    "Cycle intensity across the week.",
    "Track performance closely.",
  ],
  expert: [
    "Use elite training protocols.",
    "Plan deloads and recovery intentionally.",
    "Train with a clear performance goal.",
  ],
};

export function assessFitness(input: FitnessAssessmentInput): FitnessAssessmentResult {
  const exerciseScores = (Object.keys(ASSESSMENT_QUESTIONS) as Array<keyof typeof ASSESSMENT_QUESTIONS>).map(
    (exercise) => {
      const config = ASSESSMENT_QUESTIONS[exercise];
      const rawValue = input.responses[config.responseKey];
      const score = calculateExerciseScore(exercise, rawValue, input.gender);

      return {
        exercise,
        rawValue,
        score,
      } satisfies FitnessAssessmentExerciseScore;
    },
  );

  const overallScore = round(
    exerciseScores.reduce((total, item) => total + item.score, 0) / exerciseScores.length,
  );
  const fitnessLevel = determineFitnessLevel(overallScore);

  return {
    fitnessLevel,
    overallScore,
    exerciseScores,
    recommendations: RECOMMENDATIONS[fitnessLevel],
  };
}

export function calculateExerciseScore(
  exercise: keyof typeof ASSESSMENT_QUESTIONS,
  rawValue: number,
  gender: FitnessAssessmentInput["gender"],
): number {
  const config = ASSESSMENT_QUESTIONS[exercise];
  const adjustedValue = rawValue * config.weights[gender];
  const { beginner, intermediate, advanced, expert } = config.scoring;

  if (adjustedValue <= beginner[1]) {
    return clamp(beginner[1] > 0 ? (adjustedValue / beginner[1]) * 20 : 0);
  }

  if (adjustedValue <= intermediate[1]) {
    const range = intermediate[1] - intermediate[0];
    return clamp(20 + ((adjustedValue - beginner[1]) / range) * 25);
  }

  if (adjustedValue <= advanced[1]) {
    const range = advanced[1] - advanced[0];
    return clamp(45 + ((adjustedValue - intermediate[1]) / range) * 25);
  }

  const range = expert[1] - expert[0];
  return clamp(70 + Math.min(30, ((adjustedValue - advanced[1]) / range) * 30));
}

export function determineFitnessLevel(score: number): FitnessLevel {
  return (
    (Object.keys(FITNESS_LEVELS) as FitnessLevel[]).find((level) => {
      const bounds = FITNESS_LEVELS[level];
      return score >= bounds.min && score <= bounds.max;
    }) ?? "beginner"
  );
}

export function getFitnessLevelRequirements(level: FitnessLevel): Record<string, { min: number; max: number }> {
  return Object.fromEntries(
    (Object.entries(ASSESSMENT_QUESTIONS) as Array<[
      keyof typeof ASSESSMENT_QUESTIONS,
      (typeof ASSESSMENT_QUESTIONS)[keyof typeof ASSESSMENT_QUESTIONS],
    ]>).map(([exercise, config]) => [
      exercise,
      { min: config.scoring[level][0], max: config.scoring[level][1] },
    ]),
  );
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, round(value)));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

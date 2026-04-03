import type {
  FitnessLevel,
  GoalType,
  YogaAssessmentInput,
  YogaAssessmentResult,
  YogaAssessmentCategory,
} from "@aura/types";
import { YOGA_GOALS_BY_LEVEL } from "./poses";

const YOGA_LEVEL_DESCRIPTIONS: Record<FitnessLevel, string> = {
  beginner: "New to yoga, building a foundation.",
  intermediate: "Regular practice with improving skills.",
  advanced: "Experienced practitioner with a strong base.",
  expert: "Master level practitioner.",
};

const LEVEL_ORDER: FitnessLevel[] = ["beginner", "intermediate", "advanced", "expert"];

const GOAL_KEY_MAP: Partial<Record<GoalType, keyof typeof YOGA_GOALS_BY_LEVEL>> = {
  flexibility: "flexibility",
  stress_reduction: "stress_reduction",
  posture: "posture",
  balance: "balance",
  core_strength: "core_strength",
  spinal_health: "spinal_health",
  detoxification: "detoxification",
};

export function assessYogaLevel(input: YogaAssessmentInput): YogaAssessmentResult {
  const yogaLevel = determineYogaLevel(input.responses);
  const recommendedPosesByGoal: YogaAssessmentResult["recommendedPosesByGoal"] = {};

  for (const [goal, key] of Object.entries(GOAL_KEY_MAP) as Array<[GoalType, keyof typeof YOGA_GOALS_BY_LEVEL]>) {
    const poses = YOGA_GOALS_BY_LEVEL[key]?.[yogaLevel];
    if (poses) {
      recommendedPosesByGoal[goal] = poses;
    }
  }

  return {
    yogaLevel,
    categoryLevels: input.responses,
    description: YOGA_LEVEL_DESCRIPTIONS[yogaLevel],
    recommendedPosesByGoal,
  };
}

export function determineYogaLevel(responses: Record<YogaAssessmentCategory, FitnessLevel>): FitnessLevel {
  const counts = new Map<FitnessLevel, number>([
    ["beginner", 0],
    ["intermediate", 0],
    ["advanced", 0],
    ["expert", 0],
  ]);

  for (const level of Object.values(responses)) {
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  const maxCount = Math.max(...counts.values());
  return LEVEL_ORDER.find((level) => counts.get(level) === maxCount) ?? "beginner";
}

export function getYogaGoalsForLevel(level: FitnessLevel): Partial<Record<GoalType, string[]>> {
  const result: Partial<Record<GoalType, string[]>> = {};
  for (const [goal, key] of Object.entries(GOAL_KEY_MAP) as Array<[GoalType, keyof typeof YOGA_GOALS_BY_LEVEL]>) {
    const poses = YOGA_GOALS_BY_LEVEL[key]?.[level];
    if (poses) {
      result[goal] = poses;
    }
  }
  return result;
}

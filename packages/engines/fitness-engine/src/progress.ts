import type {
  FitnessLevel,
  FitnessSublevel,
  WorkoutProgressSnapshot,
  WorkoutProgressSummary,
} from "@aura/types";

const LEVELS: FitnessLevel[] = ["beginner", "intermediate", "advanced", "expert"];

export function summarizeWorkoutProgress(params: {
  currentLevel: FitnessLevel;
  currentSublevel: FitnessSublevel;
  snapshot: WorkoutProgressSnapshot;
}): WorkoutProgressSummary {
  const { currentLevel, currentSublevel, snapshot } = params;
  const weeklyProgress = snapshot.nutritionOnTrack
    ? snapshot.weeklyCompletionPercentage
    : snapshot.weeklyCompletionPercentage * 0.8;

  if (weeklyProgress >= 95) {
    if (currentLevel === "beginner" && currentSublevel === 1) {
      return {
        currentLevel,
        currentSublevel,
        nextLevel: "beginner",
        nextSublevel: 2,
        currentScore: weeklyProgress,
        message: appendNutritionMessage(
          `Great week. Weekly completion ${weeklyProgress.toFixed(1)}%. Ready for Beginner 2.`,
          snapshot.nutritionOnTrack,
        ),
      };
    }

    const nextLevel =
      currentLevel === "beginner" && currentSublevel === 2
        ? "intermediate"
        : LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(currentLevel) + 1)];

    if (nextLevel === currentLevel) {
      return {
        currentLevel,
        currentSublevel,
        nextLevel: null,
        nextSublevel: null,
        currentScore: weeklyProgress,
        message: appendNutritionMessage(
          "You are already at the highest level.",
          snapshot.nutritionOnTrack,
        ),
      };
    }

    return {
      currentLevel,
      currentSublevel,
      nextLevel,
      nextSublevel: nextLevel === "expert" ? null : 1,
      currentScore: weeklyProgress,
      message: appendNutritionMessage(
        `Great week. Weekly completion ${weeklyProgress.toFixed(1)}%. Ready for ${capitalize(nextLevel)}.`,
        snapshot.nutritionOnTrack,
      ),
    };
  }

  if (weeklyProgress <= 60) {
    if (currentLevel === "beginner" && currentSublevel === 1) {
      return {
        currentLevel,
        currentSublevel,
        nextLevel: null,
        nextSublevel: null,
        currentScore: weeklyProgress,
        message: appendNutritionMessage(
          `Weekly completion ${weeklyProgress.toFixed(1)}%. Focus on consistency next week.`,
          snapshot.nutritionOnTrack,
          true,
        ),
      };
    }

    if (currentLevel === "beginner" && currentSublevel === 2) {
      return {
        currentLevel,
        currentSublevel,
        nextLevel: "beginner",
        nextSublevel: 1,
        currentScore: weeklyProgress,
        message: appendNutritionMessage(
          `Weekly completion ${weeklyProgress.toFixed(1)}%. Suggest moving to Beginner 1 for now.`,
          snapshot.nutritionOnTrack,
          true,
        ),
      };
    }

    const downgrade = LEVELS[Math.max(0, LEVELS.indexOf(currentLevel) - 1)];
    return {
      currentLevel,
      currentSublevel,
      nextLevel: downgrade,
      nextSublevel: 2,
      currentScore: weeklyProgress,
      message: appendNutritionMessage(
        `Weekly completion ${weeklyProgress.toFixed(1)}%. Suggest moving to ${capitalize(downgrade)}.`,
        snapshot.nutritionOnTrack,
        true,
      ),
    };
  }

  return {
    currentLevel,
    currentSublevel,
    nextLevel: currentLevel === "beginner" && currentSublevel === 1 ? "beginner" : null,
    nextSublevel: currentLevel === "beginner" && currentSublevel === 1 ? 2 : null,
    currentScore: weeklyProgress,
    message: appendNutritionMessage(
      `Weekly completion so far: ${weeklyProgress.toFixed(1)}%. Keep going to reach 95% by Saturday.`,
      snapshot.nutritionOnTrack,
      true,
    ),
  };
}

function appendNutritionMessage(message: string, nutritionOnTrack: boolean, recoveryTone = false): string {
  if (nutritionOnTrack) {
    return message;
  }

  return `${message}${recoveryTone ? " Also review your nutrition balance." : " Consider improving your nutrition balance for optimal results."}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

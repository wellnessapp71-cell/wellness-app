import type { WorkoutAdaptation, WorkoutExercise } from "@aura/types";

export interface FatigueState {
  currentFatigueLevel: number;
  performanceTrend: number[];
  totalVolumeCompleted: number;
  timeElapsedMinutes: number;
  strugglingExercises: string[];
}

export interface AdaptWorkoutTargetsInput {
  exerciseIndex: number;
  exercise: WorkoutExercise;
  originalExercises: WorkoutExercise[];
  fatigueState: FatigueState;
}

export interface AdaptiveTargetResult {
  fatigueLevel: number;
  adaptedSets: number;
  adaptedReps: number;
  adaptation: WorkoutAdaptation | null;
}

export function calculateFatigueImpact(state: Omit<FatigueState, "currentFatigueLevel">): number {
  if (state.performanceTrend.length === 0) {
    return 0;
  }

  const recent = state.performanceTrend.slice(-3);
  const recentPerformance = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const volumeImpact = Math.min(0.3, state.totalVolumeCompleted / 100);
  const timeImpact = Math.min(0.2, state.timeElapsedMinutes / 60);
  const struggleImpact = state.strugglingExercises.length * 0.1;
  const declineImpact =
    state.performanceTrend.length >= 2
      ? Math.max(0, state.performanceTrend[state.performanceTrend.length - 2] - state.performanceTrend[state.performanceTrend.length - 1]) * 0.5
      : 0;
  const performanceFatigue = (100 - recentPerformance) / 100;

  return clamp(performanceFatigue * 0.4 + volumeImpact + timeImpact + struggleImpact + declineImpact);
}

export function updateFatigueState(params: {
  state: FatigueState;
  actualReps: number;
  targetReps: number;
  exerciseName: string;
  timeElapsedMinutes: number;
}): FatigueState {
  const performancePercentage = params.targetReps > 0 ? (params.actualReps / params.targetReps) * 100 : 0;
  const strugglingExercises = new Set(params.state.strugglingExercises);

  if (performancePercentage < 70) {
    strugglingExercises.add(params.exerciseName);
  }

  const nextState: FatigueState = {
    currentFatigueLevel: 0,
    performanceTrend: [...params.state.performanceTrend, performancePercentage],
    totalVolumeCompleted: params.state.totalVolumeCompleted + params.actualReps,
    timeElapsedMinutes: params.timeElapsedMinutes,
    strugglingExercises: Array.from(strugglingExercises),
  };

  nextState.currentFatigueLevel = calculateFatigueImpact(nextState);
  return nextState;
}

export function adaptWorkoutTargets(input: AdaptWorkoutTargetsInput): AdaptiveTargetResult {
  const original = input.originalExercises[input.exerciseIndex] ?? input.exercise;
  const fatigueLevel = input.fatigueState.currentFatigueLevel;
  const hasStruggled = input.fatigueState.strugglingExercises.length > 0;
  const lastPerformance = input.fatigueState.performanceTrend.at(-1);

  if (!hasStruggled && (lastPerformance === undefined || lastPerformance >= 100)) {
    return {
      fatigueLevel,
      adaptedSets: original.sets,
      adaptedReps: original.reps,
      adaptation: null,
    };
  }

  let setsReduction = 0;
  let repsReduction = 0;

  if (fatigueLevel >= 0.7) {
    setsReduction = original.sets > 2 ? 1 : 0;
    repsReduction = Math.max(2, Math.floor(original.reps * 0.3));
  } else if (fatigueLevel >= 0.4) {
    repsReduction = Math.max(1, Math.floor(original.reps * 0.2));
  } else if (fatigueLevel >= 0.2) {
    repsReduction = Math.max(1, Math.floor(original.reps * 0.1));
  }

  if (input.exercise.bodyParts.includes("legs") && fatigueLevel > 0.3) {
    repsReduction += 1;
  }

  if (input.exercise.bodyParts.includes("core") && fatigueLevel > 0.4) {
    repsReduction += 1;
  }

  const adaptedSets = Math.max(1, original.sets - setsReduction);
  const adaptedReps = Math.max(1, original.reps - repsReduction);

  if (adaptedSets === original.sets && adaptedReps === original.reps) {
    return {
      fatigueLevel,
      adaptedSets,
      adaptedReps,
      adaptation: null,
    };
  }

  return {
    fatigueLevel,
    adaptedSets,
    adaptedReps,
    adaptation: {
      exerciseName: input.exercise.name,
      originalSets: original.sets,
      originalReps: original.reps,
      adaptedSets,
      adaptedReps,
      fatigueLevel,
      reason: getAdaptationReason(fatigueLevel, input.exercise.bodyParts),
    },
  };
}

function getAdaptationReason(fatigueLevel: number, bodyParts: WorkoutExercise["bodyParts"]): string {
  if (fatigueLevel >= 0.7) {
    return "High fatigue detected.";
  }

  if (fatigueLevel >= 0.4) {
    return "Moderate fatigue detected.";
  }

  if (fatigueLevel >= 0.2) {
    return "Low fatigue adjustment applied.";
  }

  if (bodyParts.includes("legs")) {
    return "Leg exercise adjustment applied.";
  }

  if (bodyParts.includes("core")) {
    return "Core exercise adjustment applied.";
  }

  return "No adjustment needed.";
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

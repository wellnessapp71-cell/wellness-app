export {
  getAvailableExercises,
  getExercise,
  getExercisesByBodyPart,
  getExercisesByDifficulty,
  getExercisesByEquipment,
  getExercisesByGoal,
  getWorkoutSuggestions,
  searchExercises,
  EXERCISE_LIBRARY,
} from "./exercise-database";
export {
  assessFitness,
  calculateExerciseScore,
  determineFitnessLevel,
  getFitnessLevelRequirements,
} from "./assessment";
export {
  buildWorkoutPlan,
  calculateSessionDuration,
  estimateExerciseTimeMinutes,
  getRelatedBodyParts,
  getSetsAndReps,
  getWorkoutFrequency,
  isDifficultySuitable,
  isTimeBasedExercise,
  mapGoalsToBodyParts,
  selectExercisesForBodyPart,
} from "./planner";
export {
  adaptWorkoutTargets,
  calculateFatigueImpact,
  updateFatigueState,
} from "./adaptation";
export { summarizeWorkoutProgress } from "./progress";
export type { AdaptiveTargetResult, AdaptWorkoutTargetsInput, FatigueState } from "./adaptation";
export {
  generateFitnessTag,
  calculateMacroRequirements,
  projectGoal,
  getRecoverySuggestion,
  getMotivationalMessage,
  getStreakRewards,
  computeSessionSummary,
} from "./personalization";
export { getAngleConfig } from "./angle-config";
export type { AngleConfig, AngleSpec, AccuracyAngle } from "./angle-config";
export {
  createRepCounter,
  startCounting,
  stopCounting,
  resetCounter,
  calculateAngle,
  extractAngle,
  processFrame,
} from "./rep-counter";
export type {
  Landmark,
  PoseLandmarks,
  RepPhase,
  FormFeedback,
  RepCounterState,
} from "./rep-counter";

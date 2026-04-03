export { getAngleConfig } from "./angle-config";
export type { AngleConfig, AngleSpec, AccuracyAngle } from "./angle-config";
export {
  createRepCounter,
  startCounting,
  stopCounting,
  resetCounter,
  calculateAngle,
  extractAngle,
  extractBilateralAngle,
  processFrame,
} from "./rep-counter";
export type {
  Landmark,
  PoseLandmarks,
  RepPhase,
  FormFeedback,
  RepCounterState,
  RepQuality,
} from "./rep-counter";
export {
  adaptWorkoutTargets,
  calculateFatigueImpact,
  updateFatigueState,
} from "./adaptation";
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

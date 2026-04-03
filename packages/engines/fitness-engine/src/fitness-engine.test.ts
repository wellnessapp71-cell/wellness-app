import assert from "node:assert/strict";
import type { WorkoutExercise } from "@aura/types";

import {
  adaptWorkoutTargets,
  assessFitness,
  buildWorkoutPlan,
  getAvailableExercises,
  getSetsAndReps,
  summarizeWorkoutProgress,
} from "./index";

const assessment = assessFitness({
  gender: "male",
  responses: {
    pushUps: 12,
    pullUps: 5,
    squats: 25,
    plankSeconds: 50,
    burpees: 10,
  },
});
assert.equal(assessment.fitnessLevel, "intermediate");
assert.ok(assessment.overallScore > 30);

const homeOnly = getAvailableExercises(true, false);
assert.ok(homeOnly.some((exercise) => exercise.name === "Dumbbell Flyes"));
assert.ok(!homeOnly.some((exercise) => exercise.name === "Bench Press"));

const plan = buildWorkoutPlan({
  userId: "user-1",
  age: 28,
  gender: "female",
  currentWeightKg: 62,
  hasHomeEquipment: true,
  hasGymAccess: true,
  goals: ["muscle_gain"],
  fitnessLevel: "beginner",
  fitnessSublevel: 1,
});
assert.equal(Object.keys(plan.sessions).length, 6);
assert.ok(plan.sessions.monday);
assert.ok(plan.totalCaloriesTarget > 0);

const targets = getSetsAndReps(
  { name: "Push-ups", bodyParts: ["chest", "arms", "core"] },
  "beginner",
  1,
);
assert.deepEqual(targets, { sets: 2, reps: 8 });

const exercise: WorkoutExercise = {
  name: "Squats",
  description: "",
  sets: 3,
  reps: 15,
  metric: "reps",
  caloriesPerMinute: 10,
  instructions: [],
  tips: [],
  bodyParts: ["legs", "core"],
  equipment: ["bodyweight"],
};

const adaptation = adaptWorkoutTargets({
  exerciseIndex: 0,
  exercise,
  originalExercises: [exercise],
  fatigueState: {
    currentFatigueLevel: 0.5,
    performanceTrend: [60],
    totalVolumeCompleted: 40,
    timeElapsedMinutes: 20,
    strugglingExercises: ["Squats"],
  },
});
assert.ok(adaptation.adaptedReps < 15);
assert.equal(adaptation.adaptation?.exerciseName, "Squats");

const progress = summarizeWorkoutProgress({
  currentLevel: "beginner",
  currentSublevel: 1,
  snapshot: {
    weeklyCompletionPercentage: 100,
    nutritionOnTrack: true,
  },
});
assert.equal(progress.nextLevel, "beginner");
assert.equal(progress.nextSublevel, 2);

console.log("fitness-engine tests passed");

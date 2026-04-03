import assert from "node:assert/strict";

import { assessYogaLevel, buildYogaPlan, createDailySession, getYogaGoalsForLevel } from "./index";

const assessmentResult = assessYogaLevel({
  responses: {
    flexibility: "intermediate",
    balance: "advanced",
    strength: "advanced",
    endurance: "intermediate",
    meditation: "beginner",
  },
});
assert.equal(assessmentResult.yogaLevel, "intermediate");

const goals = getYogaGoalsForLevel("beginner");
assert.ok(goals.flexibility?.includes("Child's pose"));

const session = createDailySession("beginner", 30, ["flexibility"], "seed-1");
assert.equal(session.durationMinutes, 30);
assert.ok(session.warmUp.length > 0);
assert.ok(session.mainPractice.length > 0);
assert.ok(session.coolDown.length > 0);

const plan = buildYogaPlan({
  userId: "user-1",
  fitnessLevel: "beginner",
  goals: ["stress_reduction", "balance"],
});
assert.equal(Object.keys(plan.sessions).length, 6);
assert.ok(plan.sessions.monday.focus.length > 0);

console.log("yoga-engine tests passed");

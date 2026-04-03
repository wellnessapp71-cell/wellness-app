import assert from "node:assert/strict";

import {
  analyzeCalorieBalance,
  buildMealPlanPrompt,
  createNutritionLogEntry,
  estimateMealCalories,
  summarizeNutritionWeek,
} from "./index";

const estimate = estimateMealCalories("2 eggs 1 toast");
assert.equal(estimate.totalCalories, 220);
assert.ok(estimate.matches.length >= 2);

const summary = summarizeNutritionWeek({
  profile: {
    userId: "user-1",
    age: 30,
    gender: "male",
    currentWeightKg: 70,
    nutritionGoal: "maintain",
    weeklyCalorieBurned: 900,
  },
  entries: [
    { dateIso: new Date().toISOString(), mealDescription: "Lunch", calories: 700 },
    { dateIso: new Date().toISOString(), mealDescription: "Dinner", calories: 500 },
  ],
});
assert.equal(summary.totalCaloriesConsumed, 1200);
assert.equal(summary.netCalorieBalance, 300);

const analysis = analyzeCalorieBalance({
  profile: {
    userId: "user-1",
    age: 27,
    gender: "female",
    currentWeightKg: 60,
    heightCm: 165,
    activityLevel: "moderate",
    nutritionGoal: "lose",
    weeklyCalorieBurned: 2100,
  },
  entries: [{ dateIso: new Date().toISOString(), mealDescription: "Meals", calories: 1000 }],
});
assert.equal(analysis.weeklyTarget, -3500);
assert.equal(typeof analysis.recommendation, "string");

const prompt = buildMealPlanPrompt({
  age: 32,
  gender: "F",
  heightCm: 160,
  weightKg: 55,
  activityLevel: "light",
  diet: "veg",
  cuisine: "South Indian",
  allergies: ["peanuts"],
  medicalConditions: ["thyroid"],
  goal: "maintenance",
  dislikes: ["oats"],
});
assert.match(prompt.userPrompt, /Avoid any ingredients or dishes that include: oats/);
assert.match(prompt.userPrompt, /Cuisine Preference: South Indian/);

const entry = createNutritionLogEntry({ mealDescription: "banana" });
assert.equal(entry.calories, 105);

console.log("nutrition-engine tests passed");

export { FOOD_CALORIE_MAP, FOOD_DATABASE } from "./food-data";
export type { IngredientNutrients, FoodCategory, DietaryTag } from "./food-data";
export { createNutritionLogEntry, estimateMealCalories } from "./calorie-estimator";
export {
  analyzeCalorieBalance,
  calculateBmr,
  calculateRecommendedIntake,
  generateRecommendation,
  summarizeNutritionWeek,
} from "./analytics";
export {
  buildCalorieQueryPrompt,
  buildChatPrompt,
  buildIngredientPrompt,
  buildMealPlanPrompt,
} from "./prompts";
export type {
  CalorieQueryRequest,
  IngredientSuggestionRequest,
  NutritionChatRequest,
} from "./prompts";
export {
  generateStructuredMealPlan,
  getMedicalDietNotes,
  getDefaultMealReminders,
} from "./meal-plan-generator";

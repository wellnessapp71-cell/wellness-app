import type { MealPlanPrompt, MealPlanRequest } from "@aura/types";

export interface CalorieQueryRequest {
  userData: MealPlanRequest;
  calorieLimit: number;
}

export interface IngredientSuggestionRequest {
  userData: MealPlanRequest;
  ingredients: string[];
}

export interface NutritionChatRequest {
  userData: MealPlanRequest;
  question: string;
}

function normalizeList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None";
}

export function buildMealPlanPrompt(request: MealPlanRequest): MealPlanPrompt {
  return {
    userPrompt: [
      "You are a nutritionist AI. Generate a 1-day personalized meal plan with Breakfast, Lunch, Snack, and Dinner.",
      "Return dish names, raw ingredients with approximate quantities, macro and micronutrient breakdowns, daily totals, and health notes.",
      `Avoid any ingredients or dishes that include: ${normalizeList(request.dislikes)}`,
      "User Profile:",
      `- Age: ${request.age}`,
      `- Gender: ${request.gender}`,
      `- Height: ${request.heightCm} cm`,
      `- Weight: ${request.weightKg} kg`,
      `- Activity Level: ${request.activityLevel}`,
      `- Diet Type: ${request.diet}`,
      `- Cuisine Preference: ${request.cuisine}`,
      `- Allergies: ${normalizeList(request.allergies)}`,
      `- Medical Conditions: ${normalizeList(request.medicalConditions)}`,
      `- Health Goal: ${request.goal}`,
      "Format the result in Markdown with sections for each meal and a final daily totals section.",
    ].join("\n"),
  };
}

export function buildCalorieQueryPrompt(request: CalorieQueryRequest): MealPlanPrompt {
  return {
    userPrompt: [
      "You are a nutrition assistant.",
      `Suggest meals under ${request.calorieLimit} calories based on this profile:`,
      buildMealPlanPrompt(request.userData).userPrompt,
      "Return 3 to 5 meal options with calories and a short suitability note.",
    ].join("\n\n"),
  };
}

export function buildIngredientPrompt(request: IngredientSuggestionRequest): MealPlanPrompt {
  return {
    userPrompt: [
      "You are a nutrition assistant.",
      `Suggest healthy dishes using these ingredients: ${normalizeList(request.ingredients)}`,
      buildMealPlanPrompt(request.userData).userPrompt,
      "Return meal ideas with ingredient usage notes and a rough nutrition summary.",
    ].join("\n\n"),
  };
}

export function buildChatPrompt(request: NutritionChatRequest): MealPlanPrompt {
  return {
    userPrompt: [
      "You are a nutrition assistant answering a user question.",
      buildMealPlanPrompt(request.userData).userPrompt,
      `Question: ${request.question}`,
      "Respond clearly and include dietary caveats when relevant.",
    ].join("\n\n"),
  };
}

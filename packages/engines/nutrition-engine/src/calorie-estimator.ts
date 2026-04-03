import type {
  MealEstimate,
  MealEstimateMatch,
  NutritionLogEntry,
  NutritionLogInput,
} from "@aura/types";
import { FOOD_CALORIE_MAP } from "./food-data";

const WORD_SEPARATOR = /[\s,]+/;

export function estimateMealCalories(description: string): MealEstimate {
  const normalized = description.trim().toLowerCase();
  const words = normalized.split(WORD_SEPARATOR).filter(Boolean);
  const matches: MealEstimateMatch[] = [];
  const usedIndexes = new Set<number>();
  let totalCalories = 0;

  for (let index = 0; index < words.length; index += 1) {
    if (usedIndexes.has(index)) {
      continue;
    }

    const word = words[index];
    if (/^\d+$/.test(word) && index + 1 < words.length) {
      const quantity = Number(word);
      const phrase = [words[index + 1], words[index + 2]].filter(Boolean).join(" ");
      const nextWord = words[index + 1];
      const calories = FOOD_CALORIE_MAP[phrase] ?? FOOD_CALORIE_MAP[nextWord] ?? 0;
      if (calories > 0) {
        totalCalories += quantity * calories;
        matches.push({ token: FOOD_CALORIE_MAP[phrase] ? phrase : nextWord, calories, quantity });
        usedIndexes.add(index);
        usedIndexes.add(index + 1);
        if (FOOD_CALORIE_MAP[phrase]) {
          usedIndexes.add(index + 2);
        }
        continue;
      }
    }

    const phrase = index < words.length - 1 ? `${word} ${words[index + 1]}` : "";
    if (phrase && FOOD_CALORIE_MAP[phrase] !== undefined && FOOD_CALORIE_MAP[phrase] > 0) {
      totalCalories += FOOD_CALORIE_MAP[phrase];
      matches.push({ token: phrase, calories: FOOD_CALORIE_MAP[phrase] });
      usedIndexes.add(index);
      usedIndexes.add(index + 1);
      index += 1;
      continue;
    }

    const calories = FOOD_CALORIE_MAP[word] ?? 0;
    if (calories > 0) {
      totalCalories += calories;
      matches.push({ token: word, calories });
      usedIndexes.add(index);
    }
  }

  const usedFallback = totalCalories === 0;
  if (usedFallback) {
    totalCalories = Math.max(100, normalized.length * 10);
  }

  const unrecognized = words.filter((word, index) => {
    return !usedIndexes.has(index) && !/^\d+$/.test(word) && !(word in FOOD_CALORIE_MAP);
  });

  return {
    totalCalories,
    matches,
    unrecognized,
    usedFallback,
  };
}

export function createNutritionLogEntry(input: NutritionLogInput): NutritionLogEntry {
  if (typeof input.calories === "number") {
    return {
      dateIso: input.consumedAtIso ?? new Date().toISOString(),
      mealDescription: input.mealDescription ?? `Direct input: ${Math.round(input.calories)} calories`,
      calories: input.calories,
    };
  }

  const estimate = estimateMealCalories(input.mealDescription ?? "");
  return {
    dateIso: input.consumedAtIso ?? new Date().toISOString(),
    mealDescription: input.mealDescription ?? "",
    calories: estimate.totalCalories,
  };
}

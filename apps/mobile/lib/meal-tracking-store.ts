import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@aura/meal_tracking";

export type MealStatus = "eaten" | "skipped" | "pending";

export interface DailyMealTracking {
  dateIso: string;
  slots: Record<string, MealStatus>;
}

async function getTracking(): Promise<DailyMealTracking> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as DailyMealTracking;
      // Reset if it's a new day
      if (data.dateIso === today) return data;
    }
  } catch {
    // fall through
  }
  return { dateIso: today, slots: {} };
}

async function saveTracking(tracking: DailyMealTracking): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(tracking));
}

export async function markMealEaten(slot: string): Promise<void> {
  const tracking = await getTracking();
  tracking.slots[slot] = "eaten";
  await saveTracking(tracking);
}

export async function markMealSkipped(slot: string): Promise<void> {
  const tracking = await getTracking();
  tracking.slots[slot] = "skipped";
  await saveTracking(tracking);
}

export async function getTodayMealStatus(): Promise<Record<string, MealStatus>> {
  const tracking = await getTracking();
  return tracking.slots;
}

/**
 * Redistribute macros across remaining pending meals when a meal is skipped.
 * Returns adjusted calorie/macro targets for each pending slot.
 */
export function redistributeMacros(
  meals: Array<{
    slot: string;
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  }>,
  statuses: Record<string, MealStatus>,
): Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number }> {
  // Sum up skipped meal macros
  let skippedCals = 0;
  let skippedProtein = 0;
  let skippedCarbs = 0;
  let skippedFat = 0;
  let skippedFiber = 0;

  for (const meal of meals) {
    if (statuses[meal.slot] === "skipped") {
      skippedCals += meal.totals.calories;
      skippedProtein += meal.totals.protein;
      skippedCarbs += meal.totals.carbs;
      skippedFat += meal.totals.fat;
      skippedFiber += meal.totals.fiber;
    }
  }

  // Find pending meals to redistribute to
  const pendingMeals = meals.filter((m) => (statuses[m.slot] ?? "pending") === "pending");
  if (pendingMeals.length === 0 || skippedCals === 0) {
    // Nothing to redistribute — return original values
    const result: Record<string, any> = {};
    for (const meal of meals) {
      result[meal.slot] = { ...meal.totals };
    }
    return result;
  }

  // Distribute evenly across pending meals
  const perMeal = {
    calories: skippedCals / pendingMeals.length,
    protein: skippedProtein / pendingMeals.length,
    carbs: skippedCarbs / pendingMeals.length,
    fat: skippedFat / pendingMeals.length,
    fiber: skippedFiber / pendingMeals.length,
  };

  const result: Record<string, any> = {};
  for (const meal of meals) {
    if (statuses[meal.slot] === "skipped") {
      result[meal.slot] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    } else if ((statuses[meal.slot] ?? "pending") === "pending") {
      result[meal.slot] = {
        calories: Math.round(meal.totals.calories + perMeal.calories),
        protein: Math.round(meal.totals.protein + perMeal.protein),
        carbs: Math.round(meal.totals.carbs + perMeal.carbs),
        fat: Math.round(meal.totals.fat + perMeal.fat),
        fiber: Math.round(meal.totals.fiber + perMeal.fiber),
      };
    } else {
      // eaten — keep original
      result[meal.slot] = { ...meal.totals };
    }
  }
  return result;
}

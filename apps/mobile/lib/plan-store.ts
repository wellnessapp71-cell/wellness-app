/**
 * Plan persistence store — AsyncStorage-backed, offline-first.
 * Stores the user's active workout and nutrition plans so they survive
 * across app sessions and appear in the Physical Hub.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const WORKOUT_KEY = "@aura/active_workout_plan";
const NUTRITION_KEY = "@aura/active_nutrition_plan";

export interface StoredPlan {
  planId: string;
  type: string; // "workout" | "yoga" | "nutrition"
  content: any;
  createdAt: string;
}

// ── Workout / Yoga Plan ──────────────────────────────────────────────────────

export async function getActiveWorkoutPlan(): Promise<StoredPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(WORKOUT_KEY);
    return raw ? (JSON.parse(raw) as StoredPlan) : null;
  } catch {
    return null;
  }
}

export async function saveActiveWorkoutPlan(
  content: any,
  planId: string,
  type: "workout" | "yoga" = "workout",
): Promise<void> {
  const plan: StoredPlan = {
    planId,
    type,
    content,
    createdAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(WORKOUT_KEY, JSON.stringify(plan));
  } catch {
    // offline-first
  }
}

export async function clearActiveWorkoutPlan(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WORKOUT_KEY);
  } catch {
    // no-op
  }
}

// ── Nutrition Plan ───────────────────────────────────────────────────────────

export async function getActiveNutritionPlan(): Promise<StoredPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(NUTRITION_KEY);
    return raw ? (JSON.parse(raw) as StoredPlan) : null;
  } catch {
    return null;
  }
}

export async function saveActiveNutritionPlan(
  content: any,
  planId: string,
): Promise<void> {
  const plan: StoredPlan = {
    planId,
    type: "nutrition",
    content,
    createdAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(plan));
  } catch {
    // offline-first
  }
}

export async function clearActiveNutritionPlan(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NUTRITION_KEY);
  } catch {
    // no-op
  }
}

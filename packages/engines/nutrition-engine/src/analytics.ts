import type {
  CalorieBalanceAnalysis,
  NutritionLogEntry,
  NutritionProfile,
  NutritionWeeklySummary,
} from "@aura/types";

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function summarizeNutritionWeek(params: {
  profile: NutritionProfile;
  entries: NutritionLogEntry[];
  weekStartIso?: string;
}): NutritionWeeklySummary {
  const weekStart = startOfWeek(params.weekStartIso ? new Date(params.weekStartIso) : new Date());
  const filteredEntries = params.entries.filter((entry) => new Date(entry.dateIso) >= weekStart);
  const totalCaloriesConsumed = filteredEntries.reduce((sum, entry) => sum + entry.calories, 0);

  return {
    totalCaloriesConsumed,
    totalCaloriesBurned: params.profile.weeklyCalorieBurned,
    netCalorieBalance: totalCaloriesConsumed - params.profile.weeklyCalorieBurned,
    entries: filteredEntries,
  };
}

export function analyzeCalorieBalance(params: {
  profile: NutritionProfile;
  entries: NutritionLogEntry[];
  weekStartIso?: string;
}): CalorieBalanceAnalysis {
  const summary = summarizeNutritionWeek(params);
  const bmr = calculateBmr(params.profile);
  const recommendedIntake = calculateRecommendedIntake(bmr, params.profile.nutritionGoal, params.profile.activityLevel);
  const balance = summary.netCalorieBalance;

  let weeklyTarget = 0;
  let onTrack = Math.abs(balance) <= 500;

  if (params.profile.nutritionGoal === "lose") {
    weeklyTarget = -3500;
    onTrack = balance <= weeklyTarget * 1.1;
  } else if (params.profile.nutritionGoal === "gain") {
    weeklyTarget = 3500;
    onTrack = balance >= weeklyTarget * 0.9;
  }

  return {
    consumed: summary.totalCaloriesConsumed,
    burned: summary.totalCaloriesBurned,
    balance,
    recommendedIntake,
    weeklyTarget,
    onTrack,
    recommendation: generateRecommendation(balance, params.profile.nutritionGoal),
  };
}

export function calculateBmr(profile: NutritionProfile): number {
  const heightCm = profile.heightCm ?? 170;
  if (profile.gender === "male") {
    return 10 * profile.currentWeightKg + 6.25 * heightCm - 5 * profile.age + 5;
  }

  if (profile.gender === "female") {
    return 10 * profile.currentWeightKg + 6.25 * heightCm - 5 * profile.age - 161;
  }

  return 10 * profile.currentWeightKg + 6.25 * heightCm - 5 * profile.age - 78;
}

export function calculateRecommendedIntake(
  bmr: number,
  goal: NutritionProfile["nutritionGoal"],
  activityLevel: NutritionProfile["activityLevel"] = "moderate",
): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  const dailyNeeds = bmr * multiplier;

  if (goal === "lose") {
    return dailyNeeds - 500;
  }

  if (goal === "gain") {
    return dailyNeeds + 500;
  }

  return dailyNeeds;
}

export function generateRecommendation(
  balance: number,
  goal: NutritionProfile["nutritionGoal"],
): string {
  if (goal === "lose") {
    if (balance < -3500) {
      return "Great job! You are in a healthy calorie deficit for weight loss.";
    }
    if (balance > -2500) {
      return "Try reducing calorie intake slightly to reach your weight loss goal.";
    }
    return "You are on track with your weight loss plan.";
  }

  if (goal === "gain") {
    if (balance > 3500) {
      return "Great job! You are in a healthy calorie surplus for weight gain.";
    }
    if (balance < 2500) {
      return "Try increasing calorie intake slightly to reach your weight gain goal.";
    }
    return "You are on track with your weight gain plan.";
  }

  if (Math.abs(balance) < 1000) {
    return "Perfect! Your calorie intake matches your expenditure.";
  }

  if (balance > 1000) {
    return "You are consuming more calories than you are burning. Consider reducing intake.";
  }

  return "You are burning more calories than you are consuming. Consider increasing intake.";
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1));
  return start;
}

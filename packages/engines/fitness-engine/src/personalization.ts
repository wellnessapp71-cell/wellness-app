/**
 * Personalization & Planning AI (Section 1 of PDF)
 * - Fitness tag generation
 * - Macro requirements calculation
 * - Goal projection (time-to-goal)
 * - Recovery suggestions
 * - Motivational messages
 *
 * Ported from GYM 3/GYM/src (Python) into modular TypeScript.
 */

import type {
  BodyShape,
  DailyCheckIn,
  EquipmentAccess,
  EnergyLevel,
  FitnessLevel,
  FitnessTag,
  GoalMilestone,
  GoalProjection,
  GoalType,
  MacroRequirements,
  MoodLevel,
  RecoverySuggestion,
  StreakReward,
  WorkoutSessionLog,
} from "@aura/types";

// ──────────────────────────────────────────────
// Fitness Tag  (e.g. "Intermediate | Fat Burn | Home Only")
// ──────────────────────────────────────────────

export function generateFitnessTag(params: {
  fitnessLevel: FitnessLevel;
  goals: GoalType[];
  hasGymAccess: boolean;
  hasHomeEquipment: boolean;
}): FitnessTag {
  const { fitnessLevel, goals, hasGymAccess, hasHomeEquipment } = params;

  const primaryGoal = goals[0] ?? "fat_loss";
  const goalLabel = formatGoalLabel(primaryGoal);

  let equipmentAccess: EquipmentAccess;
  if (hasGymAccess) {
    equipmentAccess = "gym";
  } else if (hasHomeEquipment) {
    equipmentAccess = "home";
  } else {
    equipmentAccess = "minimal";
  }

  const equipLabel =
    equipmentAccess === "gym"
      ? "Gym"
      : equipmentAccess === "home"
        ? "Home"
        : "Minimal";

  const levelLabel = fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1);

  return {
    level: fitnessLevel,
    primaryGoal: goalLabel,
    equipmentAccess,
    label: `${levelLabel} | ${goalLabel} | ${equipLabel}`,
  };
}

function formatGoalLabel(goal: GoalType): string {
  const map: Record<string, string> = {
    fat_loss: "Fat Burn",
    muscle_gain: "Muscle Gain",
    endurance: "Endurance",
    strength: "Strength",
    flexibility: "Flexibility",
    stress_reduction: "Stress Relief",
    posture: "Posture",
    balance: "Balance",
    core_strength: "Core",
    spinal_health: "Spinal Health",
    detoxification: "Detox",
  };
  if (goal.startsWith("body_part_")) {
    const part = goal.replace("body_part_", "");
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
  return map[goal] ?? goal.replace("_", " ");
}

// ──────────────────────────────────────────────
// Macro Requirements (linked to workout load)
// ──────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  lightly_active: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.725,
};

export function calculateMacroRequirements(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: "male" | "female" | "other";
  activityLevel: string;
  goal: "lose" | "maintain" | "gain";
  weeklyCaloriesBurned?: number;
}): MacroRequirements {
  const { weightKg, heightCm, age, gender, activityLevel, goal } = params;

  // BMR via Mifflin-St Jeor (mirrors GYM 3 nutrition_tracker._calculate_bmr)
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === "female") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  let tdee = bmr * multiplier;

  // Adjust for goal
  let calories: number;
  if (goal === "lose") {
    calories = tdee - 500;
  } else if (goal === "gain") {
    calories = tdee + 500;
  } else {
    calories = tdee;
  }
  calories = Math.round(calories);

  // Macro split depends on goal
  let proteinPercent: number;
  let carbsPercent: number;
  let fatPercent: number;

  if (goal === "gain") {
    proteinPercent = 30;
    carbsPercent = 45;
    fatPercent = 25;
  } else if (goal === "lose") {
    proteinPercent = 35;
    carbsPercent = 35;
    fatPercent = 30;
  } else {
    proteinPercent = 30;
    carbsPercent = 40;
    fatPercent = 30;
  }

  return {
    calories,
    proteinGrams: Math.round((calories * proteinPercent) / 100 / 4),
    carbsGrams: Math.round((calories * carbsPercent) / 100 / 4),
    fatGrams: Math.round((calories * fatPercent) / 100 / 9),
    proteinPercent,
    carbsPercent,
    fatPercent,
  };
}

// ──────────────────────────────────────────────
// Goal Projection (time-to-goal)
// ──────────────────────────────────────────────

export function projectGoal(params: {
  goalType: string;
  currentWeightKg: number;
  targetWeightKg: number;
  weeklyDeficitOrSurplus: number; // kcal per week (negative = deficit)
}): GoalProjection {
  const { goalType, currentWeightKg, targetWeightKg, weeklyDeficitOrSurplus } = params;

  const weightDiff = targetWeightKg - currentWeightKg;
  // 1 kg of body fat ≈ 7700 kcal
  const weeklyWeightChange = weeklyDeficitOrSurplus / 7700;
  const safeWeeklyChange = Math.max(0.1, Math.abs(weeklyWeightChange));
  const estimatedWeeks = Math.max(1, Math.ceil(Math.abs(weightDiff) / safeWeeklyChange));

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + estimatedWeeks * 7);

  const confidence: GoalProjection["confidence"] =
    estimatedWeeks <= 12 ? "high" : estimatedWeeks <= 26 ? "medium" : "low";

  // Generate milestones at 25%, 50%, 75%, 100%
  const milestones: GoalMilestone[] = [25, 50, 75, 100].map((pct) => {
    const targetValue = currentWeightKg + (weightDiff * pct) / 100;
    const estimatedWeek = Math.round((estimatedWeeks * pct) / 100);
    return {
      label: `${pct}% of goal`,
      targetValue: Math.round(targetValue * 10) / 10,
      estimatedWeek,
      reached: false,
    };
  });

  return {
    goalType,
    currentValue: currentWeightKg,
    targetValue: targetWeightKg,
    estimatedWeeks,
    weeklyRateOfChange: Math.round(safeWeeklyChange * 100) / 100,
    projectedDateIso: projectedDate.toISOString(),
    confidence,
    milestones,
  };
}

// ──────────────────────────────────────────────
// Recovery Suggestions (from GYM 3 progress_tracker patterns)
// ──────────────────────────────────────────────

export function getRecoverySuggestion(params: {
  lastCheckIn?: DailyCheckIn | null;
  streakDays: number;
  recentSessionsCount: number;
  lastSessionCompletionPercent?: number;
}): RecoverySuggestion {
  const { lastCheckIn, streakDays, recentSessionsCount, lastSessionCompletionPercent } = params;

  // High fatigue / soreness → rest
  if (lastCheckIn) {
    if (lastCheckIn.fatigueLevel >= 4 || lastCheckIn.soreness >= 4) {
      return {
        type: "rest",
        title: "Recovery Day",
        description: "Your body needs rest. Take a full rest day to recover.",
        reason: "High fatigue or soreness detected from your check-in.",
        suggestedActivity: "Light stretching, foam rolling, or a gentle walk.",
      };
    }
    if (lastCheckIn.sleepHours < 6 || lastCheckIn.energy === "exhausted") {
      return {
        type: "active_recovery",
        title: "Active Recovery",
        description: "Low energy or poor sleep detected. Go easy today.",
        reason: "Sleep or energy levels are below optimal.",
        suggestedActivity: "Yoga, light walking, or mobility work.",
      };
    }
    if (lastCheckIn.energy === "low" || lastCheckIn.mood === "low") {
      return {
        type: "light_workout",
        title: "Light Workout",
        description: "You're not fully charged. A lighter session will keep momentum.",
        reason: "Energy or mood is lower than usual.",
        suggestedActivity: "50% intensity workout or a brisk walk.",
      };
    }
  }

  // 6+ consecutive days → suggest rest
  if (streakDays >= 6 && recentSessionsCount >= 6) {
    return {
      type: "rest",
      title: "Earned Rest Day",
      description: "6 days in a row — your muscles need recovery to grow.",
      reason: "Consistent training streak. Recovery prevents overtraining.",
      suggestedActivity: "Complete rest or very light stretching.",
    };
  }

  // Last session was poor
  if (lastSessionCompletionPercent !== undefined && lastSessionCompletionPercent < 60) {
    return {
      type: "active_recovery",
      title: "Active Recovery",
      description: "Your last session was tough. Take it easy today.",
      reason: `Last session completion was ${Math.round(lastSessionCompletionPercent)}%.`,
      suggestedActivity: "Light yoga or a short walk.",
    };
  }

  return {
    type: "normal",
    title: "Ready to Train",
    description: "You're good to go! Hit your planned workout.",
    reason: "No fatigue or recovery signals detected.",
  };
}

// ──────────────────────────────────────────────
// Motivational Messages & Streak Rewards
// ──────────────────────────────────────────────

const MOTIVATIONAL_POOL = [
  "Every rep counts. Keep pushing!",
  "Consistency beats intensity. You're building a habit.",
  "You showed up — that's already a win.",
  "Your future self will thank you for today.",
  "Progress is progress, no matter how small.",
  "Discipline is choosing between what you want now and what you want most.",
  "Strong is earned, not given.",
  "Rest if you must, but don't quit.",
  "The only bad workout is the one that didn't happen.",
  "You're closer to your goal than you were yesterday.",
];

export function getMotivationalMessage(params: {
  streakDays: number;
  completionPercent?: number;
  fitnessLevel?: FitnessLevel;
}): string {
  const { streakDays, completionPercent, fitnessLevel } = params;

  if (streakDays >= 30) {
    return `${streakDays}-day streak! You're unstoppable. Elite consistency.`;
  }
  if (streakDays >= 14) {
    return `${streakDays} days strong! You've built a real habit. Keep it alive.`;
  }
  if (streakDays >= 7) {
    return `1 week streak! Momentum is building — don't stop now.`;
  }
  if (streakDays >= 3) {
    return `${streakDays}-day streak! Great start. Push for 7.`;
  }

  if (completionPercent !== undefined && completionPercent >= 95) {
    return "Perfect session! You crushed it.";
  }
  if (completionPercent !== undefined && completionPercent < 50) {
    return "Tough day, but you showed up. That matters most.";
  }

  // Random from pool
  return MOTIVATIONAL_POOL[Math.floor(Math.random() * MOTIVATIONAL_POOL.length)];
}

export function getStreakRewards(currentStreak: number): StreakReward[] {
  const milestones = [
    { streakDays: 3, title: "Getting Started", description: "3-day streak!", coins: 10 },
    { streakDays: 7, title: "Week Warrior", description: "7-day streak!", coins: 25 },
    { streakDays: 14, title: "Fortnight Fighter", description: "14-day streak!", coins: 50 },
    { streakDays: 21, title: "Habit Builder", description: "21-day streak — habit formed!", coins: 100 },
    { streakDays: 30, title: "Monthly Machine", description: "30-day streak!", coins: 200 },
    { streakDays: 60, title: "Iron Will", description: "60-day streak!", coins: 500 },
    { streakDays: 90, title: "Quarter Centurion", description: "90-day streak!", coins: 1000 },
  ];

  return milestones.map((m) => ({
    ...m,
    unlocked: currentStreak >= m.streakDays,
  }));
}

// ──────────────────────────────────────────────
// Session Processing (compute summary from log)
// ──────────────────────────────────────────────

export function computeSessionSummary(params: {
  sessionLog: WorkoutSessionLog;
  currentLevel: FitnessLevel;
  streakDays: number;
}): {
  exercisesCompleted: number;
  exercisesTotal: number;
  totalRepsCompleted: number;
  totalRepsTarget: number;
  adaptationsApplied: number;
  caloriesBurned: number;
  durationMinutes: number;
  completionPercent: number;
  motivationalMessage: string;
  recoveryTip: string;
} {
  const { sessionLog, currentLevel, streakDays } = params;

  let totalRepsCompleted = 0;
  let totalRepsTarget = 0;
  let adaptationsApplied = 0;
  const exercisesTotal = sessionLog.exercises.length;
  let exercisesCompleted = 0;

  for (const ex of sessionLog.exercises) {
    totalRepsTarget += ex.targetSets * ex.targetReps;
    const repsFromSets = ex.sets.reduce((sum, s) => sum + s.actualReps, 0);
    totalRepsCompleted += repsFromSets;
    if (ex.completionPercent >= 50) exercisesCompleted++;
    if (ex.adaptationApplied) adaptationsApplied++;
  }

  const motivationalMessage = getMotivationalMessage({
    streakDays,
    completionPercent: sessionLog.completionPercent,
    fitnessLevel: currentLevel,
  });

  const recoveryTip =
    sessionLog.completionPercent < 70
      ? "Consider extra rest tomorrow. Your body is telling you something."
      : sessionLog.completionPercent >= 95
        ? "Great session! Light stretching tonight will aid recovery."
        : "Good work! Stay hydrated and get 7-8 hours of sleep.";

  return {
    exercisesCompleted,
    exercisesTotal,
    totalRepsCompleted,
    totalRepsTarget,
    adaptationsApplied,
    caloriesBurned: sessionLog.totalCaloriesBurned,
    durationMinutes: sessionLog.totalDurationMinutes,
    completionPercent: sessionLog.completionPercent,
    motivationalMessage,
    recoveryTip,
  };
}

import type {
  BodyPart,
  ExerciseDefinition,
  FitnessLevel,
  FitnessSublevel,
  GoalType,
  WorkoutDay,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutProfile,
  WorkoutSession,
} from "@aura/types";
import { getAvailableExercises } from "./exercise-database";

const WEEKLY_SCHEDULE: Array<[WorkoutDay, BodyPart | null]> = [
  ["monday", "chest"],
  ["tuesday", "back"],
  ["wednesday", "legs"],
  ["thursday", "shoulders"],
  ["friday", "arms"],
  ["saturday", "core"],
  ["sunday", null],
];

const FIXED_REP_TARGETS: Record<string, Record<FitnessLevel, [number, number]>> = {
  "push-ups": { beginner: [8, 10], intermediate: [12, 14], advanced: [15, 18], expert: [20, 25] },
  "incline push-ups": { beginner: [10, 12], intermediate: [14, 16], advanced: [18, 20], expert: [22, 26] },
  "decline push-ups": { beginner: [6, 8], intermediate: [10, 12], advanced: [14, 16], expert: [18, 22] },
  "dumbbell flyes": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "dumbbell press": { beginner: [8, 10], intermediate: [12, 14], advanced: [15, 18], expert: [20, 25] },
  "bench press": { beginner: [8, 10], intermediate: [12, 14], advanced: [15, 18], expert: [20, 25] },
  "chest dips": { beginner: [6, 8], intermediate: [10, 12], advanced: [12, 15], expert: [15, 20] },
  "cable flyes": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "pull-ups": { beginner: [3, 5], intermediate: [6, 8], advanced: [10, 13], expert: [14, 19] },
  "bent-over rows": { beginner: [8, 10], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "lat pulldowns": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "seated rows": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "reverse flyes": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  superman: { beginner: [12, 15], intermediate: [15, 18], advanced: [18, 22], expert: [22, 26] },
  deadlifts: { beginner: [6, 8], intermediate: [8, 10], advanced: [10, 12], expert: [12, 15] },
  squats: { beginner: [12, 15], intermediate: [15, 18], advanced: [18, 22], expert: [22, 26] },
  lunges: { beginner: [10, 12], intermediate: [12, 14], advanced: [14, 16], expert: [16, 20] },
  "calf raises": { beginner: [12, 15], intermediate: [15, 18], advanced: [18, 22], expert: [22, 26] },
  "wall sits": { beginner: [30, 40], intermediate: [45, 55], advanced: [60, 70], expert: [90, 100] },
  "step-ups": { beginner: [10, 12], intermediate: [12, 14], advanced: [14, 16], expert: [16, 20] },
  "leg press": { beginner: [10, 12], intermediate: [12, 14], advanced: [14, 16], expert: [16, 20] },
  "bulgarian split squats": { beginner: [8, 10], intermediate: [10, 12], advanced: [12, 14], expert: [14, 16] },
  "shoulder press": { beginner: [8, 10], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "lateral raises": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "tricep dips": { beginner: [8, 10], intermediate: [10, 12], advanced: [12, 15], expert: [15, 20] },
  "close grip push-ups": { beginner: [8, 10], intermediate: [10, 12], advanced: [12, 15], expert: [15, 20] },
  "bicep curls": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "hammer curls": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "overhead tricep extension": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  "resistance band curls": { beginner: [12, 15], intermediate: [15, 18], advanced: [18, 22], expert: [22, 26] },
  "cable tricep pushdowns": { beginner: [10, 12], intermediate: [12, 14], advanced: [15, 18], expert: [18, 22] },
  plank: { beginner: [30, 40], intermediate: [45, 60], advanced: [60, 90], expert: [90, 120] },
  crunches: { beginner: [12, 15], intermediate: [15, 18], advanced: [18, 22], expert: [22, 26] },
  "mountain climbers": { beginner: [30, 40], intermediate: [45, 60], advanced: [60, 75], expert: [90, 120] },
  "russian twists": { beginner: [12, 15], intermediate: [15, 18], advanced: [18, 22], expert: [22, 26] },
  "dead bug": { beginner: [10, 12], intermediate: [12, 14], advanced: [14, 16], expert: [16, 20] },
  "hanging leg raises": { beginner: [6, 8], intermediate: [8, 10], advanced: [10, 12], expert: [12, 15] },
  "cable woodchops": { beginner: [10, 12], intermediate: [12, 14], advanced: [14, 16], expert: [16, 20] },
};

export function buildWorkoutPlan(
  profile: WorkoutProfile,
  options?: { sessionMinutes?: number; weekStartIso?: string },
): WorkoutPlan {
  const sessionMinutes = options?.sessionMinutes ?? 30;
  const weekStart = startOfDay(options?.weekStartIso ? new Date(options.weekStartIso) : new Date());
  const availableExercises = getAvailableExercises(profile.hasHomeEquipment, profile.hasGymAccess);
  const sessions: WorkoutPlan["sessions"] = {};

  for (const [day, focus] of WEEKLY_SCHEDULE) {
    if (!focus) {
      continue;
    }

    const exercises = selectExercisesForBodyPart({
      profile,
      availableExercises,
      targetBodyPart: focus,
      sessionMinutes,
    });

    if (exercises.length === 0) {
      continue;
    }

    const dateIso = addDays(weekStart, WEEKLY_SCHEDULE.findIndex(([item]) => item === day)).toISOString();
    const durationMinutes = calculateSessionDuration(exercises, sessionMinutes);
    const estimatedCaloriesBurned = round(
      exercises.reduce(
        (total, exercise) => total + exercise.caloriesPerMinute * 3 * (profile.currentWeightKg / 70),
        0,
      ),
    );

    sessions[day] = {
      day,
      dateIso,
      focus,
      exercises,
      durationMinutes,
      estimatedCaloriesBurned,
    } satisfies WorkoutSession;
  }

  const totalCaloriesTarget = round(
    Object.values(sessions).reduce((total, session) => total + session.estimatedCaloriesBurned, 0),
  );

  return {
    weekStartIso: weekStart.toISOString(),
    userId: profile.userId,
    sessions,
    goals: profile.goals,
    totalCaloriesTarget,
    trainingDays: Object.keys(sessions).length,
  };
}

export function getWorkoutFrequency(fitnessLevel: FitnessLevel): number {
  const frequencyMap: Record<FitnessLevel, number> = {
    beginner: 3,
    intermediate: 4,
    advanced: 5,
    expert: 6,
  };

  return frequencyMap[fitnessLevel];
}

export function mapGoalsToBodyParts(goals: GoalType[]): BodyPart[] {
  const bodyParts = new Set<BodyPart>();

  for (const goal of goals) {
    if (goal === "fat_loss") {
      bodyParts.add("full_body");
      bodyParts.add("cardio");
    } else if (goal === "muscle_gain") {
      ["chest", "back", "legs", "arms", "shoulders"].forEach((bodyPart) => {
        bodyParts.add(bodyPart as BodyPart);
      });
    } else if (goal === "endurance") {
      bodyParts.add("cardio");
      bodyParts.add("full_body");
    } else if (goal.startsWith("body_part_")) {
      bodyParts.add(goal.replace("body_part_", "") as BodyPart);
    }
  }

  return bodyParts.size > 0 ? Array.from(bodyParts) : ["full_body"];
}

export function selectExercisesForBodyPart(params: {
  profile: WorkoutProfile;
  availableExercises: ExerciseDefinition[];
  targetBodyPart: BodyPart;
  sessionMinutes: number;
}): WorkoutExercise[] {
  const { profile, availableExercises, targetBodyPart, sessionMinutes } = params;

  let suitableExercises = availableExercises.filter((exercise) => {
    return isDifficultySuitable(exercise.difficulty, profile.fitnessLevel) && exercise.bodyParts.includes(targetBodyPart);
  });

  if (suitableExercises.length === 0) {
    const relatedParts = getRelatedBodyParts(targetBodyPart);
    suitableExercises = availableExercises.filter((exercise) => {
      return (
        isDifficultySuitable(exercise.difficulty, profile.fitnessLevel) &&
        exercise.bodyParts.some((bodyPart) => relatedParts.includes(bodyPart))
      );
    });
  }

  const selectedExercises: ExerciseDefinition[] = [];
  let estimatedMinutes = 0;

  for (const exercise of suitableExercises) {
    const { sets, reps } = getSetsAndReps(exercise, profile.fitnessLevel, profile.fitnessSublevel);
    const perExerciseMinutes = estimateExerciseTimeMinutes(exercise, sets, reps);

    if (estimatedMinutes + perExerciseMinutes <= sessionMinutes || selectedExercises.length < 4) {
      selectedExercises.push(exercise);
      estimatedMinutes += perExerciseMinutes;
    }

    if (estimatedMinutes >= sessionMinutes && selectedExercises.length >= 6) {
      break;
    }
  }

  return selectedExercises.slice(0, 7).map((exercise) => {
    const { sets, reps } = getSetsAndReps(exercise, profile.fitnessLevel, profile.fitnessSublevel);
    return {
      name: exercise.name,
      description: exercise.description,
      sets,
      reps,
      metric: isTimeBasedExercise(exercise) ? "seconds" : "reps",
      caloriesPerMinute: exercise.caloriesPerMinute,
      instructions: exercise.instructions,
      tips: exercise.tips,
      bodyParts: exercise.bodyParts,
      equipment: exercise.equipment,
    } satisfies WorkoutExercise;
  });
}

export function isDifficultySuitable(exerciseDifficulty: FitnessLevel, userFitnessLevel: FitnessLevel): boolean {
  if (exerciseDifficulty === userFitnessLevel) {
    return true;
  }

  if (userFitnessLevel === "beginner") {
    return ["beginner", "intermediate"].includes(exerciseDifficulty);
  }

  if (userFitnessLevel === "intermediate") {
    return ["beginner", "intermediate", "advanced"].includes(exerciseDifficulty);
  }

  return true;
}

export function getRelatedBodyParts(targetBodyPart: BodyPart): BodyPart[] {
  const relatedMap: Record<BodyPart, BodyPart[]> = {
    chest: ["arms", "shoulders"],
    back: ["arms", "shoulders"],
    legs: ["core"],
    arms: ["chest", "back"],
    shoulders: ["chest", "back", "arms"],
    core: ["legs", "full_body"],
    cardio: ["core", "full_body"],
    full_body: ["core", "legs"],
  };

  return relatedMap[targetBodyPart] ?? ["full_body"];
}

export function getSetsAndReps(
  exercise: Pick<ExerciseDefinition, "name" | "bodyParts">,
  fitnessLevel: FitnessLevel,
  fitnessSublevel: FitnessSublevel,
): { sets: number; reps: number } {
  const normalizedName = exercise.name.toLowerCase();
  const isCardio = exercise.bodyParts.includes("cardio");
  const timeBased = isTimeBasedExercise(exercise);

  if (FIXED_REP_TARGETS[normalizedName]) {
    const target = FIXED_REP_TARGETS[normalizedName][fitnessLevel];
    return {
      sets: getSetsForLevel(fitnessLevel),
      reps: target[fitnessSublevel === 1 ? 0 : 1],
    };
  }

  let base = 10;
  if (normalizedName.includes("pull-up")) {
    base = { beginner: 3, intermediate: 6, advanced: 10, expert: 14 }[fitnessLevel];
  } else if (normalizedName.includes("dip")) {
    base = { beginner: 6, intermediate: 10, advanced: 12, expert: 15 }[fitnessLevel];
  } else if (["push", "press", "row", "fly"].some((token) => normalizedName.includes(token))) {
    base = { beginner: 8, intermediate: 12, advanced: 15, expert: 20 }[fitnessLevel];
  } else if (["squat", "lunge", "step", "calf"].some((token) => normalizedName.includes(token))) {
    base = { beginner: 10, intermediate: 14, advanced: 16, expert: 20 }[fitnessLevel];
  } else if (timeBased || isCardio) {
    base = { beginner: 30, intermediate: 45, advanced: 60, expert: 90 }[fitnessLevel];
  } else {
    base = { beginner: 10, intermediate: 12, advanced: 15, expert: 18 }[fitnessLevel];
  }

  const bump = { beginner: 2, intermediate: 2, advanced: 3, expert: 5 }[fitnessLevel];

  return {
    sets: getSetsForLevel(fitnessLevel),
    reps: fitnessSublevel === 2 ? base + bump : base,
  };
}

export function estimateExerciseTimeMinutes(
  exercise: Pick<ExerciseDefinition, "name" | "bodyParts">,
  sets: number,
  reps: number,
): number {
  const isTimeBased = isTimeBasedExercise(exercise);
  const workSeconds = isTimeBased ? reps * sets : reps * 3 * sets;
  const restSeconds = Math.max(30, sets >= 3 ? 60 : 45) * Math.max(0, sets - 1);
  return Math.max(3, Math.floor((workSeconds + restSeconds) / 60));
}

export function calculateSessionDuration(exercises: WorkoutExercise[], targetMinutes: number): number {
  const total = exercises.reduce((sum, exercise) => {
    return sum + estimateExerciseTimeMinutes(exercise, exercise.sets, exercise.reps);
  }, 0);

  if (Math.abs(total - targetMinutes) <= 5) {
    return total;
  }

  return Math.max(targetMinutes - 5, Math.min(targetMinutes + 5, total));
}

export function isTimeBasedExercise(exercise: Pick<ExerciseDefinition, "name" | "bodyParts">): boolean {
  const normalizedName = exercise.name.toLowerCase();
  return (
    ["plank", "mountain", "wall sit", "hold", "sprint"].some((token) => normalizedName.includes(token)) ||
    (exercise.bodyParts.includes("core") && exercise.bodyParts.includes("cardio"))
  );
}

function getSetsForLevel(level: FitnessLevel): number {
  return { beginner: 2, intermediate: 3, advanced: 4, expert: 4 }[level];
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

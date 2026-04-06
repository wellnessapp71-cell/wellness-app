import {
  ACTIVITY_LEVELS,
  FITNESS_LEVELS,
  GOAL_TYPES,
  NUTRITION_GOALS,
  type FitnessAssessmentInput,
  type MealPlanRequest,
  type NutritionLogEntry,
  type NutritionLogInput,
  type NutritionProfile,
  type WorkoutProfile,
  type YogaAssessmentCategory,
  type YogaAssessmentInput,
  type YogaProfile,
} from "@aura/types";
import { z, type ZodIssue, type ZodType } from "zod";

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = {
  success: false;
  error: string;
  status: 400;
  details?: ValidationIssue[];
};
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface WorkoutRouteRequest {
  profile: WorkoutProfile;
  options?: {
    sessionMinutes?: number;
    weekStartIso?: string;
  };
}

export type NutritionRouteRequest =
  | {
      action: "estimate-meal";
      input: NutritionLogInput;
    }
  | {
      action: "analyze-week";
      input: {
        profile: NutritionProfile;
        entries: NutritionLogEntry[];
        weekStartIso?: string;
      };
    }
  | {
      action: "build-meal-plan-prompt";
      input: MealPlanRequest;
    }
  | {
      action: "save-structured-plan";
      input: { plan: Record<string, unknown>; request: Record<string, unknown> };
    };

export interface YogaRouteRequest {
  profile: YogaProfile;
  options?: {
    sessionMinutes?: number;
    createdAtIso?: string;
    seed?: string;
  };
}

export type AssessmentRouteRequest =
  | {
      kind: "fitness";
      input: FitnessAssessmentInput;
    }
  | {
      kind: "yoga";
      input: YogaAssessmentInput;
    };

const genderSchema = z.enum(["male", "female", "other"]);
const fitnessLevelSchema = z.enum(FITNESS_LEVELS);
const goalTypeSchema = z.enum(GOAL_TYPES);
const activityLevelSchema = z.enum(ACTIVITY_LEVELS);
const nutritionGoalSchema = z.enum(NUTRITION_GOALS);
const fitnessSublevelSchema = z.union([z.literal(1), z.literal(2)]);
const yogaAssessmentCategorySchema = z.enum([
  "flexibility",
  "balance",
  "strength",
  "endurance",
  "meditation",
] as const satisfies readonly YogaAssessmentCategory[]);
const isoDateStringSchema = z
  .string()
  .min(1)
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Must be a valid ISO date string.",
  );
const nonEmptyStringSchema = z.string().trim().min(1);
const numberSchema = z.number().finite();

const workoutProfileSchema: z.ZodType<WorkoutProfile> = z
  .object({
    userId: nonEmptyStringSchema,
    name: nonEmptyStringSchema.optional(),
    age: numberSchema,
    gender: genderSchema,
    currentWeightKg: numberSchema,
    targetWeightKg: numberSchema.optional(),
    hasHomeEquipment: z.boolean(),
    hasGymAccess: z.boolean(),
    goals: z.array(goalTypeSchema),
    fitnessLevel: fitnessLevelSchema,
    fitnessSublevel: fitnessSublevelSchema,
  })
  .strict();

const workoutOptionsSchema: z.ZodType<
  NonNullable<WorkoutRouteRequest["options"]>
> = z
  .object({
    sessionMinutes: numberSchema.optional(),
    weekStartIso: isoDateStringSchema.optional(),
  })
  .strict();

const workoutRouteRequestSchema: z.ZodType<WorkoutRouteRequest> = z
  .object({
    profile: workoutProfileSchema,
    options: workoutOptionsSchema.optional(),
  })
  .strict();

const nutritionLogInputSchema: z.ZodType<NutritionLogInput> = z
  .object({
    mealDescription: nonEmptyStringSchema.optional(),
    calories: numberSchema.optional(),
    consumedAtIso: isoDateStringSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.mealDescription !== undefined || value.calories !== undefined,
    {
      message: "Either mealDescription or calories is required.",
      path: ["mealDescription"],
    },
  );

const nutritionProfileSchema: z.ZodType<NutritionProfile> = z
  .object({
    userId: nonEmptyStringSchema,
    age: numberSchema,
    gender: genderSchema,
    currentWeightKg: numberSchema,
    heightCm: numberSchema.optional(),
    activityLevel: activityLevelSchema.optional(),
    nutritionGoal: nutritionGoalSchema,
    weeklyCalorieBurned: numberSchema,
    weeklyCalorieIntake: numberSchema.optional(),
  })
  .strict();

const nutritionLogEntrySchema: z.ZodType<NutritionLogEntry> = z
  .object({
    dateIso: isoDateStringSchema,
    mealDescription: nonEmptyStringSchema,
    calories: numberSchema,
  })
  .strict();

const mealPlanRequestSchema: z.ZodType<MealPlanRequest> = z
  .object({
    userId: nonEmptyStringSchema.optional(),
    age: numberSchema,
    gender: nonEmptyStringSchema,
    heightCm: numberSchema,
    weightKg: numberSchema,
    activityLevel: nonEmptyStringSchema,
    diet: nonEmptyStringSchema,
    cuisine: nonEmptyStringSchema,
    allergies: z.array(nonEmptyStringSchema),
    medicalConditions: z.array(nonEmptyStringSchema),
    goal: nonEmptyStringSchema,
    dislikes: z.array(nonEmptyStringSchema),
  })
  .strict();

const nutritionAnalyzeWeekInputSchema: z.ZodType<
  Extract<NutritionRouteRequest, { action: "analyze-week" }>["input"]
> = z
  .object({
    profile: nutritionProfileSchema,
    entries: z.array(nutritionLogEntrySchema),
    weekStartIso: isoDateStringSchema.optional(),
  })
  .strict();

const nutritionRouteRequestSchema: z.ZodType<NutritionRouteRequest> =
  z.discriminatedUnion("action", [
    z
      .object({
        action: z.literal("estimate-meal"),
        input: nutritionLogInputSchema,
      })
      .strict(),
    z
      .object({
        action: z.literal("analyze-week"),
        input: nutritionAnalyzeWeekInputSchema,
      })
      .strict(),
    z
      .object({
        action: z.literal("build-meal-plan-prompt"),
        input: mealPlanRequestSchema,
      })
      .strict(),
    z
      .object({
        action: z.literal("save-structured-plan"),
        input: z.object({
          plan: z.record(z.string(), z.unknown()),
          request: z.record(z.string(), z.unknown()),
        }).strict(),
      })
      .strict(),
  ]);

const yogaProfileSchema: z.ZodType<YogaProfile> = z
  .object({
    userId: nonEmptyStringSchema,
    name: nonEmptyStringSchema.optional(),
    fitnessLevel: fitnessLevelSchema,
    goals: z.array(goalTypeSchema),
    totalWorkouts: numberSchema.optional(),
    workoutStreak: numberSchema.optional(),
  })
  .strict();

const yogaOptionsSchema: z.ZodType<NonNullable<YogaRouteRequest["options"]>> = z
  .object({
    sessionMinutes: numberSchema.optional(),
    createdAtIso: isoDateStringSchema.optional(),
    seed: nonEmptyStringSchema.optional(),
  })
  .strict();

const yogaRouteRequestSchema: z.ZodType<YogaRouteRequest> = z
  .object({
    profile: yogaProfileSchema,
    options: yogaOptionsSchema.optional(),
  })
  .strict();

const fitnessAssessmentInputSchema: z.ZodType<FitnessAssessmentInput> = z
  .object({
    gender: genderSchema,
    responses: z
      .object({
        pushUps: numberSchema,
        pullUps: numberSchema,
        squats: numberSchema,
        plankSeconds: numberSchema,
        burpees: numberSchema,
      })
      .strict(),
  })
  .strict();

const yogaAssessmentInputSchema: z.ZodType<YogaAssessmentInput> = z
  .object({
    responses: z
      .object({
        flexibility: fitnessLevelSchema,
        balance: fitnessLevelSchema,
        strength: fitnessLevelSchema,
        endurance: fitnessLevelSchema,
        meditation: fitnessLevelSchema,
      })
      .strict(),
  })
  .strict();

const assessmentRouteRequestSchema: z.ZodType<AssessmentRouteRequest> =
  z.discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("fitness"),
        input: fitnessAssessmentInputSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("yoga"),
        input: yogaAssessmentInputSchema,
      })
      .strict(),
  ]);

export async function parseRequestJson(
  request: Request,
): Promise<ValidationResult<unknown>> {
  try {
    return { success: true, data: (await request.json()) as unknown };
  } catch {
    return {
      success: false,
      status: 400,
      error: "Invalid JSON request body.",
    };
  }
}

export function validateWorkoutRouteRequest(
  value: unknown,
): ValidationResult<WorkoutRouteRequest> {
  return validateWithSchema(
    workoutRouteRequestSchema,
    value,
    "Invalid workout request body.",
  );
}

export function validateNutritionRouteRequest(
  value: unknown,
): ValidationResult<NutritionRouteRequest> {
  return validateWithSchema(
    nutritionRouteRequestSchema,
    value,
    "Invalid nutrition request body.",
  );
}

export function validateYogaRouteRequest(
  value: unknown,
): ValidationResult<YogaRouteRequest> {
  return validateWithSchema(
    yogaRouteRequestSchema,
    value,
    "Invalid yoga request body.",
  );
}

export function validateAssessmentRouteRequest(
  value: unknown,
): ValidationResult<AssessmentRouteRequest> {
  return validateWithSchema(
    assessmentRouteRequestSchema,
    value,
    "Invalid assessment request body.",
  );
}

function validateWithSchema<T>(
  schema: ZodType<T>,
  value: unknown,
  message: string,
): ValidationResult<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      success: false,
      status: 400,
      error: message,
      details: formatIssues(result.error.issues),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

function formatIssues(issues: ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "body",
    message: issue.message,
  }));
}

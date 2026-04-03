import {
  analyzeCalorieBalance,
  buildMealPlanPrompt,
  createNutritionLogEntry,
  estimateMealCalories,
  summarizeNutritionWeek,
} from "@aura/nutrition-engine";
import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import {
  errorResponse,
  methodNotAllowed,
  okWithMeta,
} from "@/lib/api/response";
import { resolveAuthContext } from "@/lib/auth/middleware";
import {
  parseRequestJson,
  validateNutritionRouteRequest,
} from "@/lib/api/validation";

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(
      parsed.status ?? 400,
      "INVALID_JSON",
      parsed.error,
      parsed.details,
    );
  }

  const validation = validateNutritionRouteRequest(parsed.data);
  if (!validation.success) {
    return errorResponse(
      validation.status ?? 400,
      "INVALID_NUTRITION_REQUEST",
      validation.error,
      validation.details,
    );
  }

  const legacyUserId =
    validation.data.action === "analyze-week"
      ? validation.data.input.profile.userId
      : validation.data.action === "build-meal-plan-prompt"
        ? (validation.data.input.userId ?? null)
        : null;

  const auth = resolveAuthContext(request, {
    legacyUserId,
    allowAnonymousWhenCompat: validation.data.action === "estimate-meal",
  });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  try {
    switch (validation.data.action) {
      case "estimate-meal": {
        const estimate = validation.data.input.mealDescription
          ? estimateMealCalories(validation.data.input.mealDescription)
          : null;
        const entry = createNutritionLogEntry(validation.data.input);

        // Persist as a progress snapshot
        await prisma.progress.create({
          data: {
            userId: auth.userId,
            type: "nutrition",
            data: JSON.parse(JSON.stringify({ entry, estimate })),
          },
        });

        return okWithMeta({ action: "estimate-meal" }, { entry, estimate });
      }
      case "analyze-week": {
        const {
          profile: rawProfile,
          entries,
          weekStartIso,
        } = validation.data.input;
        if (!auth.isLegacy && rawProfile.userId !== auth.userId) {
          return errorResponse(
            403,
            "FORBIDDEN",
            "Cannot analyze another user's profile.",
          );
        }

        const profile = {
          ...rawProfile,
          userId: auth.userId,
        };
        const summary = summarizeNutritionWeek({
          profile,
          entries,
          weekStartIso,
        });
        const analysis = analyzeCalorieBalance({
          profile,
          entries,
          weekStartIso,
        });

        // Persist weekly analysis as progress
        await prisma.progress.create({
          data: {
            userId: auth.userId,
            type: "nutrition",
            data: JSON.parse(JSON.stringify({ summary, analysis })),
          },
        });

        return okWithMeta({ action: "analyze-week" }, { summary, analysis });
      }
      case "build-meal-plan-prompt": {
        const inputUserId = validation.data.input.userId;
        if (inputUserId && !auth.isLegacy && inputUserId !== auth.userId) {
          return errorResponse(
            403,
            "FORBIDDEN",
            "Cannot create a plan for another user.",
          );
        }

        const promptInput = {
          ...validation.data.input,
          userId: auth.userId,
        };
        const prompt = buildMealPlanPrompt(promptInput);

        // Persist meal plan prompt as a nutrition plan
        await prisma.plan.create({
          data: {
            userId: auth.userId,
            type: "nutrition",
            content: JSON.parse(JSON.stringify({ input: promptInput, prompt })),
          },
        });

        return okWithMeta({ action: "build-meal-plan-prompt" }, prompt);
      }
    }
  } catch (error) {
    return errorResponse(
      500,
      "NUTRITION_ENGINE_ERROR",
      "Unable to process nutrition request.",
      serializeError(error),
    );
  }
}

export function GET(): NextResponse {
  return methodNotAllowed(["POST"]);
}

export function PUT(): NextResponse {
  return methodNotAllowed(["POST"]);
}

export function PATCH(): NextResponse {
  return methodNotAllowed(["POST"]);
}

export function DELETE(): NextResponse {
  return methodNotAllowed(["POST"]);
}

function serializeError(error: unknown): { message: string } {
  return error instanceof Error
    ? { message: error.message }
    : { message: "Unknown error" };
}

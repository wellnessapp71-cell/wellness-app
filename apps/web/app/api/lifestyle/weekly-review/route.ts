/**
 * POST /api/lifestyle/weekly-review — Save weekly review
 * GET  /api/lifestyle/weekly-review — Get weekly reviews
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as Record<string, any>;
  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const review = await prisma.lifestyleWeeklyReview.create({
      data: {
        userId,
        weekStart: body.weekStart,
        weekEnd: body.weekEnd,
        goodSleepDays: body.goodSleepDays ?? 0,
        hydrationTargetDays: body.hydrationTargetDays ?? 0,
        mealLogDays: body.mealLogDays ?? 0,
        balancedMealDays: body.balancedMealDays,
        movementDays: body.movementDays ?? 0,
        moderateActivityDays: body.moderateActivityDays,
        strengthYogaDays: body.strengthYogaDays,
        screenInterferenceDays: body.screenInterferenceDays ?? 0,
        screenUnderLimitDays: body.screenUnderLimitDays,
        outdoorDays: body.outdoorDays ?? 0,
        routineDays: body.routineDays,
        helpedMostHabit: body.helpedMostHabit,
        blockedMostHabit: body.blockedMostHabit,
        scoreChange: body.scoreChange ?? 0,
      },
    });

    return ok({ reviewId: review.id });
  } catch (error) {
    return errorResponse(500, "WEEKLY_REVIEW_SAVE_ERROR", "Unable to save weekly review.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? auth.userId;

  try {
    const reviews = await prisma.lifestyleWeeklyReview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return ok({ count: reviews.length, reviews: reviews.reverse() });
  } catch (error) {
    return errorResponse(500, "WEEKLY_REVIEW_FETCH_ERROR", "Unable to fetch weekly reviews.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

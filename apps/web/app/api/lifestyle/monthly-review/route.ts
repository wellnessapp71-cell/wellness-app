/**
 * POST /api/lifestyle/monthly-review — Save monthly review
 * GET  /api/lifestyle/monthly-review — Get monthly reviews
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
    const review = await prisma.lifestyleMonthlyReview.create({
      data: {
        userId,
        month: body.month,
        sleepImproved: body.sleepImproved ?? false,
        mealQualityImproved: body.mealQualityImproved ?? false,
        hydrationImproved: body.hydrationImproved ?? false,
        movementImproved: body.movementImproved ?? false,
        screenBalanceImproved: body.screenBalanceImproved ?? false,
        natureImproved: body.natureImproved ?? false,
        routineImproved: body.routineImproved ?? false,
        mostImprovedDomain: body.mostImprovedDomain,
        worstDomain: body.worstDomain,
        planPreference: body.planPreference ?? "same",
      },
    });

    return ok({ reviewId: review.id });
  } catch (error) {
    return errorResponse(500, "MONTHLY_REVIEW_SAVE_ERROR", "Unable to save monthly review.", {
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
    const reviews = await prisma.lifestyleMonthlyReview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return ok({ count: reviews.length, reviews: reviews.reverse() });
  } catch (error) {
    return errorResponse(500, "MONTHLY_REVIEW_FETCH_ERROR", "Unable to fetch monthly reviews.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

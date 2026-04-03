/**
 * POST /api/mental/weekly-review — Generate and save weekly review
 * GET  /api/mental/weekly-review — Get latest weekly review
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

  const body = parsed.data as {
    userId?: string;
    trend: Record<string, unknown>;
    newPlanVersion?: Record<string, unknown>;
    notes?: string;
  };

  if (!body.trend || typeof body.trend !== "object") {
    return errorResponse(400, "INVALID_REVIEW", "trend object is required.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const review = await prisma.weeklyReview.create({
      data: {
        userId,
        trend: JSON.parse(JSON.stringify(body.trend)),
        newPlanVersion: body.newPlanVersion ? JSON.parse(JSON.stringify(body.newPlanVersion)) : undefined,
        notes: body.notes ?? null,
      },
    });

    // Also save the new plan version if provided
    if (body.newPlanVersion) {
      await prisma.plan.create({
        data: {
          userId,
          type: "mental",
          content: JSON.parse(JSON.stringify(body.newPlanVersion)),
        },
      });
    }

    return ok({ reviewId: review.id, reviewDate: review.reviewDate });
  } catch (error) {
    return errorResponse(500, "REVIEW_SAVE_ERROR", "Unable to save weekly review.", {
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
    const review = await prisma.weeklyReview.findFirst({
      where: { userId },
      orderBy: { reviewDate: "desc" },
    });

    if (!review) {
      return errorResponse(404, "NOT_FOUND", "No weekly reviews found.");
    }

    return ok(review);
  } catch (error) {
    return errorResponse(500, "REVIEW_FETCH_ERROR", "Unable to fetch weekly review.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

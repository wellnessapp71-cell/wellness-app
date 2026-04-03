/**
 * POST /api/spiritual/weekly-review — Save weekly review
 * GET  /api/spiritual/weekly-review — Get latest weekly review
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
    weekStart: string;
    weekEnd: string;
    calmScoreChange: number;
    engagementSummary?: string;
    suggestedNextActions?: unknown;
    reviewData?: Record<string, unknown>;
  };

  if (!body.weekStart || !body.weekEnd) {
    return errorResponse(400, "INVALID_REVIEW", "weekStart and weekEnd are required.");
  }

  if (typeof body.calmScoreChange !== "number") {
    return errorResponse(400, "INVALID_REVIEW", "calmScoreChange must be a number.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const report = await prisma.spiritualWeeklyReport.create({
      data: {
        userId,
        weekStart: body.weekStart,
        weekEnd: body.weekEnd,
        calmScoreChange: Math.round(body.calmScoreChange),
        engagementSummary: body.engagementSummary ?? null,
        suggestedNextActions: body.suggestedNextActions
          ? JSON.parse(JSON.stringify(body.suggestedNextActions))
          : undefined,
        reviewData: body.reviewData
          ? JSON.parse(JSON.stringify(body.reviewData))
          : undefined,
      },
    });

    return ok({ reportId: report.id, weekStart: report.weekStart });
  } catch (error) {
    return errorResponse(500, "REVIEW_SAVE_ERROR", "Unable to save spiritual weekly review.", {
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
    const report = await prisma.spiritualWeeklyReport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!report) {
      return errorResponse(404, "NOT_FOUND", "No spiritual weekly reviews found.");
    }

    return ok(report);
  } catch (error) {
    return errorResponse(500, "REVIEW_FETCH_ERROR", "Unable to fetch spiritual weekly review.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

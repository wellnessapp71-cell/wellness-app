/**
 * POST /api/lifestyle/score — Save a score run
 * GET  /api/lifestyle/score — Get latest score
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
    const run = await prisma.lifestyleScoreRun.create({
      data: {
        userId,
        sleepScore: body.sleepScore ?? 0,
        nutritionScore: body.nutritionScore ?? 0,
        hydrationScore: body.hydrationScore ?? 0,
        movementScore: body.movementScore ?? 0,
        digitalScore: body.digitalScore ?? 0,
        natureScore: body.natureScore ?? 0,
        routineScore: body.routineScore ?? 0,
        totalScore: body.totalScore ?? 0,
        band: body.band ?? "red",
      },
    });

    // Update profile score
    await prisma.profile.updateMany({
      where: { userId },
      data: { scoreLifestyle: body.totalScore ?? 0 },
    });

    return ok({ scoreRunId: run.id, totalScore: run.totalScore });
  } catch (error) {
    return errorResponse(500, "SCORE_SAVE_ERROR", "Unable to save lifestyle score.", {
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
    const latest = await prisma.lifestyleScoreRun.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return errorResponse(404, "NOT_FOUND", "No lifestyle score found.");
    }

    return ok(latest);
  } catch (error) {
    return errorResponse(500, "SCORE_FETCH_ERROR", "Unable to fetch lifestyle score.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

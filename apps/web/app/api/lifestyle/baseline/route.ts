/**
 * POST /api/lifestyle/baseline — Save lifestyle baseline assessment
 * GET  /api/lifestyle/baseline — Retrieve user's latest baseline
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
    sleepScore: number;
    nutritionScore: number;
    hydrationScore: number;
    movementScore: number;
    digitalScore: number;
    natureScore: number;
    routineScore: number;
    totalScore: number;
    band: string;
    weakestDomain: string;
    rawAnswers: number[];
  };

  const requiredScores = ["sleepScore", "nutritionScore", "hydrationScore", "movementScore", "digitalScore", "natureScore", "routineScore", "totalScore"] as const;
  for (const field of requiredScores) {
    if (typeof body[field] !== "number" || body[field] < 0 || body[field] > 100) {
      return errorResponse(400, "INVALID_BASELINE", `${field} must be a number between 0-100.`);
    }
  }

  if (!body.band || !body.weakestDomain || !Array.isArray(body.rawAnswers)) {
    return errorResponse(400, "INVALID_BASELINE", "band, weakestDomain, and rawAnswers are required.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const baseline = await prisma.lifestyleBaseline.create({
      data: {
        userId,
        sleepScore: body.sleepScore,
        nutritionScore: body.nutritionScore,
        hydrationScore: body.hydrationScore,
        movementScore: body.movementScore,
        digitalScore: body.digitalScore,
        natureScore: body.natureScore,
        routineScore: body.routineScore,
        totalScore: body.totalScore,
        band: body.band,
        weakestDomain: body.weakestDomain,
        rawAnswers: body.rawAnswers,
      },
    });

    // Update profile
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        scoreLifestyle: body.totalScore,
        lifestyleOnboardingDone: true,
      },
    });

    return ok({ baselineId: baseline.id, ...baseline });
  } catch (error) {
    return errorResponse(500, "BASELINE_SAVE_ERROR", "Unable to save lifestyle baseline.", {
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
    const baseline = await prisma.lifestyleBaseline.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!baseline) {
      return errorResponse(404, "NOT_FOUND", "No lifestyle baseline found for this user.");
    }

    return ok(baseline);
  } catch (error) {
    return errorResponse(500, "BASELINE_FETCH_ERROR", "Unable to fetch lifestyle baseline.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

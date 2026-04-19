/**
 * POST /api/spiritual/baseline — Save spiritual baseline assessment
 * GET  /api/spiritual/baseline — Retrieve user's spiritual baseline
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
    meaningScore: number;
    peaceScore: number;
    mindfulnessScore: number;
    connectionScore: number;
    practiceScore: number;
    totalScore: number;
    band: string;
    weakestDomain: string;
    preferredPracticeTime?: string;
    preferredSupportStyle?: string;
    rawAnswers: number[];
  };

  // Validate required scores
  const scores = [
    { name: "meaningScore", val: body.meaningScore },
    { name: "peaceScore", val: body.peaceScore },
    { name: "mindfulnessScore", val: body.mindfulnessScore },
    { name: "connectionScore", val: body.connectionScore },
    { name: "practiceScore", val: body.practiceScore },
    { name: "totalScore", val: body.totalScore },
  ];

  for (const s of scores) {
    if (typeof s.val !== "number" || s.val < 0 || s.val > 100) {
      return errorResponse(400, "INVALID_BASELINE", `${s.name} must be 0-100.`);
    }
  }

  if (!body.band || !["green", "yellow", "orange", "red"].includes(body.band)) {
    return errorResponse(400, "INVALID_BASELINE", "band must be green, yellow, orange, or red.");
  }

  if (!Array.isArray(body.rawAnswers) || body.rawAnswers.length !== 24) {
    return errorResponse(400, "INVALID_BASELINE", "rawAnswers must be an array of 24 numbers.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const baseline = await prisma.spiritualBaseline.create({
      data: {
        userId,
        meaningScore: Math.round(body.meaningScore),
        peaceScore: Math.round(body.peaceScore),
        mindfulnessScore: Math.round(body.mindfulnessScore),
        connectionScore: Math.round(body.connectionScore),
        practiceScore: Math.round(body.practiceScore),
        totalScore: Math.round(body.totalScore),
        band: body.band,
        weakestDomain: body.weakestDomain,
        preferredPracticeTime: body.preferredPracticeTime ?? null,
        preferredSupportStyle: body.preferredSupportStyle ?? null,
        rawAnswers: JSON.parse(JSON.stringify(body.rawAnswers)),
      },
    });

    await prisma.profile.updateMany({
      where: { userId },
      data: { spiritualOnboardingDone: true },
    });

    return ok({ baselineId: baseline.id, ...baseline });
  } catch (error) {
    return errorResponse(500, "BASELINE_SAVE_ERROR", "Unable to save spiritual baseline.", {
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
    const baseline = await prisma.spiritualBaseline.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!baseline) {
      return errorResponse(404, "NOT_FOUND", "No spiritual baseline found for this user.");
    }

    return ok(baseline);
  } catch (error) {
    return errorResponse(500, "BASELINE_FETCH_ERROR", "Unable to fetch spiritual baseline.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

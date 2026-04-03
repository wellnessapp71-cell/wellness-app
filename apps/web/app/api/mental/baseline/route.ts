/**
 * POST /api/mental/baseline — Save baseline assessment
 * GET  /api/mental/baseline — Retrieve user's baseline
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
    phq9: number;
    gad7: number;
    stressBase: number;
    moodBase: number;
    rawAnswers: Record<string, unknown>;
  };

  // Validate required fields
  if (
    typeof body.phq9 !== "number" || body.phq9 < 0 || body.phq9 > 27 ||
    typeof body.gad7 !== "number" || body.gad7 < 0 || body.gad7 > 21 ||
    typeof body.stressBase !== "number" || body.stressBase < 1 || body.stressBase > 10 ||
    typeof body.moodBase !== "number" || body.moodBase < 1 || body.moodBase > 10
  ) {
    return errorResponse(400, "INVALID_BASELINE", "phq9 (0-27), gad7 (0-21), stressBase (1-10), moodBase (1-10) required.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const baseline = await prisma.mentalBaseline.create({
      data: {
        userId,
        phq9: body.phq9,
        gad7: body.gad7,
        stressBase: body.stressBase,
        moodBase: body.moodBase,
        rawAnswers: JSON.parse(JSON.stringify(body.rawAnswers ?? {})),
      },
    });

    return ok({ baselineId: baseline.id, ...baseline });
  } catch (error) {
    return errorResponse(500, "BASELINE_SAVE_ERROR", "Unable to save baseline.", {
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
    const baseline = await prisma.mentalBaseline.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!baseline) {
      return errorResponse(404, "NOT_FOUND", "No baseline found for this user.");
    }

    return ok(baseline);
  } catch (error) {
    return errorResponse(500, "BASELINE_FETCH_ERROR", "Unable to fetch baseline.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

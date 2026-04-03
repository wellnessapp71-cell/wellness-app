/**
 * POST /api/spiritual/checkin — Submit daily spiritual check-in
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
    date?: string;
    calmScore: number;
    didPractice: boolean;
    feltConnected: string;
    natureOrReflectionHelped: string;
    blockers?: string[];
    feelings?: string[];
  };

  // Validate calm score (0-10)
  if (typeof body.calmScore !== "number" || body.calmScore < 0 || body.calmScore > 10) {
    return errorResponse(400, "INVALID_CHECKIN", "calmScore must be 0-10.");
  }

  if (typeof body.didPractice !== "boolean") {
    return errorResponse(400, "INVALID_CHECKIN", "didPractice must be a boolean.");
  }

  const validConnected = ["yes", "a_little", "no"];
  if (!validConnected.includes(body.feltConnected)) {
    return errorResponse(400, "INVALID_CHECKIN", "feltConnected must be yes, a_little, or no.");
  }

  if (!validConnected.includes(body.natureOrReflectionHelped)) {
    return errorResponse(400, "INVALID_CHECKIN", "natureOrReflectionHelped must be yes, a_little, or no.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;
  const date = body.date ?? new Date().toISOString().split("T")[0];

  try {
    const checkin = await prisma.spiritualCheckin.upsert({
      where: {
        userId_date: { userId, date },
      },
      update: {
        calmScore: Math.round(body.calmScore),
        didPractice: body.didPractice,
        feltConnected: body.feltConnected,
        natureOrReflectionHelped: body.natureOrReflectionHelped,
        blockers: body.blockers ?? [],
        feelings: body.feelings ?? [],
      },
      create: {
        userId,
        date,
        calmScore: Math.round(body.calmScore),
        didPractice: body.didPractice,
        feltConnected: body.feltConnected,
        natureOrReflectionHelped: body.natureOrReflectionHelped,
        blockers: body.blockers ?? [],
        feelings: body.feelings ?? [],
      },
    });

    return ok({ checkinId: checkin.id, date: checkin.date });
  } catch (error) {
    return errorResponse(500, "CHECKIN_SAVE_ERROR", "Unable to save spiritual check-in.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

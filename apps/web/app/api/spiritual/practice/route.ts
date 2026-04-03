/**
 * POST /api/spiritual/practice — Log a practice session
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
    type: string;
    contentId?: string;
    durationMinutes: number;
    completedAt?: string;
    rating?: number;
  };

  if (!body.type || typeof body.type !== "string") {
    return errorResponse(400, "INVALID_PRACTICE", "type is required.");
  }

  if (typeof body.durationMinutes !== "number" || body.durationMinutes < 0) {
    return errorResponse(400, "INVALID_PRACTICE", "durationMinutes must be a non-negative number.");
  }

  if (body.rating !== undefined && (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5)) {
    return errorResponse(400, "INVALID_PRACTICE", "rating must be 1-5.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const session = await prisma.spiritualPracticeSession.create({
      data: {
        userId,
        type: body.type,
        contentId: body.contentId ?? null,
        durationMinutes: Math.round(body.durationMinutes),
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        rating: body.rating ?? null,
      },
    });

    return ok({ sessionId: session.id, completedAt: session.completedAt });
  } catch (error) {
    return errorResponse(500, "PRACTICE_SAVE_ERROR", "Unable to save practice session.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

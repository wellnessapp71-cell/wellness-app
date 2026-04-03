/**
 * GET /api/spiritual/practice/history — Get practice session history
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? auth.userId;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
  const type = url.searchParams.get("type");

  try {
    const sessions = await prisma.spiritualPracticeSession.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { completedAt: "desc" },
      take: limit,
    });

    return ok({ count: sessions.length, sessions });
  } catch (error) {
    return errorResponse(500, "PRACTICE_HISTORY_ERROR", "Unable to fetch practice history.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

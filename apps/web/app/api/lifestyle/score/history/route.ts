/**
 * GET /api/lifestyle/score/history — Get score history for charts
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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10), 90);

  try {
    const scores = await prisma.lifestyleScoreRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return ok({ count: scores.length, scores: scores.reverse() });
  } catch (error) {
    return errorResponse(500, "SCORE_HISTORY_ERROR", "Unable to fetch score history.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

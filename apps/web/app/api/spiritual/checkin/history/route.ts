/**
 * GET /api/spiritual/checkin/history — Get spiritual check-in history
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
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.min(days, 90));
  const cutoffDate = cutoff.toISOString().split("T")[0];

  try {
    const checkins = await prisma.spiritualCheckin.findMany({
      where: {
        userId,
        date: { gte: cutoffDate },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return ok({ count: checkins.length, checkins });
  } catch (error) {
    return errorResponse(500, "CHECKIN_HISTORY_ERROR", "Unable to fetch spiritual check-in history.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/mental/checkin/history — Get check-in history (last 30 days)
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

  try {
    const checkins = await prisma.mentalCheckin.findMany({
      where: {
        userId,
        checkinDate: { gte: cutoff },
      },
      orderBy: { checkinDate: "desc" },
      take: 100,
    });

    return ok({ count: checkins.length, checkins });
  } catch (error) {
    return errorResponse(500, "CHECKIN_HISTORY_ERROR", "Unable to fetch check-in history.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

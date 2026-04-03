/**
 * GET /api/lifestyle/checkin/history — Get lifestyle check-in history
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
  const since = url.searchParams.get("since"); // ISO date for incremental sync

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.min(days, 90));

  try {
    const where: any = { userId };

    if (since) {
      // Incremental sync: only return records created/updated after `since`
      where.createdAt = { gte: new Date(since) };
    } else {
      where.date = { gte: cutoff.toISOString().split("T")[0] };
    }

    const checkins = await prisma.lifestyleCheckin.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
    });

    return ok({ count: checkins.length, checkins });
  } catch (error) {
    return errorResponse(500, "CHECKIN_HISTORY_ERROR", "Unable to fetch lifestyle check-in history.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

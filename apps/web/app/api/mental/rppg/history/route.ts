/**
 * GET /api/mental/rppg/history — Get rPPG scan history
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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10), 100);

  try {
    const scans = await prisma.rppgScan.findMany({
      where: { userId },
      orderBy: { scannedAt: "desc" },
      take: limit,
    });

    return ok({ count: scans.length, scans });
  } catch (error) {
    return errorResponse(500, "RPPG_HISTORY_ERROR", "Unable to fetch scan history.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

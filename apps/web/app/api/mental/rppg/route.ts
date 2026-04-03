/**
 * POST /api/mental/rppg — Save rPPG scan result
 * GET  /api/mental/rppg — Get latest scan
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

  const raw = parsed.data as Record<string, unknown>;

  // Accept both mobile field names and API field names
  const heartRate = (raw.heartRate ?? raw.heartRateBpm) as number | undefined;
  const stressIndex = raw.stressIndex as number | undefined;
  const signalQuality = raw.signalQuality as number | undefined;
  const duration = (raw.duration ?? raw.scanDurationSeconds ?? 30) as number;
  const userId_body = raw.userId as string | undefined;

  if (
    typeof heartRate !== "number" || heartRate < 30 || heartRate > 220 ||
    typeof stressIndex !== "number" || stressIndex < 0 || stressIndex > 100 ||
    typeof signalQuality !== "number" || signalQuality < 0 || signalQuality > 1
  ) {
    return errorResponse(400, "INVALID_SCAN", "heartRate (30-220), stressIndex (0-100), signalQuality (0-1) required.");
  }

  const userId = auth.isLegacy ? (userId_body ?? auth.userId) : auth.userId;

  try {
    const scan = await prisma.rppgScan.create({
      data: {
        userId,
        heartRate: Math.round(heartRate),
        stressIndex: Math.round(stressIndex),
        signalQuality,
        duration,
      },
    });

    return ok({ scanId: scan.id, scannedAt: scan.scannedAt });
  } catch (error) {
    return errorResponse(500, "RPPG_SAVE_ERROR", "Unable to save scan result.", {
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
    const scan = await prisma.rppgScan.findFirst({
      where: { userId },
      orderBy: { scannedAt: "desc" },
    });

    if (!scan) {
      return errorResponse(404, "NOT_FOUND", "No rPPG scans found.");
    }

    return ok(scan);
  } catch (error) {
    return errorResponse(500, "RPPG_FETCH_ERROR", "Unable to fetch scan.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

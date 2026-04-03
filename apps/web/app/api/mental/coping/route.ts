/**
 * POST /api/mental/coping — Log a completed coping/intervention session
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

const VALID_TYPES = ["breathing", "grounding", "body_scan", "calm_audio", "journal_prompt"];

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
    interventionType: string;
    duration: number;
    completion?: boolean;
  };

  if (!VALID_TYPES.includes(body.interventionType)) {
    return errorResponse(400, "INVALID_COPING", `interventionType must be one of: ${VALID_TYPES.join(", ")}.`);
  }

  if (typeof body.duration !== "number" || body.duration < 0 || body.duration > 3600) {
    return errorResponse(400, "INVALID_COPING", "duration must be 0-3600 seconds.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const session = await prisma.copingSession.create({
      data: {
        userId,
        interventionType: body.interventionType,
        duration: Math.round(body.duration),
        completion: body.completion ?? true,
      },
    });

    return ok({ sessionId: session.id, completedAt: session.completedAt });
  } catch (error) {
    return errorResponse(500, "COPING_SAVE_ERROR", "Unable to log coping session.", {
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
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.min(days, 90));

  try {
    const sessions = await prisma.copingSession.findMany({
      where: {
        userId,
        completedAt: { gte: cutoff },
      },
      orderBy: { completedAt: "desc" },
      take: 100,
    });

    return ok({ count: sessions.length, sessions });
  } catch (error) {
    return errorResponse(500, "COPING_FETCH_ERROR", "Unable to fetch coping sessions.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

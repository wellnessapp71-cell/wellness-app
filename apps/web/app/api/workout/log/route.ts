import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

/**
 * POST /api/workout/log
 * Log a completed workout session (Section 2 & 3 of PDF).
 * Body: WorkoutSessionLog-shaped JSON.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as any;

  const auth = await resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth?.userId) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }
  const userId = auth.userId;

  if (!body.exercises || !Array.isArray(body.exercises)) {
    return errorResponse(400, "INVALID_LOG", "exercises array is required");
  }

  try {
    // Save as Progress entry with type "workout"
    const progress = await prisma.progress.create({
      data: {
        userId,
        type: "workout",
        data: body,
      },
    });

    return ok({ progressId: progress.id, saved: true });
  } catch (err: any) {
    return errorResponse(500, "LOG_ERROR", err?.message ?? "Failed to save workout log");
  }
}

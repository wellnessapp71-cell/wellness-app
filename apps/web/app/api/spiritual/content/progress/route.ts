/**
 * POST /api/spiritual/content/progress — Update spiritual content progress
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
    moduleId: string;
    progressPercent: number;
  };

  if (!body.moduleId || typeof body.moduleId !== "string") {
    return errorResponse(400, "INVALID_PROGRESS", "moduleId is required.");
  }

  if (typeof body.progressPercent !== "number" || body.progressPercent < 0 || body.progressPercent > 100) {
    return errorResponse(400, "INVALID_PROGRESS", "progressPercent must be 0-100.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    // Use the shared ContentProgress model with a spiritual_ prefix on the module name
    const moduleKey = `spiritual_${body.moduleId}`;

    const progress = await prisma.contentProgress.upsert({
      where: {
        userId_module: {
          userId,
          module: moduleKey,
        },
      },
      update: {
        progressPercent: body.progressPercent,
      },
      create: {
        userId,
        module: moduleKey,
        progressPercent: body.progressPercent,
      },
    });

    return ok({
      moduleId: body.moduleId,
      progressPercent: progress.progressPercent,
      updatedAt: progress.updatedAt,
    });
  } catch (error) {
    return errorResponse(500, "PROGRESS_SAVE_ERROR", "Unable to update spiritual content progress.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

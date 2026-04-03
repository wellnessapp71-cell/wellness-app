import { buildYogaPlan } from "@aura/yoga-engine";
import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, methodNotAllowed, ok } from "@/lib/api/response";
import {
  parseRequestJson,
  validateYogaRouteRequest,
} from "@/lib/api/validation";

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(
      parsed.status ?? 400,
      "INVALID_JSON",
      parsed.error,
      parsed.details,
    );
  }

  const validation = validateYogaRouteRequest(parsed.data);
  if (!validation.success) {
    return errorResponse(
      validation.status ?? 400,
      "INVALID_YOGA_REQUEST",
      validation.error,
      validation.details,
    );
  }

  const auth = resolveAuthContext(request, {
    legacyUserId: validation.data.profile.userId,
  });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  if (!auth.isLegacy && validation.data.profile.userId !== auth.userId) {
    return errorResponse(
      403,
      "FORBIDDEN",
      "Cannot generate a plan for another user.",
    );
  }

  try {
    const profile = {
      ...validation.data.profile,
      userId: auth.userId,
    };
    const plan = buildYogaPlan(profile, validation.data.options);

    // Persist the generated plan (JSON.parse/stringify ensures plain JSON for Prisma)
    const saved = await prisma.plan.create({
      data: {
        userId: auth.userId,
        type: "yoga",
        content: JSON.parse(JSON.stringify(plan)),
      },
    });

    return ok({ ...plan, planId: saved.id });
  } catch (error) {
    return errorResponse(
      500,
      "YOGA_ENGINE_ERROR",
      "Unable to generate yoga plan.",
      serializeError(error),
    );
  }
}

export function GET(): NextResponse {
  return methodNotAllowed(["POST"]);
}

export function PUT(): NextResponse {
  return methodNotAllowed(["POST"]);
}

export function PATCH(): NextResponse {
  return methodNotAllowed(["POST"]);
}

export function DELETE(): NextResponse {
  return methodNotAllowed(["POST"]);
}

function serializeError(error: unknown): { message: string } {
  return error instanceof Error
    ? { message: error.message }
    : { message: "Unknown error" };
}

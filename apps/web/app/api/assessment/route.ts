import { assessFitness } from "@aura/fitness-engine";
import { assessYogaLevel } from "@aura/yoga-engine";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import {
  errorResponse,
  methodNotAllowed,
  okWithMeta,
} from "@/lib/api/response";
import {
  parseRequestJson,
  validateAssessmentRouteRequest,
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

  const validation = validateAssessmentRouteRequest(parsed.data);
  if (!validation.success) {
    return errorResponse(
      validation.status ?? 400,
      "INVALID_ASSESSMENT_REQUEST",
      validation.error,
      validation.details,
    );
  }

  const auth = resolveAuthContext(request, {
    allowAnonymousWhenCompat: true,
  });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  try {
    if (validation.data.kind === "fitness") {
      return okWithMeta(
        { kind: "fitness" },
        assessFitness(validation.data.input),
      );
    }

    return okWithMeta({ kind: "yoga" }, assessYogaLevel(validation.data.input));
  } catch (error) {
    return errorResponse(
      500,
      "ASSESSMENT_ENGINE_ERROR",
      "Unable to complete assessment.",
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

/**
 * GET /api/spiritual/plan — Get current spiritual wellness plan
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

  try {
    // Check for versioned plan first
    const planVersion = await prisma.spiritualPlanVersion.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });

    if (planVersion) {
      return ok({
        planId: planVersion.id,
        content: planVersion.planJson,
        reasonCode: planVersion.reasonCode,
        createdAt: planVersion.createdAt,
      });
    }

    // Fall back to generic Plan model
    const plan = await prisma.plan.findFirst({
      where: { userId, type: "spiritual" },
      orderBy: { createdAt: "desc" },
    });

    if (!plan) {
      return errorResponse(404, "NOT_FOUND", "No spiritual wellness plan found. Complete the onboarding first.");
    }

    return ok({
      planId: plan.id,
      content: plan.content,
      createdAt: plan.createdAt,
    });
  } catch (error) {
    return errorResponse(500, "PLAN_FETCH_ERROR", "Unable to fetch spiritual plan.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

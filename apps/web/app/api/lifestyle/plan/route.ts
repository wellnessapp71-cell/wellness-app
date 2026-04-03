/**
 * POST /api/lifestyle/plan — Save wellness plan
 * GET  /api/lifestyle/plan — Get active wellness plan
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

  const body = parsed.data as Record<string, any>;
  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  if (!body.dailyAnchorHabit || !body.focusDomain || !body.band) {
    return errorResponse(400, "INVALID_PLAN", "dailyAnchorHabit, focusDomain, and band are required.");
  }

  try {
    // Deactivate previous plans
    await prisma.lifestylePlan.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    const plan = await prisma.lifestylePlan.create({
      data: {
        userId,
        dailyAnchorHabit: body.dailyAnchorHabit,
        recoveryHabit: body.recoveryHabit ?? "",
        weeklyGoal: body.weeklyGoal ?? "",
        trendInsight: body.trendInsight,
        bestNextAction: body.bestNextAction ?? body.dailyAnchorHabit,
        followUpTime: body.followUpTime ?? "morning",
        expertRecommendation: body.expertRecommendation,
        focusDomain: body.focusDomain,
        supportDomain: body.supportDomain,
        band: body.band,
        active: true,
      },
    });

    return ok({ planId: plan.id });
  } catch (error) {
    return errorResponse(500, "PLAN_SAVE_ERROR", "Unable to save lifestyle plan.", {
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
    const plan = await prisma.lifestylePlan.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!plan) {
      return errorResponse(404, "NOT_FOUND", "No active lifestyle plan found.");
    }

    return ok(plan);
  } catch (error) {
    return errorResponse(500, "PLAN_FETCH_ERROR", "Unable to fetch lifestyle plan.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

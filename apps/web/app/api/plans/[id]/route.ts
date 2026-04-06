import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { ok, errorResponse } from "@/lib/api/response";

/**
 * GET /api/plans/:id — Fetch a single plan by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
      select: { id: true, userId: true, type: true, content: true, createdAt: true },
    });

    if (!plan) {
      return errorResponse(404, "NOT_FOUND", "Plan not found.");
    }

    if (!auth.isLegacy && plan.userId !== auth.userId) {
      return errorResponse(403, "FORBIDDEN", "You cannot view another user's plan.");
    }

    return ok(plan);
  } catch (err: any) {
    return errorResponse(500, "PLAN_FETCH_ERROR", err?.message ?? "Failed to fetch plan.");
  }
}

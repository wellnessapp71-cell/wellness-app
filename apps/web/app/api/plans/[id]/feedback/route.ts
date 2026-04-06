import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

/**
 * POST /api/plans/:id/feedback — Submit feedback for a plan.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_JSON", parsed.error);
  }

  const { rating, comment, wouldRecommend } = parsed.data as {
    rating?: number;
    comment?: string;
    wouldRecommend?: boolean;
  };

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse(400, "INVALID_RATING", "Rating must be between 1 and 5.");
  }

  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
      select: { id: true, userId: true, content: true },
    });

    if (!plan) {
      return errorResponse(404, "NOT_FOUND", "Plan not found.");
    }

    if (!auth.isLegacy && plan.userId !== auth.userId) {
      return errorResponse(403, "FORBIDDEN", "You cannot submit feedback for another user's plan.");
    }

    // Store feedback in plan's content JSON
    const content = (plan.content as Record<string, any>) ?? {};
    content.feedback = {
      rating,
      comment: comment ?? null,
      wouldRecommend: wouldRecommend ?? null,
      submittedAt: new Date().toISOString(),
    };

    await prisma.plan.update({
      where: { id },
      data: { content: JSON.parse(JSON.stringify(content)) },
    });

    return ok({ success: true, feedback: content.feedback });
  } catch (err: any) {
    return errorResponse(500, "FEEDBACK_ERROR", err?.message ?? "Failed to save feedback.");
  }
}

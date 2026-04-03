import { prisma } from "@aura/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/api/response";
import { resolveAuthContextFromNextRequest } from "@/lib/auth/middleware";

/**
 * GET /api/plans?userId=...&type=workout|nutrition|yoga&limit=10&cursor=...
 * List saved plans for a user, with optional type filter and cursor pagination.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = resolveAuthContextFromNextRequest(request);
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const { searchParams } = request.nextUrl;
  const requestedUserId = searchParams.get("userId");
  if (requestedUserId && !auth.isLegacy && requestedUserId !== auth.userId) {
    return errorResponse(
      403,
      "FORBIDDEN",
      "Cannot access another user's plans.",
    );
  }

  const userId = auth.userId;

  const type = searchParams.get("type") ?? undefined;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 10, 1),
    50,
  );
  const cursor = searchParams.get("cursor") ?? undefined;

  try {
    const plans = await prisma.plan.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true,
      },
    });

    const hasMore = plans.length > limit;
    const items = hasMore ? plans.slice(0, limit) : plans;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return ok({ items, nextCursor, hasMore });
  } catch (error) {
    return errorResponse(
      500,
      "DB_ERROR",
      "Unable to fetch plans.",
      serializeError(error),
    );
  }
}

function serializeError(error: unknown): { message: string } {
  return error instanceof Error
    ? { message: error.message }
    : { message: "Unknown error" };
}

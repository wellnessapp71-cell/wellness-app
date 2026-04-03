import { prisma } from "@aura/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/api/response";
import { resolveAuthContextFromNextRequest } from "@/lib/auth/middleware";

/**
 * GET /api/progress?userId=...&type=workout|nutrition|yoga&limit=10&cursor=...
 * List progress snapshots for a user, with optional type filter and cursor pagination.
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
      "Cannot access another user's progress.",
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
    const entries = await prisma.progress.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { recordedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        data: true,
        recordedAt: true,
      },
    });

    const hasMore = entries.length > limit;
    const items = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return ok({ items, nextCursor, hasMore });
  } catch (error) {
    return errorResponse(
      500,
      "DB_ERROR",
      "Unable to fetch progress.",
      serializeError(error),
    );
  }
}

function serializeError(error: unknown): { message: string } {
  return error instanceof Error
    ? { message: error.message }
    : { message: "Unknown error" };
}

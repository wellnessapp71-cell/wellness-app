/**
 * POST /api/mental/journal — Create journal entry
 * GET  /api/mental/journal — List journal entries (paginated)
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
    text: string;
    emotionTags?: string[];
    triggerTags?: string[];
    linkedScanId?: string;
  };

  if (!body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
    return errorResponse(400, "INVALID_JOURNAL", "text is required and must be non-empty.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        text: body.text.trim(),
        emotionTags: body.emotionTags ?? [],
        triggerTags: body.triggerTags ?? [],
        linkedScanId: body.linkedScanId ?? null,
      },
    });

    return ok({ entryId: entry.id, createdAt: entry.createdAt });
  } catch (error) {
    return errorResponse(500, "JOURNAL_SAVE_ERROR", "Unable to save journal entry.", {
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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const emotionFilter = url.searchParams.get("emotion");

  try {
    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        ...(emotionFilter ? {
          emotionTags: {
            array_contains: [emotionFilter],
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.journalEntry.count({ where: { userId } });

    return ok({ count: entries.length, total, entries });
  } catch (error) {
    return errorResponse(500, "JOURNAL_FETCH_ERROR", "Unable to fetch journal entries.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

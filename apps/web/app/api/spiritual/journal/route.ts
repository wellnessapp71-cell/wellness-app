/**
 * POST /api/spiritual/journal — Create spiritual journal entry
 * GET  /api/spiritual/journal — List spiritual journal entries
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
    promptType: string;
    moodTag?: string;
    gratitudeText?: string;
    reflectionText?: string;
    whatBroughtCalm?: string;
    whatTriggeredDiscomfort?: string;
    whatHelped?: string;
  };

  const validTypes = ["free", "gratitude", "reflection"];
  if (!body.promptType || !validTypes.includes(body.promptType)) {
    return errorResponse(400, "INVALID_JOURNAL", "promptType must be free, gratitude, or reflection.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const entry = await prisma.spiritualJournalEntry.create({
      data: {
        userId,
        promptType: body.promptType,
        moodTag: body.moodTag ?? null,
        gratitudeText: body.gratitudeText ?? null,
        reflectionText: body.reflectionText ?? null,
        whatBroughtCalm: body.whatBroughtCalm ?? null,
        whatTriggeredDiscomfort: body.whatTriggeredDiscomfort ?? null,
        whatHelped: body.whatHelped ?? null,
      },
    });

    return ok({ entryId: entry.id, createdAt: entry.createdAt });
  } catch (error) {
    return errorResponse(500, "JOURNAL_SAVE_ERROR", "Unable to save spiritual journal entry.", {
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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const typeFilter = url.searchParams.get("type");

  try {
    const entries = await prisma.spiritualJournalEntry.findMany({
      where: {
        userId,
        ...(typeFilter ? { promptType: typeFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.spiritualJournalEntry.count({ where: { userId } });

    return ok({ count: entries.length, total, entries });
  } catch (error) {
    return errorResponse(500, "JOURNAL_FETCH_ERROR", "Unable to fetch spiritual journal entries.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

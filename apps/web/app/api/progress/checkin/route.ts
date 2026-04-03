import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

/**
 * POST /api/progress/checkin — Save daily mood/energy/sleep check-in
 * Body: DailyCheckIn-shaped JSON
 *
 * GET /api/progress/checkin?userId=X — Get recent check-ins
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as any;
  const auth = await resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  const userId = auth?.userId ?? body.userId ?? "default";

  if (!body.mood || !body.energy || typeof body.sleepHours !== "number") {
    return errorResponse(400, "INVALID_CHECKIN", "mood, energy, and sleepHours are required");
  }

  try {
    const entry = await prisma.progress.create({
      data: {
        userId,
        type: "checkin",
        data: {
          ...body,
          userId,
          dateIso: body.dateIso ?? new Date().toISOString(),
        },
      },
    });

    return ok({ id: entry.id, saved: true });
  } catch (err: any) {
    return errorResponse(500, "CHECKIN_ERROR", err?.message ?? "Failed to save check-in");
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const auth = await resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  const userId = auth?.userId ?? searchParams.get("userId") ?? "default";
  const limit = Math.min(30, parseInt(searchParams.get("limit") ?? "7", 10));

  try {
    const entries = await prisma.progress.findMany({
      where: { userId, type: "checkin" },
      orderBy: { recordedAt: "desc" },
      take: limit,
    });

    return ok(entries.map((e) => e.data));
  } catch (err: any) {
    return errorResponse(500, "CHECKIN_FETCH_ERROR", err?.message ?? "Failed to fetch check-ins");
  }
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

/**
 * POST /api/progress/weight — Log a weight entry
 * Body: { weightKg: number, bodyFatPercent?: number }
 *
 * GET /api/progress/weight?userId=X — Get weight history
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as any;
  const auth = await resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  const userId = auth?.userId ?? body.userId ?? "default";

  if (typeof body.weightKg !== "number" || body.weightKg <= 0) {
    return errorResponse(400, "INVALID_WEIGHT", "weightKg must be a positive number");
  }

  try {
    const entry = await prisma.progress.create({
      data: {
        userId,
        type: "weight",
        data: {
          weightKg: body.weightKg,
          bodyFatPercent: body.bodyFatPercent ?? null,
          dateIso: new Date().toISOString(),
        },
      },
    });

    return ok({ id: entry.id, saved: true });
  } catch (err: any) {
    return errorResponse(500, "WEIGHT_LOG_ERROR", err?.message ?? "Failed to save weight entry");
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const auth = await resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  const userId = auth?.userId ?? searchParams.get("userId") ?? "default";
  const limit = Math.min(90, parseInt(searchParams.get("limit") ?? "30", 10));

  try {
    const entries = await prisma.progress.findMany({
      where: { userId, type: "weight" },
      orderBy: { recordedAt: "desc" },
      take: limit,
    });

    return ok(entries.map((e) => e.data));
  } catch (err: any) {
    return errorResponse(500, "WEIGHT_FETCH_ERROR", err?.message ?? "Failed to fetch weight history");
  }
}

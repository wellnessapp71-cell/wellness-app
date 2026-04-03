/**
 * POST /api/mental/checkin — Submit daily mental check-in
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
    mood: number;
    stressManual: number;
    anxiety: number;
    energy: number;
    focus: number;
    sleep: number;
    stressTriggers?: string[];
    copingAction?: string;
    supportReq?: boolean;
  };

  // Validate required slider values (1-10)
  const sliders = [
    { name: "mood", val: body.mood },
    { name: "stressManual", val: body.stressManual },
    { name: "anxiety", val: body.anxiety },
    { name: "energy", val: body.energy },
    { name: "focus", val: body.focus },
  ];

  for (const s of sliders) {
    if (typeof s.val !== "number" || s.val < 1 || s.val > 10) {
      return errorResponse(400, "INVALID_CHECKIN", `${s.name} must be an integer between 1-10.`);
    }
  }

  if (typeof body.sleep !== "number" || body.sleep < 0 || body.sleep > 24) {
    return errorResponse(400, "INVALID_CHECKIN", "sleep must be a number between 0-24.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const checkin = await prisma.mentalCheckin.create({
      data: {
        userId,
        mood: Math.round(body.mood),
        stressManual: Math.round(body.stressManual),
        anxiety: Math.round(body.anxiety),
        energy: Math.round(body.energy),
        focus: Math.round(body.focus),
        sleep: body.sleep,
        stressTriggers: body.stressTriggers ?? [],
        copingAction: body.copingAction ?? null,
        supportReq: body.supportReq ?? false,
      },
    });

    return ok({ checkinId: checkin.id, checkinDate: checkin.checkinDate });
  } catch (error) {
    return errorResponse(500, "CHECKIN_SAVE_ERROR", "Unable to save check-in.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * POST /api/click-logs — Mobile client posts a batch of telemetry events.
 * Each event: { section, screen, action?, startTs, endTs?, durationSeconds?, metadata? }
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

const eventSchema = z.object({
  section: z.string().trim().min(1).max(80),
  screen: z.string().trim().min(1).max(120),
  action: z.string().trim().min(1).max(80).optional(),
  startTs: z.string().datetime(),
  endTs: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(0).max(24 * 3600).optional(),
  device: z.string().max(40).optional(),
  platform: z.string().max(20).optional(),
  source: z.string().max(40).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = batchSchema.safeParse(parsed.data);
  if (!validation.success)
    return errorResponse(400, "INVALID_REQUEST", "Invalid telemetry payload.", validation.error.issues);

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: auth.userId, active: true },
    select: { organizationId: true, department: true },
  });

  const rows = validation.data.events.map((e) => ({
    userId: auth.userId,
    organizationId: membership?.organizationId ?? null,
    department: membership?.department ?? null,
    section: e.section,
    screen: e.screen,
    action: e.action ?? "view",
    startTs: new Date(e.startTs),
    endTs: e.endTs ? new Date(e.endTs) : null,
    durationSeconds: e.durationSeconds ?? null,
    device: e.device ?? null,
    platform: e.platform ?? null,
    source: e.source ?? "mobile",
    metadata: (e.metadata ?? undefined) as never,
  }));

  await prisma.clickLog.createMany({ data: rows });
  return ok({ accepted: rows.length });
}

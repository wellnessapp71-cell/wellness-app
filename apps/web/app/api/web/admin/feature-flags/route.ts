import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const upsertSchema = z.object({
  flagKey: z.string().trim().min(1).max(80),
  organizationId: z.string().nullable().optional(),
  module: z.string().trim().min(1).max(80),
  enabled: z.boolean().default(false),
  rolloutScope: z.record(z.string(), z.unknown()).nullable().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const module_ = url.searchParams.get("module");

  const flags = await prisma.featureFlag.findMany({
    where: {
      ...(organizationId === "global" ? { organizationId: null } : organizationId ? { organizationId } : {}),
      ...(module_ ? { module: module_ } : {}),
    },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: [{ module: "asc" }, { flagKey: "asc" }],
  });
  return ok({ flags });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  const validation = upsertSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid flag body.", validation.error.issues);
  }

  const data = validation.data;
  const existing = await prisma.featureFlag.findFirst({
    where: { flagKey: data.flagKey, organizationId: data.organizationId ?? null },
  });
  const flag = existing
    ? await prisma.featureFlag.update({
        where: { id: existing.id },
        data: {
          module: data.module,
          enabled: data.enabled,
          rolloutScope: (data.rolloutScope ?? undefined) as never,
          notes: data.notes || null,
        },
      })
    : await prisma.featureFlag.create({
        data: {
          flagKey: data.flagKey,
          organizationId: data.organizationId ?? null,
          module: data.module,
          enabled: data.enabled,
          rolloutScope: (data.rolloutScope ?? undefined) as never,
          notes: data.notes || null,
        },
      });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: data.organizationId ?? undefined,
    eventType: "admin.feature_flag.upsert",
    targetType: "feature_flag",
    targetId: flag.id,
    summary: `${data.enabled ? "Enabled" : "Disabled"} ${data.flagKey} (${data.organizationId ? "org " + data.organizationId : "global"})`,
    payload: data,
    request,
  });

  return ok({ flag }, { status: 201 });
}

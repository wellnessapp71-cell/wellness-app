import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const policySchema = z.object({
  organizationId: z.string().nullable().optional(),
  dataType: z.string().trim().min(1).max(80),
  retentionDays: z.coerce.number().int().min(1).max(3650),
  action: z.enum(["delete", "anonymize"]).default("delete"),
  enabled: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

const deletionRequestSchema = z.object({
  organizationId: z.string().nullable().optional(),
  subjectUserId: z.string().nullable().optional(),
  requestType: z.enum(["gdpr", "legal", "policy", "manual"]),
  scope: z.record(z.string(), z.unknown()),
  notes: z.string().max(1000).optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "policies";

  if (view === "deletions") {
    const deletions = await prisma.dataDeletionRequest.findMany({
      include: {
        requester: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok({ deletions });
  }

  const policies = await prisma.retentionPolicy.findMany({
    include: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: [{ organizationId: "asc" }, { dataType: "asc" }],
  });
  return ok({ policies });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  if (action === "deletion") {
    const validation = deletionRequestSchema.safeParse(parsed.data);
    if (!validation.success) {
      return errorResponse(400, "INVALID_REQUEST", "Invalid deletion request.", validation.error.issues);
    }
    const data = validation.data;
    const deletion = await prisma.dataDeletionRequest.create({
      data: {
        organizationId: data.organizationId ?? null,
        subjectUserId: data.subjectUserId ?? null,
        requesterId: auth!.userId,
        requestType: data.requestType,
        scope: data.scope as never,
        notes: data.notes ?? null,
        status: "pending",
      },
    });

    await writeAuditLog({
      actorUserId: auth!.userId,
      actorRole: auth!.role,
      organizationId: data.organizationId ?? undefined,
      eventType: "admin.deletion_request.create",
      targetType: "data_deletion_request",
      targetId: deletion.id,
      summary: `Created ${data.requestType} deletion request`,
      payload: { requestType: data.requestType },
      request,
    });

    return ok({ deletion }, { status: 201 });
  }

  const validation = policySchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid retention policy.", validation.error.issues);
  }
  const data = validation.data;
  const policy = await prisma.retentionPolicy.upsert({
    where: {
      organizationId_dataType: {
        organizationId: data.organizationId ?? "",
        dataType: data.dataType,
      },
    },
    create: {
      organizationId: data.organizationId ?? null,
      dataType: data.dataType,
      retentionDays: data.retentionDays,
      action: data.action,
      enabled: data.enabled,
      notes: data.notes ?? null,
    },
    update: {
      retentionDays: data.retentionDays,
      action: data.action,
      enabled: data.enabled,
      notes: data.notes ?? null,
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: data.organizationId ?? undefined,
    eventType: "admin.retention_policy.upsert",
    targetType: "retention_policy",
    targetId: policy.id,
    summary: `Set retention for ${data.dataType}: ${data.retentionDays} days (${data.action})`,
    payload: { dataType: data.dataType, retentionDays: data.retentionDays, action: data.action },
    request,
  });

  return ok({ policy }, { status: 201 });
}

import { prisma } from "@aura/db";

export interface AuditLogInput {
  actorUserId?: string | null;
  actorRole?: string | null;
  organizationId?: string | null;
  eventType: string;
  targetType?: string | null;
  targetId?: string | null;
  summary: string;
  payload?: Record<string, unknown> | null;
  request?: Request | null;
}

export async function writeAuditLog(input: AuditLogInput) {
  const ipAddress =
    input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    input.request?.headers.get("x-real-ip") ??
    null;
  const userAgent = input.request?.headers.get("user-agent") ?? null;

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      organizationId: input.organizationId ?? null,
      eventType: input.eventType,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      summary: input.summary,
      payload: (input.payload ?? null) as never,
      ipAddress,
      userAgent,
    },
  });
}

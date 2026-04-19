import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  organizationId: z.string().min(1).optional(),
  category: z.string().trim().min(2).max(80),
  severity: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(5).max(5000),
  source: z.enum(["employee", "hr", "technical"]).default("employee"),
});

const SEVERITY_SLA_HOURS: Record<string, number> = {
  low: 168,
  normal: 72,
  high: 24,
  critical: 4,
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Authentication required.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }
  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid complaint body.", validation.error.issues);
  }

  const data = validation.data;
  const slaDueAt = new Date(Date.now() + SEVERITY_SLA_HOURS[data.severity] * 60 * 60 * 1000);

  const complaint = await prisma.complaint.create({
    data: {
      reporterUserId: auth.userId,
      organizationId: data.organizationId ?? null,
      category: data.category,
      severity: data.severity,
      subject: data.subject,
      body: data.body,
      source: data.source,
      slaDueAt,
    },
  });

  await writeAuditLog({
    actorUserId: auth.userId,
    actorRole: auth.role,
    organizationId: data.organizationId ?? null,
    eventType: "complaint.create",
    targetType: "complaint",
    targetId: complaint.id,
    summary: `${data.source} complaint: ${data.subject}`,
    payload: { severity: data.severity, category: data.category },
    request,
  });

  return ok({ complaint }, { status: 201 });
}

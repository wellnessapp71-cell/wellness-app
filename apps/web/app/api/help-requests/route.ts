/**
 * POST /api/help-requests — Employee submits a help request from mobile.
 * GET  /api/help-requests — Employee lists their own help requests.
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  category: z.enum([
    "mental_health",
    "physical_health",
    "workplace",
    "personal",
    "technical",
    "other",
  ]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  subject: z.string().trim().min(3).max(200).optional(),
  message: z.string().trim().min(5).max(5000),
});

const SLA_HOURS: Record<string, number> = {
  urgent: 4,
  high: 24,
  normal: 72,
  low: 168,
};

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");

  const items = await prisma.helpRequest.findMany({
    where: { employeeUserId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return ok({ requests: items });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success)
    return errorResponse(400, "INVALID_REQUEST", "Invalid help request.", validation.error.issues);

  const data = validation.data;

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: auth.userId, active: true },
    select: { organizationId: true },
  });
  if (!membership)
    return errorResponse(400, "NO_ORG", "You must belong to an organization to file a help request.");

  const slaHours = SLA_HOURS[data.priority] ?? 72;
  const slaDueAt = new Date(Date.now() + slaHours * 3600 * 1000);

  const record = await prisma.helpRequest.create({
    data: {
      employeeUserId: auth.userId,
      organizationId: membership.organizationId,
      category: data.category,
      priority: data.priority,
      subject: data.subject,
      message: data.message,
      slaDueAt,
    },
  });

  await writeAuditLog({
    actorUserId: auth.userId,
    actorRole: "employee",
    organizationId: membership.organizationId,
    eventType: "help_request.create",
    targetType: "help_request",
    targetId: record.id,
    summary: `Help request filed: ${data.category}/${data.priority}`,
    payload: { category: data.category, priority: data.priority },
    request,
  });

  return ok({ request: record }, { status: 201 });
}

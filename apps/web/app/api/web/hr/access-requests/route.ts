import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  employeeUserId: z.string().min(1),
  organizationId: z.string().min(1),
  scope: z.array(z.string().min(1)).min(1),
  reason: z.string().trim().min(5).max(1000),
  purpose: z.string().trim().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const requests = await prisma.accessApproval.findMany({
    where: { hrUserId: auth!.userId },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: "desc" },
  });
  return ok({ requests });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }
  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid access request.", validation.error.issues);
  }

  const data = validation.data;
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: auth!.userId, organizationId: data.organizationId, membershipRole: "hr" },
  });
  if (!membership) {
    return errorResponse(403, "FORBIDDEN", "You are not HR for this organization.");
  }

  const created = await prisma.accessApproval.create({
    data: {
      hrUserId: auth!.userId,
      employeeUserId: data.employeeUserId,
      organizationId: data.organizationId,
      scope: data.scope,
      reason: data.reason,
      purpose: data.purpose ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      status: "pending",
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: data.organizationId,
    eventType: "hr.access_request.create",
    targetType: "access_approval",
    targetId: created.id,
    summary: `HR requested employee-level access (scope: ${data.scope.join(", ")})`,
    payload: { employeeUserId: data.employeeUserId, scope: data.scope },
    request,
  });

  return ok({ request: created }, { status: 201 });
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["accept", "decline", "route_admin", "route_professional", "close"]),
  note: z.string().max(2000).optional(),
  assignedToId: z.string().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");

  const where: Record<string, unknown> = { organizationId: hrProfile.organizationId };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const requests = await prisma.helpRequest.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: [
      { priority: "asc" },
      { createdAt: "asc" },
    ],
    take: 200,
  });

  const slaBreached = requests.filter((r) => r.slaDueAt && new Date(r.slaDueAt) < new Date() && r.status !== "closed");

  return ok({
    requests,
    stats: {
      total: requests.length,
      open: requests.filter((r) => r.status === "open").length,
      inProgress: requests.filter((r) => r.status === "in_progress").length,
      slaBreached: slaBreached.length,
    },
  });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = updateSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid request update.", validation.error.issues);
  }

  const data = validation.data;
  const existing = await prisma.helpRequest.findFirst({
    where: { id: data.id, organizationId: hrProfile.organizationId },
  });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Help request not found.");

  const statusMap: Record<string, string> = {
    accept: "in_progress",
    decline: "declined",
    route_admin: "escalated",
    route_professional: "escalated",
    close: "closed",
  };

  const nextStatus = statusMap[data.action] ?? existing.status;

  const updated = await prisma.helpRequest.update({
    where: { id: data.id },
    data: {
      status: nextStatus,
      assignedToId:
        data.action === "accept"
          ? auth!.userId
          : data.assignedToId ?? existing.assignedToId,
      ...(data.action === "close" ? { closedAt: new Date() } : {}),
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: hrProfile.organizationId,
    eventType: `hr.help_request.${data.action}`,
    targetType: "help_request",
    targetId: data.id,
    summary: `${data.action} help request from ${updated.employee?.name ?? updated.employee?.email ?? existing.employeeUserId}`,
    request,
  });

  return ok({ request: updated });
}

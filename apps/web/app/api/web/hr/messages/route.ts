import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { parseRequestJson } from "@/lib/api/validation";
import { writeAuditLog } from "@/lib/audit/log";

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["assign", "resolve", "reopen"]),
  resolutionNote: z.string().max(2000).optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const orgId = hrProfile.organizationId;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId: orgId };
  if (status && status !== "all") where.status = status;
  if (severity && severity !== "all") where.severity = severity;

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.complaint.count({ where }),
  ]);

  const stats = {
    total: await prisma.complaint.count({ where: { organizationId: orgId } }),
    open: await prisma.complaint.count({ where: { organizationId: orgId, status: "open" } }),
    inProgress: await prisma.complaint.count({ where: { organizationId: orgId, status: "in_progress" } }),
    resolved: await prisma.complaint.count({ where: { organizationId: orgId, status: "resolved" } }),
    slaBreached: await prisma.complaint.count({
      where: { organizationId: orgId, status: { not: "resolved" }, slaDueAt: { lt: new Date() } },
    }),
  };

  return ok({ complaints, stats, total, page, limit, pages: Math.ceil(total / limit) });
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
  if (!validation.success)
    return errorResponse(400, "INVALID_REQUEST", "Invalid update body.", validation.error.issues);

  const { id, action, resolutionNote } = validation.data;
  const existing = await prisma.complaint.findFirst({
    where: { id, organizationId: hrProfile.organizationId },
  });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Complaint not found.");

  const updates: Record<string, unknown> = {};
  if (action === "assign") {
    updates.assignedToId = auth!.userId;
    updates.status = "in_progress";
  } else if (action === "resolve") {
    updates.status = "resolved";
    updates.resolvedAt = new Date();
    if (resolutionNote) updates.resolutionNote = resolutionNote;
  } else if (action === "reopen") {
    updates.status = "open";
    updates.resolvedAt = null;
  }

  const updated = await prisma.complaint.update({ where: { id }, data: updates });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: hrProfile.organizationId,
    eventType: `complaint.${action}`,
    targetType: "complaint",
    targetId: id,
    summary: `HR ${action} complaint: ${existing.subject}`,
    payload: { action, resolutionNote },
    request,
  });

  return ok({ complaint: updated });
}

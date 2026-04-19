import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed", "escalated"]).optional(),
  assignedToId: z.string().nullable().optional(),
  severity: z.enum(["low", "normal", "high", "critical"]).optional(),
  resolutionNote: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await context.params;
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }
  const validation = patchSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid update.", validation.error.issues);
  }

  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Complaint not found.");

  const update: Record<string, unknown> = { ...validation.data };
  if (validation.data.status === "resolved" || validation.data.status === "closed") {
    update.resolvedAt = new Date();
  }

  const complaint = await prisma.complaint.update({ where: { id }, data: update });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: existing.organizationId,
    eventType: "admin.complaint.update",
    targetType: "complaint",
    targetId: id,
    summary: `Updated complaint ${id}`,
    payload: validation.data,
    request,
  });

  return ok({ complaint });
}

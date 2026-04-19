import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const patchSchema = z.object({
  action: z.enum(["cancel", "end"]).optional(),
  status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await context.params;
  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  const validation = patchSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid update.", validation.error.issues);
  }

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Notification not found.");

  const { action } = validation.data;
  const nextStatus = action === "cancel" ? "cancelled" : action === "end" ? "ended" : validation.data.status ?? existing.status;

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      status: nextStatus,
      endTime: action === "end" && !existing.endTime ? new Date() : existing.endTime,
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: existing.organizationId ?? undefined,
    eventType: "admin.notification.update",
    targetType: "notification",
    targetId: id,
    summary: `Set notification status to ${nextStatus}`,
    request,
  });

  return ok({ notification: updated });
}

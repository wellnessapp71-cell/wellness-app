import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const patchSchema = z.object({
  action: z.enum(["approve", "deny", "revoke"]),
  expiresAt: z.string().datetime().optional(),
  denialReason: z.string().trim().min(1).max(500).optional(),
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
    return errorResponse(400, "INVALID_REQUEST", "Invalid action.", validation.error.issues);
  }

  const existing = await prisma.accessApproval.findUnique({ where: { id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Access request not found.");

  const { action, expiresAt, denialReason } = validation.data;
  const now = new Date();

  const updated = await prisma.accessApproval.update({
    where: { id },
    data:
      action === "approve"
        ? {
            status: "approved",
            approvedAt: now,
            approvedById: auth!.userId,
            expiresAt: expiresAt ? new Date(expiresAt) : existing.expiresAt,
          }
        : action === "deny"
          ? {
              status: "denied",
              denialReason: denialReason ?? null,
            }
          : {
              status: "revoked",
              revokedAt: now,
            },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: existing.organizationId,
    eventType: `admin.access_approval.${action}`,
    targetType: "access_approval",
    targetId: id,
    summary: `${action} access request for employee ${existing.employeeUserId} by HR ${existing.hrUserId}`,
    request,
  });

  return ok({ request: updated });
}

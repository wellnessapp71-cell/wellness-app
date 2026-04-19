import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; deptId: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id, deptId } = await context.params;
  const existing = await prisma.department.findUnique({ where: { id: deptId } });
  if (!existing || existing.organizationId !== id) {
    return errorResponse(404, "NOT_FOUND", "Department not found.");
  }

  await prisma.department.delete({ where: { id: deptId } });
  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: id,
    eventType: "admin.department.delete",
    targetType: "department",
    targetId: deptId,
    summary: `Deleted department ${existing.name}`,
    request,
  });
  return ok({ deleted: true });
}

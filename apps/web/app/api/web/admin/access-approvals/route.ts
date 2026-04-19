import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const organizationId = url.searchParams.get("organizationId");

  const requests = await prisma.accessApproval.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      hr: { select: { id: true, name: true, email: true } },
      employee: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    eventType: "admin.access_approval.list",
    summary: `Listed ${requests.length} access requests`,
    request,
  });

  return ok({ requests });
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { writeAuditLog } from "@/lib/audit/log";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth?.userId) {
    return errorResponse(401, "UNAUTHORIZED", "Sign in required.");
  }

  const parsed = await parseRequestJson(request);
  const body = parsed.success ? (parsed.data as { reason?: string; scope?: string }) : {};

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: auth.userId, active: true },
    select: { organizationId: true },
  });

  const deletion = await prisma.dataDeletionRequest.create({
    data: {
      organizationId: membership?.organizationId ?? null,
      subjectUserId: auth.userId,
      requesterId: auth.userId,
      requestType: "self_delete",
      scope: { scope: body.scope ?? "full", reason: body.reason ?? null },
      status: "pending",
    },
  });

  await writeAuditLog({
    actorUserId: auth.userId,
    actorRole: auth.role,
    organizationId: membership?.organizationId ?? undefined,
    eventType: "account.delete.request",
    targetType: "user",
    targetId: auth.userId,
    summary: "User requested account deletion",
    payload: { reason: body.reason ?? null },
    request,
  });

  return ok({ requestId: deletion.id, status: "pending" });
}

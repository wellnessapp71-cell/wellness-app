import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const resolveSchema = z.object({
  id: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 100, 1), 500);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;

  const alerts = await prisma.dataQualityAlert.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { detectedAt: "desc" }],
    take,
  });

  const stats = {
    total: alerts.length,
    open: alerts.filter((a) => a.status === "open").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  };

  return ok({ alerts, stats });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = resolveSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid update.", validation.error.issues);
  }

  const data = validation.data;
  const existing = await prisma.dataQualityAlert.findUnique({ where: { id: data.id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Alert not found.");

  const nextStatus = existing.status === "open" ? "acknowledged" : "resolved";
  const updated = await prisma.dataQualityAlert.update({
    where: { id: data.id },
    data: {
      status: nextStatus,
      ...(nextStatus === "resolved" ? { resolvedAt: new Date() } : {}),
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: existing.organizationId ?? undefined,
    eventType: `admin.data_quality.${nextStatus}`,
    targetType: "data_quality_alert",
    targetId: data.id,
    summary: `${nextStatus === "acknowledged" ? "Acknowledged" : "Resolved"} data quality alert: ${existing.summary}`,
    request,
  });

  return ok({ alert: updated });
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const REPORT_TYPES = [
  "department", "access", "complaint", "incident", "professional_utilization", "engagement",
] as const;

const createSchema = z.object({
  type: z.enum(REPORT_TYPES),
  dateRangeFrom: z.string().datetime(),
  dateRangeTo: z.string().datetime(),
  organizationId: z.string().optional(),
  departmentId: z.string().optional(),
  format: z.enum(["pdf", "csv"]).default("csv"),
  scheduledEmail: z.string().email().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin", "hr"]);
  if (response) return response;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 50, 1), 200);

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const reports = await prisma.report.findMany({
    where,
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { generatedAt: "desc" },
    take,
  });

  return ok({ reports });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid report request.", validation.error.issues);
  }

  const data = validation.data;

  const report = await prisma.report.create({
    data: {
      requestedById: auth!.userId,
      type: data.type,
      dateRange: {
        from: data.dateRangeFrom,
        to: data.dateRangeTo,
        organizationId: data.organizationId ?? null,
        departmentId: data.departmentId ?? null,
      },
      format: data.format,
      scheduledEmail: data.scheduledEmail ?? null,
      status: "generating",
      generatedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: data.organizationId ?? undefined,
    eventType: "admin.report.create",
    targetType: "report",
    targetId: report.id,
    summary: `Generated ${data.type} report (${data.format})`,
    payload: { type: data.type, format: data.format },
    request,
  });

  return ok({ report }, { status: 201 });
}

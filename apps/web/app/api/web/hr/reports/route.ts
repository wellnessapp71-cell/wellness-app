import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { parseRequestJson } from "@/lib/api/validation";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  type: z.enum(["health_summary", "department_breakdown", "training_progress", "engagement", "compliance"]),
  format: z.enum(["csv", "pdf"]).default("csv"),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  scheduledEmail: z.string().email().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { requestedById: auth!.userId };
  if (type) where.type = type;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.report.count({ where }),
  ]);

  return ok({ reports, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success)
    return errorResponse(400, "INVALID_REQUEST", "Invalid report body.", validation.error.issues);

  const data = validation.data;
  const report = await prisma.report.create({
    data: {
      requestedById: auth!.userId,
      type: data.type,
      format: data.format,
      dateRange: data.dateRange,
      scheduledEmail: data.scheduledEmail ?? null,
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    eventType: "report.request",
    targetType: "report",
    targetId: report.id,
    summary: `HR requested ${data.type} report in ${data.format}`,
    payload: { type: data.type, format: data.format },
    request,
  });

  return ok({ report }, { status: 201 });
}

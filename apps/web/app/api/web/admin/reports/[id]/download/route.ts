import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";
import { generateReport, type ReportConfig } from "@/lib/reports/generate";

interface StoredDateRange {
  from: string;
  to: string;
  organizationId?: string | null;
  departmentId?: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return errorResponse(404, "NOT_FOUND", "Report not found.");

  const range = report.dateRange as unknown as StoredDateRange;
  const cfg: ReportConfig = {
    type: report.type,
    dateRange: {
      from: range.from,
      to: range.to,
      organizationId: range.organizationId ?? null,
      departmentId: range.departmentId ?? null,
    },
    format: report.format === "pdf" ? "pdf" : "csv",
  };

  const output = await generateReport(cfg);

  await prisma.report.update({
    where: { id },
    data: { status: "ready", generatedAt: new Date() },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: range.organizationId ?? undefined,
    eventType: "admin.report.download",
    targetType: "report",
    targetId: id,
    summary: `Downloaded ${report.type} report (${report.format})`,
    request,
  });

  const body = typeof output.body === "string" ? output.body : Buffer.from(output.body);
  return new NextResponse(body, {
    headers: {
      "Content-Type": output.contentType,
      "Content-Disposition": `attachment; filename="${output.filename}"`,
    },
  });
}

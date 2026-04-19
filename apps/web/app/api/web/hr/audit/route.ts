import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { renderTablePdf } from "@/lib/pdf/generate";

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const orgId = hrProfile.organizationId;
  const url = new URL(request.url);
  const eventType = url.searchParams.get("eventType");
  const actorId = url.searchParams.get("actorId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId: orgId };
  if (eventType) where.eventType = { contains: eventType, mode: "insensitive" };
  if (actorId) where.actorUserId = actorId;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const format = url.searchParams.get("format");
  if (format === "csv") {
    const logs = await prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const header = "Date,Actor,Email,Event,Target,Summary\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.createdAt.toISOString()}","${l.actor?.name ?? ""}","${l.actor?.email ?? ""}","${l.eventType}","${l.targetType ?? ""}:${l.targetId ?? ""}","${(l.summary ?? "").replace(/"/g, '""')}"`,
      )
      .join("\n");

    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const logs = await prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    const bytes = await renderTablePdf({
      title: "HR Audit Log",
      subtitle: `${logs.length} entries${from ? ` · from ${from}` : ""}${to ? ` · to ${to}` : ""}`,
      columns: [
        { key: "createdAt", label: "Timestamp", width: 110 },
        { key: "actor", label: "Actor", width: 140 },
        { key: "eventType", label: "Event", width: 110 },
        { key: "target", label: "Target" },
        { key: "summary", label: "Summary" },
      ],
      rows: logs.map((l) => ({
        createdAt: l.createdAt.toISOString().replace("T", " ").slice(0, 19),
        actor: l.actor?.email ?? l.actor?.name ?? "system",
        eventType: l.eventType,
        target: [l.targetType, l.targetId].filter(Boolean).join("/") || "—",
        summary: l.summary ?? "",
      })),
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const eventTypes = await prisma.auditLog.groupBy({
    by: ["eventType"],
    where: { organizationId: orgId },
    _count: true,
    orderBy: { _count: { eventType: "desc" } },
    take: 20,
  });

  return ok({
    logs,
    eventTypes: eventTypes.map((e) => ({ type: e.eventType, count: e._count })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

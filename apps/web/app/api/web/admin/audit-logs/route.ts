import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { renderTablePdf } from "@/lib/pdf/generate";

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const actorUserId = url.searchParams.get("actorUserId");
  const organizationId = url.searchParams.get("organizationId");
  const eventType = url.searchParams.get("eventType");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const take = Math.min(Number(url.searchParams.get("take")) || 100, 500);
  const format = url.searchParams.get("format");

  const where: Record<string, unknown> = {};
  if (actorUserId) where.actorUserId = actorUserId;
  if (organizationId) where.organizationId = organizationId;
  if (eventType) where.eventType = { startsWith: eventType };
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  if (format === "csv") {
    const header = [
      "id",
      "createdAt",
      "actorEmail",
      "actorRole",
      "organization",
      "eventType",
      "targetType",
      "targetId",
      "summary",
      "ipAddress",
    ].join(",");
    const rows = logs.map((l) =>
      [
        l.id,
        l.createdAt.toISOString(),
        l.actor?.email ?? "",
        l.actorRole ?? "",
        l.organization?.name ?? "",
        l.eventType,
        l.targetType ?? "",
        l.targetId ?? "",
        JSON.stringify(l.summary),
        l.ipAddress ?? "",
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const bytes = await renderTablePdf({
      title: "Audit Log",
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
        actor: l.actor?.email ?? l.actorRole ?? "system",
        eventType: l.eventType,
        target: [l.targetType, l.targetId].filter(Boolean).join("/") || "—",
        summary: l.summary ?? "",
      })),
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  return ok({ logs });
}

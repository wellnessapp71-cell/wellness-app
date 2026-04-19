import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";
import { renderTablePdf } from "@/lib/pdf/generate";

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const userId = url.searchParams.get("userId");
  const section = url.searchParams.get("section");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 100, 1), 500);
  const skip = Math.max(Number(url.searchParams.get("skip")) || 0, 0);
  const format = url.searchParams.get("format");

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (userId) where.userId = userId;
  if (section) where.section = section;
  if (from || to) {
    where.startTs = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.clickLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { startTs: "desc" },
      take,
      skip,
    }),
    prisma.clickLog.count({ where }),
  ]);

  if (format === "csv") {
    const header = [
      "id", "userId", "userEmail", "organization", "department", "section",
      "screen", "action", "startTs", "endTs", "durationSeconds", "device", "platform", "source",
    ].join(",");
    const rows = logs.map((l) =>
      [
        l.id,
        l.userId,
        l.user?.email ?? "",
        l.organization?.name ?? "",
        l.department ?? "",
        l.section,
        l.screen,
        l.action,
        l.startTs.toISOString(),
        l.endTs?.toISOString() ?? "",
        l.durationSeconds ?? "",
        l.device ?? "",
        l.platform ?? "",
        l.source ?? "",
      ].map((v) => JSON.stringify(String(v))).join(","),
    );
    const csv = [header, ...rows].join("\n");

    await writeAuditLog({
      actorUserId: auth!.userId,
      actorRole: auth!.role,
      eventType: "admin.click_logs.export",
      summary: `Exported ${logs.length} click logs as CSV`,
      request,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="click-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const bytes = await renderTablePdf({
      title: "Click & Access Logs",
      subtitle: `${total} entries${from ? ` · from ${from}` : ""}${to ? ` · to ${to}` : ""}`,
      columns: [
        { key: "startTs", label: "Timestamp", width: 110 },
        { key: "user", label: "User", width: 140 },
        { key: "section", label: "Section", width: 80 },
        { key: "screen", label: "Screen" },
        { key: "duration", label: "Dur (s)", width: 50 },
        { key: "platform", label: "Plat", width: 45 },
      ],
      rows: logs.map((l) => ({
        startTs: l.startTs.toISOString().replace("T", " ").slice(0, 19),
        user: l.user?.email ?? l.userId,
        section: l.section,
        screen: l.screen,
        duration: l.durationSeconds ?? "—",
        platform: l.platform ?? "—",
      })),
    });
    await writeAuditLog({
      actorUserId: auth!.userId,
      actorRole: auth!.role,
      eventType: "admin.click_logs.export",
      summary: `Exported ${logs.length} click logs as PDF`,
      request,
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="click-logs-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  return ok({ logs, total, take, skip });
}

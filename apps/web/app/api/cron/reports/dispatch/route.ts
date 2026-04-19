import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { generateReport, type ReportConfig } from "@/lib/reports/generate";
import { sendEmail } from "@/lib/email/resend";
import { writeAuditLog } from "@/lib/audit/log";

interface StoredDateRange {
  from: string;
  to: string;
  organizationId?: string | null;
  departmentId?: string | null;
}

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

function authorize(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  if (header === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

async function dispatchOne(reportId: string): Promise<{ id: string; status: string; error?: string }> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { requestedBy: { select: { email: true, name: true } } },
  });
  if (!report) return { id: reportId, status: "missing" };
  if (!report.scheduledEmail) return { id: reportId, status: "no_email" };

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

  try {
    const output = await generateReport(cfg);
    const buffer = typeof output.body === "string" ? Buffer.from(output.body, "utf8") : Buffer.from(output.body);

    const rangeLabel = `${range.from.slice(0, 10)} → ${range.to.slice(0, 10)}`;
    const subject = `Aura Wellness — ${report.type} report (${rangeLabel})`;
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#0f2628;">
<p>Hi${report.requestedBy?.name ? ` ${report.requestedBy.name}` : ""},</p>
<p>Your scheduled <strong>${report.type}</strong> report is attached (${cfg.format.toUpperCase()}).</p>
<p>Range: ${rangeLabel}</p>
<p style="color:#5a6b6e;font-size:12px;margin-top:24px;">— Aura Wellness</p>
</div>`;

    const result = await sendEmail({
      to: report.scheduledEmail,
      subject,
      html,
      text: `Your ${report.type} report (${rangeLabel}) is attached.`,
      attachments: [{
        filename: output.filename,
        content: buffer,
        contentType: output.contentType,
      }],
    });

    if (result.error) {
      await prisma.report.update({ where: { id: report.id }, data: { status: "failed" } });
      return { id: report.id, status: "failed", error: result.error };
    }

    await prisma.report.update({
      where: { id: report.id },
      data: { status: "ready", lastSentAt: new Date(), generatedAt: report.generatedAt ?? new Date() },
    });

    await writeAuditLog({
      actorUserId: report.requestedById,
      actorRole: "system",
      eventType: "report.email.dispatch",
      targetType: "report",
      targetId: report.id,
      summary: `Emailed ${report.type} report to ${report.scheduledEmail}`,
      payload: { emailId: result.id, skipped: result.skipped ?? false },
    });

    return { id: report.id, status: result.skipped ? "skipped" : "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await prisma.report.update({ where: { id: report.id }, data: { status: "failed" } });
    return { id: report.id, status: "failed", error: message };
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!authorize(request)) return unauthorized();

  const pending = await prisma.report.findMany({
    where: {
      scheduledEmail: { not: null },
      lastSentAt: null,
      status: { notIn: ["failed"] },
    },
    select: { id: true },
    take: 25,
  });

  const results = [];
  for (const p of pending) {
    results.push(await dispatchOne(p.id));
  }

  return NextResponse.json({ processed: results.length, results });
}

export async function GET(request: Request): Promise<NextResponse> {
  return POST(request);
}

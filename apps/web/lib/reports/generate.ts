import { prisma } from "@aura/db";
import { renderTablePdf, type TableColumn } from "@/lib/pdf/generate";

export interface ReportConfig {
  type: string;
  dateRange: { from: string; to: string; organizationId?: string | null; departmentId?: string | null };
  format: "pdf" | "csv";
}

export interface ReportOutput {
  body: string | Uint8Array;
  contentType: string;
  filename: string;
}

interface GeneratedReport {
  title: string;
  columns: TableColumn[];
  rows: Record<string, string | number | null | undefined>[];
}

async function buildDepartmentReport(cfg: ReportConfig): Promise<GeneratedReport> {
  const from = new Date(cfg.dateRange.from);
  const to = new Date(cfg.dateRange.to);
  const rows = await prisma.departmentHealth.findMany({
    where: {
      ...(cfg.dateRange.organizationId ? { organizationId: cfg.dateRange.organizationId } : {}),
      snapshotDate: { gte: from, lte: to },
    },
    include: { department: { select: { name: true } } },
    orderBy: { snapshotDate: "desc" },
    take: 1000,
  });
  return {
    title: "Department Health Report",
    columns: [
      { key: "date", label: "Date", width: 80 },
      { key: "department", label: "Department" },
      { key: "physical", label: "Physical", width: 55 },
      { key: "mental", label: "Mental", width: 55 },
      { key: "innerCalm", label: "Calm", width: 55 },
      { key: "lifestyle", label: "Lifestyle", width: 55 },
      { key: "participation", label: "Partic.", width: 55 },
      { key: "riskBand", label: "Risk", width: 50 },
    ],
    rows: rows.map((r) => ({
      date: r.snapshotDate.toISOString().slice(0, 10),
      department: r.department?.name ?? "—",
      physical: r.physicalScore ?? "—",
      mental: r.mentalScore ?? "—",
      innerCalm: r.innerCalmScore ?? "—",
      lifestyle: r.lifestyleScore ?? "—",
      participation: r.participationRate ?? "—",
      riskBand: r.riskBand ?? "—",
    })),
  };
}

async function buildAccessReport(cfg: ReportConfig): Promise<GeneratedReport> {
  const from = new Date(cfg.dateRange.from);
  const to = new Date(cfg.dateRange.to);
  const rows = await prisma.accessApproval.findMany({
    where: {
      requestedAt: { gte: from, lte: to },
      ...(cfg.dateRange.organizationId ? { organizationId: cfg.dateRange.organizationId } : {}),
    },
    include: {
      hr: { select: { email: true } },
      employee: { select: { email: true } },
      approvedBy: { select: { email: true } },
    },
    orderBy: { requestedAt: "desc" },
    take: 2000,
  });
  return {
    title: "HR Access Approvals",
    columns: [
      { key: "requestedAt", label: "Requested", width: 110 },
      { key: "hr", label: "HR" },
      { key: "employee", label: "Employee" },
      { key: "status", label: "Status", width: 70 },
      { key: "approvedAt", label: "Approved", width: 110 },
      { key: "approver", label: "Approver" },
    ],
    rows: rows.map((r) => ({
      requestedAt: r.requestedAt.toISOString().replace("T", " ").slice(0, 16),
      hr: r.hr?.email ?? r.hrUserId,
      employee: r.employee?.email ?? r.employeeUserId,
      status: r.status,
      approvedAt: r.approvedAt?.toISOString().replace("T", " ").slice(0, 16) ?? "—",
      approver: r.approvedBy?.email ?? "—",
    })),
  };
}

async function buildComplaintReport(cfg: ReportConfig): Promise<GeneratedReport> {
  const from = new Date(cfg.dateRange.from);
  const to = new Date(cfg.dateRange.to);
  const rows = await prisma.complaint.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(cfg.dateRange.organizationId ? { organizationId: cfg.dateRange.organizationId } : {}),
    },
    include: {
      reporter: { select: { email: true } },
      assignedTo: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return {
    title: "Complaints Report",
    columns: [
      { key: "createdAt", label: "Created", width: 110 },
      { key: "severity", label: "Severity", width: 70 },
      { key: "category", label: "Category", width: 90 },
      { key: "status", label: "Status", width: 70 },
      { key: "reporter", label: "Reporter" },
      { key: "assignedTo", label: "Assigned" },
      { key: "slaDueAt", label: "SLA Due", width: 110 },
    ],
    rows: rows.map((r) => ({
      createdAt: r.createdAt.toISOString().replace("T", " ").slice(0, 16),
      severity: r.severity,
      category: r.category,
      status: r.status,
      reporter: r.reporter?.email ?? "—",
      assignedTo: r.assignedTo?.email ?? "—",
      slaDueAt: r.slaDueAt?.toISOString().replace("T", " ").slice(0, 16) ?? "—",
    })),
  };
}

async function buildIncidentReport(cfg: ReportConfig): Promise<GeneratedReport> {
  const from = new Date(cfg.dateRange.from);
  const to = new Date(cfg.dateRange.to);
  const rows = await prisma.incident.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return {
    title: "Incident Report",
    columns: [
      { key: "createdAt", label: "Created", width: 110 },
      { key: "module", label: "Module", width: 100 },
      { key: "severity", label: "Severity", width: 70 },
      { key: "status", label: "Status", width: 80 },
      { key: "startTime", label: "Start", width: 110 },
      { key: "resolvedAt", label: "Resolved", width: 110 },
      { key: "title", label: "Title" },
    ],
    rows: rows.map((r) => ({
      createdAt: r.createdAt.toISOString().replace("T", " ").slice(0, 16),
      module: r.module,
      severity: r.severity,
      status: r.status,
      startTime: r.startTime.toISOString().replace("T", " ").slice(0, 16),
      resolvedAt: r.resolvedAt?.toISOString().replace("T", " ").slice(0, 16) ?? "—",
      title: r.title,
    })),
  };
}

async function buildProfessionalUtilizationReport(_cfg: ReportConfig): Promise<GeneratedReport> {
  const rows = await prisma.professional.findMany({ take: 500 });
  return {
    title: "Professional Utilization",
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role", width: 90 },
      { key: "verificationStatus", label: "Verified", width: 75 },
      { key: "status", label: "Status", width: 75 },
      { key: "bookable", label: "Bookable", width: 70 },
      { key: "region", label: "Region", width: 90 },
    ],
    rows: rows.map((p) => ({
      name: p.name,
      role: p.role,
      verificationStatus: p.verificationStatus,
      status: p.status,
      bookable: p.bookable ? "Yes" : "No",
      region: p.region ?? "—",
    })),
  };
}

async function buildEngagementReport(cfg: ReportConfig): Promise<GeneratedReport> {
  const from = new Date(cfg.dateRange.from);
  const to = new Date(cfg.dateRange.to);
  const rows = await prisma.clickLog.groupBy({
    by: ["organizationId", "section"],
    where: {
      startTs: { gte: from, lte: to },
      ...(cfg.dateRange.organizationId ? { organizationId: cfg.dateRange.organizationId } : {}),
    },
    _count: { _all: true },
    _sum: { durationSeconds: true },
    orderBy: { _count: { id: "desc" } },
    take: 500,
  });
  return {
    title: "Engagement Report",
    columns: [
      { key: "organizationId", label: "Organization", width: 130 },
      { key: "section", label: "Section" },
      { key: "events", label: "Events", width: 70 },
      { key: "duration", label: "Total sec", width: 80 },
    ],
    rows: rows.map((r) => ({
      organizationId: r.organizationId ?? "—",
      section: r.section,
      events: r._count._all,
      duration: r._sum.durationSeconds ?? 0,
    })),
  };
}

async function assembleReport(cfg: ReportConfig): Promise<GeneratedReport> {
  switch (cfg.type) {
    case "department":
      return buildDepartmentReport(cfg);
    case "access":
      return buildAccessReport(cfg);
    case "complaint":
      return buildComplaintReport(cfg);
    case "incident":
      return buildIncidentReport(cfg);
    case "professional_utilization":
      return buildProfessionalUtilizationReport(cfg);
    case "engagement":
      return buildEngagementReport(cfg);
    default:
      return { title: `${cfg.type} report`, columns: [{ key: "note", label: "Note" }], rows: [{ note: "No data generator registered for this type." }] };
  }
}

function rowsToCsv(columns: TableColumn[], rows: Record<string, unknown>[]): string {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export async function generateReport(cfg: ReportConfig): Promise<ReportOutput> {
  const assembled = await assembleReport(cfg);
  const slug = cfg.type.replace(/[^a-z0-9]+/gi, "-");
  const stamp = new Date().toISOString().slice(0, 10);

  if (cfg.format === "csv") {
    return {
      body: rowsToCsv(assembled.columns, assembled.rows),
      contentType: "text/csv",
      filename: `${slug}-report-${stamp}.csv`,
    };
  }

  const bytes = await renderTablePdf({
    title: assembled.title,
    subtitle: `${cfg.dateRange.from.slice(0, 10)} → ${cfg.dateRange.to.slice(0, 10)} · ${assembled.rows.length} rows`,
    columns: assembled.columns,
    rows: assembled.rows,
  });
  return {
    body: bytes,
    contentType: "application/pdf",
    filename: `${slug}-report-${stamp}.pdf`,
  };
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const SEVERITIES = ["minor", "major", "critical"] as const;
const STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
const MODULE_STATES = ["online", "degraded", "partial_outage", "outage"] as const;

const createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  module: z.string().trim().min(1).max(80),
  severity: z.enum(SEVERITIES).default("minor"),
  status: z.enum(STATUSES).default("investigating"),
  startTime: z.string().datetime().optional(),
  affectedOrgId: z.string().nullable().optional(),
  alertChannel: z.string().max(120).nullable().optional(),
  postmortemUrl: z.string().url().nullable().optional(),
  initialNote: z.string().max(2000).optional(),
});

interface TimelineEntry {
  ts: string;
  actorUserId: string | null;
  status?: string;
  note?: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const moduleName = url.searchParams.get("module");
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 100, 1), 500);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (moduleName) where.module = moduleName;

  const incidents = await prisma.incident.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { startTime: "desc" }],
    take,
  });

  // Module state heatmap derived from open incidents
  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const moduleStateMap = new Map<string, (typeof MODULE_STATES)[number]>();
  for (const inc of openIncidents) {
    const current = moduleStateMap.get(inc.module);
    const next = severityToState(inc.severity);
    if (!current || severityRank(next) > severityRank(current)) {
      moduleStateMap.set(inc.module, next);
    }
  }
  const moduleStates = Array.from(moduleStateMap.entries()).map(([module, state]) => ({ module, state }));

  return ok({ incidents, moduleStates });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid incident.", validation.error.issues);
  }

  const data = validation.data;
  const startTime = data.startTime ? new Date(data.startTime) : new Date();
  const initialEntry: TimelineEntry = {
    ts: new Date().toISOString(),
    actorUserId: auth!.userId,
    status: data.status,
    ...(data.initialNote ? { note: data.initialNote } : {}),
  };

  const incident = await prisma.incident.create({
    data: {
      title: data.title,
      module: data.module,
      severity: data.severity,
      status: data.status,
      startTime,
      affectedOrgId: data.affectedOrgId ?? null,
      alertChannel: data.alertChannel ?? null,
      postmortemUrl: data.postmortemUrl ?? null,
      timeline: [initialEntry] as never,
      ownerId: auth!.userId,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: data.affectedOrgId ?? undefined,
    eventType: "admin.incident.create",
    targetType: "incident",
    targetId: incident.id,
    summary: `Opened incident "${data.title}" (${data.severity}/${data.module})`,
    payload: { module: data.module, severity: data.severity },
    request,
  });

  return ok({ incident }, { status: 201 });
}

function severityToState(severity: string): (typeof MODULE_STATES)[number] {
  switch (severity) {
    case "critical":
      return "outage";
    case "major":
      return "partial_outage";
    case "minor":
    default:
      return "degraded";
  }
}

function severityRank(state: (typeof MODULE_STATES)[number]): number {
  return MODULE_STATES.indexOf(state);
}

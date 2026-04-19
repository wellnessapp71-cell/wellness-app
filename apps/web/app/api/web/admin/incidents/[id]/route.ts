import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
const SEVERITIES = ["minor", "major", "critical"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  postmortemUrl: z.string().url().nullable().optional(),
  alertChannel: z.string().max(120).nullable().optional(),
  note: z.string().max(2000).optional(),
  ownerId: z.string().nullable().optional(),
});

interface TimelineEntry {
  ts: string;
  actorUserId: string | null;
  status?: string;
  severity?: string;
  note?: string;
  resolved?: boolean;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await params;
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });
  if (!incident) return errorResponse(404, "NOT_FOUND", "Incident not found.");
  return ok({ incident });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Incident not found.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = patchSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid update.", validation.error.issues);
  }

  const data = validation.data;
  const timeline = Array.isArray(existing.timeline)
    ? (existing.timeline as unknown as TimelineEntry[])
    : [];
  const entry: TimelineEntry = {
    ts: new Date().toISOString(),
    actorUserId: auth!.userId,
    ...(data.status ? { status: data.status } : {}),
    ...(data.severity ? { severity: data.severity } : {}),
    ...(data.note ? { note: data.note } : {}),
  };
  // Only append timeline entry if something meaningful changed
  const hasChange =
    data.status !== undefined || data.severity !== undefined || data.note !== undefined;

  const becameResolved = data.status === "resolved" && existing.status !== "resolved";

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.severity !== undefined ? { severity: data.severity } : {}),
      ...(data.postmortemUrl !== undefined ? { postmortemUrl: data.postmortemUrl } : {}),
      ...(data.alertChannel !== undefined ? { alertChannel: data.alertChannel } : {}),
      ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
      ...(becameResolved ? { resolvedAt: new Date(), ...(entry.note ? {} : {}) } : {}),
      ...(hasChange ? { timeline: [...timeline, becameResolved ? { ...entry, resolved: true } : entry] as never } : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: existing.affectedOrgId ?? undefined,
    eventType: becameResolved ? "admin.incident.resolve" : "admin.incident.update",
    targetType: "incident",
    targetId: id,
    summary: becameResolved
      ? `Resolved incident "${existing.title}"`
      : `Updated incident "${existing.title}"`,
    payload: data as Record<string, unknown>,
    request,
  });

  return ok({ incident: updated });
}

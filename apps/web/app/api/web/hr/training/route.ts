import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const THEMES = [
  "stress", "sleep", "nutrition", "movement", "hydration", "inner_calm", "digital_balance",
] as const;
const FORMATS = [
  "micro_learning", "live_session", "challenge", "reminder", "coaching",
] as const;
const TARGET_TYPES = ["employee", "group", "department"] as const;

const createSchema = z.object({
  targetType: z.enum(TARGET_TYPES),
  targetId: z.string().min(1),
  assigneeUserId: z.string().optional(),
  theme: z.enum(THEMES),
  format: z.enum(FORMATS),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["assigned", "in_progress", "completed", "cancelled"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const theme = url.searchParams.get("theme");
  const targetType = url.searchParams.get("targetType");

  const where: Record<string, unknown> = { organizationId: hrProfile.organizationId };
  if (status) where.status = status;
  if (theme) where.theme = theme;
  if (targetType) where.targetType = targetType;

  const assignments = await prisma.trainingAssignment.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === "assigned").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    overdue: assignments.filter(
      (a) => a.dueDate && new Date(a.dueDate) < new Date() && !["completed", "cancelled"].includes(a.status),
    ).length,
  };

  return ok({ assignments, stats });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid training assignment.", validation.error.issues);
  }

  const data = validation.data;
  const assignment = await prisma.trainingAssignment.create({
    data: {
      organizationId: hrProfile.organizationId,
      createdById: auth!.userId,
      targetType: data.targetType,
      targetId: data.targetId,
      assigneeUserId: data.assigneeUserId ?? null,
      theme: data.theme,
      format: data.format,
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "assigned",
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: hrProfile.organizationId,
    eventType: "hr.training.create",
    targetType: "training_assignment",
    targetId: assignment.id,
    summary: `Created ${data.format} training "${data.title}" (${data.theme}) for ${data.targetType} ${data.targetId}`,
    payload: { theme: data.theme, format: data.format, targetType: data.targetType },
    request,
  });

  return ok({ assignment }, { status: 201 });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response) return response;

  const hrProfile = await prisma.hrProfile.findUnique({
    where: { userId: auth!.userId },
    select: { organizationId: true },
  });
  if (!hrProfile) return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = patchSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid update.", validation.error.issues);
  }

  const data = validation.data;
  const existing = await prisma.trainingAssignment.findFirst({
    where: { id: data.id, organizationId: hrProfile.organizationId },
  });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Training assignment not found.");

  const becameComplete = data.status === "completed" && existing.status !== "completed";

  const updated = await prisma.trainingAssignment.update({
    where: { id: data.id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(becameComplete ? { completedAt: new Date() } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: hrProfile.organizationId,
    eventType: becameComplete ? "hr.training.complete" : "hr.training.update",
    targetType: "training_assignment",
    targetId: data.id,
    summary: `${becameComplete ? "Completed" : "Updated"} training "${existing.title}"`,
    request,
  });

  return ok({ assignment: updated });
}

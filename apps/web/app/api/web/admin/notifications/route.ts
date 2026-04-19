import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";
import { dispatchNotificationPush } from "@/lib/push/dispatch";

const createSchema = z.object({
  organizationId: z.string().nullable().optional(),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(4000),
  audienceType: z.enum(["all", "organization", "role", "department", "cohort"]).default("all"),
  audience: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(z.enum(["in_app", "email", "push", "sms"])).default(["in_app"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  emergency: z.boolean().default(false),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const organizationId = url.searchParams.get("organizationId");

  const items = await prisma.notification.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      organization: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
  });
  return ok({ notifications: items });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid notification.", validation.error.issues);
  }

  const data = validation.data;
  const start = new Date(data.startTime);
  const now = new Date();
  const status = start <= now ? "live" : "scheduled";

  const notification = await prisma.notification.create({
    data: {
      organizationId: data.organizationId ?? null,
      title: data.title,
      body: data.body,
      audienceType: data.audienceType,
      audience: (data.audience ?? undefined) as never,
      channels: data.channels as never,
      startTime: start,
      endTime: data.endTime ? new Date(data.endTime) : null,
      emergency: data.emergency,
      status,
      createdById: auth!.userId,
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: data.organizationId ?? undefined,
    eventType: data.emergency ? "admin.notification.emergency" : "admin.notification.create",
    targetType: "notification",
    targetId: notification.id,
    summary: `${data.emergency ? "Emergency broadcast" : "Notification"}: ${data.title}`,
    payload: { audienceType: data.audienceType, channels: data.channels },
    request,
  });

  if (data.channels.includes("push") && status === "live") {
    await dispatchNotificationPush(notification.id);
  }

  return ok({ notification }, { status: 201 });
}

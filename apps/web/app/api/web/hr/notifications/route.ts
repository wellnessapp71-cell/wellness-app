import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { parseRequestJson } from "@/lib/api/validation";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(5).max(5000),
  audienceType: z.enum(["all", "department", "group"]).default("all"),
  audience: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(z.string()).default(["in_app"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  emergency: z.boolean().default(false),
});

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
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId: orgId };
  if (status && status !== "all") where.status = status;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where }),
  ]);

  return ok({ notifications, total, page, limit, pages: Math.ceil(total / limit) });
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
  if (!validation.success)
    return errorResponse(400, "INVALID_REQUEST", "Invalid notification body.", validation.error.issues);

  const data = validation.data;
  const notification = await prisma.notification.create({
    data: {
      organizationId: hrProfile.organizationId,
      title: data.title,
      body: data.body,
      audienceType: data.audienceType,
      audience: (data.audience ?? undefined) as never,
      channels: data.channels as never,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      emergency: data.emergency,
      createdById: auth!.userId,
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: hrProfile.organizationId,
    eventType: "notification.create",
    targetType: "notification",
    targetId: notification.id,
    summary: `HR sent notification: ${data.title}`,
    payload: { audienceType: data.audienceType, channels: data.channels, emergency: data.emergency },
    request,
  });

  return ok({ notification }, { status: 201 });
}

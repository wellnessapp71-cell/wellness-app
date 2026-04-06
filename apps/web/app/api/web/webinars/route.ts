import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { resolveAuthContext } from "@/lib/auth/middleware";

/**
 * GET /api/web/webinars — List upcoming webinars visible to the authenticated user.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

  try {
    const webinars = await prisma.webinarNotification.findMany({
      where: { scheduledFor: { gte: new Date() } },
      orderBy: { scheduledFor: "asc" },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        scheduledFor: true,
        deliveryStatus: true,
        audience: true,
        createdAt: true,
      },
    });

    return ok({ webinars });
  } catch (error) {
    return errorResponse(500, "WEBINAR_LIST_ERROR", "Unable to fetch webinars.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const webinarSchema = z.object({
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(8).max(500),
  scheduledFor: z.string().min(1).refine(
    (v) => !Number.isNaN(Date.parse(v)),
    "Must be a valid date/time string.",
  ),
  audience: z.string().trim().min(2).max(80).default("all"),
});

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response || !auth) {
    return response!;
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const validation = webinarSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_WEBINAR_REQUEST", "Invalid webinar body.", validation.error.issues);
  }

  const hrProfile = await prisma.hrProfile.findUnique({ where: { userId: auth.userId } });
  if (!hrProfile) {
    return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");
  }

  const webinar = await prisma.webinarNotification.create({
    data: {
      organizationId: hrProfile.organizationId,
      createdById: auth.userId,
      title: validation.data.title,
      message: validation.data.message,
      scheduledFor: new Date(validation.data.scheduledFor),
      audience: validation.data.audience,
      deliveryStatus: "scheduled",
    },
  });

  return ok({ webinar }, { status: 201 });
}

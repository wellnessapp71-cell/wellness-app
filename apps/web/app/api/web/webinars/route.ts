import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";

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

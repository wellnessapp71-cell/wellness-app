import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";

const acceptSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  meetingUrl: z.string().trim().url().optional().or(z.literal("")),
  sessionType: z.string().trim().min(2).max(50).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["psychologist"]);
  if (response || !auth) {
    return response!;
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const validation = acceptSchema.safeParse(parsed.data ?? {});
  if (!validation.success) {
    return errorResponse(400, "INVALID_ACCEPT_REQUEST", "Invalid support acceptance body.", validation.error.issues);
  }

  const { id } = await params;

  try {
    const requestRecord = await prisma.supportRequest.update({
      where: { id },
      data: {
        psychologistId: auth.userId,
        acceptedAt: new Date(),
        scheduledFor: validation.data.scheduledFor ? new Date(validation.data.scheduledFor) : null,
        meetingUrl: validation.data.meetingUrl || null,
        sessionType: validation.data.sessionType ?? undefined,
        status: validation.data.scheduledFor ? "scheduled" : "accepted",
        sessionEvents: {
          create: {
            actorUserId: auth.userId,
            eventType: "accepted",
            payload: {
              scheduledFor: validation.data.scheduledFor ?? null,
              meetingUrl: validation.data.meetingUrl || null,
            },
          },
        },
      },
      include: {
        user: true,
        psychologist: true,
      },
    });

    return ok({ supportRequest: requestRecord });
  } catch (error) {
    return errorResponse(500, "ACCEPT_SUPPORT_REQUEST_ERROR", "Unable to accept support request.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

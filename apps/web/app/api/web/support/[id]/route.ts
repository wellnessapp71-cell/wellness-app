import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";

const updateSchema = z.object({
  status: z.string().trim().min(2).max(40).optional(),
  scheduledFor: z.string().datetime().optional().or(z.literal("")),
  meetingUrl: z.string().trim().url().optional().or(z.literal("")),
  sessionNotes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["psychologist", "hr", "admin"]);
  if (response || !auth) {
    return response!;
  }

  const { id } = await params;

  try {
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id },
      include: {
        user: true,
        organization: true,
        psychologist: true,
        sessionEvents: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });

    if (!supportRequest) {
      return errorResponse(404, "SUPPORT_REQUEST_NOT_FOUND", "Support request not found.");
    }

    if (auth.role === "psychologist" && supportRequest.psychologistId && supportRequest.psychologistId !== auth.userId) {
      return errorResponse(403, "FORBIDDEN", "This session is assigned to another psychologist.");
    }

    return ok({ supportRequest });
  } catch (error) {
    return errorResponse(500, "SUPPORT_REQUEST_FETCH_ERROR", "Unable to fetch support request.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["psychologist", "admin"]);
  if (response || !auth) {
    return response!;
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const validation = updateSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_SUPPORT_UPDATE", "Invalid session update body.", validation.error.issues);
  }

  const { id } = await params;
  const data = validation.data;

  try {
    const supportRequest = await prisma.supportRequest.update({
      where: { id },
      data: {
        status: data.status ?? undefined,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : data.scheduledFor === "" ? null : undefined,
        meetingUrl: data.meetingUrl === "" ? null : data.meetingUrl ?? undefined,
        sessionNotes: data.sessionNotes === "" ? null : data.sessionNotes ?? undefined,
        psychologistId: auth.role === "psychologist" ? auth.userId : undefined,
        sessionEvents: {
          create: {
            actorUserId: auth.userId,
            eventType: "updated",
            payload: data,
          },
        },
      },
      include: {
        user: true,
        organization: true,
        psychologist: true,
      },
    });

    return ok({ supportRequest });
  } catch (error) {
    return errorResponse(500, "SUPPORT_REQUEST_UPDATE_ERROR", "Unable to update support request.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

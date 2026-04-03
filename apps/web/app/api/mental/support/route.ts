/**
 * POST /api/mental/support — Create a support/booking request
 * GET  /api/mental/support — List support requests
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

const VALID_MODES = ["chat", "audio", "video", "in_person"];

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as {
    userId?: string;
    issueType: string;
    preferredMode: string;
    sessionType?: string;
    language?: string;
    style?: string;
    reason?: string;
    outcome?: string;
  };

  if (!body.issueType || typeof body.issueType !== "string") {
    return errorResponse(400, "INVALID_SUPPORT", "issueType is required.");
  }

  if (!VALID_MODES.includes(body.preferredMode)) {
    return errorResponse(400, "INVALID_SUPPORT", `preferredMode must be one of: ${VALID_MODES.join(", ")}.`);
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const membership = await prisma.organizationMembership.findFirst({
      where: { userId, active: true },
      select: { organizationId: true },
    });

    const request_ = await prisma.supportRequest.create({
      data: {
        userId,
        organizationId: membership?.organizationId ?? null,
        issueType: body.issueType,
        preferredMode: body.preferredMode,
        sessionType: body.sessionType ?? body.preferredMode,
        language: body.language ?? null,
        style: body.style ?? null,
        reason: body.reason ?? null,
        outcome: body.outcome ?? null,
        status: "pending",
        sessionEvents: {
          create: {
            actorUserId: auth.isLegacy ? null : userId,
            eventType: "requested",
            payload: {
              issueType: body.issueType,
              preferredMode: body.preferredMode,
              sessionType: body.sessionType ?? body.preferredMode,
            },
          },
        },
      },
      include: {
        organization: true,
        psychologist: {
          select: { id: true, name: true, email: true },
        },
        sessionEvents: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            actor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return ok({ supportRequest: mapSupportRequest(request_) });
  } catch (error) {
    return errorResponse(500, "SUPPORT_SAVE_ERROR", "Unable to create support request.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? auth.userId;

  try {
    const requests = await prisma.supportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        organization: true,
        psychologist: {
          select: { id: true, name: true, email: true },
        },
        sessionEvents: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            actor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return ok({ count: requests.length, requests: requests.map(mapSupportRequest) });
  } catch (error) {
    return errorResponse(500, "SUPPORT_FETCH_ERROR", "Unable to fetch support requests.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function mapSupportRequest(request: {
  id: string;
  userId: string;
  issueType: string;
  preferredMode: string;
  sessionType: string;
  status: string;
  language: string | null;
  style: string | null;
  reason: string | null;
  outcome: string | null;
  scheduledFor: Date | null;
  acceptedAt: Date | null;
  meetingUrl: string | null;
  sessionNotes: string | null;
  createdAt: Date;
  organization: { id: string; name: string; referralCode: string } | null;
  psychologist: { id: string; name: string | null; email: string } | null;
  sessionEvents: Array<{
    id: string;
    eventType: string;
    createdAt: Date;
    actor: { id: string; name: string | null; email: string } | null;
  }>;
}) {
  return {
    requestId: request.id,
    userId: request.userId,
    issueType: request.issueType,
    preferredMode: request.preferredMode,
    sessionType: request.sessionType,
    status: request.status,
    language: request.language,
    preferredStyle: request.style,
    reason: request.reason,
    desiredOutcome: request.outcome,
    organizationId: request.organization?.id ?? undefined,
    organizationName: request.organization?.name ?? undefined,
    psychologistId: request.psychologist?.id ?? undefined,
    psychologistName: request.psychologist?.name ?? request.psychologist?.email ?? undefined,
    scheduledForIso: request.scheduledFor?.toISOString(),
    acceptedAtIso: request.acceptedAt?.toISOString(),
    meetingUrl: request.meetingUrl ?? undefined,
    sessionNotes: request.sessionNotes ?? undefined,
    createdAtIso: request.createdAt.toISOString(),
    events: request.sessionEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      createdAtIso: event.createdAt.toISOString(),
      actorName: event.actor?.name ?? event.actor?.email ?? null,
    })),
  };
}

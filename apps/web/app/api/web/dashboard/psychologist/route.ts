import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["psychologist"]);
  if (response || !auth) {
    return response!;
  }

  try {
    const [profile, openRequests, acceptedRequests] = await Promise.all([
      prisma.psychologistProfile.findUnique({
        where: { userId: auth.userId },
      }),
      prisma.supportRequest.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          organization: true,
        },
      }),
      prisma.supportRequest.findMany({
        where: { psychologistId: auth.userId, status: { in: ["accepted", "scheduled", "in_progress"] } },
        orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          organization: true,
        },
      }),
    ]);

    if (!profile) {
      return errorResponse(404, "PSYCHOLOGIST_PROFILE_NOT_FOUND", "Psychologist profile not found.");
    }

    return ok({
      profile: {
        verificationStatus: profile.verificationStatus,
        specialties: profile.specialties,
        sessionModes: profile.sessionModes,
        yearsExperience: profile.yearsExperience,
        education: profile.education,
      },
      openRequests: openRequests.map(toSessionCard),
      acceptedRequests: acceptedRequests.map(toSessionCard),
    });
  } catch (error) {
    return errorResponse(500, "PSYCHOLOGIST_DASHBOARD_ERROR", "Unable to load psychologist dashboard.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function toSessionCard(request: {
  id: string;
  user: {
    name: string | null;
    email: string;
    profile: {
      scoreMental: number;
      scorePhysical: number;
      scoreSpiritual: number;
      scoreLifestyle: number;
      sleepHours: number | null;
    } | null;
  };
  organization: { name: string } | null;
  issueType: string;
  preferredMode: string;
  sessionType: string;
  status: string;
  language: string | null;
  style: string | null;
  reason: string | null;
  outcome: string | null;
  scheduledFor: Date | null;
  createdAt: Date;
}) {
  return {
    id: request.id,
    employeeName: request.user.name ?? request.user.email,
    organizationName: request.organization?.name ?? "Independent",
    issueType: request.issueType,
    preferredMode: request.preferredMode,
    sessionType: request.sessionType,
    status: request.status,
    language: request.language,
    style: request.style,
    reason: request.reason,
    outcome: request.outcome,
    wellbeingAverage: request.user.profile
      ? Math.round(
          (
            request.user.profile.scoreMental +
            request.user.profile.scorePhysical +
            request.user.profile.scoreSpiritual +
            request.user.profile.scoreLifestyle
          ) / 4,
        )
      : null,
    sleepHours: request.user.profile?.sleepHours ?? null,
    scheduledFor: request.scheduledFor,
    requestedAt: request.createdAt,
  };
}

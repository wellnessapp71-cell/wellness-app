import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["hr"]);
  if (response || !auth) {
    return response!;
  }

  try {
    const hrProfile = await prisma.hrProfile.findUnique({
      where: { userId: auth.userId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { active: true, membershipRole: "employee" },
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
            webinarNotifications: {
              orderBy: { scheduledFor: "desc" },
              take: 10,
            },
            supportRequests: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: {
                user: true,
                psychologist: true,
              },
            },
          },
        },
      },
    });

    if (!hrProfile) {
      return errorResponse(404, "HR_PROFILE_NOT_FOUND", "HR profile not found.");
    }

    const employees = hrProfile.organization.memberships.map((membership) => {
      const profile = membership.user.profile;
      const wellbeingAverage =
        profile
          ? Math.round(
              (profile.scoreMental + profile.scorePhysical + profile.scoreSpiritual + profile.scoreLifestyle) / 4,
            )
          : null;

      return {
        userId: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        department: membership.department,
        title: membership.title,
        profileSummary: profile
          ? {
              age: profile.age,
              gender: profile.gender,
              activityLevel: profile.activityLevel,
              sleepHours: profile.sleepHours,
              updatedAt: profile.updatedAt,
            }
          : null,
        scores: profile
          ? {
              mental: profile.scoreMental,
              physical: profile.scorePhysical,
              spiritual: profile.scoreSpiritual,
              lifestyle: profile.scoreLifestyle,
              wellbeingAverage,
            }
          : null,
      };
    });

    const averages = employees.reduce(
      (acc, employee) => {
        if (!employee.scores) return acc;
        acc.mental += employee.scores.mental;
        acc.physical += employee.scores.physical;
        acc.spiritual += employee.scores.spiritual;
        acc.lifestyle += employee.scores.lifestyle;
        acc.count += 1;
        return acc;
      },
      { mental: 0, physical: 0, spiritual: 0, lifestyle: 0, count: 0 },
    );

    return ok({
      organization: {
        id: hrProfile.organization.id,
        name: hrProfile.organization.name,
        referralCode: hrProfile.organization.referralCode,
        industry: hrProfile.organization.industry,
        companySize: hrProfile.organization.companySize,
      },
      metrics: {
        employeeCount: employees.length,
        averageMental: averages.count ? Math.round(averages.mental / averages.count) : 0,
        averagePhysical: averages.count ? Math.round(averages.physical / averages.count) : 0,
        averageSpiritual: averages.count ? Math.round(averages.spiritual / averages.count) : 0,
        averageLifestyle: averages.count ? Math.round(averages.lifestyle / averages.count) : 0,
      },
      employees,
      webinars: hrProfile.organization.webinarNotifications,
      supportRequests: hrProfile.organization.supportRequests.map((request) => ({
        id: request.id,
        employeeName: request.user.name,
        status: request.status,
        issueType: request.issueType,
        sessionType: request.sessionType,
        preferredMode: request.preferredMode,
        language: request.language,
        reason: request.reason,
        outcome: request.outcome,
        scheduledFor: request.scheduledFor,
        psychologistName: request.psychologist?.name ?? null,
      })),
    });
  } catch (error) {
    return errorResponse(500, "HR_DASHBOARD_ERROR", "Unable to load HR dashboard.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) {
    return response;
  }

  try {
    const [organizations, pendingSessions, psychologists, employees] = await Promise.all([
      prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          memberships: {
            where: { active: true },
            select: { id: true, membershipRole: true },
          },
          webinarNotifications: {
            orderBy: { scheduledFor: "desc" },
            take: 1,
            select: { id: true, title: true, scheduledFor: true, deliveryStatus: true },
          },
        },
      }),
      prisma.supportRequest.count({ where: { status: "pending" } }),
      prisma.psychologistProfile.count(),
      prisma.organizationMembership.count({ where: { membershipRole: "employee", active: true } }),
    ]);

    return ok({
      stats: {
        organizationCount: organizations.length,
        employeeCount: employees,
        psychologistCount: psychologists,
        pendingSessionCount: pendingSessions,
      },
      organizations: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        referralCode: organization.referralCode,
        industry: organization.industry,
        companySize: organization.companySize,
        active: organization.active,
        employeeCount: organization.memberships.filter((m) => m.membershipRole === "employee").length,
        hrCount: organization.memberships.filter((m) => m.membershipRole === "hr").length,
        latestWebinar: organization.webinarNotifications[0] ?? null,
      })),
    });
  } catch (error) {
    return errorResponse(500, "ADMIN_DASHBOARD_ERROR", "Unable to load admin dashboard.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

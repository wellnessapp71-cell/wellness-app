import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

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
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const department = url.searchParams.get("department");

  const dateFilter: Record<string, unknown> = {};
  if (from || to) {
    dateFilter.startTs = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const where: Record<string, unknown> = {
    organizationId: orgId,
    ...dateFilter,
  };
  if (department) where.department = department;

  const logs = await prisma.clickLog.findMany({
    where,
    select: {
      section: true,
      screen: true,
      action: true,
      durationSeconds: true,
      department: true,
      startTs: true,
      userId: true,
    },
    orderBy: { startTs: "desc" },
    take: 5000,
  });

  const sectionCounts: Record<string, number> = {};
  const sectionDuration: Record<string, number> = {};
  const departmentSections: Record<string, Record<string, number>> = {};
  const uniqueUsers = new Set<string>();
  const dailyActive: Record<string, Set<string>> = {};

  for (const log of logs) {
    sectionCounts[log.section] = (sectionCounts[log.section] ?? 0) + 1;
    sectionDuration[log.section] = (sectionDuration[log.section] ?? 0) + (log.durationSeconds ?? 0);
    uniqueUsers.add(log.userId);

    const day = log.startTs.toISOString().slice(0, 10);
    if (!dailyActive[day]) dailyActive[day] = new Set();
    dailyActive[day].add(log.userId);

    const dept = log.department ?? "unknown";
    if (!departmentSections[dept]) departmentSections[dept] = {};
    departmentSections[dept][log.section] = (departmentSections[dept][log.section] ?? 0) + 1;
  }

  const topSections = Object.entries(sectionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([section, count]) => ({
      section,
      count,
      avgDuration: count > 0 ? Math.round((sectionDuration[section] ?? 0) / count) : 0,
    }));

  const dailyActiveUsers = Object.entries(dailyActive)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, users]) => ({ date, count: users.size }));

  const byDepartment = Object.entries(departmentSections).map(([dept, sections]) => ({
    department: dept,
    totalActions: Object.values(sections).reduce((a, b) => a + b, 0),
    topSections: Object.entries(sections)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([section, count]) => ({ section, count })),
  }));

  return ok({
    totalActions: logs.length,
    uniqueUsers: uniqueUsers.size,
    topSections,
    dailyActiveUsers,
    byDepartment,
  });
}

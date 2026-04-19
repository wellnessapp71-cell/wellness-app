import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

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
  const dateFrom = url.searchParams.get("from");
  const dateTo = url.searchParams.get("to");

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { departmentHealth: true } },
    },
    orderBy: { name: "asc" },
  });

  const healthWhere: Record<string, unknown> = { organizationId: orgId };
  if (dateFrom || dateTo) {
    healthWhere.snapshotDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const healthSnapshots = await prisma.departmentHealth.findMany({
    where: healthWhere,
    orderBy: [{ departmentName: "asc" }, { snapshotDate: "desc" }],
    take: 500,
  });

  const latestByDept = new Map<string, typeof healthSnapshots[0]>();
  for (const snap of healthSnapshots) {
    if (!latestByDept.has(snap.departmentName)) {
      latestByDept.set(snap.departmentName, snap);
    }
  }

  const membershipCounts = await prisma.organizationMembership.groupBy({
    by: ["department"],
    where: { organizationId: orgId, active: true },
    _count: { _all: true },
  });
  const empByDept = new Map(membershipCounts.map((m) => [m.department, m._count._all]));

  const trainingCounts = await prisma.trainingAssignment.groupBy({
    by: ["targetId"],
    where: {
      organizationId: orgId,
      targetType: "department",
      status: { not: "cancelled" },
    },
    _count: { _all: true },
  });
  const trainByDept = new Map(trainingCounts.map((t) => [t.targetId, t._count._all]));

  const enriched = departments.map((d) => {
    const health = latestByDept.get(d.name) ?? null;
    return {
      id: d.id,
      name: d.name,
      parentId: d.parentId,
      employeeCount: empByDept.get(d.name) ?? 0,
      activeTrainings: trainByDept.get(d.id) ?? 0,
      health: health
        ? {
            snapshotDate: health.snapshotDate,
            physicalScore: health.physicalScore,
            mentalScore: health.mentalScore,
            innerCalmScore: health.innerCalmScore,
            lifestyleScore: health.lifestyleScore,
            participationRate: health.participationRate,
            riskBand: health.riskBand,
            employeeCount: health.employeeCount,
          }
        : null,
    };
  });

  const trends = Array.from(latestByDept.keys()).map((deptName) => ({
    departmentName: deptName,
    snapshots: healthSnapshots
      .filter((s) => s.departmentName === deptName)
      .slice(0, 12)
      .reverse(),
  }));

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: orgId,
    eventType: "hr.departments.list",
    summary: `Viewed ${departments.length} departments`,
    request,
  });

  return ok({ departments: enriched, trends });
}

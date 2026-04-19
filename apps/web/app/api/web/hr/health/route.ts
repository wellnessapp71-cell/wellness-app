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

  const dateFilter: Record<string, unknown> = {};
  if (from || to) {
    dateFilter.snapshotDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const snapshots = await prisma.departmentHealth.findMany({
    where: { organizationId: orgId, ...dateFilter },
    orderBy: [{ snapshotDate: "desc" }, { departmentName: "asc" }],
    take: 500,
  });

  const latestDate = snapshots[0]?.snapshotDate ?? null;
  const latestSnapshots = latestDate
    ? snapshots.filter((s) => s.snapshotDate.getTime() === latestDate.getTime())
    : [];

  const aggregate = latestSnapshots.length > 0
    ? {
        physicalScore: avg(latestSnapshots.map((s) => s.physicalScore)),
        mentalScore: avg(latestSnapshots.map((s) => s.mentalScore)),
        innerCalmScore: avg(latestSnapshots.map((s) => s.innerCalmScore)),
        lifestyleScore: avg(latestSnapshots.map((s) => s.lifestyleScore)),
        participationRate: avg(latestSnapshots.map((s) => s.participationRate)),
        totalEmployees: latestSnapshots.reduce((sum, s) => sum + s.employeeCount, 0),
        departmentCount: latestSnapshots.length,
        snapshotDate: latestDate,
      }
    : null;

  const riskCounts: Record<string, number> = {};
  for (const s of latestSnapshots) {
    const band = s.riskBand ?? "unknown";
    riskCounts[band] = (riskCounts[band] ?? 0) + 1;
  }

  const byDepartment = latestSnapshots.map((s) => ({
    departmentName: s.departmentName,
    physicalScore: s.physicalScore,
    mentalScore: s.mentalScore,
    innerCalmScore: s.innerCalmScore,
    lifestyleScore: s.lifestyleScore,
    participationRate: s.participationRate,
    riskBand: s.riskBand,
    employeeCount: s.employeeCount,
  }));

  const uniqueDates = [...new Set(snapshots.map((s) => s.snapshotDate.toISOString().slice(0, 10)))].slice(0, 12);
  const trendByDate = uniqueDates.map((date) => {
    const daySnaps = snapshots.filter((s) => s.snapshotDate.toISOString().slice(0, 10) === date);
    return {
      date,
      physicalScore: avg(daySnaps.map((s) => s.physicalScore)),
      mentalScore: avg(daySnaps.map((s) => s.mentalScore)),
      innerCalmScore: avg(daySnaps.map((s) => s.innerCalmScore)),
      lifestyleScore: avg(daySnaps.map((s) => s.lifestyleScore)),
      participationRate: avg(daySnaps.map((s) => s.participationRate)),
    };
  }).reverse();

  return ok({ aggregate, riskCounts, byDepartment, trendByDate });
}

function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

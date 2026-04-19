import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const period = url.searchParams.get("period") ?? "monthly";
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 200, 1), 500);

  const where: Record<string, unknown> = { period };
  if (organizationId) where.organizationId = organizationId;

  const benchmarks = await prisma.usageBenchmark.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: [{ periodStart: "desc" }, { organizationId: "asc" }],
    take,
  });

  // Group by org for comparison
  const byOrg = new Map<string, typeof benchmarks>();
  for (const b of benchmarks) {
    const key = b.organizationId;
    if (!byOrg.has(key)) byOrg.set(key, []);
    byOrg.get(key)!.push(b);
  }

  const orgSummaries = Array.from(byOrg.entries()).map(([orgId, rows]) => {
    const org = rows[0]?.organization;
    const latest = rows[0];
    const previous = rows[1];
    const engagementTrend =
      latest && previous && latest.engagementRate != null && previous.engagementRate != null
        ? latest.engagementRate - previous.engagementRate
        : null;
    const completionTrend =
      latest && previous && latest.completionRate != null && previous.completionRate != null
        ? latest.completionRate - previous.completionRate
        : null;

    return {
      organizationId: orgId,
      organizationName: org?.name ?? orgId,
      latestPeriodStart: latest?.periodStart ?? null,
      engagementRate: latest?.engagementRate ?? null,
      completionRate: latest?.completionRate ?? null,
      engagementTrend,
      completionTrend,
      sectionUsage: latest?.sectionUsage ?? null,
      periods: rows.length,
    };
  });

  // Department breakdown for selected org
  let departmentBreakdown: typeof benchmarks = [];
  if (organizationId) {
    departmentBreakdown = benchmarks.filter((b) => b.departmentName != null);
  }

  return ok({ benchmarks, orgSummaries, departmentBreakdown });
}

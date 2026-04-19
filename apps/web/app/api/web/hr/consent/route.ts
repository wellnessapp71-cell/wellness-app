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
  const scope = url.searchParams.get("scope");
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId: orgId };
  if (scope) where.scope = scope;
  if (status === "active") {
    where.revokedAt = null;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  } else if (status === "revoked") {
    where.revokedAt = { not: null };
  } else if (status === "expired") {
    where.revokedAt = null;
    where.expiresAt = { lte: new Date() };
  }

  const [consents, total] = await Promise.all([
    prisma.consent.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { grantedAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.consent.count({ where }),
  ]);

  const allOrgConsents = await prisma.consent.findMany({
    where: { organizationId: orgId },
    select: { revokedAt: true, expiresAt: true, scope: true },
  });

  const now = new Date();
  let active = 0;
  let revoked = 0;
  let expired = 0;
  const scopeCounts: Record<string, number> = {};

  for (const c of allOrgConsents) {
    if (c.revokedAt) {
      revoked++;
    } else if (c.expiresAt && c.expiresAt <= now) {
      expired++;
    } else {
      active++;
      scopeCounts[c.scope] = (scopeCounts[c.scope] ?? 0) + 1;
    }
  }

  return ok({
    consents,
    stats: { total: allOrgConsents.length, active, revoked, expired, byScope: scopeCounts },
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

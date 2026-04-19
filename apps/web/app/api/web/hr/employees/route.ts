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
  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    organizationId: orgId,
  };

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [members, total] = await Promise.all([
    prisma.organizationMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.organizationMembership.count({ where }),
  ]);

  const userIds = members.map((m) => m.userId);

  const [consents, accessApprovals] = await Promise.all([
    prisma.consent.findMany({
      where: { organizationId: orgId, employeeUserId: { in: userIds }, revokedAt: null },
      select: { employeeUserId: true, scope: true, grantedAt: true, expiresAt: true },
    }),
    prisma.accessApproval.findMany({
      where: { organizationId: orgId, employeeUserId: { in: userIds }, status: "approved" },
      select: { employeeUserId: true, scope: true, expiresAt: true },
    }),
  ]);

  const consentMap = new Map<string, Array<{ scope: string; grantedAt: Date; expiresAt: Date | null }>>();
  for (const c of consents) {
    const arr = consentMap.get(c.employeeUserId) ?? [];
    arr.push({ scope: c.scope, grantedAt: c.grantedAt, expiresAt: c.expiresAt });
    consentMap.set(c.employeeUserId, arr);
  }

  const approvalMap = new Map<string, Array<{ scope: unknown; expiresAt: Date | null }>>();
  for (const a of accessApprovals) {
    const arr = approvalMap.get(a.employeeUserId) ?? [];
    arr.push({ scope: a.scope, expiresAt: a.expiresAt });
    approvalMap.set(a.employeeUserId, arr);
  }

  const employees = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.user.role,
    department: m.department,
    joinedAt: m.joinedAt,
    consents: consentMap.get(m.userId) ?? [],
    approvedAccess: approvalMap.get(m.userId) ?? [],
    hasConsent: (consentMap.get(m.userId) ?? []).length > 0,
    hasApprovedAccess: (approvalMap.get(m.userId) ?? []).length > 0,
  }));

  return ok({ employees, total, page, limit, pages: Math.ceil(total / limit) });
}

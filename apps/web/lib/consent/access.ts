import { prisma } from "@aura/db";

export type ConsentScope =
  | "employee_profile"
  | "scores"
  | "usage_analytics"
  | "journal"
  | "full";

export interface AccessCheck {
  allowed: boolean;
  reason: "consent" | "approval" | "help_request" | "admin_override" | "denied";
  expiresAt?: Date | null;
}

/**
 * Determines whether an HR user can view employee-level detail for a given scope.
 * PRD: aggregate by default; employee-level only via consent, approved access
 * request, or active help request.
 */
export async function canHrAccessEmployee(params: {
  hrUserId: string;
  employeeUserId: string;
  organizationId: string;
  scope: ConsentScope;
}): Promise<AccessCheck> {
  const now = new Date();

  const consent = await prisma.consent.findFirst({
    where: {
      employeeUserId: params.employeeUserId,
      organizationId: params.organizationId,
      scope: { in: [params.scope, "full"] },
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  if (consent) return { allowed: true, reason: "consent", expiresAt: consent.expiresAt };

  const approval = await prisma.accessApproval.findFirst({
    where: {
      hrUserId: params.hrUserId,
      employeeUserId: params.employeeUserId,
      organizationId: params.organizationId,
      status: "approved",
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  if (approval) return { allowed: true, reason: "approval", expiresAt: approval.expiresAt };

  const openHelp = await prisma.helpRequest.findFirst({
    where: {
      employeeUserId: params.employeeUserId,
      organizationId: params.organizationId,
      status: { in: ["open", "in_progress"] },
    },
  });
  if (openHelp) return { allowed: true, reason: "help_request" };

  return { allowed: false, reason: "denied" };
}

export async function listEmployeesWithAccess(params: {
  hrUserId: string;
  organizationId: string;
}): Promise<string[]> {
  const now = new Date();
  const [approvals, consents, openHelp] = await Promise.all([
    prisma.accessApproval.findMany({
      where: {
        hrUserId: params.hrUserId,
        organizationId: params.organizationId,
        status: "approved",
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { employeeUserId: true },
    }),
    prisma.consent.findMany({
      where: {
        organizationId: params.organizationId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { employeeUserId: true },
    }),
    prisma.helpRequest.findMany({
      where: {
        organizationId: params.organizationId,
        status: { in: ["open", "in_progress"] },
      },
      select: { employeeUserId: true },
    }),
  ]);

  return Array.from(
    new Set([
      ...approvals.map((a) => a.employeeUserId),
      ...consents.map((c) => c.employeeUserId),
      ...openHelp.map((h) => h.employeeUserId),
    ]),
  );
}

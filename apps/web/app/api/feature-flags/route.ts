/**
 * GET /api/feature-flags — Returns flag map for the authenticated user's organization.
 * Mobile and web clients call this on session start and after background resume.
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { resolveFlagsMap } from "@/lib/feature-flags/resolve";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      organizationMemberships: { select: { organizationId: true, department: true } },
    },
  });

  const membership = user?.organizationMemberships[0];
  const orgId = membership?.organizationId ?? null;
  const department = membership?.department ?? null;

  const flags = await resolveFlagsMap(orgId, { userId: auth.userId, departmentId: department });
  return ok({ flags, organizationId: orgId });
}

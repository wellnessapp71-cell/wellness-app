import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  industry: z.string().trim().max(100).nullable().optional(),
  companySize: z.coerce.number().int().positive().max(500000).nullable().optional(),
  website: z.string().trim().url().nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional(),
  contactPhone: z.string().trim().min(7).max(30).nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await params;
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      branding: true,
      _count: {
        select: {
          memberships: true,
          hrProfiles: true,
          departments: true,
          hrReferralCodes: true,
          notifications: true,
          complaints: true,
          incidents: true,
          helpRequests: true,
        },
      },
    },
  });

  if (!organization) {
    return errorResponse(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
  }

  return ok({ organization });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.organization.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return errorResponse(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = patchSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid organization update.", validation.error.issues);
  }

  const data = validation.data;
  const updated = await prisma.organization.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.industry !== undefined ? { industry: data.industry || null } : {}),
      ...(data.companySize !== undefined ? { companySize: data.companySize ?? null } : {}),
      ...(data.website !== undefined ? { website: data.website || null } : {}),
      ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail || null } : {}),
      ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone || null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: id,
    eventType: data.active === false ? "admin.organization.deactivate" : "admin.organization.update",
    targetType: "organization",
    targetId: id,
    summary: `Updated organization ${existing.name}`,
    payload: data as Record<string, unknown>,
    request,
  });

  return ok({ organization: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.organization.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return errorResponse(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");

  try {
    await prisma.organization.delete({ where: { id } });
    await writeAuditLog({
      actorUserId: auth!.userId,
      actorRole: auth!.role,
      eventType: "admin.organization.delete",
      targetType: "organization",
      targetId: id,
      summary: `Deleted organization ${existing.name}`,
      request,
    });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(500, "DELETE_ORGANIZATION_ERROR", "Unable to delete organization.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

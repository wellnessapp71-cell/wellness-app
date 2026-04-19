import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const putSchema = z.object({
  logoUrl: z.string().trim().url().nullable().optional(),
  primaryColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondaryColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  domains: z.array(z.string().trim().min(2)).optional(),
  emailTemplate: z.record(z.string(), z.unknown()).nullable().optional(),
  communicationPrefs: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await context.params;
  const branding = await prisma.organizationBranding.findUnique({ where: { organizationId: id } });
  const departments = await prisma.department.findMany({
    where: { organizationId: id },
    orderBy: { name: "asc" },
  });
  return ok({ branding, departments });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await context.params;
  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  const validation = putSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid branding body.", validation.error.issues);
  }

  const data = validation.data;
  const payload = {
    logoUrl: data.logoUrl ?? undefined,
    primaryColor: data.primaryColor ?? undefined,
    secondaryColor: data.secondaryColor ?? undefined,
    timezone: data.timezone ?? undefined,
    domains: (data.domains ?? undefined) as never,
    emailTemplate: (data.emailTemplate ?? undefined) as never,
    communicationPrefs: (data.communicationPrefs ?? undefined) as never,
  };

  const branding = await prisma.organizationBranding.upsert({
    where: { organizationId: id },
    create: {
      organizationId: id,
      logoUrl: data.logoUrl ?? null,
      primaryColor: data.primaryColor ?? null,
      secondaryColor: data.secondaryColor ?? null,
      timezone: data.timezone ?? "UTC",
      domains: (data.domains ?? []) as never,
      emailTemplate: (data.emailTemplate ?? undefined) as never,
      communicationPrefs: (data.communicationPrefs ?? undefined) as never,
    },
    update: payload,
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: id,
    eventType: "admin.branding.update",
    targetType: "organization_branding",
    targetId: branding.id,
    summary: `Updated branding for organization ${id}`,
    payload: data,
    request,
  });

  return ok({ branding });
}

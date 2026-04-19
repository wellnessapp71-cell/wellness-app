import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const patchSchema = z.object({
  verificationStatus: z.enum(["pending", "verified", "rejected"]).optional(),
  status: z.enum(["active", "suspended", "removed"]).optional(),
  bookable: z.boolean().optional(),
  licenseExpiry: z.string().datetime().nullable().optional(),
  pricing: z.record(z.string(), z.unknown()).optional(),
  availability: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const { id } = await context.params;
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }
  const validation = patchSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid update.", validation.error.issues);
  }

  const existing = await prisma.professional.findUnique({ where: { id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Professional not found.");

  const data = validation.data;
  const now = new Date();

  // Enforce: cannot be bookable without valid license + verified
  let bookable = data.bookable ?? existing.bookable;
  const verification = data.verificationStatus ?? existing.verificationStatus;
  const licenseExpiry = data.licenseExpiry !== undefined ? (data.licenseExpiry ? new Date(data.licenseExpiry) : null) : existing.licenseExpiry;
  if (bookable && (verification !== "verified" || !licenseExpiry || licenseExpiry < now)) {
    bookable = false;
  }

  const updated = await prisma.professional.update({
    where: { id },
    data: {
      ...data,
      pricing: (data.pricing ?? undefined) as never,
      availability: (data.availability ?? undefined) as never,
      licenseExpiry,
      bookable,
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    eventType: "admin.professional.update",
    targetType: "professional",
    targetId: id,
    summary: `Updated professional ${existing.name}`,
    payload: data,
    request,
  });

  return ok({ professional: updated });
}

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const patchSchema = z.object({
  action: z.enum(["revoke", "reissue"]),
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
    return errorResponse(400, "INVALID_REQUEST", "Invalid action.", validation.error.issues);
  }

  const existing = await prisma.hrReferralCode.findUnique({ where: { id } });
  if (!existing) return errorResponse(404, "NOT_FOUND", "Referral code not found.");

  if (validation.data.action === "revoke") {
    const updated = await prisma.hrReferralCode.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
    await writeAuditLog({
      actorUserId: auth!.userId,
      actorRole: auth!.role,
      organizationId: existing.organizationId,
      eventType: "admin.referral_code.revoke",
      targetType: "hr_referral_code",
      targetId: id,
      summary: `Revoked referral code ${existing.code}`,
      request,
    });
    return ok({ code: updated });
  }

  // reissue: mark old as revoked, create new with same details
  const updated = await prisma.$transaction(async (tx) => {
    await tx.hrReferralCode.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
    return tx.hrReferralCode.create({
      data: {
        code: await generateUniqueCode(tx),
        organizationId: existing.organizationId,
        hrName: existing.hrName,
        hrEmail: existing.hrEmail,
        hrPhone: existing.hrPhone,
        role: existing.role,
        departmentScope: existing.departmentScope ?? [],
        purpose: existing.purpose,
        expiresAt: existing.expiresAt,
        status: "active",
        createdById: auth!.userId,
      },
    });
  });
  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: existing.organizationId,
    eventType: "admin.referral_code.reissue",
    targetType: "hr_referral_code",
    targetId: updated.id,
    summary: `Reissued referral code for ${existing.hrEmail}`,
    request,
  });
  return ok({ code: updated }, { status: 201 });
}

async function generateUniqueCode(tx: { hrReferralCode: { findUnique: (args: { where: { code: string } }) => Promise<unknown> } }): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `HR-${randomSegment(4)}-${randomSegment(4)}`;
    const exists = await tx.hrReferralCode.findUnique({ where: { code: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Unable to generate a unique referral code.");
}

function randomSegment(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

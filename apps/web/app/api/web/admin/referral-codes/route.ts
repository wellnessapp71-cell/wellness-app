import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  organizationId: z.string().min(1),
  hrName: z.string().trim().min(2).max(120),
  hrEmail: z.string().trim().email(),
  hrPhone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  departmentScope: z.array(z.string().trim().min(1)).optional(),
  purpose: z.string().trim().max(500).optional().or(z.literal("")),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const organizationId = url.searchParams.get("organizationId");

  const now = new Date();
  const codes = await prisma.hrReferralCode.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      organization: { select: { id: true, name: true, referralCode: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      hrUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const normalized = codes.map((code) => ({
    ...code,
    status:
      code.status === "active" && code.expiresAt && code.expiresAt < now ? "expired" : code.status,
  }));

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    eventType: "admin.referral_code.list",
    summary: `Listed ${normalized.length} referral codes`,
    request,
  });

  return ok({ codes: normalized });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REFERRAL_CODE_REQUEST", "Invalid request body.", validation.error.issues);
  }

  const data = validation.data;
  const organization = await prisma.organization.findUnique({
    where: { id: data.organizationId },
    select: { id: true, name: true },
  });
  if (!organization) {
    return errorResponse(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
  }

  const code = await prisma.hrReferralCode.create({
    data: {
      code: await generateUniqueCode(),
      organizationId: organization.id,
      hrName: data.hrName,
      hrEmail: data.hrEmail,
      hrPhone: emptyToNull(data.hrPhone),
      role: emptyToNull(data.role),
      departmentScope: data.departmentScope ?? [],
      purpose: emptyToNull(data.purpose),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      status: "active",
      createdById: auth!.userId,
    },
    include: {
      organization: { select: { id: true, name: true, referralCode: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    organizationId: organization.id,
    eventType: "admin.referral_code.create",
    targetType: "hr_referral_code",
    targetId: code.id,
    summary: `Issued HR referral code for ${data.hrEmail} at ${organization.name}`,
    payload: { code: code.code, hrEmail: data.hrEmail },
    request,
  });

  return ok({ code }, { status: 201 });
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `HR-${randomSegment(4)}-${randomSegment(4)}`;
    const exists = await prisma.hrReferralCode.findUnique({ where: { code: candidate } });
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

function emptyToNull(value?: string): string | null {
  if (!value || value.trim().length === 0) return null;
  return value.trim();
}

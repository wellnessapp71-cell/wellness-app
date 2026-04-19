import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit/log";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.enum(["psychologist", "coach", "nutritionist", "physio", "expert"]).default("psychologist"),
  specialties: z.array(z.string().trim().min(1)).default([]),
  licenseId: z.string().trim().max(80).optional().or(z.literal("")),
  licenseExpiry: z.string().datetime().optional().or(z.literal("")),
  languages: z.array(z.string().trim().min(1)).default([]),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  pricing: z.record(z.string(), z.unknown()).optional(),
  availability: z.record(z.string(), z.unknown()).optional(),
  userId: z.string().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const verification = url.searchParams.get("verification");

  const professionals = await prisma.professional.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(verification ? { verificationStatus: verification } : {}),
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok({ professionals });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { auth, response } = requireRole(request, ["admin"]);
  if (response) return response;

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }
  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid professional body.", validation.error.issues);
  }

  const data = validation.data;
  const created = await prisma.professional.create({
    data: {
      name: data.name,
      role: data.role,
      specialties: data.specialties,
      licenseId: data.licenseId || null,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      languages: data.languages,
      region: data.region || null,
      bio: data.bio || null,
      pricing: (data.pricing ?? undefined) as never,
      availability: (data.availability ?? undefined) as never,
      userId: data.userId ?? null,
      verificationStatus: "pending",
      bookable: false,
      status: "active",
    },
  });

  await writeAuditLog({
    actorUserId: auth!.userId,
    actorRole: auth!.role,
    eventType: "admin.professional.create",
    targetType: "professional",
    targetId: created.id,
    summary: `Added professional ${data.name} (${data.role})`,
    request,
  });

  return ok({ professional: created }, { status: 201 });
}

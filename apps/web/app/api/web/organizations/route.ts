import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, errorResponse } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { requireRole } from "@/lib/auth/roles";

const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  industry: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  companySize: z.coerce.number().int().positive().max(500000).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) {
    return response;
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const activeParam = url.searchParams.get("active");
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 50, 1), 200);
  const skip = Math.max(Number(url.searchParams.get("skip")) || 0, 0);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { referralCode: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
    ];
  }
  if (activeParam === "true") where.active = true;
  if (activeParam === "false") where.active = false;

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: { memberships: true, hrProfiles: true, departments: true, hrReferralCodes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.organization.count({ where }),
  ]);

  return ok({ organizations, total, take, skip });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) {
    return response;
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const validation = organizationSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_ORGANIZATION_REQUEST", "Invalid organization body.", validation.error.issues);
  }

  const data = validation.data;
  const organization = await prisma.organization.create({
    data: {
      name: data.name,
      slug: slugify(data.name),
      referralCode: await generateUniqueReferralCode(data.name),
      industry: emptyToNull(data.industry),
      companySize: data.companySize,
      website: emptyToNull(data.website),
      contactEmail: emptyToNull(data.contactEmail),
      contactPhone: emptyToNull(data.contactPhone),
    },
  });

  return ok({ organization }, { status: 201 });
}

async function generateUniqueReferralCode(companyName: string): Promise<string> {
  const base = slugify(companyName).replace(/-/g, "").slice(0, 6).toUpperCase() || "AURA";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const referralCode = `${base}-${suffix}`;
    const existing = await prisma.organization.findUnique({ where: { referralCode } });
    if (!existing) {
      return referralCode;
    }
  }

  throw new Error("Unable to generate a unique referral code.");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "organization";
}

function emptyToNull(value?: string) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

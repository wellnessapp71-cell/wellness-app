import { Prisma, prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signAuthToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const REGISTER_RATE_LIMIT = { windowMs: 60_000, maxRequests: 5 };

const baseSchema = z.object({
  email: z.string().trim().email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
    .regex(/[a-z]/, "Password must include at least one lowercase letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["employee", "hr", "psychologist", "admin"]).default("employee"),
});

const hrSchema = baseSchema.extend({
  role: z.literal("hr"),
  companyName: z.string().trim().min(2).max(160),
  companyIndustry: z.string().trim().min(2).max(100),
  companySize: z.coerce.number().int().min(1, "Company size must be at least 1").max(500000),
  companyWebsite: z.string().trim().url("Enter a valid URL (e.g. https://company.com)").optional().or(z.literal("")),
  workEmail: z.string().trim().email().optional().or(z.literal("")),
  jobTitle: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
});

const psychologistSchema = baseSchema.extend({
  role: z.literal("psychologist"),
  licenseNumber: z.string().trim().min(3).max(80),
  education: z.string().trim().min(4).max(240),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  specialties: z.array(z.string().trim().min(2).max(80)).min(1),
  languages: z.array(z.string().trim().min(2).max(80)).default(["English"]),
  sessionModes: z.array(z.enum(["text", "audio", "video"])).min(1),
  bio: z.string().trim().min(12).max(1000).optional().or(z.literal("")),
});

const employeeSchema = baseSchema.extend({
  role: z.literal("employee"),
  referralCode: z.string().trim().min(4).max(40),
  employeeCode: z.string().trim().min(2).max(40).optional().or(z.literal("")),
  department: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  title: z.string().trim().min(2).max(120).optional().or(z.literal("")),
});

const adminSchema = baseSchema.extend({
  role: z.literal("admin"),
  referralCode: z.string().trim().min(1).default("ADMIN"),
});

const registerSchema = z.discriminatedUnion("role", [
  hrSchema,
  psychologistSchema,
  employeeSchema,
  adminSchema,
]);

export async function POST(request: Request): Promise<NextResponse> {
  // ── Rate limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, REGISTER_RATE_LIMIT);
  if (!rl.success) {
    const retryAfter = Math.ceil(rl.resetMs / 1000);
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many registration attempts. Please try again later." } },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const normalizedInput =
    typeof parsed.data === "object" && parsed.data !== null && !("role" in parsed.data)
      ? { ...parsed.data, role: "employee" }
      : parsed.data;

  const validation = registerSchema.safeParse(normalizedInput);
  if (!validation.success) {
    console.log("[REGISTER] Validation failed for role:", (normalizedInput as any)?.role);
    console.log("[REGISTER] Issues:", JSON.stringify(validation.error.issues, null, 2));
    return errorResponse(
      400,
      "INVALID_REGISTER_REQUEST",
      "Invalid registration request body.",
      validation.error.issues,
    );
  }

  const payload = validation.data;
  const email = payload.email.toLowerCase();
  const username = payload.username.toLowerCase();

  try {
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingEmail) {
      return errorResponse(409, "EMAIL_EXISTS", "An account with this email already exists.");
    }

    if (existingUsername) {
      return errorResponse(409, "USERNAME_EXISTS", "This username is already taken.");
    }

    const passwordHash = await hashPassword(payload.password);

    const result = await prisma.$transaction(async (tx) => {
      if (payload.role === "hr") {
        const referralCode = await generateUniqueReferralCode(tx, payload.companyName);
        const organization = await tx.organization.create({
          data: {
            name: payload.companyName,
            slug: slugify(payload.companyName),
            referralCode,
            industry: payload.companyIndustry,
            companySize: payload.companySize,
            website: emptyToNull(payload.companyWebsite),
            contactEmail: payload.workEmail ?? email,
            contactPhone: emptyToNull(payload.phone),
          },
        });

        const user = await tx.user.create({
          data: {
            email,
            username,
            referralCode,
            name: payload.name,
            role: "hr",
            passwordHash,
          },
        });

        await tx.organizationMembership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            membershipRole: "hr",
            title: payload.jobTitle,
            department: "Human Resources",
          },
        });

        await tx.hrProfile.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            jobTitle: payload.jobTitle,
            phone: emptyToNull(payload.phone),
          },
        });

        return { user, organization };
      }

      if (payload.role === "psychologist") {
        const user = await tx.user.create({
          data: {
            email,
            username,
            referralCode: `PSY-${username}`.toUpperCase(),
            name: payload.name,
            role: "psychologist",
            passwordHash,
          },
        });

        await tx.psychologistProfile.create({
          data: {
            userId: user.id,
            licenseNumber: payload.licenseNumber,
            education: payload.education,
            yearsExperience: payload.yearsExperience,
            specialties: payload.specialties,
            languages: payload.languages,
            sessionModes: payload.sessionModes,
            bio: emptyToNull(payload.bio),
            verificationStatus: "pending",
          },
        });

        return { user, organization: null };
      }

      const referralCode = payload.role === "admin" ? payload.referralCode.toUpperCase() : payload.referralCode.toUpperCase();

      const user = await tx.user.create({
        data: {
          email,
          username,
          referralCode,
          name: payload.name,
          role: payload.role,
          passwordHash,
        },
      });

      if (payload.role === "employee") {
        const organization = await tx.organization.findUnique({
          where: { referralCode },
        });

        if (!organization) {
          throw new KnownRegistrationError("INVALID_REFERRAL_CODE", "Referral code does not match an organization.");
        }

        await tx.organizationMembership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            membershipRole: "employee",
            employeeCode: emptyToNull(payload.employeeCode),
            department: emptyToNull(payload.department),
            title: emptyToNull(payload.title),
          },
        });

        return { user, organization };
      }

      return { user, organization: null };
    });

    const token = signAuthToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return ok(
      {
        userId: result.user.id,
        email: result.user.email,
        username: result.user.username,
        name: result.user.name,
        referralCode: result.user.referralCode,
        role: result.user.role,
        organization: result.organization
          ? {
              id: result.organization.id,
              name: result.organization.name,
              referralCode: result.organization.referralCode,
            }
          : null,
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof KnownRegistrationError) {
      return errorResponse(400, error.code, error.message);
    }

    return errorResponse(
      500,
      "REGISTER_ERROR",
      "Unable to register user.",
      serializeError(error),
    );
  }
}

class KnownRegistrationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function generateUniqueReferralCode(
  tx: Prisma.TransactionClient,
  companyName: string,
): Promise<string> {
  const base = slugify(companyName).replace(/_/g, "").slice(0, 6).toUpperCase() || "AURA";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const referralCode = `${base}-${suffix}`;
    const existing = await tx.organization.findUnique({ where: { referralCode } });
    if (!existing) {
      return referralCode;
    }
  }

  throw new KnownRegistrationError("REFERRAL_CODE_ERROR", "Unable to generate a unique referral code.");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "organization";
}

function emptyToNull(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function serializeError(error: unknown): { message: string } {
  return error instanceof Error ? { message: error.message } : { message: "Unknown error" };
}

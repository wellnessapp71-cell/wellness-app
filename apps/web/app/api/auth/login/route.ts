import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signAuthToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

const loginSchema = z
  .object({
    login: z.string().trim().min(1),
    password: z.string().min(1),
    role: z.enum(["admin", "hr", "psychologist", "employee"]).optional(),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error, parsed.details);
  }

  const validation = loginSchema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(
      400,
      "INVALID_LOGIN_REQUEST",
      "Invalid login request body.",
      validation.error.issues,
    );
  }

  const login = validation.data.login.toLowerCase();
  const isEmail = login.includes("@");

  try {
    const user = await prisma.user.findUnique({
      where: isEmail ? { email: login } : { username: login },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        referralCode: true,
        role: true,
        passwordHash: true,
        organizationMemberships: {
          where: { active: true },
          include: {
            organization: true,
          },
        },
        psychologistProfile: true,
        hrProfile: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return errorResponse(401, "INVALID_CREDENTIALS", "Invalid email/username or password.");
    }

    if (validation.data.role && user.role !== validation.data.role) {
      return errorResponse(403, "ROLE_MISMATCH", "This account does not match the selected role.");
    }

    const isPasswordValid = await verifyPassword(validation.data.password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse(401, "INVALID_CREDENTIALS", "Invalid email/username or password.");
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const primaryMembership = user.organizationMemberships[0] ?? null;

    return ok({
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      referralCode: user.referralCode,
      role: user.role,
      organization: primaryMembership?.organization
        ? {
            id: primaryMembership.organization.id,
            name: primaryMembership.organization.name,
            referralCode: primaryMembership.organization.referralCode,
          }
        : user.hrProfile?.organization
          ? {
              id: user.hrProfile.organization.id,
              name: user.hrProfile.organization.name,
              referralCode: user.hrProfile.organization.referralCode,
            }
          : null,
      psychologistProfile: user.psychologistProfile
        ? {
            verificationStatus: user.psychologistProfile.verificationStatus,
            specialties: user.psychologistProfile.specialties,
            sessionModes: user.psychologistProfile.sessionModes,
          }
        : null,
      token,
    });
  } catch (error) {
    return errorResponse(500, "LOGIN_ERROR", "Unable to log in.", serializeError(error));
  }
}

function serializeError(error: unknown): { message: string } {
  return error instanceof Error ? { message: error.message } : { message: "Unknown error" };
}

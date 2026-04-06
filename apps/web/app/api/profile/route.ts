/**
 * GET  /api/profile — Fetch full user profile (user + profile + latest plans)
 * POST /api/profile — Create or update profile (upsert)
 */

import { Prisma, prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        referralCode: true,
        consentState: true,
        createdAt: true,
        organizationMemberships: {
          where: { active: true },
          include: { organization: true },
        },
        hrProfile: {
          include: { organization: true },
        },
        psychologistProfile: true,
      },
    });

    if (!user) {
      return errorResponse(404, "NOT_FOUND", "User not found.");
    }

    const profile = await loadProfileSafely(auth.userId);

    // Fetch all plans sorted by type + recency, then keep the latest per type.
    // This avoids DISTINCT ON ordering edge-cases on PostgreSQL.
    const plans = await prisma.plan.findMany({
      where: { userId: auth.userId },
      orderBy: [{ type: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true,
      },
    });

    const planMap: Record<string, unknown> = {};
    for (const plan of plans) {
      if (planMap[plan.type]) {
        continue;
      }

      planMap[plan.type] = {
        planId: plan.id,
        content: plan.content,
        createdAt: plan.createdAt,
      };
    }

    let employeeWorkspace = null;
    try {
      employeeWorkspace = await buildEmployeeWorkspace(
        auth.userId,
        user.organizationMemberships,
      );
    } catch (wsErr) {
      console.error("buildEmployeeWorkspace failed (non-fatal):", wsErr);
    }

    return ok({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        referralCode: user.referralCode,
        consentState: user.consentState,
        createdAt: user.createdAt,
      },
      profile,
      organizations: user.organizationMemberships.map((membership) => ({
        membershipRole: membership.membershipRole,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          referralCode: membership.organization.referralCode,
        },
      })),
      hrProfile: user.hrProfile,
      psychologistProfile: user.psychologistProfile,
      employeeWorkspace,
      plans: planMap,
    });
  } catch (error) {
    return errorResponse(
      500,
      "PROFILE_FETCH_ERROR",
      "Unable to fetch profile.",
      {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as Record<string, unknown>;

  try {
    // Update user-level fields if provided
    if (body.name !== undefined || body.consentState !== undefined) {
      const userUpdate: Record<string, unknown> = {};
      if (body.name !== undefined) userUpdate.name = body.name;
      if (body.consentState !== undefined)
        userUpdate.consentState = body.consentState;

      await prisma.user.update({
        where: { id: auth.userId },
        data: userUpdate,
      });
    }

    // Upsert profile
    if (body.profile && typeof body.profile === "object") {
      const p = body.profile as Record<string, unknown>;

      // Required for create, optional for update
      const profileData = {
        ...(p.age !== undefined && { age: Number(p.age) }),
        ...(p.gender !== undefined && { gender: String(p.gender) }),
        ...(p.heightCm !== undefined && { heightCm: Number(p.heightCm) }),
        ...(p.currentWeightKg !== undefined && {
          currentWeightKg: Number(p.currentWeightKg),
        }),
        ...(p.targetWeightKg !== undefined && {
          targetWeightKg: p.targetWeightKg ? Number(p.targetWeightKg) : null,
        }),
        ...(p.bodyShape !== undefined && { bodyShape: String(p.bodyShape) }),
        // Scores
        ...(p.scorePhysical !== undefined && {
          scorePhysical: Number(p.scorePhysical),
        }),
        ...(p.scoreMental !== undefined && {
          scoreMental: Number(p.scoreMental),
        }),
        ...(p.scoreSpiritual !== undefined && {
          scoreSpiritual: Number(p.scoreSpiritual),
        }),
        ...(p.scoreLifestyle !== undefined && {
          scoreLifestyle: Number(p.scoreLifestyle),
        }),
        // Physical
        ...(p.activityLevel !== undefined && {
          activityLevel: String(p.activityLevel),
        }),
        ...(p.exerciseDaysPerWeek !== undefined && {
          exerciseDaysPerWeek: Number(p.exerciseDaysPerWeek),
        }),
        ...(p.fitnessLevel !== undefined && {
          fitnessLevel: String(p.fitnessLevel),
        }),
        ...(p.fitnessScore !== undefined && {
          fitnessScore: Number(p.fitnessScore),
        }),
        ...(p.hasGymAccess !== undefined && {
          hasGymAccess: Boolean(p.hasGymAccess),
        }),
        ...(p.hasHomeEquipment !== undefined && {
          hasHomeEquipment: Boolean(p.hasHomeEquipment),
        }),
        // Benchmarks
        ...(p.pushUps !== undefined && { pushUps: Number(p.pushUps) }),
        ...(p.pullUps !== undefined && { pullUps: Number(p.pullUps) }),
        ...(p.squats !== undefined && { squats: Number(p.squats) }),
        ...(p.plankSeconds !== undefined && {
          plankSeconds: Number(p.plankSeconds),
        }),
        ...(p.burpees !== undefined && { burpees: Number(p.burpees) }),
        // Nutrition
        ...(p.dietType !== undefined && { dietType: String(p.dietType) }),
        ...(p.allergies !== undefined && {
          allergies: toPrismaJsonValue(p.allergies),
        }),
        ...(p.medicalConditions !== undefined && {
          medicalConditions: toPrismaJsonValue(p.medicalConditions),
        }),
        ...(p.waterGlassesPerDay !== undefined && {
          waterGlassesPerDay: Number(p.waterGlassesPerDay),
        }),
        // Lifestyle
        ...(p.sleepHours !== undefined && { sleepHours: Number(p.sleepHours) }),
        ...(p.alcoholFrequency !== undefined && {
          alcoholFrequency: Number(p.alcoholFrequency),
        }),
        ...(p.tobacco !== undefined && { tobacco: Boolean(p.tobacco) }),
        ...(p.screenHours !== undefined && {
          screenHours: Number(p.screenHours),
        }),
        // Spiritual
        ...(p.spiritualAnswers !== undefined && {
          spiritualAnswers: toPrismaJsonValue(p.spiritualAnswers),
        }),
        // Onboarding flags
        ...(p.mentalOnboardingDone !== undefined && {
          mentalOnboardingDone: Boolean(p.mentalOnboardingDone),
        }),
        ...(p.physicalOnboardingDone !== undefined && {
          physicalOnboardingDone: Boolean(p.physicalOnboardingDone),
        }),
        // Tracking
        ...(p.streakDays !== undefined && {
          streakDays: Number(p.streakDays),
        }),
        ...(p.totalWorkouts !== undefined && {
          totalWorkouts: Number(p.totalWorkouts),
        }),
        ...(p.totalCaloriesBurned !== undefined && {
          totalCaloriesBurned: Number(p.totalCaloriesBurned),
        }),
      };

      const existing = await prisma.profile.findUnique({
        where: { userId: auth.userId },
      });

      if (existing) {
        await prisma.profile.update({
          where: { userId: auth.userId },
          data: profileData satisfies Prisma.ProfileUpdateInput,
        });
      } else {
        // On create, require minimum fields
        if (
          p.age === undefined ||
          p.gender === undefined ||
          p.heightCm === undefined ||
          p.currentWeightKg === undefined
        ) {
          return errorResponse(
            400,
            "MISSING_FIELDS",
            "age, gender, heightCm, currentWeightKg are required to create a profile.",
          );
        }
        await prisma.profile.create({
          data: {
            userId: auth.userId,
            age: Number(p.age),
            gender: String(p.gender),
            heightCm: Number(p.heightCm),
            currentWeightKg: Number(p.currentWeightKg),
            ...profileData,
          } satisfies Prisma.ProfileUncheckedCreateInput,
        });
      }
    }

    // Return updated full profile
    const updated = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        referralCode: true,
        consentState: true,
        organizationMemberships: {
          where: { active: true },
          include: { organization: true },
        },
        hrProfile: {
          include: { organization: true },
        },
        psychologistProfile: true,
      },
    });

    const profile = await loadProfileSafely(auth.userId);

    let employeeWorkspace = null;
    try {
      employeeWorkspace = await buildEmployeeWorkspace(
        auth.userId,
        updated!.organizationMemberships,
      );
    } catch (wsErr) {
      console.error("buildEmployeeWorkspace failed (non-fatal):", wsErr);
    }

    return ok({
      user: {
        id: updated!.id,
        email: updated!.email,
        username: updated!.username,
        name: updated!.name,
        role: updated!.role,
        referralCode: updated!.referralCode,
        consentState: updated!.consentState,
      },
      profile,
      organizations: updated!.organizationMemberships.map((membership) => ({
        membershipRole: membership.membershipRole,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          referralCode: membership.organization.referralCode,
        },
      })),
      hrProfile: updated!.hrProfile,
      psychologistProfile: updated!.psychologistProfile,
      employeeWorkspace,
    });
  } catch (error) {
    return errorResponse(
      500,
      "PROFILE_UPDATE_ERROR",
      "Unable to update profile.",
      {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    );
  }
}

function toPrismaJsonValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

async function loadProfileSafely(userId: string): Promise<unknown> {
  try {
    return await prisma.profile.findUnique({
      where: { userId },
    });
  } catch (error) {
    if (!isMissingProfileColumnError(error)) {
      throw error;
    }

    // Fallback for environments where DB migrations lag behind the Prisma schema.
    const rows = await prisma.$queryRaw<
      Array<Record<string, unknown>>
    >`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`;

    return rows[0] ?? null;
  }
}

function isMissingProfileColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("profiles.") &&
    message.includes("does not exist in the current database")
  );
}

async function buildEmployeeWorkspace(
  userId: string,
  memberships: Array<{
    membershipRole: string;
    organization: {
      id: string;
      name: string;
      referralCode: string;
    };
  }>,
) {
  const primaryMembership = memberships[0];
  if (!primaryMembership) {
    return null;
  }

  const [webinars, supportRequests] = await Promise.all([
    prisma.webinarNotification.findMany({
      where: { organizationId: primaryMembership.organization.id },
      orderBy: { scheduledFor: "desc" },
      take: 10,
    }),
    prisma.supportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        organization: true,
        psychologist: {
          select: { id: true, name: true, email: true },
        },
        sessionEvents: {
          orderBy: { createdAt: "desc" },
          take: 15,
          include: {
            actor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    organization: {
      id: primaryMembership.organization.id,
      name: primaryMembership.organization.name,
      referralCode: primaryMembership.organization.referralCode,
      membershipRole: primaryMembership.membershipRole,
    },
    webinars: webinars.map((webinar) => ({
      id: webinar.id,
      title: webinar.title,
      message: webinar.message,
      scheduledFor: webinar.scheduledFor,
      deliveryStatus: webinar.deliveryStatus,
      audience: webinar.audience,
    })),
    supportRequests: supportRequests.map((request) => ({
      id: request.id,
      issueType: request.issueType,
      preferredMode: request.preferredMode,
      sessionType: request.sessionType,
      status: request.status,
      language: request.language,
      style: request.style,
      reason: request.reason,
      outcome: request.outcome,
      scheduledFor: request.scheduledFor,
      acceptedAt: request.acceptedAt,
      meetingUrl: request.meetingUrl,
      sessionNotes: request.sessionNotes,
      createdAt: request.createdAt,
      organization: request.organization
        ? {
            id: request.organization.id,
            name: request.organization.name,
            referralCode: request.organization.referralCode,
          }
        : null,
      psychologist: request.psychologist
        ? {
            id: request.psychologist.id,
            name: request.psychologist.name,
            email: request.psychologist.email,
          }
        : null,
      sessionEvents: request.sessionEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        createdAt: event.createdAt,
        actor: event.actor
          ? {
              id: event.actor.id,
              name: event.actor.name,
              email: event.actor.email,
            }
          : null,
      })),
    })),
  };
}

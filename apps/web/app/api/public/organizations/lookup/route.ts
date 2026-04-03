import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/api/response";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const referralCode = url.searchParams.get("referralCode")?.trim().toUpperCase();

  if (!referralCode) {
    return errorResponse(400, "MISSING_REFERRAL_CODE", "referralCode is required.");
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { referralCode },
      select: {
        id: true,
        name: true,
        referralCode: true,
        industry: true,
        active: true,
      },
    });

    if (!organization || !organization.active) {
      return errorResponse(404, "ORGANIZATION_NOT_FOUND", "Referral code does not match an active organization.");
    }

    return ok({ organization });
  } catch (error) {
    return errorResponse(500, "ORGANIZATION_LOOKUP_ERROR", "Unable to verify referral code.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

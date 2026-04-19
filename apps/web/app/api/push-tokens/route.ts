/**
 * POST /api/push-tokens — Register or refresh Expo push token for current user.
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

const schema = z.object({
  token: z.string().min(10).max(300),
  platform: z.enum(["ios", "android", "web"]),
  deviceName: z.string().max(120).optional(),
  appVersion: z.string().max(40).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = schema.safeParse(parsed.data);
  if (!validation.success)
    return errorResponse(400, "INVALID_REQUEST", "Invalid push token payload.", validation.error.issues);

  const data = validation.data;
  const record = await prisma.devicePushToken.upsert({
    where: { token: data.token },
    create: {
      userId: auth.userId,
      token: data.token,
      platform: data.platform,
      deviceName: data.deviceName,
      appVersion: data.appVersion,
    },
    update: {
      userId: auth.userId,
      platform: data.platform,
      deviceName: data.deviceName,
      appVersion: data.appVersion,
      lastSeenAt: new Date(),
    },
  });

  return ok({ id: record.id });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth) return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return errorResponse(400, "MISSING_TOKEN", "Provide token query param.");

  await prisma.devicePushToken.deleteMany({ where: { token, userId: auth.userId } });
  return ok({ deleted: true });
}

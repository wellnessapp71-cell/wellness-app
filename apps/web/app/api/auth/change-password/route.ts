import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { resolveAuthContext } from "@/lib/auth/middleware";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
}).strict();

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request);
  if (!auth?.userId) {
    return errorResponse(401, "UNAUTHORIZED", "Sign in required.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = schema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "New password must be at least 8 characters.", validation.error.issues);
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return errorResponse(400, "NO_PASSWORD", "Account has no password set.");
  }

  const valid = await verifyPassword(validation.data.currentPassword, user.passwordHash);
  if (!valid) {
    return errorResponse(400, "INVALID_PASSWORD", "Current password is incorrect.");
  }

  const passwordHash = await hashPassword(validation.data.newPassword);
  await prisma.user.update({
    where: { id: auth.userId },
    data: { passwordHash },
  });

  return ok({ changed: true });
}

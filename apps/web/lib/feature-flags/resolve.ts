import { prisma } from "@aura/db";

export interface FeatureFlagResult {
  flagKey: string;
  module: string;
  enabled: boolean;
  rolloutScope: Record<string, unknown> | null;
}

export async function getFlagsForOrg(organizationId: string | null): Promise<FeatureFlagResult[]> {
  const rows = await prisma.featureFlag.findMany({
    where: {
      OR: [
        { organizationId },
        { organizationId: null },
      ],
    },
    orderBy: [{ organizationId: "desc" }, { updatedAt: "desc" }],
  });

  const byKey = new Map<string, FeatureFlagResult>();
  for (const row of rows) {
    const existing = byKey.get(row.flagKey);
    if (existing && existing.rolloutScope !== null) continue;
    byKey.set(row.flagKey, {
      flagKey: row.flagKey,
      module: row.module,
      enabled: row.enabled,
      rolloutScope: (row.rolloutScope as Record<string, unknown> | null) ?? null,
    });
  }
  return Array.from(byKey.values());
}

export interface FlagContext {
  userId?: string;
  departmentId?: string | null;
  cohort?: string | null;
}

function resolveRollout(flag: FeatureFlagResult, ctx: FlagContext): boolean {
  if (!flag.enabled) return false;
  if (!flag.rolloutScope) return true;

  const scope = flag.rolloutScope;
  const depts = scope.departments as string[] | undefined;
  const users = scope.users as string[] | undefined;
  const cohorts = scope.cohorts as string[] | undefined;
  const percentage = scope.percentage as number | undefined;

  if (depts?.length && ctx.departmentId && !depts.includes(ctx.departmentId)) return false;
  if (users?.length && ctx.userId && !users.includes(ctx.userId)) return false;
  if (cohorts?.length && ctx.cohort && !cohorts.includes(ctx.cohort)) return false;
  if (typeof percentage === "number" && ctx.userId) {
    const bucket = hashToBucket(ctx.userId, flag.flagKey);
    if (bucket >= percentage) return false;
  }
  return true;
}

function hashToBucket(userId: string, key: string): number {
  let h = 0;
  const s = `${userId}:${key}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100;
}

export async function isFlagEnabled(
  flagKey: string,
  organizationId: string | null,
  ctx: FlagContext = {},
): Promise<boolean> {
  const flags = await getFlagsForOrg(organizationId);
  const flag = flags.find((f) => f.flagKey === flagKey);
  if (!flag) return true;
  return resolveRollout(flag, ctx);
}

export async function resolveFlagsMap(
  organizationId: string | null,
  ctx: FlagContext = {},
): Promise<Record<string, boolean>> {
  const flags = await getFlagsForOrg(organizationId);
  const out: Record<string, boolean> = {};
  for (const f of flags) out[f.flagKey] = resolveRollout(f, ctx);
  return out;
}

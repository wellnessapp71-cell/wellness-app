import { prisma } from "@aura/db";
import { sendExpoPush, isExpoPushToken, type ExpoPushMessage } from "./expo";

interface NotificationAudience {
  organizationIds?: string[];
  departmentIds?: string[];
  userIds?: string[];
  roles?: string[];
}

export async function dispatchNotificationPush(notificationId: string): Promise<{ sent: number; errors: number }> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      id: true,
      title: true,
      body: true,
      emergency: true,
      organizationId: true,
      audienceType: true,
      audience: true,
    },
  });
  if (!notification) return { sent: 0, errors: 0 };

  const audience = (notification.audience as unknown as NotificationAudience | null) ?? {};
  const users = await resolveUsers(notification.organizationId, notification.audienceType, audience);
  if (users.length === 0) return { sent: 0, errors: 0 };

  const tokens = await prisma.devicePushToken.findMany({
    where: { userId: { in: users }, token: { not: "" } },
    select: { token: true },
  });
  const valid = tokens.filter((t) => isExpoPushToken(t.token));

  const messages: ExpoPushMessage[] = valid.map((t) => ({
    to: t.token,
    title: notification.title,
    body: notification.body,
    sound: "default",
    priority: notification.emergency ? "high" : "default",
    channelId: notification.emergency ? "emergency" : "broadcast",
    data: { notificationId: notification.id, emergency: notification.emergency },
  }));

  const tickets = await sendExpoPush(messages);
  const errors = tickets.filter((t) => t.status === "error").length;
  return { sent: tickets.length - errors, errors };
}

async function resolveUsers(
  orgId: string | null,
  audienceType: string,
  audience: NotificationAudience,
): Promise<string[]> {
  if (audienceType === "all") {
    const users = await prisma.user.findMany({ select: { id: true } });
    return users.map((u) => u.id);
  }
  if (audienceType === "organization") {
    const ids = audience.organizationIds ?? (orgId ? [orgId] : []);
    if (!ids.length) return [];
    const rows = await prisma.organizationMembership.findMany({
      where: { organizationId: { in: ids } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
  if (audienceType === "department") {
    const ids = audience.departmentIds ?? [];
    if (!ids.length) return [];
    const rows = await prisma.organizationMembership.findMany({
      where: { department: { in: ids } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
  if (audienceType === "role") {
    const roles = audience.roles ?? [];
    if (!roles.length) return [];
    const rows = await prisma.user.findMany({
      where: { role: { in: roles as ("admin" | "hr" | "employee" | "psychologist")[] } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  if (audienceType === "cohort") {
    return audience.userIds ?? [];
  }
  return [];
}

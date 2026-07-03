import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/client";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string
) {
  return prisma.notification.create({
    data: { userId, type, title, body },
  });
}

export async function notifyMany(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, body })),
  });
}

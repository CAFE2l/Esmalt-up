import { prisma } from "./prisma";

export type NotificationType =
  | "welcome"
  | "lesson_completed"
  | "module_completed"
  | "course_finished"
  | "badge_awarded";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
  });
}

export async function ensureWelcomeNotification(userId: string, name?: string | null) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type: "welcome" },
    select: { id: true },
  });
  if (existing) return existing;
  const greet = name?.trim() ? `, ${name.trim().split(/\s+/)[0]}` : "";
  return createNotification({
    userId,
    type: "welcome",
    title: `Bem-vinda${greet}!`,
    body: "Sua área na Esmalt'up está pronta. Explore o curso e complete seu perfil.",
    href: "/curso",
  });
}

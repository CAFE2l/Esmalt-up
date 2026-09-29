import { BADGE_BY_KEY, MODULE_BADGE_KEY } from "./badges";
import { createNotification } from "./notifications";
import { prisma } from "./prisma";

async function awardBadge(userId: string, badgeKey: string, href?: string) {
  const def = BADGE_BY_KEY[badgeKey];
  if (!def) return false;
  try {
    await prisma.userBadge.create({
      data: { userId, badgeKey },
    });
  } catch {
    return false;
  }
  await createNotification({
    userId,
    type: "badge_awarded",
    title: `Nova conquista: ${def.name}`,
    body: def.description,
    href: href ?? "/perfil",
  });
  return true;
}

export async function syncUserAchievements(userId: string) {
  const [modules, progress, paidOrder, existing] = await Promise.all([
    prisma.courseModule.findMany({
      orderBy: { orderIndex: "asc" },
      include: { lessons: { select: { id: true, slug: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: { lessonId: true },
    }),
    prisma.order.findFirst({
      where: {
        userId,
        OR: [{ paymentStatus: "paid" }, { status: "pago" }],
      },
      select: { id: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeKey: true },
    }),
  ]);

  const done = new Set(progress.map((row) => row.lessonId));
  const has = new Set(existing.map((row) => row.badgeKey));
  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completedCount = done.size;

  if (completedCount >= 1 && !has.has("primeira-aula")) {
    const first = modules.flatMap((mod) => mod.lessons).find((l) => done.has(l.id));
    await awardBadge(userId, "primeira-aula", first ? `/curso?aula=${first.slug}` : "/curso");
  }

  for (const mod of modules) {
    const key = MODULE_BADGE_KEY[mod.slug];
    if (!key || has.has(key) || mod.lessons.length === 0) continue;
    if (mod.lessons.every((lesson) => done.has(lesson.id))) {
      await awardBadge(userId, key, "/curso");
    }
  }

  if (
    totalLessons > 0 &&
    completedCount >= totalLessons &&
    !has.has("curso-concluido")
  ) {
    await awardBadge(userId, "curso-concluido", "/perfil");
  }

  if (paidOrder && !has.has("primeira-compra")) {
    await awardBadge(userId, "primeira-compra", "/perfil");
  }
}

export async function onLessonCompleted(input: {
  userId: string;
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
}) {
  await createNotification({
    userId: input.userId,
    type: "lesson_completed",
    title: "Aula concluída",
    body: `Você concluiu “${input.lessonTitle}”.`,
    href: `/curso?aula=${input.lessonSlug}`,
  });

  const lesson = await prisma.lesson.findUnique({
    where: { id: input.lessonId },
    include: {
      module: { include: { lessons: { select: { id: true } } } },
    },
  });
  if (!lesson) {
    await syncUserAchievements(input.userId);
    return;
  }

  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId: input.userId,
      lessonId: { in: lesson.module.lessons.map((l) => l.id) },
      completedAt: { not: null },
    },
    select: { lessonId: true },
  });
  if (
    lesson.module.lessons.length > 0 &&
    progress.length >= lesson.module.lessons.length
  ) {
    await createNotification({
      userId: input.userId,
      type: "module_completed",
      title: "Módulo concluído",
      body: `Você concluiu ${lesson.module.title}.`,
      href: "/curso",
    });
  }

  const [total, done] = await Promise.all([
    prisma.lesson.count(),
    prisma.lessonProgress.count({
      where: { userId: input.userId, completedAt: { not: null } },
    }),
  ]);
  if (total > 0 && done >= total) {
    await createNotification({
      userId: input.userId,
      type: "course_finished",
      title: "Curso concluído",
      body: "Parabéns! Você finalizou o Curso Preparatório Esmalt'up.",
      href: "/perfil",
    });
  }

  await syncUserAchievements(input.userId);
}

/**
 * Seed CourseModule + Lesson tables from the static curriculum.
 *
 * Idempotent: upsert by slug. Run twice — no duplicates.
 * Lessons removed from curriculum are soft-deleted (isActive=false).
 *
 * Usage:
 *   npm run seed:curriculum
 */
import { PrismaClient } from "@prisma/client";
import { buildCurriculum } from "../../lib/course/curriculum";

const prisma = new PrismaClient();

async function main() {
  const { modules } = buildCurriculum();

  // Collect all slugs that are active in the current curriculum.
  const activeSlugs = new Set<string>();
  for (const mod of modules) {
    for (const lesson of mod.lessons) activeSlugs.add(lesson.slug);
  }

  // Soft-delete any DB lessons no longer in the curriculum.
  await prisma.lesson.updateMany({
    where: { slug: { notIn: [...activeSlugs] } },
    data: { isActive: false },
  });

  for (const mod of modules) {
    const dbModule = await prisma.courseModule.upsert({
      where: { slug: mod.slug },
      update: { title: mod.title, description: mod.description, orderIndex: mod.orderIndex },
      create: { slug: mod.slug, title: mod.title, description: mod.description, orderIndex: mod.orderIndex },
    });

    for (const lesson of mod.lessons) {
      await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          title: lesson.title,
          description: lesson.description,
          youtubeVideoId: lesson.youtubeVideoId,
          youtubePlaylistId: lesson.youtubePlaylistId,
          channel: lesson.channel,
          durationSec: lesson.durationSec,
          thumbnailUrl: lesson.thumbnailUrl,
          orderIndex: lesson.orderIndex,
          moduleId: dbModule.id,
          isActive: true,
        },
        create: {
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          youtubeVideoId: lesson.youtubeVideoId,
          youtubePlaylistId: lesson.youtubePlaylistId,
          channel: lesson.channel,
          durationSec: lesson.durationSec,
          thumbnailUrl: lesson.thumbnailUrl,
          orderIndex: lesson.orderIndex,
          moduleId: dbModule.id,
          isActive: true,
        },
      });
    }

    console.log(`✓ ${mod.title} — ${mod.lessons.length} lessons`);
  }

  console.log("Curriculum seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * Seed CourseModule + Lesson tables from the static curriculum.
 * Run with: npx ts-node --project tsconfig.json prisma/seed/curriculum.ts
 * Or add to package.json scripts and call via: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { buildCurriculum } from "../../lib/course/curriculum";

const prisma = new PrismaClient();

async function main() {
  const { modules } = buildCurriculum();

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

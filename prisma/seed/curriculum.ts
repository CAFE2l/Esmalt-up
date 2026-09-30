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
import { COURSE_UNITS, getAllLessons } from "../../data/course";

const prisma = new PrismaClient();

async function main() {
  const allLessons = getAllLessons();
  const activeSlugs = allLessons.map((l) => l.slug);

  // Soft-delete any DB lessons no longer in the curriculum.
  await prisma.lesson.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });

  for (const unit of COURSE_UNITS) {
    const dbModule = await prisma.courseModule.upsert({
      where: { slug: unit.id },
      update: {
        title: `Unidade ${unit.unitNumber} — ${unit.title}`,
        description: unit.subtitle,
        orderIndex: unit.unitNumber,
      },
      create: {
        slug: unit.id,
        title: `Unidade ${unit.unitNumber} — ${unit.title}`,
        description: unit.subtitle,
        orderIndex: unit.unitNumber,
      },
    });

    const unitLessons = [...unit.lessons];
    if (unit.bonusChest) {
      unitLessons.push(unit.bonusChest.lesson);
    }

    for (const lesson of unitLessons) {
      const isPlaylist = lesson.type === "playlist";
      await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          title: lesson.title,
          description: lesson.description || "",
          youtubeVideoId: isPlaylist ? null : lesson.youtubeId,
          youtubePlaylistId: isPlaylist ? lesson.youtubeId : null,
          channel: lesson.creator,
          orderIndex: lesson.order,
          moduleId: dbModule.id,
          isActive: true,
        },
        create: {
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description || "",
          youtubeVideoId: isPlaylist ? null : lesson.youtubeId,
          youtubePlaylistId: isPlaylist ? lesson.youtubeId : null,
          channel: lesson.creator,
          orderIndex: lesson.order,
          moduleId: dbModule.id,
          isActive: true,
        },
      });
    }

    console.log(`✓ Unidade ${unit.unitNumber}: ${unit.title} — ${unitLessons.length} aulas`);
  }

  console.log("Curriculum seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

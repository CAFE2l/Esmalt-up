import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";
import { getLessonBySlug, getUnitById } from "@/data/course";

async function getUid(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const decoded = await verifyIdToken(header.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

/** GET /api/course/progress — returns all LessonProgress rows for the user */
export async function GET(req: Request) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const rows = await prisma.lessonProgress.findMany({
    where: { userId: uid },
    include: { lesson: { select: { slug: true, title: true, youtubeVideoId: true } } },
  });

  return NextResponse.json({ progress: rows });
}

/** POST /api/course/progress — upsert a single lesson's progress */
export async function POST(req: Request) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = (await req.json()) as {
    lessonSlug: string;
    completedAt?: string | null;
    lastPositionSeconds?: number;
  };

  if (!body.lessonSlug) {
    return NextResponse.json({ error: "lessonSlug obrigatório." }, { status: 400 });
  }

  let lesson = await prisma.lesson.findUnique({ where: { slug: body.lessonSlug } });
  if (!lesson) {
    const courseLesson = getLessonBySlug(body.lessonSlug);
    if (!courseLesson) {
      return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
    }
    const unit = getUnitById(courseLesson.unitId);
    const dbModule = await prisma.courseModule.upsert({
      where: { slug: courseLesson.unitId },
      update: {},
      create: {
        slug: courseLesson.unitId,
        title: unit ? `Unidade ${unit.unitNumber} — ${unit.title}` : courseLesson.unitId,
        description: unit?.subtitle || "",
        orderIndex: unit?.unitNumber || 1,
      },
    });
    lesson = await prisma.lesson.upsert({
      where: { slug: courseLesson.slug },
      update: {},
      create: {
        slug: courseLesson.slug,
        title: courseLesson.title,
        description: courseLesson.description || "",
        youtubeVideoId: courseLesson.type === "playlist" ? null : courseLesson.youtubeId,
        youtubePlaylistId: courseLesson.type === "playlist" ? courseLesson.youtubeId : null,
        channel: courseLesson.creator,
        orderIndex: courseLesson.order,
        moduleId: dbModule.id,
        isActive: true,
      },
    });
  }

  const row = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: uid, lessonId: lesson.id } },
    update: {
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
      lastPositionSeconds: body.lastPositionSeconds ?? undefined,
    },
    create: {
      userId: uid,
      lessonId: lesson.id,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      lastPositionSeconds: body.lastPositionSeconds ?? 0,
    },
  });

  return NextResponse.json({ progress: row });
}

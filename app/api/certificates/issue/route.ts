import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";
import { getMainTrackLessons } from "@/data/course";
import { generatePublicCode, validateRecipientName } from "@/lib/certificates";
import { ensurePublicProfile } from "@/lib/publicProfiles";

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

/**
 * Check if user has completed ALL published lessons (excluding "Em breve")
 * Uses server-side progress data from the database
 */
async function checkEligibility(uid: string): Promise<boolean> {
  // Get all main track lessons (excluding coming_soon)
  const mainTrackLessons = getMainTrackLessons();
  
  if (mainTrackLessons.length === 0) {
    return false;
  }
  
  // Get user's lesson progress from database
  const progressRows = await prisma.lessonProgress.findMany({
    where: {
      userId: uid,
      completedAt: { not: null },
    },
    select: { lessonId: true },
  });
  
  // Get all lesson slugs from main track
  const mainTrackSlugs = new Set(mainTrackLessons.map(l => l.slug));
  
  // Find corresponding lesson IDs for the slugs
  const lessons = await prisma.lesson.findMany({
    where: { slug: { in: Array.from(mainTrackSlugs) } },
    select: { id: true, slug: true },
  });
  
  // Create a map of slug to id
  const slugToId = new Map(lessons.map(l => [l.slug, l.id]));
  
  // Check if all main track lessons are completed
  const completedLessonIds = new Set(progressRows.map(r => r.lessonId));
  
  for (const lesson of mainTrackLessons) {
    const lessonId = slugToId.get(lesson.slug);
    if (!lessonId) {
      // Lesson not in database yet, skip it
      continue;
    }
    
    if (!completedLessonIds.has(lessonId)) {
      return false;
    }
  }
  
  // If no lessons were found at all, return false
  if (slugToId.size === 0) {
    return false;
  }
  
  return true;
}


/**
 * POST /api/certificates/issue
 * Body: { recipientName: string }
 * Returns: certificate data or error
 */
export async function POST(req: Request) {
  const uid = await getUid(req);
  if (!uid) {
    return NextResponse.json(
      { error: "Não autorizado. Faça login para solicitar o certificado." },
      { status: 401 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const { recipientName, showOnWall } = body as { recipientName?: string; showOnWall?: unknown };

  // Validate recipient name
  if (!recipientName || typeof recipientName !== "string") {
    return NextResponse.json(
      { error: "Por favor, informe o nome completo que aparecerá no certificado." },
      { status: 400 }
    );
  }

  const nameValidation = validateRecipientName(recipientName);
  if (!nameValidation.valid) {
    return NextResponse.json(
      { error: nameValidation.error },
      { status: 400 }
    );
  }

  // Check if user is already eligible (has completed all lessons)
  const isEligible = await checkEligibility(uid);
  
  if (!isEligible) {
    return NextResponse.json(
      { 
        error: "Para obter o certificado, você precisa concluir todas as aulas do curso. Continue seu progresso e tente novamente." 
      },
      { status: 403 }
    );
  }

  // Get the latest completed lesson date for the user
  const lastCompleted = await prisma.lessonProgress.findFirst({
    where: { userId: uid, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  // Check if certificate already exists (idempotent)
  const existingCertificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: uid,
        courseId: "nail-designer-iniciante",
      },
    },
  });

  if (existingCertificate) {
    const publicProfile = await prisma.publicProfile.findUnique({
      where: { userId: uid },
      select: { username: true },
    });
    // Return existing certificate (idempotent)
    return NextResponse.json({
      certificate: {
        id: existingCertificate.id,
        publicCode: existingCertificate.publicCode,
        recipientName: existingCertificate.recipientName,
        issuedAt: existingCertificate.issuedAt.toISOString(),
        status: existingCertificate.status,
        rankPosition: existingCertificate.rankPosition,
        completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
      },
      publicProfile: publicProfile ? { username: publicProfile.username } : null,
      message: "Certificado já emitido. Aqui está o seu certificado existente.",
    });
  }

  // Generate unique public code
  let publicCode: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    publicCode = generatePublicCode();
    const existing = await prisma.certificate.findUnique({
      where: { publicCode },
    });
    
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    return NextResponse.json(
      { error: "Não foi possível gerar um código único. Tente novamente mais tarde." },
      { status: 500 }
    );
  }

  // Allocate rank while holding the singleton counter row so concurrent issues
  // receive distinct, permanent positions in issue order.
  try {
    const publicProfile = await ensurePublicProfile(uid, recipientName.trim());
    if (!publicProfile) {
      return NextResponse.json(
        { error: "Não foi possível preparar seu perfil público." },
        { status: 404 },
      );
    }
    let certificate: NonNullable<typeof existingCertificate> | null = null;
    for (let attempt = 0; attempt < 3 && !certificate; attempt += 1) {
      try {
        certificate = await prisma.$transaction(async (tx) => {
          const counter = await tx.certificateRankCounter.update({
            where: { id: 1 },
            data: { lastRank: { increment: 1 } },
            select: { lastRank: true },
          });
          return tx.certificate.create({
            data: {
              publicCode,
              userId: uid,
              courseId: "nail-designer-iniciante",
              recipientName: recipientName.trim(),
              issuedAt: new Date(),
              curriculumVersion: 1,
              status: "valid",
              showOnWall: typeof showOnWall === "boolean" ? showOnWall : true,
              rankPosition: counter.lastRank,
            },
          });
        }, { isolationLevel: "Serializable" });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < 2
        ) continue;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const duplicate = await prisma.certificate.findUnique({
            where: {
              userId_courseId: {
                userId: uid,
                courseId: "nail-designer-iniciante",
              },
            },
          });
          if (duplicate) {
            return NextResponse.json({
              certificate: {
                id: duplicate.id,
                publicCode: duplicate.publicCode,
                recipientName: duplicate.recipientName,
                issuedAt: duplicate.issuedAt.toISOString(),
                status: duplicate.status,
                rankPosition: duplicate.rankPosition,
                completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
              },
              publicProfile: { username: publicProfile.username },
              message: "Certificado já emitido. Aqui está o seu certificado existente.",
            });
          }
        }
        throw error;
      }
    }
    if (!certificate) throw new Error("Certificate issuance did not complete.");

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        publicCode: certificate.publicCode,
        recipientName: certificate.recipientName,
        issuedAt: certificate.issuedAt.toISOString(),
        status: certificate.status,
        rankPosition: certificate.rankPosition,
        completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
      },
      publicProfile: { username: publicProfile.username },
      message: "Certificado emitido com sucesso! O nome não poderá ser alterado depois.",
    });
  } catch (error) {
    console.error("Error issuing certificate:", error);
    return NextResponse.json(
      { error: "Erro ao emitir certificado. Por favor, tente novamente." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/certificates/issue
 * Returns: user's certificate if exists, or null
 */
export async function GET(req: Request) {
  const uid = await getUid(req);
  if (!uid) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const certificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: uid,
        courseId: "nail-designer-iniciante",
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ certificate: null });
  }

  // Get the latest completed lesson date for the user
  const lastCompleted = await prisma.lessonProgress.findFirst({
    where: { userId: uid, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  return NextResponse.json({
    certificate: {
      id: certificate.id,
      publicCode: certificate.publicCode,
      recipientName: certificate.recipientName,
      issuedAt: certificate.issuedAt.toISOString(),
      status: certificate.status,
      showOnWall: certificate.showOnWall,
      rankPosition: certificate.rankPosition,
      completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
    },
  });
}

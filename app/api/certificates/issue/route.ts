import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";
import { getMainTrackLessons } from "@/data/course";

// Base32 alphabet without ambiguous characters (0/O/1/I)
const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BASE32_LENGTH = 8; // XXXXXXXX part

/** Generate a cryptographically secure public code: ESM-YYYY-XXXXXXXX */
function generatePublicCode(): string {
  const year = new Date().getFullYear();
  
  // Generate 8 random characters from safe alphabet
  const randomBuffer = randomBytes(BASE32_LENGTH);
  let code = "";
  
  for (let i = 0; i < BASE32_LENGTH; i++) {
    const index = randomBuffer[i] % BASE32_ALPHABET.length;
    code += BASE32_ALPHABET[index];
  }
  
  return `ESM-${year}-${code}`;
}

/** Validate recipient name */
function validateRecipientName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: "O nome deve ter pelo menos 3 caracteres." };
  }
  
  if (trimmed.length > 80) {
    return { valid: false, error: "O nome deve ter no máximo 80 caracteres." };
  }
  
  // Only allow letters, spaces, accents, apostrophes, and hyphens
  const nameRegex = /^[a-zA-Z\u00C0-\u024F'\s-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: "O nome só pode conter letras, acentos, espaços, apóstrofos e hífens." 
    };
  }
  
  return { valid: true };
}

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
    // Return existing certificate (idempotent)
    return NextResponse.json({
      certificate: {
        id: existingCertificate.id,
        publicCode: existingCertificate.publicCode,
        recipientName: existingCertificate.recipientName,
        issuedAt: existingCertificate.issuedAt.toISOString(),
        status: existingCertificate.status,
        completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
      },
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

  // Create the certificate
  try {
    const certificate = await prisma.certificate.create({
      data: {
        publicCode,
        userId: uid,
        courseId: "nail-designer-iniciante",
        recipientName: recipientName.trim(),
        issuedAt: new Date(),
        curriculumVersion: 1,
        status: "valid",
        showOnWall: typeof showOnWall === "boolean" ? showOnWall : true,
      },
    });

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        publicCode: certificate.publicCode,
        recipientName: certificate.recipientName,
        issuedAt: certificate.issuedAt.toISOString(),
        status: certificate.status,
        completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
      },
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
      completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
    },
  });
}

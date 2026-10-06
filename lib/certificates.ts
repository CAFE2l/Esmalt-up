/**
 * Certificate utilities
 */

import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { getMainTrackLessons } from "@/data/course";
import { normalizePublicCode } from "./certificateCode";

// Base32 alphabet without ambiguous characters (0/O/1/I)
const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BASE32_LENGTH = 8;

/** Generate a cryptographically secure public code: ESM-YYYY-XXXXXXXX */
export function generatePublicCode(): string {
  const year = new Date().getFullYear();
  const randomBuffer = randomBytes(BASE32_LENGTH);
  let code = "";

  for (let i = 0; i < BASE32_LENGTH; i++) {
    const index = randomBuffer[i] % BASE32_ALPHABET.length;
    code += BASE32_ALPHABET[index];
  }

  return `ESM-${year}-${code}`;
}

export { normalizePublicCode, validatePublicCodeFormat } from "./certificateCode";

/** Validate recipient name */
export function validateRecipientName(name: string): { valid: boolean; error?: string } {
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

/**
 * Check if user has completed ALL published lessons (excluding "Em breve")
 * Uses database progress data
 */
export async function checkCertificateEligibility(uid: string): Promise<boolean> {
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
      // Lesson not in database yet - this means user hasn't completed it
      // if it's not even in the DB
      return false;
    }
    
    if (!completedLessonIds.has(lessonId)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get user's certificate if it exists
 */
export async function getUserCertificate(uid: string): Promise<{
  id: string;
  publicCode: string;
  recipientName: string;
  issuedAt: Date;
  status: string;
} | null> {
  const certificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: uid,
        courseId: "nail-designer-iniciante",
      },
    },
  });
  
  if (!certificate) {
    return null;
  }
  
  return {
    id: certificate.id,
    publicCode: certificate.publicCode,
    recipientName: certificate.recipientName,
    issuedAt: certificate.issuedAt,
    status: certificate.status,
  };
}

/**
 * Get certificate by public code
 */
export async function getCertificateByPublicCode(code: string): Promise<{
  id: string;
  publicCode: string;
  userId: string;
  recipientName: string;
  issuedAt: Date;
  status: string;
  curriculumVersion: number;
} | null> {
  const normalizedCode = normalizePublicCode(code);
  
  const certificate = await prisma.certificate.findUnique({
    where: { publicCode: normalizedCode },
  });
  
  if (!certificate) {
    return null;
  }
  
  return {
    id: certificate.id,
    publicCode: certificate.publicCode,
    userId: certificate.userId,
    recipientName: certificate.recipientName,
    issuedAt: certificate.issuedAt,
    status: certificate.status,
    curriculumVersion: certificate.curriculumVersion,
  };
}

/**
 * Public-safe certificate lookup for the verification endpoint.
 * Returns ONLY the fields that are safe to show to the public.
 * Never exposes userId, email or internal ids.
 */
export async function getPublicCertificateByCode(code: string): Promise<{
  publicCode: string;
  recipientName: string;
  courseId: string;
  issuedAt: Date;
  status: string;
  rankPosition: number | null;
  publicProfile: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    allowFollows: boolean;
    followersCount: number;
    followingCount: number;
  } | null;
} | null> {
  const normalizedCode = normalizePublicCode(code);

  const certificate = await prisma.certificate.findUnique({
    where: { publicCode: normalizedCode },
    select: {
      publicCode: true,
      recipientName: true,
      courseId: true,
      issuedAt: true,
      status: true,
      rankPosition: true,
      user: {
        select: {
          publicProfile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              isPublic: true,
              allowFollows: true,
              followersCount: true,
              followingCount: true,
            },
          },
        },
      },
    },
  });

  if (!certificate) return null;
  const profile = certificate.user.publicProfile;
  return {
    publicCode: certificate.publicCode,
    recipientName: certificate.recipientName,
    courseId: certificate.courseId,
    issuedAt: certificate.issuedAt,
    status: certificate.status,
    rankPosition: certificate.rankPosition,
    publicProfile: profile?.isPublic
      ? {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          allowFollows: profile.allowFollows,
          followersCount: profile.followersCount,
          followingCount: profile.followingCount,
        }
      : null,
  };
}

/**
 * Revoke a certificate (admin only)
 */
export async function revokeCertificate(publicCode: string): Promise<boolean> {
  const normalizedCode = normalizePublicCode(publicCode);
  
  try {
    await prisma.certificate.update({
      where: { publicCode: normalizedCode },
      data: { status: "revoked" },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date in pt-BR long format
 */
export function formatDatePtBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

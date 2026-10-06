import { prisma } from "@/lib/prisma";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "formada";
}

export async function ensurePublicProfile(
  userId: string,
  displayName?: string,
) {
  const existing = await prisma.publicProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const source = await prisma.userProfile.findUnique({
    where: { uid: userId },
    select: {
      name: true,
      avatarUrl: true,
      profilePhotoUrl: true,
      createdAt: true,
    },
  });
  if (!source) return null;

  const name = displayName?.trim() || source.name?.trim() || "Formada(o)";
  const username = `${slugify(name).slice(0, 24)}-${userId.slice(-6).toLowerCase()}`;
  return prisma.publicProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      username,
      displayName: name,
      avatarUrl: source.profilePhotoUrl ?? source.avatarUrl,
      joinedAt: source.createdAt,
    },
  });
}

export function safePublicProfile<T extends { avatarUrl: string | null }>(
  profile: T,
): Omit<T, "avatarUrl"> & { avatarUrl: string | null } {
  const url = profile.avatarUrl;
  let avatarUrl: string | null = null;
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        avatarUrl = url;
      }
    } catch {
      avatarUrl = null;
    }
  }
  return { ...profile, avatarUrl };
}

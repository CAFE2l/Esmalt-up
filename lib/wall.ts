export interface WallProfile {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  allowFollows: boolean;
}

export interface WallEntry {
  rankPosition: number;
  recipientName: string;
  issuedAt: string;
  publicCode: string;
  profile: WallProfile | null;
  isFollowing: boolean;
  isOwn: boolean;
}

export interface WallStats {
  total: number;
  thisMonth: number;
  today: number;
  firstGraduate: string | null;
  newestGraduate: string | null;
  averagePerMonth: number;
}

export interface WallPage {
  entries: WallEntry[];
  topThree: WallEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  stats: WallStats;
}

interface CertificateRow {
  recipientName: string;
  issuedAt: Date;
  publicCode: string;
  rankPosition: number | null;
  userId: string;
  user: {
    publicProfile: (WallProfile & { userId: string; isPublic: boolean }) | null;
  };
}

export function safeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function toWallEntry(
  row: CertificateRow,
  isFollowing = false,
  viewerId?: string,
): WallEntry {
  const publicProfile = row.user.publicProfile?.isPublic
    ? {
        username: row.user.publicProfile.username,
        displayName: row.user.publicProfile.displayName,
        avatarUrl: safeAvatarUrl(row.user.publicProfile.avatarUrl),
        followersCount: row.user.publicProfile.followersCount,
        followingCount: row.user.publicProfile.followingCount,
        allowFollows: row.user.publicProfile.allowFollows,
      }
    : null;
  return {
    rankPosition: row.rankPosition ?? 0,
    recipientName: publicProfile?.displayName ?? "Formado(a) anônimo(a)",
    issuedAt: row.issuedAt.toISOString(),
    publicCode: row.publicCode,
    profile: publicProfile,
    isFollowing,
    isOwn: Boolean(viewerId && row.userId === viewerId),
  };
}

export function longDatePtBR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function isNewGraduate(iso: string, now = Date.now()): boolean {
  const time = new Date(iso).getTime();
  const age = now - time;
  return Number.isFinite(time) && age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
}

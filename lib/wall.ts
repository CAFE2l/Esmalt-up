/**
 * Public "Mural de Formados" helpers.
 *
 * Privacy rule: the only fields that may ever leave the server for the wall
 * are recipientName, avatarUrl, issuedAt and publicCode. Never expose email,
 * user id, internal certificate id, nickname or progress.
 */

export interface WallEntry {
  recipientName: string;
  avatarUrl: string | null;
  issuedAt: string; // ISO
  publicCode: string;
}

export interface WallPage {
  entries: WallEntry[];
  total: number;
  nextCursor: string | null;
}

interface CertificateRow {
  recipientName: string;
  issuedAt: Date;
  publicCode: string;
  user: { profilePhotoUrl: string | null; avatarUrl: string | null } | null;
}

/** Only allow http(s) avatar URLs; anything else falls back to initials. */
export function safeAvatarUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

export function toWallEntry(row: CertificateRow): WallEntry {
  const raw = row.user?.profilePhotoUrl ?? row.user?.avatarUrl ?? null;
  return {
    recipientName: row.recipientName,
    avatarUrl: safeAvatarUrl(raw),
    issuedAt: row.issuedAt.toISOString(),
    publicCode: row.publicCode,
  };
}

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** e.g. "OUTUBRO DE 2026" */
export function monthLabel(iso: string): string {
  const d = new Date(iso);
  const month = MONTHS_PT[d.getMonth()] ?? "";
  return `${month} DE ${d.getFullYear()}`.toUpperCase();
}

/** e.g. "2 de outubro de 2026" */
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
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const diff = now - t;
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

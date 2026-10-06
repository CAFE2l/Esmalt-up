/**
 * Certificate public code helpers.
 * Client-safe: no Prisma / crypto / server imports, so it can be used
 * from both API routes and browser components.
 *
 * Format: ESM-YYYY-XXXXXXXX (8 chars from a safe Base32 alphabet).
 */

const CODE_PATTERN = /^ESM-\d{4}-[A-HJ-NP-Z2-9]{8}$/;

/**
 * Normalize a user-typed code before lookup.
 * - trims, uppercases
 * - removes inner spaces
 * - accepts codes pasted without hyphens (ESM2026XXXXXXXX) and restores them
 * - accepts codes with extra hyphens/spaces and collapses them
 */
export function normalizePublicCode(code: string): string {
  if (!code) return "";

  // Uppercase, trim, drop spaces and stray hyphens/underscores
  const cleaned = code
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "")
    .replace(/-+/g, "");

  // If it looks like a compact code without hyphens, restore the format
  const compact = /^ESM(\d{4})([A-HJ-NP-Z2-9]{8})$/.exec(cleaned);
  if (compact) {
    return `ESM-${compact[1]}-${compact[2]}`;
  }

  // Otherwise keep hyphens but cleaned up (ESM-2026-XXXXXXXX with possible junk)
  return code
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "")
    .replace(/-+/g, "-");
}

/** Validate public code format (after normalization). */
export function validatePublicCodeFormat(code: string): boolean {
  return CODE_PATTERN.test(normalizePublicCode(code));
}

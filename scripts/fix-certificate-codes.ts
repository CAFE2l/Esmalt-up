/**
 * Migration: normalize certificate public codes.
 *
 * - Finds certificates whose publicCode is missing, empty or not in the
 *   canonical format (ESM-YYYY-XXXXXXXX).
 * - Tries to normalize existing codes (trim, uppercase, restore hyphens).
 * - Regenerates a fresh code when the existing one is unfixable or collides.
 *
 * Run with:
 *   npx tsx scripts/fix-certificate-codes.ts          # dry-run (no writes)
 *   npx tsx scripts/fix-certificate-codes.ts --apply  # apply changes
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generatePublicCode } from "../lib/certificates";
import { normalizePublicCode, validatePublicCodeFormat } from "../lib/certificateCode";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const certificates = await prisma.certificate.findMany({
    select: { id: true, publicCode: true },
  });

  console.log(`Found ${certificates.length} certificates. Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  let fixed = 0;
  let regenerated = 0;
  let ok = 0;

  for (const cert of certificates) {
    const original = cert.publicCode ?? "";
    const normalized = normalizePublicCode(original);

    if (normalized === original && validatePublicCodeFormat(normalized)) {
      ok++;
      continue;
    }

    let newCode: string | null = null;

    if (validatePublicCodeFormat(normalized)) {
      // Normalized form is valid — check collision
      const collision = await prisma.certificate.findUnique({
        where: { publicCode: normalized },
      });
      if (!collision || collision.id === cert.id) {
        newCode = normalized;
      }
    }

    if (!newCode) {
      // Generate a fresh code
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generatePublicCode();
        const existing = await prisma.certificate.findUnique({
          where: { publicCode: candidate },
        });
        if (!existing) {
          newCode = candidate;
          break;
        }
      }
      if (!newCode) {
        console.error(`❌ Could not generate unique code for ${cert.id}`);
        continue;
      }
      regenerated++;
    } else {
      fixed++;
    }

    console.log(`${APPLY ? "✏️" : "🔎"} ${cert.id}: "${original}" -> "${newCode}"`);

    if (APPLY) {
      await prisma.certificate.update({
        where: { id: cert.id },
        data: { publicCode: newCode },
      });
    }
  }

  console.log(`\nDone. OK: ${ok}, normalized: ${fixed}, regenerated: ${regenerated}.`);
  if (!APPLY) {
    console.log("Dry-run only. Re-run with --apply to write changes.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

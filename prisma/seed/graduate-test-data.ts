import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function testCode(index: number): string {
  let value = index;
  let suffix = "";
  for (let digit = 0; digit < 5; digit += 1) {
    suffix = alphabet[value % alphabet.length] + suffix;
    value = Math.floor(value / alphabet.length);
  }
  return `ESM-${new Date().getFullYear()}-TST${suffix}`;
}

async function main() {
  const existing = await prisma.certificate.count();
  if (existing > 0) {
    throw new Error(
      "A amostra só pode ser criada em um banco de teste vazio; certificados existentes não serão reordenados.",
    );
  }

  const now = new Date();
  for (let index = 1; index <= 18; index += 1) {
    const userId = `test-graduate-${String(index).padStart(2, "0")}`;
    const recipientName = `Aluna Teste ${String(index).padStart(2, "0")}`;
    const issuedAt = new Date(now);
    issuedAt.setUTCMonth(issuedAt.getUTCMonth() - (18 - index));
    issuedAt.setUTCDate(Math.min(28, index === 18 ? now.getUTCDate() : index + 2));
    issuedAt.setUTCHours(12, 0, 0, 0);
    const isPublic = ![4, 9, 14].includes(index);

    await prisma.userProfile.create({
      data: {
        uid: userId,
        name: recipientName,
        interests: [],
        badges: [],
        createdAt: issuedAt,
      },
    });
    await prisma.publicProfile.create({
      data: {
        userId,
        username: `teste-formada-${String(index).padStart(2, "0")}`,
        displayName: recipientName,
        bio: `Perfil de teste ${String(index).padStart(2, "0")} — pode ser removido com o script de limpeza.`,
        joinedAt: issuedAt,
        isPublic,
        allowFollows: true,
      },
    });
    await prisma.$transaction(async (tx) => {
      const counter = await tx.certificateRankCounter.update({
        where: { id: 1 },
        data: { lastRank: { increment: 1 } },
        select: { lastRank: true },
      });
      await tx.certificate.create({
        data: {
          publicCode: testCode(index),
          userId,
          courseId: "nail-designer-iniciante",
          recipientName,
          issuedAt,
          curriculumVersion: 1,
          status: "valid",
          showOnWall: true,
          rankPosition: counter.lastRank,
          isTestData: true,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log(`✓ ${recipientName} — ${isPublic ? "perfil público" : "perfil anônimo"} — ${issuedAt.toISOString().slice(0, 10)}`);
  }
  console.log("18 certificados de teste criados. Não execute este seed em produção.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

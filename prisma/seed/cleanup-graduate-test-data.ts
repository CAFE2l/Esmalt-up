import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const testUserIds = Array.from({ length: 18 }, (_, index) =>
  `test-graduate-${String(index + 1).padStart(2, "0")}`,
);

async function main() {
  const removed = await prisma.certificate.deleteMany({
    where: { userId: { in: testUserIds }, isTestData: true },
  });
  await prisma.userProfile.deleteMany({ where: { uid: { in: testUserIds } } });
  console.log(`${removed.count} certificados de teste removidos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

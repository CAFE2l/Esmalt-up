import { PrismaClient } from "@prisma/client";
import { PRODUCTS } from "@/lib/catalogData.static";

const prisma = new PrismaClient();

async function seedProducts() {
  console.log("🌱 Seeding products...");

  for (const product of PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.id },
    });

    if (existing) {
      console.log(`  ⏭️  Skipping existing product: ${product.name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        slug: product.id,
        kind: product.kind,
        name: product.name,
        description: product.description,
        brand: "Esmalt'up",
        sku: `ESM-${product.id.toUpperCase()}`,
        priceCents: product.priceCents,
        category: product.category,
        stock: product.stockStatus === "in_stock" ? 99 : 0,
        featured: product.featured,
        videoUrl: product.videoUrl,
        images: [product.imageUrl],
        highlights: product.features || [],
        specs: product.specs ? { specs: product.specs } : null,
        weightG: 500, // Default weight in grams
        heightCm: 10,
        widthCm: 10,
        lengthCm: 10,
        level: product.level,
        active: true,
      },
    });

    console.log(`  ✅ Created product: ${product.name}`);
  }

  console.log("✨ Products seeded successfully!");
}

seedProducts()
  .catch((error) => {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

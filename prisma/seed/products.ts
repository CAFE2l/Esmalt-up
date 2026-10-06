import { Prisma, PrismaClient } from "@prisma/client";
import { PRODUCTS } from "@/lib/catalogData.static";

const prisma = new PrismaClient();

async function seedProducts() {
  console.log("🌱 Seeding products...");

  for (const product of PRODUCTS) {
    const productData = {
      slug: product.id,
      kind: product.kind,
      name: product.name,
      description: product.description,
      brand: product.brand ?? "Esmalt'up",
      sku: `ESM-${product.id.toUpperCase()}`,
      priceCents: product.priceCents,
      oldPriceCents: product.oldPriceCents ?? null,
      category: product.category,
      stock: product.stock ?? (product.stockStatus === "in_stock" ? 99 : 0),
      featured: product.featured,
      videoUrl: product.videoUrl,
      images: product.images ?? [product.imageUrl],
      highlights: product.features || [],
      specs: product.specs ? { specs: product.specs } : undefined,
      variants: product.variants ? product.variants as Prisma.InputJsonValue : undefined,
      weightG: product.weightG ?? 500,
      heightCm: 10,
      widthCm: 10,
      lengthCm: 10,
      level: product.level,
      active: true,
    };

    await prisma.product.upsert({
      where: { slug: product.id },
      create: productData,
      update: {
        name: productData.name,
        description: productData.description,
        brand: productData.brand,
        oldPriceCents: productData.oldPriceCents,
        images: productData.images,
        highlights: productData.highlights,
        specs: productData.specs,
        variants: productData.variants,
        weightG: productData.weightG,
      },
    });
    console.log(`  ✅ Upserted product: ${product.name}`);
  }

  console.log("✨ Products seeded successfully!");

  if (process.env.SEED_DEMO_REVIEWS === "1") {
    const sampleReviews = [
      { productSlug: "peca-top-coat", rating: 5, content: "Conteúdo fictício para validar a exibição e moderação de avaliações." },
      { productSlug: "peca-lixas", rating: 4, content: "Avaliação de demonstração. Substitua por uma opinião real antes de publicar." },
      { productSlug: "peca-brocas", rating: 5, content: "Registro de teste do formulário e da moderação, sem representar uma compra real." },
      { productSlug: "peca-cabine-sun", rating: 4, content: "Conteúdo de teste para validar avaliações; não publicar como depoimento de cliente." },
    ];

    for (const sample of sampleReviews) {
      const product = await prisma.product.findUnique({
        where: { slug: sample.productSlug },
        select: { id: true },
      });
      if (!product) continue;
      const existing = await prisma.review.findFirst({
        where: {
          productId: product.id,
          userId: null,
          title: "DEMONSTRAÇÃO — NÃO PUBLICAR",
        },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.review.create({
        data: {
          productId: product.id,
          userName: "Conta de demonstração",
          rating: sample.rating,
          title: "DEMONSTRAÇÃO — NÃO PUBLICAR",
          content: sample.content,
          status: "pending",
          verifiedPurchase: false,
        },
      });
    }
    console.log("⚠️  Demo reviews created as pending, non-public moderation records.");
  }
}

seedProducts()
  .catch((error) => {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

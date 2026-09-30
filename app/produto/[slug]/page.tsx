import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import ProductView from "@/components/produto/ProductView";
import ReviewsSection from "@/components/produto/ReviewsSection";
import QuestionsSection from "@/components/produto/QuestionsSection";
import RelatedProducts from "@/components/produto/RelatedProducts";

export const runtime = "nodejs";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };

  const imageUrl = product.images[0] || "/placeholder-product.jpg";

  return {
    title: `${product.name} | Esmalt'up`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/produto/${slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Redirect old routes to new unified route
  // (kept for backward compatibility - old links still work via this page)

  const where = { productId: product.id, status: "approved" as const };

  const [total, grouped] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ["rating"],
      where,
      _count: { _all: true },
    }),
  ]);

  const distribution: Record<string, number> = {};
  let sum = 0;
  for (const group of grouped) {
    distribution[group.rating] = group._count._all;
    sum += group.rating * group._count._all;
  }
  const average = total > 0 ? sum / total : null;

  const related = await getRelatedProducts(product, 4);

  return (
    <div className="pb-24 bg-[#1c1519]">
      {/* JSON-LD Schema.org Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.images,
            brand: product.brand
              ? { "@type": "Brand", name: product.brand }
              : undefined,
            sku: product.sku,
            offers: {
              "@type": "Offer",
              url: `${process.env.NEXT_PUBLIC_APP_URL}/produto/${product.slug}`,
              priceCurrency: "BRL",
              price: (product.priceCents / 100).toFixed(2),
              availability:
                product.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              ...(product.oldPriceCents
                ? { priceValidUntil: "2026-12-31" }
                : {}),
            },
            ...(average
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: average.toFixed(1),
                    reviewCount: total,
                    bestRating: 5,
                    worstRating: 1,
                  },
                }
              : {}),
          }),
        }}
      />

      <ProductView
        product={product}
        initialAverage={average}
        initialCount={total}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6">
        <div id="avaliacoes">
          <ReviewsSection productId={product.id} />
        </div>
        <QuestionsSection productId={product.id} />
      </div>

      {related.length > 0 && <RelatedProducts products={related} />}
    </div>
  );
}

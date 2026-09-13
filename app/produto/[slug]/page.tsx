import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalogData";
import { prisma } from "@/lib/prisma";
import ProductView from "@/components/produto/ProductView";
import ReviewsSection from "@/components/produto/ReviewsSection";
import QuestionsSection from "@/components/produto/QuestionsSection";
import RelatedProducts from "@/components/produto/RelatedProducts";
import Link from "next/link";

export const runtime = "nodejs";

export async function generateStaticParams() {
  const { PRODUCTS } = await import("@/lib/catalogData");
  return PRODUCTS.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [{ url: product.imageUrl }] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

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

  const related = getRelatedProducts(product, 4);

  return (
    <div className="pb-24">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-4 text-xs text-foreground/60 sm:px-6">
        <Link href="/" className="hover:text-rose-gold">
          Início
        </Link>
        <span aria-hidden>/</span>
        <Link href={product.kind === "kit" ? "/kits" : "/pecas-avulsas"} className="hover:text-rose-gold">
          {product.kind === "kit" ? "Kits" : "Peças Avulsas"}
        </Link>
        <span aria-hidden>/</span>
        <span className="max-w-[140px] truncate text-foreground/80">
          {product.name}
        </span>
      </nav>

      <ProductView
        product={product}
        initialAverage={average}
        initialCount={total}
      />

      {/* Features e specs */}
      {(product.features && product.features.length > 0) ||
      (product.specs && product.specs.length > 0) ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {product.features && product.features.length > 0 && (
              <div className="rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 shadow-card">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Por que você vai amar
                </h3>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 h-5 w-5 shrink-0 text-rose-gold">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.specs && product.specs.length > 0 && (
              <div className="rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 shadow-card">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Especificações
                </h3>
                <table className="w-full text-sm text-foreground/80">
                  <tbody>
                    {product.specs.map((spec, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-rosa-claro/30"
                            : ""
                        }
                      >
                        <td className="py-2.5 pl-4 pr-3 font-medium text-foreground/70">
                          {spec.label}
                        </td>
                        <td className="py-2.5 pl-3 pr-4">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div id="avaliacoes">
          <ReviewsSection productId={product.id} />
        </div>
        <QuestionsSection productId={product.id} />
      </div>

      {related.length > 0 && <RelatedProducts products={related} />}

      {/* Botão flutuante mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cinza-suave/40 bg-branco p-4 shadow-header sm:hidden">
        <Link
          href="/checkout"
          className="w-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-bold text-white shadow-lg"
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}
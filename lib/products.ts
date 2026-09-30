import { prisma } from "./prisma";
import { PRODUCTS } from "./catalogData.static";

export interface Product {
  id: string;
  slug: string;
  kind: "kit" | "peca";
  name: string;
  description: string;
  brand: string | null;
  sku: string | null;
  priceCents: number;
  oldPriceCents: number | null;
  category: string;
  stock: number;
  featured: boolean;
  videoUrl: string | null;
  images: string[];
  highlights: string[];
  specs: { label: string; value: string }[] | null;
  variants: Record<string, unknown> | null;
  weightG: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  ratingAvg: number;
  ratingCount: number;
  level: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductKind = "kit" | "peca";
export type StockStatus = "in_stock" | "out_of_stock";
export type SkillLevel = "iniciante" | "medio" | "profissional";

const CATEGORY_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  profissional: "Profissional",
  completo: "Completo",
  alongamento: "Alongamento",
  cabine: "Cabine",
  lixas: "Lixas",
  brocas: "Brocas",
  tips: "Tips",
  preparadores: "Preparadores",
  finalizadores: "Finalizadores",
  alicates: "Alicates",
  motor: "Motor",
};

const LEVEL_LABELS: Record<SkillLevel, string> = {
  iniciante: "Iniciante",
  medio: "Médio",
  profissional: "Profissional",
};

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

// Server-side async functions
export async function getFeatured(kind: ProductKind): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      kind,
      featured: true,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map(transformDbProduct);
}

export async function getByKind(kind: ProductKind): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      kind,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map(transformDbProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  return product ? transformDbProduct(product) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
  });
  return product ? transformDbProduct(product) : null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 8,
): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      active: true,
      OR: [
        { category: product.category },
        { kind: product.kind },
      ],
    },
    take: limit,
    orderBy: [
      { kind: product.kind ? "desc" : "asc" },
      { featured: "desc" },
      { createdAt: "desc" },
    ],
  });
  return products.map(transformDbProduct);
}

// Client-side sync functions (fallback to static data)
export function getProductSync(id: string): Product | null {
  const staticProduct = PRODUCTS.find((p) => p.id === id);
  if (!staticProduct) return null;
  return transformStaticProduct(staticProduct);
}

export function getFeaturedSync(kind: ProductKind): Product[] {
  return PRODUCTS.filter((p) => p.kind === kind && p.featured).map(transformStaticProduct);
}

export function getByKindSync(kind: ProductKind): Product[] {
  return PRODUCTS.filter((p) => p.kind === kind).map(transformStaticProduct);
}

function transformStaticProduct(staticProduct: Record<string, unknown>): Product {
  return {
    id: staticProduct.id,
    slug: staticProduct.id,
    kind: staticProduct.kind,
    name: staticProduct.name,
    description: staticProduct.description,
    brand: "Esmalt'up",
    sku: `ESM-${staticProduct.id.toUpperCase()}`,
    priceCents: staticProduct.priceCents,
    oldPriceCents: null,
    category: staticProduct.category,
    stock: staticProduct.stockStatus === "in_stock" ? 99 : 0,
    featured: staticProduct.featured,
    videoUrl: staticProduct.videoUrl,
    images: [staticProduct.imageUrl],
    highlights: staticProduct.features || [],
    specs: staticProduct.specs || null,
    variants: null,
    weightG: 500,
    heightCm: 10,
    widthCm: 10,
    lengthCm: 10,
    ratingAvg: staticProduct.rating || 0,
    ratingCount: staticProduct.reviewCount || 0,
    level: staticProduct.level,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const MAX_INSTALLMENTS = 12;
const MIN_INSTALLMENT_CENTS = 1000;

export function getInstallments(priceCents: number): {
  maxInstallments: number;
  installmentCents: number;
  totalCents: number;
} {
  let maxInstallments = 1;
  for (let i = MAX_INSTALLMENTS; i >= 1; i -= 1) {
    const installment = priceCents / i;
    if (installment >= MIN_INSTALLMENT_CENTS) {
      maxInstallments = i;
      break;
    }
  }
  const totalCents = maxInstallments > 1 ? priceCents : priceCents;
  const installmentCents = Math.ceil(totalCents / maxInstallments);
  return {
    maxInstallments,
    installmentCents,
    totalCents,
  };
}

export function formatInstallment(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function freeShippingThresholdCents(): number {
  return 9900;
}

function transformDbProduct(dbProduct: Record<string, unknown>): Product {
  const specs = dbProduct.specs as { specs?: { label: string; value: string }[] } | null;
  return {
    id: dbProduct.id,
    slug: dbProduct.slug,
    kind: dbProduct.kind as ProductKind,
    name: dbProduct.name,
    description: dbProduct.description,
    brand: dbProduct.brand,
    sku: dbProduct.sku,
    priceCents: dbProduct.priceCents,
    oldPriceCents: dbProduct.oldPriceCents,
    category: dbProduct.category,
    stock: dbProduct.stock,
    featured: dbProduct.featured,
    videoUrl: dbProduct.videoUrl,
    images: dbProduct.images,
    highlights: dbProduct.highlights,
    specs: specs?.specs || null,
    variants: dbProduct.variants,
    weightG: dbProduct.weightG,
    heightCm: dbProduct.heightCm,
    widthCm: dbProduct.widthCm,
    lengthCm: dbProduct.lengthCm,
    ratingAvg: dbProduct.ratingAvg,
    ratingCount: dbProduct.ratingCount,
    level: dbProduct.level,
    active: dbProduct.active,
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export { CATEGORY_LABELS, LEVEL_LABELS };

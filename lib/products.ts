import { Prisma, type Product as DbProduct } from "@prisma/client";
import { prisma } from "./prisma";
import { PRODUCTS } from "./catalogData.static";
import type { Product as StaticProduct } from "./catalogData.static";

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
  optionGroups?: ProductOptionGroup[];
  weightG: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  level: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceCents: number;
  oldPriceCents?: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  color?: string;
  description?: string;
  estimatedDelivery?: string;
}

export interface ProductOptionGroup {
  name: string;
  type: "color" | "size" | "voltage" | "version" | "quantity";
  options: ProductVariant[];
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

export function getPrimaryProductImage(
  product: Pick<Product, "slug" | "name" | "category" | "images">,
): string {
  if (
    product.category === "tips" &&
    (product.name === "Tips Almond 500 un" || product.slug === "peca-tips")
  ) {
    return "/produtos/produtos_separados/tips_almond.jpg";
  }
  return product.images[0] ?? "";
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
  
  // Fallback to static data if database is empty
  if (products.length === 0) {
    return getFeaturedSync(kind);
  }
  
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
  
  // Fallback to static data if database is empty
  if (products.length === 0) {
    return getByKindSync(kind);
  }
  
  return products.map(transformDbProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (product) return transformDbProduct(product);
  const staticProduct = PRODUCTS.find((item) => item.id === id);
  return staticProduct ? transformStaticProduct(staticProduct) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
  });
  if (product) return transformDbProduct(product);
  const staticProduct = PRODUCTS.find((item) => item.id === slug);
  return staticProduct ? transformStaticProduct(staticProduct) : null;
}

export async function ensureProductRecord(identifier: string): Promise<Product | null> {
  const existing = await prisma.product.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
  });
  if (existing) return existing.active ? transformDbProduct(existing) : null;

  const staticProduct = PRODUCTS.find((item) => item.id === identifier);
  if (!staticProduct) return null;
  const catalogProduct = transformStaticProduct(staticProduct);
  const record = await prisma.product.upsert({
    where: { slug: catalogProduct.slug },
    create: {
      id: catalogProduct.id,
      slug: catalogProduct.slug,
      kind: catalogProduct.kind,
      name: catalogProduct.name,
      description: catalogProduct.description,
      brand: catalogProduct.brand,
      sku: catalogProduct.sku,
      priceCents: catalogProduct.priceCents,
      oldPriceCents: catalogProduct.oldPriceCents,
      category: catalogProduct.category,
      stock: catalogProduct.stock,
      featured: catalogProduct.featured,
      videoUrl: catalogProduct.videoUrl,
      images: catalogProduct.images,
      highlights: catalogProduct.highlights,
      specs: catalogProduct.specs
        ? { specs: catalogProduct.specs } as Prisma.InputJsonValue
        : undefined,
      variants: catalogProduct.variants
        ? catalogProduct.variants as Prisma.InputJsonValue
        : undefined,
      weightG: catalogProduct.weightG,
      heightCm: catalogProduct.heightCm,
      widthCm: catalogProduct.widthCm,
      lengthCm: catalogProduct.lengthCm,
      ratingAvg: catalogProduct.ratingAvg,
      ratingCount: catalogProduct.ratingCount,
      soldCount: catalogProduct.soldCount,
      level: catalogProduct.level,
      active: true,
    },
    update: {},
  });
  return record.active ? transformDbProduct(record) : null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 8,
): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: product.id },
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
  if (products.length > 0) return products.map(transformDbProduct);
  const staticRelated = getByKindSync(product.kind).filter(
    (candidate) => candidate.id !== product.id && candidate.category === product.category,
  );
  return (staticRelated.length > 0
    ? staticRelated
    : getByKindSync(product.kind).filter((candidate) => candidate.id !== product.id)
  ).slice(0, limit);
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

function transformStaticProduct(staticProduct: StaticProduct): Product {
  return {
    id: staticProduct.id,
    slug: staticProduct.id,
    kind: staticProduct.kind,
    name: staticProduct.name,
    description: staticProduct.description,
    brand: staticProduct.brand ?? "Esmalt'up",
    sku: `ESM-${staticProduct.id.toUpperCase()}`,
    priceCents: staticProduct.priceCents,
    oldPriceCents: staticProduct.oldPriceCents ?? null,
    category: staticProduct.category,
    stock: staticProduct.stock ?? (staticProduct.stockStatus === "in_stock" ? 99 : 0),
    featured: staticProduct.featured,
    videoUrl: staticProduct.videoUrl ?? null,
    images: staticProduct.images ?? [staticProduct.imageUrl],
    highlights: staticProduct.features || [],
    specs: staticProduct.specs || null,
    variants: staticProduct.variants ?? null,
    optionGroups: parseOptionGroups(staticProduct.variants),
    weightG: staticProduct.weightG ?? 500,
    heightCm: 10,
    widthCm: 10,
    lengthCm: 10,
    ratingAvg: staticProduct.rating || 0,
    ratingCount: staticProduct.reviewCount || 0,
    soldCount: staticProduct.soldCount ?? 0,
    level: staticProduct.level ?? null,
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

function transformDbProduct(dbProduct: DbProduct): Product {
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
    variants: dbProduct.variants as Record<string, unknown> | null,
    optionGroups: parseOptionGroups(dbProduct.variants),
    weightG: dbProduct.weightG,
    heightCm: dbProduct.heightCm,
    widthCm: dbProduct.widthCm,
    lengthCm: dbProduct.lengthCm,
    ratingAvg: dbProduct.ratingAvg,
    ratingCount: dbProduct.ratingCount,
    soldCount: dbProduct.soldCount,
    level: dbProduct.level,
    active: dbProduct.active,
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

function parseOptionGroups(value: unknown): ProductOptionGroup[] | undefined {
  if (!value || typeof value !== "object" || !("optionGroups" in value)) return undefined;
  const groups = (value as { optionGroups?: unknown }).optionGroups;
  if (!Array.isArray(groups)) return undefined;
  return groups.filter((group): group is ProductOptionGroup => {
    if (!group || typeof group !== "object") return false;
    const candidate = group as Partial<ProductOptionGroup>;
    return (
      typeof candidate.name === "string" &&
      ["color", "size", "voltage", "version", "quantity"].includes(candidate.type ?? "") &&
      Array.isArray(candidate.options) &&
      candidate.options.every(
        (option) =>
          option &&
          typeof option.id === "string" &&
          typeof option.name === "string" &&
          Number.isInteger(option.priceCents) &&
          Number.isInteger(option.stock),
      )
    );
  });
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export { CATEGORY_LABELS, LEVEL_LABELS };

/**
 * Esmalt'up — Kits & Peças Avulsas catalog
 *
 * Static placeholder catalog until a real product API / Cloudinary
 * assets ship. Swap `imageUrl` for:
 *   https://res.cloudinary.com/<cloud>/image/upload/<public_id>
 *
 * Ratings stay null — no review data exists yet.
 * `stockStatus` is availability only (no scarcity copy).
 */

export type ProductKind = "kit" | "peca";
export type StockStatus = "in_stock" | "out_of_stock";
export type SkillLevel = "iniciante" | "medio" | "profissional";

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  category: string;
  featured: boolean;
  stockStatus: StockStatus;
  rating: number | null;
  reviewCount: number | null;
  level?: SkillLevel;
  videoUrl?: string;
  specs?: { label: string; value: string }[];
  features?: string[];
}

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  iniciante: "Iniciante",
  medio: "Médio",
  profissional: "Profissional",
};

export const CATEGORY_LABELS: Record<string, string> = {
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

export const PRODUCTS: Product[] = [
  {
    id: "kit-iniciante",
    kind: "kit",
    name: "Kit Iniciante",
    description:
      "Tudo para os primeiros atendimentos: lixas, primer, esmaltação e higiene em um só conjunto.",
    imageUrl: "/produtos/kits/kit_iniciante.jpg",
    priceCents: 18990,
    category: "iniciante",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    level: "iniciante",
    features: [
      "Lixas de corte e acabamento para os primeiros atendimentos",
      "Primer para preparar a lâmina ungueal com segurança",
      "Esmaltação com brilho e secagem uniforme",
      "Kit de higienização e esterilização inclusos",
    ],
  },
  {
    id: "kit-profissional",
    kind: "kit",
    name: "Kit Profissional",
    description:
      "Seleção completa para quem já atende: motor, brocas, tips e finalizadores de alta durabilidade.",
    imageUrl: "/produtos/kits/kit_profissional.jpg",
    priceCents: 34990,
    category: "profissional",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    level: "profissional",
    videoUrl: "https://cdn.sanity.io/files/5b2ef1ba/6f0e4f8e-f7f7-4ea9-9f8b-1c3b9e2c1e9d.mp4",
    features: [
      "Motor de lixadeira com controle de rotação",
      "Jogo de brocas para cutícula, gel e refinamento",
      "Tips e finalizadores de alta durabilidade",
      "Caixa organizadora com compartimentos",
    ],
    specs: [
      { label: "Modelo", value: "Esmalt'up Profissional Pro" },
      { label: "Itens", value: "18 peças" },
      { label: "Motor", value: "30.000 RPM com pedal" },
      { label: "Garantia", value: "12 meses" },
      { label: "Nível indicado", value: "Profissional" },
    ],
  },
  {
    id: "kit-cabine-led",
    kind: "kit",
    name: "Kit Cabine LED",
    description:
      "Cabine 48W com o kit de gel e top coat para cura rápida e brilho uniforme.",
    imageUrl: "/produtos/kits/kit_cabine.jpg",
    priceCents: 42990,
    category: "completo",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    level: "medio",
  },
  {
    id: "kit-completo",
    kind: "kit",
    name: "Kit Completo Assistência",
    description:
      "O conjunto para montar a bancada: cabine, motor, alicates, lixas e preparadores.",
    imageUrl: "/produtos/kits/kit_completo.jpg",
    priceCents: 59990,
    category: "completo",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    level: "profissional",
    features: [
      "Cabine LED, motor, alicates e lixas em um único conjunto",
      "Bancada completa para atender em casa ou no salão",
      "Preparadores e finalizadores incluídos",
      "Caixa transporte resistente com alças",
    ],
    specs: [
      { label: "Modelo", value: "Esmalt'up Studio Completo" },
      { label: "Itens", value: "34 peças" },
      { label: "Cabine", value: "LED 48W com timer" },
      { label: "Garantia", value: "12 meses" },
      { label: "Nível indicado", value: "Profissional" },
    ],
  },
  {
    id: "kit-fibra",
    kind: "kit",
    name: "Kit Fibra de Vidro",
    description:
      "Fibra, resina e pincéis para alongamento estruturado com acabamento limpo.",
    imageUrl: "/produtos/kits/kit_fibra.png",
    priceCents: 25990,
    category: "alongamento",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    level: "medio",
  },
  {
    id: "kit-alongamento",
    kind: "kit",
    name: "Kit Alongamento",
    description:
      "Tips, cola, lixas e molde para construir o comprimento com segurança.",
    imageUrl: "/produtos/kits/kit_alongamento.jpg",
    priceCents: 28990,
    category: "alongamento",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    level: "medio",
  },
  {
    id: "peca-cabine-led",
    kind: "peca",
    name: "Cabine LED 48W",
    description:
      "Cura gel e esmalte em segundos, com timer e espelho interno.",
    imageUrl: "/produtos/produtos_separados/cabine_led.jpg",
    priceCents: 17990,
    category: "cabine",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
    specs: [
      { label: "Potência", value: "48W" },
      { label: "Timer", value: "30 / 60 / 90 segundos" },
      { label: "Detector automático", value: "Sensor de mão" },
      { label: "Espelho interno", value: "Sim" },
      { label: "Voltagem", value: "Bivolt" },
    ],
  },
  {
    id: "peca-lixas",
    kind: "peca",
    name: "Lixas Banana 100/180",
    description: "Pacote com 50 unidades para modelar e refinar a superfície.",
    imageUrl: "/produtos/produtos_separados/lixa_banana.jpg",
    priceCents: 2490,
    category: "lixas",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-brocas",
    kind: "peca",
    name: "Jogo de Brocas",
    description:
      "Cinco brocas de cerâmica e metal para cutícula, gel e refinamento.",
    imageUrl: "/produtos/produtos_separados/jogo_de_broca.jpg",
    priceCents: 4990,
    category: "brocas",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-tips",
    kind: "peca",
    name: "Tips Almond 500 un",
    description: "Curvatura almond em 10 tamanhos, prontas para alongamento.",
    imageUrl: "/produtos/produtos_separados/tips_almond.svg",
    priceCents: 3290,
    category: "tips",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-fibra",
    kind: "peca",
    name: "Fibra de Vidro",
    description: "Fita de fibra para reforço e alongamento estruturado.",
    imageUrl: "/produtos/produtos_separados/fibra_vidro.jpg",
    priceCents: 2890,
    category: "alongamento",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-primer",
    kind: "peca",
    name: "Primer 10ml",
    description: "Preparador para aderência da esmaltação e do gel.",
    imageUrl: "/produtos/produtos_separados/primer.jpg",
    priceCents: 1990,
    category: "preparadores",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-top-coat",
    kind: "peca",
    name: "Top Coat Extra Brilho",
    description: "Selagem de alto brilho, sem residual, para o acabamento final.",
    imageUrl: "/produtos/produtos_separados/top_coat.jpg",
    priceCents: 2290,
    category: "finalizadores",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-alicate",
    kind: "peca",
    name: "Alicate de Cutícula",
    description: "Corte preciso, inox, para a finalização da cutícula.",
    imageUrl: "/produtos/produtos_separados/alicate.jpg",
    priceCents: 3990,
    category: "alicates",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-lixadeira",
    kind: "peca",
    name: "Motor de Lixadeira",
    description: "Motor compacto com controle de rotação para a bancada.",
    imageUrl: "/produtos/produtos_separados/lixadeira.jpg",
    priceCents: 15990,
    category: "motor",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-toner",
    kind: "peca",
    name: "Toner Preparador",
    description: "Limpa e desidrata a lâmina antes da esmaltação.",
    imageUrl: "/produtos/produtos_separados/toner_preparador.jpg",
    priceCents: 1890,
    category: "preparadores",
    featured: false,
    stockStatus: "out_of_stock",
    rating: null,
    reviewCount: null,
  },
];

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getFeatured(kind: ProductKind): Product[] {
  return PRODUCTS.filter((product) => product.kind === kind && product.featured);
}

export function getByKind(kind: ProductKind): Product[] {
  return PRODUCTS.filter((product) => product.kind === kind);
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProduct(slug);
}

export function getRelatedProducts(product: Product, limit = 8): Product[] {
  const sameCategory = PRODUCTS.filter(
    (item) =>
      item.id !== product.id &&
      (item.category === product.category || item.kind === product.kind),
  );
  const ordered = [...sameCategory].sort((a, b) => {
    const aSameKind = Number(a.kind === product.kind);
    const bSameKind = Number(b.kind === product.kind);
    return bSameKind - aSameKind || Number(b.featured) - Number(a.featured);
  });
  return ordered.slice(0, limit);
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

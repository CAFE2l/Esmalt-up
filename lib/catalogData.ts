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
}

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
    imageUrl: "",
    priceCents: 18990,
    category: "iniciante",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "kit-profissional",
    kind: "kit",
    name: "Kit Profissional",
    description:
      "Seleção completa para quem já atende: motor, brocas, tips e finalizadores de alta durabilidade.",
    imageUrl: "",
    priceCents: 34990,
    category: "profissional",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "kit-cabine-led",
    kind: "kit",
    name: "Kit Cabine LED",
    description:
      "Cabine 48W com o kit de gel e top coat para cura rápida e brilho uniforme.",
    imageUrl: "",
    priceCents: 42990,
    category: "completo",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "kit-completo",
    kind: "kit",
    name: "Kit Completo Assistência",
    description:
      "O conjunto para montar a bancada: cabine, motor, alicates, lixas e preparadores.",
    imageUrl: "",
    priceCents: 59990,
    category: "completo",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "kit-fibra",
    kind: "kit",
    name: "Kit Fibra de Vidro",
    description:
      "Fibra, resina e pincéis para alongamento estruturado com acabamento limpo.",
    imageUrl: "",
    priceCents: 25990,
    category: "alongamento",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "kit-alongamento",
    kind: "kit",
    name: "Kit Alongamento",
    description:
      "Tips, cola, lixas e molde para construir o comprimento com segurança.",
    imageUrl: "",
    priceCents: 28990,
    category: "alongamento",
    featured: false,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-cabine-led",
    kind: "peca",
    name: "Cabine LED 48W",
    description:
      "Cura gel e esmalte em segundos, com timer e espelho interno.",
    imageUrl: "",
    priceCents: 17990,
    category: "cabine",
    featured: true,
    stockStatus: "in_stock",
    rating: null,
    reviewCount: null,
  },
  {
    id: "peca-lixas",
    kind: "peca",
    name: "Lixas Banana 100/180",
    description: "Pacote com 50 unidades para modelar e refinar a superfície.",
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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
    imageUrl: "",
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

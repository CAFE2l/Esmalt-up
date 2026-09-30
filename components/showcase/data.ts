/**
 * Product showcase catalog.
 *
 * IMAGE SWAP
 * Photos in /public still have a white background. `image` points at those
 * files so the slider renders today. A hard white rectangle is hidden with
 * mix-blend-multiply on a soft pedestal (see ProductPhoto).
 * The best result is a cut-out PNG (transparent background): drop the file in
 * /public, point `image` at it, and set `cutout: true` so the blend is skipped.
 * Suggested targets are noted on each item (`/products/...png`).
 *
 * PLACEHOLDER
 * Rows with `placeholder: true` are invented so every tab has at least 4 items.
 * Their prices, names and images are not from the store. Replace them, or
 * delete the row, when the real product exists.
 *
 * Slugs match `lib/catalogData.ts` ids when the product is already on the
 * store, so "Ver detalhes" opens /produto/[slug] (via the /produtos redirect).
 */

export type ShowcaseTabId = "kits" | "pecas" | "ferramentas" | "esmaltes";

export interface ShowcaseProduct {
  id: string;
  slug: string;
  tab: ShowcaseTabId;
  category: string;
  name: string;
  description: string;
  /** Price in BRL, not cents. */
  price: number;
  image: string;
  /** Light tint used for text, glow and the active accent. Keep it AA on #1c1519. */
  tint: string;
  /** Deep tint mixed into the stage gradient. */
  tintSoft: string;
  /**
   * True when `image` is a transparent PNG. Leave false for JPEG/white-background
   * photos so the pedestal blend can knock the white out.
   */
  cutout?: boolean;
  /** Invented item. Not sold yet. */
  placeholder?: boolean;
}

export interface ShowcaseTab {
  id: ShowcaseTabId;
  label: string;
}

export const SHOWCASE_TABS: readonly ShowcaseTab[] = [
  { id: "kits", label: "Kits" },
  { id: "pecas", label: "Peças" },
  { id: "ferramentas", label: "Ferramentas do dia a dia" },
  { id: "esmaltes", label: "Esmaltes & Géis" },
];

export const SHOWCASE_PRODUCTS: readonly ShowcaseProduct[] = [
  {
    id: "kit-iniciante",
    slug: "kit-iniciante",
    tab: "kits",
    category: "Iniciante",
    name: "Kit Iniciante",
    description:
      "Tudo para os primeiros atendimentos: lixas, primer, esmaltação e higiene em um só conjunto.",
    price: 189.9,
    image: "/produtos/kits/kit_iniciante.jpg",
    // SWAP: /products/kit-iniciante.png + cutout: true
    tint: "#F3B6C7",
    tintSoft: "#5C3342",
  },
  {
    id: "kit-profissional",
    slug: "kit-profissional",
    tab: "kits",
    category: "Profissional",
    name: "Kit Profissional",
    description:
      "Seleção completa para quem já atende: motor, brocas, tips e finalizadores de alta durabilidade.",
    price: 349.9,
    image: "/produtos/kits/kit_profissional.jpg",
    // SWAP: /products/kit-profissional.png + cutout: true
    tint: "#D7C6FF",
    tintSoft: "#3A2C5C",
  },
  {
    id: "kit-cabine-led",
    slug: "kit-cabine-led",
    tab: "kits",
    category: "Cabine",
    name: "Kit Cabine LED",
    description: "Cabine 48W com o kit de gel e top coat para cura rápida e brilho uniforme.",
    price: 429.9,
    image: "/produtos/kits/kit_cabine.jpg",
    // SWAP: /products/kit-cabine.png + cutout: true
    tint: "#9AF0DC",
    tintSoft: "#1A4740",
  },
  {
    id: "kit-completo",
    slug: "kit-completo",
    tab: "kits",
    category: "Completo",
    name: "Kit Completo Assistência",
    description: "O conjunto para montar a bancada: cabine, motor, alicates, lixas e preparadores.",
    price: 599.9,
    image: "/produtos/kits/kit_completo.jpg",
    // SWAP: /products/kit-completo.png + cutout: true
    tint: "#F6D08A",
    tintSoft: "#5A431C",
  },

  {
    id: "peca-cabine-led",
    slug: "peca-cabine-led",
    tab: "pecas",
    category: "Cabine",
    name: "Cabine LED 48W",
    description: "Cura gel e esmalte em segundos, com timer e espelho interno.",
    price: 179.9,
    image: "/produtos/produtos_separados/cabine_led.jpg",
    // SWAP: /products/cabine-led.png + cutout: true
    tint: "#F3B6C7",
    tintSoft: "#6E3A4C",
  },
  {
    id: "peca-lixas",
    slug: "peca-lixas",
    tab: "pecas",
    category: "Lixas",
    name: "Lixas Banana 100/180",
    description: "Pacote com 50 unidades para modelar e refinar a superfície.",
    price: 24.9,
    image: "/produtos/produtos_separados/lixa_banana.jpg",
    // SWAP: /products/lixas-banana.png + cutout: true
    tint: "#F6D08A",
    tintSoft: "#5A431C",
  },
  {
    id: "peca-brocas",
    slug: "peca-brocas",
    tab: "pecas",
    category: "Brocas",
    name: "Jogo de Brocas",
    description: "Cinco brocas de cerâmica e metal para cutícula, gel e refinamento.",
    price: 49.9,
    image: "/produtos/produtos_separados/jogo_de_broca.jpg",
    // SWAP: /products/jogo-de-brocas.png + cutout: true
    tint: "#9AF0DC",
    tintSoft: "#1A4740",
  },
  {
    id: "peca-top-coat",
    slug: "peca-top-coat",
    tab: "pecas",
    category: "Finalizador",
    name: "Top Coat Brilho",
    description: "Selagem com brilho intenso e sem resíduo final.",
    price: 22.9,
    image: "/produtos/produtos_separados/top_coat.jpg",
    // SWAP: /products/top-coat-brilho.png + cutout: true
    tint: "#D7C6FF",
    tintSoft: "#3A2C5C",
  },

  {
    id: "peca-alicate",
    slug: "peca-alicate",
    tab: "ferramentas",
    category: "Alicate",
    name: "Alicate de Cutícula",
    description: "Corte preciso, inox, para a finalização da cutícula.",
    price: 39.9,
    image: "/produtos/produtos_separados/alicate.jpg",
    // SWAP: /products/alicate-cuticula.png + cutout: true
    tint: "#F5B39A",
    tintSoft: "#5C3A2E",
  },
  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-espatula",
    slug: "placeholder-espatula",
    tab: "ferramentas",
    category: "Espátula",
    name: "Espátula de Cutícula",
    description: "Empurra a cutícula sem arranhar a lâmina. Cabo leve para o dia a dia.",
    price: 18.9,
    image: "/products/espatula-cuticula.png",
    tint: "#B9D4FF",
    tintSoft: "#243656",
    placeholder: true,
  },
  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-pincel",
    slug: "placeholder-pincel",
    tab: "ferramentas",
    category: "Pincel",
    name: "Pincel Kolinsky 8",
    description: "Cerdas firmes para gel e builder, com ponta que volta ao lugar.",
    price: 34.9,
    image: "/products/pincel-kolinsky.png",
    tint: "#F3B6C7",
    tintSoft: "#5C3342",
    placeholder: true,
  },
  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-palito",
    slug: "placeholder-palito",
    tab: "ferramentas",
    category: "Palito",
    name: "Palito de Laranjeira",
    description: "Pacote com 100 palitos para empurrar cutícula e limpar o contorno.",
    price: 12.9,
    image: "/products/palito-laranjeira.png",
    tint: "#F6D08A",
    tintSoft: "#5A431C",
    placeholder: true,
  },

  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-nude",
    slug: "placeholder-nude",
    tab: "esmaltes",
    category: "Esmalte",
    name: "Esmalte Nude Rosé",
    description: "Cor de cobertura média, secagem confortável e brilho sem amarelar.",
    price: 16.9,
    image: "/products/esmalte-nude-rose.png",
    tint: "#F3B6C7",
    tintSoft: "#5C3342",
    placeholder: true,
  },
  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-base",
    slug: "placeholder-base",
    tab: "esmaltes",
    category: "Gel",
    name: "Gel Base Coat",
    description: "Base autonivelante para aderir o gel sem levantar a borda.",
    price: 32.9,
    image: "/products/gel-base-coat.png",
    tint: "#D7C6FF",
    tintSoft: "#3A2C5C",
    placeholder: true,
  },
  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-builder",
    slug: "placeholder-builder",
    tab: "esmaltes",
    category: "Gel",
    name: "Gel Builder Pink",
    description: "Viscosidade média para alongar e dar estrutura em uma camada.",
    price: 42.9,
    image: "/products/gel-builder-pink.png",
    tint: "#F5B39A",
    tintSoft: "#5C3A2E",
    placeholder: true,
  },
  {
    // PLACEHOLDER — produto inventado. Preço e foto não são da loja.
    id: "placeholder-vinho",
    slug: "placeholder-vinho",
    tab: "esmaltes",
    category: "Esmalte",
    name: "Esmalte Vinho",
    description: "Cremoso de cobertura alta, tom fechado para o acabamento clássico.",
    price: 16.9,
    image: "/products/esmalte-vinho.png",
    tint: "#E7A8C4",
    tintSoft: "#4E2438",
    placeholder: true,
  },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return brl.format(rounded);
}

export function productsForTab(
  tab: ShowcaseTabId,
  source: readonly ShowcaseProduct[] = SHOWCASE_PRODUCTS,
): ShowcaseProduct[] {
  return source.filter((product) => product.tab === tab);
}

export function countByTab(
  source: readonly ShowcaseProduct[] = SHOWCASE_PRODUCTS,
): Record<ShowcaseTabId, number> {
  return SHOWCASE_TABS.reduce(
    (counts, tab) => {
      counts[tab.id] = source.filter((product) => product.tab === tab.id).length;
      return counts;
    },
    { kits: 0, pecas: 0, ferramentas: 0, esmaltes: 0 },
  );
}

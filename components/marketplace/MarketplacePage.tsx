import { getByKind, getFeatured, type ProductKind } from "@/lib/products";
import HeroCarousel from "./HeroCarousel";
import CatalogGrid from "./CatalogGrid";

export default async function MarketplacePage({ kind }: { kind: ProductKind }) {
  const [featured, all] = await Promise.all([
    getFeatured(kind),
    getByKind(kind),
  ]);
  const title = kind === "kit" ? "Kits em destaque" : "Peças em destaque";
  const catalogTitle = kind === "kit" ? "Todos os kits" : "Todas as peças";

  return (
    <div className="bg-bege">
      <HeroCarousel products={featured} title={title} catalogHref="#catalogo" />
      <div id="catalogo" className="scroll-mt-24">
        <CatalogGrid products={all} title={catalogTitle} />
      </div>
    </div>
  );
}

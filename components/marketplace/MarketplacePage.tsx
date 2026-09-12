import { getFeatured, type ProductKind } from "@/lib/catalogData";
import HeroCarousel from "./HeroCarousel";

export default function MarketplacePage({ kind }: { kind: ProductKind }) {
  const featured = getFeatured(kind);
  const title = kind === "kit" ? "Kits em destaque" : "Peças em destaque";

  return (
    <div className="bg-bege">
      <HeroCarousel products={featured} title={title} catalogHref="#catalogo" />
      <div id="catalogo" className="scroll-mt-24" />
    </div>
  );
}

import { getByKind, getFeatured, type ProductKind, type Product } from "@/lib/products";
import FeaturedProductGrid from "./FeaturedProductGrid";
import CatalogGrid from "./CatalogGrid";

// Client component wrapper for the marketplace
function MarketplaceClient({ 
  featuredProducts, 
  allProducts, 
  title, 
  catalogTitle 
}: { 
  featuredProducts: Product[], 
  allProducts: Product[], 
  title: string, 
  catalogTitle: string 
}) {
  return (
    <div className="bg-bege">
      <FeaturedProductGrid 
        products={featuredProducts} 
        title={title} 
        layout="grid" 
        showHero={true}
      />
      <div id="catalogo" className="scroll-mt-24">
        <CatalogGrid products={allProducts} title={catalogTitle} />
      </div>
    </div>
  );
}

export default async function MarketplacePage({ kind }: { kind: ProductKind }) {
  const [featured, all] = await Promise.all([
    getFeatured(kind),
    getByKind(kind),
  ]);
  const title = kind === "kit" ? "Kits em destaque" : "Peças em destaque";
  const catalogTitle = kind === "kit" ? "Todos os kits" : "Todas as peças";

  return (
    <MarketplaceClient 
      featuredProducts={featured} 
      allProducts={all} 
      title={title} 
      catalogTitle={catalogTitle}
    />
  );
}
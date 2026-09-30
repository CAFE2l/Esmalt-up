import type { Metadata } from "next";
import ProductShowcase from "@/components/showcase/ProductShowcase";

export const metadata: Metadata = {
  title: "Showcase de Produtos - Esmalt'up",
  description: "Explore nossos produtos em destaque com categorias interativas.",
};

export default function ShowcaseExamplePage() {
  return (
    <main className="min-h-screen bg-[#1c1519]">
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Showcase de Produtos
        </h1>
        <ProductShowcase initialTab="pecas" />
      </div>
    </main>
  );
}

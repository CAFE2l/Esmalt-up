import type { Metadata } from "next";
import MarketplacePage from "@/components/marketplace/MarketplacePage";

export const metadata: Metadata = {
  title: "Peças Avulsas",
  description:
    "Produtos separados para você montar ou completar o seu kit do seu jeito.",
};

export default function PecasAvulsasPage() {
  return <MarketplacePage kind="peca" />;
}
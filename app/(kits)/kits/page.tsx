import type { Metadata } from "next";
import MarketplacePage from "@/components/marketplace/MarketplacePage";

export const metadata: Metadata = {
  title: "Kits de Manicure",
  description:
    "Kits completos com tudo o que você precisa para um cuidado impecável das unhas.",
};

export default function KitsPage() {
  return <MarketplacePage kind="kit" />;
}
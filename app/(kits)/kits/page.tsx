import type { Metadata } from "next";
import SectionPlaceholder from "@/components/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Kits de Manicure",
};

export default function KitsPage() {
  return (
    <SectionPlaceholder
      title="Kits de Manicure"
      description="Kits completos com tudo o que você precisa para um cuidado impecável das unhas. O catálogo está chegando."
    />
  );
}
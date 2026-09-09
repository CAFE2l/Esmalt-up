import type { Metadata } from "next";
import SectionPlaceholder from "@/components/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Peças Avulsas",
};

export default function PecasAvulsasPage() {
  return (
    <SectionPlaceholder
      title="Peças Avulsas"
      description="Produtos separados para você montar ou completar o seu kit do seu jeito. O catálogo está chegando."
    />
  );
}
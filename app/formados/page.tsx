import type { Metadata } from "next";
import WallClient from "@/components/wall/WallClient";

export const metadata: Metadata = {
  title: "Mural de Formados | Esmalt'up",
  description: "Celebre quem concluiu o curso Nail Designer Iniciante da Esmalt'up.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function MuralDeFormadosPage() {
  return <WallClient />;
}

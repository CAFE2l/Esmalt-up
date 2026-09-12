import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
  description:
    "Veja e edite os detalhes do seu perfil Esmalt'up: preferências, redes sociais, pedidos e progresso no curso.",
};

export default function PerfilLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
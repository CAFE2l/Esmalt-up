import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações",
  description:
    "Ajuste aparência, organize seus dados pessoais e gerencie sua conta Esmalt'up.",
};

export default function ConfiguracoesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
import type { Metadata } from "next";
import SectionPlaceholder from "@/components/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <SectionPlaceholder
      title="Login"
      description="Acesse sua conta para acompanhar pedidos e o curso. Em breve."
    />
  );
}
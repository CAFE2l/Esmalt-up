import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Crie sua conta Esmalt'up para acompanhar pedidos e o curso de manicure.",
};

export default function SignupPage() {
  return (
    <section className="relative overflow-hidden bg-bege">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-28 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:py-24">
        <AuthForm mode="signup" />
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { primaryButton, outlineButton } from "./buttonStyles";

function AccessGateModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-gold/30 bg-branco p-8 text-center shadow-card-lg"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-rosa-medio/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-rose-gold/20 blur-3xl"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-rosa-claro/60 hover:text-rose-gold"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-4 py-1.5 text-sm font-medium text-rose-gold shadow-card">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
            </svg>
            Acesso ao curso
          </span>
          <h2
            id="gate-title"
            className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
              Entre para começar
            </span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/75">
            Você precisa criar uma conta ou fazer login para acessar o curso.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/login" className={`${primaryButton} px-8 py-3 text-base`}>
              Entrar
            </Link>
            <Link href="/signup" className={`${outlineButton} px-8 py-3 text-base`}>
              Criar conta
            </Link>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 text-sm font-medium text-foreground/60 transition-colors hover:text-rose-gold"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    </div>
  );
}

/** Barreira de autenticação para páginas protegidas (ex.: Curso). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") router.replace("/");
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-bege text-foreground/70">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rosa-blush/30 border-t-rosa-blush" />
        <p className="text-sm">Carregando sessão…</p>
      </div>
    );
  }

  if (!user) {
    return <AccessGateModal onClose={() => router.replace("/")} />;
  }

  return <>{children}</>;
}
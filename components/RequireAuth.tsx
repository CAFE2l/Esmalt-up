"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/** Barreira de autenticação para páginas protegidas (ex.: Curso). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-bege text-foreground/70">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rosa-blush/30 border-t-rosa-blush" />
        <p className="text-sm">Carregando sessão…</p>
      </div>
    );
  }

  return <>{children}</>;
}
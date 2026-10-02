"use client";

import Link from "next/link";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useNotifications, NotificationRow } from "@/components/notifications/NotificationsList";
import { useAuth } from "@/lib/AuthContext";
import { primaryButton } from "@/components/buttonStyles";

export default function NotificacoesPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, unreadCount, loading, error, refresh, markAllRead, markRead } =
    useNotifications(60000);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="animate-pulse text-foreground/50">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <Bell className="h-10 w-10 text-rosa-blush/50" />
        <p className="text-foreground/60">Faça login para ver suas notificações.</p>
        <Link href="/login" className={`${primaryButton} px-6 py-2.5 text-sm`}>
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-rose-gold/15 blur-3xl" />

      {/* Breadcrumb */}
      <nav aria-label="Navegação" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
        <Link href="/perfil" className="hover:text-rose-gold transition-colors">Minha Área</Link>
        <span className="text-foreground/30">/</span>
        <span className="text-rose-gold font-bold">Notificações</span>
      </nav>

      {/* Title row */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rosa-blush/15 text-rosa-blush">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Notificações
            </h1>
            <p className="text-xs text-foreground/50">
              {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Tudo em dia"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            title="Atualizar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-rosa-claro/50 hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-gold/40 bg-rosa-claro/40 px-3.5 py-1.5 text-xs font-semibold text-rose-gold transition-colors hover:bg-rosa-claro/70"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="relative rounded-3xl border border-cinza-suave/70 bg-branco shadow-card overflow-hidden">
        {loading ? (
          <ul aria-hidden className="divide-y divide-cinza-suave/20 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-3">
                <span className="h-9 w-9 animate-pulse rounded-full bg-rosa-claro" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-1/2 animate-pulse rounded bg-rosa-claro" />
                  <span className="block h-2.5 w-4/5 animate-pulse rounded bg-rosa-claro" />
                </span>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div
            role="alert"
            className="flex items-center justify-between rounded-2xl border border-red-400/30 bg-red-500/10 m-4 p-4 text-sm text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={refresh}
              className="text-xs font-semibold text-red-200 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
            <Bell className="h-10 w-10 text-rosa-blush/40" aria-hidden />
            <p className="text-sm font-medium text-foreground/60">
              Nenhuma notificação por aqui.
            </p>
            <p className="text-xs text-foreground/40">
              Você será notificada sobre pedidos, conquistas e novidades do curso.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-cinza-suave/20 p-2">
            {items.map((n) => (
              <li key={n.id} onClick={() => !n.readAt && markRead(n.id)}>
                <NotificationRow item={n} onOpen={() => !n.readAt && markRead(n.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

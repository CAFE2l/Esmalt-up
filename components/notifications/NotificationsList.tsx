"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award, BookOpen, CheckCheck, GraduationCap, Package, Truck, XCircle, PartyPopper, CircleAlert,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, typeof Award> = {
  welcome: PartyPopper,
  lesson_completed: BookOpen,
  module_completed: BookOpen,
  course_finished: GraduationCap,
  badge_awarded: Award,
  order_created: Package,
  order_paid: Package,
  order_failed: CircleAlert,
  order_shipped: Truck,
  order_cancelled: XCircle,
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function useNotifications(pollMs = 30000) {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setError(null);
    } catch {
      setError("Não foi possível carregar as notificações.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs, user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      /* keep state */
    }
  }, [user]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user) return;
      setItems((prev) =>
        prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        const token = await user.getIdToken();
        await fetch(`/api/notifications/${id}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* optimistic update kept */
      }
    },
    [user],
  );

  return { items, unreadCount, loading, error, refresh, markAllRead, markRead };
}

export function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen?: () => void;
}) {
  const Icon = TYPE_ICON[item.type] ?? Award;
  const unread = !item.readAt;
  const inner = (
    <div
      className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors ${
        unread ? "bg-rosa-claro/40" : "hover:bg-rosa-claro/20"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          unread ? "bg-rose-gold/20 text-rose-gold" : "bg-cinza-suave/30 text-foreground/50"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${unread ? "font-semibold text-foreground" : "text-foreground/80"}`}>
          {item.title}
        </p>
        <p className="line-clamp-2 text-xs text-foreground/60">{item.body}</p>
        <p className="mt-0.5 text-[11px] text-foreground/40">{timeAgo(item.createdAt)}</p>
      </div>
      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-gold" aria-label="Não lida" />}
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} onClick={onOpen} className="block">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

export function NotificationsList({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { items, unreadCount, loading, error, refresh, markAllRead, markRead } =
    useNotifications();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
          {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Tudo em dia"}
        </p>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-gold hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <ul aria-hidden className="space-y-2">
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
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
        <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={refresh} className="text-xs font-semibold text-red-200 hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <PartyPopper className="h-8 w-8 text-rosa-blush" aria-hidden />
          <p className="text-sm font-medium text-foreground/70">Nenhuma notificação por aqui.</p>
        </div>
      ) : (
        <ul className="divide-y divide-cinza-suave/30">
          {items.map((n) => (
            <li key={n.id}>
              <div onClick={() => !n.readAt && markRead(n.id)}>
                <NotificationRow
                  item={n}
                  onOpen={() => !n.readAt && markRead(n.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

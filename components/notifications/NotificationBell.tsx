"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications, NotificationRow } from "./NotificationsList";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { items, unreadCount, loading, error, refresh, markAllRead, markRead } =
    useNotifications(60000);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  // Refresh when opening
  function toggle() {
    if (!open) refresh();
    setOpen((v) => !v);
  }

  if (!user) return null;

  const badgeCount = Math.min(unreadCount, 99);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Notificações${unreadCount > 0 ? ` — ${unreadCount} não lida(s)` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-rosa-claro"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rosa-blush text-[10px] font-bold leading-none text-white"
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-cinza-suave/70 bg-branco shadow-card-lg"
          style={{ maxHeight: "min(520px, 80vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cinza-suave/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-gold" />
              <span className="text-sm font-semibold text-foreground">Notificações</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rosa-blush/20 px-2 py-0.5 text-[11px] font-semibold text-rosa-blush">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  title="Marcar todas como lidas"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-rose-gold transition-colors hover:bg-rosa-claro/50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar lidas
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar notificações"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-rosa-claro/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(min(520px, 80vh) - 100px)" }}>
            {loading ? (
              <ul aria-hidden className="space-y-1 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                    <span className="h-9 w-9 animate-pulse rounded-full bg-rosa-claro" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-rosa-claro" />
                      <span className="block h-2.5 w-4/5 animate-pulse rounded bg-rosa-claro" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : error ? (
              <div className="p-4 text-center text-sm text-foreground/60">{error}</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Bell className="h-8 w-8 text-rosa-blush/50" aria-hidden />
                <p className="text-sm font-medium text-foreground/60">Nenhuma notificação.</p>
              </div>
            ) : (
              <ul className="divide-y divide-cinza-suave/20 p-2">
                {items.map((n) => (
                  <li key={n.id} onClick={() => { if (!n.readAt) markRead(n.id); setOpen(false); }}>
                    <NotificationRow item={n} onOpen={() => { if (!n.readAt) markRead(n.id); setOpen(false); }} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-cinza-suave/40 px-4 py-2.5">
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-rose-gold transition-colors hover:text-rosa-blush"
            >
              Ver todas as notificações →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

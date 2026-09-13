"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Settings,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import ConfirmDialog from "./ConfirmDialog";

const ICON_SIZE = 18;
const ANIM_MS = 180;

type ConfirmKind = "logout" | "delete";
type Flash = { kind: "ok" | "error"; text: string } | null;

function initialsOf(name: string | null | undefined): string {
  if (!name) return "E";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-sm font-bold text-white shadow-pressed">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

const itemStyle = {
  link: "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors",
  normal: "text-foreground/80 hover:bg-rosa-claro/60 hover:text-rose-gold",
  alert: "text-rose-gold/90 hover:bg-rosa-claro/60 hover:text-white",
  danger:
    "text-red-400 hover:bg-red-500/10 hover:ring-1 hover:ring-red-500/30 hover:text-red-300",
};

export default function UserMenu() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [confirming, setConfirming] = useState<ConfirmKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (open) closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  const closeMenu = useCallback(
    (instant = false) => {
      setVisible(false);
      if (instant) {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      clearHideTimer();
      hideTimer.current = window.setTimeout(() => {
        setOpen(false);
        triggerRef.current?.focus();
      }, ANIM_MS);
    },
    [clearHideTimer],
  );

  const openMenu = useCallback(() => {
    clearHideTimer();
    setOpen(true);
    setVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, [clearHideTimer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirming(null);
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        closeMenu();
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open || isMobile || confirming) return;
    const menu = menuRef.current;
    if (!menu) return;
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>("[data-menu-item]"),
    );
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const currentIndex = items.findIndex(
        (element) => element === document.activeElement,
      );
      const step = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + step + items.length) % items.length;
      items[nextIndex]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isMobile, confirming]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 3500);
    return () => window.clearTimeout(id);
  }, [flash]);

  if (!user) return null;

  const displayName = user.displayName?.trim() || "Usuária Esmalt'up";
  const avatarUrl = user.photoURL ?? null;

  const handleConfirm = async () => {
    if (!user) return;
    setBusy(true);
    if (confirming === "logout") {
      await logout();
      setConfirming(null);
      setBusy(false);
      closeMenu(true);
      return;
    }
    setConfirming(null);
    setBusy(false);
    closeMenu(true);
    setFlash({
      kind: "ok",
      text: "Solicitação de exclusão recebida. Seus dados serão removidos em breve.",
    });
  };

  const items = (
    <>
      <Link
        href="/perfil"
        role="menuitem"
        data-menu-item
        onClick={() => closeMenu()}
        className={`${itemStyle.link} ${itemStyle.normal}`}
      >
        <UserRound size={ICON_SIZE} />
        Meu Perfil
      </Link>
      <Link
        href="/configuracoes"
        role="menuitem"
        data-menu-item
        onClick={() => closeMenu()}
        className={`${itemStyle.link} ${itemStyle.normal}`}
      >
        <Settings size={ICON_SIZE} />
        Configurações
      </Link>

      <div
        role="separator"
        aria-hidden="true"
        className="my-2 h-px bg-cinza-suave/70"
      />

      <button
        type="button"
        role="menuitem"
        data-menu-item
        onClick={() => setConfirming("delete")}
        className={`${itemStyle.link} ${itemStyle.danger}`}
      >
        <Trash2 size={ICON_SIZE} />
        Excluir Conta
      </button>
      <button
        type="button"
        role="menuitem"
        data-menu-item
        onClick={() => setConfirming("logout")}
        className={`${itemStyle.link} ${itemStyle.alert}`}
      >
        <LogOut size={ICON_SIZE} />
        Sair
      </button>
    </>
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        className="flex items-center gap-2 rounded-full border border-cinza-suave/70 bg-branco/70 p-1.5 pl-1.5 pr-2.5 shadow-card transition-colors hover:border-rose-gold/60"
      >
        <Avatar name={displayName} src={avatarUrl} />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[120px] truncate text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <span className="block text-[11px] font-medium leading-tight text-rose-gold">
            Minha conta
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-foreground/60 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          {!isMobile ? (
            <div
              id="user-menu"
              ref={menuRef}
              role="menu"
              aria-label="Menu do usuário"
              className={`absolute right-0 top-full z-50 mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-cinza-suave/70 bg-branco/85 shadow-card-lg backdrop-blur-xl transition-all duration-[180ms] ease-out ${
                visible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-95 opacity-0"
              }`}
            >
              <div className="flex items-center gap-3 border-b border-cinza-suave/60 bg-rosa-claro/30 p-4">
                <Avatar name={displayName} src={avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-foreground/60">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="p-2">{items}</div>
            </div>
          ) : (
            <div
              id="user-menu"
              className="fixed inset-0 z-50 sm:hidden"
              role="presentation"
            >
              <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
                  visible ? "opacity-100" : "opacity-0"
                }`}
                onClick={() => closeMenu()}
                aria-hidden
              />
              <div
                ref={menuRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu do usuário"
                className={`absolute inset-x-0 bottom-0 origin-bottom rounded-t-3xl border-t border-cinza-suave/70 bg-branco/95 pb-8 pt-2 shadow-card-lg backdrop-blur-xl transition-all duration-200 ease-out ${
                  visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
              >
                <span
                  aria-hidden
                  className="mx-auto block h-1 w-10 rounded-full bg-cinza-suave"
                />
                <div className="mt-3 flex items-center gap-3 border-b border-cinza-suave/60 px-5 pb-4">
                  <Avatar name={displayName} src={avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-foreground/60">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => closeMenu()}
                    aria-label="Fechar menu"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rosa-claro/60 text-foreground/70 transition-colors hover:text-rose-gold"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-2">{items}</div>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirming === "delete"}
        title="Excluir conta"
        description={
          <>
            Essa ação é <strong className="text-foreground">permanente</strong> e
            não pode ser desfeita. Seu perfil, pedidos e progresso no curso
            serão apagados do Esmalt&apos;up.
            <span className="mt-2 block text-sm text-foreground/70">
              Considere exportar seus dados antes de continuar.
            </span>
          </>
        }
        verifyText="EXCLUIR"
        confirmLabel="Excluir conta"
        busy={busy}
        onCancel={() => setConfirming(null)}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={confirming === "logout"}
        title="Sair da conta"
        description="Você voltará para a experiência pública e precisará entrar novamente para acessar sua área."
        confirmLabel="Sim, sair"
        tone="warning"
        icon={LogOut}
        busy={busy}
        onCancel={() => setConfirming(null)}
        onConfirm={handleConfirm}
      />

      {flash && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border px-5 py-3 text-center text-sm font-medium shadow-card-lg backdrop-blur-xl sm:w-auto ${
            flash.kind === "ok"
              ? "border-rose-gold/40 bg-branco/90 text-rose-gold"
              : "border-red-500/40 bg-branco/90 text-red-300"
          }`}
        >
          {flash.text}
        </div>
      )}
    </div>
  );
}
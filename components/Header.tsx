"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "@/lib/AuthContext";
import { outlineButton, primaryButton } from "./buttonStyles";

const baseLinks = [
  { href: "/kits", label: "Kits" },
  { href: "/pecas-avulsas", label: "Peças Avulsas" },
  { href: "/curso", label: "Curso" },
];

const navLinks = (isLoggedIn: boolean) => [
  ...baseLinks,
  ...(isLoggedIn ? [{ href: "/perfil", label: "Perfil" }] : []),
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  const links = navLinks(Boolean(user));

  return (
    <header className="sticky top-0 z-40 border-b border-cinza-suave/40 bg-branco/95 shadow-header backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Principal">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-2 text-sm transition-colors ${
                  active
                    ? "font-semibold text-rose-gold"
                    : "font-medium text-foreground/80 hover:text-rose-gold"
                }`}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold"
                  />
                )}
              </Link>
            );
          })}

          <div className="ml-3 flex items-center gap-2 lg:ml-4">
            {loading ? (
              <span
                aria-hidden
                className="h-9 w-[5.5rem] animate-pulse rounded-full bg-rosa-claro"
              />
            ) : user ? (
              <button
                type="button"
                onClick={handleLogout}
                className={`${outlineButton} px-5 py-2 text-sm hover:bg-rosa-blush hover:text-white`}
              >
                Sair
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${outlineButton} px-5 py-2 text-sm hover:bg-rosa-blush hover:text-white`}
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className={`${primaryButton} px-5 py-2 text-sm`}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-rosa-claro md:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Principal"
          className="border-t border-cinza-suave bg-branco px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 text-sm transition-colors ${
                    active
                      ? "bg-rosa-claro/70 font-semibold text-rose-gold"
                      : "font-medium text-foreground/80 hover:bg-rosa-claro/50 hover:text-rose-gold"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 flex flex-col gap-2 border-t border-cinza-suave/50 pt-3">
              {loading ? (
                <span
                  aria-hidden
                  className="h-11 w-full animate-pulse rounded-full bg-rosa-claro"
                />
              ) : user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${outlineButton} w-full px-5 py-2.5 text-sm hover:bg-rosa-blush hover:text-white`}
                >
                  Sair
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className={`${outlineButton} w-full px-5 py-2.5 text-sm hover:bg-rosa-blush hover:text-white`}
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className={`${primaryButton} w-full px-5 py-2.5 text-sm`}
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

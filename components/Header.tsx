"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { m, m as motion, useScroll, useMotionValue, useSpring } from "framer-motion";
import { Bell } from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import CartButton from "./cart/CartButton";
import { useAuth } from "@/lib/AuthContext";
import { outlineButton, primaryButton } from "./buttonStyles";
import { LEDUnderline } from "./ui/LED";

const navLinks = [
  { href: "/kits", label: "Kits" },
  { href: "/pecas-avulsas", label: "Peças Avulsas" },
  { href: "/curso", label: "Curso" },
  { href: "/formados", label: "Formados" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position
  const { scrollY } = useScroll();
  const scrollYSpring = useSpring(scrollY, { stiffness: 300, damping: 30 });

  // Update scrolled state
  useEffect(() => {
    const unsubscribe = scrollYSpring.on("change", (value) => {
      setScrolled(value > 10);
    });
    return () => unsubscribe();
  }, [scrollYSpring]);

  // Progress bar for scroll
  const scrollProgress = useMotionValue(0);
  
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.set(Math.min(latest / totalHeight, 1));
    });
    return () => unsubscribe();
  }, [scrollY, scrollProgress]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  const closeMenu = () => setOpen(false);

  return (
    <motion.header
      className={`sticky top-0 z-40 bg-branco ${scrolled ? 'shadow-lg' : 'shadow-header'}`}
      style={{
        backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      }}
      animate={{
        backgroundColor: scrolled ? 'rgba(35, 26, 31, 0.95)' : 'rgb(var(--branco))',
        borderBottom: scrolled ? '1px solid rgba(211, 150, 160, 0.2)' : '1px solid rgba(60, 48, 54, 0.4)',
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
    >
      {/* Scroll progress bar */}
      <m.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rosa-blush to-rose-gold"
        style={{
          scaleX: scrollProgress,
          transformOrigin: 'left',
        }}
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo size="sm" />

        <nav className="hidden h-10 items-center gap-1 md:flex lg:gap-2" aria-label="Principal">
          {navLinks.map((link) => {
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
                  <m.div
                    className="absolute inset-x-3 -bottom-0.5 h-0.5"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LEDUnderline active={true} color="pink" animated={false} />
                  </m.div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              aria-label="Notificações"
              title="Notificações"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-rosa-claro"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rosa-blush" />
            </button>
          )}
          <CartButton />
          <div className="flex items-center gap-2 lg:ml-4">
            {loading ? (
              <span
                aria-hidden
                className="h-10 w-10 animate-pulse rounded-full bg-rosa-claro"
              />
            ) : user ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${outlineButton} hidden px-5 py-2 text-sm hover:bg-rosa-blush hover:text-white sm:inline-flex`}
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className={`${primaryButton} hidden px-5 py-2 text-sm sm:inline-flex`}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

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
      </div>

      {open && (
        <motion.nav
          id="mobile-nav"
          aria-label="Principal"
          className="border-t border-cinza-suave bg-branco px-4 py-3 md:hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
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
              ) : user ? null : (
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
        </motion.nav>
      )}
    </motion.header>
  );
}

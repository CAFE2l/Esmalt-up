"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

const navLinks = [
  { href: "/kits", label: "Kits" },
  { href: "/pecas-avulsas", label: "Peças Avulsas" },
  { href: "/curso", label: "Curso" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-branco shadow-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo size="sm" />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-rose-gold active:text-rosa-blush"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full border-2 border-rose-gold bg-branco px-5 py-2 text-sm font-semibold text-rose-gold shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-rosa-blush hover:text-white hover:shadow-card-lg active:translate-y-0 active:shadow-pressed"
          >
            Login
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
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
        <nav className="border-t border-cinza-suave bg-branco px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {[...navLinks, { href: "/login", label: "Login" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-rosa-claro/50 hover:text-rose-gold"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
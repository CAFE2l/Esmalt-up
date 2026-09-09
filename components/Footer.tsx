import Link from "next/link";
import Logo from "./Logo";

const footerLinks = [
  { href: "/kits", label: "Kits" },
  { href: "/pecas-avulsas", label: "Peças Avulsas" },
  { href: "/curso", label: "Curso" },
  { href: "/login", label: "Login" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-blush-200/70 bg-blush-50/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 text-center sm:px-6">
        <Logo size="sm" />
        <p className="text-sm text-foreground/70">
          Esmaltes e Cuidados para Unhas
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-foreground/70">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-foreground/50">
          © {year} Esmalt&apos;up. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
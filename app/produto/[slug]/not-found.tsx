import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-[#1c1519] px-4 py-16 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-rose-gold">
          Produto indisponível
        </p>
        <h1 className="mt-3 text-3xl font-bold">Produto não encontrado</h1>
        <p className="mt-3 max-w-md text-foreground/65">
          Este produto não existe ou não está mais disponível. Confira as peças
          avulsas para encontrar outros produtos.
        </p>
        <Link
          href="/pecas-avulsas"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-6 py-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
        >
          Ver peças avulsas
        </Link>
      </div>
    </main>
  );
}

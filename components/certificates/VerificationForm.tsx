"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, X } from "lucide-react";
import { normalizePublicCode } from "@/lib/certificateCode";

export default function VerificationForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const normalizedCode = normalizePublicCode(code);

        if (!normalizedCode) {
          setError("Por favor, digite o código do certificado.");
          setIsLoading(false);
          return;
        }

        // Navigate to the verification page with the code
        router.push(`/verificar/${normalizedCode}`);
      } catch {
        setError("Erro ao verificar o certificado. Tente novamente.");
        setIsLoading(false);
      }
    },
    [code, router]
  );

  const handleClear = useCallback(() => {
    setCode("");
    setError(null);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Verificar Certificado
        </h1>
        <p className="text-sm text-foreground/70">
          Digite o código único do certificado (formato: ESM-YYYY-XXXXXXXX)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="code" className="sr-only">
            Código do certificado
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ESM-2026-XXXXXXXX"
              aria-label="Código do certificado"
              className="w-full pl-12 pr-12 rounded-xl border border-cinza-suave/40 bg-branco/95 p-4 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-gold focus:border-transparent"
              maxLength={17} // ESM-YYYY-XXXXXXXX = 4 + 1 + 4 + 1 + 8 = 18, but we allow some extra
              autoComplete="off"
              autoCapitalize="characters"
              disabled={isLoading}
            />
            {code && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-rose-gold transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-error" role="alert">
            <X className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-card hover:shadow-card-lg"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Check className="h-5 w-5" />
              Verificar Certificado
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20 text-center">
        <p className="text-xs text-foreground/60 leading-relaxed">
          <strong className="text-foreground">Este é um certificado simbólico</strong> da plataforma Esmalt&apos;up, sem validade como diploma ou curso regulamentado.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Calendar, Code, ExternalLink, Search } from "lucide-react";
import { formatDatePtBR } from "@/lib/formatDate";
import { normalizePublicCode } from "@/lib/certificateCode";

interface Props {
  initialCode?: string;
}

type VerificationStatus = "idle" | "loading" | "valid" | "revoked" | "not_found" | "error";

interface CertificateData {
  valid: boolean;
  recipientName?: string;
  issuedAt?: string;
  code?: string;
  status?: string;
  error?: string;
}

export default function VerifyCertificateClient({ initialCode }: Props) {
  const router = useRouter();
  const [input, setInput] = useState(initialCode ?? "");
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [activeCode, setActiveCode] = useState<string>("");

  const verify = useCallback(async (rawCode: string) => {
    const code = normalizePublicCode(rawCode);
    if (!code) return;

    setActiveCode(code);
    setStatus("loading");
    setCertificate(null);

    try {
      const response = await fetch(`/api/certificates/verify/${encodeURIComponent(code)}`);
      let data: CertificateData | null = null;
      try {
        data = await response.json();
      } catch {
        setStatus("error");
        return;
      }

      if (response.ok && data?.valid) {
        setStatus("valid");
        setCertificate(data);
      } else if (response.ok && data?.status === "revoked") {
        setStatus("revoked");
        setCertificate(data);
      } else if (response.status === 404) {
        setStatus("not_found");
        setCertificate(data);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  // Auto-verify when landing on /verificar/[code]
  useEffect(() => {
    if (initialCode) {
      const code = normalizePublicCode(initialCode);
      setInput(code);
      verify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizePublicCode(input);
    if (!code) return;
    // Update the URL so the result can be shared
    router.replace(`/verificar/${encodeURIComponent(code)}`);
    setInput(code);
    verify(code);
  };

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

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <label htmlFor="code" className="sr-only">
          Código do certificado
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
          <input
            type="text"
            id="code"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="ESM-2026-XXXXXXXX"
            className="w-full pl-12 pr-4 rounded-xl border border-cinza-suave/40 bg-branco/95 p-4 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-gold focus:border-transparent"
            autoComplete="off"
            autoCapitalize="characters"
            disabled={status === "loading"}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !input.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-card hover:shadow-card-lg"
        >
          {status === "loading" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Check className="h-5 w-5" />
              Verificar
            </>
          )}
        </button>
      </form>

      <div aria-live="polite">
        {status === "loading" && (
          <div className="bg-branco/95 border border-cinza-suave/40 rounded-2xl p-6 shadow-card text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-gold border-t-transparent mx-auto mb-4" />
            <p className="text-foreground/70">Verificando certificado...</p>
          </div>
        )}

        {status === "valid" && certificate && (
          <div className="bg-branco/95 border border-cinza-suave/40 rounded-2xl p-6 shadow-card text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 border-2 border-success">
                <Check className="h-8 w-8 text-success" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-success mb-2">Certificado válido</h2>
            <div className="space-y-4 text-left mt-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <Code className="h-5 w-5 text-rose-gold shrink-0" />
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Código</p>
                  <p className="font-semibold text-foreground">{certificate.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <span className="h-5 w-5 text-rose-gold shrink-0 text-lg">👤</span>
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Nome</p>
                  <p className="font-semibold text-foreground">{certificate.recipientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <Calendar className="h-5 w-5 text-rose-gold shrink-0" />
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Curso</p>
                  <p className="font-semibold text-foreground">Curso Nail Designer Iniciante</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <Calendar className="h-5 w-5 text-rose-gold shrink-0" />
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Data de emissão</p>
                  <p className="font-semibold text-foreground">
                    {certificate.issuedAt ? formatDatePtBR(new Date(certificate.issuedAt)) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "revoked" && (
          <div className="bg-branco/95 border border-cinza-suave/40 rounded-2xl p-6 shadow-card text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 border-2 border-error">
                <X className="h-8 w-8 text-error" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-error mb-2">Certificado revogado</h2>
            <p className="text-foreground/70">Este certificado foi revogado e não é mais válido.</p>
          </div>
        )}

        {status === "not_found" && (
          <div className="bg-branco/95 border border-cinza-suave/40 rounded-2xl p-6 shadow-card text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 border-2 border-warning">
                <X className="h-8 w-8 text-warning" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-warning mb-2">Certificado não encontrado</h2>
            <p className="text-foreground/70 mb-6">
              Certificado não encontrado. Verifique se o código foi digitado corretamente.
            </p>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setInput(""); router.replace("/verificar"); }}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              Tentar outro código
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-branco/95 border border-cinza-suave/40 rounded-2xl p-6 shadow-card text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 border-2 border-warning">
                <X className="h-8 w-8 text-warning" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-warning mb-2">Não foi possível verificar agora</h2>
            <p className="text-foreground/70 mb-6">
              Ocorreu um erro ao consultar o certificado. Tente novamente.
            </p>
            <button
              type="button"
              onClick={() => activeCode && verify(activeCode)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20 text-center">
        <p className="text-xs text-foreground/60 leading-relaxed">
          <strong className="text-foreground">Certificados Esmalt&apos;up são simbólicos</strong> e emitidos apenas por diversão.
        </p>
      </div>

      {activeCode && (
        <div className="mt-4 text-center">
          <Link href="/verificar" className="text-sm text-foreground/60 hover:text-rose-gold transition-colors">
            ← Verificar outro certificado
          </Link>
        </div>
      )}
    </div>
  );
}

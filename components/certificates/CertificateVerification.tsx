"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, X, Calendar, Code, ExternalLink } from "lucide-react";
import { formatDatePtBR } from "@/lib/certificates";

interface CertificateVerificationProps {
  code: string;
}

type VerificationStatus = "loading" | "valid" | "revoked" | "not_found" | "error";

interface CertificateData {
  valid: boolean;
  recipientName?: string;
  issuedAt?: string;
  code?: string;
  status?: string;
  error?: string;
}

export default function CertificateVerification({ code }: CertificateVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  const fetchVerification = useCallback(async (normalizedCode: string) => {
    try {
      const response = await fetch(`/api/certificates/verify/${encodeURIComponent(normalizedCode)}`);
      const data = await response.json();
      
      if (data.valid) {
        setStatus("valid");
        setCertificate(data);
      } else if (data.error?.includes("revogado")) {
        setStatus("revoked");
        setCertificate(data);
      } else {
        setStatus("not_found");
        setCertificate(data);
      }
    } catch {
      setStatus("error");
      setCertificate(null);
    }
  }, []);

  useEffect(() => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode) {
      fetchVerification(normalizedCode);
    } else {
      setStatus("not_found");
    }
  }, [code, fetchVerification]);

  const getStatusContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-gold border-t-transparent mx-auto mb-4" />
            <p className="text-foreground/70">Verificando certificado...</p>
          </div>
        );

      case "valid":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 border-2 border-success">
                <Check className="h-8 w-8 text-success" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-success mb-2">
              Certificado válido
            </h2>
            
            <p className="text-foreground/70 mb-6">
              Este certificado pertence a:
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <Code className="h-5 w-5 text-rose-gold shrink-0" />
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Código</p>
                  <p className="font-semibold text-foreground">{certificate?.code}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <span className="h-5 w-5 text-rose-gold shrink-0 text-lg">👤</span>
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Nome</p>
                  <p className="font-semibold text-foreground">{certificate?.recipientName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-branco/80 border border-cinza-suave/20">
                <Calendar className="h-5 w-5 text-rose-gold shrink-0" />
                <div>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide">Data de emissão</p>
                  <p className="font-semibold text-foreground">
                    {certificate?.issuedAt ? formatDatePtBR(new Date(certificate.issuedAt)) : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20 text-center text-xs text-foreground/60">
              <p className="mb-2">
                <strong className="text-foreground">Este é um certificado simbólico</strong> da plataforma Esmalt&apos;up,
              </p>
              <p>sem validade como diploma ou curso regulamentado.</p>
            </div>
          </div>
        );

      case "revoked":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 border-2 border-error">
                <X className="h-8 w-8 text-error" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-error mb-2">
              Certificado revogado
            </h2>
            
            <p className="text-foreground/70 mb-6">
              Este certificado foi revogado e não é mais válido.
            </p>

            {certificate?.recipientName && (
              <div className="text-left space-y-2 text-sm">
                <p>
                  <span className="text-foreground/50">Nome:</span> {certificate.recipientName}
                </p>
                <p>
                  <span className="text-foreground/50">Data de emissão:</span> {
                    certificate.issuedAt ? formatDatePtBR(new Date(certificate.issuedAt)) : "-"
                  }
                </p>
              </div>
            )}

            <div className="mt-6 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20 text-center text-xs text-foreground/60">
              <p>
                <strong className="text-foreground">Este era um certificado simbólico</strong> da plataforma Esmalt&apos;up.
              </p>
            </div>
          </div>
        );

      case "not_found":
      case "error":
      default:
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 border-2 border-warning">
                <X className="h-8 w-8 text-warning" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-warning mb-2">
              Certificado não encontrado
            </h2>
            
            <p className="text-foreground/70 mb-6">
              Não foi possível localizar um certificado com este código. Verifique se o código foi digitado corretamente.
            </p>

            <Link
              href="/verificar"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              Tentar outro código
            </Link>

            <div className="mt-6 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20 text-center text-xs text-foreground/60">
              <p>
                <strong className="text-foreground">Certificados Esmalt&apos;up são simbólicos</strong> e emitidos apenas por diversão.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Verificar Certificado
        </h1>
        <p className="text-sm text-foreground/50">
          Código: {code}
        </p>
      </div>

      <div className="bg-branco/95 border border-cinza-suave/40 rounded-2xl p-6 shadow-card backdrop-blur-sm">
        {getStatusContent()}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/verificar"
          className="text-sm text-foreground/60 hover:text-rose-gold transition-colors inline-flex items-center gap-1"
        >
          ← Voltar à verificação
        </Link>
      </div>
    </div>
  );
}

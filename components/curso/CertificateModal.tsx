"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Download, ExternalLink, Award, ShieldCheck } from "lucide-react";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  issuedAt: string;       // ISO string — certificate issue date
  completedAt?: string;   // ISO string — last lesson completed date
  publicCode?: string;    // ESM-YYYY-XXXXXXXX
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function CertificateModal({
  isOpen,
  onClose,
  userName,
  issuedAt,
  completedAt,
  publicCode,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const issuedStr = fmt(issuedAt);
  const completedStr = completedAt ? fmt(completedAt) : issuedStr;
  const verifyUrl = publicCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verificar/${publicCode}`
    : null;

  const handleDownload = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 850;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Name
    ctx.textAlign = "center";
    ctx.fillStyle = "#b83d52";
    ctx.font = `bold ${Math.round(w * 0.048)}px Georgia, serif`;
    ctx.fillText(userName || "Aluna Esmalt'up", w / 2, h * 0.56);

    // Completed date
    ctx.fillStyle = "#6b4a52";
    ctx.font = `${Math.round(w * 0.022)}px Georgia, serif`;
    ctx.fillText(`Concluído em: ${completedStr}`, w / 2, h * 0.66);

    // Issued date
    ctx.fillText(`Emitido em: ${issuedStr}`, w / 2, h * 0.71);

    // Certificate code
    if (publicCode) {
      ctx.font = `${Math.round(w * 0.018)}px monospace`;
      ctx.fillStyle = "#9a6a74";
      ctx.fillText(publicCode, w / 2, h * 0.78);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-esmaltup-${publicCode ?? "curso"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [userName, completedStr, issuedStr, publicCode]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Certificado de conclusão"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-cinza-suave/40 bg-branco shadow-card-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinza-suave/30 px-5 py-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-rose-gold" />
            <div>
              <h2 className="text-base font-bold text-foreground">Seu Certificado 🎓</h2>
              <p className="text-xs text-foreground/50 mt-0.5">
                Curso Nail Designer Iniciante — Esmalt&apos;up
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-rosa-claro/40 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Certificate preview */}
        <div className="relative mx-4 my-4 overflow-hidden rounded-2xl border border-cinza-suave/30 bg-[#0c080b]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src="/certificate-bg.png"
            alt="Certificado de conclusão"
            className="w-full"
            crossOrigin="anonymous"
          />
          {/* Overlaid text */}
          <div className="pointer-events-none absolute inset-0">
            {/* Name */}
            <div style={{ position: "absolute", top: "52%", left: 0, right: 0, textAlign: "center" }}>
              <p
                className="font-bold text-rose-gold drop-shadow"
                style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.6rem)", lineHeight: 1.2 }}
              >
                {userName || "Aluna Esmalt'up"}
              </p>
            </div>
            {/* Completed date */}
            <div style={{ position: "absolute", top: "63%", left: 0, right: 0, textAlign: "center" }}>
              <p className="text-foreground/70" style={{ fontSize: "clamp(0.55rem, 1.8vw, 0.85rem)" }}>
                Concluído em: {completedStr}
              </p>
            </div>
            {/* Issued date */}
            <div style={{ position: "absolute", top: "68%", left: 0, right: 0, textAlign: "center" }}>
              <p className="text-foreground/60" style={{ fontSize: "clamp(0.5rem, 1.6vw, 0.8rem)" }}>
                Emitido em: {issuedStr}
              </p>
            </div>
            {/* Certificate code */}
            {publicCode && (
              <div style={{ position: "absolute", top: "76%", left: 0, right: 0, textAlign: "center" }}>
                <p className="font-mono text-foreground/50" style={{ fontSize: "clamp(0.45rem, 1.4vw, 0.7rem)" }}>
                  {publicCode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Certificate details */}
        <div className="mx-4 mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-cinza-suave/40 bg-rosa-claro/20 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Aluna</p>
            <p className="mt-0.5 text-xs font-bold text-foreground truncate">{userName || "—"}</p>
          </div>
          <div className="rounded-2xl border border-cinza-suave/40 bg-rosa-claro/20 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Concluído em</p>
            <p className="mt-0.5 text-xs font-bold text-foreground">{completedStr}</p>
          </div>
          <div className="rounded-2xl border border-cinza-suave/40 bg-rosa-claro/20 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Emitido em</p>
            <p className="mt-0.5 text-xs font-bold text-foreground">{issuedStr}</p>
          </div>
          <div className="rounded-2xl border border-cinza-suave/40 bg-rosa-claro/20 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Código</p>
            <p className="mt-0.5 font-mono text-[10px] font-bold text-rose-gold">{publicCode ?? "—"}</p>
          </div>
        </div>

        {/* Verification link */}
        {verifyUrl && (
          <div className="mx-4 mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <p className="flex-1 text-xs text-emerald-300">
              Certificado verificável publicamente.
            </p>
            <Link
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Verificar <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-cinza-suave/30 px-5 py-4">
          <button type="button" onClick={onClose} className={`${outlineButton} px-4 py-2 text-sm`}>
            Fechar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={`${primaryButton} inline-flex items-center gap-2 px-5 py-2 text-sm`}
          >
            <Download className="h-4 w-4" />
            Baixar certificado
          </button>
        </div>
      </div>
    </div>
  );
}

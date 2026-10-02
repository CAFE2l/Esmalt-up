"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Download } from "lucide-react";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  issuedAt: string; // ISO string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }
}

export default function CertificateModal({ isOpen, onClose, userName, issuedAt }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const dateStr = formatDate(issuedAt);

  const handleDownload = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 850;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the certificate template
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Name overlay — centered, large
    ctx.textAlign = "center";
    ctx.fillStyle = "#b83d52";
    ctx.font = `bold ${Math.round(w * 0.048)}px 'Georgia', serif`;
    ctx.fillText(userName || "Aluna Esmalt'up", w / 2, h * 0.56);

    // Date overlay
    ctx.fillStyle = "#6b4a52";
    ctx.font = `${Math.round(w * 0.022)}px 'Georgia', serif`;
    ctx.fillText(dateStr, w / 2, h * 0.68);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificado-esmaltup.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [userName, dateStr]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Certificado de conclusão"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-cinza-suave/40 bg-branco shadow-card-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinza-suave/30 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Seu Certificado 🎓</h2>
            <p className="text-xs text-foreground/60 mt-0.5">Certificado simbólico, emitido apenas por diversão.</p>
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
            src="/certificate-template.png"
            alt="Template do certificado"
            className="w-full"
            crossOrigin="anonymous"
          />
          {/* Overlaid text — positioned responsively over the image */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {/* Name — sits at ~56% from top */}
            <div style={{ position: "absolute", top: "52%", left: 0, right: 0, textAlign: "center" }}>
              <p
                className="font-bold text-rose-gold drop-shadow"
                style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.6rem)", lineHeight: 1.2 }}
              >
                {userName || "Aluna Esmalt'up"}
              </p>
            </div>
            {/* Date — sits at ~68% from top */}
            <div style={{ position: "absolute", top: "65%", left: 0, right: 0, textAlign: "center" }}>
              <p
                className="text-foreground/70"
                style={{ fontSize: "clamp(0.6rem, 2vw, 0.95rem)" }}
              >
                {dateStr}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-cinza-suave/30 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`${outlineButton} px-4 py-2 text-sm`}
          >
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

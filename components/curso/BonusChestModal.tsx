"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, Play, X, Gift } from "lucide-react";
import type { BonusChest } from "@/data/course";
import { primaryButton, outlineButton } from "../buttonStyles";

interface Props {
  chest: BonusChest;
  isOpen: boolean;
  onClose: () => void;
}

export default function BonusChestModal({ chest, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-gold/40 bg-branco p-6 text-center shadow-card-lg sm:p-8 animate-fade-in-up">
        {/* Glow backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-rosa-blush/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-rose-gold/20 blur-3xl"
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar baú bônus"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-rosa-claro hover:text-rose-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Chest icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#df9aa8] to-[#f4b6c2] text-white shadow-card-lg ring-8 ring-rosa-blush/20">
          <Gift className="h-10 w-10 animate-pulse" />
          <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-300 drop-shadow" />
        </div>

        {/* Celebration header */}
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-gold/30 bg-rosa-claro/60 px-3.5 py-1 text-xs font-semibold text-rose-gold">
          <Sparkles className="h-3.5 w-3.5" /> Recompensa de Unidade Concluída
        </span>

        <h3
          id="chest-modal-title"
          className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {chest.title}
        </h3>

        <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
          {chest.subtitle}
        </p>

        {chest.lesson.description && (
          <p className="mt-2 text-xs text-foreground/60 italic">
            &ldquo;{chest.lesson.description}&rdquo;
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/curso/aula/${chest.lesson.slug}`}
            className={`${primaryButton} inline-flex items-center justify-center gap-2 px-6 py-3 text-sm shadow-card hover:shadow-card-lg`}
          >
            <Play className="h-4 w-4 fill-current" />
            Assistir aula bônus agora
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={`${outlineButton} px-5 py-3 text-sm`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

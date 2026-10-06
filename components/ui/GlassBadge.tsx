"use client";

import type { ReactNode } from "react";

/**
 * GlassBadge — badge de status em vidro com bolota LED.
 * Usado para status de pedido, contadores e etiquetas de estoque.
 */

export type GlassBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "pink";

const TONE_DOTS: Record<GlassBadgeTone, string> = {
  success: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  warning: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
  danger: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
  info: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
  neutral: "bg-foreground/50 shadow-[0_0_8px_rgba(150,140,145,0.6)]",
  pink: "bg-rosa-blush shadow-[0_0_8px_rgba(224,156,170,0.9)]",
};

const TONE_TEXT: Record<GlassBadgeTone, string> = {
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-red-300",
  info: "text-sky-300",
  neutral: "text-foreground/70",
  pink: "text-rose-gold",
};

interface GlassBadgeProps {
  tone?: GlassBadgeTone;
  children: ReactNode;
  /** Esconde a bolota LED (para badges sem semântica de status). */
  hideDot?: boolean;
  className?: string;
}

export function GlassBadge({
  tone = "pink",
  children,
  hideDot = false,
  className = "",
}: GlassBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold backdrop-blur-sm ${TONE_TEXT[tone]} ${className}`}
    >
      {!hideDot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${TONE_DOTS[tone]}`}
        />
      )}
      {children}
    </span>
  );
}

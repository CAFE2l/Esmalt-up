"use client";

import { useReducedMotion } from "framer-motion";

/**
 * GlassSkeleton — bloco de carregamento com shimmer "glow".
 * Com movimento reduzido, para de animar (mantém o bloco estático visível).
 */

interface GlassSkeletonProps {
  /** Classes do container (define o tamanho, ex.: "h-40 rounded-3xl"). */
  className?: string;
  /** Quantos blocos empilhados (linhas de texto, cards). */
  count?: number;
}

export function GlassSkeleton({ className = "h-4 w-full rounded-full", count = 1 }: GlassSkeletonProps) {
  const reducedMotion = useReducedMotion();

  if (count <= 1) {
    return (
      <div
        aria-hidden="true"
        className={`${className} ${reducedMotion ? "bg-white/8" : "glow-shimmer"}`}
      />
    );
  }

  return (
    <div aria-hidden="true" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`${className} ${reducedMotion ? "bg-white/8" : "glow-shimmer"}`}
        />
      ))}
    </div>
  );
}

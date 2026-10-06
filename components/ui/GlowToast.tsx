"use client";

import { useEffect } from "react";
import { AnimatePresence, m as motion, useReducedMotion } from "framer-motion";
import { Undo2, X } from "lucide-react";

/**
 * GlowToast — toast fixo com ação opcional ("Desfazer").
 * Renderizado via portal-free (fixed), com aria-live polite.
 */

export interface GlowToastData {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface GlowToastProps {
  toast: GlowToastData | null;
  onDismiss: () => void;
  /** Duração em ms; `null` mantém aberto até fechar manualmente. */
  duration?: number | null;
}

export function GlowToast({ toast, onDismiss, duration = 5000 }: GlowToastProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!toast || duration == null) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-5 left-1/2 z-[95] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-rose-gold/30 bg-branco/90 px-4 py-3 shadow-card-lg backdrop-blur-xl">
            <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {toast.message}
            </p>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss();
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-gold/50 px-3 py-1.5 text-xs font-semibold text-rose-gold transition-colors hover:bg-rosa-claro/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-gold"
              >
                <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fechar aviso"
              className="shrink-0 rounded-full p-1.5 text-foreground/50 transition-colors hover:bg-rosa-claro/60 hover:text-rose-gold"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

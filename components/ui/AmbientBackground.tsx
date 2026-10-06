"use client";

import { m as motion, useReducedMotion } from "framer-motion";

/**
 * AmbientBackground — halos radiais estáticos atrás de páginas Glow.
 * Usa `pointer-events-none` + fixed para não interferir em cliques/scroll.
 * Com movimento reduzido, a flutuação é desligada.
 */
export function AmbientBackground({ className = "" }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  const drift = (delay: number) =>
    reducedMotion
      ? {}
      : {
          animate: { y: [0, -18, 0], opacity: [0.55, 0.8, 0.55] },
          transition: { duration: 12, repeat: Infinity, ease: "easeInOut" as const, delay },
        };

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <motion.div
        {...drift(0)}
        className="absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-rosa-medio/20 blur-[120px]"
      />
      <motion.div
        {...drift(4)}
        className="absolute top-1/3 left-[-15%] h-[26rem] w-[26rem] rounded-full bg-rose-gold/15 blur-[130px]"
      />
      <motion.div
        {...drift(7)}
        className="absolute bottom-[-10%] right-1/4 h-80 w-80 rounded-full bg-rosa-blush/15 blur-[110px]"
      />
    </div>
  );
}

import type { Transition, Variants } from "framer-motion";

/**
 * Esmalt'up Glow — variantes de movimento compartilhadas.
 *
 * Todas as variantes são "baratas": opacidade + translação curta com springs
 * suaves. Consumidores devem usar `m` (LazyMotion) e ler `useReducedMotion()`
 * para desligar transformações quando o usuário pedir movimento reduzido —
 * `reducedMotionVariants` facilita esse desligamento.
 */

export const glowSpring: Transition = { type: "spring", stiffness: 320, damping: 32 };

export const glowSpringSoft: Transition = { type: "spring", stiffness: 180, damping: 26 };

/** Container com stagger vertical (filhos entram em cascata). */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** Container com stagger horizontal (toolbars, abas, stats). */
export const staggerRow: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

/** Item padrão: sobe 12px + fade. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: glowSpringSoft },
};

/** Item de lista/card: leve escala para dar peso ao "surge". */
export const scaleInItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: glowSpring },
};

/** Entrada de hero/seção. */
export const heroIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 140, damping: 22 } },
};

/** expansão/colapso de altura (painéis, cards de pedido). */
export const expandPanel: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: "auto", opacity: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

/**
 * Substitui as variantes animadas por versões instantâneas quando o usuário
 * solicitou movimento reduzido. Uso:
 *   const variants = useReducedMotion() ? reducedMotionVariants.stagger : staggerContainer;
 */
export const reducedMotionVariants = {
  stagger: {
    hidden: {},
    show: { transition: { staggerChildren: 0 } },
  } satisfies Variants,
  item: {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0 },
  } satisfies Variants,
  expand: {
    hidden: { height: 0, opacity: 1 },
    show: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 1 },
  } satisfies Variants,
};

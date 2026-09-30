"use client";

import { LazyMotion, domMax } from "framer-motion";
import type { ReactNode } from "react";

/**
 * framer-motion's `m` component ships without a renderer: it resolves one from
 * `LazyContext`, which is only ever populated by <LazyMotion>. Without this
 * provider `useVisualElement` never creates a visual element, so `initial`
 * styles emitted during SSR (notably `opacity: 0`) are never animated and
 * everything stays permanently invisible.
 *
 * `domMax` is required rather than `domAnimation` because the UI also relies on
 * layout animations (`layout`, `LayoutGroup`) and drag gestures.
 *
 * `strict` is intentionally left off: HeroCarousel imports the full `motion`
 * component directly, which `strict` would forbid.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domMax}>{children}</LazyMotion>;
}

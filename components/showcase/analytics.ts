/**
 * GA4 hook for the showcase. Calls `window.gtag` only when it exists.
 * A short window collapses the double invoke from React StrictMode.
 */

type EventParam = string | number | boolean | undefined;

type Gtag = (
  command: "event",
  eventName: string,
  params?: Record<string, string | number | boolean>,
) => void;

const recent = new Map<string, number>();
const DEDUPE_MS = 400;

export type ShowcaseInteractAction =
  | "next"
  | "prev"
  | "drag"
  | "thumb"
  | "tab"
  | "dot"
  | "autoplay_stop";

export function trackEvent(name: string, params: Record<string, EventParam> = {}): void {
  if (typeof window === "undefined") return;

  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) cleaned[key] = value;
  }

  const dedupeKey = `${name}:${JSON.stringify(cleaned)}`;
  const now = Date.now();
  const last = recent.get(dedupeKey) ?? 0;
  if (now - last < DEDUPE_MS) return;
  recent.set(dedupeKey, now);

  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, cleaned);
}

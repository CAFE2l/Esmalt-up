"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ShieldAlert, type LucideIcon } from "lucide-react";

type Tone = "danger" | "warning";

function ConfirmDialog({
  open,
  title,
  description,
  verifyText,
  confirmLabel,
  cancelLabel = "Cancelar",
  icon: Icon = ShieldAlert,
  tone = "danger",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  verifyText?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: LucideIcon;
  tone?: Tone;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      if (verifyText) inputRef.current?.focus();
      else confirmRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(id);
  }, [open, verifyText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const verified = !verifyText || typed.trim().toUpperCase() === verifyText.trim().toUpperCase();
  const danger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-3xl border border-cinza-suave/70 bg-branco p-6 shadow-card-lg sm:p-7"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              danger
                ? "bg-red-500/15 text-red-400"
                : "bg-rosa-claro/70 text-rose-gold"
            }`}
          >
            <Icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h3>
            <div className="mt-1.5 text-sm leading-relaxed text-foreground/70">
              {description}
            </div>
          </div>
        </div>

        {verifyText && (
          <div className="mt-5">
            <label
              htmlFor="confirmacao-texto"
              className="mb-1.5 block text-sm font-medium text-foreground/80"
            >
              Digite{" "}
              <span className="font-semibold text-rosa-blush">{verifyText}</span>{" "}
              para confirmar
            </label>
            <input
              id="confirmacao-texto"
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={verifyText}
              className="w-full rounded-2xl border border-cinza-suave bg-rosa-claro/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-rose-gold focus:outline-none"
            />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border-2 border-rose-gold bg-transparent px-6 py-2.5 text-sm font-semibold text-rose-gold transition-all duration-200 hover:bg-rosa-claro/40 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            disabled={!verified || busy}
            className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${
              danger
                ? "bg-gradient-to-r from-red-500 to-rose-500"
                : "bg-gradient-to-r from-rosa-blush to-rose-gold"
            }`}
          >
            {busy ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
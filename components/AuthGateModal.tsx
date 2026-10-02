"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { primaryButton, outlineButton } from "./buttonStyles";

interface AuthGateModalProps {
  onClose: () => void;
  /** Override the default message body */
  message?: string;
}

export function AuthGateModal({ onClose, message }: AuthGateModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-rose-gold/30 bg-branco p-8 text-center shadow-card-lg"
      >
        {/* Ambient blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full bg-rosa-medio/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-rose-gold/15 blur-3xl" />

        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rosa-claro/60 text-rose-gold">
            <Lock className="h-6 w-6" />
          </div>

          <h2
            id="auth-gate-title"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            Faça login para continuar
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            {message ?? "Você precisa entrar ou criar uma conta para utilizar este recurso."}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className={`${primaryButton} px-8 py-3 text-sm`}
              onClick={onClose}
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className={`${outlineButton} px-8 py-3 text-sm`}
              onClick={onClose}
            >
              Criar conta
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-xs font-medium text-foreground/50 transition-colors hover:text-rose-gold"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Returns a guard function and the modal JSX.
 * Usage:
 *   const { guard, modal } = useAuthGate(user);
 *   <button onClick={() => guard(() => doProtectedThing())} />
 *   {modal}
 */
export function useAuthGate(
  user: { uid: string } | null | undefined,
  message?: string,
) {
  const [open, setOpen] = useState(false);

  const guard = useCallback(
    (action: () => void) => {
      if (!user) {
        setOpen(true);
        return;
      }
      action();
    },
    [user],
  );

  const modal = open ? (
    <AuthGateModal onClose={() => setOpen(false)} message={message} />
  ) : null;

  return { guard, modal };
}

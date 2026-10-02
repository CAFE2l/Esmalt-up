"use client";

import { useEffect, useState } from "react";
import { X, Award } from "lucide-react";
import { primaryButton, outlineButton } from "@/components/buttonStyles";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onClaimed: (data: { recipientName: string; issuedAt: string; publicCode: string; completedAt?: string }) => void;
}

/**
 * Claim flow: the graduate types their full name and chooses wall visibility.
 * POST /api/certificates/issue issues the certificate (idempotent).
 */
export default function CertificateClaimModal({ isOpen, onClose, onClaimed }: Props) {
  const { user } = useAuth();
  const [recipientName, setRecipientName] = useState("");
  const [showOnWall, setShowOnWall] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (recipientName.trim().length < 3) {
      setError("Informe o nome completo que aparecerá no certificado.");
      return;
    }

    if (!user) {
      setError("Você precisa estar logada para resgatar o certificado.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientName: recipientName.trim(), showOnWall }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível emitir o certificado.");
        return;
      }
      onClaimed({
        recipientName: data.certificate.recipientName,
        issuedAt: data.certificate.issuedAt,
        publicCode: data.certificate.publicCode,
        completedAt: data.certificate.completedAt,
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Resgatar certificado"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-cinza-suave/40 bg-branco p-5 shadow-card-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Award className="h-5 w-5 text-rose-gold" />
              Resgatar certificado
            </h2>
            <p className="mt-0.5 text-xs text-foreground/60">
              O nome não poderá ser alterado depois.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-rosa-claro/40 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="claim-name" className="mb-1 block text-sm font-medium text-foreground">
              Nome completo
            </label>
            <input
              id="claim-name"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-cinza-suave/50 bg-branco px-4 py-2.5 text-sm text-foreground outline-none focus:border-rose-gold/60"
              placeholder="Como você quer ser chamada?"
            />
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={showOnWall}
                onChange={(e) => setShowOnWall(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#d396a0]"
              />
              <span>Aparecer no Mural de Formados (público)</span>
            </label>
            <p className="mt-1 text-xs text-foreground/60">
              Mostramos apenas seu nome, foto e data de conclusão. Você pode ocultar a qualquer momento.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className={`${outlineButton} px-4 py-2 text-sm`}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${primaryButton} inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50`}
            >
              {submitting ? "Emitindo..." : "Resgatar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

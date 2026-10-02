"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check, ChevronRight, GraduationCap, RefreshCw, Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { monthLabel, longDatePtBR, isNewGraduate, type WallEntry, type WallPage } from "@/lib/wall";

/* ---------------- Medal header ---------------- */

function MedalBadge() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-24 w-24 sm:h-28 sm:w-28"
      role="img"
      aria-label="Medalha de formado"
    >
      <defs>
        <linearGradient id="md-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c453" />
          <stop offset="1" stopColor="#d4a017" />
        </linearGradient>
        <linearGradient id="md-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e09cae" />
          <stop offset="1" stopColor="#c97a8f" />
        </linearGradient>
      </defs>
      <path d="M38 8 L60 34 L82 8 L92 14 L70 44 L50 44 L28 14 Z" fill="url(#md-pink)" />
      <circle cx="60" cy="72" r="30" fill="url(#md-gold)" stroke="#b8860b" strokeWidth="2" />
      <circle cx="60" cy="72" r="23" fill="#fde68a" />
      <path
        d="M60 58 l4.4 8.9 9.8 1.4 -7.1 6.9 1.7 9.8 -8.8-4.6 -8.8 4.6 1.7-9.8 -7.1-6.9 9.8-1.4 Z"
        fill="#c97a8f"
      />
      <path d="M18 26 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2 Z" fill="#f6c453" />
      <path d="M98 40 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6-4 -4-1.6 4-1.6 Z" fill="#e09cae" />
      <path d="M92 96 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4-3.4 -3.4-1.4 3.4-1.4 Z" fill="#f6c453" />
    </svg>
  );
}

/* ---------------- Avatar ---------------- */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "E";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-sm font-bold text-white">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            el.parentElement!.setAttribute("data-fallback", "1");
            el.parentElement!.textContent = initialsOf(name);
          }}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

/* ---------------- Skeleton / Error ---------------- */

function SkeletonRows() {
  return (
    <ul aria-hidden className="divide-y divide-cinza-suave/30">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <span className="h-11 w-11 animate-pulse rounded-full bg-rosa-claro" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-2/5 animate-pulse rounded bg-rosa-claro" />
            <span className="block h-3 w-1/4 animate-pulse rounded bg-rosa-claro" />
          </span>
          <span className="h-6 w-28 animate-pulse rounded-full bg-rosa-claro" />
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Status card for logged-in user ---------------- */

type OwnStatus =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "graduated-visible" }
  | { kind: "graduated-hidden" };

function OwnStatusCard({ status, onShowAgain }: { status: OwnStatus; onShowAgain: () => void }) {
  if (status.kind === "loading" || status.kind === "graduated-visible") return null;

  if (status.kind === "graduated-hidden") {
    return (
      <div className="mb-6 rounded-2xl border border-rose-gold/40 bg-rosa-claro/30 p-4 text-sm text-foreground shadow-card backdrop-blur-sm">
        <p className="font-semibold">Você está oculto(a) do mural</p>
        <p className="mt-1 text-foreground/70">Seu certificado é válido, mas não aparece para outras pessoas.</p>
        <button
          type="button"
          onClick={onShowAgain}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-gold/90 px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95"
        >
          Mostrar novamente no mural
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-rose-gold/30 bg-gradient-to-r from-rosa-claro/40 via-branco to-rosa-claro/40 p-4 shadow-card backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          Conclua o curso e resgate seu certificado para aparecer aqui
        </p>
        <Link
          href="/curso"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-gold/90 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95"
        >
          Ir para o curso
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Wall row ---------------- */

function WallRow({ entry, isOwn }: { entry: WallEntry; isOwn: boolean }) {
  const isNew = isNewGraduate(entry.issuedAt);
  return (
    <li
      className={`flex items-center gap-3 px-4 py-4 sm:px-6 ${
        isOwn ? "bg-rosa-claro/40 ring-1 ring-inset ring-rose-gold/50 rounded-xl" : ""
      }`}
    >
      <Avatar name={entry.recipientName} src={entry.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground sm:text-base">
          {entry.recipientName}
          {isNew && (
            <span title="Novo no mural" className="inline-flex items-center gap-0.5 rounded-full bg-rose-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-gold">
              <Sparkles className="h-3 w-3" aria-hidden />
              Novo
            </span>
          )}
          {isOwn && (
            <span className="rounded-full bg-rosa-blush/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-gold">
              Você
            </span>
          )}
        </p>
        <p className="truncate text-xs text-foreground/60">
          Concluiu em {longDatePtBR(entry.issuedAt)}
        </p>
      </div>
      <Link
        href={`/verificar/${encodeURIComponent(entry.publicCode)}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rosa-blush/40 bg-rosa-claro/50 px-2.5 py-1 text-xs font-semibold text-rose-gold transition hover:bg-rosa-claro"
        aria-label={`Certificado válido de ${entry.recipientName}`}
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Certificado válido</span>
      </Link>
    </li>
  );
}

/* ---------------- Main client ---------------- */

export default function WallClient() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownCode, setOwnCode] = useState<string | null>(null);
  const [ownStatus, setOwnStatus] = useState<OwnStatus>({ kind: "loading" });

  const load = useCallback(async (next?: string) => {
    if (next) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const url = next ? `/api/formados?cursor=${encodeURIComponent(next)}` : "/api/formados";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as WallPage;
      setEntries((prev) => (next ? [...prev, ...data.entries] : data.entries));
      setTotal(data.total);
      setCursor(data.nextCursor);
    } catch {
      setError("Não foi possível carregar o mural.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Fresh own status (not cached with the public list)
  useEffect(() => {
    let cancelled = false;
    async function loadOwn() {
      if (!user) {
        setOwnCode(null);
        setOwnStatus({ kind: "none" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/certificates/issue", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.certificate) {
          setOwnCode(null);
          setOwnStatus({ kind: "none" });
        } else {
          setOwnCode(data.certificate.publicCode);
          setOwnStatus(
            data.certificate.showOnWall
              ? { kind: "graduated-visible" }
              : { kind: "graduated-hidden" },
          );
        }
      } catch {
        if (!cancelled) setOwnStatus({ kind: "none" });
      }
    }
    loadOwn();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const showAgain = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/certificates/visibility", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ showOnWall: true }),
      });
      if (!res.ok) throw new Error();
      setOwnStatus({ kind: "graduated-visible" });
      load();
    } catch {
      /* keep hidden state; user can retry */
    }
  }, [user, load]);

  const groups = useMemo(() => {
    const map = new Map<string, WallEntry[]>();
    for (const e of entries) {
      const key = monthLabel(e.issuedAt);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex flex-col items-center text-center">
          <MedalBadge />
          <h1 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
            Mural de Formados
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {total === 0
              ? "Nenhuma pessoa formou ainda"
              : total === 1
                ? "1 pessoa concluiu o curso"
                : `${total} pessoas concluíram o curso`}
          </p>
        </header>

        {/* Own status banner */}
        <OwnStatusCard status={ownStatus} onShowAgain={showAgain} />

        {/* Error state */}
        {error && !loading && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* List */}
        <div className="rounded-3xl border border-cinza-suave/40 bg-branco/80 shadow-card backdrop-blur-sm">
          {loading ? (
            <SkeletonRows />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <GraduationCap className="h-12 w-12 text-rosa-blush" aria-hidden />
              <p className="text-base font-semibold text-foreground">
                Seja a primeira pessoa a aparecer aqui!
              </p>
              <p className="max-w-sm text-sm text-foreground/60">
                Conclua o curso, resgate seu certificado e seu nome vai brilhar neste mural.
              </p>
              <Link
                href="/curso"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-gold/90 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              >
                Ir para o curso
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-cinza-suave/30">
              {groups.map(([label, rows]) => (
                <li key={label}>
                  <h2 className="sticky top-[72px] z-10 bg-branco/90 px-4 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-gold sm:px-6 backdrop-blur-sm">
                    {label}
                  </h2>
                  <ul>
                    {rows.map((e) => (
                      <WallRow
                        key={e.publicCode}
                        entry={e}
                        isOwn={ownCode !== null && e.publicCode === ownCode}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Load more */}
        {cursor && !loading && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => load(cursor)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-rose-gold/40 bg-rosa-claro/30 px-6 py-2.5 text-sm font-semibold text-rose-gold transition hover:bg-rosa-claro/60 disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-gold border-t-transparent" />
              ) : null}
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

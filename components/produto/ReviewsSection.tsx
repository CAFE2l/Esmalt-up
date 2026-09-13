"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import Stars from "./Stars";
import { primaryButton } from "@/components/buttonStyles";

interface ReviewMedia {
  id: string;
  kind: string;
  url: string;
}

interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  helpfulCount: number;
  myVote: boolean;
  media: ReviewMedia[];
}

interface ReviewState {
  average: number | null;
  total: number;
  distribution: Record<string, number>;
  items: ReviewItem[];
  hasMore: boolean;
}

type SortOption = "recent" | "helpful" | "rating";

const LOADING: ReviewState = {
  average: null,
  total: 0,
  distribution: {},
  items: [],
  hasMore: false,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { sessionId } = useCart();
  const [state, setState] = useState<ReviewState>(LOADING);
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", content: "" });
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formMessage, setFormMessage] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (sortKey: SortOption, pageNumber: number, append = false) => {
      const url = `/api/reviews?productId=${encodeURIComponent(productId)}&sort=${sortKey}&page=${pageNumber}&sessionId=${encodeURIComponent(sessionId ?? "")}`;
      try {
        const token = await user?.getIdToken().catch(() => null);
        const response = await fetch(url, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) return;
        const data = (await response.json()) as ReviewState;
        setState((current) =>
          append
            ? { ...data, items: [...current.items, ...data.items] }
            : data,
        );
      } catch {
        /* mantém estado atual */
      }
    },
    [productId, sessionId, user],
  );

  useEffect(() => {
    setPage(1);
    void load(sort, 1);
  }, [productId, sort, load]);

  const distributionTotal = useMemo(
    () =>
      Object.values(state.distribution).reduce((sum, count) => sum + count, 0) ||
      1,
    [state.distribution],
  );

  const handleSort = (next: SortOption) => {
    setSort(next);
    setPage(1);
  };

  const handleVote = async (review: ReviewItem) => {
    try {
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(`/api/reviews/${review.id}/vote`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) return;
      const result = (await response.json()) as { helpful: boolean; delta: number };
      setState((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === review.id
            ? {
                ...item,
                myVote: result.helpful,
                helpfulCount: Math.max(0, item.helpfulCount + result.delta),
              }
            : item,
        ),
      }));
    } catch {
      /* falha silenciosa */
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = await user?.getIdToken().catch(() => null);
    if (!token) {
      setFormMessage({
        type: "error",
        text: "Entre na sua conta para enviar fotos nas avaliações.",
      });
      return;
    }
    setUploading(true);
    setFormMessage(null);
    for (const file of Array.from(files).slice(0, 5 - media.length)) {
      if (file.size > 5 * 1024 * 1024) {
        setFormMessage({
          type: "error",
          text: `${file.name} tem mais de 5 MB e foi ignorado.`,
        });
        continue;
      }
      const reader = new FileReader();
      const base64 = await new Promise<string | null>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      if (!base64) continue;
      try {
        const response = await fetch("/api/reviews/upload", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name,
            kind: file.type.startsWith("video") ? "video" : "image",
          }),
        });
        const data = (await response.json()) as { url?: string; kind?: string; error?: string };
        if (response.ok && data.url) {
          setMedia((current) => [
            ...current,
            { id: crypto.randomUUID(), kind: data.kind ?? "image", url: data.url! },
          ]);
        } else if (data.error) {
          setFormMessage({ type: "error", text: data.error });
        }
      } catch {
        setFormMessage({ type: "error", text: "Upload falhou. Tente novamente." });
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitReview = async () => {
    if (form.content.trim().length < 4) {
      setFormMessage({ type: "error", text: "Escreva alguns detalhes da sua experiência." });
      return;
    }
    const token = await user?.getIdToken().catch(() => null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          rating: form.rating,
          title: form.title.trim() || undefined,
          content: form.content.trim(),
          media: media.map((item) => ({ kind: item.kind, url: item.url })),
        }),
      });
      const data = (await response.json()) as { moderation?: boolean; error?: string };
      if (!response.ok) {
        setFormMessage({ type: "error", text: data.error ?? "Não foi possível enviar." });
        return;
      }
      setFormMessage({
        type: "ok",
        text: data.moderation
          ? "Avaliação enviada! Fotos entram na fila de moderação e aparecem em breve."
          : "Avaliação publicada. Obrigado!",
      });
      setForm({ rating: 5, title: "", content: "" });
      setMedia([]);
      setOpenForm(false);
      void load(sort, 1);
    } catch {
      setFormMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    }
  };

  return (
    <div className="rounded-[2rem] border border-cinza-suave/40 bg-branco p-7 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Avaliações</h2>
        <button
          type="button"
          onClick={() => setOpenForm((value) => !value)}
          className={`${primaryButton} px-5 py-2.5 text-sm`}
        >
          {openForm ? "Cancelar" : "Avaliar este produto"}
        </button>
      </div>

      {/* Distribuição */}
      <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center gap-1 rounded-3xl bg-rosa-claro/40 p-6 text-center">
          <p className="text-5xl font-bold text-foreground">
            {(state.average ?? 0).toFixed(1)}
          </p>
          <Stars rating={state.average ?? 0} />
          <p className="mt-1 text-xs text-foreground/60">
            {state.total} {state.total === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-1.5">
          {[5, 4, 3, 2, 1].map((starsCount) => {
            const count = state.distribution[starsCount] ?? 0;
            const percent = Math.round((count / distributionTotal) * 100);
            return (
              <div key={starsCount} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-foreground/70">{starsCount}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-rosa-claro">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-foreground/60">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulário */}
      {openForm && (
        <form
          className="mt-6 space-y-4 rounded-3xl border border-rose-gold/30 bg-rosa-claro/25 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitReview();
          }}
        >
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Sua nota
            </p>
            <Stars
              interactive
              rating={form.rating}
              onChange={(rating) => setForm((current) => ({ ...current, rating }))}
              size={28}
            />
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Título (opcional)"
            maxLength={120}
            className="w-full rounded-full border border-cinza-suave/50 bg-branco px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
          />
          <textarea
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({ ...current, content: event.target.value }))
            }
            placeholder="Conte como foi usar este produto..."
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-3xl border border-cinza-suave/50 bg-branco px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
          />

          {/* Mídia */}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-rose-gold/40 bg-branco px-4 py-2.5 text-sm font-medium text-rose-gold transition-colors hover:bg-rosa-blush hover:text-white"
            >
              {media.length > 0 ? "Adicionar mais fotos/vídeo" : "Adicionar foto ou vídeo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              multiple
              className="hidden"
              onChange={(event) => void onPickFiles(event.target.files)}
            />
            <p className="mt-1.5 text-xs text-foreground/50">
              Máx. 5 arquivos de até 5 MB. Fotos entram na fila de moderação.
            </p>

            {media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {media.map((item) =>
                  item.kind === "video" ? (
                    <div
                      key={item.id}
                      className="relative h-20 w-20 overflow-hidden rounded-2xl border border-cinza-suave/40 bg-branco"
                    >
                      <video src={item.url} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setMedia((current) =>
                            current.filter((m) => m.id !== item.id),
                          )
                        }
                        aria-label="Remover vídeo"
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      key={item.id}
                      className="relative h-20 w-20 overflow-hidden rounded-2xl border border-cinza-suave/40 bg-branco"
                    >
                      <Image src={item.url} alt="Anexo da avaliação" fill sizes="80px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setMedia((current) =>
                            current.filter((m) => m.id !== item.id),
                          )
                        }
                        aria-label="Remover imagem"
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
            {uploading && <p className="mt-2 text-xs text-foreground/60">Enviando mídia...</p>}
          </div>

          {formMessage && (
            <p
              className={
                formMessage.type === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"
              }
            >
              {formMessage.text}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={uploading} className={`${primaryButton} px-6 py-2.5 text-sm`}>
              Publicar avaliação
            </button>
            {!user && (
              <p className="self-center text-xs text-foreground/50">
                Você pode avaliar sem conta, mas fotos exigem login.
              </p>
            )}
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-foreground/50">Ordenar por</span>
        {(
          [
            ["recent", "Mais recentes"],
            ["helpful", "Úteis"],
            ["rating", "Melhor nota"],
          ] as [SortOption, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSort(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === value
                ? "bg-rosa-blush/20 text-rose-gold"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {state.items.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-rosa-claro/30 p-6 text-center text-sm text-foreground/60">
          Ainda não há avaliações publicadas. Seja a primeira!
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-cinza-suave/30">
          {state.items.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-sm font-bold text-white">
                  {review.userName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {review.userName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Stars rating={review.rating} size={14} />
                    <span className="text-xs text-foreground/50">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {review.title && (
                <p className="mt-3 text-base font-semibold text-foreground">
                  {review.title}
                </p>
              )}
              <p className="mt-1 text-sm leading-relaxed text-foreground/75">
                {review.content}
              </p>

              {review.media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {review.media.map((item) =>
                    item.kind === "video" ? (
                      <video
                        key={item.id}
                        src={item.url}
                        controls
                        className="h-24 w-24 rounded-2xl border border-cinza-suave/40 object-cover"
                      />
                    ) : (
                      <Image
                        key={item.id}
                        src={item.url}
                        alt="Foto da avaliação"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-2xl border border-cinza-suave/40 object-cover"
                      />
                    ),
                  )}
                </div>
              )}

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void handleVote(review)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    review.myVote
                      ? "border-rose-gold/50 bg-rosa-blush/15 text-rose-gold"
                      : "border-cinza-suave/50 text-foreground/60 hover:text-rose-gold"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
                  </svg>
                  {review.helpfulCount > 0 ? `${review.helpfulCount} ` : ""}
                  Útil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {state.hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(sort, next, true);
            }}
            className="rounded-full border border-rose-gold/40 px-5 py-2 text-sm font-medium text-rose-gold hover:bg-rosa-blush hover:text-white"
          >
            Ver mais avaliações
          </button>
        </div>
      )}
    </div>
  );
}
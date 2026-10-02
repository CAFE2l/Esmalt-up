"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { Camera, PlayCircle, X, ChevronLeft, ChevronRight, Star, User, Check, Image as ImageIcon, Video as VideoIcon, ThumbsUp } from "lucide-react";
import { primaryButton } from "@/components/buttonStyles";
import { useAuthGate } from "@/components/AuthGateModal";

interface ReviewMedia {
  id: string;
  kind: string;
  url: string;
  thumbnailUrl?: string;
}

interface ReviewItem {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  helpfulCount: number;
  myVote: boolean;
  verifiedBuyer: boolean;
  media: ReviewMedia[];
}

interface ReviewState {
  average: number | null;
  total: number;
  distribution: Record<string, number>;
  items: ReviewItem[];
  hasMore: boolean;
}

type SortOption = "recent" | "helpful" | "rating" | "with_media";

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

// NEW: Media Gallery Component
function ReviewMediaGallery({
  media,
  onClose,
  startIndex,
}: {
  media: ReviewMedia[];
  onClose: () => void;
  startIndex: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  if (media.length === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
        aria-label="Fechar"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        {/* Navigation */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}

        {/* Media Display */}
        <div className="relative max-w-full max-h-[80vh] bg-black/50 rounded-2xl overflow-hidden">
          {currentMedia.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentMedia.url}
              alt={`Review media ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
          ) : currentMedia.kind === "video" ? (
            <video
              src={currentMedia.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : null}
        </div>

        {/* Counter */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>
    </div>
  );
}

// NEW: Individual Review Component
function ReviewItemCard({
  review,
  onVoteHelpful,
  onOpenGallery,
}: {
  review: ReviewItem;
  onVoteHelpful: (reviewId: string) => void;
  onOpenGallery: (media: ReviewMedia[], index: number) => void;
}) {
  const hasMedia = review.media && review.media.length > 0;
  const imageMedia = review.media?.filter(m => m.kind === "image") || [];
  const videoMedia = review.media?.filter(m => m.kind === "video") || [];

  return (
    <article className="rounded-2xl border border-cinza-suave/40 bg-branco p-6 shadow-card transition-shadow hover:shadow-card-lg">
      {/* Review Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {review.userImage ? (
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.userImage}
                alt={review.userName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{review.userName}</h3>
            {review.verifiedBuyer && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400"
                title="Compra verificada"
              >
                <Check className="h-3 w-3" />
                Verificado
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/50">{formatDate(review.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < review.rating ? "text-rose-gold fill-current" : "text-foreground/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
      )}

      {/* Review Content */}
      <p className="text-sm leading-relaxed text-foreground/75 mb-4">{review.content}</p>

      {/* Review Media */}
      {hasMedia && (
        <div className="mb-4">
          {imageMedia.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-2">
                <ImageIcon className="h-4 w-4 inline mr-1" />
                Fotos do cliente
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {imageMedia.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => onOpenGallery(review.media || [], index)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-cinza-suave/40 hover:border-rose-gold transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.url}
                      alt={`Review photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">Ver foto</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {videoMedia.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-2">
                <VideoIcon className="h-4 w-4 inline mr-1" />
                Vídeo do cliente
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {videoMedia.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => onOpenGallery(review.media || [], imageMedia.length + index)}
                    className="relative aspect-video rounded-xl overflow-hidden border border-cinza-suave/40 hover:border-rose-gold transition-colors bg-black"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white/80" />
                    </div>
                    {media.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.thumbnailUrl}
                        alt={`Review video thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helpful Button */}
      <div className="flex items-center gap-3 pt-3 border-t border-cinza-suave/40">
        <button
          onClick={() => onVoteHelpful(review.id)}
          disabled={review.myVote}
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
            review.myVote
              ? "text-rose-gold"
              : "text-foreground/60 hover:text-rose-gold"
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${review.myVote ? "fill-current" : ""}`} />
          {review.helpfulCount > 0 ? review.helpfulCount : "Esta avaliação foi útil?"}
        </button>
      </div>
    </article>
  );
}

// NEW: Review Form Component
function ReviewForm({
  productId,
  onClose,
  onSuccess,
}: {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!user) return;

    if (rating < 1 || rating > 5) {
      setError("Por favor, selecione uma classificação.");
      return;
    }

    if (content.length < 4) {
      setError("A avaliação deve ter pelo menos 4 caracteres.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title || undefined,
          content,
          media,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao enviar avaliação.");
      }

      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar avaliação.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newMedia: ReviewMedia[] = [];
      for (const file of Array.from(files).slice(0, 5)) {
        // In a real implementation, you would upload to Cloudinary here
        // For now, we'll use URL.createObjectURL for local preview
        const url = URL.createObjectURL(file);
        const kind = file.type.startsWith("image/") ? "image" : "video";
        newMedia.push({
          id: `preview-${Date.now()}-${Math.random()}`,
          kind,
          url,
        });
      }
      setMedia(prev => [...prev, ...newMedia]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-branco rounded-3xl border border-rose-gold/25 p-6 max-w-md w-full mx-4 text-center shadow-card-lg">
          <div className="mb-4 text-6xl">🎉</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Avaliação enviada com sucesso!
          </h3>
          <p className="text-sm text-foreground/60 mb-4">
            Obrigada por compartilhar sua experiência com outros clientes.
          </p>
          <button
            onClick={onClose}
            className={`${primaryButton} w-full`}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-branco rounded-3xl border border-rose-gold/25 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-card-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Escrever avaliação
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-rosa-claro/40 transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Rating */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Classificação geral
            </h3>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className={`rounded-xl p-2 transition-colors ${
                    i < rating
                      ? "bg-rose-gold/10 text-rose-gold"
                      : "hover:bg-rosa-claro/40 text-foreground/60"
                  }`}
                >
                  <Star
                    className={`h-6 w-6 ${i < rating ? "fill-current" : ""}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              {rating} {rating === 1 ? "estrela" : "estrelas"}
            </p>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Título (opcional)
            </h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ótimo produto, recomendo!"
              maxLength={120}
              className="w-full rounded-xl border border-cinza-suave/50 bg-rosa-claro/40 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-rose-gold focus:outline-none"
            />
            <p className="text-xs text-foreground/50 mt-1">
              {title.length}/120 caracteres
            </p>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Sua avaliação
            </h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conte como foi sua experiência com este produto. O que você mais gostou?"
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-cinza-suave/50 bg-rosa-claro/40 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-rose-gold focus:outline-none resize-none"
            />
            <p className="text-xs text-foreground/50 mt-1">
              {content.length}/2000 caracteres
            </p>
          </div>

          {/* Media Upload */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Adicione fotos ou vídeos
            </h3>
            <p className="text-xs text-foreground/50 mb-3">
              Mostre o resultado obtido com o produto (máx. 5 arquivos)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading || media.length >= 5}
              className="sr-only"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || media.length >= 5}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-rose-gold/40 bg-rosa-claro/30 px-6 py-3 text-sm font-medium text-rose-gold hover:bg-rosa-claro/50 transition-colors disabled:opacity-50 w-full justify-center"
            >
              {uploading ? (
                "Carregando..."
              ) : media.length >= 5 ? (
                "Máximo de arquivos atingido"
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Adicionar mídia
                </>
              )}
            </button>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {media.map((m) => (
                  <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden border border-rose-gold/40">
                    {m.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-black flex items-center justify-center">
                        <VideoIcon className="h-6 w-6 text-white/80" />
                      </div>
                    )}
                    <button
                      onClick={() => removeMedia(m.id)}
                      className="absolute top-1 right-1 rounded-full bg-black/50 p-1 hover:bg-black/70 transition-colors"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 rounded-xl border border-cinza-suave/50 bg-branco py-3 text-sm font-medium text-foreground hover:bg-rosa-claro/40 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || content.length < 4}
              className={`${primaryButton} flex-1`}
            >
              {uploading ? "Enviando..." : "Publicar avaliação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { sessionId } = useCart();
  const { guard: authGuard, modal: authModal } = useAuthGate(user, "Faça login para escrever uma avaliação.");
  const [state, setState] = useState<ReviewState>(LOADING);
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Media gallery state
  const [galleryMedia, setGalleryMedia] = useState<ReviewMedia[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Check if user can review this product
  const [canReview, setCanReview] = useState(false);
  const [checkingReviewEligibility, setCheckingReviewEligibility] = useState(true);

  const load = useCallback(
    async (sortKey: SortOption, pageNumber: number, append = false) => {
      const url = `/api/reviews?productId=${encodeURIComponent(productId)}&sort=${sortKey}&page=${pageNumber}&sessionId=${encodeURIComponent(sessionId ?? "")}`;
      try {
        const token = user ? await user.getIdToken().catch(() => null) : null;
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

  // Check if user has purchased this product
  useEffect(() => {
    async function checkReviewEligibility() {
      if (!user || !productId) {
        setCheckingReviewEligibility(false);
        setCanReview(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/user-purchases?productId=${encodeURIComponent(productId)}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCanReview(data.hasPurchased || false);
        }
      } catch (error) {
        console.error("Error checking review eligibility:", error);
        setCanReview(false);
      } finally {
        setCheckingReviewEligibility(false);
      }
    }

    checkReviewEligibility();
  }, [user, productId]);

  // Load reviews on sort/page change
  useEffect(() => {
    setPage(1);
    void load(sort, 1);
  }, [productId, sort, load]);

  const distributionTotal = useMemo(
    () =>
      Object.values(state.distribution).reduce((sum, count) => sum + count, 0) ||
      0,
    [state.distribution],
  );

  const voteHelpful = useCallback(
    async (reviewId: string) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        await fetch("/api/reviews/vote", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewId, helpful: true }),
        });
        await load(sort, page, true);
      } catch {
        /* ignore */
      }
    },
    [user, sort, page, load],
  );

  const loadMore = useCallback(() => {
    if (state.hasMore && !loadingMore) {
      setLoadingMore(true);
      setPage((p) => p + 1);
      void load(sort, page + 1, true).finally(() => setLoadingMore(false));
    }
  }, [state.hasMore, loadingMore, sort, page, load]);

  // Media gallery handlers
  const openGallery = useCallback((media: ReviewMedia[], index: number) => {
    setGalleryMedia(media);
    setGalleryIndex(index);
  }, []);

  const closeGallery = useCallback(() => {
    setGalleryMedia([]);
    setGalleryIndex(0);
  }, []);

  if (state.items.length === 0) {
    return (
      <section className="py-12">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">
          Avaliações
        </h2>
        <div className="rounded-3xl border border-cinza-suave/40 bg-branco p-8 text-center">
          <p className="text-foreground/60 mb-4">
            Este produto ainda não tem avaliações.
          </p>
          
          {/* Review eligibility */}
          <div className="p-4 rounded-2xl border border-rose-gold/25 bg-rosa-claro/30 text-center">
            {checkingReviewEligibility ? (
              <p className="text-sm text-foreground/60">Verificando elegibilidade...</p>
            ) : canReview ? (
              <button
                onClick={() => setOpenForm(true)}
                className="inline-flex items-center gap-1 text-rose-gold font-medium hover:text-rosa-blush"
              >
                <Star className="h-4 w-4" />
                Seja o primeiro a avaliar
              </button>
            ) : (
              <p className="text-xs text-foreground/50">
                Somente clientes que compraram este produto podem avaliá-lo.
              </p>
            )}
          </div>
        </div>

        {openForm && (
          <ReviewForm
            productId={productId}
            onClose={() => setOpenForm(false)}
            onSuccess={() => {
              setOpenForm(false);
              load("recent", 1);
            }}
          />
        )}
      </section>
    );
  }

  // Count reviews with media
  const reviewsWithMedia = state.items.filter(item => item.media && item.media.length > 0);

  return (
    <section className="py-12">
      {authModal}
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">
        Avaliações
      </h2>

      {/* Summary */}
      <div className="mb-8 rounded-3xl border border-cinza-suave/40 bg-branco p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-8">
          {/* Overall rating */}
          <div className="text-center">
            <p className="text-5xl font-bold text-rose-gold">
              {state.average?.toFixed(1)}
            </p>
            <div className="flex justify-center mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.round(state.average || 0) ? "text-rose-gold fill-current" : "text-foreground/20"}`}
                />
              ))}
            </div>
            <p className="text-sm text-foreground/60">
              {state.total} {state.total === 1 ? "avaliação" : "avaliações"}
            </p>
            
            {canReview && !openForm && (
              <button
                onClick={() => authGuard(() => setOpenForm(true))}
                className={`${primaryButton} mt-4 w-full`}
              >
                <Star className="h-4 w-4" />
                Escrever avaliação
              </button>
            )}

            {!canReview && !checkingReviewEligibility && (
              <p className="text-xs text-foreground/50 mt-4">
                Somente clientes que compraram este produto podem avaliá-lo.
              </p>
            )}

            {checkingReviewEligibility && (
              <p className="text-xs text-foreground/50 mt-4 animate-pulse">
                Verificando elegibilidade...
              </p>
            )}
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const stars = 5 - i;
              const count = state.distribution[String(stars)] || 0;
              const percent = distributionTotal > 0 ? (count / distributionTotal) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm text-foreground/70 w-8">{stars} estrela{stars !== 1 ? "s" : ""}</span>
                  <div className="flex-1 h-2 rounded-full bg-rosa-claro/40 overflow-hidden">
                    <div
                      className="h-full bg-rose-gold transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm text-foreground/60 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })
            }
            
            {/* Filter with media */}
            <div className="flex items-center gap-4 mt-4">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-xl border border-cinza-suave/50 bg-rosa-claro/40 px-3 py-2 text-sm text-foreground focus:border-rose-gold focus:outline-none"
              >
                <option value="recent">Mais recentes</option>
                <option value="helpful">Mais úteis</option>
                <option value="rating">Melhor avaliação</option>
                <option value="with_media">Com fotos/vídeos ({reviewsWithMedia.length})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {state.items.map((review) => (
          <ReviewItemCard
            key={review.id}
            review={review}
            onVoteHelpful={voteHelpful}
            onOpenGallery={(media, index) => openGallery(media, index)}
          />
        ))}

        {state.hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              className="rounded-full border border-rose-gold/40 bg-rosa-claro/30 px-6 py-3 text-sm font-medium text-rose-gold hover:bg-rosa-claro/50 transition-colors"
            >
              Carregar mais avaliações
            </button>
          </div>
        )}
      </div>

      {/* Review Form */}
      {openForm && canReview && (
        <ReviewForm
          productId={productId}
          onClose={() => setOpenForm(false)}
          onSuccess={() => {
            setOpenForm(false);
            load("recent", 1);
          }}
        />
      )}

      {/* Media Gallery */}
      {galleryMedia.length > 0 && (
        <ReviewMediaGallery
          media={galleryMedia}
          onClose={closeGallery}
          startIndex={galleryIndex}
        />
      )}
    </section>
  );
}
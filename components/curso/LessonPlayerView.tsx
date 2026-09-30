"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Lock,
  Play,
  AlertOctagon,
  Sparkles,
  Gift,
} from "lucide-react";
import {
  getLessonBySlug,
  getUnitOfLesson,
  getNextLesson,
  getPrevLesson,
  type CourseLesson,
} from "@/data/course";
import { useCourseProgress } from "@/lib/useCourseProgress";
import { useAuth } from "@/lib/AuthContext";
import { primaryButton, outlineButton } from "../buttonStyles";

/* ------------------------------------------------------------------ */
/* YouTube IFrame API Loader (Singleton)                              */
/* ------------------------------------------------------------------ */

type YTPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId?: string;
          host?: string;
          playerVars?: Record<string, string | number | boolean>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { target: YTPlayer; data?: number }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!ytApiPromise) {
    ytApiPromise = new Promise<void>((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve();
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });
  }
  return ytApiPromise;
}

interface Props {
  slug: string;
}

export default function LessonPlayerView({ slug }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YTPlayer | null>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const lesson = getLessonBySlug(slug);
  const unit = lesson ? getUnitOfLesson(lesson) : undefined;
  const nextLesson = getNextLesson(slug);
  const prevLesson = getPrevLesson(slug);

  const {
    isLessonCompleted,
    isLessonUnlocked,
    markCompleted,
    unmarkCompleted,
    skipLesson,
    savePosition,
    positions,
    isLoading: isProgressLoading,
  } = useCourseProgress();

  const isCompleted = isLessonCompleted(slug);
  const isUnlocked = isLessonUnlocked(slug);

  // Redirect locked lesson accessed directly
  useEffect(() => {
    if (!isProgressLoading && lesson) {
      if (!isUnlocked) {
        router.replace("/curso?bloqueada=1");
      }
    }
  }, [isProgressLoading, isUnlocked, lesson, router]);

  // Special case for known 404 test video
  useEffect(() => {
    if (lesson?.youtubeId === "PhvVvJqfV6o") {
      setHasVideoError(true);
    }
  }, [lesson?.youtubeId]);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    if (!lesson || !isUnlocked || hasVideoError) return;

    let isCancelled = false;
    setIsPlayerReady(false);

    loadYouTubeApi().then(() => {
      if (isCancelled || !playerContainerRef.current || !window.YT) return;

      try {
        const isPlaylist = lesson.type === "playlist";
        const playerVars: Record<string, string | number | boolean> = {
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        };

        if (isPlaylist) {
          playerVars.listType = "playlist";
          playerVars.list = lesson.youtubeId;
        }

        playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
          host: "https://www.youtube-nocookie.com",
          videoId: isPlaylist ? undefined : lesson.youtubeId,
          playerVars,
          events: {
            onReady: (e) => {
              setIsPlayerReady(true);
              // Resume from saved position if more than 5 seconds
              const savedSecs = positions[slug];
              if (savedSecs && savedSecs > 5 && (e.target as any).seekTo) {
                (e.target as any).seekTo(savedSecs, true);
              }
            },
            onStateChange: (e) => {
              // 0 = ENDED
              if (e.data === 0) {
                markCompleted(slug);
                setShowCelebration(true);
              }
              // Save position on pause
              if (e.data === 2 && e.target.getCurrentTime) {
                savePosition(slug, e.target.getCurrentTime());
              }
            },
            onError: () => {
              setHasVideoError(true);
            },
          },
        });
      } catch {
        setHasVideoError(true);
      }
    });

    return () => {
      isCancelled = true;
      if (playerInstanceRef.current) {
        try {
          // Save current position before destroying
          if (playerInstanceRef.current.getCurrentTime) {
            savePosition(slug, playerInstanceRef.current.getCurrentTime());
          }
          playerInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        playerInstanceRef.current = null;
      }
    };
  }, [lesson, slug, isUnlocked, hasVideoError, markCompleted, savePosition, positions]);

  const handleToggleComplete = () => {
    if (isCompleted) {
      unmarkCompleted(slug);
      setShowCelebration(false);
    } else {
      markCompleted(slug);
      setShowCelebration(true);
    }
  };

  const handleSkip = () => {
    skipLesson(slug);
    if (nextLesson) {
      router.push(`/curso/aula/${nextLesson.slug}`);
    } else {
      router.push("/curso");
    }
  };

  if (!lesson || !unit) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-foreground">Aula não encontrada</h2>
        <p className="mt-2 text-sm text-foreground/70">
          A aula solicitada não existe ou foi movida.
        </p>
        <Link
          href="/curso"
          className={`${primaryButton} mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm`}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para o curso
        </Link>
      </div>
    );
  }

  // Calculate lesson index in unit
  const currentLessonIndex = unit.lessons.findIndex((l) => l.slug === slug);
  const lessonNumber = currentLessonIndex >= 0 ? currentLessonIndex + 1 : lesson.order;
  const totalUnitLessons = unit.lessons.length;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top back breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/curso"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-rose-gold transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a trilha do curso
        </Link>

        <span className="text-xs text-foreground/60 font-medium">
          Unidade {unit.unitNumber} • {lesson.isBonus ? "Aula Bônus" : `Aula ${lessonNumber} de ${totalUnitLessons}`}
        </span>
      </div>

      {/* Logged-out notice banner */}
      {!user && (
        <div className="mb-4 rounded-xl border border-rose-gold/20 bg-branco/60 px-4 py-2.5 text-xs text-foreground/80 backdrop-blur-sm sm:flex sm:items-center sm:justify-between">
          <span>Entre na sua conta para salvar seu progresso ao concluir esta aula.</span>
          <div className="mt-2 sm:mt-0 flex gap-2">
            <Link href="/login" className="font-semibold text-rose-gold underline">
              Entrar
            </Link>
            <span>•</span>
            <Link href="/signup" className="font-semibold text-rose-gold underline">
              Criar conta
            </Link>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Video Player & Controls (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Responsive 16:9 Video Frame */}
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-cinza-suave/60 bg-[#0c080b] shadow-card-lg">
            {hasVideoError ? (
              // Unavailable video error view
              <div
                role="alert"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rosa-medio/20 text-rose-gold ring-4 ring-rosa-medio/10">
                  <AlertOctagon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Este vídeo está indisponível no momento
                </h3>
                <p className="max-w-md text-xs sm:text-sm text-foreground/70">
                  O autor original pode ter removido ou desativado a incorporação deste vídeo no YouTube.
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className={`${primaryButton} inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm shadow-card`}
                  >
                    Pular aula e continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {lesson.youtubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${lesson.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-xs`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Tentar no YouTube
                    </a>
                  )}
                </div>
              </div>
            ) : (
              // YouTube Embed Container
              <>
                {!isPlayerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0c080b] animate-pulse">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-rosa-blush/30 border-t-rosa-blush" />
                      <span className="text-xs text-foreground/50">Carregando player...</span>
                    </div>
                  </div>
                )}
                <div ref={playerContainerRef} className="h-full w-full" />
              </>
            )}
          </div>

          {/* Celebration banner upon completing video */}
          {showCelebration && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-2xl border border-rose-gold/40 bg-gradient-to-r from-rosa-claro/80 via-branco to-rosa-claro/80 p-4 shadow-card animate-fade-in-up"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    🎉 Aula concluída com sucesso!
                  </p>
                  <p className="text-xs text-foreground/75">
                    Você desbloqueou a próxima aula da sua trilha.
                  </p>
                </div>
              </div>

              {nextLesson && (
                <Link
                  href={`/curso/aula/${nextLesson.slug}`}
                  className={`${primaryButton} inline-flex items-center gap-1 px-4 py-2 text-xs shadow-sm`}
                >
                  Próxima aula <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* Navigation & Completion Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinza-suave/40 bg-branco p-4 shadow-card">
            {/* Prev button */}
            {prevLesson ? (
              <Link
                href={`/curso/aula/${prevLesson.slug}`}
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm`}
              >
                <ArrowLeft className="h-4 w-4" />
                Aula anterior
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm disabled:cursor-not-allowed disabled:opacity-30`}
              >
                <ArrowLeft className="h-4 w-4" />
                Aula anterior
              </button>
            )}

            {/* Manual complete toggle button */}
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`${
                isCompleted
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  : primaryButton
              } inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-card transition-all active:scale-95`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  Aula concluída ✓
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Marcar como concluída
                </>
              )}
            </button>

            {/* Next button */}
            {nextLesson ? (
              <Link
                href={`/curso/aula/${nextLesson.slug}`}
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm`}
              >
                Próxima aula
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/curso"
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm`}
              >
                Finalizar trilha
                <Check className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Lesson Metadata & YouTube Creator Credit */}
          <div className="rounded-2xl border border-cinza-suave/30 bg-branco/50 p-5 backdrop-blur-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-gold">
              {unit.title}
            </span>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
                {lesson.description}
              </p>
            )}

            {/* Attribution line (new tab link) */}
            <div className="mt-4 pt-3 border-t border-cinza-suave/30 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/60">
              <span>
                Vídeo de <strong className="text-rose-gold">{lesson.creator}</strong> no YouTube
              </span>
              {lesson.youtubeId && (
                <a
                  href={
                    lesson.type === "playlist"
                      ? `https://www.youtube.com/playlist?list=${lesson.youtubeId}`
                      : `https://www.youtube.com/watch?v=${lesson.youtubeId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rose-gold/80 hover:text-white underline underline-offset-2"
                >
                  Abrir no YouTube <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Compact Unit Lessons List (col-span-4) */}
        <aside
          aria-label="Aulas desta unidade"
          className="lg:col-span-4 flex flex-col gap-3"
        >
          <div className="rounded-3xl border border-cinza-suave/40 bg-branco p-4 shadow-card">
            <div className="mb-3 px-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-gold">
                Unidade {unit.unitNumber}
              </span>
              <h2 className="text-base font-bold text-foreground">
                {unit.title}
              </h2>
            </div>

            <div className="flex flex-col gap-1.5">
              {unit.lessons.map((item, idx) => {
                const itemCompleted = isLessonCompleted(item.slug);
                const itemUnlocked = isLessonUnlocked(item.slug);
                const isCurrentItem = item.slug === slug;

                if (!itemUnlocked) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-transparent p-3 text-xs text-foreground/40 bg-rosa-claro/10 cursor-not-allowed select-none"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cinza-suave/30">
                        <Lock className="h-3.5 w-3.5 text-foreground/40" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {idx + 1}. {item.title}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={`/curso/aula/${item.slug}`}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-xs transition-all ${
                      isCurrentItem
                        ? "border-rose-gold/60 bg-rosa-claro/60 text-white font-semibold shadow-sm"
                        : itemCompleted
                        ? "border-transparent bg-branco text-foreground/80 hover:bg-rosa-claro/30"
                        : "border-transparent bg-branco text-foreground hover:bg-rosa-claro/30"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        itemCompleted
                          ? "bg-gradient-to-br from-rosa-blush to-rose-gold text-white"
                          : isCurrentItem
                          ? "bg-rosa-blush text-white ring-2 ring-rosa-blush/40"
                          : "bg-cinza-suave/40 text-foreground/70"
                      }`}
                    >
                      {itemCompleted ? (
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : (
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        {idx + 1}. {item.title}
                      </p>
                    </div>
                  </Link>
                );
              })}

              {/* Bonus chest item if present */}
              {unit.bonusChest && (
                <div className="mt-2 pt-2 border-t border-cinza-suave/20">
                  {(() => {
                    const bonusSlug = unit.bonusChest.lesson.slug;
                    const bonusCompleted = isLessonCompleted(bonusSlug);
                    const bonusUnlocked = isLessonUnlocked(bonusSlug);
                    const isCurrentBonus = bonusSlug === slug;

                    if (!bonusUnlocked) {
                      return (
                        <div className="flex items-center gap-3 rounded-2xl p-3 text-xs text-foreground/40 bg-rosa-claro/10 cursor-not-allowed">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cinza-suave/30">
                            <Gift className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <span className="truncate">
                            [Bônus] {unit.bonusChest.title}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        href={`/curso/aula/${bonusSlug}`}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-xs transition-all ${
                          isCurrentBonus
                            ? "border-yellow-500/60 bg-yellow-500/10 text-white font-semibold"
                            : "border-yellow-500/30 bg-yellow-500/5 text-yellow-200 hover:bg-yellow-500/15"
                        }`}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 to-amber-400 text-white">
                          <Gift className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">
                          [Bônus] {unit.bonusChest.title}
                        </span>
                      </Link>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

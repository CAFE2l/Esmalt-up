"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
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
  type CourseUnit,
} from "@/data/course";
import { useCourseProgress } from "@/lib/useCourseProgress";
import { useAuth } from "@/lib/AuthContext";
import { primaryButton, outlineButton } from "../buttonStyles";
import { useAuthGate } from "@/components/AuthGateModal";

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

/* ------------------------------------------------------------------ */
/* UnitSidebar                                                         */
/* ------------------------------------------------------------------ */

interface UnitSidebarProps {
  unit: CourseUnit;
  currentSlug: string;
  isLessonCompleted: (slug: string) => boolean;
  isLessonUnlocked: (slug: string) => boolean;
}

function UnitSidebar({ unit, currentSlug, isLessonCompleted, isLessonUnlocked }: UnitSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement | HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(true);

  const publishedLessons = unit.lessons.filter((l) => l.status !== "coming_soon");
  const doneCount = publishedLessons.filter((l) => isLessonCompleted(l.slug)).length;
  const totalCount = publishedLessons.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Scroll active lesson into view inside the list only (never the page).
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current as HTMLElement | null;
    if (!list || !active) return;
    const listTop = list.scrollTop;
    const listBottom = listTop + list.clientHeight;
    const elTop = active.offsetTop;
    const elBottom = elTop + active.offsetHeight;
    if (elTop < listTop || elBottom > listBottom) {
      list.scrollTo({ top: elTop - list.clientHeight / 2 + active.offsetHeight / 2, behavior: "smooth" });
    }
  }, [currentSlug]);

  const header = (
    <div className="px-4 pt-4 pb-3">
      {/* Unit badge */}
      <span className="inline-flex items-center rounded-full bg-rosa-blush/20 px-3 py-0.5 text-[11px] font-black uppercase tracking-widest text-rose-gold">
        Unidade {unit.unitNumber} de 5
      </span>
      <h2 className="mt-1.5 text-base font-bold leading-snug text-foreground">
        {unit.title}
      </h2>
      {/* Unit progress bar */}
      <div className="mt-2.5">
        <div className="mb-1 flex items-center justify-between text-[11px] text-foreground/60">
          <span>{doneCount} de {totalCount} aulas concluídas</span>
          <span className="font-semibold text-rose-gold">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cinza-suave/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );

  const lessonList = (
    <div
      ref={listRef}
      className="flex flex-col gap-0.5 overflow-y-auto px-3 pb-3"
      style={{ maxHeight: "min(60vh, 480px)" }}
    >
      {unit.lessons.map((item, idx) => {
        const itemCompleted = isLessonCompleted(item.slug);
        const itemUnlocked = isLessonUnlocked(item.slug);
        const isCurrentItem = item.slug === currentSlug;
        const isComingSoon = item.status === "coming_soon";

        const baseRow = "relative flex items-center gap-3 rounded-xl py-2.5 pr-3 text-xs transition-colors duration-150";
        const accentBar = isCurrentItem
          ? "pl-3 border-l-2 border-rose-gold"
          : "pl-3 border-l-2 border-transparent";

        if (!itemUnlocked || isComingSoon) {
          return (
            <div
              key={item.id}
              className={`${baseRow} ${accentBar} cursor-not-allowed select-none bg-rosa-claro/5 text-foreground/35`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cinza-suave/20">
                <Lock className="h-3 w-3" />
              </div>
              <span className="min-w-0 flex-1 truncate">
                {idx + 1}. {item.title}
                {isComingSoon && (
                  <span className="ml-1.5 rounded-full bg-cinza-suave/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                    Em breve
                  </span>
                )}
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={`/curso/aula/${item.slug}`}
            aria-current={isCurrentItem ? "step" : undefined}
            ref={isCurrentItem ? (activeRef as React.RefObject<HTMLAnchorElement>) : undefined}
            className={`${baseRow} ${accentBar} ${
              isCurrentItem
                ? "bg-rosa-claro/40 font-semibold text-foreground"
                : itemCompleted
                ? "text-foreground/70 hover:bg-rosa-claro/20"
                : "text-foreground hover:bg-rosa-claro/20"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosa-blush`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                itemCompleted
                  ? "bg-gradient-to-br from-rosa-blush to-rose-gold text-white"
                  : isCurrentItem
                  ? "bg-rosa-blush text-white"
                  : "bg-cinza-suave/30 text-foreground/60"
              }`}
            >
              {itemCompleted ? (
                <Check className="h-3 w-3 stroke-[2.5]" />
              ) : (
                <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
              )}
            </div>
            <span className="min-w-0 flex-1 line-clamp-2 leading-snug">
              {idx + 1}. {item.title}
            </span>
          </Link>
        );
      })}

      {/* Bonus chest row */}
      {unit.bonusChest && (() => {
        const bonusSlug = unit.bonusChest.lesson.slug;
        const bonusUnlocked = isLessonUnlocked(bonusSlug);
        const isCurrentBonus = bonusSlug === currentSlug;
        const baseRow2 = "relative flex items-center gap-3 rounded-xl py-2.5 pr-3 text-xs transition-colors duration-150";
        const accentBar2 = isCurrentBonus
          ? "pl-3 border-l-2 border-yellow-500"
          : "pl-3 border-l-2 border-transparent";

        if (!bonusUnlocked) {
          return (
            <div className={`mt-1 border-t border-cinza-suave/20 pt-1`}>
              <div className={`${baseRow2} ${accentBar2} cursor-not-allowed text-foreground/35 bg-rosa-claro/5`}>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cinza-suave/20">
                  <Gift className="h-3 w-3" />
                </div>
                <span className="min-w-0 flex-1 truncate">[Bônus] {unit.bonusChest.title}</span>
              </div>
            </div>
          );
        }
        return (
          <div className="mt-1 border-t border-cinza-suave/20 pt-1">
            <Link
              href={`/curso/aula/${bonusSlug}`}
              aria-current={isCurrentBonus ? "step" : undefined}
              ref={isCurrentBonus ? (activeRef as React.RefObject<HTMLAnchorElement>) : undefined}
              className={`${baseRow2} ${accentBar2} ${
                isCurrentBonus
                  ? "bg-yellow-500/10 font-semibold text-yellow-200"
                  : "text-yellow-300/80 hover:bg-yellow-500/10"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 to-amber-400 text-white">
                <Gift className="h-3 w-3" />
              </div>
              <span className="min-w-0 flex-1 truncate">[Bônus] {unit.bonusChest.title}</span>
            </Link>
          </div>
        );
      })()}
    </div>
  );

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <aside
        aria-label="Aulas desta unidade"
        className="hidden lg:col-span-4 lg:flex lg:flex-col"
        style={{ position: "sticky", top: "5rem", alignSelf: "flex-start" }}
      >
        <div className="rounded-3xl border border-cinza-suave/40 bg-branco shadow-card overflow-hidden">
          {header}
          <div className="border-t border-cinza-suave/20" />
          {lessonList}
        </div>
      </aside>

      {/* Mobile: collapsible section below video */}
      <div className="lg:hidden col-span-1">
        <div className="rounded-3xl border border-cinza-suave/40 bg-branco shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-rosa-blush/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-gold">
                Unidade {unit.unitNumber}
              </span>
              <span className="text-sm font-semibold text-foreground">{unit.title}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-200 ${
                mobileOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {mobileOpen && (
            <>
              <div className="border-t border-cinza-suave/20" />
              <div className="px-4 pb-2 pt-2">
                <div className="mb-1 flex items-center justify-between text-[11px] text-foreground/60">
                  <span>{doneCount} de {totalCount} aulas concluídas</span>
                  <span className="font-semibold text-rose-gold">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-cinza-suave/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="border-t border-cinza-suave/20" />
              {lessonList}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function LessonPlayerView({ slug }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { guard: authGuard, modal: authModal } = useAuthGate(
    user,
    "Faça login para salvar seu progresso e concluir aulas.",
  );
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
        // YT.Player replaces the element it is given with an iframe. Never pass
        // a React-owned node, or React will crash with insertBefore errors when
        // it reconciles the tree. Mount on a fresh node instead.
        const mountEl = document.createElement("div");
        mountEl.className = "h-full w-full";
        playerContainerRef.current.appendChild(mountEl);

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

        playerInstanceRef.current = new window.YT.Player(mountEl, {
          host: "https://www.youtube-nocookie.com",
          videoId: isPlaylist ? undefined : lesson.youtubeId,
          playerVars,
          events: {
            onReady: (e) => {
              setIsPlayerReady(true);
              // Resume from saved position if more than 5 seconds
              const savedSecs = positions[slug];
              if (savedSecs && savedSecs > 5 && (e.target as unknown as { seekTo: (s: number, u?: boolean) => void }).seekTo) {
                (e.target as unknown as { seekTo: (s: number, u?: boolean) => void }).seekTo(savedSecs, true);
              }
            },
            onStateChange: (e) => {
              // 0 = ENDED
              if (e.data === 0) {
                if (user) {
                  markCompleted(slug);
                  setShowCelebration(true);
                } else {
                  setShowCelebration(true); // show banner but don't save
                }
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
      // Remove any imperatively-added iframe/mount node so React owns a clean tree.
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = "";
      }
    };
  }, [lesson, slug, isUnlocked, hasVideoError, markCompleted, savePosition, positions]);

  const handleToggleComplete = () => {
    authGuard(() => {
      if (isCompleted) {
        unmarkCompleted(slug);
        setShowCelebration(false);
      } else {
        markCompleted(slug);
        setShowCelebration(true);
      }
    });
  };

  const handleSkip = () => {
    authGuard(() => {
      skipLesson(slug);
      if (nextLesson) {
        router.push(`/curso/aula/${nextLesson.slug}`);
      } else {
        router.push("/curso");
      }
    });
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
      {authModal}
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
              aria-pressed={isCompleted}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold shadow-card transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isCompleted
                  ? "border border-emerald-600/40 bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900/80 focus-visible:ring-emerald-500"
                  : `${primaryButton} focus-visible:ring-rosa-blush`
              }`}
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

        {/* Right Column: Unit Sidebar (col-span-4) */}
        <UnitSidebar
          unit={unit}
          currentSlug={slug}
          isLessonCompleted={isLessonCompleted}
          isLessonUnlocked={isLessonUnlocked}
        />
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, useEffect, useCallback, type PointerEvent } from "react";
import type { CourseLesson } from "@/lib/courseData";

export const COMPLETION_THRESHOLD = 0.95;

export function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* YouTube IFrame Player API types                                      */
/* ------------------------------------------------------------------ */

type YTPlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: {
        videoId: string;
        playerVars?: Record<string, string | number | boolean>;
        events?: {
          onReady?: (e: { target: YTPlayer }) => void;
          onStateChange?: (e: { target: YTPlayer; data?: number }) => void;
          onError?: (e: { data: number }) => void;
        };
      }) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function ensureYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!ytApiPromise) {
    ytApiPromise = new Promise<void>((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve();
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    });
  }
  return ytApiPromise;
}

function extractVideoId(url: string): string {
  const m = url.match(/\/embed\/([\w-]{11})/);
  return m?.[1] ?? "";
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function CompletionPill({ isComplete, pct }: { isComplete: boolean; pct: number }) {
  if (isComplete) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rosa-claro/40 px-3 py-1 text-xs font-semibold text-rose-gold">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M9 16.2L4.8 12l-.8.8L9 18 21 6l-.8-.8z" /></svg>
        Aula concluída ✓
      </span>
    );
  }
  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cinza-suave/30 px-3 py-1 text-xs text-foreground/60">
        Faltam {Math.round((1 - pct) * 100)}% para concluir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cinza-suave/30 px-3 py-1 text-xs text-foreground/60">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
      Assista até o fim para concluir
    </span>
  );
}

function LessonMeta({ cl, videoId }: { cl: CourseLesson; videoId: string }) {
  return (
    <div className="px-1">
      <h3 className="font-semibold text-foreground">{cl.lesson.title}</h3>
      <p className="mt-1 text-sm text-foreground/70">{cl.lesson.description}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {cl.lesson.channel && cl.lesson.channel !== "Esmalt'up" && (
          <p className="text-xs text-foreground/50">
            vídeo por <span className="font-medium text-rose-gold">{cl.lesson.channel}</span>
          </p>
        )}
        {videoId && (
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-rose-gold/70 underline-offset-2 hover:underline"
          >
            Ver no YouTube ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Slider({ value, ready, onSeek }: { value: number; ready: boolean; onSeek: (p: number) => void }) {
  const [active, setActive] = useState(false);
  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    const el = e.currentTarget;
    const pct = Math.max(0, Math.min(1, (e.clientX - el.getBoundingClientRect().left) / el.offsetWidth));
    onSeek(pct);
  };
  return (
    <div
      role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
      onPointerDown={(e) => { setActive(true); track(e); }}
      onPointerMove={active && ready ? track : undefined}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      onKeyDown={(e) => {
        if (!ready) return;
        if (e.key === "ArrowRight") { e.preventDefault(); onSeek(Math.min(1, value + 0.05)); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); onSeek(Math.max(0, value - 0.05)); }
      }}
      className="relative cursor-pointer rounded-full"
      style={{ height: 6, width: "100%" }}
    >
      <div className="absolute inset-0 h-1.5 rounded-full bg-cinza-suave/40" />
      <div className="absolute inset-y-0 left-0 rounded-full bg-rose-gold" style={{ width: `${value * 100}%` }}>
        <div className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-gold shadow ring-2 ring-white/30 transition-opacity ${active ? "h-4 w-4 opacity-100" : "h-3 w-3 opacity-0 hover:opacity-100"}`} style={{ left: "100%" }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5-second auto-advance countdown                                     */
/* ------------------------------------------------------------------ */

function AutoAdvanceCountdown({ onGo, onCancel }: { onGo: () => void; onCancel: () => void }) {
  const [secs, setSecs] = useState(5);
  useEffect(() => {
    if (secs <= 0) { onGo(); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onGo]);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-cinza-suave/40 bg-branco px-4 py-3 shadow-card">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-rose-gold"><path d="M8 5v14l11-7z" /></svg>
      <span className="flex-1 text-sm text-foreground">
        Próxima aula em <span className="font-bold text-rose-gold">{secs}s</span>…
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-cinza-suave/50 px-3 py-1 text-xs text-foreground/70 hover:bg-rosa-claro/20"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onGo}
        className="rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-3 py-1 text-xs font-semibold text-white"
      >
        Ir agora
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Text-only intro lesson                                              */
/* ------------------------------------------------------------------ */

function TextLesson({ cl, onComplete }: { cl: CourseLesson; onComplete: () => void }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-cinza-suave/40 bg-branco p-6 shadow-card sm:p-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-rose-gold">Introdução</span>
        <h2 className="mt-2 text-2xl font-bold text-foreground">{cl.lesson.title}</h2>
        <p className="mt-3 text-foreground/70">{cl.lesson.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { n: "Mundo 1", d: "Fundamentos, higiene e esterilização" },
          { n: "Mundo 2", d: "Preparação da unha e cutilagem" },
          { n: "Mundo 3", d: "Esmaltação e acabamento" },
          { n: "Mundo 4", d: "Gel, fibra de vidro e técnicas avançadas" },
        ].map((m) => (
          <div key={m.n} className="rounded-xl border border-cinza-suave/40 bg-rosa-claro/20 px-4 py-3">
            <p className="text-sm font-semibold text-rose-gold">{m.n}</p>
            <p className="text-xs text-foreground/60">{m.d}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onComplete}
        className="self-start rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-6 py-2.5 text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-card-lg"
      >
        Começar curso →
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* YouTube player                                                      */
/* ------------------------------------------------------------------ */

interface Props {
  lesson: CourseLesson;
  watched: boolean;
  onWatched: () => void;
  /** Resume position in seconds (from saved progress). */
  resumePosition?: number;
  /** Called every ~10s and on pause with the current position. */
  onPositionChange?: (seconds: number) => void;
  /** Called when the video ends and the user should advance. */
  onEnded?: () => void;
}

function YouTubePlayer({ lesson, watched, onWatched, resumePosition, onPositionChange, onEnded }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const firedRef = useRef(false);
  const lastSavedRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);

  const videoId = extractVideoId(lesson.lesson.videoUrl);

  useEffect(() => { firedRef.current = watched; }, [watched]);

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;
    firedRef.current = false;
    lastSavedRef.current = 0;
    setReady(false); setPlaying(false); setMuted(false);
    setProgress(0); setCurrentTime(0); setDuration(0); setError(false);

    ensureYTApi().then(() => {
      if (cancelled || !holderRef.current || !window.YT) return;
      const yt = window.YT;
      player = new yt.Player(holderRef.current, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            setReady(true);
            const d = e.target.getDuration();
            if (d) setDuration(d);
            // Resume from saved position.
            if (resumePosition && resumePosition > 5) {
              e.target.seekTo(resumePosition, true);
            }
          },
          onStateChange: (e) => {
            if (!window.YT) return;
            const isPlaying = e.data === yt.PlayerState.PLAYING;
            setPlaying(isPlaying);
            // Save position on pause.
            if (e.data === yt.PlayerState.PAUSED) {
              const t = e.target.getCurrentTime();
              onPositionChange?.(t);
              lastSavedRef.current = t;
            }
            if (e.data === yt.PlayerState.ENDED && !firedRef.current) {
              firedRef.current = true;
              onWatched();
              onEnded?.();
            }
          },
          onError: () => setError(true),
        },
      });
    });

    return () => {
      cancelled = true;
      try { player?.destroy(); } catch { /* noop */ }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Poll at 500ms: update progress bar + auto-complete + save position every 10s.
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const d = p.getDuration();
      const t = p.getCurrentTime();
      if (d > 0) {
        setDuration(d); setCurrentTime(t);
        const ratio = t / d;
        setProgress(Math.min(1, Math.max(0, ratio)));
        if (!firedRef.current && ratio >= COMPLETION_THRESHOLD) {
          firedRef.current = true;
          onWatched();
        }
        // Save position every ~10s.
        if (t - lastSavedRef.current >= 10) {
          lastSavedRef.current = t;
          onPositionChange?.(t);
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, videoId]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo(); else p.playVideo();
  };
  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.unMute(); else p.mute();
    setMuted(!muted);
  };
  const handleSeek = (pct: number) => {
    const p = playerRef.current;
    if (p && ready && duration) p.seekTo(pct * duration, true);
  };
  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  };

  const isComplete = watched || firedRef.current;

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative flex aspect-video flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-cinza-suave/50 bg-[#0a0709]">
          {lesson.lesson.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.lesson.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <p className="relative text-sm text-foreground/60">Este vídeo não pode ser incorporado.</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-5 py-2 text-sm font-semibold text-white"
          >
            Assistir no YouTube ↗
          </a>
          {!isComplete && (
            <button
              type="button"
              onClick={onWatched}
              className="relative rounded-full border border-rose-gold/50 px-4 py-1.5 text-xs text-rose-gold hover:bg-rosa-claro/20"
            >
              Marcar como concluída
            </button>
          )}
        </div>
        <LessonMeta cl={lesson} videoId={videoId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!ready && (
        <div className="aspect-video animate-pulse rounded-2xl bg-cinza-suave/20" />
      )}
      <div
        ref={containerRef}
        className={`group relative isolate overflow-hidden rounded-2xl border border-cinza-suave/50 bg-[#0a0709] shadow-card ${!ready ? "hidden" : ""}`}
      >
        <div className="relative aspect-video bg-[#0a0709]">
          <div ref={holderRef} className="h-full w-full" />

          {!playing && ready && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <button
                type="button" onClick={togglePlay} aria-label="Reproduzir"
                className="pointer-events-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow-card-lg ring-2 ring-white/20 transition-transform hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><polygon points="9 6 9 18 18 12z" /></svg>
              </button>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-1 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"} className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold">
              {playing
                ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><polygon points="10 6 10 18 18 12z" /></svg>
              }
            </button>
            <Slider value={progress} ready={ready} onSeek={handleSeek} />
            <span className="tabular-nums text-xs text-foreground/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={toggleMute} aria-label={muted ? "Desmutar" : "Mutar"} className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold">
                {muted
                  ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16.5 12c0-1.77-.73-3.37-1.91-4.5l1.42-1.42A8.955 8.955 0 0 1 18 12c0 1.93-.7 3.68-1.88 5l1.42 1.42A8.993 8.993 0 0 1 16.5 12z" /><path d="M4.22 3.72L3 4.94l4.5 4.5C7.17 10.87 7 11.42 7 12c0 1.06.23 2.05.65 2.92l1.66 1.66A4.91 4.91 0 0 0 4.22 3.72z" /></svg>
                  : <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M3 9v6h4l5 5V4L7 9H3z" /><path d="M16.5 12c0-1.1.3-2.13.82-3l-1.17.74.15.19A4.97 4.97 0 0 1 15 12c0 .83-.15 1.55-.4 2.13l1.17 1.17c.5-.25 1.03-.68 1.57-1.23l.16.16z" /></svg>
                }
              </button>
              <button type="button" onClick={handleFullscreen} aria-label="Tela cheia" className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" /><path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="px-2 py-2">
          <CompletionPill isComplete={isComplete} pct={progress} />
        </div>
      </div>
      <LessonMeta cl={lesson} videoId={videoId} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public export                                                       */
/* ------------------------------------------------------------------ */

export default function CursoVideoPlayer({
  lesson,
  watched,
  onWatched,
  resumePosition,
  onPositionChange,
  onEnded,
}: Props) {
  const isText = (lesson.lesson as { kind?: string }).kind === "text";
  if (isText) {
    return <TextLesson cl={lesson} onComplete={onWatched} />;
  }
  return (
    <YouTubePlayer
      lesson={lesson}
      watched={watched}
      onWatched={onWatched}
      resumePosition={resumePosition}
      onPositionChange={onPositionChange}
      onEnded={onEnded}
    />
  );
}

export { AutoAdvanceCountdown };

"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type RefObject,
  type PointerEvent,
} from "react";
import type { CourseLesson } from "@/lib/courseData";

export const COMPLETION_THRESHOLD = 0.95;

/** Convert seconds -> "mm:ss". */
export function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface Props {
  lesson: CourseLesson;
  /** Whether this lesson has been watched to the threshold (persisted). */
  watched: boolean;
  /** Raised once when playback reaches the threshold this session. */
  onWatched: () => void;
}

function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement>,
  onWatched: () => void,
  lessonId: string,
) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0); // 0..1
  const [buffered, setBuffered] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
      const [watchedFired, setWatchedFired] = useState(false);

  // Reset transient playback state whenever the lesson changes, so the
  // completion gate applies to the CURRENT lesson only and onWatched can
  // fire once per lesson per session.
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.load();
      v.playbackRate = playbackRate;
    }
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setBuffered(0);
    setShowSettings(false);
    setShowSpeed(false);
    setWatchedFired(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.duration ? v.currentTime / v.duration : 0;
    setProgress(p);
    setCurrentTime(v.currentTime);

    if (!watchedFired && p >= COMPLETION_THRESHOLD) {
      setWatchedFired(true);
      onWatched();
    }
  }, [videoRef, onWatched, watchedFired]);

  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setReady(true);
  }, [videoRef]);

  const onProgress = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.buffered.length) return;
    setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration);
  }, [videoRef]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      v.play();
      setPlaying(true);
    }
  };

    const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
    if (!muted) setVolume(v.volume);
  };

  const setSpeed = (rate: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
        setPlaybackRate(rate);
    setShowSettings(false);
  };

  return {
    state: {
      playing,
      muted,
      volume,
      progress,
      buffered,
      duration,
      currentTime,
      ready,
            showSettings,
      playbackRate,
      captionsOn,
      watchedFired,
    },
    handlers: {
      onTimeUpdate,
      onLoadedMetadata,
      onProgress,
      togglePlay,
      toggleMute,
            setSpeed,
      setPlaying,
      setShowSettings,
      setCaptionsOn,
    },
  };
}

export default function CursoVideoPlayer({
  lesson,
  watched,
  onWatched,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const p = useVideoPlayer(videoRef, onWatched, lesson.lesson.id);
  const s = p.state;
  const h = p.handlers;

  // Sync captions <track> on/off (read the live track list from the element,
  // not a possibly-stale render-time snapshot).
  useEffect(() => {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = s.captionsOn ? "showing" : "hidden";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.captionsOn, lesson.lesson.id]);

  const handleSeek = (pct: number) => {
    const v = videoRef.current;
    if (v && s.ready) v.currentTime = pct * s.duration;
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

      const isComplete = watched || s.watchedFired;

      return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="group relative isolate overflow-hidden rounded-2xl border border-cinza-suave/50 bg-[#0a0709] shadow-card"
      >
        <div className="relative aspect-video bg-[#0a0709]">
          <video
            ref={videoRef}
            src={lesson.lesson.videoUrl}
            preload="metadata"
            playsInline
            onTimeUpdate={h.onTimeUpdate}
            onLoadedMetadata={h.onLoadedMetadata}
            onProgress={h.onProgress}
            onPlay={() => h.setPlaying(true)}
            onPause={() => h.setPlaying(false)}
            className="h-full w-full object-contain"
          >
            <track
              kind="captions"
              src="/esmaltup-captions.vtt"
              srcLang="pt-BR"
              label="Português"
              default
            />
          </video>

          {/* Play / pause overlay when paused */}
          {!s.playing && s.ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <button
                type="button"
                onClick={h.togglePlay}
                aria-label="Reproduzir"
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow-card-lg ring-2 ring-white/20 transition-transform hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <polygon points="9 6 9 18 18 12z" />
                </svg>
              </button>
            </div>
          )}

          {/* Bottom control bar — reveals on hover */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-1 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={h.togglePlay}
              aria-label={s.playing ? "Pausar" : "Reproduzir"}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold"
            >
              {s.playing ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <polygon points="10 6 10 18 18 12z" />
                </svg>
              )}
            </button>

            <Slider
              value={s.progress}
              buffered={s.buffered}
              ready={s.ready}
              onSeek={handleSeek}
            />

                        {/* Time */}
            <span className="tabular-nums text-xs text-foreground/80">
              {formatTime(s.currentTime)} / {formatTime(s.duration)}
            </span>

            <div className="ml-auto flex items-center gap-1">
              {/* Mute / unmute */}
              <button
                type="button"
                onClick={h.toggleMute}
                aria-label={s.muted ? "Desmutar" : "Mutar"}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold"
              >
                {s.muted || s.volume === 0 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M16.5 12c0-1.77-.73-3.37-1.91-4.5l1.42-1.42A8.955 8.955 0 0 1 18 12c0 1.93-.7 3.68-1.88 5l1.42 1.42A8.993 8.993 0 0 1 16.5 12z" />
                    <path d="M4.22 3.72L3 4.94l4.5 4.5C7.17 10.87 7 11.42 7 12c0 1.06.23 2.05.65 2.92l1.66 1.66A4.91 4.91 0 0 0 4.22 3.72z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M3 9v6h4l5 5V4L7 9H3z" />
                    <path d="M16.5 12c0-1.1.3-2.13.82-3l-1.17.74.15.19A4.97 4.97 0 0 1 15 12c0 .83-.15 1.55-.4 2.13l1.17 1.17c.5-.25 1.03-.68 1.57-1.23l.16.16z" />
                  </svg>
                )}
              </button>

              {/* Captions on/off */}
              <button
                type="button"
                onClick={() => h.setCaptionsOn((c) => !c)}
                aria-label="Legendas"
                aria-pressed={s.captionsOn}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold ${
                  s.captionsOn ? "text-rose-gold" : ""
                }`}
                title="Legendas (pt-BR)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <rect x="4" y="7" width="16" height="2" rx="1" />
                  <rect x="4" y="12" width="12" height="2" rx="1" />
                  <rect x="8" y="17" width="8" height="2" rx="1" />
                </svg>
              </button>
                            {/* Settings: playback speed */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => h.setShowSettings((o) => !o)}
                  aria-label="Configurações"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m-4.24 7.52L8.46 19.76M23 12h-6m-10 0H1" />
                  </svg>
                </button>
                {s.showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-36 rounded-xl border border-cinza-suave/50 bg-branco py-1 shadow-card-lg">
                    <div className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-gold">
                      Velocidade
                    </div>
                    {SPEED_OPTIONS.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => h.setSpeed(rate)}
                        className={`block w-full px-3 py-1.5 text-left text-sm text-foreground/80 hover:bg-rosa-claro/40 hover:text-rose-gold ${
                          s.playbackRate === rate
                            ? "bg-rosa-claro/30 font-semibold text-rose-gold"
                            : ""
                        }`}
                      >
                        {rate === 1 ? "Normal (1x)" : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="Tela cheia"
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition-colors hover:text-rose-gold"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m0 0V5a2 2 0 0 1 2-2h3m0 0L3 3" />
                  <path d="M16 3h3a2 2 0 0 1 2 2v3m0 0V5a2 2 0 0 1-2-2h-3m0 0L21 3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Completion-gate signal */}
        <div className="px-2 py-2">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rosa-claro/40 px-3 py-1 text-xs font-semibold text-rose-gold">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <circle cx="12" cy="7.5" r="4.5" />
                <path d="M2 18.5c3-4 6-6 10-6s7 2 10 6" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              Assistido — você pode concluir a aula
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cinza-suave/30 px-3 py-1 text-xs text-foreground/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Assista até o fim para concluir
            </span>
          )}
        </div>
      </div>

      {/* Lesson meta */}
      <div className="px-1">
        <h3 className="font-semibold text-foreground">{lesson.lesson.title}</h3>
        <p className="mt-1 text-sm text-foreground/70">
          {lesson.lesson.description}
        </p>
      </div>
    </div>
  );
}
/** Glossy scrub slider: click to seek, drag to scrub. */
function Slider({
  value,
  buffered,
  ready,
  onSeek,
}: {
  value: number; // 0..1 played
  buffered: number; // 0..1 buffered
  ready: boolean;
  onSeek: (pct: number) => void;
}) {
  const [active, setActive] = useState(false);
    const track = (e: PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    const el = e.currentTarget;
    const pct = Math.max(0, Math.min(1, (e.clientX - el.getBoundingClientRect().left) / el.offsetWidth));
    onSeek(pct);
  };

  return (
    <div
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${Math.round(value * 100)}%`}
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
      className="relative -translate-y-0.5 cursor-pointer rounded-full bg-cinza-suave/40"
      style={{ height: 6, width: "100%" }}
    >
      <div className="absolute inset-0 h-1.5 rounded-full bg-cinza-suave/40">
        <div className="h-1.5 rounded-full bg-white/20" style={{ width: `${buffered * 100}%` }} />
      </div>
      <div className="absolute inset-y-0 left-0 rounded-full bg-rose-gold" style={{ width: `${value * 100}%` }}>
        <div
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-gold shadow ring-2 ring-white/30 transition-opacity ${active ? "h-4 w-4 opacity-100" : "h-3 w-3 opacity-0 hover:opacity-100"}`}
          style={{ left: "100%" }}
        />
      </div>
    </div>
  );
}



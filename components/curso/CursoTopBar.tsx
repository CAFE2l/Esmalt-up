"use client";

import { useAuth } from "@/lib/AuthContext";
import { outlineButton } from "@/components/buttonStyles";

interface Props {
  progressPercent: number;
  completedCount: number;
  totalLessons: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M5 12h14M9 5l7 7-7 7" />
    </svg>
  );
}

function UserAvatar() {
  const { user } = useAuth();
  const initials =
    user?.displayName
      ? user.displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";
  return (
    <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-xs font-bold text-white shadow">
        {user?.photoURL ? (
          <span
            className="h-full w-full rounded-full bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url("${user.photoURL}")` }}
          />
        ) : (
          initials || "U"
        )}
      </span>
      <span className="hidden text-sm font-medium text-foreground/80 sm:inline-block">
        {user?.displayName || "Convidado"}
      </span>
    </div>
  );
}

export default function CursoTopBar({
  progressPercent,
  completedCount,
  totalLessons,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <header className="flex flex-col gap-4 border-b border-cinza-suave/40 bg-branco px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* Progress summary */}
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold tracking-widest text-rose-gold">
            {progressPercent}% COMPLETO
          </span>
          <span className="hidden text-sm text-foreground/60 sm:inline">
            {completedCount}/{totalLessons} Passos
          </span>
        </div>

                {/* Lesson navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={`${outlineButton} inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-2`}
          >
            <ArrowLeft />
            <span>Aula Anterior</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className={`${outlineButton} inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-2`}
          >
            <span>Próxima Aula</span>
            <ArrowRight />
          </button>
        </div>

        {/* User avatar */}
        <UserAvatar />
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="relative h-2.5 w-full max-w-md rounded-full bg-cinza-suave/30">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold shadow"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <span className="text-xs font-medium text-foreground/70">
          {completedCount}/{totalLessons}
        </span>
      </div>
    </header>
  );
}

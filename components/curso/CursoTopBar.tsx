"use client";

interface Props {
  progressPercent: number;
  completedCount: number;
  totalLessons: number;
}

export default function CursoTopBar({ progressPercent, completedCount, totalLessons }: Props) {
  return (
    <header className="border-b border-cinza-suave/40 bg-branco px-4 py-3 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold tracking-widest text-rose-gold">
          {progressPercent}% COMPLETO
        </span>
        <span className="hidden text-sm text-foreground/60 sm:inline">
          {completedCount}/{totalLessons} aulas
        </span>
        <div className="relative h-2 flex-1 max-w-xs rounded-full bg-cinza-suave/30">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>
    </header>
  );
}

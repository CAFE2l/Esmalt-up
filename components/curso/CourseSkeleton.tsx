"use client";

export default function CourseSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando trilha do curso..."
      className="mx-auto flex max-w-xl flex-col items-center px-4 py-8 animate-pulse"
    >
      {/* Top summary bar skeleton */}
      <div className="w-full rounded-2xl border border-cinza-suave/40 bg-branco/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-cinza-suave/50" />
            <div className="h-2.5 w-48 rounded-full bg-cinza-suave/40" />
          </div>
          <div className="h-9 w-40 rounded-full bg-cinza-suave/50" />
        </div>
      </div>

      {/* Unit 1 banner skeleton */}
      <div className="mt-8 w-full rounded-2xl border border-cinza-suave/40 bg-branco/50 p-5 shadow-sm">
        <div className="h-3 w-20 rounded bg-rosa-blush/30" />
        <div className="mt-2 h-6 w-56 rounded bg-cinza-suave/50" />
        <div className="mt-1.5 h-3.5 w-72 rounded bg-cinza-suave/30" />
      </div>

      {/* Zig-zag node skeletons */}
      <div className="mt-10 flex flex-col items-center gap-12">
        <div className="h-20 w-20 rounded-full bg-cinza-suave/50 shadow-inner" />
        <div className="-translate-x-10 h-20 w-20 rounded-full bg-cinza-suave/40 shadow-inner" />
        <div className="h-20 w-20 rounded-full bg-cinza-suave/40 shadow-inner" />
        <div className="translate-x-10 h-20 w-20 rounded-full bg-cinza-suave/40 shadow-inner" />
        <div className="h-20 w-20 rounded-full bg-cinza-suave/30 shadow-inner" />
      </div>

      <span className="sr-only">Carregando o curso...</span>
    </div>
  );
}

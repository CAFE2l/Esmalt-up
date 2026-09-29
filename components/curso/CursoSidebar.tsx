"use client";

import { useEffect, useRef } from "react";
import { COURSE_LESSONS, type Module } from "@/lib/courseData";
import { formatDuration } from "@/lib/course/youtube";

export interface Props {
  currentLessonId: string;
  completed: Record<string, boolean>;
  watched: Record<string, boolean>;
  expandedModule: string | null;
  /** Mobile: whether the drawer is open. Desktop: whether the sidebar is collapsed. */
  collapsed: boolean;
  onSelectLesson: (id: string) => void;
  onToggleModule: (id: string) => void;
  onToggleCollapse: () => void;
}

const ChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
    <path d="M18 15L12 9l-6 6" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const CheckIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 16.2L4.8 12l-.8.8L9 18 21 6l-.8-.8z" />
  </svg>
);
const PlayIcon = ({ className = "h-2.5 w-2.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

function lessonIndicator(completed: boolean, current: boolean) {
  if (completed)
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow">
        <CheckIcon />
      </div>
    );
  if (current)
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rosa-blush text-white shadow">
        <PlayIcon />
      </div>
    );
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-cinza-suave/50 text-rose-gold/70">
      <PlayIcon />
    </div>
  );
}

function SidebarContent({
  currentLessonId,
  completed,
  watched,
  expandedModule,
  onSelectLesson,
  onToggleModule,
  onClose,
}: Omit<Props, "collapsed" | "onToggleCollapse"> & { onClose?: () => void }) {
  const modules = COURSE_LESSONS.reduce<Record<string, Module>>((acc, c) => {
    if (!acc[c.module.id]) acc[c.module.id] = c.module;
    return acc;
  }, {});
  const moduleList = Object.values(modules);

  // Build a global lesson index map for numbering (moduleIndex.lessonIndex).
  const lessonNumbers: Record<string, string> = {};
  moduleList.forEach((mod, mi) => {
    const lessons = mod.lessons.slice().sort((a, b) => a.order - b.order);
    lessons.forEach((l, li) => {
      lessonNumbers[l.id] = `${mi + 1}.${li + 1}`;
    });
  });

  const moduleCompleted = (m: Module) => m.lessons.every((l) => !!completed[l.id]);
  const moduleCompletedCount = (m: Module) => m.lessons.filter((l) => !!completed[l.id]).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cinza-suave/40 px-4 py-3">
        <h1 className="text-base font-bold tracking-tight text-rose-gold">Curso Preparatório</h1>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/70 hover:bg-rosa-claro/40 hover:text-rose-gold"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Module list */}
      <nav className="flex flex-col gap-2 overflow-y-auto p-4">
        {moduleList.map((module) => {
          const isOpen = expandedModule === module.id;
          const lessons = module.lessons.slice().sort((a, b) => a.order - b.order);
          const done = moduleCompleted(module);
          const doneCount = moduleCompletedCount(module);
          return (
            <div key={module.id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onToggleModule(module.id)}
                className="flex items-center justify-between rounded-lg px-1 py-1 text-left hover:bg-rosa-claro/10"
                aria-expanded={isOpen}
              >
                <span className="text-xs font-semibold tracking-widest text-rose-gold">
                  {module.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground/50">
                    {doneCount}/{lessons.length}
                  </span>
                  {done && <CheckIcon className="h-3.5 w-3.5 text-rose-gold" />}
                  {isOpen ? <ChevronUp /> : <ChevronDown />}
                </div>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-0.5 pl-1">
                  {lessons.map((l) => {
                    const isCurrent = l.id === currentLessonId;
                    const isDone = !!completed[l.id];
                    const isWatched = !!watched[l.id];
                    const num = lessonNumbers[l.id] ?? "";
                    const dur = formatDuration(l.durationSec ?? undefined);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { onSelectLesson(l.id); onClose?.(); }}
                        title={l.title}
                        className={`flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                          isCurrent ? "bg-rosa-claro/30" : "hover:bg-rosa-claro/20"
                        }`}
                      >
                        {lessonIndicator(isDone, isCurrent)}
                        <div className="min-w-0 flex-1">
                          <div className={`line-clamp-2 text-sm font-medium leading-snug ${isCurrent ? "text-rose-gold" : "text-foreground"}`}>
                            <span className="mr-1 text-xs text-foreground/40">{num}</span>
                            {l.title}
                          </div>
                          {dur && (
                            <p className="mt-0.5 text-xs text-foreground/40">{dur}</p>
                          )}
                        </div>
                        {isDone ? (
                          <span className="shrink-0 text-xs font-semibold text-rose-gold">✓</span>
                        ) : isCurrent && isWatched ? (
                          <span className="shrink-0 text-[10px] text-foreground/50">em andamento</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default function CursoSidebar({
  currentLessonId,
  completed,
  watched,
  expandedModule,
  collapsed,
  onSelectLesson,
  onToggleModule,
  onToggleCollapse,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape key.
  useEffect(() => {
    if (!collapsed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggleCollapse();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [collapsed, onToggleCollapse]);

  return (
    <>
      {/* ── Mobile: hamburger button (shown when drawer is closed) ── */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label="Abrir menu de aulas"
        className={`fixed bottom-4 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow-card-lg transition-transform hover:scale-105 lg:hidden ${collapsed ? "translate-y-0" : "translate-y-24"}`}
      >
        <MenuIcon />
      </button>

      {/* ── Mobile: backdrop ── */}
      {collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggleCollapse}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] overflow-hidden bg-branco shadow-2xl transition-transform duration-300 lg:hidden ${collapsed ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent
          currentLessonId={currentLessonId}
          completed={completed}
          watched={watched}
          expandedModule={expandedModule}
          onSelectLesson={onSelectLesson}
          onToggleModule={onToggleModule}
          onClose={onToggleCollapse}
        />
      </div>

      {/* ── Desktop: static sidebar ── */}
      <aside className="hidden w-72 max-w-xs shrink-0 overflow-hidden border-r border-cinza-suave/40 bg-branco lg:flex lg:flex-col">
        <SidebarContent
          currentLessonId={currentLessonId}
          completed={completed}
          watched={watched}
          expandedModule={expandedModule}
          onSelectLesson={onSelectLesson}
          onToggleModule={onToggleModule}
        />
      </aside>
    </>
  );
}

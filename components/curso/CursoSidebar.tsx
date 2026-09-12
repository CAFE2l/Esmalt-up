"use client";

import { COURSE_LESSONS, type Module } from "@/lib/courseData";

export interface Props {
  currentLessonId: string;
  completed: Record<string, boolean>;
  watched: Record<string, boolean>;
  expandedModule: string | null;
  collapsed: boolean;
  onSelectLesson: (id: string) => void;
  onToggleModule: (id: string) => void;
  onToggleCollapse: () => void;
}

const ChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M18 15L12 9l-6 6" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const CheckIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 16.2L4.8 12l-.8.8L9 18 21 6l-.8-.8z" />
  </svg>
);

interface LessonCtx {
  lesson: { id: string; title: string; description: string };
  module: { id: string; title: string };
  lessonIndex: number;
  moduleIndex: number;
}
function lessonIndicator(ctx: LessonCtx, completed: boolean, current: boolean) {
  if (completed)
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow">
        <CheckIcon />
      </div>
    );
  if (current) return <div className="h-5 w-5 rounded-full bg-rosa-blush shadow" />;
  return <div className="h-5 w-5 rounded-full border-2 border-cinza-suave/50" />;
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
  const modules = COURSE_LESSONS.reduce<Record<string, Module>>((acc, c) => {
    if (!acc[c.module.id]) acc[c.module.id] = c.module;
    return acc;
  }, {});
  const moduleList = Object.values(modules);
  const expandedModuleLessons =
    expandedModule && modules[expandedModule]
      ? modules[expandedModule].lessons.slice().sort((a, b) => a.order - b.order)
      : [];
  const moduleCompleted = (m: Module) =>
    m.lessons.every((l) => !!completed[l.id]);

  return (
    <aside
      className={`flex flex-col gap-3 overflow-y-auto border-r border-cinza-suave/40 bg-branco p-4 transition-all ${
        collapsed ? "w-16 max-w-16" : "w-72 max-w-xs"
      }`}
    >
      {/* Header: course title + collapse toggle */}
      <div className={`flex items-center justify-between ${collapsed ? "px-0.5" : ""}`}>
        {!collapsed && (
          <h1 className="text-base font-bold tracking-tight text-rose-gold">
            Curso Preparatório
          </h1>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-rosa-claro/40 hover:text-rose-gold"
        >
          {collapsed ? (
            <ChevronDown />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {collapsed ? (
        // Slim strip: dots for the expanded module's lessons (with tooltips).
        <div className="flex flex-col items-center gap-3">
          {expandedModuleLessons.map((l) => {
            const cls = completed[l.id]
              ? "bg-rose-gold"
              : l.id === currentLessonId
                ? "bg-rosa-blush"
                : "bg-cinza-suave/50";
            return (
              <button
                key={l.id}
                type="button"
                title={l.title}
                onClick={() => onSelectLesson(l.id)}
                className={`h-3.5 w-3.5 rounded-full transition-all hover:scale-125 ${cls}`}
              />
            );
          })}
        </div>
      ) : (
                        <nav className="flex flex-col gap-2">

          {moduleList.map((module) => {
            const isOpen = expandedModule === module.id;
            const lessons = module.lessons.slice().sort((a, b) => a.order - b.order);
            const done = moduleCompleted(module);
            return (
              <div key={module.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onToggleModule(module.id)}
                  className="flex items-center justify-between text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs font-semibold tracking-widest text-rose-gold">
                    {module.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {done && <CheckIcon className="h-3.5 w-3.5 text-rose-gold" />}
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-1 pl-1">
                    {lessons.map((l) => {
                      const isCurrent = l.id === currentLessonId;
                      const isDone = !!completed[l.id];
                      const isWatched = !!watched[l.id];
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => onSelectLesson(l.id)}
                          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                            isCurrent
                              ? "bg-rosa-claro/30"
                              : "hover:bg-rosa-claro/20"
                          }`}
                        >
                          <span className="shrink-0">
                            {lessonIndicator(
                              {
                                lesson: l,
                                module,
                                lessonIndex: 0,
                                moduleIndex: 0,
                              },
                              isDone,
                              isCurrent,
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`truncate text-sm font-medium ${
                                isCurrent
                                  ? "text-rose-gold"
                                  : "text-foreground"
                              }`}
                            >
                              {l.title}
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-foreground/50">
                              {l.description}
                            </p>
                          </div>
                          {isDone ? (
                            <span className="shrink-0 text-xs font-semibold text-rose-gold">
                              Concluída
                            </span>
                          ) : isCurrent && isWatched ? (
                            <span className="shrink-0 text-xs text-foreground/60">
                              Em andamento
                            </span>
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
      )}
    </aside>
  );
}

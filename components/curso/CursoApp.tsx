"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COURSE_LESSONS } from "@/lib/courseData";
import { useCourseProgress } from "@/lib/useCourseProgress";
import CursoSidebar from "@/components/curso/CursoSidebar";
import CursoTopBar from "@/components/curso/CursoTopBar";
import CursoVideoPlayer from "@/components/curso/CursoVideoPlayer";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

/** Returns the module id that contains the given lesson, if any. */
function moduleOfLessonId(id: string): string | undefined {
  return COURSE_LESSONS.find((c) => c.lesson.id === id)?.module.id;
}

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M5 12h14M9 5l7 7-7 7" />
  </svg>
);

export default function CursoApp({ initialLessonId }: { initialLessonId?: string }) {
  const router = useRouter();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const {
    completed,
    watched,
    currentLessonId,
    currentLesson,
    totalLessons,
    completedCount,
    progressPercent,
    prevLesson,
    nextLesson,
    markWatched,
    markCompleted,
    setLessonId,
  } = useCourseProgress(initialLessonId);

  // Auto-open the module that contains the current lesson.
  useEffect(() => {
    if (currentLessonId) {
      setExpandedModule(moduleOfLessonId(currentLessonId) ?? null);
    }
  }, [currentLessonId]);

  // Select a lesson: update internal state AND keep the URL in sync for
  // deep-linking / back-button support.
  const handleSelectLesson = (id: string) => {
    setLessonId(id);
    router.replace(`?aula=${id}`);
  };

  const handlePrev = () => {
    if (prevLesson) handleSelectLesson(prevLesson.lesson.id);
  };
  const handleNext = () => {
    if (nextLesson) handleSelectLesson(nextLesson.lesson.id);
  };

  const handleConcluir = () => {
    if (currentLessonId) markCompleted(currentLessonId);
  };

  const handleVoltarParaModulo = () => {
    setCollapsed(false);
    if (currentLessonId) setExpandedModule(moduleOfLessonId(currentLessonId) ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // While the client-only hydration effect resolves the current lesson, show a
  // neutral placeholder (identical to the SSR first paint → no mismatch).
  if (!currentLesson) {
    return (
      <div className="p-6">
        <p className="text-foreground/70">Carregando o curso…</p>
      </div>
    );
  }

  const lessonId = currentLesson.lesson.id;
  const isWatched = !!watched[lessonId];
  const isConcluded = !!completed[lessonId];

  return (
    <div className="flex min-h-[calc(100vh-6rem)] bg-bege">
      <CursoSidebar
        currentLessonId={currentLessonId ?? ""}
        completed={completed}
        watched={watched}
        expandedModule={expandedModule}
        collapsed={collapsed}
        onSelectLesson={handleSelectLesson}
        onToggleModule={(id) =>
          setExpandedModule((prev) => (prev === id ? null : id))
        }
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <main className="flex-1 overflow-y-auto">
        <CursoTopBar
          progressPercent={progressPercent}
          completedCount={completedCount}
          totalLessons={totalLessons}
          hasPrev={!!prevLesson}
          hasNext={!!nextLesson}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        <div className="p-4 sm:p-6">
          <CursoVideoPlayer
            lesson={currentLesson}
            watched={isWatched}
            onWatched={() => markWatched(lessonId)}
          />

          {/* Below-player navigation + conclude action */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinza-suave/40 bg-branco p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!prevLesson}
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <ArrowLeft /> Aula Anterior
              </button>
              <button
                type="button"
                onClick={handleVoltarParaModulo}
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-sm`}
              >
                Voltar para Módulo
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!nextLesson}
                className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Próxima Aula <ArrowRight />
              </button>
            </div>
            <button
              type="button"
              onClick={handleConcluir}
              disabled={!isWatched}
              className={`${primaryButton} px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isConcluded ? "Aula Concluída" : "Concluir aula"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

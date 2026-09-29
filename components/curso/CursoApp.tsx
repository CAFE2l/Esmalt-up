"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COURSE_LESSONS } from "@/lib/courseData";
import { useCourseProgress } from "@/lib/useCourseProgress";
import { useAuth } from "@/lib/AuthContext";
import CursoSidebar from "@/components/curso/CursoSidebar";
import CursoTopBar from "@/components/curso/CursoTopBar";
import CursoVideoPlayer, { AutoAdvanceCountdown } from "@/components/curso/CursoVideoPlayer";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

function moduleOfLessonId(id: string): string | undefined {
  return COURSE_LESSONS.find((c) => c.lesson.id === id)?.module.slug;
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
  const { user } = useAuth();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  /** Mobile: drawer open. Desktop: unused (sidebar always visible). */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(""),
    [user],
  );

  const {
    completed,
    watched,
    positions,
    currentLessonId,
    currentLesson,
    totalLessons,
    completedCount,
    progressPercent,
    prevLesson,
    nextLesson,
    markWatched,
    markCompleted,
    unmarkCompleted,
    savePosition,
    setLessonId,
  } = useCourseProgress(initialLessonId, user ? getToken : undefined);

  // Auto-open the module that contains the current lesson.
  useEffect(() => {
    if (currentLessonId) {
      setExpandedModule(moduleOfLessonId(currentLessonId) ?? null);
    }
  }, [currentLessonId]);

  const handleSelectLesson = (id: string) => {
    setShowCountdown(false);
    setLessonId(id);
    router.replace(`?aula=${id}`);
  };

  const handlePrev = () => { if (prevLesson) handleSelectLesson(prevLesson.lesson.id); };
  const handleNext = () => { if (nextLesson) handleSelectLesson(nextLesson.lesson.id); };

  const handleConcluir = () => {
    if (!currentLessonId) return;
    const isConcluded = !!completed[currentLessonId];
    if (isConcluded) {
      unmarkCompleted(currentLessonId);
    } else {
      markCompleted(currentLessonId);
    }
  };

  const handleVideoEnded = useCallback(() => {
    if (nextLesson) setShowCountdown(true);
  }, [nextLesson]);

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
  const resumePos = positions[lessonId];

  return (
    <div className="flex min-h-[calc(100vh-6rem)] bg-bege">
      <CursoSidebar
        currentLessonId={currentLessonId ?? ""}
        completed={completed}
        watched={watched}
        expandedModule={expandedModule}
        collapsed={drawerOpen}
        onSelectLesson={handleSelectLesson}
        onToggleModule={(id) =>
          setExpandedModule((prev) => (prev === id ? null : id))
        }
        onToggleCollapse={() => setDrawerOpen((o) => !o)}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <CursoTopBar
          progressPercent={progressPercent}
          completedCount={completedCount}
          totalLessons={totalLessons}
        />

        <div className="p-4 sm:p-6">
          <CursoVideoPlayer
            lesson={currentLesson}
            watched={isWatched}
            onWatched={() => markWatched(lessonId)}
            resumePosition={resumePos}
            onPositionChange={(secs) => savePosition(lessonId, secs)}
            onEnded={handleVideoEnded}
          />

          {/* 5-second auto-advance countdown */}
          {showCountdown && nextLesson && (
            <div className="mt-4">
              <AutoAdvanceCountdown
                onGo={handleNext}
                onCancel={() => setShowCountdown(false)}
              />
            </div>
          )}

          {/* Single control bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinza-suave/40 bg-branco p-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!prevLesson}
              className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ArrowLeft /> Aula anterior
            </button>

            <button
              type="button"
              onClick={handleConcluir}
              disabled={!isWatched && !isConcluded}
              className={`${primaryButton} px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isConcluded ? "Aula concluída ✓" : "Concluir aula"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!nextLesson}
              className={`${outlineButton} inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Próxima aula <ArrowRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

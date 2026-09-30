"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Play, UserCheck, AlertTriangle, Sparkles } from "lucide-react";
import { COURSE_UNITS, type BonusChest, type CourseLesson } from "@/data/course";
import { useCourseProgress } from "@/lib/useCourseProgress";
import { useAuth } from "@/lib/AuthContext";
import CoursePathNode, { type NodeState } from "./CoursePathNode";
import BonusChestModal from "./BonusChestModal";
import CourseSkeleton from "./CourseSkeleton";
import CourseErrorState from "./CourseErrorState";
import { primaryButton, outlineButton } from "../buttonStyles";

// Soft zig-zag offset classes
const ZIG_ZAG_OFFSETS = [
  "translate-x-0",
  "-translate-x-7 sm:-translate-x-12",
  "-translate-x-3.5 sm:-translate-x-6",
  "translate-x-0",
  "translate-x-3.5 sm:translate-x-6",
  "translate-x-7 sm:translate-x-12",
  "translate-x-0",
];

export default function CoursePath() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedChest, setSelectedChest] = useState<BonusChest | null>(null);
  const [showLockedAlert, setShowLockedAlert] = useState(false);

  const {
    isLessonCompleted,
    isLessonUnlocked,
    isLessonCurrent,
    isChestUnlocked,
    openChest,
    _currentLesson,
    completedCount,
    totalLessons,
    progressPercent,
    isLoading,
    hasError,
    reload,
  } = useCourseProgress();

  useEffect(() => {
    if (searchParams?.get("bloqueada") === "1") {
      setShowLockedAlert(true);
    }
  }, [searchParams]);

  const handleContinue = () => {
    const el = document.getElementById("current-lesson-node");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleOpenChest = (chest: BonusChest) => {
    openChest(chest.id);
    setSelectedChest(chest);
  };

  if (isLoading) {
    return <CourseSkeleton />;
  }

  if (hasError) {
    return <CourseErrorState onRetry={reload} />;
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      {/* Locked lesson alert banner */}
      {showLockedAlert && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200 backdrop-blur-sm animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400" />
            <span>
              Essa aula ainda está <strong>bloqueada</strong>. Conclua as aulas
              anteriores na trilha para liberá-la!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowLockedAlert(false)}
            aria-label="Fechar aviso"
            className="text-yellow-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Logged-out visitor soft banner */}
      {!user && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-rose-gold/30 bg-gradient-to-r from-rosa-claro/40 via-branco to-rosa-claro/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rosa-medio/20 text-rose-gold">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Entre para salvar seu progresso
                </p>
                <p className="text-xs text-foreground/70">
                  Você pode experimentar a 1ª aula livremente! Crie uma conta para salvar suas conquistas.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/login" className={`${outlineButton} px-4 py-1.5 text-xs`}>
                Entrar
              </Link>
              <Link href="/signup" className={`${primaryButton} px-4 py-1.5 text-xs`}>
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top summary bar */}
      <section
        aria-label="Resumo do progresso"
        className="sticky top-16 z-30 mb-8 rounded-2xl border border-cinza-suave/40 bg-branco/95 p-4 shadow-header backdrop-blur-md"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold tracking-wide text-foreground">
                {completedCount} de {totalLessons} aulas
              </span>
              <span className="font-extrabold text-rose-gold">
                {progressPercent}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-cinza-suave/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rosa-blush via-rose-gold to-[#f4b6c2] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className={`${primaryButton} inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm shadow-card hover:shadow-card-lg active:scale-95`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Continuar de onde parei
          </button>
        </div>
      </section>

      {/* Units & Learning Path */}
      <div className="flex flex-col gap-14">
        {COURSE_UNITS.map((unit) => {
          return (
            <div key={unit.id} className="relative flex flex-col items-center">
              {/* Sticky Unit Header Banner */}
              <div className="sticky top-36 z-20 w-full mb-8">
                <header
                  className="rounded-2xl border border-rose-gold/25 p-5 shadow-card backdrop-blur-md transition-shadow"
                  style={{
                    backgroundColor: unit.headerBg,
                    borderLeft: `4px solid ${unit.accentColor}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-black uppercase tracking-widest text-rose-gold"
                    >
                      Unidade {unit.unitNumber}
                    </span>
                    <Sparkles className="h-4 w-4 text-rose-gold/60" />
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    {unit.title}
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-foreground/75">
                    {unit.subtitle}
                  </p>
                </header>
              </div>

              {/* Vertical Path of Nodes */}
              <div className="relative flex flex-col items-center py-2 w-full">
                {unit.lessons.map((lesson: CourseLesson, idx: number) => {
                  const completed = isLessonCompleted(lesson.slug);
                  const unlocked = isLessonUnlocked(lesson.slug);
                  const isCurrent = isLessonCurrent(lesson.slug);

                  const state: NodeState = completed
                    ? "concluida"
                    : isCurrent
                    ? "atual"
                    : unlocked
                    ? "atual"
                    : "bloqueada";

                  const offsetClass =
                    ZIG_ZAG_OFFSETS[idx % ZIG_ZAG_OFFSETS.length];

                  return (
                    <CoursePathNode
                      key={lesson.id}
                      id={isCurrent ? "current-lesson-node" : undefined}
                      lesson={lesson}
                      state={state}
                      offsetClass={offsetClass}
                    />
                  );
                })}

                {/* Optional Bonus Chest at the end of the unit */}
                {unit.bonusChest && (
                  <div className="mt-6 flex flex-col items-center">
                    {(() => {
                      const chestUnlocked = isChestUnlocked(unit.id);
                      const bonusCompleted = isLessonCompleted(
                        unit.bonusChest.lesson.slug
                      );
                      const chestState: NodeState = bonusCompleted
                        ? "concluida"
                        : chestUnlocked
                        ? "atual"
                        : "bloqueada";

                      return (
                        <CoursePathNode
                          lesson={unit.bonusChest.lesson}
                          state={chestState}
                          isBonusChest={true}
                          chestData={unit.bonusChest}
                          onOpenChest={handleOpenChest}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus Chest Celebration Modal */}
      {selectedChest && (
        <BonusChestModal
          chest={selectedChest}
          isOpen={Boolean(selectedChest)}
          onClose={() => setSelectedChest(null)}
        />
      )}
    </div>
  );
}

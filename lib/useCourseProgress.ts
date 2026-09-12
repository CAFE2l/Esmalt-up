"use client";

import { useEffect, useState, useCallback } from "react";
import {
  COURSE_LESSONS,
  getLesson,
  getAdjacentLessons,
} from "@/lib/courseData";

/**
 * Watch-completion threshold: a lesson counts as "watched to the end" once
 * playback reaches 95% of the video's reported duration. 95% is used
 * instead of 100% because some browsers/Vimeo/Cloudinary setups never fire a
 * frame-perfect `ended` event (the last frame can be dropped), and because
 * users scrubbing to the very last second genuinely have seen the content.
 *
 * Decision (confirmed with the user): 95%.
 */
export const COMPLETION_THRESHOLD = 0.95;

const STORAGE_KEY = "esmaltup-curso-progress";

export interface ProgressSnapshot {
  /** lessonId -> whether the user clicked "Concluir aula" for it. */
  completed: Record<string, boolean>;
  /** lessonId -> whether playback reached the 95% threshold at least once. */
  watched: Record<string, boolean>;
  /** Last lesson the user was viewing (so reload resumes there). */
  currentLessonId?: string;
}

const EMPTY: ProgressSnapshot = { completed: {}, watched: {} };

/** First lesson with no stored `completed` flag (resume point); else last. */
function defaultLessonId(completed: Record<string, boolean>): string | null {
  const incomplete = COURSE_LESSONS.find((c) => !completed[c.lesson.id]);
  return incomplete?.lesson.id ?? COURSE_LESSONS[COURSE_LESSONS.length - 1]?.lesson.id ?? null;
}

function loadProgress(): ProgressSnapshot {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        completed: parsed.completed ?? {},
        watched: parsed.watched ?? {},
        currentLessonId: parsed.currentLessonId ?? undefined,
      };
    }
  } catch {
    /* corrupt entry — reset */
  }
  return EMPTY;
}

function saveProgress(data: ProgressSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function useCourseProgress(initialLessonId?: string) {
  // NOTE: we intentionally do NOT read localStorage in the useState
  // initializers. The first render must be identical on server and client
  // (SSR has no `window`); we hydrate from localStorage in a client-only
  // effect below to avoid hydration mismatches.
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(
    initialLessonId ?? null,
  );

  // Client-only hydration + resume. First render matches SSR (empty state).
  useEffect(() => {
    const data = loadProgress();
    setCompleted(data.completed);
    setWatched(data.watched);
    setCurrentLessonId((cur) => {
      if (cur) return cur; // explicit param / ?aula= wins
      return data.currentLessonId ?? defaultLessonId(data.completed);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist everything on change (completed, watched, current lesson).
  useEffect(() => {
    const current = currentLessonId ?? "";
    saveProgress({ completed, watched, currentLessonId: current });
  }, [completed, watched, currentLessonId]);

  const currentLesson = currentLessonId
    ? getLesson(currentLessonId)
    : undefined;

  const markWatched = useCallback((lessonId: string) => {
    setWatched((prev) =>
      prev[lessonId] ? prev : { ...prev, [lessonId]: true },
    );
  }, []);

  const markCompleted = useCallback((lessonId: string) => {
    setCompleted((prev) => ({ ...prev, [lessonId]: true }));
    markWatched(lessonId);
  }, [markWatched]);

  const unmarkCompleted = useCallback((lessonId: string) => {
    setCompleted((prev) => {
      const next = { ...prev };
      delete next[lessonId];
      return next;
    });
  }, []);

  const totalLessons = COURSE_LESSONS.length;
  const completedCount = Object.keys(completed).filter(
    (k) => completed[k],
  ).length;
  const progressPercent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const nav = currentLesson
    ? getAdjacentLessons(currentLesson.lesson.id)
    : { prev: undefined, current: currentLesson, next: undefined };

  return {
    // state
    completed,
    watched,
    currentLessonId,
    currentLesson,
    // derived
    totalLessons,
    completedCount,
    progressPercent,
    // nav helpers
    prevLesson: nav.prev,
    nextLesson: nav.next,
    // mutations
    markWatched,
    markCompleted,
    unmarkCompleted,
    setLessonId: setCurrentLessonId,
  };
}

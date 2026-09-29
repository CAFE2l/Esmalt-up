"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  COURSE_LESSONS,
  getLesson,
  getAdjacentLessons,
  isYouTubeEmbed,
} from "@/lib/courseData";

function dbSlugOf(videoUrl: string): string | null {
  if (!isYouTubeEmbed(videoUrl)) return null;
  const match = videoUrl.match(/\/embed\/([\w-]{11})/);
  return match ? `yt-${match[1]}` : null;
}

async function syncProgressToDB(
  token: string,
  lessonSlug: string,
  completedAt: string | null,
  positionSeconds?: number,
) {
  try {
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ lessonSlug, completedAt, positionSeconds }),
    });
  } catch {
    /* fire-and-forget */
  }
}

export const COMPLETION_THRESHOLD = 0.95;

const STORAGE_KEY = "esmaltup-curso-progress";

export interface ProgressSnapshot {
  completed: Record<string, boolean>;
  watched: Record<string, boolean>;
  currentLessonId?: string;
  /** lessonId -> last saved position in seconds */
  positions: Record<string, number>;
}

const EMPTY: ProgressSnapshot = { completed: {}, watched: {}, positions: {} };

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
        positions: parsed.positions ?? {},
      };
    }
  } catch {
    /* corrupt — reset */
  }
  return EMPTY;
}

function saveProgress(data: ProgressSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full */
  }
}

export function useCourseProgress(
  initialLessonId?: string,
  getToken?: () => Promise<string>,
) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(
    initialLessonId ?? null,
  );

  // Hydrate from localStorage on client only (avoids SSR mismatch).
  useEffect(() => {
    const data = loadProgress();
    setCompleted(data.completed);
    setWatched(data.watched);
    setPositions(data.positions);
    setCurrentLessonId((cur) => {
      if (cur) return cur;
      return data.currentLessonId ?? defaultLessonId(data.completed);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change.
  useEffect(() => {
    saveProgress({ completed, watched, currentLessonId: currentLessonId ?? "", positions });
  }, [completed, watched, currentLessonId, positions]);

  const currentLesson = currentLessonId ? getLesson(currentLessonId) : undefined;

  const markWatched = useCallback((lessonId: string) => {
    setWatched((prev) => prev[lessonId] ? prev : { ...prev, [lessonId]: true });
  }, []);

  const savePosition = useCallback((lessonId: string, seconds: number) => {
    setPositions((prev) => {
      if (Math.abs((prev[lessonId] ?? 0) - seconds) < 2) return prev;
      return { ...prev, [lessonId]: Math.floor(seconds) };
    });
    if (getToken) {
      const lesson = getLesson(lessonId);
      if (lesson) {
        const slug = dbSlugOf(lesson.lesson.videoUrl) ?? lesson.lesson.id;
        getToken().then((token) => syncProgressToDB(token, slug, null, Math.floor(seconds)));
      }
    }
  }, [getToken]);

  const markCompleted = useCallback((lessonId: string) => {
    setCompleted((prev) => ({ ...prev, [lessonId]: true }));
    markWatched(lessonId);
    if (getToken) {
      const lesson = getLesson(lessonId);
      if (lesson) {
        const slug = dbSlugOf(lesson.lesson.videoUrl) ?? lesson.lesson.id;
        getToken().then((token) => syncProgressToDB(token, slug, new Date().toISOString()));
      }
    }
  }, [markWatched, getToken]);

  const markWatchedWithSync = useCallback((lessonId: string) => {
    markWatched(lessonId);
    if (getToken) {
      const lesson = getLesson(lessonId);
      if (lesson) {
        const slug = dbSlugOf(lesson.lesson.videoUrl) ?? lesson.lesson.id;
        getToken().then((token) => syncProgressToDB(token, slug, null));
      }
    }
  }, [markWatched, getToken]);

  const unmarkCompleted = useCallback((lessonId: string) => {
    setCompleted((prev) => {
      const next = { ...prev };
      delete next[lessonId];
      return next;
    });
  }, []);

  const totalLessons = COURSE_LESSONS.length;
  const completedCount = Object.keys(completed).filter((k) => completed[k]).length;
  const progressPercent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const nav = currentLesson
    ? getAdjacentLessons(currentLesson.lesson.id)
    : { prev: undefined, current: currentLesson, next: undefined };

  return {
    completed,
    watched,
    positions,
    currentLessonId,
    currentLesson,
    totalLessons,
    completedCount,
    progressPercent,
    prevLesson: nav.prev,
    nextLesson: nav.next,
    markWatched: markWatchedWithSync,
    markCompleted,
    unmarkCompleted,
    savePosition,
    setLessonId: setCurrentLessonId,
  };
}

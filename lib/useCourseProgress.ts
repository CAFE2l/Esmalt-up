"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  COURSE_UNITS,
  getMainTrackLessons,
  getLessonBySlug,
  type CourseLesson,
} from "@/data/course";
import { useAuth } from "./AuthContext";

export interface ProgressData {
  completed: Record<string, boolean>; // slug -> true
  watched: Record<string, boolean>; // slug -> true
  skipped: Record<string, boolean>; // slug -> true
  positions: Record<string, number>; // slug -> seconds
  openedChests: Record<string, boolean>; // chestId -> true
  lastSlug?: string;
  timestamps: Record<string, string>; // slug -> ISO string
  certificateIssuedAt?: string; // ISO string, set once on first completion
}

const EMPTY_PROGRESS: ProgressData = {
  completed: {},
  watched: {},
  skipped: {},
  positions: {},
  openedChests: {},
  timestamps: {},
  certificateIssuedAt: undefined,
};

function getStorageKey(uid?: string | null): string {
  return uid ? `esmaltup_curso_progress_${uid}` : "esmaltup_curso_progress_guest";
}

function loadLocalProgress(storageKey: string): ProgressData {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        completed: parsed.completed ?? {},
        watched: parsed.watched ?? {},
        skipped: parsed.skipped ?? {},
        positions: parsed.positions ?? {},
        openedChests: parsed.openedChests ?? {},
        lastSlug: typeof parsed.lastSlug === "string" ? parsed.lastSlug : undefined,
        timestamps: parsed.timestamps ?? {},
        certificateIssuedAt: typeof parsed.certificateIssuedAt === "string" ? parsed.certificateIssuedAt : undefined,
      };
    }
  } catch (err) {
    console.error("Erro ao ler progresso local:", err);
  }
  return EMPTY_PROGRESS;
}

function saveLocalProgress(storageKey: string, data: ProgressData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) {
    console.error("Erro ao salvar progresso local:", err);
  }
}

async function syncToDB(
  token: string,
  lessonSlug: string,
  completedAt: string | null,
  lastPositionSeconds?: number
) {
  try {
    await fetch("/api/course/progress", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ lessonSlug, completedAt, lastPositionSeconds }),
    });
  } catch {
    /* fire and forget */
  }
}

export function useCourseProgress() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const storageKey = useMemo(() => getStorageKey(user?.uid), [user?.uid]);
  const mainTrackLessons = useMemo(() => getMainTrackLessons(), []);

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(""),
    [user]
  );

  // Load progress from localStorage and sync from server if logged in
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const local = loadLocalProgress(storageKey);
      setData(local);

      // If user is logged in, try to fetch server progress and merge
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/course/progress", {
            headers: { authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.progress)) {
              setData((prev) => {
                const mergedCompleted = { ...prev.completed };
                const mergedPositions = { ...prev.positions };
                const mergedTimestamps = { ...prev.timestamps };

                for (const row of json.progress) {
                  const slug = row.lesson?.slug;
                  if (slug) {
                    if (row.completedAt) {
                      mergedCompleted[slug] = true;
                      mergedTimestamps[slug] = row.completedAt;
                    }
                    if (row.lastPositionSeconds) {
                      mergedPositions[slug] = Math.max(
                        mergedPositions[slug] || 0,
                        row.lastPositionSeconds
                      );
                    }
                  }
                }

                const updated: ProgressData = {
                  ...prev,
                  completed: mergedCompleted,
                  positions: mergedPositions,
                  timestamps: mergedTimestamps,
                };
                saveLocalProgress(storageKey, updated);
                return updated;
              });
            }
          }
        } catch {
          // If offline or network issue, local progress is already loaded
        }
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Check if a lesson is completed (either finished or skipped)
  const isLessonCompleted = useCallback(
    (slug: string): boolean => {
      return Boolean(data.completed[slug] || data.skipped[slug]);
    },
    [data.completed, data.skipped]
  );

  // Sequential unlock logic:
  // - Lesson 1 of Unit 1 is ALWAYS unlocked.
  // - A main track lesson is unlocked if it's already completed or if the preceding main track lesson is completed.
  // - A bonus lesson is unlocked if all regular lessons in that unit are completed.
  const isLessonUnlocked = useCallback(
    (slug: string): boolean => {
      const lesson = getLessonBySlug(slug);
      if (!lesson) return false;
      if (lesson.status === "coming_soon") return false;

      // Bonus lesson
      if (lesson.isBonus) {
        const unit = COURSE_UNITS.find((u) => u.id === lesson.unitId);
        if (!unit) return false;
        return unit.lessons.every((l) => isLessonCompleted(l.slug));
      }

      // First main track lesson is always unlocked
      const trackIndex = mainTrackLessons.findIndex((l) => l.slug === slug);
      if (trackIndex === 0) return true;
      if (trackIndex === -1) return false;

      // Already completed
      if (isLessonCompleted(slug)) return true;

      // Unlocked if previous lesson in track is completed
      const prevLesson = mainTrackLessons[trackIndex - 1];
      return isLessonCompleted(prevLesson.slug);
    },
    [mainTrackLessons, isLessonCompleted]
  );

  // Find the current active lesson (the first incomplete unlocked lesson)
  const currentLesson = useMemo((): CourseLesson => {
    const firstIncomplete = mainTrackLessons.find(
      (l) => isLessonUnlocked(l.slug) && !isLessonCompleted(l.slug)
    );
    return firstIncomplete || mainTrackLessons[mainTrackLessons.length - 1];
  }, [mainTrackLessons, isLessonUnlocked, isLessonCompleted]);

  const isLessonCurrent = useCallback(
    (slug: string): boolean => {
      return currentLesson.slug === slug;
    },
    [currentLesson.slug]
  );

  // Bonus chest unlocked check
  const isChestUnlocked = useCallback(
    (unitId: string): boolean => {
      const unit = COURSE_UNITS.find((u) => u.id === unitId);
      if (!unit) return false;
      return unit.lessons.every((l) => isLessonCompleted(l.slug));
    },
    [isLessonCompleted]
  );

  const isChestOpened = useCallback(
    (chestId: string): boolean => {
      return Boolean(data.openedChests[chestId]);
    },
    [data.openedChests]
  );

  const openChest = useCallback(
    (chestId: string) => {
      setData((prev) => {
        const updated: ProgressData = {
          ...prev,
          openedChests: { ...prev.openedChests, [chestId]: true },
        };
        saveLocalProgress(storageKey, updated);
        return updated;
      });
    },
    [storageKey]
  );

  const markCompleted = useCallback(
    async (slug: string) => {
      const nowIso = new Date().toISOString();
      setData((prev) => {
        const updated: ProgressData = {
          ...prev,
          completed: { ...prev.completed, [slug]: true },
          watched: { ...prev.watched, [slug]: true },
          timestamps: { ...prev.timestamps, [slug]: nowIso },
          lastSlug: slug,
        };
        saveLocalProgress(storageKey, updated);
        return updated;
      });

      if (user) {
        try {
          const token = await getToken();
          await syncToDB(token, slug, nowIso);
        } catch {
          // ignore
        }
      }
    },
    [storageKey, user, getToken]
  );

  const unmarkCompleted = useCallback(
    (slug: string) => {
      setData((prev) => {
        const newCompleted = { ...prev.completed };
        delete newCompleted[slug];
        const updated: ProgressData = {
          ...prev,
          completed: newCompleted,
        };
        saveLocalProgress(storageKey, updated);
        return updated;
      });
    },
    [storageKey]
  );

  const skipLesson = useCallback(
    async (slug: string) => {
      const nowIso = new Date().toISOString();
      setData((prev) => {
        const updated: ProgressData = {
          ...prev,
          skipped: { ...prev.skipped, [slug]: true },
          completed: { ...prev.completed, [slug]: true },
          timestamps: { ...prev.timestamps, [slug]: nowIso },
          lastSlug: slug,
        };
        saveLocalProgress(storageKey, updated);
        return updated;
      });

      if (user) {
        try {
          const token = await getToken();
          await syncToDB(token, slug, nowIso);
        } catch {
          // ignore
        }
      }
    },
    [storageKey, user, getToken]
  );

  const savePosition = useCallback(
    (slug: string, seconds: number) => {
      const sec = Math.floor(seconds);
      setData((prev) => {
        if (Math.abs((prev.positions[slug] ?? 0) - sec) < 3) return prev;
        const updated: ProgressData = {
          ...prev,
          positions: { ...prev.positions, [slug]: sec },
        };
        saveLocalProgress(storageKey, updated);
        return updated;
      });

      if (user) {
        getToken().then((token) => syncToDB(token, slug, null, sec));
      }
    },
    [storageKey, user, getToken]
  );

  const issueCertificate = useCallback(() => {
    setData((prev) => {
      if (prev.certificateIssuedAt) return prev; // already issued — keep original date
      const updated: ProgressData = {
        ...prev,
        certificateIssuedAt: new Date().toISOString(),
      };
      saveLocalProgress(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  const completedCount = useMemo(() => {
    return mainTrackLessons.filter((l) => isLessonCompleted(l.slug)).length;
  }, [mainTrackLessons, isLessonCompleted]);

  const totalLessons = mainTrackLessons.length;
  const progressPercent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  return {
    data,
    completed: data.completed,
    watched: data.watched,
    skipped: data.skipped,
    positions: data.positions,
    openedChests: data.openedChests,
    isLessonCompleted,
    isLessonUnlocked,
    isLessonCurrent,
    isChestUnlocked,
    isChestOpened,
    openChest,
    markCompleted,
    unmarkCompleted,
    skipLesson,
    savePosition,
    currentLesson,
    completedCount,
    totalLessons,
    progressPercent,
    certificateIssuedAt: data.certificateIssuedAt,
    issueCertificate,
    isLoading,
    hasError,
    reload: loadInitialData,
  };
}

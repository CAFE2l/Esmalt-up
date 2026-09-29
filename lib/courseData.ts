/**
 * Esmalt'up — Course Data
 *
 * Single source of truth: re-exports from curriculum.ts (which reads
 * playlists.json and assigns every video to a module).
 *
 * The old static COURSE array and PLACEHOLDER_VIDEO have been removed.
 * "Bem-vinda ao Esmalt'up!" is now a text-only intro lesson (kind='text').
 */

import { CURRICULUM, type CurriculumModule, type CurriculumLesson } from "./course/curriculum";

export type { CurriculumLesson as Lesson };
export type { CurriculumModule as Module };

export interface CourseLesson {
  lesson: CurriculumLesson & { id: string; videoUrl: string; durationSec: number; order: number };
  module: CurriculumModule;
  lessonIndex: number;
  moduleIndex: number;
}

/** True when a URL is a YouTube single-video embed. */
export function isYouTubeEmbed(url: string): boolean {
  return /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//.test(url);
}

/** Build a flat, globally-ordered lesson list from the curriculum. */
function buildCourseLessons(): CourseLesson[] {
  const out: CourseLesson[] = [];
  CURRICULUM.modules.forEach((module, moduleIndex) => {
    module.lessons.forEach((lesson, lessonIndex) => {
      const videoUrl = lesson.youtubeVideoId
        ? `https://www.youtube-nocookie.com/embed/${lesson.youtubeVideoId}?enablejsapi=1&rel=0&playsinline=1`
        : "";
      out.push({
        lesson: {
          ...lesson,
          id: lesson.slug,
          videoUrl,
          durationSec: lesson.durationSec ?? 0,
          order: moduleIndex * 1000 + lesson.orderIndex,
        },
        module,
        lessonIndex,
        moduleIndex,
      });
    });
  });
  return out;
}

export const COURSE_LESSONS: CourseLesson[] = buildCourseLessons();

export function getLesson(id: string): CourseLesson | undefined {
  return COURSE_LESSONS.find((c) => c.lesson.id === id);
}

export function getAdjacentLessons(id: string) {
  const idx = COURSE_LESSONS.findIndex((c) => c.lesson.id === id);
  if (idx === -1) return { prev: undefined, current: undefined, next: undefined };
  return {
    prev: idx > 0 ? COURSE_LESSONS[idx - 1] : undefined,
    current: COURSE_LESSONS[idx],
    next: idx < COURSE_LESSONS.length - 1 ? COURSE_LESSONS[idx + 1] : undefined,
  };
}

/** First incomplete lesson, or last lesson if all done. */
export function getResumeLessonId(completed: Record<string, boolean>): string | null {
  const incomplete = COURSE_LESSONS.find((c) => !completed[c.lesson.id]);
  return incomplete?.lesson.id ?? COURSE_LESSONS[COURSE_LESSONS.length - 1]?.lesson.id ?? null;
}

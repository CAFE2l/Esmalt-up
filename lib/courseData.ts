/**
 * Esmalt'up — Curso Preparatório
 *
 * Static course content. Each `lesson` maps to one manicure video.
 *
 * VIDEOS:
 *   Every lesson currently points at a publicly-hosted sample MP4
 *   (the Sintel trailer) so the player is never empty. Before the real
 *   course ships, re-encode each manicure lesson to an MP4 and upload it
 *   to Cloudinary under the `esmalt-up` upload preset, then replace each
 *   `videoUrl` with:
 *     https://res.cloudinary.com/dch7w7ncj/video/upload/<public_id>.mp4
 *
 * PERSISTENCE:
 *   See lib/useCourseProgress.ts — completed + per-lesson "watched"
 *   flags live in localStorage (key: esmaltup-curso-progress) and can be
 *   migrated to Firestore keyed by `user.uid` later without UI changes.
 */

export interface Lesson {
  /** Slug-style unique id, used in the URL (?aula=<id>) and localStorage key. */
  id: string;
  /** Short title shown in the sidebar and below the player. */
  title: string;
  /** Longer description shown in the sidebar under the title. */
  description: string;
  /** Video source URL (Cloudinary / CDN). */
  videoUrl: string;
  /** Approximate duration; the PLAYER uses the video's real duration (loadedmetadata)
   *  for the 95% threshold, so this is only a display/fallback aid. */
  durationSec: number;
  /** Ordered index within the course, 0-based. Drives prev/next nav. */
  order: number;
}

export interface Module {
  id: string;
  /** "MUNDO 1", "MUNDO 2", etc. — shown as the expandable module header. */
  title: string;
  lessons: Lesson[];
}

/** Flattened lesson with module context attached. */
export interface CourseLesson {
  lesson: Lesson;
  module: Module;
  lessonIndex: number;
  moduleIndex: number;
}

/** Public placeholder video used for every lesson until real videos ship. */
export const PLACEHOLDER_VIDEO =
  "https://media.w3.org/2010/05/sintel/trailer_hd.mp4";

export const COURSE: Module[] = [];

/** Flattened, globally-ordered lesson list with module context attached. */
export function flattenCourse(course: Module[] = COURSE): CourseLesson[] {
  const out: CourseLesson[] = [];
  course.forEach((module, moduleIndex) => {
    module.lessons
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((lesson, lessonIndex) => {
        out.push({ lesson, module, lessonIndex, moduleIndex });
      });
  });
  out.sort((a, b) => a.lesson.order - b.lesson.order);
  return out;
}

export const COURSE_LESSONS: CourseLesson[] = flattenCourse();

export function getLesson(id: string): CourseLesson | undefined {
  return COURSE_LESSONS.find((c) => c.lesson.id === id);
}

export function getAdjacentLessons(id: string) {
  const idx = COURSE_LESSONS.findIndex((c) => c.lesson.id === id);
  if (idx === -1)
    return { prev: undefined, current: undefined, next: undefined };
  return {
    prev: idx > 0 ? COURSE_LESSONS[idx - 1] : undefined,
    current: COURSE_LESSONS[idx],
    next:
      idx < COURSE_LESSONS.length - 1 ? COURSE_LESSONS[idx + 1] : undefined,
  };
}

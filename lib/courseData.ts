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

export const COURSE: Module[] = [
  {
    id: "mundo-1",
    title: "MUNDO 1 — Fundamentos de Manicure",
    lessons: [
      {
        id: "aula-1",
        title: "Bem-vinda ao Esmalt'up!",
        description:
          "Apresentação do curso e do que você vai aprender para montar sua assistência de manicure do zero.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 320,
        order: 0,
      },
      {
        id: "aula-2",
        title: "Equipamentos essenciais",
        description:
          "Conheça os instrumentos fundamentais: luz de LED, bisturis, lixas, toners e mais.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 410,
        order: 1,
      },
      {
        id: "aula-3",
        title: "Higiene e segurança na bancada",
        description:
          "Regras de higiene, descarte de material e organização para atender com tranquilidade.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 540,
        order: 2,
      },
    ],
  },
  {
    id: "mundo-2",
    title: "MUNDO 2 — Preparação da Unha",
    lessons: [
      {
        id: "aula-4",
        title: "Avaliação da unha e forma ideal",
        description:
          "Entenda como analisar o comprimento, a forma e a saúde da unha de cada cliente.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 370,
        order: 3,
      },
      {
        id: "aula-5",
        title: "Lixa, esmalta e desinfecção",
        description:
          "Técnicas de preparação mecânica e a sequência correta de limpeza.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 480,
        order: 4,
      },
      {
        id: "aula-6",
        title: "Corte e esmaltação correta",
        description: "Como esculpir e nivelar a unha sem agredi-la.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 460,
        order: 5,
      },
    ],
  },
    {
    id: "mundo-3",
    title: "MUNDO 3 — Base, Acabamento e Esmaltem",
    lessons: [
      {
        id: "aula-7",
        title: "Aplicação de base e selagem",
        description: "A técnica perfeita de base para durar mais e não rachar.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 390,
        order: 6,
      },
      {
        id: "aula-8",
        title: "Reforço com fibra de vidro",
        description: "Como aplicar a fibra para unhas fortes e definidas.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 520,
        order: 8,
      },
      {
        id: "aula-9",
        title: "Esmaltem clássico e detalhes",
        description: "Pintura uniforme, limpeza de borda e a linha de corte.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 510,
        order: 7,
      },
    ],
  },
  {
    id: "mundo-4",
    title: "MUNDO 4 — Esmaltamento Avançado",
    lessons: [
      {
        id: "aula-10",
        title: "Técnica do ombrelé e degradê",
        description: "Crie transições suaves de cor com esponja e pincel técnico.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 600,
        order: 9,
      },
      {
        id: "aula-11",
        title: "French moderno e brilho perfeito",
        description: "Faixas elegantes e selagem esculpida com brilho espremido.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 560,
        order: 10,
      },
      {
        id: "aula-12",
        title: "Acabamento e cuidados pós-atendimento",
        description: "Finalizando a unha e orientando a cliente para a rotina em casa.",
        videoUrl: PLACEHOLDER_VIDEO,
        durationSec: 470,
        order: 11,
      },
    ],
  },
];

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

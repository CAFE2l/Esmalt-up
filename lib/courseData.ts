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
  /** Free supplementary YouTube classes + playlists for this module. */
  youtubeResources?: YouTubeResource[];
}

export interface YouTubeResource {
  id: string;
  /** Video or playlist title. */
  title: string;
  /** Channel / creator name. */
  channel: string;
  /** YouTube embed URL (`/embed/...` or `/embed/videoseries?list=...`). */
  embedUrl: string;
  /** True when this is a playlist embed instead of a single video. */
  isPlaylist?: boolean;
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

/** Free complete playlists (whole-course) shown beside every module. */
export const YOUTUBE_COURSE_PLAYLISTS: YouTubeResource[] = [
  {
    id: "playlist-manicure-pedicure",
    title: "Manicure e Pedicure (curso gratuito)",
    channel: "Wanessa Guedes",
    embedUrl:
      "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64JfWbmnUcfOD7qwXNBgUgvd",
    isPlaylist: true,
  },
  {
    id: "playlist-fibra-de-vidro",
    title: "Alongamento em unha fibra de vidro e F1",
    channel: "Wanessa Guedes",
    embedUrl:
      "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64K__1DrW3DO7o4bzwHUtqVH",
    isPlaylist: true,
  },
  {
    id: "playlist-esmaltacao-gel",
    title: "Esmaltação em gel e semi definitiva",
    channel: "Wanessa Guedes",
    embedUrl:
      "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64IjEY4lh8QivLQVHa3Y-5Eg",
    isPlaylist: true,
  },
  {
    id: "playlist-blindagem",
    title: "Blindagem de unhas",
    channel: "Wanessa Guedes",
    embedUrl:
      "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64JAG1JR1Az6kUeUwBAjoTsw",
    isPlaylist: true,
  },
  {
    id: "playlist-plastica-dos-pes",
    title: "Plástica dos pés",
    channel: "Wanessa Guedes",
    embedUrl:
      "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64IGewR30aV4zlZ41Yzh-zmX",
    isPlaylist: true,
  },
];

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
    youtubeResources: [
      {
        id: "yt-estilizacao-autoclave",
        title: "Esterilização segura sem autoclave",
        channel: "Michelli Specht",
        embedUrl: "https://www.youtube.com/embed/qvWC-BGs45k",
      },
      {
        id: "yt-limpeza-perfeita",
        title: "O Segredo da Limpeza Perfeita",
        channel: "Canal Manicure Profissional",
        embedUrl: "https://www.youtube.com/embed/paM5oSYuW-w",
      },
      {
        id: "yt-esterilizacao-estufa",
        title: "Passo a passo de como esterilizar na estufa",
        channel: "Trix Nail Designer",
        embedUrl: "https://www.youtube.com/embed/3XALkCGKdGk",
      },
      {
        id: "yt-estudo-teorico",
        title: "Estudo teórico completo – ebook manicure e pedicure (Aula 7)",
        channel: "Wanessa Guedes",
        embedUrl: "https://www.youtube.com/embed/XiIR7022fYg",
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
    youtubeResources: [
      {
        id: "yt-remocao-cuticula",
        title: "Aula 05 — Remoção da Cutícula",
        channel: "Profissionaliza Mais",
        embedUrl: "https://www.youtube.com/embed/65FwAng3B3Y",
      },
      {
        id: "yt-cuticula-fina",
        title: "Como fazer cutícula fina na mão da cliente",
        channel: "Faby Cardoso",
        embedUrl: "https://www.youtube.com/embed/JL-fXvap2mQ",
      },
      {
        id: "yt-unhas-do-zero",
        title: "Fazendo as unhas comigo do zero",
        channel: "Unhas Luz e Ação",
        embedUrl: "https://www.youtube.com/embed/v2tCBYkHbQ8",
      },
      {
        id: "yt-manicure-tradicional",
        title: "Manicure tradicional, fácil de fazer",
        channel: "Aura Esmalteria",
        embedUrl: "https://www.youtube.com/embed/Ul9GIBWtd6Y",
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
    youtubeResources: [
      {
        id: "yt-aulao-fibra-vidro",
        title: "Aulão completo de alongamento em unha fibra de vidro (Aula 4)",
        channel: "Wanessa Guedes",
        embedUrl: "https://www.youtube.com/embed/tBPN7-lCgqA",
      },
      {
        id: "yt-esmaltacao-tradicional",
        title: "Esmaltação tradicional feita por manicure brasileira",
        channel: "Canal Gringa",
        embedUrl: "https://www.youtube.com/embed/a9fHoSYvyFQ",
      },
      {
        id: "yt-curso-cutilagem",
        title: "Curso completo de cutilagem, esmaltação, unhas artísticas",
        channel: "Wanessa Guedes",
        embedUrl: "https://www.youtube.com/embed/5aOkQJtimp0",
      },
      {
        id: "yt-blindagem-completa",
        title: "Blindagem de unhas (Playlist)",
        channel: "Wanessa Guedes",
        embedUrl:
          "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64JAG1JR1Az6kUeUwBAjoTsw",
        isPlaylist: true,
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
    youtubeResources: [
      {
        id: "yt-francesinhas-coloridas",
        title:
          "Tendência do momento: esmaltes coloridos são o segredo para atualizar as francesinhas",
        channel: "Tia do Esmalte",
        embedUrl: "https://www.youtube.com/embed/v7BP0js-3LA",
      },
      {
        id: "yt-francesinha-pes",
        title: "Pés com francesinha fininha e delicada",
        channel: "Faby Ana Molinari",
        embedUrl: "https://www.youtube.com/embed/gJiwtmbczl0",
      },
      {
        id: "yt-clean-rosa",
        title: "Misturinha clean com fundo rosa transparente e com francesinha",
        channel: "Faby Ana Molinari",
        embedUrl: "https://www.youtube.com/embed/UihLjX95yYI",
      },
      {
        id: "yt-esmaltacao-gel",
        title: "Esmaltação em gel e semi definitiva (Playlist)",
        channel: "Wanessa Guedes",
        embedUrl:
          "https://www.youtube.com/embed/videoseries?list=PLWnolLl7b64IjEY4lh8QivLQVHa3Y-5Eg",
        isPlaylist: true,
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

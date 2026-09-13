/**
 * Esmalt'up — Curso Preparatório
 *
 * Static course content. Lessons point to YouTube embeds (real manicure
 * classes from public channels) or, for the intro lesson, a local MP4.
 *
 * VIDEOS:
 *   YouTube lessons use `https://www.youtube.com/embed/<id>` URLs and are
 *   played by CursoVideoPlayer via the YouTube IFrame Player API so the
 *   95% watch-completion gate still applies. Playlist-only content
 *   ("videoseries?list=…") lives in `youtubeResources` / extras and is NOT
 *   part of the linear progress-tracked lessons.
 *
 * ATTRIBUTION:
 *   None of these classes are Esmalt'up originals. Each lesson carries a
 *   `channel` so the UI can render "vídeo por [Canal]" under the player.
 *
 * PERSISTENCE:
 *   See lib/useCourseProgress.ts — completed + per-lesson "watched"
 *   flags live in localStorage (key: esmaltup-curso-progress).
 */

export interface Lesson {
  /** Slug-style unique id, used in the URL (?aula=<id>) and localStorage key. */
  id: string;
  /** Short title shown in the sidebar and below the player. */
  title: string;
  /** Longer description shown in the sidebar under the title. */
  description: string;
  /** Video source URL (YouTube embed or MP4/CDN). */
  videoUrl: string;
  /** Original creator/channel for attribution ("vídeo por [Canal]"). */
  channel?: string;
  /** Approximate duration; the PLAYER uses the video's real duration for
   * the 95% threshold, so this is only a display/fallback aid. */
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

/** Intro lesson only — kept until an Esmalt'up-produced welcome video ships. */
export const PLACEHOLDER_VIDEO =
  "https://media.w3.org/2010/05/sintel/trailer_hd.mp4";

/** True when a URL is a YouTube single-video embed (`/embed/<id>`). */
export function isYouTubeEmbed(url: string): boolean {
  return /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//.test(url);
}

/** Free complete playlists (whole-course) shown as "Recursos Extras". */
export const YOUTUBE_COURSE_PLAYLISTS: YouTubeResource[] = [
  {
    id: "playlist-manicure-pedicure",
    title: "Manicure e Pedicure (curso gratuito completo)",
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
        title: "Estudo teórico completo – ebook manicure e pedicure",
        description:
          "Fundamentos teóricos essenciais para começar com segurança e profissionalismo.",
        videoUrl: "https://www.youtube.com/embed/XiIR7022fYg",
        channel: "Wanessa Guedes",
        durationSec: 1800,
        order: 1,
      },
      {
        id: "aula-3",
        title: "Esterilização segura sem autoclave",
        description:
          "Como esterilizar instrumentos com segurança quando a autoclave não está disponível.",
        videoUrl: "https://www.youtube.com/embed/qvWC-BGs45k",
        channel: "Michelli Specht",
        durationSec: 900,
        order: 2,
      },
      {
        id: "aula-4",
        title: "O Segredo da Limpeza Perfeita",
        description:
          "Rotina de limpeza e organização da bancada antes de cada atendimento.",
        videoUrl: "https://www.youtube.com/embed/paM5oSYuW-w",
        channel: "Canal Manicure Profissional",
        durationSec: 720,
        order: 3,
      },
    ],
    youtubeResources: [
      {
        id: "yt-esterilizacao-estufa",
        title: "Passo a passo de como esterilizar na estufa",
        channel: "Trix Nail Designer",
        embedUrl: "https://www.youtube.com/embed/3XALkCGKdGk",
      },
    ],
  },
  {
    id: "mundo-2",
    title: "MUNDO 2 — Preparação da Unha",
    lessons: [
      {
        id: "aula-5",
        title: "Remoção da Cutícula",
        description:
          "Técnica passo a passo para remover a cutícula com segurança.",
        videoUrl: "https://www.youtube.com/embed/65FwAng3B3Y",
        channel: "Profissionaliza Mais",
        durationSec: 1500,
        order: 4,
      },
      {
        id: "aula-6",
        title: "Como fazer cutícula fina na mão da cliente",
        description:
          "Acabamento delicado da cutícula para um resultado profissional.",
        videoUrl: "https://www.youtube.com/embed/JL-fXvap2mQ",
        channel: "Faby Cardoso",
        durationSec: 1200,
        order: 5,
      },
      {
        id: "aula-7",
        title: "Fazendo as unhas comigo do zero",
        description:
          "Preparação completa da unha em um atendimento na prática.",
        videoUrl: "https://www.youtube.com/embed/v2tCBYkHbQ8",
        channel: "Unhas Luz e Ação",
        durationSec: 1800,
        order: 6,
      },
      {
        id: "aula-8",
        title: "Manicure tradicional, fácil de fazer",
        description:
          "Roteiro completo da manicure tradicional para reproduzir no dia a dia.",
        videoUrl: "https://www.youtube.com/embed/Ul9GIBWtd6Y",
        channel: "Aura Esmalteria",
        durationSec: 1500,
        order: 7,
      },
    ],
  },
  {
    id: "mundo-3",
    title: "MUNDO 3 — Base, Acabamento e Esmaltagem",
    lessons: [
      {
        id: "aula-9",
        title: "Aulão completo de alongamento em unha fibra de vidro",
        description:
          "Alongamento estruturado com fibra de vidro, do preparo ao acabamento.",
        videoUrl: "https://www.youtube.com/embed/tBPN7-lCgqA",
        channel: "Wanessa Guedes",
        durationSec: 2700,
        order: 8,
      },
      {
        id: "aula-10",
        title: "Esmaltação tradicional feita por manicure brasileira",
        description:
          "Esmaltação limpa e uniforme, direto da rotina de uma profissional.",
        videoUrl: "https://www.youtube.com/embed/a9fHoSYvyFQ",
        channel: "Canal Gringa",
        durationSec: 1200,
        order: 9,
      },
      {
        id: "aula-11",
        title: "Curso completo de cutilagem, esmaltação, unhas artísticas",
        description:
          "Sequência completa: cutilagem, esmaltação e introdução às unhas artísticas.",
        videoUrl: "https://www.youtube.com/embed/5aOkQJtimp0",
        channel: "Wanessa Guedes",
        durationSec: 2400,
        order: 10,
      },
    ],
    youtubeResources: [
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
        id: "aula-12",
        title: "Esmaltes coloridos atualizam as francesinhas",
        description:
          "Releitura criativa da francesinha com esmaltes coloridos.",
        videoUrl: "https://www.youtube.com/embed/v7BP0js-3LA",
        channel: "Tia do Esmalte",
        durationSec: 900,
        order: 11,
      },
      {
        id: "aula-13",
        title: "Pés com francesinha fininha e delicada",
        description:
          "Francesinha delicada para os pés com acabamento impecável.",
        videoUrl: "https://www.youtube.com/embed/gJiwtmbczl0",
        channel: "Faby Ana Molinari",
        durationSec: 1200,
        order: 12,
      },
      {
        id: "aula-14",
        title: "Misturinha clean com fundo rosa e francesinha",
        description:
          "Composição clean e sofisticada com fundo rosa transparente.",
        videoUrl: "https://www.youtube.com/embed/UihLjX95yYI",
        channel: "Faby Ana Molinari",
        durationSec: 1500,
        order: 13,
      },
    ],
    youtubeResources: [
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
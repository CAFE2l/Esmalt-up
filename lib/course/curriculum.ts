import playlists from "./playlists.json";
import { parseDuration, youtubeThumb } from "./youtube";

export type CurriculumLesson = {
  slug: string;
  title: string;
  description: string;
  youtubeVideoId: string | null;
  youtubePlaylistId: string | null;
  channel: string;
  durationSec: number | null;
  thumbnailUrl: string | null;
  orderIndex: number;
  kind?: 'video' | 'text';
};

export type CurriculumModule = {
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: CurriculumLesson[];
};

type PlaylistVideo = { id: string; title: string; length: string | null };
type PlaylistDump = {
  playlistId: string;
  totalVideos: number | null;
  videos: PlaylistVideo[];
};

const PLAYLISTS = playlists as Record<string, PlaylistDump>;

/** Promotional / checkout clips that are not lessons. */
export const SKIPPED_VIDEO_IDS = new Set([
  "OkllxsFaPww", // Treinamento pago R$28,90
  "PNNqvFLXuj0", // Curso pago R$58,90
  "GYNs-uXfSjM", // Pagamento Hotmart
]);

type ExtraVideo = {
  id: string;
  title: string;
  description: string;
  channel: string;
  durationSec?: number;
  module: string;
};

/**
 * Standalone videos that already lived on the landing page / player
 * and are not part of the five Wanessa playlists.
 */
const EXTRA_VIDEOS: ExtraVideo[] = [
  {
    id: "qvWC-BGs45k",
    title: "Esterilização segura sem autoclave",
    description:
      "Como esterilizar instrumentos com segurança quando a autoclave não está disponível.",
    channel: "Michelli Specht",
    durationSec: 900,
    module: "mundo-1",
  },
  {
    id: "paM5oSYuW-w",
    title: "O Segredo da Limpeza Perfeita",
    description:
      "Rotina de limpeza e organização da bancada antes de cada atendimento.",
    channel: "Canal Manicure Profissional",
    durationSec: 720,
    module: "mundo-1",
  },
  {
    id: "3XALkCGKdGk",
    title: "Passo a passo de como esterilizar na estufa",
    description: "Guia completo de esterilização na estufa para manicures.",
    channel: "Trix Nail Designer",
    durationSec: 900,
    module: "mundo-1",
  },
  {
    id: "XiIR7022fYg",
    title: "Estudo teórico completo – ebook manicure e pedicure",
    description:
      "Fundamentos teóricos essenciais para começar com segurança e profissionalismo.",
    channel: "Wanessa Guedes",
    durationSec: 1800,
    module: "mundo-1",
  },
  {
    id: "65FwAng3B3Y",
    title: "Remoção da Cutícula",
    description: "Técnica passo a passo para remover a cutícula com segurança.",
    channel: "Profissionaliza Mais",
    durationSec: 1500,
    module: "mundo-2",
  },
  {
    id: "JL-fXvap2mQ",
    title: "Como fazer cutícula fina na mão da cliente",
    description: "Acabamento delicado da cutícula para um resultado profissional.",
    channel: "Faby Cardoso",
    durationSec: 1200,
    module: "mundo-2",
  },
  {
    id: "v2tCBYkHbQ8",
    title: "Fazendo as unhas comigo do zero",
    description: "Preparação completa da unha em um atendimento na prática.",
    channel: "Unhas Luz e Ação",
    durationSec: 1800,
    module: "mundo-2",
  },
  {
    id: "Ul9GIBWtd6Y",
    title: "Manicure tradicional, fácil de fazer",
    description:
      "Roteiro completo da manicure tradicional para reproduzir no dia a dia.",
    channel: "Aura Esmalteria",
    durationSec: 1500,
    module: "mundo-2",
  },
  {
    id: "a9fHoSYvyFQ",
    title: "Esmaltação tradicional feita por manicure brasileira",
    description: "Esmaltação limpa e uniforme, direto da rotina de uma profissional.",
    channel: "Canal Gringa",
    durationSec: 1200,
    module: "mundo-3",
  },
  {
    id: "5aOkQJtimp0",
    title: "Curso completo de cutilagem, esmaltação, unhas artísticas",
    description:
      "Sequência completa: cutilagem, esmaltação e introdução às unhas artísticas.",
    channel: "Wanessa Guedes",
    durationSec: 2400,
    module: "mundo-3",
  },
  {
    id: "v7BP0js-3LA",
    title: "Esmaltes coloridos atualizam as francesinhas",
    description: "Releitura criativa da francesinha com esmaltes coloridos.",
    channel: "Tia do Esmalte",
    durationSec: 900,
    module: "mundo-3",
  },
  {
    id: "gJiwtmbczl0",
    title: "Pés com francesinha fininha e delicada",
    description: "Francesinha delicada para os pés com acabamento impecável.",
    channel: "Faby Ana Molinari",
    durationSec: 1200,
    module: "mundo-3",
  },
  {
    id: "UihLjX95yYI",
    title: "Misturinha clean com fundo rosa e francesinha",
    description: "Composição clean e sofisticada com fundo rosa transparente.",
    channel: "Faby Ana Molinari",
    durationSec: 1500,
    module: "mundo-3",
  },
];

const MODULES_META: { slug: string; title: string; description: string }[] = [
  {
    slug: "mundo-1",
    title: "Mundo 1 — Fundamentos de Manicure",
    description: "Higiene, esterilização, materiais, teoria e primeiros treinos.",
  },
  {
    slug: "mundo-2",
    title: "Mundo 2 — Preparação da Unha",
    description: "Cutilagem, preparação das mãos e dos pés, plástica dos pés.",
  },
  {
    slug: "mundo-3",
    title: "Mundo 3 — Base, Acabamento e Esmaltação",
    description: "Esmaltação tradicional, francesinha, adesivos e acabamento.",
  },
  {
    slug: "mundo-4",
    title: "Mundo 4 — Esmaltamento Avançado",
    description:
      "Blindagem em gel, esmaltação semi definitiva, fibra de vidro e F1.",
  },
];

/** Playlist video IDs assigned to Mundo 1 (hygiene + theory + intro). */
const MUNDO_1_PLAYLIST_IDS = new Set([
  "OshByUcCkqA",
  "X3eUD3izzro",
  "pOufCYK-Kas",
  "lmqGqRktOO0",
  "iG5wtHt0MRU",
  "HDyGcoCPNNI",
  "csRQLjslaHQ",
  "ND6z7aJ1LA4",
  "fxUamnNxdz8",
  "pd83w4pyD3w",
]);

/** Prep / cutilagem from the manicure playlist + plástica dos pés. */
const MUNDO_2_PLAYLIST_IDS = new Set([
  "Ed8fMbMgWRI",
  "3Z-9Jfj1_aU",
  "9tHLoTOSKb8",
  "X4ZNy8DOfl8",
  "wNOgx46RMyc",
  "JCGDQuu4jfQ",
  "ndwuXw0A_lE",
  "y-XNeszSzXU",
  "HL9QPPI24Sc",
  "JbC5tsqhbAU",
  "2I4O2zABUro",
  "3B4HvqCeDFc",
  "vV1afS12hxM",
  "d31IlRFSbfw",
  "N-yYrV5zocQ",
  "35vbHn5wup8",
  "2icBIko-e_E",
  "--i8bqezxDg",
  // plástica dos pés
  "rGefxyxtHkA",
  "VS5MzhacaPg",
  "agGd-w6Qenw",
  "GaycR51BrUI",
  "jiK-vz5BqUg",
  "e-P6xf-O6fQ",
  "azK0Ywh9EAs",
]);

/** Traditional polish / finishing from the manicure playlist. */
const MUNDO_3_PLAYLIST_IDS = new Set([
  "OzxHOH91myg",
  "ZtMhgTxTiGk",
  "96waB36GiUc",
  "GI-xgy7oqXU",
  "1oH03pQWh20",
  "ZL8Rwryx0GM",
  "Hy6QEqvGKMk",
  "1BV5xCyVw7I",
  "E3JBd-bDbI8",
  "NxAlJwAQBHU",
  "H5pMJwNSI8A",
  "sN05DwW6xvc",
]);

function shortDescription(title: string, channel: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  return `${clean} — vídeo de ${channel}.`;
}

function toLesson(
  video: PlaylistVideo,
  channel: string,
  orderIndex: number,
): CurriculumLesson {
  return {
    slug: `yt-${video.id}`,
    title: video.title.replace(/\s+/g, " ").trim(),
    description: shortDescription(video.title, channel),
    youtubeVideoId: video.id,
    youtubePlaylistId: null,
    channel,
    durationSec: parseDuration(video.length),
    thumbnailUrl: youtubeThumb(video.id),
    orderIndex,
  };
}

function moduleOfPlaylistVideo(id: string, playlistKey: string): string | null {
  if (MUNDO_1_PLAYLIST_IDS.has(id)) return "mundo-1";
  if (MUNDO_2_PLAYLIST_IDS.has(id)) return "mundo-2";
  if (MUNDO_3_PLAYLIST_IDS.has(id)) return "mundo-3";
  if (
    playlistKey === "playlist-fibra-de-vidro" ||
    playlistKey === "playlist-blindagem" ||
    playlistKey === "playlist-esmaltacao-gel"
  ) {
    return "mundo-4";
  }
  return null;
}

export type CurriculumBuildReport = {
  modules: CurriculumModule[];
  skipped: { id: string; title: string; reason: string }[];
  unassigned: { id: string; title: string; playlist: string }[];
  duplicatesDropped: string[];
  playlistTotals: Record<string, { fetched: number; kept: number }>;
};

export function buildCurriculum(): CurriculumBuildReport {
  const skipped: CurriculumBuildReport["skipped"] = [];
  const unassigned: CurriculumBuildReport["unassigned"] = [];
  const duplicatesDropped: string[] = [];
  const seen = new Set<string>();
  const buckets: Record<string, CurriculumLesson[]> = {
    "mundo-1": [],
    "mundo-2": [],
    "mundo-3": [],
    "mundo-4": [],
  };
  const playlistTotals: CurriculumBuildReport["playlistTotals"] = {};

  const push = (module: string, lesson: CurriculumLesson, videoId: string | null) => {
    if (videoId) {
      if (SKIPPED_VIDEO_IDS.has(videoId)) {
        skipped.push({
          id: videoId,
          title: lesson.title,
          reason: "Conteúdo promocional / pagamento, não é aula.",
        });
        return;
      }
      if (seen.has(videoId)) {
        duplicatesDropped.push(videoId);
        return;
      }
      seen.add(videoId);
    }
    buckets[module]?.push(lesson);
  };

  // Welcome text-only intro lesson (no real video yet — flag for future video ID)
  const welcomeLesson: CurriculumLesson = {
    slug: "bem-vinda-ao-esmaltup",
    title: "Bem-vinda ao Esmalt'up!",
    description: "Apresentação do curso: o que você vai aprender, como os módulos funcionam e como acompanhar seu progresso.",
    youtubeVideoId: null,
    youtubePlaylistId: null,
    channel: "Esmalt'up",
    durationSec: null,
    thumbnailUrl: null,
    orderIndex: -1,
    kind: 'text',
  };
  buckets["mundo-1"]!.push(welcomeLesson);

  // Hygiene / theory extras first so Mundo 1 opens with sterilization.
  const extraFirst = EXTRA_VIDEOS.filter((v) => v.module === "mundo-1").slice(0, 3);
  const extraRest = EXTRA_VIDEOS.filter((v) => !extraFirst.includes(v));

  for (const extra of extraFirst) {
    push(extra.module, {
      slug: `yt-${extra.id}`,
      title: extra.title,
      description: extra.description,
      youtubeVideoId: extra.id,
      youtubePlaylistId: null,
      channel: extra.channel,
      durationSec: extra.durationSec ?? null,
      thumbnailUrl: youtubeThumb(extra.id),
      orderIndex: 0,
    }, extra.id);
  }

  for (const [key, dump] of Object.entries(PLAYLISTS)) {
    let kept = 0;
    for (const video of dump.videos) {
      const mod = moduleOfPlaylistVideo(video.id, key);
      if (!mod) {
        if (SKIPPED_VIDEO_IDS.has(video.id)) {
          skipped.push({
            id: video.id,
            title: video.title,
            reason: "Conteúdo promocional / pagamento, não é aula.",
          });
        } else {
          unassigned.push({ id: video.id, title: video.title, playlist: key });
        }
        continue;
      }
      const before = buckets[mod]!.length;
      push(mod, toLesson(video, "Wanessa Guedes", 0), video.id);
      if (buckets[mod]!.length > before) kept += 1;
    }
    playlistTotals[key] = { fetched: dump.videos.length, kept };
  }

  for (const extra of extraRest) {
    push(extra.module, {
      slug: `yt-${extra.id}`,
      title: extra.title,
      description: extra.description,
      youtubeVideoId: extra.id,
      youtubePlaylistId: null,
      channel: extra.channel,
      durationSec: extra.durationSec ?? null,
      thumbnailUrl: youtubeThumb(extra.id),
      orderIndex: 0,
    }, extra.id);
  }

  const modules: CurriculumModule[] = MODULES_META.map((meta, index) => ({
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    orderIndex: index,
    lessons: (buckets[meta.slug] ?? []).map((lesson, i) => ({
      ...lesson,
      orderIndex: i,
    })),
  }));

  return { modules, skipped, unassigned, duplicatesDropped, playlistTotals };
}

export const CURRICULUM = buildCurriculum();

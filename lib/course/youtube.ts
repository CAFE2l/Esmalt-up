export function parseDuration(length: string | null | undefined): number | null {
  if (!length) return null;
  const parts = length.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 1) return parts[0]!;
  return null;
}

export function formatDuration(sec: number | null | undefined): string {
  if (!sec || sec < 0 || !Number.isFinite(sec)) return "";
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string, origin?: string): string {
  const params = new URLSearchParams({
    enablejsapi: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (origin) params.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function youtubePlaylistEmbedUrl(playlistId: string, origin?: string): string {
  const params = new URLSearchParams({
    listType: "playlist",
    list: playlistId,
    enablejsapi: "1",
    rel: "0",
    playsinline: "1",
  });
  if (origin) params.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
}

export function youtubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export type OEmbedResult =
  | { ok: true; title: string; author: string; thumbnail: string }
  | { ok: false; error: string };

export async function fetchOEmbed(videoId: string): Promise<OEmbedResult> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeWatchUrl(videoId))}&format=json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Incorporação desativada pelo canal." };
    }
    if (res.status === 404) {
      return { ok: false, error: "Vídeo indisponível." };
    }
    if (!res.ok) {
      return { ok: false, error: `oEmbed HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      ok: true,
      title: data.title ?? "",
      author: data.author_name ?? "",
      thumbnail: data.thumbnail_url ?? youtubeThumb(videoId),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao validar o vídeo.",
    };
  }
}

export function extractYouTubeVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }
  if (/^[\w-]{11}$/.test(input)) return input;
  return null;
}

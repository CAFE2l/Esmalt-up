"use client";

import {
  YOUTUBE_COURSE_PLAYLISTS,
  type YouTubeResource,
} from "@/lib/courseData";

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <polygon points="8 5 8 19 19 12z" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

function ResourceCard({ resource }: { resource: YouTubeResource }) {
  return (
    <div className="flex flex-col gap-2 overflow-hidden rounded-2xl border border-cinza-suave/40 bg-branco shadow-card">
      <div className="relative aspect-video bg-[#0a0709]">
        <iframe
          src={resource.embedUrl}
          title={resource.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      <div className="flex flex-col gap-1 px-3 pb-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-rose-gold">
            {resource.isPlaylist ? <ListIcon /> : <PlayIcon />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {resource.title}
            </p>
          </div>
        </div>
        <p className="line-clamp-1 text-xs text-foreground/60">
          <span className="font-medium text-rose-gold">Canal:</span>{" "}
          {resource.channel}
        </p>
        {resource.isPlaylist && (
          <span className="inline-flex w-fit rounded-full bg-rosa-claro/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-rose-gold">
            Playlist
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  /** Resources recommended for the currently-open module. */
  moduleResources?: YouTubeResource[];
}

export default function CursoYouTubeResources({
  moduleResources,
}: Props) {
  return (
    <section className="mt-8 rounded-3xl border border-cinza-suave/40 bg-branco p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-rose-gold">
          Aulas Bônus e Recursos
        </span>
        <span className="h-px flex-1 bg-cinza-suave/40" />
      </div>
      <p className="mt-1.5 text-sm text-foreground/70">
        Conteúdo gratuito dos melhores canais para aprofundar cada módulo do curso.
      </p>

      {moduleResources && moduleResources.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Aulas deste módulo
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {moduleResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}

      {YOUTUBE_COURSE_PLAYLISTS.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Recursos Extras — Playlists completas
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {YOUTUBE_COURSE_PLAYLISTS.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
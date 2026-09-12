import type { Metadata } from "next";
import CursoApp from "@/components/curso/CursoApp";

export const metadata: Metadata = {
  title: "Curso Preparatório",
  description:
    "Curso preparatório Esmalt'up: manicure do zero ao primeiro cliente. Aulas em vídeo com exercícios práticos.",
};

// The course page reads the `?aula=` query param and (on the client) the
// user's saved progress, so it must render per-request instead of being
// prerendered statically.
export const dynamic = "force-dynamic";

export default function CursoPage({
  searchParams,
}: {
  searchParams: { aula?: string };
}) {
  return <CursoApp initialLessonId={searchParams?.aula} />;
}
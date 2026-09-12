import type { Metadata } from "next";
import CursoApp from "@/components/curso/CursoApp";

export const metadata: Metadata = {
  title: "Curso Preparatório",
  description:
    "Curso preparatório Esmalt'up: manicure do zero ao primeiro cliente. Aulas em vídeo com exercícios práticos.",
};

export default function CursoPage({
  searchParams,
}: {
  searchParams: { aula?: string };
}) {
  return <CursoApp initialLessonId={searchParams?.aula} />;
}
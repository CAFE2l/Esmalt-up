import type { Metadata } from "next";
import { getLessonBySlug } from "@/data/course";
import LessonPlayerView from "@/components/curso/LessonPlayerView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const lesson = getLessonBySlug(params.slug);
  if (!lesson) {
    return {
      title: "Aula não encontrada | Curso Esmalt'up",
    };
  }
  return {
    title: `${lesson.title} | Curso Esmalt'up`,
    description: lesson.description || "Aula preparatória prática do curso Esmalt'up.",
  };
}

export default function LessonPage({
  params,
}: {
  params: { slug: string };
}) {
  return <LessonPlayerView slug={params.slug} />;
}

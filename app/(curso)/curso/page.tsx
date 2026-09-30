import type { Metadata } from "next";
import { Suspense } from "react";
import CoursePath from "@/components/curso/CoursePath";
import CourseSkeleton from "@/components/curso/CourseSkeleton";

export const metadata: Metadata = {
  title: "Curso Preparatório | Trilha de Aulas",
  description:
    "Curso preparatório Esmalt'up: aprenda manicure, esterilização, unhas de gel e carreira em uma trilha gamificada.",
};

export const dynamic = "force-dynamic";

export default function CursoPage() {
  return (
    <Suspense fallback={<CourseSkeleton />}>
      <CoursePath />
    </Suspense>
  );
}
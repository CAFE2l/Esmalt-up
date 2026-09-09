import type { Metadata } from "next";
import SectionPlaceholder from "@/components/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Curso Preparatório",
};

export default function CursoPage() {
  return (
    <SectionPlaceholder
      title="Curso Preparatório"
      description="Tudo o que você precisa para montar a sua própria assistência de manicure, do zero ao primeiro cliente."
    />
  );
}
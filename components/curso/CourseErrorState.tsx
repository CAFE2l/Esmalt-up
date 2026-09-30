"use client";

import { RefreshCw, AlertCircle } from "lucide-react";
import { primaryButton } from "../buttonStyles";

interface Props {
  onRetry: () => void;
  message?: string;
}

export default function CourseErrorState({
  onRetry,
  message = "Não foi possível carregar os dados do curso neste momento.",
}: Props) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rosa-medio/20 text-rose-gold ring-8 ring-rosa-medio/10">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Ops! Algo deu errado
      </h2>

      <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className={`${primaryButton} mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm shadow-card hover:shadow-card-lg active:scale-95`}
      >
        <RefreshCw className="h-4 w-4" />
        Tentar de novo
      </button>
    </div>
  );
}

"use client";

import Image from "next/image";

interface Props {
  className?: string;
  speechText?: string;
}

export default function MascotBrush({
  className = "",
  speechText = "Sua vez!",
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex flex-col items-center select-none ${className}`}
    >
      {/* Speech bubble */}
      {speechText && (
        <div className="relative mb-1 rounded-full border border-rose-gold/40 bg-branco px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-rose-gold shadow-sm">
          {speechText}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-rose-gold/40" />
        </div>
      )}

      {/* Mascot character */}
      <div className="relative h-12 w-12 sm:h-14 sm:w-14 animate-logo-float drop-shadow-[0_4px_12px_rgba(224,156,170,0.45)]">
        <Image
          src="/designs/icons/sem_background.png"
          alt="Mascote Esmalt'up"
          width={80}
          height={80}
          className="h-full w-full object-contain"
          priority
        />
        {/* Sparkle */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rosa-blush opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-gold" />
        </span>
      </div>
    </div>
  );
}

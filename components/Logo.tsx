import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textClass =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-xl"
        : "text-2xl";

  const imageSize = size === "lg" ? 72 : size === "sm" ? 48 : 52;

  return (
    <Link
      href="/"
      className={`group inline-flex items-center ${textClass} font-bold tracking-tight`}
    >
      <span
        className="mr-2.5 shrink-0 transition-all duration-300 ease-out group-hover:rotate-[4deg] group-hover:scale-[1.05] group-hover:drop-shadow-[0_0_10px_rgba(224,156,170,0.65)]"
        style={{ width: imageSize, height: imageSize }}
      >
        <span
          className="relative z-10 block h-full w-full animate-logo-float"
          style={{ "--float-amplitude": "2px" } as CSSProperties}
        >
          <Image
            src="/designs/icons/sem_background.png"
            alt="Logo Esmalt'up"
            width={524}
            height={476}
            className="h-full w-full rounded-full object-contain"
            priority
          />
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-sparkle text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]"
            style={{ left: "76%", top: "24%", width: "14%", height: "14%" }}
          >
            <path d="M12 0c0 6.6 5.4 12 12 12-6.6 0-12 5.4-12 12 0-6.6-5.4-12-12-12 6.6 0 12-5.4 12-12z" />
          </svg>
        </span>
        <span
          aria-hidden
          className="absolute bottom-[3px] left-1/2 h-[7px] w-[78%] -translate-x-1/2 animate-shadow-pulse rounded-[100%] bg-black/35 blur-[3px]"
        />
      </span>
      <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
        Esmalt&apos;up
      </span>
    </Link>
  );
}
import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textClass =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-xl"
        : "text-2xl";

  return (
    <Link
      href="/"
      className={`inline-flex items-center ${textClass} font-bold tracking-tight`}
    >
      <span
        aria-hidden
        className="mr-2.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow-card"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
          <circle cx="19" cy="6" r="1.6" fill="currentColor" opacity="0.7" />
        </svg>
      </span>
<span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
          Esmalt&apos;up
        </span>
    </Link>
  );
}
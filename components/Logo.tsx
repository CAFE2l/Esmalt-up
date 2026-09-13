import Link from "next/link";
import Image from "next/image";

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
      className={`inline-flex items-center ${textClass} font-bold tracking-tight`}
    >
      <Image
        src="/designs/icons/sem_background.png"
        alt="Logo Esmalt'up"
        width={524}
        height={476}
        className="mr-2.5 shrink-0 rounded-full object-contain"
        style={{ width: imageSize, height: imageSize }}
        priority
      />
      <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
        Esmalt&apos;up
      </span>
    </Link>
  );
}
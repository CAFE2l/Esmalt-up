import type { Product } from "@/lib/catalogData";

function Sparkles() {
  return (
    <>
      <path d="M18 22l1.2 3.8L23 27l-3.8 1.2L18 32l-1.2-3.8L13 27l3.8-1.2z" fill="#C98991" />
      <path d="M168 36l1.1 3.4L173 41l-3.9 1.2L168 46l-1.1-3.8L163 41l3.9-1.2z" fill="#E599A8" opacity="0.9" />
      <circle cx="150" cy="24" r="2.6" fill="#F3B6C7" />
    </>
  );
}

function Bottle() {
  return (
    <g>
      <rect x="74" y="18" width="52" height="34" rx="14" fill="#f3b6c7" />
      <rect x="80" y="24" width="14" height="22" rx="7" fill="#ffffff" opacity="0.35" />
      <rect x="84" y="50" width="32" height="14" rx="5" fill="#e599a8" />
      <path
        d="M78 64c-5 0-9 4-9 10 0 10-9 17-21 34-14 21-16 54-4 74 16 28 84 28 100 0 12-20 10-53-4-74-12-17-21-24-21-34 0-6-4-10-9-10z"
        fill="#fad0e6"
      />
      <ellipse cx="84" cy="118" rx="10" ry="32" fill="#ffffff" opacity="0.35" transform="rotate(-12 84 118)" />
    </g>
  );
}

function Lamp() {
  return (
    <g>
      <ellipse cx="100" cy="78" rx="62" ry="48" fill="#f3b6c7" />
      <ellipse cx="100" cy="78" rx="48" ry="34" fill="#23141a" />
      <ellipse cx="100" cy="78" rx="36" ry="22" fill="#fad0e6" opacity="0.35" />
      <rect x="88" y="122" width="24" height="36" rx="8" fill="#c98991" />
      <rect x="60" y="156" width="80" height="14" rx="7" fill="#e599a8" />
    </g>
  );
}

function File() {
  return (
    <g transform="rotate(-28 100 100)">
      <rect x="40" y="84" width="120" height="32" rx="16" fill="#f3b6c7" />
      <rect x="48" y="90" width="104" height="20" rx="10" fill="#fad0e6" />
      <path d="M52 100h96" stroke="#c98991" strokeWidth="2" strokeDasharray="4 6" />
    </g>
  );
}

function Bit() {
  return (
    <g>
      <rect x="92" y="28" width="16" height="70" rx="6" fill="#e599a8" />
      <path d="M88 98h24l-8 64h-8z" fill="#f3b6c7" />
      <circle cx="100" cy="28" r="14" fill="#c98991" />
    </g>
  );
}

function Tips() {
  return (
    <g>
      <path d="M58 150c0-40 10-96 22-110 8 20 14 70 14 110z" fill="#fad0e6" />
      <path d="M92 150c0-46 12-108 26-122 10 22 16 76 16 122z" fill="#f3b6c7" />
      <path d="M128 150c0-40 10-96 22-110 8 20 14 70 14 110z" fill="#e599a8" />
    </g>
  );
}

function Dropper() {
  return (
    <g>
      <rect x="86" y="18" width="28" height="40" rx="10" fill="#c98991" />
      <rect x="78" y="56" width="44" height="110" rx="18" fill="#fad0e6" />
      <ellipse cx="100" cy="120" rx="14" ry="28" fill="#e599a8" opacity="0.7" />
    </g>
  );
}

function Nipper() {
  return (
    <g stroke="#e599a8" strokeWidth="8" fill="none" strokeLinecap="round">
      <path d="M46 150c20-8 40-40 54-78" />
      <path d="M154 150c-20-8-40-40-54-78" />
      <path d="M90 70c4-16 16-28 10-44" />
      <path d="M110 70c-4-16-16-28-10-44" />
    </g>
  );
}

function Motor() {
  return (
    <g>
      <rect x="70" y="36" width="60" height="88" rx="22" fill="#f3b6c7" />
      <rect x="86" y="124" width="28" height="40" rx="10" fill="#c98991" />
      <circle cx="100" cy="70" r="16" fill="#fad0e6" />
      <rect x="94" y="160" width="12" height="22" rx="4" fill="#e599a8" />
    </g>
  );
}

function artFor(category: string, kind: Product["kind"]) {
  if (kind === "kit") return <Bottle />;
  switch (category) {
    case "cabine":
      return <Lamp />;
    case "lixas":
      return <File />;
    case "brocas":
      return <Bit />;
    case "tips":
    case "alongamento":
      return <Tips />;
    case "preparadores":
    case "finalizadores":
      return <Dropper />;
    case "alicates":
      return <Nipper />;
    case "motor":
      return <Motor />;
    default:
      return <Bottle />;
  }
}

export default function ProductArt({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  if (product.imageUrl) {
    return (
      // Cloudinary (or other CDN) URLs land here once assets exist.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-hidden
      className={className}
    >
      <Sparkles />
      {artFor(product.category, product.kind)}
    </svg>
  );
}

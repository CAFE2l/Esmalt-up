"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { outlineButton } from "@/components/buttonStyles";

interface ImageUploaderProps {
  value: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  folder: "banners" | "profiles";
  alt: string;
  mode: "banner" | "avatar";
  variant?: "card" | "overlay";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function ErrorMessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
      <circle cx={12} cy={12} r={10} />
      <line x1={15} y1={9} x2={9} y2={15} />
      <line x1={9} y1={9} x2={15} y2={15} />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

function BannerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x={3} y={3} width={18} height={18} rx={3} />
      <path d="M3 15l5-5 3 3 5-5 5 5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx={9} cy={9} r={1.2} />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`${className ?? "h-4 w-4"} animate-spin`}>
      <path d="M21 12a9 9 0 1 1-6.2-8.56" strokeLinecap="round" />
    </svg>
  );
}

export default function ImageUploader({ value, onUpload, onRemove, folder, alt, mode, variant = "card" }: ImageUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async () => {
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) {
      setError("Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("A imagem deve ter no maximo 5 MB.");
      return;
    }
    if (!user) {
      setError("Entre novamente para enviar a imagem.");
      return;
    }
    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const token = await user.getIdToken();
      const response = await fetch("/api/profile/upload", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ fileBase64, fileName: file.name, folder }),
      });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Nao foi possivel fazer o upload.");
      if (!data?.url) throw new Error("Nao foi possivel fazer o upload.");
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel fazer o upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setError(null);
    if (!user) {
      setError("Entre novamente para remover.");
      return;
    }
    setUploading(true);
    try {
      const token = await user.getIdToken();
      const field = folder === "banners" ? "bannerUrl" : "profilePhotoUrl";
      const response = await fetch(`/api/profile/upload?field=${field}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Nao foi possivel remover a imagem.");
      }
      onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel remover a imagem.");
    } finally {
      setUploading(false);
    }
  };

  if (mode === "avatar") {
    if (variant === "overlay") {
      return (
        <div className="relative">
          <input ref={inputRef} type="file" accept={acceptedTypes.join(",")} onChange={handleSelect} className="sr-only" aria-label="Selecionar foto de perfil" />
          <div className="relative h-20 w-20 sm:h-24 sm:w-24">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={alt} className="h-full w-full rounded-3xl border-4 border-branco object-cover shadow-card-lg" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-3xl border-4 border-branco bg-gradient-to-br from-rosa-blush to-rose-gold text-2xl font-bold text-white shadow-card-lg">
                {alt}
              </span>
            )}
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="Alterar foto de perfil" className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-branco bg-rose-gold text-white shadow-card transition-all hover:scale-105 hover:bg-rosa-blush active:scale-95 disabled:opacity-60">
              {uploading ? <Spinner className="h-4 w-4" /> : <CameraIcon className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="mt-2 flex max-w-[220px] items-center gap-1.5 text-xs text-rosa-blush"><ErrorMessageIcon />{error}</p>}
        </div>
      );
    }
    return (
      <div className="relative">
        <input ref={inputRef} type="file" accept={acceptedTypes.join(",")} onChange={handleSelect} className="sr-only" aria-label="Selecionar foto de perfil" />
        <div className="relative mx-auto h-28 w-28">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={alt} className="h-full w-full rounded-full object-cover shadow-card-lg" />
          ) : (
            <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-3xl font-bold text-white shadow-card-lg">{alt}</span>
          )}
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="Alterar foto de perfil" className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-branco bg-rose-gold text-white shadow-card transition-all hover:bg-rosa-blush disabled:opacity-60">
            {uploading ? <Spinner /> : <CameraIcon className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-rosa-blush"><ErrorMessageIcon />{error}</p>}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="relative">
        <input ref={inputRef} type="file" accept={acceptedTypes.join(",")} onChange={handleSelect} className="sr-only" aria-label="Selecionar banner" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-all hover:bg-black/60 active:scale-95 disabled:opacity-60">
            {uploading ? <Spinner className="h-3.5 w-3.5" /> : <BannerIcon className="h-3.5 w-3.5" />}
            {uploading ? "Enviando..." : value ? "Trocar capa" : "Adicionar capa"}
          </button>
          {value && (
            <button type="button" onClick={handleRemove} disabled={uploading} aria-label="Remover banner" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur transition-all hover:bg-black/60 active:scale-95 disabled:opacity-60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur"><ErrorMessageIcon />{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative">
      <input ref={inputRef} type="file" accept={acceptedTypes.join(",")} onChange={handleSelect} className="sr-only" aria-label="Selecionar banner" />
      <div className="relative h-40 w-full overflow-hidden rounded-2xl border-2 border-dashed border-cinza-suave/50 bg-rosa-claro/20 sm:h-48">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center px-4">
            <BannerIcon className="h-10 w-10 text-foreground/30" />
            <span className="text-sm text-foreground/60">Mostre seu studio: adicione uma capa 1200x400</span>
            <span className="text-xs text-foreground/40">JPG, PNG ou WebP ate 5 MB</span>
          </div>
        )}
        {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Spinner className="h-6 w-6 text-white" /></div>}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={`${outlineButton} px-4 py-1.5 text-xs ${uploading ? "cursor-not-allowed opacity-60" : ""}`}>
          {uploading ? "Enviando..." : value ? "Alterar banner" : "Adicionar banner"}
        </button>
        {value && (
          <button type="button" onClick={handleRemove} disabled={uploading} className={`${outlineButton} px-4 py-1.5 text-xs ${uploading ? "cursor-not-allowed opacity-60" : ""}`}>
            Remover
          </button>
        )}
      </div>
      {error && <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-rosa-blush"><ErrorMessageIcon />{error}</p>}
    </div>
  );
}

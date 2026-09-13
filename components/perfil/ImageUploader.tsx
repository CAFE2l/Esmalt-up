"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { outlineButton } from "@/components/buttonStyles";

interface ImageUploaderProps {
  /** Current image URL (if any) */
  value: string | null;
  /** Called after a successful upload */
  onUpload: (url: string) => void;
  /** Called after a successful removal */
  onRemove: () => void;
  /** Storage folder — "banners" or "profiles" */
  folder: "banners" | "profiles";
  /** Alt text for the image */
  alt: string;
  /** Aspect ratio / sizing mode */
  mode: "banner" | "avatar";
}

/** Convert a File to a base64 data URL string. */
function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function ErrorMessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
    >
      <circle cx={12} cy={12} r={10} />
      <line x1={15} y1={9} x2={9} y2={15} />
      <line x1={9} y1={9} x2={15} y2={15} />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 4.5a3.5 3.5 0 0 1 2.93 5.53A3 3 0 1 1 11 18a3 3 0 0 1 0-6 3 3 0 0 1 3.5 2.5" />
      <path d="M12 19h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1.5a2 2 0 0 1 0-4H7a2 2 0 0 1 0 4H5.5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8.5z" />
    </svg>
  );
}

function BannerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x={3} y={3} width={18} height={18} rx={3} />
      <path d="M3 15l5-5 3 3 5-5 5 5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx={9} cy={9} r={1} />
    </svg>
  );
}

export default function ImageUploader({
  value,
  onUpload,
  onRemove,
  folder,
  alt,
  mode,
}: ImageUploaderProps) {
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
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const token = await user!.getIdToken();
      const response = await fetch("/api/profile/upload", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          fileBase64,
          fileName: file.name,
          folder,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível fazer o upload.");
        return;
      }
      onUpload(data.url);
    } catch {
      setError("Não foi possível fazer o upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      const token = await user!.getIdToken();
      const response = await fetch(
        `/api/profile/upload?field=${folder === "banners" ? "bannerUrl" : "profilePhotoUrl"}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Não foi possível remover a imagem.");
        return;
      }
      onRemove();
        } catch {
      setError("Não foi possível remover a imagem.");
    }
  };

  if (mode === "avatar") {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleSelect}
          className="sr-only"
          aria-label="Selecionar foto de perfil"
        />
        <div className="relative mx-auto h-28 w-28">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={alt}
              className="h-full w-full rounded-full object-cover shadow-card-lg"
            />
          ) : (
            <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-3xl font-bold text-white shadow-card-lg">
              {alt}
            </span>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Alterar foto de perfil"
            className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-branco bg-rose-gold text-white shadow-card transition-all hover:bg-rosa-blush disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4 animate-spin"
              >
                <circle
                  className="opacity-25"
                  cx={12}
                  cy={12}
                  r={10}
                  stroke="currentColor"
                  strokeWidth={4}
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <CameraIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-rosa-blush">
            <ErrorMessageIcon />
            {error}
          </p>
        )}
      </div>
    );
  }

  // Banner mode
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleSelect}
        className="sr-only"
        aria-label="Selecionar banner"
      />
      <div className="relative h-48 w-full overflow-hidden rounded-3xl border-2 border-dashed border-cinza-suave/50 bg-rosa-claro/20">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            <BannerIcon className="h-12 w-12 text-foreground/30" />
            <span className="text-sm text-foreground/60">
              Banner personalizado
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${outlineButton} px-4 py-1.5 text-xs ${uploading ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {uploading ? "Enviando..." : value ? "Alterar banner" : "Adicionar banner"}
        </button>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className={`${outlineButton} px-4 py-1.5 text-xs ${uploading ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Remover
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-rosa-blush">
          <ErrorMessageIcon />
          {error}
        </p>
      )}
    </div>
  );
}

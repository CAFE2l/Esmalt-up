"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useProfilePhoto } from "@/lib/profile/ProfileContext";

interface Props {
  completionPct: number; // 0-100
  size?: number;
}

function initialsOf(name: string | null | undefined) {
  if (!name) return "E";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function ProfileAvatar({ completionPct, size = 88 }: Props) {
  const { user } = useAuth();
  const { photoUrl, setPhotoUrl } = useProfilePhoto();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const r = size / 2;
  const stroke = 3;
  const normalizedR = r - stroke / 2 - 2;
  const circumference = 2 * Math.PI * normalizedR;
  const dashOffset = circumference * (1 - completionPct / 100);

  const effectivePhoto = photoUrl ?? user?.photoURL ?? null;
  const displayName = user?.displayName ?? "Usuária";

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) { setError("Use JPG, PNG ou WebP."); return; }
    if (file.size > MAX_BYTES) { setError("Máximo 5 MB."); return; }
    if (!user) { setError("Entre novamente."); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      const b64: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const token = await user.getIdToken();
      const resp = await fetch("/api/profile/upload", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ fileBase64: b64, fileName: file.name, folder: "profiles" }),
      });
      const data = await resp.json() as { url?: string; error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Erro no upload.");
      setPhotoUrl(data.url!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/profile/upload?field=profilePhotoUrl", {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      setPhotoUrl(null);
    } catch {
      setError("Não foi possível remover.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        aria-label="Selecionar foto de perfil"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG progress ring */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          aria-hidden
        >
          {/* Track */}
          <circle
            cx={r} cy={r} r={normalizedR}
            fill="none"
            stroke="rgba(60,48,54,0.6)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <motion.circle
            cx={r} cy={r} r={normalizedR}
            fill="none"
            stroke="url(#ledGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: reduceMotion ? dashOffset : dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ rotate: "-90deg", transformOrigin: "center", transform: "rotate(-90deg)" }}
          />
          <defs>
            <linearGradient id="ledGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e8a0b4" />
              <stop offset="100%" stopColor="#b83d52" />
            </linearGradient>
          </defs>
        </svg>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Alterar foto de perfil"
          className="group absolute inset-[6px] overflow-hidden rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-gold"
        >
          {effectivePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={effectivePhoto} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rosa-blush to-rose-gold text-xl font-bold text-white">
              {initialsOf(displayName)}
            </span>
          )}
          {/* Camera overlay */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {uploading ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="h-5 w-5 animate-spin">
                <path d="M21 12a9 9 0 1 1-6.2-8.56" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx={12} cy={13} r={4} />
              </svg>
            )}
          </span>
        </button>
      </div>

      {effectivePhoto && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading}
          className="text-[11px] text-foreground/50 underline-offset-2 hover:text-rose-gold hover:underline disabled:opacity-40"
        >
          Remover foto
        </button>
      )}
      {error && <p className="text-[11px] text-rosa-blush">{error}</p>}
    </div>
  );
}

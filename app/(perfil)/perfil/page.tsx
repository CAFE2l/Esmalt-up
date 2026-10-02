"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Camera,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile, useProfilePhoto } from "@/lib/profile";
import { primaryButton } from "@/components/buttonStyles";

// Type definitions
type ProfileForm = {
  name: string;
  bio: string;
  city: string;
  level: string;
  experienceYears: string;
  favoriteBrands: string;
  favoriteStyles: string;
  equipment: string;
  courseInProgress: string;
  status: string;
  interests: string[];
  badges: string[];
  profilePhotoUrl: string;
  bannerUrl: string;
  isEntrepreneur: boolean;
  services: string[];
  pricing: string;
  bookingLink: string;
  youtube: string;
  instagram: string;
  tiktok: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const statusOptions = [
  "Disponível para atendimentos",
  "Indisponível",
  "Só estudando",
] as const;

const levelOptions = ["Iniciante", "Intermediário", "Avançado"] as const;

const stylePresets = [
  "Nail Art",
  "Francesinha",
  "Alongamento",
  "Esmaltação em Gel",
  "Cuticulagem Russa",
  "Minimalista",
];

const inputClasses =
  "w-full rounded-2xl border border-cinza-suave bg-rosa-claro/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-rose-gold focus:outline-none focus:ring-1 focus:ring-rose-gold/40";

// Helper functions
function initialsOf(name: string | null | undefined): string {
  if (!name) return "E";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, "#").trim())
    .filter(Boolean);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Social Icons
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-4 w-4"}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M23 12s0-3.4-.44-5.03a2.63 2.63 0 0 0-1.85-1.86C19.06 4.64 12 4.64 12 4.64s-7.06 0-8.71.47a2.63 2.63 0 0 0-1.85 1.86C1 8.6 1 12 1 12s0 3.4.44 5.03c.24.9.95 1.62 1.85 1.86 1.65.47 8.71.47 8.71.47s7.06 0 8.71-.47a2.63 2.63 0 0 0 1.85-1.86C23 15.4 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M16.5 9.16a3.5 3.5 0 0 0 3-1.73V4.5a1 1 0 0 0-1-1H17a1 1 0 0 0-1 1z" />
      <path
        d="M8.5 11.5A3.5 3.5 0 1 0 12 15V4.5a1 1 0 0 1 1-1h1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Navigation Items
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: "perfil", label: "Perfil", icon: UserRound, href: "/perfil", active: true },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag, href: "/pedidos" },
  { id: "configuracoes", label: "Configurações", icon: Settings, href: "/configuracoes" },
  { id: "assinatura", label: "Assinatura / Plano", icon: CreditCard, disabled: true, badge: "Em breve" },
  { id: "notificacoes", label: "Notificações", icon: Bell, href: "/notificacoes" },
];

// Reusable Components
function FormRow({
  label,
  helper,
  htmlFor,
  children,
}: {
  label: string;
  helper?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-8 py-5 border-b border-cinza-suave/40 last:border-b-0 items-start">
      <div>
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
            {label}
          </label>
        ) : (
          <span className="block text-sm font-semibold text-foreground">
            {label}
          </span>
        )}
        {helper && (
          <p className="mt-1 text-xs text-foreground/55 leading-relaxed">{helper}</p>
        )}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-cinza-suave/50 pt-8 first:border-t-0 first:pt-0">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-foreground/60">{description}</p>
      </div>
      <div className="divide-y divide-cinza-suave/40">{children}</div>
    </section>
  );
}

// NEW: Floating Save Button Component
function FloatingSaveButton({
  isDirty,
  saving,
  onSave,
}: {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  if (!isDirty) return null;

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-6 py-3 text-sm font-semibold text-white shadow-card-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-card active:translate-y-0 active:shadow-pressed ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
      style={{
        transform: isDirty ? 'translateY(0)' : 'translateY(100px)',
        opacity: isDirty ? 1 : 0,
      }}
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          Salvar alterações
        </>
      )}
    </button>
  );
}

// NEW: Status Indicator Badge
function StatusBadge({
  status,
  onClick,
}: {
  status: string;
  onClick?: () => void;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Disponível para atendimentos":
        return {
          color: "emerald",
          label: "Disponível",
          dotColor: "bg-emerald-400",
          bgColor: "bg-emerald-500/10",
          textColor: "text-emerald-400",
          hoverBg: "hover:bg-emerald-500/20",
          pulse: true,
        };
      case "Só estudando":
        return {
          color: "rose-gold",
          label: "Estudando",
          dotColor: "bg-rose-gold",
          bgColor: "bg-rosa-blush/15",
          textColor: "text-rose-gold",
          hoverBg: "hover:bg-rosa-blush/25",
          pulse: false,
        };
      default:
        return {
          color: "gray",
          label: "Indisponível",
          dotColor: "bg-foreground/40",
          bgColor: "bg-rosa-claro/50",
          textColor: "text-foreground/70",
          hoverBg: "hover:bg-rosa-claro",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border border-${config.color}-500/40 ${config.bgColor} ${config.textColor} transition-colors ${config.hoverBg}`}
      title="Clique para alterar status"
    >
      <span
        className={`h-2 w-2 rounded-full ${config.dotColor} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span>{status}</span>
    </button>
  );
}

// NEW: Avatar Component with proper positioning
function ProfileAvatar({
  src,
  alt,
  initials,
  size = "lg",
  onUploadClick,
  uploading,
  onRemove,
}: {
  src?: string | null;
  alt: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  onUploadClick?: () => void;
  uploading?: boolean;
  onRemove?: () => void;
}) {
  const sizeClasses = {
    sm: "h-16 w-16 text-lg",
    md: "h-20 w-20 text-xl",
    lg: "h-24 w-24 sm:h-28 sm:w-28 text-2xl sm:text-3xl",
  };

  return (
    <div className="relative group shrink-0">
      <div
        className={`relative rounded-full ring-4 ring-branco overflow-hidden bg-gradient-to-br from-rosa-blush to-rose-gold shadow-card-lg ${sizeClasses[size]}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold text-white">
            {initials}
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      
      {onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading}
          aria-label="Alterar foto de perfil"
          title="Alterar foto de perfil"
          className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-branco bg-rose-gold text-white shadow-card transition-all hover:bg-rosa-blush hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
        </button>
      )}
      
      {onRemove && src && (
        <button
          type="button"
          onClick={onRemove}
          disabled={uploading}
          aria-label="Remover foto"
          title="Remover foto"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-branco bg-red-400 text-white shadow-card transition-all hover:bg-red-500 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// NEW: Profile Header Component
function ProfileHeader({
  bannerUrl,
  avatarSrc,
  avatarInitials,
  displayName,
  email,
  status,
  isEntrepreneur,
  onBannerUpload,
  onBannerRemove,
  bannerUploading,
  onAvatarUpload,
  onAvatarRemove,
  avatarUploading,
  onStatusClick,
}: {
  bannerUrl?: string | null;
  avatarSrc?: string | null;
  avatarInitials: string;
  displayName: string;
  email: string;
  status: string;
  isEntrepreneur: boolean;
  onBannerUpload: () => void;
  onBannerRemove: () => void;
  bannerUploading: boolean;
  onAvatarUpload: () => void;
  onAvatarRemove: () => void;
  avatarUploading: boolean;
  onStatusClick: () => void;
}) {
  return (
    <div className="relative">
      {/* Banner Section */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-gradient-to-br from-rosa-blush/25 via-rose-gold/15 to-rosa-medio/25">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt="Banner do perfil"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rosa-blush/20 text-rose-gold">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground/50 max-w-xs">
              Adicione um banner para personalizar seu perfil
            </p>
          </div>
        )}

        {/* Banner Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onBannerUpload}
            disabled={bannerUploading}
            aria-label={bannerUrl ? "Alterar banner" : "Adicionar banner"}
            title={bannerUrl ? "Alterar banner" : "Adicionar banner"}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-card transition-all hover:bg-black/80 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {bannerUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span>{bannerUrl ? "Alterar" : "Adicionar"}</span>
          </button>

          {bannerUrl && (
            <button
              type="button"
              onClick={onBannerRemove}
              disabled={bannerUploading}
              aria-label="Remover banner"
              title="Remover banner"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white backdrop-blur-md shadow-card transition-all hover:bg-black/80 hover:text-red-300 active:scale-95 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Info Section - positioned below banner with proper spacing */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
          {/* Avatar Section */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start -mt-16 sm:-mt-20 lg:-mt-24">
            <ProfileAvatar
              src={avatarSrc}
              alt={displayName}
              initials={avatarInitials}
              size="lg"
              onUploadClick={onAvatarUpload}
              uploading={avatarUploading}
              onRemove={onAvatarRemove}
            />
          </div>

          {/* Info Section - properly aligned and spaced */}
          <div className="flex-1 min-w-0 pt-4 lg:pt-8">
            <div className="space-y-4">
              {/* Identity Block */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground break-words">
                      {displayName}
                    </h1>
                    {isEntrepreneur && (
                      <span
                        title="Profissional Ativa"
                        className="inline-flex items-center gap-1 rounded-full border border-rose-gold/50 bg-gradient-to-r from-rosa-blush to-rose-gold px-3 py-1 text-xs sm:text-sm font-semibold text-white shadow-card"
                      >
                        ✦ Pro
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm sm:text-base text-foreground/60 break-words">
                    {email}
                  </p>
                </div>
              </div>

              {/* Status Block */}
              <div className="flex items-center gap-3">
                <StatusBadge status={status} onClick={onStatusClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Profile Page Component
export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    profile: globalProfile, 
    loading: profileLoading, 
    updateProfile,
    saveStatus,
    saveError 
  } = useUserProfile();
  const { setPhotoUrl } = useProfilePhoto();

  const [localProfile, setLocalProfile] = useState<ProfileForm | null>(null);
  const initialProfileRef = useRef<ProfileForm | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Sync global profile with local state
  useEffect(() => {
    if (!profileLoading && globalProfile) {
      // Convert global profile to local format
      const convertedProfile: ProfileForm = {
        name: globalProfile.name || "",
        bio: globalProfile.bio || "",
        city: globalProfile.city || "",
        level: globalProfile.level || "Iniciante",
        experienceYears: globalProfile.experienceYears || "",
        favoriteBrands: globalProfile.favoriteBrands || "",
        favoriteStyles: globalProfile.favoriteStyles || "",
        equipment: globalProfile.equipment || "",
        courseInProgress: globalProfile.courseInProgress || "",
        status: globalProfile.status || "Disponível para atendimentos",
        interests: globalProfile.interests || [],
        badges: globalProfile.badges || [],
        profilePhotoUrl: globalProfile.profilePhotoUrl || "",
        bannerUrl: globalProfile.bannerUrl || "",
        isEntrepreneur: globalProfile.isEntrepreneur || false,
        services: globalProfile.services || [],
        pricing: globalProfile.pricing || "",
        bookingLink: globalProfile.bookingLink || "",
        youtube: globalProfile.youtube || "",
        instagram: globalProfile.instagram || "",
        tiktok: globalProfile.tiktok || "",
      };
      setLocalProfile(convertedProfile);
      initialProfileRef.current = convertedProfile;
    } else if (!profileLoading && !globalProfile && !authLoading && !user) {
      setLocalProfile(null);
      initialProfileRef.current = null;
    }
  }, [globalProfile, profileLoading, authLoading, user]);

  // Show global save status as toast
  useEffect(() => {
    if (saveError) {
      setToast({ type: "error", message: saveError });
    } else if (saveStatus === 'success') {
      setToast({ type: "success", message: "Perfil atualizado com sucesso!" });
    }
  }, [saveStatus, saveError]);

  // Close status dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track if changes have been made
  const isDirty = useMemo(() => {
    if (!localProfile || !initialProfileRef.current) return false;
    return JSON.stringify(localProfile) !== JSON.stringify(initialProfileRef.current);
  }, [localProfile]);

  // Warn if leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const set = useCallback(<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setLocalProfile((prev) => prev ? ({ ...prev, [key]: value }) : null);
  }, []);

  const saving = saveStatus === 'saving';

  const handleSave = async () => {
    if (!user || !localProfile) return;

    try {
      // Save bio client-side
      try {
        localStorage.setItem(`esmaltup_bio_${user.uid}`, localProfile.bio);
      } catch {
        // ignore
      }

      // Update global profile context
      await updateProfile({
        name: localProfile.name,
        bio: localProfile.bio,
        city: localProfile.city,
        level: localProfile.level,
        experienceYears: localProfile.experienceYears,
        favoriteBrands: localProfile.favoriteBrands,
        favoriteStyles: localProfile.favoriteStyles,
        equipment: localProfile.equipment,
        courseInProgress: localProfile.courseInProgress,
        status: localProfile.status,
        interests: localProfile.interests,
        badges: localProfile.badges,
        isEntrepreneur: localProfile.isEntrepreneur,
        services: localProfile.services,
        pricing: localProfile.pricing,
        bookingLink: localProfile.bookingLink,
        youtube: localProfile.youtube,
        instagram: localProfile.instagram,
        tiktok: localProfile.tiktok,
      });

      // Update initial ref after successful save
      initialProfileRef.current = localProfile;
    } catch {
      // Errors are handled by the global context and will show toast via the effect
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ type: "error", message: "Formato inválido. Use JPG, PNG ou WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "A foto deve ter no máximo 5 MB." });
      return;
    }

    setAvatarUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const token = await user.getIdToken();
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ fileBase64, fileName: file.name, folder: "profiles" }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[avatar upload] error:", data);
        throw new Error(data.error || "Falha no envio da foto.");
      }

      set("profilePhotoUrl", data.url);
      setPhotoUrl(data.url);
      if (initialProfileRef.current) {
        initialProfileRef.current = { ...initialProfileRef.current, profilePhotoUrl: data.url };
      }
      // Also update global profile context
      updateProfile({ profilePhotoUrl: data.url });
      setToast({ type: "success", message: "Foto de perfil atualizada!" });
    } catch (err) {
      console.error("[avatar upload] catch:", err);
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao carregar a foto.",
      });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || !profile.profilePhotoUrl) return;
    setAvatarUploading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/profile/upload?field=profilePhotoUrl", {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao remover foto.");

      set("profilePhotoUrl", "");
      setPhotoUrl(null);
      if (initialProfileRef.current) {
        initialProfileRef.current = { ...initialProfileRef.current, profilePhotoUrl: "" };
      }
      // Also update global profile context
      updateProfile({ profilePhotoUrl: null });
      setToast({ type: "success", message: "Foto removida com sucesso." });
    } catch {
      setToast({ type: "error", message: "Não foi possível remover a foto." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ type: "error", message: "Formato inválido. Use JPG, PNG ou WebP." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setToast({ type: "error", message: "O banner deve ter no máximo 8 MB." });
      return;
    }

    setBannerUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const token = await user.getIdToken();
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ fileBase64, fileName: file.name, folder: "banners" }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[banner upload] error:", data);
        throw new Error(data.error || "Falha no envio do banner.");
      }

      set("bannerUrl", data.url);
      if (initialProfileRef.current) {
        initialProfileRef.current = { ...initialProfileRef.current, bannerUrl: data.url };
      }
      // Also update global profile context
      updateProfile({ bannerUrl: data.url });
      setToast({ type: "success", message: "Banner atualizado com sucesso!" });
    } catch (err) {
      console.error("[banner upload] catch:", err);
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao carregar o banner.",
      });
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleBannerRemove = async () => {
    if (!user || !profile.bannerUrl) return;
    setBannerUploading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/profile/upload?field=bannerUrl", {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao remover banner.");

      set("bannerUrl", "");
      if (initialProfileRef.current) {
        initialProfileRef.current = { ...initialProfileRef.current, bannerUrl: "" };
      }
      // Also update global profile context
      updateProfile({ bannerUrl: null });
      setToast({ type: "success", message: "Banner removido." });
    } catch {
      setToast({ type: "error", message: "Não foi possível remover o banner." });
    } finally {
      setBannerUploading(false);
    }
  };

  const effectivePhotoUrl = localProfile?.profilePhotoUrl || user?.photoURL || null;
  const displayName = localProfile?.name || user?.displayName || "Usuária Esmalt'up";

  if (authLoading || profileLoading || !localProfile && !user) {
    return (
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-bege">
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl" />
        <p className="relative animate-pulse text-lg text-foreground/70">
          Carregando seu perfil...
        </p>
      </section>
    );
  }

  if (!user || !localProfile) {
    return (
      <section className="relative overflow-hidden bg-bege">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-rosa-medio/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-10 right-0 h-72 w-72 rounded-full bg-rose-gold/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold/30 bg-branco px-4 py-1.5 text-sm font-medium text-rose-gold shadow-card">
            <Lock className="h-4 w-4" />
            Minha Área
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
              Entre para ver seu perfil
            </span>
          </h1>
          <p className="mt-5 text-lg text-foreground/75">
            Acesse suas preferências, informações e dados pessoais em um só lugar.
          </p>
          <Link href="/login" className={`${primaryButton} mt-8 px-8 py-3.5 text-base`}>
            Fazer login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Decorative ambient gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl"
      />

      {/* Breadcrumb Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav aria-label="Navegação da área" className="flex items-center gap-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider">
            <span>Minha Área</span>
            <span className="text-foreground/30">/</span>
            <span className="text-rose-gold font-bold">Perfil</span>
          </nav>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Meu Perfil
          </h1>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          {/* Mobile Tab Bar */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <span
                    key={item.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cinza-suave/60 bg-branco/50 px-3.5 py-1.5 text-xs text-foreground/40 opacity-70"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    <span className="text-[10px] text-rose-gold/70">(Em breve)</span>
                  </span>
                );
              }
              if (item.active) {
                return (
                  <span
                    key={item.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-4 py-1.5 text-xs font-semibold text-white shadow-card"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </span>
                );
              }
              return (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cinza-suave/70 bg-branco px-3.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:text-rose-gold"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Sidebar Card */}
          <div className="hidden lg:block rounded-3xl border border-cinza-suave/70 bg-branco p-4 shadow-card">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
              Menu da conta
            </p>
            <nav className="mt-1 flex flex-col gap-1" aria-label="Menu Minha Área">
              {navItems.map((item) => {
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm text-foreground/40 cursor-not-allowed select-none"
                      title="Funcionalidade em desenvolvimento"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      <span className="rounded-full bg-rosa-claro/50 px-2 py-0.5 text-[10px] font-medium text-rose-gold/80">
                        {item.badge}
                      </span>
                    </div>
                  );
                }
                if (item.active) {
                  return (
                    <div
                      key={item.id}
                      aria-current="page"
                      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rosa-blush to-rose-gold px-3.5 py-2.5 text-sm font-semibold text-white shadow-card"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={item.href || "#"}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-rosa-claro/50 hover:text-rose-gold"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Main Content Card */}
          <div className="rounded-3xl border border-cinza-suave/70 bg-branco shadow-card overflow-hidden">
            {/* NEW: Redesigned Profile Header */}
            <ProfileHeader
              bannerUrl={profile.bannerUrl || null}
              avatarSrc={effectivePhotoUrl}
              avatarInitials={initialsOf(displayName)}
              displayName={displayName}
              email={user.email || ""}
              status={profile.status}
              isEntrepreneur={profile.isEntrepreneur}
              onBannerUpload={() => bannerInputRef.current?.click()}
              onBannerRemove={handleBannerRemove}
              bannerUploading={bannerUploading}
              onAvatarUpload={() => avatarInputRef.current?.click()}
              onAvatarRemove={handleAvatarRemove}
              avatarUploading={avatarUploading}
              onStatusClick={() => setStatusMenuOpen(true)}
            />

            {/* Input File Refs */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="sr-only"
              aria-label="Upload de foto de perfil"
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerUploadChange}
              className="sr-only"
              aria-label="Upload de banner"
            />

            {/* Status Menu Dropdown */}
            {statusMenuOpen && (
              <div className="relative z-20 px-6 sm:px-8 pb-4" ref={statusMenuRef}>
                <div className="absolute top-0 right-0 mt-2 z-30 w-64 rounded-2xl border border-cinza-suave/70 bg-branco p-1.5 shadow-card-lg backdrop-blur-xl">
                  <p className="px-3 py-1.5 text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
                    Alterar disponibilidade
                  </p>
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        set("status", opt);
                        setStatusMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                        profile.status === opt
                          ? "bg-rosa-claro/70 text-rose-gold font-semibold"
                          : "text-foreground/80 hover:bg-rosa-claro/40"
                      }`}
                    >
                      <span>{opt}</span>
                      {profile.status === opt && <Check className="h-3.5 w-3.5 text-rose-gold" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NEW: Primary Save Button - Sticky */}
            <div className="px-6 sm:px-8 pb-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className={`${primaryButton} w-full sm:w-auto px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-card`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isDirty && <Check className="h-4 w-4" />}
                    {isDirty ? "Salvar alterações" : "Perfil atualizado"}
                  </span>
                )}
              </button>
            </div>

            {/* Form Content */}
            <div className="px-6 sm:px-8 pb-8">
              {/* SECTION 1: SOBRE VOCÊ */}
              <FormSection
                title="Sobre você"
                description="Informações básicas de identificação exibidas no seu perfil público."
              >
                <FormRow
                  label="Nome de exibição"
                  helper="Como você prefere ser chamada na comunidade e certificados."
                  htmlFor="nome"
                >
                  <input
                    id="nome"
                    type="text"
                    value={profile.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Ex.: Mariana Silva"
                    className={inputClasses}
                  />
                </FormRow>

                <FormRow
                  label="Bio"
                  helper="Uma breve descrição sobre você, seu estilo ou seu trabalho com unhas."
                  htmlFor="bio"
                >
                  <div className="relative">
                    <textarea
                      id="bio"
                      rows={3}
                      maxLength={160}
                      value={profile.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder="Conte um pouco sobre sua paixão por unhas, técnicas que adora e seu momento profissional..."
                      className={`${inputClasses} resize-none`}
                    />
                    <div className="mt-1 flex justify-end">
                      <span
                        className={`text-xs ${
                          profile.bio.length >= 150
                            ? "text-rose-gold font-semibold"
                            : "text-foreground/40"
                        }`}
                      >
                        {profile.bio.length} / 160 caracteres
                      </span>
                    </div>
                  </div>
                </FormRow>

                <FormRow
                  label="Cidade"
                  helper="Ajuda clientes locais e colegas a encontrarem você."
                  htmlFor="cidade"
                >
                  <input
                    id="cidade"
                    type="text"
                    value={profile.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Ex.: Curitiba, PR"
                    className={inputClasses}
                  />
                </FormRow>
              </FormSection>

              {/* SECTION 2: EXPERIÊNCIA */}
              <FormSection
                title="Experiência"
                description="Seu nível técnico, histórico e instrumentos de trabalho."
              >
                <FormRow
                  label="Meu Nível"
                  helper="Indique em qual estágio você se encontra atualmente."
                  htmlFor="nivel"
                >
                  <select
                    id="nivel"
                    value={profile.level}
                    onChange={(e) => set("level", e.target.value)}
                    className={`${inputClasses} appearance-none bg-no-repeat bg-right-4 pr-10`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth='2' stroke='%23${encodeURIComponent("currentColor")}' class='w-4 h-4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
                    }}
                  >
                    {levelOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormRow>

                <FormRow
                  label="Anos de experiência"
                  helper="Quantos anos você já atua na área de unhas?"
                  htmlFor="experiencia"
                >
                  <input
                    id="experiencia"
                    type="number"
                    value={profile.experienceYears}
                    onChange={(e) => set("experienceYears", e.target.value)}
                    placeholder="Ex.: 3"
                    min="0"
                    max="50"
                    className={inputClasses}
                  />
                </FormRow>

                <FormRow
                  label="Marcas favoritas"
                  helper="Quais marcas de produtos você mais utiliza?"
                  htmlFor="marcas"
                >
                  <input
                    id="marcas"
                    type="text"
                    value={profile.favoriteBrands}
                    onChange={(e) => set("favoriteBrands", e.target.value)}
                    placeholder="Ex.: CND, OPI, Gelish"
                    className={inputClasses}
                  />
                </FormRow>

                <FormRow
                  label="Estilos favoritos"
                  helper="Quais estilos de design você prefere fazer?"
                  htmlFor="estilos"
                >
                  <input
                    id="estilos"
                    type="text"
                    value={profile.favoriteStyles}
                    onChange={(e) => set("favoriteStyles", e.target.value)}
                    placeholder="Ex.: Nail Art, Francesinha"
                    className={inputClasses}
                  />
                </FormRow>

                <FormRow
                  label="Equipamentos"
                  helper="Quais equipamentos você possui?"
                  htmlFor="equipamentos"
                >
                  <input
                    id="equipamentos"
                    type="text"
                    value={profile.equipment}
                    onChange={(e) => set("equipment", e.target.value)}
                    placeholder="Ex.: Lâmpada UV, Drill, Pincéis"
                    className={inputClasses}
                  />
                </FormRow>

                <FormRow
                  label="Curso em andamento"
                  helper="Você está fazendo algum curso atualmente?"
                  htmlFor="curso"
                >
                  <input
                    id="curso"
                    type="text"
                    value={profile.courseInProgress}
                    onChange={(e) => set("courseInProgress", e.target.value)}
                    placeholder="Ex.: Curso Avançado de Nail Art"
                    className={inputClasses}
                  />
                </FormRow>
              </FormSection>

              {/* SECTION 3: PREFERÊNCIAS E INTERESES */}
              <FormSection
                title="Preferências e Interesses"
                description="Personalize seu perfil com seus interesses e preferências."
              >
                <FormRow
                  label="Interesses"
                  helper="Seus interesses dentro do universo das unhas (separe por vírgula)."
                  htmlFor="interesses"
                >
                  <input
                    id="interesses"
                    type="text"
                    value={profile.interests.join(", ")}
                    onChange={(e) => set("interests", parseTags(e.target.value))}
                    placeholder="Ex.: Novidades, Tutorial, Tendências"
                    className={inputClasses}
                  />
                </FormRow>

                <FormRow
                  label="Tags de estilo"
                  helper="Escolha ou adicione tags que representem seu estilo."
                  htmlFor="tags"
                >
                  <div className="flex flex-wrap gap-2">
                    {stylePresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const current = profile.interests;
                          const newInterests = current.includes(preset)
                            ? current.filter((i) => i !== preset)
                            : [...current, preset];
                          set("interests", newInterests);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          profile.interests.includes(preset)
                            ? "bg-gradient-to-r from-rosa-blush to-rose-gold text-white shadow-card"
                            : "border border-rose-gold/40 bg-rosa-claro/40 text-rose-gold hover:bg-rosa-claro/60"
                        }`}
                      >
                        {profile.interests.includes(preset) && (
                          <Check className="h-3 w-3" />
                        )}
                        {preset}
                      </button>
                    ))}
                  </div>
                </FormRow>
              </FormSection>

              {/* SECTION 4: PROFISSIONAL (Conditional) */}
              {profile.isEntrepreneur && (
                <FormSection
                  title="Informações Profissionais"
                  description="Configurações para profissionais que oferecem serviços."
                >
                  <FormRow
                    label="Serviços oferecidos"
                    helper="Quais serviços você oferece? (separe por vírgula)"
                    htmlFor="servicos"
                  >
                    <input
                      id="servicos"
                      type="text"
                      value={profile.services.join(", ")}
                      onChange={(e) => set("services", parseTags(e.target.value))}
                      placeholder="Ex.: Manicure, Pedicure, Alongamento"
                      className={inputClasses}
                    />
                  </FormRow>

                  <FormRow
                    label="Preço médio"
                    helper="Preço médio dos seus serviços."
                    htmlFor="preco"
                  >
                    <input
                      id="preco"
                      type="text"
                      value={profile.pricing}
                      onChange={(e) => set("pricing", e.target.value)}
                      placeholder="Ex.: R$ 50 - R$ 200"
                      className={inputClasses}
                    />
                  </FormRow>

                  <FormRow
                    label="Link para agendamento"
                    helper="Link para sua agenda online (Google Calendar, Booksy, etc.)."
                    htmlFor="agendamento"
                  >
                    <input
                      id="agendamento"
                      type="url"
                      value={profile.bookingLink}
                      onChange={(e) => set("bookingLink", e.target.value)}
                      placeholder="Ex.: https://booksy.com/minha-agenda"
                      className={inputClasses}
                    />
                  </FormRow>
                </FormSection>
              )}

              {/* SECTION 5: REDES SOCIAIS */}
              <FormSection
                title="Redes Sociais"
                description="Adicione seus links para que clientes possam te encontrar."
              >
                <FormRow
                  label="Instagram"
                  htmlFor="instagram"
                >
                  <div className="flex items-center gap-3">
                    <InstagramIcon className="h-5 w-5 text-foreground/60" />
                    <input
                      id="instagram"
                      type="text"
                      value={profile.instagram}
                      onChange={(e) => set("instagram", e.target.value)}
                      placeholder="Ex.: @seuinstagram"
                      className={inputClasses}
                    />
                  </div>
                </FormRow>

                <FormRow
                  label="YouTube"
                  htmlFor="youtube"
                >
                  <div className="flex items-center gap-3">
                    <YoutubeIcon className="h-5 w-5 text-foreground/60" />
                    <input
                      id="youtube"
                      type="text"
                      value={profile.youtube}
                      onChange={(e) => set("youtube", e.target.value)}
                      placeholder="Ex.: https://youtube.com/c/voerchannel"
                      className={inputClasses}
                    />
                  </div>
                </FormRow>

                <FormRow
                  label="TikTok"
                  htmlFor="tiktok"
                >
                  <div className="flex items-center gap-3">
                    <TikTokIcon className="h-5 w-5 text-foreground/60" />
                    <input
                      id="tiktok"
                      type="text"
                      value={profile.tiktok}
                      onChange={(e) => set("tiktok", e.target.value)}
                      placeholder="Ex.: @seutiktok"
                      className={inputClasses}
                    />
                  </div>
                </FormRow>
              </FormSection>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 right-6 z-50 rounded-2xl border shadow-card-lg transition-all duration-300 ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/40 bg-red-500/10 text-red-400"
          }`}
        >
          <div className="flex items-center gap-3 p-4">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                toast.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              {toast.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </div>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* NEW: Floating Save Button */}
      {isDirty && (
        <div className="fixed bottom-20 right-6 z-40 flex items-center gap-2 rounded-full bg-rose-gold/10 border border-rose-gold/30 px-4 py-2 text-sm text-rose-gold shadow-card">
          <span className="text-xs">Você possui alterações não salvas</span>
        </div>
      )}
      <FloatingSaveButton
        isDirty={isDirty}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}
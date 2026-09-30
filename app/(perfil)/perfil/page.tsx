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
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useProfilePhoto } from "@/lib/profile/ProfileContext";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

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

const emptyProfile: ProfileForm = {
  name: "",
  bio: "",
  city: "",
  level: "Iniciante",
  experienceYears: "",
  favoriteBrands: "",
  favoriteStyles: "",
  equipment: "",
  courseInProgress: "",
  status: "Disponível para atendimentos",
  interests: [],
  badges: [],
  profilePhotoUrl: "",
  bannerUrl: "",
  isEntrepreneur: false,
  services: [],
  pricing: "",
  bookingLink: "",
  youtube: "",
  instagram: "",
  tiktok: "",
};

const inputClasses =
  "w-full rounded-2xl border border-cinza-suave bg-rosa-claro/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-rose-gold focus:outline-none focus:ring-1 focus:ring-rose-gold/40";

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
  { id: "configuracoes", label: "Configurações", icon: Settings, href: "/configuracoes" },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag, disabled: true, badge: "Em breve" },
  { id: "assinatura", label: "Assinatura / Plano", icon: CreditCard, disabled: true, badge: "Em breve" },
  { id: "notificacoes", label: "Notificações", icon: Bell, disabled: true, badge: "Em breve" },
];

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

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const { setPhotoUrl } = useProfilePhoto();

  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const initialProfileRef = useRef<ProfileForm | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Load profile data
  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/profile", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!active) return;

        if (!response.ok) {
          setToast({ type: "error", message: data.error || "Erro ao carregar dados do perfil." });
          return;
        }

        // Restore saved bio from localStorage if available
        let savedBio = "";
        try {
          savedBio = localStorage.getItem(`esmaltup_bio_${user.uid}`) || "";
        } catch {
          // ignore localStorage error
        }

        const loaded: ProfileForm = {
          name: data.profile.name ?? user.displayName ?? "",
          bio: savedBio,
          city: data.profile.city ?? "",
          level: data.profile.level || "Iniciante",
          experienceYears: data.profile.experienceYears ?? "",
          favoriteBrands: data.profile.favoriteBrands ?? "",
          favoriteStyles: data.profile.favoriteStyles ?? "",
          equipment: data.profile.equipment ?? "",
          courseInProgress: data.profile.courseInProgress ?? "",
          status: data.profile.status ?? "Disponível para atendimentos",
          interests: data.profile.interests ?? [],
          badges: data.profile.badges ?? [],
          profilePhotoUrl: data.profile.profilePhotoUrl ?? user.photoURL ?? "",
          bannerUrl: data.profile.bannerUrl ?? "",
          isEntrepreneur: data.profile.isEntrepreneur ?? false,
          services: data.profile.services ?? [],
          pricing: data.profile.pricing ?? "",
          bookingLink: data.profile.bookingLink ?? "",
          youtube: data.profile.youtube ?? "",
          instagram: data.profile.instagram ?? "",
          tiktok: data.profile.tiktok ?? "",
        };

        setProfile(loaded);
        initialProfileRef.current = loaded;
      } catch {
        if (active) {
          setToast({
            type: "error",
            message: "Não foi possível carregar o perfil. Verifique sua conexão.",
          });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

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
    if (!initialProfileRef.current) return false;
    return JSON.stringify(profile) !== JSON.stringify(initialProfileRef.current);
  }, [profile]);

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
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setToast(null);

    try {
      // Save bio client-side
      try {
        localStorage.setItem(`esmaltup_bio_${user.uid}`, profile.bio);
      } catch {
        // ignore
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ type: "error", message: data.error || "Erro ao salvar alterações." });
        return;
      }

      initialProfileRef.current = profile;
      setToast({ type: "success", message: "Perfil atualizado com sucesso!" });
    } catch {
      setToast({
        type: "error",
        message: "Não foi possível salvar o perfil. Tente novamente.",
      });
    } finally {
      setSaving(false);
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
      if (!res.ok) throw new Error(data.error || "Falha no envio da foto.");

      set("profilePhotoUrl", data.url);
      setPhotoUrl(data.url);
      if (initialProfileRef.current) {
        initialProfileRef.current = { ...initialProfileRef.current, profilePhotoUrl: data.url };
      }
      setToast({ type: "success", message: "Foto de perfil atualizada!" });
    } catch (err) {
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
      setToast({ type: "success", message: "Foto removida com sucesso." });
    } catch {
      setToast({ type: "error", message: "Não foi possível remover a foto." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ type: "error", message: "Formato inválido. Use JPG, PNG ou WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "O banner deve ter no máximo 5 MB." });
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
      if (!res.ok) throw new Error(data.error || "Falha no envio do banner.");

      set("bannerUrl", data.url);
      if (initialProfileRef.current) {
        initialProfileRef.current = { ...initialProfileRef.current, bannerUrl: data.url };
      }
      setToast({ type: "success", message: "Banner atualizado com sucesso!" });
    } catch (err) {
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
      setToast({ type: "success", message: "Banner removido." });
    } catch {
      setToast({ type: "error", message: "Não foi possível remover o banner." });
    } finally {
      setBannerUploading(false);
    }
  };

  const effectivePhotoUrl = profile.profilePhotoUrl || user?.photoURL || null;
  const displayName = profile.name || user?.displayName || "Usuária Esmalt'up";

  if (loading) {
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

  if (!user) {
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
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
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
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Main Layout: Sidebar + Card */}
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-60 shrink-0">
          {/* Mobile Tab Bar */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
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
          <div className="hidden md:block rounded-3xl border border-cinza-suave/70 bg-branco p-4 shadow-card">
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

        {/* Main Content Card: ONE clean container */}
        <main className="flex-1 min-w-0">
          <div className="rounded-3xl border border-cinza-suave/70 bg-branco shadow-card overflow-hidden">
            {/* Banner Section */}
            <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-gradient-to-br from-rosa-blush/25 via-rose-gold/15 to-rosa-medio/25">
              {profile.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.bannerUrl}
                  alt="Banner do perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rosa-blush/20 text-rose-gold">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/50 max-w-xs">
                    Adicione um banner para dar o seu toque pessoal ao perfil
                  </p>
                </div>
              )}

              {/* Banner Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerUpload}
                  className="sr-only"
                  aria-label="Upload de banner"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  aria-label={profile.bannerUrl ? "Alterar banner" : "Adicionar banner"}
                  title={profile.bannerUrl ? "Alterar banner" : "Adicionar banner"}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-card transition-all hover:bg-black/80 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {bannerUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <span>{profile.bannerUrl ? "Alterar banner" : "Adicionar banner"}</span>
                </button>

                {profile.bannerUrl && (
                  <button
                    type="button"
                    onClick={handleBannerRemove}
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

            {/* Profile Identity & Action Header */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-16 mb-8">
                {/* Avatar + User Info */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  {/* Avatar overlapping banner */}
                  <div className="relative group shrink-0 self-start sm:self-auto">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                      aria-label="Upload de foto de perfil"
                    />
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-branco overflow-hidden bg-gradient-to-br from-rosa-blush to-rose-gold shadow-card-lg">
                      {effectivePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={effectivePhotoUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                          {initialsOf(displayName)}
                        </span>
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    {/* Small camera icon button */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      aria-label="Alterar foto de perfil"
                      title="Alterar foto de perfil"
                      className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-branco bg-rose-gold text-white shadow-card transition-all hover:bg-rosa-blush hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Name, Email, Status Badge */}
                  <div className="sm:mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {displayName}
                      </h2>
                      {profile.isEntrepreneur && (
                        <span
                          title="Profissional Ativa"
                          className="inline-flex items-center gap-1 rounded-full border border-rose-gold/50 bg-gradient-to-r from-rosa-blush to-rose-gold px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-card"
                        >
                          ✦ Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/60">{user.email}</p>

                    {/* Status Badge with quick picker */}
                    <div className="relative mt-2.5" ref={statusMenuRef}>
                      <button
                        type="button"
                        onClick={() => setStatusMenuOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium border transition-all ${
                          profile.status === "Disponível para atendimentos"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : profile.status === "Só estudando"
                            ? "border-rose-gold/40 bg-rosa-blush/15 text-rose-gold hover:bg-rosa-blush/25"
                            : "border-cinza-suave bg-rosa-claro/50 text-foreground/70 hover:bg-rosa-claro"
                        }`}
                        title="Clique para alterar status de atendimento"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            profile.status === "Disponível para atendimentos"
                              ? "bg-emerald-400 animate-pulse"
                              : profile.status === "Só estudando"
                              ? "bg-rose-gold"
                              : "bg-foreground/40"
                          }`}
                        />
                        <span>{profile.status}</span>
                      </button>

                      {statusMenuOpen && (
                        <div className="absolute left-0 mt-2 z-20 w-64 rounded-2xl border border-cinza-suave/70 bg-branco p-1.5 shadow-card-lg backdrop-blur-xl">
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
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Save Changes Button (Header) */}
                <div className="sm:self-end pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className={`${primaryButton} w-full sm:w-auto px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-card`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      "Salvar alterações"
                    )}
                  </button>
                </div>
              </div>

              {/* Form Sections */}
              <div className="space-y-8">
                {/* 1. SOBRE VOCÊ */}
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

                {/* 2. EXPERIÊNCIA */}
                <FormSection
                  title="Experiência"
                  description="Seu nível técnico, histórico e instrumentos de trabalho."
                >
                  <FormRow
                    label="Meu Nível"
                    helper="Indique em qual estágio você se encontra atualmente."
                    htmlFor="nivel"
                  >
                    <div className="flex flex-wrap gap-2.5">
                      {levelOptions.map((lvl) => {
                        const active = profile.level.toLowerCase() === lvl.toLowerCase();
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => set("level", lvl)}
                            aria-pressed={active}
                            className={`rounded-2xl px-4 py-2 text-xs font-semibold transition-all ${
                              active
                                ? "bg-gradient-to-r from-rosa-blush to-rose-gold text-white shadow-card"
                                : "border border-cinza-suave bg-rosa-claro/30 text-foreground/80 hover:border-rose-gold/60 hover:text-rose-gold"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                    {/* Hidden input to preserve name/id compatibility */}
                    <input
                      id="nivel"
                      type="hidden"
                      value={profile.level}
                    />
                  </FormRow>

                  <FormRow
                    label="Tempo de Experiência"
                    helper="Há quanto tempo você estuda ou atua com manicure."
                    htmlFor="experiencia"
                  >
                    <input
                      id="experiencia"
                      type="text"
                      value={profile.experienceYears}
                      onChange={(e) => set("experienceYears", e.target.value)}
                      placeholder="Ex.: 2 anos, 6 meses, Iniciando agora"
                      className={inputClasses}
                    />
                  </FormRow>

                  <FormRow
                    label="Equipamentos que Uso"
                    helper="Ferramentas e aparelhos que fazem parte do seu kit."
                    htmlFor="equipamentos"
                  >
                    <input
                      id="equipamentos"
                      type="text"
                      value={profile.equipment}
                      onChange={(e) => set("equipment", e.target.value)}
                      placeholder="Ex.: Cabine UV/LED, Lixa elétrica, Brocas de cerâmica"
                      className={inputClasses}
                    />
                  </FormRow>

                  <FormRow
                    label="Curso em Andamento"
                    helper="Qual módulo ou especialização você está concluindo."
                    htmlFor="curso"
                  >
                    <input
                      id="curso"
                      type="text"
                      value={profile.courseInProgress}
                      onChange={(e) => set("courseInProgress", e.target.value)}
                      placeholder="Ex.: Módulo 2 — Nail Art & Esmaltação em Gel"
                      className={inputClasses}
                    />
                  </FormRow>
                </FormSection>

                {/* 3. PREFERÊNCIAS */}
                <FormSection
                  title="Preferências"
                  description="Seus estilos favoritos, técnicas preferidas e marcas do coração."
                >
                  <FormRow
                    label="Marcas & Cores Favoritas"
                    helper="Separe por vírgulas para criar tags automáticas."
                    htmlFor="marcas"
                  >
                    <input
                      id="marcas"
                      type="text"
                      value={profile.favoriteBrands}
                      onChange={(e) => set("favoriteBrands", e.target.value)}
                      placeholder="Ex.: Risqué, Dailus, Impala, Colorama"
                      className={inputClasses}
                    />
                    {profile.favoriteBrands && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {parseTags(profile.favoriteBrands).map((brand) => (
                          <span
                            key={brand}
                            className="inline-flex items-center rounded-full border border-rose-gold/40 bg-rosa-claro/60 px-3 py-1 text-xs font-medium text-rose-gold"
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    )}
                  </FormRow>

                  <FormRow
                    label="Estilo Preferido"
                    helper="Selecione um estilo em destaque ou digite o seu preferido."
                    htmlFor="estilo"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap gap-2">
                        {stylePresets.map((style) => {
                          const active = profile.favoriteStyles
                            .toLowerCase()
                            .includes(style.toLowerCase());
                          return (
                            <button
                              key={style}
                              type="button"
                              onClick={() => {
                                const current = parseTags(profile.favoriteStyles);
                                const exists = current.some(
                                  (s) => s.toLowerCase() === style.toLowerCase()
                                );
                                const next = exists
                                  ? current.filter(
                                      (s) => s.toLowerCase() !== style.toLowerCase()
                                    )
                                  : [...current, style];
                                set("favoriteStyles", next.join(", "));
                              }}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                                active
                                  ? "border border-rose-gold bg-rosa-blush/20 text-rose-gold font-semibold"
                                  : "border border-cinza-suave bg-rosa-claro/30 text-foreground/70 hover:border-rose-gold/50 hover:text-foreground"
                              }`}
                            >
                              {active ? `✓ ${style}` : `+ ${style}`}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        id="estilo"
                        type="text"
                        value={profile.favoriteStyles}
                        onChange={(e) => set("favoriteStyles", e.target.value)}
                        placeholder="Ex.: Francesinha, Nail Art delicada"
                        className={inputClasses}
                      />
                    </div>
                  </FormRow>

                  <FormRow
                    label="Interesses"
                    helper="Tags e tópicos que você mais gosta de acompanhar."
                    htmlFor="interesses"
                  >
                    <input
                      id="interesses"
                      type="text"
                      value={profile.interests.join(", ")}
                      onChange={(e) => set("interests", parseTags(e.target.value))}
                      placeholder="#NailArt, #Francesinha, #AlongamentoEmGel"
                      className={inputClasses}
                    />
                    {profile.interests.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {profile.interests.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-2.5 py-0.5 text-xs text-rose-gold"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </FormRow>
                </FormSection>

                {/* 4. FOTO DE PERFIL */}
                <FormSection
                  title="Foto de Perfil"
                  description="Sua imagem de exibição para a comunidade e clientes da plataforma."
                >
                  <FormRow
                    label="Foto atual"
                    helper="JPG, PNG ou WebP com tamanho de até 5 MB."
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Avatar preview */}
                      <div className="relative h-16 w-16 shrink-0 rounded-full ring-2 ring-rose-gold/40 overflow-hidden bg-gradient-to-br from-rosa-blush to-rose-gold shadow-card">
                        {effectivePhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={effectivePhotoUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                            {initialsOf(displayName)}
                          </span>
                        )}
                        {avatarUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={avatarUploading}
                          className={`${outlineButton} px-4 py-2 text-xs font-semibold`}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Atualizar foto
                        </button>

                        {effectivePhotoUrl && (
                          <button
                            type="button"
                            onClick={handleAvatarRemove}
                            disabled={avatarUploading}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </FormRow>
                </FormSection>

                {/* 5. REDES SOCIAIS */}
                <FormSection
                  title="Redes Sociais"
                  description="Compartilhe seu portfólio no Instagram, YouTube e TikTok."
                >
                  <FormRow
                    label="Instagram"
                    helper="Seu perfil profissional ou pessoal de nail art."
                    htmlFor="instagram"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-foreground/45">
                        <InstagramIcon className="h-4 w-4" />
                      </span>
                      <input
                        id="instagram"
                        type="url"
                        value={profile.instagram}
                        onChange={(e) => set("instagram", e.target.value)}
                        placeholder="instagram.com/seu_perfil"
                        className={`${inputClasses} pl-11`}
                      />
                    </div>
                  </FormRow>

                  <FormRow
                    label="YouTube"
                    helper="Seu canal com tutoriais ou demonstrações."
                    htmlFor="youtube"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-foreground/45">
                        <YoutubeIcon className="h-4 w-4" />
                      </span>
                      <input
                        id="youtube"
                        type="url"
                        value={profile.youtube}
                        onChange={(e) => set("youtube", e.target.value)}
                        placeholder="youtube.com/@seu_canal"
                        className={`${inputClasses} pl-11`}
                      />
                    </div>
                  </FormRow>

                  <FormRow
                    label="TikTok"
                    helper="Vídeos curtos, dicas e bastidores do seu atendimento."
                    htmlFor="tiktok"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-foreground/45">
                        <TikTokIcon className="h-4 w-4" />
                      </span>
                      <input
                        id="tiktok"
                        type="url"
                        value={profile.tiktok}
                        onChange={(e) => set("tiktok", e.target.value)}
                        placeholder="tiktok.com/@seu_perfil"
                        className={`${inputClasses} pl-11`}
                      />
                    </div>
                  </FormRow>
                </FormSection>
              </div>

              {/* Bottom Footer Save Action */}
              <div className="mt-10 pt-6 border-t border-cinza-suave/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-foreground/50 text-center sm:text-left">
                  {isDirty ? (
                    <span className="text-rose-gold font-medium">
                      ● Você tem alterações não salvas
                    </span>
                  ) : (
                    "Todas as alterações foram salvas."
                  )}
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className={`${primaryButton} w-full sm:w-auto px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-card`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      "Salvar alterações"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-card-lg backdrop-blur-xl border transition-all animate-fadeIn ${
            toast.type === "success"
              ? "border-rose-gold/60 bg-branco/95 text-foreground"
              : "border-red-500/50 bg-branco/95 text-red-300"
          }`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success"
                ? "bg-rose-gold text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </div>
          <p className="text-sm font-semibold">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-foreground/50 hover:text-foreground"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

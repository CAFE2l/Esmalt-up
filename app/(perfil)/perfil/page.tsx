"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getLesson, COURSE_LESSONS } from "@/lib/courseData";
import { primaryButton } from "@/components/buttonStyles";
import ImageUploader from "@/components/perfil/ImageUploader";

type ProfileForm = {
  profilePhotoUrl: string;
  bannerUrl: string;
  isEntrepreneur: boolean;
  services: string[];
  pricing: string;
  bookingLink: string;
  level: string;
  experienceYears: string;
  favoriteBrands: string;
  favoriteStyles: string;
  equipment: string;
  courseInProgress: string;
  city: string;
  status: string;
  interests: string[];
  badges: string[];
  youtube: string;
  instagram: string;
  tiktok: string;
};

type OrderRow = {
  id: string;
  kitName: string;
  date: string;
  status: string;
};

type ProgressRow = {
  id: string;
  lessonTitle: string;
  dateCompleted: string;
  status: string;
};

type Flash = { kind: "ok" | "error"; text: string } | null;

const emptyProfile: ProfileForm = {
  profilePhotoUrl: "",
  bannerUrl: "",
  isEntrepreneur: false,
  services: [],
  pricing: "",
  bookingLink: "",
    level: "",
  experienceYears: "",
  favoriteBrands: "",
  favoriteStyles: "",
  equipment: "",
  courseInProgress: "",
  city: "",
  status: "Disponível para atendimentos",
  interests: [],
  badges: [],
  youtube: "",
  instagram: "",
  tiktok: "",
};

const statusOptions = [
  "Disponível para atendimentos",
  "Indisponível",
  "Só estudando",
];

const inputClasses =
  "w-full rounded-2xl border border-cinza-suave bg-rosa-claro/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-rose-gold focus:outline-none";

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, "#").trim())
    .filter(Boolean);
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "E";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

type LocalCourseProgress = {
  completed: Record<string, boolean>;
  currentLessonId: string;
};

function loadLocalCourseProgress(): LocalCourseProgress {
  if (typeof window === "undefined") {
    return { completed: {}, currentLessonId: "" };
  }
  try {
    const raw = localStorage.getItem("esmaltup-curso-progress");
    if (!raw) return { completed: {}, currentLessonId: "" };
    const parsed = JSON.parse(raw);
    return {
      completed: parsed.completed ?? {},
      currentLessonId: parsed.currentLessonId ?? "",
    };
  } catch {
    return { completed: {}, currentLessonId: "" };
  }
}

function mergeProgress(
  dbRows: ProgressRow[],
  localRows: ProgressRow[],
): ProgressRow[] {
  const dbTitles = new Set(dbRows.map((row) => row.lessonTitle));
  const merged = [
    ...localRows.filter((row) => !dbTitles.has(row.lessonTitle)),
    ...dbRows,
  ];
  const orderOf = (title: string) =>
    COURSE_LESSONS.findIndex((item) => item.lesson.title === title);
  return merged.sort((a, b) => orderOf(a.lessonTitle) - orderOf(b.lessonTitle));
}

function StatusPill({ status }: { status: string }) {
  const done = /conclu|entregue|concluído|concluída/i.test(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        done
          ? "border border-rose-gold/50 bg-rosa-blush/20 text-rose-gold"
          : "border border-cinza-suave bg-rosa-claro/70 text-foreground/80"
      }`}
    >
      {status}
    </span>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-foreground/80"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TagField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">
        {label}
      </span>
      <input
        type="text"
        value={value.join(", ")}
        onChange={(event) => onChange(parseTags(event.target.value))}
        placeholder={placeholder}
        className={inputClasses}
      />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-rose-gold/40 bg-rosa-claro/60 px-3 py-1 text-xs font-medium text-rose-gold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-widest text-rose-gold">
          {eyebrow}
        </span>
      )}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
      {subtitle && (
        <p className="max-w-xl text-sm text-foreground/70 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TableShell({
  title,
  columns,
  empty,
  meta,
  children,
}: {
  title: string;
  columns: string[];
  empty: boolean;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-cinza-suave/70 bg-branco p-7 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
            {title}
          </span>
        </h3>
        {meta}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-cinza-suave bg-rosa-claro/50">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 font-semibold text-rose-gold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cinza-suave/70">
            {empty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-foreground/60"
                >
                  Nenhum registro por aqui ainda. Assim que tiver novidades,
                  elas aparecem nesta tabela.
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
      <circle cx="19" cy="6" r="1.6" opacity="0.7" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
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
      className={className ?? "h-5 w-5"}
    >
      <rect x={3} y={3} width={18} height={18} rx={3} />
      <path d="M3 15l5-5 3 3 5-5 5 5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx={9} cy={9} r={1} />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      <path d="M10 13a5 5 0 0 0 7.5-.5 1 1 0 0 1 1.7.7A7 7 0 0 1 5 18a7 7 0 0 1 0-14 7 7 0 0 1 10 5.5" />
      <circle cx={4} cy={11} r={1} />
      <path d="M17 6h.01" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      <path d="M12 19l7-7 2 5v3a2 2 0 01-2 2h-5l-2-2z" />
      <path d="M9.5 6.5 15 2l5 5-5.5 5.5z" />
      <path d="M14 2v5a2 2 0 002 2h5" />
    </svg>
  );
}

function SocialIcon({
  name,
  className = "h-6 w-6",
}: {
  name: "youtube" | "instagram" | "tiktok";
  className?: string;
}) {
  if (name === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23 12s0-3.4-.44-5.03a2.63 2.63 0 0 0-1.85-1.86C19.06 4.64 12 4.64 12 4.64s-7.06 0-8.71.47a2.63 2.63 0 0 0-1.85 1.86C1 8.6 1 12 1 12s0 3.4.44 5.03c.24.9.95 1.62 1.85 1.86 1.65.47 8.71.47 8.71.47s7.06 0 8.71-.47a2.63 2.63 0 0 0 1.85-1.86C23 15.4 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z" />
        <circle cx="12" cy="12" r="2.9" />
        <circle cx="17.4" cy="6.6" r="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path
        d="M16.5 9.16a3.5 3.5 0 0 0 3-1.73V4.5a1 1 0 0 0-1-1H17a1 1 0 0 0-1 1z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M8.5 11.5A3.5 3.5 0 1 0 12 15V4.5a1 1 0 0 1 1-1h1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PerfilPage() {
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

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
          setFlash({ kind: "error", text: data.error });
          return;
                }
        const profileData = {
          profilePhotoUrl: data.profile.profilePhotoUrl ?? "",
          bannerUrl: data.profile.bannerUrl ?? "",
          isEntrepreneur: data.profile.isEntrepreneur ?? false,
          services: data.profile.services ?? [],
          pricing: data.profile.pricing ?? "",
          bookingLink: data.profile.bookingLink ?? "",
          level: data.profile.level ?? "",
          experienceYears: data.profile.experienceYears ?? "",
          favoriteBrands: data.profile.favoriteBrands ?? "",
          favoriteStyles: data.profile.favoriteStyles ?? "",
          equipment: data.profile.equipment ?? "",
          courseInProgress: data.profile.courseInProgress ?? "",
          city: data.profile.city ?? "",
          status: data.profile.status ?? "Disponível para atendimentos",
          interests: data.profile.interests ?? [],
          badges: data.profile.badges ?? [],
          youtube: data.profile.youtube ?? "",
          instagram: data.profile.instagram ?? "",
          tiktok: data.profile.tiktok ?? "",
        };

        const local = loadLocalCourseProgress();
        const localRows: ProgressRow[] = Object.keys(local.completed)
          .filter((id) => local.completed[id])
          .map((id) => {
            const lesson = getLesson(id);
            return {
              id: `local-${id}`,
              lessonTitle: lesson?.lesson.title ?? id,
              dateCompleted: "",
              status: "Concluído",
            };
          });
        const currentModule = local.currentLessonId
          ? getLesson(local.currentLessonId)?.module.title
          : undefined;

        setProfile({
          ...profileData,
          courseInProgress: profileData.courseInProgress || currentModule || "",
        });
        setOrders(data.orders ?? []);
        setProgress(mergeProgress(data.progress ?? [], localRows));
      } catch {
        if (active) {
          setFlash({
            kind: "error",
            text: "Não foi possível carregar o perfil. Tente novamente.",
          });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    if (flash) setFlash(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setFlash(null);
    try {
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
        setFlash({ kind: "error", text: data.error });
        return;
      }
      setFlash({ kind: "ok", text: "Perfil salvo com sucesso." });
    } catch {
      setFlash({
        kind: "error",
        text: "Não foi possível salvar o perfil. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  // Prefer the custom uploaded photo; fall back to Firebase avatar.
  const effectivePhotoUrl =
    profile.profilePhotoUrl || user?.photoURL || null;
  const displayName = user?.displayName ?? "Usuária Esmalt'up";
  const completedCount = progress.filter((row) =>
    /conclu/.test(row.status),
  ).length;

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
            <SparkleIcon />
            Perfil
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
              Entre para ver seu perfil
            </span>
          </h1>
          <p className="mt-5 text-lg text-foreground/75">
            Seus dados, preferências e conquistas ficam todos aqui.
          </p>
          <Link href="/login" className={`${primaryButton} mt-8 px-8 py-3.5 text-base`}>
            Fazer login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl"
      />
            <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-rosa-medio/20 blur-3xl"
      />

      {/* ─── BANNER + AVATAR ───────────────────────────── */}
      <div className="relative -mx-4 mb-4 sm:-mx-6">
                <div className="relative h-40 sm:h-56 md:h-64 w-full overflow-hidden rounded-3xl">
          {profile.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.bannerUrl}
              alt="Banner do perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-rosa-blush/30 via-rose-gold/20 to-rosa-medio/30">
              <BannerIcon className="h-14 w-14 text-foreground/30" />
              <p className="text-center text-sm text-foreground/50">
                Banner personalizado
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setBannerUploadOpen(true)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-branco/70 bg-branco/90 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-card transition-all hover:bg-rosa-blush hover:text-white"
          >
            <PencilIcon className="h-3 w-3" />
            {profile.bannerUrl ? "Alterar banner" : "Adicionar banner"}
          </button>
        </div>

        {/* Avatar uploader — overlaps the bottom of the banner */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:left-6 sm:translate-x-0 sm:translate-y-[-40%] cursor-pointer">
          <ImageUploader
            mode="avatar"
            folder="profiles"
            alt={initialsOf(displayName)}
                        value={effectivePhotoUrl}
            onUpload={(url) => set("profilePhotoUrl", url)}
            onRemove={() => set("profilePhotoUrl", "")}
          />
        </div>
      </div>

      <div className="mt-6 relative">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="relative w-full max-w-sm sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-foreground/50">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar em sua área"
              aria-label="Buscar"
              className={`${inputClasses} pl-11`}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notificações"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cinza-suave bg-branco text-foreground/70 shadow-card transition-colors hover:text-rose-gold"
            >
              <BellIcon />
              <span className="absolute h-2 w-2 translate-x-4 translate-y-[-10px] rounded-full bg-rosa-blush" />
            </button>
            <button
              type="button"
              aria-label="Benefícios premium"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow-card transition-transform hover:-translate-y-0.5"
            >
              <SparkleIcon />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((value) => !value)}
                aria-expanded={dropdownOpen}
                className="flex items-center gap-3 rounded-full border border-cinza-suave/70 bg-branco p-1.5 pr-3 shadow-card transition-colors hover:border-rose-gold/60"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-sm font-bold text-white">
                  {effectivePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
          <img src={effectivePhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(displayName)
                  )}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[140px] truncate text-sm font-semibold text-foreground">
                    {user.displayName ?? "Usuária Esmalt'up"}
                  </span>
                  <span className="block text-xs font-medium text-rose-gold">
                    Usuária Premium
                  </span>
                </span>
                <ChevronIcon open={dropdownOpen} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-cinza-suave/70 bg-branco/90 p-2 shadow-card-lg backdrop-blur-xl">
                  <Link
                    href="/perfil"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-rosa-claro/60 hover:text-rose-gold"
                  >
                    <UserRound size={16} />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/configuracoes"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-rosa-claro/60 hover:text-rose-gold"
                  >
                    <Settings size={16} />
                    Configurações
                  </Link>
                  <div className="my-2 h-px bg-cinza-suave/70" role="separator" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-rose-gold/90 transition-colors hover:bg-rosa-claro/60 hover:text-white"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14">
          <SectionTitle
            eyebrow="Minha área"
            title="Perfil"
            subtitle="Veja todos os detalhes do seu perfil aqui. Edite e salve suas preferências a qualquer momento."
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="flex flex-col items-center gap-4 rounded-3xl border border-cinza-suave/70 bg-branco p-8 text-center shadow-card">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-2 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-xl font-bold text-white shadow-card-lg">
                {profile.isEntrepreneur && (
                  <span
                    aria-label="Profissional manicure"
                    className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-branco bg-rose-gold text-xs text-white">
                    ✦
                  </span>
                )}
                {initialsOf(displayName)}
              </div>
              <h2 className="text-xl font-bold tracking-tight">{displayName}</h2>
              <p className="mt-1 text-sm text-foreground/60">
                {user.email}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full border border-rose-gold/50 bg-rosa-blush/15 px-4 py-1.5 text-xs font-semibold text-rose-gold ${profile.isEntrepreneur ? "border-rose-gold/80 bg-gradient-to-r from-rosa-blush to-rose-gold text-white" : ""}`}>
              {profile.isEntrepreneur
                ? "Profissional ativa"
                : profile.status}
            </span>

            <div className="mt-2 flex w-full flex-col gap-2 border-t border-cinza-suave/70 pt-5 text-sm text-foreground/70">
              <div className="flex justify-between gap-3">
                <span>Nível</span>
                <span className="font-semibold text-foreground">
                  {profile.level || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Cidade</span>
                <span className="font-semibold text-foreground">
                  {profile.city || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Conquistas</span>
                <span className="font-semibold text-rose-gold">
                  {profile.badges.length} badge{profile.badges.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-cinza-suave/70 bg-branco p-7 shadow-card">
              <h2 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
                  Bio &amp; Outros Detalhes
                </span>
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                Preencha com calma — essas informações aparecem no seu perfil.
              </p>

              <div className="mt-7 grid gap-6 md:grid-cols-2">
                <Field label="Meu Nível" htmlFor="nivel">
                  <input
                    id="nivel"
                    type="text"
                    value={profile.level}
                    onChange={(event) => set("level", event.target.value)}
                    placeholder="Ex.: Iniciante"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Tempo de Experiência" htmlFor="experiencia">
                  <input
                    id="experiencia"
                    type="text"
                    value={profile.experienceYears}
                    onChange={(event) => set("experienceYears", event.target.value)}
                    placeholder="Ex.: 2 anos"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Marcas & Cores Favoritas" htmlFor="marcas">
                  <input
                    id="marcas"
                    type="text"
                    value={profile.favoriteBrands}
                    onChange={(event) => set("favoriteBrands", event.target.value)}
                    placeholder="Ex.: Risqué, Dailus, Impala"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Estilo Preferido" htmlFor="estilo">
                  <input
                    id="estilo"
                    type="text"
                    value={profile.favoriteStyles}
                    onChange={(event) => set("favoriteStyles", event.target.value)}
                    placeholder="Ex.: Nail art, Francesinha"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Equipamentos que Uso" htmlFor="equipamentos">
                  <input
                    id="equipamentos"
                    type="text"
                    value={profile.equipment}
                    onChange={(event) => set("equipment", event.target.value)}
                    placeholder="Ex.: Lixa elétrica, Cabine UV"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Curso em Andamento" htmlFor="curso">
                  <input
                    id="curso"
                    type="text"
                    value={profile.courseInProgress}
                    onChange={(event) => set("courseInProgress", event.target.value)}
                    placeholder="Ex.: Módulo 2 — Nail art"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Minha Cidade" htmlFor="cidade">
                  <input
                    id="cidade"
                    type="text"
                    value={profile.city}
                    onChange={(event) => set("city", event.target.value)}
                    placeholder="Ex.: Curitiba, PR"
                    className={inputClasses}
                  />
                </Field>

                <Field label="Status" htmlFor="status">
                  <select
                    id="status"
                    value={profile.status}
                    onChange={(event) => set("status", event.target.value)}
                    className={`${inputClasses} appearance-none`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option} className="bg-branco">
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <TagField
                  label="Interesses"
                  value={profile.interests}
                  onChange={(tags) => set("interests", tags)}
                  placeholder="#NailArt, #Francesinha, #Gel"
                />

                <TagField
                  label="Badges"
                  value={profile.badges}
                  onChange={(tags) => set("badges", tags)}
                  placeholder="Curso concluído, Top Cliente"
                />
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`${primaryButton} w-full px-8 py-3 text-sm sm:w-auto disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                {flash && (
                  <p
                    className={`text-sm font-medium ${
                      flash.kind === "ok" ? "text-rose-gold" : "text-rosa-blush"
                    }`}
                  >
                    {flash.text}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-cinza-suave/70 bg-branco p-7 shadow-card">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
                      Modo Profissional
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-foreground/60">
                    Você oferece serviços de manicure? Ative o modo profissional para destacar sua área de atuação, preços e disponibilidade.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("isEntrepreneur", !profile.isEntrepreneur)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.isEntrepreneur ? "bg-gradient-to-r from-rosa-blush to-rose-gold" : "bg-cinza-suave/50"}`}
                  aria-label={profile.isEntrepreneur ? "Desativar modo profissional" : "Ativar modo profissional"}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${profile.isEntrepreneur ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {profile.isEntrepreneur && (
                <div className="mt-6 animate-fadeIn space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground/80">
                      Banner profissional
                    </label>
                    <ImageUploader
                      mode="banner"
                      folder="banners"
                      alt={displayName}
                      value={profile.bannerUrl}
                      onUpload={(url) => set("bannerUrl", url)}
                      onRemove={() => set("bannerUrl", "")}
                    />
                    <p className="text-xs text-foreground/50">
                      Um banner atrativo ajuda você a se destacar e atrair mais clientes.
                    </p>
                                    </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Serviços Oferecidos" htmlFor="services">
                      <input
                        id="services"
                        type="text"
                        value={profile.services.join(", ")}
                        onChange={(event) =>
                          set(
                            "services",
                            event.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="Ex.: Manicure clássico, Nail art"
                        className={inputClasses}
                      />
                    </Field>

                    <Field label="Preços / Valores" htmlFor="pricing">
                      <input
                        id="pricing"
                        type="text"
                        value={profile.pricing}
                        onChange={(event) => set("pricing", event.target.value)}
                        placeholder="Ex.: A partir de R$ 35"
                        className={inputClasses}
                      />
                    </Field>
                  </div>

                  <Field label="Disponibilidade" htmlFor="entreStatus">
                    <select
                      id="entreStatus"
                      value={profile.status}
                      onChange={(event) => set("status", event.target.value)}
                      className={`${inputClasses} appearance-none`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option} className="bg-branco">
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Link para Agendamento" htmlFor="bookingLink">
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-foreground/50">
                        <LinkIcon className="h-4 w-4" />
                      </span>
                      <input
                        id="bookingLink"
                        type="url"
                        value={profile.bookingLink}
                        onChange={(event) => set("bookingLink", event.target.value)}
                        placeholder="https://seusite.com/agendamento"
                        className={`${inputClasses} pl-11`}
                      />
                    </div>
                  </Field>

                  <div className="rounded-xl border border-rose-gold/20 bg-rosa-blush/10 p-4 text-sm text-foreground/80">
                    <strong className="text-rose-gold">Dica:</strong> Preencha todos os campos e salve para que seu perfil profissional apareça completo para os clientes.
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-cinza-suave/70 bg-branco p-7 shadow-card">
              <h2 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
                  Redes Sociais
                </span>
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                Adicione seus links para compartilhar seu trabalho.
              </p>

              <div className="mt-7 grid gap-6 sm:grid-cols-3">
                <Field label="YouTube" htmlFor="youtube">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-foreground/50">
                      <SocialIcon name="youtube" className="h-4 w-4" />
                    </span>
                    <input
                      id="youtube"
                      type="url"
                      value={profile.youtube}
                      onChange={(event) => set("youtube", event.target.value)}
                      placeholder="youtube.com/@voce"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                </Field>
                <Field label="Instagram" htmlFor="instagram">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-foreground/50">
                      <SocialIcon name="instagram" className="h-4 w-4" />
                    </span>
                    <input
                      id="instagram"
                      type="url"
                      value={profile.instagram}
                      onChange={(event) => set("instagram", event.target.value)}
                      placeholder="instagram.com/@voce"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                </Field>
                <Field label="TikTok" htmlFor="tiktok">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-foreground/50">
                      <SocialIcon name="tiktok" className="h-4 w-4" />
                    </span>
                    <input
                      id="tiktok"
                      type="url"
                      value={profile.tiktok}
                      onChange={(event) => set("tiktok", event.target.value)}
                      placeholder="tiktok.com/@voce"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {(
                  [
                    { name: "youtube", url: profile.youtube, label: "YouTube" },
                    { name: "instagram", url: profile.instagram, label: "Instagram" },
                    { name: "tiktok", url: profile.tiktok, label: "TikTok" },
                  ] as const
                ).map(({ name, url, label }) =>
                  url ? (
                    <a
                      key={name}
                      href={url.startsWith("http") ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-rose-gold/40 bg-rosa-claro/60 px-4 py-2 text-sm font-medium text-rose-gold transition-all hover:-translate-y-0.5 hover:border-rose-gold hover:shadow-card"
                    >
                      <SocialIcon name={name} className="h-4 w-4" />
                      {label}
                    </a>
                  ) : null,
                )}
                {!profile.youtube && !profile.instagram && !profile.tiktok && (
                  <p className="text-sm text-foreground/60">
                    Nenhum link adicionado ainda. Preencha acima e salve.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <TableShell
            title="Meus Pedidos"
            columns={["Kit", "Data", "Status", "Ações"]}
            empty={orders.length === 0}
          >
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-rosa-claro/30">
                <td className="px-4 py-3.5 font-medium text-foreground">{order.kitName}</td>
                <td className="px-4 py-3.5 text-foreground/70">{formatDate(order.date)}</td>
                <td className="px-4 py-3.5">
                  <StatusPill status={order.status} />
                </td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed text-sm text-foreground/40"
                  >
                    Em breve
                  </button>
                </td>
              </tr>
            ))}
          </TableShell>

          <TableShell
            title="Meu Progresso no Curso"
            columns={["Aula", "Data de Conclusão", "Status", "Ações"]}
            empty={progress.length === 0}
            meta={
              <span className="inline-flex items-center rounded-full border border-rose-gold/40 bg-rosa-claro/60 px-3 py-1 text-xs font-semibold text-rose-gold">
                {completedCount} de {COURSE_LESSONS.length} aulas concluídas
              </span>
            }
          >
            {progress.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-rosa-claro/30">
                <td className="px-4 py-3.5 font-medium text-foreground">{item.lessonTitle}</td>
                <td className="px-4 py-3.5 text-foreground/70">
                  {item.dateCompleted ? formatDate(item.dateCompleted) : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill status={item.status} />
                </td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed text-sm text-foreground/40"
                  >
                    Em breve
                  </button>
                </td>
              </tr>
            ))}
          </TableShell>
        </div>
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  Download,
  Lock,
  LogOut,
  Moon,
  Palette,
  ShieldAlert,
  Sun,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { primaryButton } from "@/components/buttonStyles";
import { useAuth } from "@/lib/AuthContext";
import { useTheme, type Theme } from "@/lib/useTheme";

type TabKey = "aparencia" | "dados" | "privacidade";
type ProfileForm = {
  name: string;
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
type Flash = { kind: "ok" | "error"; text: string } | null;

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "aparencia", label: "Aparência", icon: Palette },
  { key: "dados", label: "Meus Dados", icon: UserRound },
  { key: "privacidade", label: "Privacidade & Conta", icon: Lock },
];

const statusOptions = [
  "Disponível para atendimentos",
  "Indisponível",
  "Só estudando",
];

const emptyProfile: ProfileForm = {
  name: "",
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

const inputClasses =
  "w-full rounded-2xl border border-cinza-suave bg-rosa-claro/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-rose-gold focus:outline-none";

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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
    </div>
  );
}

function PanelSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-cinza-suave/70 bg-branco p-7 shadow-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rosa-blush/15 text-rose-gold">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="mt-1 text-sm text-foreground/60">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ThemeOption({
  label,
  description,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
        active
          ? "border-rose-gold/70 bg-rosa-claro/70 shadow-card"
          : "border-cinza-suave/70 bg-background/40 hover:border-rose-gold/40"
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-gradient-to-br from-rosa-blush to-rose-gold text-white" : "bg-rosa-claro text-foreground/70"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="block text-xs text-foreground/60">{description}</span>
      </span>
    </button>
  );
}

function AppearancesPanel({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <PanelSection
      icon={Palette}
      title="Aparência"
      subtitle="Escolha como o Esmalt'up aparece para você. O tema escuro é o padrão."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ThemeOption
          label="Escuro"
          description="Nosso visual glossy original"
          icon={Moon}
          active={theme === "dark"}
          onClick={() => setTheme("dark")}
        />
        <ThemeOption
          label="Claro"
          description="Para dias de mais luz"
          icon={Sun}
          active={theme === "light"}
          onClick={() => setTheme("light")}
        />
      </div>
      <p className="mt-4 text-xs text-foreground/50">
        Sua preferência fica salva neste dispositivo.
      </p>
    </PanelSection>
  );
}

function DadosPanel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [saved, setSaved] = useState<Flash>(null);
  const [saving, setSaving] = useState(false);

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
        if (!active || !response.ok) return;
        setProfile({
          name: data.profile.name ?? user.displayName ?? "",
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
        });
      } catch {
        // mantém o formulário vazio
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    if (saved) setSaved(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(null);
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
        setSaved({ kind: "error", text: data.error });
        return;
      }
      setSaved({ kind: "ok", text: "Dados salvos com sucesso." });
    } catch {
      setSaved({
        kind: "error",
        text: "Não foi possível salvar. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelSection
      icon={UserRound}
      title="Meus Dados"
      subtitle="Organize as informações exibidas no seu perfil público."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Nome de exibição" htmlFor="cfg-nome">
          <input
            id="cfg-nome"
            type="text"
            value={profile.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Como quer aparecer"
            className={inputClasses}
          />
        </Field>
        <Field label="Meu Nível" htmlFor="cfg-nivel">
          <input
            id="cfg-nivel"
            type="text"
            value={profile.level}
            onChange={(event) => set("level", event.target.value)}
            placeholder="Ex.: Iniciante"
            className={inputClasses}
          />
        </Field>
        <Field label="Tempo de Experiência" htmlFor="cfg-experiencia">
          <input
            id="cfg-experiencia"
            type="text"
            value={profile.experienceYears}
            onChange={(event) => set("experienceYears", event.target.value)}
            placeholder="Ex.: 2 anos"
            className={inputClasses}
          />
        </Field>
        <Field label="Marcas & Cores Favoritas" htmlFor="cfg-marcas">
          <input
            id="cfg-marcas"
            type="text"
            value={profile.favoriteBrands}
            onChange={(event) => set("favoriteBrands", event.target.value)}
            placeholder="Ex.: Risqué, Dailus, Impala"
            className={inputClasses}
          />
        </Field>
        <Field label="Estilo Preferido" htmlFor="cfg-estilo">
          <input
            id="cfg-estilo"
            type="text"
            value={profile.favoriteStyles}
            onChange={(event) => set("favoriteStyles", event.target.value)}
            placeholder="Ex.: Nail art, Francesinha"
            className={inputClasses}
          />
        </Field>
        <Field label="Equipamentos que Uso" htmlFor="cfg-equipamentos">
          <input
            id="cfg-equipamentos"
            type="text"
            value={profile.equipment}
            onChange={(event) => set("equipment", event.target.value)}
            placeholder="Ex.: Lixa elétrica, Cabine UV"
            className={inputClasses}
          />
        </Field>
        <Field label="Curso em Andamento" htmlFor="cfg-curso">
          <input
            id="cfg-curso"
            type="text"
            value={profile.courseInProgress}
            onChange={(event) => set("courseInProgress", event.target.value)}
            placeholder="Ex.: Módulo 2 — Nail art"
            className={inputClasses}
          />
        </Field>
        <Field label="Minha Cidade" htmlFor="cfg-cidade">
          <input
            id="cfg-cidade"
            type="text"
            value={profile.city}
            onChange={(event) => set("city", event.target.value)}
            placeholder="Ex.: Curitiba, PR"
            className={inputClasses}
          />
        </Field>

        <Field label="Status" htmlFor="cfg-status">
          <select
            id="cfg-status"
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

        <Field label="Instagram" htmlFor="cfg-instagram">
          <input
            id="cfg-instagram"
            type="url"
            value={profile.instagram}
            onChange={(event) => set("instagram", event.target.value)}
            placeholder="instagram.com/@voce"
            className={inputClasses}
          />
        </Field>
        <Field label="YouTube" htmlFor="cfg-youtube">
          <input
            id="cfg-youtube"
            type="url"
            value={profile.youtube}
            onChange={(event) => set("youtube", event.target.value)}
            placeholder="youtube.com/@voce"
            className={inputClasses}
          />
        </Field>
        <Field label="TikTok" htmlFor="cfg-tiktok">
          <input
            id="cfg-tiktok"
            type="url"
            value={profile.tiktok}
            onChange={(event) => set("tiktok", event.target.value)}
            placeholder="tiktok.com/@voce"
            className={inputClasses}
          />
        </Field>
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
        {saved && (
          <p
            className={`text-sm font-medium ${
              saved.kind === "ok" ? "text-rose-gold" : "text-rosa-blush"
            }`}
          >
            {saved.text}
          </p>
        )}
      </div>
    </PanelSection>
  );
}

function PrivacidadePanel() {
  const { user, logout } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/profile", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha");
      const data = await response.json();
      const payload = JSON.stringify(
        {
          exportadoEm: new Date().toISOString(),
          usuario: {
            email: user.email,
            nome: user.displayName,
          },
          dados: data,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "esmaltup-dados.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setFlash({ kind: "ok", text: "Seus dados foram exportados." });
    } catch {
      setFlash({
        kind: "error",
        text: "Não foi possível exportar seus dados. Tente novamente.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await logout();
    } catch {
      // segue mesmo assim
    }
    setOpenDelete(false);
    setDeleting(false);
    setFlash({
      kind: "ok",
      text: "Sua solicitação de exclusão foi registrada. Em breve seus dados serão removidos.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PanelSection
        icon={Download}
        title="Exportar dados"
        subtitle="Baixe uma cópia do que temos sobre você (perfil, pedidos e progresso)."
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-foreground/70">
            Recomendamos exportar antes de qualquer mudança importante.
          </p>
          <button
            type="button"
            onClick={handleExport}
            className={`${primaryButton} px-6 py-2.5 text-sm`}
          >
            <Download size={16} className="mr-2" />
            Baixar meus dados
          </button>
        </div>
        {flash && flash.kind === "ok" && (
          <p className="mt-4 text-sm font-medium text-rose-gold">{flash.text}</p>
        )}
      </PanelSection>

      <section className="rounded-3xl border border-red-500/30 bg-branco p-7 shadow-card">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <Trash2 size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Excluir conta
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Ação permanente e irreversível. Seu perfil, pedidos e progresso
              serão apagados.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-red-300/80">
            Você precisará confirmar essa ação em duas etapas.
          </p>
          <button
            type="button"
            onClick={() => setOpenDelete(true)}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            <Trash2 size={16} className="mr-2" />
            Excluir minha conta
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={openDelete}
        title="Excluir conta"
        description={
          <>
            Essa ação é <strong className="text-foreground">permanente</strong>{" "}
            e não pode ser desfeita. Seu perfil, pedidos e progresso no curso
            serão apagados do Esmalt&apos;up.
            <span className="mt-2 block text-sm text-foreground/70">
              Você será desconectado assim que confirmar.
            </span>
          </>
        }
        verifyText="EXCLUIR"
        confirmLabel="Excluir conta"
        icon={ShieldAlert}
        busy={deleting}
        onCancel={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("aparencia");

  if (loading) {
    return (
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-bege">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl" />
        <p className="animate-pulse text-lg text-foreground/70">
          Carregando configurações...
        </p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="relative overflow-hidden bg-bege">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-rosa-medio/25 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-0 h-72 w-72 rounded-full bg-rose-gold/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <span className="inline-flex items-center rounded-full border border-rose-gold/30 bg-branco px-4 py-1.5 text-sm font-medium text-rose-gold shadow-card">
            <Lock size={16} className="mr-2" />
            Configurações
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
              Entre para gerenciar sua conta
            </span>
          </h1>
          <p className="mt-5 text-lg text-foreground/75">
            Aparência, dados pessoais e privacidade em um só lugar.
          </p>
          <Link
            href="/login"
            className={`${primaryButton} mt-8 px-8 py-3.5 text-base`}
          >
            Fazer login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl"
      />

      <div className="relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-rose-gold">
            Ajustes da conta
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
              Configurações
            </span>
          </h1>
          <p className="max-w-xl text-sm text-foreground/70 sm:text-base">
            Personalize sua experiência, organize seus dados e gerencie sua
            conta com segurança.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Seções de configurações"
          className="mt-10 flex gap-2 overflow-x-auto rounded-full border border-cinza-suave/70 bg-branco p-1.5 shadow-card"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-rosa-blush to-rose-gold text-white shadow-card"
                    : "text-foreground/70 hover:bg-rosa-claro/50 hover:text-rose-gold"
                }`}
              >
                <tab.icon size={16} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div key={activeTab} className="mt-8 animate-fade-in-up">
          {activeTab === "aparencia" && (
            <AppearancesPanel theme={theme} setTheme={setTheme} />
          )}
          {activeTab === "dados" && <DadosPanel />}
          {activeTab === "privacidade" && <PrivacidadePanel />}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-foreground/50">
          <LogOut size={14} />
          Precisa sair? Use o menu da sua conta no topo da página.
        </p>
      </div>
    </section>
  );
}
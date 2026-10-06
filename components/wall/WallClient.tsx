"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence, LayoutGroup, motion, useMotionValue, useReducedMotion,
  useSpring, useTransform,
} from "framer-motion";
import {
  CalendarDays, Check, ChevronRight, Crown, Filter, GraduationCap,
  Medal, RefreshCw, Search, Sparkles, Star, Trophy, Users, X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { FollowButton, useFollow } from "@/lib/FollowContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { LEDUnderline } from "@/components/ui/LED";
import { isNewGraduate, longDatePtBR, type WallEntry, type WallPage } from "@/lib/wall";

type Order = "rank" | "recent";
type Period = "all" | "month" | "three-months" | "year";

interface OwnCertificate {
  rankPosition: number | null;
  showOnWall: boolean;
}

const periods: { value: Period; label: string }[] = [
  { value: "all", label: "Todos os períodos" },
  { value: "month", label: "Este mês" },
  { value: "three-months", label: "Últimos 3 meses" },
  { value: "year", label: "Este ano" },
];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function Avatar({ entry, size = "md" }: { entry: WallEntry; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-20 w-20 text-xl" : size === "sm" ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm";
  const ring = entry.rankPosition === 1 ? "border-amber-300 shadow-[0_0_20px_rgba(251,191,36,.35)]"
    : entry.rankPosition === 2 ? "border-slate-300"
      : entry.rankPosition === 3 ? "border-amber-700"
        : "border-rose-gold/70";
  return (
    <span className={`inline-flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${ring} bg-gradient-to-br from-rosa-blush to-rose-gold font-bold text-white`}>
      {entry.profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : initials(entry.recipientName)}
    </span>
  );
}

function rankTone(rank: number) {
  if (rank === 1) return "border-amber-300/60 bg-amber-300/15 text-amber-200 shadow-[0_0_18px_rgba(251,191,36,.2)]";
  if (rank === 2) return "border-slate-300/50 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-amber-700/60 bg-amber-700/15 text-amber-300";
  return "border-rose-gold/35 bg-rose-gold/10 text-rose-gold";
}

function maskedCode(code: string) {
  const match = code.match(/^(ESM-\d{4}-)(.+)$/);
  return match ? `${match[1]}••••${match[2].slice(-4)}` : code;
}

function SkeletonRows() {
  return (
    <div aria-hidden="true" className="space-y-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 rounded-2xl bg-rosa-claro/20 p-4">
          <span className="h-9 w-9 rounded-xl bg-rosa-claro/70" />
          <span className="h-11 w-11 rounded-full bg-rosa-claro/70" />
          <span className="h-4 flex-1 rounded bg-rosa-claro/70" />
          <span className="h-4 w-24 rounded bg-rosa-claro/70" />
        </div>
      ))}
    </div>
  );
}

function Count({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  return <motion.span key={value} initial={reduceMotion ? false : { y: 5, opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">{value.toLocaleString("pt-BR")}</motion.span>;
}

function AnimatedRank({ rank }: { rank: number }) {
  const reduceMotion = useReducedMotion();
  const value = useMotionValue(reduceMotion ? rank : 0);
  const spring = useSpring(value, { stiffness: 75, damping: 20 });
  const rounded = useTransform(spring, (current) => Math.round(current));
  useEffect(() => { value.set(rank); }, [rank, value]);
  return <motion.span>{rounded}</motion.span>;
}

function FollowAction({ entry }: { entry: WallEntry }) {
  if (!entry.profile) return null;
  return (
    <FollowButton
      username={entry.profile.username}
      displayName={entry.profile.displayName}
      compact
      initial={{
        isFollowing: entry.isFollowing,
        followersCount: entry.profile.followersCount,
        followingCount: entry.profile.followingCount,
        allowFollows: entry.profile.allowFollows,
        loaded: true,
      }}
    />
  );
}

function ProfileLink({ entry, children }: { entry: WallEntry; children: React.ReactNode }) {
  if (!entry.profile) return <>{children}</>;
  return <Link href={`/u/${encodeURIComponent(entry.profile.username)}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">{children}</Link>;
}

function PodiumCard({ entry, place }: { entry: WallEntry; place: number }) {
  const reduceMotion = useReducedMotion();
  const champion = place === 1;
  const badge = place === 1 ? "text-amber-200" : place === 2 ? "text-slate-200" : "text-amber-500";
  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? {} : { y: -4 }}
      transition={{ type: "spring", stiffness: 230, damping: 22 }}
      className={`relative min-w-[82vw] snap-center overflow-hidden rounded-3xl border p-5 sm:min-w-0 ${
        champion
          ? "border-amber-300/40 bg-gradient-to-br from-amber-300/15 via-branco/75 to-rose-gold/10 shadow-[0_0_28px_rgba(251,191,36,.12)]"
          : "border-cinza-suave/50 bg-branco/65"
      }`}
    >
      {champion && <Sparkles aria-hidden className="absolute right-4 top-4 h-5 w-5 motion-safe:animate-pulse text-amber-300" />}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-2 font-extrabold ${badge}`}>
          {champion ? <Crown size={20} /> : <Medal size={18} />} #{entry.rankPosition}
        </span>
        <span className="text-xs text-foreground/55">{longDatePtBR(entry.issuedAt)}</span>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <ProfileLink entry={entry}><Avatar entry={entry} size="lg" /></ProfileLink>
        <div className="min-w-0">
          <ProfileLink entry={entry}>
            <span className="block truncate font-bold text-foreground hover:text-rose-gold">{entry.recipientName}</span>
          </ProfileLink>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300"><Check size={12} /> Certificado válido</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {entry.profile && <Link href={`/u/${encodeURIComponent(entry.profile.username)}`} className="rounded-full border border-rose-gold/40 px-3 py-2 text-xs font-semibold text-rose-gold">Ver perfil</Link>}
        <FollowAction entry={entry} />
      </div>
    </motion.article>
  );
}

function GraduateRow({
  entry,
  highlight,
}: {
  entry: WallEntry;
  highlight: boolean;
}) {
  const path = entry.profile ? `/u/${encodeURIComponent(entry.profile.username)}` : null;
  const reduceMotion = useReducedMotion();
  const rowClass = `border-b border-cinza-suave/20 transition-colors hover:bg-rosa-claro/15 ${entry.rankPosition === 1 ? "bg-amber-300/[0.07]" : ""} ${entry.isOwn ? "bg-rose-gold/10 ring-1 ring-inset ring-rose-gold/45" : ""} ${highlight ? "motion-safe:animate-pulse ring-2 ring-inset ring-rose-gold" : ""}`;
  const follow = useFollow(entry.profile?.username ?? "", entry.profile ? {
    isFollowing: entry.isFollowing,
    followersCount: entry.profile.followersCount,
    followingCount: entry.profile.followingCount,
    allowFollows: entry.profile.allowFollows,
    loaded: true,
  } : undefined);
  return (
    <motion.tr
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      whileHover={reduceMotion ? {} : { y: -2 }}
      id={`graduate-${entry.rankPosition}`}
      className={`${rowClass} ${path ? "cursor-pointer" : ""}`}
      tabIndex={path ? 0 : undefined}
      role={path ? "link" : undefined}
      aria-label={path ? `Abrir perfil de ${entry.recipientName}, posição ${entry.rankPosition}` : undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a,button")) return;
        if (path) window.location.assign(path);
      }}
      onKeyDown={(event) => {
        if (path && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          window.location.assign(path);
        }
      }}
    >
      <td className="px-4 py-4">
        <span className={`inline-flex min-w-11 items-center justify-center rounded-xl border px-2 py-2 text-sm font-extrabold tabular-nums ${rankTone(entry.rankPosition)}`}>
          {entry.rankPosition === 1 && <Crown size={14} className="mr-1" />}#<AnimatedRank rank={entry.rankPosition} />
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex min-w-56 items-center gap-3">
          <Avatar entry={entry} size="sm" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className="truncate">{entry.recipientName}</span>
              {isNewGraduate(entry.issuedAt) && <span className="rounded-full bg-rose-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-gold">Novo</span>}
              {entry.isOwn && <span className="rounded-full bg-rosa-blush/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-gold">Você</span>}
              {follow.isFollowing && <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">Seguindo</span>}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-300"><Check size={12} /> Certificado válido</span>
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-foreground/70">{longDatePtBR(entry.issuedAt)}</td>
      <td className="px-4 py-4">
        <span className="font-mono text-xs text-foreground/65">{maskedCode(entry.publicCode)}</span>
        <Link href={`/verificar/${encodeURIComponent(entry.publicCode)}`} className="ml-2 text-xs font-semibold text-rose-gold hover:underline">Verificar</Link>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {entry.profile && <Link href={`/u/${encodeURIComponent(entry.profile.username)}`} className="whitespace-nowrap rounded-full border border-rose-gold/35 px-3 py-2 text-xs font-semibold text-rose-gold">Ver perfil</Link>}
          <FollowAction entry={entry} />
        </div>
      </td>
    </motion.tr>
  );
}

function GraduateMobileCard({
  entry,
  highlight,
}: {
  entry: WallEntry;
  highlight: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const follow = useFollow(entry.profile?.username ?? "", entry.profile ? {
    isFollowing: entry.isFollowing,
    followersCount: entry.profile.followersCount,
    followingCount: entry.profile.followingCount,
    allowFollows: entry.profile.allowFollows,
    loaded: true,
  } : undefined);
  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      id={`graduate-mobile-${entry.rankPosition}`}
      className={`list-none border-b border-cinza-suave/20 p-3 ${entry.isOwn ? "bg-rose-gold/10" : ""} ${highlight ? "motion-safe:animate-pulse ring-2 ring-rose-gold" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-1 text-xs font-extrabold ${rankTone(entry.rankPosition)}`}>#{entry.rankPosition}</span>
        {entry.profile ? <Link href={`/u/${encodeURIComponent(entry.profile.username)}`}><Avatar entry={entry} size="sm" /></Link> : <Avatar entry={entry} size="sm" />}
        <span className="min-w-0 flex-1">
          {entry.profile ? <Link href={`/u/${encodeURIComponent(entry.profile.username)}`} className="block truncate text-sm font-bold text-foreground">{entry.recipientName}</Link> : <span className="block truncate text-sm font-bold text-foreground">{entry.recipientName}</span>}
          <span className="block text-[11px] text-foreground/60">{longDatePtBR(entry.issuedAt)}{follow.isFollowing ? " · Seguindo" : ""}</span>
        </span>
        <FollowAction entry={entry} />
      </div>
    </motion.li>
  );
}

export default function WallClient() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<WallPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>("rank");
  const [period, setPeriod] = useState<Period>("all");
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [followingOnly, setFollowingOnly] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [own, setOwn] = useState<OwnCertificate | null>(null);
  const [highlightRank, setHighlightRank] = useState<number | null>(null);
  const [jumpRank, setJumpRank] = useState<number | null>(null);
  const requestId = useRef(0);
  const requestedPage = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryDraft.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [queryDraft]);

  const load = useCallback(async (pageNumber = 1, append = false) => {
    const id = ++requestId.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        order,
        period,
        q: query,
        following: String(followingOnly),
        publicOnly: String(publicOnly),
      });
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(`/api/formados?${params}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar o Hall da Fama.");
      if (id !== requestId.current) return;
      setData((current) => append && current
        ? { ...result, entries: [...current.entries, ...result.entries] }
        : result);
      setPage(pageNumber);
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o Hall da Fama.");
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [followingOnly, order, period, publicOnly, query, user]);

  useEffect(() => {
    const filtersCleared = order === "rank" && period === "all" && !query && !followingOnly && !publicOnly;
    if (requestedPage.current !== null) {
      if (!filtersCleared) return;
      const requested = requestedPage.current;
      requestedPage.current = null;
      void load(requested);
      return;
    }
    void load(1);
  }, [followingOnly, load, order, period, publicOnly, query]);

  useEffect(() => {
    let active = true;
    async function loadOwn() {
      if (!user) {
        setOwn(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/certificates/issue", {
          headers: { authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (active) setOwn(result.certificate ? {
          rankPosition: result.certificate.rankPosition ?? null,
          showOnWall: Boolean(result.certificate.showOnWall),
        } : null);
      } catch {
        if (active) setOwn(null);
      }
    }
    void loadOwn();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (jumpRank === null || !data?.entries.some((entry) => entry.rankPosition === jumpRank)) return;
    const row = document.getElementById(
      window.matchMedia("(max-width: 639px)").matches
        ? `graduate-mobile-${jumpRank}`
        : `graduate-${jumpRank}`,
    );
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightRank(jumpRank);
    window.setTimeout(() => setHighlightRank(null), 2500);
    setJumpRank(null);
  }, [data, jumpRank]);

  const resetFilters = () => {
    setQueryDraft("");
    setPeriod("all");
    setFollowingOnly(false);
    setPublicOnly(false);
    setOrder("rank");
    setFilterOpen(false);
  };

  const goToPosition = () => {
    if (!own?.rankPosition || !own.showOnWall) return;
    const pageNumber = Math.ceil(own.rankPosition / (data?.pageSize ?? 20));
    const canLoadDirectly = order === "rank" && period === "all" && !query && !followingOnly && !publicOnly;
    setQueryDraft("");
    setPeriod("all");
    setFollowingOnly(false);
    setPublicOnly(false);
    setOrder("rank");
    setJumpRank(own.rankPosition);
    if (canLoadDirectly) void load(pageNumber);
    else requestedPage.current = pageNumber;
  };

  const filterControls = (
    <>
      <label className="flex items-center gap-2 text-xs font-medium text-foreground/70">
        <span className="sr-only">Filtrar por período</span>
        <CalendarDays size={15} aria-hidden />
        <select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border border-cinza-suave/40 bg-branco/70 px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">
          {periods.map((item) => <option key={item.value} value={item.value} className="bg-branco">{item.label}</option>)}
        </select>
      </label>
      <label className={`flex items-center gap-2 text-xs font-medium ${user ? "text-foreground/75" : "text-foreground/40"}`}>
        <input type="checkbox" checked={followingOnly} disabled={!user} onChange={(event) => setFollowingOnly(event.target.checked)} className="accent-rose-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold" />
        Seguindo
      </label>
      <label className="flex items-center gap-2 text-xs font-medium text-foreground/75">
        <input type="checkbox" checked={publicOnly} onChange={(event) => setPublicOnly(event.target.checked)} className="accent-rose-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold" />
        Só perfis públicos
      </label>
    </>
  );

  const list = data?.entries ?? [];
  return (
    <main className="min-h-screen px-3 pb-32 pt-8 sm:px-6 sm:pb-36">
      <div className="mx-auto max-w-7xl">
        <GlassCard withLed padding="lg" className="overflow-hidden bg-[#251624]/95 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rose-gold/20 blur-3xl" />
          <div className="relative grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-amber-200"><Trophy size={20} /><span className="text-xs font-bold uppercase tracking-[.25em]">Esmalt&apos;up · Hall da Fama</span></div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Hall da Fama</h1>
              <LEDUnderline className="mt-3 max-w-xs" width="14rem" />
              <p className="mt-4 max-w-2xl text-sm text-white/75 sm:text-base">Quem concluiu o curso Nail Designer Iniciante. Cada posição guarda a ordem original da conquista.</p>
              <div className="mt-6 flex flex-wrap gap-5">
                <HeroCount icon={<Users size={16} />} label="Formados" value={data?.stats.total ?? 0} />
                <HeroCount icon={<CalendarDays size={16} />} label="Este mês" value={data?.stats.thisMonth ?? 0} />
                <HeroCount icon={<Sparkles size={16} />} label="Novos hoje" value={data?.stats.today ?? 0} />
              </div>
            </div>
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-amber-300/30 bg-amber-200/5 text-amber-200 shadow-[0_0_50px_rgba(251,191,36,.14)] md:mx-0">
              <Trophy aria-label="Troféu do Hall da Fama" size={70} strokeWidth={1.2} />
            </div>
          </div>
        </GlassCard>

        <section className="mt-10" aria-labelledby="podium-heading">
          <div className="mb-4 flex items-center gap-3">
            <Crown className="text-amber-300" size={22} />
            <div><h2 id="podium-heading" className="text-xl font-extrabold text-foreground">Top 3 · Pódio</h2><p className="text-xs text-foreground/55">As primeiras conquistas do curso</p></div>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible">
            {(data?.topThree ?? []).map((entry, index) => <PodiumCard key={entry.publicCode} entry={entry} place={index + 1} />)}
            {!data?.topThree.length && !loading && <GlassCard className="w-full text-sm text-foreground/60" padding="md">O pódio aparecerá quando certificados forem emitidos.</GlassCard>}
            {loading && [1, 2, 3].map((rank) => <div key={rank} className="h-52 min-w-[82vw] animate-pulse rounded-3xl bg-rosa-claro/30 sm:min-w-0" />)}
          </div>
        </section>

        <section className="sticky top-[72px] z-20 mt-8 rounded-2xl border border-rose-gold/20 bg-branco/90 p-3 shadow-card backdrop-blur-md sm:p-4" aria-label="Filtros do Hall da Fama">
          <div className="flex flex-wrap items-center gap-3">
            <LayoutGroup>
              <div className="flex rounded-full border border-cinza-suave/45 bg-rosa-claro/15 p-1">
                {([{ value: "rank", label: "Primeiros formados" }, { value: "recent", label: "Mais recentes" }] as const).map((item) => (
                  <button key={item.value} onClick={() => setOrder(item.value)} className={`relative rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 ${order === item.value ? "text-white" : "text-foreground/65"}`}>
                    {order === item.value && <motion.span layoutId={reduceMotion ? undefined : "hall-sort"} className="absolute inset-0 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold" />}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <label className="relative min-w-44 flex-1">
              <span className="sr-only">Buscar por nome</span>
              <Search aria-hidden size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/45" />
              <input value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="Buscar por nome..." className="w-full rounded-full border border-cinza-suave/50 bg-branco/80 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold" />
            </label>
            <div className="hidden flex-wrap items-center gap-4 lg:flex">{filterControls}</div>
            <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-cinza-suave/50 px-3 py-2 text-xs font-semibold text-foreground/75 lg:hidden">
              <Filter size={15} /> Filtros
            </button>
            {(query || period !== "all" || followingOnly || publicOnly) && <button type="button" onClick={resetFilters} className="text-xs font-semibold text-rose-gold hover:underline">Limpar</button>}
          </div>
          <p aria-live="polite" className="mt-3 text-xs text-foreground/55">{loading ? "Atualizando resultados..." : `${data?.total ?? 0} resultado(s)`}</p>
        </section>

        <AnimatePresence>
          {filterOpen && (
            <motion.div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFilterOpen(false)}>
              <motion.div role="dialog" aria-modal="true" aria-labelledby="hall-filter-title" className="w-full rounded-3xl border border-rose-gold/25 bg-branco p-5 shadow-card" initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between"><h2 id="hall-filter-title" className="font-bold text-foreground">Filtros</h2><button onClick={() => setFilterOpen(false)} aria-label="Fechar filtros" className="rounded-full p-2 text-foreground/70 focus-visible:ring-2 focus-visible:ring-rose-gold"><X size={18} /></button></div>
                <div className="mt-5 flex flex-col items-start gap-5">{filterControls}</div>
                <button onClick={() => setFilterOpen(false)} className="mt-6 w-full rounded-full bg-rose-gold py-3 text-sm font-bold text-white">Ver resultados</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div role="alert" className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            <span>{error}</span><button onClick={() => void load(1)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-300/40 px-3 py-2 text-xs font-semibold"><RefreshCw size={14} /> Tentar novamente</button>
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-3xl border border-cinza-suave/45 bg-branco/75 shadow-card" aria-label="Ranking de formados">
          {loading ? <SkeletonRows /> : list.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <GraduationCap size={48} className="text-rose-gold" />
              <h2 className="mt-4 text-lg font-bold text-foreground">{data?.stats.total ? "Nenhum resultado com esses filtros" : "O Hall da Fama está esperando por você"}</h2>
              <p className="mt-2 max-w-md text-sm text-foreground/65">Ajuste os filtros ou conclua o curso para conquistar sua posição permanente.</p>
              {data?.stats.total ? (
                <button onClick={resetFilters} className="mt-5 rounded-full border border-rose-gold/40 px-5 py-2 text-sm font-semibold text-rose-gold">Limpar filtros</button>
              ) : (
                <Link href="/curso" className="mt-5 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-5 py-3 text-sm font-bold text-white">Concluir o curso <ChevronRight className="ml-1 inline" size={16} /></Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="hidden w-full min-w-[900px] text-left sm:table">
                <caption className="sr-only">Ranking permanente de formados, ordenado por data da primeira emissão do certificado</caption>
                <thead className="bg-rosa-claro/20 text-[11px] uppercase tracking-wider text-foreground/55">
                  <tr><th scope="col" className="px-4 py-3">#</th><th scope="col" className="px-4 py-3">Aluno(a)</th><th scope="col" className="px-4 py-3">Concluiu em</th><th scope="col" className="px-4 py-3">Código</th><th scope="col" className="px-4 py-3">Ações</th></tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {list.map((entry) => <GraduateRow key={entry.publicCode} entry={entry} highlight={highlightRank === entry.rankPosition} />)}
                  </AnimatePresence>
                </tbody>
              </table>
              <ul className="sm:hidden">
                <AnimatePresence initial={false}>
                  {list.map((entry) => <GraduateMobileCard key={entry.publicCode} entry={entry} highlight={highlightRank === entry.rankPosition} />)}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </section>

        {data?.hasMore && !loading && (
          <div className="mt-6 text-center">
            <button disabled={loadingMore} onClick={() => void load(page + 1, true)} className="rounded-full border border-rose-gold/40 bg-rosa-claro/20 px-6 py-3 text-sm font-semibold text-rose-gold disabled:opacity-50">
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        )}

        <section className="mt-10" aria-labelledby="hall-stats-heading">
          <h2 id="hall-stats-heading" className="mb-4 text-xl font-extrabold text-foreground">Conquistas da comunidade</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile icon={<Users size={19} />} label="Total de formados" value={data?.stats.total ?? 0} />
            <StatTile icon={<Sparkles size={19} />} label="Formados este mês" value={data?.stats.thisMonth ?? 0} />
            <StatTile icon={<Star size={19} />} label="Primeira posição" value={data?.stats.firstGraduate ?? "—"} />
            <StatTile icon={<CalendarDays size={19} />} label="Média por mês" value={data?.stats.averagePerMonth ?? 0} />
          </div>
          {data?.stats.newestGraduate && <p className="mt-3 text-xs text-foreground/55">Mais recente: {data.stats.newestGraduate}</p>}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-gold/25 bg-[#241923]/95 px-4 py-3 text-white shadow-[0_-8px_32px_rgba(0,0,0,.18)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {own?.rankPosition && own.showOnWall ? (
            <>
              <p className="text-sm font-semibold">Sua posição: <span className="text-rose-gold">#{own.rankPosition} de {data?.stats.total ?? "—"}</span></p>
              <button onClick={goToPosition} className="rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-4 py-2 text-xs font-bold text-white sm:text-sm">Ir para minha posição</button>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold sm:text-sm">{own?.rankPosition ? "Seu certificado está oculto no mural" : "Conclua o curso e entre para o Hall da Fama"}</p>
              <Link href={own?.rankPosition ? "/configuracoes" : "/curso"} className="shrink-0 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-4 py-2 text-xs font-bold text-white sm:text-sm">{own?.rankPosition ? "Configurar perfil" : "Ver curso"} <ChevronRight className="ml-1 inline" size={14} /></Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function HeroCount({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-2"><span className="text-rose-gold">{icon}</span><span className="text-lg font-extrabold text-white"><Count value={value} /></span><span className="text-xs text-white/60">{label}</span></div>;
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <GlassCard hoverable padding="md" className="min-h-28">
      <div className="flex items-center gap-2 text-rose-gold">{icon}<span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{label}</span></div>
      <motion.p key={value} initial={{ opacity: 0.5, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 truncate text-xl font-extrabold text-foreground">{typeof value === "number" ? <Count value={value} /> : value}</motion.p>
    </GlassCard>
  );
}

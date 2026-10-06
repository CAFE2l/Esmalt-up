"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award, Check, Copy, ExternalLink, LoaderCircle, RefreshCw, Share2, Users,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { FollowButton, useFollow } from "@/lib/FollowContext";

interface PublicProfileData {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: string;
  isPublic: boolean;
  allowFollows: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  certificate: null | {
    courseName: string;
    completedAt: string;
    certificateCode: string;
    rankPosition: number | null;
  };
}

interface ConnectionProfile {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  allowFollows: boolean;
  isFollowing: boolean;
}

type Tab = "about" | "followers" | "following";

function datePtBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Avatar({
  name,
  url,
  graduate = false,
  size = "large",
}: {
  name: string;
  url: string | null;
  graduate?: boolean;
  size?: "large" | "small";
}) {
  const dimensions = size === "large" ? "h-28 w-28 text-2xl" : "h-11 w-11 text-sm";
  return (
    <span className={`inline-flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] ${
      graduate ? "border-amber-300 shadow-[0_0_22px_rgba(251,191,36,.5)]" : "border-rose-gold shadow-[0_0_20px_rgba(214,140,156,.45)]"
    } bg-gradient-to-br from-rosa-blush to-rose-gold font-bold text-white`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
    </span>
  );
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto min-h-[75vh] max-w-5xl px-4 py-10">
      <div className="h-48 animate-pulse rounded-3xl bg-rosa-claro/50" />
      <div className="-mt-14 ml-6 h-28 w-28 animate-pulse rounded-full bg-rose-gold/30" />
      <div className="mt-5 h-7 w-56 animate-pulse rounded bg-rosa-claro/50" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-rosa-claro/50" />
    </main>
  );
}

export default function PublicProfileClient({ username }: { username: string }) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const sharedFollow = useFollow(username, profile ? {
    isFollowing: profile.isFollowing,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    allowFollows: profile.allowFollows,
    loaded: true,
  } : undefined);
  const [tab, setTab] = useState<Tab>("about");
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [connectionPage, setConnectionPage] = useState(1);
  const [connectionMore, setConnectionMore] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPrivateProfile(false);
    try {
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(`/api/public-profiles/${encodeURIComponent(username)}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 404) {
        setProfile(null);
        return;
      }
      if (response.status === 403 && data.private) {
        setPrivateProfile(true);
        setProfile(null);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar este perfil.");
      setProfile(data.profile as PublicProfileData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar este perfil.");
    } finally {
      setLoading(false);
    }
  }, [user, username]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.displayName} — Formada pela Esmalt'up`;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.append(description);
    }
    description.content = `Conheça o perfil de ${profile.displayName}, formada pela Esmalt'up.`;
  }, [profile]);

  const loadConnections = useCallback(async (nextPage = 1) => {
    if (!profile || tab === "about") return;
    setConnectionsLoading(true);
    try {
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(
        `/api/public-profiles/${encodeURIComponent(username)}/connections?type=${tab}&page=${nextPage}`,
        { headers: token ? { authorization: `Bearer ${token}` } : {}, cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar a lista.");
      setConnections((current) => nextPage === 1 ? data.profiles : [...current, ...data.profiles]);
      setConnectionMore(Boolean(data.hasMore));
      setConnectionPage(nextPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar a lista.");
    } finally {
      setConnectionsLoading(false);
    }
  }, [profile, tab, user, username]);

  useEffect(() => {
    setConnections([]);
    setConnectionPage(1);
    if (tab !== "about" && profile) void loadConnections(1);
  }, [loadConnections, profile, tab]);

  const shareProfile = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: profile?.displayName, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError("Não foi possível compartilhar o perfil.");
    }
  };

  const copyCode = async () => {
    if (!profile?.certificate) return;
    try {
      await navigator.clipboard.writeText(profile.certificate.certificateCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar o código do certificado.");
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (error && !profile) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p role="alert" className="text-foreground/70">{error}</p>
        <button onClick={() => void loadProfile()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-gold/50 px-5 py-2 text-sm font-semibold text-rose-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </main>
    );
  }
  if (privateProfile) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <Users className="h-12 w-12 text-rose-gold" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Este perfil é privado</h1>
        <p className="mt-2 text-sm text-foreground/65">A pessoa escolheu não exibir seu perfil publicamente.</p>
        <Link href="/formados" className="mt-5 text-sm font-semibold text-rose-gold hover:underline">Voltar ao Hall da Fama</Link>
      </main>
    );
  }
  if (!profile) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <Users className="h-12 w-12 text-rose-gold" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Perfil não encontrado</h1>
        <p className="mt-2 text-sm text-foreground/65">Confira o endereço ou volte ao Hall da Fama.</p>
        <Link href="/formados" className="mt-5 text-sm font-semibold text-rose-gold hover:underline">Ver formados</Link>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "about", label: "Sobre" },
    { key: "followers", label: "Seguidores", count: profile.followersCount },
    { key: "following", label: "Seguindo", count: profile.followingCount },
  ];
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-3xl border border-rose-gold/20 bg-branco/80 shadow-card backdrop-blur-sm">
          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#31172c] via-[#754056] to-[#201327] sm:h-56">
            <motion.div
              aria-hidden
              className="absolute -inset-1 bg-gradient-to-r from-transparent via-rose-gold/25 to-transparent"
              animate={reduceMotion ? {} : { x: ["-100%", "100%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div className="px-5 pb-6 sm:px-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="-mt-14"><Avatar name={profile.displayName} url={profile.avatarUrl} graduate={Boolean(profile.certificate)} /></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void shareProfile()} className="inline-flex items-center gap-2 rounded-full border border-cinza-suave px-4 py-2 text-sm font-semibold text-foreground/80 hover:border-rose-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">
                  {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? "Copiado" : "Compartilhar perfil"}
                </button>
                {profile.isOwner ? (
                  <Link href="/perfil" className="rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-5 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">Editar perfil</Link>
                ) : (
                  <FollowButton username={profile.username} displayName={profile.displayName} initial={{
                    isFollowing: profile.isFollowing,
                    followersCount: profile.followersCount,
                    followingCount: profile.followingCount,
                    allowFollows: profile.allowFollows,
                    loaded: true,
                  }} />
                )}
              </div>
            </div>
            {profile.isOwner && !profile.isPublic && (
              <p className="mt-3 rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-200">Seu perfil está privado; somente você pode vê-lo.</p>
            )}
            <div className="mt-4">
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{profile.displayName}</h1>
              <p className="mt-1 text-sm text-rose-gold">@{profile.username}</p>
              {profile.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/80">{profile.bio}</p>}
              {profile.certificate && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-foreground/65">
                  <Award size={16} className="text-amber-400" /> Formada desde {datePtBR(profile.certificate.completedAt)}
                </p>
              )}
            </div>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3 border-t border-cinza-suave/50 pt-5 text-center">
              <Stat value={sharedFollow.followersCount} label="Seguidores" />
              <Stat value={sharedFollow.followingCount} label="Seguindo" />
              <Stat value={profile.certificate?.rankPosition ?? null} label="Posição" prefix={profile.certificate ? "#" : ""} suffix={profile.certificate ? " no ranking" : ""} />
            </div>
            <nav aria-label="Abas do perfil" className="mt-7 flex gap-2 overflow-x-auto border-b border-cinza-suave/40">
              {tabs.map((item) => (
                <button key={item.key} onClick={() => setTab(item.key)} aria-current={tab === item.key ? "page" : undefined} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold ${tab === item.key ? "border-rose-gold text-rose-gold" : "border-transparent text-foreground/60 hover:text-foreground"}`}>
                  {item.label}{item.count !== undefined ? ` · ${item.count}` : ""}
                </button>
              ))}
            </nav>
          </div>
        </section>

        <section className="mt-6 min-h-52 rounded-3xl border border-cinza-suave/50 bg-branco/75 p-5 shadow-card sm:p-7">
          {tab === "about" && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-cinza-suave/50 bg-rosa-claro/15 p-5">
                <h2 className="font-bold text-foreground">Sobre</h2>
                <p className="mt-3 text-sm leading-6 text-foreground/70">{profile.bio || "Esta pessoa ainda não adicionou uma bio."}</p>
                <p className="mt-3 text-xs text-foreground/55">Na comunidade desde {datePtBR(profile.joinedAt)}</p>
              </div>
              {profile.certificate && (
                <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-300/10 to-rose-gold/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="inline-flex items-center gap-2 font-bold text-foreground"><Award size={18} className="text-amber-400" /> Certificado</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"><Check size={14} /> Certificado válido</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{profile.certificate.courseName}</p>
                  <p className="mt-1 text-sm text-foreground/65">Concluído em {datePtBR(profile.certificate.completedAt)}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <code className="rounded-lg border border-cinza-suave/60 bg-branco/70 px-3 py-2 font-mono text-sm text-rose-gold">{profile.certificate.certificateCode}</code>
                    <button aria-label="Copiar código do certificado" onClick={() => void copyCode()} className="rounded-lg border border-cinza-suave/60 p-2 text-foreground/70 hover:text-rose-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"><Copy size={16} /></button>
                  </div>
                  <Link href={`/verificar/${encodeURIComponent(profile.certificate.certificateCode)}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-4 py-2 text-sm font-semibold text-white">
                    Verificar certificado <ExternalLink size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}
          {tab !== "about" && (
            <>
              {connectionsLoading && connections.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-foreground/60"><LoaderCircle className="animate-spin" size={18} /> Carregando...</div>
              ) : connections.length === 0 ? (
                <p className="py-12 text-center text-sm text-foreground/60">Ainda não há {tab === "followers" ? "seguidores" : "perfis seguidos"} para exibir.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {connections.map((connection) => (
                    <li key={connection.username} className="flex items-center gap-3 rounded-2xl border border-cinza-suave/40 p-3">
                      <Link href={`/u/${encodeURIComponent(connection.username)}`} aria-label={`Abrir perfil de ${connection.displayName}`}><Avatar name={connection.displayName} url={connection.avatarUrl} size="small" /></Link>
                      <Link href={`/u/${encodeURIComponent(connection.username)}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:text-rose-gold">{connection.displayName}</Link>
                      <FollowButton username={connection.username} displayName={connection.displayName} compact initial={{
                        isFollowing: connection.isFollowing,
                        followersCount: connection.followersCount,
                        followingCount: connection.followingCount,
                        allowFollows: connection.allowFollows,
                        loaded: true,
                      }} />
                    </li>
                  ))}
                </ul>
              )}
              {connectionMore && (
                <div className="mt-5 text-center">
                  <button disabled={connectionsLoading} onClick={() => void loadConnections(connectionPage + 1)} className="rounded-full border border-rose-gold/40 px-5 py-2 text-sm font-semibold text-rose-gold disabled:opacity-50">
                    {connectionsLoading ? "Carregando..." : "Carregar mais"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
        {error && profile && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </main>
  );
}

function Stat({
  value,
  label,
  prefix = "",
  suffix = "",
}: {
  value: number | null;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div layout className="rounded-xl bg-rosa-claro/15 px-2 py-3">
      <motion.p key={value ?? "none"} initial={reduceMotion ? false : { opacity: 0.5, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-extrabold tabular-nums text-foreground">
        {prefix}{value ?? "—"}{suffix}
      </motion.p>
      <p className="mt-1 text-xs text-foreground/60">{label}</p>
    </motion.div>
  );
}

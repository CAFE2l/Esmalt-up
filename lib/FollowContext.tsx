"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export interface FollowState {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  allowFollows: boolean;
  loaded: boolean;
}

interface FollowContextValue {
  states: Record<string, FollowState>;
  register: (username: string, state: Partial<FollowState>) => void;
  toggle: (username: string, displayName: string) => Promise<boolean>;
  loading: Record<string, boolean>;
  error: string | null;
  clearError: () => void;
}

const FollowContext = createContext<FollowContextValue | null>(null);
const emptyState: FollowState = {
  isFollowing: false,
  followersCount: 0,
  followingCount: 0,
  allowFollows: true,
  loaded: false,
};

export function FollowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [states, setStates] = useState<Record<string, FollowState>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const register = useCallback((username: string, patch: Partial<FollowState>) => {
    setStates((current) => ({
      ...current,
      [username]: { ...emptyState, ...current[username], ...patch },
    }));
  }, []);

  const toggle = useCallback(async (username: string, displayName: string) => {
    if (!user) return false;
    const current = states[username] ?? emptyState;
    if ((!current.allowFollows && !current.isFollowing) || loading[username]) return false;
    const nextFollowing = !current.isFollowing;
    const previous = current;
    setError(null);
    setLoading((items) => ({ ...items, [username]: true }));
    setStates((items) => ({
      ...items,
      [username]: {
        ...current,
        isFollowing: nextFollowing,
        followersCount: Math.max(0, current.followersCount + (nextFollowing ? 1 : -1)),
      },
    }));
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/follows", {
        method: nextFollowing ? "POST" : "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar o follow.");
      register(username, {
        isFollowing: data.isFollowing,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
        allowFollows: data.allowFollows,
        loaded: true,
      });
      if (data.actorUsername && typeof data.actorFollowingCount === "number") {
        register(data.actorUsername, {
          followingCount: data.actorFollowingCount,
          loaded: true,
        });
      }
      setToast(nextFollowing
        ? `Agora você segue ${displayName}`
        : `Você deixou de seguir ${displayName}`);
      window.setTimeout(() => setToast(null), 3000);
      return true;
    } catch (cause) {
      setStates((items) => ({ ...items, [username]: previous }));
      const message = cause instanceof Error ? cause.message : "Não foi possível atualizar o follow.";
      setError(message);
      setToast(message);
      window.setTimeout(() => setToast(null), 4000);
      return false;
    } finally {
      setLoading((items) => ({ ...items, [username]: false }));
    }
  }, [loading, register, states, user]);

  const value = useMemo(
    () => ({ states, register, toggle, loading, error, clearError }),
    [states, register, toggle, loading, error, clearError],
  );

  return (
    <FollowContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-rose-gold/40 bg-branco px-5 py-3 text-sm font-semibold text-foreground shadow-card"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </FollowContext.Provider>
  );
}

export function useFollow(
  username: string,
  initial?: Partial<FollowState>,
): FollowState & { pending: boolean; toggleFollow: (displayName: string) => Promise<boolean>; error: string | null } {
  const context = useContext(FollowContext);
  const { user } = useAuth();
  if (!context) throw new Error("useFollow deve ser usado dentro de <FollowProvider>");
  const state = context.states[username] ?? { ...emptyState, ...initial };
  const register = context.register;

  useEffect(() => {
    if (!username || state.loaded || !user) return;
    let active = true;
    void user.getIdToken().then((token) =>
      fetch(`/api/follows?username=${encodeURIComponent(username)}`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ).then((response) => response.json()).then((data) => {
      if (active && data.profile) {
        register(username, {
          isFollowing: data.profile.isFollowing,
          followersCount: data.profile.followersCount,
          followingCount: data.profile.followingCount,
          allowFollows: data.profile.allowFollows,
          loaded: true,
        });
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [register, state.loaded, user, username]);

  return {
    ...state,
    pending: Boolean(context.loading[username]),
    toggleFollow: (name) => context.toggle(username, name),
    error: context.error,
  };
}

export function FollowButton({
  username,
  displayName,
  initial,
  compact = false,
}: {
  username: string;
  displayName: string;
  initial?: Partial<FollowState>;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const { isFollowing, allowFollows, pending, toggleFollow, error } = useFollow(username, initial);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/formados");
  const reduceMotion = useReducedMotion();
  if (!allowFollows && !isFollowing) return null;

  return (
    <>
      <motion.button
        type="button"
        aria-label={isFollowing ? `Deixar de seguir ${displayName}` : `Seguir ${displayName}`}
        aria-pressed={isFollowing}
        disabled={pending}
        whileTap={reduceMotion ? {} : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        onClick={() => {
          if (!user) {
            setRedirectTo(`${window.location.pathname}${window.location.search}`);
            setLoginPrompt(true);
            return;
          }
          void toggleFollow(displayName);
        }}
        className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold disabled:opacity-60 ${
          isFollowing
            ? "border-rose-gold/50 bg-rose-gold/15 text-rose-gold hover:bg-rose-gold/25"
            : "border-rose-gold/40 bg-gradient-to-r from-rosa-blush to-rose-gold text-white hover:brightness-110"
        } ${compact ? "px-3 py-2" : ""}`}
      >
        <motion.span
          key={isFollowing ? "following" : "not-following"}
          initial={reduceMotion ? false : { scale: 0.65, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          aria-hidden="true"
        >
          <Heart size={15} fill={isFollowing ? "currentColor" : "none"} />
        </motion.span>
        {pending ? "Salvando..." : isFollowing ? "Seguindo" : "Seguir"}
      </motion.button>
      {error && <span role="status" className="sr-only">{error}</span>}
      {loginPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="follow-login-title">
          <div className="w-full max-w-sm rounded-3xl border border-rose-gold/30 bg-branco p-6 shadow-card">
            <h2 id="follow-login-title" className="text-lg font-bold text-foreground">Entre para seguir</h2>
            <p className="mt-2 text-sm text-foreground/70">Faça login para acompanhar {displayName} e receber novidades.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setLoginPrompt(false)} className="rounded-full px-4 py-2 text-sm text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">Agora não</button>
              <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="rounded-full bg-rose-gold px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold">Fazer login</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

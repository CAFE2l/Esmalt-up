"use client";

import { m as motion, useReducedMotion } from "framer-motion";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { COURSE_LESSONS } from "@/lib/courseData";

interface EarnedBadge { badgeKey: string; awardedAt: string; }

interface Props {
  earnedBadges: EarnedBadge[];
  completedLessonIds: string[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  sparkle: <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" /></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><polygon points="9 6 9 18 18 12" /></svg>,
  world: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6"><circle cx={12} cy={12} r={10} /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6"><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4" /><path d="M6 9a6 6 0 0 0 12 0M12 15v4M8 19h8" /></svg>,
  bag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1={3} y1={6} x2={21} y2={6} /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
};

function badgeProgress(key: string, completedLessonIds: string[]): { current: number; total: number } | null {
  const total = COURSE_LESSONS.length;
  const current = completedLessonIds.length;
  if (key === "curso-concluido") return { current, total };
  if (key === "primeira-aula") return { current: Math.min(current, 1), total: 1 };
  const moduleMap: Record<string, string> = {
    "mundo-1-concluido": "mundo-1",
    "mundo-2-concluido": "mundo-2",
    "mundo-3-concluido": "mundo-3",
    "mundo-4-concluido": "mundo-4",
  };
  const modId = moduleMap[key];
  if (modId) {
    const modLessons = COURSE_LESSONS.filter((c) => c.module.id === modId);
    const done = modLessons.filter((c) => completedLessonIds.includes(c.lesson.id)).length;
    return { current: done, total: modLessons.length };
  }
  return null;
}

export default function BadgeGallery({ earnedBadges, completedLessonIds }: Props) {
  const reduceMotion = useReducedMotion();
  const earnedKeys = new Set(earnedBadges.map((b) => b.badgeKey));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {BADGE_DEFINITIONS.map((def, i) => {
        const earned = earnedKeys.has(def.key);
        const earnedAt = earnedBadges.find((b) => b.badgeKey === def.key)?.awardedAt;
        const prog = !earned ? badgeProgress(def.key, completedLessonIds) : null;

        return (
          <m.div
            key={def.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : i * 0.05, type: "spring", stiffness: 260, damping: 26 }}
            whileHover={!reduceMotion ? { y: -3, scale: 1.02 } : {}}
            className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors ${
              earned
                ? "border-rose-gold/40 bg-rosa-claro/30"
                : "border-cinza-suave/40 bg-branco/30 opacity-60"
            }`}
          >
            <span className={earned ? "text-rose-gold" : "text-foreground/30"}>
              {ICON_MAP[def.icon]}
            </span>
            <div>
              <p className={`text-xs font-semibold ${earned ? "text-foreground" : "text-foreground/50"}`}>
                {def.name}
              </p>
              <p className="mt-0.5 text-[11px] text-foreground/50">{def.description}</p>
            </div>
            {earned && earnedAt && (
              <span className="text-[10px] text-rose-gold/70">
                {new Date(earnedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
            {!earned && prog && (
              <div className="w-full">
                <div className="h-1 w-full overflow-hidden rounded-full bg-cinza-suave/40">
                  <m.div
                    className="h-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((prog.current / prog.total) * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-foreground/40">{prog.current}/{prog.total}</p>
              </div>
            )}
          </m.div>
        );
      })}
    </div>
  );
}

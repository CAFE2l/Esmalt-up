"use client";

import Link from "next/link";
import { Check, Lock, Play, Gift, Sparkles } from "lucide-react";
import type { CourseLesson, BonusChest } from "@/data/course";
import MascotBrush from "./MascotBrush";

export type NodeState = "concluida" | "atual" | "bloqueada";

interface Props {
  lesson: CourseLesson;
  state: NodeState;
  offsetClass?: string;
  isBonusChest?: boolean;
  chestData?: BonusChest;
  onOpenChest?: (chest: BonusChest) => void;
  id?: string;
}

export default function CoursePathNode({
  lesson,
  state,
  offsetClass = "",
  isBonusChest = false,
  chestData,
  onOpenChest,
  id,
}: Props) {
  const isCompleted = state === "concluida";
  const isCurrent = state === "atual";
  const isLocked = state === "bloqueada";
  const isComingSoon = lesson.status === "coming_soon";

  const ariaStateText = isCompleted
    ? "concluída"
    : isCurrent
    ? "atual"
    : isComingSoon
    ? "em breve"
    : "bloqueada";

  const ariaLabel = isBonusChest
    ? `Baú Bônus: ${chestData?.title || lesson.title}, ${ariaStateText}`
    : `Aula ${lesson.order}: ${lesson.title}, ${ariaStateText}`;

  // 3D Coin Button Styles
  let buttonStyle = "";
  if (isCompleted) {
    buttonStyle =
      "bg-gradient-to-b from-[#e39ba9] to-[#c77d8c] text-white border-b-[6px] border-[#9e5765] shadow-[0_6px_0_#8c4a57] hover:brightness-105 active:translate-y-1 active:border-b-[2px] active:shadow-[0_2px_0_#8c4a57]";
  } else if (isCurrent) {
    buttonStyle =
      "bg-gradient-to-b from-[#f29db0] to-[#e06b85] text-white border-b-[6px] border-[#a84459] shadow-[0_6px_0_#96364b] ring-4 ring-rosa-blush/40 animate-pulse hover:brightness-105 active:translate-y-1 active:border-b-[2px] active:shadow-[0_2px_0_#96364b]";
  } else {
    buttonStyle =
      "bg-[#2d2227] text-foreground/35 border-b-[6px] border-[#1c1519] shadow-[0_6px_0_#140f12] cursor-not-allowed";
  }

  // Chest special style
  if (isBonusChest) {
    if (isCompleted || isCurrent) {
      buttonStyle =
        "bg-gradient-to-b from-[#f7c873] to-[#e5a03d] text-white border-b-[6px] border-[#a8681e] shadow-[0_6px_0_#945813] hover:brightness-110 active:translate-y-1 active:border-b-[2px]";
    } else {
      buttonStyle =
        "bg-[#2d2227] text-foreground/35 border-b-[6px] border-[#1c1519] shadow-[0_6px_0_#140f12] cursor-not-allowed";
    }
  }

  // Node content icon
  const renderIcon = () => {
    if (isBonusChest) {
      return (
        <div className="relative">
          <Gift className="h-8 w-8 sm:h-9 sm:w-9" />
          {!isLocked && (
            <Sparkles className="absolute -top-1 -right-2 h-4 w-4 text-yellow-200 animate-spin" />
          )}
        </div>
      );
    }
    if (isCompleted) {
      return <Check className="h-8 w-8 sm:h-9 sm:w-9 stroke-[3]" />;
    }
    if (isCurrent) {
      return <Play className="h-8 w-8 sm:h-9 sm:w-9 fill-current ml-1" />;
    }
    return <Lock className="h-7 w-7 sm:h-8 sm:w-8" />;
  };

  const nodeButton = (
    <div
      className={`relative flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-full transition-all duration-200 select-none ${buttonStyle}`}
    >
      {renderIcon()}
    </div>
  );

  return (
    <div
      id={id}
      className={`relative my-4 flex flex-col items-center transition-transform ${offsetClass}`}
    >
      {/* Floating bubble "COMEÇAR" for current node */}
      {isCurrent && !isBonusChest && (
        <div className="absolute -top-11 z-10 animate-bounce">
          <div className="relative rounded-xl border border-rose-gold/60 bg-branco px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-gold shadow-card">
            COMEÇAR
            {/* Tooltip triangle */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-branco" />
          </div>
        </div>
      )}

      {/* Mascot Brush sitting beside the current node */}
      {isCurrent && (
        <div className="absolute -left-16 sm:-left-20 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
          <MascotBrush speechText="Vamos lá!" />
        </div>
      )}

      {/* Clickable Action */}
      {isBonusChest ? (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={isLocked}
          onClick={() => {
            if (!isLocked && chestData && onOpenChest) {
              onOpenChest(chestData);
            }
          }}
          className="group rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rosa-blush"
        >
          {nodeButton}
        </button>
      ) : isLocked || isComingSoon ? (
        <div
          role="button"
          tabIndex={0}
          aria-disabled="true"
          aria-label={ariaLabel}
          className="group rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cinza-suave"
        >
          {nodeButton}
          {isComingSoon && (
            <span className="mt-1 block text-center text-[10px] font-semibold tracking-wider text-foreground/50 uppercase">
              Em breve
            </span>
          )}
        </div>
      ) : (
        <Link
          href={`/curso/aula/${lesson.slug}`}
          aria-label={ariaLabel}
          className="group rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rosa-blush"
        >
          {nodeButton}
        </Link>
      )}

      {/* Subtle lesson title label underneath */}
      <span className="mt-2 max-w-[140px] text-center text-xs font-medium text-foreground/75 leading-tight line-clamp-2">
        {isBonusChest ? chestData?.title || lesson.title : lesson.title}
      </span>
    </div>
  );
}

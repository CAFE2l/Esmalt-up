"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ShowcaseTab, ShowcaseTabId } from "./data";
import { focusRing, glass } from "./chrome";

interface ShowcaseTabsProps {
  tabs: readonly ShowcaseTab[];
  activeId: ShowcaseTabId;
  counts: Record<ShowcaseTabId, number>;
  onChange: (id: ShowcaseTabId) => void;
}

export default function ShowcaseTabs({ tabs, activeId, counts, onChange }: ShowcaseTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Categorias"
      className={cn(glass, "inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1")}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`showcase-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls="showcase-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 rounded-full px-3 py-2 text-sm font-medium sm:px-4",
              focusRing,
              selected ? "text-[#1c1519]" : "text-white/75 hover:text-white",
            )}
          >
            {selected && (
              <m.span
                layoutId="showcase-tab-pill"
                className="absolute inset-0 rounded-full bg-[#f3b6c7] shadow-[0_0_24px_rgba(243,182,199,0.35)]"
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {tab.label}
              <span
                className={cn(
                  "tabular-nums text-xs",
                  selected ? "text-[#1c1519]/70" : "text-white/45",
                )}
              >
                {counts[tab.id]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

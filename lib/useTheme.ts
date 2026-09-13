"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "esmaltup-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    let stored: Theme = "dark";
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === "light") stored = "light";
    } catch {
      // localStorage indisponível — mantém o tema escuro padrão.
    }
    setThemeState(stored);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      if (next === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sem persistência, o toggle continua funcionando na sessão.
    }
  };

  return { theme, setTheme };
}
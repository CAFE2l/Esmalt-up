export type BadgeDef = {
  key: string;
  name: string;
  description: string;
  icon: "sparkle" | "play" | "world" | "trophy" | "bag";
};

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    key: "primeira-aula",
    name: "Primeira aula",
    description: "Você concluiu a primeira aula do curso.",
    icon: "play",
  },
  {
    key: "mundo-1-concluido",
    name: "Mundo 1 concluído",
    description: "Fundamentos de Manicure completo.",
    icon: "world",
  },
  {
    key: "mundo-2-concluido",
    name: "Mundo 2 concluído",
    description: "Preparação da Unha completo.",
    icon: "world",
  },
  {
    key: "mundo-3-concluido",
    name: "Mundo 3 concluído",
    description: "Base, Acabamento e Esmaltação completo.",
    icon: "world",
  },
  {
    key: "mundo-4-concluido",
    name: "Mundo 4 concluído",
    description: "Esmaltamento Avançado completo.",
    icon: "world",
  },
  {
    key: "curso-concluido",
    name: "Curso concluído",
    description: "Você terminou o Curso Preparatório.",
    icon: "trophy",
  },
  {
    key: "primeira-compra",
    name: "Primeira compra",
    description: "Sua primeira compra na Esmalt'up.",
    icon: "bag",
  },
];

export const BADGE_BY_KEY = Object.fromEntries(
  BADGE_DEFINITIONS.map((badge) => [badge.key, badge]),
) as Record<string, BadgeDef>;

export const MODULE_BADGE_KEY: Record<string, string> = {
  "mundo-1": "mundo-1-concluido",
  "mundo-2": "mundo-2-concluido",
  "mundo-3": "mundo-3-concluido",
  "mundo-4": "mundo-4-concluido",
};

export function deriveLevel(completedCount: number, totalLessons: number): string {
  if (totalLessons <= 0 || completedCount <= 0) return "Iniciante";
  const pct = completedCount / totalLessons;
  if (pct >= 0.75) return "Avançada";
  if (pct >= 0.34) return "Intermediária";
  return "Iniciante";
}

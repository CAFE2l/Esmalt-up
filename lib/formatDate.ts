/** Client-safe date formatting (pt-BR). */
export function formatDatePtBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

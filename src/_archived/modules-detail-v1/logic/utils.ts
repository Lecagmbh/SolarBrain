export function formatDate(date?: string | null): string {
  if (!date) return "–";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function safe(v: any): string {
  if (v === undefined || v === null) return "–";
  if (typeof v === "string" && v.trim() === "") return "–";
  return String(v);
}

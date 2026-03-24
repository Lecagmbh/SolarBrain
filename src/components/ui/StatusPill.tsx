// src/components/ui/StatusPill.tsx
interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const normalized = status.toLowerCase();

  let color =
    "bg-slate-800/80 text-slate-200 border border-slate-600/80";

  if (normalized === "abgeschlossen") {
    color = "bg-emerald-900/60 text-emerald-200 border border-emerald-700";
  } else if (normalized === "fehler") {
    color = "bg-rose-900/60 text-rose-200 border border-rose-700";
  } else if (normalized === "offen") {
    color = "bg-amber-900/60 text-amber-100 border border-amber-600";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] capitalize ${color}`}
    >
      {status}
    </span>
  );
}

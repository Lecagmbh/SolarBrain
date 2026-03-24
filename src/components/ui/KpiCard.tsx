// src/components/ui/KpiCard.tsx
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-baunity-border bg-baunity-bg-soft shadow-baunity-kpi px-3 py-3">
      <div className="text-[11px] text-slate-400 uppercase tracking-[0.08em]">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1 mb-0.5">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

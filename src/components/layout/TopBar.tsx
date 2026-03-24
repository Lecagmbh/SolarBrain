// src/components/layout/TopBar.tsx
export function TopBar() {
  return (
    <header className="border-b border-slate-800/80 px-6 py-3 flex items-center justify-between bg-slate-950/80 backdrop-blur">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        Baunity Admin
      </div>
      <div className="flex items-center gap-2 text-xs bg-emerald-950/40 border border-emerald-700/60 rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Admin-API aktiv – Live-Daten</span>
      </div>
    </header>
  );
}

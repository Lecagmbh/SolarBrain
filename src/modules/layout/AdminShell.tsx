import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="h-9 w-9 rounded-2xl bg-emerald-500 text-slate-900 font-semibold flex items-center justify-center text-sm">
            GN
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Baunity</div>
            <div className="text-[11px] text-slate-400">
              Admin · Steuerung &amp; Kontrolle
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2 text-[11px] tracking-[0.16em] uppercase text-slate-500">
          Admin-Navigation
        </div>

        <nav className="px-2 space-y-1">
          <NavItem to="/admin-v3/dashboard" icon="📊" label="Dashboard" />
          <NavItem to="/admin-v3/anlagen" icon="🔌" label="Anlagen" />
          <NavItem to="/admin-v3/benutzer" icon="👥" label="Benutzerverwaltung" />
          <NavItem to="/admin-v3/abrechnung" icon="💶" label="Abrechnung" />
        </nav>

        <div className="mt-auto px-5 pb-5 pt-6 text-[11px] text-slate-500">
          Angemeldet als
          <br />
          <span className="text-slate-100">Administrator</span>
          <br />
          <span className="text-slate-400">
            Voller Zugriff auf alle Anlagen &amp; Benutzer.
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

type NavItemProps = {
  to: string;
  icon: string;
  label: string;
};

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition",
          isActive
            ? "bg-slate-800 text-slate-50"
            : "text-slate-300 hover:bg-slate-900 hover:text-white",
        ].join(" ")
      }
    >
      <span>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

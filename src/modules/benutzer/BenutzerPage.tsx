import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  email: string;
  name?: string;
  role?: string;
  kunde_name?: string;
  kunde_id?: string | number | null;
  active?: boolean;
};

export function BenutzerPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data: UserRow[] = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUser(id: number) {
    try {
      await fetch(`/api/admin/users/${id}/toggle`, { method: "POST" });
      await loadUsers();
    } catch (e) {
      console.error(e);
      alert("Status konnte nicht geändert werden.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
            Verwaltung
          </div>
          <h1 className="text-2xl font-semibold mt-1">Benutzerverwaltung</h1>
        </div>
      </header>

      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col gap-1 mb-2">
          <div className="text-sm font-medium">Benutzer &amp; Rollen</div>
          <div className="text-xs text-slate-400">
            Zuordnung zu Kunden, Rollentypen (Admin, Servicepartner, Mitarbeiter,
            Kunde).
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            Lade Benutzer ...
          </div>
        ) : users.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            Noch keine Benutzer angelegt.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="text-left py-2 pr-4">ID</th>
                  <th className="text-left py-2 pr-4">E-Mail</th>
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Rolle</th>
                  <th className="text-left py-2 pr-4">Kunde</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-900 last:border-0"
                  >
                    <td className="py-2 pr-4">{u.id}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.name || "-"}</td>
                    <td className="py-2 pr-4">{u.role || "-"}</td>
                    <td className="py-2 pr-4">
                      {u.kunde_name || u.kunde_id || "-"}
                    </td>
                    <td className="py-2 pr-4">
                      {u.active === false ? "Deaktiviert" : "Aktiv"}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => toggleUser(u.id)}
                        className="text-xs rounded-full border border-slate-700 px-2 py-0.5 hover:bg-slate-800"
                      >
                        {u.active === false ? "Aktivieren" : "Deaktivieren"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

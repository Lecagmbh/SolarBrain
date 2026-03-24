import { useEffect, useState } from "react";

type Anlage = {
  id: number;
  bezeichnung?: string;
  betreiber_name?: string;
  netzbetreiber_name?: string;
  status?: string;
  status_code?: string;
  angelegt_am?: string;
};

const STATUS_LABELS: Record<string, string> = {
  ERFASSUNG_LECA: "Erfassung Baunity",
  IN_BEARBEITUNG: "In Bearbeitung",
  ABGESCHLOSSEN: "Abgeschlossen",
};

export function AnlagenPage() {
  const [anlagen, setAnlagen] = useState<Anlage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAnlagen();
  }, []);

  async function loadAnlagen() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/anlagen");
      const data: Anlage[] = await res.json();
      setAnlagen(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = anlagen.filter((a) => {
    if (statusFilter !== "all") {
      if ((a.status_code || a.status) !== statusFilter) return false;
    }
    if (search.trim()) {
      const hay = [
        a.bezeichnung,
        a.betreiber_name,
        a.netzbetreiber_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
            Anlagenverwaltung
          </div>
          <h1 className="text-2xl font-semibold mt-1">Alle Anlagen</h1>
        </div>
        <button
          onClick={loadAnlagen}
          className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
        >
          ⟳ Aktualisieren
        </button>
      </header>

      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Anlagenliste</div>
            <div className="text-xs text-slate-400">
              Filter &amp; Suche für große Bestände (1.000+ Anlagen).
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Alle Stati</option>
              <option value="ERFASSUNG_LECA">Erfassung Baunity</option>
              <option value="IN_BEARBEITUNG">In Bearbeitung</option>
              <option value="ABGESCHLOSSEN">Abgeschlossen</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Projekt, Betreiber oder Netzbetreiber"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs min-w-[240px] outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            Lade Anlagen ...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            Keine Anlagen gefunden.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="text-left py-2 pr-4">ID</th>
                  <th className="text-left py-2 pr-4">Projekt / Betreiber</th>
                  <th className="text-left py-2 pr-4">Netzbetreiber</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Angelegt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-900 last:border-0"
                  >
                    <td className="py-2 pr-4">{a.id}</td>
                    <td className="py-2 pr-4">
                      {a.bezeichnung || a.betreiber_name || "Unbenannt"}
                    </td>
                    <td className="py-2 pr-4">
                      {a.netzbetreiber_name || "-"}
                    </td>
                    <td className="py-2 pr-4">
                      {STATUS_LABELS[a.status_code || ""] || a.status || "-"}
                    </td>
                    <td className="py-2 pr-4">{a.angelegt_am || "-"}</td>
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

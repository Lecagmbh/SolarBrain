import { useState } from "react";
import "./dokumente-matrix.css";

interface DokStatus {
  status: "yes" | "no" | "partial" | "na";
}

interface AnlageDoc {
  id: number;
  kunde: string;
  schaltplan: DokStatus;
  lageplan: DokStatus;
  datenblatt: DokStatus;
  vollmacht: DokStatus;
  netzantrag: DokStatus;
  zaehlerantrag: DokStatus;
}

const mockData: AnlageDoc[] = [
  { id: 1, kunde: "Müller GmbH", schaltplan: { status: "yes" }, lageplan: { status: "yes" }, datenblatt: { status: "partial" }, vollmacht: { status: "yes" }, netzantrag: { status: "no" }, zaehlerantrag: { status: "na" } },
  { id: 2, kunde: "Schmidt Solar", schaltplan: { status: "yes" }, lageplan: { status: "no" }, datenblatt: { status: "yes" }, vollmacht: { status: "yes" }, netzantrag: { status: "yes" }, zaehlerantrag: { status: "na" } },
  { id: 3, kunde: "Weber PV", schaltplan: { status: "no" }, lageplan: { status: "no" }, datenblatt: { status: "yes" }, vollmacht: { status: "yes" }, netzantrag: { status: "yes" }, zaehlerantrag: { status: "na" } },
  { id: 4, kunde: "Fischer Energie", schaltplan: { status: "yes" }, lageplan: { status: "yes" }, datenblatt: { status: "yes" }, vollmacht: { status: "yes" }, netzantrag: { status: "yes" }, zaehlerantrag: { status: "yes" } },
  { id: 5, kunde: "Meier Solar", schaltplan: { status: "yes" }, lageplan: { status: "partial" }, datenblatt: { status: "no" }, vollmacht: { status: "yes" }, netzantrag: { status: "no" }, zaehlerantrag: { status: "na" } },
];

const StatusIcon = ({ status }: { status: DokStatus["status"] }) => {
  if (status === "yes") return <span className="doc-status doc-yes">✓</span>;
  if (status === "no") return <span className="doc-status doc-no">✗</span>;
  if (status === "partial") return <span className="doc-status doc-partial">⚠</span>;
  return <span className="doc-status doc-na">—</span>;
};

export default function DokumenteMatrix() {
  const [filter, setFilter] = useState<"all" | "missing">("all");

  const filtered = filter === "missing"
    ? mockData.filter(a => 
        a.schaltplan.status !== "yes" || 
        a.lageplan.status !== "yes" || 
        a.datenblatt.status !== "yes" ||
        a.netzantrag.status === "no"
      )
    : mockData;

  const missingCount = mockData.filter(a => 
    a.schaltplan.status === "no" || a.lageplan.status === "no" || a.datenblatt.status === "no" || a.netzantrag.status === "no"
  ).length;

  return (
    <div className="dm-page">
      <header className="dm-header">
        <div>
          <h1 className="dm-title">Dokumente Matrix</h1>
          <p className="dm-subtitle">Übersicht aller Dokumente pro Anlage</p>
        </div>
        <button className="btn btn-secondary">Fehlende anfordern ({missingCount})</button>
      </header>

      <div className="dm-toolbar">
        <div className="dm-filters">
          <button className={`dm-filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Alle</button>
          <button className={`dm-filter ${filter === "missing" ? "active" : ""}`} onClick={() => setFilter("missing")}>
            Nur Fehlende
            {missingCount > 0 && <span className="dm-filter-badge">{missingCount}</span>}
          </button>
        </div>
        <div className="dm-legend">
          <span><span className="doc-status doc-yes">✓</span> Vorhanden</span>
          <span><span className="doc-status doc-partial">⚠</span> Unvollständig</span>
          <span><span className="doc-status doc-no">✗</span> Fehlt</span>
          <span><span className="doc-status doc-na">—</span> Nicht benötigt</span>
        </div>
      </div>

      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Schaltplan</th>
              <th>Lageplan</th>
              <th>Datenblatt</th>
              <th>Vollmacht</th>
              <th>Netzantrag</th>
              <th>Zählerantrag</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(anlage => (
              <tr key={anlage.id}>
                <td className="cell-kunde">{anlage.kunde}</td>
                <td><StatusIcon status={anlage.schaltplan.status} /></td>
                <td><StatusIcon status={anlage.lageplan.status} /></td>
                <td><StatusIcon status={anlage.datenblatt.status} /></td>
                <td><StatusIcon status={anlage.vollmacht.status} /></td>
                <td><StatusIcon status={anlage.netzantrag.status} /></td>
                <td><StatusIcon status={anlage.zaehlerantrag.status} /></td>
                <td>
                  {(anlage.schaltplan.status === "no" || anlage.lageplan.status === "no" || anlage.datenblatt.status === "no") && (
                    <button className="btn btn-ghost btn-sm">Anfordern</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

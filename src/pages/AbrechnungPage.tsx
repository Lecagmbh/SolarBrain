import type { ReactNode } from "react";

export default function AbrechnungPage(): ReactNode {
  return (
    <>
      <header className="gridnetz-topbar">
        <div>
          <h1 className="gridnetz-topbar-title">Abrechnung</h1>
          <p className="gridnetz-topbar-subtitle">
            Übersicht über Leistungsnachweise, Rechnungen und Zahlungsstatus.
          </p>
        </div>
        <div className="gridnetz-topbar-right">
          <span className="gridnetz-topbar-chip">
            Automatisierte Abrechnung folgt im nächsten Schritt.
          </span>
        </div>
      </header>

      <section className="gridnetz-panel">
        <div className="gridnetz-panel-header">
          <h2 className="gridnetz-panel-title">Rechnungsübersicht</h2>
          <p className="gridnetz-panel-subtitle">
            Deine abrechnungsrelevanten Netzanmeldungen erscheinen hier
            gruppiert nach Zeitraum und Status.
          </p>
        </div>

        <div className="gridnetz-table-shell">
          <div className="gridnetz-table-header">
            <span>Bisher wurden noch keine Projekte abgerechnet.</span>
            <span className="gridnetz-tag-pill">Startphase</span>
          </div>
          <p>
            Sobald die ersten Netzanmeldungen abgeschlossen sind, kannst du sie
            hier bündeln, exportieren und für deine interne Buchhaltung
            verwenden.
          </p>
        </div>
      </section>
    </>
  );
}

export function AbrechnungPage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
          Finanzen
        </div>
        <h1 className="text-2xl font-semibold mt-1">
          Abrechnung &amp; Rechnungen
        </h1>
      </header>

      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <p className="text-xs text-slate-400 mb-3">
          Hier kannst du offene und bezahlte Rechnungen über alle Anlagen hinweg
          einsehen. Detailbearbeitung erfolgt im jeweiligen Anlagen-Detail.
        </p>
        <div className="text-sm text-slate-400 py-6 text-center">
          Globale Rechnungsübersicht bauen wir als nächsten Schritt –
          anlagenbezogene Rechnungen laufen bereits über das Admin-Detail.
        </div>
      </section>
    </div>
  );
}

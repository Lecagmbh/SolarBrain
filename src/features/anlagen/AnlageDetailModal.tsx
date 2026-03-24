// src/features/anlagen/AnlageDetailModal.tsx
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};
import { Tabs } from "../../components/ui/Tabs";
import {
  fetchAnlageDetail,
  fetchAnlageDokumente,
} from "../../api/anlagen";
import {
  fetchRechnungenForAnlage,
  createRechnungForAnlage,
  updateAnlageStatus,
  downloadRechnungPdf,
} from "../../api/admin";
import type {
  AnlageDetail,
  Dokument,
  Rechnung,
  StatusCode,
} from "../../api/types";
import { StatusPill } from "../../components/ui/StatusPill";

interface Props {
  anlageId: number | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void; // z.B. Dashboard/Anlagen-Liste refreshen
}

function formatTechnik(list?: (string | null)[][]): string {
  if (!list || !list.length) return "–";
  return list
    .map((row) => row.filter(Boolean).join(" · "))
    .filter(Boolean)
    .join("\n");
}

export function AnlageDetailModal({
  anlageId,
  open,
  onClose,
  onChanged,
}: Props) {
  const [tab, setTab] = useState<"overview" | "docs" | "billing">(
    "overview"
  );
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AnlageDetail | null>(null);
  const [docs, setDocs] = useState<Dokument[]>([]);
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [statusCode, setStatusCode] = useState<StatusCode>("ERFASSUNG_LECA");
  const [betragInput, setBetragInput] = useState("");
  const [beschreibungInput, setBeschreibungInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !anlageId) return;

    setTab("overview");
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const d = await fetchAnlageDetail(anlageId);
        setDetail(d);
        if (d.status_code) {
          setStatusCode(d.status_code);
        } else {
          setStatusCode("ERFASSUNG_LECA");
        }

        const [docsRes, rechnungenRes] = await Promise.all([
          fetchAnlageDokumente(anlageId),
          fetchRechnungenForAnlage(anlageId).catch(() => []),
        ]);
        setDocs(docsRes);
        setRechnungen(rechnungenRes);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, anlageId]);

  const handleClose = () => {
    setDetail(null);
    setDocs([]);
    setRechnungen([]);
    setError(null);
    onClose();
  };

  const handleStatusSave = async () => {
    if (!anlageId) return;
    const kommentar =
      window.prompt(
        "Kommentar für den Statuswechsel (optional):",
        ""
      ) || null;

    try {
await updateAnlageStatus(anlageId, statusCode, kommentar ?? "");
      if (onChanged) onChanged();
      alert("Status gespeichert.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Fehler beim Speichern des Status");
    }
  };

const handleCreateRechnung = async () => {
  if (!anlageId) return;
  const betrag = parseFloat(betragInput.replace(",", "."));
  if (!betrag || betrag <= 0) {
    alert("Bitte einen gültigen Betrag eingeben.");
    return;
  }
  const beschreibung = beschreibungInput.trim() || "Leistung";

  // Fälligkeit z.B. heute + 14 Tage
  const faelligDate = new Date();
  faelligDate.setDate(faelligDate.getDate() + 14);
  const faelligAm = faelligDate.toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const r = await createRechnungForAnlage(anlageId, {
      betragBrutto: betrag,
      faelligAm,
      typ: "Leistung",
      notiz: beschreibung,
    });

    setRechnungen((prev) => [r, ...prev]);
    setBetragInput("");
    setBeschreibungInput("");
    if (onChanged) onChanged();
    alert("Rechnung angelegt und PDF erzeugt.");
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : "Fehler beim Anlegen der Rechnung");
  }
};

  return (
    <Modal open={open} onClose={handleClose}>
      {loading && (
        <div className="text-sm text-slate-400 mb-2">
          Lade Anlage ...
        </div>
      )}
      {error && (
        <div className="text-sm text-rose-300 mb-2">
          {safeString(error)}
        </div>
      )}
      {detail && (
        <>
          <div className="flex justify-between items-start mb-4 gap-4">
            <div>
              <div className="text-lg font-semibold">
                {detail.bezeichnung ||
                  detail.projekt_betreiber ||
                  `Anlage ${detail.id}`}
              </div>
              <div className="text-xs text-slate-400">
                ID {detail.id} · angelegt am{" "}
                {detail.angelegt_am || "-"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {detail.status && (
                <StatusPill status={detail.status} />
              )}
              <select
                className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1"
                value={statusCode}
                onChange={(e) =>
                  setStatusCode(e.target.value as StatusCode)
                }
              >
                <option value="ERFASSUNG_LECA">
                  Erfassung Baunity
                </option>
                <option value="IN_BEARBEITUNG">
                  In Bearbeitung
                </option>
                <option value="ABGESCHLOSSEN">
                  Abgeschlossen
                </option>
              </select>
              <button
                onClick={handleStatusSave}
                className="bg-sky-600 hover:bg-sky-500 text-xs px-3 py-1.5 rounded-lg"
              >
                Status speichern
              </button>
            </div>
          </div>

          <Tabs
            tabs={[
              { id: "overview", label: "Übersicht" },
              { id: "docs", label: "Dokumente" },
              { id: "billing", label: "Abrechnung" },
            ]}
            activeId={tab}
            onChange={(id) =>
              setTab(id as typeof tab)
            }
          />

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Basisdaten
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Projekt / Betreiber
                  </div>
                  <div className="text-sm mb-2">
                    {detail.projekt_betreiber ||
                      detail.bezeichnung ||
                      "–"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Adresse
                  </div>
                  <div className="text-sm mb-2">
                    {detail.adresse || "–"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Zählpunktnummer
                  </div>
                  <div className="text-sm mb-2">
                    {detail.zaehlpunktnummer || "–"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Leistung (kWp)
                  </div>
                  <div className="text-sm">
                    {detail.leistung_kwp ?? "–"}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Netz &amp; Anmeldung
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Interne Projektnummer
                  </div>
                  <div className="text-sm mb-2">
                    {detail.interne_projektnummer || "–"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Netzbetreiber
                  </div>
                  <div className="text-sm mb-2">
                    {detail.netzbetreiber_name || "–"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Anlagentyp / Messkonzept
                  </div>
                  <div className="text-sm mb-2">
                    {detail.messkonzept || "–"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Angelegt am
                  </div>
                  <div className="text-sm">
                    {detail.angelegt_am || "–"}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800" />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Technik
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Module
                  </div>
                  <pre className="text-xs mb-2 whitespace-pre-line text-slate-100">
                    {formatTechnik(detail.technik?.module)}
                  </pre>

                  <div className="text-[11px] text-slate-400">
                    Wechselrichter
                  </div>
                  <pre className="text-xs mb-2 whitespace-pre-line text-slate-100">
                    {formatTechnik(
                      detail.technik?.wechselrichter
                    )}
                  </pre>

                  <div className="text-[11px] text-slate-400">
                    Speicher
                  </div>
                  <pre className="text-xs mb-2 whitespace-pre-line text-slate-100">
                    {formatTechnik(detail.technik?.speicher)}
                  </pre>

                  <div className="text-[11px] text-slate-400">
                    Wallbox / Ladepunkte
                  </div>
                  <pre className="text-xs whitespace-pre-line text-slate-100">
                    {formatTechnik(
                      detail.technik?.wallboxen
                    )}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Steuerbare Verbraucher
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Vorhanden?
                  </div>
                  <div className="text-sm mb-2">
                    {detail.steuerbare_verbraucher
                      ?.vorhanden === "ja"
                      ? "Ja, Anlagen vorhanden"
                      : "Nein / keine Angabe"}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Geräte
                  </div>
                  <pre className="text-xs whitespace-pre-line text-slate-100">
                    {formatTechnik(
                      detail.steuerbare_verbraucher?.geraete
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {tab === "docs" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Upload und Verwaltung aller zur Anlage gehörenden
                Dokumente erfolgt aktuell über das bestehende
                Portal-Backend.
              </div>

              <div className="overflow-auto border border-slate-800 rounded-xl">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-900/80">
                    <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
                      <th className="px-3 py-2">Kategorie</th>
                      <th className="px-3 py-2">Dateiname</th>
                      <th className="px-3 py-2">Typ</th>
                      <th className="px-3 py-2">Größe</th>
                      <th className="px-3 py-2">Erstellt am</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-slate-500"
                        >
                          Noch keine Dokumente hinterlegt.
                        </td>
                      </tr>
                    ) : (
                      docs.map((d) => (
                        <tr
                          key={d.id}
                          className="border-t border-slate-800/80"
                        >
                          <td className="px-3 py-1.5">
                            {d.kategorie || "-"}
                          </td>
                          <td className="px-3 py-1.5">
                            {d.dateiname || "-"}
                          </td>
                          <td className="px-3 py-1.5">
                            {d.dateityp || "-"}
                          </td>
                          <td className="px-3 py-1.5">
                            {formatBytes(d.dateigroesse)}
                          </td>
                          <td className="px-3 py-1.5">
                            {d.erstellt_am || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Erstelle Rechnungen für diese Anlage. Die Daten
                stammen aus den erfassten Leistungen.
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <input
                  value={betragInput}
                  onChange={(e) =>
                    setBetragInput(e.target.value)
                  }
                  placeholder="Betrag €"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm w-32"
                />
                <input
                  value={beschreibungInput}
                  onChange={(e) =>
                    setBeschreibungInput(e.target.value)
                  }
                  placeholder="Leistungsbeschreibung"
                  className="flex-1 min-w-[220px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                />
                <button
                  onClick={handleCreateRechnung}
                  className="bg-sky-600 hover:bg-sky-500 text-xs px-3 py-1.5 rounded-lg"
                >
                  Rechnung anlegen
                </button>
              </div>

              <div className="overflow-auto border border-slate-800 rounded-xl">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-900/80">
                    <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
                      <th className="px-3 py-2">Rechnungs-Nr.</th>
                      <th className="px-3 py-2">Betrag</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Fällig am</th>
                      <th className="px-3 py-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechnungen.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-slate-500"
                        >
                          Noch keine Rechnungen.
                        </td>
                      </tr>
                    ) : (
                      rechnungen.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-slate-800/80"
                        >
                          <td className="px-3 py-1.5">
                            {r.rechnungsnummer || r.id}
                          </td>
                          <td className="px-3 py-1.5">
                            {r.betrag_gesamt != null
                              ? `${r.betrag_gesamt.toFixed(2)} €`
                              : "–"}
                          </td>
                          <td className="px-3 py-1.5">
                            {r.status || "-"}
                          </td>
                          <td className="px-3 py-1.5">
                            {r.faellig_am || "-"}
                          </td>
                          <td className="px-3 py-1.5">
<button
  className="text-xs underline text-sky-400 hover:text-sky-300"
  onClick={() => {
    const url = downloadRechnungPdf(detail.id, r.id);
    if (url) window.open(url, "_blank");
  }}
>
  PDF
</button>

                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function formatBytes(bytes?: number | null): string {
  if (bytes == null) return "–";
  const b = Number(bytes);
  if (Number.isNaN(b)) return "–";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

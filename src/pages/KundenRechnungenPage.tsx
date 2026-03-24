// src/pages/KundenRechnungenPage.tsx
// Kunden-Ansicht: Nur eigene Rechnungen lesen, PDF downloaden, Zahlungslink öffnen

import { useEffect, useState, useMemo } from "react";
import { getAccessToken } from "../modules/auth/tokenStorage";
import { FileText, Download, ExternalLink, Loader2, Search } from "lucide-react";
import "./kunden-rechnungen.css";

interface Rechnung {
  id: number;
  rechnungsnummer: string;
  beschreibung?: string;
  betrag_netto: number;
  betrag_brutto: number;
  status: string;
  status_label: string;
  rechnungs_datum: string;
  faellig_am: string;
  bezahlt_am?: string | null;
  zahlungsreferenz?: string | null;
  pdf_path?: string | null;
}

function fmt(dt: string | null | undefined) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n || 0);
}

function statusClass(s: string): string {
  switch ((s || "").toUpperCase()) {
    case "OFFEN":
    case "VERSENDET":
      return "kr-status--offen";
    case "BEZAHLT":
      return "kr-status--bezahlt";
    case "UEBERFAELLIG":
      return "kr-status--ueberfaellig";
    case "MAHNUNG":
      return "kr-status--mahnung";
    default:
      return "kr-status--default";
  }
}

function statusLabel(s: string): string {
  switch ((s || "").toUpperCase()) {
    case "OFFEN": return "Offen";
    case "VERSENDET": return "Offen";
    case "BEZAHLT": return "Bezahlt";
    case "UEBERFAELLIG": return "Überfällig";
    case "MAHNUNG": return "Mahnung";
    case "STORNIERT": return "Storniert";
    default: return s;
  }
}

export default function KundenRechnungenPage() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "offen" | "bezahlt">("all");

  useEffect(() => {
    const token = getAccessToken();
    fetch("/api/rechnungen?limit=500", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Fehler beim Laden");
        return r.json();
      })
      .then((data) => {
        setRechnungen(data.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...rechnungen];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.rechnungsnummer?.toLowerCase().includes(q) ||
          r.beschreibung?.toLowerCase().includes(q)
      );
    }
    if (filter === "offen") {
      result = result.filter((r) => ["OFFEN", "VERSENDET", "UEBERFAELLIG", "MAHNUNG"].includes(r.status));
    } else if (filter === "bezahlt") {
      result = result.filter((r) => r.status === "BEZAHLT");
    }
    return result;
  }, [rechnungen, search, filter]);

  const stats = useMemo(() => {
    const offen = rechnungen.filter((r) => ["OFFEN", "VERSENDET", "UEBERFAELLIG", "MAHNUNG"].includes(r.status));
    const bezahlt = rechnungen.filter((r) => r.status === "BEZAHLT");
    return {
      total: rechnungen.length,
      offenCount: offen.length,
      offenSum: offen.reduce((s, r) => s + r.betrag_brutto, 0),
      bezahltCount: bezahlt.length,
      bezahltSum: bezahlt.reduce((s, r) => s + r.betrag_brutto, 0),
    };
  }, [rechnungen]);

  function handlePdfDownload(id: number, nr: string) {
    const token = getAccessToken();
    const url = token
      ? `/api/rechnungen/${id}/pdf?token=${encodeURIComponent(token)}`
      : `/api/rechnungen/${id}/pdf`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nr}.pdf`;
    a.click();
  }

  function handlePdfView(id: number) {
    const token = getAccessToken();
    const url = token
      ? `/api/rechnungen/${id}/pdf?token=${encodeURIComponent(token)}`
      : `/api/rechnungen/${id}/pdf`;
    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div className="kr-loading">
        <Loader2 size={28} className="kr-spin" />
        <span>Rechnungen werden geladen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kr-error">
        <span>Fehler: {error}</span>
      </div>
    );
  }

  return (
    <div className="kr-page">
      {/* Header */}
      <div className="kr-header">
        <div className="kr-header__left">
          <FileText size={22} />
          <div>
            <h1 className="kr-header__title">Meine Rechnungen</h1>
            <p className="kr-header__sub">Übersicht Ihrer Rechnungen und Zahlungsstatus</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="kr-stats">
        <div className="kr-stat">
          <span className="kr-stat__label">Gesamt</span>
          <span className="kr-stat__value">{stats.total}</span>
        </div>
        <div className="kr-stat kr-stat--warn">
          <span className="kr-stat__label">Offen</span>
          <span className="kr-stat__value">{stats.offenCount} &middot; {money(stats.offenSum)}</span>
        </div>
        <div className="kr-stat kr-stat--ok">
          <span className="kr-stat__label">Bezahlt</span>
          <span className="kr-stat__value">{stats.bezahltCount} &middot; {money(stats.bezahltSum)}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="kr-filters">
        <div className="kr-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Rechnung suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="kr-filter-tabs">
          <button className={`kr-tab ${filter === "all" ? "kr-tab--active" : ""}`} onClick={() => setFilter("all")}>
            Alle ({stats.total})
          </button>
          <button className={`kr-tab ${filter === "offen" ? "kr-tab--active" : ""}`} onClick={() => setFilter("offen")}>
            Offen ({stats.offenCount})
          </button>
          <button className={`kr-tab ${filter === "bezahlt" ? "kr-tab--active" : ""}`} onClick={() => setFilter("bezahlt")}>
            Bezahlt ({stats.bezahltCount})
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="kr-empty">
          <FileText size={40} />
          <p>Keine Rechnungen gefunden</p>
        </div>
      ) : (
        <div className="kr-list">
          {filtered.map((r) => (
            <div key={r.id} className="kr-card">
              <div className="kr-card__top">
                <span className="kr-card__nr">{r.rechnungsnummer}</span>
                <span className={`kr-status ${statusClass(r.status)}`}>
                  {statusLabel(r.status)}
                </span>
              </div>

              {r.zahlungsreferenz && (
                <div className="kr-card__ref">{r.zahlungsreferenz}</div>
              )}

              <div className="kr-card__details">
                <div className="kr-card__detail">
                  <span className="kr-card__detail-label">Datum</span>
                  <span>{fmt(r.rechnungs_datum)}</span>
                </div>
                <div className="kr-card__detail">
                  <span className="kr-card__detail-label">Fällig</span>
                  <span>{fmt(r.faellig_am)}</span>
                </div>
                {r.bezahlt_am && (
                  <div className="kr-card__detail">
                    <span className="kr-card__detail-label">Bezahlt</span>
                    <span>{fmt(r.bezahlt_am)}</span>
                  </div>
                )}
                <div className="kr-card__detail kr-card__detail--amount">
                  <span className="kr-card__detail-label">Betrag</span>
                  <span className="kr-card__amount">{money(r.betrag_brutto)}</span>
                </div>
              </div>

              <div className="kr-card__actions">
                {r.pdf_path && (
                  <>
                    <button className="kr-btn" onClick={() => handlePdfView(r.id)} title="PDF anzeigen">
                      <ExternalLink size={14} />
                      <span>Ansehen</span>
                    </button>
                    <button className="kr-btn" onClick={() => handlePdfDownload(r.id, r.rechnungsnummer)} title="PDF herunterladen">
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

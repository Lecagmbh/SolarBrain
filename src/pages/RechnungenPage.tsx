// src/pages/RechnungenPage.tsx
// Saubere Rechnungsübersicht mit Tabelle, Filter, Stats und ZIP-Download

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { getAccessToken } from "../modules/auth/tokenStorage";
import type {
  ListResp,
  RechnungListRow,
  BillingOverview,
} from "../modules/rechnungen/types";
import {
  fetchInvoices,
  fetchBillingOverview,
  createInvoiceDraft,
  markPaid,
  sendWhatsApp,
  setInvoiceStatus,
} from "../modules/rechnungen/api";
import InvoiceCreateModal from "../modules/rechnungen/InvoiceCreateModal";
import SammelrechnungModal from "../modules/rechnungen/SammelrechnungModal";
import {
  Search,
  Eye,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Loader2,
  RefreshCw,
  CheckCircle,
  MessageCircle,
  X,
  Send,
  Mail,
  Zap,
} from "lucide-react";
import "./finanzen.css";

// ── Types ──

type StatusFilter =
  | "all"
  | "ENTWURF"
  | "OFFEN"
  | "BEZAHLT"
  | "MAHNUNG"
  | "UEBERFAELLIG"
  | "STORNIERT";
type SortKey =
  | "rechnungsnummer"
  | "kunde_name"
  | "rechnungs_datum"
  | "betrag_brutto"
  | "status";
type SortDir = "asc" | "desc";

// ── Helpers ──

function fmt(dt: string | null | undefined) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dt);
  }
}

function money(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(n) ? n : 0);
}

function getPdfUrl(id: number): string {
  const token = getAccessToken();
  // Token als Query-Param falls vorhanden, sonst reicht Cookie-Auth (same-origin)
  return token
    ? `/api/rechnungen/${id}/pdf?token=${encodeURIComponent(token)}`
    : `/api/rechnungen/${id}/pdf`;
}

function getStatusBadgeClass(status: string): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "ENTWURF":
      return "fin-badge--entwurf";
    case "OFFEN":
      return "fin-badge--offen";
    case "VERSENDET":
      return "fin-badge--versendet";
    case "BEZAHLT":
      return "fin-badge--bezahlt";
    case "UEBERFAELLIG":
    case "ÜBERFÄLLIG":
      return "fin-badge--ueberfaellig";
    case "MAHNUNG":
      return "fin-badge--mahnung";
    case "ZUSAMMENGEFASST":
      return "fin-badge--zusammengefasst";
    case "STORNIERT":
      return "fin-badge--storniert";
    default:
      return "fin-badge--entwurf";
  }
}

function getStatusLabel(status: string): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "ENTWURF":
      return "Entwurf";
    case "OFFEN":
      return "Offen";
    case "VERSENDET":
      return "Versendet";
    case "BEZAHLT":
      return "Bezahlt";
    case "UEBERFAELLIG":
    case "ÜBERFÄLLIG":
      return "Überfällig";
    case "MAHNUNG":
      return "Mahnung";
    case "ZUSAMMENGEFASST":
      return "Zusammengefasst";
    case "STORNIERT":
      return "Storniert";
    default:
      return status;
  }
}

const PAGE_SIZE = 20;

// ── Content Component (wiederverwendbar als Tab in FinanzenPage) ──

export function RechnungenContent() {
  return <RechnungenInner />;
}

// ── Standalone Page (für /rechnungen Route, z.B. Kunden-Sicht) ──

export default function RechnungenPage() {
  return <RechnungenInner />;
}

// ── Inner implementation ──

function RechnungenInner() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Data
  const [rows, setRows] = useState<RechnungListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<BillingOverview | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kundeFilter, setKundeFilter] = useState<string>("all");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("rechnungs_datum");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [sammelOpen, setSammelOpen] = useState(false);

  // ZIP download (no state needed — uses window.open)

  // Sammelrechnung
  const [sammelPickerOpen, setSammelPickerOpen] = useState(false);
  const sammelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sammelPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (sammelRef.current && !sammelRef.current.contains(e.target as Node)) {
        setSammelPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sammelPickerOpen]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    total: number; created: number; failed: number;
    results: Array<{ publicId: string; success: boolean; rechnungsNummer?: string; error?: string }>;
  } | null>(null);

  // ── Load Data ──

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoices, billing] = await Promise.all([
        fetchInvoices(1, 9999),
        fetchBillingOverview().catch(() => null),
      ]);
      setRows(invoices.data || []);
      setOverview(billing);
    } catch (err) {
      console.error("Fehler beim Laden der Rechnungen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived: Unique Kunden ──

  const uniqueKunden = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.kunde_name && !map.has(r.kunde_name)) {
        map.set(r.kunde_name, r.kunde_name);
      }
    }
    return Array.from(map.values()).sort();
  }, [rows]);

  // ── Filtered + Sorted Rows ──

  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.rechnungsnummer?.toLowerCase().includes(q) ||
          r.kunde_name?.toLowerCase().includes(q) ||
          r.installation_publicId?.toLowerCase().includes(q) ||
          r.installation_name?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => {
        const s = (r.status || "").toUpperCase();
        if (statusFilter === "OFFEN") return s === "OFFEN" || s === "VERSENDET";
        return s === statusFilter;
      });
    }

    // Kunde filter
    if (kundeFilter !== "all") {
      result = result.filter((r) => r.kunde_name === kundeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortKey) {
        case "rechnungsnummer":
          valA = a.rechnungsnummer || "";
          valB = b.rechnungsnummer || "";
          break;
        case "kunde_name":
          valA = a.kunde_name || "";
          valB = b.kunde_name || "";
          break;
        case "rechnungs_datum":
          valA = a.rechnungs_datum || "";
          valB = b.rechnungs_datum || "";
          break;
        case "betrag_brutto":
          valA = a.betrag_brutto || 0;
          valB = b.betrag_brutto || 0;
          break;
        case "status":
          valA = a.status || "";
          valB = b.status || "";
          break;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      const cmp = String(valA).localeCompare(String(valB), "de");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [rows, searchQuery, statusFilter, kundeFilter, sortKey, sortDir]);

  // ── Paginated ──

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, kundeFilter]);

  // ── Stats from overview ──

  const stats = useMemo(() => {
    if (!overview) return null;
    const byStatus = overview.rechnungenByStatus || {};
    const offen = byStatus.OFFEN || { count: 0, sum: 0 };
    const bezahlt = byStatus.BEZAHLT || { count: 0, sum: 0 };
    const ueber = byStatus.UEBERFAELLIG || { count: 0, sum: 0 };
    const gesamt = Object.values(byStatus).reduce(
      (acc, v) => acc + (v?.count || 0),
      0
    );
    return { gesamt, offen, bezahlt, ueber };
  }, [overview]);

  // ── Sort handler ──

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: 4 }} />;
    const Icon = sortDir === "asc" ? ArrowUp : ArrowDown;
    return <Icon size={12} style={{ color: "var(--accent)", marginLeft: 4 }} />;
  }

  // ── ZIP Download ──

  function handleZipDownload() {
    // "ALLE_OFFEN" = OFFEN + VERSENDET + UEBERFAELLIG + MAHNUNG
    const params = new URLSearchParams({ status: "ALLE_OFFEN" });
    if (kundeFilter !== "all") {
      const row = rows.find((r) => r.kunde_name === kundeFilter);
      if (row?.kunde_id) params.set("kundeId", String(row.kunde_id));
    }

    // Token aus localStorage (falls vorhanden) als Fallback neben Cookie-Auth
    const token = getAccessToken();
    if (token) {
      params.set("token", token);
    }

    // Direct browser download — Cookies werden automatisch mitgesendet
    window.open(`/api/rechnungen/download-zip?${params.toString()}`, "_blank");
  }

  // ── Batch-Abrechnung ──

  // Kunden mit >= 2 offenen Rechnungen für Sammelrechnung
  const sammelKunden = useMemo(() => {
    const openRows = rows.filter(r => r.status === "OFFEN" || r.status === "VERSENDET" || r.status === "UEBERFAELLIG" || r.status === "MAHNUNG");
    const byKunde = new Map<number, RechnungListRow[]>();
    for (const r of openRows) {
      if (!r.kunde_id) continue;
      const list = byKunde.get(r.kunde_id) || [];
      list.push(r);
      byKunde.set(r.kunde_id, list);
    }
    return Array.from(byKunde.entries())
      .filter(([, items]) => items.length >= 2)
      .map(([kundeId, items]) => ({
        kundeId,
        name: items[0].kunde_name,
        count: items.length,
        sum: items.reduce((s, r) => s + (r.betrag_brutto || 0), 0),
        ids: items.map(r => r.id),
      }));
  }, [rows]);

  async function handleSammelForKunde(kunde: { kundeId: number; name: string; ids: number[] }) {
    setBatchRunning(true);
    setBatchResult(null);
    setSammelPickerOpen(false);
    try {
      const { createSammelrechnung } = await import("../modules/rechnungen/api");
      const resp = await createSammelrechnung(kunde.ids);
      const sr = (resp as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const sammel = sr?.sammelrechnung as Record<string, unknown> | undefined;
      setBatchResult({
        total: 1, created: 1, failed: 0,
        results: [{ publicId: kunde.name, success: true, rechnungsNummer: (sammel?.rechnungsNummer as string) || "Erstellt" }],
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler";
      setBatchResult({
        total: 1, created: 0, failed: 1,
        results: [{ publicId: kunde.name, success: false, error: msg }],
      });
    } finally {
      setBatchRunning(false);
    }
  }

  // ── Mark Paid ──

  // Status change
  const [statusMenuId, setStatusMenuId] = useState<number | null>(null);

  async function handleSetStatus(id: number, newStatus: string, rechnungsNr: string) {
    const confirmed = window.confirm(
      `Rechnung ${rechnungsNr} auf "${newStatus}" setzen?`
    );
    if (!confirmed) return;
    try {
      await setInvoiceStatus(id, newStatus);
      setStatusMenuId(null);
      await loadData();
    } catch (err) {
      console.error("Status-Änderung fehlgeschlagen:", err);
      alert("Fehler bei Status-Änderung");
    }
  }

  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);

  async function handleMarkPaid(row: RechnungListRow) {
    const confirmed = window.confirm(
      `Rechnung ${row.rechnungsnummer || `#${row.id}`} als bezahlt markieren?`
    );
    if (!confirmed) return;

    setMarkingPaidId(row.id);
    try {
      await markPaid(row.id);
      await loadData();
    } catch (err) {
      console.error("Fehler beim Bezahlt-Markieren:", err);
      alert("Fehler beim Bezahlt-Markieren");
    } finally {
      setMarkingPaidId(null);
    }
  }

  // ── WhatsApp Send ──

  const [waModalOpen, setWaModalOpen] = useState<RechnungListRow | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const [waEmail, setWaEmail] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waSendEmail, setWaSendEmail] = useState(true);

  function openWhatsAppModal(row: RechnungListRow) {
    setWaModalOpen(row);
    setWaPhone(row.kunde_telefon || "");
    setWaEmail(row.kunde_email || "");
    setWaSendEmail(true);
  }

  async function handleSendWhatsApp() {
    if (!waModalOpen) return;
    if (!waPhone.trim() && !waSendEmail) {
      alert("Bitte Telefonnummer oder E-Mail-Versand angeben");
      return;
    }

    setWaSending(true);
    try {
      await sendWhatsApp(waModalOpen.id, {
        phone: waPhone.trim() || undefined,
        email: waSendEmail ? (waEmail.trim() || undefined) : undefined,
      });
      setWaModalOpen(null);
      alert("Rechnung wurde versendet!");
      await loadData();
    } catch (err) {
      console.error("Fehler beim Versand:", err);
      alert("Fehler beim Versand der Rechnung");
    } finally {
      setWaSending(false);
    }
  }

  // ── Invoice created callback ──

  async function handleInvoiceCreated() {
    setCreateOpen(false);
    await loadData();
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="fin-loading">
        <Loader2 size={28} className="fin-spin" />
      </div>
    );
  }

  return (
    <div className="finanzen">
      {/* Stats Bar */}
      {stats && (
        <div className="fin-stats">
          <div className="fin-stats__chip fin-stats__chip--gray">
            <span>Gesamt</span>
            <span className="fin-stats__chip-value">{stats.gesamt}</span>
          </div>
          <div className="fin-stats__chip fin-stats__chip--orange">
            <span>Offen</span>
            <span className="fin-stats__chip-value">
              {stats.offen.count} | {money(stats.offen.sum)}
            </span>
          </div>
          <div className="fin-stats__chip fin-stats__chip--green">
            <span>Bezahlt</span>
            <span className="fin-stats__chip-value">{stats.bezahlt.count}</span>
          </div>
          <div className="fin-stats__chip fin-stats__chip--red">
            <span>Überfällig</span>
            <span className="fin-stats__chip-value">{stats.ueber.count}</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="fin-filters">
        <div className="fin-filters__search">
          <Search size={15} className="fin-filters__search-icon" />
          <input
            className="fin-filters__search-input"
            type="text"
            placeholder="Suche nach Nr., Kunde, Anlage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="fin-filters__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Alle Status</option>
          <option value="ENTWURF">Entwurf</option>
          <option value="OFFEN">Offen</option>
          <option value="BEZAHLT">Bezahlt</option>
          <option value="UEBERFAELLIG">Überfällig</option>
          <option value="MAHNUNG">Mahnung</option>
          <option value="STORNIERT">Storniert</option>
        </select>

        <select
          className="fin-filters__select"
          value={kundeFilter}
          onChange={(e) => setKundeFilter(e.target.value)}
        >
          <option value="all">Alle Kunden</option>
          {uniqueKunden.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <div className="fin-filters__spacer" />

        <button
          className="fin-filters__btn fin-filters__btn--zip"
          onClick={handleZipDownload}
          title="Alle offenen Rechnungen als ZIP herunterladen (inkl. Mahnungen)"
        >
          <Download size={14} />
          <span>Alle offen (ZIP)</span>
        </button>

        <button
          className="fin-filters__btn"
          onClick={loadData}
          title="Aktualisieren"
        >
          <RefreshCw size={14} />
        </button>

        <button
          className="fin-filters__btn fin-filters__btn--primary"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={14} />
          <span>Neue Rechnung</span>
        </button>

        <div ref={sammelRef} style={{ position: "relative" }}>
          <button
            className="fin-filters__btn fin-filters__btn--batch"
            onClick={() => setSammelPickerOpen(v => !v)}
            disabled={batchRunning || sammelKunden.length === 0}
            title={sammelKunden.length === 0
              ? "Keine Kunden mit 2+ offenen Rechnungen"
              : "Sammelrechnung für einen Kunden erstellen"
            }
          >
            {batchRunning ? (
              <Loader2 size={14} className="fin-spin" />
            ) : (
              <Zap size={14} />
            )}
            <span>{batchRunning ? "Erstelle..." : "Sammelrechnung"}</span>
          </button>

          {sammelPickerOpen && sammelKunden.length > 0 && (
            <div className="fin-sammel-dropdown">
              <div className="fin-sammel-dropdown__title">Kunde auswählen</div>
              {sammelKunden.map(k => (
                <button
                  key={k.kundeId}
                  className="fin-sammel-dropdown__item"
                  onClick={() => handleSammelForKunde(k)}
                >
                  <div className="fin-sammel-dropdown__name">{k.name}</div>
                  <div className="fin-sammel-dropdown__meta">
                    {k.count} Rechnungen · {money(k.sum)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch-Ergebnis */}
      {batchResult && (
        <div className="fin-batch-result">
          <div className="fin-batch-result__header">
            <CheckCircle size={16} />
            <strong>{batchResult.created} Sammelrechnungen erstellt</strong>
            {batchResult.failed > 0 && (
              <span className="fin-batch-result__failed">{batchResult.failed} fehlgeschlagen</span>
            )}
            <button className="fin-batch-result__close" onClick={() => setBatchResult(null)}>
              <X size={14} />
            </button>
          </div>
          {batchResult.failed > 0 && (
            <div className="fin-batch-result__errors">
              {batchResult.results.filter(r => !r.success).map((r, i) => (
                <div key={i} className="fin-batch-result__error-row">
                  <span>{r.publicId}</span>
                  <span>{r.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {filteredRows.length === 0 ? (
        <div className="fin-table-wrap">
          <div className="fin-empty">
            <FileText size={40} className="fin-empty__icon" />
            <div className="fin-empty__title">Keine Rechnungen gefunden</div>
            <div className="fin-empty__text">
              {searchQuery || statusFilter !== "all" || kundeFilter !== "all"
                ? "Versuche andere Filterkriterien"
                : "Erstelle eine neue Rechnung mit dem Button oben"}
            </div>
          </div>
        </div>
      ) : (
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("rechnungsnummer")}>
                  Nr. <SortIcon col="rechnungsnummer" />
                </th>
                <th onClick={() => handleSort("kunde_name")}>
                  Kunde <SortIcon col="kunde_name" />
                </th>
                <th>Anlage</th>
                <th onClick={() => handleSort("rechnungs_datum")}>
                  Datum <SortIcon col="rechnungs_datum" />
                </th>
                <th
                  onClick={() => handleSort("betrag_brutto")}
                  style={{ textAlign: "right" }}
                >
                  Betrag <SortIcon col="betrag_brutto" />
                </th>
                <th onClick={() => handleSort("status")}>
                  Status <SortIcon col="status" />
                </th>
                <th style={{ textAlign: "right", width: 140 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => {
                const pdfUrl = getPdfUrl(r.id);
                return (
                  <tr key={r.id}>
                    <td className="fin-table__mono">
                      {r.rechnungsnummer || `#${r.id}`}
                    </td>
                    <td>{r.kunde_name || "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {r.installation_publicId || r.anlage_bezeichnung || "—"}
                    </td>
                    <td>{fmt(r.rechnungs_datum)}</td>
                    <td className="fin-table__amount">
                      {money(r.betrag_brutto)}
                    </td>
                    <td style={{ position: "relative" }}>
                      <span
                        className={`fin-badge ${getStatusBadgeClass(r.status)}`}
                        style={{ cursor: isAdmin ? "pointer" : "default" }}
                        onClick={() => isAdmin && setStatusMenuId(statusMenuId === r.id ? null : r.id)}
                        title={isAdmin ? "Klicken um Status zu ändern" : undefined}
                      >
                        <span className="fin-badge__dot" />
                        {getStatusLabel(r.status)}
                        {isAdmin && <ArrowUpDown size={10} style={{ marginLeft: 4, opacity: 0.5 }} />}
                      </span>
                      {statusMenuId === r.id && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setStatusMenuId(null)} />
                          <div className="fin-status-menu">
                            {["OFFEN", "VERSENDET", "BEZAHLT", "UEBERFAELLIG", "MAHNUNG", "STORNIERT"].map(st => (
                              <button
                                key={st}
                                className={`fin-status-menu__item${(r.status || "").toUpperCase() === st ? " fin-status-menu__item--active" : ""}`}
                                disabled={(r.status || "").toUpperCase() === st}
                                onClick={() => handleSetStatus(r.id, st, r.rechnungsnummer || `#${r.id}`)}
                              >
                                <span className={`fin-badge__dot fin-badge__dot--${st.toLowerCase()}`} />
                                {getStatusLabel(st)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                    <td>
                      <div className="fin-table__actions">
                        <button
                          className="fin-table__action-btn"
                          onClick={() => window.open(pdfUrl, "_blank")}
                          title="PDF anzeigen"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="fin-table__action-btn"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = pdfUrl;
                            a.download = `${r.rechnungsnummer || `RE-${r.id}`}.pdf`;
                            a.click();
                          }}
                          title="PDF herunterladen"
                        >
                          <Download size={16} />
                        </button>
                        {["OFFEN", "VERSENDET", "UEBERFAELLIG", "MAHNUNG"].includes(
                          (r.status || "").toUpperCase()
                        ) && (
                          <button
                            className="fin-table__action-btn"
                            onClick={() => handleMarkPaid(r)}
                            disabled={markingPaidId === r.id}
                            title="Als bezahlt markieren"
                          >
                            {markingPaidId === r.id ? (
                              <Loader2 size={16} className="fin-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                        )}
                        {r.pdf_path && (r.status || "").toUpperCase() !== "ENTWURF" && (
                          <button
                            className="fin-table__action-btn"
                            onClick={() => openWhatsAppModal(r)}
                            title="Per WhatsApp / E-Mail versenden"
                          >
                            <Send size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="fin-pagination">
              <span className="fin-pagination__info">
                {filteredRows.length} Rechnungen, Seite {safePage} von{" "}
                {totalPages}
              </span>
              <div className="fin-pagination__controls">
                <button
                  className="fin-pagination__btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  Zurück
                </button>
                <span className="fin-pagination__current">{safePage}</span>
                <button
                  className="fin-pagination__btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Weiter
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp / Email Versand Modal */}
      {waModalOpen && (
        <div className="fin-modal-overlay" onClick={() => !waSending && setWaModalOpen(null)}>
          <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fin-modal__header">
              <h3>Rechnung versenden</h3>
              <button
                className="fin-modal__close"
                onClick={() => !waSending && setWaModalOpen(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="fin-modal__body">
              <p style={{ marginBottom: 12, color: "var(--text-muted)", fontSize: 13 }}>
                Rechnung <strong>{waModalOpen.rechnungsnummer}</strong> an{" "}
                <strong>{waModalOpen.kunde_name}</strong> versenden:
              </p>

              {/* WhatsApp */}
              <label className="fin-modal__label">
                <MessageCircle size={14} style={{ marginRight: 6 }} />
                WhatsApp-Nummer (optional)
              </label>
              <input
                className="fin-modal__input"
                type="tel"
                placeholder="z.B. 491701234567"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                disabled={waSending}
              />
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 12px" }}>
                Internationales Format ohne + Zeichen. WhatsApp-Consent muss vorliegen.
              </p>

              {/* Email */}
              <label className="fin-modal__label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={waSendEmail}
                  onChange={(e) => setWaSendEmail(e.target.checked)}
                  disabled={waSending}
                />
                <Mail size={14} />
                Auch per E-Mail senden
              </label>
              {waSendEmail && (
                <input
                  className="fin-modal__input"
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={waEmail}
                  onChange={(e) => setWaEmail(e.target.value)}
                  disabled={waSending}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
            <div className="fin-modal__footer">
              <button
                className="fin-modal__btn fin-modal__btn--cancel"
                onClick={() => setWaModalOpen(null)}
                disabled={waSending}
              >
                Abbrechen
              </button>
              <button
                className="fin-modal__btn fin-modal__btn--primary"
                onClick={handleSendWhatsApp}
                disabled={waSending || (!waPhone.trim() && !waSendEmail)}
              >
                {waSending ? (
                  <Loader2 size={14} className="fin-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span style={{ marginLeft: 6 }}>Versenden</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <InvoiceCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleInvoiceCreated}
        createDraft={createInvoiceDraft}
      />

      <SammelrechnungModal
        isOpen={sammelOpen}
        onClose={() => setSammelOpen(false)}
        rechnungen={rows}
        onCreateSammelrechnung={async (ids) => {
          const { createSammelrechnung } = await import(
            "../modules/rechnungen/api"
          );
          await createSammelrechnung(ids);
          setSammelOpen(false);
          await loadData();
        }}
      />
    </div>
  );
}

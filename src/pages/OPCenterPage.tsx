import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Loader2,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle,
  Send,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Ban,
  Unlock,
  Play,
  Eye,
  BarChart3,
  Users,
  Shield,
} from "lucide-react";
import { apiGet, apiPost } from "../modules/api/client";
import { ToastProvider } from "../modules/ui/toast/ToastContext";
import { ToastContainer } from "../modules/ui/toast/ToastContainer";
import { useToast } from "../modules/ui/toast/useToast";
import { useAuth } from "../modules/auth/AuthContext";
import "./op-center.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardKPIs {
  totalOffenePosten: number;
  summeOffen: number;
  summeUeberfaellig: number;
  anzahlUeberfaellig: number;
  anzahlInMahnung: number;
  summeInMahnung: number;
  durchschnittZahlungsziel: number;
  gesperrteKunden: number;
  aeltesterOP: string | null;
}

interface OffenerPosten {
  id: number;
  rechnungsNummer: string;
  betragNetto: number;
  betragBrutto: number;
  status: string;
  faelligAm: string;
  rechnungsDatum: string;
  mahnStufe: number;
  letzteMahnungAm: string | null;
  pdfPath: string | null;
  beschreibung: string | null;
  mahnSperre: boolean;
  tageUeberfaellig: number;
  kunde: { id: number; name: string; firmenName: string | null };
}

interface OPResponse {
  items: OffenerPosten[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: { summeOffen: number; summeUeberfaellig: number };
}

interface KundeSaldo {
  kundeId: number;
  kundeName: string;
  kundeEmail: string | null;
  firmenName: string | null;
  accountGesperrt: boolean;
  mahnungDeaktiviert: boolean;
  saldo: number;
  anzahlOffen: number;
  aeltesteFaelligkeit: string | null;
  tageUeberfaellig: number;
  hoechsteMahnstufe: number;
  zahlungsmoral: "gut" | "mittel" | "schlecht" | "unbekannt";
}

interface MahnwesenData {
  settings: {
    mahnwesenAktiv: boolean;
    autoMahnungAktiv: boolean;
    autoSperrungAktiv: boolean;
    emailVersandAktiv: boolean;
    tageBisMahnung: number;
    tageBisSperrung: number;
  };
  mahrstufenVerteilung: { stufe: number; anzahl: number; summe: number }[];
  gesperrteKunden: {
    userId: number;
    userName: string;
    userEmail: string;
    kundeId: number;
    kundeName: string;
    gesperrtAm: string | null;
    offeneRechnungen: number;
    offeneSumme: number;
  }[];
}

interface KundeDetailRechnung {
  id: number;
  rechnungsNummer: string;
  betragBrutto: number;
  status: string;
  faelligAm: string;
  mahnStufe: number;
  rechnungsDatum: string;
  beschreibung: string | null;
  tageUeberfaellig: number;
}

type TabId = "dashboard" | "op-liste" | "kunden-saldo" | "mahnwesen";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const EUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

const STATUS_LABELS: Record<string, string> = {
  OFFEN: "Offen",
  VERSENDET: "Versendet",
  UEBERFAELLIG: "Überfällig",
  MAHNUNG: "Mahnung",
  BEZAHLT: "Bezahlt",
  ENTWURF: "Entwurf",
  STORNIERT: "Storniert",
};

const MAHNSTUFE_LABELS: Record<number, string> = {
  0: "Keine",
  1: "Erinnerung",
  2: "1. Mahnung",
  3: "2. Mahnung",
};

function tageClass(tage: number): string {
  if (tage === 0) return "opc-tage-0";
  if (tage <= 7) return "opc-tage-warn";
  if (tage <= 14) return "opc-tage-orange";
  return "opc-tage-danger";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "OFFEN": return "opc-badge-offen";
    case "VERSENDET": return "opc-badge-versendet";
    case "UEBERFAELLIG": return "opc-badge-ueberfaellig";
    case "MAHNUNG": return "opc-badge-mahnung";
    case "BEZAHLT": return "opc-badge-bezahlt";
    default: return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function OPCenterPage() {
  return (
    <ToastProvider>
      <OPCenterInner />
      <ToastContainer />
    </ToastProvider>
  );
}

// Content-Export für Einbettung als Tab in FinanzenPage
export function OPCenterContent() {
  return (
    <ToastProvider>
      <OPCenterInner embedded />
      <ToastContainer />
    </ToastProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function OPCenterInner({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const { push } = useToast();
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === "ADMIN";

  const fetchKPIs = useCallback(async () => {
    try {
      const res = await apiGet("/op/dashboard");
      setKpis((res as any).data);
    } catch {
      push("Fehler beim Laden der KPIs", "error");
    }
  }, [push]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await fetchKPIs();
    setLoading(false);
  }, [fetchKPIs]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Übersicht", icon: <BarChart3 size={16} /> },
    { id: "op-liste", label: "Offene Posten", icon: <FileText size={16} /> },
    { id: "kunden-saldo", label: "Kunden-Saldo", icon: <Users size={16} /> },
    { id: "mahnwesen", label: "Mahnwesen", icon: <Shield size={16} /> },
  ];

  return (
    <div className="opc-page">
      {/* Header — nur im Standalone-Modus */}
      {!embedded && (
        <div className="opc-header">
          <div className="opc-header-left">
            <div className="opc-header-icon"><Wallet size={22} /></div>
            <div>
              <h1 className="opc-title">Offene Posten</h1>
              <p className="opc-subtitle">Rechnungsüberwachung · Kunden-Saldo · Mahnwesen</p>
            </div>
          </div>
          <div className="opc-header-right">
            {kpis && (
              <div className="opc-stats-bar">
                <StatChip label="Offen" value={kpis.totalOffenePosten} icon={<FileText size={14} />} />
                <StatChip label="Überfällig" value={kpis.anzahlUeberfaellig} icon={<AlertTriangle size={14} />} variant="danger" />
                <StatChip label="In Mahnung" value={kpis.anzahlInMahnung} icon={<Clock size={14} />} variant="warning" />
                <StatChip label="Gesperrt" value={kpis.gesperrteKunden} icon={<Ban size={14} />} variant={kpis.gesperrteKunden > 0 ? "danger" : undefined} />
              </div>
            )}
            <button className="opc-btn opc-btn-ghost" onClick={refreshAll} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Aktualisieren
            </button>
          </div>
        </div>
      )}

      {/* Embedded header: compact stat bar + refresh */}
      {embedded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem 0" }}>
          {kpis && (
            <div className="opc-stats-bar">
              <StatChip label="Offen" value={kpis.totalOffenePosten} icon={<FileText size={14} />} />
              <StatChip label="Überfällig" value={kpis.anzahlUeberfaellig} icon={<AlertTriangle size={14} />} variant="danger" />
              <StatChip label="In Mahnung" value={kpis.anzahlInMahnung} icon={<Clock size={14} />} variant="warning" />
              <StatChip label="Gesperrt" value={kpis.gesperrteKunden} icon={<Ban size={14} />} variant={kpis.gesperrteKunden > 0 ? "danger" : undefined} />
            </div>
          )}
          <button className="opc-btn opc-btn-ghost" onClick={refreshAll} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Aktualisieren
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="opc-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`opc-tab ${activeTab === tab.id ? "opc-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "dashboard" && <DashboardTab kpis={kpis} loading={loading} />}
      {activeTab === "op-liste" && <OPListeTab />}
      {activeTab === "kunden-saldo" && <KundenSaldoTab />}
      {activeTab === "mahnwesen" && <MahnwesenTab isAdmin={isAdmin} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CHIP
// ═══════════════════════════════════════════════════════════════════════════

function StatChip({ label, value, icon, variant }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: string;
}) {
  return (
    <div className={`opc-stat-chip ${variant ? `opc-stat-${variant}` : ""}`}>
      <span className="opc-stat-icon">{icon}</span>
      <span className="opc-stat-value">{value}</span>
      <span className="opc-stat-label">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function DashboardTab({ kpis, loading }: { kpis: DashboardKPIs | null; loading: boolean }) {
  if (loading || !kpis) {
    return <div className="opc-loading"><Loader2 size={24} className="animate-spin" /> Lade Dashboard...</div>;
  }

  const aeltesterLabel = kpis.aeltesterOP
    ? `Ältester OP: ${fmtDate(kpis.aeltesterOP)}`
    : "Kein offener Posten";

  return (
    <div>
      <div className="opc-kpi-grid">
        <div className="opc-kpi-card">
          <div className="opc-kpi-header">
            <span className="opc-kpi-label">Offene Posten</span>
            <div className="opc-kpi-icon opc-kpi-icon-blue"><FileText size={18} /></div>
          </div>
          <div className="opc-kpi-value">{kpis.totalOffenePosten}</div>
          <div className="opc-kpi-sub">{EUR(kpis.summeOffen)} Gesamtsumme</div>
        </div>

        <div className="opc-kpi-card">
          <div className="opc-kpi-header">
            <span className="opc-kpi-label">Überfällig</span>
            <div className="opc-kpi-icon opc-kpi-icon-red"><AlertTriangle size={18} /></div>
          </div>
          <div className="opc-kpi-value" style={{ color: "#f87171" }}>{kpis.anzahlUeberfaellig}</div>
          <div className="opc-kpi-sub">{EUR(kpis.summeUeberfaellig)} überfällig</div>
        </div>

        <div className="opc-kpi-card">
          <div className="opc-kpi-header">
            <span className="opc-kpi-label">In Mahnung</span>
            <div className="opc-kpi-icon opc-kpi-icon-orange"><Clock size={18} /></div>
          </div>
          <div className="opc-kpi-value" style={{ color: "#fbbf24" }}>{kpis.anzahlInMahnung}</div>
          <div className="opc-kpi-sub">{EUR(kpis.summeInMahnung)} in Mahnstufen</div>
        </div>

        <div className="opc-kpi-card">
          <div className="opc-kpi-header">
            <span className="opc-kpi-label">Ø Zahlungsziel</span>
            <div className="opc-kpi-icon opc-kpi-icon-green"><TrendingUp size={18} /></div>
          </div>
          <div className="opc-kpi-value">{kpis.durchschnittZahlungsziel}d</div>
          <div className="opc-kpi-sub">Durchschnitt letzte 90 Tage</div>
        </div>
      </div>

      <div className="opc-kpi-chips">
        <span className="opc-kpi-chip">
          <Ban size={12} /> Gesperrte Kunden: {kpis.gesperrteKunden}
        </span>
        <span className="opc-kpi-chip">
          <Clock size={12} /> {aeltesterLabel}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: OFFENE POSTEN LISTE
// ═══════════════════════════════════════════════════════════════════════════

function OPListeTab() {
  const [data, setData] = useState<OPResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mahnStufeFilter, setMahnStufeFilter] = useState("");
  const [sortBy, setSortBy] = useState("faelligAm");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const { push } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (mahnStufeFilter) params.set("mahnStufe", mahnStufeFilter);

      const res = await apiGet(`/op/offene-posten?${params.toString()}`);
      setData((res as any).data);
    } catch {
      push("Fehler beim Laden der Offenen Posten", "error");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, search, statusFilter, mahnStufeFilter, push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await apiPost(`/rechnungen/${id}/mark-paid`, {});
      push("Rechnung als bezahlt markiert", "success");
      fetchData();
    } catch {
      push("Fehler beim Markieren als bezahlt", "error");
    }
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return "";
    return <span className="opc-sort-icon">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="opc-filter-bar">
        <input
          className="opc-filter-input"
          placeholder="Suche (RE-Nr, Kunde...)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="opc-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">Alle Status</option>
          <option value="OFFEN">Offen</option>
          <option value="VERSENDET">Versendet</option>
          <option value="UEBERFAELLIG">Überfällig</option>
          <option value="MAHNUNG">Mahnung</option>
        </select>
        <select
          className="opc-filter-select"
          value={mahnStufeFilter}
          onChange={(e) => { setMahnStufeFilter(e.target.value); setPage(1); }}
        >
          <option value="">Alle Mahnstufen</option>
          <option value="0">Keine Mahnung</option>
          <option value="1">Erinnerung</option>
          <option value="2">1. Mahnung</option>
          <option value="3">2. Mahnung</option>
        </select>
      </div>

      {loading ? (
        <div className="opc-loading"><Loader2 size={24} className="animate-spin" /> Lade...</div>
      ) : !data || data.items.length === 0 ? (
        <div className="opc-empty">Keine offenen Posten gefunden</div>
      ) : (
        <>
          <div className="opc-table-wrap">
            <table className="opc-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("rechnungsNummer")}>RE-Nr {sortIcon("rechnungsNummer")}</th>
                  <th>Kunde</th>
                  <th onClick={() => handleSort("betragBrutto")}>Betrag {sortIcon("betragBrutto")}</th>
                  <th onClick={() => handleSort("faelligAm")}>Fällig am {sortIcon("faelligAm")}</th>
                  <th>Tage überf.</th>
                  <th onClick={() => handleSort("status")}>Status {sortIcon("status")}</th>
                  <th onClick={() => handleSort("mahnStufe")}>Mahnstufe {sortIcon("mahnStufe")}</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((op) => (
                  <tr key={op.id}>
                    <td style={{ fontWeight: 600 }}>{op.rechnungsNummer}</td>
                    <td>{op.kunde.firmenName || op.kunde.name}</td>
                    <td>{EUR(op.betragBrutto)}</td>
                    <td>{fmtDate(op.faelligAm)}</td>
                    <td>
                      <span className={tageClass(op.tageUeberfaellig)}>
                        {op.tageUeberfaellig > 0 ? `${op.tageUeberfaellig}d` : "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`opc-badge ${statusBadgeClass(op.status)}`}>
                        {STATUS_LABELS[op.status] || op.status}
                      </span>
                    </td>
                    <td>
                      <span className={`opc-mahnstufe-${op.mahnStufe}`}>
                        {MAHNSTUFE_LABELS[op.mahnStufe] || `Stufe ${op.mahnStufe}`}
                      </span>
                    </td>
                    <td>
                      <div className="opc-actions">
                        {op.pdfPath && (
                          <button
                            className="opc-action-btn"
                            title="PDF öffnen"
                            onClick={() => window.open(`/uploads/${op.pdfPath}`, "_blank")}
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        <button
                          className="opc-action-btn opc-action-btn-success"
                          title="Als bezahlt markieren"
                          onClick={() => handleMarkPaid(op.id)}
                        >
                          <CheckCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="opc-summary-row">
                  <td colSpan={2}>Summe ({data.total} Rechnungen)</td>
                  <td>{EUR(data.summary.summeOffen)}</td>
                  <td colSpan={2}>Davon überfällig: {EUR(data.summary.summeUeberfaellig)}</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="opc-pagination">
              <span className="opc-pagination-info">
                Seite {data.page} von {data.totalPages} ({data.total} Ergebnisse)
              </span>
              <div className="opc-pagination-btns">
                <button
                  className="opc-pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(page - 2, data.totalPages - 4));
                  const p = startPage + i;
                  if (p > data.totalPages) return null;
                  return (
                    <button
                      key={p}
                      className={`opc-pagination-btn ${p === page ? "opc-pagination-btn-active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="opc-pagination-btn"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: KUNDEN-SALDO
// ═══════════════════════════════════════════════════════════════════════════

function KundenSaldoTab() {
  const [saldos, setSaldos] = useState<KundeSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"saldo" | "anzahlOffen" | "tageUeberfaellig">("saldo");
  const [expandedKunde, setExpandedKunde] = useState<number | null>(null);
  const [kundeDetail, setKundeDetail] = useState<KundeDetailRechnung[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const { push } = useToast();

  const fetchSaldos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/op/kunden-saldo");
      setSaldos((res as any).data || []);
    } catch {
      push("Fehler beim Laden der Kunden-Saldos", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { fetchSaldos(); }, [fetchSaldos]);

  const sorted = [...saldos]
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.kundeName.toLowerCase().includes(q) ||
             (s.firmenName || "").toLowerCase().includes(q) ||
             (s.kundeEmail || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "saldo") return b.saldo - a.saldo;
      if (sortBy === "anzahlOffen") return b.anzahlOffen - a.anzahlOffen;
      return b.tageUeberfaellig - a.tageUeberfaellig;
    });

  const toggleExpand = async (kundeId: number) => {
    if (expandedKunde === kundeId) {
      setExpandedKunde(null);
      return;
    }
    setExpandedKunde(kundeId);
    setDetailLoading(true);
    try {
      const res = await apiGet(`/op/kunden-saldo/${kundeId}`);
      setKundeDetail((res as any).data || []);
    } catch {
      push("Fehler beim Laden der Kunden-Details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <div className="opc-loading"><Loader2 size={24} className="animate-spin" /> Lade Kunden-Saldos...</div>;
  }

  return (
    <div>
      <div className="opc-filter-bar">
        <input
          className="opc-filter-input"
          placeholder="Kunde suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="opc-filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="saldo">Sortierung: Saldo</option>
          <option value="anzahlOffen">Sortierung: Anzahl</option>
          <option value="tageUeberfaellig">Sortierung: Tage überfällig</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="opc-empty">Keine Kunden mit offenen Posten</div>
      ) : (
        <div className="opc-table-wrap">
          <table className="opc-table">
            <thead>
              <tr>
                <th style={{ width: 30 }} />
                <th>Kunde</th>
                <th>Saldo</th>
                <th>Offene RE</th>
                <th>Älteste</th>
                <th>Tage überf.</th>
                <th>Mahnstufe</th>
                <th>Moral</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <Fragment key={s.kundeId}>
                  <tr className="opc-expand-trigger" onClick={() => toggleExpand(s.kundeId)}>
                    <td>
                      {expandedKunde === s.kundeId
                        ? <ChevronDown size={14} />
                        : <ChevronRight size={14} />}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {s.firmenName || s.kundeName}
                      {s.firmenName && <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 6, fontWeight: 400, fontSize: 12 }}>{s.kundeName}</span>}
                    </td>
                    <td style={{ fontWeight: 700 }}>{EUR(s.saldo)}</td>
                    <td>{s.anzahlOffen}</td>
                    <td>{s.aeltesteFaelligkeit ? fmtDate(s.aeltesteFaelligkeit) : "-"}</td>
                    <td>
                      <span className={tageClass(s.tageUeberfaellig)}>
                        {s.tageUeberfaellig > 0 ? `${s.tageUeberfaellig}d` : "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`opc-mahnstufe-${Math.min(s.hoechsteMahnstufe, 3)}`}>
                        {MAHNSTUFE_LABELS[s.hoechsteMahnstufe] || `Stufe ${s.hoechsteMahnstufe}`}
                      </span>
                    </td>
                    <td>
                      <span className={`opc-badge opc-moral-${s.zahlungsmoral}`}>
                        {s.zahlungsmoral === "gut" ? "Gut" :
                         s.zahlungsmoral === "mittel" ? "Mittel" :
                         s.zahlungsmoral === "schlecht" ? "Schlecht" : "k.A."}
                      </span>
                    </td>
                    <td>
                      {s.accountGesperrt && (
                        <span className="opc-badge opc-badge-ueberfaellig">Gesperrt</span>
                      )}
                      {s.mahnungDeaktiviert && (
                        <span className="opc-badge" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>Mahnung aus</span>
                      )}
                    </td>
                  </tr>
                  {expandedKunde === s.kundeId && (
                    <tr className="opc-expand-row">
                      <td colSpan={9}>
                        <div className="opc-expand-content">
                          {detailLoading ? (
                            <div className="opc-loading" style={{ padding: 20 }}><Loader2 size={16} className="animate-spin" /> Lade...</div>
                          ) : kundeDetail.length === 0 ? (
                            <div className="opc-empty" style={{ padding: 20 }}>Keine offenen Rechnungen</div>
                          ) : (
                            <table className="opc-expand-table">
                              <thead>
                                <tr>
                                  <th>RE-Nr</th>
                                  <th>Betrag</th>
                                  <th>Fällig</th>
                                  <th>Tage überf.</th>
                                  <th>Status</th>
                                  <th>Mahnstufe</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kundeDetail.map((r) => (
                                  <tr key={r.id}>
                                    <td>{r.rechnungsNummer}</td>
                                    <td>{EUR(r.betragBrutto)}</td>
                                    <td>{fmtDate(r.faelligAm)}</td>
                                    <td>
                                      <span className={tageClass(r.tageUeberfaellig)}>
                                        {r.tageUeberfaellig > 0 ? `${r.tageUeberfaellig}d` : "-"}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`opc-badge ${statusBadgeClass(r.status)}`}>
                                        {STATUS_LABELS[r.status] || r.status}
                                      </span>
                                    </td>
                                    <td className={`opc-mahnstufe-${Math.min(r.mahnStufe, 3)}`}>
                                      {MAHNSTUFE_LABELS[r.mahnStufe] || `Stufe ${r.mahnStufe}`}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4: MAHNWESEN
// ═══════════════════════════════════════════════════════════════════════════

function MahnwesenTab({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<MahnwesenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const { push } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/op/mahnwesen");
      setData((res as any).data);
    } catch {
      push("Fehler beim Laden des Mahnwesens", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await apiGet("/mahnungen/preview");
      setPreview((res as any).data || res);
      push("Preview geladen", "success");
    } catch {
      push("Fehler beim Laden des Previews", "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRun = async () => {
    if (!window.confirm("Mahnlauf wirklich starten? Dies versendet ggf. Mahn-E-Mails.")) return;
    setRunLoading(true);
    try {
      await apiPost("/mahnungen/run", {});
      push("Mahnlauf gestartet", "success");
      fetchData();
    } catch {
      push("Fehler beim Starten des Mahnlaufs", "error");
    } finally {
      setRunLoading(false);
    }
  };

  const handleEntsperren = async (kundeId: number) => {
    try {
      await apiPost(`/mahnungen/kunde/${kundeId}/entsperren`, {});
      push("Kunde entsperrt", "success");
      fetchData();
    } catch {
      push("Fehler beim Entsperren", "error");
    }
  };

  if (loading || !data) {
    return <div className="opc-loading"><Loader2 size={24} className="animate-spin" /> Lade Mahnwesen...</div>;
  }

  const maxAnzahl = Math.max(...data.mahrstufenVerteilung.map((m) => m.anzahl), 1);

  return (
    <div>
      <div className="opc-mahnwesen-grid">
        {/* System-Status */}
        <div className="opc-mahn-card">
          <h3 className="opc-mahn-card-title">System-Status</h3>
          <div className="opc-mahn-setting">
            <span className="opc-mahn-setting-label">Mahnwesen</span>
            <span className={`opc-mahn-setting-value ${data.settings.mahnwesenAktiv ? "opc-mahn-active" : "opc-mahn-inactive"}`}>
              {data.settings.mahnwesenAktiv ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
          <div className="opc-mahn-setting">
            <span className="opc-mahn-setting-label">Auto-Mahnung</span>
            <span className={`opc-mahn-setting-value ${data.settings.autoMahnungAktiv ? "opc-mahn-active" : "opc-mahn-inactive"}`}>
              {data.settings.autoMahnungAktiv ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
          <div className="opc-mahn-setting">
            <span className="opc-mahn-setting-label">Auto-Sperrung</span>
            <span className={`opc-mahn-setting-value ${data.settings.autoSperrungAktiv ? "opc-mahn-active" : "opc-mahn-inactive"}`}>
              {data.settings.autoSperrungAktiv ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
          <div className="opc-mahn-setting">
            <span className="opc-mahn-setting-label">E-Mail-Versand</span>
            <span className={`opc-mahn-setting-value ${data.settings.emailVersandAktiv ? "opc-mahn-active" : "opc-mahn-inactive"}`}>
              {data.settings.emailVersandAktiv ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
          <div className="opc-mahn-setting">
            <span className="opc-mahn-setting-label">Tage bis Mahnung</span>
            <span className="opc-mahn-setting-value">{data.settings.tageBisMahnung} Werktage</span>
          </div>
          <div className="opc-mahn-setting">
            <span className="opc-mahn-setting-label">Tage bis Sperrung</span>
            <span className="opc-mahn-setting-value">{data.settings.tageBisSperrung} Tage</span>
          </div>
        </div>

        {/* Mahnstufen-Verteilung */}
        <div className="opc-mahn-card">
          <h3 className="opc-mahn-card-title">Mahnstufen-Verteilung</h3>
          <div className="opc-mahnstufen-bar">
            {data.mahrstufenVerteilung.map((m) => (
              <div className="opc-mahnstufe-row" key={m.stufe}>
                <span className="opc-mahnstufe-label">
                  {MAHNSTUFE_LABELS[m.stufe] || `Stufe ${m.stufe}`}
                </span>
                <div className="opc-mahnstufe-bar-bg">
                  <div
                    className={`opc-mahnstufe-bar-fill opc-mahnstufe-bar-${Math.min(m.stufe, 3)}`}
                    style={{ width: `${Math.max(5, (m.anzahl / maxAnzahl) * 100)}%` }}
                  >
                    {m.anzahl > 0 && EUR(m.summe)}
                  </div>
                </div>
                <span className="opc-mahnstufe-count">{m.anzahl}</span>
              </div>
            ))}
            {data.mahrstufenVerteilung.length === 0 && (
              <div className="opc-empty" style={{ padding: 20 }}>Keine offenen Mahnungen</div>
            )}
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="opc-mahn-actions">
        <button className="opc-btn opc-btn-ghost" onClick={handlePreview} disabled={previewLoading}>
          <Eye size={16} />
          {previewLoading ? "Lade..." : "Preview Mahnlauf"}
        </button>
        {isAdmin && (
          <button className="opc-btn opc-btn-primary" onClick={handleRun} disabled={runLoading}>
            <Play size={16} />
            {runLoading ? "Läuft..." : "Mahnlauf starten"}
          </button>
        )}
      </div>

      {/* Preview-Ergebnis */}
      {preview && (
        <div className="opc-mahn-card" style={{ marginTop: 16 }}>
          <h3 className="opc-mahn-card-title">Mahnlauf-Preview</h3>
          <pre style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap", margin: 0 }}>
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}

      {/* Gesperrte Kunden */}
      {data.gesperrteKunden.length > 0 && (
        <div className="opc-mahn-card" style={{ marginTop: 16 }}>
          <h3 className="opc-mahn-card-title">Gesperrte Kunden ({data.gesperrteKunden.length})</h3>
          <div className="opc-gesperrt-list">
            {data.gesperrteKunden.map((g) => (
              <div className="opc-gesperrt-item" key={g.userId}>
                <div className="opc-gesperrt-info">
                  <span className="opc-gesperrt-name">{g.kundeName}</span>
                  <span className="opc-gesperrt-details">
                    {g.userEmail} · {g.offeneRechnungen} offene RE · {EUR(g.offeneSumme)}
                    {g.gesperrtAm && ` · Gesperrt seit ${fmtDate(g.gesperrtAm)}`}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    className="opc-btn opc-btn-sm opc-btn-success"
                    onClick={() => handleEntsperren(g.kundeId)}
                  >
                    <Unlock size={14} />
                    Entsperren
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../modules/api/client";
import { useAuth } from "./AuthContext";
import {
  X, User, MapPin, Phone, Mail, Calendar, Sun, Zap, Battery,
  Building2, FileText, CheckCircle2, Clock, Home, Hash, Download,
  Loader2, Grid3X3, ChevronRight, Gauge, Cable, Car, Thermometer,
  Search, LayoutGrid, List, Filter, TrendingUp, Users, Archive,
  AlertCircle, RefreshCw
} from 'lucide-react';
import './ArchivPage.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ArchivedInstallation = {
  id: number;
  publicId: string;
  nbCaseNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  powerKwp?: number;
  gridOperator?: string;
  messkonzept?: string;
  zaehlernummer?: string;
  technicalData?: any;
  wizardContext?: any;
  timeline?: { created?: string; submitted?: string; approved?: string; installed?: string; completed?: string };
  revenue?: number;
  documentsCount?: number;
  rating?: number;
  notes?: string;
  documents?: any[];
  statusHistory?: any[];
  status?: string;
  // 🔥 NEU: Erstellt von
  createdByCompany?: string;
  createdByName?: string;
  createdByEmail?: string;
};

type YearStats = {
  year: number;
  installations: number;
  totalKwp: number;
  revenue: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(iso?: string) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateLong(iso?: string) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

function formatCurrency(amount?: number) {
  const v = Number(amount || 0);
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 0;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusLabel(status?: string): { label: string; color: string } {
  const s = (status || "").toLowerCase();
  if (s.includes("abgeschlossen") || s === "completed") return { label: "Abgeschlossen", color: "#22c55e" };
  if (s.includes("storniert") || s === "cancelled") return { label: "Storniert", color: "#ef4444" };
  return { label: status || "Archiviert", color: "#64748b" };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ArchivPage() {
  const { user } = useAuth();
  const role = ((user as any)?.role || "").toUpperCase();
  const isKunde = role === "KUNDE";
  const isSubunternehmer = role === "SUBUNTERNEHMER";
  const isStaff = role === "ADMIN" || role === "MITARBEITER";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archived, setArchived] = useState<ArchivedInstallation[]>([]);
  const [yearStats, setYearStats] = useState<YearStats[]>([]);

  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "kwp" | "revenue" | "name">("date");
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");

  const [selectedInst, setSelectedInst] = useState<ArchivedInstallation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'technik' | 'dokumente' | 'timeline'>('overview');

  useEffect(() => {
    loadArchiv();
  }, []);

  const loadArchiv = async () => {
    setLoading(true);
    setError(null);
    try {
      const r: any = await apiGet("/archiv");
      setArchived((r?.data || []) as ArchivedInstallation[]);
      setYearStats((r?.yearStats || []) as YearStats[]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Fehler beim Laden des Archivs");
      setArchived([]);
      setYearStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Unique Companies für Filter
  const uniqueCompanies = useMemo(() => {
    const companies = archived
      .map(a => a.createdByCompany)
      .filter((c): c is string => !!c && c.trim() !== "");
    return [...new Set(companies)].sort();
  }, [archived]);

  const filtered = useMemo(() => {
    let result = [...archived];

    // Suche
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(a =>
        (a.publicId || "").toLowerCase().includes(q) ||
        (a.customerName || "").toLowerCase().includes(q) ||
        (a.city || "").toLowerCase().includes(q) ||
        (a.gridOperator || "").toLowerCase().includes(q) ||
        (a.createdByCompany || "").toLowerCase().includes(q)
      );
    }

    // Jahr
    if (yearFilter !== "all") {
      result = result.filter(a => {
        const y = a.timeline?.completed ? new Date(a.timeline.completed).getFullYear() : null;
        return y === yearFilter;
      });
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter(a => {
        const s = (a.status || "").toLowerCase();
        if (statusFilter === "completed") return s.includes("abgeschlossen") || s === "completed";
        if (statusFilter === "cancelled") return s.includes("storniert") || s === "cancelled";
        return true;
      });
    }

    // Firma
    if (companyFilter) {
      result = result.filter(a => a.createdByCompany === companyFilter);
    }

    // Sortierung
    result.sort((a, b) => {
      if (sortBy === "date") return new Date(b.timeline?.completed || 0 as any).getTime() - new Date(a.timeline?.completed || 0 as any).getTime();
      if (sortBy === "kwp") return Number(b.powerKwp || 0) - Number(a.powerKwp || 0);
      if (sortBy === "revenue") return Number(b.revenue || 0) - Number(a.revenue || 0);
      if (sortBy === "name") return (a.customerName || "").localeCompare(b.customerName || "");
      return 0;
    });

    return result;
  }, [archived, query, yearFilter, statusFilter, companyFilter, sortBy]);

  const totalStats = useMemo(() => {
    const total = archived.length;
    const completed = archived.filter(a => (a.status || "").toLowerCase().includes("abgeschlossen")).length;
    const cancelled = archived.filter(a => (a.status || "").toLowerCase().includes("storniert")).length;
    const totalKwp = archived.reduce((s, a) => s + Number(a.powerKwp || 0), 0);
    const totalRevenue = archived.reduce((s, a) => s + Number(a.revenue || 0), 0);
    const avgDuration = total ? Math.round(archived.reduce((s, a) => s + daysBetween(a.timeline?.created, a.timeline?.completed), 0) / total) : 0;
    return { total, completed, cancelled, totalKwp, totalRevenue, avgDuration };
  }, [archived]);

  const openDetail = async (inst: ArchivedInstallation) => {
    setSelectedInst(inst);
    setDetailOpen(true);
    setDetailTab('overview');
    setDetailLoading(true);
    
    try {
      const fullData: any = await apiGet(`/archiv/${inst.id}`);
      setSelectedInst({ ...inst, ...fullData });
    } catch (e) {
      console.error('Detail-Fehler:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setSelectedInst(null), 300);
  };

  // Tech Extract Functions
  const extractPV = (tech: any) => {
    if (tech?.pvEntries?.length > 0) return { entries: tech.pvEntries, hasData: true };
    if (tech?.pv?.manufacturer || tech?.pv?.count > 0) return { entries: [tech.pv], hasData: true };
    return { entries: [], hasData: false };
  };

  const extractInverters = (tech: any) => {
    if (tech?.inverterEntries?.length > 0) return { entries: tech.inverterEntries, hasData: true };
    if (tech?.inverter?.manufacturer || tech?.inverter?.acPowerKw > 0) return { entries: [tech.inverter], hasData: true };
    return { entries: [], hasData: false };
  };

  const extractStorage = (tech: any) => {
    if (tech?.storageEntries?.length > 0) return { entries: tech.storageEntries, hasData: true };
    if (tech?.storage?.enabled || tech?.storage?.capacityKwh > 0) return { entries: [tech.storage], hasData: true };
    return { entries: [], hasData: false };
  };

  const extractWallbox = (tech: any) => {
    if (tech?.wallboxEntries?.length > 0) return { entries: tech.wallboxEntries, hasData: true };
    if (tech?.wallbox?.enabled || tech?.wallbox?.powerKw > 0) return { entries: [tech.wallbox], hasData: true };
    return { entries: [], hasData: false };
  };

  const extractHeatPump = (tech: any) => {
    if (tech?.heatPumpEntries?.length > 0) return { entries: tech.heatPumpEntries, hasData: true };
    if (tech?.heatPump?.enabled || tech?.heatPump?.powerKw > 0) return { entries: [tech.heatPump], hasData: true };
    return { entries: [], hasData: false };
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery("");
    setYearFilter("all");
    setStatusFilter("all");
    setCompanyFilter("");
  };

  const hasFilters = query || yearFilter !== "all" || statusFilter !== "all" || companyFilter;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="archiv-container">
      {/* HEADER */}
      <header className="archiv-header">
        <div className="archiv-header-bg">
          <div className="archiv-orb archiv-orb--1" />
          <div className="archiv-orb archiv-orb--2" />
          <div className="archiv-orb archiv-orb--3" />
        </div>

        <div className="archiv-header-content">
          <div className="archiv-header-left">
            <div className="archiv-header-icon">
              <Archive size={28} />
            </div>
            <div>
              <h1>Archiv</h1>
              <p>Abgeschlossene & stornierte Projekte</p>
            </div>
          </div>
          
          <button className="archiv-refresh-btn" onClick={loadArchiv} disabled={loading}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>

        {/* KPIs - Revenue nur für Staff */}
        <div className="archiv-kpis">
          <div className="archiv-kpi" style={{ '--delay': 0 } as any}>
            <span className="archiv-kpi-value">{totalStats.total}</span>
            <span className="archiv-kpi-label">Gesamt</span>
          </div>
          <div className="archiv-kpi archiv-kpi--green" style={{ '--delay': 1 } as any}>
            <span className="archiv-kpi-value">{totalStats.completed}</span>
            <span className="archiv-kpi-label">Abgeschlossen</span>
          </div>
          <div className="archiv-kpi archiv-kpi--red" style={{ '--delay': 2 } as any}>
            <span className="archiv-kpi-value">{totalStats.cancelled}</span>
            <span className="archiv-kpi-label">Storniert</span>
          </div>
          <div className="archiv-kpi archiv-kpi--yellow" style={{ '--delay': 3 } as any}>
            <span className="archiv-kpi-value">{totalStats.totalKwp.toFixed(1)} <small>kWp</small></span>
            <span className="archiv-kpi-label">Leistung</span>
          </div>
          {/* 🔥 Revenue nur für Staff */}
          {!isSubunternehmer && (
            <div className="archiv-kpi archiv-kpi--green" style={{ '--delay': 4 } as any}>
              <span className="archiv-kpi-value">{formatCurrency(totalStats.totalRevenue)}</span>
              <span className="archiv-kpi-label">Umsatz</span>
            </div>
          )}
          <div className="archiv-kpi" style={{ '--delay': 5 } as any}>
            <span className="archiv-kpi-value">{totalStats.avgDuration} <small>Tage</small></span>
            <span className="archiv-kpi-label">Ø Dauer</span>
          </div>
        </div>
      </header>

      {/* YEAR STATS - Revenue nur für Staff */}
      {yearStats.length > 0 && (
        <div className="archiv-years">
          <div className="archiv-years-header">
            <Calendar size={16} />
            <span>Jahresübersicht</span>
          </div>
          <div className="archiv-years-grid">
            {yearStats.map((ys, i) => (
              <button
                key={ys.year}
                className={`archiv-year-card ${yearFilter === ys.year ? "archiv-year-card--active" : ""}`}
                onClick={() => setYearFilter(yearFilter === ys.year ? "all" : ys.year)}
                style={{ '--delay': i } as any}
              >
                <span className="archiv-year-value">{ys.year}</span>
                <div className="archiv-year-stats">
                  <div>
                    <span>{ys.installations}</span>
                    <small>Projekte</small>
                  </div>
                  <div>
                    <span>{ys.totalKwp.toFixed(0)} kWp</span>
                    <small>Leistung</small>
                  </div>
                  {/* 🔥 Revenue nur für Staff */}
                  {!isSubunternehmer && (
                    <div className="archiv-year-revenue">
                      <span>{formatCurrency(ys.revenue)}</span>
                      <small>Umsatz</small>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="archiv-toolbar">
        <div className="archiv-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Suche nach ID, Kunde, Ort, Netzbetreiber..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="archiv-search-clear" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <select className="archiv-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">Alle Status</option>
          <option value="completed">Abgeschlossen</option>
          <option value="cancelled">Storniert</option>
        </select>

        {/* 🔥 Firmen-Filter für Staff und Kunden */}
        {!isSubunternehmer && uniqueCompanies.length > 0 && (
          <select className="archiv-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="">Alle Firmen</option>
            {uniqueCompanies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        )}

        <select className="archiv-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="date">Nach Datum</option>
          <option value="name">Nach Name</option>
          <option value="kwp">Nach kWp</option>
          {!isSubunternehmer && <option value="revenue">Nach Umsatz</option>}
        </select>

        <div className="archiv-view-toggle">
          <button className={viewMode === "cards" ? "active" : ""} onClick={() => setViewMode("cards")}>
            <LayoutGrid size={16} />
          </button>
          <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
            <List size={16} />
          </button>
        </div>

        {hasFilters && (
          <button className="archiv-clear-btn" onClick={clearFilters}>
            <X size={14} /> Filter löschen
          </button>
        )}

        <span className="archiv-count">{filtered.length} Einträge</span>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="archiv-loading">
          <Loader2 size={48} className="spin" />
          <p>Archiv wird geladen...</p>
        </div>
      ) : error ? (
        <div className="archiv-error">
          <AlertCircle size={48} />
          <p>{typeof error === 'object' ? (error as any)?.message || '' : String(error)}</p>
          <button onClick={loadArchiv}>Erneut versuchen</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="archiv-empty">
          <Archive size={64} />
          <h3>Keine archivierten Projekte</h3>
          <p>{hasFilters ? "Versuche andere Filterkriterien" : "Noch keine abgeschlossenen Projekte vorhanden"}</p>
          {hasFilters && <button onClick={clearFilters}>Filter zurücksetzen</button>}
        </div>
      ) : viewMode === "cards" ? (
        <div className="archiv-cards">
          {filtered.map((inst, i) => {
            const statusInfo = getStatusLabel(inst.status);
            return (
              <div
                key={inst.id}
                className="archiv-card"
                onClick={() => openDetail(inst)}
                style={{ '--delay': Math.min(i, 20) } as any}
              >
                <div className="archiv-card-header">
                  <code className="archiv-card-id">{inst.publicId}</code>
                  <span className="archiv-card-status" style={{ color: statusInfo.color, borderColor: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                
                <h3 className="archiv-card-name">{inst.customerName}</h3>
                
                <div className="archiv-card-meta">
                  <span><MapPin size={12} /> {inst.zip} {inst.city}</span>
                  <span><Building2 size={12} /> {inst.gridOperator || "–"}</span>
                </div>

                <div className="archiv-card-stats">
                  <div className="archiv-card-stat">
                    <Sun size={14} />
                    <span>{Number(inst.powerKwp || 0).toFixed(1)} kWp</span>
                  </div>
                  {/* 🔥 Revenue nur für Staff */}
                  {!isSubunternehmer && inst.revenue && inst.revenue > 0 && (
                    <div className="archiv-card-stat archiv-card-stat--revenue">
                      <TrendingUp size={14} />
                      <span>{formatCurrency(inst.revenue)}</span>
                    </div>
                  )}
                </div>

                {/* 🔥 Erstellt von */}
                {inst.createdByCompany && (
                  <div className="archiv-card-company">
                    <Users size={12} /> {inst.createdByCompany}
                  </div>
                )}

                <div className="archiv-card-footer">
                  <span><Calendar size={12} /> {formatDate(inst.timeline?.completed)}</span>
                  {inst.documentsCount && inst.documentsCount > 0 && (
                    <span><FileText size={12} /> {inst.documentsCount} Dok.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="archiv-list">
          <table className="archiv-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kunde</th>
                <th>Ort</th>
                <th>Netzbetreiber</th>
                <th>kWp</th>
                {!isSubunternehmer && <th>Umsatz</th>}
                <th>Erstellt von</th>
                <th>Status</th>
                <th>Abgeschlossen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst, i) => {
                const statusInfo = getStatusLabel(inst.status);
                return (
                  <tr key={inst.id} onClick={() => openDetail(inst)} style={{ '--delay': Math.min(i, 30) } as any}>
                    <td><code>{inst.publicId}</code></td>
                    <td className="archiv-table-name">{inst.customerName}</td>
                    <td>{inst.zip} {inst.city}</td>
                    <td>{inst.gridOperator || "–"}</td>
                    <td>{Number(inst.powerKwp || 0).toFixed(1)}</td>
                    {!isSubunternehmer && <td className="archiv-table-revenue">{formatCurrency(inst.revenue)}</td>}
                    <td className="archiv-table-company">{inst.createdByCompany || "–"}</td>
                    <td>
                      <span className="archiv-table-status" style={{ color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>{formatDate(inst.timeline?.completed)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailOpen && selectedInst && (
        <div className={`archiv-modal-overlay ${detailOpen ? "open" : ""}`} onClick={closeDetail}>
          <div className="archiv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="archiv-modal-header">
              <div className="archiv-modal-header-left">
                <code className="archiv-modal-id">{selectedInst.publicId}</code>
                <h2>{selectedInst.customerName}</h2>
                <span className="archiv-modal-status" style={{ color: getStatusLabel(selectedInst.status).color }}>
                  {getStatusLabel(selectedInst.status).label}
                </span>
              </div>
              <button className="archiv-modal-close" onClick={closeDetail}>
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="archiv-tabs">
              {(['overview', 'technik', 'dokumente', 'timeline'] as const).map(tab => (
                <button
                  key={tab}
                  className={`archiv-tab ${detailTab === tab ? 'archiv-tab--active' : ''}`}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab === 'overview' && <User size={16} />}
                  {tab === 'technik' && <Zap size={16} />}
                  {tab === 'dokumente' && <FileText size={16} />}
                  {tab === 'timeline' && <Clock size={16} />}
                  <span>
                    {tab === 'overview' ? 'Übersicht' :
                     tab === 'technik' ? 'Technik' :
                     tab === 'dokumente' ? 'Dokumente' : 'Timeline'}
                  </span>
                </button>
              ))}
            </div>

            <div className="archiv-modal-content">
              {detailLoading ? (
                <div className="archiv-detail-loading">
                  <Loader2 size={32} className="spin" />
                  <p>Details werden geladen...</p>
                </div>
              ) : (
                <>
                  {/* OVERVIEW */}
                  {detailTab === 'overview' && (
                    <div className="archiv-detail-grid">
                      {/* Kunde */}
                      <section className="archiv-section" style={{ '--delay': 0 } as any}>
                        <h4><User size={16} /> Kundendaten</h4>
                        <div className="archiv-fields">
                          <Field icon={User} label="Name" value={selectedInst.customerName} />
                          <Field icon={Mail} label="E-Mail" value={selectedInst.customerEmail} />
                          <Field icon={Phone} label="Telefon" value={selectedInst.customerPhone} />
                          <Field icon={Hash} label="Vorgangs-Nr" value={selectedInst.nbCaseNumber} />
                        </div>
                      </section>

                      {/* Standort */}
                      <section className="archiv-section" style={{ '--delay': 1 } as any}>
                        <h4><MapPin size={16} /> Standort</h4>
                        <div className="archiv-fields">
                          <Field icon={Home} label="Straße" value={`${selectedInst.street || ""} ${selectedInst.houseNumber || ""}`.trim()} />
                          <Field icon={MapPin} label="PLZ / Ort" value={`${selectedInst.zip || ""} ${selectedInst.city || ""}`.trim()} highlight />
                        </div>
                      </section>

                      {/* Netzbetreiber */}
                      <section className="archiv-section" style={{ '--delay': 2 } as any}>
                        <h4><Building2 size={16} /> Netzbetreiber</h4>
                        <div className="archiv-fields">
                          <Field icon={Building2} label="Netzbetreiber" value={selectedInst.gridOperator} highlight />
                          <Field icon={Gauge} label="Messkonzept" value={selectedInst.messkonzept} />
                          <Field icon={Cable} label="Zählernummer" value={selectedInst.zaehlernummer} />
                        </div>
                      </section>

                      {/* Anlage */}
                      <section className="archiv-section" style={{ '--delay': 3 } as any}>
                        <h4><Sun size={16} /> Anlagendaten</h4>
                        <div className="archiv-fields">
                          <Field icon={Sun} label="Leistung" value={`${Number(selectedInst.powerKwp || 0).toFixed(2)} kWp`} highlight />
                          {/* 🔥 Revenue nur für Staff */}
                          {!isSubunternehmer && (
                            <Field icon={TrendingUp} label="Umsatz" value={formatCurrency(selectedInst.revenue)} />
                          )}
                          <Field icon={FileText} label="Dokumente" value={`${selectedInst.documentsCount || 0} Dateien`} />
                        </div>
                      </section>

                      {/* Erstellt von */}
                      {selectedInst.createdByCompany && (
                        <section className="archiv-section" style={{ '--delay': 4 } as any}>
                          <h4><Users size={16} /> Erstellt von</h4>
                          <div className="archiv-fields">
                            <Field icon={Building2} label="Firma" value={selectedInst.createdByCompany} highlight />
                            <Field icon={User} label="Bearbeiter" value={selectedInst.createdByName} />
                            <Field icon={Mail} label="E-Mail" value={selectedInst.createdByEmail} />
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  {/* TECHNIK */}
                  {detailTab === 'technik' && (() => {
                    const tech = selectedInst.technicalData || selectedInst.wizardContext?.technical || {};
                    const pv = extractPV(tech);
                    const inverters = extractInverters(tech);
                    const storage = extractStorage(tech);
                    const wallbox = extractWallbox(tech);
                    const heatPump = extractHeatPump(tech);

                    // Calculate total kWp
                    let kwp = Number(selectedInst.powerKwp) || 0;
                    if (!kwp && pv.hasData) {
                      kwp = pv.entries.reduce((sum: number, entry: any) => {
                        const count = Number(entry.count) || 0;
                        const wattPeak = Number(entry.wattPeak) || 0;
                        return sum + (count * wattPeak / 1000);
                      }, 0);
                    }

                    return (
                      <div className="archiv-detail-grid">
                        {/* PV Module */}
                        <section className="archiv-section" style={{ '--delay': 0 } as any}>
                          <h4><Sun size={16} /> PV-Module</h4>
                          {pv.hasData ? (
                            <div className="archiv-tech-list">
                              {pv.entries.map((entry: any, idx: number) => (
                                <TechCard
                                  key={`pv-${idx}`}
                                  icon={<Sun size={24} />}
                                  color="#f59e0b"
                                  rows={[
                                    { label: 'Hersteller', value: entry.manufacturer || '–' },
                                    { label: 'Modell', value: entry.model || '–' },
                                    { label: 'Anzahl', value: `${entry.count || 0} Stück` },
                                    { label: 'Leistung/Modul', value: `${entry.wattPeak || 0} Wp`, highlight: true },
                                  ]}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="archiv-no-data">Keine PV-Daten vorhanden</div>
                          )}
                        </section>

                        {/* Wechselrichter */}
                        <section className="archiv-section" style={{ '--delay': 1 } as any}>
                          <h4><Zap size={16} /> Wechselrichter</h4>
                          {inverters.hasData ? (
                            <div className="archiv-tech-list">
                              {inverters.entries.map((entry: any, idx: number) => (
                                <TechCard
                                  key={`inv-${idx}`}
                                  icon={<Zap size={24} />}
                                  color="#3b82f6"
                                  rows={[
                                    { label: 'Hersteller', value: entry.manufacturer || '–' },
                                    { label: 'Modell', value: entry.model || '–' },
                                    { label: 'AC-Leistung', value: `${entry.acPowerKw || entry.powerKw || 0} kW`, highlight: true },
                                  ]}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="archiv-no-data">Keine Wechselrichter-Daten vorhanden</div>
                          )}
                        </section>

                        {/* Speicher */}
                        <section className="archiv-section" style={{ '--delay': 2 } as any}>
                          <h4><Battery size={16} /> Speicher</h4>
                          {storage.hasData ? (
                            <div className="archiv-tech-list">
                              {storage.entries.map((entry: any, idx: number) => (
                                <TechCard
                                  key={`stor-${idx}`}
                                  icon={<Battery size={24} />}
                                  color="#22c55e"
                                  rows={[
                                    { label: 'Hersteller', value: entry.manufacturer || '–' },
                                    { label: 'Modell', value: entry.model || '–' },
                                    { label: 'Kapazität', value: `${entry.capacityKwh || 0} kWh`, highlight: true },
                                    ...(entry.powerKw ? [{ label: 'Leistung', value: `${entry.powerKw} kW` }] : []),
                                  ]}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="archiv-no-data">Kein Speicher installiert</div>
                          )}
                        </section>

                        {/* Wallbox */}
                        {wallbox.hasData && (
                          <section className="archiv-section" style={{ '--delay': 3 } as any}>
                            <h4><Car size={16} /> Wallbox</h4>
                            <div className="archiv-tech-list">
                              {wallbox.entries.map((entry: any, idx: number) => (
                                <TechCard
                                  key={`wb-${idx}`}
                                  icon={<Car size={24} />}
                                  color="#ec4899"
                                  rows={[
                                    { label: 'Hersteller', value: entry.manufacturer || '–' },
                                    { label: 'Modell', value: entry.model || '–' },
                                    ...(entry.powerKw ? [{ label: 'Leistung', value: `${entry.powerKw} kW` }] : []),
                                  ]}
                                />
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Wärmepumpe */}
                        {heatPump.hasData && (
                          <section className="archiv-section" style={{ '--delay': 4 } as any}>
                            <h4><Thermometer size={16} /> Wärmepumpe</h4>
                            <div className="archiv-tech-list">
                              {heatPump.entries.map((entry: any, idx: number) => (
                                <TechCard
                                  key={`hp-${idx}`}
                                  icon={<Thermometer size={24} />}
                                  color="#f97316"
                                  rows={[
                                    { label: 'Hersteller', value: entry.manufacturer || '–' },
                                    { label: 'Modell', value: entry.model || '–' },
                                    ...(entry.powerKw ? [{ label: 'Leistung', value: `${entry.powerKw} kW` }] : []),
                                    ...(entry.controllable14a ? [{ label: '§14a', value: 'Ja, steuerbar' }] : []),
                                  ]}
                                />
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Gesamt KWP */}
                        <section className="archiv-section archiv-section--full" style={{ '--delay': 5 } as any}>
                          <div className="archiv-kwp-summary">
                            <Sun size={32} />
                            <div>
                              <span className="archiv-kwp-label">Gesamtleistung PV</span>
                              <span className="archiv-kwp-value">{kwp.toFixed(2)} kWp</span>
                            </div>
                          </div>
                        </section>
                      </div>
                    );
                  })()}

                  {/* DOKUMENTE */}
                  {detailTab === 'dokumente' && (
                    <div>
                      {selectedInst.documents && selectedInst.documents.length > 0 ? (
                        <div className="archiv-docs-grid">
                          {selectedInst.documents.map((doc: any, i: number) => (
                            <div key={doc.id || i} className="archiv-doc-card" style={{ '--delay': i } as any}>
                              <div className="archiv-doc-icon">
                                <FileText size={20} />
                              </div>
                              <div className="archiv-doc-info">
                                <span className="archiv-doc-name">{doc.originalName || doc.dateiname || 'Dokument'}</span>
                                <span className="archiv-doc-meta">{doc.kategorie || 'Sonstige'} • {formatDate(doc.createdAt)}</span>
                              </div>
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer" className="archiv-doc-download">
                                  <Download size={18} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="archiv-no-data archiv-no-data--large">
                          <FileText size={48} />
                          <p>Keine Dokumente vorhanden</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TIMELINE */}
                  {detailTab === 'timeline' && (
                    <div className="archiv-timeline">
                      <TimelineItem
                        date={selectedInst.timeline?.created}
                        title="Projekt erstellt"
                        icon={<Hash size={14} />}
                        color="#3b82f6"
                        delay={0}
                      />
                      {selectedInst.timeline?.submitted && (
                        <TimelineItem
                          date={selectedInst.timeline.submitted}
                          title="Bei Netzbetreiber eingereicht"
                          icon={<Building2 size={14} />}
                          color="#f59e0b"
                          delay={1}
                        />
                      )}
                      {selectedInst.timeline?.approved && (
                        <TimelineItem
                          date={selectedInst.timeline.approved}
                          title="Genehmigung erhalten"
                          icon={<CheckCircle2 size={14} />}
                          color="#10b981"
                          delay={2}
                        />
                      )}
                      <TimelineItem
                        date={selectedInst.timeline?.completed}
                        title={getStatusLabel(selectedInst.status).label === "Storniert" ? "Projekt storniert" : "Projekt abgeschlossen"}
                        icon={<CheckCircle2 size={14} />}
                        color={getStatusLabel(selectedInst.status).color}
                        delay={3}
                        isLast
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Field({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: any; highlight?: boolean }) {
  return (
    <div className={`archiv-field ${highlight ? 'archiv-field--highlight' : ''}`}>
      <Icon size={14} className="archiv-field-icon" />
      <div className="archiv-field-content">
        <span className="archiv-field-label">{label}</span>
        <span className="archiv-field-value">{value || '–'}</span>
      </div>
    </div>
  );
}

function TechCard({ icon, color, rows }: { icon: React.ReactNode; color: string; rows: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <div className="archiv-tech-card">
      <div className="archiv-tech-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, boxShadow: `0 10px 30px ${color}40` }}>
        {icon}
      </div>
      <div className="archiv-tech-rows">
        {rows.map((row, i) => (
          <div key={i} className={`archiv-tech-row ${row.highlight ? 'archiv-tech-row--highlight' : ''}`}>
            <span className="archiv-tech-label">{row.label}</span>
            <span className="archiv-tech-value" style={row.highlight ? { color } : undefined}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ date, title, icon, color, delay, isLast }: { date?: string; title: string; icon: React.ReactNode; color: string; delay: number; isLast?: boolean }) {
  if (!date) return null;
  return (
    <div className="archiv-timeline-item" style={{ '--delay': delay, '--color': color } as any}>
      {!isLast && <div className="archiv-timeline-line" />}
      <div className="archiv-timeline-dot">{icon}</div>
      <div className="archiv-timeline-content">
        <span className="archiv-timeline-title">{title}</span>
        <span className="archiv-timeline-date">{formatDateLong(date)}</span>
      </div>
    </div>
  );
}

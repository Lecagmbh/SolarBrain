/**
 * AbrechnungOverview - Abrechnungsübersicht pro Kunde
 * Zeigt für Admin alle Kunden mit ihren Installationen + Rechnungsstatus,
 * für Kunden nur die eigenen Installationen.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Receipt, CheckCircle2, Clock, AlertTriangle, Search,
  ChevronDown, ChevronRight, Loader2, FileText, Zap,
  Users, MapPin, Euro, Filter, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../pages/AuthContext";
import { fetchAbrechnungOverview } from "../../modules/rechnungen/api";
import type { AbrechnungOverviewResp, AbrechnungKunde, AbrechnungInstallation } from "../../modules/rechnungen/types";

type QuickFilter = "all" | "unbilled" | "open" | "paid";

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number.isFinite(n) ? n : 0);
}

function fmt(dt: string | null | undefined) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(dt);
  }
}

const INST_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  EINGANG:     { label: "Eingang",            color: "#64748b", bg: "rgba(100,116,139,0.15)" },
  BEIM_NB:     { label: "Beim Netzbetreiber", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  RUECKFRAGE:  { label: "Rückfrage",          color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  GENEHMIGT:   { label: "Genehmigt",          color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  IBN:         { label: "Inbetriebnahme",     color: "#EAD068", bg: "rgba(139,92,246,0.15)" },
  FERTIG:      { label: "Fertig",             color: "#059669", bg: "rgba(5,150,105,0.15)" },
  STORNIERT:   { label: "Storniert",          color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
};

function getInstStatus(status: string) {
  return INST_STATUS[status] || { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
}

function getRechnungStatusInfo(status: string | undefined) {
  if (!status) return { label: "Nicht abgerechnet", color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
  switch (status.toUpperCase()) {
    case "BEZAHLT": return { label: "Bezahlt", color: "#10b981", bg: "rgba(16,185,129,0.15)" };
    case "OFFEN": case "VERSENDET": return { label: "Offen", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
    case "UEBERFAELLIG": return { label: "Überfällig", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
    case "MAHNUNG": return { label: "Mahnung", color: "#f97316", bg: "rgba(249,115,22,0.15)" };
    case "ENTWURF": return { label: "Entwurf", color: "#64748b", bg: "rgba(100,116,139,0.15)" };
    case "STORNIERT": return { label: "Storniert", color: "#6b7280", bg: "rgba(107,114,128,0.15)" };
    default: return { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    padding: "1.5rem 2rem",
    minHeight: "100%",
    color: "#e4e4e7",
    fontFamily: "'Inter', -apple-system, sans-serif",
  } as React.CSSProperties,

  // KPI Bar
  kpiBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  } as React.CSSProperties,

  kpiCard: (accent: string) => ({
    background: "#12121a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
    borderTop: `3px solid ${accent}`,
  }),

  kpiLabel: {
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,

  kpiValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f4f4f5",
  } as React.CSSProperties,

  kpiSub: {
    fontSize: "0.75rem",
    color: "#a1a1aa",
  } as React.CSSProperties,

  // Toolbar
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  searchWrap: {
    position: "relative" as const,
    flex: "1 1 260px",
    maxWidth: "380px",
  } as React.CSSProperties,

  searchInput: {
    width: "100%",
    padding: "0.5rem 0.75rem 0.5rem 2.25rem",
    background: "#12121a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#e4e4e7",
    fontSize: "0.8125rem",
    outline: "none",
  } as React.CSSProperties,

  searchIcon: {
    position: "absolute" as const,
    left: "0.625rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#52525b",
    pointerEvents: "none" as const,
  } as React.CSSProperties,

  chip: (active: boolean) => ({
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid " + (active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"),
    background: active ? "rgba(16,185,129,0.12)" : "transparent",
    color: active ? "#10b981" : "#a1a1aa",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap" as const,
  }),

  refreshBtn: {
    padding: "0.375rem",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#a1a1aa",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  // Customer Card
  customerCard: {
    background: "#12121a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    marginBottom: "0.75rem",
    overflow: "hidden",
    transition: "border-color 0.15s ease",
  } as React.CSSProperties,

  customerHeader: (hasUnbilled: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1.25rem",
    cursor: "pointer",
    userSelect: "none" as const,
    borderLeft: hasUnbilled ? "3px solid #f59e0b" : "3px solid transparent",
    transition: "background 0.15s ease",
  }),

  customerName: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#f4f4f5",
    flex: 1,
  } as React.CSSProperties,

  customerFirma: {
    fontSize: "0.75rem",
    color: "#71717a",
    marginLeft: "0.5rem",
    fontWeight: 400,
  } as React.CSSProperties,

  customerStats: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    fontSize: "0.75rem",
  } as React.CSSProperties,

  statBadge: (color: string, bg: string) => ({
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: 600,
    color,
    background: bg,
  }),

  // Installations Table
  tableWrap: {
    padding: "0 1.25rem 1rem",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.8rem",
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const,
    padding: "0.5rem 0.75rem",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  td: {
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    color: "#d4d4d8",
    verticalAlign: "middle" as const,
  } as React.CSSProperties,

  badge: (color: string, bg: string) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: 600,
    color,
    background: bg,
    whiteSpace: "nowrap" as const,
  }),

  link: {
    color: "#60a5fa",
    textDecoration: "none",
    fontSize: "0.8rem",
    cursor: "pointer",
  } as React.CSSProperties,

  // Loading & Empty
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    color: "#71717a",
  } as React.CSSProperties,

  empty: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#71717a",
  } as React.CSSProperties,
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function KpiBar({ summary }: { summary: AbrechnungOverviewResp["totalSummary"] }) {
  const billingRate = summary.totalInstallations > 0
    ? Math.round((summary.billedCount / summary.totalInstallations) * 100)
    : 0;

  return (
    <div style={S.kpiBar}>
      <div style={S.kpiCard("#3b82f6")}>
        <span style={S.kpiLabel}>Installationen</span>
        <span style={S.kpiValue}>{summary.totalInstallations}</span>
        <span style={S.kpiSub}>{summary.totalCustomers} Kunden</span>
      </div>
      <div style={S.kpiCard("#10b981")}>
        <span style={S.kpiLabel}>Abgerechnet</span>
        <span style={S.kpiValue}>{summary.billedCount}</span>
        <span style={S.kpiSub}>{billingRate}% Quote</span>
      </div>
      <div style={S.kpiCard("#f59e0b")}>
        <span style={S.kpiLabel}>Offen / Nicht abgerechnet</span>
        <span style={S.kpiValue}>{summary.unbilledCount}</span>
        <span style={S.kpiSub}>{money(summary.openBrutto)} offen</span>
      </div>
      <div style={S.kpiCard("#EAD068")}>
        <span style={S.kpiLabel}>Gesamtvolumen</span>
        <span style={S.kpiValue}>{money(summary.totalBrutto)}</span>
        <span style={S.kpiSub}>{money(summary.paidBrutto)} bezahlt</span>
      </div>
    </div>
  );
}

function InstallationsTable({ installations, isKunde, showKunde = true }: { installations: AbrechnungInstallation[]; isKunde: boolean; showKunde?: boolean }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>ID</th>
            {showKunde && <th style={S.th}>Kunde</th>}
            <th style={S.th}>Status</th>
            <th style={S.th}>Standort</th>
            <th style={S.th}>kWp</th>
            <th style={S.th}>Rechnung</th>
            <th style={S.th}>Rechnungsstatus</th>
            <th style={{ ...S.th, textAlign: "right" }}>Betrag</th>
          </tr>
        </thead>
        <tbody>
          {installations.map((inst) => {
            const iStatus = getInstStatus(inst.status);
            const rStatus = getRechnungStatusInfo(inst.rechnungGestellt ? inst.rechnung?.status : undefined);
            return (
              <tr key={inst.id} style={{ transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={S.td}>
                  <span style={{ fontFamily: "monospace", color: "#60a5fa", fontSize: "0.8rem" }}>{inst.publicId}</span>
                </td>
                {showKunde && (
                  <td style={S.td}>
                    <span style={{ fontWeight: 500, color: "#f4f4f5" }}>{inst.customerName}</span>
                  </td>
                )}
                <td style={S.td}>
                  <span style={S.badge(iStatus.color, iStatus.bg)}>
                    {iStatus.label}
                  </span>
                </td>
                <td style={S.td}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <MapPin size={12} style={{ color: "#52525b" }} />
                    {inst.standort}
                  </span>
                </td>
                <td style={S.td}>
                  {inst.totalKwp ? `${inst.totalKwp.toFixed(1)} kWp` : "—"}
                </td>
                <td style={S.td}>
                  {inst.rechnung && inst.rechnung.id > 0 ? (
                    <span style={S.link}>{inst.rechnung.nummer}</span>
                  ) : inst.rechnungGestellt ? (
                    <span style={{ color: "#a1a1aa" }}>{inst.rechnung?.nummer || "—"}</span>
                  ) : (
                    <span style={{ color: "#52525b", fontStyle: "italic" }}>—</span>
                  )}
                </td>
                <td style={S.td}>
                  <span style={S.badge(rStatus.color, rStatus.bg)}>
                    {inst.rechnungGestellt ? (
                      rStatus.label
                    ) : (
                      <><AlertTriangle size={10} /> Nicht abgerechnet</>
                    )}
                  </span>
                </td>
                <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {inst.rechnung ? money(inst.rechnung.betragBrutto) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CustomerCard({ kunde, isKunde }: { kunde: AbrechnungKunde; isKunde: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasUnbilled = kunde.summary.unbilledCount > 0;

  return (
    <div style={{
      ...S.customerCard,
      borderColor: expanded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
    }}>
      <div
        style={S.customerHeader(hasUnbilled)}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {expanded ? <ChevronDown size={16} style={{ color: "#71717a" }} /> : <ChevronRight size={16} style={{ color: "#71717a" }} />}
        <span style={S.customerName}>
          {kunde.kundeName}
          {kunde.firmenName && <span style={S.customerFirma}>({kunde.firmenName})</span>}
        </span>

        <div style={S.customerStats}>
          <span style={S.statBadge("#3b82f6", "rgba(59,130,246,0.12)")}>
            {kunde.summary.totalInstallations} Inst.
          </span>
          {kunde.summary.billedCount > 0 && (
            <span style={S.statBadge("#10b981", "rgba(16,185,129,0.12)")}>
              <CheckCircle2 size={10} /> {kunde.summary.billedCount} abgerechnet
            </span>
          )}
          {kunde.summary.unbilledCount > 0 && (
            <span style={S.statBadge("#f59e0b", "rgba(245,158,11,0.12)")}>
              <AlertTriangle size={10} /> {kunde.summary.unbilledCount} offen
            </span>
          )}
          <span style={{ color: "#a1a1aa", fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>
            {money(kunde.summary.totalBrutto)}
          </span>
        </div>
      </div>

      {expanded && (
        <InstallationsTable installations={kunde.installations} isKunde={isKunde} showKunde={false} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AbrechnungOverview() {
  const { user } = useAuth();
  const isKunde = (user?.role || "").toLowerCase() === "kunde";

  const [data, setData] = useState<AbrechnungOverviewResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetchAbrechnungOverview();
      setData(resp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Filter + Search
  const filtered = useMemo(() => {
    if (!data) return [];
    let customers = data.customers;

    // Quick filter
    if (quickFilter === "unbilled") {
      customers = customers.filter(c => c.summary.unbilledCount > 0);
    } else if (quickFilter === "open") {
      customers = customers.filter(c =>
        c.installations.some(i => i.rechnung && ["OFFEN", "VERSENDET", "UEBERFAELLIG", "MAHNUNG"].includes(i.rechnung.status))
      );
    } else if (quickFilter === "paid") {
      customers = customers.filter(c =>
        c.installations.some(i => i.rechnung?.status === "BEZAHLT")
      );
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      customers = customers.filter(c =>
        c.kundeName.toLowerCase().includes(q) ||
        (c.firmenName || "").toLowerCase().includes(q) ||
        c.installations.some(i =>
          i.publicId.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.standort.toLowerCase().includes(q) ||
          (i.rechnung?.nummer || "").toLowerCase().includes(q)
        )
      );
    }

    return customers;
  }, [data, quickFilter, search]);

  // Filtered summary
  const filteredSummary = useMemo(() => {
    if (!filtered.length) return data?.totalSummary || { totalCustomers: 0, totalInstallations: 0, billedCount: 0, unbilledCount: 0, totalBrutto: 0, openBrutto: 0, paidBrutto: 0 };
    return {
      totalCustomers: filtered.length,
      totalInstallations: filtered.reduce((s, c) => s + c.summary.totalInstallations, 0),
      billedCount: filtered.reduce((s, c) => s + c.summary.billedCount, 0),
      unbilledCount: filtered.reduce((s, c) => s + c.summary.unbilledCount, 0),
      totalBrutto: filtered.reduce((s, c) => s + c.summary.totalBrutto, 0),
      openBrutto: filtered.reduce((s, c) => s + c.summary.openBrutto, 0),
      paidBrutto: filtered.reduce((s, c) => s + c.summary.paidBrutto, 0),
    };
  }, [filtered, data]);

  if (loading && !data) {
    return (
      <div style={S.center}>
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.center}>
        <div style={{ textAlign: "center" }}>
          <AlertTriangle size={32} style={{ color: "#ef4444", marginBottom: "0.5rem" }} />
          <p style={{ color: "#ef4444" }}>{error}</p>
          <button onClick={load} style={{ ...S.refreshBtn, marginTop: "1rem", padding: "0.5rem 1rem" }}>
            <RefreshCw size={14} /> Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* KPI Bar */}
      <KpiBar summary={filteredSummary} />

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <Search size={16} style={S.searchIcon} />
          <input
            type="text"
            placeholder="Suche nach Kunde, Installation, Ort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={S.searchInput}
          />
        </div>

        <div style={{ display: "flex", gap: "0.375rem" }}>
          {([
            { id: "all", label: "Alle" },
            { id: "unbilled", label: "Nicht abgerechnet" },
            { id: "open", label: "Offene Posten" },
            { id: "paid", label: "Bezahlt" },
          ] as { id: QuickFilter; label: string }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id)}
              style={S.chip(quickFilter === f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button onClick={handleRefresh} style={S.refreshBtn} title="Aktualisieren">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={S.empty}>
          <FileText size={40} style={{ color: "#3f3f46", marginBottom: "0.75rem" }} />
          <p style={{ fontSize: "0.875rem" }}>
            {search || quickFilter !== "all"
              ? "Keine Ergebnisse für diese Filtereinstellungen."
              : "Keine Abrechnungsdaten vorhanden."}
          </p>
        </div>
      ) : isKunde ? (
        // Kunde: Flat list without customer grouping
        <div style={S.customerCard}>
          <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f4f4f5" }}>
              Meine Installationen
            </span>
          </div>
          <InstallationsTable
            installations={filtered.flatMap(c => c.installations)}
            isKunde={isKunde}
            showKunde={false}
          />
        </div>
      ) : (
        // Admin: Grouped by customer
        filtered.map((kunde) => (
          <CustomerCard key={kunde.kundeId} kunde={kunde} isKunde={isKunde} />
        ))
      )}
    </div>
  );
}

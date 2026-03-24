/**
 * HV DASHBOARD TAB
 * Overview with KPI cards and recent provisionen table
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  Banknote,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Search,
  UserCheck,
  UserX,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../../modules/api/client";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

/* ── Types ── */

interface ProvisionStatusSummary {
  status: string;
  count: number;
  betrag: number;
}

interface RecentProvision {
  id: number;
  rechnungNr: string;
  kundeName: string;
  betrag: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  kundenCount: number;
  statusSummary: ProvisionStatusSummary[];
  recentProvisionen: RecentProvision[];
}


/* ── Constants ── */

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  OFFEN: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  FREIGEGEBEN: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  AUSGEZAHLT: { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  STORNIERT: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
};

const formatEur = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "-";

/* ── Styles ── */

const styles: Record<string, CSSProperties> = {
  outerContainer: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  tabHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabTitle: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    color: "#ffffff",
  },
  tabTitleH2: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  tabTitleP: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#71717a",
  },
  btnRefresh: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  kpiCard: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  kpiIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  kpiLabel: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#71717a",
    fontWeight: 500,
  },
  tableContainer: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  tableTitle: {
    padding: "16px 20px",
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  dataTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.25rem 0.625rem",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  loadingCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "3rem",
    color: "#71717a",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "hvDashSpin 1s linear infinite",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#fca5a5",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#71717a",
  },
};

const checkInputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "10px",
  color: "#e2e8f0",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box",
};

const checkExistsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 14px",
  background: "rgba(245, 158, 11, 0.08)",
  border: "1px solid rgba(245, 158, 11, 0.25)",
  borderRadius: "10px",
  color: "#f59e0b",
  fontSize: "0.83rem",
};

const checkFreeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 14px",
  background: "rgba(16, 185, 129, 0.08)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
  borderRadius: "10px",
  color: "#10b981",
  fontSize: "0.83rem",
};

/* ── Component ── */

export function HvDashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bestandskunden-Check
  const [checkQuery, setCheckQuery] = useState("");
  const [checkExists, setCheckExists] = useState<boolean | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doKundenCheck = useCallback(async (q: string) => {
    if (q.length < 3) {
      setCheckExists(null);
      return;
    }
    setCheckLoading(true);
    try {
      const res = await api.get(`/hv/kunden-check?q=${encodeURIComponent(q)}`);
      setCheckExists(res.data?.data?.exists ?? false);
    } catch {
      setCheckExists(null);
    } finally {
      setCheckLoading(false);
    }
  }, []);

  const handleCheckInput = (value: string) => {
    setCheckQuery(value);
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    if (value.trim().length < 3) {
      setCheckExists(null);
      return;
    }
    checkTimeout.current = setTimeout(() => doKundenCheck(value.trim()), 400);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/hv/dashboard");
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Fehler beim Laden des Dashboards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getStatusSummary = (status: string): ProvisionStatusSummary => {
    return data?.statusSummary?.find((s) => s.status === status) || { status, count: 0, betrag: 0 };
  };

  const kpiItems = [
    {
      label: "Kunden",
      value: data?.kundenCount?.toString() || "0",
      icon: Users,
      color: "#D4A843",
      bg: "rgba(212, 168, 67, 0.15)",
    },
    {
      label: "Offene Provisionen",
      value: formatEur(getStatusSummary("OFFEN").betrag),
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.15)",
    },
    {
      label: "Freigegebene",
      value: formatEur(getStatusSummary("FREIGEGEBEN").betrag),
      icon: CheckCircle,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.15)",
    },
    {
      label: "Ausgezahlt Gesamt",
      value: formatEur(getStatusSummary("AUSGEZAHLT").betrag),
      icon: Banknote,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.15)",
    },
  ];

  return (
    <div style={styles.outerContainer}>
      {/* Keyframe for spinner */}
      <style>{`@keyframes hvDashSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>HV Dashboard</h2>
            <p style={styles.tabTitleP}>
              Uebersicht Ihrer Kunden, Provisionen und Auszahlungen
            </p>
          </div>
        </div>
        <button style={styles.btnRefresh} onClick={fetchDashboard} title="Aktualisieren">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{safeString(error)}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCenter}>
          <div style={styles.spinner} />
          <span>Dashboard wird geladen...</span>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && data && (
        <>
          <div style={styles.kpiGrid}>
            {kpiItems.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} style={styles.kpiCard}>
                  <div
                    style={{
                      ...styles.kpiIconWrap,
                      background: kpi.bg,
                      color: kpi.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <p style={styles.kpiValue}>{kpi.value}</p>
                  <p style={styles.kpiLabel}>{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Partner-Info Banner */}
          <Link
            to="/partner"
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 20px",
              background: "linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(212, 168, 67, 0.1))",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "16px",
              textDecoration: "none",
              color: "#e2e8f0",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
                flexShrink: 0,
              }}
            >
              <ExternalLink size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "2px" }}>
                Partner-Seite: Preise, Ablauf & Unterlagen
              </div>
              <div style={{ fontSize: "0.8rem", color: "#71717a" }}>
                Alle Infos zum Partnerprogramm auf einen Blick — ideal zum Weiterleiten an Interessenten.
              </div>
            </div>
            <ExternalLink size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
          </Link>

          {/* Bestandskunden-Check */}
          <div style={styles.tableContainer}>
            <h3 style={styles.tableTitle}>
              <Search
                size={16}
                style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }}
              />
              Bestandskunden-Check
            </h3>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={checkQuery}
                  onChange={(e) => handleCheckInput(e.target.value)}
                  placeholder="Name, Firma oder E-Mail eingeben (min. 3 Zeichen)..."
                  style={checkInputStyle}
                />
                {checkLoading && (
                  <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                    <div style={styles.spinner} />
                  </div>
                )}
              </div>

              {checkExists !== null && (
                <div style={{ marginTop: "12px" }}>
                  {checkExists ? (
                    <div style={checkExistsStyle}>
                      <UserCheck size={18} />
                      <span>Ist bereits als Kunde im System vorhanden.</span>
                    </div>
                  ) : (
                    <div style={checkFreeStyle}>
                      <UserX size={18} />
                      <span>Kein Bestandskunde gefunden — kann als neuer Kunde angelegt werden.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Provisionen Table */}
          <div style={styles.tableContainer}>
            <h3 style={styles.tableTitle}>
              <TrendingUp
                size={16}
                style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }}
              />
              Letzte Provisionen
            </h3>
            <table style={styles.dataTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Datum</th>
                  <th style={styles.th}>Kunde</th>
                  <th style={styles.th}>Rechnung</th>
                  <th style={styles.th}>Betrag</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentProvisionen && data.recentProvisionen.length > 0 ? (
                  data.recentProvisionen.slice(0, 10).map((p) => {
                    const sc = STATUS_COLORS[p.status] || { color: "#71717a", bg: "rgba(113,113,122,0.15)" };
                    return (
                      <tr key={p.id}>
                        <td style={styles.td}>{formatDate(p.createdAt)}</td>
                        <td style={styles.td}>{p.kundeName}</td>
                        <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {p.rechnungNr}
                        </td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{formatEur(p.betrag)}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              color: sc.color,
                              background: sc.bg,
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={styles.emptyState}>
                      Keine Provisionen vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default HvDashboardTab;

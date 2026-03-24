/**
 * ADMIN PROVISIONEN PAGE
 * Manage provisionen across all Handelsvertreter.
 * Features: Summary cards, filters, batch freigeben, auszahlung creation.
 * Access: ADMIN only.
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { api } from "../../../modules/api/client";

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

interface HvSummary {
  id: number;
  firmenName: string | null;
  user: { id: number; name: string | null; email: string };
}

interface ProvisionRecord {
  id: number;
  rechnungNr: string | null;
  nettoBetrag: number;
  provisionsSatz: number;
  betrag: number;
  status: string;
  splitType?: string; // BASE, OVERRIDE_L2, OVERRIDE_L1
  hvLevel?: number; // 1, 2, 3
  createdAt: string;
  handelsvertreter?: { id: number; firmenName: string | null; hvLevel?: number; user: { name: string | null } };
  kunde?: { id: number; name: string };
}

interface SummaryBucket {
  status: string;
  count: number;
  betrag: number;
}

/* ══════════════════════════════════════════════════════════════════════════
   API
   ══════════════════════════════════════════════════════════════════════════ */

const provApi = {
  getAll: (params?: Record<string, string>) =>
    api.get("/admin/provisionen", { params }).then((r) => r.data),
  getSummary: () =>
    api.get("/admin/provisionen/summary").then((r) => r.data),
  batchFreigeben: (ids: number[]) =>
    api.post("/admin/provisionen/batch-freigeben", { ids }).then((r) => r.data),
  getHvList: () =>
    api.get("/admin/hv", { params: { limit: "500" } }).then((r) => r.data),
  getFreigegebeneForHv: (hvId: number) =>
    api.get(`/admin/hv/${hvId}/provisionen`, { params: { status: "FREIGEGEBEN" } }).then((r) => r.data),
  createAuszahlung: (hvId: number, provisionIds: number[]) =>
    api.post(`/admin/hv/${hvId}/auszahlungen`, { provisionIds }).then((r) => r.data),
};

/* ══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ══════════════════════════════════════════════════════════════════════════ */

const s = {
  page: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h2: { margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "#fff" },
  subtitle: { margin: 0, fontSize: "0.875rem", color: "#71717a" },

  /* Summary cards */
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  },
  summaryCard: (borderColor: string) => ({
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderLeft: `4px solid ${borderColor}`,
    borderRadius: "12px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  }),
  summaryLabel: { fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  summaryValue: { fontSize: "1.5rem", fontWeight: 700, color: "#fff" },
  summaryCount: { fontSize: "0.8rem", color: "#71717a" },

  /* Filters */
  filterRow: { display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, alignItems: "center" },
  filterSelect: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    minWidth: "140px",
    colorScheme: "dark",
    WebkitAppearance: "none" as any,
    appearance: "none" as any,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    paddingRight: "2rem",
  },
  dateInput: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    colorScheme: "dark",
  },

  /* Table */
  tableContainer: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    padding: "10px 16px",
    textAlign: "left" as const,
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  badge: (color: string, bg: string) => ({
    display: "inline-flex",
    padding: "0.25rem 0.625rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color,
    background: bg,
  }),
  loading: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#71717a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  },
  empty: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#71717a",
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#fca5a5",
  },

  /* Batch bar */
  batchBar: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    background: "rgba(212,168,67,0.1)",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#a5b4fc",
    fontSize: "0.875rem",
  },

  /* Buttons */
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    border: "none",
    color: "#ffffff",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  btnSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    color: "#ffffff",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    color: "#71717a",
    fontSize: "0.875rem",
  },
  paginationBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },

  /* Modal */
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    background: "#1a1a2e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  modalH3: { margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "#ffffff" },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    padding: "0.25rem",
    display: "flex",
    alignItems: "center",
    fontSize: "1.25rem",
  },
  modalBody: { padding: "1.5rem" },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  successHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(16,185,129,0.1)",
  },
  successH3: { margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "#10b981" },
  formGroup: { marginBottom: "1.25rem" },
  formLabel: { display: "block", fontSize: "0.875rem", color: "#a1a1aa", marginBottom: "0.5rem" },
  checkbox: { marginRight: "0.5rem", accentColor: "#D4A843" },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(212,168,67,0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "provSpin 1s linear infinite",
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export function ProvisionenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Data
  const [provisionen, setProvisionen] = useState<ProvisionRecord[]>([]);
  const [summary, setSummary] = useState<SummaryBucket[]>([]);
  const [hvList, setHvList] = useState<HvSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [hvFilter, setHvFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Verrechnung result
  const [verrechnungResult, setVerrechnungResult] = useState<Array<{ hvId: number; hvName: string; betrag: number; provisionen: number; rechnungen: number }> | null>(null);

  // Auszahlung modal
  const [showAuszahlung, setShowAuszahlung] = useState(false);
  const [azStep, setAzStep] = useState<1 | 2>(1);
  const [azHvId, setAzHvId] = useState<number | null>(null);
  const [azProvisionen, setAzProvisionen] = useState<ProvisionRecord[]>([]);
  const [azSelected, setAzSelected] = useState<Set<number>>(new Set());
  const [azLoading, setAzLoading] = useState(false);
  const [azSuccess, setAzSuccess] = useState<string | null>(null);
  const [azError, setAzError] = useState<string | null>(null);

  /* ── Helpers ── */
  const fmtEur = (v: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getBucket = (status: string) => {
    const b = summary.find((s) => s.status === status);
    return { count: b?.count || 0, betrag: b?.betrag || 0 };
  };

  /* ── Fetch ── */
  const fetchProvisionen = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
      };
      if (statusFilter) params.status = statusFilter;
      if (hvFilter) params.hvId = hvFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await provApi.getAll(params);
      setProvisionen(res.data || []);
      if (res.pagination) setPagination((p) => ({ ...p, ...res.pagination }));
    } catch (err: any) {
      setError(err.response?.data?.error || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, hvFilter, dateFrom, dateTo]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await provApi.getSummary();
      setSummary(res.data || res || []);
    } catch {
      // silent
    }
  }, []);

  const fetchHvList = useCallback(async () => {
    try {
      const res = await provApi.getHvList();
      setHvList(res.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProvisionen();
  }, [fetchProvisionen]);

  useEffect(() => {
    fetchSummary();
    fetchHvList();
  }, [fetchSummary, fetchHvList]);

  /* ── Selection ── */
  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === provisionen.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(provisionen.map((p) => p.id)));
    }
  };

  /* ── Batch freigeben ── */
  const handleBatchFreigeben = async () => {
    if (selected.size === 0) return;
    try {
      setLoading(true);
      setVerrechnungResult(null);
      const res = await provApi.batchFreigeben(Array.from(selected));
      setSelected(new Set());
      // Zeige Verrechnung-Ergebnis wenn es automatische Verrechnungen gab
      if (res.data?.verrechnungen?.length > 0) {
        setVerrechnungResult(res.data.verrechnungen);
      }
      await Promise.all([fetchProvisionen(), fetchSummary()]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Fehler bei Batch-Freigabe");
    } finally {
      setLoading(false);
    }
  };

  /* ── Auszahlung modal ── */
  const openAuszahlungModal = () => {
    setShowAuszahlung(true);
    setAzStep(1);
    setAzHvId(null);
    setAzProvisionen([]);
    setAzSelected(new Set());
    setAzSuccess(null);
    setAzError(null);
  };

  const closeAuszahlungModal = () => {
    setShowAuszahlung(false);
    if (azSuccess) {
      fetchProvisionen();
      fetchSummary();
    }
  };

  const handleAzSelectHv = async (hvId: number) => {
    setAzHvId(hvId);
    setAzStep(2);
    setAzLoading(true);
    try {
      const res = await provApi.getFreigegebeneForHv(hvId);
      const data = res.data || [];
      setAzProvisionen(data);
      setAzSelected(new Set(data.map((p: ProvisionRecord) => p.id)));
    } catch {
      setAzError("Fehler beim Laden der Provisionen");
    } finally {
      setAzLoading(false);
    }
  };

  const toggleAzSelect = (id: number) => {
    setAzSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const azTotal = azProvisionen
    .filter((p) => azSelected.has(p.id))
    .reduce((sum, p) => sum + p.betrag, 0);

  const handleCreateAuszahlung = async () => {
    if (!azHvId || azSelected.size === 0) return;
    try {
      setAzLoading(true);
      setAzError(null);
      const res = await provApi.createAuszahlung(azHvId, Array.from(azSelected));
      const nr = res.data?.auszahlungsNummer || res.auszahlungsNummer || "OK";
      setAzSuccess(nr);
    } catch (err: any) {
      setAzError(err.response?.data?.error || "Fehler beim Erstellen der Auszahlung");
    } finally {
      setAzLoading(false);
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  const offen = getBucket("OFFEN");
  const freigegeben = getBucket("FREIGEGEBEN");
  const ausgezahlt = getBucket("AUSGEZAHLT");

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={s.page} className="prov-page">
      <style>{`
        @keyframes provSpin { to { transform: rotate(360deg) } }
        .prov-page select option {
          background: #1a1a2e;
          color: #e2e8f0;
          padding: 8px 12px;
        }
        .prov-page select option:hover,
        .prov-page select option:checked {
          background: rgba(212, 168, 67, 0.2);
          color: #fff;
        }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.h2}>Provisionen Verwaltung</h2>
          <p style={s.subtitle}>Alle Provisionen verwalten, freigeben und auszahlen</p>
        </div>
        <button style={s.btnSuccess} onClick={openAuszahlungModal}>
          Auszahlung erstellen
        </button>
      </div>

      {/* Summary Cards */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard("#f59e0b")}>
          <span style={s.summaryLabel}>Offen</span>
          <span style={s.summaryValue}>{fmtEur(offen.betrag)}</span>
          <span style={s.summaryCount}>{offen.count} Provisionen</span>
        </div>
        <div style={s.summaryCard("#3b82f6")}>
          <span style={s.summaryLabel}>Freigegeben</span>
          <span style={s.summaryValue}>{fmtEur(freigegeben.betrag)}</span>
          <span style={s.summaryCount}>{freigegeben.count} Provisionen</span>
        </div>
        <div style={s.summaryCard("#10b981")}>
          <span style={s.summaryLabel}>Ausgezahlt</span>
          <span style={s.summaryValue}>{fmtEur(ausgezahlt.betrag)}</span>
          <span style={s.summaryCount}>{ausgezahlt.count} Provisionen</span>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <select
          style={s.filterSelect}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <option value="">Alle Status</option>
          <option value="OFFEN">Offen</option>
          <option value="FREIGEGEBEN">Freigegeben</option>
          <option value="AUSGEZAHLT">Ausgezahlt</option>
          <option value="STORNIERT">Storniert</option>
        </select>

        <select
          style={s.filterSelect}
          value={hvFilter}
          onChange={(e) => { setHvFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <option value="">Alle HV</option>
          {hvList.map((hv) => (
            <option key={hv.id} value={String(hv.id)}>
              {hv.user?.name || hv.firmenName || `HV #${hv.id}`}
            </option>
          ))}
        </select>

        <input
          style={s.dateInput}
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          title="Von"
        />
        <input
          style={s.dateInput}
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          title="Bis"
        />
      </div>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div style={s.batchBar}>
          <span>{selected.size} ausgewaehlt</span>
          <button style={s.btnPrimary} onClick={handleBatchFreigeben}>
            Ausgewaehlte freigeben
          </button>
          <button
            style={s.btnSecondary}
            onClick={() => setSelected(new Set())}
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div style={s.error}>{safeString(error)}</div>}

      {/* Verrechnung Result */}
      {verrechnungResult && verrechnungResult.length > 0 && (
        <div style={{
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 600, color: "#10b981", fontSize: "0.9rem" }}>
              Automatische Verrechnung durchgeführt
            </span>
            <button
              style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: "1.1rem" }}
              onClick={() => setVerrechnungResult(null)}
            >&times;</button>
          </div>
          {verrechnungResult.map(v => (
            <div key={v.hvId} style={{
              display: "flex", gap: "1.5rem", alignItems: "center",
              padding: "0.5rem 0", fontSize: "0.85rem", color: "#e2e8f0",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontWeight: 600 }}>{v.hvName}</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>{fmtEur(v.betrag)} verrechnet</span>
              <span style={{ color: "#71717a" }}>{v.provisionen} Provision(en) → {v.rechnungen} Rechnung(en) bezahlt</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: "40px" }}>
                <input
                  type="checkbox"
                  style={s.checkbox}
                  checked={provisionen.length > 0 && selected.size === provisionen.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th style={s.th}>Rechnung</th>
              <th style={s.th}>HV</th>
              <th style={s.th}>Kunde</th>
              <th style={s.th}>Netto</th>
              <th style={s.th}>Satz</th>
              <th style={s.th}>Provision</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={s.loading}>
                  <div style={s.spinner} /> Laden...
                </td>
              </tr>
            ) : provisionen.length === 0 ? (
              <tr>
                <td colSpan={9} style={s.empty}>Keine Provisionen gefunden</td>
              </tr>
            ) : (
              provisionen.map((p) => (
                <tr key={p.id}>
                  <td style={s.td}>
                    <input
                      type="checkbox"
                      style={s.checkbox}
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td style={s.td}>{p.rechnungNr || "-"}</td>
                  <td style={s.td}>{p.handelsvertreter?.user?.name || p.handelsvertreter?.firmenName || "-"}</td>
                  <td style={s.td}>{p.kunde?.name || "-"}</td>
                  <td style={s.td}>{fmtEur(p.nettoBetrag)}</td>
                  <td style={s.td}>{p.provisionsSatz}%</td>
                  <td style={{ ...s.td, fontWeight: 600, color: "#fff" }}>{fmtEur(p.betrag)}</td>
                  <td style={s.td}>
                    <span style={
                      p.status === "OFFEN" ? s.badge("#f59e0b", "rgba(245,158,11,0.15)") :
                      p.status === "FREIGEGEBEN" ? s.badge("#3b82f6", "rgba(59,130,246,0.15)") :
                      p.status === "AUSGEZAHLT" ? s.badge("#10b981", "rgba(16,185,129,0.15)") :
                      s.badge("#ef4444", "rgba(239,68,68,0.15)")
                    }>
                      {p.status}
                    </span>
                  </td>
                  <td style={s.td}>{fmtDate(p.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={s.pagination}>
            <button
              style={s.paginationBtn}
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Zurueck
            </button>
            <span>Seite {pagination.page} von {pagination.totalPages}</span>
            <button
              style={s.paginationBtn}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Weiter
            </button>
          </div>
        )}
      </div>

      {/* ═══ Auszahlung Modal ═══ */}
      {showAuszahlung && (
        <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeAuszahlungModal(); }}>
          <div style={s.modal}>
            {azSuccess ? (
              /* Success */
              <>
                <div style={s.successHeader}>
                  <h3 style={s.successH3}>Auszahlung erstellt</h3>
                  <button style={s.modalClose} onClick={closeAuszahlungModal}>&times;</button>
                </div>
                <div style={s.modalBody}>
                  <p style={{ color: "#a1a1aa", margin: "0 0 0.5rem 0" }}>
                    Die Auszahlung wurde erfolgreich erstellt.
                  </p>
                  <div style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: "8px",
                    padding: "1rem",
                    textAlign: "center" as const,
                    margin: "1rem 0",
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "#71717a", display: "block", marginBottom: "0.25rem" }}>Auszahlungsnummer</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>{azSuccess}</span>
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button style={s.btnPrimary} onClick={closeAuszahlungModal}>Schliessen</button>
                </div>
              </>
            ) : azStep === 1 ? (
              /* Step 1: Select HV */
              <>
                <div style={s.modalHeader}>
                  <h3 style={s.modalH3}>Auszahlung erstellen - HV auswaehlen</h3>
                  <button style={s.modalClose} onClick={closeAuszahlungModal}>&times;</button>
                </div>
                <div style={s.modalBody}>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>Handelsvertreter</label>
                    <select
                      style={{ ...s.filterSelect, width: "100%" }}
                      value={azHvId || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val) handleAzSelectHv(val);
                      }}
                    >
                      <option value="">-- HV auswaehlen --</option>
                      {hvList.map((hv) => (
                        <option key={hv.id} value={hv.id}>
                          {hv.user?.name || hv.firmenName || `HV #${hv.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button style={s.btnSecondary} onClick={closeAuszahlungModal}>Abbrechen</button>
                </div>
              </>
            ) : (
              /* Step 2: Select provisionen + create */
              <>
                <div style={s.modalHeader}>
                  <h3 style={s.modalH3}>Freigegebene Provisionen auswaehlen</h3>
                  <button style={s.modalClose} onClick={closeAuszahlungModal}>&times;</button>
                </div>
                <div style={s.modalBody}>
                  {azError && <div style={{ ...s.error, marginBottom: "1rem" }}>{azError}</div>}

                  {azLoading ? (
                    <div style={s.loading}>
                      <div style={s.spinner} /> Laden...
                    </div>
                  ) : azProvisionen.length === 0 ? (
                    <p style={{ color: "#71717a", textAlign: "center" as const }}>
                      Keine freigegebenen Provisionen fuer diesen HV vorhanden.
                    </p>
                  ) : (
                    <>
                      <table style={{ ...s.table, marginBottom: "1rem" }}>
                        <thead>
                          <tr>
                            <th style={{ ...s.th, width: "36px" }}></th>
                            <th style={s.th}>Rechnung</th>
                            <th style={s.th}>Kunde</th>
                            <th style={s.th}>Betrag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {azProvisionen.map((p) => (
                            <tr key={p.id}>
                              <td style={s.td}>
                                <input
                                  type="checkbox"
                                  style={s.checkbox}
                                  checked={azSelected.has(p.id)}
                                  onChange={() => toggleAzSelect(p.id)}
                                />
                              </td>
                              <td style={s.td}>{p.rechnungNr || "-"}</td>
                              <td style={s.td}>{p.kunde?.name || "-"}</td>
                              <td style={{ ...s.td, fontWeight: 600 }}>{fmtEur(p.betrag)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>
                        <span style={{ color: "#71717a", fontSize: "0.875rem" }}>{azSelected.size} Provisionen ausgewaehlt</span>
                        <span style={{ color: "#fff", fontSize: "1.125rem", fontWeight: 700 }}>Summe: {fmtEur(azTotal)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div style={s.modalFooter}>
                  <button style={s.btnSecondary} onClick={() => { setAzStep(1); setAzHvId(null); }}>Zurueck</button>
                  <button
                    style={{ ...s.btnSuccess, opacity: azSelected.size === 0 || azLoading ? 0.5 : 1 }}
                    disabled={azSelected.size === 0 || azLoading}
                    onClick={handleCreateAuszahlung}
                  >
                    {azLoading ? "Erstelle..." : "Auszahlung erstellen"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ADMIN HANDELSVERTRETER PAGE
 * Management of Handelsvertreter (HV) with list, detail, and create views.
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { api } from "../../../modules/api/client";
import { HvContractAdminTab } from "./HvContractAdminTab";

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

interface HvUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

interface HvStatBucket {
  status: string;
  count: number;
  betrag: number;
}

interface HvRecord {
  id: number;
  userId: number;
  firmenName: string | null;
  provisionssatz: number;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  kontoinhaber: string | null;
  steuerNr: string | null;
  ustIdNr: string | null;
  notizen: string | null;
  aktiv: boolean;
  isOberHv?: boolean;
  oberHvId?: number | null;
  weitergabeSatz?: number | null;
  hvLevel?: number; // 1=Leiter, 2=Teamleiter, 3=HV
  overrideSatz?: number | null;
  managerId?: number | null;
  createdAt: string;
  user: HvUser;
  _count: { kunden: number; provisionen: number; auszahlungen: number; unterHvs?: number };
  stats?: HvStatBucket[];
}

const HV_LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "HV-Leiter", color: "#D4A843" },
  2: { label: "Teamleiter", color: "#f97316" },
  3: { label: "HV", color: "#64748b" },
};

interface Kunde {
  id: number;
  name: string;
  firmenName: string | null;
  email: string | null;
  createdAt: string;
}

interface Provision {
  id: number;
  rechnungNr: string | null;
  nettoBetrag: number;
  provisionsSatz: number;
  betrag: number;
  status: string;
  createdAt: string;
  kunde?: { name: string } | null;
}

interface Auszahlung {
  id: number;
  auszahlungsNummer: string;
  betrag: number;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ══════════════════════════════════════════════════════════════════════════
   API HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

const adminHvApi = {
  getAll: (params?: Record<string, string>) =>
    api.get("/admin/hv", { params }).then((r) => r.data),
  getOne: (id: number) =>
    api.get(`/admin/hv/${id}`).then((r) => r.data),
  create: (data: Record<string, any>) =>
    api.post("/admin/hv", data).then((r) => r.data),
  getKunden: (hvId: number) =>
    api.get(`/admin/hv/${hvId}/kunden`).then((r) => r.data),
  getProvisionen: (hvId: number) =>
    api.get(`/admin/hv/${hvId}/provisionen`).then((r) => r.data),
  getAuszahlungen: (hvId: number) =>
    api.get(`/admin/hv/${hvId}/auszahlungen`).then((r) => r.data),
  setOberHv: (id: number, isOberHv: boolean) =>
    api.put(`/admin/hv/${id}/set-ober-hv`, { isOberHv }).then((r) => r.data),
  assignOberHv: (id: number, oberHvId: number, weitergabeSatz: number) =>
    api.put(`/admin/hv/${id}/assign-ober-hv`, { oberHvId, weitergabeSatz }).then((r) => r.data),
  removeOberHv: (id: number) =>
    api.put(`/admin/hv/${id}/remove-ober-hv`).then((r) => r.data),
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
  titleBlock: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    color: "#ffffff",
  },
  h2: { margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "#fff" },
  subtitle: { margin: 0, fontSize: "0.875rem", color: "#71717a" },
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
  btnBack: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa",
    padding: "0.5rem 0.875rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "0 0.75rem",
    flex: 1,
    maxWidth: "400px",
    color: "#71717a",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    color: "#e2e8f0",
    padding: "0.625rem 0",
    flex: 1,
    fontSize: "0.875rem",
    outline: "none",
  },
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
  tr: { cursor: "pointer", transition: "background 0.15s" },
  badge: (color: string, bg: string) => ({
    display: "inline-flex",
    padding: "0.25rem 0.625rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color,
    background: bg,
  }),
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

  /* Detail View */
  infoCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
  },
  infoItem: { display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  infoLabel: { fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  infoValue: { fontSize: "0.9rem", color: "#e2e8f0", fontWeight: 500 },
  tabRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const },
  tabBtn: (active: boolean) => ({
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
    background: active ? "linear-gradient(135deg, #D4A843, #EAD068)" : "rgba(255,255,255,0.05)",
    color: active ? "#fff" : "#a1a1aa",
  }),

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
    maxWidth: "560px",
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
  formGroup: { marginBottom: "1.25rem" },
  formLabel: { display: "block", fontSize: "0.875rem", color: "#a1a1aa", marginBottom: "0.5rem" },
  formInput: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.875rem",
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  formTextarea: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.875rem",
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box" as const,
    minHeight: "80px",
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  passwordDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "0.75rem",
    margin: "1rem 0",
  },
  passwordCode: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: "1rem",
    color: "#10b981",
  },
  passwordCopyBtn: {
    background: "rgba(212,168,67,0.2)",
    border: "none",
    color: "#a5b4fc",
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    cursor: "pointer",
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
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(212,168,67,0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "hvSpin 1s linear infinite",
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export function HandelsvertreterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Top-level page tab: "hv" (default) or "vertraege"
  const pageTab = searchParams.get("section") === "vertraege" ? "vertraege" : "hv";
  const setPageTab = (tab: "hv" | "vertraege") => {
    const next = new URLSearchParams(searchParams);
    if (tab === "hv") next.delete("section"); else next.set("section", tab);
    setSearchParams(next);
  };

  // Access check
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // View state
  const [selectedHvId, setSelectedHvId] = useState<number | null>(null);

  // List state
  const [hvList, setHvList] = useState<HvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    provisionssatz: 20,
    iban: "",
    bic: "",
    bankName: "",
    kontoinhaber: "",
    steuerNr: "",
    ustIdNr: "",
    firmenName: "",
    notizen: "",
    isOberHv: false,
  });

  // Detail state
  const [detailHv, setDetailHv] = useState<HvRecord | null>(null);
  const [detailTab, setDetailTab] = useState<"kunden" | "provisionen" | "auszahlungen">("kunden");
  const [detailKunden, setDetailKunden] = useState<Kunde[]>([]);
  const [detailProvisionen, setDetailProvisionen] = useState<Provision[]>([]);
  const [detailAuszahlungen, setDetailAuszahlungen] = useState<Auszahlung[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ── List fetch ── */
  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
      };
      if (search) params.search = search;
      const res = await adminHvApi.getAll(params);
      setHvList(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    if (!selectedHvId) fetchList();
  }, [fetchList, selectedHvId]);

  /* ── Detail fetch ── */
  const fetchDetail = useCallback(async (hvId: number) => {
    try {
      setDetailLoading(true);
      const res = await adminHvApi.getOne(hvId);
      setDetailHv(res.data || res);
    } catch {
      setError("Fehler beim Laden der HV-Details");
      setSelectedHvId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchDetailTab = useCallback(async (hvId: number, tab: string) => {
    try {
      setDetailLoading(true);
      if (tab === "kunden") {
        const res = await adminHvApi.getKunden(hvId);
        setDetailKunden(res.data || []);
      } else if (tab === "provisionen") {
        const res = await adminHvApi.getProvisionen(hvId);
        setDetailProvisionen(res.data || []);
      } else {
        const res = await adminHvApi.getAuszahlungen(hvId);
        setDetailAuszahlungen(res.data || []);
      }
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedHvId) {
      fetchDetail(selectedHvId);
    }
  }, [selectedHvId, fetchDetail]);

  useEffect(() => {
    if (selectedHvId) {
      fetchDetailTab(selectedHvId, detailTab);
    }
  }, [selectedHvId, detailTab, fetchDetailTab]);

  /* ── Create handler ── */
  const handleCreate = async () => {
    if (!formData.name || !formData.email) return;
    try {
      setCreating(true);
      setCreateError(null);
      const res = await adminHvApi.create(formData);
      setTempPassword(res.tempPassword || res.data?.tempPassword || null);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || "Fehler beim Erstellen");
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setTempPassword(null);
    setCreateError(null);
    setFormData({
      name: "",
      email: "",
      provisionssatz: 20,
      iban: "",
      bic: "",
      bankName: "",
      kontoinhaber: "",
      steuerNr: "",
      ustIdNr: "",
      firmenName: "",
      notizen: "",
      isOberHv: false,
    });
    fetchList();
  };

  /* ── Helpers ── */
  const fmtEur = (v: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getStatBetrag = (stats: HvStatBucket[] | undefined, status: string) => {
    if (!stats) return 0;
    const bucket = stats.find((s) => s.status === status);
    return bucket ? bucket.betrag : 0;
  };
  const getTotalBetrag = (stats: HvStatBucket[] | undefined) => {
    if (!stats) return 0;
    return stats.reduce((sum, b) => sum + b.betrag, 0);
  };

  if (!user || user.role !== "ADMIN") return null;

  /* ══════════════════════════════════════════════════════════════════════════
     TOP-LEVEL TAB HEADER (shared across all views)
     ══════════════════════════════════════════════════════════════════════════ */
  const topTabHeader = (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
      <button style={s.tabBtn(pageTab === "hv")} onClick={() => setPageTab("hv")}>Handelsvertreter</button>
      <button style={s.tabBtn(pageTab === "vertraege")} onClick={() => setPageTab("vertraege")}>Verträge</button>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     VERTRAEGE VIEW
     ══════════════════════════════════════════════════════════════════════════ */
  if (pageTab === "vertraege") {
    return (
      <div style={s.page}>
        <style>{`@keyframes hvSpin { to { transform: rotate(360deg) } }`}</style>
        {topTabHeader}
        <HvContractAdminTab />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DETAIL VIEW
     ══════════════════════════════════════════════════════════════════════════ */
  if (selectedHvId && detailHv) {
    return (
      <div style={s.page}>
        <style>{`@keyframes hvSpin { to { transform: rotate(360deg) } }`}</style>
        {topTabHeader}

        {/* Back + Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button style={s.btnBack} onClick={() => { setSelectedHvId(null); setDetailHv(null); }}>
            &larr; Zurück
          </button>
          <h2 style={s.h2}>{detailHv.user?.name || "HV"} &mdash; Detail</h2>
        </div>

        {/* Info card */}
        <div style={s.infoCard}>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Name</span>
            <span style={s.infoValue}>{detailHv.user?.name || "-"}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>E-Mail</span>
            <span style={s.infoValue}>{detailHv.user?.email || "-"}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Firma</span>
            <span style={s.infoValue}>{detailHv.firmenName || "-"}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Provisionssatz</span>
            <span style={s.infoValue}>{detailHv.provisionssatz}%</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>IBAN</span>
            <span style={s.infoValue}>{detailHv.iban || "-"}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Status</span>
            <span style={detailHv.aktiv ? s.badge("#10b981", "rgba(16,185,129,0.15)") : s.badge("#ef4444", "rgba(239,68,68,0.15)")}>
              {detailHv.aktiv ? "aktiv" : "inaktiv"}
            </span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Kunden</span>
            <span style={s.infoValue}>{detailHv._count?.kunden ?? 0}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Erstellt</span>
            <span style={s.infoValue}>{fmtDate(detailHv.createdAt)}</span>
          </div>
        </div>

        {/* Hierarchie-Info */}
        <div style={{
          background: "rgba(212,168,67,0.05)",
          border: "1px solid rgba(212,168,67,0.15)",
          borderRadius: "12px",
          padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "12px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#a1a1aa", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                Hierarchie
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                {(() => {
                  const lvl = HV_LEVEL_LABELS[detailHv.hvLevel || 3] || HV_LEVEL_LABELS[3];
                  return <span style={s.badge(lvl.color, lvl.color + "20")}>{lvl.label}</span>;
                })()}
                {detailHv.overrideSatz && (
                  <span style={{ fontSize: "0.8rem", color: "#D4A843" }}>Override: {detailHv.overrideSatz}%</span>
                )}
                {(detailHv._count?.unterHvs ?? 0) > 0 && (
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
                    — {detailHv._count?.unterHvs ?? 0} Team-Mitglieder
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {!detailHv.oberHvId && (
                <button
                  style={{
                    padding: "6px 14px",
                    background: detailHv.isOberHv ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.12)",
                    border: detailHv.isOberHv ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "8px",
                    color: detailHv.isOberHv ? "#ef4444" : "#EAD068",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={async () => {
                    try {
                      await adminHvApi.setOberHv(detailHv.id, !detailHv.isOberHv);
                      fetchDetail(detailHv.id);
                    } catch (err: any) {
                      alert(err?.response?.data?.message || "Fehler");
                    }
                  }}
                >
                  {detailHv.isOberHv ? "Ober-HV Status entfernen" : "Als Ober-HV markieren"}
                </button>
              )}
              {detailHv.oberHvId && (
                <button
                  style={{
                    padding: "6px 14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={async () => {
                    try {
                      await adminHvApi.removeOberHv(detailHv.id);
                      fetchDetail(detailHv.id);
                    } catch (err: any) {
                      alert(err?.response?.data?.message || "Fehler");
                    }
                  }}
                >
                  Vom Ober-HV lösen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div style={s.tabRow}>
          <button style={s.tabBtn(detailTab === "kunden")} onClick={() => setDetailTab("kunden")}>Kunden</button>
          <button style={s.tabBtn(detailTab === "provisionen")} onClick={() => setDetailTab("provisionen")}>Provisionen</button>
          <button style={s.tabBtn(detailTab === "auszahlungen")} onClick={() => setDetailTab("auszahlungen")}>Auszahlungen</button>
        </div>

        {/* Sub-Tab content */}
        <div style={s.tableContainer}>
          {detailLoading ? (
            <div style={s.loading}>
              <div style={s.spinner} />
              Laden...
            </div>
          ) : detailTab === "kunden" ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Firma</th>
                  <th style={s.th}>E-Mail</th>
                  <th style={s.th}>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {detailKunden.length === 0 ? (
                  <tr><td style={s.empty} colSpan={4}>Keine Kunden</td></tr>
                ) : detailKunden.map((k) => (
                  <tr key={k.id}>
                    <td style={s.td}>{k.name}</td>
                    <td style={s.td}>{k.firmenName || "-"}</td>
                    <td style={s.td}>{k.email || "-"}</td>
                    <td style={s.td}>{fmtDate(k.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : detailTab === "provisionen" ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Rechnung</th>
                  <th style={s.th}>Kunde</th>
                  <th style={s.th}>Netto</th>
                  <th style={s.th}>Satz</th>
                  <th style={s.th}>Provision</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {detailProvisionen.length === 0 ? (
                  <tr><td style={s.empty} colSpan={7}>Keine Provisionen</td></tr>
                ) : detailProvisionen.map((p) => (
                  <tr key={p.id}>
                    <td style={s.td}>{p.rechnungNr || "-"}</td>
                    <td style={s.td}>{p.kunde?.name || "-"}</td>
                    <td style={s.td}>{fmtEur(p.nettoBetrag)}</td>
                    <td style={s.td}>{p.provisionsSatz}%</td>
                    <td style={s.td}>{fmtEur(p.betrag)}</td>
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
                ))}
              </tbody>
            </table>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Nr.</th>
                  <th style={s.th}>Betrag</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {detailAuszahlungen.length === 0 ? (
                  <tr><td style={s.empty} colSpan={4}>Keine Auszahlungen</td></tr>
                ) : detailAuszahlungen.map((a) => (
                  <tr key={a.id}>
                    <td style={s.td}>{a.auszahlungsNummer}</td>
                    <td style={s.td}>{fmtEur(a.betrag)}</td>
                    <td style={s.td}>
                      <span style={
                        a.status === "AUSSTEHEND" ? s.badge("#f59e0b", "rgba(245,158,11,0.15)") :
                        a.status === "AUSGEZAHLT" ? s.badge("#10b981", "rgba(16,185,129,0.15)") :
                        s.badge("#ef4444", "rgba(239,68,68,0.15)")
                      }>
                        {a.status}
                      </span>
                    </td>
                    <td style={s.td}>{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LIST VIEW
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={s.page}>
      <style>{`@keyframes hvSpin { to { transform: rotate(360deg) } }`}</style>
      {topTabHeader}

      {/* Header */}
      <div style={s.header}>
        <div style={s.titleBlock}>
          <div>
            <h2 style={s.h2}>Handelsvertreter Verwaltung</h2>
            <p style={s.subtitle}>{pagination.total} Handelsvertreter insgesamt</p>
          </div>
        </div>
        <button style={s.btnPrimary} onClick={() => setShowCreate(true)}>
          + Neuer HV
        </button>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
        <div style={s.searchBar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            style={s.searchInput}
            placeholder="Name, E-Mail oder Firma suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPagination((p) => ({ ...p, page: 1 })); fetchList(); } }}
          />
        </div>
      </div>

      {/* Error */}
      {error && <div style={s.error}>{safeString(error)}</div>}

      {/* Table */}
      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>E-Mail</th>
              <th style={s.th}>Firma</th>
              <th style={s.th}>Typ</th>
              <th style={s.th}>Satz %</th>
              <th style={s.th}>Kunden</th>
              <th style={s.th}>Offene Prov. (EUR)</th>
              <th style={s.th}>Gesamt Prov. (EUR)</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={s.loading}>
                  <div style={s.spinner} /> Laden...
                </td>
              </tr>
            ) : hvList.length === 0 ? (
              <tr>
                <td colSpan={9} style={s.empty}>Keine Handelsvertreter gefunden</td>
              </tr>
            ) : (
              hvList.map((hv) => (
                <tr
                  key={hv.id}
                  style={s.tr}
                  onClick={() => setSelectedHvId(hv.id)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <td style={{ ...s.td, color: "#fff", fontWeight: 500 }}>{hv.user?.name || "-"}</td>
                  <td style={s.td}>{hv.user?.email || "-"}</td>
                  <td style={s.td}>{hv.firmenName || "-"}</td>
                  <td style={s.td}>
                    {(() => {
                      const lvl = HV_LEVEL_LABELS[hv.hvLevel || 3] || HV_LEVEL_LABELS[3];
                      return <span style={s.badge(lvl.color, lvl.color + "18")}>{lvl.label}</span>;
                    })()}
                  </td>
                  <td style={s.td}>
                    {hv.provisionssatz}%
                    {hv.overrideSatz ? <span style={{ color: "#64748b", fontSize: "0.75rem" }}> (+{hv.overrideSatz}% Override)</span> : null}
                  </td>
                  <td style={s.td}>{hv._count?.kunden ?? 0}</td>
                  <td style={s.td}>{fmtEur(getStatBetrag(hv.stats, "OFFEN"))}</td>
                  <td style={s.td}>{fmtEur(getTotalBetrag(hv.stats))}</td>
                  <td style={s.td}>
                    <span style={hv.aktiv ? s.badge("#10b981", "rgba(16,185,129,0.15)") : s.badge("#ef4444", "rgba(239,68,68,0.15)")}>
                      {hv.aktiv ? "aktiv" : "inaktiv"}
                    </span>
                  </td>
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
              Zurück
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

      {/* ═══ Create Modal ═══ */}
      {showCreate && (
        <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}>
          {tempPassword ? (
            /* Success: show temp password */
            <div style={s.modal}>
              <div style={s.successHeader}>
                <h3 style={s.successH3}>Handelsvertreter erstellt</h3>
                <button style={s.modalClose} onClick={closeCreateModal}>&times;</button>
              </div>
              <div style={s.modalBody}>
                <p style={{ color: "#a1a1aa", margin: "0 0 0.5rem 0" }}>
                  Der Handelsvertreter wurde erfolgreich angelegt. Bitte teilen Sie das temporaere Passwort mit:
                </p>
                <div style={s.passwordDisplay}>
                  <code style={s.passwordCode}>{tempPassword}</code>
                  <button
                    style={s.passwordCopyBtn}
                    onClick={() => navigator.clipboard.writeText(tempPassword)}
                  >
                    Kopieren
                  </button>
                </div>
                <p style={{ color: "#f59e0b", fontSize: "0.8rem", margin: 0 }}>
                  Dieses Passwort wird nur einmal angezeigt. Der Benutzer muss es beim ersten Login ändern.
                </p>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnPrimary} onClick={closeCreateModal}>Schliessen</button>
              </div>
            </div>
          ) : (
            /* Create form */
            <div style={s.modal}>
              <div style={s.modalHeader}>
                <h3 style={s.modalH3}>Neuen Handelsvertreter anlegen</h3>
                <button style={s.modalClose} onClick={closeCreateModal}>&times;</button>
              </div>
              <div style={s.modalBody}>
                {createError && <div style={{ ...s.error, marginBottom: "1rem" }}>{createError}</div>}

                <div style={s.formGroup}>
                  <label style={s.formLabel}>Name *</label>
                  <input
                    style={s.formInput}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Vor- und Nachname"
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.formLabel}>E-Mail *</label>
                  <input
                    style={s.formInput}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@beispiel.de"
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.formLabel}>Provisionssatz (%)</label>
                  <input
                    style={s.formInput}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.provisionssatz}
                    onChange={(e) => setFormData({ ...formData, provisionssatz: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>IBAN</label>
                    <input
                      style={s.formInput}
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>BIC</label>
                    <input
                      style={s.formInput}
                      value={formData.bic}
                      onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>Bankname</label>
                    <input
                      style={s.formInput}
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>Kontoinhaber</label>
                    <input
                      style={s.formInput}
                      value={formData.kontoinhaber}
                      onChange={(e) => setFormData({ ...formData, kontoinhaber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>Steuer-Nr</label>
                    <input
                      style={s.formInput}
                      value={formData.steuerNr}
                      onChange={(e) => setFormData({ ...formData, steuerNr: e.target.value })}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>USt-IdNr</label>
                    <input
                      style={s.formInput}
                      value={formData.ustIdNr}
                      onChange={(e) => setFormData({ ...formData, ustIdNr: e.target.value })}
                    />
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.formLabel}>Firmenname</label>
                  <input
                    style={s.formInput}
                    value={formData.firmenName}
                    onChange={(e) => setFormData({ ...formData, firmenName: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div style={{ ...s.formGroup, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="checkbox"
                    id="isOberHv"
                    checked={formData.isOberHv}
                    onChange={(e) => setFormData({ ...formData, isOberHv: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#EAD068", cursor: "pointer" }}
                  />
                  <label htmlFor="isOberHv" style={{ fontSize: "0.875rem", color: "#e2e8f0", cursor: "pointer" }}>
                    Als <span style={{ color: "#EAD068", fontWeight: 600 }}>Ober-HV</span> anlegen (kann Unter-HVs verwalten)
                  </label>
                </div>

                <div style={s.formGroup}>
                  <label style={s.formLabel}>Notizen</label>
                  <textarea
                    style={s.formTextarea}
                    value={formData.notizen}
                    onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                    placeholder="Interne Notizen..."
                  />
                </div>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecondary} onClick={closeCreateModal}>Abbrechen</button>
                <button
                  style={{ ...s.btnPrimary, opacity: creating ? 0.6 : 1 }}
                  disabled={creating || !formData.name || !formData.email}
                  onClick={handleCreate}
                >
                  {creating ? "Erstelle..." : "HV anlegen"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

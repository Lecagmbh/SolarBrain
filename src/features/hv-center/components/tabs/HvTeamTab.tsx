/**
 * HV TEAM TAB (Mein Team)
 * Ober-HV view: manage Unter-HVs, provision splitting, team stats
 */

import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  Users,
  UserPlus,
  TrendingUp,
  Coins,
  ChevronRight,
  X,
  Save,
  Mail,
  Phone,
  Building2,
  RefreshCw,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { hvCenterApi } from "../../api/hv-center.api";
import type { UnterHv, TeamStats, TeamProvision, InviteUnterHvData } from "../../types";

/* ── Helpers ── */

const formatEur = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "-";

const formatPct = (v: number) => `${v.toFixed(1)}%`;

/* ── ProvisionBar Component ── */

function ProvisionBar({
  unterHvSatz,
  oberHvSatz,
  gesamtSatz,
  compact = false,
}: {
  unterHvSatz: number;
  oberHvSatz: number;
  gesamtSatz: number;
  compact?: boolean;
}) {
  const unterPct = gesamtSatz > 0 ? (unterHvSatz / gesamtSatz) * 100 : 0;
  const oberPct = gesamtSatz > 0 ? (oberHvSatz / gesamtSatz) * 100 : 0;
  const h = compact ? "8px" : "12px";

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: h,
          borderRadius: "6px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            width: `${unterPct}%`,
            background: "linear-gradient(90deg, #3B82F6, #60a5fa)",
            transition: "width 0.3s ease",
          }}
        />
        <div
          style={{
            width: `${oberPct}%`,
            background: "linear-gradient(90deg, #10B981, #34d399)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      {!compact && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.7rem", color: "#71717a" }}>
          <span style={{ color: "#60a5fa" }}>{formatPct(unterHvSatz)} Unter-HV</span>
          <span style={{ color: "#34d399" }}>{formatPct(oberHvSatz)} Eigenanteil</span>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */

const tabBtn = (active: boolean): CSSProperties => ({
  padding: "8px 16px",
  fontSize: "0.8rem",
  fontWeight: 500,
  background: active ? "rgba(212,168,67,0.15)" : "transparent",
  color: active ? "#D4A843" : "#71717a",
  border: active ? "1px solid rgba(212,168,67,0.3)" : "1px solid transparent",
  borderRadius: "6px",
  cursor: "pointer",
});

const btn = (color: string): CSSProperties => ({
  padding: "8px 16px",
  background: `rgba(${color}, 0.12)`,
  border: `1px solid rgba(${color}, 0.3)`,
  borderRadius: "8px",
  color: `rgb(${color})`,
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const badge = (color: string, bg: string): CSSProperties => ({
  display: "inline-flex",
  padding: "2px 8px",
  borderRadius: "6px",
  fontSize: "0.7rem",
  fontWeight: 600,
  color,
  background: bg,
});

const s: Record<string, CSSProperties> = {
  container: { padding: "24px", maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" },
  card: {
    background: "rgba(39, 39, 42, 0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "20px",
  },
  overviewCard: {
    background: "linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)",
    border: "1px solid rgba(212, 168, 67, 0.2)",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "32px",
    flexWrap: "wrap" as const,
  },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" },
  statCard: {
    background: "rgba(39, 39, 42, 0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  statLabel: { fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  statValue: { fontSize: "1.25rem", fontWeight: 600, color: "#e2e8f0" },
  tabToggle: { display: "flex", gap: "4px", background: "rgba(39,39,42,0.5)", borderRadius: "8px", padding: "3px" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    textAlign: "left" as const,
    padding: "10px 12px",
    fontSize: "0.7rem",
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: { padding: "12px", fontSize: "0.85rem", color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  slideOver: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "680px",
    maxWidth: "100vw",
    height: "100vh",
    background: "#141419",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 1001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#1c1c22",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "28px",
    width: "480px",
    maxWidth: "95vw",
    maxHeight: "90vh",
    overflow: "auto",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "rgba(39,39,42,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "0.85rem",
    outline: "none",
  },
  label: { display: "block", fontSize: "0.75rem", color: "#a1a1aa", marginBottom: "4px", fontWeight: 500 },
};

/* ── Main Component ── */

export function HvTeamTab() {
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [unterHvs, setUnterHvs] = useState<UnterHv[]>([]);
  const [teamProvs, setTeamProvs] = useState<TeamProvision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"team" | "splitting">("team");
  const [selectedHv, setSelectedHv] = useState<UnterHv | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [oberHvSatz, setOberHvSatz] = useState(20);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, hvs] = await Promise.all([
        hvCenterApi.getTeamStats(),
        hvCenterApi.getUnterHvs(),
      ]);
      setTeamStats(stats);
      setUnterHvs(hvs);
      if (hvs.length > 0) {
        setOberHvSatz(hvs[0].oberHvProvisionssatz);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Fehler beim Laden der Team-Daten");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTeamProvisions = useCallback(async () => {
    try {
      const res = await hvCenterApi.getTeamProvisionen({ limit: 50 });
      setTeamProvs(res.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (subTab === "splitting") loadTeamProvisions(); }, [subTab, loadTeamProvisions]);

  if (loading) {
    return (
      <div style={{ ...s.container, alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <RefreshCw size={24} style={{ color: "#D4A843", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#71717a", fontSize: "0.85rem" }}>Team-Daten werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.container}>
        <div style={{ ...s.card, borderColor: "rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: "12px" }}>
          <AlertTriangle size={20} style={{ color: "#ef4444" }} />
          <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</span>
          <button onClick={loadData} style={{ ...btn("99, 102, 241"), marginLeft: "auto" }}>
            <RefreshCw size={14} /> Erneut laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Provision Overview Card */}
      <div style={s.overviewCard}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Ihr Provisionssatz
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#e2e8f0" }}>{formatPct(oberHvSatz)}</div>
        </div>
        <div style={{ width: "1px", height: "48px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#a1a1aa" }}>Team-Provisionen (Eigenanteile)</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#10b981" }}>
              {formatEur(teamStats?.teamProvisionenGesamt || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#a1a1aa" }}>Diesen Monat</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e2e8f0" }}>
              {formatEur(teamStats?.teamProvisionenMonat || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={s.statsGrid}>
        {[
          { label: "Unter-HVs", value: String(teamStats?.unterHvsCount || 0), icon: Users, color: "#D4A843" },
          { label: "Team-Kunden", value: String(teamStats?.teamKundenGesamt || 0), icon: Building2, color: "#3b82f6" },
          { label: "Anmeldungen / Mon.", value: String(teamStats?.teamAnmeldungenMonat || 0), icon: TrendingUp, color: "#10b981" },
          { label: "Ø Weitergabesatz", value: formatPct(teamStats?.avgWeitergabeSatz || 0), icon: BarChart3, color: "#f59e0b" },
          { label: "Team-Prov. / Mon.", value: formatEur(teamStats?.teamProvisionenMonat || 0), icon: Coins, color: "#EAD068" },
        ].map((item) => (
          <div key={item.label} style={s.statCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <item.icon size={14} style={{ color: item.color }} />
              <span style={s.statLabel}>{item.label}</span>
            </div>
            <span style={s.statValue}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Tab Toggle + Invite Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={s.tabToggle}>
          <button style={tabBtn(subTab === "team")} onClick={() => setSubTab("team")}>
            Team-Übersicht
          </button>
          <button style={tabBtn(subTab === "splitting")} onClick={() => setSubTab("splitting")}>
            Provisions-Splitting
          </button>
        </div>
        <button style={btn("99, 102, 241")} onClick={() => setShowInvite(true)}>
          <UserPlus size={14} /> Unter-HV einladen
        </button>
      </div>

      {/* Tab Content */}
      {subTab === "team" ? (
        <TeamTable unterHvs={unterHvs} oberHvSatz={oberHvSatz} onSelect={setSelectedHv} />
      ) : (
        <SplittingTable provisions={teamProvs} />
      )}

      {/* Detail Panel */}
      {selectedHv && (
        <>
          <div style={s.backdrop} onClick={() => setSelectedHv(null)} />
          <UnterHvDetailPanel
            hv={selectedHv}
            oberHvSatz={oberHvSatz}
            onClose={() => setSelectedHv(null)}
            onUpdated={loadData}
          />
        </>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          oberHvSatz={oberHvSatz}
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); loadData(); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── TeamTable ── */

function TeamTable({
  unterHvs,
  oberHvSatz,
  onSelect,
}: {
  unterHvs: UnterHv[];
  oberHvSatz: number;
  onSelect: (hv: UnterHv) => void;
}) {
  if (unterHvs.length === 0) {
    return (
      <div style={{ ...s.card, textAlign: "center", padding: "48px" }}>
        <Users size={40} style={{ color: "#71717a", margin: "0 auto 12px" }} />
        <p style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>Noch keine Unter-HVs in Ihrem Team</p>
        <p style={{ color: "#71717a", fontSize: "0.8rem" }}>Laden Sie Handelsvertreter ein, um Ihr Team aufzubauen.</p>
      </div>
    );
  }

  return (
    <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name / Firma</th>
            <th style={s.th}>Weitergabe</th>
            <th style={{ ...s.th, width: "180px" }}>Split</th>
            <th style={{ ...s.th, textAlign: "right" }}>Kunden</th>
            <th style={{ ...s.th, textAlign: "right" }}>Anm./Mon.</th>
            <th style={{ ...s.th, textAlign: "right" }}>Prov./Mon.</th>
            <th style={s.th}>Status</th>
            <th style={{ ...s.th, width: "32px" }} />
          </tr>
        </thead>
        <tbody>
          {unterHvs.map((hv) => {
            const eigenSatz = oberHvSatz - hv.weitergabeSatz;
            return (
              <tr
                key={hv.id}
                onClick={() => onSelect(hv)}
                style={{ cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,168,67,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={s.td}>
                  <div style={{ fontWeight: 500 }}>{hv.user.name || "–"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#71717a" }}>{hv.firmenName || hv.user.email}</div>
                </td>
                <td style={s.td}>
                  <span style={{ fontWeight: 600, color: "#60a5fa" }}>{formatPct(hv.weitergabeSatz)}</span>
                </td>
                <td style={s.td}>
                  <ProvisionBar unterHvSatz={hv.weitergabeSatz} oberHvSatz={eigenSatz} gesamtSatz={oberHvSatz} compact />
                </td>
                <td style={{ ...s.td, textAlign: "right" }}>{hv.kundenCount}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{hv.anmeldungenMonat}</td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 500 }}>{formatEur(hv.provisionenMonat)}</td>
                <td style={s.td}>
                  {hv.aktiv ? (
                    <span style={badge("#10b981", "rgba(16,185,129,0.15)")}>Aktiv</span>
                  ) : (
                    <span style={badge("#ef4444", "rgba(239,68,68,0.15)")}>Inaktiv</span>
                  )}
                </td>
                <td style={s.td}>
                  <ChevronRight size={16} style={{ color: "#71717a" }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── SplittingTable ── */

function SplittingTable({ provisions }: { provisions: TeamProvision[] }) {
  if (provisions.length === 0) {
    return (
      <div style={{ ...s.card, textAlign: "center", padding: "48px" }}>
        <Coins size={40} style={{ color: "#71717a", margin: "0 auto 12px" }} />
        <p style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>Noch keine Provisions-Splits vorhanden</p>
      </div>
    );
  }

  return (
    <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Datum</th>
            <th style={s.th}>Kunde</th>
            <th style={{ ...s.th, textAlign: "right" }}>Rechnung</th>
            <th style={s.th}>Unter-HV</th>
            <th style={{ ...s.th, textAlign: "right" }}>Unter-HV Anteil</th>
            <th style={{ ...s.th, textAlign: "right" }}>Eigenanteil</th>
            <th style={{ ...s.th, width: "140px" }}>Split</th>
          </tr>
        </thead>
        <tbody>
          {provisions.map((p) => {
            const gesamtSatz = p.unterHvSatz + p.oberHvEigenSatz;
            return (
              <tr key={p.id}>
                <td style={s.td}>{formatDate(p.datum)}</td>
                <td style={s.td}>{p.kunde}</td>
                <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{formatEur(p.rechnungNetto)}</td>
                <td style={s.td}>
                  <span style={{ color: "#e2e8f0" }}>{p.unterHv?.name || "–"}</span>
                </td>
                <td style={{ ...s.td, textAlign: "right" }}>
                  <span style={{ color: "#60a5fa", fontWeight: 500 }}>{formatEur(p.unterHvAnteil)}</span>
                  <span style={{ color: "#71717a", fontSize: "0.75rem", marginLeft: "4px" }}>{formatPct(p.unterHvSatz)}</span>
                </td>
                <td style={{ ...s.td, textAlign: "right" }}>
                  <span style={{ color: "#34d399", fontWeight: 600 }}>{formatEur(p.oberHvAnteil)}</span>
                  <span style={{ color: "#71717a", fontSize: "0.75rem", marginLeft: "4px" }}>{formatPct(p.oberHvEigenSatz)}</span>
                </td>
                <td style={s.td}>
                  <ProvisionBar unterHvSatz={p.unterHvSatz} oberHvSatz={p.oberHvEigenSatz} gesamtSatz={gesamtSatz} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Detail Panel ── */

function UnterHvDetailPanel({
  hv,
  oberHvSatz,
  onClose,
  onUpdated,
}: {
  hv: UnterHv;
  oberHvSatz: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detailTab, setDetailTab] = useState<"overview" | "provisionen" | "settings">("overview");
  const [satz, setSatz] = useState(hv.weitergabeSatz);
  const [saving, setSaving] = useState(false);
  const [provs, setProvs] = useState<any[]>([]);
  const [provsLoading, setProvsLoading] = useState(false);

  const eigenSatz = oberHvSatz - satz;

  useEffect(() => {
    if (detailTab === "provisionen") {
      setProvsLoading(true);
      hvCenterApi.getUnterHvProvisionen(hv.id, { limit: 50 })
        .then((res) => setProvs(res.data || []))
        .catch(() => {})
        .finally(() => setProvsLoading(false));
    }
  }, [detailTab, hv.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await hvCenterApi.updateUnterHvSatz(hv.id, satz);
      onUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.slideOver}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "#e2e8f0" }}>{hv.user.name || "–"}</div>
          <div style={{ fontSize: "0.8rem", color: "#71717a" }}>{hv.firmenName || hv.user.email}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>

      {/* Detail Tabs */}
      <div style={{ display: "flex", gap: "2px", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["overview", "provisionen", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDetailTab(tab)}
            style={{
              padding: "10px 14px",
              fontSize: "0.8rem",
              fontWeight: 500,
              background: "none",
              border: "none",
              color: detailTab === tab ? "#D4A843" : "#71717a",
              borderBottom: detailTab === tab ? "2px solid #D4A843" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {tab === "overview" ? "Übersicht" : tab === "provisionen" ? "Provisionen" : "Einstellungen"}
          </button>
        ))}
      </div>

      {/* Detail Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {detailTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Contact */}
            <div style={s.card}>
              <h4 style={{ fontSize: "0.8rem", color: "#a1a1aa", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Kontaktdaten
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail size={14} style={{ color: "#71717a" }} />
                  <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{hv.user.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building2 size={14} style={{ color: "#71717a" }} />
                  <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{hv.firmenName || "–"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={14} style={{ color: "#71717a" }} />
                  <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{hv.kundenCount} Kunden</span>
                </div>
              </div>
            </div>

            {/* Provision Split Visualization */}
            <div style={s.card}>
              <h4 style={{ fontSize: "0.8rem", color: "#a1a1aa", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Provisions-Splitting
              </h4>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <div style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(212,168,67,0.06)",
                  border: "1px solid rgba(212,168,67,0.15)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#a1a1aa" }}>Gesamt</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#e2e8f0" }}>{formatPct(oberHvSatz)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", fontSize: "1.2rem", color: "#71717a" }}>=</div>
                <div style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#60a5fa" }}>Unter-HV</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#60a5fa" }}>{formatPct(hv.weitergabeSatz)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", fontSize: "1.2rem", color: "#71717a" }}>+</div>
                <div style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: "8px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#34d399" }}>Eigenanteil</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#34d399" }}>{formatPct(eigenSatz)}</div>
                </div>
              </div>
              <ProvisionBar unterHvSatz={hv.weitergabeSatz} oberHvSatz={eigenSatz} gesamtSatz={oberHvSatz} />
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div style={s.statCard}>
                <span style={s.statLabel}>Anmeldungen / Mon.</span>
                <span style={s.statValue}>{hv.anmeldungenMonat}</span>
              </div>
              <div style={s.statCard}>
                <span style={s.statLabel}>Provisionen Gesamt</span>
                <span style={s.statValue}>{formatEur(hv.provisionenGesamt)}</span>
              </div>
              <div style={s.statCard}>
                <span style={s.statLabel}>Provisionen / Mon.</span>
                <span style={s.statValue}>{formatEur(hv.provisionenMonat)}</span>
              </div>
            </div>
          </div>
        )}

        {detailTab === "provisionen" && (
          <div>
            {provsLoading ? (
              <p style={{ color: "#71717a", textAlign: "center", padding: "24px" }}>Laden...</p>
            ) : provs.length === 0 ? (
              <p style={{ color: "#71717a", textAlign: "center", padding: "24px" }}>Keine Provisionen vorhanden</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Datum</th>
                    <th style={s.th}>Kunde</th>
                    <th style={{ ...s.th, textAlign: "right" }}>Rechnung</th>
                    <th style={{ ...s.th, textAlign: "right" }}>Unter-HV</th>
                    <th style={{ ...s.th, textAlign: "right" }}>Eigenanteil</th>
                  </tr>
                </thead>
                <tbody>
                  {provs.map((p: any) => (
                    <tr key={p.id}>
                      <td style={s.td}>{formatDate(p.datum)}</td>
                      <td style={s.td}>{p.kunde}</td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{formatEur(p.rechnungNetto)}</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#60a5fa" }}>{formatEur(p.unterHvAnteil)}</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#34d399", fontWeight: 600 }}>{formatEur(p.oberHvAnteil)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {detailTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={s.card}>
              <h4 style={{ fontSize: "0.9rem", color: "#e2e8f0", margin: "0 0 16px" }}>Weitergabesatz anpassen</h4>

              {/* Slider */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>0%</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0" }}>{formatPct(satz)}</span>
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{formatPct(oberHvSatz)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={oberHvSatz}
                  step={0.5}
                  value={satz}
                  onChange={(e) => setSatz(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#D4A843" }}
                />
              </div>

              {/* Live Preview Bar */}
              <ProvisionBar unterHvSatz={satz} oberHvSatz={oberHvSatz - satz} gesamtSatz={oberHvSatz} />

              {/* Example Calculation */}
              <div style={{
                marginTop: "16px",
                padding: "12px",
                background: "rgba(39,39,42,0.5)",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "#a1a1aa",
              }}>
                <div style={{ fontWeight: 500, marginBottom: "6px", color: "#e2e8f0" }}>Beispielrechnung (1.000 EUR netto)</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Unter-HV Anteil ({formatPct(satz)}):</span>
                  <span style={{ color: "#60a5fa", fontWeight: 500 }}>{formatEur(1000 * satz / 100)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Ihr Eigenanteil ({formatPct(oberHvSatz - satz)}):</span>
                  <span style={{ color: "#34d399", fontWeight: 600 }}>{formatEur(1000 * (oberHvSatz - satz) / 100)}</span>
                </div>
              </div>

              {/* Warning */}
              {eigenSatz < 2 && (
                <div style={{
                  marginTop: "12px",
                  padding: "10px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
                  <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>Ihr Eigenanteil ist sehr niedrig ({formatPct(eigenSatz)})</span>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || satz === hv.weitergabeSatz}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  padding: "10px",
                  background: satz !== hv.weitergabeSatz ? "rgba(212,168,67,0.15)" : "rgba(39,39,42,0.5)",
                  border: satz !== hv.weitergabeSatz ? "1px solid rgba(212,168,67,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  color: satz !== hv.weitergabeSatz ? "#D4A843" : "#71717a",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: satz !== hv.weitergabeSatz ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Save size={16} /> {saving ? "Speichern..." : "Weitergabesatz speichern"}
              </button>
              <p style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "8px" }}>
                Änderungen gelten nur für neue Rechnungen, nicht rückwirkend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Invite Modal ── */

function InviteModal({
  oberHvSatz,
  onClose,
  onCreated,
}: {
  oberHvSatz: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<InviteUnterHvData>({
    name: "",
    email: "",
    firma: "",
    telefon: "",
    weitergabeSatz: Math.floor(oberHvSatz * 0.6),
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const eigenSatz = oberHvSatz - form.weitergabeSatz;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    try {
      const res = await hvCenterApi.createUnterHv(form);
      setResult({ email: form.email, tempPassword: res.tempPassword });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Fehler beim Erstellen");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div style={s.modalOverlay} onClick={onClose}>
        <div style={s.modal} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: "1.1rem", color: "#10b981", margin: "0 0 16px" }}>Unter-HV erfolgreich eingeladen</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <span style={s.label}>E-Mail</span>
              <span style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>{result.email}</span>
            </div>
            <div>
              <span style={s.label}>Temporäres Passwort</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <code style={{
                  padding: "8px 12px",
                  background: "rgba(39,39,42,0.8)",
                  borderRadius: "6px",
                  color: "#f59e0b",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                }}>{result.tempPassword}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(result.tempPassword)}
                  style={{ ...btn("99, 102, 241"), padding: "6px 10px", fontSize: "0.75rem" }}
                >
                  Kopieren
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => { onCreated(); }}
            style={{ ...btn("16, 185, 129"), marginTop: "20px", width: "100%", justifyContent: "center" }}
          >
            Fertig
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#e2e8f0", margin: 0 }}>Unter-HV einladen</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={s.label}>Name *</label>
            <input
              style={s.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <label style={s.label}>E-Mail *</label>
            <input
              style={s.input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="max@example.de"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={s.label}>Firma</label>
              <input
                style={s.input}
                value={form.firma}
                onChange={(e) => setForm({ ...form, firma: e.target.value })}
                placeholder="Firma GmbH"
              />
            </div>
            <div>
              <label style={s.label}>Telefon</label>
              <input
                style={s.input}
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                placeholder="+49 ..."
              />
            </div>
          </div>

          {/* Weitergabesatz */}
          <div>
            <label style={s.label}>Weitergabesatz</label>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.8rem", color: "#71717a" }}>0%</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0" }}>{formatPct(form.weitergabeSatz)}</span>
              <span style={{ fontSize: "0.8rem", color: "#71717a" }}>{formatPct(oberHvSatz)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={oberHvSatz}
              step={0.5}
              value={form.weitergabeSatz}
              onChange={(e) => setForm({ ...form, weitergabeSatz: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#D4A843" }}
            />
            <div style={{ marginTop: "8px" }}>
              <ProvisionBar unterHvSatz={form.weitergabeSatz} oberHvSatz={eigenSatz} gesamtSatz={oberHvSatz} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !form.name.trim() || !form.email.trim()}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: "rgba(212,168,67,0.15)",
            border: "1px solid rgba(212,168,67,0.4)",
            borderRadius: "8px",
            color: "#D4A843",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <UserPlus size={16} /> {submitting ? "Wird erstellt..." : "Einladung senden"}
        </button>
      </div>
    </div>
  );
}

export default HvTeamTab;

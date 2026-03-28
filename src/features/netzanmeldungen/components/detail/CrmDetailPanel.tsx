/**
 * CRM Detail Panel — Vollbild-Ansicht eines CRM-Projekts oder einer Installation
 * Lädt Projekt + Kommentare + Checkliste von API.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../../pages/AuthContext";
import DetailHeader from "./DetailHeader";
import DetailUebersicht from "./DetailUebersicht";
import { getDetailTabs, DetailTabBar } from "./DetailTabs";
import DetailTabPlaceholder from "./DetailTabPlaceholder";
import TabKommentare from "./TabKommentare";
import TabDokumente from "./TabDokumente";
import TabVdeCenter from "./TabVdeCenter";
import TabAngebot from "./TabAngebot";
import TabTickets from "./TabTickets";
import TabNbKomm from "./TabNbKomm";
import TabUnterlagen from "./TabUnterlagen";
import TabMontage from "./TabMontage";
import TabVerlauf from "./TabVerlauf";
import InstallationUebersicht from "./InstallationUebersicht";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PanelItem {
  id: number | string;
  _crmId?: number;
  _installationId?: number;
}

interface Props {
  item: PanelItem;
  onClose: () => void;
  mode?: "crm" | "installation";
}

interface WorkflowStep { l: string; done: boolean; current?: boolean; c: string; date?: string }

// ─── Shared Auth Helper ──────────────────────────────────────────────────────

function useAuthHeaders(): { Authorization: string; "Content-Type": string } {
  const token = localStorage.getItem("baunity_token") || "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function useAuthFetch() {
  const headers = useAuthHeaders();
  return useCallback(async <T = any>(url: string, options?: RequestInit): Promise<T> => {
    const resp = await fetch(url, { ...options, headers: { ...headers, ...options?.headers }, credentials: "include" });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || err.message || `Fehler ${resp.status}`);
    }
    return resp.json();
  }, [headers.Authorization]);
}

// ─── Stage Config ────────────────────────────────────────────────────────────

const CRM_STAGES = ["ANFRAGE", "HV_VERMITTELT", "AUFTRAG", "NB_ANFRAGE", "NB_KOMMUNIKATION", "NB_GENEHMIGT", "NB_ABGELEHNT", "EINGESTELLT", "ABGESCHLOSSEN"];
const CRM_LABELS = ["Anfrage", "HV", "Auftrag", "Beim NB", "NB-Komm.", "Genehmigt", "Abgelehnt", "Eingestellt", "Fertig"];
const CRM_COLORS = ["#64748b", "#f0d878", "#D4A843", "#EAD068", "#ef4444", "#22c55e", "#ef4444", "#f97316", "#22c55e"];

const INST_STAGES = ["EINGANG", "BEIM_NB", "GENEHMIGT", "IBN", "FERTIG"];
const INST_LABELS = ["Eingang", "Beim NB", "Genehmigt", "IBN", "Fertig"];
const INST_COLORS = ["#64748b", "#3b82f6", "#22c55e", "#f59e0b", "#22c55e"];

function mapInstStatusToStage(status: string): string {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  const map: Record<string, string> = {
    eingang: "EINGANG", entwurf: "EINGANG",
    in_bearbeitung: "BEIM_NB", beim_nb: "BEIM_NB",
    rueckfrage: "BEIM_NB",
    genehmigt: "GENEHMIGT",
    ibn: "IBN",
    abgeschlossen: "FERTIG", fertig: "FERTIG",
    storniert: "EINGANG", abgelehnt: "EINGANG",
  };
  return map[s] || "EINGANG";
}

const INST_TRANSITIONS: Record<string, { toPhase: string; toZustand: string }> = {
  EINGANG: { toPhase: "einreichung", toZustand: "wartet" },
  BEIM_NB: { toPhase: "genehmigung", toZustand: "abgeschlossen" },
  GENEHMIGT: { toPhase: "ibn", toZustand: "offen" },
  IBN: { toPhase: "fertig", toZustand: "abgeschlossen" },
};

const CRM_NEXT_STAGE: Record<string, string> = {
  ANFRAGE: "HV_VERMITTELT", HV_VERMITTELT: "AUFTRAG", AUFTRAG: "NB_ANFRAGE",
};

function getNextActionLabel(stage: string, isInstallation: boolean): { text: string; color: string; actionable: boolean } {
  if (isInstallation) {
    switch (stage) {
      case "EINGANG": return { text: "→ Beim NB einreichen", color: "#22c55e", actionable: true };
      case "BEIM_NB": return { text: "⏳ Wartet auf NB-Antwort", color: "#3b82f6", actionable: false };
      case "GENEHMIGT": return { text: "→ IBN planen", color: "#22c55e", actionable: true };
      case "IBN": return { text: "→ Abschließen", color: "#22c55e", actionable: true };
      default: return { text: "Abgeschlossen", color: "#64748b", actionable: false };
    }
  }
  switch (stage) {
    case "NB_KOMMUNIKATION": return { text: "⚠ Rückfrage beantworten", color: "#ef4444", actionable: false };
    case "AUFTRAG": return { text: "→ NB-Anfrage stellen", color: "#22c55e", actionable: true };
    case "ANFRAGE": return { text: "→ HV zuordnen", color: "#22c55e", actionable: true };
    case "HV_VERMITTELT": return { text: "→ Auftrag erstellen", color: "#22c55e", actionable: true };
    default: return { text: "Nächster Schritt", color: "#64748b", actionable: false };
  }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const css = `
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.15)}50%{box-shadow:0 0 0 5px rgba(239,68,68,0)}}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes skeletonPulse{0%,100%{opacity:0.04}50%{opacity:0.08}}
.f{animation:fi .2s ease both}
.rh{transition:all .1s;cursor:pointer;border-radius:4px}.rh:hover{background:rgba(212,168,67,0.04)!important}
.sk{border-radius:4px;background:rgba(255,255,255,0.04);animation:skeletonPulse 1.5s ease infinite}
`;

// ─── Skeleton Loading ────────────────────────────────────────────────────────

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#060b18", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{css}</style>
      {/* Header Skeleton */}
      <div style={{ background: "#081020", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans'" }}>← Projekte</button>
          <div className="sk" style={{ width: 10, height: 10, borderRadius: "50%" }} />
          <div className="sk" style={{ width: 180, height: 18 }} />
          <div className="sk" style={{ width: 70, height: 16, borderRadius: 3 }} />
          <div className="sk" style={{ width: 50, height: 16, borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", gap: 8, paddingLeft: 36, marginBottom: 8 }}>
          <div className="sk" style={{ width: 120, height: 12 }} />
          <div className="sk" style={{ width: 80, height: 12 }} />
          <div className="sk" style={{ width: 100, height: 12 }} />
        </div>
        <div style={{ paddingLeft: 36, display: "flex", gap: 4 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="sk" style={{ flex: 1, height: 6, borderRadius: 3 }} />)}
        </div>
      </div>
      {/* Tab-Bar Skeleton */}
      <div style={{ padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
        {[80, 60, 90, 70, 80, 60].map((w, i) => <div key={i} className="sk" style={{ width: w, height: 32, borderRadius: 8 }} />)}
      </div>
      {/* Content Skeleton */}
      <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 12, padding: 16 }}>
            <div className="sk" style={{ width: "60%", height: 14, marginBottom: 12 }} />
            <div className="sk" style={{ width: "100%", height: 10, marginBottom: 6 }} />
            <div className="sk" style={{ width: "80%", height: 10, marginBottom: 6 }} />
            <div className="sk" style={{ width: "90%", height: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function DetailError({ error, onBack, onRetry }: { error: string; onBack: () => void; onRetry: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#060b18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Laden fehlgeschlagen</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>{error}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Zurück</button>
          <button onClick={onRetry} style={{ background: "#D4A843", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↻ Erneut versuchen</button>
        </div>
      </div>
    </div>
  );
}

// ─── Verknüpfungs-Card ──────────────────────────────────────────────────────

function VerknuepfungCard({ p, isCrm, onClose }: { p: Record<string, any>; isCrm: boolean; onClose: () => void }) {
  const [linked, setLinked] = useState<Record<string, any> | null>(null);
  const authFetch = useAuthFetch();

  useEffect(() => {
    if (isCrm && p?.installationId) {
      authFetch(`/api/installations/${p.installationId}`)
        .then(res => setLinked(res?.data || res))
        .catch(() => {});
    } else if (!isCrm && p?._isInstallation && p?.id) {
      const crmId = p.crmProjekt?.id || (() => {
        const td = typeof p.technicalData === "string" ? (() => { try { return JSON.parse(p.technicalData); } catch { return {}; } })() : (p.technicalData || {});
        return td.crmProjektId;
      })();
      if (crmId) {
        authFetch(`/api/crm/projekte/${crmId}`).then(setLinked).catch(() => {});
      }
    }
  }, [p?.id, p?.installationId, isCrm, p?._isInstallation]);

  if (!linked) return null;

  const blue = "#3b82f6";
  const accent = "#D4A843";

  if (isCrm) {
    const statusLabel = (linked.status || "").replace(/_/g, " ").toUpperCase();
    const daysAtNb = linked.daysAtCurrentStatus || linked.daysAtNb || "";
    return (
      <div style={{ background: `linear-gradient(135deg, ${blue}08, ${blue}03)`, border: `1px solid ${blue}25`, borderRadius: 12, padding: "16px 20px", margin: "0 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${blue}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚡</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: blue, textTransform: "uppercase", letterSpacing: 0.5 }}>Verknüpfte Netzanmeldung</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>{linked.publicId || `#${linked.id}`}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{linked.gridOperator || "—"}{daysAtNb ? ` · Seit ${daysAtNb} Tagen beim NB` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: `${blue}15`, color: blue }}>{statusLabel || "—"}</span>
            {linked.createdAt && <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Erstellt: {new Date(linked.createdAt).toLocaleDateString("de-DE")}</div>}
          </div>
          <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-installation", { detail: { id: linked.id } })), 100); }}
            style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>→ Öffnen</button>
        </div>
      </div>
    );
  }

  const stageLabel = (linked.stage || "").replace(/_/g, " ");
  const wert = linked.geschaetzterWert ? `${Number(linked.geschaetzterWert).toLocaleString("de-DE")} €` : "";
  return (
    <div style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}03)`, border: `1px solid ${accent}25`, borderRadius: 12, padding: "16px 20px", margin: "0 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 0.5 }}>Verknüpftes CRM-Projekt</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>CRM-{linked.id}{linked.organisation ? ` · ${linked.organisation}` : ""}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{wert ? `Wert: ${wert}` : ""}{wert && linked.angebotStatus ? " · " : ""}{linked.angebotStatus ? `Angebot: ${linked.angebotStatus}` : ""}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: `${accent}15`, color: accent }}>{stageLabel || "—"}</span>
          {linked.createdAt && <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Seit: {new Date(linked.createdAt).toLocaleDateString("de-DE")}</div>}
        </div>
        <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-crm-projekt", { detail: { id: linked.id } })), 100); }}
          style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>→ Öffnen</button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

// Tab-Shortcut Mapping
const TAB_SHORTCUTS: Record<string, string> = {
  "1": "uebersicht", "2": "verlauf", "3": "nb", "4": "vde",
  "5": "tix", "6": "docs", "7": "check", "8": "comments", "9": "montage",
};

export default function CrmDetailPanel({ item, onClose, mode = "crm" }: Props) {
  const { user } = useAuth();
  const userRole = ((user as any)?.role || "").toUpperCase();
  const isStaff = userRole === "ADMIN" || userRole === "MITARBEITER";
  const isCrm = mode === "crm";
  const authFetch = useAuthFetch();

  const [tab, setTab] = useState("uebersicht");
  const [p, setP] = useState<Record<string, any> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tab-Caching: bereits besuchte Tabs nicht neu laden
  const visitedTabs = useRef(new Set<string>(["uebersicht"]));
  const handleTabChange = useCallback((t: string) => {
    visitedTabs.current.add(t);
    setTab(t);
  }, []);

  // Keyboard: Escape schließt, 1-9 wechselt Tabs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Nicht triggern wenn in Input/Textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") { onClose(); return; }
      const tabKey = TAB_SHORTCUTS[e.key];
      if (tabKey) {
        const tabs = getDetailTabs(isCrm, 0);
        if (tabs.some(t => t.k === tabKey)) handleTabChange(tabKey);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isCrm, handleTabChange]);

  // Daten laden
  const loadData = useCallback(async () => {
    setLoadError(null);
    setP(null);
    try {
      if (isCrm) {
        const id = item._crmId || Math.abs(Number(item.id));
        const data = await authFetch(`/api/crm/projekte/${id}`);
        setP(data);
      } else {
        const id = item._installationId || item.id;
        const res = await authFetch(`/api/installations/${id}`);
        const d = res?.data || res;
        if (!d) throw new Error("Keine Daten gefunden");
        setP({
          ...d,
          titel: d.customerName || "—",
          kundenName: d.customerName || "—",
          kontaktEmail: d.contactEmail || "—",
          kontaktTelefon: d.contactPhone || "—",
          strasse: d.strasse || "",
          hausNr: d.hausNr || "",
          stage: mapInstStatusToStage(d.status),
          installationId: d.id,
          _isInstallation: true,
        });
      }
    } catch (err: any) {
      setLoadError(err.message || "Projekt konnte nicht geladen werden");
    }
  }, [item, isCrm]);

  useEffect(() => { loadData(); }, [loadData]);

  // Status-Transition
  const handleNextAction = useCallback(async () => {
    if (!p) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (p._isInstallation) {
        const trans = INST_TRANSITIONS[p.stage];
        if (!trans) { setActionError("Kein Übergang definiert"); setActionLoading(false); return; }
        await authFetch(`/api/v2/installations/${p.id}/transition`, { method: "POST", body: JSON.stringify(trans) });
        const fullData = await authFetch(`/api/installations/${p.id}`);
        const d = fullData?.data || fullData;
        setP(prev => ({ ...prev, ...d, titel: d.customerName || prev?.titel, kundenName: d.customerName || prev?.kundenName, kontaktEmail: d.contactEmail || prev?.kontaktEmail, kontaktTelefon: d.contactPhone || prev?.kontaktTelefon, strasse: d.strasse || "", hausNr: d.hausNr || "", stage: mapInstStatusToStage(d.status), installationId: d.id, _isInstallation: true }));
      } else {
        const nextStage = CRM_NEXT_STAGE[p.stage];
        if (!nextStage) { setActionError("Kein nächster Status"); setActionLoading(false); return; }
        await authFetch(`/api/crm/projekte/${p.id}/stage`, { method: "PUT", body: JSON.stringify({ stage: nextStage }) });
        const fullData = await authFetch(`/api/crm/projekte/${p.id}`);
        setP(prev => ({ ...prev, ...fullData }));
      }
    } catch (err: any) {
      setActionError(err.message || "Fehler bei Status-Änderung");
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  }, [p, authFetch]);

  // Loading / Error states
  if (loadError) return <DetailError error={loadError} onBack={onClose} onRetry={loadData} />;
  if (!p) return <DetailSkeleton onBack={onClose} />;

  // Computed values
  const STAGES = isCrm ? CRM_STAGES : INST_STAGES;
  const LABELS = isCrm ? CRM_LABELS : INST_LABELS;
  const COLORS = isCrm ? CRM_COLORS : INST_COLORS;

  const kwp = p.totalKwp ? Number(p.totalKwp) : 0;
  const stageIdx = STAGES.indexOf(p.stage);
  const statusLabel = LABELS[stageIdx] || p.stage;
  const statusColor = COLORS[stageIdx] || "#64748b";
  const nextAction = getNextActionLabel(p.stage, !!p._isInstallation);

  // Workflow-Steps — ohne Fake-Dates
  const workflow: WorkflowStep[] = LABELS.map((l, i) => ({
    l, done: i < stageIdx, current: i === stageIdx, c: COLORS[i],
    // Nur echte Dates zeigen wenn vorhanden
    date: undefined,
  }));

  // Kommentare → Log (für CRM-Übersicht)
  const log = (p.kommentare || []).slice(0, 20).map((k: any) => {
    const m = k.text?.match(/^\[([^\]]+)\]\s*/);
    const who = k.isSystem ? "System" : m ? m[1] : "User";
    const text = m ? k.text.replace(m[0], "") : k.text;
    const isReply = k.text?.startsWith("↳");
    return {
      date: new Date(k.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      time: new Date(k.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      who, action: text.substring(0, 60), detail: text.length > 60 ? text.substring(60, 150) : "",
      color: k.isSystem ? "#f97316" : isReply ? "#94a3b8" : "#D4A843",
      icon: k.isSystem ? "⚙" : isReply ? "↳" : "💬",
    };
  });

  // Dokumente
  const instDocs = p._isInstallation ? (p.documents || []) : [];
  const rawDocs = p._isInstallation
    ? instDocs.map((d: any) => ({ n: d.originalName || d.dateiname || "Dokument", ok: true, by: "Upload", date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : "", kategorie: (d.kategorie || "").toLowerCase(), dokumentTyp: (d.dokumentTyp || "").toLowerCase() }))
    : (p.aktivitaeten || []).filter((a: any) => a.typ === "DOKUMENT").slice(0, 6).map((a: any) => ({ n: a.titel?.replace("📄 ", "") || "Dokument", ok: true, by: "Factro", date: new Date(a.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), kategorie: "", dokumentTyp: "" }));

  const pflichtDocs = [
    { n: "Lageplan", keys: ["lageplan"] },
    { n: "Schaltplan", keys: ["schaltplan", "uebersichtsschaltplan"] },
    { n: "VDE E.1", keys: ["antrag", "vde_e1", "e1"] },
  ];
  const fullDocs = pflichtDocs.map(({ n, keys }) => {
    const found = rawDocs.find((d: any) => keys.some((k: string) => d.kategorie?.includes(k) || d.dokumentTyp?.includes(k) || d.n.toLowerCase().includes(k)));
    return found || { n, ok: false };
  });

  const docsOk = fullDocs.filter((d: any) => d.ok).length;
  const vollst = Math.round((docsOk / 3) * 100);
  const angebotWert = p.geschaetzterWert ? `${Number(p.geschaetzterWert).toLocaleString("de-DE")} €` : undefined;

  const linkedCrmId = isCrm ? p.id : (p.crmProjekt?.id || (() => {
    const td = typeof p.technicalData === "string" ? (() => { try { return JSON.parse(p.technicalData); } catch { return {}; } })() : (p.technicalData || {});
    return td.crmProjektId || 0;
  })());

  const tabs = getDetailTabs(isCrm, 0);

  // Tab-Content rendern — besuchte Tabs bleiben gemounted (hidden) für Caching
  const renderTab = (tabKey: string) => {
    const isActive = tab === tabKey;
    const wasVisited = visitedTabs.current.has(tabKey);
    if (!isActive && !wasVisited) return null;
    return (
      <div key={tabKey} style={{ display: isActive ? "block" : "none" }}>
        {tabKey === "verlauf" && <TabVerlauf installationId={p._isInstallation ? p.id : (p.installationId || 0)} crmId={linkedCrmId} isStaff={isStaff} />}
        {tabKey === "comments" && <TabKommentare crmId={linkedCrmId} installationId={p._isInstallation ? p.id : (p.installationId || undefined)} />}
        {tabKey === "docs" && <TabDokumente crmId={linkedCrmId} installationId={p._isInstallation ? p.id : undefined} />}
        {tabKey === "vde" && <TabVdeCenter crmId={linkedCrmId} kwp={kwp} installationId={p._isInstallation ? p.id : p.installationId} />}
        {tabKey === "angebot" && isCrm && <TabAngebot crmId={p.id} projekt={p} />}
        {tabKey === "tix" && <TabTickets crmId={linkedCrmId} installationId={p._isInstallation ? p.id : p.installationId} />}
        {tabKey === "nb" && <TabNbKomm crmId={linkedCrmId} installationId={p._isInstallation ? p.id : (p.installationId || undefined)} />}
        {tabKey === "check" && <TabUnterlagen crmId={linkedCrmId} kwp={kwp} installationId={p._isInstallation ? p.id : undefined} />}
        {tabKey === "montage" && isCrm && <TabMontage crmId={p.id} installationId={p.installationId} />}
        {tabKey === "uebersicht" && !p._isInstallation && (
          <DetailUebersicht
            projekt={p}
            docs={fullDocs} log={log} onTabChange={handleTabChange}
          />
        )}
        {tabKey === "uebersicht" && p._isInstallation && (
          <InstallationUebersicht data={p} onTabChange={handleTabChange} isStaff={isStaff} />
        )}
      </div>
    );
  };

  const knownTabs = ["uebersicht", "verlauf", "comments", "docs", "vde", "angebot", "tix", "nb", "check", "montage"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#060b18", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", overflowY: "auto" }}>
      <style>{css}</style>
      <DetailHeader
        title={p.titel || p.kundenName || "—"}
        subtitle={p._isInstallation ? (p.publicId || `Installation #${p.id}`) : (p.kundenName || "—")}
        id={isCrm ? `CRM-${p.id}` : (p.publicId || `#${p.id}`)}
        status={statusLabel} statusColor={statusColor}
        srcLabel={isCrm ? "CRM" : "Wizard"} srcIcon={isCrm ? "📊" : "⚡"} srcColor={isCrm ? "#D4A843" : "#3b82f6"}
        kwp={kwp ? String(kwp) : "—"} ort={[p.plz, p.ort].filter(Boolean).join(" ")} nb={p.gridOperator || "—"}
        tickets={0} docsOk={docsOk} docsTotal={3} vollstaendigkeit={vollst}
        angebotWert={isCrm ? angebotWert : undefined} hasCrm={isCrm}
        nextAction={nextAction.text}
        nextActionColor={nextAction.color}
        onNextAction={nextAction.actionable ? handleNextAction : undefined}
        nextActionLoading={actionLoading}
        nextActionError={actionError}
        dedicatedEmail={p._isInstallation ? p.dedicatedEmail : undefined}
        workflow={workflow} onBack={onClose}
        isInstallation={!!p._isInstallation}
        quickActions={[
          { label: "Kommentar schreiben", icon: "💬", color: "#a5b4fc", onClick: () => handleTabChange("comments") },
          { label: "Dokument hochladen", icon: "📄", color: "#06b6d4", onClick: () => handleTabChange("docs") },
          { label: "Ticket erstellen", icon: "🎫", color: "#f59e0b", onClick: () => handleTabChange("tix") },
        ]}
        onQuickStatusChange={async (status: string) => {
          setActionLoading(true);
          setActionError(null);
          try {
            if (p._isInstallation) {
              await authFetch(`/api/v2/installations/${p.id}/transition`, { method: "POST", body: JSON.stringify({ toPhase: status.toLowerCase(), toZustand: "offen" }) });
              const fullData = await authFetch(`/api/installations/${p.id}`);
              const d = fullData?.data || fullData;
              setP(prev => ({ ...prev, ...d, titel: d.customerName || prev?.titel, kundenName: d.customerName || prev?.kundenName, kontaktEmail: d.contactEmail || prev?.kontaktEmail, kontaktTelefon: d.contactPhone || prev?.kontaktTelefon, strasse: d.strasse || "", hausNr: d.hausNr || "", stage: mapInstStatusToStage(d.status), installationId: d.id, _isInstallation: true }));
            } else {
              await authFetch(`/api/crm/projekte/${p.id}/stage`, { method: "PUT", body: JSON.stringify({ stage: status }) });
              const fullData = await authFetch(`/api/crm/projekte/${p.id}`);
              setP(prev => ({ ...prev, ...fullData }));
            }
          } catch (err: any) {
            setActionError(err.message || "Fehler");
            setTimeout(() => setActionError(null), 5000);
          } finally {
            setActionLoading(false);
          }
        }}
      />
      <VerknuepfungCard p={p} isCrm={isCrm} onClose={onClose} />
      <DetailTabBar tabs={tabs} active={tab} onChange={handleTabChange} />
      <div style={{ padding: "12px 20px", maxWidth: 1200, margin: "0 auto" }}>
        {knownTabs.map(renderTab)}
        {!knownTabs.includes(tab) && <DetailTabPlaceholder tab={tab} hasCrm={isCrm} />}
      </div>
    </div>
  );
}

/**
 * HV LEADS TAB
 * CRM / Lead management for Handelsvertreter
 * All sub-components inline (StatCard, StatusBadge, InteresseBadge, LeadTable, PipelineView, DetailPanel, NewLeadModal)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Calendar,
  X,
  MessageSquare,
  PhoneCall,
  Video,
  ExternalLink,
  BarChart3,
  Users,
  Target,
  Clock,
  Filter,
  Edit3,
  Trash2,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Globe,
  ChevronRight,
  Loader2,
  Check,
  RefreshCw,
} from "lucide-react";
import { api } from "../../../../modules/api/client";
import "../../../netzanmeldungen/components/detail-panel-styles.css";

/* ── Types ── */

interface Lead {
  id: number;
  firmenName: string;
  ansprechpartner: string;
  email: string | null;
  telefon: string | null;
  website: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  branche: string | null;
  status: LeadStatus;
  interesse: LeadInteresse;
  quelle: string | null;
  anmeldungenProMonat: number | null;
  naechsterKontakt: string | null;
  konvertiertAm: string | null;
  erstnotiz: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  activities?: LeadActivity[];
}

interface LeadNote {
  id: number;
  text: string;
  createdAt: string;
  createdBy?: string;
}

interface LeadActivity {
  id: number;
  type: string;
  note: string | null;
  datum: string;
  createdAt: string;
  createdBy?: string;
}

interface LeadStats {
  total: number;
  neu: number;
  kontaktiert: number;
  qualifiziert: number;
  disqualifiziert: number;
  wiedervorlagenFaellig: number;
  pipelineAnmeldungen: number;
  conversionRate: number;
}

interface DuplicateMatch {
  id: number;
  firmenName: string;
  ansprechpartner: string;
  email: string | null;
  telefon: string | null;
  matchReason: string;
}

type LeadStatus = "NEU" | "KONTAKTIERT" | "QUALIFIZIERT" | "DISQUALIFIZIERT";
type LeadInteresse = "HOCH" | "MITTEL" | "NIEDRIG" | "UNBEKANNT";

/* ── Constants ── */

const STATUS_CONFIG: Record<LeadStatus, { label: string; sub: string; color: string; bg: string; dot: string }> = {
  NEU: { label: "Zu Kontaktieren", sub: "", color: "#D4A843", bg: "rgba(212,168,67,0.15)", dot: "#D4A843" },
  KONTAKTIERT: { label: "Kontaktiert", sub: "In Bearbeitung", color: "#3b82f6", bg: "rgba(59,130,246,0.15)", dot: "#3b82f6" },
  QUALIFIZIERT: { label: "Qualifiziert", sub: "Angebot möglich", color: "#22c55e", bg: "rgba(34,197,94,0.15)", dot: "#22c55e" },
  DISQUALIFIZIERT: { label: "Disqualifiziert", sub: "", color: "#ef4444", bg: "rgba(239,68,68,0.15)", dot: "#ef4444" },
};

const BRANCHE_LABELS: Record<string, string> = {
  SOLARTEUR: "Solarteur",
  ELEKTRIKER: "Elektriker",
  DACHDECKER: "Dachdecker",
  HAUSBAU: "Hausbau",
  ENERGIEBERATER: "Energieberater",
  STADTWERK: "Stadtwerk",
  HANDWERK: "Handwerk",
  SONSTIGE: "Sonstige",
};

const INTERESSE_CONFIG: Record<LeadInteresse, { label: string; color: string }> = {
  HOCH: { label: "Hoch", color: "#34D399" },
  MITTEL: { label: "Mittel", color: "#FBBF24" },
  NIEDRIG: { label: "Niedrig", color: "#F87171" },
  UNBEKANNT: { label: "Unbekannt", color: "#71717a" },
};

const QUELLE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  EMPFEHLUNG: "Empfehlung",
  MESSE: "Messe",
  KALTAKQUISE: "Kaltakquise",
  SOCIAL_MEDIA: "Social Media",
  PARTNER: "Partner",
  SONSTIGE: "Sonstige",
};

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ size?: number; style?: CSSProperties }>> = {
  ANRUF: PhoneCall,
  EMAIL: Mail,
  BESUCH: MapPin,
  VIDEO: Video,
};

const ACTIVITY_LABELS: Record<string, string> = {
  ANRUF: "Anruf",
  EMAIL: "E-Mail",
  BESUCH: "Besuch",
  VIDEO: "Videocall",
};

const STATUS_ORDER: LeadStatus[] = ["NEU", "KONTAKTIERT", "QUALIFIZIERT", "DISQUALIFIZIERT"];

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "-";

const formatDateTime = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const isOverdue = (d: string | null): boolean => {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
};

/* ── Sub-Components ── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ size?: number; style?: CSSProperties }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#71717a", marginBottom: "2px" }}>{label}</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>{value}</div>
        </div>
      </div>
      {sub && (
        <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#71717a" }}>{sub}</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEU;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "0.25rem 0.625rem",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

function InteresseBadge({ interesse }: { interesse: LeadInteresse }) {
  const cfg = INTERESSE_CONFIG[interesse] || INTERESSE_CONFIG.UNBEKANNT;
  return (
    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ── LeadTable ── */

function LeadTable({
  leads,
  onSelect,
  sortBy,
  sortOrder,
  onSort,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return (
      <span style={{ marginLeft: "4px", fontSize: "0.7rem" }}>
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const thClickable = (field: string): CSSProperties => ({
    ...styles.th,
    cursor: "pointer",
    userSelect: "none",
  });

  return (
    <div style={styles.tableContainer}>
      <table style={styles.dataTable}>
        <thead>
          <tr>
            <th style={thClickable("firmenName")} onClick={() => onSort("firmenName")}>
              Firma {renderSortIcon("firmenName")}
            </th>
            <th style={styles.th}>Ansprechpartner</th>
            <th style={thClickable("ort")} onClick={() => onSort("ort")}>
              Ort {renderSortIcon("ort")}
            </th>
            <th style={styles.th}>Branche</th>
            <th style={thClickable("status")} onClick={() => onSort("status")}>
              Status {renderSortIcon("status")}
            </th>
            <th style={styles.th}>Interesse</th>
            <th style={thClickable("anmeldungenProMonat")} onClick={() => onSort("anmeldungenProMonat")}>
              Anm./Mon. {renderSortIcon("anmeldungenProMonat")}
            </th>
            <th style={thClickable("naechsterKontakt")} onClick={() => onSort("naechsterKontakt")}>
              Nächster Kontakt {renderSortIcon("naechsterKontakt")}
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 && (
            <tr>
              <td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#71717a", padding: "3rem" }}>
                Keine Leads gefunden
              </td>
            </tr>
          )}
          {leads.map((lead) => {
            const overdue = isOverdue(lead.naechsterKontakt);
            return (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead)}
                style={{
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <td style={{ ...styles.td, fontWeight: 600, color: "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Building2 size={14} style={{ color: "#71717a", flexShrink: 0 }} />
                    {lead.firmenName}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <User size={13} style={{ color: "#71717a", flexShrink: 0 }} />
                    {lead.ansprechpartner}
                  </div>
                </td>
                <td style={styles.td}>{lead.ort || "-"}</td>
                <td style={styles.td}>{lead.branche ? BRANCHE_LABELS[lead.branche] || lead.branche : "-"}</td>
                <td style={styles.td}>
                  <StatusBadge status={lead.status} />
                </td>
                <td style={styles.td}>
                  <InteresseBadge interesse={lead.interesse} />
                </td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  {lead.anmeldungenProMonat ?? "-"}
                </td>
                <td
                  style={{
                    ...styles.td,
                    color: overdue ? "#F87171" : "#e2e8f0",
                    fontWeight: overdue ? 600 : 400,
                  }}
                >
                  {lead.naechsterKontakt ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} style={{ color: overdue ? "#F87171" : "#71717a", flexShrink: 0 }} />
                      {formatDate(lead.naechsterKontakt)}
                      {overdue && <AlertCircle size={13} style={{ color: "#F87171" }} />}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── PipelineView ── */

function PipelineView({
  leads,
  onSelect,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
}) {
  const grouped: Record<LeadStatus, Lead[]> = {
    NEU: [],
    KONTAKTIERT: [],
    QUALIFIZIERT: [],
    DISQUALIFIZIERT: [],
  };
  leads.forEach((l) => {
    if (grouped[l.status]) grouped[l.status].push(l);
  });

  return (
    <div style={styles.pipelineContainer}>
      {STATUS_ORDER.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const items = grouped[status];
        return (
          <div key={status} style={styles.pipelineColumn}>
            <div style={styles.pipelineHeader}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: cfg.dot,
                  flexShrink: 0,
                }}
              />
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: cfg.color, fontWeight: 600, fontSize: "0.8rem" }}>{cfg.label}</span>
                {cfg.sub && <span style={{ color: "#64748b", fontSize: "0.65rem" }}>{cfg.sub}</span>}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.7rem",
                  color: "#71717a",
                  background: "rgba(255,255,255,0.08)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {items.length}
              </span>
            </div>
            <div style={styles.pipelineCards}>
              {items.map((lead) => {
                const overdue = isOverdue(lead.naechsterKontakt);
                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelect(lead)}
                    style={{
                      ...styles.pipelineCard,
                      borderLeft: `3px solid ${cfg.dot}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.85rem", marginBottom: "4px" }}>
                      {lead.firmenName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a1a1aa", marginBottom: "4px" }}>
                      <User size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      {lead.ansprechpartner}
                    </div>
                    {lead.ort && (
                      <div style={{ fontSize: "0.75rem", color: "#71717a", marginBottom: "4px" }}>
                        <MapPin size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                        {lead.ort}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                      {lead.anmeldungenProMonat != null && (
                        <span style={{ fontSize: "0.7rem", color: "#a1a1aa" }}>
                          {lead.anmeldungenProMonat} Anm./Mon.
                        </span>
                      )}
                      {lead.naechsterKontakt && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: overdue ? "#F87171" : "#71717a",
                            fontWeight: overdue ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Clock size={10} />
                          {formatDate(lead.naechsterKontakt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: "#52525b", fontSize: "0.75rem" }}>
                  Keine Leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── DetailPanel ── */

function DetailPanel({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [detailLead, setDetailLead] = useState<Lead>(lead);
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "notes">("overview");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [activityForm, setActivityForm] = useState<{ type: string; note: string; datum: string } | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [visible, setVisible] = useState(false);

  // Slide-in animation
  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  // Load full lead detail
  const loadDetail = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/hv/leads/${lead.id}`);
      setDetailLead(res.data.data || res.data);
    } catch {
      // keep existing data
    } finally {
      setLoadingDetail(false);
    }
  }, [lead.id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const startEdit = () => {
    setEditMode(true);
    setEditForm({
      firmenName: detailLead.firmenName,
      ansprechpartner: detailLead.ansprechpartner,
      email: detailLead.email,
      telefon: detailLead.telefon,
      website: detailLead.website,
      strasse: detailLead.strasse,
      plz: detailLead.plz,
      ort: detailLead.ort,
      branche: detailLead.branche,
      status: detailLead.status,
      interesse: detailLead.interesse,
      quelle: detailLead.quelle,
      anmeldungenProMonat: detailLead.anmeldungenProMonat,
      naechsterKontakt: detailLead.naechsterKontakt ? detailLead.naechsterKontakt.split("T")[0] : null,
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/hv/leads/${detailLead.id}`, editForm);
      setEditMode(false);
      await loadDetail();
      onUpdate();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/hv/leads/${detailLead.id}`);
      handleClose();
      onUpdate();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.post(`/hv/leads/${detailLead.id}/notes`, { text: noteText.trim() });
      setNoteText("");
      await loadDetail();
    } catch {
      // silent
    } finally {
      setSavingNote(false);
    }
  };

  const startActivity = (type: string) => {
    setActivityForm({ type, note: "", datum: new Date().toISOString().split("T")[0] });
  };

  const saveActivity = async () => {
    if (!activityForm) return;
    setSavingActivity(true);
    try {
      await api.post(`/hv/leads/${detailLead.id}/activities`, activityForm);
      setActivityForm(null);
      await loadDetail();
    } catch {
      // silent
    } finally {
      setSavingActivity(false);
    }
  };

  const DETAIL_TABS = [
    { id: "overview" as const, label: "Übersicht", icon: Building2 },
    { id: "activities" as const, label: "Aktivitäten", icon: Clock },
    { id: "notes" as const, label: "Notizen", icon: MessageSquare },
  ];

  const statusCfg = STATUS_CONFIG[detailLead.status] || STATUS_CONFIG.NEU;
  const interesseCfg = INTERESSE_CONFIG[detailLead.interesse] || INTERESSE_CONFIG.UNBEKANNT;
  const address = [detailLead.strasse, [detailLead.plz, detailLead.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <div className={`dp-overlay ${visible ? "dp-overlay--visible" : ""}`} onClick={handleClose}>
      <div
        className={`dp-panel ${visible ? "dp-panel--visible" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "780px" }}
      >
        {/* ── HEADER ── */}
        <div className="dp-header">
          <div className="dp-header__top">
            <div className="dp-header__id">
              <span className="dp-header__badge" style={{ background: `${statusCfg.color}20`, color: statusCfg.color }}>
                <Target size={12} /> LEAD
              </span>
              <span className="dp-header__public-id">
                LEAD-{detailLead.id}
              </span>
            </div>
            <div className="dp-header__actions">
              {!editMode && (
                <button className="dp-btn dp-btn--icon" onClick={startEdit} title="Bearbeiten">
                  <Edit3 size={16} />
                </button>
              )}
              <button className="dp-btn dp-btn--icon" onClick={() => loadDetail()} title="Aktualisieren">
                <RefreshCw size={16} />
              </button>
              {!editMode && (
                <button className="dp-btn dp-btn--icon dp-btn--danger" onClick={() => setShowDeleteConfirm(true)} title="Löschen">
                  <Trash2 size={16} />
                </button>
              )}
              <button className="dp-btn dp-btn--icon dp-btn--close" onClick={handleClose} title="Schließen (Esc)">
                <X size={18} />
              </button>
            </div>
          </div>

          <h2 className="dp-header__title">{detailLead.firmenName}</h2>

          <div className="dp-header__meta">
            <div className={`dp-header__status`} style={{ background: `${statusCfg.color}20`, color: statusCfg.color }}>
              <span>{statusCfg.dot ? "●" : "○"}</span>
              {statusCfg.label}
            </div>
            {detailLead.ansprechpartner && (
              <span className="dp-header__meta-item">
                <User size={12} /> {detailLead.ansprechpartner}
              </span>
            )}
            {address && (
              <span className="dp-header__meta-item">
                <MapPin size={12} /> {address}
              </span>
            )}
            <span className="dp-header__meta-item">
              <Calendar size={12} /> {formatDate(detailLead.createdAt)}
            </span>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="dp-quick-actions">
          <span className="dp-quick-actions__label">Aktionen:</span>
          {detailLead.email && (
            <a href={`mailto:${detailLead.email}`} className="dp-quick-action" style={{ borderColor: "#60a5fa", color: "#60a5fa", textDecoration: "none" }}>
              <Mail size={12} /> E-Mail senden
            </a>
          )}
          {detailLead.telefon && (
            <a href={`tel:${detailLead.telefon}`} className="dp-quick-action" style={{ borderColor: "#34d399", color: "#34d399", textDecoration: "none" }}>
              <Phone size={12} /> Anrufen
            </a>
          )}
          {detailLead.website && (
            <a
              href={detailLead.website.startsWith("http") ? detailLead.website : `https://${detailLead.website}`}
              target="_blank" rel="noopener noreferrer"
              className="dp-quick-action"
              style={{ borderColor: "#f0d878", color: "#f0d878", textDecoration: "none" }}
            >
              <Globe size={12} /> Website
            </a>
          )}
        </div>

        {/* ── DELETE CONFIRM ── */}
        {showDeleteConfirm && (
          <div className="dp-alerts">
            <div className="dp-alert dp-alert--error">
              <AlertCircle size={16} />
              <div className="dp-alert__content">
                <strong>Lead löschen?</strong>
                <span>&quot;{detailLead.firmenName}&quot; wird unwiderruflich gelöscht.</span>
              </div>
              <button className="dp-alert__action" onClick={handleDelete} disabled={deleting} style={{ color: "#f87171" }}>
                {deleting ? <Loader2 size={12} className="dp-spin" /> : "Löschen"}
              </button>
              <button className="dp-alert__action" onClick={() => setShowDeleteConfirm(false)} style={{ color: "#94a3b8" }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* ── MAIN LAYOUT ── */}
        <div className="dp-main-layout">
          <div className="dp-main-content">
            {/* TABS */}
            <div className="dp-tabs">
              {DETAIL_TABS.map((tab) => {
                const Icon = tab.icon;
                let badge: number | null = null;
                if (tab.id === "notes" && detailLead.notes && detailLead.notes.length > 0) badge = detailLead.notes.length;
                if (tab.id === "activities" && detailLead.activities && detailLead.activities.length > 0) badge = detailLead.activities.length;
                return (
                  <button
                    key={tab.id}
                    className={`dp-tab ${activeTab === tab.id ? "dp-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {badge !== null && <span className="dp-tab__badge">{badge}</span>}
                  </button>
                );
              })}
            </div>

            {/* CONTENT */}
            <div className="dp-content">
              {loadingDetail && (
                <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
                  <Loader2 size={24} className="dp-spin" style={{ color: "#64748b" }} />
                </div>
              )}

              {/* ── Overview Tab ── */}
              {activeTab === "overview" && !loadingDetail && (
                <>
                  {editMode ? (
                    <div className="dp-overview-card">
                      <div className="dp-overview-card__header">
                        <Edit3 size={18} />
                        <h4>Lead bearbeiten</h4>
                      </div>
                      <div className="dp-overview-card__content" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        {[
                          { label: "Firmenname", field: "firmenName" as keyof Lead, type: "text" },
                          { label: "Ansprechpartner", field: "ansprechpartner" as keyof Lead, type: "text" },
                          { label: "E-Mail", field: "email" as keyof Lead, type: "email" },
                          { label: "Telefon", field: "telefon" as keyof Lead, type: "tel" },
                          { label: "Website", field: "website" as keyof Lead, type: "url" },
                          { label: "Straße", field: "strasse" as keyof Lead, type: "text" },
                          { label: "PLZ", field: "plz" as keyof Lead, type: "text" },
                          { label: "Ort", field: "ort" as keyof Lead, type: "text" },
                          { label: "Anmeldungen/Monat", field: "anmeldungenProMonat" as keyof Lead, type: "number" },
                          { label: "Nächster Kontakt", field: "naechsterKontakt" as keyof Lead, type: "date" },
                        ].map(({ label, field, type }) => (
                          <div key={field}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>{label}</label>
                            <input
                              type={type}
                              value={(editForm[field] as string | number) ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, [field]: type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value || null })}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f8fafc", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
                          </div>
                        ))}
                        {[
                          { label: "Branche", field: "branche" as keyof Lead, options: BRANCHE_LABELS },
                          { label: "Status", field: "status" as keyof Lead, options: Object.fromEntries(STATUS_ORDER.map((s) => [s, STATUS_CONFIG[s].label])) },
                          { label: "Interesse", field: "interesse" as keyof Lead, options: Object.fromEntries(Object.entries(INTERESSE_CONFIG).map(([k, v]) => [k, v.label])) },
                          { label: "Quelle", field: "quelle" as keyof Lead, options: QUELLE_LABELS },
                        ].map(({ label, field, options }) => (
                          <div key={field}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>{label}</label>
                            <select
                              value={(editForm[field] as string) || ""}
                              onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value || null })}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f8fafc", fontSize: "13px", outline: "none", colorScheme: "dark" }}
                            >
                              <option value="">— Bitte wählen —</option>
                              {Object.entries(options).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button className="dp-quick-action" style={{ borderColor: "#60a5fa", color: "#60a5fa" }} onClick={saveEdit} disabled={saving}>
                            {saving ? <Loader2 size={12} className="dp-spin" /> : <Check size={12} />} Speichern
                          </button>
                          <button className="dp-quick-action" style={{ borderColor: "#64748b", color: "#64748b" }} onClick={() => setEditMode(false)}>
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Kontakt Card */}
                      <div className="dp-overview-card">
                        <div className="dp-overview-card__header">
                          <User size={18} />
                          <h4>Kontaktdaten</h4>
                        </div>
                        <div className="dp-overview-card__content">
                          <div className="dp-copyable-field">
                            <User size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Ansprechpartner</span>
                              <span className="dp-copyable-field__value">{detailLead.ansprechpartner || "—"}</span>
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <Mail size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">E-Mail</span>
                              {detailLead.email ? (
                                <a href={`mailto:${detailLead.email}`} className="dp-copyable-field__value">{detailLead.email}</a>
                              ) : (
                                <span className="dp-copyable-field__value">—</span>
                              )}
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <Phone size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Telefon</span>
                              {detailLead.telefon ? (
                                <a href={`tel:${detailLead.telefon}`} className="dp-copyable-field__value">{detailLead.telefon}</a>
                              ) : (
                                <span className="dp-copyable-field__value">—</span>
                              )}
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <MapPin size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Adresse</span>
                              <span className="dp-copyable-field__value">{address || "—"}</span>
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <Globe size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Website</span>
                              {detailLead.website ? (
                                <a
                                  href={detailLead.website.startsWith("http") ? detailLead.website : `https://${detailLead.website}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="dp-copyable-field__value"
                                >
                                  {detailLead.website} <ExternalLink size={11} />
                                </a>
                              ) : (
                                <span className="dp-copyable-field__value">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Potenzial Card */}
                      <div className="dp-overview-card">
                        <div className="dp-overview-card__header">
                          <TrendingUp size={18} />
                          <h4>Potenzial &amp; Interesse</h4>
                        </div>
                        <div className="dp-overview-card__content">
                          <div className="dp-copyable-field">
                            <BarChart3 size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Anmeldungen / Monat</span>
                              <span className="dp-copyable-field__value" style={{ fontSize: "18px", fontWeight: 700 }}>
                                {detailLead.anmeldungenProMonat ?? "—"}
                              </span>
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <Target size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Interesse</span>
                              <span className="dp-copyable-field__value">
                                <span style={{ background: `${interesseCfg.color}20`, color: interesseCfg.color, padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                                  {interesseCfg.label}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details Card */}
                      <div className="dp-overview-card">
                        <div className="dp-overview-card__header">
                          <Building2 size={18} />
                          <h4>Details</h4>
                        </div>
                        <div className="dp-overview-card__content">
                          <div className="dp-copyable-field">
                            <Building2 size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Branche</span>
                              <span className="dp-copyable-field__value">{detailLead.branche ? BRANCHE_LABELS[detailLead.branche] || detailLead.branche : "—"}</span>
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <Target size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Quelle</span>
                              <span className="dp-copyable-field__value">{detailLead.quelle ? QUELLE_LABELS[detailLead.quelle] || detailLead.quelle : "—"}</span>
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <Clock size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Nächster Kontakt</span>
                              <span className="dp-copyable-field__value" style={{
                                color: isOverdue(detailLead.naechsterKontakt) ? "#f87171" : undefined,
                                fontWeight: isOverdue(detailLead.naechsterKontakt) ? 600 : undefined,
                              }}>
                                {formatDate(detailLead.naechsterKontakt)}
                              </span>
                            </div>
                          </div>
                          <div className="dp-copyable-field">
                            <CheckCircle size={14} className="dp-copyable-field__icon" />
                            <div className="dp-copyable-field__content">
                              <span className="dp-copyable-field__label">Konvertiert am</span>
                              <span className="dp-copyable-field__value">{formatDate(detailLead.konvertiertAm)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Erstnotiz Card */}
                      {detailLead.erstnotiz && (
                        <div className="dp-overview-card">
                          <div className="dp-overview-card__header">
                            <MessageSquare size={18} />
                            <h4>Erstnotiz</h4>
                          </div>
                          <div className="dp-overview-card__content">
                            <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, padding: "4px 0" }}>
                              {detailLead.erstnotiz}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Activities Tab ── */}
              {activeTab === "activities" && !loadingDetail && (
                <>
                  {/* Activity type buttons */}
                  <div className="dp-quick-actions" style={{ borderBottom: "none" }}>
                    <span className="dp-quick-actions__label">Aktivität loggen:</span>
                    {Object.entries(ACTIVITY_LABELS).map(([type, label]) => {
                      const Icon = ACTIVITY_ICONS[type] || MessageSquare;
                      return (
                        <button
                          key={type}
                          className="dp-quick-action"
                          style={{
                            borderColor: activityForm?.type === type ? "#60a5fa" : "#475569",
                            color: activityForm?.type === type ? "#60a5fa" : "#94a3b8",
                          }}
                          onClick={() => startActivity(type)}
                        >
                          <Icon size={12} /> {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline activity form */}
                  {activityForm && (
                    <div className="dp-overview-card" style={{ borderColor: "rgba(96,165,250,0.2)" }}>
                      <div className="dp-overview-card__header">
                        <Clock size={18} />
                        <h4>{ACTIVITY_LABELS[activityForm.type] || activityForm.type} loggen</h4>
                      </div>
                      <div className="dp-overview-card__content" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>Datum</label>
                          <input
                            type="date"
                            value={activityForm.datum}
                            onChange={(e) => setActivityForm({ ...activityForm, datum: e.target.value })}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f8fafc", fontSize: "13px", outline: "none", boxSizing: "border-box", colorScheme: "dark" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>Notiz</label>
                          <input
                            type="text"
                            placeholder="Optional..."
                            value={activityForm.note}
                            onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f8fafc", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
                          <button className="dp-quick-action" style={{ borderColor: "#60a5fa", color: "#60a5fa" }} onClick={saveActivity} disabled={savingActivity}>
                            {savingActivity ? <Loader2 size={12} className="dp-spin" /> : <Check size={12} />} Speichern
                          </button>
                          <button className="dp-quick-action" style={{ borderColor: "#64748b", color: "#64748b" }} onClick={() => setActivityForm(null)}>
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {(!detailLead.activities || detailLead.activities.length === 0) ? (
                    <div style={{ textAlign: "center", color: "#64748b", padding: "48px 16px", fontSize: "13px" }}>
                      Noch keine Aktivitäten erfasst
                    </div>
                  ) : (
                    <div className="dp-overview-card">
                      <div className="dp-overview-card__header">
                        <Clock size={18} />
                        <h4>Verlauf</h4>
                        <span className="dp-badge">{detailLead.activities.length}</span>
                      </div>
                      <div className="dp-overview-card__content" style={{ padding: 0 }}>
                        {detailLead.activities.map((act, idx) => {
                          const Icon = ACTIVITY_ICONS[act.type] || MessageSquare;
                          return (
                            <div key={act.id} style={{
                              display: "flex", gap: "12px", padding: "12px 16px",
                              borderBottom: idx < (detailLead.activities?.length || 0) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: "8px",
                                background: "rgba(96,165,250,0.1)", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                color: "#60a5fa", flexShrink: 0,
                              }}>
                                <Icon size={14} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontWeight: 600, color: "#f8fafc", fontSize: "13px" }}>
                                    {ACTIVITY_LABELS[act.type] || act.type}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                                    {formatDateTime(act.datum)}
                                  </span>
                                </div>
                                {act.note && (
                                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>{act.note}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Notes Tab ── */}
              {activeTab === "notes" && !loadingDetail && (
                <>
                  {/* Add note form */}
                  <div className="dp-overview-card" style={{ borderColor: "rgba(96,165,250,0.15)" }}>
                    <div className="dp-overview-card__header">
                      <MessageSquare size={18} />
                      <h4>Neue Notiz</h4>
                    </div>
                    <div className="dp-overview-card__content">
                      <textarea
                        rows={3}
                        placeholder="Notiz hinzufügen..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        style={{
                          width: "100%", padding: "12px 14px", borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)",
                          color: "#f8fafc", fontSize: "13px", fontFamily: "inherit", resize: "vertical",
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                        <button
                          className="dp-quick-action"
                          style={{ borderColor: "#60a5fa", color: "#60a5fa", opacity: (!noteText.trim() || savingNote) ? 0.5 : 1 }}
                          onClick={saveNote}
                          disabled={savingNote || !noteText.trim()}
                        >
                          {savingNote ? <Loader2 size={12} className="dp-spin" /> : <MessageSquare size={12} />} Speichern
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes list */}
                  {(!detailLead.notes || detailLead.notes.length === 0) ? (
                    <div style={{ textAlign: "center", color: "#64748b", padding: "48px 16px", fontSize: "13px" }}>
                      Noch keine Notizen vorhanden
                    </div>
                  ) : (
                    <div className="dp-overview-card">
                      <div className="dp-overview-card__header">
                        <MessageSquare size={18} />
                        <h4>Notizen</h4>
                        <span className="dp-badge">{detailLead.notes.length}</span>
                      </div>
                      <div className="dp-overview-card__content" style={{ padding: 0 }}>
                        {detailLead.notes.map((note, idx) => (
                          <div key={note.id} style={{
                            padding: "14px 16px",
                            borderBottom: idx < (detailLead.notes?.length || 0) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
                                {note.createdBy || "Du"}
                              </span>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>
                                {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                              {note.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="dp-sidebar">
            {/* Status */}
            <div className="dp-sidebar__section">
              <h4><ArrowRight size={14} /> Status</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {STATUS_ORDER.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const isActive = detailLead.status === s;
                  return (
                    <button
                      key={s}
                      className="dp-sidebar__status-btn"
                      style={{
                        background: isActive ? `${cfg.color}20` : "transparent",
                        color: isActive ? cfg.color : "#64748b",
                        border: isActive ? `1px solid ${cfg.color}40` : "1px solid transparent",
                        fontWeight: isActive ? 600 : 400,
                      }}
                      onClick={async () => {
                        if (isActive) return;
                        try {
                          await api.put(`/hv/leads/${detailLead.id}`, { status: s });
                          await loadDetail();
                          onUpdate();
                        } catch { /* silent */ }
                      }}
                    >
                      <span style={{ fontSize: "10px" }}>●</span> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interesse */}
            <div className="dp-sidebar__section">
              <h4><Target size={14} /> Interesse</h4>
              <div style={{
                padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                background: `${interesseCfg.color}20`, color: interesseCfg.color, display: "inline-block",
              }}>
                {interesseCfg.label}
              </div>
            </div>

            {/* Potenzial */}
            <div className="dp-sidebar__section">
              <h4><TrendingUp size={14} /> Potenzial</h4>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.5px" }}>
                {detailLead.anmeldungenProMonat ?? "—"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Anmeldungen / Monat</div>
            </div>

            {/* Timestamps */}
            <div className="dp-sidebar__section">
              <h4><Calendar size={14} /> Zeitstempel</h4>
              <div className="dp-sidebar__dates">
                <div><span>Erstellt</span> <span>{formatDate(detailLead.createdAt)}</span></div>
                <div><span>Aktualisiert</span> <span>{formatDate(detailLead.updatedAt)}</span></div>
                {detailLead.naechsterKontakt && (
                  <div>
                    <span>Wiedervorlage</span>
                    <span style={{ color: isOverdue(detailLead.naechsterKontakt) ? "#f87171" : undefined }}>
                      {formatDate(detailLead.naechsterKontakt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DuplicateWarning ── */

function DuplicateWarning({ matches }: { matches: DuplicateMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <div style={styles.duplicateWarning}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <AlertCircle size={16} style={{ color: "#FBBF24" }} />
        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#FBBF24" }}>
          Mögliche Duplikate gefunden
        </span>
      </div>
      {matches.map((m) => (
        <div key={m.id} style={styles.duplicateItem}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.85rem" }}>
              {m.firmenName}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#FBBF24" }}>{m.matchReason}</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
            {m.ansprechpartner}
            {m.email && ` · ${m.email}`}
            {m.telefon && ` · ${m.telefon}`}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── NewLeadModal ── */

function NewLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firmenName: "",
    ansprechpartner: "",
    email: "",
    telefon: "",
    website: "",
    strasse: "",
    plz: "",
    ort: "",
    branche: "",
    quelle: "",
    interesse: "UNBEKANNT",
    anmeldungenProMonat: "",
    naechsterKontakt: "",
    erstnotiz: "",
  });
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [dupChecked, setDupChecked] = useState(false);
  const [dupChecking, setDupChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkDuplicates = useCallback(async (firmenName: string, telefon: string, email: string) => {
    if (!firmenName && !telefon && !email) {
      setDuplicates([]);
      setDupChecked(false);
      return;
    }
    setDupChecking(true);
    try {
      const params = new URLSearchParams();
      if (firmenName) params.set("firmenName", firmenName);
      if (telefon) params.set("telefon", telefon);
      if (email) params.set("email", email);
      const res = await api.get(`/hv/leads/check-duplicate?${params.toString()}`);
      setDuplicates(res.data?.matches || []);
      setDupChecked(true);
    } catch {
      setDuplicates([]);
      setDupChecked(true);
    } finally {
      setDupChecking(false);
    }
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);

    // Trigger duplicate check on key fields with debounce
    if (field === "firmenName" || field === "telefon" || field === "email") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        checkDuplicates(newForm.firmenName, newForm.telefon, newForm.email);
      }, 400);
    }
  };

  const handleSubmit = async () => {
    if (!form.firmenName.trim() || !form.ansprechpartner.trim()) {
      setError("Firmenname und Ansprechpartner sind Pflichtfelder.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        firmenName: form.firmenName.trim(),
        ansprechpartner: form.ansprechpartner.trim(),
        email: form.email.trim() || null,
        telefon: form.telefon.trim() || null,
        website: form.website.trim() || null,
        strasse: form.strasse.trim() || null,
        plz: form.plz.trim() || null,
        ort: form.ort.trim() || null,
        branche: form.branche || null,
        quelle: form.quelle || null,
        interesse: form.interesse || "UNBEKANNT",
        anmeldungenProMonat: form.anmeldungenProMonat ? Number(form.anmeldungenProMonat) : null,
        naechsterKontakt: form.naechsterKontakt || null,
        erstnotiz: form.erstnotiz.trim() || null,
      };
      await api.post("/hv/leads", body);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Fehler beim Anlegen";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const hasDuplicates = duplicates.length > 0;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            <Plus size={18} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            Neuer Lead
          </h3>
          <button style={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBanner}>
            <XCircle size={16} />
            <span style={{ fontSize: "0.85rem" }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {/* Firmenname with duplicate check */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Firmenname <span style={{ color: "#F87171" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                style={styles.formInput}
                placeholder="z.B. SolarPower GmbH"
                value={form.firmenName}
                onChange={(e) => handleFieldChange("firmenName", e.target.value)}
              />
              {dupChecking && (
                <Loader2
                  size={14}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#71717a",
                    animation: "hvLeadsSpin 1s linear infinite",
                  }}
                />
              )}
            </div>
          </div>

          {/* Duplicate warning / OK banner */}
          <DuplicateWarning matches={duplicates} />
          {dupChecked && duplicates.length === 0 && form.firmenName.trim() && (
            <div style={styles.noDuplicateBanner}>
              <CheckCircle size={14} />
              <span style={{ fontSize: "0.8rem" }}>Kein bestehender Kontakt gefunden</span>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Ansprechpartner <span style={{ color: "#F87171" }}>*</span>
            </label>
            <input
              type="text"
              style={styles.formInput}
              placeholder="Vor- und Nachname"
              value={form.ansprechpartner}
              onChange={(e) => handleFieldChange("ansprechpartner", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>E-Mail</label>
              <input
                type="email"
                style={styles.formInput}
                placeholder="email@firma.de"
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Telefon</label>
              <input
                type="tel"
                style={styles.formInput}
                placeholder="+49 ..."
                value={form.telefon}
                onChange={(e) => handleFieldChange("telefon", e.target.value)}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Website</label>
            <input
              type="url"
              style={styles.formInput}
              placeholder="www.firma.de"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Straße</label>
            <input
              type="text"
              style={styles.formInput}
              value={form.strasse}
              onChange={(e) => setForm({ ...form, strasse: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>PLZ</label>
              <input
                type="text"
                style={styles.formInput}
                value={form.plz}
                onChange={(e) => setForm({ ...form, plz: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Ort</label>
              <input
                type="text"
                style={styles.formInput}
                value={form.ort}
                onChange={(e) => setForm({ ...form, ort: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Branche</label>
              <select
                style={styles.formSelect}
                value={form.branche}
                onChange={(e) => setForm({ ...form, branche: e.target.value })}
              >
                <option value="">— Bitte wählen —</option>
                {Object.entries(BRANCHE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Quelle</label>
              <select
                style={styles.formSelect}
                value={form.quelle}
                onChange={(e) => setForm({ ...form, quelle: e.target.value })}
              >
                <option value="">— Bitte wählen —</option>
                {Object.entries(QUELLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Interesse</label>
              <select
                style={styles.formSelect}
                value={form.interesse}
                onChange={(e) => setForm({ ...form, interesse: e.target.value })}
              >
                {Object.entries(INTERESSE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Anm. / Monat</label>
              <input
                type="number"
                style={styles.formInput}
                placeholder="z.B. 50"
                min={0}
                value={form.anmeldungenProMonat}
                onChange={(e) => setForm({ ...form, anmeldungenProMonat: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Nächster Kontakt</label>
            <input
              type="date"
              style={styles.formInput}
              value={form.naechsterKontakt}
              onChange={(e) => setForm({ ...form, naechsterKontakt: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Erstnotiz</label>
            <textarea
              style={styles.textarea}
              rows={3}
              placeholder="Erste Informationen zum Lead..."
              value={form.erstnotiz}
              onChange={(e) => setForm({ ...form, erstnotiz: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button style={styles.btnSecondary} onClick={onClose}>
            Abbrechen
          </button>
          <button
            style={{
              ...styles.btnPrimary,
              background: hasDuplicates
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #D4A843, #EAD068)",
            }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={14} style={styles.spinnerInline} />
            ) : hasDuplicates ? (
              <AlertCircle size={14} />
            ) : (
              <Plus size={14} />
            )}
            {hasDuplicates ? "Trotzdem anlegen" : "Lead anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function HvLeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brancheFilter, setBrancheFilter] = useState("");
  const [view, setView] = useState<"table" | "pipeline">("table");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const limit = 25;

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (brancheFilter) params.set("branche", brancheFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await api.get(`/hv/leads?${params.toString()}`);
      setLeads(res.data?.leads || res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalCount(res.data?.total || 0);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, brancheFilter, sortBy, sortOrder]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/hv/leads/stats");
      const d = res.data?.data || res.data;
      const sc = d.statusCounts || {};
      setStats({
        total: d.totalLeads || 0,
        neu: sc.NEU || 0,
        kontaktiert: sc.KONTAKTIERT || 0,
        qualifiziert: sc.QUALIFIZIERT || sc.IN_VERHANDLUNG || 0,
        disqualifiziert: sc.DISQUALIFIZIERT || sc.VERLOREN || 0,
        wiedervorlagenFaellig: d.wiedervorlagenFaellig || 0,
        pipelineAnmeldungen: d.pipelineAnmeldungenProMonat || 0,
        conversionRate: d.conversionRate || 0,
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleRefresh = () => {
    loadLeads();
    loadStats();
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  // Debounced search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  return (
    <div className="hv-leads-root" style={styles.outerContainer}>
      {/* Keyframes + dark select fix */}
      <style>{`
        @keyframes hvLeadsSpin { to { transform: rotate(360deg) } }
        @keyframes hvLeadsSlideIn { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        .hv-leads-root select,
        .hv-leads-root select option {
          background: #27272a !important;
          color: #e2e8f0 !important;
        }
      `}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>Leads &amp; CRM</h2>
            <p style={styles.tabTitleP}>Verwalte deine Vertriebskontakte und Pipeline</p>
          </div>
        </div>
        <div style={styles.tabActions}>
          <button style={styles.btnRefresh} onClick={handleRefresh} title="Aktualisieren">
            <RefreshCw size={16} />
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> Neuer Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <StatCard icon={Users} label="Zu Kontaktieren" value={stats.neu} color="#D4A843" />
          <StatCard icon={Phone} label="Kontaktiert" value={stats.kontaktiert} color="#3b82f6" />
          <StatCard icon={Target} label="Qualifiziert" value={stats.qualifiziert} color="#22c55e" sub="Angebot möglich" />
          <StatCard icon={XCircle} label="Disqualifiziert" value={stats.disqualifiziert} color="#ef4444" />
          <StatCard
            icon={TrendingUp}
            label="Gesamt"
            value={stats.total}
            sub={`Conversion: ${stats.conversionRate}%`}
            color="#D4A843"
          />
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} style={{ color: "#71717a", flexShrink: 0 }} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Suche nach Firma, Ansprechpartner, Ort..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={styles.filterGroup}>
            <Filter size={14} style={{ color: "#71717a" }} />
            <select
              style={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Alle Status</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          <select
            style={styles.filterSelect}
            value={brancheFilter}
            onChange={(e) => {
              setBrancheFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Alle Branchen</option>
            {Object.entries(BRANCHE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* View toggle */}
          <div style={styles.viewToggle}>
            <button
              style={{
                ...styles.viewToggleBtn,
                background: view === "table" ? "rgba(212,168,67,0.15)" : "transparent",
                color: view === "table" ? "#D4A843" : "#71717a",
              }}
              onClick={() => setView("table")}
              title="Tabellenansicht"
            >
              <BarChart3 size={14} />
            </button>
            <button
              style={{
                ...styles.viewToggleBtn,
                background: view === "pipeline" ? "rgba(212,168,67,0.15)" : "transparent",
                color: view === "pipeline" ? "#D4A843" : "#71717a",
              }}
              onClick={() => setView("pipeline")}
              title="Pipeline-Ansicht"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div style={{ fontSize: "0.8rem", color: "#71717a" }}>
        {totalCount} Lead{totalCount !== 1 ? "s" : ""} gefunden
      </div>

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCenter}>
          <div style={styles.spinner} />
          <span>Lade Leads...</span>
        </div>
      )}

      {/* Content */}
      {!loading && view === "table" && (
        <LeadTable
          leads={leads}
          onSelect={handleSelectLead}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
      {!loading && view === "pipeline" && (
        <PipelineView leads={leads} onSelect={handleSelectLead} />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && view === "table" && (
        <div style={styles.pagination}>
          <button
            style={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Zurück
          </button>
          <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
            Seite {page} von {totalPages}
          </span>
          <button
            style={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Weiter
          </button>
        </div>
      )}

      {/* Detail Panel */}
      {selectedLead && (
        <DetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            handleRefresh();
          }}
        />
      )}

      {/* New Lead Modal */}
      {showNewModal && (
        <NewLeadModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default HvLeadsTab;

/* ── Styles ── */

const styles: Record<string, CSSProperties> = {
  outerContainer: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
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
  tabActions: {
    display: "flex",
    gap: "0.75rem",
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
    transition: "all 0.2s",
  },
  btnSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnIcon: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    borderRadius: "6px",
    transition: "all 0.15s",
  },
  btnSmallDanger: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#F87171",
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSmallGhost: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    padding: "0.375rem 0.75rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },

  /* Stats */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "16px",
  },
  statCard: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
  },

  /* Toolbar */
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap" as const,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0 12px",
    flex: "1 1 300px",
    maxWidth: "400px",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    color: "#e2e8f0",
    padding: "0.625rem 0",
    fontSize: "0.875rem",
    outline: "none",
    flex: 1,
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  filterSelect: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    outline: "none",
    cursor: "pointer",
    colorScheme: "dark",
  } as React.CSSProperties,
  viewToggle: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  viewToggleBtn: {
    background: "transparent",
    border: "none",
    padding: "0.5rem 0.625rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.15s",
  },

  /* Table */
  tableContainer: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
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

  /* Pipeline */
  pipelineContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px",
    minHeight: "400px",
  },
  pipelineColumn: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
  },
  pipelineHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    marginBottom: "10px",
  },
  pipelineCards: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
    overflowY: "auto",
  },
  pipelineCard: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background 0.15s",
  },

  /* Detail Panel */
  panelOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
  },
  detailPanel: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "680px",
    maxWidth: "100vw",
    zIndex: 1000,
    background: "#18181b",
    borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  detailTabs: {
    display: "flex",
    gap: "0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "0 24px",
  },
  detailTabBtn: {
    background: "transparent",
    border: "none",
    padding: "10px 16px",
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.15s",
  },
  tabCount: {
    fontSize: "0.65rem",
    background: "rgba(212, 168, 67, 0.15)",
    color: "#D4A843",
    padding: "1px 6px",
    borderRadius: "8px",
    fontWeight: 600,
  },
  detailContent: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
  },

  /* Info sections */
  infoSection: {
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  infoItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "10px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  infoLabel: {
    fontSize: "0.7rem",
    color: "#71717a",
    marginBottom: "2px",
  },
  infoValue: {
    fontSize: "0.85rem",
    color: "#e2e8f0",
  },
  potenzialBox: {
    background: "rgba(212, 168, 67, 0.08)",
    border: "1px solid rgba(212, 168, 67, 0.2)",
    borderRadius: "10px",
    padding: "16px",
  },

  /* Activity */
  activityFormBox: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "16px",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  timelineItem: {
    display: "flex",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: "8px",
    background: "rgba(212, 168, 67, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#D4A843",
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },

  /* Notes */
  noteCard: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "12px",
  },

  /* Warning */
  warningBanner: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 24px",
    padding: "10px 14px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#F87171",
  },

  /* Duplicate */
  duplicateWarning: {
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
  },
  duplicateItem: {
    padding: "8px 10px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "6px",
    marginBottom: "6px",
  },
  noDuplicateBanner: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    borderRadius: "8px",
    color: "#34D399",
    fontSize: "0.8rem",
    marginBottom: "8px",
  },

  /* Modal */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  modal: {
    background: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
    zIndex: 2001,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
  },
  modalCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
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
    marginBottom: "12px",
  },

  /* Forms */
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "12px",
  },
  formLabel: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#a1a1aa",
  },
  formInput: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  formSelect: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    colorScheme: "dark",
  } as React.CSSProperties,
  textarea: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },

  /* Pagination */
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
  },
  pageBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.15s",
  },

  /* Loading */
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
    animation: "hvLeadsSpin 1s linear infinite",
  },
  spinnerInline: {
    animation: "hvLeadsSpin 1s linear infinite",
  },
};

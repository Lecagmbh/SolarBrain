/**
 * OVERVIEW TAB - v4.4 - MIT ALERT CENTER + NB NACHFRAGE
 * =====================================
 * - Alert Center zeigt fehlende Daten/Dokumente
 * - Alle wichtigen Felder mit Copy-Button
 * - Zählernummer unter Netzbetreiber
 * - Schönere Telefon/E-Mail Darstellung
 */

import { useState, useEffect, useCallback } from "react";
import {
  User, MapPin, Building2, Zap, Copy, Check, ExternalLink,
  Phone, Mail, Sun, Battery, Car, Flame, Calendar, Clock,
  FileText, Info, UserCircle, CalendarClock, Edit2, Save, X,
  Users, Bell, ChevronDown, Hash, Plus, Trash2, Shield,
  Link2, AlertCircle, Sparkles, Brain, CheckCircle, Cake, Gauge,
  Eye, EyeOff, Home, CreditCard, ClipboardCheck, KeyRound, Globe, Send, Loader2,
  MessageSquare, ChevronRight,
} from "lucide-react";
import type { InstallationDetail, GridOperator } from "../../../types";
import { parseWizardContext, extractTechDataFromWizard } from "../../../utils";
import { getAccessToken } from "../../../../../modules/auth/tokenStorage";
import { installationsApi } from "../../../services/api";
import { CommentsPreview } from "../../Comments";
import { usePermissions } from "../../../../../hooks/usePermissions";
// Deaktiviert – Alert-System wird komplett überarbeitet
// import { AlertCenter } from "./AlertCenter";
// import { DatabaseAlerts } from "./DatabaseAlerts";
import { EvuWarningsCard } from "../../../../../components/evu";
import { AIValidationBadge } from "../../ai/AIValidationBadge";

// ═══════════════════════════════════════════════════════════════════════════
// COPYABLE FIELD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function CopyableField({ 
  icon: Icon, 
  label, 
  value, 
  href,
  mono = false,
}: { 
  icon?: any; 
  label?: string; 
  value: string; 
  href?: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div className="dp-copyable-field">
      {Icon && <Icon size={14} className="dp-copyable-field__icon" />}
      <div className="dp-copyable-field__content">
        {label && <span className="dp-copyable-field__label">{label}</span>}
        {href ? (
          <a href={href} className={`dp-copyable-field__value ${mono ? 'dp-copyable-field__value--mono' : ''}`}>
            {value}
          </a>
        ) : (
          <span className={`dp-copyable-field__value ${mono ? 'dp-copyable-field__value--mono' : ''}`}>
            {value}
          </span>
        )}
      </div>
      <button className="dp-copyable-field__btn" onClick={handleCopy} title="Kopieren">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NB-REFERENZEN CARD
// ═══════════════════════════════════════════════════════════════════════════

interface NBReference {
  id: number;
  referenceType: string;
  referenceValue: string;
  source: string;
  confidence: number;
  createdAt: string;
}

function NBReferencesCard({
  installationId,
  showToast,
}: {
  installationId: number;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const [references, setReferences] = useState<NBReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRef, setNewRef] = useState({ type: "AKTENZEICHEN", value: "" });
  const [saving, setSaving] = useState(false);

  const REFERENCE_TYPES = [
    { value: "AKTENZEICHEN", label: "Aktenzeichen", icon: "📋" },
    { value: "ANTRAGSNUMMER", label: "Antragsnummer", icon: "📝" },
    { value: "KUNDENNUMMER", label: "Kundennummer", icon: "👤" },
    { value: "VERTRAGSNUMMER", label: "Vertragsnummer", icon: "📄" },
    { value: "ZAEHLERNUMMER", label: "Zählernummer", icon: "⚡" },
    { value: "CUSTOM", label: "Sonstige", icon: "🏷️" },
  ];

  const loadReferences = useCallback(async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReferences(data.references || []);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Referenzen:", err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  const handleAdd = async () => {
    if (!newRef.value.trim()) {
      showToast("Bitte Wert eingeben", "error");
      return;
    }
    try {
      setSaving(true);
      const token = getAccessToken();
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referenceType: newRef.type, referenceValue: newRef.value.trim() }),
      });
      if (res.ok) {
        showToast("Referenz hinzugefügt", "success");
        setNewRef({ type: "AKTENZEICHEN", value: "" });
        setShowAddForm(false);
        loadReferences();
      }
    } catch (err) {
      showToast("Fehler beim Speichern", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (refId: number) => {
    if (!confirm("Referenz wirklich löschen?")) return;
    try {
      const token = getAccessToken();
      await fetch(`/api/intelligence/installations/${installationId}/references/${refId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Referenz gelöscht", "success");
      loadReferences();
    } catch (err) {
      showToast("Fehler beim Löschen", "error");
    }
  };

  const getTypeConfig = (type: string) => REFERENCE_TYPES.find(t => t.value === type) || REFERENCE_TYPES[5];

  return (
    <div className="dp-overview-card">
      <div className="dp-overview-card__header">
        <Brain size={18} />
        <h4>NB-Referenzen</h4>
        <span className="dp-badge dp-badge--purple">KI</span>
      </div>
      <div className="dp-overview-card__content">
        {loading ? (
          <div className="dp-overview-field"><span>Lade...</span></div>
        ) : (
          <>
            {references.length > 0 && (
              <div className="dp-nb-refs">
                {references.map((ref) => {
                  const config = getTypeConfig(ref.referenceType);
                  return (
                    <div key={ref.id} className="dp-nb-ref-item">
                      <span className="dp-nb-ref-item__icon">{config.icon}</span>
                      <div className="dp-nb-ref-item__content">
                        <span className="dp-nb-ref-item__type">{config.label}</span>
                        <span className="dp-nb-ref-item__value">{ref.referenceValue}</span>
                      </div>
                      <button className="dp-nb-ref-item__delete" onClick={() => handleDelete(ref.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {showAddForm ? (
              <div className="dp-nb-ref-form">
                <select value={newRef.type} onChange={(e) => setNewRef({ ...newRef, type: e.target.value })}>
                  {REFERENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input
                  type="text"
                  value={newRef.value}
                  onChange={(e) => setNewRef({ ...newRef, value: e.target.value })}
                  placeholder="Referenznummer"
                  autoFocus
                />
                <button className="dp-btn dp-btn--sm dp-btn--primary" onClick={handleAdd} disabled={saving}>
                  {saving ? "..." : <Check size={14} />}
                </button>
                <button className="dp-btn dp-btn--sm dp-btn--ghost" onClick={() => setShowAddForm(false)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button className="dp-nb-ref-add" onClick={() => setShowAddForm(true)}>
                <Plus size={14} /><span>Referenz hinzufügen</span>
              </button>
            )}
            <div className="dp-overview-field dp-overview-field--hint">
              <AlertCircle size={12} />
              <span>E-Mails mit diesen Nummern werden automatisch zugeordnet</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCONTRACTOR CARD
// ═══════════════════════════════════════════════════════════════════════════

interface Subcontractor {
  id: number;
  name: string;
  email: string;
  companyName?: string;
}

function SubcontractorCard({ detail, onUpdate, showToast }: { 
  detail: InstallationDetail; 
  onUpdate: (data: Partial<InstallationDetail>) => Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        const res = await fetch('/api/subcontractors', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setSubcontractors(await res.json() || []);
      } catch (err) {}
    })();
  }, []);

  const handleAssign = async (subcontractorId: number | null) => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/subcontractors/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ installationId: detail.id, subcontractorId }),
      });
      if (res.ok) {
        setShowDropdown(false);
        showToast(subcontractorId ? 'Zugewiesen' : 'Entfernt', 'success');
        await onUpdate({});
      }
    } catch (err) {
      showToast('Fehler', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-overview-card">
      <div className="dp-overview-card__header">
        <Users size={18} />
        <h4>Subunternehmer</h4>
      </div>
      <div className="dp-overview-card__content">
        {detail.assignedToName ? (
          <>
            <CopyableField icon={User} value={detail.assignedToName} />
            <button type="button" className="dp-subcontractor-btn" onClick={() => setShowDropdown(!showDropdown)} disabled={loading}>
              <Edit2 size={14} /> Ändern
            </button>
          </>
        ) : (
          <button type="button" className="dp-subcontractor-btn" onClick={() => setShowDropdown(!showDropdown)} disabled={loading}>
            <Users size={14} /> Zuweisen
          </button>
        )}
        {showDropdown && (
          <div className="dp-subcontractor-dropdown">
            {detail.assignedToId && (
              <button type="button" className="dp-subcontractor-option dp-subcontractor-option--remove" onClick={() => handleAssign(null)}>
                <X size={14} /> Entfernen
              </button>
            )}
            {subcontractors.map(sub => (
              <button
                type="button"
                key={sub.id}
                className={`dp-subcontractor-option ${detail.assignedToId === sub.id ? 'dp-subcontractor-option--selected' : ''}`}
                onClick={() => handleAssign(sub.id)}
              >
                <User size={14} /> {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMMUNIKATION SUMMARY CARD
// ═══════════════════════════════════════════════════════════════════════════

const CORR_TYPE_CONFIG: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  erstanmeldung: { label: "Erstanmeldung", icon: Send, color: "#3b82f6" },
  nachfrage: { label: "Nachfrage", icon: MessageSquare, color: "#f59e0b" },
  antwort: { label: "NB-Antwort", icon: Mail, color: "#10b981" },
  email: { label: "E-Mail", icon: Mail, color: "#EAD068" },
  portal: { label: "Portal", icon: Globe, color: "#06b6d4" },
};

function KommunikationSummaryCard({
  detail,
  currentOperator,
  installationId,
  showToast,
  onSwitchToTab,
}: {
  detail: InstallationDetail;
  currentOperator: GridOperator | undefined;
  installationId: number;
  showToast: (msg: string, type: "success" | "error") => void;
  onSwitchToTab?: (tab: string) => void;
}) {
  const [correspondence, setCorrespondence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const customerEmail = detail.customer?.email || detail.contactEmail;
  const nbEmail = currentOperator?.email;
  const einreichEmail = detail.nbEmail && detail.nbEmail !== nbEmail ? detail.nbEmail : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await installationsApi.getCorrespondence(installationId);
        if (!cancelled) setCorrespondence((data || []).slice(0, 3));
      } catch {
        // Silence — no correspondence
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [installationId]);

  return (
    <div className="dp-overview-card dp-overview-card--wide dp-komm-summary">
      <div className="dp-overview-card__header">
        <Mail size={18} />
        <h4>Kommunikation</h4>
        {correspondence.length > 0 && (
          <span className="dp-badge">{correspondence.length > 2 ? "3+" : correspondence.length}</span>
        )}
      </div>
      <div className="dp-overview-card__content">
        {/* Kontakt-Grid */}
        <div className="dp-komm-summary__contacts">
          {customerEmail && (
            <CopyableField icon={User} label="Kunde" value={customerEmail} href={`mailto:${customerEmail}`} />
          )}
          {nbEmail && (
            <CopyableField icon={Building2} label="Netzbetreiber" value={nbEmail} href={`mailto:${nbEmail}`} />
          )}
          {einreichEmail && (
            <CopyableField icon={Send} label="Einreich-Email" value={einreichEmail} href={`mailto:${einreichEmail}`} />
          )}
        </div>

        {/* Mini-Timeline */}
        <div className="dp-komm-summary__timeline">
          {loading ? (
            <div className="dp-overview-field">
              <Loader2 size={14} className="dp-spin" />
              <span>Lade Korrespondenz...</span>
            </div>
          ) : correspondence.length === 0 ? (
            <div className="dp-overview-field dp-overview-field--small">
              <Info size={12} />
              <span>Noch keine Korrespondenz</span>
            </div>
          ) : (
            correspondence.map((item: any) => {
              const config = CORR_TYPE_CONFIG[item.type] || CORR_TYPE_CONFIG.email;
              const TypeIcon = config.icon;
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`dp-komm-summary__entry ${isExpanded ? "dp-komm-summary__entry--expanded" : ""}`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="dp-komm-summary__entry-header">
                    <div className="dp-komm-summary__entry-icon" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                      <TypeIcon size={14} />
                    </div>
                    <div className="dp-komm-summary__entry-main">
                      <span className="dp-komm-summary__entry-subject">{item.subject || config.label}</span>
                      <span className="dp-komm-summary__entry-date">
                        {new Date(item.sentAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </span>
                    </div>
                    <span className="dp-komm-summary__entry-type" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  {isExpanded && item.message && (
                    <div className="dp-komm-summary__entry-body">
                      {item.message}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="dp-komm-summary__actions">
          <button
            className="dp-btn dp-btn--sm dp-btn--ghost"
            onClick={() => onSwitchToTab?.("emails")}
          >
            <Mail size={14} /> Alle E-Mails <ChevronRight size={12} />
          </button>
          <button
            className="dp-btn dp-btn--sm dp-btn--ghost"
            onClick={() => onSwitchToTab?.("kommunikation")}
          >
            <MessageSquare size={14} /> NB-Kommunikation <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const safeString = (value: any, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value.name || value.kurzname || value.label || value.modell || value.model || fallback;
  return String(value) || fallback;
};

const safeNumber = (value: any, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return isNaN(value) ? fallback : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface OverviewTabProps {
  detail: InstallationDetail;
  gridOperators: GridOperator[];
  onUpdate: (data: Partial<InstallationDetail>) => Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
  onSwitchToTimeline?: () => void;
  onSwitchToTab?: (tab: string) => void;
}

export function OverviewTab({ detail, gridOperators, onUpdate, showToast, isKunde, onSwitchToTimeline, onSwitchToTab }: OverviewTabProps) {
  const permissions = usePermissions();
  const [isEditingZaehlerwechsel, setIsEditingZaehlerwechsel] = useState(false);
  const [zaehlerwechselDatum, setZaehlerwechselDatum] = useState(
    detail.zaehlerwechselDatum ? detail.zaehlerwechselDatum.split('T')[0] : ''
  );
  const [zaehlerwechselUhrzeit, setZaehlerwechselUhrzeit] = useState(detail.zaehlerwechselUhrzeit || '09:00');
  const [zaehlerwechselKommentar, setZaehlerwechselKommentar] = useState(detail.zaehlerwechselKommentar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [zwAppointment, setZwAppointment] = useState<{
    id: number; status: string; scheduledAt: string;
    confirmedAt: string | null; createdAt: string; description: string | null;
  } | null>(null);
  const [zwLoading, setZwLoading] = useState(false);
  
  // Westnetz-Portal State
  const [isEditingWestnetz, setIsEditingWestnetz] = useState(false);
  const [westnetzUsername, setWestnetzUsername] = useState((detail as any).nbPortalUsername || '');
  const [westnetzPassword, setWestnetzPassword] = useState((detail as any).nbPortalPassword || '');
  const [westnetzNotizen, setWestnetzNotizen] = useState((detail as any).nbPortalNotizen || '');
  const [showWestnetzPassword, setShowWestnetzPassword] = useState(false);
  const [isSavingWestnetz, setIsSavingWestnetz] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // NB-Email inline editing
  const [isEditingNbEmail, setIsEditingNbEmail] = useState(false);
  const [nbEmailDraft, setNbEmailDraft] = useState(detail.nbEmail || '');
  const [isSavingNbEmail, setIsSavingNbEmail] = useState(false);

  const wizardData = parseWizardContext(detail.wizardContext);
  const techRaw = extractTechDataFromWizard(detail, wizardData);

  // 🔥 DEBUG: Zeige was ankommt
  console.log('[OverviewTab] detail.technicalData:', detail.technicalData);
  console.log('[OverviewTab] techRaw:', techRaw);

  const tech = {
    ...techRaw,
    pv: (techRaw.pv || []).map((p: any) => ({
      manufacturer: safeString(p.manufacturer) || safeString(p.modulHersteller) || safeString(p.hersteller),
      model: safeString(p.model) || safeString(p.modulModell) || safeString(p.modell),
      count: safeNumber(p.count) || safeNumber(p.moduleCount) || safeNumber(p.anzahl) || 1,
      powerWp: safeNumber(p.powerWp) || safeNumber(p.modulLeistungWp) || safeNumber(p.leistungWp),
      orientation: safeString(p.orientation) || safeString(p.ausrichtung),
      tilt: safeNumber(p.tilt) || safeNumber(p.neigung),
      roofName: safeString(p.roofName) || safeString(p.name),
      shading: p.shading || p.verschattung,
      stringCount: p.stringCount || p.stringAnzahl,
      modulesPerString: p.modulesPerString || p.moduleProString,
    })),
    inverters: (techRaw.inverters || []).map((inv: any) => ({
      manufacturer: safeString(inv.manufacturer) || safeString(inv.hersteller),
      model: safeString(inv.model) || safeString(inv.modell),
      powerKw: safeNumber(inv.powerKw) || safeNumber(inv.leistungKw) || safeNumber(inv.acLeistungKw),
      powerKva: safeNumber(inv.powerKva) || safeNumber(inv.leistungKva),
      zerezId: safeString(inv.zerezId),
      hybrid: inv.hybrid === true,
      mpptCount: inv.mpptCount || inv.mpptAnzahl,
    })),
    storage: (techRaw.storage || []).map((st: any) => ({
      manufacturer: safeString(st.manufacturer) || safeString(st.hersteller),
      model: safeString(st.model) || safeString(st.modell),
      capacityKwh: safeNumber(st.capacityKwh) || safeNumber(st.kapazitaetKwh),
      coupling: safeString(st.coupling) || safeString(st.kopplung),
      powerKw: safeNumber(st.powerKw) || safeNumber(st.leistungKw) || undefined,
      apparentPowerKva: safeNumber(st.apparentPowerKva) || safeNumber(st.scheinleistungKva) || undefined,
      ratedCurrentA: safeNumber(st.ratedCurrentA) || safeNumber(st.bemessungsstromA) || undefined,
      emergencyPower: st.emergencyPower ?? st.notstrom,
      backupPower: st.backupPower ?? st.ersatzstrom,
      islandForming: st.islandForming ?? st.inselnetzBildend,
      connectionPhase: st.connectionPhase || st.anschlussPhase,
      allPoleSeparation: st.allPoleSeparation ?? st.allpoligeTrennung,
      naProtectionPresent: st.naProtectionPresent ?? st.naSchutzVorhanden,
      inverterManufacturer: st.inverterManufacturer || st.umrichterHersteller,
      inverterType: st.inverterType || st.umrichterTyp,
      inverterCount: st.inverterCount || st.umrichterAnzahl,
      displacementFactorCos: st.displacementFactorCos || st.verschiebungsfaktorCos,
    })),
    wallbox: (techRaw.wallbox || []).map((wb: any) => ({
      manufacturer: safeString(wb.manufacturer) || safeString(wb.hersteller),
      model: safeString(wb.model) || safeString(wb.modell),
      powerKw: safeNumber(wb.powerKw) || safeNumber(wb.leistungKw),
      controllable14a: wb.controllable14a ?? wb.steuerbar14a,
      phases: wb.phases || wb.phasen,
      socketType: wb.socketType || wb.steckdose,
    })),
    heatPump: (techRaw.heatPump || []).map((hp: any) => ({
      manufacturer: safeString(hp.manufacturer) || safeString(hp.hersteller),
      model: safeString(hp.model) || safeString(hp.modell),
      powerKw: safeNumber(hp.powerKw) || safeNumber(hp.leistungKw),
      type: hp.type || hp.typ,
      controllable14a: hp.controllable14a ?? hp.steuerbar14a,
      sgReady: hp.sgReady,
    })),
  };

  // Zählerwechsel-Appointment laden
  const loadZwAppointment = useCallback(async () => {
    try {
      const res = await installationsApi.getZaehlerwechselTermin(detail.id);
      setZwAppointment(res.appointment);
    } catch {
      // Ignore — kein Appointment vorhanden
    }
  }, [detail.id]);

  useEffect(() => {
    if (detail.zaehlerwechselDatum) {
      loadZwAppointment();
    }
  }, [detail.zaehlerwechselDatum, loadZwAppointment]);

  const handleScheduleZaehlerwechsel = async () => {
    if (!zaehlerwechselDatum) {
      showToast("Bitte Datum angeben", "error");
      return;
    }
    setIsSaving(true);
    try {
      const res = await installationsApi.scheduleZaehlerwechsel(detail.id, {
        datum: zaehlerwechselDatum,
        uhrzeit: zaehlerwechselUhrzeit,
        kommentar: zaehlerwechselKommentar || undefined,
      });
      const msgs: string[] = [];
      if (res.notificationsSent.errichterEmail) msgs.push("Errichter-Email");
      if (res.notificationsSent.endkundeEmail) msgs.push("Endkunde-Email");
      if (res.notificationsSent.endkundeWhatsapp) msgs.push("Endkunde-WhatsApp");
      showToast(
        msgs.length > 0
          ? `Termin geplant! Benachrichtigung: ${msgs.join(" + ")}`
          : "Termin geplant (keine Benachrichtigung gesendet)",
        "success"
      );
      setIsEditingZaehlerwechsel(false);
      // Reload to get updated data
      onUpdate({} as any);
      loadZwAppointment();
    } catch (err: any) {
      showToast(err.message || "Fehler beim Planen", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelZaehlerwechsel = async () => {
    if (!confirm("Zählerwechsel-Termin wirklich absagen?")) return;
    setIsSaving(true);
    try {
      await installationsApi.cancelZaehlerwechsel(detail.id);
      showToast("Termin abgesagt", "success");
      setZwAppointment(null);
      setZaehlerwechselDatum('');
      setZaehlerwechselUhrzeit('09:00');
      setZaehlerwechselKommentar('');
      onUpdate({} as any);
    } catch (err: any) {
      showToast(err.message || "Fehler", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWestnetz = async () => {
    setIsSavingWestnetz(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/installations/${detail.id}/nb-portal-credentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nbPortalUsername: westnetzUsername, nbPortalPassword: westnetzPassword, nbPortalNotizen: westnetzNotizen }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      showToast('Westnetz-Zugangsdaten gespeichert', 'success');
      setIsEditingWestnetz(false);
      onUpdate({} as any);
    } catch (err: any) {
      showToast(err.message || 'Fehler beim Speichern', 'error');
    } finally {
      setIsSavingWestnetz(false);
    }
  };

  const currentOperator = gridOperators.find(op => op.id === detail.gridOperatorId);
  const isWestnetz = (currentOperator?.name || detail.gridOperator || '').toLowerCase().includes('westnetz');
  
  const customerPhone = detail.customer?.telefon || detail.contactPhone;
  const customerEmail = detail.customer?.email || detail.contactEmail;
  const customerLand = detail.customer?.land || detail.locationData?.land;
  const customerGeburtsdatum = detail.customer?.geburtsdatum;
  
  // Vollständige Adresse für Copy
  const fullAddress = `${detail.strasse || ''} ${detail.hausNr || ''}, ${detail.plz || detail.zipCode || ''} ${detail.ort || ''}`.trim();

  return (
    <div className="dp-overview">
      {/* Alert Center + Database Alerts deaktiviert – wird komplett überarbeitet */}

      {/* EVU Warnings - Zeigt Warnungen vor NB-Einreichung */}
      {!isKunde && detail.gridOperatorId && detail.status === "eingang" && (
        <EvuWarningsCard
          evuId={detail.gridOperatorId}
          evuName={currentOperator?.name || detail.gridOperator}
          kwp={detail.totalKwp}
          hasBattery={(tech.storage?.length ?? 0) > 0}
          hasWallbox={(tech.wallbox?.length ?? 0) > 0}
        />
      )}

      {/* KI-Validierung - Zeigt Datenqualität und Probleme */}
      {!isKunde && (
        <div className="dp-ai-validation-wrapper">
          <AIValidationBadge
            installationId={detail.id}
            showDetails={true}
            onAutoFix={async (field, value) => {
              try {
                await onUpdate({ [field]: value } as any);
                showToast(`${field} wurde automatisch korrigiert`, "success");
              } catch (err) {
                showToast("Auto-Fix fehlgeschlagen", "error");
              }
            }}
          />
        </div>
      )}

      {/* CRM-Verknüpfung — wenn Installation aus CRM erstellt wurde */}
      {(() => {
        const crm = (detail as any).crmProjekt;
        if (!crm) return null;
        const stageColors: Record<string, string> = {
          ANFRAGE: "#38bdf8", HV_VERMITTELT: "#f0d878", AUFTRAG: "#34d399",
          NB_ANFRAGE: "#fbbf24", NB_KOMMUNIKATION: "#fb923c", NB_GENEHMIGT: "#34d399", ABGESCHLOSSEN: "#EAD068",
        };
        const stageLabels: Record<string, string> = {
          ANFRAGE: "Anfrage", HV_VERMITTELT: "HV vermittelt", AUFTRAG: "Auftrag",
          NB_ANFRAGE: "NB-Anfrage", NB_KOMMUNIKATION: "NB-Kommunikation", NB_GENEHMIGT: "NB genehmigt", ABGESCHLOSSEN: "Abgeschlossen",
        };
        const stageColor = stageColors[crm.stage] || "#64748b";
        const betreiber = crm.anlagenbetreiber as any;
        return (
          <div className="dp-crm-link" style={{
            background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))",
            border: "1px solid rgba(212,168,67,0.18)", borderRadius: 10, padding: "16px 20px", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: betreiber ? 12 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(212,168,67,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} style={{ color: "#EAD068" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#EAD068", textTransform: "uppercase", letterSpacing: 0.5 }}>CRM-Projekt #{crm.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>{crm.titel}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {crm.organisation && <span style={{ fontSize: 11, color: "#64748b" }}>{crm.organisation}</span>}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: `${stageColor}18`, color: stageColor }}>
                      {stageLabels[crm.stage] || crm.stage}
                    </span>
                    {crm.geschaetzterWert && (
                      <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
                        {crm.geschaetzterWert.toLocaleString("de-DE")} €
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a href="/crm" style={{
                background: "rgba(212,168,67,0.15)", color: "#a5b4fc", border: "1px solid rgba(212,168,67,0.3)",
                borderRadius: 6, padding: "8px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <ExternalLink size={12} /> CRM öffnen
              </a>
            </div>
            {/* Anlagenbetreiber aus CRM */}
            {betreiber && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "10px 14px", background: "rgba(212,168,67,0.04)", borderRadius: 8, marginTop: 4 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Betreiber</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginTop: 2 }}>{betreiber.firma?.name || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Vertreter</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginTop: 2 }}>{betreiber.vertreter || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Adresse</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginTop: 2 }}>
                    {betreiber.adresse ? `${betreiber.adresse.strasse || ""} ${betreiber.adresse.hausnummer || ""}, ${betreiber.adresse.plz || ""} ${betreiber.adresse.ort || ""}` : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="dp-overview-grid">

        {/* Anlagenbetreiber - ALLES KOPIERBAR */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <User size={18} />
            <h4>Anlagenbetreiber</h4>
          </div>
          <div className="dp-overview-card__content">
            {wizardData?.customer?.salutation && (
              <div className="dp-overview-field dp-overview-field--small">
                <span>{wizardData.customer.salutation === 'herr' ? 'Herr' : wizardData.customer.salutation === 'frau' ? 'Frau' : wizardData.customer.salutation}{wizardData.customer.title ? ` ${wizardData.customer.title}` : ''}</span>
              </div>
            )}
            <CopyableField icon={User} value={detail.customerName || ""} />
            {customerPhone && (
              <CopyableField icon={Phone} value={customerPhone} href={`tel:${customerPhone}`} />
            )}
            {wizardData?.customer?.mobile && (
              <CopyableField icon={Phone} label="Mobil" value={wizardData.customer.mobile} href={`tel:${wizardData.customer.mobile}`} />
            )}
            {customerEmail && (
              <CopyableField icon={Mail} label="E-Mail" value={customerEmail} href={`mailto:${customerEmail}`} />
            )}
            {customerGeburtsdatum && (
              <CopyableField icon={Cake} label="Geb." value={new Date(customerGeburtsdatum).toLocaleDateString("de-DE")} />
            )}
          </div>
        </div>

        {/* Anlagenstandort - KOPIERBAR */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <MapPin size={18} />
            <h4>Anlagenstandort</h4>
          </div>
          <div className="dp-overview-card__content">
            <CopyableField icon={MapPin} value={`${detail.strasse || ''} ${detail.hausNr || ''}`} />
            <CopyableField value={`${detail.plz || detail.zipCode || ''} ${detail.ort || ''}`} />
            {customerLand && customerLand !== "Deutschland" && (
              <CopyableField value={customerLand} />
            )}
            {/* Komplette Adresse Copy */}
            <CopyableField icon={Copy} label="Vollständig" value={fullAddress} />
            {wizardData?.location?.siteAddress?.state && (
              <div className="dp-overview-field dp-overview-field--small">
                <Globe size={12} />
                <span>Bundesland: {wizardData.location.siteAddress.state}</span>
              </div>
            )}
            {(wizardData?.location?.siteAddress?.cadastralDistrict || wizardData?.location?.siteAddress?.parcel || wizardData?.location?.siteAddress?.parcelNumber) && (
              <div className="dp-overview-field dp-overview-field--small">
                <MapPin size={12} />
                <span>
                  {[
                    wizardData.location.siteAddress.cadastralDistrict && `Gemarkung: ${wizardData.location.siteAddress.cadastralDistrict}`,
                    wizardData.location.siteAddress.parcel && `Flur: ${wizardData.location.siteAddress.parcel}`,
                    wizardData.location.siteAddress.parcelNumber && `Flurstück: ${wizardData.location.siteAddress.parcelNumber}`,
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
            {wizardData?.location?.siteAddress?.gpsLat && wizardData?.location?.siteAddress?.gpsLng && (
              <div className="dp-overview-field dp-overview-field--small">
                <MapPin size={12} />
                <span>GPS: {wizardData.location.siteAddress.gpsLat.toFixed(6)}, {wizardData.location.siteAddress.gpsLng.toFixed(6)}</span>
              </div>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="dp-overview-link"
            >
              <ExternalLink size={12} /> Google Maps
            </a>
          </div>
        </div>

        {/* Netzbetreiber - MIT ZÄHLERNUMMER */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <Building2 size={18} />
            <h4>Netzbetreiber</h4>
            {!isKunde && !isEditingNbEmail && (
              <button className="dp-overview-card__action" onClick={() => { setIsEditingNbEmail(true); setNbEmailDraft(detail.nbEmail || ''); }} title="Einreich-Email bearbeiten">
                <Edit2 size={14} />
              </button>
            )}
          </div>
          <div className="dp-overview-card__content">
            <CopyableField icon={Building2} value={currentOperator?.name || detail.gridOperator || "Nicht zugewiesen"} />
            {currentOperator?.shortName && (
              <div className="dp-overview-field dp-overview-field--small">
                <span>Kurzname: {currentOperator.shortName}</span>
              </div>
            )}
            {detail.nbCaseNumber && (
              <CopyableField icon={Hash} label="Aktenzeichen" value={detail.nbCaseNumber} mono />
            )}
            {/* ZÄHLERNUMMER - NEU HIER */}
            {detail.zaehlernummer && (
              <CopyableField icon={Gauge} label="Zählernummer" value={detail.zaehlernummer} mono />
            )}
            {currentOperator?.email && (
              <CopyableField icon={Mail} label="NB-Email" value={currentOperator.email} href={`mailto:${currentOperator.email}`} />
            )}
            {detail.nbEmail && detail.nbEmail !== currentOperator?.email && !isEditingNbEmail && (
              <CopyableField icon={Send} label="Einreich-Email" value={detail.nbEmail} href={`mailto:${detail.nbEmail}`} />
            )}
            {/* NB-Email inline bearbeiten */}
            {isEditingNbEmail && (
              <div className="dp-nb-email-edit">
                <input
                  type="email"
                  value={nbEmailDraft}
                  onChange={e => setNbEmailDraft(e.target.value)}
                  placeholder="Einreich-Email eingeben"
                  className="dp-overview-field__input"
                  autoFocus
                />
                <div className="dp-nb-email-edit__actions">
                  <button
                    className="dp-btn dp-btn--sm dp-btn--primary"
                    disabled={isSavingNbEmail}
                    onClick={async () => {
                      setIsSavingNbEmail(true);
                      try {
                        await onUpdate({ nbEmail: nbEmailDraft.trim() || null } as any);
                        showToast('Einreich-Email gespeichert', 'success');
                        setIsEditingNbEmail(false);
                      } catch (err: any) {
                        showToast(err.message || 'Fehler beim Speichern', 'error');
                      } finally {
                        setIsSavingNbEmail(false);
                      }
                    }}
                  >
                    {isSavingNbEmail ? <Loader2 size={14} className="dp-spin" /> : <Save size={14} />}
                    <span>Speichern</span>
                  </button>
                  <button
                    className="dp-btn dp-btn--sm dp-btn--ghost"
                    onClick={() => { setIsEditingNbEmail(false); setNbEmailDraft(detail.nbEmail || ''); }}
                  >
                    <X size={14} /> Abbrechen
                  </button>
                </div>
              </div>
            )}
            {/* NB-Tracking Daten */}
            {detail.nbEingereichtAm && (
              <div className="dp-overview-field dp-overview-field--small">
                <Calendar size={12} />
                <span>Eingereicht: {new Date(detail.nbEingereichtAm).toLocaleDateString("de-DE")}</span>
              </div>
            )}
            {detail.nbGenehmigungAm && (
              <div className="dp-overview-field dp-overview-field--small dp-overview-field--success">
                <CheckCircle size={12} />
                <span>Genehmigt: {new Date(detail.nbGenehmigungAm).toLocaleDateString("de-DE")}</span>
              </div>
            )}
            {/* NB-Portal Links */}
            {detail.nbPortalUrl && (
              <a href={detail.nbPortalUrl} target="_blank" rel="noopener noreferrer" className="dp-overview-link dp-overview-link--primary">
                <ExternalLink size={12} /> NB-Portal (Vorgang)
              </a>
            )}
            {currentOperator?.portalUrl && !detail.nbPortalUrl && (
              <a href={currentOperator.portalUrl} target="_blank" rel="noopener noreferrer" className="dp-overview-link dp-overview-link--primary">
                <ExternalLink size={12} /> NB-Portal
              </a>
            )}
            {/* NB nachfragen Button - nur für Staff bei Status beim_nb */}
            {!isKunde && detail.status === "beim_nb" && (
              <div className="dp-nb-action">
                <button
                  className="dp-btn dp-btn--sm dp-btn--primary dp-nb-action__btn"
                  disabled={isSendingReminder}
                  onClick={async () => {
                    const count = (detail.reminderCount ?? 0) + 1;
                    const nbEmail = detail.nbEmail || currentOperator?.email || "unbekannt";
                    if (!confirm(`${count}. Nachfrage an ${nbEmail} senden?`)) return;
                    setIsSendingReminder(true);
                    try {
                      const token = getAccessToken();
                      const res = await fetch(`/api/ops/cases/${detail.id}/remind`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      });
                      const json = await res.json();
                      if (!res.ok) throw new Error(json.error || json.message || "Fehler");
                      showToast(`${json.data?.reminderNumber || count}. Nachfrage an ${json.data?.emailSentTo || nbEmail} gesendet`, "success");
                      onUpdate({ reminderCount: json.data?.reminderNumber || count, lastReminderAt: new Date().toISOString() } as any);
                    } catch (err: any) {
                      showToast(err.message || "Erinnerung fehlgeschlagen", "error");
                    } finally {
                      setIsSendingReminder(false);
                    }
                  }}
                >
                  {isSendingReminder ? <Loader2 size={14} className="dp-spin" /> : <Send size={14} />}
                  NB nachfragen
                </button>
                {(detail.reminderCount ?? 0) > 0 && (
                  <span className="dp-overview-badge dp-overview-badge--purple" title={`Letzte: ${detail.lastReminderAt ? new Date(detail.lastReminderAt).toLocaleDateString("de-DE") : "–"}`}>
                    {detail.reminderCount}. Nachfrage
                  </span>
                )}
                <span className="dp-nb-action__target">
                  → {detail.nbEmail || currentOperator?.email || "Keine Email"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NB-Portal Zugangsdaten - für Staff bei bekannten Portal-NB (Westnetz etc.) */}
        {isWestnetz && !isKunde && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <KeyRound size={18} />
              <h4>Westnetz-Portal</h4>
              {!isEditingWestnetz && (
                <button className="dp-overview-card__action" onClick={() => setIsEditingWestnetz(true)} title="Zugangsdaten bearbeiten">
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            <div className="dp-overview-card__content">
              {/* Portal-Link */}
              <a
                href="https://serviceportal.westnetz.de"
                target="_blank"
                rel="noopener noreferrer"
                className="dp-overview-link dp-overview-link--primary"
                style={{ marginBottom: '8px', display: 'inline-flex' }}
              >
                <ExternalLink size={12} /> Westnetz-Portal öffnen
              </a>

              {isEditingWestnetz ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={westnetzUsername}
                    onChange={e => setWestnetzUsername(e.target.value)}
                    placeholder="Benutzername / E-Mail"
                    className="dp-overview-field__input"
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showWestnetzPassword ? 'text' : 'password'}
                      value={westnetzPassword}
                      onChange={e => setWestnetzPassword(e.target.value)}
                      placeholder="Passwort"
                      className="dp-overview-field__input"
                      style={{ width: '100%', paddingRight: '36px' }}
                    />
                    <button
                      onClick={() => setShowWestnetzPassword(!showWestnetzPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                      title={showWestnetzPassword ? 'Verbergen' : 'Anzeigen'}
                      type="button"
                    >
                      {showWestnetzPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={westnetzNotizen}
                    onChange={e => setWestnetzNotizen(e.target.value)}
                    placeholder="Notizen (z.B. Registrierung am...)"
                    className="dp-overview-field__input"
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="dp-btn dp-btn--sm dp-btn--primary"
                      onClick={handleSaveWestnetz}
                      disabled={isSavingWestnetz}
                      style={{ flex: 1 }}
                    >
                      {isSavingWestnetz ? 'Speichere...' : 'Speichern'}
                    </button>
                    <button
                      className="dp-btn dp-btn--sm dp-btn--ghost"
                      onClick={() => {
                        setIsEditingWestnetz(false);
                        setWestnetzUsername((detail as any).nbPortalUsername || '');
                        setWestnetzPassword((detail as any).nbPortalPassword || '');
                        setWestnetzNotizen((detail as any).nbPortalNotizen || '');
                      }}
                    >
                      <X size={14} /> Abbrechen
                    </button>
                  </div>
                </div>
              ) : (detail as any).nbPortalUsername ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <CopyableField icon={User} label="Benutzer" value={(detail as any).nbPortalUsername} />
                  <div className="dp-copyable-field">
                    <KeyRound size={14} className="dp-copyable-field__icon" />
                    <div className="dp-copyable-field__content">
                      <span className="dp-copyable-field__label">Passwort</span>
                      <span className="dp-copyable-field__value" style={{ fontFamily: showWestnetzPassword ? 'inherit' : 'monospace' }}>
                        {showWestnetzPassword ? (detail as any).nbPortalPassword : '••••••••'}
                      </span>
                    </div>
                    <button
                      className="dp-copyable-field__btn"
                      onClick={() => setShowWestnetzPassword(!showWestnetzPassword)}
                      title={showWestnetzPassword ? 'Verbergen' : 'Anzeigen'}
                    >
                      {showWestnetzPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {(detail as any).nbPortalNotizen && (
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {(detail as any).nbPortalNotizen}
                    </div>
                  )}
                </div>
              ) : (
                <div className="dp-overview-field">
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Keine Zugangsdaten hinterlegt</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kommunikation — Summary mit Timeline (nur Staff) */}
        {!isKunde && (
          <KommunikationSummaryCard
            detail={detail}
            currentOperator={currentOperator}
            installationId={detail.id}
            showToast={showToast}
            onSwitchToTab={onSwitchToTab}
          />
        )}

        {/* Netzanschluss */}
        {wizardData?.gridConnection && (wizardData.gridConnection.hakId || wizardData.gridConnection.existingPowerKw || wizardData.gridConnection.groundingType) && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Zap size={18} />
              <h4>Netzanschluss</h4>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.gridConnection.hakId && (
                <CopyableField icon={Hash} label="HAK-ID" value={wizardData.gridConnection.hakId} mono />
              )}
              {wizardData.gridConnection.existingPowerKw != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Bestehende Leistung</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.existingPowerKw} kW</span>
                </div>
              )}
              {wizardData.gridConnection.existingFuseA != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Bestehende Absicherung</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.existingFuseA} A</span>
                </div>
              )}
              {wizardData.gridConnection.groundingType && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Erdungsart</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.groundingType}</span>
                </div>
              )}
              {wizardData.gridConnection.requestedPowerKw != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Gewünschte Leistung</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.requestedPowerKw} kW</span>
                </div>
              )}
              {wizardData.gridConnection.requestedFuseA != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Gewünschte Absicherung</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.requestedFuseA} A</span>
                </div>
              )}
              {wizardData.gridConnection.powerIncreaseReason && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Grund Leistungserhöhung</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.powerIncreaseReason}</span>
                </div>
              )}
              {wizardData.gridConnection.shortCircuitPowerMva != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Kurzschlussleistung</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.shortCircuitPowerMva} MVA</span>
                </div>
              )}
              {wizardData.gridConnection.gridImpedanceOhm != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Netzimpedanz</span>
                  <span className="dp-overview-field__value">{wizardData.gridConnection.gridImpedanceOhm} Ω</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Eigentumsverhältnis */}
        {wizardData?.ownership && wizardData.ownership.isOwner != null && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Home size={18} />
              <h4>Eigentumsverhältnis</h4>
            </div>
            <div className="dp-overview-card__content">
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Eigentümer?</span>
                <span className={wizardData.ownership.isOwner ? "dp-badge dp-badge--success" : "dp-badge dp-badge--warning"}>
                  {wizardData.ownership.isOwner ? 'Ja' : 'Nein'}
                </span>
              </div>
              {!wizardData.ownership.isOwner && (
                <>
                  <div className="dp-overview-field">
                    <span className="dp-overview-field__label">Zustimmung vorhanden?</span>
                    <span className={wizardData.ownership.consentAvailable ? "dp-badge dp-badge--success" : "dp-badge dp-badge--danger"}>
                      {wizardData.ownership.consentAvailable ? 'Ja' : 'Nein'}
                    </span>
                  </div>
                  {wizardData.ownership.ownerName && (
                    <CopyableField icon={User} label="Eigentümer" value={wizardData.ownership.ownerName} />
                  )}
                  {wizardData.ownership.ownerAddress && (
                    <CopyableField icon={MapPin} label="Adresse" value={wizardData.ownership.ownerAddress} />
                  )}
                  {wizardData.ownership.ownerEmail && (
                    <CopyableField icon={Mail} label="E-Mail" value={wizardData.ownership.ownerEmail} href={`mailto:${wizardData.ownership.ownerEmail}`} />
                  )}
                  {wizardData.ownership.ownerPhone && (
                    <CopyableField icon={Phone} value={wizardData.ownership.ownerPhone} href={`tel:${wizardData.ownership.ownerPhone}`} />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Zähler-Details */}
        {wizardData?.meter && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Gauge size={18} />
              <h4>Zähler</h4>
            </div>
            <div className="dp-overview-card__content">
              {(wizardData.meter.number || detail.zaehlernummer) && (
                <CopyableField icon={Hash} label="Nummer" value={wizardData.meter.number || detail.zaehlernummer} mono />
              )}
              {wizardData.meter.type && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Typ</span>
                  <span className="dp-overview-field__value">
                    {wizardData.meter.type === 'zweirichtung' ? 'Zweirichtungszähler' :
                     wizardData.meter.type === 'einrichtung' ? 'Einrichtungszähler' :
                     wizardData.meter.type}
                  </span>
                </div>
              )}
              {wizardData.meter.location && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Standort</span>
                  <span className="dp-overview-field__value">
                    {wizardData.meter.location === 'keller' ? 'Keller' :
                     wizardData.meter.location === 'hausanschluss' ? 'Hausanschluss' :
                     wizardData.meter.location === 'garage' ? 'Garage' :
                     wizardData.meter.location}
                  </span>
                </div>
              )}
              {wizardData.meter.ownership && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Eigentümer</span>
                  <span className="dp-overview-field__value">
                    {wizardData.meter.ownership === 'netzbetreiber' ? 'Netzbetreiber' :
                     wizardData.meter.ownership === 'kunde' ? 'Kunde' :
                     wizardData.meter.ownership}
                  </span>
                </div>
              )}
              {wizardData.meter.tariffType && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Tarifart</span>
                  <span className="dp-overview-field__value">
                    {wizardData.meter.tariffType === 'eintarif' ? 'Eintarif' :
                     wizardData.meter.tariffType === 'zweitarif' ? 'Zweitarif (HT/NT)' :
                     wizardData.meter.tariffType}
                  </span>
                </div>
              )}
              {wizardData.meter.readingConsumption != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Zählerstand Bezug</span>
                  <span className="dp-overview-field__value">{wizardData.meter.readingConsumption.toLocaleString('de-DE')} kWh</span>
                </div>
              )}
              {wizardData.meter.readingFeedIn != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Zählerstand Einspeisung</span>
                  <span className="dp-overview-field__value">{wizardData.meter.readingFeedIn.toLocaleString('de-DE')} kWh</span>
                </div>
              )}
              {wizardData.meter.readingDate && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Ablesedatum</span>
                  <span className="dp-overview-field__value">{new Date(wizardData.meter.readingDate).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {wizardData.meter.meterPointId && (
                <CopyableField icon={Hash} label="Zählpunkt" value={wizardData.meter.meterPointId} mono />
              )}
              {wizardData.meter.marketLocationId && (
                <CopyableField icon={Hash} label="MaLo-ID" value={wizardData.meter.marketLocationId} mono />
              )}
              {wizardData.meter.remoteReading != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Fernauslesung</span>
                  <span className={wizardData.meter.remoteReading ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.meter.remoteReading ? 'Ja' : 'Nein'}</span>
                </div>
              )}
              {wizardData.meter.smartMeterGateway != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Smart Meter Gateway</span>
                  <span className={wizardData.meter.smartMeterGateway ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.meter.smartMeterGateway ? 'Ja' : 'Nein'}</span>
                </div>
              )}
              {wizardData.meter.imsysRequested != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">iMSys gewünscht</span>
                  <span className={wizardData.meter.imsysRequested ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.meter.imsysRequested ? 'Ja' : 'Nein'}</span>
                </div>
              )}
              {wizardData.meter.changeReason && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Wechselgrund</span>
                  <span className="dp-overview-field__value">{wizardData.meter.changeReason}</span>
                </div>
              )}
              {wizardData.meter.oldMeterNumber && (
                <CopyableField icon={Hash} label="Alte Zählernr." value={wizardData.meter.oldMeterNumber} mono />
              )}
            </div>
          </div>
        )}

        {/* Zähler-Bestand (Multi-Zähler) */}
        {wizardData?.meterInventory && wizardData.meterInventory.length > 0 && (
          <div className="dp-overview-card dp-overview-card--wide">
            <div className="dp-overview-card__header">
              <Gauge size={18} />
              <h4>Zähler-Bestand</h4>
              <span className="dp-badge">{wizardData.meterInventory.length}</span>
            </div>
            <div className="dp-overview-card__content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Nummer</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Typ</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Stand (Bezug)</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Stand (Einsp.)</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Ablesedatum</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wizardData.meterInventory.map((m: any, i: number) => (
                      <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{m.meterNumber}</td>
                        <td style={{ padding: '6px 8px' }}>{m.type}</td>
                        <td style={{ padding: '6px 8px' }}>{m.lastReading != null ? `${m.lastReading.toLocaleString('de-DE')} kWh` : '-'}</td>
                        <td style={{ padding: '6px 8px' }}>{m.lastReadingFeedIn != null ? `${m.lastReadingFeedIn.toLocaleString('de-DE')} kWh` : '-'}</td>
                        <td style={{ padding: '6px 8px' }}>{m.readingDate ? new Date(m.readingDate).toLocaleDateString('de-DE') : '-'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span className={`dp-badge ${m.action === 'behalten' ? 'dp-badge--success' : m.action === 'abmelden' ? 'dp-badge--danger' : 'dp-badge--purple'}`}>
                            {m.action === 'behalten' ? 'Behalten' : m.action === 'abmelden' ? 'Abmelden' : 'Zusammenlegen'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Neuer Zähler */}
        {wizardData?.newMeter && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Gauge size={18} />
              <h4>Neuer Zähler</h4>
              <span className="dp-badge dp-badge--success">Neu</span>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.newMeter.type && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Typ</span>
                  <span className="dp-overview-field__value">{wizardData.newMeter.type}</span>
                </div>
              )}
              {wizardData.newMeter.location && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Standort</span>
                  <span className="dp-overview-field__value">{wizardData.newMeter.location}</span>
                </div>
              )}
              {wizardData.newMeter.mounting && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Befestigung</span>
                  <span className="dp-overview-field__value">{wizardData.newMeter.mounting}</span>
                </div>
              )}
              {wizardData.newMeter.tariffType && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Tarifart</span>
                  <span className="dp-overview-field__value">{wizardData.newMeter.tariffType}</span>
                </div>
              )}
              {wizardData.newMeter.imsysRequested != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">iMSys gewünscht</span>
                  <span className={wizardData.newMeter.imsysRequested ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.newMeter.imsysRequested ? 'Ja' : 'Nein'}</span>
                </div>
              )}
              {wizardData.newMeter.forSystem && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Für Anlage</span>
                  <span className="dp-overview-field__value">{wizardData.newMeter.forSystem}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inbetriebnahme */}
        {wizardData?.commissioning && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Calendar size={18} />
              <h4>Inbetriebnahme</h4>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.commissioning.plannedDate && (
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span className="dp-overview-field__label">Geplant:</span>
                  <span>{new Date(wizardData.commissioning.plannedDate).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {wizardData.commissioning.actualDate && (
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span className="dp-overview-field__label">Tatsächlich:</span>
                  <span>{new Date(wizardData.commissioning.actualDate).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {wizardData.commissioning.eegDate && (
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span className="dp-overview-field__label">EEG-Datum:</span>
                  <span>{new Date(wizardData.commissioning.eegDate).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {wizardData.commissioning.mastrNumber && (
                <CopyableField icon={Hash} label="MaStR-Nr" value={wizardData.commissioning.mastrNumber} mono />
              )}
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">MaStR registriert:</span>
                <span className={wizardData.commissioning.mastrRegistered ? "dp-badge dp-badge--success" : "dp-badge"}>
                  {wizardData.commissioning.mastrRegistered ? '✓ Ja' : 'Nein'}
                </span>
              </div>
              {wizardData.commissioning.mastrDate && (
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span className="dp-overview-field__label">MaStR-Anmeldedatum:</span>
                  <span>{new Date(wizardData.commissioning.mastrDate).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">NB informiert:</span>
                <span className={wizardData.commissioning.gridOperatorNotified ? "dp-badge dp-badge--success" : "dp-badge"}>
                  {wizardData.commissioning.gridOperatorNotified ? '✓ Ja' : 'Nein'}
                </span>
              </div>
              {wizardData.commissioning.gridOperatorNotificationDate && (
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span className="dp-overview-field__label">NB-Meldedatum:</span>
                  <span>{new Date(wizardData.commissioning.gridOperatorNotificationDate).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {wizardData.commissioning.gridOperatorConfirmation != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">NB-Bestätigung:</span>
                  <span className={wizardData.commissioning.gridOperatorConfirmation ? "dp-badge dp-badge--success" : "dp-badge dp-badge--warning"}>
                    {wizardData.commissioning.gridOperatorConfirmation ? '✓ Erhalten' : 'Ausstehend'}
                  </span>
                </div>
              )}
              {wizardData.commissioning.commissioningStatus && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">IBN-Status:</span>
                  <span className={`dp-badge ${wizardData.commissioning.commissioningStatus === 'durchgefuehrt' ? 'dp-badge--success' : wizardData.commissioning.commissioningStatus === 'abgenommen' ? 'dp-badge--success' : 'dp-badge--purple'}`}>
                    {wizardData.commissioning.commissioningStatus === 'geplant' ? 'Geplant' :
                     wizardData.commissioning.commissioningStatus === 'beantragt' ? 'Beantragt' :
                     wizardData.commissioning.commissioningStatus === 'freigegeben' ? 'Freigegeben' :
                     wizardData.commissioning.commissioningStatus === 'durchgefuehrt' ? 'Durchgeführt' :
                     wizardData.commissioning.commissioningStatus === 'abgenommen' ? 'Abgenommen' :
                     wizardData.commissioning.commissioningStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technische Daten */}
        <div className="dp-overview-card dp-overview-card--wide">
          <div className="dp-overview-card__header">
            <Zap size={18} />
            <h4>Technische Daten</h4>
          </div>
          <div className="dp-overview-card__content">
            <div className="dp-tech-grid">
              {tech.pv && tech.pv.length > 0 && (
                <div className="dp-tech-item">
                  <div className="dp-tech-item__icon dp-tech-item__icon--pv"><Sun size={18} /></div>
                  <div className="dp-tech-item__content">
                    <span className="dp-tech-item__label">PV</span>
                    {tech.pv.map((pv: any, i: number) => (
                      <div key={i} className="dp-tech-item__detail">
                        <strong>{pv.manufacturer} {pv.model}</strong>
                        <span>{pv.count}x {pv.powerWp}Wp</span>
                        {(pv.orientation || pv.tilt || pv.roofName) && (
                          <span className="dp-tech-item__meta">
                            {pv.roofName && `${pv.roofName} · `}
                            {pv.orientation && `${pv.orientation} · `}
                            {pv.tilt && `${pv.tilt}°`}
                            {pv.shading && pv.shading !== 'keine' && ` · Verschattung: ${pv.shading}`}
                          </span>
                        )}
                        {(pv.stringCount || pv.modulesPerString) && (
                          <span className="dp-tech-item__meta">
                            {pv.stringCount && `${pv.stringCount} Strings`}
                            {pv.stringCount && pv.modulesPerString && ' · '}
                            {pv.modulesPerString && `${pv.modulesPerString} Module/String`}
                          </span>
                        )}
                      </div>
                    ))}
                    <span className="dp-tech-item__total">{tech.totalKwp?.toFixed(2) || detail.totalKwp?.toFixed(2)} kWp</span>
                  </div>
                </div>
              )}
              {tech.inverters && tech.inverters.length > 0 && (
                <div className="dp-tech-item">
                  <div className="dp-tech-item__icon dp-tech-item__icon--inverter"><Zap size={18} /></div>
                  <div className="dp-tech-item__content">
                    <span className="dp-tech-item__label">Wechselrichter</span>
                    {tech.inverters.map((inv: any, i: number) => (
                      <div key={i} className="dp-tech-item__detail">
                        <strong>{inv.manufacturer} {inv.model}</strong>
                        <span>{inv.powerKva || inv.powerKw} kVA{inv.powerKw ? ` / ${inv.powerKw} kW` : ''}</span>
                        {inv.zerezId && <span className="dp-tech-item__zerez">ZEREZ: {inv.zerezId}</span>}
                        {inv.hybrid && <span className="dp-tech-item__badge">Hybrid</span>}
                        {inv.mpptCount && <span className="dp-tech-item__meta">{inv.mpptCount} MPPT</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tech.storage && tech.storage.length > 0 && (
                <div className="dp-tech-item">
                  <div className="dp-tech-item__icon dp-tech-item__icon--storage"><Battery size={18} /></div>
                  <div className="dp-tech-item__content">
                    <span className="dp-tech-item__label">Speicher</span>
                    {tech.storage.map((st: any, i: number) => (
                      <div key={i} className="dp-tech-item__detail">
                        <strong>{st.manufacturer} {st.model}</strong>
                        <span>{st.capacityKwh} kWh</span>
                        {st.coupling && <span className="dp-tech-item__badge">{st.coupling === 'dc' ? 'DC-gekoppelt' : 'AC-gekoppelt'}</span>}
                        {st.powerKw && <span className="dp-tech-item__meta">{st.powerKw} kW</span>}
                        {st.apparentPowerKva && <span className="dp-tech-item__meta">SSmax: {st.apparentPowerKva} kVA</span>}
                        {st.ratedCurrentA && <span className="dp-tech-item__meta">Ir: {st.ratedCurrentA} A</span>}
                        {st.emergencyPower && <span className="dp-tech-item__badge">Notstrom</span>}
                        {st.backupPower && <span className="dp-tech-item__badge">Ersatzstrom</span>}
                        {st.islandForming && <span className="dp-tech-item__badge">Inselnetz</span>}
                        {st.connectionPhase && <span className="dp-tech-item__meta">Phase: {st.connectionPhase}</span>}
                        {st.allPoleSeparation && <span className="dp-tech-item__meta">Allpolige Trennung</span>}
                        {st.naProtectionPresent && <span className="dp-tech-item__meta">NA-Schutz vorhanden</span>}
                        {st.inverterManufacturer && (
                          <span className="dp-tech-item__meta">Umrichter: {st.inverterManufacturer} {st.inverterType || ''}{st.inverterCount ? ` (${st.inverterCount}x)` : ''}</span>
                        )}
                        {st.displacementFactorCos && <span className="dp-tech-item__meta">cos φ: {st.displacementFactorCos}</span>}
                      </div>
                    ))}
                    <span className="dp-tech-item__total">{tech.storageKwh} kWh</span>
                  </div>
                </div>
              )}
              {tech.wallbox && tech.wallbox.length > 0 && (
                <div className="dp-tech-item">
                  <div className="dp-tech-item__icon dp-tech-item__icon--wallbox"><Car size={18} /></div>
                  <div className="dp-tech-item__content">
                    <span className="dp-tech-item__label">Wallbox</span>
                    {tech.wallbox.map((wb: any, i: number) => (
                      <div key={i} className="dp-tech-item__detail">
                        <strong>{wb.manufacturer} {wb.model}</strong>
                        <span>{wb.powerKw} kW</span>
                        {wb.controllable14a && <span className="dp-tech-item__badge">§14a</span>}
                        {wb.phases && <span className="dp-tech-item__meta">{wb.phases}-phasig</span>}
                        {wb.socketType && <span className="dp-tech-item__meta">{wb.socketType}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tech.heatPump && tech.heatPump.length > 0 && (
                <div className="dp-tech-item">
                  <div className="dp-tech-item__icon dp-tech-item__icon--heatpump"><Flame size={18} /></div>
                  <div className="dp-tech-item__content">
                    <span className="dp-tech-item__label">Wärmepumpe</span>
                    {tech.heatPump.map((hp: any, i: number) => (
                      <div key={i} className="dp-tech-item__detail">
                        <strong>{hp.manufacturer} {hp.model}</strong>
                        <span>{hp.powerKw} kW</span>
                        {hp.type && <span className="dp-tech-item__meta">{hp.type === 'Luft' ? 'Luft-Wasser' : hp.type === 'Sole' ? 'Sole-Wasser' : hp.type === 'Wasser' ? 'Wasser-Wasser' : hp.type}</span>}
                        {hp.controllable14a && <span className="dp-tech-item__badge">§14a</span>}
                        {hp.sgReady && <span className="dp-tech-item__badge">SG Ready</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Einspeisung */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <Zap size={18} />
            <h4>Einspeisung</h4>
          </div>
          <div className="dp-overview-card__content">
            <div className="dp-overview-field">
              <span className="dp-overview-field__label">Einspeiseart</span>
              <span className="dp-overview-field__value">
                {safeString(wizardData?.step5?.einspeiseart) || safeString(detail.technicalData?.gridConnection?.feedInType) || "Überschusseinspeisung"}
              </span>
            </div>
            {(wizardData?.step5?.messkonzept || detail.messkonzept) && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Messkonzept</span>
                <span className="dp-overview-field__value">{safeString(wizardData?.step5?.messkonzept) || safeString(detail.messkonzept)}</span>
              </div>
            )}
            {wizardData?.technical?.paragraph14a?.relevant && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">§14a steuerbar</span>
                <span className="dp-badge dp-badge--warning">Ja{wizardData.technical.paragraph14a.modul ? ` (${wizardData.technical.paragraph14a.modul})` : ''}</span>
              </div>
            )}
            {wizardData?.technical?.operationMode && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Betriebsweise</span>
                <span className="dp-overview-field__value">
                  {[
                    wizardData.technical.operationMode.ueberschusseinspeisung && 'Überschuss',
                    wizardData.technical.operationMode.volleinspeisung && 'Voll',
                    wizardData.technical.operationMode.inselbetrieb && 'Insel',
                  ].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            )}
            {wizardData?.technical?.feedInPhases && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Einspeisephasen</span>
                <span className="dp-overview-field__value">{wizardData.technical.feedInPhases}</span>
              </div>
            )}
            {wizardData?.technical?.reactiveCompensation?.vorhanden && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Blindleistungskompensation</span>
                <span className="dp-badge dp-badge--success">Ja</span>
              </div>
            )}
            {wizardData?.technical?.feedInManagement && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Einspeisemanagement</span>
                <span className="dp-overview-field__value">
                  {wizardData.technical.feedInManagement.ferngesteuert ? 'Ferngesteuert' : ''}
                  {wizardData.technical.feedInManagement.dauerhaftBegrenzt ? ` · Begrenzt auf ${wizardData.technical.feedInManagement.begrenzungProzent || '?'}%` : ''}
                </span>
              </div>
            )}
            {wizardData?.technical?.plannedCommissioning && (
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Geplante IBN</span>
                <span className="dp-overview-field__value">{new Date(wizardData.technical.plannedCommissioning).toLocaleDateString('de-DE')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bankdaten */}
        {wizardData?.customer?.iban && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <CreditCard size={18} />
              <h4>Bankdaten</h4>
            </div>
            <div className="dp-overview-card__content">
              <CopyableField icon={CreditCard} label="IBAN" value={wizardData.customer.iban} mono />
              {wizardData.customer.bic && (
                <CopyableField icon={Hash} label="BIC" value={wizardData.customer.bic} mono />
              )}
              {wizardData.customer.accountHolder && (
                <CopyableField icon={User} label="Kontoinhaber" value={wizardData.customer.accountHolder} />
              )}
            </div>
          </div>
        )}

        {/* Rechnungsadresse */}
        {wizardData?.customer?.billingAddress && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <FileText size={18} />
              <h4>Rechnungsadresse</h4>
            </div>
            <div className="dp-overview-card__content">
              <CopyableField icon={MapPin} value={`${wizardData.customer.billingAddress.street} ${wizardData.customer.billingAddress.houseNumber}`} />
              <CopyableField value={`${wizardData.customer.billingAddress.zip} ${wizardData.customer.billingAddress.city}`} />
            </div>
          </div>
        )}

        {/* Registernummern */}
        {(wizardData?.customer?.mastrNumber || wizardData?.customer?.eegKey) && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Hash size={18} />
              <h4>Registernummern</h4>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.customer.mastrNumber && (
                <CopyableField icon={Hash} label="MaStR-Nr." value={wizardData.customer.mastrNumber} mono />
              )}
              {wizardData.customer.eegKey && (
                <CopyableField icon={Hash} label="EEG-Schlüssel" value={wizardData.customer.eegKey} mono />
              )}
            </div>
          </div>
        )}

        {/* Vorgangsdetails */}
        {(wizardData?.processType || wizardData?.meterProcess || wizardData?.decommissioning || wizardData?.completion) && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <ClipboardCheck size={18} />
              <h4>Vorgangsdetails</h4>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.processType && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Vorgangsart</span>
                  <span className="dp-overview-field__value">{wizardData.processType}</span>
                </div>
              )}
              {wizardData.meterProcess && (
                <>
                  <div className="dp-overview-field">
                    <span className="dp-overview-field__label">Zähler-Prozess</span>
                    <span className="dp-overview-field__value">{wizardData.meterProcess.processType}</span>
                  </div>
                  {wizardData.meterProcess.oldMeterNumber && (
                    <CopyableField icon={Hash} label="Alte Zählernr." value={wizardData.meterProcess.oldMeterNumber} mono />
                  )}
                  {wizardData.meterProcess.newMeterType && (
                    <div className="dp-overview-field">
                      <span className="dp-overview-field__label">Neuer Zählertyp</span>
                      <span className="dp-overview-field__value">{wizardData.meterProcess.newMeterType}</span>
                    </div>
                  )}
                </>
              )}
              {wizardData.decommissioning && (
                <>
                  <div className="dp-overview-field" style={{ marginTop: '8px', fontWeight: 600, fontSize: '13px' }}>Demontage</div>
                  {wizardData.decommissioning.type && (
                    <div className="dp-overview-field">
                      <span className="dp-overview-field__label">Typ</span>
                      <span className="dp-overview-field__value">{wizardData.decommissioning.type}</span>
                    </div>
                  )}
                  {wizardData.decommissioning.reason && (
                    <div className="dp-overview-field">
                      <span className="dp-overview-field__label">Grund</span>
                      <span className="dp-overview-field__value">{wizardData.decommissioning.reason}</span>
                    </div>
                  )}
                  {wizardData.decommissioning.requestedDate && (
                    <div className="dp-overview-field">
                      <span className="dp-overview-field__label">Gewünschtes Datum</span>
                      <span className="dp-overview-field__value">{new Date(wizardData.decommissioning.requestedDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </>
              )}
              {wizardData.completion && (
                <>
                  <div className="dp-overview-field" style={{ marginTop: '8px', fontWeight: 600, fontSize: '13px' }}>Fertigmeldung</div>
                  <div className="dp-overview-field">
                    <span className="dp-overview-field__label">Installation abgeschlossen</span>
                    <span className={wizardData.completion.installationComplete ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.completion.installationComplete ? 'Ja' : 'Nein'}</span>
                  </div>
                  <div className="dp-overview-field">
                    <span className="dp-overview-field__label">NB gemeldet</span>
                    <span className={wizardData.completion.gridOperatorNotified ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.completion.gridOperatorNotified ? 'Ja' : 'Nein'}</span>
                  </div>
                  <div className="dp-overview-field">
                    <span className="dp-overview-field__label">Zähler gesetzt</span>
                    <span className={wizardData.completion.meterInstalled ? "dp-badge dp-badge--success" : "dp-badge"}>{wizardData.completion.meterInstalled ? 'Ja' : 'Nein'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Prüfprotokoll */}
        {wizardData?.commissioning?.testProtocol && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <ClipboardCheck size={18} />
              <h4>Prüfprotokoll</h4>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.commissioning.testProtocol.testDate && (
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span className="dp-overview-field__label">Prüfdatum</span>
                  <span>{new Date(wizardData.commissioning.testProtocol.testDate).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {wizardData.commissioning.testProtocol.testerName && (
                <CopyableField icon={User} label="Prüfer" value={wizardData.commissioning.testProtocol.testerName} />
              )}
              {wizardData.commissioning.testProtocol.insulationMOhm != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Isolationsmessung</span>
                  <span className="dp-overview-field__value">{wizardData.commissioning.testProtocol.insulationMOhm} MOhm</span>
                </div>
              )}
              {wizardData.commissioning.testProtocol.loopImpedanceOhm != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Schleifenimpedanz</span>
                  <span className="dp-overview-field__value">{wizardData.commissioning.testProtocol.loopImpedanceOhm} Ohm</span>
                </div>
              )}
              {wizardData.commissioning.testProtocol.rcdTripTimeMs != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">RCD-Auslösezeit</span>
                  <span className="dp-overview-field__value">{wizardData.commissioning.testProtocol.rcdTripTimeMs} ms</span>
                </div>
              )}
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Gesamtergebnis</span>
                <span className={wizardData.commissioning.testProtocol.passed ? "dp-badge dp-badge--success" : "dp-badge dp-badge--danger"}>
                  {wizardData.commissioning.testProtocol.passed ? 'Bestanden' : 'Nicht bestanden'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fotos */}
        {wizardData?.photos && wizardData.photos.length > 0 && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <FileText size={18} />
              <h4>Fotos</h4>
              <span className="dp-badge">{wizardData.photos.length}</span>
            </div>
            <div className="dp-overview-card__content">
              {wizardData.photos.map((photo: any, i: number) => (
                <div key={i} className="dp-overview-field">
                  <span className="dp-overview-field__label">{photo.category || 'Foto'}</span>
                  <span className="dp-overview-field__value">{photo.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vollmacht & Einwilligungen */}
        {wizardData?.authorization && (
          <div className="dp-overview-card">
            <div className="dp-overview-card__header">
              <Shield size={18} />
              <h4>Vollmacht & Einwilligungen</h4>
            </div>
            <div className="dp-overview-card__content">
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Vollmacht erteilt</span>
                <span className={wizardData.authorization.powerOfAttorney ? "dp-badge dp-badge--success" : "dp-badge dp-badge--danger"}>
                  {wizardData.authorization.powerOfAttorney ? 'Ja' : 'Nein'}
                </span>
              </div>
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">AGB akzeptiert</span>
                <span className={wizardData.authorization.termsAccepted ? "dp-badge dp-badge--success" : "dp-badge"}>
                  {wizardData.authorization.termsAccepted ? 'Ja' : 'Nein'}
                </span>
              </div>
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">Datenschutz akzeptiert</span>
                <span className={wizardData.authorization.privacyAccepted ? "dp-badge dp-badge--success" : "dp-badge"}>
                  {wizardData.authorization.privacyAccepted ? 'Ja' : 'Nein'}
                </span>
              </div>
              <div className="dp-overview-field">
                <span className="dp-overview-field__label">MaStR-Voranmeldung</span>
                <span className={wizardData.authorization.mastrRegistration ? "dp-badge dp-badge--success" : "dp-badge"}>
                  {wizardData.authorization.mastrRegistration ? 'Ja' : 'Nein'}
                </span>
              </div>
              {wizardData.authorization.createCustomerPortal != null && (
                <div className="dp-overview-field">
                  <span className="dp-overview-field__label">Kundenportal anlegen</span>
                  <span className={wizardData.authorization.createCustomerPortal ? "dp-badge dp-badge--success" : "dp-badge"}>
                    {wizardData.authorization.createCustomerPortal ? 'Ja' : 'Nein'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zeitstempel */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <Calendar size={18} />
            <h4>Zeitstempel</h4>
          </div>
          <div className="dp-overview-card__content">
            <div className="dp-overview-field">
              <Clock size={14} />
              <span className="dp-overview-field__label">Erstellt:</span>
              <span>{new Date(detail.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
            <div className="dp-overview-field">
              <Clock size={14} />
              <span className="dp-overview-field__label">Aktualisiert:</span>
              <span>{new Date(detail.updatedAt).toLocaleDateString("de-DE")}</span>
            </div>
            {detail.deadline && (
              <div className="dp-overview-field">
                <Calendar size={14} />
                <span className="dp-overview-field__label">Deadline:</span>
                <span>{new Date(detail.deadline).toLocaleDateString("de-DE")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ersteller */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <UserCircle size={18} />
            <h4>Ersteller</h4>
          </div>
          <div className="dp-overview-card__content">
            <CopyableField icon={User} value={safeString(detail.createdByName) || safeString(detail.createdByEmail) || "Unbekannt"} />
            {detail.createdByEmail && detail.createdByName && (
              <CopyableField icon={Mail} label="E-Mail" value={safeString(detail.createdByEmail)} href={`mailto:${detail.createdByEmail}`} />
            )}
            {detail.createdByCompany && (
              <CopyableField icon={Building2} value={detail.createdByCompany} />
            )}
          </div>
        </div>

        {/* Subunternehmer */}
        <SubcontractorCard detail={detail} onUpdate={onUpdate} showToast={showToast} />

        {/* Kommentare - Preview */}
        <CommentsPreview
          installationId={detail.id}
          showToast={showToast}
          onShowAll={onSwitchToTimeline}
          maxComments={3}
          permissions={permissions}
        />

        {/* Zählerwechsel-Terminmanagement */}
        <div className="dp-overview-card">
          <div className="dp-overview-card__header">
            <CalendarClock size={18} />
            <h4>Zählerwechsel</h4>
            {!isKunde && !isEditingZaehlerwechsel && detail.zaehlerwechselDatum && (
              <button className="dp-overview-card__action" onClick={() => setIsEditingZaehlerwechsel(true)} title="Termin bearbeiten">
                <Edit2 size={14} />
              </button>
            )}
          </div>
          <div className="dp-overview-card__content">
            {isEditingZaehlerwechsel ? (
              /* ─── Termin planen / bearbeiten ─── */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="date"
                    value={zaehlerwechselDatum}
                    onChange={(e) => setZaehlerwechselDatum(e.target.value)}
                    className="dp-overview-field__input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="time"
                    value={zaehlerwechselUhrzeit}
                    onChange={(e) => setZaehlerwechselUhrzeit(e.target.value)}
                    className="dp-overview-field__input"
                    style={{ width: "100px" }}
                  />
                </div>
                <input
                  type="text"
                  value={zaehlerwechselKommentar}
                  onChange={(e) => setZaehlerwechselKommentar(e.target.value)}
                  placeholder="Kommentar (optional)"
                  className="dp-overview-field__input"
                  style={{ width: "100%" }}
                />
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  <Info size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Kunde wird per Email + WhatsApp benachrichtigt
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="dp-btn dp-btn--sm dp-btn--primary"
                    onClick={handleScheduleZaehlerwechsel}
                    disabled={isSaving || !zaehlerwechselDatum}
                    style={{ flex: 1 }}
                  >
                    {isSaving ? "Sende..." : "Termin senden"}
                  </button>
                  <button
                    className="dp-btn dp-btn--sm dp-btn--ghost"
                    onClick={() => {
                      setIsEditingZaehlerwechsel(false);
                      setZaehlerwechselDatum(detail.zaehlerwechselDatum?.split('T')[0] || '');
                      setZaehlerwechselUhrzeit(detail.zaehlerwechselUhrzeit || '09:00');
                      setZaehlerwechselKommentar(detail.zaehlerwechselKommentar || '');
                    }}
                  >
                    <X size={14} /> Abbrechen
                  </button>
                </div>
              </div>
            ) : detail.zaehlerwechselDatum ? (
              /* ─── Termin geplant: Details anzeigen ─── */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span style={{ fontWeight: 600 }}>
                    {new Date(detail.zaehlerwechselDatum).toLocaleDateString("de-DE", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                    {detail.zaehlerwechselUhrzeit ? ` um ${detail.zaehlerwechselUhrzeit} Uhr` : ""}
                  </span>
                </div>
                {detail.zaehlerwechselKommentar && (
                  <div className="dp-overview-field" style={{ fontSize: "13px", color: "#64748b" }}>
                    <span style={{ fontStyle: "italic" }}>"{detail.zaehlerwechselKommentar}"</span>
                  </div>
                )}
                {zwAppointment ? (
                  <div className="dp-overview-field">
                    {zwAppointment.status === "CONFIRMED" ? (
                      <>
                        <CheckCircle size={14} style={{ color: "#22c55e" }} />
                        <span style={{ color: "#22c55e", fontWeight: 500 }}>
                          Bestätigt{zwAppointment.confirmedAt
                            ? ` am ${new Date(zwAppointment.confirmedAt).toLocaleDateString("de-DE")}`
                            : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} style={{ color: "#f59e0b" }} />
                        <span style={{ color: "#f59e0b", fontWeight: 500 }}>Warte auf Bestätigung</span>
                      </>
                    )}
                  </div>
                ) : detail.zaehlerwechselKundeInformiert ? (
                  <div className="dp-overview-field">
                    <CheckCircle size={14} style={{ color: "#22c55e" }} />
                    <span style={{ color: "#22c55e", fontWeight: 500 }}>Kunde informiert</span>
                  </div>
                ) : null}
                {zwAppointment?.createdAt && (
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Benachrichtigt am {new Date(zwAppointment.createdAt).toLocaleDateString("de-DE")}
                  </div>
                )}
                {!isKunde && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      className="dp-btn dp-btn--sm dp-btn--ghost"
                      onClick={() => setIsEditingZaehlerwechsel(true)}
                      disabled={isSaving}
                    >
                      <Edit2 size={12} /> Verschieben
                    </button>
                    <button
                      className="dp-btn dp-btn--sm dp-btn--ghost"
                      onClick={handleCancelZaehlerwechsel}
                      disabled={isSaving}
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={12} /> Absagen
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ─── Kein Termin geplant ─── */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="dp-overview-field">
                  <Calendar size={14} />
                  <span style={{ color: "#94a3b8" }}>Kein Termin geplant</span>
                </div>
                {!isKunde && (
                  <button
                    className="dp-btn dp-btn--sm dp-btn--primary"
                    onClick={() => setIsEditingZaehlerwechsel(true)}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Plus size={14} /> Termin planen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* NB-Referenzen - am Ende */}
        {!isKunde && <NBReferencesCard installationId={detail.id} showToast={showToast} />}
      </div>
    </div>
  );
}

/**
 * DETAIL MODAL - Modern Installation Detail View
 * ===============================================
 * Tabbed modal with all installation data
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X, User, MapPin, Phone, Mail, Zap, Battery, Car, Building2,
  Copy, ExternalLink, FileText, Upload, CheckCircle, Circle,
  Clock, Receipt, AlertTriangle, Send, Calendar, Thermometer,
  Sun, Gauge, Plug, Eye, Trash2, Plus, History, MessageSquare,
  ChevronRight, Loader2, Check, Phone as PhoneIcon, MapPinned,
  XCircle, ArrowRight, RotateCcw, Ban, FileCheck, ClipboardCheck,
  Coins, Download, Camera, Bell, AlertCircle, Info, Users, RefreshCw,
} from "lucide-react";
import "./DetailModal.css";
import { EnergyDashboard } from "./EnergyDashboard";
import { CommentsSection, CommentsPreview } from "../Comments";
import { PremiumOverviewTab } from "./PremiumOverviewTab";
import { DashboardV2 } from "../../../../components/DashboardV2/DashboardV2";
import { EmailTabView } from "./EmailTabView";
import { usePermissions, canTransitionToStatus, type Permissions } from "../../../../hooks/usePermissions";
import { AIQuickActions } from "../ai/AIQuickActions";

// Types
interface TechnicalDetails {
  messkonzept?: string;
  dachflaechen?: any[];
  wechselrichter?: any[];
  speicher?: any[];
  wallboxen?: any[];
  waermepumpen?: any[];
}

interface Document {
  id: number;
  dateiname: string;
  originalName: string;
  kategorie: string;
  dokumentTyp?: string;
  url: string;
  createdAt: string;
}

interface Installation {
  id: number;
  publicId: string;
  customerName: string;
  customerType?: string;
  contactEmail?: string;
  contactPhone?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  status: string;
  statusLabel?: string;
  gridOperator?: string;
  gridOperatorId?: number;
  gridOperatorPortalUrl?: string;
  nbEmail?: string;
  nbCaseNumber?: string;
  nbPortalUrl?: string;
  nbEingereichtAm?: string;
  nbGenehmigungAm?: string;
  zaehlernummer?: string;
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  messkonzept?: string;
  technicalDetails?: TechnicalDetails;
  daysAtNb?: number;
  daysOld?: number;
  isBilled?: boolean;
  createdAt?: string;
  documents?: Document[];
  // 🔥 NEU: Erweiterte Kundendaten
  salutation?: string;
  birthDate?: string;
  mobilePhone?: string;
  parcelNumber?: string;
  meterPointId?: string;
  // 🔥 NEU: Erweiterte technische Daten
  extendedTechnical?: {
    feedInType?: string;
    paragraph14a?: { relevant: boolean; module?: string };
    gridLevel?: string;
    naProtectionRequired?: boolean;
    operationMode?: any;
    gridFeedPhases?: string;
    feedInManagement?: any;
    plannedCommissioning?: string;
  };
  alertsEnabled?: boolean;
  // 🔥 NEU: Wizard-Kontext für vollständige Daten
  wizardContext?: string;
}

interface DetailModalProps {
  installationId: number | string;
  onClose: () => void;
}

// Alert Types
interface InstallationAlert {
  id: number;
  type: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  message?: string;
  isRead: boolean;
  isResolved: boolean;
  deadline?: string;
  createdAt: string;
}

// API fetch function (supports both numeric ID and publicId)
async function fetchInstallation(id: number | string): Promise<Installation> {
  const res = await fetch(`/api/installations/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Fehler: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// Fetch alerts for installation
async function fetchInstallationAlerts(installationId: number | string): Promise<InstallationAlert[]> {
  const res = await fetch(`/api/alerts/installation/${installationId}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  eingang: { label: "Eingang", color: "#3b82f6", step: 0 },
  beim_nb: { label: "Beim NB", color: "#eab308", step: 1 },
  rueckfrage: { label: "Rückfrage", color: "#ef4444", step: 1 },
  genehmigt: { label: "Genehmigt", color: "#22c55e", step: 2 },
  ibn: { label: "IBN", color: "#a855f7", step: 3 },
  fertig: { label: "Fertig", color: "#10b981", step: 4 },
  abgerechnet: { label: "Abgerechnet", color: "#059669", step: 5 },
  storniert: { label: "Storniert", color: "#6b7280", step: -1 },
};

// Smart Status Transitions - kontextabhängige Buttons pro Status
interface StatusAction {
  targetStatus: string;
  label: string;
  icon: typeof CheckCircle;
  variant: "primary" | "success" | "warning" | "danger" | "outline";
  isPrimary?: boolean;
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  setsDate?: string; // Welches Datum automatisch gesetzt wird
}

const STATUS_TRANSITIONS: Record<string, { primary: StatusAction[]; secondary: StatusAction[] }> = {
  eingang: {
    primary: [
      { targetStatus: "beim_nb", label: "Beim NB eingereicht", icon: Send, variant: "primary", isPrimary: true, setsDate: "nbEingereichtAm" },
    ],
    secondary: [
      { targetStatus: "storniert", label: "Stornieren", icon: Ban, variant: "danger", requiresReason: true, reasonPlaceholder: "Grund für Stornierung..." },
    ],
  },
  beim_nb: {
    primary: [
      { targetStatus: "genehmigt", label: "Genehmigung erhalten", icon: CheckCircle, variant: "success", isPrimary: true, setsDate: "nbGenehmigungAm" },
    ],
    secondary: [
      { targetStatus: "rueckfrage", label: "Rückfrage vom NB", icon: AlertTriangle, variant: "warning", requiresReason: true, reasonPlaceholder: "Was fragt der NB?" },
      { targetStatus: "eingang", label: "Zurück zu Eingang", icon: RotateCcw, variant: "outline" },
      { targetStatus: "storniert", label: "Stornieren", icon: Ban, variant: "danger", requiresReason: true, reasonPlaceholder: "Grund für Stornierung..." },
    ],
  },
  rueckfrage: {
    primary: [
      { targetStatus: "beim_nb", label: "Rückfrage beantwortet", icon: Send, variant: "primary", isPrimary: true },
      { targetStatus: "genehmigt", label: "Direkt genehmigt", icon: CheckCircle, variant: "success", setsDate: "nbGenehmigungAm" },
    ],
    secondary: [
      { targetStatus: "storniert", label: "Stornieren", icon: Ban, variant: "danger", requiresReason: true, reasonPlaceholder: "Grund für Stornierung..." },
    ],
  },
  genehmigt: {
    primary: [
      { targetStatus: "ibn", label: "IBN-Protokoll erstellt", icon: ClipboardCheck, variant: "primary", isPrimary: true },
    ],
    secondary: [
      { targetStatus: "rueckfrage", label: "Doch Rückfrage", icon: AlertTriangle, variant: "warning" },
      { targetStatus: "storniert", label: "Stornieren", icon: Ban, variant: "danger", requiresReason: true },
    ],
  },
  ibn: {
    primary: [
      { targetStatus: "fertig", label: "Abgeschlossen", icon: CheckCircle, variant: "success", isPrimary: true },
    ],
    secondary: [
      { targetStatus: "genehmigt", label: "Zurück zu Genehmigt", icon: RotateCcw, variant: "outline" },
    ],
  },
  fertig: {
    primary: [
      { targetStatus: "abgerechnet", label: "Abgerechnet", icon: Coins, variant: "success", isPrimary: true },
    ],
    secondary: [
      { targetStatus: "ibn", label: "Zurück zu IBN", icon: RotateCcw, variant: "outline" },
    ],
  },
  abgerechnet: {
    primary: [],
    secondary: [
      { targetStatus: "fertig", label: "Zurück zu Fertig", icon: RotateCcw, variant: "outline" },
    ],
  },
  storniert: {
    primary: [
      { targetStatus: "eingang", label: "Reaktivieren", icon: RotateCcw, variant: "primary", isPrimary: true },
    ],
    secondary: [],
  },
};

// Tabs - Anlage wurde in Übersicht integriert, Email ist dynamisch
type TabId = "overview" | "email" | "dokumente" | "kommunikation" | "chat" | "historie";

const BASE_TABS: { id: TabId; label: string; icon: typeof User; closable?: boolean }[] = [
  { id: "overview", label: "Übersicht", icon: Gauge },
  { id: "dokumente", label: "Dokumente", icon: FileText },
  { id: "kommunikation", label: "Kommunikation", icon: MessageSquare },
  { id: "chat", label: "Chat", icon: Users },
  { id: "historie", label: "Historie", icon: History },
];

// Email Tab wird dynamisch eingefügt wenn eine Email ausgewählt ist
const EMAIL_TAB = { id: "email" as TabId, label: "Email", icon: Mail, closable: true };

// Copy to clipboard helper
function useCopyToClipboard() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return { copiedField, copy };
}

// CopyButton component
function CopyButton({ text, field, copiedField, onCopy }: {
  text: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const isCopied = copiedField === field;
  return (
    <button
      className="dm-copy-btn"
      onClick={() => onCopy(text, field)}
      title="Kopieren"
    >
      {isCopied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// Workflow Timeline Component - IMPROVED with icons and dates
function WorkflowTimeline({ currentStep, status, data }: {
  currentStep: number;
  status: string;
  data?: Installation;
}) {
  const steps = [
    { label: "Eingang", key: "eingang", icon: FileText, dateField: "createdAt" },
    { label: "Beim NB", key: "beim-nb", icon: Send, dateField: "nbEingereichtAm" },
    { label: "Genehmigt", key: "genehmigt", icon: CheckCircle, dateField: "nbGenehmigungAm" },
    { label: "IBN", key: "ibn", icon: ClipboardCheck, dateField: null },
    { label: "Fertig", key: "fertig", icon: Check, dateField: "completedAt" },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="dm-timeline dm-timeline--enhanced">
      {/* Progress Bar */}
      <div className="dm-timeline__progress">
        <div
          className="dm-timeline__progress-fill"
          style={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 100)}%` }}
        />
      </div>

      {/* Steps */}
      <div className="dm-timeline__track">
        {steps.map((step, i) => {
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          const isWarning = status === "rueckfrage" && i === 1;
          const StepIcon = step.icon;
          const dateValue = step.dateField && data ? (data as any)[step.dateField] : null;

          return (
            <div key={step.key} className={`dm-timeline__step ${isActive ? "dm-timeline__step--active" : ""}`}>
              <div
                className={`dm-timeline__dot dm-timeline__dot--large ${isActive ? "dm-timeline__dot--active" : ""} ${isCurrent ? "dm-timeline__dot--current" : ""} ${isWarning ? "dm-timeline__dot--warning" : ""}`}
              >
                <StepIcon size={16} />
              </div>
              <span className={`dm-timeline__label ${isActive ? "dm-timeline__label--active" : ""}`}>
                {step.label}
              </span>
              {dateValue && (
                <span className="dm-timeline__date">{formatDate(dateValue)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Smart Status Section - kontextabhängige Status-Änderung
function SmartStatusSection({
  data,
  onStatusChange,
  permissions
}: {
  data: Installation;
  onStatusChange: (status: string, reason?: string) => Promise<void>;
  permissions: Permissions;
}) {
  const [isChanging, setIsChanging] = useState(false);
  const [activeAction, setActiveAction] = useState<StatusAction | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);

  const statusConfig = STATUS_CONFIG[data.status] || { label: data.status, color: "#64748b", step: 0 };
  const rawTransitions = STATUS_TRANSITIONS[data.status] || { primary: [], secondary: [] };

  // 🔒 Filter transitions based on permissions
  const filterActions = (actions: StatusAction[]) =>
    actions.filter((action) => {
      const check = canTransitionToStatus(permissions, action.targetStatus);
      return check.allowed;
    });

  const transitions = {
    primary: filterActions(rawTransitions.primary),
    secondary: filterActions(rawTransitions.secondary),
  };
  const needsAction = data.daysAtNb && data.daysAtNb > 14;

  const handleActionClick = async (action: StatusAction) => {
    if (action.requiresReason) {
      setActiveAction(action);
      setShowReasonInput(true);
      return;
    }

    setIsChanging(true);
    try {
      await onStatusChange(action.targetStatus);
    } finally {
      setIsChanging(false);
    }
  };

  const handleConfirmWithReason = async () => {
    if (!activeAction) return;

    setIsChanging(true);
    try {
      await onStatusChange(activeAction.targetStatus, reason);
    } finally {
      setIsChanging(false);
      setShowReasonInput(false);
      setActiveAction(null);
      setReason("");
    }
  };

  const getButtonClass = (variant: string) => {
    const base = "dm-btn dm-btn--sm";
    switch (variant) {
      case "success": return `${base} dm-btn--success`;
      case "warning": return `${base} dm-btn--warning`;
      case "danger": return `${base} dm-btn--danger`;
      case "outline": return `${base} dm-btn--outline`;
      default: return `${base} dm-btn--primary`;
    }
  };

  return (
    <div className="dm-status-section">
      {/* Current Status Badge */}
      <div className="dm-status-current">
        <span className="dm-status-current__label">Status:</span>
        <span
          className="dm-status-current__badge"
          style={{ background: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
        {data.daysAtNb !== undefined && data.daysAtNb > 0 && (
          <span className={`dm-status-current__days ${needsAction ? 'dm-status-current__days--warning' : ''}`}>
            <Clock size={12} />
            {data.daysAtNb} Tage
            {needsAction && <AlertTriangle size={12} />}
          </span>
        )}
      </div>

      {/* Reason Input Modal */}
      {showReasonInput && activeAction && (
        <div className="dm-status-reason">
          <div className="dm-status-reason__header">
            <activeAction.icon size={16} />
            <span>{activeAction.label}</span>
          </div>
          <textarea
            className="dm-status-reason__input"
            placeholder={activeAction.reasonPlaceholder || "Grund eingeben..."}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            autoFocus
          />
          <div className="dm-status-reason__actions">
            <button
              className="dm-btn dm-btn--outline dm-btn--sm"
              onClick={() => { setShowReasonInput(false); setActiveAction(null); setReason(""); }}
            >
              Abbrechen
            </button>
            <button
              className={getButtonClass(activeAction.variant)}
              onClick={handleConfirmWithReason}
              disabled={isChanging}
            >
              {isChanging ? <Loader2 size={14} className="dm-loading__spinner" /> : <Check size={14} />}
              Bestätigen
            </button>
          </div>
        </div>
      )}

      {/* Primary Actions */}
      {!showReasonInput && transitions.primary.length > 0 && (
        <div className="dm-status-actions dm-status-actions--primary">
          <span className="dm-status-actions__label">Nächster Schritt:</span>
          <div className="dm-status-actions__buttons">
            {transitions.primary.map((action) => (
              <button
                key={action.targetStatus}
                className={`${getButtonClass(action.variant)} ${action.isPrimary ? 'dm-btn--large' : ''}`}
                onClick={() => handleActionClick(action)}
                disabled={isChanging}
              >
                {isChanging ? <Loader2 size={14} className="dm-loading__spinner" /> : <action.icon size={14} />}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      {!showReasonInput && transitions.secondary.length > 0 && (
        <div className="dm-status-actions dm-status-actions--secondary">
          <span className="dm-status-actions__label">Weitere Aktionen:</span>
          <div className="dm-status-actions__buttons">
            {transitions.secondary.map((action) => (
              <button
                key={action.targetStatus}
                className={getButtonClass(action.variant)}
                onClick={() => handleActionClick(action)}
                disabled={isChanging}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tab: Overview
function TabOverview({ data, onStatusChange, onCreateInvoice, onNbTrackingUpdate, showToast, onShowAllComments, permissions }: {
  data: Installation;
  onStatusChange: (status: string, reason?: string) => Promise<void>;
  onCreateInvoice: () => void;
  onNbTrackingUpdate: (updates: { nbVorgangsnummer?: string; nbPortalUrl?: string }) => Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  onShowAllComments: () => void;
  permissions: Permissions;
}) {
  const { copiedField, copy } = useCopyToClipboard();
  const [nbVorgangsnummer, setNbVorgangsnummer] = useState(data.nbCaseNumber || "");
  const [isEditingNb, setIsEditingNb] = useState(false);
  const [isSavingNb, setIsSavingNb] = useState(false);
  const statusConfig = STATUS_CONFIG[data.status] || { label: data.status, color: "#64748b", step: 0 };
  const address = [data.strasse, data.hausNr].filter(Boolean).join(" ");
  const cityLine = [data.plz, data.ort].filter(Boolean).join(" ");

  const needsAction = data.daysAtNb && data.daysAtNb > 14;

  // Save NB Vorgangsnummer
  const handleSaveNbVorgangsnummer = async () => {
    setIsSavingNb(true);
    try {
      await onNbTrackingUpdate({ nbVorgangsnummer });
      setIsEditingNb(false);
    } catch (error) {
      console.error("Failed to save NB-Vorgangsnummer:", error);
    } finally {
      setIsSavingNb(false);
    }
  };

  return (
    <div className="dm-tab-content">
      {/* Workflow Timeline - ENHANCED */}
      <div className="dm-section">
        <h3 className="dm-section__title">Workflow</h3>
        <WorkflowTimeline currentStep={statusConfig.step} status={data.status} data={data} />

        {/* Action Warning */}
        {needsAction && (
          <div className="dm-action-warning">
            <AlertTriangle size={16} />
            <span>Keine Aktivität seit {data.daysAtNb} Tagen!</span>
          </div>
        )}

        {/* Smart Status Section */}
        <SmartStatusSection data={data} onStatusChange={onStatusChange} permissions={permissions} />

        {/* KI-Schnellaktionen bei Rückfrage */}
        {data.status === "rueckfrage" && (
          <AIQuickActions
            installationId={data.id}
            rueckfrageText=""
            onAction={(actionType, actionData) => {
              console.log("KI-Aktion:", actionType, actionData);
              showToast(`Aktion "${actionType}" ausgeführt`, "success");
            }}
            className="dm-ai-quick-actions"
          />
        )}
      </div>

      {/* Two Column Layout */}
      <div className="dm-grid dm-grid--2">
        {/* Customer Card - ENHANCED */}
        <div className="dm-card dm-card--glass">
          <div className="dm-card__header dm-card__header--gradient">
            <User size={16} />
            <span>Kunde</span>
            {data.customerType && (
              <span className="dm-badge dm-badge--header">{data.customerType === 'privat' ? 'Privat' : 'Gewerbe'}</span>
            )}
          </div>
          <div className="dm-card__content">
            <div className="dm-customer-info">
              {data.salutation && <span className="dm-salutation">{data.salutation === 'MS' ? 'Frau' : data.salutation === 'MR' ? 'Herr' : ''}</span>}
              <div className="dm-customer-name">{data.customerName}</div>
            </div>

            {/* Geburtsdatum - NEU */}
            {data.birthDate && (
              <div className="dm-field dm-field--highlight">
                <Calendar size={14} />
                <span className="dm-field__label">Geb.:</span>
                <span>{new Date(data.birthDate).toLocaleDateString("de-DE")}</span>
              </div>
            )}

            {address && (
              <div className="dm-field">
                <MapPin size={14} />
                <span>{address}, {cityLine}</span>
                <CopyButton text={`${address}, ${cityLine}`} field="address" copiedField={copiedField} onCopy={copy} />
              </div>
            )}

            {/* Flurstück - NEU */}
            {data.parcelNumber && (
              <div className="dm-field">
                <FileText size={14} />
                <span className="dm-field__label">Flurstück:</span>
                <span className="dm-field__value">{data.parcelNumber}</span>
              </div>
            )}

            <div className="dm-field-divider" />

            {data.contactPhone && (
              <div className="dm-field">
                <Phone size={14} />
                <span>{data.contactPhone}</span>
                <CopyButton text={data.contactPhone} field="phone" copiedField={copiedField} onCopy={copy} />
                <a href={`tel:${data.contactPhone}`} className="dm-icon-btn dm-icon-btn--call" title="Anrufen">
                  <PhoneIcon size={12} />
                </a>
              </div>
            )}

            {data.mobilePhone && (
              <div className="dm-field">
                <Phone size={14} />
                <span>{data.mobilePhone}</span>
                <span className="dm-field__tag">Mobil</span>
              </div>
            )}

            {data.contactEmail && (
              <div className="dm-field">
                <Mail size={14} />
                <span>{data.contactEmail}</span>
                <CopyButton text={data.contactEmail} field="email" copiedField={copiedField} onCopy={copy} />
              </div>
            )}

            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${cityLine}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dm-btn dm-btn--outline dm-btn--sm dm-btn--full"
              >
                <MapPinned size={14} /> Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Grid Operator Card */}
        <div className="dm-card">
          <div className="dm-card__header">
            <Building2 size={16} />
            <span>Netzbetreiber</span>
          </div>
          <div className="dm-card__content">
            <div className="dm-nb-name">{data.gridOperator || "Nicht zugewiesen"}</div>

            {/* Editable Vorgangsnummer */}
            <div className="dm-field dm-field--editable">
              <span className="dm-field__label">Vorgangsnr:</span>
              {isEditingNb && permissions.canEditNbVorgangsnummer ? (
                <div className="dm-input-group">
                  <input
                    type="text"
                    className="dm-input"
                    value={nbVorgangsnummer}
                    onChange={(e) => setNbVorgangsnummer(e.target.value)}
                    placeholder="z.B. 1049120071159067"
                    autoFocus
                  />
                  <button
                    className="dm-btn dm-btn--primary dm-btn--xs"
                    onClick={handleSaveNbVorgangsnummer}
                    disabled={isSavingNb}
                  >
                    {isSavingNb ? <Loader2 size={12} className="dm-loading__spinner" /> : <Check size={12} />}
                  </button>
                  <button
                    className="dm-btn dm-btn--outline dm-btn--xs"
                    onClick={() => {
                      setNbVorgangsnummer(data.nbCaseNumber || "");
                      setIsEditingNb(false);
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="dm-field__value">{data.nbCaseNumber || "—"}</span>
                  {data.nbCaseNumber && (
                    <CopyButton text={data.nbCaseNumber} field="nbCase" copiedField={copiedField} onCopy={copy} />
                  )}
                  {permissions.canEditNbVorgangsnummer && (
                    <button className="dm-icon-btn dm-icon-btn--edit" onClick={() => setIsEditingNb(true)} title="Bearbeiten">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {data.nbEingereichtAm && (
              <div className="dm-field">
                <Calendar size={14} />
                <span>Eingereicht: {new Date(data.nbEingereichtAm).toLocaleDateString("de-DE")}</span>
              </div>
            )}

            {data.daysAtNb !== undefined && data.daysAtNb !== null && (
              <div className={`dm-field ${data.daysAtNb > 14 ? "dm-field--warning" : ""}`}>
                <Clock size={14} />
                <span>Wartezeit: {data.daysAtNb} Tage</span>
                {data.daysAtNb > 14 && <AlertTriangle size={14} className="dm-warning-icon" />}
              </div>
            )}

            {data.zaehlernummer && (
              <div className="dm-field">
                <span className="dm-field__label">Zähler:</span>
                <span className="dm-field__value">{data.zaehlernummer}</span>
                <CopyButton text={data.zaehlernummer} field="zaehler" copiedField={copiedField} onCopy={copy} />
              </div>
            )}

            {/* NB-Portal Buttons */}
            <div className="dm-nb-portal-links">
              {data.gridOperatorPortalUrl && (
                <a
                  href={data.gridOperatorPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dm-btn dm-btn--primary dm-btn--sm"
                >
                  <ExternalLink size={14} /> NB-Portal öffnen
                </a>
              )}
              {data.nbPortalUrl && data.nbPortalUrl !== data.gridOperatorPortalUrl && (
                <a
                  href={data.nbPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dm-btn dm-btn--outline dm-btn--sm"
                >
                  <ExternalLink size={14} /> Vorgang öffnen
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Quick View */}
      <div className="dm-section">
        <h3 className="dm-section__title">Anlage</h3>
        <div className="dm-system-grid">
          <div className={`dm-system-card ${data.totalKwp ? "dm-system-card--active" : ""}`}>
            <Sun size={24} className="dm-system-card__icon dm-system-card__icon--pv" />
            <div className="dm-system-card__value">{data.totalKwp?.toFixed(1) || "-"}</div>
            <div className="dm-system-card__unit">kWp</div>
            <div className="dm-system-card__label">PV</div>
          </div>
          <div className={`dm-system-card ${data.speicherKwh ? "dm-system-card--active" : ""}`}>
            <Battery size={24} className="dm-system-card__icon dm-system-card__icon--battery" />
            <div className="dm-system-card__value">{data.speicherKwh?.toFixed(1) || "-"}</div>
            <div className="dm-system-card__unit">kWh</div>
            <div className="dm-system-card__label">Speicher</div>
          </div>
          <div className={`dm-system-card ${data.wallboxKw ? "dm-system-card--active" : ""}`}>
            <Car size={24} className="dm-system-card__icon dm-system-card__icon--wallbox" />
            <div className="dm-system-card__value">{data.wallboxKw?.toFixed(1) || "-"}</div>
            <div className="dm-system-card__unit">kW</div>
            <div className="dm-system-card__label">Wallbox</div>
          </div>
          <div className={`dm-system-card ${data.waermepumpeKw ? "dm-system-card--active" : ""}`}>
            <Thermometer size={24} className="dm-system-card__icon dm-system-card__icon--heatpump" />
            <div className="dm-system-card__value">{data.waermepumpeKw?.toFixed(1) || "-"}</div>
            <div className="dm-system-card__unit">kW</div>
            <div className="dm-system-card__label">Wärmepumpe</div>
          </div>
        </div>
      </div>

      {/* Billing - nur für Admin sichtbar */}
      {permissions.canMarkAsAbgerechnet && (
        <div className="dm-section">
          <h3 className="dm-section__title">Abrechnung</h3>
          <div className="dm-billing">
            {data.isBilled ? (
              <div className="dm-billing__status dm-billing__status--done">
                <CheckCircle size={16} />
                <span>Abgerechnet</span>
              </div>
            ) : (
              <>
                <div className="dm-billing__status dm-billing__status--pending">
                  <AlertTriangle size={16} />
                  <span>Nicht abgerechnet</span>
                </div>
                <button className="dm-btn dm-btn--gold" onClick={onCreateInvoice}>
                  <Receipt size={14} /> Rechnung erstellen
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Comments Preview */}
      <div className="dm-section">
        <CommentsPreview
          installationId={data.id}
          showToast={showToast}
          onShowAll={onShowAllComments}
          maxComments={3}
          permissions={permissions}
        />
      </div>
    </div>
  );
}

// Tab: Anlage (Technical Details)
function TabAnlage({ data }: { data: Installation }) {
  const td = data.technicalDetails;

  // Calculate inverter power from technical details
  const wechselrichterKw = td?.wechselrichter?.reduce((sum: number, wr: any) => {
    return sum + (Number(wr.leistungKw) || 0);
  }, 0) || 0;

  return (
    <div className="dm-tab-content">
      {/* SENEC-Style Visualisierung */}
      <div className="dm-section">
        <h3 className="dm-section__title">
          <Zap size={16} /> Anlagen-Übersicht
        </h3>
        <EnergyDashboard
          totalKwp={data.totalKwp}
          speicherKwh={data.speicherKwh}
          wallboxKw={data.wallboxKw}
          waermepumpeKw={data.waermepumpeKw}
          wechselrichterKw={wechselrichterKw}
          messkonzept={data.messkonzept}
          moduleCount={td?.dachflaechen?.reduce((sum: number, d: any) => sum + (d.modulAnzahl || 0), 0)}
          moduleManufacturer={td?.dachflaechen?.[0]?.modulHersteller}
          moduleModel={td?.dachflaechen?.[0]?.modulModell}
          inverterManufacturer={td?.wechselrichter?.[0]?.hersteller}
          inverterModel={td?.wechselrichter?.[0]?.modell}
          batteryManufacturer={td?.speicher?.[0]?.hersteller}
          batteryModel={td?.speicher?.[0]?.modell}
          wallboxManufacturer={td?.wallboxen?.[0]?.hersteller}
          wallboxModel={td?.wallboxen?.[0]?.modell}
        />
      </div>

      {/* Messkonzept */}
      {data.messkonzept && (
        <div className="dm-messkonzept">
          <Gauge size={16} />
          <span>Messkonzept:</span>
          <strong>{data.messkonzept.toUpperCase()}</strong>
        </div>
      )}

      {/* PV System */}
      <div className="dm-section">
        <h3 className="dm-section__title"><Sun size={16} /> PV-Anlage</h3>

        {td?.dachflaechen && td.dachflaechen.length > 0 ? (
          td.dachflaechen.map((dach: any, i: number) => (
            <div key={i} className="dm-tech-card">
              <div className="dm-tech-card__header">Dachfläche {i + 1}</div>
              <div className="dm-tech-card__content">
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Module:</span>
                  <span className="dm-tech-row__value">{dach.modulHersteller} {dach.modulModell}</span>
                </div>
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Anzahl:</span>
                  <span className="dm-tech-row__value">{dach.modulAnzahl} Stück</span>
                </div>
                {dach.modulLeistungWp && (
                  <div className="dm-tech-row">
                    <span className="dm-tech-row__label">Modulleistung:</span>
                    <span className="dm-tech-row__value">{dach.modulLeistungWp} Wp</span>
                  </div>
                )}
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Gesamtleistung:</span>
                  <span className="dm-tech-row__value dm-tech-row__value--highlight">
                    {((dach.modulAnzahl || 0) * (dach.modulLeistungWp || 0) / 1000).toFixed(2)} kWp
                  </span>
                </div>
                {dach.ausrichtung && (
                  <div className="dm-tech-row">
                    <span className="dm-tech-row__label">Ausrichtung:</span>
                    <span className="dm-tech-row__value">{dach.ausrichtung}</span>
                  </div>
                )}
                {dach.neigung !== undefined && (
                  <div className="dm-tech-row">
                    <span className="dm-tech-row__label">Neigung:</span>
                    <span className="dm-tech-row__value">{dach.neigung}°</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="dm-empty">Keine PV-Daten vorhanden</div>
        )}

        {/* Wechselrichter */}
        {td?.wechselrichter && td.wechselrichter.length > 0 && (
          <>
            <h4 className="dm-subsection__title"><Plug size={14} /> Wechselrichter</h4>
            {td.wechselrichter.map((wr: any, i: number) => (
              <div key={i} className="dm-tech-card dm-tech-card--small">
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Hersteller:</span>
                  <span className="dm-tech-row__value">{wr.hersteller}</span>
                </div>
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Modell:</span>
                  <span className="dm-tech-row__value">{wr.modell}</span>
                </div>
                {wr.leistungKw && (
                  <div className="dm-tech-row">
                    <span className="dm-tech-row__label">Leistung:</span>
                    <span className="dm-tech-row__value">{wr.leistungKw} kW</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Battery Storage */}
      <div className="dm-section">
        <h3 className="dm-section__title"><Battery size={16} /> Speicher</h3>
        {td?.speicher && td.speicher.length > 0 ? (
          td.speicher.map((sp: any, i: number) => (
            <div key={i} className="dm-tech-card">
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Hersteller:</span>
                <span className="dm-tech-row__value">{sp.hersteller}</span>
              </div>
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Modell:</span>
                <span className="dm-tech-row__value">{sp.modell}</span>
              </div>
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Kapazität:</span>
                <span className="dm-tech-row__value dm-tech-row__value--highlight">{sp.kapazitaetKwh} kWh</span>
              </div>
              {sp.kopplung && (
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Kopplung:</span>
                  <span className="dm-tech-row__value">{sp.kopplung.toUpperCase()}-gekoppelt</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="dm-empty">Kein Speicher vorhanden</div>
        )}
      </div>

      {/* Wallbox */}
      <div className="dm-section">
        <h3 className="dm-section__title"><Car size={16} /> Wallbox</h3>
        {td?.wallboxen && td.wallboxen.length > 0 ? (
          td.wallboxen.map((wb: any, i: number) => (
            <div key={i} className="dm-tech-card">
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Hersteller:</span>
                <span className="dm-tech-row__value">{wb.hersteller}</span>
              </div>
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Modell:</span>
                <span className="dm-tech-row__value">{wb.modell}</span>
              </div>
              {wb.leistungKw && (
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Leistung:</span>
                  <span className="dm-tech-row__value dm-tech-row__value--highlight">{wb.leistungKw} kW</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="dm-empty">Keine Wallbox vorhanden</div>
        )}
      </div>

      {/* Heat Pump */}
      <div className="dm-section">
        <h3 className="dm-section__title"><Thermometer size={16} /> Wärmepumpe</h3>
        {td?.waermepumpen && td.waermepumpen.length > 0 ? (
          td.waermepumpen.map((wp: any, i: number) => (
            <div key={i} className="dm-tech-card">
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Hersteller:</span>
                <span className="dm-tech-row__value">{wp.hersteller}</span>
              </div>
              <div className="dm-tech-row">
                <span className="dm-tech-row__label">Modell:</span>
                <span className="dm-tech-row__value">{wp.modell}</span>
              </div>
              {wp.leistungKw && (
                <div className="dm-tech-row">
                  <span className="dm-tech-row__label">Leistung:</span>
                  <span className="dm-tech-row__value dm-tech-row__value--highlight">{wp.leistungKw} kW</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="dm-empty">Keine Wärmepumpe vorhanden</div>
        )}
      </div>
    </div>
  );
}

// Document Categories Configuration
const DOC_CATEGORIES = [
  { id: "LAGEPLAN", label: "Lageplan", icon: MapPin, color: "#3b82f6", required: true },
  { id: "SCHALTPLAN", label: "Schaltplan", icon: FileText, color: "#EAD068", required: true },
  { id: "DATENBLATT", label: "Datenblätter", icon: FileCheck, color: "#06b6d4", required: true },
  { id: "ANTRAG", label: "Anträge/VDE", icon: ClipboardCheck, color: "#10b981", required: true },
  { id: "FOTOS_AC", label: "Fotos AC", icon: Camera, color: "#ec4899", required: false },
  { id: "FOTOS_DC", label: "Fotos DC", icon: Camera, color: "#EAD068", required: false },
  { id: "KORRESPONDENZ", label: "Korrespondenz", icon: Mail, color: "#06b6d4", required: false },
  { id: "RECHNUNG", label: "Rechnungen", icon: Receipt, color: "#ef4444", required: false },
  { id: "SONSTIGE", label: "Sonstige", icon: FileText, color: "#71717a", required: false },
];

// Pflicht-Gruppen: Für Completeness zählt jede Kategorie in einer Gruppe
const REQUIRED_GROUPS = [
  { label: "Lageplan", ids: ["LAGEPLAN"] },
  { label: "Schaltplan", ids: ["SCHALTPLAN"] },
  { label: "Datenblätter", ids: ["DATENBLATT"] },
  { label: "Anträge / VDE", ids: ["ANTRAG"] },
];

// 🔥 Foto-Kategorien aus dem Wizard (für Anzeige im Dokumente-Tab)
const PHOTO_CATEGORIES = [
  { id: "zaehlerschrank", label: "Zählerschrank", icon: "📊", color: "#3b82f6" },
  { id: "zaehler_nahaufnahme", label: "Zähler Nahaufnahme", icon: "🔍", color: "#D4A843" },
  { id: "wechselrichter", label: "Wechselrichter", icon: "⚡", color: "#f59e0b" },
  { id: "speicher", label: "Speicher", icon: "🔋", color: "#22c55e" },
  { id: "pv_module", label: "PV-Module", icon: "☀️", color: "#eab308" },
  { id: "dachansicht", label: "Dachansicht", icon: "🏠", color: "#EAD068" },
  { id: "stringverkabelung", label: "Stringverkabelung", icon: "🔌", color: "#ec4899" },
  { id: "potentialausgleich", label: "Potentialausgleich", icon: "⚡", color: "#14b8a6" },
  { id: "dc_freischalter", label: "DC-Freischalter", icon: "🔴", color: "#ef4444" },
  { id: "ac_freischalter", label: "AC-Freischalter", icon: "🟢", color: "#22c55e" },
  { id: "na_schutz", label: "NA-Schutz", icon: "🛡️", color: "#D4A843" },
  { id: "typenschild_modul", label: "Typenschild Modul", icon: "🏷️", color: "#71717a" },
  { id: "typenschild_wr", label: "Typenschild WR", icon: "🏷️", color: "#71717a" },
  { id: "typenschild_speicher", label: "Typenschild Speicher", icon: "🏷️", color: "#71717a" },
  { id: "sonstiges", label: "Sonstige Fotos", icon: "📷", color: "#71717a" },
];

// Helper: Parse wizard context for photos
function parseWizardPhotos(wizardContext?: string | object): { category: string; filename: string; url: string; uploadedAt?: string }[] {
  if (!wizardContext) return [];
  try {
    // Backend gibt bereits geparsten JSON zurück (Objekt), kein String
    const wc = typeof wizardContext === 'object' ? wizardContext : JSON.parse(wizardContext);
    // V19 Format: photos Array direkt
    if (wc.photos && Array.isArray(wc.photos)) {
      return wc.photos;
    }
    // Step7 Format: step7.fotos
    if (wc.step7?.fotos && Array.isArray(wc.step7.fotos)) {
      return wc.step7.fotos.map((f: any) => ({
        category: f.kategorie || f.category || 'sonstiges',
        filename: f.filename || f.name,
        url: f.url,
        uploadedAt: f.uploadedAt,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper: Get file icon
function getFileIcon(mimeType?: string): string {
  if (!mimeType) return "📁";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  return "📁";
}

// Tab: Documents - Redesigned with completeness banner + clean list
function TabDokumente({ data, permissions }: { data: Installation; permissions: Permissions }) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Upload handler
  const handleUpload = async (categoryId: string, file: File) => {
    if (!file) return;
    setUploading(categoryId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("installationId", String(data.id));
    formData.append("dokumentTyp", categoryId.toLowerCase());
    formData.append("kategorie", categoryId);
    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST", credentials: "include", body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload fehlgeschlagen");
      }
      queryClient.invalidateQueries({ queryKey: ["installation-detail", data.id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      alert("Upload fehlgeschlagen: " + msg);
    } finally {
      setUploading(null);
    }
  };

  const triggerUpload = (categoryId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(categoryId, file);
    };
    input.click();
  };

  // Group documents by category
  const docsByCategory: Record<string, Document[]> = {};
  DOC_CATEGORIES.forEach(cat => { docsByCategory[cat.id] = []; });
  data.documents?.forEach(doc => {
    const cat = doc.kategorie || "SONSTIGE";
    if (!docsByCategory[cat]) docsByCategory[cat] = [];
    docsByCategory[cat].push(doc);
  });

  // Completeness (group-based, same as DokumentenCenterPage)
  const fulfilledGroups = REQUIRED_GROUPS.filter(group =>
    group.ids.some(id => (docsByCategory[id]?.length || 0) > 0)
  );
  const allComplete = fulfilledGroups.length === REQUIRED_GROUPS.length;
  const pct = Math.round((fulfilledGroups.length / REQUIRED_GROUPS.length) * 100);

  // Search filter
  const lowerSearch = searchTerm.toLowerCase();

  // Delete handler
  const handleDelete = async (docId: number) => {
    if (!confirm("Dokument wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      queryClient.invalidateQueries({ queryKey: ["installation-detail", data.id] });
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const totalDocs = data.documents?.length || 0;

  return (
    <div className="dm-tab-content">
      {/* Completeness Banner */}
      <div className="dm-docs-completeness" style={{
        background: allComplete
          ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))'
          : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
        border: `1px solid ${allComplete ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        borderRadius: 12, padding: '14px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: allComplete ? '#22c55e' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
            {allComplete ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            Pflichtdokumente {fulfilledGroups.length}/{REQUIRED_GROUPS.length}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{totalDocs} Datei{totalDocs !== 1 ? 'en' : ''} gesamt</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 3, transition: 'width 0.3s ease',
            background: allComplete ? '#22c55e' : 'linear-gradient(90deg, #f59e0b, #eab308)',
          }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
          {REQUIRED_GROUPS.map(g => {
            const ok = g.ids.some(id => (docsByCategory[id]?.length || 0) > 0);
            return (
              <span key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: ok ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                {ok ? <CheckCircle size={12} /> : <Circle size={12} style={{ opacity: 0.5 }} />}
                <span style={{ fontWeight: ok ? 500 : 400 }}>{g.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Search + Upload Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Dokument suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px', fontSize: 13,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#fff', outline: 'none',
            }}
          />
          <Eye size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
        </div>
        <button
          className="dm-btn dm-btn--primary dm-btn--sm"
          onClick={() => triggerUpload("SONSTIGE")}
          disabled={!!uploading}
        >
          <Upload size={14} /> Hochladen
        </button>
      </div>

      {/* Category Sections - 2 Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {DOC_CATEGORIES.map(cat => {
        const CatIcon = cat.icon;
        let docs = docsByCategory[cat.id] || [];

        // Apply search filter
        if (lowerSearch) {
          docs = docs.filter(d => d.originalName.toLowerCase().includes(lowerSearch));
          if (docs.length === 0) return null;
        }

        const isRequired = cat.required;
        const hasDocuments = docs.length > 0;

        return (
          <div key={cat.id} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${isRequired && !hasDocuments ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            {/* Category Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: hasDocuments ? '1px solid rgba(255,255,255,0.05)' : 'none',
              borderLeft: `3px solid ${cat.color}`,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${cat.color}18`, color: cat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <CatIcon size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                  {docs.length} Datei{docs.length !== 1 ? 'en' : ''}
                  {isRequired && <span style={{ marginLeft: 6, color: hasDocuments ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    {hasDocuments ? '— Pflicht erfüllt' : '— Pflicht fehlt!'}
                  </span>}
                </div>
              </div>
              {isRequired && (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: hasDocuments ? '#22c55e' : '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasDocuments ? <Check size={13} color="#fff" /> : <AlertTriangle size={12} color="#fff" />}
                </div>
              )}
              <button
                onClick={() => triggerUpload(cat.id)}
                disabled={uploading === cat.id}
                style={{
                  padding: '5px 10px', fontSize: 11, fontWeight: 500,
                  background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                  border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {uploading === cat.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading === cat.id ? 'Lädt...' : 'Upload'}
              </button>
            </div>

            {/* Files */}
            {hasDocuments && (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {docs.map(doc => {
                  const docUrl = doc.url || `/api/documents/${doc.id}/download`;
                  return (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px 8px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{getFileIcon(doc.dateiname)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }} title={doc.originalName}>
                          {doc.originalName}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                          {new Date(doc.createdAt).toLocaleDateString("de-DE")}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button className="dm-doc-file__btn" onClick={() => setPreviewDoc({ ...doc, url: docUrl })} title="Vorschau">
                          <Eye size={13} />
                        </button>
                        <a href={docUrl} download={doc.originalName} className="dm-doc-file__btn" title="Download">
                          <Download size={13} />
                        </a>
                        {permissions.canDeleteDocuments && (
                          <button className="dm-doc-file__btn dm-doc-file__btn--delete" onClick={() => handleDelete(doc.id)} title="Löschen">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state for required categories */}
            {!hasDocuments && isRequired && (
              <div style={{
                padding: '16px 18px', textAlign: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 12,
              }}>
                Noch keine Dateien — bitte hochladen
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* Wizard Photos */}
      <WizardPhotosSection wizardContext={data.wizardContext} />

      {/* Preview Modal */}
      {previewDoc && (
        <div className="dm-preview-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="dm-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-preview-header">
              <span className="dm-preview-title">{previewDoc.originalName}</span>
              <button className="dm-preview-close" onClick={() => setPreviewDoc(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="dm-preview-content">
              {previewDoc.dateiname?.toLowerCase().includes(".pdf") || previewDoc.url?.includes("pdf") ? (
                <iframe src={`${previewDoc.url}?view=true`} className="dm-preview-iframe" title={previewDoc.originalName} />
              ) : previewDoc.dateiname?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={`${previewDoc.url}?view=true`} alt={previewDoc.originalName} className="dm-preview-image" />
              ) : (
                <div className="dm-preview-unsupported">
                  <FileText size={48} />
                  <span>Vorschau nicht verfügbar</span>
                  <a href={previewDoc.url} download={previewDoc.originalName} className="dm-btn dm-btn--primary">
                    <Download size={14} /> Herunterladen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔥 Wizard Photos Section Component - Zeigt Fotos aus dem Wizard kategorisiert an
function WizardPhotosSection({ wizardContext }: { wizardContext?: string }) {
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; filename: string } | null>(null);

  const photos = parseWizardPhotos(wizardContext);

  if (photos.length === 0) return null;

  // Gruppiere Fotos nach Kategorie
  const photosByCategory: Record<string, typeof photos> = {};
  photos.forEach(photo => {
    const cat = photo.category || 'sonstiges';
    if (!photosByCategory[cat]) photosByCategory[cat] = [];
    photosByCategory[cat].push(photo);
  });

  // Alle Kategorien mit Fotos (auch unbekannte)
  const allCategoriesWithPhotos = Object.keys(photosByCategory);
  const knownCategories = PHOTO_CATEGORIES.filter(cat => photosByCategory[cat.id]?.length > 0);
  const unknownCategories = allCategoriesWithPhotos.filter(catId => !PHOTO_CATEGORIES.find(c => c.id === catId));

  return (
    <>
      {/* Fotos Header */}
      <div className="dm-doc-header" style={{ marginTop: '24px' }}>
        <div className="dm-doc-header__left">
          <h3 className="dm-section__title">📷 Wizard-Fotos</h3>
          <span className="dm-doc-count">{photos.length} Fotos hochgeladen</span>
        </div>
      </div>

      {/* Photo Categories Grid */}
      <div className="dm-doc-grid dm-photo-grid">
        {/* Bekannte Kategorien */}
        {knownCategories.map(cat => {
          const catPhotos = photosByCategory[cat.id] || [];

          return (
            <div key={cat.id} className="dm-doc-card dm-photo-card">
              {/* Category Header */}
              <div className="dm-doc-card__header" style={{ borderLeftColor: cat.color }}>
                <div className="dm-doc-card__icon" style={{ backgroundColor: `${cat.color}20`, color: cat.color, fontSize: '16px' }}>
                  {cat.icon}
                </div>
                <div className="dm-doc-card__title">
                  <span className="dm-doc-card__name">{cat.label}</span>
                  <span className="dm-doc-card__count">{catPhotos.length} Foto{catPhotos.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Photo List - Dateinamen anzeigen */}
              <div className="dm-photo-list">
                {catPhotos.map((photo, idx) => (
                  <div key={idx} className="dm-photo-item">
                    <div className="dm-photo-item__icon">
                      {photo.url && !photo.url.startsWith('blob:') ? (
                        <img src={photo.url} alt="" className="dm-photo-item__thumb" />
                      ) : (
                        <Camera size={16} />
                      )}
                    </div>
                    <div className="dm-photo-item__info">
                      <span className="dm-photo-item__name" title={photo.filename}>
                        {photo.filename || 'Unbenannt'}
                      </span>
                      {photo.uploadedAt && (
                        <span className="dm-photo-item__date">
                          {new Date(photo.uploadedAt).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                    {photo.url?.startsWith('blob:') && (
                      <span className="dm-photo-item__badge">Nicht hochgeladen</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Upload Date */}
              {catPhotos[0]?.uploadedAt && (
                <div className="dm-photo-date">
                  Hochgeladen: {new Date(catPhotos[0].uploadedAt).toLocaleDateString('de-DE')}
                </div>
              )}
            </div>
          );
        })}

        {/* Unbekannte Kategorien anzeigen */}
        {unknownCategories.map(catId => {
          const catPhotos = photosByCategory[catId] || [];
          return (
            <div key={catId} className="dm-doc-card dm-photo-card">
              <div className="dm-doc-card__header" style={{ borderLeftColor: '#71717a' }}>
                <div className="dm-doc-card__icon" style={{ backgroundColor: '#71717a20', color: '#71717a', fontSize: '16px' }}>
                  📷
                </div>
                <div className="dm-doc-card__title">
                  <span className="dm-doc-card__name">{catId}</span>
                  <span className="dm-doc-card__count">{catPhotos.length} Foto{catPhotos.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="dm-photo-list">
                {catPhotos.map((photo, idx) => (
                  <div key={idx} className="dm-photo-item">
                    <div className="dm-photo-item__icon">
                      <Camera size={16} />
                    </div>
                    <div className="dm-photo-item__info">
                      <span className="dm-photo-item__name" title={photo.filename}>
                        {photo.filename || 'Unbenannt'}
                      </span>
                      {photo.uploadedAt && (
                        <span className="dm-photo-item__date">
                          {new Date(photo.uploadedAt).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                    {photo.url?.startsWith('blob:') && (
                      <span className="dm-photo-item__badge">Nicht hochgeladen</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="dm-preview-overlay" onClick={() => setPreviewPhoto(null)}>
          <div className="dm-preview-modal dm-preview-modal--photo" onClick={(e) => e.stopPropagation()}>
            <div className="dm-preview-header">
              <span className="dm-preview-title">{previewPhoto.filename}</span>
              <button className="dm-preview-close" onClick={() => setPreviewPhoto(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="dm-preview-content">
              {previewPhoto.url && !previewPhoto.url.startsWith('blob:') ? (
                <img src={previewPhoto.url} alt={previewPhoto.filename} className="dm-preview-image" />
              ) : (
                <div className="dm-preview-unsupported">
                  <Camera size={48} />
                  <span>Foto-Vorschau nicht verfügbar</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    (Blob-URLs sind nur während der Session gültig)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Tab: Communication - Vollständige Email-Kommunikation & Alert-System
function TabKommunikation({
  data,
  showToast,
  onOpenEmail
}: {
  data: Installation;
  showToast: (msg: string, type: "success" | "error") => void;
  onOpenEmail?: (emailId: number) => void;
}) {
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<string>("");

  // WhatsApp State - Nachrichten gehen an den ERSTELLER, nicht an den Betreiber!
  const [waMessages, setWaMessages] = useState<any[]>([]);
  const [waTemplates, setWaTemplates] = useState<any[]>([]);
  const [waLoading, setWaLoading] = useState(true);
  const [waSending, setWaSending] = useState(false);
  const [waNewMessage, setWaNewMessage] = useState("");
  const [erstellerPhone, setErstellerPhone] = useState<string | null>(null);
  const [erstellerName, setErstellerName] = useState<string | null>(null);
  const hasPhone = !!erstellerPhone;

  // WhatsApp laden - holt Ersteller-Telefon aus whatsapp_user_links
  useEffect(() => {
    async function loadWhatsApp() {
      if (!data.id) return;
      setWaLoading(true);
      try {
        const [msgRes, tmplRes] = await Promise.all([
          fetch(`/api/whatsapp/betreiber/${data.id}/messages`, { credentials: "include" }),
          fetch("/api/whatsapp/betreiber/templates?triggerType=MANUAL", { credentials: "include" }),
        ]);
        if (msgRes.ok) {
          const msgJson = await msgRes.json();
          setWaMessages(msgJson.data?.messages || []);
          setErstellerPhone(msgJson.data?.erstellerPhone || null);
          setErstellerName(msgJson.data?.erstellerName || null);
        }
        if (tmplRes.ok) {
          const tmplJson = await tmplRes.json();
          setWaTemplates(tmplJson.data || []);
        }
      } catch (err) {
        console.error("WhatsApp load error:", err);
      } finally {
        setWaLoading(false);
      }
    }
    loadWhatsApp();
  }, [data.id]);

  // WhatsApp Nachricht senden
  const handleSendWhatsApp = async () => {
    if (!waNewMessage.trim() || waSending || !hasPhone) return;
    setWaSending(true);
    try {
      const res = await fetch(`/api/whatsapp/betreiber/${data.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: waNewMessage.trim() }),
      });
      if (res.ok) {
        setWaNewMessage("");
        // Reload messages
        const msgRes = await fetch(`/api/whatsapp/betreiber/${data.id}/messages`, { credentials: "include" });
        if (msgRes.ok) {
          const msgJson = await msgRes.json();
          setWaMessages(msgJson.data?.messages || []);
        }
        showToast("WhatsApp gesendet", "success");
      } else {
        showToast("Fehler beim Senden", "error");
      }
    } catch (err) {
      showToast("Netzwerkfehler", "error");
    } finally {
      setWaSending(false);
    }
  };

  // WhatsApp Template senden
  const handleSendWaTemplate = async (templateKey: string) => {
    if (waSending || !hasPhone) return;
    setWaSending(true);
    try {
      const res = await fetch(`/api/whatsapp/betreiber/${data.id}/messages/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ templateKey }),
      });
      if (res.ok) {
        const msgRes = await fetch(`/api/whatsapp/betreiber/${data.id}/messages`, { credentials: "include" });
        if (msgRes.ok) {
          const msgJson = await msgRes.json();
          setWaMessages(msgJson.data?.messages || []);
        }
        showToast("Template gesendet", "success");
      }
    } catch (err) {
      showToast("Fehler", "error");
    } finally {
      setWaSending(false);
    }
  };

  // E-Mail Vorlagen für KI-Generierung
  const EMAIL_TYPES = [
    { id: "rueckfrage_antwort", label: "Rückfrage beantworten", desc: "Antwort auf eine Netzbetreiber-Rückfrage" },
    { id: "status_update", label: "Status-Update", desc: "Kunde über aktuellen Stand informieren" },
    { id: "dokument_anfrage", label: "Dokumente anfordern", desc: "Fehlende Unterlagen beim Kunden anfordern" },
    { id: "genehmigung_info", label: "Genehmigung mitteilen", desc: "Kunde über erfolgte Genehmigung informieren" },
    { id: "termin_vereinbarung", label: "Terminvereinbarung", desc: "Termin für IBN oder Zählerwechsel" },
    { id: "freier_text", label: "Freier Text", desc: "KI-Unterstützung für eigenen Text" },
  ];

  // KI E-Mail generieren
  const handleGenerateAI = async () => {
    if (!selectedEmailType) {
      showToast("Bitte E-Mail-Typ auswählen", "error");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          installationId: data.id,
          emailType: selectedEmailType,
          context: {
            customerName: data.customerName,
            publicId: data.publicId,
            status: data.status,
            gridOperator: data.gridOperator,
            totalKwp: data.totalKwp,
            existingSubject: composeData.subject,
            existingBody: composeData.body,
          },
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setComposeData({
          to: result.to || composeData.to || data.contactEmail || "",
          subject: result.subject || composeData.subject,
          body: result.body || composeData.body,
        });
        showToast("E-Mail mit KI generiert", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "KI-Generierung fehlgeschlagen", "error");
      }
    } catch (err) {
      showToast("Netzwerkfehler bei KI-Generierung", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };
  const [alertsEnabled, setAlertsEnabled] = useState(data.alertsEnabled ?? true);
  const [isTogglingAlerts, setIsTogglingAlerts] = useState(false);
  const queryClient = useQueryClient();

  // Fetch emails for this installation
  useEffect(() => {
    async function loadEmails() {
      try {
        const res = await fetch(`/api/emails/installation/${data.id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setEmails(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
        }
      } catch (err) {
        console.error("Failed to load emails:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmails();
  }, [data.id]);

  // Toggle Alert System
  const handleToggleAlerts = async () => {
    setIsTogglingAlerts(true);
    try {
      const res = await fetch(`/api/installations/${data.id}/alerts-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !alertsEnabled }),
      });
      if (res.ok) {
        setAlertsEnabled(!alertsEnabled);
        showToast(`Benachrichtigungen ${!alertsEnabled ? "aktiviert" : "deaktiviert"}`, "success");
        queryClient.invalidateQueries({ queryKey: ["installation-detail", data.id] });
      } else {
        showToast("Fehler beim Ändern der Einstellung", "error");
      }
    } catch (err) {
      showToast("Netzwerkfehler", "error");
    } finally {
      setIsTogglingAlerts(false);
    }
  };

  // Send new email
  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      showToast("Bitte alle Felder ausfüllen", "error");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch(`/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          installationId: data.id,
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body,
        }),
      });
      if (res.ok) {
        showToast("E-Mail wurde versendet", "success");
        setShowComposeModal(false);
        setComposeData({ to: "", subject: "", body: "" });
        // Reload emails
        const emailRes = await fetch(`/api/emails/installation/${data.id}`, { credentials: "include" });
        if (emailRes.ok) {
          const json = await emailRes.json();
          setEmails(Array.isArray(json.data) ? json.data : []);
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Fehler beim Senden", "error");
      }
    } catch (err) {
      showToast("Netzwerkfehler beim Senden", "error");
    } finally {
      setIsSending(false);
    }
  };

  const emailAddress = `${data.publicId?.toLowerCase() || "unknown"}@baunity.de`;

  // Get badge type for email
  const getBadgeInfo = (aiType?: string) => {
    if (!aiType) return null;
    const t = aiType.toLowerCase();
    if (t.includes("rückfrage") || t.includes("rueckfrage")) return { label: "Rückfrage", color: "#ef4444" };
    if (t.includes("genehmigung") || t.includes("zusage")) return { label: "Genehmigung", color: "#22c55e" };
    if (t.includes("ablehnung")) return { label: "Ablehnung", color: "#ef4444" };
    if (t.includes("eingangsbestätigung")) return { label: "Bestätigung", color: "#3b82f6" };
    return { label: aiType, color: "#64748b" };
  };

  return (
    <div className="dm-tab-content">
      {/* ========== WHATSAPP SECTION ========== */}
      <div className="dm-section dm-section--whatsapp" style={{ background: "rgba(37, 211, 102, 0.05)", border: "1px solid rgba(37, 211, 102, 0.2)", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "rgba(37, 211, 102, 0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={18} color="#25d366" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>WhatsApp an Ersteller</div>
              <div style={{ fontSize: 12, color: hasPhone ? "#94a3b8" : "#f59e0b" }}>
                {hasPhone
                  ? `${erstellerName || "Ersteller"}: ${erstellerPhone}`
                  : "Ersteller hat keine WhatsApp-Nummer verknüpft"}
              </div>
            </div>
          </div>
          {hasPhone && (
            <span style={{ padding: "4px 10px", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
              Verbunden
            </span>
          )}
        </div>

        {/* WhatsApp Messages */}
        <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, padding: 8, background: "rgba(0,0,0,0.15)", borderRadius: 8 }}>
          {waLoading ? (
            <div style={{ textAlign: "center", padding: 16, color: "#94a3b8" }}>
              <Loader2 size={20} className="dm-loading__spinner" />
              <span style={{ marginLeft: 8 }}>Lade Nachrichten...</span>
            </div>
          ) : waMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 16, color: "#64748b" }}>
              <MessageSquare size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div>Noch keine WhatsApp-Nachrichten</div>
              {hasPhone && <small>Nutzen Sie die Schnellaktionen oder senden Sie eine Nachricht.</small>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {waMessages.slice(-5).map((msg: any) => (
                <div
                  key={msg.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    maxWidth: "85%",
                    alignSelf: msg.direction === "INBOUND" ? "flex-start" : "flex-end",
                    background: msg.direction === "INBOUND" ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.15)",
                    border: msg.direction === "INBOUND" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(59,130,246,0.25)",
                  }}
                >
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
                    {msg.direction === "INBOUND" ? "Ersteller" : msg.senderType === "SYSTEM" ? "System" : "Mitarbeiter"}
                    {" • "}
                    {new Date(msg.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", whiteSpace: "pre-wrap" }}>{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {hasPhone && waTemplates.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {waTemplates.filter((t: any) => ["REQUEST_LAGEPLAN", "REQUEST_ZAEHLER", "REQUEST_DATENBLATT", "GENERAL_STATUS"].includes(t.key)).map((t: any) => (
              <button
                key={t.key}
                onClick={() => handleSendWaTemplate(t.key)}
                disabled={waSending}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  color: "#94a3b8",
                  fontSize: 12,
                  cursor: waSending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {t.key === "REQUEST_LAGEPLAN" && "📍 Lageplan"}
                {t.key === "REQUEST_ZAEHLER" && "📷 Zählerfoto"}
                {t.key === "REQUEST_DATENBLATT" && "📄 Datenblatt"}
                {t.key === "GENERAL_STATUS" && "ℹ️ Status"}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {hasPhone ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={waNewMessage}
              onChange={(e) => setWaNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendWhatsApp()}
              placeholder="Nachricht eingeben..."
              disabled={waSending}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 13,
              }}
            />
            <button
              onClick={handleSendWhatsApp}
              disabled={!waNewMessage.trim() || waSending}
              style={{
                padding: "10px 16px",
                background: waSending || !waNewMessage.trim() ? "#475569" : "#25d366",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 600,
                cursor: waSending || !waNewMessage.trim() ? "not-allowed" : "pointer",
              }}
            >
              {waSending ? "..." : "Senden"}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 10, color: "#f59e0b", fontSize: 12 }}>
            Der Ersteller dieser Installation hat keine WhatsApp-Nummer mit seinem Konto verknüpft.
          </div>
        )}
      </div>

      {/* Alert System Toggle */}
      <div className="dm-section dm-section--highlight">
        <div className="dm-alert-toggle">
          <div className="dm-alert-toggle__info">
            <div className="dm-alert-toggle__icon">
              <AlertTriangle size={20} />
            </div>
            <div className="dm-alert-toggle__text">
              <span className="dm-alert-toggle__title">Automatische Benachrichtigungen</span>
              <span className="dm-alert-toggle__desc">
                Bei wichtigen E-Mails (Rückfragen, Genehmigungen) werden Sie per Push/E-Mail benachrichtigt
              </span>
            </div>
          </div>
          <button
            className={`dm-toggle ${alertsEnabled ? "dm-toggle--active" : ""}`}
            onClick={handleToggleAlerts}
            disabled={isTogglingAlerts}
          >
            <span className="dm-toggle__slider" />
            <span className="dm-toggle__label">{alertsEnabled ? "AN" : "AUS"}</span>
          </button>
        </div>
      </div>

      {/* Email Address Info */}
      <div className="dm-section">
        <div className="dm-email-info">
          <Mail size={16} />
          <span>Eingehende Mails an:</span>
          <code className="dm-email-address">{emailAddress}</code>
          <button
            className="dm-btn dm-btn--xs dm-btn--outline"
            onClick={() => {
              navigator.clipboard.writeText(emailAddress);
              showToast("E-Mail-Adresse kopiert", "success");
            }}
          >
            <Copy size={12} /> Kopieren
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="dm-section">
        <div className="dm-comm-actions">
          <button
            className="dm-btn dm-btn--primary"
            onClick={() => setShowComposeModal(true)}
          >
            <Plus size={14} /> Neue E-Mail verfassen
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="dm-section">
        <h3 className="dm-section__title">
          <Mail size={16} /> E-Mail-Verlauf ({emails.length})
        </h3>

        {isLoading ? (
          <div className="dm-loading-inline">
            <Loader2 size={20} className="dm-loading__spinner" />
            <span>Lade E-Mails...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="dm-empty">
            <Mail size={32} style={{ opacity: 0.3 }} />
            <span>Noch keine E-Mails vorhanden</span>
            <small>E-Mails an {emailAddress} werden hier automatisch angezeigt</small>
          </div>
        ) : (
          <div className="dm-email-list">
            {emails.map((email) => {
              const badge = getBadgeInfo(email.aiType);
              const isUnread = !email.isRead;
              return (
                <div
                  key={email.id}
                  className={`dm-email-item ${isUnread ? "dm-email-item--unread" : ""}`}
                  onClick={() => onOpenEmail?.(email.id)}
                >
                  <div className="dm-email-item__indicator">
                    {isUnread && <span className="dm-email-item__dot" />}
                  </div>
                  <div className="dm-email-item__content">
                    <div className="dm-email-item__header">
                      <span className="dm-email-item__from">{email.from || "Unbekannt"}</span>
                      <span className="dm-email-item__date">
                        {new Date(email.receivedAt || email.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="dm-email-item__subject">{email.subject || "(Kein Betreff)"}</div>
                    {email.bodyPreview && (
                      <div className="dm-email-item__preview">{email.bodyPreview.substring(0, 100)}...</div>
                    )}
                  </div>
                  {badge && (
                    <span className="dm-email-item__badge" style={{ background: badge.color }}>
                      {badge.label}
                    </span>
                  )}
                  <ChevronRight size={16} className="dm-email-item__arrow" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="dm-compose-overlay" onClick={() => setShowComposeModal(false)}>
          <div className="dm-compose-modal dm-compose-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="dm-compose-header">
              <span className="dm-compose-title">✉️ Neue E-Mail</span>
              <button className="dm-compose-close" onClick={() => setShowComposeModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="dm-compose-body">
              {/* KI-Assistent Bereich */}
              <div className="dm-ai-section">
                <div className="dm-ai-header">
                  <span className="dm-ai-icon">🤖</span>
                  <span className="dm-ai-title">KI-Assistent</span>
                </div>
                <div className="dm-ai-content">
                  <select
                    className="dm-ai-select"
                    value={selectedEmailType}
                    onChange={(e) => setSelectedEmailType(e.target.value)}
                  >
                    <option value="">-- E-Mail-Typ wählen --</option>
                    {EMAIL_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label} - {type.desc}
                      </option>
                    ))}
                  </select>
                  <button
                    className="dm-btn dm-btn--ai"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || !selectedEmailType}
                  >
                    {isGeneratingAI ? (
                      <><Loader2 size={14} className="animate-spin" /> Generiere...</>
                    ) : (
                      <><Zap size={14} /> Mit KI generieren</>
                    )}
                  </button>
                </div>
              </div>

              <div className="dm-compose-divider" />

              <div className="dm-compose-field">
                <label>An:</label>
                <input
                  type="email"
                  placeholder="empfaenger@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                />
              </div>
              <div className="dm-compose-field">
                <label>Betreff:</label>
                <input
                  type="text"
                  placeholder="Betreff eingeben..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                />
              </div>
              <div className="dm-compose-field dm-compose-field--full">
                <label>Nachricht:</label>
                <textarea
                  placeholder="Ihre Nachricht oder lassen Sie die KI generieren..."
                  rows={10}
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                />
              </div>
            </div>
            <div className="dm-compose-footer">
              <button className="dm-btn dm-btn--outline" onClick={() => setShowComposeModal(false)}>
                Abbrechen
              </button>
              <button
                className="dm-btn dm-btn--primary"
                onClick={handleSendEmail}
                disabled={isSending || !composeData.to || !composeData.body}
              >
                {isSending ? (
                  <><Loader2 size={14} className="animate-spin" /> Wird gesendet...</>
                ) : (
                  <><Send size={14} /> Senden</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab: Chat (Endkunde / Ersteller)
function TabChat({
  data,
  showToast
}: {
  data: Installation;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  // Chat Info & Messages State
  const [chatInfo, setChatInfo] = useState<{
    channels: Array<{
      type: string;
      label: string;
      available: boolean;
      reason?: string | null;
      contact: { name?: string; email?: string; phone?: string };
      unreadCount: number;
    }>;
    defaultChannel: string;
    portalStatus: { activated: boolean; activatedAt?: string; lastVisit?: string };
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    content: string;
    direction: string;
    senderType: string;
    channelType: string;
    createdAt: string;
    read: boolean;
  }>>([]);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // Load chat info
  useEffect(() => {
    async function loadChatInfo() {
      if (!data.id) return;
      setChatLoading(true);
      try {
        const res = await fetch(`/api/portal/admin/installations/${data.id}/chat/info`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setChatInfo(json.data);
            if (!activeChannel && json.data.defaultChannel) {
              setActiveChannel(json.data.defaultChannel);
            }
          }
        }
      } catch (err) {
        console.error("Chat info load error:", err);
      } finally {
        setChatLoading(false);
      }
    }
    loadChatInfo();
  }, [data.id]);

  // Load messages when channel changes
  useEffect(() => {
    async function loadMessages() {
      if (!data.id || !activeChannel) return;
      try {
        const res = await fetch(`/api/portal/admin/installations/${data.id}/chat?channel=${activeChannel}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setChatMessages(json.data.messages || []);
          }
        }
      } catch (err) {
        console.error("Chat messages load error:", err);
      }
    }
    loadMessages();
  }, [data.id, activeChannel]);

  // Send message
  const handleSendChat = async () => {
    if (!chatMessage.trim() || chatSending || !activeChannel) return;
    setChatSending(true);
    try {
      const res = await fetch(`/api/portal/admin/installations/${data.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: chatMessage.trim(), channel: activeChannel }),
      });
      if (res.ok) {
        setChatMessage("");
        // Reload messages
        const msgRes = await fetch(`/api/portal/admin/installations/${data.id}/chat?channel=${activeChannel}`, {
          credentials: "include",
        });
        if (msgRes.ok) {
          const json = await msgRes.json();
          setChatMessages(json.data?.messages || []);
        }
        showToast("Nachricht gesendet + E-Mail verschickt", "success");
      } else {
        showToast("Fehler beim Senden", "error");
      }
    } catch (err) {
      showToast("Netzwerkfehler", "error");
    } finally {
      setChatSending(false);
    }
  };

  const activeChannelInfo = chatInfo?.channels.find(c => c.type === activeChannel);

  const getSenderLabel = (msg: { direction: string; senderType: string; channelType: string }) => {
    if (msg.direction === "OUTBOUND") {
      return msg.senderType === "MITARBEITER" ? "Mitarbeiter" : "System";
    }
    return msg.channelType === "ENDKUNDE" ? "Endkunde" : "Ersteller";
  };

  return (
    <div className="dm-tab-content">
      <div className="dm-section">
        <div className="dm-section__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="dm-section__title">
            <Users size={16} /> Chat mit Endkunde / Ersteller
          </h3>
          <button
            onClick={() => {
              setChatLoading(true);
              fetch(`/api/portal/admin/installations/${data.id}/chat/info`, { credentials: "include" })
                .then(r => r.json())
                .then(j => { setChatInfo(j.data); setChatLoading(false); })
                .catch(() => setChatLoading(false));
            }}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {chatLoading ? (
          <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.5)" }}>
            <Loader2 size={24} className="dm-spin" />
            <div style={{ marginTop: 8 }}>Lade Chat...</div>
          </div>
        ) : (
          <>
            {/* Channel Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12 }}>
              {chatInfo?.channels.map(channel => (
                <button
                  key={channel.type}
                  onClick={() => channel.available && setActiveChannel(channel.type)}
                  disabled={!channel.available}
                  title={channel.reason || undefined}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: activeChannel === channel.type ? "1px solid #D4A843" : "1px solid rgba(255,255,255,0.1)",
                    background: activeChannel === channel.type ? "rgba(212,168,67,0.15)" : "transparent",
                    color: !channel.available ? "rgba(255,255,255,0.3)" : activeChannel === channel.type ? "#a5b4fc" : "rgba(255,255,255,0.7)",
                    cursor: channel.available ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {channel.type === "ENDKUNDE" ? "👤" : "🏢"} {channel.label}
                  {channel.unreadCount > 0 && (
                    <span style={{ background: "#ef4444", color: "#fff", padding: "2px 6px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                      {channel.unreadCount}
                    </span>
                  )}
                  {!channel.available && <span style={{ color: "#f59e0b", fontSize: 10 }}>⚠️</span>}
                </button>
              ))}
            </div>

            {/* Contact Info */}
            {activeChannelInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #D4A843, #EAD068)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {activeChannel === "ENDKUNDE" ? "👤" : "🏢"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                    {activeChannelInfo.contact.name || (activeChannel === "ENDKUNDE" ? "Endkunde" : "Ersteller")}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", gap: 12, marginTop: 4 }}>
                    {activeChannelInfo.contact.email && <span>✉️ {activeChannelInfo.contact.email}</span>}
                    {activeChannelInfo.contact.phone && <span>📞 {activeChannelInfo.contact.phone}</span>}
                  </div>
                </div>
                {chatInfo?.portalStatus.activated && activeChannel === "ENDKUNDE" && (
                  <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                    Portal aktiv
                  </span>
                )}
              </div>
            )}

            {/* Messages */}
            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16, padding: 8, background: "rgba(0,0,0,0.15)", borderRadius: 10 }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.4)" }}>
                  <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <div>Noch keine Nachrichten</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Bei jeder Nachricht wird der Empfänger per E-Mail benachrichtigt.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.direction === "OUTBOUND" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: msg.direction === "OUTBOUND" ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.05)",
                        border: msg.direction === "OUTBOUND" ? "1px solid rgba(212,168,67,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4, display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>{getSenderLabel(msg)}</span>
                        <span>{new Date(msg.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "rgba(255,255,255,0.9)" }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            {activeChannel && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                    placeholder={`Nachricht an ${activeChannel === "ENDKUNDE" ? "Endkunden" : "Ersteller"} schreiben... (Enter zum Senden)`}
                    rows={2}
                    disabled={chatSending}
                    style={{ flex: 1, resize: "none", padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.9)", fontSize: 13 }}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatMessage.trim() || chatSending}
                    style={{ padding: "10px 20px", background: "#D4A843", border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, cursor: chatMessage.trim() && !chatSending ? "pointer" : "not-allowed", opacity: chatMessage.trim() && !chatSending ? 1 : 0.5 }}
                  >
                    {chatSending ? "..." : "Senden"}
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(59,130,246,0.9)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={12} />
                  Empfänger erhält E-Mail: "Neue Nachricht im Portal verfügbar"
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Tab: History
function TabHistorie({
  data,
  showToast,
  permissions
}: {
  data: Installation;
  showToast: (msg: string, type: "success" | "error") => void;
  permissions: Permissions;
}) {
  return (
    <div className="dm-tab-content">
      {/* Comments Section - Input + List */}
      <div className="dm-section">
        <h3 className="dm-section__title">
          <MessageSquare size={16} /> Kommentare & Notizen
        </h3>
        <CommentsSection
          installationId={data.id}
          showToast={showToast}
          permissions={permissions}
        />
      </div>

      {/* System Timeline */}
      <div className="dm-section">
        <h3 className="dm-section__title">
          <History size={16} /> System-Ereignisse
        </h3>
        <div className="dm-history">
          <div className="dm-history__item">
            <div className="dm-history__dot" />
            <div className="dm-history__content">
              <div className="dm-history__date">
                {data.createdAt ? new Date(data.createdAt).toLocaleString("de-DE") : "Unbekannt"}
              </div>
              <div className="dm-history__text">Anlage erstellt</div>
            </div>
          </div>
          {data.nbEingereichtAm && (
            <div className="dm-history__item">
              <div className="dm-history__dot" />
              <div className="dm-history__content">
                <div className="dm-history__date">
                  {new Date(data.nbEingereichtAm).toLocaleString("de-DE")}
                </div>
                <div className="dm-history__text">Beim Netzbetreiber eingereicht</div>
              </div>
            </div>
          )}
          {data.nbGenehmigungAm && (
            <div className="dm-history__item">
              <div className="dm-history__dot dm-history__dot--success" />
              <div className="dm-history__content">
                <div className="dm-history__date">
                  {new Date(data.nbGenehmigungAm).toLocaleString("de-DE")}
                </div>
                <div className="dm-history__text">Genehmigung erhalten</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ALERT BANNER COMPONENT
// ============================================
interface AlertBannerProps {
  alerts: InstallationAlert[];
  onMarkRead: (alertId: number) => void;
  onResolve: (alertId: number) => void;
}

const ALERT_STYLES: Record<string, { bg: string; border: string; icon: typeof AlertCircle; iconColor: string }> = {
  CRITICAL: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", icon: AlertCircle, iconColor: "#ef4444" },
  WARNING: { bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b", icon: AlertTriangle, iconColor: "#f59e0b" },
  INFO: { bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6", icon: Info, iconColor: "#3b82f6" },
};

const ALERT_CATEGORY_LABELS: Record<string, string> = {
  RUECKFRAGE: "Rückfrage vom NB",
  ABLEHNUNG: "Ablehnung",
  GENEHMIGUNG: "Genehmigung",
  WARTEZEIT: "Lange Wartezeit",
  DOKUMENT_FEHLT: "Dokumente fehlen",
};

function AlertBanner({ alerts, onMarkRead, onResolve }: AlertBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const unreadAlerts = alerts.filter(a => !a.isRead);
  const displayAlerts = expanded ? alerts : alerts.slice(0, 2);

  if (alerts.length === 0) return null;

  return (
    <div className="dm-alert-banner">
      <div className="dm-alert-banner__header">
        <Bell size={16} />
        <span className="dm-alert-banner__title">
          {unreadAlerts.length > 0 ? `${unreadAlerts.length} neue Alerts` : `${alerts.length} Alerts`}
        </span>
        {alerts.length > 2 && (
          <button
            className="dm-alert-banner__toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Weniger" : `Alle ${alerts.length} anzeigen`}
          </button>
        )}
      </div>
      <div className="dm-alert-banner__list">
        {displayAlerts.map((alert) => {
          const style = ALERT_STYLES[alert.type] || ALERT_STYLES.INFO;
          const IconComponent = style.icon;
          return (
            <div
              key={alert.id}
              className={`dm-alert-item ${!alert.isRead ? "dm-alert-item--unread" : ""}`}
              style={{ background: style.bg, borderLeftColor: style.border }}
            >
              <IconComponent size={18} style={{ color: style.iconColor, flexShrink: 0 }} />
              <div className="dm-alert-item__content">
                <div className="dm-alert-item__header">
                  <span className="dm-alert-item__category">
                    {ALERT_CATEGORY_LABELS[alert.category] || alert.category}
                  </span>
                  <span className="dm-alert-item__time">
                    {new Date(alert.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <div className="dm-alert-item__title">{alert.title}</div>
                {alert.message && (
                  <div className="dm-alert-item__message">{alert.message}</div>
                )}
              </div>
              <div className="dm-alert-item__actions">
                {!alert.isRead && (
                  <button
                    className="dm-alert-item__btn"
                    onClick={() => onMarkRead(alert.id)}
                    title="Als gelesen markieren"
                  >
                    <Eye size={14} />
                  </button>
                )}
                <button
                  className="dm-alert-item__btn dm-alert-item__btn--resolve"
                  onClick={() => onResolve(alert.id)}
                  title="Als erledigt markieren"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`dm-toast dm-toast--${type}`}>
      {type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span>{message}</span>
      <button className="dm-toast__close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}

// Main Component
export function DetailModal({ installationId, onClose }: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const queryClient = useQueryClient();

  // 🔒 Get user permissions
  const permissions = usePermissions();

  // Build tabs dynamically - include Email tab when email is selected
  const TABS = selectedEmailId
    ? [BASE_TABS[0], EMAIL_TAB, ...BASE_TABS.slice(1)]
    : BASE_TABS;

  // Handler to open email in dedicated tab
  const handleOpenEmail = useCallback((emailId: number) => {
    setSelectedEmailId(emailId);
    setActiveTab("email");
  }, []);

  // Handler to close email tab
  const handleCloseEmailTab = useCallback(() => {
    setSelectedEmailId(null);
    setActiveTab("overview");
  }, []);

  // Toast handler
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["installation-detail", installationId],
    queryFn: () => fetchInstallation(installationId),
    staleTime: 30000,
  });

  // Fetch alerts for this installation
  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ["installation-alerts", installationId],
    queryFn: () => fetchInstallationAlerts(installationId),
    staleTime: 30000,
  });

  // Alert handlers
  const handleMarkAlertRead = useCallback(async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, {
        method: "POST",
        credentials: "include",
      });
      refetchAlerts();
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  }, [refetchAlerts]);

  const handleResolveAlert = useCallback(async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
        credentials: "include",
      });
      refetchAlerts();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  }, [refetchAlerts]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleStatusChange = async (newStatus: string, reason?: string): Promise<void> => {
    try {
      const res = await fetch(`/api/installations/${installationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Fehler: ${res.status}`);
      }
      queryClient.invalidateQueries({ queryKey: ["installation-detail", installationId] });
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      queryClient.invalidateQueries({ queryKey: ["netzanmeldungen"] });
    } catch (err) {
      console.error("Status change failed:", err);
      throw err;
    }
  };

  const handleCreateInvoice = () => {
    window.open(`/rechnungen/neu?installation=${installationId}`, "_blank");
  };

  const handleNbTrackingUpdate = async (updates: { nbVorgangsnummer?: string; nbPortalUrl?: string }) => {
    try {
      const res = await fetch(`/api/installations/${installationId}/nb-tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      queryClient.invalidateQueries({ queryKey: ["installation-detail", installationId] });
      queryClient.invalidateQueries({ queryKey: ["installations"] });
    } catch (err) {
      console.error("NB-Tracking update failed:", err);
      throw err;
    }
  };

  const statusConfig = data ? (STATUS_CONFIG[data.status] || { label: data.status, color: "#64748b", step: 0 }) : null;

  return (
    <div
      className="dm-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="dm-modal"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1800px",
          height: "95vh",
          background: "#07070C",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {isLoading ? (
            <div className="dm-loading">
              <Loader2 size={32} className="dm-loading__spinner" />
              <p>Lade Details...</p>
            </div>
          ) : error || !data ? (
            <div className="dm-error">
              <AlertTriangle size={32} />
              <p>Fehler beim Laden</p>
              <button className="dm-btn dm-btn--outline" onClick={onClose}>
                Zurück
              </button>
            </div>
          ) : (
            <DashboardV2
              installation={data as any}
              onClose={onClose}
              onStatusChange={(s) => handleStatusChange(s)}
              showToast={showToast}
              onOpenUploadModal={() => {}}
              isAdmin={permissions.canChangeStatus}
            />
          )}

          {/* Toast Notification */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
      </div>
    </div>
  );
}

export default DetailModal;

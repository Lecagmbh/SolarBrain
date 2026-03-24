/**
 * ALERT CENTER v1.0 - Installation Alerts & Missing Data
 * =======================================================
 * Zeigt auf einen Blick was fehlt oder Aufmerksamkeit braucht
 */

import { useMemo } from "react";
import {
  AlertTriangle, AlertCircle, Clock, FileX, User, Building2,
  Phone, Mail, Hash, Camera, FileText, CheckCircle, Zap,
  Calendar, Send, ChevronRight, XCircle
} from "lucide-react";
import type { InstallationDetail, Document } from "../../../types";

// Alert-Typen
type AlertSeverity = "critical" | "warning" | "info";
type AlertCategory = "data" | "documents" | "status" | "time";

interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
}

interface AlertCenterProps {
  detail: InstallationDetail;
  documents?: Document[];
  onSwitchToTab?: (tab: string) => void;
}

// Required documents per status
const REQUIRED_DOCS: Record<string, string[]> = {
  eingang: ["vollmacht", "lageplan"],
  beim_nb: ["vollmacht", "lageplan", "schaltplan"],
  genehmigt: ["vollmacht", "lageplan", "schaltplan", "bestaetigung_nb"],
  ibn: ["vollmacht", "lageplan", "schaltplan", "bestaetigung_nb"],
};

const DOC_LABELS: Record<string, string> = {
  vollmacht: "Vollmacht",
  lageplan: "Lageplan",
  schaltplan: "Schaltplan",
  bestaetigung_nb: "NB-Genehmigung",
  datenblatt_module: "Datenblatt Module",
  datenblatt_wechselrichter: "Datenblatt WR",
  datenblatt_speicher: "Datenblatt Speicher",
  foto: "Fotos",
};

export function AlertCenter({ detail, documents = [], onSwitchToTab }: AlertCenterProps) {
  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const status = detail.status?.toLowerCase().replace(/-/g, "_");

    // ═══════════════════════════════════════════════════════════════════════
    // KRITISCH - Fehlende Daten
    // ═══════════════════════════════════════════════════════════════════════

    // Kein Netzbetreiber
    if (!detail.gridOperatorId && !detail.gridOperator) {
      result.push({
        id: "no-nb",
        severity: "critical",
        category: "data",
        icon: <Building2 size={16} />,
        title: "Kein Netzbetreiber",
        description: "Die Anlage hat keinen zugewiesenen Netzbetreiber",
        action: { label: "NB zuweisen" },
      });
    }

    // Keine Kundenkontaktdaten
    const hasEmail = detail.customer?.email || detail.contactEmail;
    const hasPhone = detail.customer?.telefon || detail.contactPhone;
    if (!hasEmail && !hasPhone) {
      result.push({
        id: "no-contact",
        severity: "critical",
        category: "data",
        icon: <User size={16} />,
        title: "Keine Kontaktdaten",
        description: "Weder E-Mail noch Telefon hinterlegt",
      });
    } else if (!hasEmail) {
      result.push({
        id: "no-email",
        severity: "warning",
        category: "data",
        icon: <Mail size={16} />,
        title: "Keine E-Mail",
        description: "Keine E-Mail-Adresse hinterlegt",
      });
    }

    // Keine technischen Daten / kWp
    if (!detail.totalKwp || detail.totalKwp === 0) {
      result.push({
        id: "no-kwp",
        severity: "warning",
        category: "data",
        icon: <Zap size={16} />,
        title: "Keine Anlagenleistung",
        description: "kWp nicht angegeben",
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOKUMENTE - Was fehlt?
    // ═══════════════════════════════════════════════════════════════════════

    const uploadedCategories = new Set(
      documents.map(d => d.kategorie?.toLowerCase())
    );

    const requiredForStatus = REQUIRED_DOCS[status] || REQUIRED_DOCS.eingang || [];
    const missingDocs = requiredForStatus.filter(doc => !uploadedCategories.has(doc));

    if (missingDocs.length > 0) {
      const docNames = missingDocs.map(d => DOC_LABELS[d] || d).join(", ");
      result.push({
        id: "missing-docs",
        severity: missingDocs.includes("vollmacht") ? "critical" : "warning",
        category: "documents",
        icon: <FileX size={16} />,
        title: `${missingDocs.length} Dokument${missingDocs.length > 1 ? "e" : ""} fehlt`,
        description: docNames,
        action: {
          label: "Dokumente",
          onClick: () => onSwitchToTab?.("documents")
        },
      });
    }

    // Keine Fotos
    const hasPhotos = documents.some(d => d.kategorie?.toLowerCase() === "foto");
    if (!hasPhotos) {
      result.push({
        id: "no-photos",
        severity: "info",
        category: "documents",
        icon: <Camera size={16} />,
        title: "Keine Fotos",
        description: "Noch keine Fotos hochgeladen",
        action: {
          label: "Hochladen",
          onClick: () => onSwitchToTab?.("documents")
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS-SPEZIFISCHE ALERTS
    // ═══════════════════════════════════════════════════════════════════════

    // Rückfrage vom NB - Aktion nötig!
    if (status === "rueckfrage") {
      result.push({
        id: "rueckfrage",
        severity: "critical",
        category: "status",
        icon: <AlertTriangle size={16} />,
        title: "Rückfrage vom NB",
        description: "Der Netzbetreiber hat Fragen - bitte schnell beantworten!",
        action: {
          label: "E-Mails prüfen",
          onClick: () => onSwitchToTab?.("emails")
        },
      });
    }

    // Eingang - Bereit zum Einreichen?
    if (status === "eingang" && detail.gridOperatorId && missingDocs.length === 0) {
      result.push({
        id: "ready-submit",
        severity: "info",
        category: "status",
        icon: <Send size={16} />,
        title: "Bereit zum Einreichen",
        description: "Alle Daten vollständig - kann beim NB eingereicht werden",
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZEIT-BASIERTE ALERTS
    // ═══════════════════════════════════════════════════════════════════════

    // Zu lange im Eingang
    const daysOld = detail.daysOld ?? 0;
    if (status === "eingang" && daysOld > 7) {
      result.push({
        id: "old-eingang",
        severity: daysOld > 14 ? "critical" : "warning",
        category: "time",
        icon: <Clock size={16} />,
        title: `${daysOld} Tage im Eingang`,
        description: daysOld > 14
          ? "Dringend einreichen oder stornieren!"
          : "Sollte bald beim NB eingereicht werden",
      });
    }

    // Zu lange beim NB
    const daysAtNb = detail.daysAtNb ?? 0;
    if ((status === "beim_nb" || status === "beim-nb") && daysAtNb > 21) {
      result.push({
        id: "long-at-nb",
        severity: daysAtNb > 35 ? "critical" : "warning",
        category: "time",
        icon: <Clock size={16} />,
        title: `${daysAtNb} Tage beim NB`,
        description: daysAtNb > 35
          ? "Unbedingt nachfragen!"
          : "Vielleicht mal beim NB nachfragen?",
        action: {
          label: "E-Mail schreiben",
          onClick: () => onSwitchToTab?.("emails")
        },
      });
    }

    // Zählerwechsel bald
    if (detail.zaehlerwechselDatum) {
      const termin = new Date(detail.zaehlerwechselDatum);
      const today = new Date();
      const daysUntil = Math.ceil((termin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil <= 7) {
        result.push({
          id: "zaehler-soon",
          severity: daysUntil <= 2 ? "critical" : "warning",
          category: "time",
          icon: <Calendar size={16} />,
          title: daysUntil === 0 ? "Zählerwechsel HEUTE!" : `Zählerwechsel in ${daysUntil} Tag${daysUntil !== 1 ? "en" : ""}`,
          description: `Am ${termin.toLocaleDateString("de-DE")}`,
        });
      } else if (daysUntil < 0) {
        result.push({
          id: "zaehler-overdue",
          severity: "critical",
          category: "time",
          icon: <XCircle size={16} />,
          title: "Zählerwechsel überfällig!",
          description: `War am ${termin.toLocaleDateString("de-DE")} geplant`,
        });
      }
    }

    // Genehmigt aber kein IBN-Datum
    if (status === "genehmigt" && !detail.geplantesIBNDatum && !detail.zaehlerwechselDatum) {
      result.push({
        id: "no-ibn-date",
        severity: "warning",
        category: "time",
        icon: <Calendar size={16} />,
        title: "Kein IBN-Termin",
        description: "Genehmigt, aber noch kein Inbetriebnahme-Termin geplant",
      });
    }

    // Sort by severity
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [detail, documents, onSwitchToTab]);

  // Counts
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;
  const infoCount = alerts.filter(a => a.severity === "info").length;

  // Alles OK?
  if (alerts.length === 0) {
    return (
      <div className="dp-alert-center dp-alert-center--ok">
        <div className="dp-alert-center__header dp-alert-center__header--ok">
          <CheckCircle size={20} />
          <span>Alles vollständig</span>
        </div>
        <p className="dp-alert-center__ok-text">
          Keine fehlenden Daten oder offenen Punkte
        </p>
      </div>
    );
  }

  return (
    <div className="dp-alert-center">
      {/* Header mit Zusammenfassung */}
      <div className={`dp-alert-center__header ${criticalCount > 0 ? "dp-alert-center__header--critical" : ""}`}>
        <AlertTriangle size={20} />
        <span>
          {criticalCount > 0 && <strong>{criticalCount} kritisch</strong>}
          {criticalCount > 0 && (warningCount > 0 || infoCount > 0) && " · "}
          {warningCount > 0 && `${warningCount} Warnung${warningCount > 1 ? "en" : ""}`}
          {warningCount > 0 && infoCount > 0 && " · "}
          {infoCount > 0 && `${infoCount} Info`}
        </span>
      </div>

      {/* Alert Liste */}
      <div className="dp-alert-center__list">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`dp-alert-item dp-alert-item--${alert.severity}`}
          >
            <div className="dp-alert-item__icon">
              {alert.icon}
            </div>
            <div className="dp-alert-item__content">
              <div className="dp-alert-item__title">{alert.title}</div>
              <div className="dp-alert-item__desc">{alert.description}</div>
            </div>
            {alert.action && (
              <button
                className="dp-alert-item__action"
                onClick={alert.action.onClick}
              >
                {alert.action.label}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertCenter;

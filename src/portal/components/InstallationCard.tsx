/**
 * Installation Card Component
 * ===========================
 * Zeigt die Hauptinformationen einer Installation.
 * Premium Design passend zum Portal.
 */

import { type PortalInstallation } from "../api";
import { MapPin, Zap, Building, Calendar } from "lucide-react";

interface InstallationCardProps {
  installation: PortalInstallation;
}

export function InstallationCard({ installation }: InstallationCardProps) {
  const address = [
    installation.strasse,
    installation.hausNr,
    installation.plz,
    installation.ort,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="icard">
        <div className="icard-header">
          <div className="icard-header-info">
            <h2 className="icard-title">
              {installation.customerName || "Ihre Anlage"}
            </h2>
            {installation.nbCaseNumber && (
              <p className="icard-vorgangsnr">
                Vorgangsnummer: {installation.nbCaseNumber}
              </p>
            )}
            <p className="icard-id">
              Interne Nr.: {installation.publicId}
            </p>
          </div>
          <StatusBadge status={installation.status} />
        </div>

        <div className="icard-grid">
          {/* Address */}
          <div className="icard-item">
            <div className="icard-item-icon icard-item-icon--indigo">
              <MapPin size={16} />
            </div>
            <div className="icard-item-content">
              <span className="icard-item-label">Standort</span>
              <span className="icard-item-value">{address || "Nicht angegeben"}</span>
            </div>
          </div>

          {/* Type */}
          {installation.caseType && (
            <div className="icard-item">
              <div className="icard-item-icon icard-item-icon--yellow">
                <Zap size={16} />
              </div>
              <div className="icard-item-content">
                <span className="icard-item-label">Anlagentyp</span>
                <span className="icard-item-value">{formatAnlagenTyp(installation.caseType)}</span>
              </div>
            </div>
          )}

          {/* Installer */}
          <div className="icard-item">
            <div className="icard-item-icon icard-item-icon--emerald">
              <Building size={16} />
            </div>
            <div className="icard-item-content">
              <span className="icard-item-label">Installateur</span>
              <span className="icard-item-value">{installation.installateurName}</span>
            </div>
          </div>

          {/* Date */}
          <div className="icard-item">
            <div className="icard-item-icon icard-item-icon--purple">
              <Calendar size={16} />
            </div>
            <div className="icard-item-content">
              <span className="icard-item-label">Eingereicht</span>
              <span className="icard-item-value">{formatDate(installation.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{cardStyles}</style>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getColorClass = () => {
    switch (status) {
      case "FERTIG":
      case "GENEHMIGT":
        return "icard-badge--green";
      case "RUECKFRAGE":
        return "icard-badge--red";
      case "BEIM_NB":
        return "icard-badge--blue";
      case "STORNIERT":
        return "icard-badge--gray";
      default:
        return "icard-badge--indigo";
    }
  };

  return (
    <span className={`icard-badge ${getColorClass()}`}>
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    EINGANG: "Eingegangen",
    BEIM_NB: "Beim NB",
    RUECKFRAGE: "Rückfrage",
    GENEHMIGT: "Genehmigt",
    IBN: "Inbetriebnahme",
    FERTIG: "Fertig",
    STORNIERT: "Storniert",
  };
  return labels[status] || status;
}

function formatAnlagenTyp(caseType: string): string {
  const types: Record<string, string> = {
    PV: "PV-Anlage",
    PV_SPEICHER: "PV + Speicher",
    SPEICHER: "Speicher",
    WALLBOX: "Wallbox",
    PV_WALLBOX: "PV + Wallbox",
    PV_SPEICHER_WALLBOX: "PV + Speicher + Wallbox",
    WAERMEPUMPE: "Wärmepumpe",
    BALKONKRAFTWERK: "Balkonkraftwerk",
  };
  return types[caseType] || caseType;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const cardStyles = `
  .icard {
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 22px;
  }

  .icard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .icard-header-info {
    flex: 1;
    min-width: 0;
  }

  .icard-title {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }

  .icard-vorgangsnr {
    margin: 0 0 2px 0;
    font-size: 13px;
    font-weight: 600;
    color: rgba(129, 140, 248, 0.9);
    font-family: monospace;
  }

  .icard-id {
    margin: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
  }

  .icard-badge {
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 8px;
    border: 1px solid;
    white-space: nowrap;
  }

  .icard-badge--green {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.25);
  }

  .icard-badge--red {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.25);
  }

  .icard-badge--blue {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.25);
  }

  .icard-badge--indigo {
    background: rgba(212, 168, 67, 0.15);
    color: #EAD068;
    border-color: rgba(212, 168, 67, 0.25);
  }

  .icard-badge--gray {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .icard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 640px) {
    .icard-grid {
      grid-template-columns: 1fr;
    }
  }

  .icard-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .icard-item-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .icard-item-icon--indigo {
    background: rgba(212, 168, 67, 0.12);
    color: #EAD068;
  }

  .icard-item-icon--yellow {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
  }

  .icard-item-icon--emerald {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
  }

  .icard-item-icon--purple {
    background: rgba(168, 85, 247, 0.12);
    color: #c084fc;
  }

  .icard-item-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .icard-item-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.4);
  }

  .icard-item-value {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    line-height: 1.4;
  }
`;


import { useInstallationDetail } from "../context/InstallationDetailContext";
import { formatDate, safe } from "../logic/utils";

export default function OverviewTab() {
  const { detail } = useInstallationDetail();

  if (!detail) return <div>Keine Daten…</div>;

  const raw = detail.raw ?? {};

  return (
    <div className="installation-overview-grid">
      {/* Betreiber & Kunde */}
      <div className="installation-overview-card">
        <h3>Betreiber & Kunde</h3>
        <ul className="detail-list">
          <li>
            <span>Kunde</span>
            <span>{detail.customerName}</span>
          </li>
          <li>
            <span>Adresse</span>
            <span>{detail.location}</span>
          </li>
          <li>
            <span>E-Mail</span>
            <span>{safe(detail.createdByEmail)}</span>
          </li>
          <li>
            <span>Angelegt von</span>
            <span>{safe(detail.createdByName)}</span>
          </li>
        </ul>
      </div>

      {/* Standort / Netz */}
      <div className="installation-overview-card">
        <h3>Standort & Netz</h3>
        <ul className="detail-list">
          <li>
            <span>Netzbetreiber</span>
            <span>{safe(detail.gridOperator)}</span>
          </li>
          <li>
            <span>Letzte Änderung</span>
            <span>{formatDate(detail.updatedAt)}</span>
          </li>
        </ul>
      </div>

      {/* PV / Technik */}
      <div className="installation-overview-card">
        <h3>Technische Daten</h3>
        <ul className="detail-list">
          <li>
            <span>Modulhersteller</span>
            <span>{safe(raw.moduleManufacturer)}</span>
          </li>
          <li>
            <span>Gesamtleistung</span>
            <span>{safe(raw.totalPowerKw)} kWp</span>
          </li>
          <li>
            <span>WR-Typ</span>
            <span>{safe(raw.inverterType)}</span>
          </li>
          <li>
            <span>Messkonzept</span>
            <span>{safe(raw.messkonzept)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

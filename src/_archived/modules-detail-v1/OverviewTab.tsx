import React from "react";
import type { InstallationDetail } from "./types";

type Props = {
  detail: InstallationDetail;
  isAdmin: boolean;
  statusDraft: string;
  onStatusDraftChange: (v: string) => void;
  commentDraft: string;
  onCommentDraftChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
};

const STATUS_OPTIONS = [
  { value: "pruefung", label: "In Prüfung – Baunity" },
  { value: "netzbetreiber", label: "Beim Netzbetreiber – eingereicht" },
  { value: "freigegeben", label: "Freigegeben – bestätigt" },
];

const OverviewTab: React.FC<Props> = ({
  detail,
  isAdmin,
  statusDraft,
  onStatusDraftChange,
  commentDraft,
  onCommentDraftChange,
  onSave,
  saving,
}) => {
  const wizard = (detail.raw ?? {}) as any;

  const customerTypeLabel =
    wizard.customerType === "unternehmen"
      ? "Unternehmen"
      : wizard.customerType === "privat"
      ? "Privatperson"
      : "–";

  const measurementConceptLabel = (() => {
    switch (wizard.measurementConcept) {
      case "MK1":
        return "MK 1 – Volleinspeisung";
      case "MK2":
        return "MK 2 – Überschusseinspeisung";
      case "MK3":
        return "MK 3 – PV-Selbstverbrauch";
      case "MK4":
        return "MK 4 – KWK-Untermessung";
      case "MK5":
        return "MK 5 – kaufm. Weitergabe";
      case "MK6":
        return "MK 6 – mehrere Energiearten";
      case "MK8":
        return "MK 8 – Sonderfall / Netzanschluss";
      default:
        return "–";
    }
  })();

  return (
    <div className="installation-overview-grid">
      <div className="installation-overview-card">
        <h3>Betreiber &amp; Kunde</h3>
        <ul className="detail-list">
          <li>
            <span>Kundentyp</span>
            <span>{customerTypeLabel}</span>
          </li>
          <li>
            <span>Kunde</span>
            <span>{detail.customerName}</span>
          </li>
          <li>
            <span>E-Mail</span>
            <span>{wizard.email || "–"}</span>
          </li>
          <li>
            <span>Telefon</span>
            <span>{wizard.phone || "–"}</span>
          </li>
        </ul>
      </div>

      <div className="installation-overview-card">
        <h3>Standort &amp; Messkonzept</h3>
        <ul className="detail-list">
          <li>
            <span>Adresse</span>
            <span>
              {wizard.locationStreet
                ? `${wizard.locationStreet}, ${wizard.locationZip ?? ""} ${
                    wizard.locationCity ?? ""
                  }`.trim()
                : detail.location}
            </span>
          </li>
          <li>
            <span>Netzbetreiber</span>
            <span>{detail.gridOperator || "Nicht gesetzt"}</span>
          </li>
          <li>
            <span>Messkonzept</span>
            <span>{measurementConceptLabel}</span>
          </li>
        </ul>
      </div>

      <div className="installation-overview-card">
        <h3>Anlagendaten (Kurz)</h3>
        <ul className="detail-list">
          <li>
            <span>Generatorleistung</span>
            <span>
              {wizard.moduleWp && wizard.moduleCount
                ? `${wizard.moduleWp * wizard.moduleCount} Wp`
                : "–"}
            </span>
          </li>
          <li>
            <span>Wechselrichter</span>
            <span>
              {wizard.inverterManufacturer || wizard.inverterModel || "–"}
            </span>
          </li>
          <li>
            <span>Speicher</span>
            <span>{wizard.hasStorage ? "Ja" : "Nein"}</span>
          </li>
          <li>
            <span>Wallbox</span>
            <span>{wizard.hasWallbox ? "Ja" : "Nein"}</span>
          </li>
          <li>
            <span>Wärmepumpe</span>
            <span>{wizard.hasHeatpump ? "Ja" : "Nein"}</span>
          </li>
        </ul>
      </div>

      <div className="installation-overview-card">
        <h3>Aktionen &amp; letzte Kommentare</h3>

        {isAdmin ? (
          <>
            <div className="installation-form-group">
              <label>Status anpassen</label>
              <select
                className="admin-input"
                value={statusDraft}
                onChange={(e) => onStatusDraftChange(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="installation-form-group">
              <label>Kommentar hinzufügen</label>
              <textarea
                className="admin-input"
                rows={3}
                placeholder="Interne Notiz, Rückruf, Statusinfo …"
                value={commentDraft}
                onChange={(e) => onCommentDraftChange(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={onSave}
              disabled={saving || (!statusDraft && !commentDraft.trim())}
            >
              {saving ? "Speichern…" : "Status / Kommentar speichern"}
            </button>
          </>
        ) : (
          <p className="detail-muted">
            Statusänderungen sind nur für Admins möglich.
          </p>
        )}

        {detail.comments.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className="detail-muted" style={{ marginBottom: "0.25rem" }}>
              Letzte Kommentare
            </div>
            <ul className="detail-comment-list">
              {detail.comments.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <div className="detail-comment-header">
                    <span>{c.author}</span>
                  </div>
                  <div className="detail-comment-body">{c.message}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;

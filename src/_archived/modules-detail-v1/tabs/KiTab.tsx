import React from "react";
import type { InstallationDetail } from "../types";
import type { InstallationAiSummary } from "../../../../services/installationAi";

type Props = {
  detail: InstallationDetail;
  ai: InstallationAiSummary | null;
};

const KiTab: React.FC<Props> = ({ ai }) => {
  if (!ai) {
    return (
      <div className="installation-ki-tab">
        <h3>Netzanalyse &amp; Priorisierung</h3>
        <p className="detail-muted">
          Für diese Anlage liegt noch keine KI-Auswertung vor.
        </p>
      </div>
    );
  }

  return (
    <div className="installation-ki-tab">
      <h3>Netzanalyse &amp; Priorisierung</h3>

      <div className="installation-meta-row">
        <div className="installation-meta-item">
          <span>KI-Status</span>
          <strong>{ai.aiStatus || "–"}</strong>
        </div>
        <div className="installation-meta-item">
          <span>KI-Substatus</span>
          <strong>{ai.aiSubStatus || "–"}</strong>
        </div>
      </div>

      {ai.requiredDocs?.length > 0 && (
        <div className="installation-ki-section">
          <h4>Pflichtunterlagen laut Netzanalyse</h4>
          <ul className="detail-list">
            {ai.requiredDocs.map((name: string, idx: number) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.optionalDocs?.length > 0 && (
        <div className="installation-ki-section">
          <h4>Optionale Unterlagen / nice to have</h4>
          <ul className="detail-list">
            {ai.optionalDocs.map((name: string, idx: number) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.nextActions?.length > 0 && (
        <div className="installation-ki-section">
          <h4>Nächste Schritte</h4>
          <ul className="detail-list">
            {ai.nextActions.map((action: string, idx: number) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.notes?.length > 0 && (
        <div className="installation-ki-section">
          <h4>Hinweise der Netzanalyse</h4>
          <ul className="detail-note-list">
            {ai.notes.map((note: string, idx: number) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default KiTab;

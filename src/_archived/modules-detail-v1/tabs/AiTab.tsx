
import { useInstallationDetail } from "../context/InstallationDetailContext";
import { safe } from "../logic/utils";

export default function AiTab() {
  const { detail } = useInstallationDetail();

  if (!detail) return <div>Keine Daten…</div>;

  const ai = detail.raw?.aiSummary ?? {
    summary: "Für diese Anlage liegt noch keine KI-Analyse vor.",
    confidence: null,
    detected: {},
  };

  return (
    <div className="installation-ki-grid">
      {/* Zusammenfassung */}
      <div className="installation-ki-card">
        <h4>KI-Zusammenfassung</h4>
        <p style={{ whiteSpace: "pre-wrap" }}>{ai.summary}</p>
      </div>

      {/* Erkennungen */}
      <div className="installation-ki-card">
        <h4>Erkannte Daten</h4>

        {Object.keys(ai.detected).length === 0 && (
          <p className="detail-muted">Keine automatischen Erkennungen.</p>
        )}

        <ul className="detail-list">
          {Object.entries(ai.detected).map(([key, value]) => (
            <li key={key}>
              <span>{key}</span>
              <span>{safe(value)}</span>
            </li>
          ))}
        </ul>

        {ai.confidence != null && (
          <p className="detail-muted" style={{ marginTop: "0.5rem" }}>
            Gesamtsicherheit: <strong>{ai.confidence * 100}%</strong>
          </p>
        )}
      </div>
    </div>
  );
}

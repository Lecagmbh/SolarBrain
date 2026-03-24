import type { DashboardActivityApi } from "../../modules/dashboard/admin/types/dashboardApiTypes";
import "./quick-preview.css";

interface QuickPreviewProps {
  item: DashboardActivityApi | null;
  position: { x: number; y: number };
}

const computeDaysOld = (iso: string): number => Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));

export default function QuickPreview({ item, position }: QuickPreviewProps) {
  if (!item) return null;

  const daysOld = computeDaysOld(item.updatedAt);
  const status = (item.status || "").toLowerCase();
  
  let statusLabel = "Unbekannt";
  let statusVariant = "neutral";
  if (status.includes("entwurf")) { statusLabel = "Entwurf"; statusVariant = "neutral"; }
  else if (status.includes("prüfung") || status.includes("eingereicht")) { statusLabel = "In Prüfung"; statusVariant = "info"; }
  else if (status.includes("rückfrage")) { statusLabel = "Rückfrage"; statusVariant = "warning"; }
  else if (status.includes("genehmigt")) { statusLabel = "Genehmigt"; statusVariant = "success"; }
  else if (status.includes("abgeschlossen")) { statusLabel = "Abgeschlossen"; statusVariant = "success"; }

  const warnings: string[] = [];
  if (item.hasCriticalMissingDocuments) warnings.push("Kritische Dokumente fehlen");
  if (item.missingDocumentsCount && item.missingDocumentsCount > 0) warnings.push(`${item.missingDocumentsCount} Dokumente fehlen`);
  if (daysOld > 14) warnings.push(`${daysOld} Tage ohne Update`);

  // Adjust position to stay in viewport
  const style: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 280),
  };

  return (
    <div className="quick-preview" style={style}>
      <div className="qp-header">
        <span className="qp-id">{item.publicId || `#${item.id}`}</span>
        <span className={`badge badge-${statusVariant}`}>{statusLabel}</span>
      </div>
      
      <div className="qp-customer">{item.customerName || "Unbekannt"}</div>
      
      {item.location && <div className="qp-row"><span className="qp-label">Standort</span><span className="qp-value">{item.location}</span></div>}
      {item.gridOperator && <div className="qp-row"><span className="qp-label">Netzbetreiber</span><span className="qp-value">{item.gridOperator}</span></div>}
      <div className="qp-row"><span className="qp-label">Alter</span><span className="qp-value">{daysOld} Tage</span></div>
      
      {warnings.length > 0 && (
        <div className="qp-warnings">
          {warnings.map((w, i) => <div key={i} className="qp-warning">⚠️ {w}</div>)}
        </div>
      )}
      
      <div className="qp-footer">Klicken zum Öffnen</div>
    </div>
  );
}

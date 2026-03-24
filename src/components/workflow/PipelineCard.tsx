// Workflow V2: Einzelne Pipeline-Karte

interface PipelineInstallation {
  id: number;
  publicId: string;
  customerName: string | null;
  gridOperator: string | null;
  phase: string | null;
  zustand: string | null;
  status: string;
  priority: string | null;
  createdAt: string;
  updatedAt: string;
  nbEingereichtAm: string | null;
  nbGenehmigungAm: string | null;
}

interface PipelineCardProps {
  installation: PipelineInstallation;
  onClick: (inst: PipelineInstallation) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function PipelineCard({ installation, onClick }: PipelineCardProps) {
  return (
    <div className="pipeline-card" onClick={() => onClick(installation)}>
      <div className="pipeline-card-id">{installation.publicId}</div>
      <div className="pipeline-card-name">{installation.customerName || "Unbekannt"}</div>
      {installation.gridOperator && (
        <div className="pipeline-card-nb">{installation.gridOperator}</div>
      )}
      <div className="pipeline-card-footer">
        <span className={`pipeline-card-zustand ${installation.zustand || ""}`}>
          {installation.zustand || "–"}
        </span>
        <span className="pipeline-card-date">
          {formatDate(installation.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export type { PipelineInstallation };

// Workflow V2: Einzelne Pipeline-Spalte (Kanban)

import PipelineCard from "./PipelineCard";
import type { PipelineInstallation } from "./PipelineCard";

interface PipelineColumnProps {
  phase: string;
  label: string;
  installations: PipelineInstallation[];
  onCardClick: (inst: PipelineInstallation) => void;
}

export default function PipelineColumn({ phase, label, installations, onCardClick }: PipelineColumnProps) {
  return (
    <div className="pipeline-column">
      <div className={`pipeline-col-header phase-${phase}`}>
        <span className="pipeline-col-title">{label}</span>
        <span className="pipeline-col-count">{installations.length}</span>
      </div>
      <div className="pipeline-col-body">
        {installations.length === 0 ? (
          <div className="pipeline-col-empty">Keine Vorgänge</div>
        ) : (
          installations.map((inst) => (
            <PipelineCard key={inst.id} installation={inst} onClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
}

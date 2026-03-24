// Workflow V2: Kanban-Board mit 5 Spalten

import PipelineColumn from "./PipelineColumn";
import type { PipelineInstallation } from "./PipelineCard";

interface PipelineData {
  pipeline: Record<string, PipelineInstallation[]>;
  storniert: PipelineInstallation[];
  counts: Record<string, number>;
  total: number;
}

interface PipelineBoardProps {
  data: PipelineData | undefined;
  isLoading: boolean;
  onCardClick: (inst: PipelineInstallation) => void;
}

const PHASES: Array<{ key: string; label: string }> = [
  { key: "einreichung", label: "Einreichung" },
  { key: "genehmigung", label: "Genehmigung" },
  { key: "ibn", label: "IBN" },
  { key: "mastr", label: "MaStR" },
  { key: "fertig", label: "Fertig" },
];

export default function PipelineBoard({ data, isLoading, onCardClick }: PipelineBoardProps) {
  if (isLoading) {
    return (
      <div className="wf2-loading">
        <div className="wf2-spinner" />
        Lade Pipeline...
      </div>
    );
  }

  if (!data) {
    return <div className="wf2-error">Pipeline konnte nicht geladen werden</div>;
  }

  return (
    <div className="pipeline-board">
      {PHASES.map(({ key, label }) => (
        <PipelineColumn
          key={key}
          phase={key}
          label={label}
          installations={data.pipeline[key] || []}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}

export type { PipelineData };

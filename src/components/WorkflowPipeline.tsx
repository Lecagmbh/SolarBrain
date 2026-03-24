// =============================================================================
// Baunity Dashboard V4 - WorkflowPipeline Component
// =============================================================================

import React, { useMemo } from "react";
import {
  FileEdit,
  Send,
  Search,
  Clock,
  HelpCircle,
  CheckCircle,
  Award,
  ChevronRight,
} from "lucide-react";
import type { WorkflowPipelineProps, PipelineStage } from "../types/dashboard.types";
import { WORKFLOW_STAGES } from "../types/dashboard.types";
import { cn } from "../utils/helpers";

// -----------------------------------------------------------------------------
// Icon Mapping
// -----------------------------------------------------------------------------

const STAGE_ICONS: Record<string, React.ElementType> = {
  entwurf: FileEdit,
  eingereicht: Send,
  pruefung: Search,
  warten_nb: Clock,
  nachbesserung: HelpCircle,
  genehmigt: CheckCircle,
  abgeschlossen: Award,
};

// -----------------------------------------------------------------------------
// WorkflowPipeline Component
// -----------------------------------------------------------------------------

export const WorkflowPipeline: React.FC<WorkflowPipelineProps> = ({
  stages,
  onStageClick,
}) => {
  // Berechne Gesamtzahl und Prozentsätze
  const { total, stageData } = useMemo(() => {
    const total = stages.reduce((sum, s) => sum + s.count, 0);
    
    const stageData = WORKFLOW_STAGES.map((config) => {
      const stage = stages.find((s) => s.key === config.key);
      const count = stage?.count || 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      
      return {
        ...config,
        count,
        percentage,
        label: stage?.label || config.label,
      };
    }).filter((s) => s.count > 0 || s.key === "entwurf"); // Zeige immer Entwurf
    
    return { total, stageData };
  }, [stages]);

  if (total === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Workflow Pipeline</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          Keine aktiven Vorgänge
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">Workflow Pipeline</h3>
        <button
          onClick={() => onStageClick("all")}
          className="card-link"
        >
          Alle {total}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Pipeline Bar */}
      <div className="pipeline">
        <div className="pipeline-bar">
          {stageData.map((stage) => (
            <PipelineSegment
              key={stage.key}
              stage={stage}
              onClick={() => onStageClick(stage.key)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="pipeline-legend">
          {stageData.map((stage) => (
            <PipelineLegendItem
              key={stage.key}
              stage={stage}
              onClick={() => onStageClick(stage.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PipelineSegment Component
// -----------------------------------------------------------------------------

interface PipelineSegmentProps {
  stage: {
    key: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
  };
  onClick: () => void;
}

const PipelineSegment: React.FC<PipelineSegmentProps> = ({ stage, onClick }) => {
  if (stage.count === 0) return null;

  return (
    <div
      className="pipeline-segment"
      style={{
        width: `${Math.max(stage.percentage, 8)}%`, // Minimum 8% für Sichtbarkeit
        backgroundColor: stage.color,
      }}
      onClick={onClick}
      title={`${stage.label}: ${stage.count}`}
    >
      {stage.percentage >= 10 && stage.count}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PipelineLegendItem Component
// -----------------------------------------------------------------------------

interface PipelineLegendItemProps {
  stage: {
    key: string;
    label: string;
    count: number;
    color: string;
  };
  onClick: () => void;
}

const PipelineLegendItem: React.FC<PipelineLegendItemProps> = ({ stage, onClick }) => {

  return (
    <div
      className="pipeline-legend-item"
      onClick={onClick}
    >
      <div
        className="pipeline-legend-dot"
        style={{ backgroundColor: stage.color }}
      />
      <span>{stage.label}</span>
      <span className="pipeline-legend-count">({stage.count})</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Pipeline (Alternative Darstellung)
// -----------------------------------------------------------------------------

interface CompactPipelineProps {
  stages: PipelineStage[];
  onStageClick: (stageKey: string) => void;
}

export const CompactPipeline: React.FC<CompactPipelineProps> = ({
  stages,
  onStageClick,
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {WORKFLOW_STAGES.map((config, index) => {
        const stage = stages.find((s) => s.key === config.key);
        const count = stage?.count || 0;

        return (
          <React.Fragment key={config.key}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
                count > 0
                  ? "bg-opacity-20 hover:bg-opacity-30"
                  : "opacity-40"
              )}
              style={{
                backgroundColor: count > 0 ? `${config.color}20` : undefined,
                color: count > 0 ? config.color : undefined,
              }}
              onClick={() => onStageClick(config.key)}
              disabled={count === 0}
            >
              {React.createElement(STAGE_ICONS[config.key] || FileEdit, { className: "w-3.5 h-3.5" })}
              <span className="hidden sm:inline">{config.label}</span>
              {count > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: config.color, color: "white" }}
                >
                  {count}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Skeleton Loading State
// -----------------------------------------------------------------------------

export const WorkflowPipelineSkeleton: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="skeleton skeleton--title w-32" />
    </div>
    <div className="space-y-3">
      <div className="skeleton h-8 rounded-md" />
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton w-16 h-4" />
        ))}
      </div>
    </div>
  </div>
);

export default WorkflowPipeline;

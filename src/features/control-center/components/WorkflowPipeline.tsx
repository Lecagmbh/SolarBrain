/**
 * WORKFLOW PIPELINE COMPONENT
 * Visual representation of installation workflow stages
 * Uses inline Dashboard design system styles (no cc-* CSS classes)
 */

import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileEdit,
  ClipboardList,
  CheckCircle2,
  Building2,
  HelpCircle,
  PartyPopper,
  Flag,
} from "lucide-react";
import type { PipelineData } from "../types";

interface WorkflowPipelineProps {
  data: PipelineData;
}

// ---------- stage color map ----------

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  ENTWURF: {
    bg: "rgba(212, 168, 67, 0.15)",
    border: "rgba(212, 168, 67, 0.4)",
    text: "#EAD068",
  },
  WARTEN_AUF_DOKUMENTE: {
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#fbbf24",
  },
  BEREIT_ZUR_EINREICHUNG: {
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.4)",
    text: "#60a5fa",
  },
  BEIM_NB: {
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#fbbf24",
  },
  NB_RUECKFRAGE: {
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    text: "#f87171",
  },
  GENEHMIGT: {
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.4)",
    text: "#34d399",
  },
  FERTIG: {
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.4)",
    text: "#6ee7b7",
  },
};

const DEFAULT_COLOR = {
  bg: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.15)",
  text: "#a1a1aa",
};

// ---------- pipeline stages config ----------

const PIPELINE_STAGES = [
  { key: "ENTWURF", label: "Entwurf", icon: <FileEdit size={14} /> },
  { key: "WARTEN_AUF_DOKUMENTE", label: "Warte Doks", icon: <ClipboardList size={14} /> },
  { key: "BEREIT_ZUR_EINREICHUNG", label: "Bereit", icon: <CheckCircle2 size={14} /> },
  { key: "BEIM_NB", label: "Beim NB", icon: <Building2 size={14} /> },
  { key: "NB_RUECKFRAGE", label: "Rückfrage", icon: <HelpCircle size={14} /> },
  { key: "GENEHMIGT", label: "Genehmigt", icon: <PartyPopper size={14} /> },
  { key: "FERTIG", label: "Fertig", icon: <Flag size={14} /> },
] as const;

// ---------- static styles ----------

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "24px",
};

const headerTitleStyle: CSSProperties = {
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "var(--dash-text, #ffffff)",
  margin: 0,
};

const totalBadgeStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--dash-text-muted, #a1a1aa)",
};

const stagesContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  position: "relative",
  padding: "8px 0",
};

const stageBaseStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "pointer",
  padding: "16px 8px",
  borderRadius: "var(--dash-radius-sm, 12px)",
  transition: "all 0.3s",
  position: "relative",
};

const countStyle: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "var(--dash-text, #ffffff)",
  lineHeight: 1,
  marginBottom: "4px",
};

const labelStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "var(--dash-text-muted, #a1a1aa)",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const connectorStyle: CSSProperties = {
  position: "absolute",
  top: "40px",
  right: "-12px",
  width: "24px",
  height: "2px",
  background: "rgba(255, 255, 255, 0.08)",
  zIndex: 0,
};

// ---------- component ----------

export function WorkflowPipeline({ data }: WorkflowPipelineProps) {
  const navigate = useNavigate();
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const handleStageClick = (status: string) => {
    navigate(`/netzanmeldungen?status=${status}`);
  };

  return (
    <div>
      <div style={headerStyle}>
        <h3 style={headerTitleStyle}>Workflow Pipeline</h3>
        <span style={totalBadgeStyle}>{total} Gesamt</span>
      </div>

      <div style={stagesContainerStyle}>
        {PIPELINE_STAGES.map((stage, index) => {
          const count = data[stage.key as keyof PipelineData] || 0;
          const colors = STAGE_COLORS[stage.key] || DEFAULT_COLOR;
          const isHovered = hoveredKey === stage.key;

          const stageStyle: CSSProperties = {
            ...stageBaseStyle,
            background: isHovered ? "rgba(255, 255, 255, 0.05)" : "transparent",
          };

          const iconBoxStyle: CSSProperties = {
            width: 48,
            height: 48,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            border: `2px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
            transition: "all 0.3s",
          };

          return (
            <div
              key={stage.key}
              style={stageStyle}
              data-status={stage.key}
              onMouseEnter={() => setHoveredKey(stage.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => handleStageClick(stage.key)}
              title={`${stage.label}: ${count} Anlagen`}
            >
              <div style={iconBoxStyle}>{stage.icon}</div>
              <span style={countStyle}>{count}</span>
              <span style={labelStyle}>{stage.label}</span>

              {index < PIPELINE_STAGES.length - 1 && (
                <div style={connectorStyle} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

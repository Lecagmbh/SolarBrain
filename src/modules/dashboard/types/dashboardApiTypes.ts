export type DashboardPipelineStageKey = "draft" | "review" | "grid" | "released";

export type DashboardPipelineStage = {
  key: DashboardPipelineStageKey;
  label: string;
  count: number;
};

export type DashboardActivityApi = {
  id: number;
  publicId: string;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
  createdBy: string;
  createdByRole: string;
};

export type DashboardSummaryApi = {
  totalInstallations: number;
  openNetRegistrations: number;
  avgStartHours: number | null;
  lastActivityLabel: string | null;
  pipeline: DashboardPipelineStage[];
  activities: DashboardActivityApi[];
};

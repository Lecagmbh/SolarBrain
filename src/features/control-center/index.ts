/**
 * CONTROL CENTER
 * Unified Admin Dashboard Feature
 */

// Main Page with Tabs
export { ControlCenterPage } from "./components/ControlCenterPage";

// Original Dashboard (now used as a tab)
export { SmartDashboard } from "./components/SmartDashboard";

// Individual Components
export { KpiCard } from "./components/KpiCard";
export { WorkflowPipeline } from "./components/WorkflowPipeline";
// Deaktiviert – Alert-System wird überarbeitet
// export { AlertsPanel } from "./components/AlertsPanel";
export { ActivityFeed } from "./components/ActivityFeed";
export { QuickActions } from "./components/QuickActions";
export { LongestWaiting } from "./components/LongestWaiting";
export { InsightsPanel } from "./components/InsightsPanel";
export { PredictionsPanel } from "./components/PredictionsPanel";

// Hooks
export { useControlCenter, useQuickStats, useSystemHealth } from "./hooks/useControlCenter";

// API
export { controlCenterApi } from "./api/control-center.api";

// Types
export type * from "./types";

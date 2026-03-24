// ============================================================================
// Baunity Installation Detail V2 - Public API
// ============================================================================

// Main Component
export { default as InstallationDetailPanel } from "./InstallationDetailPanel";
export { default } from "./InstallationDetailPanel";

// Context & Hooks
export { DetailProvider, useDetail } from "./context/DetailContext";
export { useKeyboardNavigation, useCommandPalette } from "./hooks/useKeyboard";

// Types
export * from "./types";

// Utils
export * from "./utils";

// Individual Components (for customization)
export { default as Header } from "./components/Header";
export { default as Tabs } from "./components/Tabs";
export { default as CommandPalette } from "./components/CommandPalette";
export { default as SmartSidebar } from "./components/SmartSidebar";
export { default as DocumentPreview } from "./components/DocumentPreview";

// Tabs
export { default as OverviewTab } from "./tabs/OverviewTab";
export { default as DocumentsTab } from "./tabs/DocumentsTab";
export { default as EmailsTab } from "./tabs/EmailsTab";
export { default as TimelineTab } from "./tabs/TimelineTab";
export { default as DataTab } from "./tabs/DataTab";
export { default as AdminTab } from "./tabs/AdminTab";
export { default as IntelligenceTab } from "./tabs/IntelligenceTab";

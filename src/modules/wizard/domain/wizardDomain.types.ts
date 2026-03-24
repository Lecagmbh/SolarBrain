// ═══════════════════════════════════════════════════════════════════════════
// WIZARD DOMAIN TYPES - Stub/Bridge to new types
// ═══════════════════════════════════════════════════════════════════════════

// Re-export from shared types for backwards compatibility
export type {
  WizardData,
  ApplicationCategory,
  ProcessType,
  DocumentType,
  Condition,
} from "../../../shared/types";

// Legacy type aliases (if mkEngine uses different names)
export type WizardFormData = import("../../../shared/types").WizardData;
export type WizardStep = number;
export type WizardStatus = "draft" | "in_progress" | "submitted" | "complete";

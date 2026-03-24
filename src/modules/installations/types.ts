export type UploadMeta = {
  filename: string;
  contentType?: string | null;
  size?: number | null;
  url?: string | null;
};

export type Comment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type StatusHistoryEntry = {
  status: string;
  statusLabel: string;
  changedAt: string;
  changedBy: string;
};

export type EmailEntry = {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  attachments: UploadMeta[];
  score?: number;
  assigned: boolean;
};

export type InstallationSummary = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
};

/* ===============================
   TECHNIK-TYPEN
================================ */

export type TechnikStorage = {
  hersteller?: string | null;
  modell?: string | null;
  kapazitaetKwh?: number | null;
  capacityKwh?: number | null; // Wizard
  leistungKw?: number | null;
};

export type TechnikWallbox = {
  hersteller?: string | null;
  modell?: string | null;
  leistungKw?: number | null;
  powerKw?: number | null; // Wizard
};

export type TechnikHeatpump = {
  hersteller?: string | null;
  modell?: string | null;
  leistungKw?: number | null;
  powerKw?: number | null; // Wizard
  steuerbar14a?: boolean | null;
  controllable14a?: boolean | null; // Wizard
};

/* ===============================
   INSTALLATION DETAIL (🔥 WICHTIG 🔥)
================================ */

export type InstallationDetail = InstallationSummary & {
  uploads: Record<string, UploadMeta[]>;
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
  emails: EmailEntry[];
  raw: Record<string, any>;
  createdByName?: string;
  createdByEmail?: string | null;

  // ✅ DAS FEHLTE BISHER
  storage?: TechnikStorage | null;
  wallbox?: TechnikWallbox | null;
  heatpump?: TechnikHeatpump | null;

  wizardContext?: Record<string, any>;
  technicalData?: Record<string, any>;
};

export type InstallationStatusUpdatePayload = {
  status?: string;
  comment?: string;
};

export type EmailAssignmentPayload = {
  emailId: string;
  installationId: number;
};

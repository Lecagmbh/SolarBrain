/* ======================================================
   BASIS
====================================================== */

export type UserRole = "admin" | "mitarbeiter" | "kunde";

/* ======================================================
   UPLOADS / DOKUMENTE
====================================================== */

export type DocumentCategory =
  | "antrag"
  | "lageplan"
  | "schaltplan"
  | "datenblatt"
  | "vertrag"
  | "korrespondenz"
  | "sonstiges";

export type UploadMeta = {
  id?: string;
  filename: string;
  url?: string;
  contentType?: string | null;
  size?: number | null;
  uploadedAt?: string;
  category?: string;
};

export type UploadProgress = {
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
};

/* 👉 bewusst STRING-Index, weil Code mit string arbeitet */
export const DOCUMENT_CATEGORIES: Record<
  string,
  {
    label: string;
    required?: boolean;
    color: string;
    description?: string;
  }
> = {
  antrag: {
    label: "Antrag",
    required: true,
    color: "#3b82f6",
    description: "Antragsunterlagen",
  },
  lageplan: {
    label: "Lageplan",
    required: true,
    color: "#EAD068",
    description: "Lageplan der Anlage",
  },
  schaltplan: {
    label: "Schaltplan",
    required: true,
    color: "#f59e0b",
    description: "Elektrischer Schaltplan",
  },
  datenblatt: {
    label: "Datenblatt",
    color: "#22c55e",
    description: "Technische Datenblätter",
  },
  vertrag: {
    label: "Vertrag",
    color: "#D4A843",
  },
  korrespondenz: {
    label: "Korrespondenz",
    color: "#0ea5e9",
  },
  sonstiges: {
    label: "Sonstige",
    color: "#94a3b8",
  },
};

/* ======================================================
   EMAILS / KOMMENTARE
====================================================== */

export type Email = {
  id: string;
  subject?: string;
  from?: string;
  fromAddress?: string;
  fromName?: string;
  receivedAt?: string;
  snippet?: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  isRead?: boolean;
  assigned?: boolean;
  score?: number;
  attachments?: UploadMeta[];
};

export type Comment = {
  id: string;
  author: string;
  authorEmail?: string;
  authorRole?: UserRole;
  message: string;
  isInternal?: boolean;
  createdAt: string;
};

/* ======================================================
   STATUS
====================================================== */

export type InstallationStatus =
  | "entwurf"
  | "eingegangen"
  | "in_pruefung"
  | "beim_netzbetreiber"
  | "freigegeben"
  | "abgeschlossen"
  | "storniert";

export const STATUS_ORDER: InstallationStatus[] = [
  "entwurf",
  "eingegangen",
  "in_pruefung",
  "beim_netzbetreiber",
  "freigegeben",
  "abgeschlossen",
  "storniert",
];

export const STATUS_CONFIG: Record<
  InstallationStatus,
  {
    label: string;
    color: string;
    icon: string;
    description?: string;
  }
> = {
  entwurf: { label: "Entwurf", color: "gray", icon: "📝" },
  eingegangen: { label: "Eingegangen", color: "blue", icon: "📥" },
  in_pruefung: { label: "In Prüfung", color: "orange", icon: "🔍" },
  beim_netzbetreiber: { label: "Beim Netzbetreiber", color: "purple", icon: "🏢" },
  freigegeben: { label: "Freigegeben", color: "green", icon: "✅" },
  abgeschlossen: { label: "Abgeschlossen", color: "green", icon: "🏁" },
  storniert: { label: "Storniert", color: "red", icon: "❌" },
};

/* ======================================================
   TABS
====================================================== */

export type TabKey =
  | "overview"
  | "documents"
  | "emails"
  | "communication"
  | "timeline"
  | "data"
  | "intelligence"
  | "admin";

export const TABS: {
  key: TabKey;
  label: string;
  icon: string;
  shortcut?: string;
  adminOnly?: boolean;
}[] = [
  { key: "overview", label: "Übersicht", icon: "📊" },
  { key: "documents", label: "Dokumente", icon: "📁", shortcut: "D" },
  { key: "emails", label: "E-Mails", icon: "✉️", shortcut: "E" },
  { key: "communication", label: "Kommunikation", icon: "💬", shortcut: "K" },
  { key: "timeline", label: "Timeline", icon: "🕒" },
  { key: "data", label: "Daten", icon: "📄" },
  { key: "intelligence", label: "KI", icon: "🧠", shortcut: "I" },
  { key: "admin", label: "Admin", icon: "🛠️", adminOnly: true },
];

/* ======================================================
   TECHNIK
====================================================== */

export type TechnikStorage = {
  hersteller?: string | null;
  modell?: string | null;
  kapazitaetKwh?: number | null;
};

export type TechnikWallbox = {
  hersteller?: string | null;
  modell?: string | null;
  leistungKw?: number | null;
};

export type TechnikHeatpump = {
  hersteller?: string | null;
  modell?: string | null;
  leistungKw?: number | null;
  steuerbar14a?: boolean | null;
};

/* ======================================================
   INSTALLATION DETAIL
====================================================== */

export type InstallationDetail = {
  id: number;
  customerName?: string;
  location?: string;
  gridOperator?: string | null;

  status: InstallationStatus;
  statusLabel?: string;

  createdAt?: string;
  updatedAt?: string;

  createdByName?: string;
  createdByEmail?: string | null;

  wizardContext?: Record<string, any>;
  technicalData?: Record<string, any>;

  uploads?: Record<string, UploadMeta[]>;
  documents?: UploadMeta[];
  comments?: Comment[];
  statusHistory?: any[];
  emails?: Email[];

  raw?: Record<string, any>;

  storage?: TechnikStorage | null;
  wallbox?: TechnikWallbox | null;
  heatpump?: TechnikHeatpump | null;
};

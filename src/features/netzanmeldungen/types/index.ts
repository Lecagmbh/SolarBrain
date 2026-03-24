/**
 * NETZANMELDUNGEN ENTERPRISE - COMPLETE TYPE DEFINITIONS
 * Version 2.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type InstallationStatus =
  | "eingang"      // Neu vom Kunden (Wizard abgeschlossen)
  | "beim_nb"      // Beim Netzbetreiber eingereicht
  | "rueckfrage"   // NB hat Rückfragen (AKTION NÖTIG!)
  | "genehmigt"    // Einspeisezusage vom NB erhalten
  | "ibn"          // Inbetriebnahme-Protokoll erstellen
  | "fertig"       // Komplett abgeschlossen
  | "storniert";   // Abgebrochen

export type CaseType = 
  | "PV_PRIVATE" 
  | "PV_COMMERCIAL" 
  | "PV_WITH_STORAGE" 
  | "PV_WITH_STORAGE_WALLBOX" 
  | "STORAGE_RETROFIT" 
  | "WALLBOX" 
  | "HEAT_PUMP";

export type Priority = "critical" | "high" | "medium" | "low";

export interface InstallationListItem {
  id: number;
  publicId: string;
  customerName: string;
  status: InstallationStatus;
  caseType?: CaseType;
  gridOperator?: string;
  gridOperatorId?: number;
  gridOperatorEmail?: string;
  nbCaseNumber?: string;
  location?: string;
  plz?: string;
  zipCode?: string;
  ort?: string;
  strasse?: string;
  hausNr?: string;
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  contactPhone?: string;
  totalKwp?: number;
  estimatedValue?: number;
  assignedToId?: number;
  assignedToName?: string;
  deadline?: string;
  lastActivity?: string;
  documentsCount?: number;
  commentsCount?: number;
  hasWarnings?: boolean;
  isPinned?: boolean;
  // Ersteller-Informationen
  createdById?: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByCompany?: string; // 🔥 NEU: Firma des Erstellers
  // Zählerwechsel
  zaehlerwechselDatum?: string;
  zaehlerwechselKundeInformiert?: boolean;
  zaehlerwechselUhrzeit?: string;
  zaehlerwechselKommentar?: string;
  // NB-Tracking (nbCaseNumber already defined above)
  nbPortalUrl?: string;
  nbEmail?: string;
  nbEingereichtAm?: string;
  nbGenehmigungAm?: string;
  // Berechnete Felder für Sortierung
  daysOld?: number;      // Tage seit Erstellung
  daysAtNb?: number;     // Tage beim Netzbetreiber
  // Workflow
  currentChecklistProgress?: number;
  daysInCurrentStatus?: number;
  isOverdue?: boolean;
  nextAction?: string;
  // Billing
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceStatus?: 'ENTWURF' | 'OFFEN' | 'BEZAHLT' | 'STORNIERT' | 'VERSENDET' | 'UEBERFAELLIG' | 'MAHNUNG';
  invoiceDate?: string;
  invoiceAmount?: number;
  isBilled?: boolean;
}

export interface InstallationDetail extends InstallationListItem {
  // Customer Data
  customer?: CustomerData;
  kundeId?: number;
  
  // Location Data
  locationData?: LocationData;
  
  // Technical Data
  technicalData?: TechnicalData;
  
  // Related Data
  documents?: Document[];
  comments?: Comment[];
  timeline?: TimelineEntry[];
  tasks?: Task[];
  emails?: EmailRecord[];
  checklist?: ChecklistItem[];
  
  // Wizard Context (legacy)
  wizardContext?: string;
  
  // Meta
  createdById?: number;
  createdByName?: string;
  createdByEmail?: string;
  lastModifiedById?: number;
  lastModifiedByName?: string;
  // Anmeldungsdaten
  zaehlernummer?: string;
  messkonzept?: string;
  geplantesIBNDatum?: string;
  zaehlerwechselDatum?: string;
  zaehlerwechselUhrzeit?: string;
  zaehlerwechselKommentar?: string;
  zaehlerwechselKundeInformiert?: boolean;
  // Reminder
  reminderCount?: number;
  lastReminderAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER & LOCATION
// ═══════════════════════════════════════════════════════════════════════════

export interface CustomerData {
  id?: number;
  anrede?: string;
  vorname?: string;
  nachname?: string;
  firma?: string;
  email?: string;
  telefon?: string;
  mobiltelefon?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  land?: string;
  geburtsdatum?: string;
  steuernummer?: string;
  ustIdNr?: string;
  iban?: string;
  bankname?: string;
  notizen?: string;
}

export interface LocationData {
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  bundesland?: string;
  land?: string;
  gemarkung?: string;
  flurstueck?: string;
  latitude?: number;
  longitude?: number;
  eigentuemer?: string;
  eigentuemerZustimmung?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface TechnicalData {
  // PV
  pvModules?: PVModule[];
  totalPvKwPeak?: number;
  
  // Inverter
  inverters?: Inverter[];
  totalInverterKw?: number;
  
  // Storage
  storage?: StorageSystem[];
  totalStorageKwh?: number;
  
  // Wallbox
  wallbox?: Wallbox[];
  
  // Heat Pump
  heatPump?: HeatPump[];
  
  // Grid Connection
  gridConnection?: {
    existingFuse?: number;
    requestedFuse?: number;
    meterNumber?: string;
    meterType?: string;
    feedInType?: string; // Volleinspeisung, Überschuss, etc.
  };
  
  // Messkonzept
  messkonzept?: string;
}

export interface PVModule {
  id?: string;
  manufacturer?: string;
  model?: string;
  powerWp?: number;
  count?: number;
  orientation?: string;
  tilt?: number;
  area?: number;
  datasheetUrl?: string;
}

export interface Inverter {
  id?: string;
  manufacturer?: string;
  model?: string;
  powerKw?: number;
  count?: number;
  type?: string; // String, Hybrid, etc.
  datasheetUrl?: string;
}

export interface StorageSystem {
  id?: string;
  manufacturer?: string;
  model?: string;
  capacityKwh?: number;
  powerKw?: number;
  count?: number;
  datasheetUrl?: string;
}

export interface Wallbox {
  id?: string;
  manufacturer?: string;
  model?: string;
  powerKw?: number;
  count?: number;
  datasheetUrl?: string;
}

export interface HeatPump {
  id?: string;
  manufacturer?: string;
  model?: string;
  powerKw?: number;
  type?: string;
  datasheetUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════

export type DocumentCategory = 
  | "lageplan" 
  | "schaltplan" 
  | "datenblatt_module" 
  | "datenblatt_wechselrichter" 
  | "datenblatt_speicher"
  | "datenblatt_wallbox"
  | "messkonzept"
  | "vollmacht"
  | "bestaetigung_nb"
  | "anmeldeformular"
  | "rechnung"
  | "foto"
  | "sonstiges";

export interface Document {
  id: number;
  installationId: number;
  kategorie: DocumentCategory;
  dokumentTyp?: string | null;
  dateiname: string;
  originalName: string;
  dateityp: string;
  dateigroesse: number;
  speicherpfad: string;
  url: string;
  status: string;
  uploadedById?: number;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  isRequired?: boolean;
  // Additional fields from DokumentenCenter
  size?: number;
  contentType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMENTS & TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

export interface Comment {
  id: number;
  installationId: number;
  text: string;
  authorId: number;
  authorName: string;
  authorEmail?: string;
  isInternal?: boolean;
  createdAt: string;
  updatedAt?: string;
  attachments?: string[];
}

export type TimelineEventType =
  | "created"
  | "status_changed"
  | "document_uploaded"
  | "document_deleted"
  | "comment_added"
  | "email_sent"
  | "email_received"
  | "assigned"
  | "unassigned"
  | "deadline_set"
  | "deadline_changed"
  | "customer_updated"
  | "technical_updated"
  | "gridoperator_assigned"
  | "checklist_completed"
  | "task_created"
  | "task_completed"
  | "manual_note"
  | "system_event"
  // Workflow V2 Event Types
  | "phase_changed"
  | "zustand_changed"
  | "nb_response_received"
  | "automation_executed"
  | "error_occurred"
  | "storniert"
  | "inbox_item_created";

export interface TimelineEntry {
  id: number;
  installationId: number;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  userId?: number;
  userName?: string;
  isAutomatic: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW & CHECKLISTS
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusTransition {
  from: InstallationStatus;
  to: InstallationStatus;
  label: string;
  requiresReason?: boolean;
  requiresChecklist?: boolean;
  autoActions?: AutoAction[];
}

export interface AutoAction {
  type: "send_email" | "create_task" | "create_invoice" | "notify_user" | "update_field";
  config: Record<string, any>;
}

export interface ChecklistItem {
  id: string;
  status: InstallationStatus;
  label: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedById?: number;
  completedByName?: string;
  order: number;
}

export interface StatusChangeReason {
  id: string;
  fromStatus: InstallationStatus;
  toStatus: InstallationStatus;
  reason: string;
  isStandard: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// GRID OPERATOR (NETZBETREIBER)
// ═══════════════════════════════════════════════════════════════════════════

export interface GridOperator {
  id: number;
  name: string;
  shortName?: string;
  
  // Contact
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  portalUrl?: string;
  
  // Address
  strasse?: string;
  plz?: string;
  ort?: string;
  
  // PLZ Coverage
  plzRanges?: string[]; // ["60000-60999", "61000-61999"]
  plzList?: string[]; // Explicit list
  
  // Contacts
  contacts?: GridOperatorContact[];
  
  // Settings
  avgProcessingDays?: number;
  preferredSubmissionMethod?: "portal" | "email" | "mail";
  notes?: string;
  documentRequirements?: string[];
  specialInstructions?: string;
  
  // Stats
  activeInstallations?: number;
  completedInstallations?: number;
  approvalRate?: number;
  
  // Meta
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GridOperatorContact {
  id: number;
  gridOperatorId: number;
  nbCaseNumber?: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  isMain?: boolean;
  notes?: string;
}

export interface PlzMapping {
  id?: number;
  plz: string;
  gridOperatorId: number;
  nbCaseNumber?: string;
  gridOperatorName?: string;
  confidence: number; // 0-100
  source: "manual" | "auto" | "import";
  lastUsed?: string;
  usageCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  triggerStatus?: InstallationStatus; // Auto-send on this status
  recipientType: "customer" | "gridoperator" | "internal" | "custom";
  isActive: boolean;
  variables: string[]; // Available placeholders
  attachDocumentCategories?: DocumentCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailRecord {
  id: number;
  installationId: number;
  templateId?: number;
  templateName?: string;
  
  // Email Data
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  
  // Attachments
  attachments?: EmailAttachment[];
  
  // Status
  status: "draft" | "queued" | "sent" | "failed" | "bounced";
  sentAt?: string;
  error?: string;
  
  // Tracking
  openedAt?: string;
  clickedAt?: string;
  
  // Meta
  sentById?: number;
  sentByName?: string;
  createdAt: string;
}

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType: string;
  size: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASKS & TEAM
// ═══════════════════════════════════════════════════════════════════════════

export interface Task {
  id: number;
  installationId?: number;
  title: string;
  description?: string;
  
  // Assignment
  assignedToId?: number;
  assignedToName?: string;
  createdById: number;
  createdByName: string;
  
  // Timing
  dueDate?: string;
  reminderDate?: string;
  completedAt?: string;
  
  // Status
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority: Priority;
  
  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  
  // Stats
  activeInstallations: number;
  completedThisMonth: number;
  avgProcessingDays: number;
  
  // Workload
  currentWorkload: number; // 0-100
  maxCapacity: number;
  
  isActive: boolean;
}

export interface Assignment {
  id: number;
  installationId: number;
  userId: number;
  userName: string;
  assignedById: number;
  assignedByName: string;
  assignedAt: string;
  unassignedAt?: string;
  note?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS & KPIs
// ═══════════════════════════════════════════════════════════════════════════

export interface KPIData {
  // Counts
  total: number;
  byStatus: Record<InstallationStatus, number>;
  byCaseType: Record<CaseType, number>;
  byPriority: Record<Priority, number>;
  
  // Alerts
  critical: number;
  overdue: number;
  needsAction: number;
  
  // Time-based
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  trend: number; // Percentage change
  
  // Performance
  avgProcessingDays: number;
  avgDaysPerStatus: Record<InstallationStatus, number>;
  
  // Value
  pipelineValue: number;
  completedValue: number;
  
  // By Grid Operator
  byGridOperator: Array<{
    name: string;
    count: number;
    avgDays: number;
    overdueCount: number;
  }>;
  
  // By Team Member
  byTeamMember: Array<{
    id: number;
    name: string;
    active: number;
    completed: number;
    avgDays: number;
  }>;
}

export interface AnalyticsReport {
  period: "week" | "month" | "quarter" | "year" | "custom";
  startDate: string;
  endDate: string;
  
  // Summary
  totalCreated: number;
  totalCompleted: number;
  totalCancelled: number;
  completionRate: number;
  
  // Trends
  createdByDay: Array<{ date: string; count: number }>;
  completedByDay: Array<{ date: string; count: number }>;
  
  // Breakdown
  byStatus: Record<InstallationStatus, number>;
  byGridOperator: Array<{ name: string; count: number; value: number }>;
  byTeamMember: Array<{ name: string; completed: number; avgDays: number }>;
  
  // Performance
  avgProcessingTime: number;
  bottlenecks: Array<{ status: InstallationStatus; avgDays: number; count: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════════════════

export type ViewMode = "grid" | "kanban" | "table" | "timeline";
export type GroupBy = "none" | "gridOperator" | "status" | "priority" | "plzRegion" | "assignedTo" | "caseType" | "workPriority";

// Work Priority Groups - für die neue Hauptansicht
export type WorkPriorityGroup =
  | "action_required"    // 🔴 JETZT ERLEDIGEN - Rückfragen, überfällig
  | "waiting_nb"         // 🟡 WARTEN AUF NB - beim NB eingereicht
  | "approved_pending"   // 🟢 GENEHMIGT - IBN ausstehend
  | "meter_change"       // 📅 ZÄHLERWECHSEL TERMINE
  | "completed";         // ✅ FERTIG
export type SortBy = "priority" | "createdAt" | "updatedAt" | "customerName" | "gridOperator" | "status" | "value" | "deadline" | "daysOld" | "daysAtNb" | "plz" | "smart";
export type SortOrder = "asc" | "desc";

export interface SavedView {
  id: string;
  name: string;
  icon?: string;
  state: {
    viewMode: ViewMode;
    groupBy: GroupBy;
    sortBy: SortBy;
    sortOrder: SortOrder;
    statusFilter: InstallationStatus[];
    gridOperatorFilter: string[];
    priorityFilter: Priority[];
  };
  isDefault?: boolean;
  isSystem?: boolean;
  createdAt: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface GroupedItems {
  key: string;
  label: string;
  color?: string;
  icon?: string;
  items: InstallationListItem[];
  criticalCount: number;
  overdueCount: number;
  totalValue: number;
  isCollapsed?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors?: Array<{ id: number; error: string }>;
}

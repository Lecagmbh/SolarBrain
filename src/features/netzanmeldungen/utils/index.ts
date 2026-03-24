/**
 * NETZANMELDUNGEN ENTERPRISE - UTILITIES
 * Version 2.0
 */

import type {
  InstallationListItem,
  InstallationStatus,
  Priority,
  SortBy,
  SortOrder,
  GroupBy,
  GroupedItems,
  ChecklistItem,
  StatusTransition,
  CaseType,
  WorkPriorityGroup
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusConfig {
  key: InstallationStatus;
  label: string;
  color: string;
  bg: string;
  icon: string;
  priority: number;
  description: string;
}

export const STATUS_CONFIG: Record<InstallationStatus, StatusConfig> = {
  eingang: {
    key: "eingang",
    label: "Eingang",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
    icon: "⚡",
    priority: 1,
    description: "Neu vom Kunden (Wizard abgeschlossen)"
  },
  beim_nb: {
    key: "beim_nb",
    label: "Beim NB",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: "⏳",
    priority: 2,
    description: "Beim Netzbetreiber eingereicht, warten auf Antwort"
  },
  rueckfrage: {
    key: "rueckfrage",
    label: "Rückfrage",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    icon: "⚠️",
    priority: 3,
    description: "NB hat Rückfragen per E-Mail - AKTION NÖTIG!"
  },
  genehmigt: {
    key: "genehmigt",
    label: "Genehmigt",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    icon: "✅",
    priority: 4,
    description: "Einspeisezusage vom NB erhalten"
  },
  ibn: {
    key: "ibn",
    label: "IBN",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.15)",
    icon: "📋",
    priority: 5,
    description: "Inbetriebnahme-Protokoll muss erstellt werden"
  },
  fertig: {
    key: "fertig",
    label: "Fertig",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    icon: "🎉",
    priority: 6,
    description: "Komplett abgeschlossen"
  },
  storniert: {
    key: "storniert",
    label: "Storniert",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.15)",
    icon: "❌",
    priority: 0,
    description: "Abgebrochene Anmeldung"
  },
};

export function getStatusConfig(status?: string): StatusConfig {
  const defaultConfig = STATUS_CONFIG.eingang;
  if (!status) return defaultConfig;
  
  // Normalize: lowercase and replace dashes/spaces with underscores
  const key = status.toLowerCase().replace(/[-\s]/g, "_") as InstallationStatus;
  
  const config = STATUS_CONFIG[key];
  if (!config) {
    console.warn(`Unknown status: ${status} (normalized: ${key})`);
    return defaultConfig;
  }
  
  return config;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS TRANSITIONS (WORKFLOW)
// ═══════════════════════════════════════════════════════════════════════════

export const STATUS_TRANSITIONS: StatusTransition[] = [
  // From Eingang - Neu vom Kunden
  { from: "eingang", to: "beim_nb", label: "An NB senden", requiresChecklist: true, autoActions: [{ type: "send_email", config: { template: "nb_submission" } }] },
  { from: "eingang", to: "storniert", label: "Stornieren", requiresReason: true },

  // From Beim NB - Warten auf Antwort
  { from: "beim_nb", to: "genehmigt", label: "Genehmigung erhalten", autoActions: [{ type: "send_email", config: { template: "genehmigung" } }] },
  { from: "beim_nb", to: "rueckfrage", label: "Rückfrage vom NB", requiresReason: true, autoActions: [{ type: "send_email", config: { template: "rueckfrage" } }] },
  { from: "beim_nb", to: "storniert", label: "Stornieren", requiresReason: true },

  // From Rückfrage - NB hat Fragen (AKTION NÖTIG!)
  { from: "rueckfrage", to: "beim_nb", label: "Erneut an NB" },
  { from: "rueckfrage", to: "storniert", label: "Stornieren", requiresReason: true },

  // From Genehmigt - Einspeisezusage erhalten
  { from: "genehmigt", to: "ibn", label: "Zur IBN", autoActions: [{ type: "create_invoice", config: {} }] },
  { from: "genehmigt", to: "rueckfrage", label: "Rückfrage", requiresReason: true },
  { from: "genehmigt", to: "storniert", label: "Stornieren", requiresReason: true },

  // From IBN - Inbetriebnahme-Protokoll
  { from: "ibn", to: "fertig", label: "Abschließen", requiresChecklist: true },
  { from: "ibn", to: "rueckfrage", label: "Rückfrage", requiresReason: true },
  { from: "ibn", to: "storniert", label: "Stornieren", requiresReason: true },

  // From Fertig - Komplett abgeschlossen
  { from: "fertig", to: "ibn", label: "Wieder öffnen", requiresReason: true },

  // Re-open storniert
  { from: "storniert", to: "eingang", label: "Reaktivieren", requiresReason: true },
];

export function getAvailableTransitions(currentStatus: InstallationStatus): StatusTransition[] {
  // Normalize status: EINGANG → eingang, beim-nb → beim_nb
  const normalizedStatus = (currentStatus || "eingang")
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/ /g, "_")
    .replace(/ü/g, "ue")
    .replace(/ä/g, "ae")
    .trim() as InstallationStatus;

  return STATUS_TRANSITIONS.filter(t => t.from === normalizedStatus);
}

export function canTransition(from: InstallationStatus, to: InstallationStatus): boolean {
  const normalizedFrom = from.toLowerCase().replace(/-/g, "_").replace(/ /g, "_").replace(/ä/g, "ae") as InstallationStatus;
  const normalizedTo = to.toLowerCase().replace(/-/g, "_").replace(/ /g, "_").replace(/ä/g, "ae") as InstallationStatus;

  return STATUS_TRANSITIONS.some(t => t.from === normalizedFrom && t.to === normalizedTo);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLISTS PER STATUS
// ═══════════════════════════════════════════════════════════════════════════

export const STATUS_CHECKLISTS: Record<InstallationStatus, Omit<ChecklistItem, "isCompleted" | "completedAt" | "completedById" | "completedByName">[]> = {
  eingang: [
    { id: "customer_data", status: "eingang", label: "Kundendaten vollständig", isRequired: true, order: 1 },
    { id: "location_data", status: "eingang", label: "Standortdaten vollständig", isRequired: true, order: 2 },
    { id: "technical_data", status: "eingang", label: "Technische Daten erfasst", isRequired: true, order: 3 },
    { id: "vollmacht", status: "eingang", label: "Vollmacht vorhanden", isRequired: true, order: 4 },
    { id: "lageplan", status: "eingang", label: "Lageplan hochgeladen", isRequired: true, order: 5 },
    { id: "nb_identified", status: "eingang", label: "Netzbetreiber zugeordnet", isRequired: true, order: 6 },
  ],
  beim_nb: [
    { id: "submitted_to_nb", status: "beim_nb", label: "An NB gesendet", isRequired: true, order: 1 },
    { id: "confirmation_saved", status: "beim_nb", label: "Eingangsbestätigung gespeichert", isRequired: false, order: 2 },
  ],
  rueckfrage: [
    { id: "issue_identified", status: "rueckfrage", label: "Rückfrage dokumentiert", isRequired: true, order: 1 },
    { id: "customer_contacted", status: "rueckfrage", label: "Kunde kontaktiert (falls nötig)", isRequired: false, order: 2 },
    { id: "correction_done", status: "rueckfrage", label: "Antwort vorbereitet", isRequired: true, order: 3 },
  ],
  genehmigt: [
    { id: "approval_saved", status: "genehmigt", label: "Einspeisezusage gespeichert", isRequired: true, order: 1 },
    { id: "customer_informed", status: "genehmigt", label: "Kunde informiert", isRequired: true, order: 2 },
  ],
  ibn: [
    { id: "ibn_scheduled", status: "ibn", label: "IBN-Termin geplant", isRequired: true, order: 1 },
    { id: "ibn_protocol", status: "ibn", label: "IBN-Protokoll erstellt", isRequired: true, order: 2 },
    { id: "ibn_submitted", status: "ibn", label: "IBN an NB gemeldet", isRequired: true, order: 3 },
    { id: "invoice_created", status: "ibn", label: "Rechnung erstellt", isRequired: false, order: 4 },
  ],
  fertig: [],
  storniert: [],
};

export function getChecklistForStatus(status: InstallationStatus): ChecklistItem[] {
  const templates = STATUS_CHECKLISTS[status] || [];
  return templates.map(t => ({
    ...t,
    isCompleted: false,
    completedAt: undefined,
    completedById: undefined,
    completedByName: undefined,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// CASE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const CASE_TYPE_CONFIG: Record<CaseType, { label: string; color: string; icon: string }> = {
  PV_PRIVATE: { label: "PV Privat", color: "#fbbf24", icon: "🏠" },
  PV_COMMERCIAL: { label: "PV Gewerbe", color: "#f59e0b", icon: "🏢" },
  PV_WITH_STORAGE: { label: "PV + Speicher", color: "#22c55e", icon: "🔋" },
  PV_WITH_STORAGE_WALLBOX: { label: "PV + Speicher + WB", color: "#EAD068", icon: "⚡" },
  STORAGE_RETROFIT: { label: "Speicher Nachrüstung", color: "#06b6d4", icon: "🔋" },
  WALLBOX: { label: "Wallbox", color: "#ec4899", icon: "🚗" },
  HEAT_PUMP: { label: "Wärmepumpe", color: "#f97316", icon: "🔥" },
};

export function getCaseTypeConfig(caseType?: CaseType) {
  if (!caseType) return CASE_TYPE_CONFIG.PV_PRIVATE;
  return CASE_TYPE_CONFIG[caseType] || CASE_TYPE_CONFIG.PV_PRIVATE;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORK PRIORITY GROUPS (für die neue Hauptansicht)
// ═══════════════════════════════════════════════════════════════════════════

export interface WorkPriorityConfig {
  key: WorkPriorityGroup;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  description: string;
  order: number;
}

export const WORK_PRIORITY_CONFIG: Record<WorkPriorityGroup, WorkPriorityConfig> = {
  action_required: {
    key: "action_required",
    label: "JETZT ERLEDIGEN",
    emoji: "🔴",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    description: "Rückfragen, überfällige Anmeldungen - sofortiger Handlungsbedarf",
    order: 1,
  },
  waiting_nb: {
    key: "waiting_nb",
    label: "WARTEN AUF NB",
    emoji: "🟡",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    description: "Beim Netzbetreiber eingereicht, warten auf Antwort",
    order: 2,
  },
  approved_pending: {
    key: "approved_pending",
    label: "GENEHMIGT - IBN AUSSTEHEND",
    emoji: "🟢",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    description: "Einspeisezusage erhalten, Inbetriebnahme steht aus",
    order: 3,
  },
  meter_change: {
    key: "meter_change",
    label: "ZÄHLERWECHSEL TERMINE",
    emoji: "📅",
    color: "#EAD068",
    bg: "rgba(139,92,246,0.15)",
    description: "Zählerwechsel-Termine in den nächsten 14 Tagen",
    order: 4,
  },
  completed: {
    key: "completed",
    label: "FERTIG",
    emoji: "✅",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    description: "Vollständig abgeschlossene Anmeldungen",
    order: 5,
  },
};

export function getWorkPriorityConfig(group: WorkPriorityGroup): WorkPriorityConfig {
  return WORK_PRIORITY_CONFIG[group];
}

/**
 * Bestimmt die Work-Priority-Gruppe für eine Installation
 */
export function getWorkPriorityGroup(item: InstallationListItem): WorkPriorityGroup {
  const status = (item.status || "eingang").toLowerCase().replace(/-/g, "_");
  const days = getDaysOld(item.createdAt);

  // 1. RUECKFRAGE = sofortige Aktion nötig
  if (status === "rueckfrage") {
    return "action_required";
  }

  // 2. Überfällig (mehr als 14 Tage, nicht beim NB oder fertig)
  if (!["beim_nb", "fertig", "storniert", "genehmigt"].includes(status) && days > 14) {
    return "action_required";
  }

  // 3. BEIM_NB = Warten auf Netzbetreiber
  if (status === "beim_nb") {
    return "waiting_nb";
  }

  // 4. GENEHMIGT oder IBN = Genehmigt, IBN ausstehend
  if (status === "genehmigt" || status === "ibn") {
    return "approved_pending";
  }

  // 5. Zählerwechsel-Termin in den nächsten 14 Tagen?
  if (item.zaehlerwechselDatum) {
    const daysUntil = getDaysUntil(item.zaehlerwechselDatum);
    if (daysUntil >= 0 && daysUntil <= 14) {
      return "meter_change";
    }
  }

  // 6. FERTIG oder STORNIERT = Abgeschlossen
  if (status === "fertig" || status === "storniert") {
    return "completed";
  }

  // 7. Alles andere (EINGANG) = Aktion erforderlich
  return "action_required";
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export interface PriorityConfig {
  key: Priority;
  label: string;
  color: string;
  bg: string;
  icon: string;
  order: number;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  critical: { key: "critical", label: "Kritisch", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "🔴", order: 4 },
  high: { key: "high", label: "Hoch", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "🟠", order: 3 },
  medium: { key: "medium", label: "Mittel", color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: "🔵", order: 2 },
  low: { key: "low", label: "Niedrig", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "🟢", order: 1 },
};

export function getPriorityConfig(priority: Priority): PriorityConfig {
  return PRIORITY_CONFIG[priority];
}

export function computePriority(item: InstallationListItem): Priority {
  let score = 0;

  const status = (item.status || "eingang").toLowerCase().replace(/-/g, "_");

  // Status-based priority
  if (status === "rueckfrage") score += 100;  // Höchste Prio - Aktion nötig!
  else if (status === "eingang") score += 40;
  else if (status === "ibn") score += 30;
  
  // Age-based priority
  const daysOld = getDaysOld(item.createdAt);
  if (daysOld > 30) score += 50;
  else if (daysOld > 14) score += 25;
  else if (daysOld > 7) score += 10;
  
  // Missing grid operator
  if (!item.gridOperator) score += 20;
  
  // Has warnings
  if (item.hasWarnings) score += 15;
  
  // Overdue deadline
  if (item.deadline && new Date(item.deadline) < new Date()) score += 60;
  
  // Value-based (higher value = higher priority)
  const value = item.estimatedValue || (item.totalKwp || 0) * 1500;
  if (value > 50000) score += 20;
  else if (value > 20000) score += 10;
  
  if (score >= 100) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

// ═══════════════════════════════════════════════════════════════════════════
// SORTING & FILTERING
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_SORT_ORDER: Record<string, number> = {
  rueckfrage: 6,  // Höchste Prio - Aktion nötig!
  eingang: 5,
  beim_nb: 4,
  genehmigt: 3,
  ibn: 2,
  fertig: 1,
  storniert: 0,
};

/**
 * Berechnet einen "Smart Score" für intelligente Sortierung
 * Höherer Score = braucht mehr Aufmerksamkeit
 */
function computeSmartScore(item: InstallationListItem): number {
  let score = 0;
  const status = (item.status || "eingang").toLowerCase().replace(/-/g, "_");
  const daysOld = item.daysOld || 0;
  const daysAtNb = item.daysAtNb || 0;

  // Rückfragen haben höchste Priorität (+1000)
  if (status === "rueckfrage") {
    score += 1000 + daysOld * 10; // Je älter, desto dringender
  }
  // Eingang: Sollte schnell bearbeitet werden
  else if (status === "eingang") {
    score += 500 + daysOld * 5;
    if (daysOld > 7) score += 200; // Überfällig
    if (daysOld > 14) score += 300;
  }
  // Beim NB: Lange Wartezeit = nachfassen
  else if (status === "beim_nb") {
    score += 100 + daysAtNb * 3;
    if (daysAtNb > 14) score += 150; // Lange beim NB
    if (daysAtNb > 30) score += 250;
  }
  // Genehmigt: IBN ausstehend
  else if (status === "genehmigt") {
    score += 80 + daysOld * 2;
  }
  // IBN: Fast fertig
  else if (status === "ibn") {
    score += 50 + daysOld;
  }
  // Fertig/Storniert: Niedrigste Priorität
  else {
    score += 0;
  }

  return score;
}

export function sortItems(
  items: InstallationListItem[],
  sortBy: SortBy,
  sortOrder: SortOrder,
  pinnedIds?: Set<number>
): InstallationListItem[] {
  return [...items].sort((a, b) => {
    // Pinned items always first
    if (pinnedIds) {
      if (pinnedIds.has(a.id) && !pinnedIds.has(b.id)) return -1;
      if (!pinnedIds.has(a.id) && pinnedIds.has(b.id)) return 1;
    }

    let cmp = 0;

    switch (sortBy) {
      case "smart":
        // Intelligente Sortierung: Kombination aus Status, Alter und Dringlichkeit
        cmp = computeSmartScore(b) - computeSmartScore(a);
        break;

      case "priority":
        cmp = PRIORITY_CONFIG[computePriority(b)].order - PRIORITY_CONFIG[computePriority(a)].order;
        break;

      case "status":
        const statusA = (a.status || "eingang").toLowerCase().replace(/-/g, "_");
        const statusB = (b.status || "eingang").toLowerCase().replace(/-/g, "_");
        cmp = (STATUS_SORT_ORDER[statusB] || 0) - (STATUS_SORT_ORDER[statusA] || 0);
        // Sekundär: Bei gleichem Status nach Alter sortieren (älteste zuerst)
        if (cmp === 0) {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        break;

      case "createdAt":
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;

      case "updatedAt":
        cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        break;

      case "daysOld":
        // Tage offen - älteste zuerst
        cmp = (b.daysOld || 0) - (a.daysOld || 0);
        break;

      case "daysAtNb":
        // Tage beim NB - längste Wartezeit zuerst
        // Items die nicht beim NB sind, ans Ende
        const daysA = a.daysAtNb ?? -1;
        const daysB = b.daysAtNb ?? -1;
        if (daysA === -1 && daysB === -1) cmp = 0;
        else if (daysA === -1) cmp = -1; // a ans Ende
        else if (daysB === -1) cmp = 1;  // b ans Ende
        else cmp = daysB - daysA;
        break;

      case "customerName":
        cmp = (a.customerName || "").localeCompare(b.customerName || "", "de");
        break;

      case "gridOperator":
        cmp = (a.gridOperator || "zzz").localeCompare(b.gridOperator || "zzz", "de");
        // Sekundär: Nach PLZ
        if (cmp === 0) {
          cmp = (a.plz || "").localeCompare(b.plz || "", "de");
        }
        break;

      case "plz":
        cmp = (a.plz || "").localeCompare(b.plz || "", "de");
        break;

      case "value":
        const valueA = a.estimatedValue || (a.totalKwp || 0) * 1500;
        const valueB = b.estimatedValue || (b.totalKwp || 0) * 1500;
        cmp = valueB - valueA;
        break;

      case "deadline":
        const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        cmp = deadlineA - deadlineB;
        break;
    }

    return sortOrder === "asc" ? -cmp : cmp;
  });
}

export interface FilterOptions {
  search?: string;
  statuses?: InstallationStatus[];
  gridOperators?: string[];
  priorities?: Priority[];
  caseTypes?: CaseType[];
  assignedToIds?: number[];
  createdByIds?: number[]; // 🔥 NEU: Filter nach Ersteller
  showOnlyWarnings?: boolean;
  showOnlyPinned?: boolean;
  showOnlyCritical?: boolean;
  showOnlyOverdue?: boolean;
  showOnlyUnassigned?: boolean;
  showArchived?: boolean; // Wenn true, zeige NUR archivierte (storniert/abgeschlossen)
  pinnedIds?: Set<number>;
  dateFrom?: string;
  dateTo?: string;
  minValue?: number;
  maxValue?: number;
}

// Status die als "archiviert" gelten
export const ARCHIVED_STATUSES: InstallationStatus[] = ["fertig", "storniert"];

export function filterItems(items: InstallationListItem[], opts: FilterOptions): InstallationListItem[] {
  return items.filter((item) => {
    const itemStatus = (item.status || "eingang").toLowerCase().replace(/-/g, "_") as InstallationStatus;
    const isArchived = ARCHIVED_STATUSES.includes(itemStatus);
    
    // Archiv-Filter: 
    // - Wenn showArchived = true: Zeige NUR archivierte
    // - Wenn showArchived = false/undefined: Zeige KEINE archivierten (außer explizit im statusFilter)
    if (opts.showArchived === true) {
      // Archiv-Modus: Nur storniert/abgeschlossen zeigen
      if (!isArchived) return false;
    } else if (opts.showArchived === false || opts.showArchived === undefined) {
      // Normal-Modus: Archivierte ausblenden, AUSSER sie sind explizit im Filter
      if (isArchived && (!opts.statuses?.length || !opts.statuses.includes(itemStatus))) {
        return false;
      }
    }
    
    // Search
    if (opts.search) {
      const q = opts.search.toLowerCase();
      const searchable = [
        item.customerName, 
        item.publicId, 
        item.location, 
        item.gridOperator, 
        item.plz, 
        item.ort,
        item.strasse,
        item.contactEmail,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    
    // Status filter
    if (opts.statuses?.length) {
      const st = (item.status || "eingang").toLowerCase().replace(/-/g, "_") as InstallationStatus;
      if (!opts.statuses.includes(st)) return false;
    }
    
    // Grid operator filter
    if (opts.gridOperators?.length) {
      if (!opts.gridOperators.includes(item.gridOperator || "")) return false;
    }
    
    // Priority filter
    if (opts.priorities?.length) {
      if (!opts.priorities.includes(computePriority(item))) return false;
    }
    
    // Case type filter
    if (opts.caseTypes?.length && item.caseType) {
      if (!opts.caseTypes.includes(item.caseType)) return false;
    }
    
    // Assigned to filter
    if (opts.assignedToIds?.length) {
      if (!item.assignedToId || !opts.assignedToIds.includes(item.assignedToId)) return false;
    }
    
    // 🔥 NEU: Created by filter (Ersteller/Subunternehmer)
    if (opts.createdByIds?.length) {
      if (!item.createdById || !opts.createdByIds.includes(item.createdById)) return false;
    }
    
    // Show only flags
    if (opts.showOnlyWarnings && !item.hasWarnings) return false;
    if (opts.showOnlyPinned && opts.pinnedIds && !opts.pinnedIds.has(item.id)) return false;
    if (opts.showOnlyCritical && computePriority(item) !== "critical") return false;
    if (opts.showOnlyOverdue && !isOverdue(item)) return false;
    if (opts.showOnlyUnassigned && item.assignedToId) return false;
    
    // Date range
    if (opts.dateFrom) {
      if (new Date(item.createdAt) < new Date(opts.dateFrom)) return false;
    }
    if (opts.dateTo) {
      if (new Date(item.createdAt) > new Date(opts.dateTo)) return false;
    }
    
    // Value range
    const value = item.estimatedValue || (item.totalKwp || 0) * 1500;
    if (opts.minValue !== undefined && value < opts.minValue) return false;
    if (opts.maxValue !== undefined && value > opts.maxValue) return false;
    
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUPING
// ═══════════════════════════════════════════════════════════════════════════

export function groupItems(
  items: InstallationListItem[], 
  groupBy: GroupBy, 
  collapsedGroups?: Set<string>
): GroupedItems[] {
  if (groupBy === "none") {
    return [{
      key: "all",
      label: "",
      items,
      criticalCount: items.filter(i => computePriority(i) === "critical").length,
      overdueCount: items.filter(i => isOverdue(i)).length,
      totalValue: items.reduce((sum, i) => sum + (i.estimatedValue || (i.totalKwp || 0) * 1500), 0),
    }];
  }
  
  const groups: Record<string, InstallationListItem[]> = {};
  
  items.forEach((item) => {
    let key: string;
    
    switch (groupBy) {
      case "gridOperator":
        key = item.gridOperator || "Kein Netzbetreiber";
        break;
      case "status":
        key = (item.status || "eingang").toLowerCase().replace(/-/g, "_");
        break;
      case "priority":
        key = computePriority(item);
        break;
      case "plzRegion":
        key = item.plz?.substring(0, 2) || "??";
        break;
      case "assignedTo":
        key = item.assignedToName || "Nicht zugewiesen";
        break;
      case "caseType":
        key = item.caseType || "PV_PRIVATE";
        break;
      case "workPriority":
        key = getWorkPriorityGroup(item);
        break;
      default:
        key = "all";
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  
  return Object.entries(groups)
    .sort(([keyA, itemsA], [keyB, itemsB]) => {
      // Special sorting
      if (keyA === "Kein Netzbetreiber" || keyA === "Nicht zugewiesen") return 1;
      if (keyB === "Kein Netzbetreiber" || keyB === "Nicht zugewiesen") return -1;

      if (groupBy === "status") {
        return (STATUS_SORT_ORDER[keyB] || 0) - (STATUS_SORT_ORDER[keyA] || 0);
      }
      if (groupBy === "priority") {
        return PRIORITY_CONFIG[keyB as Priority].order - PRIORITY_CONFIG[keyA as Priority].order;
      }
      if (groupBy === "workPriority") {
        return WORK_PRIORITY_CONFIG[keyA as WorkPriorityGroup].order - WORK_PRIORITY_CONFIG[keyB as WorkPriorityGroup].order;
      }

      // Default: by count
      return itemsB.length - itemsA.length;
    })
    .map(([key, groupItems]) => {
      let label = key;
      let color: string | undefined;
      let icon: string | undefined;

      if (groupBy === "status") {
        const cfg = getStatusConfig(key);
        label = cfg.label;
        color = cfg.color;
        icon = cfg.icon;
      } else if (groupBy === "priority") {
        const cfg = getPriorityConfig(key as Priority);
        label = cfg.label;
        color = cfg.color;
        icon = cfg.icon;
      } else if (groupBy === "caseType") {
        const cfg = getCaseTypeConfig(key as CaseType);
        label = cfg.label;
        color = cfg.color;
        icon = cfg.icon;
      } else if (groupBy === "workPriority") {
        const cfg = getWorkPriorityConfig(key as WorkPriorityGroup);
        label = `${cfg.emoji} ${cfg.label}`;
        color = cfg.color;
        icon = cfg.emoji;
      }

      return {
        key,
        label,
        color,
        icon,
        items: groupItems,
        criticalCount: groupItems.filter(i => computePriority(i) === "critical").length,
        overdueCount: groupItems.filter(i => isOverdue(i)).length,
        totalValue: groupItems.reduce((sum, i) => sum + (i.estimatedValue || (i.totalKwp || 0) * 1500), 0),
        isCollapsed: collapsedGroups?.has(key),
      };
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE & TIME HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "Gerade eben";
  
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return hours === 1 ? "vor 1 Std." : `vor ${hours} Std.`;
  
  const days = Math.floor(diff / 86400000);
  if (days === 1) return "Gestern";
  if (days < 7) return days === 1 ? "vor 1 Tag" : `vor ${days} Tagen`;
  
  const weeks = Math.floor(days / 7);
  if (days < 30) return weeks === 1 ? "vor 1 Woche" : `vor ${weeks} Wochen`;
  
  const months = Math.floor(days / 30);
  if (days < 365) return months === 1 ? "vor 1 Monat" : `vor ${months} Monaten`;
  
  return date.toLocaleDateString("de-DE");
}

// Gibt Farbe basierend auf Alter zurück
export function getAgeColor(dateStr: string, status: string): string {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  // Bei NB = immer neutral (grau) - Ball liegt beim NB
  if (s === "beim_nb") return "#64748b";
  // Fertige/Genehmigte = grün
  if (["fertig", "storniert", "genehmigt"].includes(s)) return "#22c55e";

  const days = getDaysOld(dateStr);
  if (days <= 7) return "#22c55e";   // Grün - frisch
  if (days <= 14) return "#f59e0b";  // Gelb - normal
  if (days <= 21) return "#f97316";  // Orange - aufpassen
  return "#ef4444";                   // Rot - überfällig
}

// Gibt Alter-Badge-Klasse zurück
export function getAgeBadgeClass(dateStr: string, status: string): string {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  if (s === "beim_nb") return "age-neutral";
  if (["fertig", "storniert", "genehmigt"].includes(s)) return "age-done";

  const days = getDaysOld(dateStr);
  if (days <= 7) return "age-fresh";
  if (days <= 14) return "age-normal";
  if (days <= 21) return "age-warning";
  return "age-overdue";
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("de-DE", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getDaysOld(dateStr: string): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function getDaysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return Infinity;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export function isOverdue(item: InstallationListItem, thresholdDays = 14): boolean {
  const status = (item.status || "eingang").toLowerCase().replace(/-/g, "_");

  // Completed, cancelled, or waiting for NB items are never overdue
  // Beim NB = der Ball liegt bei denen, nicht bei uns!
  if (["fertig", "storniert", "genehmigt", "beim_nb"].includes(status)) return false;

  // Check deadline first
  if (item.deadline) {
    return new Date(item.deadline) < new Date();
  }

  // Default: overdue if older than threshold
  return getDaysOld(item.createdAt) > thresholdDays;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", { 
    style: "currency", 
    currency: "EUR", 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", 
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#D4A843", 
    "#EAD068", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export function computeProgress(status?: string): number {
  const progressMap: Record<string, number> = {
    eingang: 15,
    beim_nb: 40,
    rueckfrage: 35,
    genehmigt: 65,
    ibn: 85,
    fertig: 100,
    storniert: 0,
  };
  const key = (status || "eingang").toLowerCase().replace(/-/g, "_");
  return progressMap[key] || 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALUE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export function calculateEstimatedValue(item: InstallationListItem): number {
  if (item.estimatedValue) return item.estimatedValue;
  
  const baseRate = 149; // Base price per installation
  const kwpRate = 50; // Per kWp
  
  let value = baseRate;
  value += (item.totalKwp || 0) * kwpRate;
  
  return value;
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD CONTEXT PARSER
// ═══════════════════════════════════════════════════════════════════════════

export function parseWizardContext(wc?: string | object): any {
  if (!wc) return {};
  // Backend gibt bereits geparsten JSON zurück (Objekt), kein String
  if (typeof wc === 'object') return wc;
  try {
    return JSON.parse(wc);
  } catch {
    return {};
  }
}

export function extractTechDataFromWizard(detail: any, wizardData: any) {
  const tech = detail.technicalData || {};
  const wizTech = wizardData?.technical || {};
  const step5 = wizardData?.step5 || {};

  const ensureArray = (val: any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && (val.enabled || val.manufacturer || val.hersteller || val.model || val.modell)) return [val];
    return [];
  };

  // PV Modules
  let pvRaw = tech.pvEntries || tech.pvModules || tech.pv ||
                wizTech.pvEntries || wizTech.pvModules || wizTech.pv ||
                wizardData?.pv || step5?.dachflaechen || step5?.pvModules || step5?.pv;
  let pv = ensureArray(pvRaw);

  // 🔥 WhatsApp-Format: pvAnzahl, pvHersteller, pvLeistungWp, pvModell
  if (pv.length === 0 && (tech.pvAnzahl || tech.pvHersteller)) {
    pv = [{
      manufacturer: tech.pvHersteller,
      model: tech.pvModell,
      count: tech.pvAnzahl || 1,
      powerWp: tech.pvLeistungWp,
    }];
  }

  // Inverters
  let invRaw = tech.inverterEntries || tech.inverters || tech.inverter ||
                 wizTech.inverterEntries || wizTech.inverters || wizTech.inverter ||
                 wizardData?.inverter || wizardData?.inverters ||
                 step5?.wechselrichter || step5?.inverters || step5?.inverter;
  let inverters = ensureArray(invRaw);

  // 🔥 WhatsApp-Format: wrHersteller, wrModell, wrLeistungKw, wrZerezId
  if (inverters.length === 0 && (tech.wrHersteller || tech.wrModell)) {
    inverters = [{
      manufacturer: tech.wrHersteller,
      model: tech.wrModell,
      powerKw: tech.wrLeistungKw,
      powerKva: tech.wrLeistungKw,
      zerezId: tech.wrZerezId,
      count: tech.wrAnzahl || 1,
    }];
  }

  // Storage / Battery - Check ALL possible locations
  let storageRaw = tech.batteryEntries || tech.storageEntries || tech.storage ||
                     wizTech.batteryEntries || wizTech.storageEntries || wizTech.storage ||
                     wizardData?.batteryEntries || wizardData?.storage || wizardData?.speicher ||
                     step5?.speicher || step5?.storage || step5?.batteryEntries || step5?.batteries;
  let storage = ensureArray(storageRaw).filter((s: any) => s.enabled !== false);

  // 🔥 WhatsApp-Format: speicherHersteller, speicherModell, speicherKwh
  if (storage.length === 0 && (tech.speicherHersteller || tech.speicherModell || tech.speicherKwh)) {
    storage = [{
      manufacturer: tech.speicherHersteller,
      model: tech.speicherModell,
      capacityKwh: tech.speicherKwh,
    }];
  }

  // Wallbox
  let wallboxRaw = tech.wallboxEntries || tech.wallbox ||
                     wizTech.wallboxEntries || wizTech.wallbox ||
                     wizardData?.wallbox || wizardData?.wallboxen ||
                     step5?.wallboxen || step5?.wallbox;
  let wallbox = ensureArray(wallboxRaw).filter((w: any) => w.enabled !== false);

  // 🔥 WhatsApp-Format: wallboxHersteller, wallboxModell, wallboxKw
  if (wallbox.length === 0 && (tech.wallboxHersteller || tech.wallboxModell)) {
    wallbox = [{
      manufacturer: tech.wallboxHersteller,
      model: tech.wallboxModell,
      powerKw: tech.wallboxKw,
    }];
  }

  // Heat Pump
  let heatPumpRaw = tech.heatpumpEntries || tech.heatPumpEntries || tech.heatPump ||
                      wizTech.heatpumpEntries || wizTech.heatPumpEntries || wizTech.heatPump ||
                      wizardData?.heatpumpEntries || wizardData?.heatPump || wizardData?.waermepumpe ||
                      step5?.waermepumpe || step5?.waermepumpen || step5?.heatPump;
  let heatPump = ensureArray(heatPumpRaw).filter((h: any) => h.enabled !== false);

  // 🔥 WhatsApp-Format: wpHersteller, wpModell, wpKw
  if (heatPump.length === 0 && (tech.wpHersteller || tech.wpModell)) {
    heatPump = [{
      manufacturer: tech.wpHersteller,
      model: tech.wpModell,
      powerKw: tech.wpKw,
    }];
  }

  // Calculate totals
  let totalKwp = tech.totalPvKwp || tech.totalPvKwPeak || tech.anlagenLeistungKwp || detail.totalKwp || step5?.gesamtleistungKwp || 0;
  if (!totalKwp && pv.length > 0) {
    totalKwp = pv.reduce((sum: number, p: any) => {
      const count = p.count || p.moduleCount || p.anzahl || p.modulAnzahl || 1;
      const power = p.powerWp || p.power || p.leistungWp || p.modulLeistungWp || 0;
      return sum + (count * power / 1000);
    }, 0);
  }

  let storageKwh = tech.totalBatteryKwh || tech.speicherKwh || 0;
  if (!storageKwh && storage.length > 0) {
    storageKwh = storage.reduce((sum: number, s: any) => {
      const count = s.count || s.anzahl || 1;
      return sum + ((s.capacityKwh || s.capacity || s.kapazitaet || s.kapazitaetKwh || 0) * count);
    }, 0);
  }

  const totalComponents = pv.length + inverters.length + storage.length + wallbox.length + heatPump.length;

  return {
    pv,
    inverters,
    storage,
    wallbox,
    heatPump,
    totalKwp,
    storageKwh,
    totalComponents,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

export const EMAIL_VARIABLES = [
  { key: "{{kunde.anrede}}", label: "Anrede", example: "Herr" },
  { key: "{{kunde.name}}", label: "Kundenname", example: "Max Mustermann" },
  { key: "{{kunde.vorname}}", label: "Vorname", example: "Max" },
  { key: "{{kunde.nachname}}", label: "Nachname", example: "Mustermann" },
  { key: "{{kunde.email}}", label: "E-Mail", example: "max@example.de" },
  { key: "{{anlage.publicId}}", label: "Anlagen-ID", example: "NA-2024-001234" },
  { key: "{{anlage.status}}", label: "Status", example: "In Prüfung" },
  { key: "{{anlage.adresse}}", label: "Anlagen-Adresse", example: "Musterstr. 1, 60594 Frankfurt" },
  { key: "{{anlage.leistung}}", label: "Leistung kWp", example: "10.5 kWp" },
  { key: "{{netzbetreiber.name}}", label: "Netzbetreiber", example: "Süwag Energie AG" },
  { key: "{{firma.name}}", label: "Firmenname", example: "LeCa GmbH & Co. KG" },
  { key: "{{firma.email}}", label: "Firmen-E-Mail", example: "info@baunity.de" },
  { key: "{{firma.telefon}}", label: "Firmen-Telefon", example: "069 12345678" },
  { key: "{{datum.heute}}", label: "Heutiges Datum", example: "23.12.2025" },
];

export function replaceEmailVariables(template: string, data: any): string {
  let result = template;
  
  const replacements: Record<string, string> = {
    "{{kunde.anrede}}": data.customer?.anrede || "",
    "{{kunde.name}}": data.customerName || `${data.customer?.vorname || ""} ${data.customer?.nachname || ""}`.trim(),
    "{{kunde.vorname}}": data.customer?.vorname || "",
    "{{kunde.nachname}}": data.customer?.nachname || "",
    "{{kunde.email}}": data.customer?.email || data.contactEmail || "",
    "{{anlage.publicId}}": data.publicId || "",
    "{{anlage.status}}": getStatusConfig(data.status).label,
    "{{anlage.adresse}}": `${data.strasse || ""} ${data.hausNr || ""}, ${data.plz || ""} ${data.ort || ""}`.trim(),
    "{{anlage.leistung}}": `${data.totalKwp?.toFixed(1) || "0"} kWp`,
    "{{netzbetreiber.name}}": data.gridOperator || "",
    "{{datum.heute}}": formatDate(new Date().toISOString()),
  };
  
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE-BASED PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = "admin" | "mitarbeiter" | "subunternehmer" | "kunde" | "whitelabel" | "readonly" | "demo";

export interface UserPermissions {
  // Installations
  canViewInstallations: boolean;
  canCreateInstallation: boolean;
  canEditInstallation: boolean;
  canDeleteInstallation: boolean;
  canChangeStatus: boolean;
  
  // Documents
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canGenerateDocuments: boolean;
  
  // Comments/Notes
  canViewComments: boolean;
  canAddComments: boolean;
  canDeleteComments: boolean;
  
  // Tasks
  canViewTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  
  // Emails
  canViewEmails: boolean;
  canSendEmails: boolean;
  
  // Technical Data
  canEditTechnicalData: boolean;
  
  // Admin
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canBulkEdit: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canViewInstallations: true,
    canCreateInstallation: true,
    canEditInstallation: true,
    canDeleteInstallation: true,
    canChangeStatus: true,
    canViewDocuments: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canGenerateDocuments: true,
    canViewComments: true,
    canAddComments: true,
    canDeleteComments: true,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewEmails: true,
    canSendEmails: true,
    canEditTechnicalData: true,
    canAccessAdmin: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canBulkEdit: true,
  },
  mitarbeiter: {
    canViewInstallations: true,
    canCreateInstallation: true,
    canEditInstallation: true,
    canDeleteInstallation: false,
    canChangeStatus: true,
    canViewDocuments: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canGenerateDocuments: true,
    canViewComments: true,
    canAddComments: true,
    canDeleteComments: false,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewEmails: true,
    canSendEmails: true,
    canEditTechnicalData: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAnalytics: true,
    canBulkEdit: true,
  },
  subunternehmer: {
    canViewInstallations: true,
    canCreateInstallation: true,
    canEditInstallation: true,
    canDeleteInstallation: false,
    canChangeStatus: false,
    canViewDocuments: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canGenerateDocuments: true,
    canViewComments: true,
    canAddComments: true,
    canDeleteComments: false,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewEmails: true,
    canSendEmails: false,
    canEditTechnicalData: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canBulkEdit: false,
  },
  whitelabel: {
    canViewInstallations: true,
    canCreateInstallation: true,
    canEditInstallation: true,
    canDeleteInstallation: false,
    canChangeStatus: false,
    canViewDocuments: true,
    canUploadDocuments: true,
    canDeleteDocuments: false,
    canGenerateDocuments: false,
    canViewComments: true,
    canAddComments: true,
    canDeleteComments: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canViewEmails: true,
    canSendEmails: false,
    canEditTechnicalData: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canBulkEdit: false,
  },
  kunde: {
    // Kunde darf NUR lesen + Notizen schreiben
    canViewInstallations: true,
    canCreateInstallation: false,
    canEditInstallation: false,
    canDeleteInstallation: false,
    canChangeStatus: false,
    canViewDocuments: true,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canGenerateDocuments: false,
    canViewComments: true,
    canAddComments: true, // Nur Notizen schreiben erlaubt
    canDeleteComments: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canViewEmails: true,
    canSendEmails: false,
    canEditTechnicalData: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canBulkEdit: false,
  },
  readonly: {
    canViewInstallations: true,
    canCreateInstallation: false,
    canEditInstallation: false,
    canDeleteInstallation: false,
    canChangeStatus: false,
    canViewDocuments: true,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canGenerateDocuments: false,
    canViewComments: true,
    canAddComments: false,
    canDeleteComments: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canViewEmails: true,
    canSendEmails: false,
    canEditTechnicalData: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canBulkEdit: false,
  },
  demo: {
    canViewInstallations: true,
    canCreateInstallation: false,
    canEditInstallation: false,
    canDeleteInstallation: false,
    canChangeStatus: false,
    canViewDocuments: true,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canGenerateDocuments: false,
    canViewComments: true,
    canAddComments: false,
    canDeleteComments: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canViewEmails: true,
    canSendEmails: false,
    canEditTechnicalData: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canBulkEdit: false,
  },
};

/**
 * Get permissions for a user role
 */
export function getPermissions(role?: string): UserPermissions {
  // Normalize role: ADMIN → admin, Mitarbeiter → mitarbeiter
  const normalizedRole = (role || "readonly").toLowerCase().trim();
  
  // Map alternative role names
  const roleMapping: Record<string, UserRole> = {
    admin: "admin",
    superadmin: "admin",
    mitarbeiter: "mitarbeiter",
    employee: "mitarbeiter",
    staff: "mitarbeiter",
    kunde: "kunde",
    customer: "kunde",
    subunternehmer: "subunternehmer",
    whitelabel: "whitelabel",
    partner: "whitelabel",
    readonly: "readonly",
    viewer: "readonly",
    demo: "demo",
  };
  
  const mappedRole = roleMapping[normalizedRole] || "readonly";
  return ROLE_PERMISSIONS[mappedRole] || ROLE_PERMISSIONS.readonly;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: string | undefined, permission: keyof UserPermissions): boolean {
  return getPermissions(role)[permission];
}

/**
 * Check if user is a customer (restricted access)
 */
export function isCustomerRole(role?: string): boolean {
  return (role || "").toLowerCase() === "kunde";
}

/**
 * Check if user is admin
 */
export function isAdminRole(role?: string): boolean {
  return (role || "").toLowerCase() === "admin";
}

// Ticket-System Constants & Types

export const CONTEXTS = [
  { value: "vde_form", label: "VDE Formular", color: "#f0d878", bg: "rgba(167,139,250,0.12)" },
  { value: "technik", label: "Technik", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  { value: "kunde", label: "Kunde", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { value: "standort", label: "Standort", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { value: "nb", label: "Netzbetreiber", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { value: "dokument", label: "Dokument", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  { value: "allgemein", label: "Allgemein", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
] as const;

export const STATUSES = [
  { value: "open", label: "Offen", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  { value: "in_progress", label: "In Bearbeitung", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { value: "waiting", label: "Wartend", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { value: "resolved", label: "Erledigt", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { value: "wontfix", label: "Abgelehnt", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
] as const;

export const PRIORITIES = [
  { value: "low", label: "Niedrig", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  { value: "normal", label: "Normal", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  { value: "high", label: "Hoch", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { value: "critical", label: "Kritisch", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
] as const;

export type TicketContext = typeof CONTEXTS[number]["value"];
export type TicketStatus = typeof STATUSES[number]["value"];
export type TicketPriority = typeof PRIORITIES[number]["value"];

export interface FieldTicket {
  id: number;
  installationId: number;
  context: TicketContext;
  contextRef?: string | null;
  fieldId?: string | null;
  title: string;
  message: string;
  authorType: "staff" | "kunde" | "system";
  authorId?: number | null;
  authorName: string;
  assignedToId?: number | null;
  assignedToName?: string | null;
  dueDate?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  resolvedBy?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  installation?: {
    id: number;
    publicId: string;
    customerName?: string | null;
    location?: string | null;
  };
  _count?: { replies: number };
  replies?: FieldTicketReply[];
}

export interface FieldTicketReply {
  id: number;
  ticketId: number;
  authorType: "staff" | "kunde" | "system";
  authorId?: number | null;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  wontfix: number;
  byContext: Record<string, number>;
  byPriority: Record<string, number>;
  recentActivity: number;
}

export function getContextMeta(ctx: string) {
  return CONTEXTS.find(c => c.value === ctx) || CONTEXTS[CONTEXTS.length - 1];
}

export function getStatusMeta(s: string) {
  return STATUSES.find(st => st.value === s) || STATUSES[0];
}

export function getPriorityMeta(p: string) {
  return PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];
}

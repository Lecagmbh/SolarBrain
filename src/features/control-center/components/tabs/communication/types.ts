/**
 * EMAIL CENTER - Types & Constants
 */

import {
  Check,
  XCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Bot,
  FileText,
  Mail,
  CheckCircle,
  Inbox,
  Zap,
  AlertTriangle,
  FileCheck,
  Activity,
  ShieldAlert,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface InboxEmail {
  id: number;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string | null;
  receivedAt: string;
  isRead: boolean;
  isArchived: boolean;
  assigned: boolean;
  installationId: number | null;
  installationPublicId?: string;
  aiType: string | null;
  aiConfidence: number | null;
  aiSummary: string | null;
  matchScore: number | null;
  preview: string | null;
  hasAttachments: boolean;
  factroProjectId?: number | null;
  factroProjectTitle?: string | null;
  netzbetreiberId?: number | null;
  netzbetreiberName?: string | null;
  matchMethod?: string | null;
  hasAutoReplyDraft?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SORT / GROUP / FILTER
// ═══════════════════════════════════════════════════════════════════════════════

export type SortBy = "receivedAt" | "fromAddress" | "subject" | "aiType";
export type SortOrder = "desc" | "asc";
export type GroupMode = "date" | "sender" | "aiType" | "none";
export type FilterChipId = "unread" | "genehmigung" | "rueckfrage" | "ablehnung" | "attachments" | "zaehlerantrag" | "fristablauf" | "eingangsbestaetigung" | "actionNeeded" | "hasAutoReply";

export interface EmailGroup {
  label: string;
  emails: InboxEmail[];
}

export interface EmailDetail {
  id: number;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string | null;
  ccAddresses?: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string;
  isRead: boolean;
  assigned: boolean;
  installationId: number | null;
  threadId?: string | null;
  aiType: string | null;
  aiConfidence: number | null;
  aiSummary: string | null;
  aiAnalysis: Record<string, unknown> | null;
  attachments: EmailAttachment[] | string | null;
  installation?: {
    id: number;
    publicId: string;
    customerName: string | null;
  } | null;
  factroProjectId?: number | null;
  factroProjectTitle?: string | null;
  netzbetreiberId?: number | null;
  netzbetreiberName?: string | null;
  matchMethod?: string | null;
  hasAutoReplyDraft?: boolean;
}

export interface EmailAttachment {
  filename: string;
  contentType?: string;
  size?: number;
  url?: string;
  contentId?: string;
}

export interface SentEmail {
  id: number;
  to: string;
  subject: string;
  status: "sent" | "failed" | "pending" | "queued";
  type: string;
  templateSlug?: string;
  installationId?: number;
  sentAt: string;
  error?: string;
}

export interface Installation {
  id: number;
  publicId: string;
  customerName: string;
  strasse: string;
  plz: string;
  ort: string;
  status: string;
}

export interface InboxStats {
  total: number;
  unread: number;
  unassigned: number;
  rueckfragen: number;
  genehmigungen: number;
  ablehnungen: number;
}

export interface SentStats {
  sent: number;
  failed: number;
  pending: number;
  queued: number;
}

export interface EmailTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  body: string;
  category?: string;
}

export interface ComposeState {
  mode: "new" | "reply";
  to: string;
  cc: string;
  subject: string;
  body: string;
  originalEmailId?: number;
  installationId?: number | null;
  installationPublicId?: string;
}

export interface VnbSummary {
  id: number;
  name: string;
  kurzname: string | null;
  emailCount: number;
  unreadCount: number;
}

export interface EscalationItem {
  id: number;
  type: "REMINDER" | "ESCALATION" | "CUSTOMER_UPDATE";
  reason: string;
  status: "PENDING" | "EXECUTED" | "SKIPPED";
  scheduledFor: string;
  executedAt: string | null;
  installationId: number | null;
  factroProjectId: number | null;
  installationPublicId?: string;
  factroProjectTitle?: string;
}

export interface AutoReplyDraft {
  emailId: number;
  subject: string;
  body: string;
  confidence: number;
  missingDocs: string[];
  foundDocs: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Mailbox {
  address: string;
  total: number;
  unread: number;
}

export interface CustomerFolder {
  installationId: number;
  publicId: string | null;
  customerName: string | null;
  totalCount: number;
  unreadCount: number;
}

export interface SidebarFilter {
  type: "all" | "mailbox" | "installation" | "unassigned" | "sent" | "vnb" | "escalations";
  mailbox?: string;
  installationId?: number;
  netzbetreiberId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG MAPS
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_TYPE_CONFIG: Record<string, { icon: typeof Mail; color: string; label: string; priority?: number }> = {
  GENEHMIGUNG: { icon: Check, color: "#10b981", label: "Genehmigung", priority: 1 },
  ABLEHNUNG: { icon: XCircle, color: "#ef4444", label: "Ablehnung", priority: 2 },
  RUECKFRAGE: { icon: HelpCircle, color: "#f59e0b", label: "Rückfrage", priority: 3 },
  ZAEHLERANTRAG: { icon: Zap, color: "#06b6d4", label: "Zählerantrag", priority: 4 },
  FRISTABLAUF: { icon: AlertTriangle, color: "#f43f5e", label: "Fristablauf", priority: 5 },
  EINGANGSBESTAETIGUNG: { icon: FileCheck, color: "#3b82f6", label: "Eingangsbestätigung", priority: 6 },
  INBETRIEBSETZUNG: { icon: Activity, color: "#EAD068", label: "Inbetriebsetzung", priority: 7 },
  FEHLENDE_DATEN: { icon: ShieldAlert, color: "#fb923c", label: "Fehlende Daten", priority: 8 },
  STATUS_UPDATE: { icon: Clock, color: "#3b82f6", label: "Status", priority: 9 },
  PORTAL_NOTIFICATION: { icon: ExternalLink, color: "#EAD068", label: "Portal", priority: 10 },
  AUTO_REPLY: { icon: Bot, color: "#71717a", label: "Auto", priority: 11 },
  NEWSLETTER: { icon: FileText, color: "#71717a", label: "News", priority: 12 },
  INFO: { icon: Mail, color: "#D4A843", label: "Info", priority: 13 },
  SONSTIGE: { icon: Mail, color: "#71717a", label: "Sonstige", priority: 99 },
};

export const SENT_STATUS_CONFIG: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  sent: { icon: CheckCircle, color: "#10b981", label: "Gesendet" },
  failed: { icon: XCircle, color: "#ef4444", label: "Fehlgeschlagen" },
  pending: { icon: Clock, color: "#f59e0b", label: "Ausstehend" },
  queued: { icon: Inbox, color: "#3b82f6", label: "Warteschlange" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Parse toAddresses JSON string into array */
export function parseToAddresses(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return raw.includes(",") ? raw.split(",").map((a) => a.trim()) : [raw];
  }
}

/** Parse attachments from JSON string or array */
export function parseAttachments(raw: EmailAttachment[] | string | null): EmailAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Classify a mailbox address: inbox, installation, or other */
export function classifyMailbox(address: string): { type: "inbox" | "installation" | "other"; label: string } {
  const lower = address.toLowerCase();
  if (lower.startsWith("inst-") && lower.includes("@baunity.de")) {
    const match = lower.match(/^(inst-[^@]+)@/);
    return { type: "installation", label: match?.[1] || address };
  }
  if (lower === "inbox@baunity.de" || lower === "info@baunity.de") {
    return { type: "inbox", label: "Inbox" };
  }
  if (lower.endsWith("@baunity.de")) {
    return { type: "other", label: address.split("@")[0] };
  }
  return { type: "other", label: address };
}

/** Format date relative (heute=Uhrzeit, gestern, vor Xd, DD.MM) */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "gestern";
  } else if (days < 7) {
    return `vor ${days}d`;
  }
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

/** Format file size human-readable */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 2-Buchstaben Initialen aus einem Namen (wie Netzanmeldungen) */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
}

/** Deterministischer Avatar-Farbhash (15 Farben, wie Netzanmeldungen) */
export function getAvatarColor(name: string): string {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#D4A843",
    "#EAD068", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Match-Method Label für Anzeige */
export const MATCH_METHOD_LABELS: Record<string, string> = {
  DEDICATED_EMAIL: "Dedizierte Email",
  VORGANGSNUMMER: "Vorgangsnummer",
  CUSTOMER_EMAIL: "Kunden-Email",
  VNB_DOMAIN_ADDRESS: "VNB-Domain",
  NB_CASE_NUMBER: "NB-Aktenzeichen",
  CONTENT_FALLBACK: "Inhaltsanalyse",
  MANUAL: "Manuell",
};

/** Escalation-Type Labels */
export const ESCALATION_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  REMINDER: { label: "Erinnerung", color: "#f59e0b" },
  ESCALATION: { label: "Eskalation", color: "#ef4444" },
  CUSTOMER_UPDATE: { label: "Kunden-Update", color: "#3b82f6" },
};

/** Mailbox-Adresse für Display kürzen: lokaler Teil + Domain-Anfang */
export function formatMailboxAddress(addr: string): { short: string; domain: string } {
  const [local, domain] = addr.split("@");
  const shortDomain = domain?.split(".")[0] || "";
  return { short: local.length > 20 ? local.substring(0, 18) + "…" : local, domain: shortDomain };
}

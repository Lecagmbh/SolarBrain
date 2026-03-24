/**
 * V3 Types — Unified Item + View System
 */

export type ViewKey = "inbox" | "open" | "nb" | "done" | "all" | "crm" | "wizard" | "leads";
export type V3Mode = "dashboard" | "list";
export type SourceFilter = "alle" | "crm" | "wizard" | "leads";

export interface UnifiedItem {
  id: number;
  publicId: string;
  name: string;
  kunde: string;
  plz: string;
  ort: string;
  nb: string;
  kwp: number;
  status: string;
  source: "wizard" | "crm" | "lead";
  daysAtNb: number | null;
  daysOld: number;
  createdAt: string;
  lastActivity: { text: string; time: string; type: string };
  nextAction?: string;
  tags?: string[];
  azNb?: string;
  // Kompatibilität mit CrmDetailPanel
  _isCrm: boolean;
  _crmId?: number;
  _installationId?: number;
  // Extras
  kundeId: number | null;
  createdById: number | null;
  isBilled: boolean;
  priority: string | null;
  email?: string;
  titel?: string;
  documentsCount?: number;
  emailsCount?: number;
  commentsCount?: number;
  waitingForReply?: boolean;
  lastEmailDir?: string;
  lastEmailSubject?: string;
  pendingDrafts?: number;
}

export interface PipelineCounts {
  crm_anfrage: number;
  crm_hv: number;
  crm_auftrag: number;
  crm_nb_kommunikation: number;
  crm_nb_genehmigt: number;
  crm_eingestellt: number;
  eingang: number;
  beim_nb: number;
  rueckfrage: number;
  genehmigt: number;
  ibn: number;
  fertig: number;
  storniert: number;
  avgDaysBeimNb: number;
  // Wizard-Leads
  leads_neu?: number;
  leads_total?: number;
}

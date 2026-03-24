// src/api/emailInbox.ts
// Email Inbox API - Zentrale Email-Verwaltung für inbox@baunity.de
import { apiGet, apiPost } from "./client";

/**
 * Email Inbox Status
 */
export interface EmailInboxStatus {
  isRunning: boolean;
  lastChecked: string | null;
  errorCount: number;
  lastError: string | null;
  pollIntervalSeconds: number;
  stats: {
    last24h: {
      assigned: number;
      unassigned: number;
      total: number;
    };
  };
}

/**
 * Unassigned Email aus inbox@baunity.de
 */
export interface UnassignedEmail {
  id: number;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  receivedAt: string;
  isRead: boolean;
  // KI-Analyse Felder
  aiType?: string;
  aiConfidence?: number;
  aiSummary?: string;
  aiSuggestedInstallation?: number;
  bodyPreview?: string;
}

/**
 * Email Details (für Modal-Ansicht)
 */
export interface EmailDetail extends UnassignedEmail {
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  aiAnalysis?: {
    type: string;
    confidence: number;
    summary: string;
    extractedData?: Record<string, any>;
    suggestedInstallations?: Array<{
      id: number;
      publicId: string;
      customerName: string;
      matchScore: number;
      matchReason: string;
    }>;
  };
}

/**
 * Installation für Zuordnung
 */
export interface InstallationForAssignment {
  id: number;
  publicId: string;
  customerName: string;
  address: string;
  status: string;
}

/**
 * Status des Email-Inbox-Services abrufen
 */
export async function getEmailInboxStatus(): Promise<EmailInboxStatus> {
  return apiGet<EmailInboxStatus>("/api/email-inbox/status");
}

/**
 * Manuellen Poll auslösen (Admin only)
 */
export async function triggerEmailPoll(): Promise<{ success: boolean; fetched: number; assigned: number; errors: string[] }> {
  return apiPost("/api/email-inbox/poll", {});
}

/**
 * Unzugeordnete Emails abrufen
 */
export async function getUnassignedEmails(): Promise<UnassignedEmail[]> {
  return apiGet<UnassignedEmail[]>("/api/email-inbox/unassigned");
}

/**
 * Email-Details abrufen
 */
export async function getEmailDetail(emailId: number): Promise<EmailDetail> {
  const res = await apiGet<{ success: boolean; data: EmailDetail }>(`/api/email-inbox/${emailId}`);
  return res.data;
}

/**
 * Email manuell einer Installation zuordnen
 */
export async function assignEmailToInstallation(
  emailId: number,
  installationId: number
): Promise<{ success: boolean; message: string }> {
  return apiPost(`/api/email-inbox/${emailId}/assign`, { installationId });
}

/**
 * Email archivieren (ohne Zuordnung)
 */
export async function archiveEmail(emailId: number): Promise<{ success: boolean }> {
  return apiPost(`/api/email-inbox/${emailId}/archive`, {});
}

/**
 * Emails für eine Installation abrufen
 */
export async function getInstallationEmails(installationId: number): Promise<EmailDetail[]> {
  const res = await apiGet<{ success: boolean; data: EmailDetail[] }>(`/api/email-inbox/installation/${installationId}`);
  return res.data;
}

/**
 * Installationen für Zuordnung suchen
 */
export async function searchInstallationsForAssignment(query: string): Promise<InstallationForAssignment[]> {
  const params = new URLSearchParams({ q: query, limit: "10" });
  const res = await apiGet<{ data: InstallationForAssignment[] }>(`/api/installations/search?${params}`);
  return res.data || [];
}

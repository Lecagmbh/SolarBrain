// src/services/emails.service.ts
import { api } from "../modules/api/client";

export interface EmailsListParams {
  installationId?: number;
  assigned?: boolean;
  direction?: "INBOUND" | "OUTBOUND";
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailListItem {
  id: string;
  externalId?: string;
  subject?: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  date: string;
  direction: "INBOUND" | "OUTBOUND";
  assigned: boolean;
  installationId?: number;
  installationPublicId?: string;
  customerName?: string;
  matchScore?: number;
  isRead: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
}

export interface EmailDetail extends EmailListItem {
  bodyHtml?: string;
  bodyText?: string;
  attachments: Array<{
    filename: string;
    contentType?: string;
    size?: number;
    url?: string;
  }>;
  installation?: {
    id: number;
    publicId: string;
    customerName?: string;
    status: string;
  };
  actions: Array<{
    id: number;
    action: string;
    user: { id: number; name?: string; email: string };
    createdAt: string;
  }>;
}

// Emails auflisten
export async function fetchEmails(
  params: EmailsListParams = {}
): Promise<PaginatedResponse<EmailListItem>> {
  const response = await api.get("/emails", { params });
  return response.data;
}

// Nicht zugewiesene Emails laden
export async function fetchUnassignedEmails(): Promise<Array<{
  id: string;
  subject?: string;
  from: string;
  fromName?: string;
  date: string;
  matchScore?: number;
  preview?: string;
}>> {
  const response = await api.get("/emails/unassigned");
  return response.data;
}

// Einzelne Email laden
export async function fetchEmailById(id: string): Promise<EmailDetail> {
  const response = await api.get(`/emails/${id}`);
  return response.data;
}

// Email einer Installation zuweisen
export async function assignEmail(
  emailId: string,
  installationId: number
): Promise<{ success: boolean; id: number; installationId: number }> {
  const response = await api.post(`/emails/${emailId}/assign`, {
    installationId
  });
  return response.data;
}

// Email-Zuweisung aufheben
export async function unassignEmail(
  emailId: string
): Promise<{ success: boolean; id: number }> {
  const response = await api.post(`/emails/${emailId}/unassign`);
  return response.data;
}

// Email archivieren
export async function archiveEmail(
  emailId: string
): Promise<{ success: boolean; id: number }> {
  const response = await api.post(`/emails/${emailId}/archive`);
  return response.data;
}

// Email löschen
export async function deleteEmail(emailId: string): Promise<{ success: boolean }> {
  const response = await api.delete(`/emails/${emailId}`);
  return response.data;
}

export default {
  fetchEmails,
  fetchUnassignedEmails,
  fetchEmailById,
  assignEmail,
  unassignEmail,
  archiveEmail,
  deleteEmail
};

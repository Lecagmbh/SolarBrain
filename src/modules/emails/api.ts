import { apiGet, apiPost } from "../api/client";
import type { EmailFolder, ListEmailsResp, EmailDetail } from "./types";

/**
 * 🔥 ENDLEVEL MAPPING
 * Frontend-Folder → Backend-Query
 *
 * inbox   → direction=INBOUND
 * sent    → direction=OUTBOUND
 * archive → isArchived=true
 * q       → search
 */
export async function listEmails(params: {
  folder: EmailFolder;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<ListEmailsResp> {

  const qs = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 50),
  });

  // 🔍 Suche
  if (params.q && params.q.trim()) {
    qs.set("search", params.q.trim());
  }

  // 📂 Folder → Backend
  switch (params.folder) {
    case "inbox":
      qs.set("direction", "INBOUND");
      qs.set("isArchived", "false");
      break;

    case "sent":
      qs.set("direction", "OUTBOUND");
      break;

    case "archive":
      qs.set("isArchived", "true");
      break;

    default:
      break;
  }

  return apiGet(`/emails?${qs.toString()}`);
}

export async function getEmail(id: string): Promise<EmailDetail> {
  return apiGet(`/emails/${id}`);
}

// optional
export async function markRead(id: string): Promise<unknown> {
  return apiPost(`/emails/${id}/read`, {});
}

export async function assignToInstallation(emailId: string, installationId: string): Promise<unknown> {
  return apiPost(`/emails/${emailId}/assign`, { installationId });
}

export async function unassign(emailId: string): Promise<unknown> {
  return apiPost(`/emails/${emailId}/unassign`, {});
}

export async function archiveEmail(emailId: string): Promise<unknown> {
  return apiPost(`/emails/${emailId}/archive`, {});
}

export type EmailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash";

export type EmailListRow = {
  id: string;
  externalId: string | null;
  subject: string;
  from: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  date: string;
  direction: "INBOUND" | "OUTBOUND";
  assigned: boolean;
  installationId: string | null;
  matchScore: number | null;
  isRead: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
};

export type EmailAttachment = {
  filename?: string;
  contentType?: string;
  size?: number;
  url?: string;
};

export type EmailDetail = EmailListRow & {
  bodyText?: string | null;
  bodyHtml?: string | null;
  attachments?: EmailAttachment[];
  installationPublicId?: string | null;
  customerName?: string | null;
};

export type ListEmailsResp = {
  data: EmailListRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

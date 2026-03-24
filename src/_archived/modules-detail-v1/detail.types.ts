export type InstallationSummary = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
};

export type UploadMeta = {
  filename: string;
  contentType?: string | null;
  size?: number | null;
};

export type Comment = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
};

export type StatusHistoryEntry = {
  status: string;
  statusLabel: string;
  changedAt: string;
  changedBy: string;
};

export type InstallationDetail = InstallationSummary & {
  uploads: Record<string, UploadMeta[]>;
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
  raw: Record<string, any>;
  createdByName?: string;
  createdByEmail?: string | null;
};

export type InstallationEmail = {
  id: string;
  direction: "in" | "out";
  subject: string;
  from: string;
  to: string;
  date: string;
  preview: string;
  body?: string;
};

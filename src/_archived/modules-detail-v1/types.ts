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

export type InstallationSummary = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
};

export type InstallationDetail = InstallationSummary & {
  uploads: Record<string, UploadMeta[]>;
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
  raw: Record<string, any>;
  createdByName?: string;
  createdByEmail?: string | null;
};

export type NormalizedStatusKey = "review" | "grid" | "released" | "unknown";

const STATUS_DISPLAY: Record<NormalizedStatusKey, string> = {
  review: "In Prüfung",
  grid: "Beim Netzbetreiber",
  released: "Freigegeben",
  unknown: "–",
};

export const getDisplayStatus = (status: string, statusLabel: string): string => {
  const s = (status || "").trim().toLowerCase();
  const l = (statusLabel || "").trim().toLowerCase();
  const v = l || s;

  if (v.startsWith("in prüfung") || v.startsWith("in pruefung")) return STATUS_DISPLAY.review;
  if (v.startsWith("beim netzbetreiber")) return STATUS_DISPLAY.grid;
  if (v.startsWith("freigegeben")) return STATUS_DISPLAY.released;
  return statusLabel || status || STATUS_DISPLAY.unknown;
};

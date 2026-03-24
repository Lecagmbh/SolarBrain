// ============================================================================
// Baunity Installation Detail V2 - Utility Functions
// ============================================================================

import type { InstallationStatus, DocumentCategory, UserRole } from "../types";
import { STATUS_ORDER, STATUS_CONFIG, DOCUMENT_CATEGORIES } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Date Formatting
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(date?: string | Date | null): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date?: string | Date | null): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date?: string | Date | null): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  
  if (diffSec < 60) return "Gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  if (diffHour < 24) return `vor ${diffHour} Std.`;
  if (diffDay === 1) return "Gestern";
  if (diffDay < 7) return `vor ${diffDay} Tagen`;
  if (diffWeek < 4) return `vor ${diffWeek} Wochen`;
  if (diffMonth < 12) return `vor ${diffMonth} Monaten`;
  
  return formatDate(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// File Size Formatting
// ─────────────────────────────────────────────────────────────────────────────

export function formatFileSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined) return "–";
  if (bytes === 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe Value Access
// ─────────────────────────────────────────────────────────────────────────────

export function safe(value: any, fallback: string = "–"): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return String(value);
}

export function safeNumber(value: any, fallback: number = 0): number {
  if (value === undefined || value === null) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getStatusIndex(status: InstallationStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function getNextStatus(current: InstallationStatus): InstallationStatus | null {
  const idx = getStatusIndex(current);
  return STATUS_ORDER[idx + 1] ?? null;
}

export function getPrevStatus(current: InstallationStatus): InstallationStatus | null {
  const idx = getStatusIndex(current);
  return idx > 0 ? STATUS_ORDER[idx - 1] : null;
}

export function canProgressStatus(
  current: InstallationStatus,
  target: InstallationStatus,
  role: UserRole
): boolean {
  if (role === "admin") return true;
  if (role === "kunde") return false;
  
  const currentIdx = getStatusIndex(current);
  const targetIdx = getStatusIndex(target);
  
  // Mitarbeiter können nur vorwärts gehen, maximal +1
  return targetIdx === currentIdx + 1;
}

export function getStatusProgress(status: InstallationStatus): number {
  const idx = getStatusIndex(status);
  return ((idx + 1) / STATUS_ORDER.length) * 100;
}

export function getStatusConfig(status: InstallationStatus) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.entwurf;
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isMitarbeiter(role: UserRole): boolean {
  return role === "mitarbeiter";
}

export function isKunde(role: UserRole): boolean {
  return role === "kunde";
}

export function canEditStatus(role: UserRole): boolean {
  return role === "admin" || role === "mitarbeiter";
}

export function canViewAdminTab(role: UserRole): boolean {
  return role === "admin";
}

export function canDeleteDocuments(role: UserRole): boolean {
  return role === "admin";
}

export function canAssignEmails(role: UserRole): boolean {
  return role === "admin" || role === "mitarbeiter";
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getDocumentCategory(category?: DocumentCategory) {
  if (!category) return DOCUMENT_CATEGORIES.sonstiges;
  return DOCUMENT_CATEGORIES[category] ?? DOCUMENT_CATEGORIES.sonstiges;
}

export function getFileIcon(filename: string, contentType?: string | null): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = contentType?.toLowerCase() ?? "";
  
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return "🖼";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "📄";
  }
  if (mime.includes("word") || ["doc", "docx"].includes(ext)) {
    return "📝";
  }
  if (mime.includes("excel") || mime.includes("spreadsheet") || ["xls", "xlsx", "csv"].includes(ext)) {
    return "📊";
  }
  if (mime.includes("zip") || mime.includes("compressed") || ["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return "📦";
  }
  if (["dwg", "dxf"].includes(ext)) {
    return "📐";
  }
  
  return "📎";
}

export function isPreviewable(filename: string, contentType?: string | null): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = contentType?.toLowerCase() ?? "";
  
  // Images
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return true;
  }
  // PDFs
  if (mime === "application/pdf" || ext === "pdf") {
    return true;
  }
  
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// String Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function extractEmailName(email: string): string {
  // "Max Mustermann <max@example.com>" -> "Max Mustermann"
  const match = email.match(/^([^<]+)\s*</);
  if (match) return match[1].trim();
  
  // "max@example.com" -> "max"
  return email.split("@")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export function getModifierKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}

export function formatShortcut(shortcut: string): string {
  return shortcut
    .replace("mod", getModifierKey())
    .replace("shift", "⇧")
    .replace("alt", isMac() ? "⌥" : "Alt")
    .replace("enter", "↵")
    .replace("esc", "Esc")
    .replace(/\+/g, " ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function calculateGeneratorPower(moduleWp?: number, moduleCount?: number): number {
  if (!moduleWp || !moduleCount) return 0;
  return moduleWp * moduleCount;
}

export function calculateCompletionScore(
  documents: { category?: DocumentCategory }[],
  requiredCategories: DocumentCategory[]
): number {
  if (requiredCategories.length === 0) return 100;
  
  const uploadedCategories = new Set(
    documents.map((d) => d.category).filter(Boolean)
  );
  
  const completed = requiredCategories.filter((cat) =>
    uploadedCategories.has(cat)
  ).length;
  
  return Math.round((completed / requiredCategories.length) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Class Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Clipboard
// ─────────────────────────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

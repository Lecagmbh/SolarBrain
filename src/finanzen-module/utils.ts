// ============================================
// FINANZEN MODULE - UTILITIES
// ============================================

import { FileText, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { Invoice, StatusInfo, InvoiceStatus } from "./types";

// ============================================
// DATE FORMATTING
// ============================================

export const formatDate = (dt: string | null | undefined): string => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dt);
  }
};

export const formatDateLong = (dt: string | null | undefined): string => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(dt);
  }
};

export const formatRelativeDate = (dt: string | null | undefined): string => {
  if (!dt) return "—";
  const date = new Date(dt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays);
    if (futureDays === 1) return "Morgen";
    if (futureDays < 7) return `in ${futureDays} Tagen`;
    return formatDate(dt);
  }
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
  if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Monaten`;
  return formatDate(dt);
};

// ============================================
// CURRENCY FORMATTING
// ============================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("de-DE").format(num);
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// ============================================
// STATUS UTILITIES
// ============================================

export const getStatusInfo = (status: string): StatusInfo => {
  const s = (status || "").toUpperCase() as InvoiceStatus;
  
  const statusMap: Record<string, StatusInfo> = {
    ENTWURF: {
      label: "Entwurf",
      color: "#64748b",
      bg: "rgba(100, 116, 139, 0.15)",
      icon: FileText,
    },
    OFFEN: {
      label: "Offen",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.15)",
      icon: Clock,
    },
    VERSENDET: {
      label: "Versendet",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.15)",
      icon: Clock,
    },
    BEZAHLT: {
      label: "Bezahlt",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.15)",
      icon: CheckCircle2,
    },
    UEBERFAELLIG: {
      label: "Überfällig",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.15)",
      icon: AlertTriangle,
    },
    STORNIERT: {
      label: "Storniert",
      color: "#6b7280",
      bg: "rgba(107, 114, 128, 0.15)",
      icon: XCircle,
    },
  };

  return (
    statusMap[s] || {
      label: status || "Unbekannt",
      color: "#94a3b8",
      bg: "rgba(148, 163, 184, 0.15)",
      icon: FileText,
    }
  );
};

export const isOverdue = (invoice: Invoice): boolean => {
  if (!invoice.faellig_am) return false;
  if (invoice.status === "BEZAHLT" || invoice.status === "STORNIERT") return false;
  return new Date(invoice.faellig_am) < new Date();
};

export const getDaysOverdue = (invoice: Invoice): number => {
  if (!invoice.faellig_am || !isOverdue(invoice)) return 0;
  const dueDate = new Date(invoice.faellig_am);
  const now = new Date();
  return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================
// SORTING & FILTERING
// ============================================

export const sortInvoices = (
  invoices: Invoice[],
  key: string,
  dir: "asc" | "desc"
): Invoice[] => {
  return [...invoices].sort((a, b) => {
    let aVal: string | number = String((a as any)[key] ?? "");
    let bVal: string | number = String((b as any)[key] ?? "");

    if (key === "betrag_brutto" || key === "betrag_netto") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    if (key === "rechnungs_datum" || key === "faellig_am") {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return dir === "asc" ? -1 : 1;
    if (aVal > bVal) return dir === "asc" ? 1 : -1;
    return 0;
  });
};

export const filterInvoices = (
  invoices: Invoice[],
  search: string,
  status: string
): Invoice[] => {
  let result = [...invoices];

  // Status filter
  if (status && status !== "all") {
    if (status === "OFFEN") {
      result = result.filter(
        (inv) => inv.status === "OFFEN" || inv.status === "VERSENDET"
      );
    } else {
      result = result.filter((inv) => inv.status === status);
    }
  }

  // Search filter
  if (search) {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (inv) =>
        inv.rechnungsnummer?.toLowerCase().includes(q) ||
        inv.kunde_name?.toLowerCase().includes(q)
    );
  }

  return result;
};

// ============================================
// KPI CALCULATIONS
// ============================================

export const calculateKPIs = (invoices: Invoice[]) => {
  const total = invoices.reduce((sum, inv) => sum + (inv.betrag_brutto || 0), 0);
  
  const paid = invoices.filter((inv) => inv.status === "BEZAHLT");
  const paidSum = paid.reduce((sum, inv) => sum + (inv.betrag_brutto || 0), 0);
  
  const open = invoices.filter(
    (inv) => inv.status === "OFFEN" || inv.status === "VERSENDET"
  );
  const openSum = open.reduce((sum, inv) => sum + (inv.betrag_brutto || 0), 0);
  
  const overdue = invoices.filter((inv) => isOverdue(inv));
  const overdueSum = overdue.reduce((sum, inv) => sum + (inv.betrag_brutto || 0), 0);
  
  const drafts = invoices.filter((inv) => inv.status === "ENTWURF");
  
  const paidPercent = total > 0 ? (paidSum / total) * 100 : 0;

  return {
    total: { count: invoices.length, sum: total, trend: 12.5 },
    paid: { count: paid.length, sum: paidSum, percent: paidPercent, trend: 8.3 },
    open: { count: open.length, sum: openSum, trend: -5.2 },
    overdue: { count: overdue.length, sum: overdueSum },
    drafts: { count: drafts.length },
  };
};

export const getStatusCounts = (invoices: Invoice[]): Record<string, number> => {
  const counts: Record<string, number> = { all: invoices.length };
  
  invoices.forEach((inv) => {
    const status = inv.status || "UNBEKANNT";
    counts[status] = (counts[status] || 0) + 1;
  });
  
  // Combine OFFEN and VERSENDET for display
  counts.OFFEN = (counts.OFFEN || 0) + (counts.VERSENDET || 0);
  
  return counts;
};

// ============================================
// EXPORT UTILITIES
// ============================================

export const exportToCSV = async (invoices: Invoice[], filename?: string): Promise<void> => {
  const headers = [
    "Rechnungsnummer",
    "Kunde",
    "Rechnungsdatum",
    "Fällig am",
    "Netto",
    "MwSt",
    "Brutto",
    "Status",
  ];

  const rows = invoices.map((inv) => [
    inv.rechnungsnummer || "",
    inv.kunde_name || "",
    formatDate(inv.rechnungs_datum),
    formatDate(inv.faellig_am),
    inv.betrag_netto?.toFixed(2) || "0.00",
    inv.betrag_mwst?.toFixed(2) || "0.00",
    inv.betrag_brutto?.toFixed(2) || "0.00",
    inv.status || "",
  ]);

  const csv = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const { downloadFile } = await import("@/utils/desktopDownload");
  await downloadFile({ filename: filename || `rechnungen-${new Date().toISOString().split("T")[0]}.csv`, blob, fileType: 'csv' });
};

// ============================================
// MISC UTILITIES
// ============================================

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const clsx = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// =============================================================================
// Baunity Dashboard V4 - Utility Functions
// =============================================================================

import { STATUS_CONFIG } from "../types/dashboard.types";
import type { AlertSeverity } from "../types/dashboard.types";

// -----------------------------------------------------------------------------
// Formatierung
// -----------------------------------------------------------------------------

/**
 * Formatiert Währungsbeträge
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatiert große Zahlen kompakt (1.234 → 1,2k)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(".", ",") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(".", ",") + "k";
  }
  return num.toString();
}

/**
 * Formatiert Prozentangaben
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Formatiert Datumsangaben
 */
export function formatDate(date: Date | string, format: "short" | "long" | "time" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  switch (format) {
    case "short":
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    case "long":
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    case "time":
      return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    default:
      return d.toLocaleDateString("de-DE");
  }
}

/**
 * Formatiert relative Zeit
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  if (hours < 24) return `vor ${hours} Std.`;
  if (days === 1) return "Gestern";
  if (days < 7) return `vor ${days} Tagen`;
  
  return formatDate(d, "short");
}

// -----------------------------------------------------------------------------
// Status Helpers
// -----------------------------------------------------------------------------

/**
 * Gibt Status-Konfiguration zurück
 */
export function getStatusConfig(status: string) {
  const key = status.toLowerCase();
  return STATUS_CONFIG[key] || {
    label: status,
    color: "#6b7280",
    bgColor: "#f9fafb",
  };
}

/**
 * Mappt API-Status zu lesbarem Label
 */
export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label;
}

// -----------------------------------------------------------------------------
// Alert Helpers
// -----------------------------------------------------------------------------

/**
 * Gibt Farben für Alert-Severity zurück
 */
export function getAlertColors(severity: AlertSeverity): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  switch (severity) {
    case "critical":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: "text-red-600",
      };
    case "warning":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: "text-amber-600",
      };
    case "info":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: "text-blue-600",
      };
    default:
      return {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-800",
        icon: "text-gray-600",
      };
  }
}

/**
 * Gibt Icon für Alert-Type zurück
 */
export function getAlertIcon(type: string): string {
  const icons: Record<string, string> = {
    nb_query: "HelpCircle",
    ibn_missing: "FileWarning",
    invoice_overdue: "Receipt",
    email_unassigned: "Mail",
    document_missing: "FileX",
    approval_received: "CheckCircle",
  };
  return icons[type] || "AlertCircle";
}

// -----------------------------------------------------------------------------
// Pipeline Helpers
// -----------------------------------------------------------------------------

/**
 * Berechnet Pipeline-Fortschritt in Prozent
 */
export function calculatePipelineProgress(
  stages: Array<{ key: string; count: number }>,
  completedKeys: string[] = ["genehmigt", "abgeschlossen"]
): number {
  const total = stages.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return 0;
  
  const completed = stages
    .filter(s => completedKeys.includes(s.key))
    .reduce((sum, s) => sum + s.count, 0);
  
  return Math.round((completed / total) * 100);
}

/**
 * Generiert Farbe für Pipeline-Stage
 */
export function getStageColor(key: string): string {
  const colors: Record<string, string> = {
    entwurf: "#64748b",
    eingereicht: "#3b82f6",
    pruefung: "#EAD068",
    warten_nb: "#f59e0b",
    nachbesserung: "#ef4444",
    genehmigt: "#22c55e",
    abgeschlossen: "#14b8a6",
  };
  return colors[key] || "#6b7280";
}

// -----------------------------------------------------------------------------
// Grid Operator Helpers
// -----------------------------------------------------------------------------

/**
 * Berechnet Performance-Score für Netzbetreiber
 */
export function calculateNBScore(avgDays: number, approvalRate: number): number {
  // Score von 0-100 basierend auf Bearbeitungszeit und Genehmigungsrate
  const timeScore = Math.max(0, 100 - (avgDays * 5)); // 20 Tage = 0 Punkte
  const rateScore = approvalRate;
  return Math.round((timeScore * 0.6) + (rateScore * 0.4));
}

/**
 * Generiert Trend-Indikator
 */
export function getTrendIndicator(trend: "up" | "down" | "stable"): {
  icon: string;
  color: string;
  label: string;
} {
  switch (trend) {
    case "up":
      return { icon: "TrendingUp", color: "text-red-500", label: "Langsamer" };
    case "down":
      return { icon: "TrendingDown", color: "text-green-500", label: "Schneller" };
    default:
      return { icon: "Minus", color: "text-gray-400", label: "Stabil" };
  }
}

// -----------------------------------------------------------------------------
// Chart Helpers
// -----------------------------------------------------------------------------

/**
 * Generiert Balken-Breite für Rankings (0-100%)
 */
export function getBarWidth(value: number, max: number): string {
  if (max === 0) return "0%";
  return `${Math.min(100, (value / max) * 100)}%`;
}

/**
 * Generiert Farbe basierend auf Wert (Rot → Gelb → Grün)
 */
export function getHeatmapColor(value: number, min: number, max: number): string {
  const normalized = (value - min) / (max - min);
  
  if (normalized <= 0.33) {
    return "#22c55e"; // Grün (gut/schnell)
  } else if (normalized <= 0.66) {
    return "#f59e0b"; // Gelb (mittel)
  } else {
    return "#ef4444"; // Rot (schlecht/langsam)
  }
}

// -----------------------------------------------------------------------------
// Misc Helpers
// -----------------------------------------------------------------------------

/**
 * Generiert eindeutige ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Debounce-Funktion
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Klassennamen zusammenführen (wie clsx/cn)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

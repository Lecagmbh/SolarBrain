/**
 * Comments Utilities
 */

/**
 * Format a date as relative time (vor X Minuten, vor X Stunden, etc.)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) {
    return "gerade eben";
  } else if (diffMinutes < 60) {
    return `vor ${diffMinutes} ${diffMinutes === 1 ? "Minute" : "Minuten"}`;
  } else if (diffHours < 24) {
    return `vor ${diffHours} ${diffHours === 1 ? "Stunde" : "Stunden"}`;
  } else if (diffDays === 1) {
    return "gestern";
  } else if (diffDays < 7) {
    return `vor ${diffDays} Tagen`;
  } else if (diffWeeks === 1) {
    return "vor 1 Woche";
  } else if (diffWeeks < 4) {
    return `vor ${diffWeeks} Wochen`;
  } else {
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * GROUPING UTILITIES
 * Gruppierung von Emails nach Datum, Absender oder AI-Typ
 */

import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import type { InboxEmail, EmailGroup, GroupMode } from "./types";
import { AI_TYPE_CONFIG } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════

export function getDateGroupLabel(date: Date): string {
  if (isToday(date)) return "Heute";
  if (isYesterday(date)) return "Gestern";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "Diese Woche";
  if (isThisMonth(date)) return "Dieser Monat";
  return "Älter";
}

function groupByDate(emails: InboxEmail[]): EmailGroup[] {
  const order = ["Heute", "Gestern", "Diese Woche", "Dieser Monat", "Älter"];
  const map = new Map<string, InboxEmail[]>();

  for (const e of emails) {
    const label = getDateGroupLabel(new Date(e.receivedAt));
    const arr = map.get(label);
    if (arr) arr.push(e);
    else map.set(label, [e]);
  }

  return order
    .filter(label => map.has(label))
    .map(label => ({ label, emails: map.get(label)! }));
}

function groupBySender(emails: InboxEmail[]): EmailGroup[] {
  const map = new Map<string, InboxEmail[]>();

  for (const e of emails) {
    const sender = e.fromName || e.fromAddress.split("@")[0];
    const arr = map.get(sender);
    if (arr) arr.push(e);
    else map.set(sender, [e]);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, "de"))
    .map(([label, emails]) => ({ label, emails }));
}

function groupByAiType(emails: InboxEmail[]): EmailGroup[] {
  const map = new Map<string, InboxEmail[]>();

  for (const e of emails) {
    const type = e.aiType || "SONSTIGE";
    const arr = map.get(type);
    if (arr) arr.push(e);
    else map.set(type, [e]);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, emails]) => ({
      label: AI_TYPE_CONFIG[type]?.label || type,
      emails,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════

export function groupEmails(emails: InboxEmail[], mode: GroupMode): EmailGroup[] {
  switch (mode) {
    case "date": return groupByDate(emails);
    case "sender": return groupBySender(emails);
    case "aiType": return groupByAiType(emails);
    case "none": return [{ label: "", emails }];
  }
}

/**
 * Brain Knowledge Tab - Knowledge entries management
 */

import { useState, useEffect } from "react";
import { brainApi } from "../../api/brain.api";
import type { BrainKnowledge } from "../../types/brain.types";

// Labels for known knowledge keys
const KEY_LABELS: Record<string, string> = {
  success_rate: "Erfolgsrate",
  avg_execution_time: "Durchschnittliche Ausfuehrungszeit",
  auto_trigger_stats: "Auto-Trigger Statistik",
  match_rate: "Zuordnungsrate",
  volume: "Email-Volumen",
  suggestion_stats: "Vorschlagsstatistik",
  alert_distribution: "Alert-Verteilung",
  completion_rate: "Abschlussrate",
  avg_duration: "Durchschnittliche Dauer",
  drop_off_steps: "Abbruch-Steps",
  popular_config: "Haeufigste Konfiguration",
  suggestion_acceptance: "Vorschlags-Akzeptanz",
  status_transitions: "Status-Uebergaenge",
  daily_activity: "Tagesaktivitaet",
  user_management: "Benutzerverwaltung",
  search_patterns: "Such-Muster",
  catalog_activity: "Katalog-Aktivitaet",
  evu_overview: "EVU-Uebersicht",
  evu_success_metrics: "EVU-Erfolgsmetriken",
  conversation_stats: "Konversations-Statistik",
  analysis_stats: "Analyse-Statistik",
  portal_stats: "Portal-Statistik",
  automation_stats: "Automatisierungs-Statistik",
};

const CATEGORY_LABELS: Record<string, string> = {
  agent_performance: "Agent-Performance",
  email_patterns: "Email-Muster",
  nb_portal: "NB-Portal",
  wizard_analytics: "Wizard-Analyse",
  installation_analytics: "Installations-Analyse",
  portal_activity: "Portal-Aktivitaet",
  user_admin_analytics: "Benutzer-Verwaltung",
  search_analytics: "Such-Analyse",
  produkt_analytics: "Produkt-Katalog",
  evu_analytics: "EVU-Analyse",
  whatsapp_analytics: "WhatsApp-Analyse",
  email_analysis_analytics: "Email-Analyse (AI)",
  endkunden_portal_analytics: "Endkunden-Portal",
  automation_analytics: "Automatisierung",
};

/** Render a structured knowledge value as readable UI */
function KnowledgeValue({ entry }: { entry: BrainKnowledge }) {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = typeof entry.value === "string" ? JSON.parse(entry.value) : null;
  } catch {
    // Not JSON - render as plain text
  }

  if (!parsed || typeof parsed !== "object") {
    return <div className="brain-kv-plain">{entry.value}</div>;
  }

  const compositeKey = `${entry.category}/${entry.key}`;

  // Specific renderers for known types
  switch (compositeKey) {
    case "agent_performance/success_rate": {
      const { rate, completed, failed, period } = parsed as { rate: number; completed: number; failed: number; period: string };
      const pct = Math.round((rate ?? 0) * 100);
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat brain-kv-stat-wide">
            <span className="brain-kv-stat-value brain-kv-stat-large">{pct}%</span>
            <div className="brain-kv-bar"><div className="brain-kv-bar-fill" style={{ width: `${pct}%`, background: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444" }} /></div>
          </div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{completed ?? 0}</span><span className="brain-kv-stat-label">Erfolgreich</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{failed ?? 0}</span><span className="brain-kv-stat-label">Fehlgeschlagen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    case "agent_performance/avg_execution_time": {
      const { overall, byType } = parsed as { overall: number; byType: Record<string, number> };
      const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat brain-kv-stat-wide"><span className="brain-kv-stat-value brain-kv-stat-large">{fmtMs(overall ?? 0)}</span><span className="brain-kv-stat-label">Gesamt-Durchschnitt</span></div>
          {byType && Object.entries(byType).map(([type, ms]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{fmtMs(ms)}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
        </div>
      );
    }

    case "agent_performance/auto_trigger_stats": {
      const { total, byType, topReasons } = parsed as { total: number; byType: Record<string, number>; topReasons: Array<{ reason: string; count: number }> };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Gesamt</span></div>
          {byType && Object.entries(byType).map(([type, count]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{count}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
          {topReasons && topReasons.length > 0 && (
            <div className="brain-kv-stat brain-kv-stat-wide">
              <span className="brain-kv-stat-label">Haeufigste Gruende</span>
              <div className="brain-kv-tags">{topReasons.map((r) => <span key={r.reason} className="brain-kv-tag">{r.reason} ({r.count})</span>)}</div>
            </div>
          )}
        </div>
      );
    }

    case "email_patterns/match_rate": {
      const { rate, matched, unmatched, period } = parsed as { rate: number; matched: number; unmatched: number; period: string };
      const pct = Math.round((rate ?? 0) * 100);
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat brain-kv-stat-wide">
            <span className="brain-kv-stat-value brain-kv-stat-large">{pct}%</span>
            <div className="brain-kv-bar"><div className="brain-kv-bar-fill" style={{ width: `${pct}%`, background: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }} /></div>
          </div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{matched ?? 0}</span><span className="brain-kv-stat-label">Zugeordnet</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{unmatched ?? 0}</span><span className="brain-kv-stat-label">Nicht zugeordnet</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    case "email_patterns/volume": {
      const { total, avgPerDay, period } = parsed as { total: number; avgPerDay: number; period: string };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Gesamt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{avgPerDay ?? 0}</span><span className="brain-kv-stat-label">pro Tag</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    case "nb_portal/suggestion_stats": {
      const { total, avgConfidence, byStatus } = parsed as { total: number; avgConfidence: number | null; byStatus: Record<string, number> };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Vorschlaege</span></div>
          {avgConfidence != null && (
            <div className="brain-kv-stat"><span className="brain-kv-stat-value">{Math.round(avgConfidence * 100)}%</span><span className="brain-kv-stat-label">Avg. Konfidenz</span></div>
          )}
          {byStatus && Object.entries(byStatus).map(([status, count]) => (
            <div key={status} className="brain-kv-stat"><span className="brain-kv-stat-value">{count}</span><span className="brain-kv-stat-label">{status}</span></div>
          ))}
        </div>
      );
    }

    case "nb_portal/alert_distribution": {
      const { total, byType } = parsed as { total: number; byType: Record<string, number> };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Alerts gesamt</span></div>
          {byType && Object.entries(byType).map(([type, count]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{count}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
        </div>
      );
    }

    // --- Wizard Analytics ---

    case "wizard_analytics/completion_rate": {
      const { rate, completed, aborted, period } = parsed as { rate: number; completed: number; aborted: number; period: string };
      const pct = Math.round((rate ?? 0) * 100);
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat brain-kv-stat-wide">
            <span className="brain-kv-stat-value brain-kv-stat-large">{pct}%</span>
            <div className="brain-kv-bar"><div className="brain-kv-bar-fill" style={{ width: `${pct}%`, background: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444" }} /></div>
          </div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{completed ?? 0}</span><span className="brain-kv-stat-label">Abgeschlossen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{aborted ?? 0}</span><span className="brain-kv-stat-label">Abgebrochen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    case "wizard_analytics/avg_duration": {
      const { overall, byStep } = parsed as { overall: number; byStep: Record<string, number> };
      const fmtSec = (s: number) => s >= 60 ? `${Math.round(s / 60)}min` : `${s}s`;
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat brain-kv-stat-wide"><span className="brain-kv-stat-value brain-kv-stat-large">{fmtSec(overall ?? 0)}</span><span className="brain-kv-stat-label">Gesamt-Durchschnitt</span></div>
          {byStep && Object.entries(byStep).map(([step, sec]) => (
            <div key={step} className="brain-kv-stat"><span className="brain-kv-stat-value">{fmtSec(sec as number)}</span><span className="brain-kv-stat-label">Step {step}</span></div>
          ))}
        </div>
      );
    }

    case "wizard_analytics/drop_off_steps": {
      const { byStep, topDropOff } = parsed as { byStep: Record<string, number>; topDropOff: number | null };
      return (
        <div className="brain-kv-grid">
          {topDropOff != null && (
            <div className="brain-kv-stat brain-kv-stat-wide"><span className="brain-kv-stat-value brain-kv-stat-large">Step {topDropOff}</span><span className="brain-kv-stat-label">Haeufigster Abbruch</span></div>
          )}
          {byStep && Object.entries(byStep).map(([step, count]) => (
            <div key={step} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">Step {step}</span></div>
          ))}
        </div>
      );
    }

    case "wizard_analytics/popular_config": {
      const { topKategorie, topKomponenten, avgKwp } = parsed as { topKategorie: string | null; topKomponenten: string[]; avgKwp: number | null };
      return (
        <div className="brain-kv-grid">
          {topKategorie && <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{topKategorie}</span><span className="brain-kv-stat-label">Top-Kategorie</span></div>}
          {avgKwp != null && <div className="brain-kv-stat"><span className="brain-kv-stat-value">{avgKwp} kWp</span><span className="brain-kv-stat-label">Avg. Leistung</span></div>}
          {topKomponenten && topKomponenten.length > 0 && (
            <div className="brain-kv-stat brain-kv-stat-wide">
              <span className="brain-kv-stat-label">Top-Komponenten</span>
              <div className="brain-kv-tags">{topKomponenten.map((k) => <span key={k} className="brain-kv-tag">{k}</span>)}</div>
            </div>
          )}
        </div>
      );
    }

    case "wizard_analytics/suggestion_acceptance": {
      const { rate, accepted, rejected, byType } = parsed as { rate: number; accepted: number; rejected: number; byType: Record<string, { accepted: number; rejected: number }> };
      const pct = Math.round((rate ?? 0) * 100);
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat brain-kv-stat-wide">
            <span className="brain-kv-stat-value brain-kv-stat-large">{pct}%</span>
            <div className="brain-kv-bar"><div className="brain-kv-bar-fill" style={{ width: `${pct}%`, background: pct >= 60 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444" }} /></div>
          </div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{accepted ?? 0}</span><span className="brain-kv-stat-label">Angenommen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{rejected ?? 0}</span><span className="brain-kv-stat-label">Abgelehnt</span></div>
          {byType && Object.entries(byType).map(([type, counts]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{(counts as any).accepted}/{(counts as any).accepted + (counts as any).rejected}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
        </div>
      );
    }

    // --- Installation Analytics ---

    case "installation_analytics/status_transitions": {
      const { total, byTransition, period } = parsed as { total: number; byTransition: Record<string, number>; period: string };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Gesamt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
          {byTransition && Object.entries(byTransition)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([transition, count]) => (
              <div key={transition} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">{transition}</span></div>
          ))}
        </div>
      );
    }

    // --- Portal Activity ---

    case "portal_activity/daily_activity": {
      const { logins, wizards, documents, invoices, kunden, comments, searches, pdfDownloads, settingsChanges, period } = parsed as {
        logins: number; wizards: number; documents: number; invoices: number; kunden: number;
        comments?: number; searches?: number; pdfDownloads?: number; settingsChanges?: number; period: string;
      };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{logins ?? 0}</span><span className="brain-kv-stat-label">Logins</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{wizards ?? 0}</span><span className="brain-kv-stat-label">Wizards</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{documents ?? 0}</span><span className="brain-kv-stat-label">Dokumente</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{invoices ?? 0}</span><span className="brain-kv-stat-label">Rechnungen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{kunden ?? 0}</span><span className="brain-kv-stat-label">Kunden</span></div>
          {(comments != null && comments > 0) && <div className="brain-kv-stat"><span className="brain-kv-stat-value">{comments}</span><span className="brain-kv-stat-label">Kommentare</span></div>}
          {(searches != null && searches > 0) && <div className="brain-kv-stat"><span className="brain-kv-stat-value">{searches}</span><span className="brain-kv-stat-label">Suchen</span></div>}
          {(pdfDownloads != null && pdfDownloads > 0) && <div className="brain-kv-stat"><span className="brain-kv-stat-value">{pdfDownloads}</span><span className="brain-kv-stat-label">PDF-Downloads</span></div>}
          {(settingsChanges != null && settingsChanges > 0) && <div className="brain-kv-stat"><span className="brain-kv-stat-value">{settingsChanges}</span><span className="brain-kv-stat-label">Einstellungen</span></div>}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- User Admin Analytics ---

    case "user_admin_analytics/user_management": {
      const { created, deleted, blocked, roleChanges, period } = parsed as { created: number; deleted: number; blocked: number; roleChanges: number; period: string };
      const total = (created ?? 0) + (deleted ?? 0) + (blocked ?? 0) + (roleChanges ?? 0);
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total}</span><span className="brain-kv-stat-label">Gesamt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{created ?? 0}</span><span className="brain-kv-stat-label">Erstellt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{deleted ?? 0}</span><span className="brain-kv-stat-label">Geloescht</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{blocked ?? 0}</span><span className="brain-kv-stat-label">Gesperrt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{roleChanges ?? 0}</span><span className="brain-kv-stat-label">Rollenaenderungen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- Search Analytics ---

    case "search_analytics/search_patterns": {
      const { total, avgResults, byType, period } = parsed as { total: number; avgResults: number; byType: Record<string, number>; period: string };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Suchen gesamt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{avgResults ?? 0}</span><span className="brain-kv-stat-label">Avg. Ergebnisse</span></div>
          {byType && Object.entries(byType).map(([type, count]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- Produkt Analytics ---

    case "produkt_analytics/catalog_activity": {
      const { created, updated, deleted, imported, byType, period } = parsed as {
        created: number; updated: number; deleted: number; imported: number; byType: Record<string, number>; period: string;
      };
      const total = (created ?? 0) + (updated ?? 0) + (deleted ?? 0) + (imported ?? 0);
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total}</span><span className="brain-kv-stat-label">Gesamt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{created ?? 0}</span><span className="brain-kv-stat-label">Erstellt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{updated ?? 0}</span><span className="brain-kv-stat-label">Aktualisiert</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{deleted ?? 0}</span><span className="brain-kv-stat-label">Geloescht</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{imported ?? 0}</span><span className="brain-kv-stat-label">Importiert</span></div>
          {byType && Object.entries(byType).map(([type, count]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- EVU Analytics ---

    case "evu_analytics/evu_overview": {
      const { totalEvents, byEventType, byIssueCategory, topIssue, period } = parsed as {
        totalEvents: number; byEventType: Record<string, number>; byIssueCategory: Record<string, number>; topIssue: string | null; period: string;
      };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{totalEvents ?? 0}</span><span className="brain-kv-stat-label">Events gesamt</span></div>
          {topIssue && <div className="brain-kv-stat"><span className="brain-kv-stat-value" style={{ color: "#ef4444" }}>{topIssue}</span><span className="brain-kv-stat-label">Top-Problem</span></div>}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
          {byIssueCategory && Object.entries(byIssueCategory).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, count]) => (
            <div key={cat} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">{cat}</span></div>
          ))}
          {byEventType && (
            <div className="brain-kv-stat brain-kv-stat-wide">
              <span className="brain-kv-stat-label">Event-Typen</span>
              <div className="brain-kv-tags">{Object.entries(byEventType).map(([type, count]) => <span key={type} className="brain-kv-tag">{type} ({count as number})</span>)}</div>
            </div>
          )}
        </div>
      );
    }

    case "evu_analytics/evu_success_metrics": {
      const { approvals, rejections, rate, analysesCompleted, warningsGenerated, period } = parsed as {
        approvals: number; rejections: number; rate: number | null; analysesCompleted: number; warningsGenerated: number; period: string;
      };
      const pct = rate != null ? Math.round(rate * 100) : null;
      return (
        <div className="brain-kv-grid">
          {pct != null && (
            <div className="brain-kv-stat brain-kv-stat-wide">
              <span className="brain-kv-stat-value brain-kv-stat-large">{pct}%</span>
              <div className="brain-kv-bar"><div className="brain-kv-bar-fill" style={{ width: `${pct}%`, background: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444" }} /></div>
            </div>
          )}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{approvals ?? 0}</span><span className="brain-kv-stat-label">Genehmigungen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{rejections ?? 0}</span><span className="brain-kv-stat-label">Ablehnungen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{analysesCompleted ?? 0}</span><span className="brain-kv-stat-label">Analysen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{warningsGenerated ?? 0}</span><span className="brain-kv-stat-label">Warnungen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- WhatsApp Analytics ---

    case "whatsapp_analytics/conversation_stats": {
      const { conversationsCompleted, messagesReceived, avgMessagesPerConversation, byIntent, period } = parsed as {
        conversationsCompleted: number; messagesReceived: number; avgMessagesPerConversation: number;
        byIntent: Record<string, number>; period: string;
      };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{conversationsCompleted ?? 0}</span><span className="brain-kv-stat-label">Konversationen</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{messagesReceived ?? 0}</span><span className="brain-kv-stat-label">Nachrichten</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{avgMessagesPerConversation ?? 0}</span><span className="brain-kv-stat-label">Avg. pro Konversation</span></div>
          {byIntent && Object.entries(byIntent).length > 0 && (
            <div className="brain-kv-stat brain-kv-stat-wide">
              <span className="brain-kv-stat-label">Intents</span>
              <div className="brain-kv-tags">{Object.entries(byIntent).sort(([, a], [, b]) => (b as number) - (a as number)).map(([intent, count]) => <span key={intent} className="brain-kv-tag">{intent} ({count as number})</span>)}</div>
            </div>
          )}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- Email Analysis Analytics ---

    case "email_analysis_analytics/analysis_stats": {
      const { total, avgConfidence, byType, period } = parsed as {
        total: number; avgConfidence: number | null; byType: Record<string, number>; period: string;
      };
      const confPct = avgConfidence != null ? Math.round(avgConfidence * 100) : null;
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{total ?? 0}</span><span className="brain-kv-stat-label">Analysen gesamt</span></div>
          {confPct != null && (
            <div className="brain-kv-stat">
              <span className="brain-kv-stat-value">{confPct}%</span>
              <span className="brain-kv-stat-label">Avg. Konfidenz</span>
            </div>
          )}
          {byType && Object.entries(byType).sort(([, a], [, b]) => (b as number) - (a as number)).map(([type, count]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- Endkunden-Portal Analytics ---

    case "endkunden_portal_analytics/portal_stats": {
      const { usersCreated, consentsGiven, totalConsentEvents, byConsentType, documentRequests, period } = parsed as {
        usersCreated: number; consentsGiven: number; totalConsentEvents: number;
        byConsentType: Record<string, number>; documentRequests: number; period: string;
      };
      const consentRate = totalConsentEvents > 0 ? Math.round((consentsGiven / totalConsentEvents) * 100) : 0;
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{usersCreated ?? 0}</span><span className="brain-kv-stat-label">Neue Portal-User</span></div>
          <div className="brain-kv-stat">
            <span className="brain-kv-stat-value">{consentRate}%</span>
            <span className="brain-kv-stat-label">Consent-Rate</span>
          </div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{documentRequests ?? 0}</span><span className="brain-kv-stat-label">Dok.-Anforderungen</span></div>
          {byConsentType && Object.entries(byConsentType).map(([type, count]) => (
            <div key={type} className="brain-kv-stat"><span className="brain-kv-stat-value">{count as number}</span><span className="brain-kv-stat-label">{type}</span></div>
          ))}
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
        </div>
      );
    }

    // --- Automation Analytics ---

    case "automation_analytics/automation_stats": {
      const { totalRuns, byType, period } = parsed as {
        totalRuns: number; byType: Record<string, { runs: number; processed: number; acted: number; errors: number }>; period: string;
      };
      return (
        <div className="brain-kv-grid">
          <div className="brain-kv-stat"><span className="brain-kv-stat-value brain-kv-stat-large">{totalRuns ?? 0}</span><span className="brain-kv-stat-label">Laeufe gesamt</span></div>
          <div className="brain-kv-stat"><span className="brain-kv-stat-value">{period ?? "7d"}</span><span className="brain-kv-stat-label">Zeitraum</span></div>
          {byType && Object.entries(byType).map(([type, stats]) => {
            const s = stats as { runs: number; processed: number; acted: number; errors: number };
            const rate = s.processed > 0 ? Math.round((s.acted / s.processed) * 100) : 0;
            return (
              <div key={type} className="brain-kv-stat brain-kv-stat-wide">
                <span className="brain-kv-stat-label">{type}</span>
                <div className="brain-kv-tags">
                  <span className="brain-kv-tag">{s.runs}x gelaufen</span>
                  <span className="brain-kv-tag">{s.processed} verarbeitet</span>
                  <span className="brain-kv-tag">{s.acted} Aktionen ({rate}%)</span>
                  {s.errors > 0 && <span className="brain-kv-tag" style={{ color: "#ef4444" }}>{s.errors} Fehler</span>}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    default: {
      // Generic: render as key-value pairs
      return (
        <div className="brain-kv-grid">
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} className="brain-kv-stat">
              <span className="brain-kv-stat-value">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
              <span className="brain-kv-stat-label">{k}</span>
            </div>
          ))}
        </div>
      );
    }
  }
}

export function KnowledgeTab() {
  const [entries, setEntries] = useState<BrainKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // Form state
  const [formCategory, setFormCategory] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formSource, setFormSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadKnowledge();
  }, [categoryFilter]);

  const loadKnowledge = async () => {
    try {
      const res = await brainApi.getKnowledge(categoryFilter || undefined, 50);
      const items = res.entries || [];
      setEntries(items);

      // Extract unique categories for the filter
      const cats = [...new Set(items.map((e) => e.category))].sort();
      if (cats.length > 0 && categories.length === 0) {
        setCategories(cats);
      }
    } catch (err) {
      console.error("Wissen laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory.trim() || !formKey.trim() || !formValue.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await brainApi.addKnowledge({
        category: formCategory.trim(),
        key: formKey.trim(),
        value: formValue.trim(),
        source: formSource.trim() || undefined,
      });
      setMessage({ type: "success", text: "Wissen erfolgreich hinzugefuegt." });
      setFormCategory("");
      setFormKey("");
      setFormValue("");
      setFormSource("");
      loadKnowledge();
    } catch (err) {
      setMessage({ type: "error", text: "Fehler beim Hinzufuegen." });
      console.error("Wissen hinzufuegen fehlgeschlagen:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="brain-tab-loading"><div className="brain-spinner" /></div>;
  }

  return (
    <div className="brain-tab-content">
      {/* Message */}
      {message && (
        <div className={`brain-message brain-message-${message.type}`}>
          <span>{message.text}</span>
          <button className="brain-message-close" onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      {/* Add Knowledge Form */}
      <div className="brain-section">
        <h3>Wissen hinzufuegen</h3>
        <form onSubmit={handleSubmit}>
          <div className="brain-form-grid">
            <div className="brain-form-group">
              <label>Kategorie</label>
              <input
                className="brain-input"
                type="text"
                placeholder="z.B. produkt, faq, intern"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                required
              />
            </div>
            <div className="brain-form-group">
              <label>Schluessel</label>
              <input
                className="brain-input"
                type="text"
                placeholder="z.B. oeffnungszeiten"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                required
              />
            </div>
            <div className="brain-form-group">
              <label>Quelle</label>
              <input
                className="brain-input"
                type="text"
                placeholder="z.B. website, handbuch"
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
              />
            </div>
            <div className="brain-form-group brain-form-full">
              <label>Wert</label>
              <textarea
                className="brain-textarea"
                placeholder="Wissensinhalt eingeben..."
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
            <button className="brain-btn-primary" type="submit" disabled={submitting}>
              {submitting && <span className="brain-spinner-small" />}
              Hinzufuegen
            </button>
          </div>
        </form>
      </div>

      {/* Filter + Header */}
      <div className="brain-section-header">
        <h3>Wissenseintraege ({entries.length})</h3>
        <div className="brain-header-actions">
          <select
            className="brain-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button className="brain-btn-ghost" onClick={loadKnowledge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Knowledge Entries */}
      {entries.length === 0 ? (
        <div className="brain-empty">Keine Wissenseintraege gefunden.</div>
      ) : (
        <div className="brain-knowledge-list">
          {entries.map((entry) => (
            <div key={entry.id} className="brain-knowledge-entry">
              <div className="brain-knowledge-header">
                <span className="brain-badge brain-badge-emerald">{CATEGORY_LABELS[entry.category] ?? entry.category}</span>
                <span className="brain-knowledge-key">{KEY_LABELS[entry.key] ?? entry.key}</span>
              </div>
              <div className="brain-knowledge-value">
                <KnowledgeValue entry={entry} />
              </div>
              <div className="brain-confidence-bar">
                <div
                  className="brain-confidence-fill"
                  style={{ width: `${(entry.confidence * 100).toFixed(0)}%` }}
                />
              </div>
              <div className="brain-knowledge-meta">
                <span>Konfidenz: {(entry.confidence * 100).toFixed(0)}%</span>
                <span>Quelle: {entry.source || "unbekannt"}</span>
                <span>{new Date(entry.createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

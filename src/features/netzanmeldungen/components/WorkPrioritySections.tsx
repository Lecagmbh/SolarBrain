/**
 * WORK PRIORITY SECTIONS v3.0 - NEUES KLARES DESIGN
 * ==================================================
 * - "DEINE AUFGABEN HEUTE" als Herzstück - immer offen
 * - Tabellenformat für schnelles Scannen
 * - "Beim NB" und "Abgeschlossen" collapsed by default
 */

import { useState, useMemo } from "react";
import {
  ChevronDown, ChevronRight, CheckCircle, Clock,
  Building2, MapPin, Send, Phone, Edit3, Play,
  Calendar, Bell, AlertTriangle, FileCheck, ExternalLink,
} from "lucide-react";
import type { InstallationListItem } from "../types";
import { getDaysOld, getDaysUntil } from "../utils";
import "./WorkPrioritySections.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface WorkPrioritySectionsProps {
  items: InstallationListItem[];
  onOpen: (id: number) => void;
  onQuickAction?: (id: number, action: string) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}

interface TaskGroup {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: InstallationListItem[];
  actionLabel: string;
  actionKey: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function categorizeItems(items: InstallationListItem[]) {
  const rueckfragen: InstallationListItem[] = [];
  const einreichen: InstallationListItem[] = [];
  const ibnErstellen: InstallationListItem[] = [];
  const zaehlerTermine: InstallationListItem[] = [];
  const beimNB: InstallationListItem[] = [];
  const abgeschlossen: InstallationListItem[] = [];

  items.forEach(item => {
    const status = (item.status || "eingang").toLowerCase().replace(/-/g, "_");

    // FERTIG oder STORNIERT -> Abgeschlossen
    if (status === "fertig" || status === "storniert" || status === "abgeschlossen") {
      abgeschlossen.push(item);
      return;
    }

    // RUECKFRAGE -> Rückfragen beantworten
    if (status === "rueckfrage" || status === "nachbesserung") {
      rueckfragen.push(item);
      return;
    }

    // GENEHMIGT oder IBN -> IBN erstellen
    if (status === "genehmigt" || status === "nb_genehmigt" || status === "ibn") {
      // Check Zählerwechsel-Termin
      if (item.zaehlerwechselDatum) {
        const daysUntil = getDaysUntil(item.zaehlerwechselDatum);
        if (daysUntil >= 0 && daysUntil <= 14) {
          zaehlerTermine.push(item);
          return;
        }
      }
      ibnErstellen.push(item);
      return;
    }

    // BEIM_NB oder WARTEN_AUF_NB -> Beim Netzbetreiber
    if (status === "beim_nb" || status === "warten_auf_nb") {
      beimNB.push(item);
      return;
    }

    // EINGANG -> Beim NB einreichen
    if (status === "eingang" || status === "entwurf") {
      einreichen.push(item);
      return;
    }

    // Fallback
    einreichen.push(item);
  });

  return { rueckfragen, einreichen, ibnErstellen, zaehlerTermine, beimNB, abgeschlossen };
}

// Mock Rückfragegrund - später aus Backend holen
function getQueryReason(item: InstallationListItem): string {
  const reasons = [
    "Modulzertifikat fehlt",
    "Lageplan unleserlich",
    "Datenblatt veraltet",
    "Schaltplan unvollständig",
    "Wechselrichter-Daten fehlen",
  ];
  return reasons[item.id % reasons.length];
}

// ═══════════════════════════════════════════════════════════════════════════
// TABLE ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TaskRow({
  item,
  extra,
  actionLabel,
  actionVariant = "default",
  onOpen,
  onAction,
  isSelected,
  onToggleSelect,
}: {
  item: InstallationListItem;
  extra?: React.ReactNode;
  actionLabel: string;
  actionVariant?: "default" | "primary" | "success" | "warning";
  onOpen: () => void;
  onAction: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <tr className="wps-row" onClick={onOpen}>
      {onToggleSelect && (
        <td className="wps-row__checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={onToggleSelect}
          />
        </td>
      )}
      <td className="wps-row__name">
        {item.customerName || "Unbekannt"}
      </td>
      <td className="wps-row__location">
        {item.plz} {item.ort}
      </td>
      <td className="wps-row__kwp">
        {item.totalKwp?.toFixed(1) || "0"} kWp
      </td>
      <td className="wps-row__nb">
        {item.gridOperator || "-"}
      </td>
      <td className="wps-row__extra">
        {extra}
      </td>
      <td className="wps-row__action">
        <button
          className={`wps-btn wps-btn--${actionVariant}`}
          onClick={(e) => { e.stopPropagation(); onAction(); }}
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK GROUP COMPONENT (Untergruppe in "DEINE AUFGABEN HEUTE")
// ═══════════════════════════════════════════════════════════════════════════

function TaskGroupSection({
  group,
  onOpen,
  onQuickAction,
  selectedIds,
  onToggleSelect,
}: {
  group: TaskGroup;
  onOpen: (id: number) => void;
  onQuickAction?: (id: number, action: string) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (group.items.length === 0) return null;

  return (
    <div className="wps-task-group">
      <div
        className="wps-task-group__header"
        style={{ "--group-color": group.color } as React.CSSProperties}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="wps-task-group__icon">{group.icon}</span>
        <span className="wps-task-group__title">{group.title}</span>
        <span className="wps-task-group__count">({group.items.length})</span>
        <span className="wps-task-group__toggle">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {isExpanded && (
        <table className="wps-table">
          <tbody>
            {group.items.map(item => {
              let extra: React.ReactNode = null;
              let actionVariant: "default" | "primary" | "success" | "warning" = "default";

              // Bestimme Extra-Info und Button-Variante je nach Gruppe
              if (group.key === "rueckfragen") {
                extra = (
                  <span className="wps-tag wps-tag--error">
                    "{getQueryReason(item)}"
                  </span>
                );
                actionVariant = "default";
              } else if (group.key === "einreichen") {
                extra = (
                  <span className="wps-tag wps-tag--success">
                    <CheckCircle size={12} /> Vollständig
                  </span>
                );
                actionVariant = "primary";
              } else if (group.key === "ibn") {
                const nbDate = item.nbGenehmigungAm || item.updatedAt;
                extra = (
                  <span className="wps-tag wps-tag--info">
                    Genehmigt {new Date(nbDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </span>
                );
                actionVariant = "success";
              } else if (group.key === "zaehler") {
                extra = (
                  <span className="wps-tag wps-tag--purple">
                    <Calendar size={12} />
                    {new Date(item.zaehlerwechselDatum!).toLocaleDateString("de-DE", {
                      weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                );
                actionVariant = "warning";
              }

              return (
                <TaskRow
                  key={item.id}
                  item={item}
                  extra={extra}
                  actionLabel={group.actionLabel}
                  actionVariant={actionVariant}
                  onOpen={() => onOpen(item.id)}
                  onAction={() => {
                    if (onQuickAction) {
                      onQuickAction(item.id, group.actionKey);
                    } else {
                      onOpen(item.id);
                    }
                  }}
                  isSelected={selectedIds?.has(item.id)}
                  onToggleSelect={onToggleSelect ? () => onToggleSelect(item.id) : undefined}
                />
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLAPSED SECTION (Beim NB, Abgeschlossen)
// ═══════════════════════════════════════════════════════════════════════════

function CollapsedSection({
  title,
  emoji,
  count,
  items,
  color,
  defaultExpanded = false,
  onOpen,
  selectedIds,
  onToggleSelect,
}: {
  title: string;
  emoji: string;
  count: number;
  items: InstallationListItem[];
  color: string;
  defaultExpanded?: boolean;
  onOpen: (id: number) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Group by Netzbetreiber for "Beim NB"
  const groupedByNB = useMemo(() => {
    const byNB = new Map<string, { items: InstallationListItem[]; avgDays: number }>();
    items.forEach(item => {
      const nb = item.gridOperator || "Unbekannt";
      if (!byNB.has(nb)) {
        byNB.set(nb, { items: [], avgDays: 0 });
      }
      byNB.get(nb)!.items.push(item);
    });
    // Calculate avg days
    byNB.forEach((data, _) => {
      if (data.items.length > 0) {
        data.avgDays = Math.round(
          data.items.reduce((sum, i) => sum + getDaysOld(i.createdAt), 0) / data.items.length
        );
      }
    });
    return Array.from(byNB.entries()).sort((a, b) => b[1].avgDays - a[1].avgDays);
  }, [items]);

  return (
    <div className="wps-collapsed-section" style={{ "--section-color": color } as React.CSSProperties}>
      <button
        className="wps-collapsed-section__header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="wps-collapsed-section__emoji">{emoji}</span>
        <span className="wps-collapsed-section__title">{title}</span>
        <span className="wps-collapsed-section__count">({count})</span>
        <span className="wps-collapsed-section__toggle">
          {isExpanded ? "Einklappen" : "Aufklappen"}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {isExpanded && (
        <div className="wps-collapsed-section__content">
          {title.includes("Netzbetreiber") ? (
            // Grouped by NB view
            <div className="wps-nb-groups">
              {groupedByNB.map(([nb, data]) => (
                <div key={nb} className="wps-nb-group">
                  <div className="wps-nb-group__header">
                    <Building2 size={14} />
                    <span className="wps-nb-group__name">{nb}</span>
                    <span className="wps-nb-group__stats">
                      {data.items.length} Anmeldungen | Ø {data.avgDays} Tage
                    </span>
                  </div>
                  <table className="wps-table wps-table--compact">
                    <tbody>
                      {data.items.slice(0, 10).map(item => (
                        <tr key={item.id} className="wps-row" onClick={() => onOpen(item.id)}>
                          {onToggleSelect && (
                            <td className="wps-row__checkbox" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds?.has(item.id) || false}
                                onChange={() => onToggleSelect(item.id)}
                              />
                            </td>
                          )}
                          <td className="wps-row__name">{item.customerName}</td>
                          <td className="wps-row__location">{item.plz} {item.ort}</td>
                          <td className="wps-row__kwp">{item.totalKwp?.toFixed(1) || "0"} kWp</td>
                          <td className="wps-row__days">
                            <Clock size={12} /> {getDaysOld(item.createdAt)}d
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.items.length > 10 && (
                    <div className="wps-nb-group__more">
                      +{data.items.length - 10} weitere
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Simple list for "Abgeschlossen"
            <table className="wps-table wps-table--compact">
              <tbody>
                {items.slice(0, 20).map(item => (
                  <tr key={item.id} className="wps-row" onClick={() => onOpen(item.id)}>
                    {onToggleSelect && (
                      <td className="wps-row__checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds?.has(item.id) || false}
                          onChange={() => onToggleSelect(item.id)}
                        />
                      </td>
                    )}
                    <td className="wps-row__name">{item.customerName}</td>
                    <td className="wps-row__location">{item.plz} {item.ort}</td>
                    <td className="wps-row__kwp">{item.totalKwp?.toFixed(1) || "0"} kWp</td>
                    <td className="wps-row__nb">{item.gridOperator || "-"}</td>
                    <td className="wps-row__action">
                      <button
                        className="wps-btn wps-btn--small"
                        onClick={(e) => { e.stopPropagation(); onOpen(item.id); }}
                      >
                        <ExternalLink size={12} /> Ansehen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {items.length > 20 && title.includes("Abgeschlossen") && (
            <div className="wps-collapsed-section__more">
              +{items.length - 20} weitere abgeschlossene Anmeldungen
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function WorkPrioritySections({ items, onOpen, onQuickAction, selectedIds, onToggleSelect }: WorkPrioritySectionsProps) {
  const categorized = useMemo(() => categorizeItems(items), [items]);

  // Build task groups for "DEINE AUFGABEN HEUTE"
  const taskGroups: TaskGroup[] = useMemo(() => {
    const groups: TaskGroup[] = [];

    if (categorized.rueckfragen.length > 0) {
      groups.push({
        key: "rueckfragen",
        title: "Rückfragen beantworten",
        icon: <AlertTriangle size={16} />,
        color: "#ef4444",
        items: categorized.rueckfragen.sort((a, b) => getDaysOld(b.createdAt) - getDaysOld(a.createdAt)),
        actionLabel: "Bearbeiten",
        actionKey: "view_query",
      });
    }

    if (categorized.einreichen.length > 0) {
      groups.push({
        key: "einreichen",
        title: "Beim NB einreichen",
        icon: <Send size={16} />,
        color: "#3b82f6",
        items: categorized.einreichen.sort((a, b) => getDaysOld(b.createdAt) - getDaysOld(a.createdAt)),
        actionLabel: "Einreichen",
        actionKey: "submit_to_nb",
      });
    }

    if (categorized.ibnErstellen.length > 0) {
      groups.push({
        key: "ibn",
        title: "IBN erstellen",
        icon: <FileCheck size={16} />,
        color: "#22c55e",
        items: categorized.ibnErstellen,
        actionLabel: "IBN starten",
        actionKey: "start_ibn",
      });
    }

    if (categorized.zaehlerTermine.length > 0) {
      groups.push({
        key: "zaehler",
        title: "Zählerwechsel anstehend",
        icon: <Calendar size={16} />,
        color: "#EAD068",
        items: categorized.zaehlerTermine.sort((a, b) => {
          const dateA = new Date(a.zaehlerwechselDatum || "9999").getTime();
          const dateB = new Date(b.zaehlerwechselDatum || "9999").getTime();
          return dateA - dateB;
        }),
        actionLabel: "Kunde informieren",
        actionKey: "inform_customer",
      });
    }

    return groups;
  }, [categorized]);

  const totalTasks = taskGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Empty state
  if (items.length === 0) {
    return (
      <div className="wps-empty">
        <CheckCircle size={48} />
        <h3>Alles erledigt!</h3>
        <p>Keine offenen Anmeldungen vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="wps-container">
      {/* DEINE AUFGABEN HEUTE */}
      {totalTasks > 0 && (
        <div className="wps-main-section">
          <div className="wps-main-section__header">
            <span className="wps-main-section__icon">🔴</span>
            <h2 className="wps-main-section__title">DEINE AUFGABEN HEUTE</h2>
            <span className="wps-main-section__count">{totalTasks}</span>
          </div>

          <div className="wps-main-section__content">
            {taskGroups.map(group => (
              <TaskGroupSection
                key={group.key}
                group={group}
                onOpen={onOpen}
                onQuickAction={onQuickAction}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* BEIM NETZBETREIBER - collapsed */}
      {categorized.beimNB.length > 0 && (
        <CollapsedSection
          title="Beim Netzbetreiber"
          emoji="🟡"
          count={categorized.beimNB.length}
          items={categorized.beimNB}
          color="#f59e0b"
          defaultExpanded={false}
          onOpen={onOpen}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      )}

      {/* ABGESCHLOSSEN - collapsed */}
      {categorized.abgeschlossen.length > 0 && (
        <CollapsedSection
          title="Abgeschlossen"
          emoji="✅"
          count={categorized.abgeschlossen.length}
          items={categorized.abgeschlossen}
          color="#64748b"
          defaultExpanded={false}
          onOpen={onOpen}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      )}

      {/* Hinweis wenn keine Aufgaben */}
      {totalTasks === 0 && categorized.beimNB.length > 0 && (
        <div className="wps-no-tasks">
          <CheckCircle size={32} />
          <h3>Keine direkten Aufgaben!</h3>
          <p>Alle Anmeldungen sind beim Netzbetreiber oder abgeschlossen.</p>
        </div>
      )}
    </div>
  );
}

export default WorkPrioritySections;

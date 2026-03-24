// ============================================
// FINANZEN MODULE - INVOICE TABLE
// ============================================

import { Check, ChevronDown, Eye, MoreHorizontal } from "lucide-react";
import type { InvoiceTableProps } from "../types";
import { 
  formatRelativeDate, 
  formatDate, 
  formatCurrency, 
  getStatusInfo, 
  isOverdue,
  clsx
} from "../utils";
import { Avatar } from "./common";

// ============================================
// COMPONENT
// ============================================

export function InvoiceTable({
  invoices,
  selectedId,
  onSelect,
  onSort,
  sortKey,
  sortDir,
  bulkMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  onMarkPaid,
  onPreview,
  isKunde = false,
}: InvoiceTableProps) {
  const renderSortIcon = (key: string) => {
    if (sortKey !== key) return null;
    return (
      <ChevronDown
        size={14}
        className={clsx(
          "fin-table__sort-icon",
          sortDir === "asc" && "fin-table__sort-icon--asc"
        )}
      />
    );
  };

  return (
    <div className="fin-table-wrap">
      <table className="fin-table">
        <thead>
          <tr>
            {bulkMode && <th className="fin-table__th--checkbox" />}
            <th
              className="fin-table__th--sortable"
              onClick={() => onSort("rechnungsnummer")}
            >
              Nummer {renderSortIcon("rechnungsnummer")}
            </th>
            <th
              className="fin-table__th--sortable"
              onClick={() => onSort("kunde_name")}
            >
              Kunde {renderSortIcon("kunde_name")}
            </th>
            <th
              className="fin-table__th--sortable"
              onClick={() => onSort("rechnungs_datum")}
            >
              Datum {renderSortIcon("rechnungs_datum")}
            </th>
            <th>Status</th>
            <th
              className="fin-table__th--sortable fin-table__th--right"
              onClick={() => onSort("betrag_brutto")}
            >
              Betrag {renderSortIcon("betrag_brutto")}
            </th>
            <th className="fin-table__th--actions">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, index) => {
            const isActive = invoice.id === selectedId;
            const isSelected = selectedIds.has(invoice.id);
            const overdue = isOverdue(invoice);
            const status = getStatusInfo(invoice.status);
            const StatusIcon = status.icon;

            return (
              <tr
                key={invoice.id}
                className={clsx(
                  "fin-table__row",
                  isActive && "fin-table__row--active",
                  isSelected && "fin-table__row--selected",
                  overdue && "fin-table__row--overdue"
                )}
                onClick={() => !bulkMode && onSelect(invoice.id)}
                style={{ "--row-delay": `${index * 0.03}s` } as React.CSSProperties}
              >
                {/* Checkbox */}
                {bulkMode && (
                  <td
                    className="fin-table__td--checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="fin-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(invoice.id)}
                      />
                      <span className="fin-checkbox__box">
                        <Check size={12} />
                      </span>
                    </label>
                  </td>
                )}

                {/* Invoice Number */}
                <td className="fin-table__td--number">
                  <span className="fin-invoice-number">
                    {invoice.rechnungsnummer}
                  </span>
                </td>

                {/* Customer */}
                <td className="fin-table__td--customer">
                  <div className="fin-customer">
                    <Avatar name={invoice.kunde_name} size={32} />
                    <span className="fin-customer__name">
                      {invoice.kunde_name}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="fin-table__td--date">
                  <span title={formatDate(invoice.rechnungs_datum)}>
                    {formatRelativeDate(invoice.rechnungs_datum)}
                  </span>
                </td>

                {/* Status */}
                <td className="fin-table__td--status">
                  <span
                    className="fin-status"
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                    }}
                  >
                    <StatusIcon size={12} />
                    {overdue ? "Überfällig" : status.label}
                  </span>
                </td>

                {/* Amount */}
                <td className="fin-table__td--amount">
                  <span className="fin-amount">
                    {formatCurrency(invoice.betrag_brutto)}
                  </span>
                </td>

                {/* Actions */}
                <td
                  className="fin-table__td--actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="fin-actions">
                    <button
                      className="fin-action-btn"
                      title="Vorschau"
                      onClick={() => onPreview?.(invoice.id)}
                    >
                      <Eye size={16} />
                    </button>
                    {!isKunde &&
                      invoice.status !== "BEZAHLT" &&
                      invoice.status !== "STORNIERT" && (
                        <button
                          className="fin-action-btn fin-action-btn--success"
                          title="Als bezahlt markieren"
                          onClick={() => onMarkPaid?.(invoice.id)}
                        >
                          <Check size={16} />
                        </button>
                      )}
                    <button className="fin-action-btn" title="Mehr Optionen">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

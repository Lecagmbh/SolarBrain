// ============================================
// FINANZEN MODULE - INVOICE GRID
// ============================================

import type { InvoiceGridProps } from "../types";
import { 
  formatRelativeDate, 
  formatCurrency, 
  getStatusInfo, 
  isOverdue,
  clsx 
} from "../utils";
import { Avatar } from "./common";

// ============================================
// COMPONENT
// ============================================

export function InvoiceGrid({
  invoices,
  selectedId,
  onSelect,
}: InvoiceGridProps) {
  return (
    <div className="fin-grid">
      {invoices.map((invoice, index) => {
        const isActive = invoice.id === selectedId;
        const overdue = isOverdue(invoice);
        const status = getStatusInfo(invoice.status);
        const StatusIcon = status.icon;

        return (
          <div
            key={invoice.id}
            className={clsx(
              "fin-card",
              isActive && "fin-card--active",
              overdue && "fin-card--overdue"
            )}
            onClick={() => onSelect(invoice.id)}
            style={{ "--card-delay": `${index * 0.05}s` } as React.CSSProperties}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(invoice.id)}
          >
            {/* Header */}
            <div className="fin-card__header">
              <span className="fin-card__number">
                {invoice.rechnungsnummer}
              </span>
              <span
                className="fin-status fin-status--sm"
                style={{
                  backgroundColor: status.bg,
                  color: status.color,
                }}
              >
                <StatusIcon size={12} />
                {overdue ? "Überfällig" : status.label}
              </span>
            </div>

            {/* Customer */}
            <div className="fin-card__customer">
              <Avatar name={invoice.kunde_name} size={28} />
              <span className="fin-card__customer-name">
                {invoice.kunde_name}
              </span>
            </div>

            {/* Footer */}
            <div className="fin-card__footer">
              <span className="fin-card__date">
                {formatRelativeDate(invoice.rechnungs_datum)}
              </span>
              <span className="fin-card__amount">
                {formatCurrency(invoice.betrag_brutto)}
              </span>
            </div>

            {/* Hover Effect */}
            <div className="fin-card__glow" />
          </div>
        );
      })}
    </div>
  );
}

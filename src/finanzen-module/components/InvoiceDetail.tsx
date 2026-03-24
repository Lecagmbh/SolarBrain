// ============================================
// FINANZEN MODULE - INVOICE DETAIL
// ============================================

import { X, Eye, Download, Send, Check } from "lucide-react";
import type { InvoiceDetailProps } from "../types";
import { 
  formatDate, 
  formatCurrency, 
  getStatusInfo 
} from "../utils";
import { Skeleton } from "./common";
import { getInvoicePdfUrl } from "../api";

// ============================================
// COMPONENT
// ============================================

export function InvoiceDetail({
  invoice,
  loading,
  onClose,
  onFinalize,
  onMarkPaid,
  onPreview,
  isKunde = false,
}: InvoiceDetailProps) {
  if (loading) {
    return (
      <aside className="fin-detail">
        <DetailHeader title="Rechnungsdetails" onClose={onClose} />
        <div className="fin-detail__content">
          <DetailLoading />
        </div>
      </aside>
    );
  }

  if (!invoice) {
    return (
      <aside className="fin-detail">
        <DetailHeader title="Rechnungsdetails" onClose={onClose} />
        <div className="fin-detail__content">
          <div className="fin-detail__empty">
            <p>Keine Rechnung ausgewählt</p>
          </div>
        </div>
      </aside>
    );
  }

  const status = getStatusInfo(invoice.status);
  const StatusIcon = status.icon;

  return (
    <aside className="fin-detail">
      <DetailHeader title="Rechnungsdetails" onClose={onClose} />
      
      <div className="fin-detail__content">
        {/* Status Badge */}
        <div className="fin-detail__status">
          <span
            className="fin-status fin-status--lg"
            style={{
              backgroundColor: status.bg,
              color: status.color,
            }}
          >
            <StatusIcon size={16} />
            {status.label}
          </span>
        </div>

        {/* Basic Info */}
        <section className="fin-detail__section">
          <h4 className="fin-detail__section-title">Allgemein</h4>
          <DetailRow label="Rechnungsnummer" value={invoice.rechnungsnummer} />
          <DetailRow label="Kunde" value={invoice.kunde_name} />
          <DetailRow label="Rechnungsdatum" value={formatDate(invoice.rechnungs_datum)} />
          <DetailRow label="Fällig am" value={formatDate(invoice.faellig_am)} />
        </section>

        {/* Amounts */}
        <section className="fin-detail__section">
          <h4 className="fin-detail__section-title">Beträge</h4>
          <DetailRow 
            label="Netto" 
            value={formatCurrency(invoice.betrag_netto || 0)} 
          />
          <DetailRow 
            label="MwSt" 
            value={formatCurrency(invoice.betrag_mwst || 0)} 
          />
          <DetailRow 
            label="Brutto" 
            value={formatCurrency(invoice.betrag_brutto || 0)}
            highlight
          />
        </section>

        {/* Positions */}
        {invoice.positionen && invoice.positionen.length > 0 && (
          <section className="fin-detail__section">
            <h4 className="fin-detail__section-title">
              Positionen ({invoice.positionen.length})
            </h4>
            <div className="fin-detail__positions">
              {invoice.positionen.map((pos, i) => (
                <div key={pos.id || i} className="fin-detail__position">
                  <div className="fin-detail__position-desc">
                    {pos.beschreibung}
                  </div>
                  <div className="fin-detail__position-meta">
                    <span>{pos.menge} {pos.einheit} × {formatCurrency(pos.einzelpreis)}</span>
                    <span className="fin-detail__position-total">
                      {formatCurrency(pos.gesamtpreis)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {invoice.notizen && (
          <section className="fin-detail__section">
            <h4 className="fin-detail__section-title">Notizen</h4>
            <p className="fin-detail__notes">{invoice.notizen}</p>
          </section>
        )}

        {/* Actions */}
        <div className="fin-detail__actions">
          <button
            className="fin-btn fin-btn--ghost"
            onClick={() => onPreview?.(invoice.id)}
          >
            <Eye size={16} />
            <span>Vorschau</span>
          </button>
          
          {getInvoicePdfUrl(invoice.id) && (
            <a
              href={getInvoicePdfUrl(invoice.id)!}
              target="_blank"
              rel="noopener noreferrer"
              className="fin-btn fin-btn--ghost"
            >
              <Download size={16} />
              <span>PDF</span>
            </a>
          )}

          {!isKunde && invoice.status === "ENTWURF" && (
            <button
              className="fin-btn fin-btn--primary"
              onClick={() => onFinalize?.(invoice.id)}
            >
              <Send size={16} />
              <span>Finalisieren</span>
            </button>
          )}

          {!isKunde &&
            invoice.status !== "BEZAHLT" &&
            invoice.status !== "STORNIERT" && (
              <button
                className="fin-btn fin-btn--success"
                onClick={() => onMarkPaid?.(invoice.id)}
              >
                <Check size={16} />
                <span>Bezahlt</span>
              </button>
            )}
        </div>
      </div>
    </aside>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface DetailHeaderProps {
  title: string;
  onClose: () => void;
}

function DetailHeader({ title, onClose }: DetailHeaderProps) {
  return (
    <div className="fin-detail__header">
      <h3 className="fin-detail__title">{title}</h3>
      <button
        className="fin-detail__close"
        onClick={onClose}
        aria-label="Schließen"
      >
        <X size={18} />
      </button>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <div className={`fin-detail__row ${highlight ? "fin-detail__row--highlight" : ""}`}>
      <span className="fin-detail__label">{label}</span>
      <span className="fin-detail__value">{value}</span>
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="fin-detail__loading">
      <Skeleton width="100%" height={32} />
      <div style={{ marginTop: 24 }}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={20} />
      </div>
      <div style={{ marginTop: 24 }}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={24} />
      </div>
    </div>
  );
}

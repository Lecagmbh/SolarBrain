// src/modules/rechnungen/InvoicePreview.tsx
// Professional Invoice Preview - Production Ready Design

import { useNavigate } from "react-router-dom";
import type { CompanySettings, KundeDetail, LineItem } from "./types";

function money(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(n) ? n : 0);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

function calc(items: LineItem[]) {
  const map = new Map<number, { net: number; vat: number; gross: number }>();
  let net = 0, vat = 0, gross = 0;

  for (const it of items) {
    const lineNet = it.qty * it.unitNet;
    const lineVat = lineNet * (it.vatRate / 100);
    const lineGross = lineNet + lineVat;

    net += lineNet; vat += lineVat; gross += lineGross;

    const cur = map.get(it.vatRate) || { net: 0, vat: 0, gross: 0 };
    cur.net += lineNet; cur.vat += lineVat; cur.gross += lineGross;
    map.set(it.vatRate, cur);
  }

  const breakdown = Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([vatRate, v]) => ({
    vatRate,
    net: Number(v.net.toFixed(2)),
    vat: Number(v.vat.toFixed(2)),
    gross: Number(v.gross.toFixed(2)),
  }));

  return {
    net: Number(net.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    gross: Number(gross.toFixed(2)),
    breakdown,
  };
}

export default function InvoicePreview({
  company,
  companyMissing,
  kunde,
  referenz,
  items,
  rechnungsDatum,
  leistungsDatum,
  faelligAm,
  beschreibung,
  steuerHinweis,
}: {
  company: CompanySettings | null;
  companyMissing?: boolean;
  kunde: KundeDetail | null;
  referenz?: string;
  items: LineItem[];
  rechnungsDatum: string;
  leistungsDatum: string;
  faelligAm: string;
  beschreibung: string;
  steuerHinweis: string;
}) {
  const navigate = useNavigate();
  const totals = calc(items);

  return (
    <>
      <style>{`
        .invoice-preview {
          background: #0a0a0c;
          border-radius: 16px;
          padding: 24px;
          height: 100%;
          overflow-y: auto;
        }

        .invoice-preview__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .invoice-preview__title {
          font-size: 14px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .invoice-preview__badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(139, 92, 246, 0.15);
          color: #f0d878;
        }

        .invoice-preview__warning {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .invoice-preview__warning-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 50%;
          color: #ef4444;
          font-size: 12px;
        }

        .invoice-preview__warning-text {
          flex: 1;
          font-size: 13px;
          color: #fca5a5;
        }

        .invoice-preview__warning-btn {
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #fca5a5;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .invoice-preview__warning-btn:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        /* Paper Document */
        .invoice-paper {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
          padding: 32px;
          color: #1e293b;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Company Header */
        .invoice-paper__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 24px;
          border-bottom: 2px solid #EAD068;
          margin-bottom: 24px;
        }

        .invoice-paper__company {
          max-width: 50%;
        }

        .invoice-paper__company-name {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .invoice-paper__company-details {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .invoice-paper__doc-type {
          text-align: right;
        }

        .invoice-paper__doc-title {
          font-size: 28px;
          font-weight: 800;
          color: #EAD068;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .invoice-paper__doc-meta {
          font-size: 12px;
          color: #64748b;
          line-height: 1.8;
        }

        .invoice-paper__doc-meta strong {
          color: #334155;
          font-weight: 600;
        }

        /* Addresses */
        .invoice-paper__addresses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }

        .invoice-paper__address-block {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 3px solid #EAD068;
        }

        .invoice-paper__address-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #EAD068;
          margin-bottom: 8px;
        }

        .invoice-paper__address-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .invoice-paper__address-details {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        /* Reference */
        .invoice-paper__reference {
          display: inline-block;
          padding: 8px 14px;
          background: linear-gradient(135deg, #EAD068, #D4A843);
          color: white;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        /* Positions Table */
        .invoice-paper__table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .invoice-paper__table thead {
          background: #f1f5f9;
        }

        .invoice-paper__table th {
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
        }

        .invoice-paper__table th:last-child {
          text-align: right;
        }

        .invoice-paper__table td {
          padding: 14px 16px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }

        .invoice-paper__table td:last-child {
          text-align: right;
          white-space: nowrap;
        }

        .invoice-paper__item-title {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .invoice-paper__item-desc {
          font-size: 11px;
          color: #94a3b8;
        }

        .invoice-paper__item-qty {
          color: #64748b;
          font-size: 12px;
        }

        .invoice-paper__item-price {
          font-weight: 600;
          color: #0f172a;
        }

        .invoice-paper__empty {
          padding: 32px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        /* Totals */
        .invoice-paper__totals {
          margin-left: auto;
          width: 280px;
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
        }

        .invoice-paper__totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          color: #64748b;
        }

        .invoice-paper__totals-row--total {
          border-top: 2px solid #e2e8f0;
          margin-top: 8px;
          padding-top: 12px;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .invoice-paper__totals-value {
          font-weight: 600;
          color: #334155;
        }

        .invoice-paper__totals-row--total .invoice-paper__totals-value {
          color: #EAD068;
          font-size: 18px;
        }

        /* Notes */
        .invoice-paper__notes {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .invoice-paper__notes-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #EAD068;
          margin-bottom: 8px;
        }

        .invoice-paper__notes-text {
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
        }

        /* Footer */
        .invoice-paper__footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .invoice-paper__footer-col {
          flex: 1;
        }

        .invoice-paper__footer-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #EAD068;
          margin-bottom: 6px;
        }

        .invoice-paper__footer-text {
          font-size: 11px;
          color: #64748b;
          line-height: 1.5;
        }
      `}</style>

      <div className="invoice-preview">
        <div className="invoice-preview__header">
          <span className="invoice-preview__title">Rechnungs-Vorschau</span>
          <span className="invoice-preview__badge">Live-Vorschau</span>
        </div>

        {companyMissing && (
          <div className="invoice-preview__warning">
            <div className="invoice-preview__warning-icon">!</div>
            <span className="invoice-preview__warning-text">
              Firmendaten fehlen. Bitte konfigurieren Sie die Company Settings.
            </span>
            <button
              className="invoice-preview__warning-btn"
              onClick={() => navigate("/admin-v3/settings/company")}
            >
              Konfigurieren
            </button>
          </div>
        )}

        {/* Paper Document */}
        <div className="invoice-paper">
          {/* Header */}
          <div className="invoice-paper__header">
            <div className="invoice-paper__company">
              <div className="invoice-paper__company-name">
                {company?.companyName || "Firma nicht konfiguriert"}
              </div>
              <div className="invoice-paper__company-details">
                {company?.street && company?.houseNr && (
                  <div>{company.street} {company.houseNr}</div>
                )}
                {company?.zip && company?.city && (
                  <div>{company.zip} {company.city}</div>
                )}
                {company?.vatId && <div>USt-IdNr: {company.vatId}</div>}
                {!company?.vatId && company?.taxNumber && <div>Steuernr: {company.taxNumber}</div>}
              </div>
            </div>
            <div className="invoice-paper__doc-type">
              <div className="invoice-paper__doc-title">RECHNUNG</div>
              <div className="invoice-paper__doc-meta">
                <div><strong>Rechnungsdatum:</strong> {formatDate(rechnungsDatum)}</div>
                <div><strong>Leistungsdatum:</strong> {formatDate(leistungsDatum)}</div>
                <div><strong>Fällig am:</strong> {formatDate(faelligAm)}</div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="invoice-paper__addresses">
            <div className="invoice-paper__address-block">
              <div className="invoice-paper__address-label">Rechnungsempfänger</div>
              <div className="invoice-paper__address-name">
                {kunde?.firmenName || kunde?.name || "Kunde auswählen"}
              </div>
              <div className="invoice-paper__address-details">
                {kunde?.strasse && kunde?.hausNr && (
                  <div>{kunde.strasse} {kunde.hausNr}</div>
                )}
                {kunde?.plz && kunde?.ort && (
                  <div>{kunde.plz} {kunde.ort}</div>
                )}
                {kunde?.ustIdNr && <div>USt-IdNr: {kunde.ustIdNr}</div>}
              </div>
            </div>
            <div className="invoice-paper__address-block">
              <div className="invoice-paper__address-label">Zahlungsinformationen</div>
              <div className="invoice-paper__address-details">
                {company?.iban && <div><strong>IBAN:</strong> {company.iban}</div>}
                {company?.bic && <div><strong>BIC:</strong> {company.bic}</div>}
                {company?.bankName && <div>{company.bankName}</div>}
              </div>
            </div>
          </div>

          {/* Reference */}
          {referenz && (
            <div className="invoice-paper__reference">
              Referenz: {referenz}
            </div>
          )}

          {/* Positions */}
          {items.length === 0 ? (
            <div className="invoice-paper__empty">
              Keine Positionen hinzugefügt. Fügen Sie Leistungen oder freie Positionen hinzu.
            </div>
          ) : (
            <table className="invoice-paper__table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Beschreibung</th>
                  <th>Menge</th>
                  <th>Einzelpreis</th>
                  <th>MwSt</th>
                  <th>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="invoice-paper__item-title">{it.title || "Position"}</div>
                      {it.description && (
                        <div className="invoice-paper__item-desc">{it.description}</div>
                      )}
                    </td>
                    <td className="invoice-paper__item-qty">{it.qty}x</td>
                    <td className="invoice-paper__item-price">{money(it.unitNet)}</td>
                    <td className="invoice-paper__item-qty">{it.vatRate}%</td>
                    <td className="invoice-paper__item-price">{money(it.qty * it.unitNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="invoice-paper__totals">
            <div className="invoice-paper__totals-row">
              <span>Zwischensumme (Netto)</span>
              <span className="invoice-paper__totals-value">{money(totals.net)}</span>
            </div>
            {totals.breakdown.map((b) => (
              <div key={b.vatRate} className="invoice-paper__totals-row">
                <span>MwSt {b.vatRate}%</span>
                <span className="invoice-paper__totals-value">{money(b.vat)}</span>
              </div>
            ))}
            <div className="invoice-paper__totals-row invoice-paper__totals-row--total">
              <span>Gesamtbetrag</span>
              <span className="invoice-paper__totals-value">{money(totals.gross)}</span>
            </div>
          </div>

          {/* Notes */}
          {(beschreibung?.trim() || steuerHinweis?.trim()) && (
            <div className="invoice-paper__notes">
              {beschreibung?.trim() && (
                <>
                  <div className="invoice-paper__notes-title">Anmerkungen</div>
                  <div className="invoice-paper__notes-text">{beschreibung}</div>
                </>
              )}
              {steuerHinweis?.trim() && (
                <>
                  <div className="invoice-paper__notes-title" style={{ marginTop: beschreibung?.trim() ? 12 : 0 }}>
                    Steuerhinweis
                  </div>
                  <div className="invoice-paper__notes-text">{steuerHinweis}</div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="invoice-paper__footer">
            <div className="invoice-paper__footer-col">
              <div className="invoice-paper__footer-title">Kontakt</div>
              <div className="invoice-paper__footer-text">
                {company?.email && <div>{company.email}</div>}
                {company?.phone && <div>{company.phone}</div>}
              </div>
            </div>
            <div className="invoice-paper__footer-col">
              <div className="invoice-paper__footer-title">Zahlungsziel</div>
              <div className="invoice-paper__footer-text">
                Bitte überweisen Sie den Betrag bis zum {formatDate(faelligAm)} unter Angabe der Rechnungsnummer.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

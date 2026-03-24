/**
 * Rechnungen-Tab: Offene/Bezahlte + Preis-Einstellung inline
 */

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import type { UserData } from '../../types';
import { api } from '../../../../modules/api/client';

interface Invoice {
  id: number;
  rechnungsNummer?: string;
  rechnungsnummer?: string;
  status: string;
  betragBrutto?: number;
  betrag_brutto?: number;
  faelligAm?: string | null;
  faellig_am?: string | null;
  bezahltAm?: string | null;
  bezahlt_am?: string | null;
}

function getBrutto(inv: Invoice): number {
  return Number(inv.betragBrutto || inv.betrag_brutto || 0);
}

function getReNr(inv: Invoice): string {
  return inv.rechnungsNummer || inv.rechnungsnummer || '–';
}

interface ServicePrice {
  billingModel: string;
  priceNet: number;
  staffelPreise: { von: number; bis: number; preis: number }[] | null;
  paketGroesse: number | null;
  paketPreis: number | null;
  paketVerbraucht: number | null;
}

export function InvoicesTab({ user }: { user: UserData }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [price, setPrice] = useState<ServicePrice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.kundeId) { setLoading(false); return; }
    Promise.all([
      api.get(`/rechnungen?kundeId=${user.kundeId}&limit=20&sort=-createdAt`).then((r) => r.data?.data || []).catch(() => []),
      api.get(`/admin/kunden/${user.kundeId}/prices`).then((r) => {
        const prices = r.data?.data || r.data || [];
        return prices.find?.((p: any) => p.serviceKey === 'NETZANMELDUNG') || null;
      }).catch(() => null),
    ]).then(([inv, sp]) => {
      setInvoices(inv);
      setPrice(sp);
      setLoading(false);
    });
  }, [user.kundeId]);

  if (loading) return <div className="ud-loading"><Loader2 size={20} className="animate-spin" /></div>;
  if (!user.kundeId) return <div className="ud-empty-msg">Kein Kunde-Objekt verknüpft</div>;

  const offen = invoices.filter((i) => ['OFFEN', 'VERSENDET', 'UEBERFAELLIG', 'MAHNUNG'].includes(i.status));
  const bezahlt = invoices.filter((i) => i.status === 'BEZAHLT');
  const sumOffen = offen.reduce((s, i) => s + getBrutto(i), 0);
  const sumBezahlt = bezahlt.reduce((s, i) => s + getBrutto(i), 0);

  return (
    <div className="ud-invoices">
      {/* Preismodell */}
      <div className="ud-section">
        <h3 className="ud-section__title">Preismodell</h3>
        <div className="ud-section__body">
          {price ? (
            <PriceDisplay price={price} />
          ) : (
            <span className="ud-muted">Kein Preis konfiguriert</span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="ud-invoice-kpis">
        <div className="ud-kpi">
          <span className="ud-kpi__value" style={{ color: sumOffen > 0 ? '#ef4444' : 'var(--text-muted)' }}>€{sumOffen.toFixed(0)}</span>
          <span className="ud-kpi__label">Offen ({offen.length})</span>
        </div>
        <div className="ud-kpi">
          <span className="ud-kpi__value" style={{ color: '#22c55e' }}>€{sumBezahlt.toFixed(0)}</span>
          <span className="ud-kpi__label">Bezahlt ({bezahlt.length})</span>
        </div>
      </div>

      {/* Offene Rechnungen */}
      {offen.length > 0 && (
        <div className="ud-section">
          <h3 className="ud-section__title"><AlertTriangle size={14} style={{ color: '#ef4444' }} /> Offen</h3>
          <div className="ud-invoice-list">
            {offen.map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
            ))}
          </div>
        </div>
      )}

      {/* Bezahlte */}
      {bezahlt.length > 0 && (
        <div className="ud-section">
          <h3 className="ud-section__title"><Check size={14} style={{ color: '#22c55e' }} /> Bezahlt (letzte {bezahlt.length})</h3>
          <div className="ud-invoice-list">
            {bezahlt.slice(0, 5).map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceDisplay({ price }: { price: ServicePrice }) {
  if (price.billingModel === 'FIXED') {
    return <span className="ud-price"><strong>{price.priceNet}€</strong> / Anlage (netto)</span>;
  }
  if (price.billingModel === 'STAFFEL' && price.staffelPreise) {
    return (
      <div className="ud-price-staffel">
        <span className="ud-price-label">Staffel / Monat:</span>
        {price.staffelPreise.map((s, i) => (
          <span key={i} className="ud-price-tier">
            {s.von}-{s.bis >= 999 ? '∞' : s.bis}: <strong>{s.preis}€</strong>
          </span>
        ))}
      </div>
    );
  }
  if (price.billingModel === 'PAKET') {
    const frei = (price.paketGroesse || 0) - (price.paketVerbraucht || 0);
    return (
      <span className="ud-price">
        <strong>{price.paketPreis}€</strong> / {price.paketGroesse}er Paket
        <span className={`ud-price-frei ${frei <= 0 ? 'ud-price-frei--empty' : ''}`}>{frei} frei</span>
      </span>
    );
  }
  return <span className="ud-muted">–</span>;
}

function InvoiceRow({ inv }: { inv: Invoice }) {
  const statusColors: Record<string, string> = {
    OFFEN: '#f59e0b', VERSENDET: '#3b82f6', BEZAHLT: '#22c55e',
    UEBERFAELLIG: '#ef4444', MAHNUNG: '#ef4444', STORNIERT: '#6b7280',
  };
  return (
    <div className="ud-invoice-row">
      <span className="ud-invoice-nr">{getReNr(inv)}</span>
      <span className="ud-invoice-amount">€{getBrutto(inv).toFixed(2)}</span>
      <span className="ud-invoice-status" style={{ color: statusColors[inv.status] || '#6b7280' }}>{inv.status}</span>
    </div>
  );
}

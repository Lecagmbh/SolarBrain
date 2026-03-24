/**
 * Preise & Kunden Tab – Zentrale Übersicht aller Kunden-Preismodelle
 * Zeigt: Preismodell, Staffelpreise, Pakete, offene Rechnungen, Installationen
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit2, Save, X, Package, TrendingUp, DollarSign, Users, AlertTriangle, Check } from 'lucide-react';
import { api } from '../../../modules/api/client';

interface KundePreis {
  kundeId: number;
  kundeName: string;
  firmenName: string | null;
  billingModel: string;
  priceNet: number;
  staffelPreise: { von: number; bis: number; preis: number }[] | null;
  paketGroesse: number | null;
  paketPreis: number | null;
  paketVerbraucht: number | null;
  notizen: string | null;
  installationen: number;
  rechnungen: number;
  bezahlt: number;
  offen: number;
  sumBezahlt: number;
  sumOffen: number;
}

export default function PreiseKundenTab() {
  const [data, setData] = useState<KundePreis[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<KundePreis>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/kunden/preise-uebersicht');
      setData(res.data?.data || []);
    } catch (e) {
      console.error('Preise laden fehlgeschlagen:', e);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    fixed: data.filter(d => d.billingModel === 'FIXED').length,
    staffel: data.filter(d => d.billingModel === 'STAFFEL').length,
    paket: data.filter(d => d.billingModel === 'PAKET').length,
    totalOffen: data.reduce((s, d) => s + d.sumOffen, 0),
    totalBezahlt: data.reduce((s, d) => s + d.sumBezahlt, 0),
  }), [data]);

  const handleEdit = (k: KundePreis) => {
    setEditId(k.kundeId);
    setEditForm({ billingModel: k.billingModel, priceNet: k.priceNet, staffelPreise: k.staffelPreise, paketGroesse: k.paketGroesse, paketPreis: k.paketPreis });
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await api.patch(`/admin/kunden/${editId}/prices`, {
        serviceKey: 'NETZANMELDUNG',
        ...editForm,
      });
      setEditId(null);
      loadData();
    } catch (e) {
      alert('Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-400)' }} /></div>;
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard icon={<Users size={18} />} label="Kunden gesamt" value={String(data.length)} color="#3b82f6" />
        <KpiCard icon={<DollarSign size={18} />} label="Festpreis" value={String(stats.fixed)} color="#22c55e" />
        <KpiCard icon={<TrendingUp size={18} />} label="Staffel" value={String(stats.staffel)} color="#f59e0b" />
        <KpiCard icon={<Package size={18} />} label="Pakete" value={String(stats.paket)} color="#EAD068" />
        <KpiCard icon={<AlertTriangle size={18} />} label="Offen" value={`€${stats.totalOffen.toFixed(0)}`} color="#ef4444" />
      </div>

      {/* Tabelle */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
            <th style={th}>Kunde</th>
            <th style={th}>Modell</th>
            <th style={th}>Preis</th>
            <th style={{ ...th, textAlign: 'right' }}>Installationen</th>
            <th style={{ ...th, textAlign: 'right' }}>Bezahlt</th>
            <th style={{ ...th, textAlign: 'right' }}>Offen</th>
            <th style={{ ...th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map((k) => (
            <tr key={k.kundeId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={td}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.firmenName || k.kundeName}</div>
              </td>
              <td style={td}>
                <ModelBadge model={k.billingModel} />
              </td>
              <td style={td}>
                {editId === k.kundeId ? (
                  <EditPriceForm form={editForm} onChange={setEditForm} />
                ) : (
                  <PriceDisplay k={k} />
                )}
              </td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{k.installationen}</td>
              <td style={{ ...td, textAlign: 'right', color: '#22c55e' }}>
                {k.bezahlt > 0 ? `${k.bezahlt}× €${k.sumBezahlt.toFixed(0)}` : '–'}
              </td>
              <td style={{ ...td, textAlign: 'right', color: k.sumOffen > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                {k.offen > 0 ? `${k.offen}× €${k.sumOffen.toFixed(0)}` : '–'}
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                {editId === k.kundeId ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handleSave} disabled={saving} style={iconBtn}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} style={{ color: '#22c55e' }} />}</button>
                    <button onClick={() => setEditId(null)} style={iconBtn}><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => handleEdit(k)} style={iconBtn}><Edit2 size={14} /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function ModelBadge({ model }: { model: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    FIXED: { bg: 'rgba(34,197,94,.12)', color: '#22c55e', label: 'Festpreis' },
    STAFFEL: { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', label: 'Staffel' },
    PAKET: { bg: 'rgba(139,92,246,.12)', color: '#EAD068', label: 'Paket' },
  };
  const c = cfg[model] || cfg.FIXED;
  return <span style={{ display: 'inline-flex', height: 22, padding: '0 8px', fontSize: 11, fontWeight: 600, borderRadius: 9999, background: c.bg, color: c.color, alignItems: 'center' }}>{c.label}</span>;
}

function PriceDisplay({ k }: { k: KundePreis }) {
  if (k.billingModel === 'FIXED') {
    return <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.priceNet}€ <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>/ Anlage</span></span>;
  }
  if (k.billingModel === 'STAFFEL' && k.staffelPreise) {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {k.staffelPreise.map((s, i) => (
          <span key={i} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4, color: 'var(--text-secondary)' }}>
            {s.von}-{s.bis >= 999 ? '∞' : s.bis}: <b>{s.preis}€</b>
          </span>
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/Monat</span>
      </div>
    );
  }
  if (k.billingModel === 'PAKET') {
    const frei = (k.paketGroesse || 0) - (k.paketVerbraucht || 0);
    return (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
        {k.paketPreis}€ <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>/ {k.paketGroesse}er Paket</span>
        <span style={{ marginLeft: 8, fontSize: 11, color: frei > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{frei} frei</span>
      </span>
    );
  }
  return <span style={{ color: 'var(--text-muted)' }}>–</span>;
}

function EditPriceForm({ form, onChange }: { form: Partial<KundePreis>; onChange: (f: Partial<KundePreis>) => void }) {
  if (form.billingModel === 'FIXED') {
    return <input type="number" value={form.priceNet || ''} onChange={e => onChange({ ...form, priceNet: Number(e.target.value) })} style={input} placeholder="Preis netto" />;
  }
  return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Staffel/Paket über Admin bearbeiten</span>;
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-muted)' };
const td: React.CSSProperties = { padding: '12px', verticalAlign: 'middle' };
const iconBtn: React.CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' };
const input: React.CSSProperties = { width: 80, height: 30, padding: '0 8px', fontSize: 13, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)' };

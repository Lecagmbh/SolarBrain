import { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { T, box, boxHeader, boxTitle, boxBadge } from '../styles';
import { formatDate } from '../utils/formatters';
import { getAccessToken } from '../../../../../../modules/auth/tokenStorage';
import type { Installation } from '../types';

function authUrl(url: string | undefined | null): string {
  if (!url) return '';
  const token = getAccessToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

interface DocumentGridProps {
  data: Installation;
  defaultExpanded?: boolean;
}

type DocCategory = 'all' | 'lageplan' | 'schaltplan' | 'datenblatt' | 'vollmacht' | 'sonstiges';

const CATEGORY_LABELS: Record<string, string> = {
  lageplan: 'Lageplan', schaltplan: 'Schaltplan',
  datenblatt_module: 'DB Module', datenblatt_wechselrichter: 'DB Wechselrichter',
  datenblatt_speicher: 'DB Speicher', datenblatt_wallbox: 'DB Wallbox',
  messkonzept: 'Messkonzept', vollmacht: 'Vollmacht',
  bestaetigung_nb: 'NB-Bestätigung', anmeldeformular: 'Anmeldeformular',
  rechnung: 'Rechnung', foto: 'Foto', sonstiges: 'Sonstiges',
};

const PFLICHT_KATEGORIEN = ['lageplan', 'schaltplan', 'datenblatt', 'zertifikat'] as const;

const PFLICHT_LABELS: Record<string, string> = {
  lageplan: 'Lageplan', schaltplan: 'Schaltplan',
  datenblatt: 'Datenblätter', zertifikat: 'Zertifikate',
};

function categorizeDocument(doc: { kategorie?: string; originalName?: string; dateiname?: string }): string {
  const kat = doc.kategorie?.toLowerCase() || '';
  if (kat === 'lageplan') return 'lageplan';
  if (kat === 'schaltplan') return 'schaltplan';
  if (kat.startsWith('datenblatt_') || kat === 'datenblatt') return 'datenblatt';
  if (kat === 'vollmacht' || kat === 'bestaetigung_nb' || kat === 'zertifikat') return 'zertifikat';
  const name = (doc.originalName || doc.dateiname || '').toLowerCase();
  if (name.includes('lageplan')) return 'lageplan';
  if (name.includes('schaltplan') || name.includes('uebersichtsschaltplan')) return 'schaltplan';
  if (name.includes('datenblatt') || name.startsWith('e2_') || name.startsWith('e3_')) return 'datenblatt';
  if (name.includes('zertifikat') || name.includes('einheitenzertifikat')) return 'zertifikat';
  return 'sonstig';
}

const pflichtItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 8px', borderRadius: 6, fontSize: 11,
};

const filterBtn: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 4,
  fontSize: 10, fontWeight: 500, cursor: 'pointer',
  border: `1px solid ${T.ba}`, fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

export function DocumentGrid({ data, defaultExpanded = false }: DocumentGridProps) {
  const [activeFilter, setActiveFilter] = useState<DocCategory>('all');
  const [docsExpanded, setDocsExpanded] = useState(defaultExpanded);
  const docs = data.documents || [];

  const categoryCounts: Record<string, number> = {};
  docs.forEach(d => {
    const cat = d.kategorie || 'sonstiges';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const filteredDocs = activeFilter === 'all'
    ? docs
    : activeFilter === 'datenblatt'
      ? docs.filter(d => d.kategorie?.startsWith('datenblatt_'))
      : activeFilter === 'vollmacht'
        ? docs.filter(d => d.kategorie === 'vollmacht' || d.kategorie === 'bestaetigung_nb')
        : docs.filter(d => d.kategorie === activeFilter);

  return (
    <>
      {/* Pflichtdokumente — always visible, compact 2x2 */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><FileText size={13} /> Pflichtdokumente</div>
          <span style={boxBadge}>
            {PFLICHT_KATEGORIEN.filter(cat => docs.some(d => categorizeDocument(d) === cat)).length}/{PFLICHT_KATEGORIEN.length}
          </span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 4, padding: 8,
        }}>
          {PFLICHT_KATEGORIEN.map(cat => {
            const count = docs.filter(d => categorizeDocument(d) === cat).length;
            const ok = count > 0;
            return (
              <div key={cat} style={{
                ...pflichtItem,
                background: ok ? T.okBg : T.erBg,
              }}>
                <span style={{ fontWeight: 700, color: ok ? T.ok : T.er, flexShrink: 0 }}>
                  {ok ? '✓' : '✗'}
                </span>
                <span style={{ flex: 1, color: ok ? T.t1 : T.t3 }}>{PFLICHT_LABELS[cat]}</span>
                {count > 0 && <span style={{ fontSize: 10, color: T.t3 }}>{count}×</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alle Dokumente — collapsible, default collapsed */}
      <div style={box}>
        <div
          style={{ ...boxHeader, cursor: 'pointer' }}
          onClick={() => setDocsExpanded(!docsExpanded)}
        >
          <div style={{ ...boxTitle, gap: 4 }}>
            {docsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Alle Dokumente
          </div>
          <span style={boxBadge}>{docs.length}</span>
        </div>
        {docsExpanded && (
          <>
            <div style={{ display: 'flex', gap: 4, padding: '6px 8px', flexWrap: 'wrap', borderBottom: `1px solid ${T.bd}` }}>
              <button
                style={{ ...filterBtn, background: activeFilter === 'all' ? T.ac : T.s3, color: activeFilter === 'all' ? '#fff' : T.t2, borderColor: activeFilter === 'all' ? T.ac : T.ba }}
                onClick={() => setActiveFilter('all')}
              >
                Alle ({docs.length})
              </button>
              {Object.entries(categoryCounts).slice(0, 5).map(([cat, count]) => (
                <button
                  key={cat}
                  style={{ ...filterBtn, background: activeFilter === cat ? T.ac : T.s3, color: activeFilter === cat ? '#fff' : T.t2, borderColor: activeFilter === cat ? T.ac : T.ba }}
                  onClick={() => setActiveFilter(cat as DocCategory)}
                >
                  {CATEGORY_LABELS[cat] || cat} ({count})
                </button>
              ))}
            </div>
            {filteredDocs.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, color: T.t3, fontSize: 12 }}>
                <FileText size={20} /> <span>Keine Dokumente</span>
              </div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto' }} className="gnz-scroll">
                {filteredDocs.map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px', fontSize: 11,
                    borderBottom: `1px solid ${T.bd}`,
                  }}>
                    <FileText size={13} style={{ color: T.t3, flexShrink: 0 }} />
                    <span style={{
                      flex: 1, color: T.t1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={doc.originalName || doc.dateiname}>
                      {doc.originalName || doc.dateiname || 'Dokument'}
                    </span>
                    <span style={{ fontSize: 10, color: T.t3, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatDate(doc.createdAt)}
                    </span>
                    {doc.url && (
                      <a href={authUrl(doc.url)} target="_blank" rel="noopener noreferrer"
                        style={{ color: T.t3, flexShrink: 0 }}
                      >
                        <Download size={13} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

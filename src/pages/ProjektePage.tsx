import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, MapPin, User, Euro, 
  Sun, Home, CheckCircle2, AlertCircle, Archive, Trash2, Eye, 
  LayoutGrid, List, FileText
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';

interface Projekt {
  id: number;
  projektNummer: string;
  titel?: string;
  status: string;
  typ: string;
  prioritaet: number;
  kundeVorname?: string;
  kundeNachname?: string;
  kundeFirma?: string;
  standortOrt?: string;
  standortPlz?: string;
  anlagenleistungKwp?: number;
  auftragssummeBrutto?: number;
  createdAt: string;
  kunde?: { id: number; name: string };
}

export default function ProjektePage() {
  const navigate = useNavigate();
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusConfig, setStatusConfig] = useState<any>({});
  const [typConfig, setTypConfig] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [typFilter, setTypFilter] = useState('alle');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => { loadData(); loadStats(); }, [statusFilter, typFilter, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'alle') params.append('status', statusFilter);
      if (typFilter !== 'alle') params.append('typ', typFilter);
      if (searchQuery) params.append('suche', searchQuery);
      const res = await apiGet<any>(`/api/projekte?${params.toString()}`);
      setProjekte(res.projekte || []);
      setStatusConfig(res.statusConfig || {});
      setTypConfig(res.typConfig || {});
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await apiGet<any>('/api/projekte/stats');
      setStats(res);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (data: any) => {
    try {
      const projekt = await apiPost<Projekt>('/api/projekte', data);
      setShowNewModal(false);
      navigate(`/projekte/${projekt.id}`);
    } catch (err) { console.error(err); alert('Fehler beim Erstellen'); }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Projekt archivieren?')) return;
    try { await apiPost(`/api/projekte/${id}/archivieren`, {}); loadData(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Projekt löschen?')) return;
    try { await apiDelete(`/api/projekte/${id}`); loadData(); } catch (err) { console.error(err); }
  };

  const phasen = [
    { key: 'lead', label: 'Lead', status: ['ANFRAGE'] },
    { key: 'kontaktiert', label: 'Kontaktiert', status: ['ANGEBOT_ERSTELLT', 'ANGEBOT_VERSENDET', 'ANGEBOT_AKZEPTIERT'] },
    { key: 'qualifiziert', label: 'Qualifiziert', status: ['AUFTRAG', 'IN_PLANUNG', 'MATERIAL_BESTELLT'] },
    { key: 'verkauft', label: 'Verkauft', status: ['INSTALLATION_GEPLANT'] },
    { key: 'installation', label: 'Installation', status: ['INSTALLATION_LAEUFT', 'INSTALLATION_FERTIG', 'NETZANMELDUNG_LAEUFT'] },
    { key: 'fertig', label: 'Fertig', status: ['INBETRIEBNAHME', 'ABGESCHLOSSEN', 'GEWAEHRLEISTUNG'] },
  ];

  const inputStyle: React.CSSProperties = { padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.9rem' };

  return (
    <div style={{ padding: '32px', color: '#fff', minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #EAD068 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Home size={24} />
              </div>
              Projekte
            </h1>
            <p style={{ color: '#64748b', marginTop: '8px' }}>
              {stats.gesamt || 0} Projekte • {Number(stats.gesamtLeistungKwp || 0).toFixed(1)} kWp Gesamtleistung
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer',
            fontWeight: 600, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          }}>
            <Plus size={18} /> Neues Projekt
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Offen', value: (stats.nachStatus?.ANFRAGE || 0) + (stats.nachStatus?.ANGEBOT_ERSTELLT || 0) + (stats.nachStatus?.ANGEBOT_VERSENDET || 0), color: '#f59e0b', icon: <FileText size={18} /> },
            { label: 'In Arbeit', value: (stats.nachStatus?.AUFTRAG || 0) + (stats.nachStatus?.IN_PLANUNG || 0) + (stats.nachStatus?.INSTALLATION_LAEUFT || 0), color: '#3b82f6', icon: <Sun size={18} /> },
            { label: 'Abgeschlossen', value: stats.nachStatus?.ABGESCHLOSSEN || 0, color: '#22c55e', icon: <CheckCircle2 size={18} /> },
            { label: 'Auftragswert', value: `${((stats.gesamtAuftragswert || 0) / 1000).toFixed(0)}k €`, color: '#EAD068', icon: <Euro size={18} /> },
            { label: 'Offene Aufgaben', value: stats.offeneAufgaben || 0, color: stats.ueberfaelligeAufgaben > 0 ? '#ef4444' : '#64748b', icon: <AlertCircle size={18} /> },
          ].map((stat, i) => (
            <div key={i} style={{
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
              border: `1px solid ${stat.color}30`, borderRadius: '12px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input type="text" placeholder="Suchen..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, width: '100%', paddingLeft: '44px' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, minWidth: '160px', cursor: 'pointer' }}>
          <option value="alle">Alle Status</option>
          {Object.entries(statusConfig).map(([key, cfg]: [string, any]) => (
            <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>
        <select value={typFilter} onChange={e => setTypFilter(e.target.value)} style={{ ...inputStyle, minWidth: '160px', cursor: 'pointer' }}>
          <option value="alle">Alle Typen</option>
          {Object.entries(typConfig).map(([key, cfg]: [string, any]) => (
            <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '4px', background: '#1e293b', borderRadius: '10px', padding: '4px' }}>
          <button onClick={() => setViewMode('list')} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#3b82f6' : 'transparent', color: viewMode === 'list' ? '#fff' : '#64748b' }}>
            <List size={18} />
          </button>
          <button onClick={() => setViewMode('kanban')} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'kanban' ? '#3b82f6' : 'transparent', color: viewMode === 'kanban' ? '#fff' : '#64748b' }}>
            <LayoutGrid size={18} />
          </button>
        </div>
        <button onClick={loadData} style={{ ...inputStyle, background: '#1e293b', cursor: 'pointer', border: '1px solid #334155' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p>Laden...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ background: '#1e293b', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' }}>
          {projekte.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
              <Home size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>Keine Projekte</h3>
              <p>Erstelle dein erstes Projekt.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Projekt', 'Kunde', 'Standort', 'Typ', 'Status', 'Leistung', 'Wert', 'Aktionen'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projekte.map(p => {
                  const status = statusConfig[p.status] || { label: p.status, color: '#64748b', bgColor: '#64748b20', icon: '?' };
                  const typ = typConfig[p.typ] || { label: p.typ, icon: '?', color: '#64748b' };
                  const kunde = p.kundeFirma || [p.kundeVorname, p.kundeNachname].filter(Boolean).join(' ') || '-';
                  return (
                    <tr key={p.id} onClick={() => navigate(`/projekte/${p.id}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{p.projektNummer}</div>
                        {p.titel && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.titel}</div>}
                      </td>
                      <td style={{ padding: '16px', color: '#e2e8f0' }}><User size={14} style={{ marginRight: '6px', opacity: 0.5 }} />{kunde}</td>
                      <td style={{ padding: '16px', color: '#e2e8f0' }}><MapPin size={14} style={{ marginRight: '6px', opacity: 0.5 }} />{p.standortPlz} {p.standortOrt || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', background: `${typ.color}20`, color: typ.color }}>{typ.icon} {typ.label}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', background: status.bgColor, color: status.color }}>{status.icon} {status.label}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#e2e8f0' }}>{p.anlagenleistungKwp ? `${p.anlagenleistungKwp} kWp` : '-'}</td>
                      <td style={{ padding: '16px', color: '#22c55e', fontWeight: 600 }}>{p.auftragssummeBrutto ? `${Number(p.auftragssummeBrutto).toLocaleString('de-DE')} €` : '-'}</td>
                      <td style={{ padding: '16px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => navigate(`/projekte/${p.id}`)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><Eye size={16} /></button>
                          <button onClick={() => handleArchive(p.id)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Archive size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phasen.length}, 1fr)`, gap: '16px', overflowX: 'auto' }}>
          {phasen.map(phase => {
            const phaseProjekte = projekte.filter(p => phase.status.includes(p.status));
            return (
              <div key={phase.key} style={{ minWidth: '260px' }}>
                <div style={{ padding: '12px 16px', background: '#0f172a', borderRadius: '12px 12px 0 0', borderBottom: '2px solid #3b82f6' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>
                    {phase.label} <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#334155', borderRadius: '10px', fontSize: '0.75rem' }}>{phaseProjekte.length}</span>
                  </h3>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '0 0 12px 12px', padding: '12px', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phaseProjekte.map(p => {
                    const status = statusConfig[p.status] || { label: p.status, color: '#64748b', bgColor: '#64748b20', icon: '?' };
                    const kunde = p.kundeFirma || [p.kundeVorname, p.kundeNachname].filter(Boolean).join(' ') || '-';
                    return (
                      <div key={p.id} onClick={() => navigate(`/projekte/${p.id}`)} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', cursor: 'pointer', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{p.projektNummer}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', background: status.bgColor, color: status.color }}>{status.icon}</span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>{kunde}</div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#64748b' }}>
                          {p.standortOrt && <span><MapPin size={12} /> {p.standortOrt}</span>}
                          {p.anlagenleistungKwp && <span><Sun size={12} /> {p.anlagenleistungKwp} kWp</span>}
                        </div>
                      </div>
                    );
                  })}
                  {phaseProjekte.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: '0.85rem' }}>Keine Projekte</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewModal && <NewProjectModal typConfig={typConfig} onSave={handleCreate} onClose={() => setShowNewModal(false)} />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NewProjectModal({ typConfig, onSave, onClose }: { typConfig: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState<any>({ typ: 'PV_ANLAGE' });
  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '32px', width: '650px', maxWidth: '95vw', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 24px', color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>Neues Projekt</h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Projekttyp</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {Object.entries(typConfig).map(([key, cfg]: [string, any]) => (
                <button key={key} type="button" onClick={() => update('typ', key)} style={{
                  padding: '12px 8px', borderRadius: '10px', cursor: 'pointer',
                  border: form.typ === key ? `2px solid ${cfg.color}` : '1px solid #334155',
                  background: form.typ === key ? `${cfg.color}20` : '#0f172a',
                  color: form.typ === key ? cfg.color : '#94a3b8', fontSize: '0.7rem', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{cfg.icon}</div>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Kunde</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Anrede</label><select style={inputStyle} value={form.kundeAnrede || ''} onChange={e => update('kundeAnrede', e.target.value)}><option value="">--</option><option value="Herr">Herr</option><option value="Frau">Frau</option><option value="Firma">Firma</option></select></div>
              <div><label style={labelStyle}>Vorname</label><input style={inputStyle} value={form.kundeVorname || ''} onChange={e => update('kundeVorname', e.target.value)} /></div>
              <div><label style={labelStyle}>Nachname *</label><input style={inputStyle} value={form.kundeNachname || ''} onChange={e => update('kundeNachname', e.target.value)} required /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div><label style={labelStyle}>Firma</label><input style={inputStyle} value={form.kundeFirma || ''} onChange={e => update('kundeFirma', e.target.value)} /></div>
              <div><label style={labelStyle}>E-Mail</label><input type="email" style={inputStyle} value={form.kundeEmail || ''} onChange={e => update('kundeEmail', e.target.value)} /></div>
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Standort</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Straße</label><input style={inputStyle} value={form.standortStrasse || ''} onChange={e => update('standortStrasse', e.target.value)} /></div>
              <div><label style={labelStyle}>Hausnr.</label><input style={inputStyle} value={form.standortHausnummer || ''} onChange={e => update('standortHausnummer', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '12px' }}>
              <div><label style={labelStyle}>PLZ</label><input style={inputStyle} value={form.standortPlz || ''} onChange={e => update('standortPlz', e.target.value)} /></div>
              <div><label style={labelStyle}>Ort</label><input style={inputStyle} value={form.standortOrt || ''} onChange={e => update('standortOrt', e.target.value)} /></div>
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Projekttitel (optional)</label>
            <input style={inputStyle} value={form.titel || ''} onChange={e => update('titel', e.target.value)} placeholder="z.B. PV-Anlage Familie Müller" />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #334155' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Abbrechen</button>
            <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Projekt anlegen</button>
          </div>
        </form>
      </div>
    </div>
  );
}

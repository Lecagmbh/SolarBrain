import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Calendar, MapPin, User, Euro, Battery, Sun,
  Home, Clock, CheckCircle2, Plus, Trash2, Edit2, FileText,
  MessageSquare, Package, ClipboardList, History, CreditCard, CalendarDays,
  Landmark, RefreshCw, Link2, Unlink
} from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api/client';

export default function ProjektDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projekt, setProjekt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusConfig, setStatusConfig] = useState<any>({});
  const [typConfig, setTypConfig] = useState<any>({});
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { loadProjekt(); }, [id]);

  const loadProjekt = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>(`/api/projekte/${id}`);
      setProjekt(res.projekt);
      setFormData(res.projekt);
      setStatusConfig(res.statusConfig || {});
      setTypConfig(res.typConfig || {});
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/projekte/${id}`, formData);
      await loadProjekt();
      setEditMode(false);
    } catch (err) { console.error(err); alert('Fehler'); }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiPatch(`/api/projekte/${id}`, { status: newStatus });
      await loadProjekt();
    } catch (err) { console.error(err); }
  };

  const update = (k: string, v: any) => setFormData((p: any) => ({ ...p, [k]: v }));

  if (loading) return <div style={{ padding: '32px', color: '#fff', textAlign: 'center' }}>Laden...</div>;
  if (!projekt) return <div style={{ padding: '32px', color: '#ef4444', textAlign: 'center' }}>Projekt nicht gefunden</div>;

  const status = statusConfig[projekt.status] || { label: projekt.status, color: '#64748b', icon: '?', erlaubteUebergaenge: [] };
  const typ = typConfig[projekt.typ] || { label: projekt.typ, icon: '?', color: '#64748b' };
  const kunde = projekt.kundeFirma || [projekt.kundeVorname, projekt.kundeNachname].filter(Boolean).join(' ') || '-';

  const tabs = [
    { key: 'uebersicht', label: 'Übersicht', icon: <Home size={16} /> },
    { key: 'komponenten', label: 'Komponenten', icon: <Package size={16} />, count: projekt.komponenten?.length },
    { key: 'dokumente', label: 'Dokumente', icon: <FileText size={16} />, count: projekt.dokumente?.length },
    { key: 'aufgaben', label: 'Aufgaben', icon: <ClipboardList size={16} />, count: projekt.aufgaben?.filter((a: any) => a.status === 'OFFEN').length },
    { key: 'timeline', label: 'Timeline', icon: <History size={16} /> },
    { key: 'finanzen', label: 'Finanzen', icon: <CreditCard size={16} /> },
    { key: 'termine', label: 'Termine', icon: <CalendarDays size={16} /> },
  ];

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: editMode ? '#0f172a' : 'transparent', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '0.8rem' };

  return (
    <div style={{ padding: '32px', color: '#fff', minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/projekte')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px' }}>
          <ArrowLeft size={18} /> Zurück
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{projekt.projektNummer}</h1>
              <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, background: status.bgColor, color: status.color }}>{status.icon} {status.label}</span>
              <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', background: `${typ.color}20`, color: typ.color }}>{typ.icon} {typ.label}</span>
            </div>
            {projekt.titel && <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem' }}>{projekt.titel}</p>}
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.9rem' }}>{kunde} • {projekt.standortPlz} {projekt.standortOrt}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {status.erlaubteUebergaenge?.length > 0 && (
              <select onChange={e => handleStatusChange(e.target.value)} value="" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#fff', cursor: 'pointer' }}>
                <option value="" disabled>Status ändern...</option>
                {status.erlaubteUebergaenge.map((s: string) => <option key={s} value={s}>{statusConfig[s]?.icon} {statusConfig[s]?.label}</option>)}
              </select>
            )}
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); setFormData(projekt); }} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Abbrechen</button>
                <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  <Save size={16} /> {saving ? 'Speichern...' : 'Speichern'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#fff', cursor: 'pointer' }}>
                <Edit2 size={16} /> Bearbeiten
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: <Sun size={18} />, label: 'Leistung', value: projekt.anlagenleistungKwp ? `${projekt.anlagenleistungKwp} kWp` : '-', color: '#f59e0b' },
          { icon: <Package size={18} />, label: 'Module', value: projekt.modulAnzahl || '-', color: '#3b82f6' },
          { icon: <Battery size={18} />, label: 'Speicher', value: projekt.speicherKapazitaetKwh ? `${projekt.speicherKapazitaetKwh} kWh` : '-', color: '#22c55e' },
          { icon: <Euro size={18} />, label: 'Auftrag', value: projekt.auftragssummeBrutto ? `${Number(projekt.auftragssummeBrutto).toLocaleString('de-DE')} €` : '-', color: '#EAD068' },
          { icon: <Calendar size={18} />, label: 'Installation', value: projekt.installationGeplantStart ? new Date(projekt.installationGeplantStart).toLocaleDateString('de-DE') : '-', color: '#06b6d4' },
        ].map((s, i) => (
          <div key={i} style={{ background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#0f172a', padding: '6px', borderRadius: '12px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px',
            borderRadius: '8px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === tab.key ? '#3b82f6' : 'transparent',
            color: activeTab === tab.key ? '#fff' : '#64748b',
            fontWeight: activeTab === tab.key ? 600 : 400, fontSize: '0.9rem'
          }}>
            {tab.icon} {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : '#334155' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
        {activeTab === 'uebersicht' && (
          <div>
            <Section title="Kunde" icon={<User size={16} />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {['kundeAnrede', 'kundeVorname', 'kundeNachname', 'kundeFirma', 'kundeEmail', 'kundeTelefon'].map(f => (
                  <div key={f}>
                    <label style={labelStyle}>{f.replace('kunde', '').replace(/([A-Z])/g, ' $1')}</label>
                    {editMode ? <input style={inputStyle} value={formData[f] || ''} onChange={e => update(f, e.target.value)} /> : <div style={{ color: '#fff' }}>{projekt[f] || '-'}</div>}
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Standort" icon={<MapPin size={16} />}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '16px' }}>
                {[['standortStrasse', 'Straße'], ['standortHausnummer', 'Nr.'], ['standortPlz', 'PLZ'], ['standortOrt', 'Ort']].map(([f, l]) => (
                  <div key={f}>
                    <label style={labelStyle}>{l}</label>
                    {editMode ? <input style={inputStyle} value={formData[f] || ''} onChange={e => update(f, e.target.value)} /> : <div style={{ color: '#fff' }}>{projekt[f] || '-'}</div>}
                  </div>
                ))}
              </div>
            </Section>
            <MaStrSection
              projekt={projekt}
              editMode={editMode}
              formData={formData}
              onUpdate={update}
              onReload={loadProjekt}
            />
            <Section title="Notizen" icon={<MessageSquare size={16} />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Beschreibung</label>
                  {editMode ? <textarea style={{ ...inputStyle, minHeight: '100px' }} value={formData.beschreibung || ''} onChange={e => update('beschreibung', e.target.value)} /> : <div style={{ color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{projekt.beschreibung || '-'}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Interne Notizen</label>
                  {editMode ? <textarea style={{ ...inputStyle, minHeight: '100px' }} value={formData.interneNotizen || ''} onChange={e => update('interneNotizen', e.target.value)} /> : <div style={{ color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{projekt.interneNotizen || '-'}</div>}
                </div>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'komponenten' && <TabKomponenten projektId={projekt.id} komponenten={projekt.komponenten || []} onReload={loadProjekt} />}
        {activeTab === 'aufgaben' && <TabAufgaben projektId={projekt.id} aufgaben={projekt.aufgaben || []} onReload={loadProjekt} />}
        {activeTab === 'timeline' && <TabTimeline projektId={projekt.id} timeline={projekt.timeline || []} onReload={loadProjekt} />}
        {activeTab === 'dokumente' && <TabPlaceholder title="Dokumente" icon={<FileText size={40} />} items={projekt.dokumente} />}
        {activeTab === 'finanzen' && <TabFinanzen projekt={projekt} />}
        {activeTab === 'termine' && <TabPlaceholder title="Termine" icon={<CalendarDays size={40} />} items={projekt.termine} />}
      </div>
    </div>
  );
}

function MaStrSection({ projekt, editMode, formData, onUpdate, onReload }: any) {
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [mastrDetails, setMastrDetails] = useState<any>(null);

  const handleFetchDetails = async () => {
    setLoadingDetails(true);
    try {
      const res = await apiGet<any>(`/api/mastr/projekte/${projekt.id}/details`);
      setMastrDetails(res);
    } catch {
      // silent
    } finally {
      setLoadingDetails(false);
    }
  };

  const mastrStatusColor = (s: string | null) => {
    if (!s) return '#71717a';
    if (s === 'InBetrieb' || s === '35') return '#4ade80';
    if (s === 'InPlanung' || s === '31') return '#60a5fa';
    return '#a1a1aa';
  };

  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'block' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.875rem' };
  const monoStyle: React.CSSProperties = { fontFamily: '"JetBrains Mono", "Fira Code", monospace', color: '#f0d878', fontSize: '0.875rem' };

  return (
    <div style={{ padding: '24px', borderBottom: '1px solid #334155' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Landmark size={16} /> MaStR (Marktstammdatenregister)</span>
        {(projekt.mastrNrSolar || projekt.mastrNrSpeicher) && (
          <button
            onClick={handleFetchDetails}
            disabled={loadingDetails}
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={12} className={loadingDetails ? 'animate-spin' : ''} /> MaStR-Daten abrufen
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={labelStyle}>MaStR-Nr. Solar</label>
          {editMode ? (
            <input style={{ ...inputStyle, ...monoStyle }} placeholder="SEE..." value={formData.mastrNrSolar || ''} onChange={e => onUpdate('mastrNrSolar', e.target.value)} />
          ) : (
            <div style={projekt.mastrNrSolar ? monoStyle : { color: '#64748b' }}>{projekt.mastrNrSolar || '—'}</div>
          )}
        </div>
        <div>
          <label style={labelStyle}>MaStR-Nr. Speicher</label>
          {editMode ? (
            <input style={{ ...inputStyle, ...monoStyle }} placeholder="SSE..." value={formData.mastrNrSpeicher || ''} onChange={e => onUpdate('mastrNrSpeicher', e.target.value)} />
          ) : (
            <div style={projekt.mastrNrSpeicher ? monoStyle : { color: '#64748b' }}>{projekt.mastrNrSpeicher || '—'}</div>
          )}
        </div>
        <div>
          <label style={labelStyle}>MaStR-Status</label>
          <div style={{ color: mastrStatusColor(projekt.mastrStatus) }}>
            {projekt.mastrStatus ? (
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500, background: 'rgba(212, 168, 67, 0.1)', color: mastrStatusColor(projekt.mastrStatus) }}>
                {projekt.mastrStatus}
              </span>
            ) : '—'}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Letzter Sync</label>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {projekt.mastrSyncAm ? new Date(projekt.mastrSyncAm).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
        </div>
      </div>

      {/* Live MaStR-Details (wenn abgerufen) */}
      {mastrDetails?.solar && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Solar-Details aus MaStR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '0.8125rem' }}>
            <div><span style={{ color: '#64748b' }}>Leistung:</span> <span style={{ color: '#fff' }}>{mastrDetails.solar.Bruttoleistung ? (parseFloat(mastrDetails.solar.Bruttoleistung) / 1000).toFixed(2) + ' kWp' : '—'}</span></div>
            <div><span style={{ color: '#64748b' }}>Module:</span> <span style={{ color: '#fff' }}>{mastrDetails.solar.AnzahlModule || '—'}</span></div>
            <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: '#4ade80' }}>{mastrDetails.solar.EinheitBetriebsstatus || '—'}</span></div>
            <div><span style={{ color: '#64748b' }}>IBN:</span> <span style={{ color: '#fff' }}>{mastrDetails.solar.Inbetriebnahmedatum ? new Date(mastrDetails.solar.Inbetriebnahmedatum).toLocaleDateString('de-DE') : '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div style={{ padding: '24px', borderBottom: '1px solid #334155' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>{icon} {title}</div>
      {children}
    </div>
  );
}

function TabKomponenten({ projektId, komponenten, onReload }: any) {
  const [showModal, setShowModal] = useState(false);
  const typen = [
    { key: 'PV_MODUL', label: 'PV-Modul', icon: '☀️', color: '#f59e0b' },
    { key: 'WECHSELRICHTER', label: 'Wechselrichter', icon: '⚡', color: '#3b82f6' },
    { key: 'SPEICHER', label: 'Speicher', icon: '🔋', color: '#22c55e' },
    { key: 'WALLBOX', label: 'Wallbox', icon: '🚗', color: '#EAD068' },
    { key: 'WAERMEPUMPE', label: 'Wärmepumpe', icon: '🌡️', color: '#ef4444' },
  ];
  const handleDelete = async (id: number) => {
    if (!confirm('Löschen?')) return;
    await apiDelete(`/api/projekte/${projektId}/komponenten/${id}`);
    onReload();
  };
  const handleAdd = async (data: any) => {
    await apiPost(`/api/projekte/${projektId}/komponenten`, data);
    setShowModal(false);
    onReload();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Komponenten ({komponenten.length})</h3>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}><Plus size={16} /> Hinzufügen</button>
      </div>
      {komponenten.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}><Package size={40} style={{ marginBottom: '12px', opacity: 0.5 }} /><p>Keine Komponenten</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {komponenten.map((k: any) => {
            const t = typen.find(x => x.key === k.produktTyp) || { label: k.produktTyp, icon: '?', color: '#64748b' };
            return (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#0f172a', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{k.hersteller} {k.modell}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{k.anzahl}× {k.leistungW ? `${k.leistungW}W` : k.kapazitaetKwh ? `${k.kapazitaetKwh}kWh` : ''} {k.position && `• ${k.position}`}</div>
                </div>
                <button onClick={() => handleDelete(k.id)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <KomponenteModal typen={typen} onSave={handleAdd} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function KomponenteModal({ typen, onSave, onClose }: any) {
  const [form, setForm] = useState<any>({ produktTyp: 'PV_MODUL', anzahl: 1 });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' as const };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '28px', width: '450px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', color: '#fff' }}>Komponente hinzufügen</h3>
        <select style={{ ...inputStyle, marginBottom: '16px' }} value={form.produktTyp} onChange={e => setForm({ ...form, produktTyp: e.target.value })}>
          {typen.map((t: any) => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <input style={inputStyle} placeholder="Hersteller" value={form.hersteller || ''} onChange={e => setForm({ ...form, hersteller: e.target.value })} />
          <input style={inputStyle} placeholder="Modell" value={form.modell || ''} onChange={e => setForm({ ...form, modell: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <input type="number" style={inputStyle} placeholder="Anzahl" value={form.anzahl} onChange={e => setForm({ ...form, anzahl: parseInt(e.target.value) })} min="1" />
          <input type="number" style={inputStyle} placeholder="Leistung (W)" value={form.leistungW || ''} onChange={e => setForm({ ...form, leistungW: parseInt(e.target.value) })} />
          <input style={inputStyle} placeholder="Position" value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Abbrechen</button>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

function TabAufgaben({ projektId, aufgaben, onReload }: any) {
  const [showModal, setShowModal] = useState(false);
  const toggle = async (a: any) => {
    await apiPatch(`/api/projekte/${projektId}/aufgaben/${a.id}`, { status: a.status === 'ERLEDIGT' ? 'OFFEN' : 'ERLEDIGT' });
    onReload();
  };
  const handleAdd = async (data: any) => {
    await apiPost(`/api/projekte/${projektId}/aufgaben`, data);
    setShowModal(false);
    onReload();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Aufgaben ({aufgaben.filter((a: any) => a.status === 'OFFEN').length} offen)</h3>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}><Plus size={16} /> Aufgabe</button>
      </div>
      {aufgaben.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}><ClipboardList size={40} style={{ opacity: 0.5 }} /><p>Keine Aufgaben</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {aufgaben.map((a: any) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#0f172a', borderRadius: '8px', opacity: a.status === 'ERLEDIGT' ? 0.6 : 1 }}>
              <button onClick={() => toggle(a)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: a.status === 'ERLEDIGT' ? 'none' : '2px solid #475569', background: a.status === 'ERLEDIGT' ? '#22c55e' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.status === 'ERLEDIGT' && <CheckCircle2 size={14} color="#fff" />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', textDecoration: a.status === 'ERLEDIGT' ? 'line-through' : 'none' }}>{a.titel}</div>
                {a.faelligAm && <div style={{ fontSize: '0.8rem', color: new Date(a.faelligAm) < new Date() && a.status === 'OFFEN' ? '#ef4444' : '#64748b' }}>Fällig: {new Date(a.faelligAm).toLocaleDateString('de-DE')}</div>}
              </div>
              {a.prioritaet === 'HOCH' && <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#ef444420', color: '#ef4444', fontSize: '0.7rem' }}>HOCH</span>}
              {a.prioritaet === 'DRINGEND' && <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f9731620', color: '#f97316', fontSize: '0.7rem' }}>DRINGEND</span>}
            </div>
          ))}
        </div>
      )}
      {showModal && <AufgabeModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function AufgabeModal({ onSave, onClose }: any) {
  const [form, setForm] = useState<any>({ prioritaet: 'NORMAL' });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' as const };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '28px', width: '400px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', color: '#fff' }}>Aufgabe hinzufügen</h3>
        <input style={{ ...inputStyle, marginBottom: '16px' }} placeholder="Aufgabe..." value={form.titel || ''} onChange={e => setForm({ ...form, titel: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <input type="date" style={inputStyle} value={form.faelligAm || ''} onChange={e => setForm({ ...form, faelligAm: e.target.value })} />
          <select style={inputStyle} value={form.prioritaet} onChange={e => setForm({ ...form, prioritaet: e.target.value })}>
            <option value="NIEDRIG">Niedrig</option>
            <option value="NORMAL">Normal</option>
            <option value="HOCH">Hoch</option>
            <option value="DRINGEND">Dringend</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Abbrechen</button>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

function TabTimeline({ projektId, timeline, onReload }: any) {
  const [kommentar, setKommentar] = useState('');
  const handleAdd = async () => {
    if (!kommentar.trim()) return;
    await apiPost(`/api/projekte/${projektId}/timeline`, { typ: 'KOMMENTAR', titel: kommentar });
    setKommentar('');
    onReload();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} placeholder="Kommentar..." value={kommentar} onChange={e => setKommentar(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}>Senden</button>
      </div>
      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', background: '#334155' }} />
        {timeline.map((t: any) => (
          <div key={t.id} style={{ position: 'relative', marginBottom: '20px' }}>
            <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '20px', height: '20px', borderRadius: '50%', background: t.typ === 'STATUS_AENDERUNG' ? '#3b82f6' : '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t.typ === 'STATUS_AENDERUNG' ? '⚡' : t.typ === 'KOMMENTAR' ? '💬' : <Clock size={10} />}
            </div>
            <div style={{ marginLeft: '16px' }}>
              <div style={{ color: '#fff', marginBottom: '4px' }}>{t.titel}</div>
              {t.beschreibung && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{t.beschreibung}</div>}
              <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '4px' }}>{new Date(t.createdAt).toLocaleString('de-DE')} {t.erstelltVonName && `• ${t.erstelltVonName}`}</div>
            </div>
          </div>
        ))}
        {timeline.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Keine Einträge</div>}
      </div>
    </div>
  );
}

function TabFinanzen({ projekt }: any) {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Angebot', value: projekt.angebotssummeBrutto, color: '#f59e0b' },
          { label: 'Auftrag', value: projekt.auftragssummeBrutto, color: '#3b82f6' },
          { label: 'Rechnung', value: projekt.rechnungssumme, color: '#EAD068' },
          { label: 'Bezahlt', value: projekt.bezahltSumme, color: '#22c55e' },
          { label: 'Offen', value: projekt.offenerBetrag, color: '#ef4444' },
        ].map((item, i) => (
          <div key={i} style={{ background: `${item.color}10`, border: `1px solid ${item.color}30`, borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.value ? `${Number(item.value).toLocaleString('de-DE')} €` : '- €'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPlaceholder({ title, icon, items }: any) {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>{title}</h3>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}><Plus size={16} /> Hinzufügen</button>
      </div>
      {(!items || items.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>{icon}<p style={{ marginTop: '12px' }}>Keine {title}</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item: any) => (
            <div key={item.id} style={{ padding: '14px 16px', background: '#0f172a', borderRadius: '8px', color: '#fff' }}>{item.titel || item.dateiname || 'Eintrag'}</div>
          ))}
        </div>
      )}
    </div>
  );
}

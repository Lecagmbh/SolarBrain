/**
 * ManualProductModal - Popup für manuelle Produkteingabe
 * Wird angezeigt wenn "Nicht gefunden? Manuell eingeben" geklickt wird.
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProduktTyp } from './produktSuche.types';

export interface ManualProductData {
  isManual: true;
  hersteller: string;
  modell: string;
  modulHersteller?: string;
  modulModell?: string;
  modulLeistungWp?: number;
  leistungKw?: number;
  leistungKva?: number;
  hybrid?: boolean;
  phasen?: number;
  mppTrackerAnzahl?: number;
  zerezId?: string;
  kapazitaetKwh?: number;
  leistungKwSpeicher?: number;
  batterietyp?: string;
  kopplung?: string;
  notstrom?: boolean;
  ersatzstrom?: boolean;
  datenblattFile?: File;
}

interface Props {
  typ: ProduktTyp;
  initialHersteller?: string;
  initialModell?: string;
  onSubmit: (data: ManualProductData) => void;
  onClose: () => void;
}

const ICONS: Record<string, string> = { pvModule: '☀️', wechselrichter: '⚡', speicher: '🔋' };
const LABELS: Record<string, string> = { pvModule: 'PV-Modul', wechselrichter: 'Wechselrichter', speicher: 'Batteriespeicher' };

export const ManualProductModal: React.FC<Props> = ({ typ, initialHersteller = '', initialModell = '', onSubmit, onClose }) => {
  const [hersteller, setHersteller] = useState(initialHersteller);
  const [modell, setModell] = useState(initialModell);
  const [leistungWp, setLeistungWp] = useState<number | ''>('');
  const [leistungKw, setLeistungKw] = useState<number | ''>('');
  const [hybrid, setHybrid] = useState(false);
  const [phasen, setPhasen] = useState(3);
  const [mppt, setMppt] = useState<number | ''>(2);
  const [zerezId, setZerezId] = useState('');
  const [kapazitaetKwh, setKapazitaetKwh] = useState<number | ''>('');
  const [leistungKwSp, setLeistungKwSp] = useState<number | ''>('');
  const [batterietyp, setBatterietyp] = useState('LiFePO4');
  const [kopplung, setKopplung] = useState('DC');
  const [notstrom, setNotstrom] = useState(false);
  const [ersatzstrom, setErsatzstrom] = useState(false);
  const [datenblattFile, setDatenblattFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) setDatenblattFile(file);
  }, []);

  const valid = hersteller.trim().length > 0 && modell.trim().length > 0;

  const handleSubmit = () => {
    if (!valid) return;
    const d: ManualProductData = { isManual: true, hersteller: hersteller.trim(), modell: modell.trim() };
    if (typ === 'pvModule') {
      d.modulHersteller = d.hersteller; d.modulModell = d.modell;
      d.modulLeistungWp = typeof leistungWp === 'number' ? leistungWp : undefined;
    } else if (typ === 'wechselrichter') {
      d.leistungKw = typeof leistungKw === 'number' ? leistungKw : undefined;
      d.leistungKva = d.leistungKw; d.hybrid = hybrid; d.phasen = phasen;
      d.mppTrackerAnzahl = typeof mppt === 'number' ? mppt : undefined;
      d.zerezId = zerezId.trim() || undefined;
    } else if (typ === 'speicher') {
      d.kapazitaetKwh = typeof kapazitaetKwh === 'number' ? kapazitaetKwh : undefined;
      d.leistungKwSpeicher = typeof leistungKwSp === 'number' ? leistungKwSp : undefined;
      d.batterietyp = batterietyp; d.kopplung = kopplung.toLowerCase();
      d.notstrom = notstrom; d.ersatzstrom = ersatzstrom;
    }
    if (datenblattFile) d.datenblattFile = datenblattFile;
    onSubmit(d);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={S.overlay}>
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={e => e.stopPropagation()} style={S.modal}
        >
          {/* ── Header ───────────────────────────────────────── */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={S.headerIcon}>{ICONS[typ] || '📦'}</span>
              <div>
                <h3 style={S.headerTitle}>{LABELS[typ] || 'Produkt'} manuell eingeben</h3>
                <p style={S.headerSub}>Daten vom Herstellerdatenblatt eintragen</p>
              </div>
            </div>
            <button onClick={onClose} style={S.closeBtn}>×</button>
          </div>

          {/* ── Body ─────────────────────────────────────────── */}
          <div style={S.body}>

            {/* Basis */}
            <Section title="Identifikation">
              <Row>
                <Field label="Hersteller" value={hersteller} onChange={setHersteller} placeholder="z.B. Huawei" required />
                <Field label="Modell / Typ" value={modell} onChange={setModell} placeholder="z.B. SUN2000-10KTL" required />
              </Row>
            </Section>

            {/* PV */}
            {typ === 'pvModule' && (
              <Section title="Technische Daten">
                <Row>
                  <Num label="Modulleistung" value={leistungWp} onChange={setLeistungWp} placeholder="450" unit="Wp" />
                </Row>
              </Section>
            )}

            {/* WR */}
            {typ === 'wechselrichter' && (
              <Section title="Technische Daten">
                <Row>
                  <Num label="AC-Nennleistung" value={leistungKw} onChange={setLeistungKw} placeholder="10" unit="kW" />
                  <Num label="MPP-Tracker" value={mppt} onChange={setMppt} placeholder="2" unit="Stk" />
                </Row>
                <Row>
                  <Sel label="Netzanschluss" value={String(phasen)} onChange={v => setPhasen(Number(v))}
                    options={[{ v: '1', l: '1-phasig' }, { v: '3', l: '3-phasig' }]} />
                  <Field label="ZEREZ-ID" value={zerezId} onChange={setZerezId} placeholder="Zertifikatsnummer" />
                </Row>
                <div style={{ marginTop: 2 }}>
                  <Check label="Hybrid-Wechselrichter (mit Batterie-Anschluss)" checked={hybrid} onChange={setHybrid} />
                </div>
              </Section>
            )}

            {/* Speicher */}
            {typ === 'speicher' && (
              <Section title="Technische Daten">
                <Row>
                  <Num label="Nutzbare Kapazität" value={kapazitaetKwh} onChange={setKapazitaetKwh} placeholder="10" unit="kWh" />
                  <Num label="Max. Lade-/Entladeleistung" value={leistungKwSp} onChange={setLeistungKwSp} placeholder="5" unit="kW" />
                </Row>
                <Row>
                  <Sel label="Batterietyp" value={batterietyp} onChange={setBatterietyp}
                    options={[{ v: 'LiFePO4', l: 'LiFePO4' }, { v: 'NMC', l: 'NMC (Lithium)' }, { v: 'LTO', l: 'LTO' }, { v: 'Blei', l: 'Blei-Säure' }]} />
                  <Sel label="Kopplung" value={kopplung} onChange={setKopplung}
                    options={[{ v: 'DC', l: 'DC-gekoppelt' }, { v: 'AC', l: 'AC-gekoppelt' }]} />
                </Row>
                <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                  <Check label="Notstromfähig" checked={notstrom} onChange={setNotstrom} />
                  <Check label="Ersatzstromfähig" checked={ersatzstrom} onChange={setErsatzstrom} />
                </div>
              </Section>
            )}

            {/* Datenblatt */}
            <Section title="Datenblatt" optional>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...S.dropzone,
                  borderColor: dragOver ? 'rgba(99,139,255,0.5)' : 'rgba(255,255,255,0.08)',
                  background: dragOver ? 'rgba(99,139,255,0.04)' : 'transparent',
                }}
              >
                {datenblattFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📄</span>
                    <span style={{ fontSize: 12, color: '#638bff', flex: 1 }}>{datenblattFile.name}</span>
                    <button onClick={e => { e.stopPropagation(); setDatenblattFile(null); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>×</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, opacity: 0.4, marginBottom: 2 }}>📋</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      PDF oder Bild hierher ziehen — oder klicken
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,image/*"
                  onChange={e => { if (e.target.files?.[0]) setDatenblattFile(e.target.files[0]); }}
                  style={{ display: 'none' }} />
              </div>
            </Section>
          </div>

          {/* ── Footer ───────────────────────────────────────── */}
          <div style={S.footer}>
            <button onClick={onClose} style={S.cancelBtn}>Abbrechen</button>
            <button onClick={handleSubmit} disabled={!valid}
              style={{ ...S.submitBtn, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'default' }}>
              Übernehmen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={S.sectionHeader}>
        <span style={S.sectionTitle}>{title}</span>
        {optional && <span style={S.sectionOptional}>optional</span>}
      </div>
      <div style={S.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)}, 1fr)`, gap: 10, marginBottom: 8 }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={S.label}>{label}{required && <span style={{ color: '#f87171' }}> *</span>}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={S.input} onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,139,255,0.4)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
    </div>
  );
}

function Num({ label, value, onChange, placeholder, unit }: {
  label: string; value: number | ''; onChange: (v: number | '') => void; placeholder?: string; unit?: string;
}) {
  return (
    <div>
      <label style={S.label}>{label}{unit && <span style={{ color: 'rgba(255,255,255,0.3)' }}> ({unit})</span>}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={placeholder} step="any" style={S.input}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,139,255,0.4)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
    </div>
  );
}

function Sel({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: Array<{ v: string; l: string }>;
}) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={S.check}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${checked ? '#638bff' : 'rgba(255,255,255,0.15)'}`,
        background: checked ? 'rgba(99,139,255,0.15)' : 'transparent', transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#638bff', fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span>{label}</span>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const S = {
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: 'linear-gradient(180deg, #1e2b3d 0%, #172030 100%)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
    width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6)',
  },
  header: {
    padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerIcon: {
    fontSize: 22, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(99,139,255,0.08)', borderRadius: 10,
  },
  headerTitle: { margin: 0, fontSize: 15, fontWeight: 600 as const, color: '#fff', letterSpacing: '-0.01em' },
  headerSub: { margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  closeBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer',
  },
  body: { padding: '14px 22px 18px' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
    paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sectionTitle: { fontSize: 11, fontWeight: 600 as const, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  sectionOptional: {
    fontSize: 9, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)',
    padding: '1px 6px', borderRadius: 4,
  },
  sectionBody: { paddingLeft: 2, paddingRight: 2 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4, display: 'block' as const },
  input: {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, color: '#fff', fontSize: 13, outline: 'none', transition: 'border-color 0.15s',
  } as React.CSSProperties,
  check: {
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
    fontSize: 12, color: 'rgba(255,255,255,0.6)', userSelect: 'none' as const,
  },
  dropzone: {
    border: '1.5px dashed rgba(255,255,255,0.08)', borderRadius: 10,
    padding: '14px 12px', cursor: 'pointer', transition: 'all 0.2s',
  },
  footer: {
    padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', justifyContent: 'flex-end', gap: 8,
  },
  cancelBtn: {
    padding: '8px 18px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
    color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 22px', background: 'rgba(99,139,255,0.15)',
    border: '1px solid rgba(99,139,255,0.35)', borderRadius: 9,
    color: '#638bff', fontSize: 12, fontWeight: 600 as const, transition: 'all 0.15s',
  },
};

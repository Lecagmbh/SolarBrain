import React, { useState, useCallback } from 'react';
import { User, MapPin, Zap, Building2, Gauge, Edit2, Check, X, Loader2, Copy } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { T, box, boxHeader, boxTitle, boxBadge, boxBody } from '../styles';
import { CopyField } from '../sections/CopyField';
import { formatDate } from '../utils/formatters';
import type { Installation, NormalizedWizardData } from '../types';

interface LeftColumnProps {
  data: Installation;
  wizardData: NormalizedWizardData;
  onCopy: (text: string, key: string) => void;
  isCopied: (key: string) => boolean;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const editInput: React.CSSProperties = {
  flex: 1, padding: '3px 8px', borderRadius: 4,
  border: `1px solid ${T.ba}`, background: T.s3,
  color: T.t1, fontSize: 11, fontFamily: 'inherit',
  outline: 'none',
};

const editBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 3,
  padding: '3px 8px', borderRadius: 4,
  fontSize: 10, fontWeight: 500, cursor: 'pointer',
  border: 'none', fontFamily: 'inherit',
};

export function LeftColumn({ data, wizardData, onCopy, isCopied, showToast }: LeftColumnProps) {
  const queryClient = useQueryClient();
  const cust = wizardData.customer;
  const loc = wizardData.location;
  const tech = wizardData.technical;
  const meter = wizardData.meter;

  const [isEditingNb, setIsEditingNb] = useState(false);
  const [nbEditEmail, setNbEditEmail] = useState(data.nbEmail || '');
  const [nbEditCaseNumber, setNbEditCaseNumber] = useState(data.nbCaseNumber || '');
  const [nbSaving, setNbSaving] = useState(false);

  const handleNbSave = useCallback(async () => {
    setNbSaving(true);
    try {
      const promises: Promise<Response>[] = [];
      const trimmedCase = nbEditCaseNumber.trim();
      if (trimmedCase !== (data.nbCaseNumber || '')) {
        promises.push(
          fetch(`/api/installations/${data.id}/nb-tracking`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nbVorgangsnummer: trimmedCase || null }),
          })
        );
      }
      const trimmedEmail = nbEditEmail.trim();
      if (data.gridOperatorId && trimmedEmail !== (data.nbEmail || '')) {
        promises.push(
          fetch(`/api/ops/nb/${data.gridOperatorId}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ einreichEmail: trimmedEmail || null }),
          })
        );
      }
      if (promises.length > 0) await Promise.all(promises);
      setIsEditingNb(false);
      showToast('NB-Daten gespeichert', 'success');
      queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] });
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setNbSaving(false);
    }
  }, [nbEditCaseNumber, nbEditEmail, data, showToast, queryClient]);

  const fullAddress = [
    [loc.street, loc.houseNumber].filter(Boolean).join(' '),
    [loc.zip, loc.city].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');

  return (
    <div className="gnz-scroll" style={{
      overflowY: 'auto', padding: 10,
      display: 'flex', flexDirection: 'column', gap: 10,
      borderRight: `1px solid ${T.bd}`,
      minHeight: 0,
    }}>
      {/* Kunde */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><User size={13} /> Kunde</div>
          {cust?.type && <span style={boxBadge}>{cust.type}</span>}
        </div>
        <div style={boxBody}>
          <CopyField label="Name" value={cust ? `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || data.customerName : data.customerName} onCopy={onCopy} isCopied={isCopied} />
          {cust?.company && <CopyField label="Firma" value={cust.company} onCopy={onCopy} isCopied={isCopied} />}
          <CopyField label="Geb.datum" value={cust?.birthDate ? formatDate(cust.birthDate) : undefined} onCopy={onCopy} isCopied={isCopied} />
          <CopyField label="Telefon" value={cust?.phone || data.contactPhone} onCopy={onCopy} isCopied={isCopied} />
          {cust?.mobile && <CopyField label="Mobil" value={cust.mobile} onCopy={onCopy} isCopied={isCopied} />}
          <CopyField label="Email" value={cust?.email || data.contactEmail} onCopy={onCopy} isCopied={isCopied} />
        </div>
      </div>

      {/* Standort */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><MapPin size={13} /> Standort</div>
        </div>
        <div style={boxBody}>
          <CopyField label="Straße" value={loc.street} onCopy={onCopy} isCopied={isCopied} />
          <CopyField label="Hausnr." value={loc.houseNumber} onCopy={onCopy} isCopied={isCopied} />
          <CopyField label="PLZ" value={loc.zip} mono onCopy={onCopy} isCopied={isCopied} />
          <CopyField label="Ort" value={loc.city} onCopy={onCopy} isCopied={isCopied} />
          {loc.bundesland && <CopyField label="Bundesl." value={loc.bundesland} onCopy={onCopy} isCopied={isCopied} />}
          {fullAddress && (
            <div
              onClick={() => onCopy(fullAddress, 'full-address')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px', cursor: 'pointer',
                background: isCopied('full-address') ? T.acGlow : 'transparent',
                transition: 'background 0.12s',
                borderBottom: `1px solid ${T.bd}`,
              }}
            >
              <Copy size={11} style={{ color: T.t3, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.ac }}>Komplette Adresse kopieren</span>
            </div>
          )}
        </div>
      </div>

      {/* Anlage */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><Zap size={13} /> Anlage</div>
          {tech.totalPvKwp && <span style={boxBadge}>{Number(tech.totalPvKwp).toFixed(2)} kWp</span>}
        </div>
        <div style={boxBody}>
          <CopyField label="Leistung" value={tech.totalPvKwp ? `${Number(tech.totalPvKwp).toFixed(2)} kWp` : undefined} onCopy={onCopy} isCopied={isCopied} />
          {tech.totalBatteryKwh ? <CopyField label="Speicher" value={`${tech.totalBatteryKwh} kWh`} onCopy={onCopy} isCopied={isCopied} /> : null}
          {data.wallboxKw ? <CopyField label="Wallbox" value={`${data.wallboxKw} kW`} onCopy={onCopy} isCopied={isCopied} /> : null}
          {data.waermepumpeKw ? <CopyField label="WP" value={`${data.waermepumpeKw} kW`} onCopy={onCopy} isCopied={isCopied} /> : null}
          {tech.feedInType ? <CopyField label="Einspeis." value={tech.feedInType} onCopy={onCopy} isCopied={isCopied} /> : null}

          {wizardData.pvEntries.filter(pv => pv.manufacturer || pv.model).map((pv, i) => (
            <CopyField
              key={`pv-${i}`} label="Module"
              value={`${pv.count > 1 ? `${pv.count}× ` : ''}${pv.manufacturer || ''} ${pv.model || ''}${pv.powerWp ? ` (${pv.powerWp} Wp)` : ''}`.trim()}
              onCopy={onCopy} isCopied={isCopied}
            />
          ))}
          {wizardData.inverterEntries.filter(inv => inv.manufacturer || inv.model).map((inv, i) => (
            <React.Fragment key={`inv-${i}`}>
              <CopyField
                label="WR"
                value={`${inv.count > 1 ? `${inv.count}× ` : ''}${inv.manufacturer || ''} ${inv.model || ''}`.trim()}
                onCopy={onCopy} isCopied={isCopied}
              />
              {inv.zerezId && <CopyField label="ZEREZ-ID" value={inv.zerezId} mono onCopy={onCopy} isCopied={isCopied} />}
            </React.Fragment>
          ))}
          {wizardData.batteryEntries.filter(bat => bat.manufacturer || bat.model).map((bat, i) => (
            <React.Fragment key={`bat-${i}`}>
              <CopyField
                label="Speicher"
                value={`${bat.count > 1 ? `${bat.count}× ` : ''}${bat.manufacturer || ''} ${bat.model || ''}${bat.capacityKwh ? ` (${bat.capacityKwh} kWh)` : ''}`.trim()}
                onCopy={onCopy} isCopied={isCopied}
              />
              {bat.zerezId && <CopyField label="ZEREZ-ID" value={bat.zerezId} mono onCopy={onCopy} isCopied={isCopied} />}
            </React.Fragment>
          ))}
          {wizardData.wallboxEntries.filter(wb => wb.manufacturer || wb.model).map((wb, i) => (
            <CopyField
              key={`wb-${i}`} label="Wallbox"
              value={`${wb.count > 1 ? `${wb.count}× ` : ''}${wb.manufacturer || ''} ${wb.model || ''}${wb.powerKw ? ` (${wb.powerKw} kW)` : ''}`.trim()}
              onCopy={onCopy} isCopied={isCopied}
            />
          ))}
          {wizardData.heatpumpEntries.filter(hp => hp.manufacturer || hp.model).map((hp, i) => (
            <CopyField
              key={`hp-${i}`} label="Wärmepumpe"
              value={`${hp.count > 1 ? `${hp.count}× ` : ''}${hp.manufacturer || ''} ${hp.model || ''}${hp.powerKw ? ` (${hp.powerKw} kW)` : ''}`.trim()}
              onCopy={onCopy} isCopied={isCopied}
            />
          ))}
        </div>
      </div>

      {/* Netzanmeldung */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><Building2 size={13} /> Netzanmeldung</div>
          {!isEditingNb && (
            <button
              onClick={() => setIsEditingNb(true)}
              style={{ ...editBtn, background: T.s3, color: T.t2 }}
            >
              <Edit2 size={10} />
            </button>
          )}
        </div>
        <div style={boxBody}>
          <CopyField label="NB" value={data.gridOperator || wizardData.gridOperator.name} onCopy={onCopy} isCopied={isCopied} />
          {isEditingNb ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px' }}>
                <span style={{ flexShrink: 0, width: 90, fontSize: 11, color: T.t3 }}>NB-Email</span>
                <input
                  style={editInput}
                  value={nbEditEmail}
                  onChange={e => setNbEditEmail(e.target.value)}
                  placeholder="NB Email..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px' }}>
                <span style={{ flexShrink: 0, width: 90, fontSize: 11, color: T.t3 }}>Vorgangs-Nr</span>
                <input
                  style={editInput}
                  value={nbEditCaseNumber}
                  onChange={e => setNbEditCaseNumber(e.target.value)}
                  placeholder="Aktenzeichen..."
                />
              </div>
              <div style={{ display: 'flex', gap: 4, padding: '4px 12px' }}>
                <button
                  style={{ ...editBtn, background: T.ac, color: '#fff' }}
                  onClick={handleNbSave}
                  disabled={nbSaving}
                >
                  {nbSaving ? <Loader2 size={10} className="gnz-spin" /> : <Check size={10} />} Speichern
                </button>
                <button
                  style={{ ...editBtn, background: T.s3, color: T.t2 }}
                  onClick={() => setIsEditingNb(false)}
                >
                  <X size={10} /> Abbrechen
                </button>
              </div>
            </>
          ) : (
            <>
              <CopyField label="NB-Email" value={data.nbEmail} onCopy={onCopy} isCopied={isCopied} />
              <CopyField label="Vorgangs-Nr" value={data.nbCaseNumber} mono onCopy={onCopy} isCopied={isCopied} />
            </>
          )}
          <CopyField label="Eingereicht" value={data.nbEingereichtAm ? formatDate(data.nbEingereichtAm) : undefined} onCopy={onCopy} isCopied={isCopied} />
          {data.daysAtNb != null && data.daysAtNb > 0 && (
            <CopyField label="Wartezeit" value={`${data.daysAtNb} Tage`} onCopy={onCopy} isCopied={isCopied} />
          )}
        </div>
      </div>

      {/* Zähler */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><Gauge size={13} /> Zähler</div>
        </div>
        <div style={boxBody}>
          <CopyField label="Nummer" value={meter.number} mono onCopy={onCopy} isCopied={isCopied} />
          {meter.type && <CopyField label="Typ" value={meter.type} onCopy={onCopy} isCopied={isCopied} />}
          {meter.location && <CopyField label="Standort" value={meter.location} onCopy={onCopy} isCopied={isCopied} />}
          {meter.ownership && <CopyField label="Eigentümer" value={meter.ownership} onCopy={onCopy} isCopied={isCopied} />}
          {meter.tariffType && <CopyField label="Tarif" value={meter.tariffType} onCopy={onCopy} isCopied={isCopied} />}
          {meter.zaehlpunkt && <CopyField label="Zählpunkt" value={meter.zaehlpunkt} mono onCopy={onCopy} isCopied={isCopied} />}
          {meter.marktlokation && <CopyField label="MaLo-ID" value={meter.marktlokation} mono onCopy={onCopy} isCopied={isCopied} />}
        </div>
      </div>
    </div>
  );
}

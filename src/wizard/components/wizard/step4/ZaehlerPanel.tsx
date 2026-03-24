/**
 * ZaehlerPanel - Meter data panel with toggle, fields, iMSys and meter readings.
 * Design improvement: Zählerstände wrapped in CollapsibleSection (default closed).
 */

import React from 'react';
import { styles } from '../steps/shared';
import { Input, Select, Checkbox } from '../../ui';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import type {
  ZaehlerTyp,
  ZaehlerStandort,
  ZaehlerEigentum,
  TarifArt,
  ZaehlerData,
  WizardStep4Data,
} from '../../../types/wizard.types';
import { createDefaultZaehler } from '../../../types/wizard.types';

interface ZaehlerPanelProps {
  zaehler: ZaehlerData | undefined;
  updateStep4: (data: Partial<WizardStep4Data>) => void;
}

export const ZaehlerPanel: React.FC<ZaehlerPanelProps> = ({ zaehler, updateStep4 }) => {
  const updateZaehler = (patch: Partial<ZaehlerData>) => {
    const current = zaehler || createDefaultZaehler();
    updateStep4({ zaehler: { ...current, ...patch } });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelTitleIcon}>{'\uD83D\uDD22'}</div>
          <span>Zählerdaten</span>
        </div>
        <span className={styles.panelBadge}>
          {zaehler?.vorhanden ? 'Bestand' : 'Kein Zähler'}
        </span>
      </div>

      {/* Toggle: Zähler vorhanden? */}
      <div style={{ marginBottom: 16 }}>
        <Checkbox
          label="Zähler bereits vorhanden"
          checked={zaehler?.vorhanden ?? false}
          onChange={(v) => updateZaehler({ vorhanden: v })}
        />
      </div>

      {/* Zähler details when present */}
      {zaehler?.vorhanden && (
        <>
          <div className={styles.row}>
            <Input
              label="Zählernummer"
              value={zaehler?.zaehlernummer || ''}
              onChange={(v) => updateZaehler({ zaehlernummer: v })}
              placeholder="z.B. 1ESY1234567890"
            />
            <Input
              label="Zählpunktbezeichnung (MeLo-ID)"
              value={zaehler?.zaehlpunktbezeichnung || ''}
              onChange={(v) => updateZaehler({ zaehlpunktbezeichnung: v })}
              placeholder="DE000..."
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Zählertyp"
              value={zaehler?.typ || 'zweirichtung'}
              onChange={(v) => updateZaehler({ typ: v as ZaehlerTyp })}
              options={[
                { value: 'einrichtung', label: 'Einrichtungszähler (nur Bezug)' },
                { value: 'zweirichtung', label: 'Zweirichtungszähler (Bezug + Einspeisung)' },
                { value: 'wandlermessung', label: 'Wandlermessung (>63A)' },
                { value: 'rlm', label: 'RLM - Registrierende Leistungsmessung' },
              ]}
            />
            <Select
              label="Standort"
              value={zaehler?.standort || 'keller'}
              onChange={(v) => updateZaehler({ standort: v as ZaehlerStandort })}
              options={[
                { value: 'hausanschluss', label: 'Am Hausanschlusskasten' },
                { value: 'keller', label: 'Keller-Zählerschrank' },
                { value: 'technikraum', label: 'Technikraum' },
                { value: 'garage', label: 'Garage' },
                { value: 'outdoor', label: 'Außenbereich' },
                { value: 'zaehlerplatz', label: 'Zählerplatz im Gebäude' },
              ]}
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Eigentum"
              value={zaehler?.eigentum || 'netzbetreiber'}
              onChange={(v) => updateZaehler({ eigentum: v as ZaehlerEigentum })}
              options={[
                { value: 'netzbetreiber', label: 'Netzbetreiber (Standard)' },
                { value: 'messstellenbetreiber', label: 'Dritter Messstellenbetreiber' },
                { value: 'kunde', label: 'Kundeneigentum' },
              ]}
            />
            <Select
              label="Tarifart"
              value={zaehler?.tarifart || 'eintarif'}
              onChange={(v) => updateZaehler({ tarifart: v as TarifArt })}
              options={[
                { value: 'eintarif', label: 'Eintarif (ET)' },
                { value: 'zweitarif', label: 'Zweitarif (HT/NT)' },
                { value: 'ht_nt_wp', label: 'HT/NT + Wärmepumpe' },
              ]}
            />
          </div>

          {/* Smart Meter Options */}
          <div className={styles.imsysPanel}>
            <div className={styles.imsysPanelTitle}>Intelligente Messsysteme (iMSys)</div>
            <div className={styles.imsysCheckboxes}>
              <Checkbox
                label="Fernauslesung vorhanden"
                checked={zaehler?.fernauslesung ?? false}
                onChange={(v) => updateZaehler({ fernauslesung: v })}
              />
              <Checkbox
                label="Smart Meter Gateway"
                checked={zaehler?.smartMeterGateway ?? false}
                onChange={(v) => updateZaehler({ smartMeterGateway: v })}
              />
              <Checkbox
                label="iMSys gewünscht"
                checked={zaehler?.imsysGewuenscht ?? false}
                onChange={(v) => updateZaehler({ imsysGewuenscht: v })}
              />
            </div>
          </div>

          {/* Zählerstände - wrapped in CollapsibleSection (default closed) */}
          <div style={{ marginTop: 16 }}>
            <CollapsibleSection title="Zählerstände" badge="Optional" icon={'\uD83D\uDCCA'}>
              <div className={styles.row3}>
                <Input
                  label="Bezug (kWh)"
                  type="number"
                  value={zaehler?.zaehlerstdBezug?.toString() || ''}
                  onChange={(v) =>
                    updateZaehler({ zaehlerstdBezug: v ? parseFloat(v) : undefined })
                  }
                  placeholder="z.B. 12345"
                />
                <Input
                  label="Einspeisung (kWh)"
                  type="number"
                  value={zaehler?.zaehlerstdEinspeisung?.toString() || ''}
                  onChange={(v) =>
                    updateZaehler({ zaehlerstdEinspeisung: v ? parseFloat(v) : undefined })
                  }
                  placeholder="z.B. 5678"
                />
                <Input
                  label="Ablesedatum"
                  type="date"
                  value={zaehler?.ablesedatum || ''}
                  onChange={(v) => updateZaehler({ ablesedatum: v })}
                />
              </div>
            </CollapsibleSection>
          </div>
        </>
      )}

      {/* New meter desired */}
      {!zaehler?.vorhanden && (
        <div
          style={{
            padding: 12,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#6ee7b7' }}>
            Gewünschter Zähler
          </div>
          <div className={styles.row}>
            <Select
              label="Zählertyp"
              value={zaehler?.gewuenschterTyp || 'zweirichtung'}
              onChange={(v) => updateZaehler({ gewuenschterTyp: v as ZaehlerTyp })}
              options={[
                { value: 'einrichtung', label: 'Einrichtungszähler' },
                { value: 'zweirichtung', label: 'Zweirichtungszähler' },
                { value: 'wandlermessung', label: 'Wandlermessung' },
                { value: 'rlm', label: 'RLM' },
              ]}
            />
            <Select
              label="Gewünschter Standort"
              value={zaehler?.gewuenschterStandort || 'keller'}
              onChange={(v) => updateZaehler({ gewuenschterStandort: v as ZaehlerStandort })}
              options={[
                { value: 'hausanschluss', label: 'Hausanschlusskasten' },
                { value: 'keller', label: 'Keller' },
                { value: 'technikraum', label: 'Technikraum' },
                { value: 'garage', label: 'Garage' },
                { value: 'outdoor', label: 'Außen' },
                { value: 'zaehlerplatz', label: 'Zählerplatz' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

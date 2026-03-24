/**
 * ZaehlerNeuConfig - New meter configuration after consolidation.
 * Shown only when meters are being consolidated (aktion === 'zusammenlegen').
 */

import React from 'react';
import { styles } from '../steps/shared';
import { Select, Checkbox } from '../../ui';
import type {
  ZaehlerTyp,
  ZaehlerStandort,
  ZaehlerBefestigung,
  ZaehlerNeuData,
  ZaehlerBestandItem as ZaehlerBestandItemType,
} from '../../../types/wizard.types';

interface ZaehlerNeuConfigProps {
  zaehlerNeu: ZaehlerNeuData | undefined;
  zaehlerBestand: ZaehlerBestandItemType[] | undefined;
  updateZaehlerNeu: (data: Partial<ZaehlerNeuData>) => void;
}

export const ZaehlerNeuConfig: React.FC<ZaehlerNeuConfigProps> = ({
  zaehlerNeu,
  zaehlerBestand,
  updateZaehlerNeu,
}) => {
  const zusammenzulegende = zaehlerBestand?.filter((z) => z.aktion === 'zusammenlegen') || [];

  if (zusammenzulegende.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#6ee7b7' }}>
        {'\u26A1'} Neuer Zähler (nach Zusammenlegung)
      </div>

      <div className={styles.row}>
        <Select
          label="Gewünschter Zählertyp"
          value={zaehlerNeu?.gewuenschterTyp || 'zweirichtung'}
          onChange={(v) => updateZaehlerNeu({ gewuenschterTyp: v as ZaehlerTyp })}
          options={[
            { value: 'einrichtung', label: 'Einrichtung (nur Bezug)' },
            { value: 'zweirichtung', label: 'Zweirichtung (Bezug + Einspeisung)' },
            { value: 'wandlermessung', label: 'Wandlermessung (>63A)' },
            { value: 'rlm', label: 'RLM' },
          ]}
        />
        <Select
          label="Standort"
          value={zaehlerNeu?.standort || 'keller'}
          onChange={(v) => updateZaehlerNeu({ standort: v as ZaehlerStandort })}
          options={[
            { value: 'hausanschluss', label: 'Hausanschluss' },
            { value: 'keller', label: 'Keller' },
            { value: 'technikraum', label: 'Technikraum' },
            { value: 'garage', label: 'Garage' },
            { value: 'outdoor', label: 'Außen' },
            { value: 'zaehlerplatz', label: 'Zählerplatz' },
          ]}
        />
      </div>

      <div className={styles.row}>
        <Select
          label="Befestigung"
          value={zaehlerNeu?.befestigung || 'dreipunkt'}
          onChange={(v) => updateZaehlerNeu({ befestigung: v as ZaehlerBefestigung })}
          options={[
            { value: 'dreipunkt', label: 'Dreipunktbefestigung (Standard)' },
            { value: 'hutschiene', label: 'Hutschienenmontage' },
            { value: 'anreihzaehler', label: 'Anreihzähler' },
          ]}
        />
        <Select
          label="Für Anlage"
          value={zaehlerNeu?.fuerAnlage || 'pv'}
          onChange={(v) =>
            updateZaehlerNeu({
              fuerAnlage: v as
                | 'pv'
                | 'speicher'
                | 'wallbox'
                | 'waermepumpe'
                | 'allgemeinstrom'
                | 'sonstige',
            })
          }
          options={[
            { value: 'pv', label: 'PV-Anlage' },
            { value: 'speicher', label: 'Speicher' },
            { value: 'wallbox', label: 'Wallbox' },
            { value: 'waermepumpe', label: 'Wärmepumpe' },
            { value: 'allgemeinstrom', label: 'Allgemeinstrom' },
            { value: 'sonstige', label: 'Sonstige' },
          ]}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <Checkbox
          label="Intelligentes Messsystem (iMSys) gewünscht"
          checked={zaehlerNeu?.imsysGewuenscht ?? false}
          onChange={(v) => updateZaehlerNeu({ imsysGewuenscht: v })}
        />
      </div>

      {/* Summary of meters being consolidated */}
      <div
        style={{
          marginTop: 12,
          padding: 10,
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: 6,
          fontSize: 12,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <strong>Zusammenzulegende Zähler:</strong>
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          {zusammenzulegende.map((z) => (
            <li key={z.id}>
              {z.zaehlernummer || '(ohne Nr.)'} - {z.verwendung || 'Unbenannt'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

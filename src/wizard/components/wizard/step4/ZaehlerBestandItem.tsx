/**
 * ZaehlerBestandItem - Single meter item in multi-meter management.
 * Renders one existing meter with its data fields and action buttons.
 */

import React from 'react';
import { styles } from '../steps/shared';
import { Input, Select } from '../../ui';
import type {
  ZaehlerBestandItem as ZaehlerBestandItemType,
  ZaehlerTyp,
  ZaehlerStandort,
  ZaehlerAktion,
} from '../../../types/wizard.types';

interface ZaehlerBestandItemProps {
  zaehler: ZaehlerBestandItemType;
  index: number;
  onUpdate: (id: string, data: Partial<ZaehlerBestandItemType>) => void;
  onRemove: (id: string) => void;
}

const AKTION_OPTIONS: Array<{
  value: ZaehlerAktion;
  label: string;
  color: string;
  borderColor: string;
}> = [
  {
    value: 'behalten',
    label: '\u2713 Behalten',
    color: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  {
    value: 'abmelden',
    label: '\u2715 Abmelden',
    color: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  {
    value: 'zusammenlegen',
    label: '\u2295 Zusammenlegen',
    color: 'rgba(139, 92, 246, 0.3)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
];

const getItemBackground = (aktion: ZaehlerAktion | undefined): string => {
  if (aktion === 'zusammenlegen') return 'rgba(139, 92, 246, 0.15)';
  if (aktion === 'abmelden') return 'rgba(239, 68, 68, 0.15)';
  return 'rgba(31, 41, 55, 0.6)';
};

const getItemBorder = (aktion: ZaehlerAktion | undefined): string => {
  if (aktion === 'zusammenlegen') return '1px solid rgba(139, 92, 246, 0.4)';
  if (aktion === 'abmelden') return '1px solid rgba(239, 68, 68, 0.4)';
  return '1px solid rgba(255, 255, 255, 0.1)';
};

export const ZaehlerBestandItemComponent: React.FC<ZaehlerBestandItemProps> = ({
  zaehler,
  index,
  onUpdate,
  onRemove,
}) => {
  return (
    <div
      style={{
        padding: 16,
        background: getItemBackground(zaehler.aktion),
        border: getItemBorder(zaehler.aktion),
        borderRadius: 10,
      }}
    >
      {/* Header with number and delete */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 600, color: '#fff' }}>
          Zähler {index + 1}: {zaehler.verwendung || 'Unbenannt'}
        </div>
        <button
          onClick={() => onRemove(zaehler.id)}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '4px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          {'\u2715'} Entfernen
        </button>
      </div>

      {/* Meter Data */}
      <div className={styles.row}>
        <Input
          label="Zählernummer"
          value={zaehler.zaehlernummer}
          onChange={(v) => onUpdate(zaehler.id, { zaehlernummer: v })}
          placeholder="z.B. 1ESY1234567890"
        />
        <Input
          label="Verwendung"
          value={zaehler.verwendung || ''}
          onChange={(v) => onUpdate(zaehler.id, { verwendung: v })}
          placeholder="z.B. Haushalt, Wärmepumpe"
        />
      </div>

      <div className={styles.row}>
        <Select
          label="Zählertyp"
          value={zaehler.typ}
          onChange={(v) => onUpdate(zaehler.id, { typ: v as ZaehlerTyp })}
          options={[
            { value: 'einrichtung', label: 'Einrichtung (nur Bezug)' },
            { value: 'zweirichtung', label: 'Zweirichtung' },
            { value: 'wandlermessung', label: 'Wandlermessung' },
            { value: 'rlm', label: 'RLM' },
          ]}
        />
        <Select
          label="Standort"
          value={zaehler.standort}
          onChange={(v) => onUpdate(zaehler.id, { standort: v as ZaehlerStandort })}
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
        <Input
          label="Letzter Zählerstand (kWh)"
          type="number"
          value={zaehler.letzterStand?.toString() || ''}
          onChange={(v) => onUpdate(zaehler.id, { letzterStand: v ? parseFloat(v) : undefined })}
          placeholder="z.B. 12345"
        />
        <Input
          label="Ablesedatum"
          type="date"
          value={zaehler.ablesedatum || ''}
          onChange={(v) => onUpdate(zaehler.id, { ablesedatum: v })}
        />
      </div>

      {/* Action for this meter */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,0.6)' }}>
          Aktion für diesen Zähler:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AKTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate(zaehler.id, { aktion: opt.value })}
              style={{
                background: zaehler.aktion === opt.value ? opt.color : 'transparent',
                border: `1px solid ${zaehler.aktion === opt.value ? opt.borderColor : 'rgba(255,255,255,0.2)'}`,
                color: zaehler.aktion === opt.value ? '#fff' : 'rgba(255,255,255,0.6)',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: zaehler.aktion === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

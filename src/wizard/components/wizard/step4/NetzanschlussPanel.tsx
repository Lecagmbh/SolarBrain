/**
 * NetzanschlussPanel - Grid connection panel (HAK, Erdung, Leistung, Netzparameter).
 * Design improvements:
 *  - "Gewünschte Anschlussleistung" wrapped in CollapsibleSection "Leistungserhöhung gewünscht?"
 *  - "Netzparameter" wrapped in CollapsibleSection with badge="Optional"
 */

import React from 'react';
import { styles } from '../steps/shared';
import { Input, Select } from '../../ui';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import type {
  Erdungsart,
  AbsicherungA,
  NetzanschlussData,
  WizardStep4Data,
} from '../../../types/wizard.types';
import { createDefaultNetzanschluss } from '../../../types/wizard.types';

interface NetzanschlussPanelProps {
  netzanschluss: NetzanschlussData | undefined;
  updateStep4: (data: Partial<WizardStep4Data>) => void;
}

const ABSICHERUNG_OPTIONS = [
  { value: '', label: '-- Bitte wählen --' },
  { value: '25', label: '25 A' },
  { value: '35', label: '35 A' },
  { value: '50', label: '50 A' },
  { value: '63', label: '63 A (häufig)' },
  { value: '80', label: '80 A' },
  { value: '100', label: '100 A' },
  { value: '125', label: '125 A' },
  { value: '160', label: '160 A' },
  { value: '200', label: '200 A' },
  { value: '250', label: '250 A' },
  { value: '315', label: '315 A' },
  { value: '400', label: '400 A' },
];

const ABSICHERUNG_OPTIONS_KEINE = [
  { value: '', label: '-- Keine Änderung --' },
  { value: '25', label: '25 A' },
  { value: '35', label: '35 A' },
  { value: '50', label: '50 A' },
  { value: '63', label: '63 A' },
  { value: '80', label: '80 A' },
  { value: '100', label: '100 A' },
  { value: '125', label: '125 A' },
  { value: '160', label: '160 A' },
  { value: '200', label: '200 A' },
  { value: '250', label: '250 A' },
  { value: '315', label: '315 A' },
  { value: '400', label: '400 A' },
];

export const NetzanschlussPanel: React.FC<NetzanschlussPanelProps> = ({
  netzanschluss,
  updateStep4,
}) => {
  const updateNetzanschluss = (patch: Partial<NetzanschlussData>) => {
    const current = netzanschluss || createDefaultNetzanschluss();
    updateStep4({ netzanschluss: { ...current, ...patch } });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelTitleIcon}>{'\uD83D\uDD0C'}</div>
          <span>Netzanschluss</span>
        </div>
      </div>

      <div className={styles.formGrid2}>
        <Input
          label="HAK-Identifikation"
          value={netzanschluss?.hakId || ''}
          onChange={(v) => updateNetzanschluss({ hakId: v })}
          placeholder="Hausanschlusskasten-ID"
        />
        <Select
          label="Erdungsart"
          value={netzanschluss?.erdungsart || ''}
          onChange={(v) => updateNetzanschluss({ erdungsart: v as Erdungsart })}
          options={[
            { value: '', label: '-- Bitte wählen --' },
            { value: 'TN-C', label: 'TN-C' },
            { value: 'TN-S', label: 'TN-S' },
            { value: 'TN-C-S', label: 'TN-C-S (häufigste)' },
            { value: 'TT', label: 'TT' },
            { value: 'IT', label: 'IT' },
          ]}
        />
      </div>

      {/* Bestehende Anschlussleistung */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#60a5fa' }}>
          Bestehender Anschluss
        </div>
        <div className={styles.row}>
          <Input
            label="Leistung (kW)"
            type="number"
            value={netzanschluss?.bestehendeLeistungKw?.toString() || ''}
            onChange={(v) =>
              updateNetzanschluss({ bestehendeLeistungKw: v ? parseFloat(v) : undefined })
            }
            placeholder="z.B. 30"
          />
          <Select
            label="Absicherung (A)"
            value={netzanschluss?.bestehendeAbsicherungA?.toString() || ''}
            onChange={(v) =>
              updateNetzanschluss({
                bestehendeAbsicherungA: v ? (parseInt(v) as AbsicherungA) : undefined,
              })
            }
            options={ABSICHERUNG_OPTIONS}
          />
        </div>
      </div>

      {/* Gewünschte Erweiterung - wrapped in CollapsibleSection */}
      <div style={{ marginTop: 16 }}>
        <CollapsibleSection title="Leistungserhöhung gewünscht?" icon={'\u26A1'}>
          <div className={styles.row}>
            <Input
              label="Neue Leistung (kW)"
              type="number"
              value={netzanschluss?.gewuenschteLeistungKw?.toString() || ''}
              onChange={(v) =>
                updateNetzanschluss({ gewuenschteLeistungKw: v ? parseFloat(v) : undefined })
              }
              placeholder="z.B. 50"
            />
            <Select
              label="Neue Absicherung (A)"
              value={netzanschluss?.gewuenschteAbsicherungA?.toString() || ''}
              onChange={(v) =>
                updateNetzanschluss({
                  gewuenschteAbsicherungA: v ? (parseInt(v) as AbsicherungA) : undefined,
                })
              }
              options={ABSICHERUNG_OPTIONS_KEINE}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Input
              label="Grund für Leistungserhöhung"
              value={netzanschluss?.leistungserhoehungGrund || ''}
              onChange={(v) => updateNetzanschluss({ leistungserhoehungGrund: v })}
              placeholder="z.B. PV-Anlage mit Speicher"
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Technische Netzparameter - wrapped in CollapsibleSection */}
      <div style={{ marginTop: 16 }}>
        <CollapsibleSection title="Netzparameter (Experte)" badge="Optional" icon={'\uD83D\uDD27'}>
          <div className={styles.row}>
            <Input
              label="Kurzschlussleistung (MVA)"
              type="number"
              value={netzanschluss?.kurzschlussleistungMVA?.toString() || ''}
              onChange={(v) =>
                updateNetzanschluss({ kurzschlussleistungMVA: v ? parseFloat(v) : undefined })
              }
              placeholder="z.B. 500"
            />
            <Input
              label="Netzimpedanz (Ω)"
              type="number"
              value={netzanschluss?.netzimpedanzOhm?.toString() || ''}
              onChange={(v) =>
                updateNetzanschluss({ netzimpedanzOhm: v ? parseFloat(v) : undefined })
              }
              placeholder="z.B. 0.35"
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

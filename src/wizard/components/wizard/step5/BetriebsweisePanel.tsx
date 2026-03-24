/**
 * BetriebsweisePanel - E.2 VDE datasheet fields
 * Betriebsweise checkboxes + Netzeinspeisung phase selection + Einspeisemanagement.
 */

import React from 'react';
import { styles } from '../steps/shared';
import { Select, Checkbox } from '../../ui';
import type { WizardStep5Data } from '../../../types/wizard.types';

interface BetriebsweisePanelProps {
  step5: WizardStep5Data;
  onUpdate: (data: Partial<WizardStep5Data>) => void;
}

export const BetriebsweisePanel: React.FC<BetriebsweisePanelProps> = ({
  step5,
  onUpdate,
}) => {
  return (
    <div className={styles.formGrid2}>
      {/* Betriebsweise */}
      <div className={styles.fieldSection}>
        <div className={styles.fieldSectionTitle}>Betriebsweise</div>
        <div className={styles.checkboxGroup}>
          <Checkbox
            label="Überschusseinspeisung"
            description="Lieferung in das Netz des Netzbetreibers vorgesehen"
            checked={step5.betriebsweise?.ueberschusseinspeisung ?? true}
            onChange={v => onUpdate({
              betriebsweise: {
                ...step5.betriebsweise,
                ueberschusseinspeisung: v,
                volleinspeisung: v ? false : step5.betriebsweise?.volleinspeisung,
              },
            })}
          />
          <Checkbox
            label="Volleinspeisung"
            description="Einspeisung der gesamten Energie in das Netz"
            checked={step5.betriebsweise?.volleinspeisung ?? false}
            onChange={v => onUpdate({
              betriebsweise: {
                ...step5.betriebsweise,
                volleinspeisung: v,
                ueberschusseinspeisung: v ? false : step5.betriebsweise?.ueberschusseinspeisung,
              },
            })}
          />
          <Checkbox
            label="Inselbetrieb vorgesehen"
            description="Netzunabhängiger Betrieb möglich"
            checked={step5.betriebsweise?.inselbetrieb ?? false}
            onChange={v => onUpdate({
              betriebsweise: { ...step5.betriebsweise, inselbetrieb: v },
            })}
          />
          <Checkbox
            label="Motorischer Ablauf"
            description="Anlauf von Motoren vorgesehen"
            checked={step5.betriebsweise?.motorischerAblauf ?? false}
            onChange={v => onUpdate({
              betriebsweise: { ...step5.betriebsweise, motorischerAblauf: v },
            })}
          />
        </div>
      </div>

      {/* Netzeinspeisung Phasen */}
      <div className={styles.fieldSection}>
        <Select
          label="Netzeinspeisung"
          value={step5.netzeinspeisungPhasen || '3-phasig'}
          onChange={v => onUpdate({ netzeinspeisungPhasen: v as any })}
          options={[
            { value: '1-phasig', label: '1-phasig (bis 4,6 kVA)' },
            { value: '2-phasig', label: '2-phasig' },
            { value: '3-phasig', label: '3-phasig (Standard)' },
            { value: 'drehstrom', label: 'Drehstrom' },
          ]}
        />

        <div className={styles.fieldSectionSpacer} />
        <div className={styles.fieldSectionTitle}>Einspeisemanagement</div>
        <div className={styles.checkboxGroup}>
          <Checkbox
            label="Ferngesteuert"
            description="Fernsteuerung durch Netzbetreiber"
            checked={step5.einspeisemanagement?.ferngesteuert ?? false}
            onChange={v => onUpdate({
              einspeisemanagement: { ...step5.einspeisemanagement, ferngesteuert: v },
            })}
          />
          <Checkbox
            label="Dauerhaft begrenzt auf 70%"
            description="Wirkleistungsbegrenzung am NAP"
            checked={step5.einspeisemanagement?.dauerhaftBegrenzt ?? false}
            onChange={v => onUpdate({
              einspeisemanagement: {
                ...step5.einspeisemanagement,
                dauerhaftBegrenzt: v,
                begrenzungProzent: v ? 70 : undefined,
              },
            })}
          />
        </div>
      </div>
    </div>
  );
};

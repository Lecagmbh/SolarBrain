/**
 * VerbraucherRow - Ultra-compact row for Wallbox and Wärmepumpe
 * Inline inputs: Icon | Hersteller | Modell | Leistung | Badges | Delete
 */

import React from 'react';
import { styles } from '../steps/shared';

interface VerbraucherRowProps {
  icon: string;
  hersteller: string;
  modell: string;
  leistungKw: number;
  onHerstellerChange: (v: string) => void;
  onModellChange: (v: string) => void;
  onLeistungChange: (v: number) => void;
  badges?: React.ReactNode;
  /** Extra fields rendered below the main row when expanded */
  extraFields?: React.ReactNode;
  onDelete?: () => void;
  canDelete?: boolean;
  herstellerPlaceholder?: string;
  modellPlaceholder?: string;
}

export const VerbraucherRow: React.FC<VerbraucherRowProps> = ({
  icon,
  hersteller,
  modell,
  leistungKw,
  onHerstellerChange,
  onModellChange,
  onLeistungChange,
  badges,
  extraFields,
  onDelete,
  canDelete = true,
  herstellerPlaceholder = 'Hersteller',
  modellPlaceholder = 'Modell',
}) => {
  return (
    <div>
      <div className={styles.verbraucherRow}>
        <div className={styles.verbraucherRowIcon}>{icon}</div>
        <input
          className={styles.verbraucherRowInput}
          type="text"
          value={hersteller}
          onChange={(e) => onHerstellerChange(e.target.value)}
          placeholder={herstellerPlaceholder}
        />
        <input
          className={styles.verbraucherRowInput}
          type="text"
          value={modell}
          onChange={(e) => onModellChange(e.target.value)}
          placeholder={modellPlaceholder}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            className={styles.verbraucherRowInput}
            type="number"
            value={leistungKw || ''}
            onChange={(e) => onLeistungChange(Number(e.target.value) || 0)}
            placeholder="kW"
            style={{ width: '100%', textAlign: 'right' }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>kW</span>
        </div>
        <div className={styles.verbraucherRowBadges}>
          {badges}
        </div>
        {canDelete && onDelete ? (
          <button className={styles.verbraucherRowDelete} onClick={onDelete} title="Entfernen">×</button>
        ) : <div />}
      </div>
      {extraFields}
    </div>
  );
};

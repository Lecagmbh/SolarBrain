/**
 * SystemValidierung - Warning display component
 * Renders warnings from useSystemValidierung hook with proper icons and styling.
 */

import React from 'react';
import { styles } from '../steps/shared';
import type { Warnung } from './useSystemValidierung';

interface SystemValidierungProps {
  warnings: Warnung[];
}

const ICONS: Record<Warnung['typ'], string> = {
  error: '🚫',
  warning: '⚠️',
  info: 'ℹ️',
};

export const SystemValidierung: React.FC<SystemValidierungProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className={styles.validationList}>
      {warnings.map((w, idx) => (
        <div key={`${w.betrifft}-${idx}`} className={styles.validationItem} data-type={w.typ}>
          <span className={styles.validationItemIcon}>{ICONS[w.typ]}</span>
          <div className={styles.validationItemText}>
            <div className={styles.validationItemTitle}>{w.titel}</div>
            <div>{w.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

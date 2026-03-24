/**
 * MesskonzeptPanel - Compact Messkonzept selector
 * Shows the current Messkonzept as an inline badge with a change button,
 * expanding to a grid of options when toggled.
 */

import React, { useState } from 'react';
import { styles } from '../steps/shared';

interface MesskonzeptDefinition {
  typ: string;
  name: string;
  desc: string;
}

const MESSKONZEPTE: MesskonzeptDefinition[] = [
  { typ: 'MK0', name: 'Standardfall', desc: 'Nur Bezug, keine Erzeugung' },
  { typ: 'MK1', name: 'Volleinspeisung', desc: 'Kaskadenmessung - höhere EEG-Vergütung' },
  { typ: 'MK2', name: 'Überschusseinspeisung', desc: 'Standard-PV mit Eigenverbrauch (Zweirichtungszähler)' },
  { typ: 'MK3', name: 'Selbstverbrauchsmessung', desc: 'Erzeugung separat gemessen (EEG 2009-2012)' },
  { typ: 'MK4', name: 'KWK-Untermessung', desc: 'BHKW mit Selbstverbrauchsmessung' },
  { typ: 'MK5', name: 'Kaufm.-bilanzielle Weitergabe', desc: 'Ausnahmefall - nur RLM' },
  { typ: 'MK6', name: 'Mehrere Erzeugungsanlagen', desc: 'PV + BHKW oder mehrere PV-Anlagen' },
  { typ: 'MK8', name: 'PV + §14a SteuVE', desc: 'PV mit Wallbox/Wärmepumpe unter §14a' },
];

interface MesskonzeptPanelProps {
  messkonzept: string | null;
  autoMesskonzept: { typ?: string; name?: string; beschreibung?: string } | null;
  onUpdate: (messkonzept: string) => void;
}

export const MesskonzeptPanel: React.FC<MesskonzeptPanelProps> = ({
  messkonzept,
  autoMesskonzept,
  onUpdate,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const aktiveMK = messkonzept
    ? String(messkonzept).toUpperCase()
    : (autoMesskonzept?.typ || 'MK2');

  const currentDef = MESSKONZEPTE.find(
    m => String(m.typ).toLowerCase() === String(aktiveMK).toLowerCase()
  );

  const displayName = currentDef?.name || autoMesskonzept?.name || 'Überschusseinspeisung';
  const displayDesc = currentDef?.desc || autoMesskonzept?.beschreibung || 'Standard-PV mit Eigenverbrauch';

  return (
    <div className={styles.messkonzeptInline}>
      <span className={styles.messkonzeptBadge}>{aktiveMK}</span>
      <div>
        <div className={styles.messkonzeptName}>{displayName}</div>
        <div className={styles.messkonzeptDesc}>{displayDesc}</div>
      </div>
      <button
        type="button"
        className={styles.messkonzeptChangeBtn}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span>⚙️</span> Ändern
      </button>

      {showDropdown && (
        <div className={styles.messkonzeptGrid}>
          {MESSKONZEPTE.map(m => (
            <div
              key={m.typ}
              onClick={() => {
                onUpdate(String(m.typ).toLowerCase());
                setShowDropdown(false);
              }}
              className={`${styles.item} ${String(aktiveMK).toLowerCase() === String(m.typ).toLowerCase() ? styles.itemSelected : ''}`}
              style={{ padding: 10, textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={styles.messkonzeptBadge}>{m.typ}</span>
                <span style={{ fontWeight: 500 }}>{m.name}</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

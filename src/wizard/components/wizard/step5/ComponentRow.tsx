/**
 * ComponentRow - Compact inline row for PV/WR/Speicher components
 *
 * Always shows ProduktAutocomplete (with inline variant).
 * After product selection, the search field shows green checkmark + product name.
 * Spec badges, count, and expand button are shown alongside.
 *
 * - extraFields: Always-visible content below the row (e.g. kWh input for Speicher)
 * - detailContent: Expandable content (e.g. Dachflächen-Details)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { styles } from '../steps/shared';
import { ProduktAutocomplete } from '../shared/ProduktAutocomplete';
import type { ProduktTyp, ProduktDBItem } from '../shared/produktsuche/produktSuche.types';

interface ComponentRowProps {
  icon: string;
  typ: ProduktTyp;
  hersteller: string;
  modell: string;
  produktId?: number;
  zerezId?: string;
  onHerstellerChange: (v: string) => void;
  onModellChange: (v: string) => void;
  onProduktSelect: (produkt: ProduktDBItem | null, volleDaten: any) => void;
  onHybridDetected?: (data: any) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  count?: number;
  onCountChange?: (v: number) => void;
  countLabel?: string;
  /** Show warning state on count input (e.g. when count <= 1 and product is selected) */
  countWarning?: boolean;
  /** Expandable content (shown on ▾ click) */
  detailContent?: React.ReactNode;
  /** Always-visible content below the main row */
  extraFields?: React.ReactNode;
  extraBadges?: React.ReactNode;
  specOverrides?: Array<{ label: string; value: string; highlight?: boolean; status?: string }>;
}

export const ComponentRow: React.FC<ComponentRowProps> = ({
  icon,
  typ,
  hersteller,
  modell,
  produktId,
  zerezId,
  onHerstellerChange,
  onModellChange,
  onProduktSelect,
  onHybridDetected,
  onDelete,
  canDelete = true,
  count,
  onCountChange,
  countLabel = '×',
  countWarning,
  detailContent,
  extraFields,
  extraBadges,
  specOverrides,
}) => {
  const [expanded, setExpanded] = useState(false);
  const countRef = useRef<HTMLInputElement>(null);
  const prevWarning = useRef(false);

  // Auto-focus count input when warning activates (product was just selected)
  useEffect(() => {
    if (countWarning && !prevWarning.current && countRef.current) {
      countRef.current.focus();
      countRef.current.select();
    }
    prevWarning.current = !!countWarning;
  }, [countWarning]);

  const handleCountInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onCountChange?.(isNaN(val) ? 1 : Math.max(1, val));
  }, [onCountChange]);

  const hasSpecs = specOverrides && specOverrides.length > 0;

  return (
    <div>
      <div className={styles.componentRow} style={{ gridTemplateColumns: '32px 1fr auto auto 36px' }}>
        {/* Icon */}
        <div className={styles.componentRowIcon}>{icon}</div>

        {/* ProduktAutocomplete — always visible */}
        <div style={{ minWidth: 0 }}>
          <ProduktAutocomplete
            typ={typ}
            herstellerValue={hersteller}
            modellValue={modell}
            onHerstellerChange={onHerstellerChange}
            onModellChange={onModellChange}
            onProduktSelect={onProduktSelect}
            onHybridDetected={onHybridDetected}
            variant="inline"
          />
        </div>

        {/* Spec badges */}
        <div className={styles.componentRowSpecs}>
          {hasSpecs && specOverrides.map((spec) => (
            <span
              key={spec.label}
              className={styles.specBadge}
              data-highlight={spec.highlight ? 'true' : undefined}
              data-status={spec.status || undefined}
            >
              {spec.value}
            </span>
          ))}
          {extraBadges}
        </div>

        {/* Count + Expand */}
        <div className={styles.componentRowActions}>
          {onCountChange && (
            <div className={`${styles.componentRowCount} ${countWarning ? styles.componentRowCountWarning : ''}`}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 2 }}>{countLabel}</span>
              <input
                ref={countRef}
                type="number"
                min={1}
                value={count || ''}
                onChange={handleCountInput}
                placeholder="?"
              />
              {countWarning && (
                <div className={styles.countWarningHint}>Anzahl!</div>
              )}
            </div>
          )}
          {detailContent && (
            <button
              className={styles.componentRowExpand}
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Einklappen' : 'Details'}
            >
              {expanded ? '▴' : '▾'}
            </button>
          )}
        </div>

        {/* Delete */}
        {canDelete && onDelete ? (
          <button className={styles.componentRowDelete} onClick={onDelete} title="Entfernen">×</button>
        ) : <div />}
      </div>

      {/* Always-visible extra fields (e.g. kWh for Speicher) */}
      {extraFields}

      {/* Expandable detail */}
      {expanded && detailContent && (
        <div className={styles.componentRowDetail}>
          {detailContent}
        </div>
      )}
    </div>
  );
};

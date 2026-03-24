/**
 * Baunity Wizard - ProduktDropdownItem
 *
 * Ein einzelner Eintrag im Dropdown der Produktvorschlaege.
 */

import React from 'react';
import type { ProduktTyp, ProduktDBItem } from './produktSuche.types';
import { getDetailLabel } from './produktSuche.utils';

interface ProduktDropdownItemProps {
  typ: ProduktTyp;
  produkt: ProduktDBItem;
  index: number;
  isSelected: boolean;
  isLast: boolean;
  onSelect: (produkt: ProduktDBItem) => void;
  onHover: (index: number) => void;
}

export const ProduktDropdownItem: React.FC<ProduktDropdownItemProps> = ({
  typ,
  produkt,
  index,
  isSelected,
  isLast,
  onSelect,
  onHover,
}) => (
  <div
    onClick={() => onSelect(produkt)}
    onMouseEnter={() => onHover(index)}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', cursor: 'pointer',
      background: isSelected ? 'rgba(99,139,255,0.1)' : 'transparent',
      borderBottom: !isLast ? '1px solid rgba(255,255,255,0.04)' : 'none',
      transition: 'background 0.1s',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 500, color: 'white', fontSize: 13 }}>
          {produkt.hersteller?.name || '?'}
        </span>
        <span style={{ color: '#638bff', fontSize: 13 }}>{produkt.modell}</span>
        {produkt.zerezId && (
          <span style={{
            padding: '1px 5px', background: 'rgba(16,185,129,0.12)',
            borderRadius: 4, color: '#10b981', fontSize: 9, fontWeight: 600,
          }}>ZEREZ</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
        {getDetailLabel(typ, produkt)}
      </div>
    </div>
  </div>
);

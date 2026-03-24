/**
 * Baunity Wizard - TechDatenKarte
 *
 * Zeigt die technischen Daten eines ausgewaehlten Produkts als Karte an.
 * Inklusive Quell-Badge, ZEREZ-Status, Alternative-Reason und Spec-Tiles.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ProduktTyp, ProduktDBItem } from './produktSuche.types';
import { SOURCE_LABELS } from './produktSuche.types';
import { getSpecsForType } from './produktSuche.utils';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const SearchIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const DocIcon = () => (
  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// TECH DATEN KARTE
// ═══════════════════════════════════════════════════════════════════════════

interface TechDatenKarteProps {
  typ: ProduktTyp;
  produkt: ProduktDBItem;
  matchSource?: string;
  confidence?: number;
  alternativeReason?: string;
  onClear: () => void;
}

export const TechDatenKarte: React.FC<TechDatenKarteProps> = ({
  typ,
  produkt,
  matchSource,
  confidence,
  alternativeReason,
  onClear,
}) => {
  const specs = getSpecsForType(typ, produkt);
  const source = matchSource ? SOURCE_LABELS[matchSource] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        marginTop: 10,
        background: 'linear-gradient(135deg, rgba(99,139,255,0.06) 0%, rgba(16,185,129,0.04) 100%)',
        border: '1px solid rgba(99,139,255,0.15)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Product Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: specs.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#10b981', flexShrink: 0,
          }}>
            <CheckIcon />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
                {produkt.hersteller?.name || ''}
              </span>
              <span style={{ color: '#638bff', fontSize: 14, fontWeight: 500 }}>
                {produkt.modell}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {source && (
                <span style={{
                  padding: '1px 7px', background: source.bg, border: `1px solid ${source.border}`,
                  borderRadius: 5, color: source.color, fontSize: 10, fontWeight: 600,
                }}>
                  {source.label}{confidence ? ` ${confidence}%` : ''}
                </span>
              )}
              {produkt.zerezId && (
                <span style={{
                  padding: '1px 7px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 5, color: '#10b981', fontSize: 10, fontWeight: 600,
                }}>
                  ZEREZ ✓
                </span>
              )}
              {produkt.verified && !produkt.zerezId && (
                <span style={{
                  padding: '1px 7px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 5, color: '#60a5fa', fontSize: 10, fontWeight: 600,
                }}>
                  Verifiziert
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Neu suchen"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Alternative Reason Banner */}
      {alternativeReason && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(168,85,247,0.06) 100%)',
            borderBottom: '1px solid rgba(245,158,11,0.12)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}
        >
          <span style={{ color: '#f59e0b', fontSize: 14, flexShrink: 0, marginTop: 1 }}>!</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.4 }}>
            {alternativeReason}
          </span>
        </motion.div>
      )}

      {/* Spec Tiles */}
      {specs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 16px 12px' }}>
          {specs.map((spec, i) => (
            <motion.div
              key={spec.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: spec.highlight ? 'rgba(99,139,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${spec.highlight ? 'rgba(99,139,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 500 }}>{spec.label}</span>
              <span style={{ color: spec.highlight ? '#638bff' : 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>
                {typeof spec.value === 'boolean' ? 'Ja' : `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`}
              </span>
            </motion.div>
          ))}
          {produkt.datenblattUrl && (
            <a href={produkt.datenblattUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                background: 'rgba(99,139,255,0.08)', border: '1px solid rgba(99,139,255,0.15)',
                borderRadius: 8, color: '#638bff', fontSize: 11, fontWeight: 500, textDecoration: 'none',
              }}>
              <DocIcon /> Datenblatt
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
};

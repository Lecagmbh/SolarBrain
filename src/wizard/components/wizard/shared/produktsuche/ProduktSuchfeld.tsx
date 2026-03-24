/**
 * Baunity Wizard - ProduktSuchfeld
 *
 * Das Eingabefeld mit Such-Icon, Lade-Animation und Label-Badge.
 * Supports variant="inline" for compact 36px height.
 * In inline mode with onClear, shows a small × button to re-search.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ProduktTyp, ProduktDBItem } from './produktSuche.types';
import { PLACEHOLDER_MAP, TYP_LABELS } from './produktSuche.types';
import { SearchIcon, CheckIcon, CloseIcon } from './TechDatenKarte';

interface ProduktSuchfeldProps {
  typ: ProduktTyp;
  query: string;
  selectedProdukt: ProduktDBItem | null;
  localSearching: boolean;
  smartSearching: boolean;
  disabled: boolean;
  label?: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onInput: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  variant?: 'default' | 'inline';
  onClear?: () => void;
}

export const ProduktSuchfeld: React.FC<ProduktSuchfeldProps> = ({
  typ,
  query,
  selectedProdukt,
  localSearching,
  smartSearching,
  disabled,
  label,
  inputRef,
  onInput,
  onFocus,
  onKeyDown,
  variant = 'default',
  onClear,
}) => {
  const isSearching = localSearching || smartSearching;
  const showLabel = label || TYP_LABELS[typ];
  const isInline = variant === 'inline';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isInline ? 8 : 10,
      padding: isInline ? '0 10px' : '0 14px',
      background: selectedProdukt ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${selectedProdukt ? 'rgba(16,185,129,0.2)' : isSearching ? 'rgba(99,139,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: isInline ? 8 : 14,
      transition: 'all 0.25s',
    }}>
      {/* Left icon */}
      <div style={{
        color: selectedProdukt ? '#10b981' : isSearching ? '#638bff' : 'rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', flexShrink: 0,
        transition: 'color 0.2s',
      }}>
        {selectedProdukt ? <CheckIcon /> : <SearchIcon size={isInline ? 14 : 16} />}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => onInput(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER_MAP[typ]}
        disabled={disabled || smartSearching}
        style={{
          flex: 1,
          padding: isInline ? '8px 0' : '12px 0',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: isInline ? 13 : 14,
          outline: 'none',
        }}
      />

      {/* Right side */}
      {isSearching ? (
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              style={{ width: isInline ? 4 : 5, height: isInline ? 4 : 5, borderRadius: '50%', background: smartSearching ? '#a855f7' : '#638bff' }}
            />
          ))}
        </div>
      ) : selectedProdukt && onClear ? (
        /* Inline mode: show small × button to re-search */
        <button
          type="button"
          onClick={onClear}
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Neu suchen"
        >
          <CloseIcon />
        </button>
      ) : (
        <span style={{
          padding: isInline ? '2px 6px' : '3px 8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 6,
          color: 'rgba(255,255,255,0.3)',
          fontSize: isInline ? 9 : 10,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {showLabel}
        </span>
      )}
    </div>
  );
};

/**
 * Baunity Wizard - Produkt Autocomplete V5
 *
 * Ein einzelnes Eingabefeld -> System sucht automatisch -> Ergebnis als TechDatenKarte
 * Pipeline: Lokale DB (5.156 WR, 115 Speicher, PV aus Installationen) -> Smart-Match
 *
 * NEU: "Nicht gefunden? Manuell eingeben" -> Modal mit typ-spezifischen Feldern + Datenblatt-Upload
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProduktAutocompleteProps } from './produktSuche.types';
import { useProduktSuche } from './useProduktSuche';
import { parseQuery } from './produktSuche.utils';
import { ProduktSuchfeld } from './ProduktSuchfeld';
import { SearchStatus } from './SearchStatusIndicator';
import { TechDatenKarte } from './TechDatenKarte';
import { ProduktDropdownItem } from './ProduktDropdownItem';
import { ManualProductModal } from './ManualProductModal';

export const ProduktAutocomplete: React.FC<ProduktAutocompleteProps> = (props) => {
  const { typ, disabled = false, label, variant = 'default' } = props;
  const isInline = variant === 'inline';
  const [showManualModal, setShowManualModal] = useState(false);

  const {
    query,
    suggestions,
    isOpen,
    localSearching,
    selectedIndex,
    selectedProdukt,
    smartSearching,
    matchSource,
    alternativeReason,
    searchError,
    isSearching,
    containerRef,
    inputRef,
    localCountRef,
    handleInput,
    handleSelect,
    handleClear,
    handleKeyDown,
    handleFocus,
    setSelectedIndex,
  } = useProduktSuche(props);

  // Parse query for modal initial values
  const parsedQuery = parseQuery(query.trim());

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── CHAT INPUT ─────────────────────────────────────────────── */}
      <ProduktSuchfeld
        typ={typ}
        query={query}
        selectedProdukt={selectedProdukt}
        localSearching={localSearching}
        smartSearching={smartSearching}
        disabled={disabled}
        label={label}
        inputRef={inputRef}
        onInput={handleInput}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        variant={variant}
        onClear={isInline ? handleClear : undefined}
      />

      {/* ── SEARCH STATUS ──────────────────────────────────────────── */}
      <AnimatePresence>
        {smartSearching && <SearchStatus stage="smart" />}
      </AnimatePresence>

      {/* ── ERROR ──────────────────────────────────────────────────── */}
      {searchError && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            marginTop: 8, padding: '8px 14px',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 10, color: '#f59e0b', fontSize: 12,
          }}
        >
          {searchError}
        </motion.div>
      )}

      {/* ── TECH DATA CARD (after selection, default mode only) ────── */}
      {!isInline && (
        <AnimatePresence>
          {selectedProdukt && (
            <TechDatenKarte
              typ={typ}
              produkt={selectedProdukt}
              matchSource={matchSource?.source}
              confidence={matchSource?.confidence}
              alternativeReason={alternativeReason || undefined}
              onClear={handleClear}
            />
          )}
        </AnimatePresence>
      )}

      {/* ── DROPDOWN SUGGESTIONS ───────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && !selectedProdukt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              marginTop: 6, background: '#1a2332',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
              zIndex: 100, maxHeight: 300, overflowY: 'auto',
            }}
          >
            {suggestions.map((p, idx) => (
              <ProduktDropdownItem
                key={`${p.id}-${idx}`}
                typ={typ}
                produkt={p}
                index={idx}
                isSelected={idx === selectedIndex}
                isLast={idx === suggestions.length - 1}
                onSelect={handleSelect}
                onHover={setSelectedIndex}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "Enter to search" hint ─────────────────────────────────── */}
      {!selectedProdukt && !isOpen && !isSearching && query.trim().length >= 3 && localCountRef.current === 0 && !searchError && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            marginTop: 6, padding: '6px 14px',
            color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center',
          }}
        >
          Enter drücken für erweiterte Suche
        </motion.div>
      )}

      {/* ── "Manuell eingeben" Button ─────────────────────────────── */}
      {!selectedProdukt && !isSearching && query.trim().length >= 2 && (searchError || (!isOpen && localCountRef.current === 0)) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 8, textAlign: 'center' }}
        >
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            style={{
              padding: '8px 20px',
              background: 'rgba(99,139,255,0.1)',
              border: '1px solid rgba(99,139,255,0.3)',
              borderRadius: 10,
              color: '#638bff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,139,255,0.2)';
              e.currentTarget.style.borderColor = 'rgba(99,139,255,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99,139,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(99,139,255,0.3)';
            }}
          >
            Nicht gefunden? Daten manuell eingeben
          </button>
        </motion.div>
      )}

      {/* ── MANUAL PRODUCT MODAL ──────────────────────────────────── */}
      {showManualModal && (
        <ManualProductModal
          typ={typ}
          initialHersteller={parsedQuery.hersteller || query.trim()}
          initialModell={parsedQuery.modell || ''}
          onClose={() => setShowManualModal(false)}
          onSubmit={(data) => {
            setShowManualModal(false);
            // Update parent with manual data
            props.onHerstellerChange(data.hersteller);
            props.onModellChange(data.modell);
            props.onManualChange?.(data.hersteller, data.modell);
            props.onProduktSelect?.(null, data);
          }}
        />
      )}
    </div>
  );
};

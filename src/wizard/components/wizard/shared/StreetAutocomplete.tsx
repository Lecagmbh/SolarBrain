/**
 * Baunity Straßen-Autocomplete Komponente
 * =========================================
 * Professionelle Dropdown-Suche mit Straßenvorschlägen
 * Verwendet Photon API (OpenStreetMap)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchStreets, type AddressSuggestion } from '../../../lib/here';

interface StreetAutocompleteProps {
  value: string;
  onChange: (street: string) => void;
  onSelectSuggestion?: (suggestion: AddressSuggestion) => void;
  onBlur?: () => void;
  plz?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
}

export const StreetAutocomplete: React.FC<StreetAutocompleteProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  onBlur,
  plz,
  label = 'Straße',
  placeholder = 'Straße eingeben...',
  required = false,
  disabled = false,
  error,
  hint,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const result = await searchStreets(query, plz, 6);
      setSuggestions(result.suggestions);
      setIsOpen(result.suggestions.length > 0);
    } catch (e) {
      console.error('Search error:', e);
      setSuggestions([]);
    } finally {
      setLoading(false);
      setSelectedIndex(-1);
    }
  }, [plz]);

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      doSearch(newValue);
    }, 150);
  };

  // Select suggestion
  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.street);
    setIsOpen(false);
    setSuggestions([]);

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Styles im Stripe/Vercel Design
  const styles = {
    wrapper: {
      position: 'relative' as const,
      marginBottom: '16px',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      fontSize: '13px',
      fontWeight: 500,
      color: '#fafafa',
    },
    required: {
      color: '#ef4444',
    },
    loadingIndicator: {
      width: '14px',
      height: '14px',
      border: '2px solid rgba(59,130,246,0.2)',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    inputWrapper: {
      position: 'relative' as const,
    },
    input: {
      width: '100%',
      height: '40px',
      padding: '0 12px',
      paddingRight: loading ? '40px' : '12px',
      background: '#09090b',
      border: `1px solid ${error ? '#ef4444' : isOpen ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: '8px',
      color: '#fafafa',
      fontSize: '14px',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
      boxSizing: 'border-box' as const,
    },
    inputFocused: {
      boxShadow: error
        ? '0 0 0 3px rgba(239,68,68,0.15)'
        : '0 0 0 3px rgba(59,130,246,0.15)',
    },
    loadingIcon: {
      position: 'absolute' as const,
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    hint: {
      fontSize: '12px',
      color: '#71717a',
      marginTop: '6px',
    },
    error: {
      fontSize: '12px',
      color: '#ef4444',
      marginTop: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '4px',
      background: '#18181b',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '8px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      zIndex: 1000,
      maxHeight: '280px',
      overflowY: 'auto' as const,
    },
    suggestionItem: (isSelected: boolean) => ({
      padding: '12px 14px',
      cursor: 'pointer',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
      transition: 'background 100ms ease',
    }),
    suggestionStreet: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#fafafa',
      marginBottom: '2px',
    },
    suggestionLocation: {
      fontSize: '12px',
      color: '#71717a',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    suggestionIcon: {
      fontSize: '11px',
      opacity: 0.6,
    },
    attribution: {
      padding: '8px 14px',
      fontSize: '10px',
      color: '#52525b',
      textAlign: 'right' as const,
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.2)',
    },
    noResults: {
      padding: '16px',
      textAlign: 'center' as const,
      color: '#71717a',
      fontSize: '13px',
    },
  };

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      {/* Keyframes für Loading Spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Label */}
      {label && (
        <label style={styles.label}>
          <span>{label}</span>
          {required && <span style={styles.required}>*</span>}
          {loading && (
            <div style={styles.loadingIndicator} title="Suche..." />
          )}
        </label>
      )}

      {/* Input Wrapper */}
      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              onBlur?.();
            }, 150);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'street-error' : undefined}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          style={{
            ...styles.input,
            ...(isOpen ? styles.inputFocused : {}),
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        {/* Loading Icon im Input */}
        {loading && !label && (
          <div style={styles.loadingIcon}>
            <div style={styles.loadingIndicator} />
          </div>
        )}
      </div>

      {/* Hint */}
      {hint && !error && (
        <p style={styles.hint}>{hint}</p>
      )}

      {/* Error */}
      {error && (
        <p id="street-error" role="alert" style={styles.error}>
          <span>⚠️</span> {error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div style={styles.dropdown} role="listbox">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={styles.suggestionItem(index === selectedIndex)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div style={styles.suggestionStreet}>
                {suggestion.street}
                {suggestion.houseNumber && ` ${suggestion.houseNumber}`}
              </div>
              <div style={styles.suggestionLocation}>
                <span style={styles.suggestionIcon}>📍</span>
                {suggestion.postalCode && `${suggestion.postalCode} `}
                {suggestion.city}
                {suggestion.state && `, ${suggestion.state}`}
              </div>
            </div>
          ))}

          {/* Attribution */}
          <div style={styles.attribution}>
            Daten von OpenStreetMap
          </div>
        </div>
      )}

      {/* Keine Ergebnisse */}
      {isOpen && suggestions.length === 0 && value.length >= 2 && !loading && (
        <div style={styles.dropdown}>
          <div style={styles.noResults}>
            Keine Straßen gefunden
          </div>
        </div>
      )}
    </div>
  );
};

export default StreetAutocomplete;

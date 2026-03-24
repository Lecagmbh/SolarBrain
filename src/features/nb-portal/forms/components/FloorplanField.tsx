// src/features/nb-portal/forms/components/FloorplanField.tsx
/**
 * Floorplan/Address field with autocomplete and optional map
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { FieldWrapper } from './FieldWrapper';
import { getAddressSuggestions } from '../../nbPortalApi';
import type { BaseFieldProps, AddressData } from '../types/form.types';

interface FloorplanFieldProps extends BaseFieldProps {
  portalId: string;
}

export function FloorplanField({
  component,
  value,
  error,
  touched,
  onChange,
  onBlur,
  portalId
}: FloorplanFieldProps) {
  const addressValue = value as AddressData | null;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{
    street: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    displayText: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize query from existing value
  useEffect(() => {
    if (addressValue) {
      const displayText = [
        addressValue.street,
        addressValue.houseNumber,
        addressValue.postalCode,
        addressValue.city
      ].filter(Boolean).join(' ');
      setQuery(displayText);
    }
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await getAddressSuggestions(portalId, query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Address search failed:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, portalId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: typeof suggestions[0]) => {
    const newAddress: AddressData = {
      street: suggestion.street,
      houseNumber: suggestion.houseNumber || '',
      postalCode: suggestion.postalCode,
      city: suggestion.city
    };
    onChange(newAddress);
    setQuery(suggestion.displayText);
    setShowSuggestions(false);
    onBlur();
  };

  const handleClear = () => {
    setQuery('');
    onChange(null);
    setSuggestions([]);
  };

  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={error}
      touched={touched}
      helpText={component.helpText?.de}
    >
      <div ref={containerRef} className="nb-floorplan-container">
        {/* Search Input */}
        <div className="nb-floorplan-input-wrapper">
          <MapPin className="nb-floorplan-icon" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(onBlur, 200)}
            placeholder="Adresse eingeben..."
            className="nb-floorplan-input"
          />
          {isLoading && (
            <Loader2 className="nb-floorplan-loader" size={18} />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="nb-floorplan-clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="nb-floorplan-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="nb-floorplan-suggestion"
                onClick={() => handleSelect(suggestion)}
              >
                <MapPin size={14} />
                <span>{suggestion.displayText}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Address Display */}
        {addressValue && (
          <div className="nb-floorplan-selected">
            <div className="nb-floorplan-selected-icon">
              <MapPin size={16} />
            </div>
            <div className="nb-floorplan-selected-content">
              <span className="nb-floorplan-selected-street">
                {addressValue.street} {addressValue.houseNumber}
              </span>
              <span className="nb-floorplan-selected-city">
                {addressValue.postalCode} {addressValue.city}
              </span>
            </div>
          </div>
        )}
      </div>
      <style>{floorplanStyles}</style>
    </FieldWrapper>
  );
}

const floorplanStyles = `
  .nb-floorplan-container {
    position: relative;
  }

  .nb-floorplan-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .nb-floorplan-icon {
    position: absolute;
    left: 14px;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .nb-floorplan-input {
    width: 100%;
    padding: 12px 40px 12px 44px;
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.95);
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }

  .nb-floorplan-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .nb-floorplan-input:focus {
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }

  .nb-floorplan-loader {
    position: absolute;
    right: 14px;
    color: #a855f7;
    animation: nb-spin 1s linear infinite;
  }

  @keyframes nb-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .nb-floorplan-clear {
    position: absolute;
    right: 10px;
    padding: 4px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nb-floorplan-clear:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  .nb-floorplan-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: #1f2937;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .nb-floorplan-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .nb-floorplan-suggestion:hover {
    background: rgba(168, 85, 247, 0.1);
  }

  .nb-floorplan-suggestion svg {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.4);
  }

  .nb-floorplan-suggestion:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .nb-floorplan-selected {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 12px;
    padding: 12px 14px;
    background: rgba(168, 85, 247, 0.1);
    border: 1px solid rgba(168, 85, 247, 0.2);
    border-radius: 10px;
  }

  .nb-floorplan-selected-icon {
    flex-shrink: 0;
    color: #a855f7;
    margin-top: 2px;
  }

  .nb-floorplan-selected-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nb-floorplan-selected-street {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
  }

  .nb-floorplan-selected-city {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
`;

export default FloorplanField;

/**
 * AI Search Bar
 *
 * Semantische Suche mit natürlicher Sprache.
 * Versteht Anfragen wie "Alle Rückfragen älter als 5 Tage".
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Sparkles,
  X,
  Loader2,
  ChevronRight,
  Clock,
  MapPin,
  Zap as ZapIcon,
} from 'lucide-react';
import { semanticSearch, getSearchSuggestions, type SearchResult } from '../../../../api/aiAssistant';
import { useDebounce } from '../../../../hooks/useDebounce';

interface AISearchBarProps {
  onSelectResult?: (installation: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function AISearchBar({
  onSelectResult,
  placeholder = 'Suche mit KI... z.B. "Rückfragen älter als 5 Tage"',
  className = '',
}: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 500);

  // Load suggestions on mount
  useEffect(() => {
    getSearchSuggestions().then((data: { suggestions: string[] }) => {
      setSuggestions(data.suggestions || []);
    }).catch(() => {});
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const data = await semanticSearch(debouncedQuery, 10);
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const items = results.length > 0 ? results : suggestions;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (results.length > 0) {
            onSelectResult?.(results[selectedIndex]);
            setShowDropdown(false);
          } else if (suggestions.length > 0) {
            setQuery(suggestions[selectedIndex]);
            setSelectedIndex(-1);
          }
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, results, suggestions, selectedIndex, onSelectResult]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EINGANG': return 'bg-blue-100 text-blue-700';
      case 'BEIM_NB': return 'bg-yellow-100 text-yellow-700';
      case 'RUECKFRAGE': return 'bg-red-100 text-red-700';
      case 'GENEHMIGT': return 'bg-green-100 text-green-700';
      case 'IBN': return 'bg-purple-100 text-purple-700';
      case 'FERTIG': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (query || !results.length) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Results */}
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                {results.length} Ergebnisse
                {results[0]?.matchReason && (
                  <span className="ml-2 text-amber-500">• {results[0].matchReason}</span>
                )}
              </div>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onSelectResult?.(result);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    idx === selectedIndex ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{result.publicId}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 truncate">{result.customerName}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{result.plz} {result.ort}</span>
                      {result.totalKwp && (
                        <>
                          <ZapIcon className="w-3 h-3 ml-2" />
                          <span>{Number(result.totalKwp).toFixed(2)} kWp</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              {loading ? 'Suche...' : 'Keine Ergebnisse gefunden'}
            </div>
          ) : (
            /* Suggestions */
            <div className="max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Vorschläge
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    setSelectedIndex(-1);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    idx === selectedIndex ? 'bg-amber-50' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AISearchBar;

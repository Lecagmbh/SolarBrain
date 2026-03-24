/**
 * Baunity Wizard - Kompatible Speicher Vorschläge
 * =============================================
 * 
 * Zeigt kompatible Speicher-Vorschläge wenn ein Wechselrichter ausgewählt wird.
 * Integration in Step 5 (Technik) des Wizards.
 * 
 * Features:
 * - Automatische Abfrage wenn WR ausgewählt
 * - Visuelle Darstellung mit Konfidenz-Score
 * - Ein-Klick Übernahme in Speicher-Eingabe
 * - Smooth Animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../lib/api/client';

// Helper um sicherzustellen dass nur Strings gerendert werden (kein Object-Error)
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Falls es ein Object mit name ist, nehme name
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface KompatiblerSpeicher {
  id: number;
  hersteller: string;
  modell: string;
  kapazitaetKwh: number;
  kopplung: string | null;
  konfidenz: number;
  originalKombination?: string;
  maxAnzahl?: number;
}

interface KompatibilitaetsResponse {
  wechselrichter: {
    id: number;
    hersteller: string;
    modell: string;
    leistungKw: number;
    hybrid: boolean;
  };
  kompatibleSpeicher: KompatiblerSpeicher[];
  anzahl: number;
}

interface KompatibleSpeicherVorschlaegeProps {
  wechselrichterId: number | null;
  wechselrichterName?: string;
  onSpeicherSelect: (speicher: {
    id: number;
    hersteller: string;
    modell: string;
    kapazitaetKwh: number;
    kopplung: 'ac' | 'dc';
  }) => void;
  selectedSpeicherId?: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const BatteryIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17 8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2M7 8h10l1 12H6L7 8zM12 12v4M21 10v4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// KONFIDENZ BADGE
// ═══════════════════════════════════════════════════════════════════════════════

const KonfidenzBadge: React.FC<{ konfidenz: number }> = ({ konfidenz }) => {
  let color: string;
  let bgColor: string;
  let label: string;

  if (konfidenz >= 85) {
    color = '#10b981';
    bgColor = 'rgba(16, 185, 129, 0.15)';
    label = 'Perfekt';
  } else if (konfidenz >= 70) {
    color = '#3b82f6';
    bgColor = 'rgba(59, 130, 246, 0.15)';
    label = 'Sehr gut';
  } else if (konfidenz >= 55) {
    color = '#f59e0b';
    bgColor = 'rgba(245, 158, 11, 0.15)';
    label = 'Gut';
  } else {
    color = '#6b7280';
    bgColor = 'rgba(107, 114, 128, 0.15)';
    label = 'Möglich';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 6,
      background: bgColor,
      color,
      fontSize: 11,
      fontWeight: 500,
    }}>
      <LinkIcon />
      {label} ({konfidenz}%)
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const KompatibleSpeicherVorschlaege: React.FC<KompatibleSpeicherVorschlaegeProps> = ({
  wechselrichterId,
  wechselrichterName,
  onSpeicherSelect,
  selectedSpeicherId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KompatibilitaetsResponse | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Lade kompatible Speicher wenn WR-ID sich ändert
  useEffect(() => {
    if (!wechselrichterId) {
      setData(null);
      return;
    }

    const fetchKompatible = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<KompatibilitaetsResponse>(
          `/produkte/wechselrichter/${wechselrichterId}/kompatible-speicher`
        );
        // KRITISCH: Prüfe Status UND Datenstruktur
        if (response.status >= 200 && response.status < 300 &&
            response.data &&
            Array.isArray(response.data.kompatibleSpeicher)) {
          setData(response.data);
        } else {
          // 404, 500, oder ungültige Struktur -> kein Crash, einfach null
          console.warn('[KompatibleSpeicher] API Status:', response.status);
          setData(null);
        }
      } catch (e: any) {
        console.error('Kompatibilitäts-Abfrage fehlgeschlagen:', e);
        setError('Konnte kompatible Speicher nicht laden');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchKompatible();
  }, [wechselrichterId]);

  // Nichts anzeigen wenn kein WR ausgewählt
  if (!wechselrichterId) return null;

  // Loading State
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <SparklesIcon />
          </motion.div>
          <span>Suche kompatible Speicher für {wechselrichterName || 'Wechselrichter'}...</span>
        </div>
      </motion.div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        color: '#f87171',
        fontSize: 13,
      }}>
        {safeString(error)}
      </div>
    );
  }

  // Keine Daten oder keine Vorschläge
  if (!data || !data.kompatibleSpeicher || data.kompatibleSpeicher.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
        borderRadius: 16,
        marginTop: 20,
        border: '1px solid rgba(16, 185, 129, 0.25)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          cursor: 'pointer',
          background: 'rgba(16, 185, 129, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <SparklesIcon />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>
              Passende Speicher gefunden
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {data?.kompatibleSpeicher?.length || 0} kompatible Speicher für {safeString(data?.wechselrichter?.hersteller)} {safeString(data?.wechselrichter?.modell)}
            </div>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      {/* Speicher Liste */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ padding: '12px 16px', maxHeight: 320, overflowY: 'auto' }}>
              {(data.kompatibleSpeicher || []).map((speicher, idx) => {
                const isSelected = selectedSpeicherId === speicher.id;
                
                return (
                  <motion.div
                    key={speicher.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSpeicherSelect({
                      id: speicher.id,
                      hersteller: speicher.hersteller,
                      modell: speicher.modell,
                      kapazitaetKwh: speicher.kapazitaetKwh,
                      // 🔥 Sichere Kopplung-Erkennung - niemals undefined/null
                      kopplung: (speicher.kopplung?.toLowerCase()?.includes('ac') ? 'ac' : 'dc') as 'ac' | 'dc',
                    })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 14px',
                      marginBottom: 8,
                      borderRadius: 12,
                      background: isSelected 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(255,255,255,0.03)',
                      border: isSelected 
                        ? '2px solid #10b981' 
                        : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    whileHover={{
                      background: isSelected 
                        ? 'rgba(16, 185, 129, 0.25)' 
                        : 'rgba(255,255,255,0.06)',
                      scale: 1.01,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: isSelected 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? 'white' : 'rgba(255,255,255,0.5)',
                      flexShrink: 0,
                    }}>
                      {isSelected ? <CheckCircleIcon /> : <BatteryIcon />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontWeight: 600,
                          color: 'white',
                          fontSize: 14,
                        }}>
                          {safeString(speicher.hersteller)}
                        </span>
                        <span style={{
                          color: '#10b981',
                          fontWeight: 500,
                        }}>
                          {safeString(speicher.modell)}
                        </span>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        marginTop: 4,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{ 
                          color: 'rgba(255,255,255,0.6)', 
                          fontSize: 12,
                        }}>
                          {speicher.kapazitaetKwh} kWh
                        </span>
                        
                        {speicher.kopplung && (
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: 4,
                            background: speicher.kopplung.includes('AC') 
                              ? 'rgba(59, 130, 246, 0.2)' 
                              : 'rgba(168, 85, 247, 0.2)',
                            color: speicher.kopplung.includes('AC') ? '#60a5fa' : '#f0d878',
                            fontSize: 10,
                            fontWeight: 500,
                          }}>
                            {speicher.kopplung}
                          </span>
                        )}
                        
                        <KonfidenzBadge konfidenz={speicher.konfidenz} />
                      </div>
                    </div>

                    {/* Select Button */}
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: isSelected 
                        ? '#10b981' 
                        : 'rgba(16, 185, 129, 0.15)',
                      color: isSelected ? 'white' : '#10b981',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {isSelected ? '✓ Ausgewählt' : 'Auswählen'}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer Hint */}
            <div style={{
              padding: '10px 16px',
              background: 'rgba(0,0,0,0.2)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
            }}>
              💡 Vorschläge basieren auf PV*SOL Kompatibilitätsdaten
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: Für einfache Integration
// ═══════════════════════════════════════════════════════════════════════════════

export function useKompatibleSpeicher(wechselrichterId: number | null) {
  const [loading, setLoading] = useState(false);
  const [speicher, setSpeicher] = useState<KompatiblerSpeicher[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wechselrichterId) {
      setSpeicher([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<KompatibilitaetsResponse>(
          `/produkte/wechselrichter/${wechselrichterId}/kompatible-speicher`
        );
        // KRITISCH: Prüfe Status UND Datenstruktur
        if (response.status >= 200 && response.status < 300 && response.data) {
          setSpeicher(response.data.kompatibleSpeicher || []);
        } else {
          // 404, 500 -> leeres Array, kein Crash
          setSpeicher([]);
        }
        setError(null);
      } catch (e) {
        setError('Fehler beim Laden');
        setSpeicher([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wechselrichterId]);

  return { loading, speicher, error };
}

export default KompatibleSpeicherVorschlaege;

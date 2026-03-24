/**
 * Baunity Wizard Steps V13
 * Refactored: Shared modules extracted
 */

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useWizardStore } from '../../../stores/wizardStore';
import { Input, Select, Checkbox, Alert } from '../../ui';
import { getBundeslandFromPLZ } from '../../../lib/utils';
import { detectSzenario, getTechnikFelder } from '../../../lib/intelligence/detector';
import { ermittleMesskonzept } from '../../../lib/intelligence/messkonzept';
import { COMPANY } from '../../../types/wizard.types';
import { StreetAutocomplete } from '../shared/StreetAutocomplete';
import { lookupPLZ } from '../../../lib/plz';
import { useDocuments } from '../../../hooks/useDocuments';

// KRITISCH: Helper um Object-Rendering-Fehler zu vermeiden (React Error #525)
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    if ('label' in (value as object)) return String((value as { label: unknown }).label);
    return '';
  }
  return String(value);
};

// Shared modules (Phase 3 refactoring)
import {
  injectStyles,
  styles,
  useFieldErrors,
  KATEGORIEN,
  KOMPONENTEN,
  KUNDENTYPEN,
  BUNDESLAENDER as BL,
  AUSRICHTUNGEN,
  DEMONTAGE_TYPEN,
  DEMONTAGE_GRUENDE,
  ZAEHLER_PROZESS_TYPEN,
  FOTO_KATEGORIEN,
} from './shared';

import type {
  AnlagenKategorie,
  AnlagenKomponente,
  WizardStep1Data,
  Ausrichtung,
  Netzbetreiber,
  ZaehlerTyp,
  ZaehlerStandort,
  ZaehlerEigentum,
  TarifArt,
  Erdungsart,
  AbsicherungA,
  FotoKategorie,
  FotoUpload,
  // Multi-Zähler Types
  ZaehlerBestandItem,
  ZaehlerAktion,
  ZaehlerBefestigung,
} from '../../../types/wizard.types';

import {
  createDefaultZaehler,
  createDefaultNetzanschluss,
  createDefaultInbetriebnahme,
  createDefaultPruefprotokoll,
  createDefaultDemontage,
  createDefaultZaehlerProzess,
  createDefaultFertigmeldung,
  // Multi-Zähler Defaults
  createDefaultZaehlerBestandItem,
  createDefaultZaehlerNeu,
} from '../../../types/wizard.types';

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: KATEGORIE
// ═══════════════════════════════════════════════════════════════════════════

export const Step1Kategorie: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);
  const { data, updateStep1 } = useWizardStore();
  const { step1 } = data;
  const { getError } = useFieldErrors(1);

  const zeigeKomponenten = ['einspeiser', 'erweiterung', 'paragraph14a'].includes(step1.kategorie || '');
  const zeigeDemontageOptionen = step1.kategorie === 'demontage';
  const zeigeZaehlerOptionen = step1.kategorie === 'zaehler';
  const zeigeFertigmeldungInfo = step1.kategorie === 'fertigmeldung';

  // Fehler-Hilfskomponente
  const ErrorHint: React.FC<{ field: string }> = ({ field }) => {
    const error = getError(field);
    if (!error) return null;
    return (
      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(198,155,109,0.4)', fontSize: 12, color: '#fca5a5' }}>
        {safeString(error)}
      </div>
    );
  };

  const verfuegbareKomponenten = KOMPONENTEN.filter(k => {
    if (step1.kategorie === 'paragraph14a') return ['wallbox', 'waermepumpe'].includes(k.value);
    return true;
  });

  // Handler für Kategorie-Auswahl mit prozessspezifischer Initialisierung
  const handleKategorieSelect = (value: AnlagenKategorie) => {
    const baseUpdate: Partial<WizardStep1Data> = {
      kategorie: value,
      vorgangsart: value === 'erweiterung' ? 'erweiterung' : 'neuanmeldung',
      komponenten: value === 'speicher' ? ['speicher'] : value === 'einspeiser' ? ['pv'] : [],
    };

    // Prozessspezifische Defaults
    if (value === 'demontage') {
      baseUpdate.vorgangsart = 'demontage';
      baseUpdate.demontage = createDefaultDemontage();
    } else if (value === 'zaehler') {
      baseUpdate.vorgangsart = 'zaehler_anmeldung';
      baseUpdate.zaehlerProzess = createDefaultZaehlerProzess();
    } else if (value === 'fertigmeldung') {
      baseUpdate.vorgangsart = 'fertigmeldung';
      baseUpdate.fertigmeldung = createDefaultFertigmeldung();
    }

    updateStep1(baseUpdate);
  };

  return (
    <div className={styles.step}>
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TITEL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.title}>
        <div className={styles.titleIcon}>📋</div>
        <div>
          <h3>Was möchten Sie anmelden?</h3>
          <p>Kategorie wählen</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* KATEGORIEN GRID */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.grid}>
        {KATEGORIEN.map(k => (
          <div
            key={k.value}
            className={`${styles.item} ${step1.kategorie === k.value ? styles.itemSelected : ''}`}
            onClick={() => handleKategorieSelect(k.value)}
          >
            <div className={styles.itemIcon}>{k.icon}</div>
            <div className={styles.itemLabel}>{k.label}</div>
            <div className={styles.itemDesc}>{k.desc}</div>
          </div>
        ))}
      </div>

      {/* Komponenten für Erzeugungsanlagen */}
      {zeigeKomponenten && (
        <>
          <div className={styles.divider} />
          <div className={styles.title}>
            <div className={styles.titleIcon}>🔧</div>
            <div>
              <h3>Komponenten</h3>
              <p>Mehrfachauswahl möglich</p>
            </div>
          </div>
          <div className={styles.grid}>
            {verfuegbareKomponenten.map(k => {
              const sel = step1.komponenten.includes(k.value);
              return (
                <div
                  key={k.value}
                  className={`${styles.item} ${sel ? styles.itemSelected : ''}`}
                  onClick={() => updateStep1({
                    komponenten: sel
                      ? step1.komponenten.filter(x => x !== k.value)
                      : [...step1.komponenten, k.value]
                  })}
                >
                  <div className={styles.itemIcon}>{k.icon}</div>
                  <div className={styles.itemLabel}>{k.label}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DEMONTAGE-OPTIONEN (Phase 2) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {zeigeDemontageOptionen && (
          <>
            <div className={styles.divider} />
            <div className={styles.title}>
              <div className={styles.titleIcon}>🔧</div>
              <div>
                <h3>Was soll demontiert werden?</h3>
                <p>Art der Demontage wählen</p>
              </div>
            </div>
            <div className={styles.grid}>
              {DEMONTAGE_TYPEN.map(d => {
                const sel = step1.demontage?.typ === d.value;
                return (
                  <div
                    key={d.value}
                    className={`${styles.item} ${sel ? styles.itemSelected : ''}`}
                    onClick={() => {
                      const current = step1.demontage || createDefaultDemontage();
                      updateStep1({ demontage: { ...current, typ: d.value } });
                    }}
                  >
                    <div className={styles.itemIcon}>{d.icon}</div>
                    <div className={styles.itemLabel}>{d.label}</div>
                  </div>
                );
              })}
            </div>
            <ErrorHint field="demontage_typ" />

            {step1.demontage?.typ && (
              <>
                <div className={styles.divider} />
                <div className={styles.title}>
                  <div className={styles.titleIcon}>❓</div>
                  <div>
                    <h3>Grund der Demontage</h3>
                    <p>Warum wird demontiert?</p>
                  </div>
                </div>
                <div className={styles.grid}>
                  {DEMONTAGE_GRUENDE.map(g => {
                    const sel = step1.demontage?.grund === g.value;
                    return (
                      <div
                        key={g.value}
                        className={`${styles.item} ${sel ? styles.itemSelected : ''}`}
                        onClick={() => {
                          const current = step1.demontage || createDefaultDemontage();
                          updateStep1({ demontage: { ...current, grund: g.value } });
                        }}
                      >
                        <div className={styles.itemLabel}>{g.label}</div>
                      </div>
                    );
                  })}
                </div>
                <ErrorHint field="demontage_grund" />
              </>
            )}

            {/* Hinweis */}
            <div className={styles.infoBox} style={{ marginTop: 24 }}>
              <div className={styles.infoBoxTitle}>Wichtig bei Demontage</div>
              <ul className={styles.infoBoxList}>
                <li>Der Netzbetreiber muss informiert werden</li>
                <li>Bei EEG-Anlagen: MaStR-Abmeldung erforderlich</li>
                <li>Zählerstand vor Demontage ablesen</li>
              </ul>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ZÄHLER-PROZESS OPTIONEN (Phase 2) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {zeigeZaehlerOptionen && (
          <>
            <div className={styles.divider} />
            <div className={styles.title}>
              <div className={styles.titleIcon}>🔢</div>
              <div>
                <h3>Welchen Zähler-Vorgang?</h3>
                <p>Art des Prozesses wählen</p>
              </div>
            </div>
            <div className={styles.grid}>
              {ZAEHLER_PROZESS_TYPEN.map(z => {
                const sel = step1.zaehlerProzess?.prozessTyp === z.value;
                return (
                  <div
                    key={z.value}
                    className={`${styles.item} ${sel ? styles.itemSelected : ''}`}
                    onClick={() => {
                      const current = step1.zaehlerProzess || createDefaultZaehlerProzess();
                      updateStep1({
                        zaehlerProzess: { ...current, prozessTyp: z.value },
                        vorgangsart: z.value === 'abmeldung' ? 'zaehler_abmeldung' :
                                     z.value === 'neuanmeldung' ? 'zaehler_anmeldung' : 'zaehler_wechsel',
                      });
                    }}
                  >
                    <div className={styles.itemIcon}>{z.icon}</div>
                    <div className={styles.itemLabel}>{z.label}</div>
                    <div className={styles.itemDesc}>{z.desc}</div>
                  </div>
                );
              })}
            </div>
            <ErrorHint field="zaehler_prozess" />

            {/* Info basierend auf Prozesstyp */}
            {step1.zaehlerProzess?.prozessTyp && (
              <div className={styles.infoBox} style={{ marginTop: 24 }}>
                <div className={styles.infoBoxTitle}>
                  {step1.zaehlerProzess.prozessTyp === 'neuanmeldung' && 'Zähler-Anmeldung'}
                  {step1.zaehlerProzess.prozessTyp === 'wechsel_typ' && 'Zählerwechsel'}
                  {step1.zaehlerProzess.prozessTyp === 'smart_meter' && 'Smart Meter Rollout'}
                  {step1.zaehlerProzess.prozessTyp === 'abmeldung' && 'Zähler-Abmeldung'}
                  {step1.zaehlerProzess.prozessTyp === 'wechsel_msb' && 'MSB-Wechsel'}
                  {step1.zaehlerProzess.prozessTyp === 'wechsel_standort' && 'Zähler versetzen'}
                </div>
                <ul className={styles.infoBoxList}>
                  {step1.zaehlerProzess.prozessTyp === 'neuanmeldung' && (
                    <>
                      <li>Für PV-Anlagen wird ein Zweirichtungszähler benötigt</li>
                      <li>Der Netzbetreiber setzt den Zähler nach Freigabe</li>
                    </>
                  )}
                  {step1.zaehlerProzess.prozessTyp === 'wechsel_typ' && (
                    <>
                      <li>Bei PV-Anlagen: Wechsel auf Zweirichtungszähler</li>
                      <li>Zählerstand vor Wechsel dokumentieren</li>
                    </>
                  )}
                  {step1.zaehlerProzess.prozessTyp === 'smart_meter' && (
                    <>
                      <li>Pflicht ab 6 kW für steuerbare Verbraucher (§14a)</li>
                      <li>Ermöglicht Fernauslesung und dynamische Tarife</li>
                    </>
                  )}
                  {step1.zaehlerProzess.prozessTyp === 'abmeldung' && (
                    <>
                      <li>Zählerstand vor Abbau dokumentieren</li>
                      <li>Netzbetreiber terminiert Abholung</li>
                    </>
                  )}
                  {step1.zaehlerProzess.prozessTyp === 'wechsel_msb' && (
                    <>
                      <li>Sie können einen wettbewerblichen MSB wählen</li>
                      <li>Der alte Zähler wird durch den neuen MSB ersetzt</li>
                    </>
                  )}
                  {step1.zaehlerProzess.prozessTyp === 'wechsel_standort' && (
                    <>
                      <li>Erfordert Genehmigung durch den Netzbetreiber</li>
                      <li>Kosten trägt in der Regel der Anschlussnehmer</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FERTIGMELDUNG INFO (Phase 2) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {zeigeFertigmeldungInfo && (
          <>
            <div className={styles.divider} />
            <div className={styles.stepOverline}>FERTIGMELDUNG</div>
            <h3 className={styles.sectionTitle}>Fertigmeldung nach Installation</h3>
            <p className={styles.stepSubtitle} style={{ marginBottom: 24 }}>
              Die Fertigmeldung ist der letzte Schritt nach Abschluss der Installation.
              Sie informiert den Netzbetreiber, dass die Anlage betriebsbereit ist.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className={styles.infoBox}>
                <div className={styles.infoBoxTitle}>Erforderlich</div>
                <ul className={styles.infoBoxList}>
                  <li>Prüfprotokoll</li>
                  <li>Inbetriebnahmeprotokoll</li>
                  <li>Zählerstand</li>
                  <li>Fotos der Installation</li>
                </ul>
              </div>
              <div className={styles.infoBox}>
                <div className={styles.infoBoxTitle}>Prozess</div>
                <ul className={styles.infoBoxList}>
                  <li>Meldung an Netzbetreiber</li>
                  <li>MaStR-Eintragung</li>
                  <li>Zähler wird freigeschaltet</li>
                  <li>EEG-Vergütung startet</li>
                </ul>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ORT-INPUT MIT VORSCHLÄGEN (editierbares Input + Dropdown)
// ═══════════════════════════════════════════════════════════════════════════

interface OrtInputProps {
  value: string;
  onChange: (ort: string) => void;
  onBlur?: () => void;
  suggestions: { ort: string; bundesland: string }[];
  loading?: boolean;
  error?: string;
}

const OrtInputWithSuggestions: React.FC<OrtInputProps> = ({
  value,
  onChange,
  onBlur,
  suggestions,
  loading,
  error,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside schließt Dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Gefilterte Vorschläge basierend auf aktuellem Input
  const filtered = suggestions.filter(s =>
    !value || s.ort.toLowerCase().includes(value.toLowerCase())
  );

  const label = loading ? 'Ort ⏳' : suggestions.length > 1 ? `Ort (${suggestions.length} Vorschläge)` : 'Ort';

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <Input
        label={label}
        value={value}
        onChange={v => {
          onChange(v);
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setInputFocused(false);
            setShowSuggestions(false);
            onBlur?.();
          }, 150);
        }}
        onFocus={() => {
          setInputFocused(true);
          if (suggestions.length > 1) setShowSuggestions(true);
        }}
        placeholder="Ort eingeben oder auswählen"
        required
        error={error}
      />

      {/* Vorschläge-Dropdown */}
      {showSuggestions && filtered.length > 0 && inputFocused && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '-12px',
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {filtered.map((s, i) => (
            <div
              key={`${s.ort}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.ort);
                setShowSuggestions(false);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                fontSize: '14px',
                color: s.ort === value ? '#3b82f6' : '#fafafa',
                background: s.ort === value ? 'rgba(59,130,246,0.08)' : 'transparent',
                transition: 'background 100ms ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = s.ort === value ? 'rgba(59,130,246,0.08)' : 'transparent')}
            >
              <span>{s.ort}</span>
              {s.bundesland && (
                <span style={{ fontSize: '11px', color: '#71717a' }}>{s.bundesland}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: STANDORT
// ═══════════════════════════════════════════════════════════════════════════

export const Step2Standort: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);
  const { data, updateStep2 } = useWizardStore();
  const { step2 } = data;
  const [plzLoading, setPlzLoading] = useState(false);
  const [lastLookedUpPLZ, setLastLookedUpPLZ] = useState('');
  const [verfuegbareOrte, setVerfuegbareOrte] = useState<{ ort: string; bundesland: string }[]>([]);

  // Validation - zeigt Fehler nach Interaktion
  const { getError } = useFieldErrors(2);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // PLZ → Ort & Bundesland automatisch ausfüllen
  useEffect(() => {
    const plz = step2.plz?.trim() || '';

    // Nur bei 5-stelliger PLZ und wenn sich die PLZ geändert hat
    if (plz.length === 5 && plz !== lastLookedUpPLZ) {
      setPlzLoading(true);
      setLastLookedUpPLZ(plz);
      setVerfuegbareOrte([]); // Reset

      lookupPLZ(plz).then(result => {
        if (result && result.ort) {
          // Prüfe ob mehrere Orte existieren
          if (result.hatMehrereOrte && result.orte.length > 1) {
            // Mehrere Orte: Speichere alle zur Auswahl
            setVerfuegbareOrte(result.orte.map(o => ({ ort: o.ort, bundesland: o.bundesland })));
            // Setze erstmal den ersten Ort
            updateStep2({
              ort: result.orte[0].ort,
              bundesland: result.orte[0].bundesland || getBundeslandFromPLZ(plz) || step2.bundesland
            });
            // Multiple locations found for PLZ
          } else {
            // Nur ein Ort
            setVerfuegbareOrte([]);
            updateStep2({
              ort: result.ort,
              bundesland: result.bundesland || getBundeslandFromPLZ(plz) || step2.bundesland
            });
            // PLZ autofill applied
          }
        } else {
          // Fallback: Nur Bundesland aus lokalem Cache
          setVerfuegbareOrte([]);
          const bl = getBundeslandFromPLZ(plz);
          if (bl) {
            updateStep2({ bundesland: bl });
            // Fallback Bundesland applied
          }
        }
        setPlzLoading(false);
      }).catch(err => {
        console.error('[PLZ] API Error:', err);
        setVerfuegbareOrte([]);
        const bl = getBundeslandFromPLZ(plz);
        if (bl) updateStep2({ bundesland: bl });
        setPlzLoading(false);
      });
    }
  }, [step2.plz]);

  // Handler für Ort-Auswahl bei mehreren Orten
  const handleOrtSelect = (selectedOrt: string) => {
    const ortInfo = verfuegbareOrte.find(o => o.ort === selectedOrt);
    if (ortInfo) {
      updateStep2({
        ort: ortInfo.ort,
        bundesland: ortInfo.bundesland || step2.bundesland
      });
    } else {
      updateStep2({ ort: selectedOrt });
    }
  };

  // Handler für Straßen-Autocomplete Auswahl
  const handleStreetSelect = (suggestion: any) => {
    const updates: any = { strasse: suggestion.street };

    // Hausnummer übernehmen wenn vorhanden
    if (suggestion.houseNumber) {
      updates.hausnummer = suggestion.houseNumber;
    }

    // PLZ übernehmen wenn vorhanden und anders
    if (suggestion.postalCode && suggestion.postalCode !== step2.plz) {
      updates.plz = suggestion.postalCode;
    }

    // Ort übernehmen wenn vorhanden
    if (suggestion.city && suggestion.city !== step2.ort) {
      updates.ort = suggestion.city;
    }

    // Bundesland übernehmen wenn vorhanden
    if (suggestion.state && suggestion.state !== step2.bundesland) {
      updates.bundesland = suggestion.state;
    }

    // GPS-Koordinaten übernehmen (für PVGIS Solar-Berechnung)
    if (suggestion.lat && suggestion.lng) {
      updates.gpsLat = suggestion.lat;
      updates.gpsLng = suggestion.lng;
    }

    updateStep2(updates);
  };

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>📍</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 2</div>
          <h2 className={styles.sectionTitleLarge}>Standortadresse</h2>
          <p className={styles.sectionSubtitle}>Geben Sie die Adresse ein, an der die Anlage installiert wird.</p>
        </div>
      </div>

      {/* Adresse Panel */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>🏠</div>
            <span>Anlagenstandort</span>
          </div>
          {step2.plz && step2.ort && (
            <div className={styles.panelBadge}>✓ Adresse eingegeben</div>
          )}
        </div>

        <div className={styles.formGrid3}>
          <div className={styles.span2}>
            <StreetAutocomplete
              label="Straße"
              value={step2.strasse}
              onChange={v => updateStep2({ strasse: v })}
              onSelectSuggestion={handleStreetSelect}
              plz={step2.plz}
              placeholder="Straße eingeben..."
              required
              error={touched.strasse ? getError('strasse') : undefined}
              onBlur={() => setTouched(t => ({ ...t, strasse: true }))}
            />
          </div>
          <Input
            label="Hausnummer"
            value={step2.hausnummer}
            onChange={v => updateStep2({ hausnummer: v })}
            onBlur={() => setTouched(t => ({ ...t, hausnummer: true }))}
            placeholder="123"
            required
            error={touched.hausnummer ? getError('hausnummer') : undefined}
          />
        </div>

        <div className={styles.formGrid4} style={{ marginTop: 20 }}>
          <Input
            label="PLZ"
            value={step2.plz}
            onChange={v => updateStep2({ plz: v })}
            onBlur={() => setTouched(t => ({ ...t, plz: true }))}
            placeholder="77933"
            maxLength={5}
            required
            error={touched.plz ? getError('plz') : undefined}
            hint={plzLoading ? '⏳ Lade Ort...' : undefined}
          />

          <OrtInputWithSuggestions
            value={step2.ort}
            onChange={handleOrtSelect}
            onBlur={() => setTouched(t => ({ ...t, ort: true }))}
            suggestions={verfuegbareOrte}
            loading={plzLoading}
            error={touched.ort ? getError('ort') : undefined}
          />

          <div className={styles.span2}>
            <Select
              label="Bundesland"
              value={step2.bundesland}
              onChange={v => updateStep2({ bundesland: v })}
              options={BL.map(b => ({ value: b, label: b }))}
            />
          </div>
        </div>

        {/* Hinweis wenn mehrere Orte */}
        {verfuegbareOrte.length > 1 && (
          <div className={styles.alertBox} style={{ marginTop: 16 }}>
            <span className={styles.alertIcon}>ℹ️</span>
            <div className={styles.alertContent}>
              <div className={styles.alertText}>
                {verfuegbareOrte.length} Orte für PLZ {step2.plz} gefunden. Klicken Sie auf einen Vorschlag oder geben Sie den Ort manuell ein.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optionale Angaben Panel */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>📋</div>
            <span>Optionale Angaben</span>
          </div>
        </div>

        <div className={styles.formGrid2}>
          <Input
            label="Gemarkung (optional)"
            value={step2.gemarkung || ''}
            onChange={v => updateStep2({ gemarkung: v })}
            placeholder="z.B. Lahr"
          />
          <Input
            label="Flurstück (optional)"
            value={step2.flurstueck || ''}
            onChange={v => updateStep2({ flurstueck: v })}
            placeholder="z.B. 1234/5"
          />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: EIGENTUM
// ═══════════════════════════════════════════════════════════════════════════

export const Step3Eigentuemer: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);
  const { data, updateStep3 } = useWizardStore();
  const { step3 } = data;

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>🏠</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 3</div>
          <h2 className={styles.sectionTitleLarge}>Eigentumsverhältnis</h2>
          <p className={styles.sectionSubtitle}>Sind Sie Eigentümer des Grundstücks, auf dem die Anlage installiert wird?</p>
        </div>
      </div>

      {/* Auswahl Panel */}
      <div className={styles.panel}>
        <div className={styles.choiceGrid}>
          <div
            className={`${styles.choiceCard} ${step3.istEigentuemer === true ? styles.choiceCardSelected : ''}`}
            onClick={() => updateStep3({ istEigentuemer: true, zustimmungVorhanden: true })}
          >
            <div className={styles.choiceIcon}>✅</div>
            <div className={styles.choiceLabel}>Ja, Eigentümer</div>
          </div>
          <div
            className={`${styles.choiceCard} ${step3.istEigentuemer === false ? styles.choiceCardSelected : ''}`}
            onClick={() => updateStep3({ istEigentuemer: false })}
          >
            <div className={styles.choiceIcon}>📝</div>
            <div className={styles.choiceLabel}>Nein, Mieter</div>
          </div>
        </div>
      </div>

      {/* Mieter-Details Panel */}
      {step3.istEigentuemer === false && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>⚠️</div>
              <span>Eigentümerzustimmung</span>
            </div>
          </div>

          <div className={`${styles.alertBox} ${styles.alertBoxWarning}`} style={{ marginBottom: 24 }}>
            <span className={styles.alertIcon}>⚠️</span>
            <div className={styles.alertContent}>
              <div className={styles.alertTitle}>Zustimmung erforderlich</div>
              <div className={styles.alertText}>
                Für die Installation einer Anlage auf fremdem Grundstück benötigen Sie die schriftliche Zustimmung des Eigentümers.
              </div>
            </div>
          </div>

          <div
            className={`${styles.checkboxEnhanced} ${step3.zustimmungVorhanden ? styles.checkboxEnhancedChecked : ''}`}
            onClick={() => updateStep3({ zustimmungVorhanden: !step3.zustimmungVorhanden })}
            style={{ marginBottom: 24 }}
          >
            <div className={styles.checkboxBox} />
            <div className={styles.checkboxContent}>
              <div className={styles.checkboxLabel}>Zustimmung liegt vor oder wird eingeholt</div>
              <div className={styles.checkboxHint}>Ich bestätige, dass die Zustimmung des Eigentümers vorliegt oder vor Installation eingeholt wird.</div>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <Input
              label="Name des Eigentümers"
              value={step3.eigentuemer?.name || ''}
              onChange={v => updateStep3({ eigentuemer: { ...step3.eigentuemer, name: v, adresse: step3.eigentuemer?.adresse || '' } })}
              placeholder="Vor- und Nachname"
            />
            <Input
              label="Adresse des Eigentümers (optional)"
              value={step3.eigentuemer?.adresse || ''}
              onChange={v => updateStep3({ eigentuemer: { ...step3.eigentuemer, name: step3.eigentuemer?.name || '', adresse: v } })}
              placeholder="Straße, PLZ Ort"
            />
          </div>
        </div>
      )}

      {/* Erfolgs-Anzeige wenn Eigentümer */}
      {step3.istEigentuemer === true && (
        <div className={`${styles.alertBox} ${styles.alertBoxSuccess}`}>
          <span className={styles.alertIcon}>✅</span>
          <div className={styles.alertContent}>
            <div className={styles.alertTitle}>Eigentum bestätigt</div>
            <div className={styles.alertText}>
              Als Eigentümer des Grundstücks können Sie direkt mit der Anmeldung fortfahren.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: KUNDE
// ═══════════════════════════════════════════════════════════════════════════

export const Step6Kunde: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);
  const { data, updateStep6 } = useWizardStore();
  const { step6 } = data;

  // Validation - zeigt Fehler nach Interaktion
  const { getError } = useFieldErrors(6);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Collapsible sections
  const [showBank, setShowBank] = useState(!!step6.iban);
  const [showRegister, setShowRegister] = useState(!!step6.mastrNummer || !!step6.eegAnlagenschluessel);

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>👤</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 6</div>
          <h2 className={styles.sectionTitleLarge}>Anlagenbetreiber</h2>
          <p className={styles.sectionSubtitle}>Geben Sie die Daten der Person oder Firma ein, die die Anlage betreibt.</p>
        </div>
      </div>

      {/* Kundentyp Auswahl */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>🏷️</div>
            <span>Betreibertyp</span>
          </div>
        </div>
        <div className={styles.formGrid4}>
          {KUNDENTYPEN.map(k => (
            <div
              key={k.value}
              className={`${styles.choiceCard} ${step6.kundentyp === k.value ? styles.choiceCardSelected : ''}`}
              onClick={() => updateStep6({ kundentyp: k.value as any })}
              style={{ padding: 20 }}
            >
              <div className={styles.choiceIcon}>{k.icon}</div>
              <div className={styles.choiceLabel}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Persönliche Daten & Kontakt */}
      <div className={styles.formGrid2}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>👤</div>
              <span>Persönliche Daten</span>
            </div>
            {step6.vorname && step6.nachname && (
              <div className={styles.panelBadge}>✓ Ausgefüllt</div>
            )}
          </div>

          {step6.kundentyp && step6.kundentyp !== 'privat' && (
            <div style={{ marginBottom: 20 }}>
              <Input
                label="Firma"
                value={step6.firma || ''}
                onChange={v => updateStep6({ firma: v })}
                onBlur={() => setTouched(t => ({ ...t, firma: true }))}
                placeholder="Firmenname"
                required
                error={touched.firma ? getError('firma') : undefined}
              />
            </div>
          )}

          <div className={styles.formGrid3} style={{ marginBottom: 16 }}>
            <Select
              label="Anrede"
              value={step6.anrede || ''}
              onChange={v => updateStep6({ anrede: v as any })}
              options={[
                { value: 'herr', label: 'Herr' },
                { value: 'frau', label: 'Frau' },
                { value: 'divers', label: 'Divers' }
              ]}
            />
            <Input
              label="Vorname"
              value={step6.vorname}
              onChange={v => updateStep6({ vorname: v })}
              onBlur={() => setTouched(t => ({ ...t, vorname: true }))}
              required
              error={touched.vorname ? getError('vorname') : undefined}
            />
            <Input
              label="Nachname"
              value={step6.nachname}
              onChange={v => updateStep6({ nachname: v })}
              onBlur={() => setTouched(t => ({ ...t, nachname: true }))}
              required
              error={touched.nachname ? getError('nachname') : undefined}
            />
          </div>

          <Input
            label="Geburtsdatum (optional)"
            value={step6.geburtsdatum || ''}
            onChange={v => updateStep6({ geburtsdatum: v })}
            type="date"
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>📞</div>
              <span>Kontaktdaten</span>
            </div>
          </div>

          <Input
            label="E-Mail-Adresse (Endkunde)"
            value={step6.email || ''}
            onChange={v => updateStep6({ email: v })}
            placeholder="endkunde@example.de"
            error={getError('email')}
          />

          <div className={styles.formGrid2}>
            <Input
              label="Telefon (Festnetz)"
              value={step6.telefon}
              onChange={v => updateStep6({ telefon: v })}
              placeholder="07821 12345"
            />
            <Input
              label="Mobiltelefon"
              value={step6.mobiltelefon || ''}
              onChange={v => updateStep6({ mobiltelefon: v })}
              placeholder="0170 1234567"
            />
          </div>
        </div>
      </div>

      {/* Optionale Sektionen */}
      <div className={styles.formGrid2}>
        {/* BANKVERBINDUNG */}
        <div className={styles.panel}>
          <div
            className={styles.panelHeader}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowBank(!showBank)}
          >
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>🏦</div>
              <span>Bankverbindung</span>
              <span className={styles.panelBadge} style={{ background: 'rgba(99,139,255,0.15)', color: '#638bff' }}>
                OPTIONAL
              </span>
            </div>
            <span style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.5)',
              transform: showBank ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>
              ▼
            </span>
          </div>

          <div className={`${styles.alertBox} ${styles.alertBoxInfo}`} style={{ marginBottom: showBank ? 20 : 0 }}>
            <span className={styles.alertIcon}>💡</span>
            <div className={styles.alertContent}>
              <div className={styles.alertTitle}>Für Einspeisevergütung</div>
              <div className={styles.alertText}>
                Die Bankverbindung wird für die Auszahlung der Einspeisevergütung benötigt. Sie können diese Angabe auch später nachreichen.
              </div>
            </div>
          </div>

          {showBank && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className={styles.formGrid2} style={{ marginBottom: 16 }}>
                <Input
                  label="IBAN"
                  value={step6.iban || ''}
                  onChange={v => updateStep6({ iban: v.replace(/\s/g, '').toUpperCase() })}
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
                <Input
                  label="BIC (optional)"
                  value={step6.bic || ''}
                  onChange={v => updateStep6({ bic: v.toUpperCase() })}
                  placeholder="COBADEFFXXX"
                />
              </div>
              <Input
                label="Kontoinhaber (falls abweichend)"
                value={step6.kontoinhaber || ''}
                onChange={v => updateStep6({ kontoinhaber: v })}
                placeholder={`${step6.vorname} ${step6.nachname}`.trim() || 'Name des Kontoinhabers'}
              />
            </div>
          )}
        </div>

        {/* REGISTERNUMMERN */}
        <div className={styles.panel}>
          <div
            className={styles.panelHeader}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowRegister(!showRegister)}
          >
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>📋</div>
              <span>Registernummern</span>
              <span className={styles.panelBadge} style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                OPTIONAL
              </span>
            </div>
            <span style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.5)',
              transform: showRegister ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>
              ▼
            </span>
          </div>

          <div className={`${styles.alertBox} ${styles.alertBoxWarning}`} style={{ marginBottom: showRegister ? 20 : 0 }}>
            <span className={styles.alertIcon}>⚠️</span>
            <div className={styles.alertContent}>
              <div className={styles.alertTitle}>Nur bei Erweiterung</div>
              <div className={styles.alertText}>
                Diese Angaben sind nur relevant, wenn bereits eine PV-Anlage am selben Standort existiert.
              </div>
            </div>
          </div>

          {showRegister && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: 16 }}>
                <Input
                  label="MaStR-Nummer"
                  value={step6.mastrNummer || ''}
                  onChange={v => updateStep6({ mastrNummer: v.toUpperCase() })}
                  placeholder="z.B. SEE123456789012"
                  hint="Beginnt mit SEE – zu finden im MaStR-Portal"
                />
              </div>
              <Input
                label="EEG-Anlagenschlüssel"
                value={step6.eegAnlagenschluessel || ''}
                onChange={v => updateStep6({ eegAnlagenschluessel: v.toUpperCase() })}
                placeholder="z.B. E12345678901"
                hint="12-stellig – vom Netzbetreiber vergeben"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7: DOKUMENTE - MIT ALLEN PLAN-GENERATOREN
// ═══════════════════════════════════════════════════════════════════════════

export const Step7Dokumente: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);
  const { data } = useWizardStore();

  // ✅ NEU: useDocuments Hook für IndexedDB Persistenz
  const { addDocument, isLoading: docsLoading, isIndexedDBSupported, stats: docStats } = useDocuments();

  // Dokumente werden in separater Sektion gehandhabt
  const mk = useMemo(() => ermittleMesskonzept(data), [data]);

  // Download States
  const [downloading, setDownloading] = React.useState<string | null>(null);

  // Helper: Generiere eindeutige ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // VDE Formulare generieren und downloaden + zum Store hinzufügen
  const generiereUndDownload = async (typ: 'E1' | 'E2' | 'E3' | 'E8' | 'ALLE') => {
    setDownloading(typ);
    try {
      // PDF Generator importieren (nicht HTML!)
      const { generateAllVDEPDFs, generateSingleVDEPDF } = await import('../../../lib/pdf/VDEFormularePDF');

      // Mapping für DokumentenCenter-kompatible Kategorien
      type VDEKategorie = 'vde_e1' | 'vde_e2' | 'vde_e3' | 'vde_e8';
      const getCategoryKey = (formTyp: string): VDEKategorie => {
        switch (formTyp) {
          case 'E1': return 'vde_e1';
          case 'E2': return 'vde_e2';
          case 'E3': return 'vde_e3';
          case 'E8': return 'vde_e8';
          default: return 'vde_e1';
        }
      };

      // Helper: PDF Blob downloaden
      const downloadPDFBlob = async (blob: Blob, filename: string) => {
        const { downloadFile } = await import('@/utils/desktopDownload');
        await downloadFile({ filename, blob, fileType: 'pdf' });
      };

      // isAdmin aus localStorage prüfen - mehrere Varianten
      let isAdmin = false;
      try {
        // Versuche verschiedene localStorage keys
        const authKeys = ['auth', 'user', 'token', 'session', 'userData', 'currentUser'];
        for (const key of authKeys) {
          const authData = localStorage.getItem(key);
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              // Versuche verschiedene Pfade zur Role
              const role = parsed.role || parsed.userRole || parsed.user?.role ||
                           parsed.data?.role || parsed.userData?.role || '';
              const roleUpper = String(role).toUpperCase();
              if (roleUpper === 'ADMIN' || roleUpper === 'MITARBEITER' || roleUpper === 'ADMINISTRATOR') {
                isAdmin = true;
                // Admin role detected
                break;
              }
            } catch (e) { /* JSON parse failed, try next */ }
          }
        }
        if (!isAdmin) {
          // No admin role found in localStorage
        }
      } catch (e) {
        console.warn('[VDE-PDF] localStorage Zugriff fehlgeschlagen:', e);
      }

      if (typ === 'ALLE') {
        const pdfs = generateAllVDEPDFs(data, { isAdmin });
        for (const pdf of pdfs) {
          downloadPDFBlob(pdf.blob, pdf.filename);
          // ✅ Zum Store + IndexedDB hinzufügen
          await addDocument({
            id: generateId(),
            name: pdf.name,
            filename: pdf.filename,
            uploadedAt: new Date(),
            url: URL.createObjectURL(pdf.blob),
            kategorie: getCategoryKey(pdf.typ),
            blob: pdf.blob, // ✅ Blob für IndexedDB Persistenz
          });
        }
      } else {
        const pdf = generateSingleVDEPDF(data, typ, { isAdmin });
        if (pdf) {
          downloadPDFBlob(pdf.blob, pdf.filename);
          // ✅ Zum Store + IndexedDB hinzufügen
          await addDocument({
            id: generateId(),
            name: pdf.name,
            filename: pdf.filename,
            uploadedAt: new Date(),
            url: URL.createObjectURL(pdf.blob),
            kategorie: getCategoryKey(typ),
            blob: pdf.blob, // ✅ Blob für IndexedDB Persistenz
          });
        }
      }
    } finally {
      setDownloading(null);
    }
  };

  // Technische Pläne generieren und downloaden (SVG oder PDF) + zum Store hinzufügen
  const downloadPlan = async (planTyp: 'schaltplan' | 'lageplan' | 'stringplan', asPdf = false) => {
    setDownloading(planTyp);
    try {
      const generators = await import('../generators');
      const kundenname = `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim().replace(/\s+/g, '_') || 'Kunde';
      const datum = new Date().toISOString().split('T')[0];

      let svg: string;
      let baseFilename: string;
      let docName: string;

      switch (planTyp) {
        case 'schaltplan': {
          const config = generators.extractSchaltplanConfig(data);
          svg = generators.generateSchaltplanSVG(config);
          baseFilename = `Uebersichtsschaltplan_${kundenname}_${datum}`;
          docName = 'Übersichtsschaltplan';
          break;
        }
        case 'lageplan': {
          // MapTiler Satellitenbild - NB-KONFORM! (V4)
          const { generateLageplanFromWizard } = await import('../../../lib/maps/LageplanGeneratorV4');
          const result = await generateLageplanFromWizard(data);

          if (!result) {
            alert('Lageplan konnte nicht generiert werden. Bitte Adresse prüfen.');
            return;
          }

          svg = result.svg;
          baseFilename = result.hasSatelliteImage
            ? `Lageplan_Satellit_${kundenname}_${datum}`
            : `Lageplan_${kundenname}_${datum}`;
          docName = result.hasSatelliteImage ? 'Lageplan (Satellit)' : 'Lageplan';

          // Lageplan generated
          break;
        }
        case 'stringplan': {
          const config = generators.extractStringplanConfig(data);
          svg = (data.step5.dachflaechen?.length || 0) > 1
            ? generators.generateMultiDachStringplanSVG(config)
            : generators.generateStringplanSVG(config);
          baseFilename = `Stringplan_${kundenname}_${datum}`;
          docName = 'Stringplan';
          break;
        }
      }

      // ✅ Zum Store + IndexedDB hinzufügen
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const docUrl = URL.createObjectURL(blob);

      // Adding plan to DokumentenCenter + IndexedDB

      await addDocument({
        id: generateId(),
        name: docName,
        filename: `${baseFilename}.svg`,
        uploadedAt: new Date(),
        url: docUrl,
        kategorie: planTyp,
        blob, // ✅ Blob für IndexedDB Persistenz
      });

      // Plan added and persisted in IndexedDB

      if (asPdf) {
        // PDF Export via Print Dialog
        downloadSvgAsPdf(svg, baseFilename);
      } else {
        // SVG Download
        const { downloadFile } = await import('@/utils/desktopDownload');
        await downloadFile({ filename: `${baseFilename}.svg`, blob, fileType: 'svg' });
      }
    } catch (error) {
      console.error(`[Wizard] Fehler beim Generieren von ${planTyp}:`, error);
      alert(`Fehler beim Generieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setDownloading(null);
    }
  };

  // SVG als PDF exportieren (öffnet Druck-Dialog)
  const downloadSvgAsPdf = (svg: string, filename: string) => {
    // Neues Fenster mit SVG öffnen und drucken
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blockiert. Bitte erlauben Sie Popups für diese Seite.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          @media print {
            body { margin: 0; padding: 0; }
            svg { width: 100%; height: auto; max-height: 100vh; }
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: white;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            z-index: 1000;
          }
          .print-btn:hover { background: #059669; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">📄 Als PDF drucken</button>
        ${svg}
        <script>
          // Auto-print nach kurzer Verzögerung
          setTimeout(() => {
            // window.print();
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Projektmappe generieren + zum Store + IndexedDB hinzufügen (als PDF!)
  const downloadProjektmappe = async () => {
    setDownloading('projektmappe');
    try {
      const { generateProjektmappePDF } = await import('../../../lib/pdf/ProjektmappePDF');
      const result = generateProjektmappePDF(data);

      // PDF Download
      const { downloadFile } = await import('@/utils/desktopDownload');
      await downloadFile({ filename: result.filename, blob: result.blob, fileType: 'pdf' });

      const docUrl = URL.createObjectURL(result.blob);

      // ✅ Zum Store + IndexedDB hinzufügen
      await addDocument({
        id: generateId(),
        name: 'Projektmappe',
        filename: result.filename,
        uploadedAt: new Date(),
        url: docUrl,
        kategorie: 'projektmappe',
        blob: result.blob, // ✅ Blob für IndexedDB Persistenz
      });

      // Projektmappe added and persisted in IndexedDB
    } catch (error) {
      console.error('[Wizard] Fehler beim Generieren der Projektmappe:', error);
      alert(`Fehler beim Generieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setDownloading(null);
    }
  };

  const downloadHTML = async (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const { downloadFile } = await import('@/utils/desktopDownload');
    await downloadFile({ filename, blob });
  };

  const hatPV = data.step1.komponenten.includes('pv') || data.step1.kategorie === 'einspeiser';
  const hatSpeicher = (data.step5.gesamtSpeicherKwh || 0) > 0;

  // Button Style Helper
  const btnStyle = (color: 'green' | 'blue' | 'purple' | 'orange') => {
    const colors = {
      green: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', hover: 'rgba(16,185,129,0.25)' },
      blue: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', hover: 'rgba(59,130,246,0.25)' },
      purple: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', hover: 'rgba(139,92,246,0.25)' },
      orange: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', hover: 'rgba(249,115,22,0.25)' },
    };
    const c = colors[color];
    return {
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: `linear-gradient(135deg,${c.bg},${c.bg})`, border: `1px solid ${c.border}`,
      borderRadius: 12, cursor: 'pointer', color: 'white', textAlign: 'left' as const, width: '100%',
      transition: 'all 0.2s',
    };
  };

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>📄</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 7</div>
          <h2 className={styles.sectionTitleLarge}>Dokumente & Formulare</h2>
          <p className={styles.sectionSubtitle}>
            Alle Formulare werden automatisch generiert. Laden Sie zusätzliche Dokumente und Fotos hoch.
          </p>
        </div>
      </div>

      {/* Messkonzept Info */}
      {(mk?.typ || 'MK2') !== 'MK0' && (
        <div className={styles.alertBox} data-type="info" style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Messkonzept: {mk?.typ || 'MK2'} - {mk?.name || 'Überschusseinspeisung'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{mk?.anwendung || ''}</div>
          </div>
        </div>
      )}

      <div className={styles.formGrid2}>
        {/* VDE Formulare Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>✨</div>
              <span>VDE-Formulare</span>
            </div>
            <span className={styles.panelBadge} style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', color: '#22c55e' }}>Auto-generiert</span>
          </div>

          <div className={styles.grid2}>
            <button onClick={() => generiereUndDownload('E1')} disabled={downloading === 'E1'} style={btnStyle('green')}>
              <span style={{ fontSize: 20 }}>{downloading === 'E1' ? '⏳' : '📋'}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>E.1 Antragstellung</div><div style={{ fontSize: 11, opacity: 0.7 }}>Netzanschluss-Antrag</div></div>
              <span>⬇️</span>
            </button>

            {hatPV && (
              <button onClick={() => generiereUndDownload('E2')} disabled={downloading === 'E2'} style={btnStyle('green')}>
                <span style={{ fontSize: 20 }}>{downloading === 'E2' ? '⏳' : '📊'}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>E.2 Datenblatt</div><div style={{ fontSize: 11, opacity: 0.7 }}>Erzeugungsanlage</div></div>
                <span>⬇️</span>
              </button>
            )}

            {hatSpeicher && (
              <button onClick={() => generiereUndDownload('E3')} disabled={downloading === 'E3'} style={btnStyle('green')}>
                <span style={{ fontSize: 20 }}>{downloading === 'E3' ? '⏳' : '🔋'}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>E.3 Speicher</div><div style={{ fontSize: 11, opacity: 0.7 }}>Speicher-Datenblatt</div></div>
                <span>⬇️</span>
              </button>
            )}

            <button onClick={() => generiereUndDownload('E8')} disabled={downloading === 'E8'} style={btnStyle('purple')}>
              <span style={{ fontSize: 20 }}>{downloading === 'E8' ? '⏳' : '✅'}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>E.8 IBN-Protokoll</div><div style={{ fontSize: 11, opacity: 0.7 }}>Nach Installation</div></div>
              <span>⬇️</span>
            </button>
          </div>

          <button onClick={() => generiereUndDownload('ALLE')} disabled={downloading === 'ALLE'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', marginTop: 16, width: '100%', background: 'linear-gradient(135deg,#10b981,#06b6d4)', border: 'none', borderRadius: 12, cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 14 }}>
            {downloading === 'ALLE' ? '⏳ Generiere...' : '📦 Alle VDE-Formulare herunterladen'}
          </button>
        </div>

        {/* Technische Pläne Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>📐</div>
              <span>Technische Pläne</span>
            </div>
            <span className={styles.panelBadge} style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', color: '#3b82f6' }}>Auto-generiert</span>
          </div>

          <div className={styles.grid2}>
            {/* Schaltplan mit Format-Auswahl */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => downloadPlan('schaltplan', true)} disabled={downloading === 'schaltplan'} style={btnStyle('blue')}>
                <span style={{ fontSize: 20 }}>{downloading === 'schaltplan' ? '⏳' : '⚡'}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Übersichtsschaltplan</div><div style={{ fontSize: 11, opacity: 0.7 }}>PDF (druckfertig)</div></div>
                <span>📄</span>
              </button>
            </div>

            {/* Lageplan - AUTOMATISCH mit Google Maps Satellitenbild */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => downloadPlan('lageplan', true)} disabled={downloading === 'lageplan'} style={btnStyle('blue')}>
                <span style={{ fontSize: 20 }}>{downloading === 'lageplan' ? '⏳' : '🗺️'}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Lageplan</div><div style={{ fontSize: 11, opacity: 0.7 }}>Mit Satellitenbild (NB-konform)</div></div>
                <span>📄</span>
              </button>
            </div>

            {/* Stringplan */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => downloadPlan('stringplan', true)} disabled={downloading === 'stringplan'} style={btnStyle('blue')}>
                <span style={{ fontSize: 20 }}>{downloading === 'stringplan' ? '⏳' : '📊'}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Stringplan</div><div style={{ fontSize: 11, opacity: 0.7 }}>PDF (druckfertig)</div></div>
                <span>📄</span>
              </button>
            </div>

            {/* Projektmappe */}
            <button onClick={downloadProjektmappe} disabled={downloading === 'projektmappe'} style={btnStyle('orange')}>
              <span style={{ fontSize: 20 }}>{downloading === 'projektmappe' ? '⏳' : '📑'}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Projektmappe</div><div style={{ fontSize: 11, opacity: 0.7 }}>Komplette Dokumentation</div></div>
              <span>⬇️</span>
            </button>
          </div>

          {/* Alle Pläne als PDF */}
          <button onClick={async () => {
            setDownloading('alle-plaene');
            await downloadPlan('schaltplan', true);
            // Kleine Pause zwischen Downloads
            await new Promise(r => setTimeout(r, 500));
            await downloadPlan('lageplan', true);
            await new Promise(r => setTimeout(r, 500));
            await downloadPlan('stringplan', true);
            setDownloading(null);
          }} disabled={!!downloading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', marginTop: 16, width: '100%', background: 'linear-gradient(135deg,#3b82f6,#EAD068)', border: 'none', borderRadius: 12, cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 14 }}>
            {downloading === 'alle-plaene' ? '⏳ Generiere...' : '📄 Alle Pläne als PDF'}
          </button>

          {/* SVG Download Option (kleiner) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, gap: 8 }}>
            <button onClick={() => downloadPlan('schaltplan', false)} disabled={!!downloading}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer' }}>
              SVG Schaltplan
            </button>
            <button onClick={() => downloadPlan('lageplan', false)} disabled={!!downloading}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer' }}>
              SVG Lageplan
            </button>
            <button onClick={() => downloadPlan('stringplan', false)} disabled={!!downloading}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer' }}>
              SVG Stringplan
            </button>
          </div>
        </div>
      </div>

      {/* Weitere Unterlagen Panel */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>📁</div>
            <span>Weitere Unterlagen</span>
          </div>
          <span className={styles.panelBadge}>Aus Produktdatenbank</span>
        </div>

        <div className={styles.grid2}>
          {/* Einheitenzertifikat */}
          <div className={styles.doc} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className={styles.docIcon}>📋</span>
            <div style={{ flex: 1 }}>
              <div className={styles.docName}>Einheitenzertifikat (E.4)</div>
              <div className={styles.docHint} style={{ color: '#10b981' }}>✓ ZEREZ aus Produktdatenbank</div>
            </div>
          </div>

          {/* Speicher-Datenblatt E.5 */}
          {hatSpeicher && (
            <div className={styles.doc}>
              <span className={styles.docIcon}>📋</span>
              <div style={{ flex: 1 }}>
                <div className={styles.docName}>Speicher-Datenblatt (E.5)</div>
                <div className={styles.docHint}>Hersteller-Datenblatt</div>
              </div>
            </div>
          )}

          {/* Modul-Datenblatt */}
          {hatPV && (
            <div className={styles.doc} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className={styles.docIcon}>📋</span>
              <div style={{ flex: 1 }}>
                <div className={styles.docName}>Modul-Datenblatt</div>
                <div className={styles.docHint} style={{ color: '#10b981' }}>✓ Aus Produktdatenbank</div>
              </div>
            </div>
          )}

          {/* WR-Datenblatt */}
          {hatPV && (
            <div className={styles.doc} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className={styles.docIcon}>📋</span>
              <div style={{ flex: 1 }}>
                <div className={styles.docName}>WR-Datenblatt</div>
                <div className={styles.docHint} style={{ color: '#10b981' }}>✓ Aus Produktdatenbank</div>
              </div>
            </div>
          )}

          {/* Speicher-Datenblatt */}
          {hatSpeicher && (
            <div className={styles.doc} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className={styles.docIcon}>📋</span>
              <div style={{ flex: 1 }}>
                <div className={styles.docName}>Speicher-Datenblatt</div>
                <div className={styles.docHint} style={{ color: '#10b981' }}>✓ Aus Produktdatenbank</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* GENERIERTE DOKUMENTE - Aus dem Store                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {(data.step7.dokumente?.length || 0) > 0 && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <span>✅</span>
              <span>Generierte Dokumente ({data.step7.dokumente?.length || 0})</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Bereit für Einreichung</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.step7.dokumente || []).map(doc => {
              // Farbe und Icon basierend auf Kategorie
              const isVDE = doc.kategorie.startsWith('vde');
              const isTechnik = ['schaltplan', 'lageplan', 'stringplan', 'technik'].includes(doc.kategorie);
              const isProjektmappe = doc.kategorie === 'projektmappe';

              const bgColor = isVDE ? 'rgba(16,185,129,0.15)'
                            : isProjektmappe ? 'rgba(245,158,11,0.15)'
                            : 'rgba(59,130,246,0.15)';
              const borderColor = isVDE ? 'rgba(16,185,129,0.4)'
                                : isProjektmappe ? 'rgba(245,158,11,0.4)'
                                : 'rgba(59,130,246,0.4)';
              const icon = isVDE ? '📋'
                         : isProjektmappe ? '📑'
                         : isTechnik ? '📐'
                         : '📄';
              const hintColor = isVDE ? '#6ee7b7'
                              : isProjektmappe ? '#fcd34d'
                              : '#93c5fd';

              return (
                <div key={doc.id} className={styles.doc} style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                }}>
                  <span className={styles.docIcon}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className={styles.docName}>{safeString(doc.name)}</div>
                    <div className={styles.docHint} style={{ color: hintColor }}>
                      {doc.filename} • {new Date(doc.uploadedAt).toLocaleString('de-DE')}
                    </div>
                  </div>
                  <a href={doc.url} download={doc.filename} style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: 'white',
                    fontSize: 11,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}>
                    ⬇️ Download
                  </a>
                </div>
              );
            })}
          </div>

          {/* Status-Badge */}
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Dokumentenset vollständig</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                {(data.step7.dokumente || []).filter(d => d.kategorie?.startsWith('vde')).length} VDE-Formulare •
                {(data.step7.dokumente || []).filter(d => ['schaltplan', 'lageplan', 'stringplan', 'technik'].includes(d.kategorie)).length} Technische Pläne
                {(data.step7.dokumente || []).filter(d => d.kategorie === 'projektmappe').length > 0 && ' • 1 Projektmappe'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FOTO-UPLOAD SEKTION (Phase 1.5)                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <FotoUploadSektion />

      <div className={styles.info}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          <strong>Alle Pläne</strong> werden als SVG generiert (druckbar als PDF via Browser).<br/>
          <strong>Datenblätter</strong> werden automatisch aus der Produktdatenbank geladen.
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// FOTO-UPLOAD KOMPONENTE (Phase 1.5)
// ═══════════════════════════════════════════════════════════════════════════

const FotoUploadSektion: React.FC = () => {
  const { data, updateStep7 } = useWizardStore();
  const fotos = data.step7.fotos || [];

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedKategorie, setSelectedKategorie] = React.useState<FotoKategorie | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Foto hinzufügen
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedKategorie) return;

    setUploading(true);

    try {
      const newFotos: FotoUpload[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validierung: Nur Bilder
        if (!file.type.startsWith('image/')) {
          console.warn('[Foto] Übersprungen (kein Bild):', file.name);
          continue;
        }

        // Validierung: Max 10MB
        if (file.size > 10 * 1024 * 1024) {
          console.warn('[Foto] Übersprungen (zu groß):', file.name);
          continue;
        }

        const kategorie = FOTO_KATEGORIEN.find(k => k.value === selectedKategorie);

        const foto: FotoUpload = {
          id: `foto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          kategorie: selectedKategorie,
          filename: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date(),
          istPflicht: kategorie?.pflicht || false,
        };

        newFotos.push(foto);
      }

      if (newFotos.length > 0) {
        updateStep7({ fotos: [...fotos, ...newFotos] });
        // Photos added to upload queue
      }
    } finally {
      setUploading(false);
      setSelectedKategorie(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Foto entfernen
  const removeFoto = (id: string) => {
    const foto = fotos.find(f => f.id === id);
    if (foto?.url) {
      URL.revokeObjectURL(foto.url);
    }
    updateStep7({ fotos: fotos.filter(f => f.id !== id) });
  };

  // Statistik
  const pflichtKategorien = FOTO_KATEGORIEN.filter(k => k.pflicht).map(k => k.value);
  const hochgeladenePflicht = pflichtKategorien.filter(kat => (fotos || []).some(f => f.kategorie === kat));
  const allePflichtVorhanden = hochgeladenePflicht.length === pflichtKategorien.length;

  return (
    <div className={styles.card} style={{ marginTop: 16 }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span>📷</span>
          <span>Fotos der Installation</span>
        </div>
        <div style={{
          padding: '4px 10px',
          background: allePflichtVorhanden ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
          border: `1px solid ${allePflichtVorhanden ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 500,
          color: allePflichtVorhanden ? '#6ee7b7' : '#fcd34d',
        }}>
          {hochgeladenePflicht.length}/{pflichtKategorien.length} Pflichtfotos
        </div>
      </div>

      {/* Hinweis */}
      {!allePflichtVorhanden && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 12,
          color: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠️</span>
          <span>Pflichtfotos fehlen: {pflichtKategorien.filter(k => !fotos.some(f => f.kategorie === k)).map(k => FOTO_KATEGORIEN.find(fk => fk.value === k)?.label).join(', ')}</span>
        </div>
      )}

      {/* Upload-Buttons nach Kategorie */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 8,
        marginBottom: 16,
      }}>
        {FOTO_KATEGORIEN.map(kat => {
          const hatFoto = fotos.some(f => f.kategorie === kat.value);
          const isActive = selectedKategorie === kat.value;

          return (
            <button
              key={kat.value}
              onClick={() => {
                setSelectedKategorie(kat.value);
                fileInputRef.current?.click();
              }}
              style={{
                padding: '10px 12px',
                background: hatFoto
                  ? 'rgba(16,185,129,0.15)'
                  : isActive
                    ? 'rgba(212,168,67,0.2)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  hatFoto
                    ? 'rgba(16,185,129,0.4)'
                    : kat.pflicht
                      ? 'rgba(245,158,11,0.4)'
                      : 'rgba(255,255,255,0.1)'
                }`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{kat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: hatFoto ? '#6ee7b7' : 'white' }}>
                  {kat.label}
                </span>
                {hatFoto && <span style={{ marginLeft: 'auto', color: '#6ee7b7' }}>✓</span>}
                {kat.pflicht && !hatFoto && <span style={{ marginLeft: 'auto', color: '#fcd34d', fontSize: 10 }}>*</span>}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {kat.beschreibung}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Hochgeladene Fotos */}
      {(fotos?.length || 0) > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
            Hochgeladene Fotos ({fotos?.length || 0})
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 8
          }}>
            {(fotos || []).map(foto => {
              const kategorie = FOTO_KATEGORIEN.find(k => k.value === foto.kategorie);
              return (
                <div
                  key={foto.id}
                  style={{
                    position: 'relative',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '100%',
                    height: 80,
                    backgroundImage: `url(${foto.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />

                  {/* Info */}
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{kategorie?.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {kategorie?.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {foto.filename}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFoto(foto.id)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(239,68,68,0.8)',
                      border: 'none',
                      color: 'white',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status */}
      {allePflichtVorhanden && fotos.length > 0 && (
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 8,
          fontSize: 12,
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>✅</span>
          <span>Alle Pflichtfotos vorhanden</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8: ABSCHLUSS
// ═══════════════════════════════════════════════════════════════════════════

export const Step8Abschluss: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);
  const { data, updateStep8 } = useWizardStore();
  const { step8 } = data;

  // Validation
  const { getError } = useFieldErrors(8);

  const alleAkzeptiert = step8.vollmachtErteilt && step8.agbAkzeptiert && step8.datenschutzAkzeptiert;

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>✅</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 8</div>
          <h2 className={styles.sectionTitleLarge}>Vollmacht & Abschluss</h2>
          <p className={styles.sectionSubtitle}>
            Letzte Bestätigungen vor der Einreichung Ihrer Netzanmeldung
          </p>
        </div>
      </div>

      {/* Hinweis wenn nicht alle akzeptiert */}
      {!alleAkzeptiert && (
        <div className={styles.alertBox} data-type="warning" style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Bestätigungen erforderlich</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Bitte bestätigen Sie alle erforderlichen Checkboxen um fortzufahren.
            </div>
          </div>
        </div>
      )}

      <div className={styles.formGrid2}>
        {/* Vollmacht Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>📝</div>
              <span>Vollmacht</span>
            </div>
          </div>

          <Checkbox
            label="Vollmacht für Baunity erteilen"
            description={`Ich bevollmächtige ${COMPANY.name} zur Durchführung der Netzanmeldung bei meinem Netzbetreiber.`}
            checked={step8.vollmachtErteilt}
            onChange={v => updateStep8({ vollmachtErteilt: v })}
            required
            error={!step8.vollmachtErteilt ? getError('vollmacht') : undefined}
          />

          <div style={{ height: 16 }} />

          <Checkbox
            label="MaStR-Registrierung (optional)"
            description="Wir übernehmen die Registrierung im Marktstammdatenregister der Bundesnetzagentur."
            checked={step8.mastrVoranmeldung}
            onChange={v => updateStep8({ mastrVoranmeldung: v })}
          />

          <div style={{ height: 16 }} />

          <Checkbox
            label="Kundenportal für Endkunde anlegen"
            description="Der Endkunde erhält Zugang zum Kundenportal mit E-Mail und Passwort, um den Status seiner Anlage zu verfolgen."
            checked={step8.kundenportalAnlegen ?? false}
            onChange={v => updateStep8({ kundenportalAnlegen: v })}
          />
        </div>

        {/* Rechtliches Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <div className={styles.panelTitleIcon}>⚖️</div>
              <span>Rechtliches</span>
            </div>
          </div>

          <Checkbox
            label="AGB akzeptieren"
            description={
              <>
                Ich akzeptiere die{' '}
                <a
                  href={COMPANY.agbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Allgemeinen Geschäftsbedingungen
                </a>.
              </>
            }
            checked={step8.agbAkzeptiert}
            onChange={v => updateStep8({ agbAkzeptiert: v })}
            required
            error={!step8.agbAkzeptiert ? getError('agb') : undefined}
          />

          <div style={{ height: 16 }} />

          <Checkbox
            label="Datenschutzerklärung akzeptieren"
            description={
              <>
                Ich habe die{' '}
                <a
                  href={COMPANY.datenschutzUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Datenschutzerklärung
                </a>{' '}
                gelesen und akzeptiere sie.
              </>
            }
            checked={step8.datenschutzAkzeptiert}
            required
            error={!step8.datenschutzAkzeptiert ? getError('datenschutz') : undefined}
            onChange={v => updateStep8({ datenschutzAkzeptiert: v })}
          />
        </div>
      </div>

      {/* Inbetriebnahme Panel */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>▶️</div>
            <span>Inbetriebnahme (IBN)</span>
          </div>
          <div style={{
            padding: '4px 10px',
            background: step8.inbetriebnahme?.ibnStatus === 'durchgefuehrt'
              ? 'rgba(16,185,129,0.2)'
              : 'rgba(212,168,67,0.2)',
            border: `1px solid ${step8.inbetriebnahme?.ibnStatus === 'durchgefuehrt'
              ? 'rgba(16,185,129,0.4)'
              : 'rgba(212,168,67,0.4)'}`,
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 500,
            color: step8.inbetriebnahme?.ibnStatus === 'durchgefuehrt' ? '#6ee7b7' : '#a5b4fc',
          }}>
            {step8.inbetriebnahme?.ibnStatus === 'geplant' && 'Geplant'}
            {step8.inbetriebnahme?.ibnStatus === 'beantragt' && 'Beantragt'}
            {step8.inbetriebnahme?.ibnStatus === 'freigegeben' && 'Freigegeben'}
            {step8.inbetriebnahme?.ibnStatus === 'durchgefuehrt' && 'Durchgeführt'}
            {step8.inbetriebnahme?.ibnStatus === 'abgenommen' && 'Abgenommen'}
            {!step8.inbetriebnahme?.ibnStatus && 'Geplant'}
          </div>
        </div>

        {/* IBN-Datum Felder */}
        <div className={styles.row3}>
          <Input
            label="Geplantes IBN-Datum"
            type="date"
            value={step8.inbetriebnahme?.geplantesIbnDatum || ''}
            onChange={(v) => {
              const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
              updateStep8({ inbetriebnahme: { ...current, geplantesIbnDatum: v } });
            }}
          />
          <Input
            label="Tatsächliches IBN-Datum"
            type="date"
            value={step8.inbetriebnahme?.tatsaechlichesIbnDatum || ''}
            onChange={(v) => {
              const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
              updateStep8({ inbetriebnahme: { ...current, tatsaechlichesIbnDatum: v } });
            }}
          />
          <Input
            label="EEG-Inbetriebnahme"
            type="date"
            value={step8.inbetriebnahme?.eegInbetriebnahme || ''}
            onChange={(v) => {
              const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
              updateStep8({ inbetriebnahme: { ...current, eegInbetriebnahme: v } });
            }}
          />
        </div>

        {/* MaStR-Registrierung */}
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(212,168,67,0.1)',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#a5b4fc' }}>
            Marktstammdatenregister (MaStR)
          </div>
          <div className={styles.row}>
            <div>
              <Checkbox
                label="Im MaStR angemeldet"
                checked={step8.inbetriebnahme?.mastrAngemeldet ?? false}
                onChange={(v) => {
                  const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
                  updateStep8({ inbetriebnahme: { ...current, mastrAngemeldet: v } });
                }}
              />
            </div>
            {step8.inbetriebnahme?.mastrAngemeldet && (
              <Input
                label="MaStR-Nummer"
                value={step8.inbetriebnahme?.mastrNummer || ''}
                onChange={(v) => {
                  const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
                  updateStep8({ inbetriebnahme: { ...current, mastrNummer: v } });
                }}
                placeholder="SEE..."
              />
            )}
          </div>
          {step8.inbetriebnahme?.mastrAngemeldet && (
            <div style={{ marginTop: 12 }}>
              <Input
                label="MaStR-Anmeldedatum"
                type="date"
                value={step8.inbetriebnahme?.mastrDatum || ''}
                onChange={(v) => {
                  const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
                  updateStep8({ inbetriebnahme: { ...current, mastrDatum: v } });
                }}
              />
            </div>
          )}
        </div>

        {/* Netzbetreiber-Meldung */}
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#6ee7b7' }}>
            Fertigmeldung an Netzbetreiber
          </div>
          <div className={styles.row}>
            <div>
              <Checkbox
                label="Beim Netzbetreiber gemeldet"
                checked={step8.inbetriebnahme?.netzbetreiberGemeldet ?? false}
                onChange={(v) => {
                  const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
                  updateStep8({ inbetriebnahme: { ...current, netzbetreiberGemeldet: v } });
                }}
              />
            </div>
            {step8.inbetriebnahme?.netzbetreiberGemeldet && (
              <Input
                label="Meldedatum"
                type="date"
                value={step8.inbetriebnahme?.netzbetreiberMeldeDatum || ''}
                onChange={(v) => {
                  const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
                  updateStep8({ inbetriebnahme: { ...current, netzbetreiberMeldeDatum: v } });
                }}
              />
            )}
          </div>
          {step8.inbetriebnahme?.netzbetreiberGemeldet && (
            <div style={{ marginTop: 8 }}>
              <Checkbox
                label="Bestätigung vom Netzbetreiber erhalten"
                checked={step8.inbetriebnahme?.netzbetreiberBestaetigung ?? false}
                onChange={(v) => {
                  const current = step8.inbetriebnahme || createDefaultInbetriebnahme();
                  updateStep8({ inbetriebnahme: { ...current, netzbetreiberBestaetigung: v } });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {alleAkzeptiert ? (
        <Alert type="success" title="Bereit zur Einreichung">
          Alle erforderlichen Angaben sind vollständig. Klicken Sie auf "Absenden" um die Anmeldung zu starten.
        </Alert>
      ) : (
        <Alert type="warning" title="Bitte bestätigen">
          Bitte akzeptieren Sie alle erforderlichen Bedingungen um fortzufahren.
        </Alert>
      )}
    </div>
  );
};

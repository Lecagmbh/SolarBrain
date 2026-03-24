/**
 * Wizard Steps - Shared Constants
 * Zentrale Definitionen für Auswahlfelder
 */

import type {
  AnlagenKategorie,
  AnlagenKomponente,
  Kundentyp,
  Ausrichtung,
  DemontageTyp,
  DemontageGrund,
  ZaehlerProzessTyp,
  FotoKategorie,
} from '../../../../types/wizard.types';

// ============================================================================
// STEP 1: KATEGORIEN & KOMPONENTEN
// ============================================================================

export const KATEGORIEN: { value: AnlagenKategorie; label: string; icon: string; desc: string }[] = [
  { value: 'einspeiser', label: 'Erzeugungsanlage', icon: '☀️', desc: 'PV, BHKW, Wind' },
  { value: 'speicher', label: 'Speicher', icon: '🔋', desc: 'Batterie' },
  { value: 'paragraph14a', label: '§14a Geräte', icon: '🔌', desc: 'Wallbox, WP' },
  { value: 'netzanschluss', label: 'Netzanschluss', icon: '⚡', desc: 'Neu/Änderung' },
  { value: 'erweiterung', label: 'Erweiterung', icon: '➕', desc: 'Bestand erweitern' },
  { value: 'inbetriebnahme', label: 'Inbetriebnahme', icon: '▶️', desc: 'Fertigmeldung' },
  { value: 'mittelspannung', label: 'Mittelspannung', icon: '🏭', desc: '>135 kVA' },
  { value: 'baustrom', label: 'Baustrom', icon: '🚧', desc: 'Temporär' },
  // Phase 2: Fehlende Prozesse
  { value: 'zaehler', label: 'Zähler', icon: '🔢', desc: 'Anmeldung/Wechsel' },
  { value: 'demontage', label: 'Demontage', icon: '🔧', desc: 'Anlage abmelden' },
  { value: 'fertigmeldung', label: 'Fertigmeldung', icon: '✅', desc: 'Nach Installation' },
];

export const KOMPONENTEN: { value: AnlagenKomponente; label: string; icon: string }[] = [
  { value: 'pv', label: 'PV-Module', icon: '☀️' },
  { value: 'speicher', label: 'Speicher', icon: '🔋' },
  { value: 'wallbox', label: 'Wallbox', icon: '🚗' },
  { value: 'waermepumpe', label: 'Wärmepumpe', icon: '🌡️' },
  { value: 'bhkw', label: 'BHKW', icon: '🔥' },
  { value: 'wind', label: 'Windkraft', icon: '💨' },
];

export const KUNDENTYPEN: { value: Kundentyp; label: string; icon: string }[] = [
  { value: 'privat', label: 'Privat', icon: '👤' },
  { value: 'gewerbe', label: 'Gewerbe', icon: '🏢' },
  { value: 'gbr', label: 'GbR', icon: '👥' },
  { value: 'weg', label: 'WEG', icon: '🏘️' },
];

// ============================================================================
// STEP 2: BUNDESLÄNDER
// ============================================================================

export const BUNDESLAENDER = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
];

// ============================================================================
// STEP 5: AUSRICHTUNGEN
// ============================================================================

export const AUSRICHTUNGEN: { value: Ausrichtung; label: string; faktor: number }[] = [
  { value: 'S', label: 'Süd', faktor: 1.0 },
  { value: 'SO', label: 'Süd-Ost', faktor: 0.95 },
  { value: 'SW', label: 'Süd-West', faktor: 0.95 },
  { value: 'O', label: 'Ost', faktor: 0.85 },
  { value: 'W', label: 'West', faktor: 0.85 },
  { value: 'NO', label: 'Nord-Ost', faktor: 0.75 },
  { value: 'NW', label: 'Nord-West', faktor: 0.75 },
  { value: 'N', label: 'Nord', faktor: 0.60 },
];

// ============================================================================
// PHASE 2: DEMONTAGE
// ============================================================================

export const DEMONTAGE_TYPEN: { value: DemontageTyp; label: string; icon: string }[] = [
  { value: 'pv_komplett', label: 'PV-Anlage komplett', icon: '☀️' },
  { value: 'pv_teilweise', label: 'PV teilweise', icon: '📉' },
  { value: 'speicher', label: 'Speicher', icon: '🔋' },
  { value: 'wechselrichter', label: 'Wechselrichter', icon: '⚡' },
  { value: 'wallbox', label: 'Wallbox', icon: '🚗' },
  { value: 'waermepumpe', label: 'Wärmepumpe', icon: '🌡️' },
  { value: 'zaehler', label: 'Zähler', icon: '🔢' },
  { value: 'eeg_anlage', label: 'EEG-Anlage', icon: '🌱' },
];

export const DEMONTAGE_GRUENDE: { value: DemontageGrund; label: string }[] = [
  { value: 'stilllegung', label: 'Dauerhafte Stilllegung' },
  { value: 'modernisierung', label: 'Modernisierung/Ersatz' },
  { value: 'defekt', label: 'Defekt/Schaden' },
  { value: 'verkauf', label: 'Immobilienverkauf' },
  { value: 'abriss', label: 'Gebäudeabriss' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

// ============================================================================
// PHASE 2: ZÄHLER-PROZESSE
// ============================================================================

export const ZAEHLER_PROZESS_TYPEN: { value: ZaehlerProzessTyp; label: string; icon: string; desc: string }[] = [
  { value: 'neuanmeldung', label: 'Zähler-Anmeldung', icon: '➕', desc: 'Neuer Zähler für Anlage' },
  { value: 'wechsel_typ', label: 'Zählerwechsel Typ', icon: '🔄', desc: 'z.B. auf Zweirichtung' },
  { value: 'wechsel_standort', label: 'Zähler versetzen', icon: '📍', desc: 'Standort ändern' },
  { value: 'wechsel_msb', label: 'MSB-Wechsel', icon: '🏢', desc: 'Messstellenbetreiber wechseln' },
  { value: 'abmeldung', label: 'Zähler-Abmeldung', icon: '➖', desc: 'Zähler entfernen' },
  { value: 'smart_meter', label: 'Smart Meter', icon: '📱', desc: 'Rollout auf iMSys' },
];

// ============================================================================
// STEP 7: FOTO-KATEGORIEN
// ============================================================================

export const FOTO_KATEGORIEN: { value: FotoKategorie; label: string; icon: string; pflicht: boolean; beschreibung: string }[] = [
  { value: 'zaehlerschrank', label: 'Zählerschrank', icon: '📦', pflicht: true, beschreibung: 'Komplette Ansicht mit offener Tür' },
  { value: 'zaehler_nahaufnahme', label: 'Zähler (Nahaufnahme)', icon: '🔢', pflicht: true, beschreibung: 'Zählerstand und Zählernummer lesbar' },
  { value: 'wechselrichter', label: 'Wechselrichter', icon: '⚡', pflicht: true, beschreibung: 'Installierter Wechselrichter mit Typenschild' },
  { value: 'speicher', label: 'Speicher', icon: '🔋', pflicht: false, beschreibung: 'Batterie-/Speichersystem' },
  { value: 'pv_module', label: 'PV-Module', icon: '☀️', pflicht: true, beschreibung: 'Installierte Module auf dem Dach' },
  { value: 'dachansicht', label: 'Dachansicht', icon: '🏠', pflicht: false, beschreibung: 'Gesamtansicht der PV-Installation' },
  { value: 'stringverkabelung', label: 'Stringverkabelung', icon: '🔌', pflicht: false, beschreibung: 'DC-Verkabelung im Detail' },
  { value: 'potentialausgleich', label: 'Potentialausgleich', icon: '⚡', pflicht: false, beschreibung: 'Erdungsverbindung' },
  { value: 'dc_freischalter', label: 'DC-Freischalter', icon: '🔘', pflicht: false, beschreibung: 'DC-Trennstelle' },
  { value: 'ac_freischalter', label: 'AC-Freischalter', icon: '🔘', pflicht: false, beschreibung: 'AC-Trennstelle' },
  { value: 'na_schutz', label: 'NA-Schutz', icon: '🛡️', pflicht: false, beschreibung: 'Netz- und Anlagenschutz' },
  { value: 'typenschild_modul', label: 'Typenschild Modul', icon: '🏷️', pflicht: true, beschreibung: 'Typenschild eines PV-Moduls' },
  { value: 'typenschild_wr', label: 'Typenschild WR', icon: '🏷️', pflicht: true, beschreibung: 'Typenschild des Wechselrichters' },
  { value: 'typenschild_speicher', label: 'Typenschild Speicher', icon: '🏷️', pflicht: false, beschreibung: 'Typenschild des Speichers' },
  { value: 'sonstiges', label: 'Sonstiges', icon: '📷', pflicht: false, beschreibung: 'Weitere relevante Fotos' },
];

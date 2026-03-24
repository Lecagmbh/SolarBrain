/**
 * Baunity Wizard - Produkt Suche Types & Constants
 *
 * Alle Typen, Interfaces und Konstanten für die Produktsuche.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ProduktTyp = 'pvModule' | 'wechselrichter' | 'speicher' | 'wallboxen' | 'waermepumpen';

export interface SmartMatchAlternative {
  produkt: ProduktDBItem;
  zerezId: string;
  reason: string;
  confidence: number;
}

export interface SmartMatchResponse {
  success: boolean;
  match: {
    source: 'produktDb' | 'zerez' | 'ai_search' | 'ai_created';
    confidence: number;
    produkt: ProduktDBItem;
    zerezId?: string;
    created: boolean;
  } | null;
  suggestions: ProduktDBItem[];
  alternative?: SmartMatchAlternative;
}

export interface ProduktDBItem {
  id: number;
  modell: string;
  herstellerId?: number;
  hersteller?: { id: number; name: string };
  leistungWp?: number;
  zelltyp?: string;
  acLeistungW?: number;
  scheinleistungVa?: number;
  phasen?: number;
  hybrid?: boolean;
  zerezId?: string;
  mppTrackerAnzahl?: number;
  maxDcEingangsstromA?: number;
  maxDcSpannungV?: number;
  mppSpannungsbereich?: string;
  acNennstromA?: number;
  verschiebungsfaktorCos?: number;
  naSchutzIntegriert?: boolean;
  kapazitaetBruttoKwh?: number;
  kapazitaetNettoKwh?: number;
  batterietyp?: string;
  kopplung?: string;
  ladeleistungMaxKw?: number;
  wirkleistungPsmaxKw?: number;
  scheinleistungSsmaxKva?: number;
  bemessungsstromIrA?: number;
  notstromfaehig?: boolean;
  ersatzstromfaehig?: boolean;
  inselnetzfaehig?: boolean;
  allpoligeTrennung?: boolean;
  naSchutzVorhanden?: boolean;
  ladeleistungKw?: number;
  steuerbar14a?: boolean;
  nennleistungKw?: number;
  typ?: string;
  datenblattUrl?: string;
  verified?: boolean;
  zerezCategory?: string; // 'INVERTER' | 'STORAGE_INVERTER' etc.
}

export interface ProduktAutocompleteProps {
  typ: ProduktTyp;
  herstellerValue: string;
  modellValue: string;
  onHerstellerChange: (value: string) => void;
  onModellChange: (value: string) => void;
  onProduktSelect?: (produkt: ProduktDBItem | null, volleDaten: any) => void;
  onManualChange?: (hersteller: string, modell: string) => void;
  onHybridDetected?: (data: {
    direction: 'wr-is-hybrid' | 'speicher-is-hybrid';
    produkt: ProduktDBItem;
    wizardData: any;
  }) => void;
  disabled?: boolean;
  label?: string;
  /** Inline mode: compact search, no TechDatenKarte after selection */
  variant?: 'default' | 'inline';
}

export interface ZerezComponent {
  id: number;
  zerezId: string;
  modelName: string;
  manufacturerName: string;
  maxActivePowerKw: number;
  ratedVoltageV?: number;
  certificateStatus?: string;
  isVde4105?: boolean;
  certificateNorm?: string;
  category?: string; // 'INVERTER' | 'STORAGE_INVERTER' etc.
}

export interface SpecItem {
  label: string;
  value: string | number | boolean | undefined | null;
  unit?: string;
  highlight?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  produktDb: { label: 'Produkt-DB', color: '#638bff', bg: 'rgba(99,139,255,0.12)', border: 'rgba(99,139,255,0.25)' },
  zerez: { label: 'ZEREZ', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  ai_search: { label: 'KI-Suche', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
  ai_created: { label: 'KI-erstellt', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
};

export const SMART_MATCH_TYPE_MAP: Record<ProduktTyp, string> = {
  pvModule: 'pvModule',
  wechselrichter: 'wechselrichter',
  speicher: 'speicher',
  wallboxen: 'wallbox',
  waermepumpen: 'waermepumpe',
};

export const PLACEHOLDER_MAP: Record<ProduktTyp, string> = {
  pvModule: 'Hersteller + Modell eingeben, Enter zum Suchen',
  wechselrichter: 'Hersteller + Modell eingeben, Enter zum Suchen',
  speicher: 'Hersteller + Modell eingeben, Enter zum Suchen',
  wallboxen: 'Hersteller + Modell eingeben, Enter zum Suchen',
  waermepumpen: 'Hersteller + Modell eingeben, Enter zum Suchen',
};

export const TYP_LABELS: Record<ProduktTyp, string> = {
  pvModule: 'PV-Modul',
  wechselrichter: 'Wechselrichter',
  speicher: 'Speicher',
  wallboxen: 'Wallbox',
  waermepumpen: 'Wärmepumpe',
};

export const API_ENDPOINTS: Record<ProduktTyp, string> = {
  pvModule: '/produkte/pv-module/autocomplete',
  wechselrichter: '/produkte/wechselrichter/autocomplete',
  speicher: '/produkte/speicher/autocomplete',
  wallboxen: '/produkte/wallboxen',
  waermepumpen: '/produkte/waermepumpen',
};

// Typen die Server-seitiges Autocomplete nutzen (NICHT alles client-seitig laden)
export const SERVER_AUTOCOMPLETE_TYPES: Partial<Record<ProduktTyp, boolean>> = {
  pvModule: true,
  wechselrichter: true,
  speicher: true,
};

// Keine ZEREZ-Kategorien mehr nötig — alles läuft über Server-Autocomplete
export const ZEREZ_CATEGORIES: Partial<Record<ProduktTyp, string>> = {};

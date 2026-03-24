/**
 * Baunity Intelligence Engine - Types
 */

export type AnmeldeSzenario =
  | 'BALKON_PV' | 'MINI_PV_EINPHASIG' | 'KLEIN_PV_STANDARD' | 'KLEIN_PV_MIT_SPEICHER'
  | 'KLEIN_PV_VOLLEINSPEISUNG' | 'MITTEL_PV_NA_SCHUTZ' | 'GROSS_PV_DIREKTVERMARKTUNG'
  | 'GROSS_PV_MITTELSPANNUNG' | 'SPEICHER_NACHRUESTUNG_DC' | 'SPEICHER_NACHRUESTUNG_AC'
  | 'SPEICHER_STANDALONE' | 'WALLBOX_UNTER_4KW' | 'WALLBOX_STEUERBAR' | 'WAERMEPUMPE_STEUERBAR'
  | 'WALLBOX_UND_WP_STEUERBAR' | 'WALLBOX_MIT_PV' | 'WP_MIT_PV' | 'KOMPLETT_SYSTEM'
  | 'HAUSANSCHLUSS_NEU' | 'BAUSTROM_TEMPORAER' | 'BHKW_KLEIN' | 'BHKW_GROSS'
  | 'WINDKRAFT_KLEIN' | 'INSELANLAGE' | 'NULLEINSPEISUNG' | 'MEHRERE_ANLAGEN'
  | 'MIETERSTROMMODELL' | 'EIGENVERBRAUCHSGEMEINSCHAFT'
  // Phase 2: Neue Prozesse
  | 'DEMONTAGE_ANLAGE' | 'ZAEHLER_PROZESS' | 'FERTIGMELDUNG';

export interface SzenarioConfig {
  name: string;
  beschreibung: string;
  steps: Record<string, boolean>;
  technikFelder: Record<string, boolean>;
  kundenFelder: Record<string, boolean>;
  dokumente: Record<string, boolean>;
  validierung: Record<string, boolean>;
  verfahren: { typ: string; fristWochen: number; genehmigungPflicht: boolean; vdeNorm: string; };
  finanzen: { eegVerguetung: boolean; eegVerguetungCent?: number; paragraph14aRabatt: boolean; paragraph14aEuroJahr?: number; direktvermarktungPflicht: boolean; };
  hinweise: string[];
  warnungen: string[];
}

export interface AITipp {
  id: string;
  typ: 'info' | 'erfolg' | 'warnung' | 'fehler' | 'geld';
  titel: string;
  text: string;
  step?: number;
  aktion?: { label: string; onClick: () => void; };
  prioritaet?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export interface NBAnforderung {
  nbId: string;
  nbName: string;
  besonderheiten: string[];
  portalUrl?: string;
  formulare: string[];
  bearbeitungszeit: string;
  kontakt?: { email?: string; telefon?: string; };
}

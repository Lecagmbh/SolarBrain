/**
 * Baunity Unified Document Generator Types
 * ==========================================
 * Einheitliche Typen für alle Dokument-Generatoren
 * Verwendet von Wizard UND Dokumenten-Tab
 */

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Einheitliche Adresse */
export interface UnifiedAddress {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  bundesland?: string;
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;
}

/** Einheitliche Kundendaten */
export interface UnifiedCustomer {
  anrede?: string;
  vorname: string;
  nachname: string;
  firma?: string;
  email?: string;
  telefon?: string;
  geburtsdatum?: string;
}

/** PV-Modul/Dachfläche */
export interface UnifiedPVModule {
  name?: string;
  hersteller: string;
  modell: string;
  anzahl: number;
  leistungWp: number;
  ausrichtung?: string;
  neigung?: number;
}

/** Wechselrichter */
export interface UnifiedInverter {
  hersteller: string;
  modell: string;
  leistungKva: number;
  anzahl: number;
  zerezId?: string;
  napiId?: string;
}

/** Speicher */
export interface UnifiedStorage {
  hersteller: string;
  modell: string;
  kapazitaetKwh: number;
  leistungKw?: number;
  anzahl: number;
  kopplung: 'ac' | 'dc';
  zerezId?: string;
}

/** Wallbox */
export interface UnifiedWallbox {
  hersteller?: string;
  modell?: string;
  leistungKw: number;
  anzahl: number;
}

/** Wärmepumpe */
export interface UnifiedHeatPump {
  hersteller?: string;
  modell?: string;
  leistungKw: number;
}

/** Netzbetreiber */
export interface UnifiedGridOperator {
  name: string;
  id?: number;
  portalUrl?: string;
}

/** Messkonzept Typen */
export type Messkonzept =
  | 'zweirichtung'
  | 'volleinspeisung'
  | 'ueberschuss'
  | 'kaskade'
  | 'eigenverbrauch';

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED INSTALLATION DATA - Hauptinput für alle Generatoren
// ═══════════════════════════════════════════════════════════════════════════

export interface UnifiedInstallationData {
  // Identifikation
  id?: number;
  publicId?: string;

  // Kunde
  kunde: UnifiedCustomer;

  // Standort (Anlagenadresse)
  standort: UnifiedAddress;

  // Rechnungsadresse (falls abweichend)
  rechnungsadresse?: UnifiedAddress;

  // Technische Daten
  pvModule: UnifiedPVModule[];
  wechselrichter: UnifiedInverter[];
  speicher: UnifiedStorage[];
  wallboxen: UnifiedWallbox[];
  waermepumpen: UnifiedHeatPump[];

  // Berechnete Werte
  gesamtleistungKwp: number;
  gesamtleistungKva: number;
  speicherKapazitaetKwh: number;

  // Netz
  netzbetreiber?: UnifiedGridOperator;
  zaehlernummer?: string;
  zaehlpunktbezeichnung?: string;
  messkonzept: Messkonzept;

  // NA-Schutz
  napiErforderlich: boolean;

  // Termine
  geplantesIBNDatum?: string;

  // Vollmacht
  vollmachtErteilt?: boolean;
  mastrRegistrierung?: boolean;

  // Meta
  erstelltAm?: string;
  erstelltVon?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DokumentTyp =
  | 'schaltplan'
  | 'lageplan'
  | 'vde_e1'
  | 'vde_e2'
  | 'vde_e3'
  | 'vde_e8'
  | 'vollmacht'
  | 'projektmappe';

export type DokumentKategorie =
  | 'SCHALTPLAN'
  | 'LAGEPLAN'
  | 'VDE_E1'
  | 'VDE_E2'
  | 'VDE_E3'
  | 'VDE_E8'
  | 'VOLLMACHT'
  | 'PROJEKTMAPPE';

export interface GeneratedDocument {
  typ: DokumentTyp;
  kategorie: DokumentKategorie;
  name: string;
  filename: string;
  blob: Blob;
  mimeType: 'application/pdf' | 'image/svg+xml';
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERATOR OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface GeneratorOptions {
  /** Installateurausweis auf Dokumenten anzeigen */
  showInstallerBadge?: boolean;
  /** Admin-Modus (erweiterte Optionen) */
  isAdmin?: boolean;
  /** Datum überschreiben */
  customDate?: Date;
  /** Plannummer überschreiben */
  customPlanNumber?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY CONFIG (aus zentraler Config)
// ═══════════════════════════════════════════════════════════════════════════

export interface CompanyConfig {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  web?: string;
  // Installateur-Registrierungen
  installateurId?: string;
  installateurAusweis?: string;
  // Zertifizierungen
  zerezId?: string;
}

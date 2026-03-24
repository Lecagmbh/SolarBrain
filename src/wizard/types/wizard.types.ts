/**
 * Baunity Wizard V12 - Type Definitions
 * ======================================
 * Mit Support für:
 * - Mehrere Dachflächen/Strings
 * - Mehrere Wechselrichter
 * - Mehrere Speicher
 * - Mehrere Wallboxen
 * - Intelligente Validierung
 */

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

export type AnlagenKategorie =
  | 'netzanschluss'
  | 'einspeiser'
  | 'erweiterung'
  | 'paragraph14a'
  | 'verbraucher'
  | 'strassenland'
  | 'mittelspannung'
  | 'baustrom'
  | 'speicher'
  | 'inbetriebnahme'
  | 'inselanlage'
  | 'bhkw'
  | 'wind'
  // Phase 2: Fehlende Prozesse
  | 'demontage'        // Anlagen-/Zählerdemontage
  | 'zaehler'          // Zähler-Anmeldung, Wechsel, Abmeldung
  | 'fertigmeldung';   // Fertigmeldung an Netzbetreiber

export type Vorgangsart =
  | 'neuanmeldung'
  | 'erweiterung'
  | 'aenderung'
  | 'inbetriebnahme'
  | 'stilllegung'
  | 'verlaengerung'
  | 'demontage'
  // Phase 2: Erweiterte Vorgangsarten
  | 'zaehler_anmeldung'    // Neuer Zähler anmelden
  | 'zaehler_wechsel'      // Zählerwechsel (z.B. auf Zweirichtung)
  | 'zaehler_abmeldung'    // Zähler abmelden
  | 'fertigmeldung'        // Fertigmeldung nach Installation
  | 'anlagen_demontage'    // PV/Speicher Demontage
  | 'eeg_demontage';       // EEG-Anlage Demontage

export type AnlagenKomponente = 
  | 'pv'
  | 'speicher'
  | 'wallbox'
  | 'waermepumpe'
  | 'klimaanlage'
  | 'bhkw'
  | 'wind'
  | 'sonstige';

export type Groessenklasse = 
  | 'balkon'
  | 'mini'
  | 'klein'
  | 'mittel'
  | 'gross'
  | 'gewerbe'
  | 'ms'
  | 'aenderung';

export type Einspeiseart = 
  | 'ueberschuss'
  | 'volleinspeisung'
  | 'nulleinspeisung'
  | 'insel';

export type Kundentyp = 
  | 'privat'
  | 'gewerbe'
  | 'gbr'
  | 'verein'
  | 'kommune'
  | 'weg';

export type Messkonzept = 
  | 'zweirichtung'
  | 'kaskade'
  | 'wandler'
  | 'rlm';

export type Netzebene = 
  | 'niederspannung'
  | 'mittelspannung';

export type Paragraph14aModul = 
  | 'modul1'
  | 'modul2'
  | 'modul3';

export type Ausrichtung = 'N' | 'NO' | 'O' | 'SO' | 'S' | 'SW' | 'W' | 'NW';

// ============================================================================
// ZÄHLER-TYPES (NEU - Phase 1.1)
// ============================================================================

export type ZaehlerTyp =
  | 'einrichtung'      // Nur Bezug
  | 'zweirichtung'     // Bezug + Einspeisung
  | 'wandlermessung'   // > 63A mit Wandler
  | 'rlm';             // Registrierende Leistungsmessung

export type ZaehlerStandort =
  | 'hausanschluss'    // Im HAK
  | 'keller'           // Keller-Zählerschrank
  | 'technikraum'      // Technikraum
  | 'garage'           // Garage
  | 'outdoor'          // Außen (Baustrom etc.)
  | 'zaehlerplatz';    // Zählerplatz im Gebäude

export type ZaehlerEigentum =
  | 'netzbetreiber'    // Standard
  | 'messstellenbetreiber'  // Dritter MSB
  | 'kunde';           // Kundeneigene Messung (selten)

export type TarifArt =
  | 'eintarif'         // ET
  | 'zweitarif'        // HT/NT
  | 'ht_nt_wp';        // HT/NT + Wärmepumpe

export interface ZaehlerData {
  // Bestehender Zähler
  vorhanden: boolean;
  zaehlernummer?: string;
  zaehlpunktbezeichnung?: string;  // DE0001234567890123456789012345678
  marktlokationsId?: string;       // MaLo-ID

  // Zählerdetails
  typ: ZaehlerTyp;
  standort: ZaehlerStandort;
  eigentum: ZaehlerEigentum;
  tarifart: TarifArt;

  // Smart Metering
  fernauslesung: boolean;
  smartMeterGateway: boolean;
  imsysGewuenscht: boolean;        // Intelligentes Messsystem gewünscht

  // Aktueller Stand (für Zählerwechsel)
  zaehlerstdBezug?: number;        // kWh Bezug
  zaehlerstdEinspeisung?: number;  // kWh Einspeisung (falls Zweirichtung)
  ablesedatum?: string;            // ISO Date

  // Für Neuanschluss/Änderung
  gewuenschterTyp?: ZaehlerTyp;
  gewuenschterStandort?: ZaehlerStandort;

  // Für Zählerwechsel
  wechselGrund?: 'neuanlage' | 'erweiterung' | 'defekt' | 'eichfrist' | 'tarifwechsel';
  altZaehlernummer?: string;
}

// ============================================================================
// MULTI-ZÄHLER TYPES (NEU - Multi-Meter Support)
// ============================================================================

/**
 * Aktion für bestehende Zähler
 * - behalten: Zähler bleibt unverändert
 * - abmelden: Zähler wird abgemeldet/demontiert
 * - zusammenlegen: Zähler wird mit neuem Zähler zusammengelegt
 */
export type ZaehlerAktion = 'behalten' | 'abmelden' | 'zusammenlegen';

/**
 * Befestigungsart für neuen Zähler
 */
export type ZaehlerBefestigung =
  | 'dreipunkt'       // Dreipunktbefestigung (Standard)
  | 'hutschiene'      // Hutschienenmontage
  | 'anreihzaehler';  // Anreihzähler

/**
 * Einzelner bestehender Zähler im Bestand
 * Unterstützt mehrere Zähler pro Anschluss (z.B. Haushalt + Wärmepumpe)
 */
export interface ZaehlerBestandItem {
  id: string;

  // Identifikation
  zaehlernummer: string;
  zaehlpunktbezeichnung?: string;  // DE0001234567890123456789012345678
  marktlokationsId?: string;       // MaLo-ID

  // Zählerdetails
  typ: ZaehlerTyp;
  standort: ZaehlerStandort;
  tarifart: TarifArt;

  // Zählerstand für Wechsel/Abmeldung
  letzterStand?: number;           // kWh (Bezug bei Einrichtung, netto bei Zweirichtung)
  letzterStandEinspeisung?: number; // kWh Einspeisung (falls Zweirichtung)
  ablesedatum?: string;            // ISO Date

  // Verwendungszweck (Info)
  verwendung?: string;             // z.B. "Haushalt", "Wärmepumpe", "Allgemeinstrom"

  // Aktion bei Neuanmeldung
  aktion: ZaehlerAktion;
}

/**
 * Konfiguration für den neuen Zähler
 * Wird bei Neuanmeldung/Erweiterung/Zusammenlegung benötigt
 */
export interface ZaehlerNeuData {
  // Gewünschter Zählertyp
  gewuenschterTyp: ZaehlerTyp;

  // Standort
  standort: ZaehlerStandort;
  befestigung: ZaehlerBefestigung;

  // Tarif
  tarifart: TarifArt;

  // Smart Metering
  imsysGewuenscht: boolean;        // Intelligentes Messsystem gewünscht

  // Für welche Anlage?
  fuerAnlage: 'pv' | 'speicher' | 'wallbox' | 'waermepumpe' | 'allgemeinstrom' | 'sonstige';
  fuerAnlageSonstige?: string;     // Falls "sonstige" gewählt

  // Zusammenlegung
  zusammenlegungVon: string[];     // IDs der Zähler die zusammengelegt werden

  // MSB-Wunsch
  wunschMsb?: 'grundzustaendig' | 'wettbewerblich';
  msbName?: string;                // Falls wettbewerblicher MSB
}

// Default Factory Functions für Multi-Zähler

export const createDefaultZaehlerBestandItem = (
  nummer: string = '',
  verwendung: string = 'Haushalt'
): ZaehlerBestandItem => ({
  id: generateId(),
  zaehlernummer: nummer,
  typ: 'einrichtung',
  standort: 'keller',
  tarifart: 'eintarif',
  verwendung,
  aktion: 'behalten',
});

export const createDefaultZaehlerNeu = (): ZaehlerNeuData => ({
  gewuenschterTyp: 'zweirichtung',
  standort: 'keller',
  befestigung: 'dreipunkt',
  tarifart: 'eintarif',
  imsysGewuenscht: false,
  fuerAnlage: 'pv',
  zusammenlegungVon: [],
});

// ============================================================================
// NETZANSCHLUSS-TYPES (NEU - Phase 1.1)
// ============================================================================

export type Erdungsart = 'TN-C' | 'TN-S' | 'TN-C-S' | 'TT' | 'IT';

export type AbsicherungA = 25 | 35 | 50 | 63 | 80 | 100 | 125 | 160 | 200 | 250 | 315 | 400;

export interface NetzanschlussData {
  // Bestehender Anschluss
  hakId?: string;                  // Hausanschlusskasten ID
  bestehendeLeistungKw?: number;
  bestehendeAbsicherungA?: AbsicherungA;
  hausanschlusskastenTyp?: string; // z.B. "NH00", "SLS 63A"

  // Netzparameter (vom NB)
  erdungsart?: Erdungsart;
  kurzschlussleistungMVA?: number;
  netzimpedanzOhm?: number;

  // Gewünschte Änderung
  gewuenschteLeistungKw?: number;
  gewuenschteAbsicherungA?: AbsicherungA;
  leistungserhoehungGrund?: string;
}

// ============================================================================
// PRÜFPROTOKOLL-TYPES (NEU - für E.8 IBN)
// ============================================================================

export interface PruefungIsolation {
  durchgefuehrt: boolean;
  wertMOhm?: number;               // Messwert in MΩ
  ergebnis?: 'bestanden' | 'nicht_bestanden';
  pruefgeraet?: string;
}

export interface PruefungErdung {
  durchgefuehrt: boolean;
  wertOhm?: number;                // Messwert in Ω
  ergebnis?: 'bestanden' | 'nicht_bestanden';
}

export interface PruefungSchleifenimpedanz {
  durchgefuehrt: boolean;
  wertOhm?: number;
  abschaltzeit_ms?: number;
  ergebnis?: 'bestanden' | 'nicht_bestanden';
}

export interface PruefungRCD {
  durchgefuehrt: boolean;
  ausloesezeit_ms?: number;        // Soll < 300ms bei 1x IΔn
  ausloesstrom_mA?: number;        // 30mA oder 300mA
  ergebnis?: 'bestanden' | 'nicht_bestanden';
}

export interface PruefungNASchutz {
  durchgefuehrt: boolean;
  einstellwertSpannung_V?: number;   // z.B. 253V
  einstellwertFrequenz_Hz?: number;  // z.B. 51.5Hz
  ausloesezeit_ms?: number;
  ergebnis?: 'bestanden' | 'nicht_bestanden';
}

export interface PruefprotokollData {
  // Prüfdatum
  pruefDatum: string;               // ISO Date
  prueferName?: string;             // Name des Prüfers
  installateurausweisNr?: string;   // Eintragungsnummer (nur Admin)

  // Einzelne Prüfungen
  isolationsmessung: PruefungIsolation;
  erdungsmessung: PruefungErdung;
  schleifenimpedanz: PruefungSchleifenimpedanz;
  rcdPruefung: PruefungRCD;
  naSchutzPruefung: PruefungNASchutz;

  // Sichtprüfungen
  sichtpruefungBestanden: boolean;
  schutzleiterVorhanden: boolean;
  kennzeichnungVollstaendig: boolean;
  dokumentationVollstaendig: boolean;

  // Gesamtergebnis
  gesamtErgebnis: 'bestanden' | 'maengel' | 'nicht_bestanden';
  bemerkungen?: string;
}

// ============================================================================
// IBN-DATEN TYPES (NEU - Inbetriebnahme)
// ============================================================================

export interface InbetriebnahmeData {
  // Termine
  geplantesIbnDatum?: string;       // ISO Date - geplant
  tatsaechlichesIbnDatum?: string;  // ISO Date - durchgeführt
  eegInbetriebnahme?: string;       // ISO Date - für MaStR/EEG

  // Anmeldungen
  mastrAngemeldet: boolean;
  mastrNummer?: string;
  mastrDatum?: string;

  netzbetreiberGemeldet: boolean;
  netzbetreiberMeldeDatum?: string;
  netzbetreiberBestaetigung?: boolean;

  // Status
  ibnStatus: 'geplant' | 'beantragt' | 'freigegeben' | 'durchgefuehrt' | 'abgenommen';

  // Protokoll
  pruefprotokoll?: PruefprotokollData;
}

// ============================================================================
// FOTO-UPLOAD TYPES (NEU - Erweiterte Kategorien)
// ============================================================================

export type FotoKategorie =
  // Pflichtfotos (viele NB verlangen diese)
  | 'zaehlerschrank'           // Zählerschrank komplett
  | 'zaehler_nahaufnahme'      // Zähler mit Nummer lesbar
  | 'wechselrichter'           // WR mit Typenschild
  | 'speicher'                 // Speicher mit Typenschild

  // Anlage
  | 'pv_module'                // Module auf dem Dach
  | 'dachansicht'              // Gesamtansicht Dach
  | 'stringverkabelung'        // String-Verkabelung
  | 'potentialausgleich'       // PA-Schiene

  // Sicherheit
  | 'dc_freischalter'          // DC-Trennstelle
  | 'ac_freischalter'          // AC-Trennstelle
  | 'na_schutz'                // NA-Schutz Einstellung

  // Dokumentation
  | 'typenschild_modul'        // Typenschild PV-Modul
  | 'typenschild_wr'           // Typenschild Wechselrichter
  | 'typenschild_speicher'     // Typenschild Speicher

  // Sonstige
  | 'sonstiges';

export interface FotoUpload {
  id: string;
  kategorie: FotoKategorie;
  filename: string;
  url: string;
  uploadedAt: Date;
  beschreibung?: string;
  istPflicht: boolean;
}

// ============================================================================
// PHASE 2: FEHLENDE PROZESSE - DATENSTRUKTUREN
// ============================================================================

/**
 * Demontage-Daten
 * Für Anlagen- oder Zähler-Demontage
 */
export type DemontageGrund =
  | 'stilllegung'          // Anlage wird dauerhaft stillgelegt
  | 'modernisierung'       // Ersatz durch neue Anlage
  | 'defekt'               // Defekte Anlage
  | 'verkauf'              // Immobilienverkauf
  | 'abriss'               // Gebäudeabriss
  | 'sonstiges';

export type DemontageTyp =
  | 'pv_komplett'          // Komplette PV-Anlage
  | 'pv_teilweise'         // Teildemontage (z.B. nur Module)
  | 'speicher'             // Nur Speicher
  | 'wechselrichter'       // Nur Wechselrichter
  | 'wallbox'              // Wallbox
  | 'waermepumpe'          // Wärmepumpe
  | 'zaehler'              // Zählerdemontage
  | 'eeg_anlage';          // EEG-Anlage komplett

export interface DemontageData {
  typ: DemontageTyp;
  grund: DemontageGrund;
  grundSonstiges?: string;

  // Anlage-Identifikation
  mastrNummer?: string;           // MaStR-Nummer der zu demontierenden Anlage
  eegAnlagenId?: string;          // EEG-Anlagen-ID
  altZaehlernummer?: string;      // Zählernummer falls Zählerdemontage

  // Termine
  gewuenschtesDatum?: string;     // Gewünschtes Demontage-Datum
  letzterBetriebstag?: string;    // Letzter Tag mit Einspeisung

  // Leistungsdaten der zu demontierenden Anlage
  leistungKwp?: number;           // Bei PV
  leistungKva?: number;           // Bei WR
  speicherKwh?: number;           // Bei Speicher

  // Status
  netzbetreiberInformiert: boolean;
  mastrAbgemeldet: boolean;
  ablesungDurchgefuehrt: boolean;

  // Zusatz
  entsorgungsnachweis?: boolean;
  bemerkungen?: string;
}

/**
 * Zähler-Prozess-Daten
 * Für Zähleranmeldung, -wechsel, -abmeldung
 */
export type ZaehlerProzessTyp =
  | 'neuanmeldung'         // Neuer Zähler (z.B. bei Neuanlage)
  | 'wechsel_typ'          // Wechsel Zählertyp (Ein→Zwei-Richtung)
  | 'wechsel_standort'     // Zähler versetzen
  | 'wechsel_msb'          // Messstellenbetreiber wechseln
  | 'abmeldung'            // Zähler abmelden (Demontage)
  | 'smart_meter';         // Rollout auf Smart Meter

export interface ZaehlerProzessData {
  prozessTyp: ZaehlerProzessTyp;

  // Bestehender Zähler (bei Wechsel/Abmeldung)
  altZaehlernummer?: string;
  altZaehlpunkt?: string;
  altZaehlertyp?: ZaehlerTyp;
  altZaehlerstand?: number;
  altAblesedatum?: string;

  // Neuer Zähler (bei Anmeldung/Wechsel)
  neuZaehlertyp?: ZaehlerTyp;
  neuStandort?: ZaehlerStandort;
  neuTarifart?: TarifArt;

  // MSB
  wunschMsb?: 'grundzustaendig' | 'wettbewerblich';
  msbName?: string;

  // Smart Meter
  imsysGewuenscht?: boolean;
  steuerboxGewuenscht?: boolean;

  // Grund
  grund?: string;

  // Termine
  gewuenschtesDatum?: string;

  // Status
  antragGestellt: boolean;
  antragDatum?: string;
  genehmigt?: boolean;
  genehmigungDatum?: string;
}

/**
 * Fertigmeldung-Daten
 * Nach Abschluss der Installation
 */
export interface FertigmeldungData {
  // Meldetermine
  installationAbgeschlossen: boolean;
  installationDatum?: string;

  // Netzbetreiber-Meldung
  netzbetreiberMeldung: boolean;
  netzbetreiberMeldeDatum?: string;
  netzbetreiberTicketNr?: string;
  netzbetreiberFreigabe?: boolean;
  netzbetreiberFreigabeDatum?: string;

  // MaStR
  mastrGemeldet: boolean;
  mastrMeldeDatum?: string;
  mastrNummer?: string;

  // EEG-Meldung (falls relevant)
  eegMeldung?: boolean;
  eegMeldeDatum?: string;
  eegAnlagenId?: string;

  // Zähler
  zaehlerGesetzt: boolean;
  zaehlerSetzdatum?: string;
  neueZaehlernummer?: string;
  ersterZaehlerstand?: number;

  // Prüfungen
  erstpruefungDurchgefuehrt: boolean;
  erstpruefungDatum?: string;
  pruefprotokollVorhanden: boolean;

  // Inbetriebnahme
  ibnFreigabe: boolean;
  ibnDatum?: string;

  // Dokumente
  unterlagenVollstaendig: boolean;
  fehlendeUnterlagen?: string[];

  bemerkungen?: string;
}

// Default Factory Functions für Phase 2

export const createDefaultDemontage = (): DemontageData => ({
  typ: 'pv_komplett',
  grund: 'stilllegung',
  netzbetreiberInformiert: false,
  mastrAbgemeldet: false,
  ablesungDurchgefuehrt: false,
});

export const createDefaultZaehlerProzess = (): ZaehlerProzessData => ({
  prozessTyp: 'neuanmeldung',
  antragGestellt: false,
});

export const createDefaultFertigmeldung = (): FertigmeldungData => ({
  installationAbgeschlossen: false,
  netzbetreiberMeldung: false,
  mastrGemeldet: false,
  zaehlerGesetzt: false,
  erstpruefungDurchgefuehrt: false,
  pruefprotokollVorhanden: false,
  ibnFreigabe: false,
  unterlagenVollstaendig: false,
});

// ============================================================================
// KOMPONENTEN-DATEN (Mit ID für Mehrfach-Support)
// ============================================================================

export interface DachflaecheData {
  id: string;
  name: string;
  modulHersteller: string;
  modulModell: string;
  modulLeistungWp: number;
  modulAnzahl: number;
  ausrichtung: Ausrichtung;
  neigung: number;
  stringAnzahl?: number;
  moduleProString?: number;
  verschattung?: 'keine' | 'gering' | 'mittel' | 'stark';
}

export interface WechselrichterData {
  id: string;
  produktId?: number;
  hersteller: string;
  modell: string;
  leistungKw: number;      // Wirkleistung in kW (aus ZEREZ: max_active_power_kw)
  leistungKva: number;     // Scheinleistung in kVA
  anzahl: number;
  zerezId?: string;        // ZEREZ Zertifikatsnummer
  mpptAnzahl?: number;
  hybrid?: boolean;
  angeschlosseneDachflaechen?: string[];
}

export interface SpeicherData {
  id: string;
  produktId?: number;
  hersteller: string;
  modell: string;
  kapazitaetKwh: number;
  leistungKw?: number;
  scheinleistungKva?: number;  // E.3: Scheinleistung Umrichter Stromspeicher SSmax
  bemessungsstromA?: number;   // E.3: Bemessungsstrom (AC) Ir
  anzahl: number;
  kopplung: 'ac' | 'dc';
  notstrom?: boolean;
  ersatzstrom?: boolean;
  angeschlossenerWR?: string;
  
  // E.3 Speicher-Formular Felder
  inselnetzBildend?: boolean;           // Inselnetz bildendes System nach VDE-AR-E 2510-2
  anschlussPhase?: 'L1' | 'L2' | 'L3' | 'drehstrom';  // Wechselstrom L1/L2/L3 oder Drehstrom
  allpoligeTrennung?: boolean;          // Allpolige Trennung vom öff. Netz bei Netzersatzbetrieb
  naSchutzVorhanden?: boolean;          // NA-Schutz nach VDE-AR-N 4105 vorhanden
  
  // Umrichter des Speichersystems (wenn separater Umrichter)
  umrichterHersteller?: string;
  umrichterTyp?: string;
  umrichterAnzahl?: number;
  verschiebungsfaktorCos?: number;      // cos φ (Bezug)
}

export interface WallboxData {
  id: string;
  produktId?: number;
  hersteller: string;
  modell: string;
  leistungKw: number;
  anzahl: number;
  steuerbar14a: boolean;
  phasen?: 1 | 3;
  steckdose?: 'Typ2' | 'Typ1' | 'Schuko';
}

export interface WaermepumpeData {
  id: string;
  produktId?: number;
  hersteller: string;
  modell: string;
  leistungKw: number;
  typ: 'Luft' | 'Wasser' | 'Sole';
  sgReady?: boolean;
  steuerbar14a: boolean;
}

export interface BHKWData {
  id: string;
  hersteller: string;
  modell: string;
  leistungElektrischKw: number;
  leistungThermischKw?: number;
  brennstoff: 'erdgas' | 'biogas' | 'oel' | 'holz';
}

export interface WindkraftData {
  id: string;
  hersteller: string;
  modell: string;
  leistungKw: number;
  nabenhoehe?: number;
  rotordurchmesser?: number;
}

// ============================================================================
// WIZARD STEP DATA
// ============================================================================

export interface WizardStep1Data {
  kategorie: AnlagenKategorie | null;
  vorgangsart: Vorgangsart | null;
  komponenten: AnlagenKomponente[];
  groessenklasse: Groessenklasse | null;

  // Phase 2: Prozessspezifische Daten (optional)
  demontage?: DemontageData;
  zaehlerProzess?: ZaehlerProzessData;
  fertigmeldung?: FertigmeldungData;
}

export interface WizardStep2Data {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  bundesland: string;
  land: string;
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;
  zusatz?: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface WizardStep3Data {
  istEigentuemer: boolean | null;
  zustimmungVorhanden: boolean;
  eigentuemer?: {
    name: string;
    adresse: string;
    email?: string;
    telefon?: string;
  };
}

export interface WizardStep4Data {
  // Netzbetreiber
  netzbetreiberId?: string;
  netzbetreiberName?: string;
  netzbetreiberManuell?: string;

  // Legacy Felder (für Kompatibilität)
  zaehlernummer?: string;
  zaehlpunktbezeichnung?: string;
  marktlokationsId?: string;
  bestehendeAnschlussleistung?: number;

  // NEU: Zähler-Daten (Phase 1.1) - optional für Backward-Compatibility
  zaehler?: ZaehlerData;

  // NEU: Multi-Zähler Support - Bestand (alle vorhandenen Zähler)
  zaehlerBestand?: ZaehlerBestandItem[];

  // NEU: Multi-Zähler Support - Neuer Zähler Konfiguration
  zaehlerNeu?: ZaehlerNeuData;

  // NEU: Netzanschluss-Daten (Phase 1.1) - optional für Backward-Compatibility
  netzanschluss?: NetzanschlussData;
}

export interface WizardStep5Data {
  // Multi-Komponenten Arrays
  dachflaechen: DachflaecheData[];
  wechselrichter: WechselrichterData[];
  speicher: SpeicherData[];
  wallboxen: WallboxData[];
  waermepumpen: WaermepumpeData[];
  bhkw: BHKWData[];
  windkraft: WindkraftData[];
  
  // Allgemeine Einstellungen
  einspeiseart: Einspeiseart | null;
  messkonzept: Messkonzept | null;
  paragraph14a: {
    relevant: boolean;
    modul?: Paragraph14aModul;
  };
  
  // E.2 Datenblatt Betriebsweise
  betriebsweise: {
    inselbetrieb: boolean;            // Inselbetrieb vorgesehen?
    motorischerAblauf: boolean;       // Motorischer Ablauf vorgesehen?
    ueberschusseinspeisung: boolean;  // Lieferung in das Netz (Überschusseinspeisung)?
    volleinspeisung: boolean;         // Einspeisung der gesamten Energie (Volleinspeisung)?
  };
  
  // E.2 Netzeinspeisung Phasen
  netzeinspeisungPhasen: '1-phasig' | '2-phasig' | '3-phasig' | 'drehstrom' | null;
  
  // E.2/E.3 Blindleistungskompensation
  blindleistungskompensation: {
    vorhanden: boolean;
    anzahlStufen?: number;
    blindleistungKleinsteKvar?: number;
    verdrosselungsgrad?: string;
  };
  
  // E.3/E.8 Einspeisemanagement
  einspeisemanagement: {
    ferngesteuert: boolean;              // ferngesteuert: ja/nein
    dauerhaftBegrenzt: boolean;          // dauerhaft auf % begrenzt
    begrenzungProzent?: number;          // % Begrenzung (z.B. 70)
  };
  
  // Berechnete Werte
  gesamtleistungKwp?: number;
  gesamtleistungKva?: number;
  gesamtSpeicherKwh?: number;
  dcAcRatio?: number;
  
  // Netzebene
  netzebene?: Netzebene;
  naSchutzErforderlich?: boolean;
  
  // Spezielle Szenarien
  mieterstrom?: boolean;
  energySharing?: boolean;
  mehrereAnlagen?: boolean;
  
  // Geplantes Datum
  geplanteIBN?: string;
  
  // Legacy-Support
  pvModule?: { hersteller: string; modell: string; leistungWp: number; anzahl: number; };
  wallbox?: WallboxData;
  waermepumpe?: WaermepumpeData;
}

export interface WizardStep6Data {
  kundentyp: Kundentyp | null;
  firma?: string;
  anrede?: 'herr' | 'frau' | 'divers';
  titel?: string;
  vorname: string;
  nachname: string;
  geburtsdatum?: string;
  email: string;
  telefon: string;
  mobiltelefon?: string;
  rechnungGleichStandort: boolean;
  rechnungsadresse?: {
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;
  };
  // Bankverbindung (optional - für Einspeisevergütung)
  iban?: string;
  bic?: string;
  kontoinhaber?: string;
  // Registernummern (optional - falls bereits vorhanden)
  mastrNummer?: string;           // MaStR-Nummer bestehender Anlagen
  eegAnlagenschluessel?: string;  // EEG-Anlagenschlüssel (12-stellig)
}

export interface DokumentUpload {
  id: string;
  name: string;
  filename: string;
  uploadedAt: Date;
  url: string;
  // Erweiterte Kategorien für DokumentenCenter-Kompatibilität
  kategorie: 
    | 'vde' | 'technik' | 'sonstige' | '14a'  // Alte Kategorien (Kompatibilität)
    | 'vde_e1' | 'vde_e2' | 'vde_e3' | 'vde_e8'  // VDE-Formulare
    | 'schaltplan' | 'lageplan' | 'stringplan' | 'projektmappe'  // Technische Pläne
    | 'vollmacht' | 'messkonzept'  // Weitere
    | 'datenblatt_module' | 'datenblatt_wechselrichter' | 'datenblatt_speicher';  // Datenblätter
}

export interface WizardStep7Data {
  dokumente: DokumentUpload[];
  generierteSchaltplan?: string;
  generierterLageplan?: string;

  // NEU: Foto-Uploads (Phase 1.4) - optional für Backward-Compatibility
  fotos?: FotoUpload[];
}

export interface WizardStep8Data {
  // Rechtliche Zustimmungen
  vollmachtErteilt: boolean;
  signatur?: string;
  agbAkzeptiert: boolean;
  datenschutzAkzeptiert: boolean;

  // MaStR
  mastrVoranmeldung: boolean;

  // NEU: Kundenportal für Endkunde anlegen
  kundenportalAnlegen?: boolean;

  // NEU: Inbetriebnahme-Daten (Phase 1.2) - optional für Backward-Compatibility
  inbetriebnahme?: InbetriebnahmeData;
}

export interface WizardData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'rejected';
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3: WizardStep3Data;
  step4: WizardStep4Data;
  step5: WizardStep5Data;
  step6: WizardStep6Data;
  step7: WizardStep7Data;
  step8: WizardStep8Data;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type Komponente = AnlagenKomponente;

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: string;
  required: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// INTELLIGENZ-TYPEN
// ============================================================================

export interface DCACRatioWarning {
  ratio: number;
  status: 'optimal' | 'akzeptabel' | 'warnung' | 'kritisch';
  message: string;
}

export interface StringBerechnung {
  dachflaecheId: string;
  empfohleneStrings: number;
  moduleProString: number;
  stringSpannung: number;
  hinweise: string[];
}

export interface KompatibilitaetsPruefung {
  kompatibel: boolean;
  probleme: string[];
  empfehlungen: string[];
}

export interface ErtragPrognoseResult {
  jahresertragKwh: number;
  spezifischerErtrag: number;
  eigenverbrauchOhneSpeicher: number;
  eigenverbrauchMitSpeicher?: number;
  co2Ersparnis: number;
  details: { dachflaecheId: string; name: string; ertragKwh: number; anteil: number; }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUSRICHTUNG_FAKTOREN: Record<Ausrichtung, number> = {
  'S': 1.0, 'SO': 0.95, 'SW': 0.95, 'O': 0.85, 'W': 0.85, 'NO': 0.75, 'NW': 0.75, 'N': 0.60,
};

export const NEIGUNG_OPTIMAL = 35;

export const GRENZWERTE = {
  BALKON_MAX_WR_VA: 800,
  BALKON_MAX_MODUL_WP: 2000,
  MINI_PV_MAX_KVA: 4.6,
  VEREINFACHT_MAX_KVA: 30,
  NA_SCHUTZ_AB_KVA: 30,
  MITTELSPANNUNG_AB_KVA: 135,
  DIREKTVERMARKTUNG_AB_KWP: 100,
  STEUERBAR_AB_KW: 4.2,
  DC_AC_RATIO_MIN: 0.8,
  DC_AC_RATIO_OPTIMAL_MIN: 1.0,
  DC_AC_RATIO_OPTIMAL_MAX: 1.3,
  DC_AC_RATIO_MAX: 1.5,
} as const;

// ============================================================================
// FIRMA DATEN - Re-export from local stubs
// ============================================================================

export { COMPANY, LECA_FIRMA, BAUNITY_FIRMA } from '../lib/stubs/company';

// ============================================================================
// STEP CONFIG
// ============================================================================

export const STEP_CONFIG: StepConfig[] = [
  { id: 1, title: 'Kunde', description: 'Kontaktdaten des Interessenten', icon: '👤', required: true },
  { id: 2, title: 'Standort', description: 'Adresse und GPS-Position', icon: '📍', required: true },
  { id: 3, title: 'Verbrauch', description: 'Stromverbrauch und Haushalt', icon: '⚡', required: true },
  { id: 4, title: 'Dach', description: 'Dachtyp und technische Daten', icon: '🏠', required: true },
  { id: 5, title: 'Technik', description: 'Anlage und Komponenten', icon: '🔧', required: true },
  { id: 6, title: 'Extras', description: 'Speicher, Wallbox, Fotos', icon: '🔋', required: true },
  { id: 7, title: 'Ergebnis', description: 'Gesprächsergebnis', icon: '📊', required: true },
  { id: 8, title: 'Abschluss', description: 'Unterschrift & Absenden', icon: '✅', required: true },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const createDefaultDachflaeche = (name = 'Dachfläche 1'): DachflaecheData => ({
  id: generateId(),
  name,
  modulHersteller: '',
  modulModell: '',
  modulLeistungWp: 0,
  modulAnzahl: 0,
  ausrichtung: 'S',
  neigung: 35,
  verschattung: 'keine',
});

export const createDefaultWechselrichter = (): WechselrichterData => ({
  id: generateId(),
  hersteller: '',
  modell: '',
  leistungKw: 0,
  leistungKva: 0,
  anzahl: 1,
  hybrid: false,
});

export const createDefaultSpeicher = (): SpeicherData => ({
  id: generateId(),
  hersteller: '',
  modell: '',
  kapazitaetKwh: 0,
  leistungKw: 0,
  scheinleistungKva: 0,
  bemessungsstromA: 0,
  anzahl: 1,
  kopplung: 'dc',
  notstrom: false,
  ersatzstrom: false,
  inselnetzBildend: false,
  anschlussPhase: 'drehstrom',
  allpoligeTrennung: true,
  naSchutzVorhanden: true,
});

export const createDefaultWallbox = (): WallboxData => ({
  id: generateId(),
  hersteller: '',
  modell: '',
  leistungKw: 11,
  anzahl: 1,
  steuerbar14a: true,
  phasen: 3,
  steckdose: 'Typ2',
});

export const createDefaultWaermepumpe = (): WaermepumpeData => ({
  id: generateId(),
  hersteller: '',
  modell: '',
  leistungKw: 0,
  typ: 'Luft',
  sgReady: true,
  steuerbar14a: true,
});

// NEU: Default Zähler-Daten
// vorhanden = true als Default, da bei Bestandsgebäuden immer ein Zähler existiert
export const createDefaultZaehler = (): ZaehlerData => ({
  vorhanden: true,  // Bei PV auf Bestandsgebäude ist immer ein Haushaltszähler vorhanden
  typ: 'zweirichtung',  // Wird bei PV-Anmeldung zum Zweirichtungszähler getauscht
  standort: 'keller',
  eigentum: 'netzbetreiber',
  tarifart: 'eintarif',
  fernauslesung: false,
  smartMeterGateway: false,
  imsysGewuenscht: false,
});

// NEU: Default Netzanschluss-Daten
export const createDefaultNetzanschluss = (): NetzanschlussData => ({
  bestehendeLeistungKw: undefined,
  bestehendeAbsicherungA: undefined,
});

// NEU: Default Prüfprotokoll-Daten
export const createDefaultPruefprotokoll = (): PruefprotokollData => ({
  pruefDatum: new Date().toISOString().split('T')[0],
  isolationsmessung: { durchgefuehrt: false },
  erdungsmessung: { durchgefuehrt: false },
  schleifenimpedanz: { durchgefuehrt: false },
  rcdPruefung: { durchgefuehrt: false },
  naSchutzPruefung: { durchgefuehrt: false },
  sichtpruefungBestanden: false,
  schutzleiterVorhanden: false,
  kennzeichnungVollstaendig: false,
  dokumentationVollstaendig: false,
  gesamtErgebnis: 'nicht_bestanden',
});

// NEU: Default Inbetriebnahme-Daten
export const createDefaultInbetriebnahme = (): InbetriebnahmeData => ({
  mastrAngemeldet: false,
  netzbetreiberGemeldet: false,
  ibnStatus: 'geplant',
});

// ============================================================================
// NETZBETREIBER TYPE
// ============================================================================

export interface Netzbetreiber {
  id: string;
  mastrNr?: string;
  name: string;
  kurzname?: string;
  ort: string;
  bundesland: string;
  website?: string;
  portalUrl?: string;
  plzBereiche: string[];
  bdewCode?: string;
}

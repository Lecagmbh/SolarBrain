/**
 * Baunity Wizard V4 Types - Final Edition
 * All fields required where code expects them
 */

// ============================================================================
// BASIC TYPES & ENUMS
// ============================================================================

export type Bundesland =
  | 'baden_wuerttemberg' | 'bayern' | 'berlin' | 'brandenburg'
  | 'bremen' | 'hamburg' | 'hessen' | 'mecklenburg_vorpommern'
  | 'niedersachsen' | 'nordrhein_westfalen' | 'rheinland_pfalz'
  | 'saarland' | 'sachsen' | 'sachsen_anhalt' | 'schleswig_holstein' | 'thueringen'
  | 'Baden-Württemberg' | 'Bayern' | 'Berlin' | 'Brandenburg'
  | 'Bremen' | 'Hamburg' | 'Hessen' | 'Mecklenburg-Vorpommern'
  | 'Niedersachsen' | 'Nordrhein-Westfalen' | 'Rheinland-Pfalz'
  | 'Saarland' | 'Sachsen' | 'Sachsen-Anhalt' | 'Schleswig-Holstein' | 'Thüringen'
  | (string & {});

export type AnlagenKategorie =
  | 'pv' | 'speicher' | 'pv_speicher' | 'wallbox' | 'waermepumpe'
  | 'bhkw' | 'balkonkraftwerk' | 'sonstige'
  | 'wind_klein' | 'sonstige_erzeugung' | 'baustrom_standard'
  | 'klimaanlage' | 'speicherheizung' | 'leistungserhoehung' | 'sonstige_14a'
  | 'solar' | 'wind' | 'wasser' | 'biomasse' | 'biogas' | 'geothermie' | 'brennstoffzelle';

export type ApplicationCategory = AnlagenKategorie;

export type Vorgangsart =
  | 'inbetriebnahme' | 'erweiterung' | 'aenderung' | 'abbau'
  | 'neuanlage' | 'stilllegung' | 'neuanmeldung'
  | 'demontage' | 'leistungsaenderung';

export type ProcessType = Vorgangsart;

export type AnlagenStatus =
  | 'geplant' | 'bestellt' | 'installiert' | 'in_betrieb' | 'in_installation';

export type Groessenklasse =
  | 'mini' | 'klein' | 'mittel' | 'gross' | 'grossanlage'
  | 'balkonkraftwerk' | 'nicht_relevant';

export type Einspeiseart = 'volleinspeisung' | 'ueberschuss' | 'nulleinspeisung' | 'eigenverbrauch';

export type Anschlussart =
  | 'niederspannung' | 'mittelspannung' | 'hochspannung'
  | 'einspeisung' | 'bezug' | 'kombiniert' | 'baustrom';

export type ErzeugungsanlagenTyp =
  | 'solar' | 'wind' | 'wasser' | 'biomasse' | 'biogas'
  | 'geothermie' | 'brennstoffzelle' | 'bhkw' | 'sonstige'
  | 'pv' | 'pv_speicher' | 'speicher' | 'wind_klein' | 'sonstige_erzeugung';

export type VerbrauchsanlagenTyp =
  | 'wallbox' | 'waermepumpe' | 'klimaanlage' | 'speicher' | 'sonstige'
  | 'speicherheizung' | 'leistungserhoehung' | 'sonstige_14a';

export type WizardStatus = 'entwurf' | 'in_bearbeitung' | 'eingereicht' | 'abgeschlossen' | 'abgelehnt';

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export type DokumentTyp =
  | 'lageplan' | 'anlagenschema' | 'schaltplan' | 'uebersichtsschaltplan'
  | 'installationsnachweis' | 'inbetriebnahmeprotokoll'
  | 'wechselrichterDatenblatt' | 'modulDatenblatt' | 'naSchutzZertifikat'
  | 'speicherDatenblatt' | 'wallboxDatenblatt' | 'waermepumpeDatenblatt'
  | 'datenblatt_module' | 'datenblatt_wechselrichter' | 'datenblatt_speicher'
  | 'datenblatt_wallbox' | 'na_schutz_zertifikat'
  | 'konformitaetserklaerung' | 'einheitenzertifikat' | 'anlagenzertifikat'
  | 'personalausweis' | 'handelsregisterauszug' | 'grundbuchauszug'
  | 'vermieter_zustimmung' | 'eigentuemernachweis'
  | 'stromrechnung' | 'einspeisezusage'
  | 'foto_anlage' | 'foto_zaehler' | 'foto_zaehlerschrank' | 'foto_hak'
  | 'vollmacht' | 'datenblatt_netzbetreiber' | 'anmeldung_netzbetreiber' | 'anmeldung_mastr'
  | 'angebot_rechnung' | 'bankverbindung'
  | 'sonstiges';

export type DocumentType = DokumentTyp;

export type DokumentStatus =
  | 'ausstehend' | 'hochgeladen' | 'geprueft' | 'abgelehnt' | 'nachgefordert'
  | 'fehlend' | 'uploaded';

// ============================================================================
// PERSON & KUNDE TYPES
// ============================================================================

export interface Person {
  anrede?: 'Herr' | 'Frau' | 'Divers' | string;
  titel?: string;
  vorname: string;
  nachname: string;
  geburtsdatum?: string;
}

export type Kundentyp = 'privat' | 'gewerbe' | 'kommune' | 'sonstiges';

export interface Kunde {
  typ?: Kundentyp;
  vorname?: string;
  nachname?: string;
  firmenname?: string;
  email?: string;
  telefon?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  iban?: string;
  bic?: string;
  anrede?: string;
  geburtsdatum?: string;
  rechtsform?: string;
  ustId?: string;
  kontoinhaber?: string;
}

// ============================================================================
// LOCATION & PROPERTY TYPES
// ============================================================================

export interface Standort {
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  bundesland?: Bundesland;
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;
  koordinaten?: { lat: number; lng: number; };
}

export type Eigentumsverhaeltnis =
  | 'eigentuemer' | 'mieter' | 'pacht' | 'wohnungseigentum' | 'verwalter';

export interface Eigentumsangaben {
  verhaeltnis?: Eigentumsverhaeltnis;
  eigentuemer?: { name?: string; anschrift?: string; };
  wegGemeinschaft?: boolean;
  zustimmungVorhanden?: boolean;
  vermieterZustimmung?: boolean;
}

// ============================================================================
// PV MODULE & WECHSELRICHTER
// ============================================================================

export interface PVModul {
  id: string;
  hersteller: string;
  typ: string;
  anzahl: number;
  wpProModul: number;
  gesamtWp?: number;
  nennspannung?: number;
  kurzschlussstrom?: number;
  leerlaufspannung?: number;
  mppSpannung?: number;
  mppStrom?: number;
  wirkungsgrad?: number;
  degradation?: number;
  garantieJahre?: number;
}

export interface Wechselrichter {
  id: string;
  hersteller: string;
  typ: string;
  anzahl: number;
  kvaNennleistung?: number;
  phasen?: 1 | 3;
  hatIntegriertenNaSchutz?: boolean;
  istHybrid?: boolean;
  gesamtKva?: number;
  kwAc?: number;
  hatNaSchutz?: boolean;
  maxDcSpannung?: number;
  mppTracker?: number;
  wirkungsgrad?: number;
  zerezId?: string;
}

export interface ExternerNaSchutz {
  hersteller: string;
  typ: string;
  zertifikatsnummer: string;
  einstellwerte?: { uMax?: number; uMin?: number; fMax?: number; fMin?: number; };
}

export interface PVAnlage {
  module: PVModul[];
  wechselrichter: Wechselrichter[];
  externerNaSchutz?: ExternerNaSchutz;
  einspeiseart?: Einspeiseart;
  gesamtKwp?: number;
  gesamtWrKva?: number;
  dcAcRatio?: number;
  hatNaSchutz?: boolean;
  benoetigtExternenNaSchutz?: boolean;
  ueber30kVA?: boolean;
}

// ============================================================================
// SPEICHER TYPES
// ============================================================================

export interface Speichereinheit {
  id: string;
  hersteller: string;
  typ: string;
  anzahl: number;
  kwhKapazitaet?: number;
  kwLadeleistung?: number;
  kwEntladeleistung?: number;
  kopplung?: 'AC' | 'DC' | 'hybrid' | 'ac' | 'dc';
  gesamtKwh?: number;
  gesamtKwLaden?: number;
  gesamtKwEntladen?: number;
  kwhProEinheit?: number;
  kwProEinheit?: number;
  zerezId?: string;
  zerezNummer?: string;
  notstromfaehig?: boolean;
  schwarzstartfaehig?: boolean;
}

export interface Speicheranlage {
  einheiten: Speichereinheit[];
  notstromfaehig?: boolean;
  schwarzstartfaehig?: boolean;
  gesamtKwh?: number;
  gesamtKwLaden?: number;
  gesamtKwEntladen?: number;
  notstrom?: boolean;
}

// ============================================================================
// LADEINFRASTRUKTUR TYPES
// ============================================================================

export type Steckertyp = 'typ1' | 'typ2' | 'ccs' | 'chademo' | 'schuko';
export type Installationsort = 'garage' | 'carport' | 'stellplatz' | 'tiefgarage' | 'oeffentlich';

export interface Ladepunkt {
  id: string;
  hersteller: string;
  typ: string;
  anzahl: number;
  kwMaxLeistung?: number;
  steckertyp?: Steckertyp;
  phasen?: 1 | 3;
  ist14aFaehig?: boolean;
  bidirektional?: boolean;
  gesamtKw?: number;
  kwProPunkt?: number;
  steuerbar14a?: boolean;
}

export interface Ladeinfrastruktur {
  ladepunkte: Ladepunkt[];
  installationsort?: Installationsort;
  lastmanagement?: boolean;
  paragraph14aAnmeldung?: boolean;
  gesamtAnzahlPunkte?: number;
  gesamtKw?: number;
  maxGleichzeitigKw?: number;
  ist14aPflichtig?: boolean;
  pvUeberschussladen?: boolean;
  oeffentlich?: boolean;
}

// ============================================================================
// WAERMEPUMPE TYPES
// ============================================================================

export type Waermequelle = 'luft' | 'wasser' | 'erdreich' | 'abwaerme' | 'sonstige';

export interface Waermepumpe {
  id: string;
  hersteller: string;
  typ: string;
  waermequelle?: Waermequelle;
  elektrischeLeistungKw?: number;
  thermischeLeistungKw?: number;
  cop?: number;
  sgReadyFaehig?: boolean;
  ist14aFaehig?: boolean;
}

export interface Waermepumpenanlage {
  waermepumpen?: Waermepumpe[];
  hatPufferspeicher?: boolean;
  pufferspeicherLiter?: number;
  brauchwasserMitWp?: boolean;
  paragraph14aAnmeldung?: boolean;
  gesamtElektrischeKw?: number;
  gesamtThermischeKw?: number;
  hatSgReady?: boolean;
  hersteller?: string;
  typ?: string;
  artWaermequelle?: string;
  elektrischeLeistungKw?: number;
  sgReady?: boolean;
  steuerbar14a?: boolean;
}

// ============================================================================
// INSTALLATEUR TYPES
// ============================================================================

export interface Installateur {
  firmenname?: string;
  ansprechpartner?: Person | string;
  email?: string;
  telefon?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  installateurAusweisnummer?: string;
  eintragsNummer?: string;
  mastrNummer?: string;
  firma?: string;
  auftragsnummer?: string;
}

// ============================================================================
// VOLLMACHT TYPES
// ============================================================================

export type VollmachtUmfang = 'netzbetreiber' | 'marktstammdatenregister' | 'zerez' | 'foerderung' | 'alles';

export interface Vollmacht {
  erteilt: boolean;
  umfang?: VollmachtUmfang[];
  art?: 'digital' | 'schriftlich';
  unterschriftDaten?: string;
  unterschriftDatum?: string;
  unterschriftData?: string;
  unterschriftTyp?: 'digital' | 'upload';
}

// ============================================================================
// GRID OPERATOR TYPES
// ============================================================================

export interface GridOperator {
  id: string;
  name: string;
  shortName?: string;
  portalUrl?: string;
  bundesland?: Bundesland;
  plz?: string;
  ort?: string;
  createdAt?: string;
  updatedAt?: string;
  website?: string;
  email?: string;
  phone?: string;
  bdewCode?: string;
  active?: boolean;
  verified?: boolean;
  notes?: string;
  status?: string;
  strasse?: string;
  hausnummer?: string;
  marktrollen?: string[];
  acerCode?: string;
  registrierungsdatum?: string;
}

export interface PlzMapping {
  id: string;
  plz: string;
  gridOperatorId: string;
  gridOperatorName?: string;
  source: 'customer' | 'admin_verified' | 'imported' | 'mastr_location' | 'learned' | 'manual';
  confidence?: number;
  usageCount?: number;
  confirmations?: number;
  rejections?: number;
  coverage?: 'full' | 'partial' | 'unknown';
  createdAt?: string;
  updatedAt?: string;
  city?: string;
  lastUsedAt?: string;
}

// ============================================================================
// CONDITION & RULE TYPES
// ============================================================================

export interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean | string[];
}

export interface RuleEffect {
  type: 'info' | 'warning' | 'error' | 'redirect' | 'block';
  message?: string;
  redirectUrl?: string;
}

export interface GridOperatorRule {
  id: string;
  gridOperatorId: string;
  name: string;
  conditions: Condition[];
  effect: RuleEffect;
  priority: number;
  active: boolean;
  action?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

// ============================================================================
// DOCUMENT REQUIREMENT TYPES
// ============================================================================

export interface DocumentRequirement {
  id: string;
  gridOperatorId: string;
  dokumentTyp?: DokumentTyp;
  name: string;
  conditions: Condition[];
  pflicht?: boolean;
  helpText?: string;
  templateUrl?: string;
  maxFileSizeMb?: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  documentType?: DokumentTyp;
  description?: string;
  required?: boolean;
}

// ============================================================================
// FIELD REQUIREMENT TYPES
// ============================================================================

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'file' | 'email' | 'tel';

export interface FieldRequirement {
  id: string;
  gridOperatorId: string;
  name?: string;
  fieldId?: string;
  fieldName?: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  conditions: Condition[];
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// PASSWORD STORAGE TYPES
// ============================================================================

export interface StoredPassword {
  id: string;
  category: 'netzbetreiber' | 'mastr' | 'zerez' | 'sonstige' | 'nb_portal' | 'other';
  portalType?: 'web' | 'email' | 'api';
  name: string;
  url?: string;
  username: string;
  password: string;
  notes?: string;
  gridOperatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// DOKUMENT TYPES
// ============================================================================

export interface Dokument {
  id: string;
  typ: DokumentTyp;
  name: string;
  dateiname?: string;
  dateityp?: string;
  dateigroesse?: number;
  uploadDatum?: string;
  status: DokumentStatus;
  wirdNachgereicht?: boolean;
  wirdVonGridnetzErstellt?: boolean;
  notizen?: string;
  fehlergrund?: string;
  ablehnungsgrund?: string;
  groesse?: number;
  uploadedAt?: string;
}

// ============================================================================
// AI MESSAGE TYPE
// ============================================================================

export interface AIMessage {
  id: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  timestamp?: string;
  actions?: Array<{ label: string; action: string; data?: Record<string, unknown>; primary?: boolean; }>;
  type: 'info' | 'warning' | 'error' | 'success' | 'hint' | 'question';
  title?: string;
  message: string;
  details?: string;
  dismissible: boolean;
  relatedField?: string;
  persistent?: boolean;
}

// ============================================================================
// ANMELDUNG KATEGORISIERUNG
// ============================================================================

export interface AnmeldungKategorisierung {
  kategorie?: AnlagenKategorie;
  vorgangsart?: Vorgangsart;
  anschlussart?: Anschlussart;
  groessenklasse?: Groessenklasse;
  erzeugungsanlagen?: ErzeugungsanlagenTyp[];
  verbrauchsanlagen?: VerbrauchsanlagenTyp[];
  istVereinfacht?: boolean;
  istAnmeldepflichtig?: boolean;
  istGenehmigungspflichtig?: boolean;
  brauchtNaSchutz?: boolean;
  braucht14a?: boolean;
  hauptAnlage?: AnlagenKategorie;
  zusatzAnlagen?: (VerbrauchsanlagenTyp | AnlagenKategorie)[];
  istEinspeisung?: boolean;
  istBezug?: boolean;
  ist14aRelevant?: boolean;
  vereinfachtesVerfahren?: boolean;
  brauchtInstallateur?: boolean;
  brauchtMastrEintrag?: boolean;
}

// ============================================================================
// WIZARD DATA - MAIN INTERFACE
// ============================================================================

export interface WizardData {
  id: string;
  status: WizardStatus;
  createdAt: string;
  updatedAt: string;

  kategorisierung?: AnmeldungKategorisierung;
  standort: Standort;
  eigentum: Eigentumsangaben;

  netzbetreiber: {
    id?: string;
    name?: string;
    ermittlungsart?: 'stromrechnung' | 'automatisch' | 'manuell';
    istBestaetigt?: boolean;
    manuelleEingabe?: string;
    manualEntry?: string;
    isConfirmed?: boolean;
    quelle?: string;
  };

  pv?: PVAnlage;
  speicher?: Speicheranlage;
  wallbox?: Ladeinfrastruktur;
  waermepumpe?: Waermepumpenanlage;

  antragsteller?: {
    person: Person;
    kontakt: { email: string; telefon?: string; mobilfunk?: string; };
    adresse?: { strasse: string; hausnummer: string; plz: string; ort: string; };
    istAnlagenbetreiber: boolean;
  };

  anlagenbetreiber?: {
    typ: Kundentyp;
    person?: Person;
    firma?: { name: string; rechtsform?: string; registernummer?: string; ustId?: string; };
    kontakt: { email: string; telefon?: string; };
    adresse: { strasse: string; hausnummer: string; plz: string; ort: string; };
    bankverbindung?: { iban: string; bic?: string; kontoinhaber?: string; };
  };

  installateur?: Installateur;
  dokumente: Dokument[];
  vollmacht: Vollmacht;

  externeReferenzen?: {
    mastrNummer?: string;
    netzbetreiberVorgangsnummer?: string;
    zerezNummer?: string;
    kundennummer?: string;
  };

  notizen?: string;

  validierung?: {
    istVollstaendig: boolean;
    fehlendeFelder: string[];
    warnungen: string[];
  };

  kategorie?: AnlagenKategorie;
  vorgangsart?: Vorgangsart;
  anlagenStatus?: AnlagenStatus;
  kunde: Kunde;
  submittedAt?: string;

  berechnet?: {
    gesamtKwp?: number;
    gesamtWrKva?: number;
    gesamtSpeicherKwh?: number;
    gesamtWallboxKw?: number;
    brauchtNaSchutz?: boolean;
    braucht14a?: boolean;
    messkonzept?: string;
    pflichtdokumente?: DokumentTyp[];
    optionaleDokumente?: DokumentTyp[];
    einheitenzertifikatErforderlich?: boolean;
    anlagenzertifikatErforderlich?: boolean;
    direktvermarktungErforderlich?: boolean;
    naSchutzErforderlich?: boolean;
    nvpErforderlich?: boolean;
    einspeisemanagementErforderlich?: boolean;
    genehmigungspflichtig?: boolean;
    anmeldekategorie?: 'vereinfacht' | 'standard' | 'erweitert' | 'individuell' | string;
  };

  aiInteractions?: unknown[];
}

// ============================================================================
// WIZARD PAYLOAD & REGISTRATION TYPES
// ============================================================================

export interface WizardPayload {
  wizardData: WizardData;
  documents: Dokument[];
  metadata?: { submittedAt: string; submittedBy?: string; version?: string; };
  registrationTargets?: RegistrationTarget[];
  measurementConcept?: MeasurementConcept;
  hasStorage?: boolean;
  hasWallbox?: boolean;
  hasHeatpump?: boolean;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export type MeasurementConcept = 'MK1' | 'MK2' | 'MK3' | 'MK4' | 'MK5' | 'MK6' | 'MK7' | 'MK8';

export type RegistrationTarget =
  | 'netzbetreiber' | 'marktstammdatenregister' | 'bundesnetzagentur'
  | 'connectionChange' | 'existingPlantChange' | 'pv' | 'kwk' | 'otherGeneration'
  | 'battery' | 'wallbox' | 'heatpump';

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type ApplicationStatus = WizardStatus;
export type NetzbetreiberDetermination = 'stromrechnung' | 'automatisch' | 'manuell';

// ============================================================================
// DOCUMENT TYPE LABELS
// ============================================================================

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  lageplan: 'Lageplan',
  anlagenschema: 'Anlagenschema',
  schaltplan: 'Schaltplan',
  uebersichtsschaltplan: 'Übersichtsschaltplan',
  installationsnachweis: 'Installationsnachweis',
  inbetriebnahmeprotokoll: 'Inbetriebnahmeprotokoll',
  wechselrichterDatenblatt: 'Wechselrichter-Datenblatt',
  modulDatenblatt: 'Modul-Datenblatt',
  naSchutzZertifikat: 'NA-Schutz-Zertifikat',
  speicherDatenblatt: 'Speicher-Datenblatt',
  wallboxDatenblatt: 'Wallbox-Datenblatt',
  waermepumpeDatenblatt: 'Wärmepumpe-Datenblatt',
  datenblatt_module: 'Datenblatt Module',
  datenblatt_wechselrichter: 'Datenblatt Wechselrichter',
  datenblatt_speicher: 'Datenblatt Speicher',
  datenblatt_wallbox: 'Datenblatt Wallbox',
  na_schutz_zertifikat: 'NA-Schutz-Zertifikat',
  konformitaetserklaerung: 'Konformitätserklärung',
  einheitenzertifikat: 'Einheitenzertifikat',
  anlagenzertifikat: 'Anlagenzertifikat',
  personalausweis: 'Personalausweis',
  handelsregisterauszug: 'Handelsregisterauszug',
  grundbuchauszug: 'Grundbuchauszug',
  vermieter_zustimmung: 'Vermieter-Zustimmung',
  eigentuemernachweis: 'Eigentümernachweis',
  stromrechnung: 'Stromrechnung',
  einspeisezusage: 'Einspeisezusage',
  foto_anlage: 'Foto Anlage',
  foto_zaehler: 'Foto Zähler',
  foto_zaehlerschrank: 'Foto Zählerschrank',
  foto_hak: 'Foto HAK',
  vollmacht: 'Vollmacht',
  datenblatt_netzbetreiber: 'Datenblatt Netzbetreiber',
  anmeldung_netzbetreiber: 'Anmeldung Netzbetreiber',
  anmeldung_mastr: 'Anmeldung MaStR',
  angebot_rechnung: 'Angebot/Rechnung',
  bankverbindung: 'Bankverbindung',
  sonstiges: 'Sonstiges'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function bestimmeGroessenklasse(kwp: number): Groessenklasse {
  if (kwp <= 0.6) return 'mini';
  if (kwp <= 10) return 'klein';
  if (kwp <= 30) return 'mittel';
  if (kwp <= 100) return 'gross';
  return 'grossanlage';
}

export function berechneKategorisierungsFlags(kat: Partial<AnmeldungKategorisierung>): {
  istVereinfacht: boolean;
  istAnmeldepflichtig: boolean;
  istGenehmigungspflichtig: boolean;
  brauchtNaSchutz: boolean;
  braucht14a: boolean;
} {
  const groesse = kat.groessenklasse || 'klein';
  const kategorie = kat.kategorie || 'pv';
  return {
    istVereinfacht: groesse === 'mini' || groesse === 'klein',
    istAnmeldepflichtig: groesse !== 'mini',
    istGenehmigungspflichtig: groesse === 'grossanlage',
    brauchtNaSchutz: groesse !== 'mini' && groesse !== 'klein',
    braucht14a: kategorie === 'wallbox' || kategorie === 'waermepumpe'
  };
}

export function calculatePlzConfidence(mapping: Partial<PlzMapping>): number {
  const confirmations = mapping.confirmations ?? 0;
  const rejections = mapping.rejections ?? 0;
  const usageCount = mapping.usageCount ?? 0;
  if (confirmations + rejections === 0) return Math.min(50, usageCount * 5);
  const ratio = confirmations / (confirmations + rejections);
  return Math.round(ratio * 100);
}

export function calculateRequirements(data: Partial<WizardData>): { pflichtdokumente?: DokumentTyp[] } {
  const docs: DokumentTyp[] = [];
  if (data.pv) {
    docs.push('lageplan', 'modulDatenblatt', 'wechselrichterDatenblatt');
    if (data.berechnet?.brauchtNaSchutz) docs.push('naSchutzZertifikat');
  }
  if (data.speicher) docs.push('speicherDatenblatt');
  if (data.wallbox) docs.push('wallboxDatenblatt');
  return { pflichtdokumente: docs };
}

// ============================================================================
// DOCUMENT DEFINITION TYPE
// ============================================================================

export interface DokumentDefinition {
  typ: DokumentTyp;
  name: string;
  beschreibung: string;
  hilfeText?: string;
  akzeptierteFormate: string[];
  maxGroesseMb: number;
  kannAutomatischErstellt?: boolean;
  kannNachgereicht?: boolean;
}

// ============================================================================
// WIZARD STORE INTERFACE
// ============================================================================

export interface WizardStore {
  wizardData: WizardData;
  isSubmitting: boolean;
  currentStep: number;
  isLoading: boolean;
  isSaving: boolean;
  gridOperators: GridOperator[];
  plzMappings: PlzMapping[];
  aiAssistantMinimized: boolean;
  showExitConfirm: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: () => boolean;

  setKategorie: (kategorie: AnlagenKategorie) => void;
  setVorgangsart: (vorgangsart: Vorgangsart) => void;
  setAnlagenStatus: (status: AnlagenStatus) => void;
  setStandort: (field: string, value: string) => void;
  setEigentum: (field: string, value: string | boolean | Record<string, string | undefined>) => void;
  setNetzbetreiber: (nb: GridOperator | null) => void;
  setNetzbetreiberManual: (name: string) => void;
  confirmNetzbetreiber: () => void;
  setKategorisierung: (kat: Partial<AnmeldungKategorisierung>) => void;

  addPvModul: () => void;
  updatePvModul: (id: string, field: string, value: string | number) => void;
  removePvModul: (id: string) => void;
  addWechselrichter: () => void;
  updateWechselrichter: (id: string, field: string, value: string | number | boolean) => void;
  removeWechselrichter: (id: string) => void;
  addSpeicher: () => void;
  updateSpeicher: (id: string, field: string, value: string | number) => void;
  removeSpeicher: (id: string) => void;
  addWallboxLadepunkt: () => void;
  updateWallboxLadepunkt: (id: string, field: string, value: string | number | boolean) => void;
  removeWallboxLadepunkt: (id: string) => void;
  setEinspeiseart: (art: Einspeiseart) => void;
  setWaermepumpe: (field: string, value: string | number | boolean) => void;

  setKundentyp: (typ: Kundentyp) => void;
  setKunde: (field: string, value: string) => void;
  setInstallateur: (field: string, value: string) => void;

  addDokument: (typ: DokumentTyp, name: string, file?: File) => void;
  updateDokumentStatus: (id: string, status: DokumentStatus) => void;
  setDokumentOption: (id: string, option: 'wirdNachgereicht' | 'wirdVonGridnetzErstellt', value: boolean) => void;
  removeDokument: (id: string) => void;

  setVollmachtErteilt: (erteilt: boolean) => void;
  setVollmachtUnterschrift: (typ: 'digital' | 'upload', data?: string) => void;
  setVollmacht: (field: keyof Vollmacht, value: string | boolean | string[] | undefined) => void;

  recordPlzSelection: (plz: string, operator: GridOperator) => void;
  recalculate: () => void;
  resetWizard: () => void;
  loadWizard: (id: string) => Promise<void>;
  saveWizard: () => Promise<void>;
  submitWizard: () => Promise<void>;
  validateStep: (step: number) => boolean;
  calculateTotals: () => void;

  toggleAiAssistant: () => void;
  setShowExitConfirm: (show: boolean) => void;
}

// ============================================================================
// DEFAULT WIZARD DATA FACTORY
// ============================================================================

export function createDefaultWizardData(): WizardData {
  return {
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    status: 'entwurf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    standort: {},
    eigentum: {},
    netzbetreiber: { isConfirmed: false },
    dokumente: [],
    vollmacht: { erteilt: false },
    kunde: {},
    berechnet: {
      gesamtKwp: 0,
      gesamtSpeicherKwh: 0,
      gesamtWallboxKw: 0,
      naSchutzErforderlich: false,
      einspeisemanagementErforderlich: false,
      nvpErforderlich: false,
      einheitenzertifikatErforderlich: false,
      anlagenzertifikatErforderlich: false,
      direktvermarktungErforderlich: false,
      genehmigungspflichtig: false,
      pflichtdokumente: ['lageplan', 'schaltplan'],
      anmeldekategorie: 'vereinfacht',
    },
    aiInteractions: [],
  };
}

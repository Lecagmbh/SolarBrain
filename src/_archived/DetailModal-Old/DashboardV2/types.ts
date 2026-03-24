// Types extracted from PremiumOverviewTab.tsx

export interface StatusHistoryItem {
  id: number;
  fromStatus?: string;
  toStatus: string;
  statusLabel: string;
  changedByName: string;
  comment?: string;
  createdAt: string;
}

export interface TechComponent {
  hersteller?: string;
  modell?: string;
  anzahl?: number;
}

export interface PVDachflaeche extends TechComponent {
  modulHersteller?: string;
  modulModell?: string;
  modulAnzahl?: number;
  modulLeistungWp?: number;
  ausrichtung?: string;
  neigung?: number;
}

export interface Wechselrichter extends TechComponent {
  leistungKw?: number;
  hybrid?: boolean;
}

export interface Speicher extends TechComponent {
  kapazitaetKwh?: number;
  leistungKw?: number;
  kopplung?: string;
}

export interface Wallbox extends TechComponent {
  leistungKw?: number;
}

export interface Waermepumpe extends TechComponent {
  leistungKw?: number;
}

export interface TechnicalDetails {
  messkonzept?: string;
  dachflaechen?: PVDachflaeche[];
  wechselrichter?: Wechselrichter[];
  speicher?: Speicher[];
  wallboxen?: Wallbox[];
  waermepumpen?: Waermepumpe[];
}

export interface Installation {
  id: number;
  publicId?: string;
  status: string;
  customerName?: string;
  customerType?: string;
  contactPhone?: string;
  contactEmail?: string;
  birthDate?: string;
  gridOperator?: string;
  gridOperatorId?: number;
  gridOperatorPortalUrl?: string;
  nbEmail?: string;
  nbCaseNumber?: string;
  zaehlernummer?: string;
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  daysAtNb?: number;
  nbEingereichtAm?: string;
  createdAt?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  statusHistory?: StatusHistoryItem[];
  technicalDetails?: TechnicalDetails;
  createdById?: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;
  createdByCompany?: string;
  rechnungGestellt?: boolean;
  rechnungNummer?: string;
  rechnungDatum?: string;
  rechnungBetrag?: number;
  rechnungBezahlt?: boolean;
  rechnungBezahltAm?: string;
  wizardContext?: string;
  technicalData?: {
    vorgangsart?: string;
    pvAnzahl?: number;
    pvHersteller?: string;
    pvModell?: string;
    pvLeistungWp?: number;
    wrAnzahl?: number;
    wrHersteller?: string;
    wrModell?: string;
    wrLeistungKw?: number;
    wrZerezId?: string;
    speicherAnzahl?: number;
    speicherHersteller?: string;
    speicherModell?: string;
    speicherKwh?: number;
    speicherZerezId?: string;
    anlagenLeistungKwp?: number;
    mastrAnlegen?: boolean;
    zaehlerAbmelden?: boolean;
    zaehlerNummern?: string[];
  };
  zaehlerwechselDatum?: string;
  zaehlerwechselUhrzeit?: string;
  zaehlerwechselKommentar?: string;
  zaehlerwechselKundeInformiert?: boolean;
  dedicatedEmail?: string;
  documents?: Array<{
    id: number;
    dateiname?: string;
    originalName?: string;
    kategorie?: string;
    dokumentTyp?: string;
    url?: string;
    createdAt?: string;
  }>;
}

export interface NormalizedWizardData {
  caseType?: string;
  processType?: string;
  groessenklasse?: string;
  registrationTargets: string[];
  meterProcess?: {
    prozessTyp?: string;
    altZaehlernummer?: string;
    neuZaehlertyp?: string;
    neuStandort?: string;
    neuTarifart?: string;
    antragGestellt?: boolean;
  };
  completion?: {
    installationAbgeschlossen?: boolean;
    netzbetreiberMeldung?: boolean;
    mastrGemeldet?: boolean;
    zaehlerGesetzt?: boolean;
  };
  location: {
    street?: string;
    houseNumber?: string;
    zip?: string;
    city?: string;
    bundesland?: string;
    gemarkung?: string;
    flur?: string;
    flurstueck?: string;
    zusatz?: string;
    gpsLat?: number;
    gpsLng?: number;
  };
  gridOperator: {
    id?: string;
    name?: string;
  };
  meter: {
    number?: string;
    type?: string;
    location?: string;
    ownership?: string;
    tariffType?: string;
    zaehlpunkt?: string;
    marktlokation?: string;
    fernauslesung?: boolean;
    smartMeterGateway?: boolean;
    imsysGewuenscht?: boolean;
    zaehlerstdBezug?: number;
    zaehlerstdEinspeisung?: number;
    ablesedatum?: string;
    vorhanden?: boolean;
    gewuenschterTyp?: string;
    gewuenschterStandort?: string;
    wechselGrund?: string;
    altZaehlernummer?: string;
  };
  meterStock: any[];
  meterNew?: any;
  gridConnection: {
    hakId?: string;
    existingPowerKw?: number;
    existingFuseA?: number;
    requestedPowerKw?: number;
    requestedFuseA?: number;
    erdungsart?: string;
    kurzschlussleistungMVA?: number;
    netzimpedanzOhm?: number;
    hausanschlusskastenTyp?: string;
    leistungserhoehungGrund?: string;
  };
  decommissioning: {
    type?: string;
    reason?: string;
    reasonOther?: string;
    meterNumber?: string;
    mastrNumber?: string;
    eegAnlagenId?: string;
    plannedDate?: string;
    lastOperationDay?: string;
    leistungKwp?: number;
    leistungKva?: number;
    speicherKwh?: number;
    gridOperatorNotified: boolean;
    mastrDeregistered: boolean;
    readingDone: boolean;
    entsorgungsnachweis?: boolean;
    bemerkungen?: string;
  } | null;
  commissioning: {
    plannedDate?: string;
    actualDate?: string;
    eegDate?: string;
    mastrNumber?: string;
    mastrNumberSpeicher?: string;
    mastrRegistered: boolean;
    mastrDate?: string;
    gridOperatorNotified: boolean;
    gridOperatorNotifiedDate?: string;
    gridOperatorConfirmed?: boolean;
    status?: string;
  } | null;
  technical: {
    feedInType?: string;
    messkonzept?: string;
    paragraph14a?: { relevant: boolean; modul?: string };
    gridLevel?: string;
    naProtectionRequired?: boolean;
    gridFeedPhases?: string;
    totalPvKwp?: number;
    totalInverterKva?: number;
    totalBatteryKwh?: number;
    dcAcRatio?: number;
    operationMode?: {
      inselbetrieb?: boolean;
      motorischerAblauf?: boolean;
      ueberschusseinspeisung?: boolean;
      volleinspeisung?: boolean;
    };
    feedInManagement?: {
      ferngesteuert?: boolean;
      dauerhaftBegrenzt?: boolean;
      begrenzungProzent?: number;
    };
    reactiveCompensation?: {
      vorhanden?: boolean;
      anzahlStufen?: number;
      blindleistungKleinsteKvar?: number;
      verdrosselungsgrad?: string;
    };
    mieterstrom?: boolean;
    energySharing?: boolean;
    mehrereAnlagen?: boolean;
  };
  pvEntries: any[];
  inverterEntries: any[];
  batteryEntries: any[];
  wallboxEntries: any[];
  heatpumpEntries: any[];
  bhkwEntries: any[];
  windEntries: any[];
  customer: {
    type?: string;
    salutation?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    birthDate?: string;
    iban?: string;
    bic?: string;
    accountHolder?: string;
    mastrNumber?: string;
    eegKey?: string;
    rechnungGleichStandort?: boolean;
    rechnungsadresse?: {
      strasse?: string;
      hausnummer?: string;
      plz?: string;
      ort?: string;
    };
  } | null;
  authorization: {
    powerOfAttorney: boolean;
    mastrRegistration: boolean;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    signature?: string;
    kundenportalAnlegen?: boolean;
  } | null;
  owner: {
    isOwner?: boolean;
    consentGiven?: boolean;
    ownerData?: any;
  } | null;
  photos: any[];
  documents: any[];
  wizardVersion?: string;
  submittedAt?: string;
}

export interface EmailAiAnalysis {
  type?: string;
  summary?: string;
  requiredAction?: string;
  deadline?: string;
  confidence?: number;
  extractedData?: {
    aktenzeichen?: string;
    termin?: string;
    ansprechpartner?: string;
  };
}

export interface ApiEmail {
  id: number;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  aiType?: string;
  aiSummary?: string;
  aiRequiredAction?: string;
  aiDeadline?: string;
  aiConfidence?: number;
  aiAnalysis?: EmailAiAnalysis;
}

export interface ApiAlert {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isResolved: boolean;
  createdAt: string;
  relatedEmailId?: number;
  requiredAction?: string;
  deadline?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
}

export interface StatusAction {
  label: string;
  targetStatus: string;
  variant: 'primary' | 'danger' | 'secondary';
  icon: 'check' | 'alert' | 'arrow';
}

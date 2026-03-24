/**
 * Baunity Wizard API
 * ================
 * API Integration für den Wizard
 * - Installation erstellen/aktualisieren
 * - Wizard-Context speichern/laden
 * - Formulare & Dokumente
 */

import { api } from './client';
import type { WizardData } from '../../types/wizard.types';
import { useUploadStore } from '../../stores/uploadStore';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Check if current user is Admin
// ═══════════════════════════════════════════════════════════════════════════

function isUserAdmin(): boolean {
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
            // Admin role detected
            return true;
          }
        } catch (e) { /* JSON parse failed, try next */ }
      }
    }
    // No admin role found
  } catch (e) {
    console.warn('[Wizard] Could not determine user role:', e);
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WizardSubmitPayload {
  // Kategorie & Anmeldeziele
  caseType: string;
  registrationTargets: string[];
  processType?: string; // Vorgangsart

  // Standort
  location: {
    siteAddress: {
      street: string;
      houseNumber: string;
      zip: string;
      city: string;
      state?: string;
      cadastralDistrict?: string;
      parcel?: string;
      parcelNumber?: string;
      gpsLat?: number;
      gpsLng?: number;
    };
    netOperator?: {
      id?: string;
      name: string;
      isNew?: boolean;
    };
    meterNumber?: string;
    meterPointId?: string;
  };

  // Zähler-Daten (Phase 1)
  meter?: {
    number?: string;
    type?: string;
    location?: string;
    ownership?: string;
    tariffType?: string;
    readingConsumption?: number;
    readingFeedIn?: number;
    readingDate?: string;
    remoteReading?: boolean;
    smartMeterGateway?: boolean;
    imsysRequested?: boolean;
    changeReason?: string;
    oldMeterNumber?: string;
    meterPointId?: string;
    marketLocationId?: string;
  };

  // Netzanschluss-Daten (Phase 1)
  gridConnection?: {
    hakId?: string;
    existingPowerKw?: number;
    existingFuseA?: number;
    groundingType?: string;  // TN-C, TN-S, TT
    requestedPowerKw?: number;
    requestedFuseA?: number;
    powerIncreaseReason?: string;
    shortCircuitPowerMva?: number;
    gridImpedanceOhm?: number;
  };

  // Demontage-Daten (Phase 2)
  decommissioning?: {
    type?: string;           // pv_komplett, speicher, etc.
    reason?: string;         // stilllegung, modernisierung, etc.
    mastrNumber?: string;
    requestedDate?: string;
    gridOperatorNotified?: boolean;
    mastrDeregistered?: boolean;
  };

  // Zähler-Prozess (Phase 2)
  meterProcess?: {
    processType?: string;    // neuanmeldung, wechsel_typ, etc.
    oldMeterNumber?: string;
    newMeterType?: string;
  };

  // Fertigmeldung (Phase 2)
  completion?: {
    installationComplete?: boolean;
    gridOperatorNotified?: boolean;
    mastrRegistered?: boolean;
    meterInstalled?: boolean;
    initialTestDone?: boolean;
    testProtocolAvailable?: boolean;
  };

  // Inbetriebnahme (Phase 1)
  commissioning?: {
    plannedDate?: string;
    actualDate?: string;
    eegDate?: string;
    mastrNumber?: string;
    mastrRegistered?: boolean;
    mastrDate?: string;
    gridOperatorNotified?: boolean;
    gridOperatorNotificationDate?: string;
    gridOperatorConfirmation?: boolean;
    commissioningStatus?: string;
    testProtocol?: {
      testDate?: string;
      testerName?: string;
      insulationMOhm?: number;
      loopImpedanceOhm?: number;
      rcdTripTimeMs?: number;
      rcdTripCurrentMa?: number;
      passed?: boolean;
    };
  };

  // Fotos (Phase 1)
  photos?: {
    category: string;
    filename: string;
    url?: string;
    uploadedAt?: string;
  }[];

  // Zähler-Bestand (Multi-Zähler)
  meterInventory?: {
    id: string;
    meterNumber: string;
    meterPointId?: string;
    type?: string;
    location?: string;
    tariffType?: string;
    lastReading?: number;
    lastReadingFeedIn?: number;
    readingDate?: string;
    usage?: string;
    action: string;
  }[];

  // Neuer Zähler Config
  newMeter?: {
    type?: string;
    location?: string;
    mounting?: string;
    tariffType?: string;
    imsysRequested?: boolean;
    forSystem?: string;
    mergeFrom?: string[];
  };

  // Eigentumsverhältnis
  ownership?: {
    isOwner?: boolean | null;
    consentAvailable?: boolean;
    ownerName?: string;
    ownerAddress?: string;
    ownerEmail?: string;
    ownerPhone?: string;
  };

  // Kunde
  customer: {
    customerType: 'PRIVATE' | 'BUSINESS';
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone?: string;
    birthDate?: string;
    taxId?: string;
    salutation?: string;
    title?: string;
    mobile?: string;
    billingAddress?: {
      street: string;
      houseNumber: string;
      zip: string;
      city: string;
    };
    iban?: string;
    bic?: string;
    accountHolder?: string;
    mastrNumber?: string;
    eegKey?: string;
  };

  // Technische Daten
  technical: {
    pvEntries?: PVEntry[];
    inverterEntries?: InverterEntry[];
    batteryEntries?: BatteryEntry[];
    wallboxEntries?: WallboxEntry[];
    heatpumpEntries?: HeatpumpEntry[];
    totalPvKwp?: number;
    totalInverterKva?: number;
    totalBatteryKwh?: number;
    feedInType?: 'ueberschuss' | 'volleinspeisung' | 'nulleinspeisung';
    paragraph14a?: { relevant: boolean; modul?: string };
    operationMode?: {
      inselbetrieb: boolean;
      motorischerAblauf: boolean;
      ueberschusseinspeisung: boolean;
      volleinspeisung: boolean;
    };
    feedInPhases?: string;
    reactiveCompensation?: {
      vorhanden: boolean;
      anzahlStufen?: number;
      blindleistungKleinsteKvar?: number;
      verdrosselungsgrad?: string;
    };
    feedInManagement?: {
      ferngesteuert: boolean;
      dauerhaftBegrenzt: boolean;
      begrenzungProzent?: number;
    };
    plannedCommissioning?: string;
  };

  // Messkonzept
  messkonzept?: string;

  // Vollmacht & Abschluss
  authorization: {
    powerOfAttorney: boolean;
    mastrRegistration: boolean;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    createCustomerPortal?: boolean;
  };

  // Meta
  wizardVersion?: string;
  submittedAt?: string;
}

interface PVEntry {
  id: string;
  manufacturer: string;
  model: string;
  powerWp: number;
  count: number;
  orientation?: string;
  tilt?: number;
  roofName?: string;
  productDbId?: number;
  zerezId?: string;
  stringCount?: number;
  modulesPerString?: number;
  shading?: 'keine' | 'gering' | 'mittel' | 'stark';
}

interface InverterEntry {
  id: string;
  manufacturer: string;
  model: string;
  powerKva: number;
  count: number;
  hybrid?: boolean;
  productDbId?: number;
  zerezId?: string;
  powerKw?: number;
  mpptCount?: number;
  connectedRoofs?: string[];
}

interface BatteryEntry {
  id: string;
  manufacturer: string;
  model: string;
  capacityKwh: number;
  count: number;
  coupling?: 'ac' | 'dc';
  productDbId?: number;
  // E.3 VDE Speicher-Datenblatt Felder
  powerKw?: number;
  apparentPowerKva?: number;
  ratedCurrentA?: number;
  emergencyPower?: boolean;
  backupPower?: boolean;
  connectedInverterId?: string;
  islandForming?: boolean;
  connectionPhase?: 'L1' | 'L2' | 'L3' | 'drehstrom';
  allPoleSeparation?: boolean;
  naProtectionPresent?: boolean;
  inverterManufacturer?: string;
  inverterType?: string;
  inverterCount?: number;
  displacementFactorCos?: number;
}

interface WallboxEntry {
  id: string;
  manufacturer: string;
  model: string;
  powerKw: number;
  count: number;
  controllable14a?: boolean;
  productDbId?: number;
  phases?: 1 | 3;
  socketType?: 'Typ2' | 'Typ1' | 'Schuko';
}

interface HeatpumpEntry {
  id: string;
  manufacturer: string;
  model?: string;
  powerKw: number;
  type?: string;
  controllable14a?: boolean;
  sgReady?: boolean;
}

export interface InstallationResponse {
  success: boolean;
  id: number;
  publicId: string;
}

export interface InstallationDetail {
  id: number;
  publicId: string;
  status: string;
  statusLabel: string;
  customerName: string;
  location: string;
  gridOperator: string;
  plz: string;
  wizardContext: WizardSubmitPayload;
  technicalData: any;
  documents: any[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE HELPER
// ═══════════════════════════════════════════════════════════════════════════

/** Sicher Date → ISO-String konvertieren (JSON.parse gibt Strings statt Date zurück) */
function toISOString(value: Date | string | undefined | null): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════════════════
// FOTO UPLOAD HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lädt alle Fotos mit blob-URLs auf den Server hoch und gibt die aktualisierten Fotos zurück
 * @param installationId - ID der Installation
 * @param fotos - Array der Fotos aus step7
 * @returns Array mit aktualisierten URLs (Server-URLs statt blob-URLs)
 */
async function uploadPhotosToServer(
  installationId: number,
  fotos: Array<{
    id: string;
    kategorie: string;
    filename: string;
    url: string;
    uploadedAt?: Date;
    beschreibung?: string;
    istPflicht?: boolean;
  }>
): Promise<Array<{
  category: string;
  filename: string;
  url: string;
  uploadedAt?: string;
}>> {
  const uploadedPhotos: Array<{
    category: string;
    filename: string;
    url: string;
    uploadedAt?: string;
  }> = [];

  for (const foto of fotos) {
    try {
      // Prüfen ob es eine blob-URL ist
      if (foto.url && foto.url.startsWith('blob:')) {
        console.log(`[Wizard] Uploading photo: ${foto.filename} (${foto.kategorie})`);

        // Blob-Daten fetchen
        const response = await fetch(foto.url);
        if (!response.ok) {
          console.warn(`[Wizard] Failed to fetch blob for ${foto.filename}`);
          continue;
        }

        const blob = await response.blob();

        // Dateinamen und MIME-Type bestimmen
        const mimeType = blob.type || 'image/jpeg';
        const extension = mimeType.split('/')[1] || 'jpg';
        const safeFilename = foto.filename || `foto_${foto.kategorie}_${Date.now()}.${extension}`;

        // File-Objekt erstellen
        const file = new File([blob], safeFilename, { type: mimeType });

        // Hochladen mit dokumentApi
        const result = await dokumentApi.upload(
          installationId,
          file,
          `foto_${foto.kategorie}`,  // dokumentTyp
          'FOTO'                      // kategorie
        );

        if (result.success && result.url) {
          uploadedPhotos.push({
            category: foto.kategorie,
            filename: safeFilename,
            url: result.url,
            uploadedAt: toISOString(foto.uploadedAt),
          });
          console.log(`[Wizard] Photo uploaded successfully: ${safeFilename} → ${result.url}`);
        } else {
          console.warn(`[Wizard] Photo upload returned no URL: ${foto.filename}`);
          // Foto trotzdem speichern, aber mit leerem URL
          uploadedPhotos.push({
            category: foto.kategorie,
            filename: safeFilename,
            url: '',
            uploadedAt: toISOString(foto.uploadedAt),
          });
        }
      } else if (foto.url && !foto.url.startsWith('blob:')) {
        // Bereits hochgeladenes Foto - URL beibehalten
        uploadedPhotos.push({
          category: foto.kategorie,
          filename: foto.filename,
          url: foto.url,
          uploadedAt: toISOString(foto.uploadedAt),
        });
      }
    } catch (error) {
      console.error(`[Wizard] Failed to upload photo ${foto.filename}:`, error);
      // Bei Fehler trotzdem einen Eintrag erstellen (ohne URL)
      uploadedPhotos.push({
        category: foto.kategorie,
        filename: foto.filename,
        url: '',
        uploadedAt: toISOString(foto.uploadedAt),
      });
    }
  }

  return uploadedPhotos;
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD DATA TRANSFORMER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transformiert WizardData (Frontend) → WizardSubmitPayload (Backend)
 */
export function transformWizardData(data: WizardData): WizardSubmitPayload {
  const { step1, step2, step4, step5, step6, step7, step8 } = data;
  
  // PV Einträge aus Dachflächen
  const pvEntries: PVEntry[] = (step5.dachflaechen || []).map(d => ({
    id: d.id,
    manufacturer: d.modulHersteller,
    model: d.modulModell,
    powerWp: d.modulLeistungWp,
    count: d.modulAnzahl,
    orientation: d.ausrichtung,
    tilt: d.neigung,
    roofName: d.name,
    productDbId: undefined,
    zerezId: undefined,
    stringCount: d.stringAnzahl,
    modulesPerString: d.moduleProString,
    shading: d.verschattung,
  }));
  
  // Wechselrichter
  const inverterEntries: InverterEntry[] = (step5.wechselrichter || []).map(w => ({
    id: w.id,
    manufacturer: w.hersteller,
    model: w.modell,
    powerKva: w.leistungKva,
    count: w.anzahl,
    hybrid: w.hybrid,
    productDbId: w.produktId,
    zerezId: w.zerezId,
    powerKw: w.leistungKw,
    mpptCount: w.mpptAnzahl,
    connectedRoofs: w.angeschlosseneDachflaechen,
  }));
  
  // Speicher (inkl. E.3 VDE Speicher-Datenblatt)
  const batteryEntries: BatteryEntry[] = (step5.speicher || []).map(s => ({
    id: s.id,
    manufacturer: s.hersteller,
    model: s.modell,
    capacityKwh: s.kapazitaetKwh,
    count: s.anzahl,
    coupling: s.kopplung,
    productDbId: s.produktId,
    powerKw: s.leistungKw,
    apparentPowerKva: s.scheinleistungKva,
    ratedCurrentA: s.bemessungsstromA,
    emergencyPower: s.notstrom,
    backupPower: s.ersatzstrom,
    connectedInverterId: s.angeschlossenerWR,
    islandForming: s.inselnetzBildend,
    connectionPhase: s.anschlussPhase,
    allPoleSeparation: s.allpoligeTrennung,
    naProtectionPresent: s.naSchutzVorhanden,
    inverterManufacturer: s.umrichterHersteller,
    inverterType: s.umrichterTyp,
    inverterCount: s.umrichterAnzahl,
    displacementFactorCos: s.verschiebungsfaktorCos,
  }));
  
  // Wallboxen
  const wallboxEntries: WallboxEntry[] = (step5.wallboxen || []).map(w => ({
    id: w.id,
    manufacturer: w.hersteller,
    model: w.modell || '',
    powerKw: w.leistungKw,
    count: w.anzahl,
    controllable14a: w.steuerbar14a,
    productDbId: w.produktId,
    phases: w.phasen,
    socketType: w.steckdose,
  }));
  
  // Wärmepumpen
  const heatpumpEntries: HeatpumpEntry[] = (step5.waermepumpen || []).map(w => ({
    id: w.id,
    manufacturer: w.hersteller,
    model: w.modell,
    powerKw: w.leistungKw,
    type: w.typ,
    controllable14a: w.steuerbar14a,
    sgReady: w.sgReady,
  }));

  // Zähler-Daten
  const zaehler = step4.zaehler;
  const meterData = zaehler ? {
    number: zaehler.zaehlernummer,
    type: zaehler.typ,
    location: zaehler.standort,
    ownership: zaehler.eigentum,
    tariffType: zaehler.tarifart,
    readingConsumption: zaehler.zaehlerstdBezug,
    readingFeedIn: zaehler.zaehlerstdEinspeisung,
    readingDate: zaehler.ablesedatum,
    remoteReading: zaehler.fernauslesung,
    smartMeterGateway: zaehler.smartMeterGateway,
    imsysRequested: zaehler.imsysGewuenscht,
    changeReason: zaehler.wechselGrund,
    oldMeterNumber: zaehler.altZaehlernummer,
    meterPointId: zaehler.zaehlpunktbezeichnung,
    marketLocationId: zaehler.marktlokationsId,
  } : undefined;

  // Netzanschluss-Daten
  const netzanschluss = step4.netzanschluss;
  const gridConnectionData = netzanschluss ? {
    hakId: netzanschluss.hakId,
    existingPowerKw: netzanschluss.bestehendeLeistungKw,
    existingFuseA: netzanschluss.bestehendeAbsicherungA ? Number(netzanschluss.bestehendeAbsicherungA) : undefined,
    groundingType: netzanschluss.erdungsart,
    requestedPowerKw: netzanschluss.gewuenschteLeistungKw,
    requestedFuseA: netzanschluss.gewuenschteAbsicherungA ? Number(netzanschluss.gewuenschteAbsicherungA) : undefined,
    powerIncreaseReason: netzanschluss.leistungserhoehungGrund,
    shortCircuitPowerMva: netzanschluss.kurzschlussleistungMVA,
    gridImpedanceOhm: netzanschluss.netzimpedanzOhm,
  } : undefined;

  // Demontage-Daten
  const demontage = step1.demontage;
  const decommissioningData = demontage ? {
    type: demontage.typ,
    reason: demontage.grund,
    mastrNumber: demontage.mastrNummer,
    requestedDate: demontage.gewuenschtesDatum,
    gridOperatorNotified: demontage.netzbetreiberInformiert,
    mastrDeregistered: demontage.mastrAbgemeldet,
  } : undefined;

  // Zähler-Prozess
  const zaehlerProzess = step1.zaehlerProzess;
  const meterProcessData = zaehlerProzess ? {
    processType: zaehlerProzess.prozessTyp,
    oldMeterNumber: zaehlerProzess.altZaehlernummer,
    newMeterType: zaehlerProzess.neuZaehlertyp,
  } : undefined;

  // Fertigmeldung
  const fertigmeldung = step1.fertigmeldung;
  const completionData = fertigmeldung ? {
    installationComplete: fertigmeldung.installationAbgeschlossen,
    gridOperatorNotified: fertigmeldung.netzbetreiberMeldung,
    mastrRegistered: fertigmeldung.mastrGemeldet,
    meterInstalled: fertigmeldung.zaehlerGesetzt,
    initialTestDone: fertigmeldung.erstpruefungDurchgefuehrt,
    testProtocolAvailable: fertigmeldung.pruefprotokollVorhanden,
  } : undefined;

  // Inbetriebnahme
  const ibn = step8.inbetriebnahme;
  const commissioningData = ibn ? {
    plannedDate: ibn.geplantesIbnDatum,
    actualDate: ibn.tatsaechlichesIbnDatum,
    eegDate: ibn.eegInbetriebnahme,
    mastrNumber: ibn.mastrNummer,
    mastrRegistered: ibn.mastrAngemeldet,
    mastrDate: ibn.mastrDatum,
    gridOperatorNotified: ibn.netzbetreiberGemeldet,
    gridOperatorNotificationDate: ibn.netzbetreiberMeldeDatum,
    gridOperatorConfirmation: ibn.netzbetreiberBestaetigung,
    commissioningStatus: ibn.ibnStatus,
    testProtocol: ibn.pruefprotokoll ? {
      testDate: ibn.pruefprotokoll.pruefDatum,
      testerName: ibn.pruefprotokoll.prueferName,
      insulationMOhm: ibn.pruefprotokoll.isolationsmessung?.wertMOhm,
      loopImpedanceOhm: ibn.pruefprotokoll.schleifenimpedanz?.wertOhm,
      rcdTripTimeMs: ibn.pruefprotokoll.rcdPruefung?.ausloesezeit_ms,
      rcdTripCurrentMa: ibn.pruefprotokoll.rcdPruefung?.ausloesstrom_mA,
      passed: ibn.pruefprotokoll.gesamtErgebnis === 'bestanden',
    } : undefined,
  } : undefined;

  // Fotos
  const photosData = (step7.fotos || []).map(f => ({
    category: f.kategorie,
    filename: f.filename,
    url: f.url,
    uploadedAt: toISOString(f.uploadedAt),
  }));

  return {
    caseType: step1.kategorie || 'einspeiser',
    registrationTargets: step1.komponenten,
    processType: step1.vorgangsart || undefined,

    location: {
      siteAddress: {
        street: step2.strasse,
        houseNumber: step2.hausnummer,
        zip: step2.plz,
        city: step2.ort,
        state: step2.bundesland || undefined,
        cadastralDistrict: step2.gemarkung || undefined,
        parcel: step2.flur || undefined,
        parcelNumber: step2.flurstueck || undefined,
        gpsLat: step2.gpsLat,
        gpsLng: step2.gpsLng,
      },
      netOperator: step4.netzbetreiberName ? {
        id: step4.netzbetreiberId,
        name: step4.netzbetreiberName,
        isNew: step4.netzbetreiberManuell === 'true',
      } : undefined,
      meterNumber: step4.zaehlernummer,
      meterPointId: step4.zaehlpunktbezeichnung,
    },

    // Neue Felder (Phase 1 & 2)
    meter: meterData,
    gridConnection: gridConnectionData,
    decommissioning: decommissioningData,
    meterProcess: meterProcessData,
    completion: completionData,
    commissioning: commissioningData,
    photos: photosData.length > 0 ? photosData : undefined,

    // Zähler-Bestand (Multi-Zähler mit Aktionen)
    meterInventory: (step4.zaehlerBestand || []).length > 0
      ? (step4.zaehlerBestand || []).map(z => ({
          id: z.id,
          meterNumber: z.zaehlernummer,
          meterPointId: z.zaehlpunktbezeichnung,
          type: z.typ,
          location: z.standort,
          tariffType: z.tarifart,
          lastReading: z.letzterStand,
          lastReadingFeedIn: z.letzterStandEinspeisung,
          readingDate: z.ablesedatum,
          usage: z.verwendung,
          action: z.aktion,
        }))
      : undefined,

    // Neuer Zähler Config
    newMeter: step4.zaehlerNeu ? {
      type: step4.zaehlerNeu.gewuenschterTyp,
      location: step4.zaehlerNeu.standort,
      mounting: step4.zaehlerNeu.befestigung,
      tariffType: step4.zaehlerNeu.tarifart,
      imsysRequested: step4.zaehlerNeu.imsysGewuenscht,
      forSystem: step4.zaehlerNeu.fuerAnlage,
      mergeFrom: step4.zaehlerNeu.zusammenlegungVon,
    } : undefined,

    // Eigentumsverhältnis
    ownership: data.step3 ? {
      isOwner: data.step3.istEigentuemer,
      consentAvailable: data.step3.zustimmungVorhanden,
      ownerName: data.step3.eigentuemer?.name,
      ownerAddress: data.step3.eigentuemer?.adresse,
      ownerEmail: data.step3.eigentuemer?.email,
      ownerPhone: data.step3.eigentuemer?.telefon,
    } : undefined,

    customer: {
      customerType: step6.kundentyp === 'privat' ? 'PRIVATE' : 'BUSINESS',
      firstName: step6.vorname,
      lastName: step6.nachname,
      companyName: step6.firma,
      email: step6.email,
      phone: step6.telefon,
      birthDate: step6.geburtsdatum,
      taxId: undefined,
      salutation: step6.anrede,
      title: step6.titel,
      mobile: step6.mobiltelefon,
      billingAddress: step6.rechnungsadresse && !step6.rechnungGleichStandort ? {
        street: step6.rechnungsadresse.strasse,
        houseNumber: step6.rechnungsadresse.hausnummer,
        zip: step6.rechnungsadresse.plz,
        city: step6.rechnungsadresse.ort,
      } : undefined,
      iban: step6.iban,
      bic: step6.bic,
      accountHolder: step6.kontoinhaber,
      mastrNumber: step6.mastrNummer,
      eegKey: step6.eegAnlagenschluessel,
    },

    technical: {
      pvEntries,
      inverterEntries,
      batteryEntries,
      wallboxEntries,
      heatpumpEntries,
      totalPvKwp: step5.gesamtleistungKwp,
      totalInverterKva: step5.gesamtleistungKva,
      totalBatteryKwh: step5.gesamtSpeicherKwh,
      feedInType: step5.einspeiseart === 'ueberschuss' || step5.einspeiseart === 'volleinspeisung' || step5.einspeiseart === 'nulleinspeisung'
        ? step5.einspeiseart
        : undefined,
      paragraph14a: step5.paragraph14a,
      operationMode: step5.betriebsweise,
      feedInPhases: step5.netzeinspeisungPhasen || undefined,
      reactiveCompensation: step5.blindleistungskompensation,
      feedInManagement: step5.einspeisemanagement,
      plannedCommissioning: step5.geplanteIBN,
    },

    messkonzept: step5.messkonzept || undefined,

    authorization: {
      powerOfAttorney: step8.vollmachtErteilt,
      mastrRegistration: step8.mastrVoranmeldung,
      termsAccepted: step8.agbAkzeptiert,
      privacyAccepted: step8.datenschutzAkzeptiert,
      createCustomerPortal: step8.kundenportalAnlegen ?? false,
    },

    wizardVersion: 'V19',
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Transformiert Backend Response → WizardData (für Laden eines Entwurfs)
 */
export function transformToWizardData(payload: WizardSubmitPayload): Partial<WizardData> {
  // Reverse transformation für Draft Loading
  // Hinweis: Partial<WizardData> bedeutet die Top-Level keys sind optional,
  // aber die nested Objects müssen vollständig sein
  return {
    step1: {
      kategorie: (payload.caseType as any) || null,
      komponenten: (payload.registrationTargets as any[]) || [],
      vorgangsart: null,
      groessenklasse: null,
    },
    step2: {
      strasse: payload.location.siteAddress.street,
      hausnummer: payload.location.siteAddress.houseNumber,
      plz: payload.location.siteAddress.zip,
      ort: payload.location.siteAddress.city,
      bundesland: '', // Wird aus PLZ ermittelt
      land: 'DE',
    },
    step4: {
      netzbetreiberId: payload.location.netOperator?.id,
      netzbetreiberName: payload.location.netOperator?.name,
      netzbetreiberManuell: payload.location.netOperator?.isNew ? 'true' : undefined,
      zaehlernummer: payload.location.meterNumber,
      zaehlpunktbezeichnung: payload.location.meterPointId,
    },
    step6: {
      kundentyp: payload.customer.customerType === 'PRIVATE' ? 'privat' : 'gewerbe',
      vorname: payload.customer.firstName,
      nachname: payload.customer.lastName,
      firma: payload.customer.companyName,
      email: payload.customer.email,
      telefon: payload.customer.phone || '',
      geburtsdatum: payload.customer.birthDate,
      rechnungGleichStandort: true,
    },
    step8: {
      vollmachtErteilt: payload.authorization.powerOfAttorney,
      mastrVoranmeldung: payload.authorization.mastrRegistration,
      agbAkzeptiert: payload.authorization.termsAccepted,
      datenschutzAkzeptiert: payload.authorization.privacyAccepted,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD API METHODS
// ═══════════════════════════════════════════════════════════════════════════

export const wizardApi = {
  /**
   * Neue Installation erstellen (Entwurf)
   */
  createDraft: async (data: WizardData): Promise<InstallationResponse> => {
    const payload = transformWizardData(data);
    const response = await api.post<InstallationResponse>('/installations', payload);
    return response.data;
  },
  
  /**
   * Bestehenden Entwurf aktualisieren
   */
  updateDraft: async (id: number, data: WizardData): Promise<{ success: boolean }> => {
    const payload = transformWizardData(data);
    const response = await api.patch<{ success: boolean }>(`/installations/${id}/wizard`, payload);
    return response.data;
  },
  
  /**
   * Installation einreichen (Status: EINGEREICHT)
   * Generiert und lädt automatisch alle Dokumente hoch
   */
  submit: async (data: WizardData): Promise<InstallationResponse> => {
    const payload = transformWizardData(data);

    // 1. Installation erstellen - SOFORT
    // Creating installation
    const response = await api.post<InstallationResponse>('/installations', payload);

    if (!response.data.success || !response.data.id) {
      throw new Error('Installation konnte nicht erstellt werden');
    }

    const installationId = response.data.id;
    // Installation created

    // 2. Status auf EINGEREICHT setzen - SOFORT
    try {
      await api.put(`/installations/${installationId}`, { status: 'eingegangen' });
      // Status set to eingegangen
    } catch (statusError) {
      console.warn('[Wizard] Status-Update fehlgeschlagen:', statusError);
    }

    // 3. FOTOS HOCHLADEN - vor Dokumenten!
    // Blob-URLs werden in echte Server-URLs konvertiert
    if (data.step7?.fotos && data.step7.fotos.length > 0) {
      try {
        console.log(`[Wizard] Uploading ${data.step7.fotos.length} photos...`);
        const uploadedPhotos = await uploadPhotosToServer(installationId, data.step7.fotos);

        // WizardContext mit echten URLs aktualisieren
        if (uploadedPhotos.length > 0) {
          try {
            // Hole aktuellen wizardContext und aktualisiere photos
            const currentPayload = transformWizardData(data);
            currentPayload.photos = uploadedPhotos;

            await api.patch(`/installations/${installationId}/wizard`, currentPayload);
            console.log(`[Wizard] Updated wizard context with ${uploadedPhotos.length} photo URLs`);
          } catch (updateError) {
            console.warn('[Wizard] Could not update wizard context with photo URLs:', updateError);
          }
        }
      } catch (photoError) {
        console.error('[Wizard] Photo upload failed:', photoError);
        // Nicht fatal - Installation wurde bereits erstellt
      }
    }

    // 4. Dokumente generieren und hochladen - SYNCHRON!
    // Wir warten jetzt auf den Upload damit er garantiert ausgeführt wird
    try {
      await uploadGeneratedDocuments(installationId, data, isUserAdmin());
      // All documents uploaded
    } catch (uploadError) {
      // Upload-Fehler nicht als Fatal behandeln - Installation wurde erstellt
      console.error('[Wizard] Dokument-Upload Fehler (Installation wurde trotzdem erstellt):', uploadError);
    }

    return response.data;
  },
  
  /**
   * 🚀 SCHNELLER SUBMIT - Nur Installation erstellen ohne auf Dokumente zu warten
   */
  submitWithoutDocs: async (data: WizardData): Promise<InstallationResponse> => {
    const payload = transformWizardData(data);
    const response = await api.post<InstallationResponse>('/installations', payload);

    if (response.data.success) {
      try {
        await api.put(`/installations/${response.data.id}`, { status: 'eingegangen' });
        // Status set to eingegangen
      } catch (e) {
        console.warn('[Wizard] Status-Update fehlgeschlagen:', e);
      }
    }

    return response.data;
  },

  /**
   * 🔐 ADMIN: Installation für anderen User erstellen
   * Nur für Admin/Mitarbeiter - erstellt eine Anlage im Namen eines anderen Benutzers
   */
  submitForUser: async (data: WizardData, targetUserId: number): Promise<InstallationResponse> => {
    const payload = transformWizardData(data);

    // Admin-Endpoint mit targetUserId
    const response = await api.post<InstallationResponse>('/installations/create-for-user', {
      ...payload,
      targetUserId,
    });

    if (response.data.success) {
      try {
        await api.put(`/installations/${response.data.id}`, { status: 'eingegangen' });
        console.log(`[Wizard] Admin created installation ${response.data.publicId} for user ${targetUserId}`);
      } catch (e) {
        console.warn('[Wizard] Status-Update fehlgeschlagen:', e);
      }
    }

    return response.data;
  },
  
  /**
   * 🔄 BACKGROUND UPLOAD - Generiert und lädt Dokumente im Hintergrund
   * Mit Tracking via uploadStore - User wird über Status informiert!
   */
  uploadDocumentsBackground: (installationId: number, data: WizardData, publicId?: string): void => {
    // Starting background upload for installation

    const store = useUploadStore.getState();

    // Dokument-Namen für Tracking (inkl. Fotos wenn vorhanden)
    const documentNames = [
      'Fotos',
      'Schaltplan',
      'Lageplan',
      'Vollmacht',
      'Projektmappe',
      'VDE-Formulare',
    ];

    // Store initialisieren
    store.startUpload(installationId, publicId || '', documentNames);

    // Retry Handler setzen
    const retryHandler = async () => {
      await uploadPhotosAndDocumentsWithTracking(installationId, data, isUserAdmin());
    };
    store.setRetryHandler(retryHandler);

    // Tracked Upload starten (inkl. Fotos)
    uploadPhotosAndDocumentsWithTracking(installationId, data, isUserAdmin())
      .then(() => {
        // Background upload completed
        try {
          localStorage.removeItem('wizard_pending_upload');
        } catch (e) {
          // localStorage might not be available
        }
      })
      .catch(e => {
        console.warn('[Wizard] ⚠️ Background upload failed:', e);
        store.setError(e.message || 'Upload fehlgeschlagen');
      });
  },
  
  /**
   * Installation laden (für Bearbeitung)
   */
  load: async (id: number): Promise<InstallationDetail> => {
    const response = await api.get<InstallationDetail>(`/installations/${id}`);
    return response.data;
  },
  
  /**
   * Alle eigenen Installationen laden
   */
  list: async (): Promise<{ data: InstallationDetail[] }> => {
    const response = await api.get<{ data: InstallationDetail[] }>('/installations');
    return response.data;
  },
  
  /**
   * Installation löschen (nur Entwürfe)
   */
  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/installations/${id}`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DOKUMENT API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * KOMBINIERTER UPLOAD - Fotos + Dokumente mit Tracking
 * @param isAdmin - Wenn true, wird Installateurausweis-Nummer angezeigt
 */
async function uploadPhotosAndDocumentsWithTracking(installationId: number, data: WizardData, isAdmin: boolean = false): Promise<void> {
  const store = useUploadStore.getState();

  // 1. FOTOS HOCHLADEN
  store.updateDocument('Fotos', 'uploading');
  if (data.step7?.fotos && data.step7.fotos.length > 0) {
    try {
      console.log(`[Wizard] Uploading ${data.step7.fotos.length} photos...`);
      const uploadedPhotos = await uploadPhotosToServer(installationId, data.step7.fotos);

      // WizardContext mit echten URLs aktualisieren
      if (uploadedPhotos.length > 0) {
        try {
          const currentPayload = transformWizardData(data);
          currentPayload.photos = uploadedPhotos;
          await api.patch(`/installations/${installationId}/wizard`, currentPayload);
          console.log(`[Wizard] Updated wizard context with ${uploadedPhotos.length} photo URLs`);
        } catch (updateError) {
          console.warn('[Wizard] Could not update wizard context with photo URLs:', updateError);
        }
      }

      store.updateDocument('Fotos', 'success');
    } catch (e: any) {
      store.updateDocument('Fotos', 'error', e.message || 'Foto-Upload fehlgeschlagen');
      console.error('[Wizard] Photo upload failed:', e);
    }
  } else {
    // Keine Fotos vorhanden - als erfolgreich markieren
    store.updateDocument('Fotos', 'success');
  }

  // 2. Dann normale Dokumente hochladen
  await uploadGeneratedDocumentsWithTracking(installationId, data, isAdmin);
}

/**
 * TRACKED UPLOAD - Mit Status-Updates für uploadStore
 * @param isAdmin - Wenn true, wird Installateurausweis-Nummer angezeigt
 */
async function uploadGeneratedDocumentsWithTracking(installationId: number, data: WizardData, isAdmin: boolean = false): Promise<void> {
  const store = useUploadStore.getState();

  // Starting tracked document generation for installation

  let successCount = 0;
  let errorCount = 0;

  // Dynamische Imports
  let generateSchaltplanPDF: any;
  let generateLageplanPDF: any;
  let generateVollmachtPDF: any;
  let blobToFile: any;
  let generateProjektmappePDF: any;

  try {
    const schaltplanModule = await import('../pdf/SchaltplanPDF');
    generateSchaltplanPDF = schaltplanModule.generateSchaltplanPDF;
  } catch (e) {
    console.error('[Wizard] SchaltplanPDF import failed:', e);
  }

  try {
    const lageplanModule = await import('../pdf/LageplanPDF');
    generateLageplanPDF = lageplanModule.generateLageplanPDF;
  } catch (e) {
    console.error('[Wizard] LageplanPDF import failed:', e);
  }

  try {
    const vollmachtModule = await import('../pdf/VollmachtPDF');
    generateVollmachtPDF = vollmachtModule.generateVollmachtFromWizard || vollmachtModule.generateVollmachtPDF;
  } catch (e) {
    console.error('[Wizard] VollmachtPDF import failed:', e);
  }

  try {
    const pdfUtilsModule = await import('../pdf/pdfGeneratorV2');
    blobToFile = pdfUtilsModule.blobToFile;
  } catch (e) {
    console.error('[Wizard] pdfGeneratorV2 import failed:', e);
  }

  try {
    const projektmappeModule = await import('../pdf/ProjektmappePDF');
    generateProjektmappePDF = projektmappeModule.generateProjektmappePDF;
  } catch (e) {
    console.error('[Wizard] ProjektmappePDF import failed:', e);
  }

  // 1. SCHALTPLAN (async)
  store.updateDocument('Schaltplan', 'uploading');
  if (generateSchaltplanPDF && blobToFile) {
    try {
      const result = await generateSchaltplanPDF(data);
      const file = blobToFile(result.blob, result.filename);
      await dokumentApi.upload(installationId, file, 'schaltplan', 'SCHALTPLAN');
      store.updateDocument('Schaltplan', 'success');
      successCount++;
    } catch (e: any) {
      store.updateDocument('Schaltplan', 'error', e.message || 'Generierung fehlgeschlagen');
      errorCount++;
      console.error('[Wizard] Schaltplan upload failed:', e);
    }
  } else {
    store.updateDocument('Schaltplan', 'error', 'Generator nicht verfügbar');
    errorCount++;
  }

  // 2. LAGEPLAN (async wegen MapTiler)
  store.updateDocument('Lageplan', 'uploading');
  if (generateLageplanPDF && blobToFile) {
    try {
      const result = await generateLageplanPDF(data);
      const file = blobToFile(result.blob, result.filename);
      await dokumentApi.upload(installationId, file, 'lageplan', 'LAGEPLAN');
      store.updateDocument('Lageplan', 'success');
      successCount++;
    } catch (e: any) {
      store.updateDocument('Lageplan', 'error', e.message || 'Generierung fehlgeschlagen');
      errorCount++;
      console.error('[Wizard] Lageplan upload failed:', e);
    }
  } else {
    store.updateDocument('Lageplan', 'error', 'Generator nicht verfügbar');
    errorCount++;
  }

  // 3. VOLLMACHT
  store.updateDocument('Vollmacht', 'uploading');
  if (generateVollmachtPDF && blobToFile) {
    try {
      const result = generateVollmachtPDF(data);
      const file = blobToFile(result.blob, result.filename);
      await dokumentApi.upload(installationId, file, 'vollmacht', 'VOLLMACHT');
      store.updateDocument('Vollmacht', 'success');
      successCount++;
    } catch (e: any) {
      store.updateDocument('Vollmacht', 'error', e.message || 'Generierung fehlgeschlagen');
      errorCount++;
      console.error('[Wizard] Vollmacht upload failed:', e);
    }
  } else {
    store.updateDocument('Vollmacht', 'error', 'Generator nicht verfügbar');
    errorCount++;
  }

  // 4. PROJEKTMAPPE
  store.updateDocument('Projektmappe', 'uploading');
  if (generateProjektmappePDF && blobToFile) {
    try {
      const result = generateProjektmappePDF(data);
      const file = blobToFile(result.blob, result.filename);
      await dokumentApi.upload(installationId, file, 'projektmappe', 'PROJEKTMAPPE');
      store.updateDocument('Projektmappe', 'success');
      successCount++;
    } catch (e: any) {
      store.updateDocument('Projektmappe', 'error', e.message || 'Generierung fehlgeschlagen');
      errorCount++;
      console.error('[Wizard] Projektmappe upload failed:', e);
    }
  } else {
    store.updateDocument('Projektmappe', 'error', 'Generator nicht verfügbar');
    errorCount++;
  }

  // 5. VDE-FORMULARE
  store.updateDocument('VDE-Formulare', 'uploading');
  try {
    const vdePdfModule = await import('../pdf/VDEFormularePDF');
    const { generateAllVDEPDFs } = vdePdfModule;

    if (generateAllVDEPDFs) {
      const pdfs = generateAllVDEPDFs(data, { isAdmin });
      for (const pdf of pdfs) {
        const file = new File([pdf.blob], pdf.filename, { type: 'application/pdf' });
        await dokumentApi.upload(installationId, file, `vde_${pdf.typ.toLowerCase()}`);
      }
      store.updateDocument('VDE-Formulare', 'success');
      successCount++;
    } else {
      throw new Error('generateAllVDEPDFs nicht gefunden');
    }
  } catch (e: any) {
    store.updateDocument('VDE-Formulare', 'error', e.message || 'Generierung fehlgeschlagen');
    errorCount++;
    console.error('[Wizard] VDE-Formulare upload failed:', e);
  }

  // Status aktualisieren
  const allSuccess = errorCount === 0;
  store.setComplete(allSuccess);

  // Tracked upload complete: successCount/5 succeeded, errorCount/5 failed
}

/**
 * BACKGROUND UPLOAD - Blockiert NICHT die UI!
 * Wird nach dem Submit im Hintergrund ausgeführt
 * @param isAdmin - Wenn true, wird Installateurausweis-Nummer angezeigt
 */
function uploadGeneratedDocumentsBackground(installationId: number, data: WizardData, isAdmin: boolean = false): void {
  // Fire and forget - läuft komplett im Hintergrund
  uploadGeneratedDocuments(installationId, data, isAdmin)
    .catch(e => console.warn('[Wizard] Background upload failed:', e));
}

/**
 * Generiert und lädt alle Dokumente für eine Installation hoch
 * ALLE DOKUMENTE ALS PROFESSIONELLE PDFs!
 * @param isAdmin - Wenn true, wird Installateurausweis-Nummer in VDE-Formularen angezeigt
 */
async function uploadGeneratedDocuments(installationId: number, data: WizardData, isAdmin: boolean = false): Promise<void> {
  // Starting document generation for installation

  // Dynamische Imports
  let generateSchaltplanPDF: any;
  let generateLageplanPDF: any;
  let generateVollmachtPDF: any;
  let blobToFile: any;
  let generateSingleFormular: any;
  let generateProjektmappePDF: any;
  
  try {
    const schaltplanModule = await import('../pdf/SchaltplanPDF');
    generateSchaltplanPDF = schaltplanModule.generateSchaltplanPDF;
  } catch (e) {
    console.error('[Wizard] SchaltplanPDF import failed:', e);
  }
  
  try {
    const lageplanModule = await import('../pdf/LageplanPDF');
    generateLageplanPDF = lageplanModule.generateLageplanPDF;
  } catch (e) {
    console.error('[Wizard] LageplanPDF import failed:', e);
  }
  
  try {
    const vollmachtModule = await import('../pdf/VollmachtPDF');
    // Verwende die Wrapper-Funktion die WizardData akzeptiert
    generateVollmachtPDF = vollmachtModule.generateVollmachtFromWizard || vollmachtModule.generateVollmachtPDF;
  } catch (e) {
    console.error('[Wizard] VollmachtPDF import failed:', e);
  }
  
  try {
    const pdfUtilsModule = await import('../pdf/pdfGeneratorV2');
    blobToFile = pdfUtilsModule.blobToFile;
  } catch (e) {
    console.error('[Wizard] pdfGeneratorV2 import failed:', e);
  }
  
  try {
    const vdeModule = await import('../formulare/vdeGenerator');
    generateSingleFormular = vdeModule.generateSingleFormular;
  } catch (e) {
    console.error('[Wizard] vdeGenerator import failed:', e);
  }
  
  try {
    const projektmappeModule = await import('../pdf/ProjektmappePDF');
    generateProjektmappePDF = projektmappeModule.generateProjektmappePDF;
  } catch (e) {
    console.error('[Wizard] ProjektmappePDF import failed:', e);
  }
  
  const kundenname = `${data.step6.vorname || ''}_${data.step6.nachname || ''}`.trim().replace(/\s+/g, '_') || 'Kunde';
  const datum = new Date().toISOString().split('T')[0];
  
  const uploads: Promise<any>[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════
  // 1. ÜBERSICHTSSCHALTPLAN (PDF) - async
  // ═══════════════════════════════════════════════════════════════════════
  if (generateSchaltplanPDF && blobToFile) {
    try {
      const result = await generateSchaltplanPDF(data);
      const file = blobToFile(result.blob, result.filename);
      uploads.push(
        dokumentApi.upload(installationId, file, 'schaltplan', 'SCHALTPLAN')
          .catch(e => console.error('[Wizard] Schaltplan upload failed:', e.message || e))
      );
    } catch (e: any) {
      console.error('[Wizard] Schaltplan generation failed:', e.message || e);
    }
  } else {
    console.error('[Wizard] Schaltplan skipped - generator not available');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 2. LAGEPLAN (PDF mit MapTiler Satellitenbild)
  // ═══════════════════════════════════════════════════════════════════════
  if (generateLageplanPDF && blobToFile) {
    try {
      const result = await generateLageplanPDF(data);  // async wegen MapTiler!
      const file = blobToFile(result.blob, result.filename);
      uploads.push(
        dokumentApi.upload(installationId, file, 'lageplan', 'LAGEPLAN')
          .catch(e => console.error('[Wizard] Lageplan upload failed:', e.message || e))
      );
    } catch (e: any) {
      console.error('[Wizard] Lageplan generation failed:', e.message || e);
    }
  } else {
    console.error('[Wizard] Lageplan skipped - generator not available');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 3. VOLLMACHT (PDF mit digitaler Signatur)
  // ═══════════════════════════════════════════════════════════════════════
  const vollmachtErteilt = data.step8?.vollmachtErteilt !== false; // Default: true wenn nicht explizit false

  if (generateVollmachtPDF && blobToFile) {
    try {
      const result = generateVollmachtPDF(data);
      const file = blobToFile(result.blob, result.filename);
      uploads.push(
        dokumentApi.upload(installationId, file, 'vollmacht', 'VOLLMACHT')
          .catch(e => console.error('[Wizard] Vollmacht upload failed:', e.message || e))
      );
    } catch (e: any) {
      console.error('[Wizard] Vollmacht generation failed:', e.message || e);
    }
  } else {
    console.warn('[Wizard] Vollmacht skipped:',
      !generateVollmachtPDF ? 'no generator' : 'no blobToFile');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 4. PROJEKTMAPPE (PDF - direkt gezeichnet)
  // ═══════════════════════════════════════════════════════════════════════
  if (generateProjektmappePDF && blobToFile) {
    try {
      const result = generateProjektmappePDF(data);
      const file = blobToFile(result.blob, result.filename);
      uploads.push(
        dokumentApi.upload(installationId, file, 'projektmappe', 'PROJEKTMAPPE')
          .catch(e => console.error('[Wizard] Projektmappe upload failed:', e.message || e))
      );
    } catch (e: any) {
      console.error('[Wizard] Projektmappe generation failed:', e.message || e);
    }
  } else {
    console.error('[Wizard] Projektmappe skipped - generator not available');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // 5. VDE-FORMULARE (als echte PDFs!)
  // ═══════════════════════════════════════════════════════════════════════
  
  let vdePdfSuccess = false;
  
  try {
    // Dynamischer Import der PDF-Generator-Funktion
    const vdePdfModule = await import('../pdf/VDEFormularePDF');
    const { generateAllVDEPDFs } = vdePdfModule;

    if (!generateAllVDEPDFs) {
      throw new Error('generateAllVDEPDFs nicht gefunden im Modul');
    }

    // Alle relevanten PDFs generieren - isAdmin steuert ob Eintragungsnummer angezeigt wird
    const pdfs = generateAllVDEPDFs(data, { isAdmin });

    if (pdfs.length === 0) {
      throw new Error('Keine PDFs generiert');
    }

    // Jedes PDF hochladen
    for (const pdf of pdfs) {
      try {
        const file = new File([pdf.blob], pdf.filename, { type: 'application/pdf' });
        uploads.push(
          dokumentApi.upload(installationId, file, `vde_${pdf.typ.toLowerCase()}`)
            .catch(e => console.error(`[Wizard] VDE ${pdf.typ} upload failed:`, e))
        );
      } catch (e) {
        console.error(`[Wizard] VDE ${pdf.typ} upload preparation failed:`, e);
      }
    }

    vdePdfSuccess = true;

  } catch (e) {
    console.error('[Wizard] VDE-PDF generation failed:', e);
  }
  
  // HTML-Fallback NUR wenn PDF komplett fehlgeschlagen ist
  if (!vdePdfSuccess && generateSingleFormular) {
    // Using HTML fallback because PDF generation failed
      // E.1 Antragstellung
      try {
        const e1 = generateSingleFormular(data, 'E1');
        if (e1) {
          uploads.push(
            dokumentApi.saveGenerated(
              installationId,
              e1.html,
              `VDE_E1_Antragstellung_${kundenname}_${datum}.html`,
              'vde_e1',
              'text/html'
            )
              .catch(e => console.error('[Wizard] VDE E.1 HTML fallback failed:', e))
          );
        }
      } catch (e) {
        console.error('[Wizard] VDE E.1 HTML failed:', e);
      }

      // E.2 Datenblatt
      try {
        const e2 = generateSingleFormular(data, 'E2');
        if (e2) {
          uploads.push(
            dokumentApi.saveGenerated(
              installationId,
              e2.html,
              `VDE_E2_Datenblatt_${kundenname}_${datum}.html`,
              'vde_e2',
              'text/html'
            )
              .catch(e => console.error('[Wizard] VDE E.2 HTML fallback failed:', e))
          );
        }
      } catch (e) {
        console.error('[Wizard] VDE E.2 HTML failed:', e);
      }

      // E.3 Speicher (nur wenn vorhanden)
      if (data.step1.komponenten.includes('speicher')) {
        try {
          const e3 = generateSingleFormular(data, 'E3');
          if (e3) {
            uploads.push(
              dokumentApi.saveGenerated(
                installationId,
                e3.html,
                `VDE_E3_Speicher_${kundenname}_${datum}.html`,
                'vde_e3',
                'text/html'
              )
                .catch(e => console.error('[Wizard] VDE E.3 HTML fallback failed:', e))
            );
          }
        } catch (e) {
          console.error('[Wizard] VDE E.3 HTML failed:', e);
        }
      }
      
      // E.8 IBN-Protokoll
      try {
        const e8 = generateSingleFormular(data, 'E8');
        if (e8) {
          uploads.push(
            dokumentApi.saveGenerated(
              installationId,
              e8.html,
              `VDE_E8_IBN_Protokoll_${kundenname}_${datum}.html`,
              'vde_e8',
              'text/html'
            )
              .catch(e => console.error('[Wizard] VDE E.8 HTML fallback failed:', e))
          );
        }
      } catch (e) {
        console.error('[Wizard] VDE E.8 HTML failed:', e);
      }
    }

  // Alle Uploads parallel ausführen
  const results = await Promise.allSettled(uploads);
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
    console.error(`[Wizard] ${failed}/${results.length} uploads failed`);
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[Wizard] Upload ${i + 1} error:`, r.reason);
      }
    });
  }
}

export const dokumentApi = {
  /**
   * Dokument zu Installation hochladen
   * WICHTIG: Nutzt /api/documents/upload (nicht /installations/:id/documents!)
   */
  upload: async (
    installationId: number,
    file: File,
    dokumentTyp: string,  // Pflichtfeld!
    kategorie?: string
  ): Promise<{ success: boolean; id?: number; url?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('installationId', String(installationId));
    formData.append('dokumentTyp', dokumentTyp);  // PFLICHT laut Backend
    if (kategorie) formData.append('kategorie', kategorie);
    
    // Token aus localStorage holen
    const token = api.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DokumentApi] Upload failed: ${response.status}`, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return { success: true, id: result.id, url: result.url };
  },
  
  /**
   * Generiertes Dokument speichern (SVG/HTML → Server)
   */
  saveGenerated: async (
    installationId: number,
    content: string,
    filename: string,
    dokumentTyp: string,  // z.B. "schaltplan", "lageplan"
    mimeType: string = 'image/svg+xml'
  ): Promise<{ success: boolean; id?: number; url?: string }> => {
    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });
    
    return dokumentApi.upload(installationId, file, dokumentTyp);
  },
  
  /**
   * Dokumente einer Installation abrufen
   */
  list: async (installationId: number): Promise<{ data: any[] }> => {
    const response = await api.get<{ data: any[] }>(`/installations/${installationId}/documents`);
    return response.data;
  },
  
  /**
   * Dokument löschen
   */
  delete: async (documentId: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/documents/${documentId}`);
    return response.data;
  },
};

export default wizardApi;

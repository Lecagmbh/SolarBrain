/**
 * Baunity Data Adapter
 * =====================
 * Konvertiert verschiedene Datenquellen zu UnifiedInstallationData
 */

import type {
  UnifiedInstallationData,
  UnifiedCustomer,
  UnifiedAddress,
  UnifiedPVModule,
  UnifiedInverter,
  UnifiedStorage,
  UnifiedWallbox,
  UnifiedHeatPump,
  Messkonzept,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD DATA ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Konvertiert WizardData zu UnifiedInstallationData
 */
export function fromWizardData(wizard: any): UnifiedInstallationData {
  const step2 = wizard.step2 || {};
  const step4 = wizard.step4 || {};
  const step5 = wizard.step5 || {};
  const step6 = wizard.step6 || {};
  const step7 = wizard.step7 || {};

  // PV-Module aus Dachflächen extrahieren
  const pvModule: UnifiedPVModule[] = (step5.dachflaechen || []).map((d: any) => ({
    name: d.name || 'Dachfläche',
    hersteller: d.modulHersteller || '',
    modell: d.modulModell || '',
    anzahl: d.modulAnzahl || 0,
    leistungWp: d.modulLeistungWp || 0,
    ausrichtung: d.ausrichtung || 'S',
    neigung: d.neigung || 30,
  }));

  // Wechselrichter
  const wechselrichter: UnifiedInverter[] = (step5.wechselrichter || []).map((w: any) => ({
    hersteller: w.hersteller || '',
    modell: w.modell || '',
    leistungKva: w.leistungKva || 0,
    anzahl: w.anzahl || 1,
    zerezId: w.zerezId || '',
    napiId: w.napiId || '',
  }));

  // Speicher
  const speicher: UnifiedStorage[] = (step5.speicher || []).map((s: any) => ({
    hersteller: s.hersteller || '',
    modell: s.modell || '',
    kapazitaetKwh: s.kapazitaetKwh || 0,
    leistungKw: s.leistungKw || 0,
    anzahl: s.anzahl || 1,
    kopplung: s.kopplung || 'dc',
    zerezId: s.zerezId || '',
  }));

  // Wallboxen
  const wallboxen: UnifiedWallbox[] = (step5.wallboxen || []).map((w: any) => ({
    hersteller: w.hersteller || '',
    modell: w.modell || '',
    leistungKw: w.leistungKw || 11,
    anzahl: w.anzahl || 1,
  }));

  // Wärmepumpen
  const waermepumpen: UnifiedHeatPump[] = (step5.waermepumpen || []).map((w: any) => ({
    hersteller: w.hersteller || '',
    modell: w.modell || '',
    leistungKw: w.leistungKw || 0,
  }));

  // Berechnete Werte
  const gesamtleistungKwp = pvModule.reduce((sum, m) => sum + (m.anzahl * m.leistungWp / 1000), 0) ||
    step5.gesamtleistungKwp || 0;
  const gesamtleistungKva = wechselrichter.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) ||
    step5.gesamtleistungKva || 0;
  const speicherKapazitaetKwh = speicher.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0);

  return {
    // Kunde
    kunde: {
      anrede: step6.anrede || '',
      vorname: step6.vorname || '',
      nachname: step6.nachname || '',
      firma: step6.firma || '',
      email: step6.email || '',
      telefon: step6.telefon || step6.mobiltelefon || '',
      geburtsdatum: step6.geburtsdatum || '',
    },

    // Standort
    standort: {
      strasse: step2.strasse || '',
      hausnummer: step2.hausnummer || '',
      plz: step2.plz || '',
      ort: step2.ort || '',
      bundesland: step2.bundesland || '',
      gemarkung: step2.gemarkung || '',
      flur: step2.flur || '',
      flurstueck: step2.flurstueck || '',
    },

    // Technische Daten
    pvModule,
    wechselrichter,
    speicher,
    wallboxen,
    waermepumpen,

    // Berechnete Werte
    gesamtleistungKwp,
    gesamtleistungKva,
    speicherKapazitaetKwh,

    // Netz
    netzbetreiber: step4.netzbetreiberName ? {
      name: step4.netzbetreiberName,
      id: step4.netzbetreiberId,
    } : undefined,
    zaehlernummer: step4.zaehlernummer || '',
    zaehlpunktbezeichnung: step4.zaehlpunktbezeichnung || '',
    messkonzept: (step5.messkonzept || 'zweirichtung') as Messkonzept,

    // NA-Schutz
    napiErforderlich: step5.naSchutzErforderlich || gesamtleistungKva > 30,

    // Termine
    geplantesIBNDatum: step5.geplantesIBNDatum || step7.geplantesIBNDatum || '',

    // Vollmacht
    vollmachtErteilt: step7.vollmachtErteilt || wizard.authorization?.powerOfAttorney || false,
    mastrRegistrierung: step7.mastrRegistrierung || wizard.authorization?.mastrRegistration || false,

    // Meta
    erstelltAm: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLATION DETAIL ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Konvertiert InstallationDetail zu UnifiedInstallationData
 */
export function fromInstallationDetail(detail: any): UnifiedInstallationData {
  // WizardContext parsen falls vorhanden
  let wizardData: any = {};
  if (detail.wizardContext) {
    try {
      wizardData = typeof detail.wizardContext === 'string'
        ? JSON.parse(detail.wizardContext)
        : detail.wizardContext;
    } catch {
      wizardData = {};
    }
  }

  // Technische Daten aus verschiedenen Quellen extrahieren
  const techData = detail.technicalData || detail.technicalDetails || {};
  const step5 = wizardData.step5 || {};
  const step6 = wizardData.step6 || {};

  // PV-Module
  const pvModule: UnifiedPVModule[] = extractPVModules(detail, wizardData);

  // Wechselrichter
  const wechselrichter: UnifiedInverter[] = extractInverters(detail, wizardData);

  // Speicher
  const speicher: UnifiedStorage[] = extractStorage(detail, wizardData);

  // Wallboxen
  const wallboxen: UnifiedWallbox[] = extractWallboxes(detail, wizardData);

  // Wärmepumpen
  const waermepumpen: UnifiedHeatPump[] = extractHeatPumps(detail, wizardData);

  // Berechnete Werte
  const gesamtleistungKwp = detail.totalKwp ||
    pvModule.reduce((sum, m) => sum + (m.anzahl * m.leistungWp / 1000), 0) || 0;
  const gesamtleistungKva = wechselrichter.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) ||
    gesamtleistungKwp * 1.1;
  const speicherKapazitaetKwh = detail.speicherKwh ||
    speicher.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0);

  // Kunde aus verschiedenen Quellen
  const customer = detail.customer || {};
  const kundeVorname = customer.vorname || step6.vorname || detail.customerName?.split(' ')[0] || '';
  const kundeNachname = customer.nachname || step6.nachname ||
    detail.customerName?.split(' ').slice(1).join(' ') || detail.customerName || '';

  return {
    id: detail.id,
    publicId: detail.publicId,

    // Kunde
    kunde: {
      anrede: customer.anrede || step6.anrede || '',
      vorname: kundeVorname,
      nachname: kundeNachname,
      firma: customer.firma || step6.firma || '',
      email: customer.email || detail.contactEmail || step6.email || '',
      telefon: customer.telefon || detail.contactPhone || step6.telefon || '',
      geburtsdatum: customer.geburtsdatum || step6.geburtsdatum || '',
    },

    // Standort
    standort: {
      strasse: detail.strasse || wizardData.step2?.strasse || '',
      hausnummer: detail.hausNr || wizardData.step2?.hausnummer || '',
      plz: detail.plz || wizardData.step2?.plz || '',
      ort: detail.ort || wizardData.step2?.ort || '',
      bundesland: wizardData.step2?.bundesland || '',
      gemarkung: wizardData.step2?.gemarkung || '',
      flur: wizardData.step2?.flur || '',
      flurstueck: wizardData.step2?.flurstueck || '',
    },

    // Technische Daten
    pvModule,
    wechselrichter,
    speicher,
    wallboxen,
    waermepumpen,

    // Berechnete Werte
    gesamtleistungKwp,
    gesamtleistungKva,
    speicherKapazitaetKwh,

    // Netz
    netzbetreiber: detail.gridOperator ? {
      name: detail.gridOperator,
      id: detail.gridOperatorId,
      portalUrl: detail.nbPortalUrl,
    } : wizardData.step4?.netzbetreiberName ? {
      name: wizardData.step4.netzbetreiberName,
      id: wizardData.step4.netzbetreiberId,
    } : undefined,
    zaehlernummer: detail.zaehlernummer || wizardData.step4?.zaehlernummer || '',
    zaehlpunktbezeichnung: wizardData.step4?.zaehlpunktbezeichnung || '',
    messkonzept: (detail.messkonzept || step5.messkonzept || 'zweirichtung') as Messkonzept,

    // NA-Schutz
    napiErforderlich: step5.naSchutzErforderlich || gesamtleistungKva > 30,

    // Termine
    geplantesIBNDatum: detail.geplantesIBNDatum || step5.geplantesIBNDatum || '',

    // Vollmacht
    vollmachtErteilt: wizardData.authorization?.powerOfAttorney || true,
    mastrRegistrierung: wizardData.authorization?.mastrRegistration || false,

    // Meta
    erstelltAm: detail.createdAt || new Date().toISOString(),
    erstelltVon: detail.createdByName || '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function extractPVModules(detail: any, wizardData: any): UnifiedPVModule[] {
  // Priorität: wizardData.step5.dachflaechen > technicalData > technicalDetails
  if (wizardData.step5?.dachflaechen?.length) {
    return wizardData.step5.dachflaechen.map((d: any) => ({
      name: d.name || 'Dachfläche',
      hersteller: d.modulHersteller || '',
      modell: d.modulModell || '',
      anzahl: d.modulAnzahl || 0,
      leistungWp: d.modulLeistungWp || 0,
      ausrichtung: d.ausrichtung || 'S',
      neigung: d.neigung || 30,
    }));
  }

  const techData = detail.technicalData || detail.technicalDetails || {};
  const pvData = techData.pvModules || techData.pv || techData.dachflaechen || [];

  if (Array.isArray(pvData) && pvData.length > 0) {
    return pvData.map((p: any, i: number) => ({
      name: p.name || `Dachfläche ${i + 1}`,
      hersteller: p.manufacturer || p.hersteller || p.modulHersteller || '',
      modell: p.model || p.modell || p.modulModell || '',
      anzahl: p.count || p.anzahl || p.moduleCount || p.modulAnzahl || 1,
      leistungWp: p.powerWp || p.leistungWp || p.modulLeistungWp || 400,
      ausrichtung: p.orientation || p.ausrichtung || 'S',
      neigung: p.tilt || p.neigung || 30,
    }));
  }

  // Fallback: Einzelne Dachfläche aus Gesamtdaten
  if (detail.totalKwp && detail.totalKwp > 0) {
    const moduleCount = Math.ceil(detail.totalKwp * 1000 / 400);
    return [{
      name: 'Dachfläche 1',
      hersteller: '',
      modell: '',
      anzahl: moduleCount,
      leistungWp: 400,
      ausrichtung: 'S',
      neigung: 30,
    }];
  }

  return [];
}

function extractInverters(detail: any, wizardData: any): UnifiedInverter[] {
  if (wizardData.step5?.wechselrichter?.length) {
    return wizardData.step5.wechselrichter.map((w: any) => ({
      hersteller: w.hersteller || '',
      modell: w.modell || '',
      leistungKva: w.leistungKva || 0,
      anzahl: w.anzahl || 1,
      zerezId: w.zerezId || '',
      napiId: w.napiId || '',
    }));
  }

  const techData = detail.technicalData || detail.technicalDetails || {};
  const invData = techData.inverters || techData.wechselrichter || [];

  if (Array.isArray(invData) && invData.length > 0) {
    return invData.map((w: any) => ({
      hersteller: w.manufacturer || w.hersteller || '',
      modell: w.model || w.modell || '',
      leistungKva: w.powerKw || w.leistungKva || w.leistungKw || 0,
      anzahl: w.count || w.anzahl || 1,
      zerezId: w.zerezId || '',
      napiId: w.napiId || '',
    }));
  }

  return [];
}

function extractStorage(detail: any, wizardData: any): UnifiedStorage[] {
  if (wizardData.step5?.speicher?.length) {
    return wizardData.step5.speicher.map((s: any) => ({
      hersteller: s.hersteller || '',
      modell: s.modell || '',
      kapazitaetKwh: s.kapazitaetKwh || 0,
      leistungKw: s.leistungKw || 0,
      anzahl: s.anzahl || 1,
      kopplung: s.kopplung || 'dc',
      zerezId: s.zerezId || '',
    }));
  }

  const techData = detail.technicalData || detail.technicalDetails || {};
  const storageData = techData.storage || techData.speicher || [];

  if (Array.isArray(storageData) && storageData.length > 0) {
    return storageData.map((s: any) => ({
      hersteller: s.manufacturer || s.hersteller || '',
      modell: s.model || s.modell || '',
      kapazitaetKwh: s.capacityKwh || s.kapazitaetKwh || s.kapazitaetNettoKwh || 0,
      leistungKw: s.powerKw || s.leistungKw || 0,
      anzahl: s.count || s.anzahl || 1,
      kopplung: (s.coupling || s.kopplung || 'dc') as 'ac' | 'dc',
      zerezId: s.zerezId || '',
    }));
  }

  // Fallback aus speicherKwh
  if (detail.speicherKwh && detail.speicherKwh > 0) {
    return [{
      hersteller: '',
      modell: '',
      kapazitaetKwh: detail.speicherKwh,
      leistungKw: 0,
      anzahl: 1,
      kopplung: 'dc',
    }];
  }

  return [];
}

function extractWallboxes(detail: any, wizardData: any): UnifiedWallbox[] {
  if (wizardData.step5?.wallboxen?.length) {
    return wizardData.step5.wallboxen.map((w: any) => ({
      hersteller: w.hersteller || '',
      modell: w.modell || '',
      leistungKw: w.leistungKw || 11,
      anzahl: w.anzahl || 1,
    }));
  }

  const techData = detail.technicalData || detail.technicalDetails || {};
  const wallboxData = techData.wallbox || techData.wallboxen || [];

  if (Array.isArray(wallboxData) && wallboxData.length > 0) {
    return wallboxData.map((w: any) => ({
      hersteller: w.manufacturer || w.hersteller || '',
      modell: w.model || w.modell || '',
      leistungKw: w.powerKw || w.leistungKw || 11,
      anzahl: w.count || w.anzahl || 1,
    }));
  }

  return [];
}

function extractHeatPumps(detail: any, wizardData: any): UnifiedHeatPump[] {
  if (wizardData.step5?.waermepumpen?.length) {
    return wizardData.step5.waermepumpen.map((w: any) => ({
      hersteller: w.hersteller || '',
      modell: w.modell || '',
      leistungKw: w.leistungKw || 0,
    }));
  }

  const techData = detail.technicalData || detail.technicalDetails || {};
  const hpData = techData.heatPump || techData.waermepumpen || [];

  if (Array.isArray(hpData) && hpData.length > 0) {
    return hpData.map((w: any) => ({
      hersteller: w.manufacturer || w.hersteller || '',
      modell: w.model || w.modell || '',
      leistungKw: w.powerKw || w.leistungKw || 0,
    }));
  }

  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Automatische Erkennung und Konvertierung
 */
export function toUnifiedData(input: any): UnifiedInstallationData {
  // Wizard-Format erkennen (hat step1, step2, etc.)
  if (input.step1 || input.step2 || input.step5) {
    return fromWizardData(input);
  }

  // InstallationDetail-Format (hat id, publicId, etc.)
  return fromInstallationDetail(input);
}

/**
 * Baunity Intelligence - NB-Portal-Integration & Formular-Generator
 * Generiert vorausgefüllte VDE-Formulare und NB-spezifische Dokumente
 */

import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';

// VDE Formular-Typen
export type VDEFormular = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8' | 'E9';

export interface FormularDaten {
  formular: VDEFormular;
  titel: string;
  beschreibung: string;
  pflichtfelder: string[];
  ausgefuellt: Record<string, string | number | boolean>;
  vollstaendig: boolean;
  fehlendeFelder: string[];
}

export interface NBPortalInfo {
  nbId: string;
  nbName: string;
  portalUrl: string;
  portalTyp: 'online' | 'email' | 'post';
  anleitung: string[];
  besonderheiten: string[];
  uploadFormate: string[];
  maxDateigroesse: string;
  kontakt: {
    email?: string;
    telefon?: string;
    fax?: string;
  };
}

// Formular-Definitionen
const FORMULAR_DEFINITIONEN: Record<VDEFormular, { titel: string; beschreibung: string; felder: string[] }> = {
  'E1': {
    titel: 'Anmeldung einer Erzeugungsanlage',
    beschreibung: 'Grunddaten der Anlage und des Betreibers',
    felder: ['betreiberName', 'betreiberAdresse', 'anlagenstandort', 'anlagenleistung', 'inbetriebnahmedatum', 'installateur', 'netzbetreiber'],
  },
  'E2': {
    titel: 'Datenblatt Erzeugungsanlage',
    beschreibung: 'Technische Daten der PV-Anlage',
    felder: ['modulHersteller', 'modulTyp', 'modulLeistung', 'modulAnzahl', 'wrHersteller', 'wrTyp', 'wrLeistung', 'wrAnzahl', 'gesamtleistung'],
  },
  'E3': {
    titel: 'Inbetriebnahmeprotokoll',
    beschreibung: 'Dokumentation der Inbetriebnahme',
    felder: ['inbetriebnahmedatum', 'installateur', 'messwerte', 'pruefergebnis'],
  },
  'E4': {
    titel: 'Einheitenzertifikat / Konformitätsnachweis',
    beschreibung: 'Zertifikate für Wechselrichter und Module',
    felder: ['wrZerezId', 'wrZertifikat', 'modulZertifikat'],
  },
  'E5': {
    titel: 'Datenblatt Speicher',
    beschreibung: 'Technische Daten des Batteriespeichers',
    felder: ['speicherHersteller', 'speicherTyp', 'speicherKapazitaet', 'speicherLeistung', 'kopplung'],
  },
  'E6': {
    titel: 'NA-Schutz Zertifikat',
    beschreibung: 'Netz- und Anlagenschutz bei Anlagen >30 kVA',
    felder: ['naSchutzTyp', 'naSchutzHersteller', 'naSchutzZertifikat', 'pruefprotokoll'],
  },
  'E7': {
    titel: '§14a Anmeldung steuerbare Verbrauchseinrichtung',
    beschreibung: 'Anmeldung von Wallbox/Wärmepumpe nach §14a EnWG',
    felder: ['geraeteTyp', 'leistung', 'steuerungsMoeglichkeit', 'modul'],
  },
  'E8': {
    titel: 'Lageplan',
    beschreibung: 'Standort der Anlage auf dem Grundstück',
    felder: ['lageplan'],
  },
  'E9': {
    titel: 'Übersichtsschaltplan',
    beschreibung: 'Elektrischer Anschlussplan',
    felder: ['schaltplan'],
  },
};

/**
 * Ermittelt welche Formulare für die Anmeldung erforderlich sind
 */
export function ermittleErforderlicheFormulare(data: WizardData): VDEFormular[] {
  const formulare: VDEFormular[] = ['E1']; // Immer erforderlich
  const k = data.step1.komponenten;
  const gesamtKva = data.step5.gesamtleistungKva || 0;
  
  if (k.includes('pv')) {
    formulare.push('E2', 'E4', 'E8', 'E9');
    
    // E3 nur bei Inbetriebnahme
    if (data.step1.vorgangsart === 'inbetriebnahme') {
      formulare.push('E3');
    }
  }
  
  if (k.includes('speicher')) {
    formulare.push('E5');
  }
  
  if (gesamtKva > 30) {
    formulare.push('E6');
  }
  
  if ((k.includes('wallbox') || k.includes('waermepumpe')) && 
      ((data.step5.wallbox?.leistungKw || 0) > 4.2 || (data.step5.waermepumpe?.leistungKw || 0) > 4.2)) {
    formulare.push('E7');
  }
  
  return formulare;
}

/**
 * Füllt ein Formular mit Wizard-Daten aus
 */
export function fuelleFormular(formular: VDEFormular, data: WizardData): FormularDaten {
  const def = FORMULAR_DEFINITIONEN[formular];
  const ausgefuellt: Record<string, string | number | boolean> = {};
  const fehlendeFelder: string[] = [];
  
  // Mapping der Wizard-Daten auf Formularfelder
  switch (formular) {
    case 'E1':
      ausgefuellt['betreiberName'] = `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim();
      ausgefuellt['betreiberAdresse'] = `${data.step2.strasse || ''} ${data.step2.hausnummer || ''}, ${data.step2.plz || ''} ${data.step2.ort || ''}`.trim();
      ausgefuellt['anlagenstandort'] = ausgefuellt['betreiberAdresse'];
      ausgefuellt['anlagenleistung'] = data.step5.gesamtleistungKwp || 0;
      ausgefuellt['netzbetreiber'] = data.step4.netzbetreiberName || '';
      ausgefuellt['installateur'] = COMPANY.name;
      ausgefuellt['installateurAdresse'] = `${COMPANY.strasse}, ${COMPANY.plz} ${COMPANY.ort}`;
      break;
      
    case 'E2':
      const ersteDachflaeche = data.step5.dachflaechen?.[0];
      const ersterWR = data.step5.wechselrichter?.[0];
      ausgefuellt['modulHersteller'] = ersteDachflaeche?.modulHersteller || data.step5.pvModule?.hersteller || '';
      ausgefuellt['modulTyp'] = ersteDachflaeche?.modulModell || data.step5.pvModule?.modell || '';
      ausgefuellt['modulLeistung'] = ersteDachflaeche?.modulLeistungWp || data.step5.pvModule?.leistungWp || 0;
      ausgefuellt['modulAnzahl'] = data.step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || data.step5.pvModule?.anzahl || 0;
      ausgefuellt['wrHersteller'] = ersterWR?.hersteller || '';
      ausgefuellt['wrTyp'] = ersterWR?.modell || '';
      ausgefuellt['wrLeistung'] = ersterWR?.leistungKva || 0;
      ausgefuellt['wrAnzahl'] = data.step5.wechselrichter?.reduce((s, w) => s + w.anzahl, 0) || 1;
      ausgefuellt['gesamtleistung'] = data.step5.gesamtleistungKwp || 0;
      break;
      
    case 'E4':
      ausgefuellt['wrZerezId'] = data.step5.wechselrichter?.[0]?.zerezId || '';
      break;
      
    case 'E5':
      const ersterSpeicher = data.step5.speicher?.[0];
      ausgefuellt['speicherHersteller'] = ersterSpeicher?.hersteller || '';
      ausgefuellt['speicherTyp'] = ersterSpeicher?.modell || '';
      ausgefuellt['speicherKapazitaet'] = data.step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0;
      ausgefuellt['speicherLeistung'] = ersterSpeicher?.leistungKw || 0;
      ausgefuellt['kopplung'] = ersterSpeicher?.kopplung || '';
      break;
      
    case 'E7':
      const geraete: string[] = [];
      if (data.step1.komponenten.includes('wallbox')) geraete.push('Wallbox');
      if (data.step1.komponenten.includes('waermepumpe')) geraete.push('Wärmepumpe');
      ausgefuellt['geraeteTyp'] = geraete.join(', ');
      ausgefuellt['leistungWallbox'] = data.step5.wallboxen?.[0]?.leistungKw || 0;
      ausgefuellt['leistungWP'] = data.step5.waermepumpen?.[0]?.leistungKw || 0;
      ausgefuellt['modul'] = data.step5.paragraph14a?.modul || 1;
      break;
  }
  
  // Prüfe Vollständigkeit
  for (const feld of def.felder) {
    if (!ausgefuellt[feld] || ausgefuellt[feld] === '' || ausgefuellt[feld] === 0) {
      fehlendeFelder.push(feld);
    }
  }
  
  return {
    formular,
    titel: def.titel,
    beschreibung: def.beschreibung,
    pflichtfelder: def.felder,
    ausgefuellt,
    vollstaendig: fehlendeFelder.length === 0,
    fehlendeFelder,
  };
}

/**
 * Generiert alle erforderlichen Formulare
 */
export function generiereAlleFormulare(data: WizardData): FormularDaten[] {
  const erforderlich = ermittleErforderlicheFormulare(data);
  return erforderlich.map(f => fuelleFormular(f, data));
}

/**
 * Generiert E.1 als HTML für Druck/PDF
 */
export function generiereE1HTML(data: WizardData): string {
  const fd = fuelleFormular('E1', data);
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>E.1 Anmeldung Erzeugungsanlage</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    .section { margin: 20px 0; padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; }
    .section h2 { margin: 0 0 10px 0; color: #065f46; font-size: 14px; }
    .field { display: flex; margin: 8px 0; }
    .field-label { width: 200px; font-weight: bold; }
    .field-value { flex: 1; border-bottom: 1px solid #ccc; min-height: 20px; }
    .signature { margin-top: 40px; display: flex; gap: 50px; }
    .signature-box { flex: 1; }
    .signature-line { border-bottom: 1px solid #333; height: 50px; margin-bottom: 5px; }
    .footer { margin-top: 40px; font-size: 10px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>E.1 - Anmeldung einer Erzeugungsanlage</h1>
  
  <div class="section">
    <h2>1. ANLAGENBETREIBER</h2>
    <div class="field"><span class="field-label">Name:</span><span class="field-value">${fd.ausgefuellt.betreiberName}</span></div>
    <div class="field"><span class="field-label">Adresse:</span><span class="field-value">${fd.ausgefuellt.betreiberAdresse}</span></div>
    <div class="field"><span class="field-label">E-Mail:</span><span class="field-value">${data.step6.email || ''}</span></div>
    <div class="field"><span class="field-label">Telefon:</span><span class="field-value">${data.step6.telefon || ''}</span></div>
  </div>
  
  <div class="section">
    <h2>2. ANLAGENSTANDORT</h2>
    <div class="field"><span class="field-label">Adresse:</span><span class="field-value">${fd.ausgefuellt.anlagenstandort}</span></div>
    <div class="field"><span class="field-label">Flurstück:</span><span class="field-value">${data.step2.flurstueck || ''}</span></div>
    <div class="field"><span class="field-label">Gemarkung:</span><span class="field-value">${data.step2.gemarkung || ''}</span></div>
  </div>
  
  <div class="section">
    <h2>3. ANLAGENDATEN</h2>
    <div class="field"><span class="field-label">Anlagenleistung:</span><span class="field-value">${fd.ausgefuellt.anlagenleistung} kWp</span></div>
    <div class="field"><span class="field-label">Anlagentyp:</span><span class="field-value">${data.step1.komponenten.join(', ')}</span></div>
    <div class="field"><span class="field-label">Einspeiseart:</span><span class="field-value">${data.step5.einspeiseart || 'Überschusseinspeisung'}</span></div>
  </div>
  
  <div class="section">
    <h2>4. NETZBETREIBER</h2>
    <div class="field"><span class="field-label">Name:</span><span class="field-value">${fd.ausgefuellt.netzbetreiber}</span></div>
  </div>
  
  <div class="section">
    <h2>5. INSTALLATEUR</h2>
    <div class="field"><span class="field-label">Firma:</span><span class="field-value">${COMPANY.name}</span></div>
    <div class="field"><span class="field-label">Adresse:</span><span class="field-value">${COMPANY.strasse}, ${COMPANY.plz} ${COMPANY.ort}</span></div>
  </div>
  
  <div class="signature">
    <div class="signature-box">
      <div class="signature-line">${data.step8.signatur ? `<img src="${data.step8.signatur}" style="max-height:45px;"/>` : ''}</div>
      <div>Ort, Datum, Unterschrift Betreiber</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div>Stempel/Unterschrift Installateur</div>
    </div>
  </div>
  
  <div class="footer">
    Erstellt am ${new Date().toLocaleDateString('de-DE')} | ${COMPANY.name} | ${COMPANY.telefon}
  </div>
</body>
</html>`;
}

/**
 * NB-Portal Informationen
 */
export const NB_PORTAL_INFO: Record<string, NBPortalInfo> = {
  'bayernwerk': {
    nbId: 'bayernwerk',
    nbName: 'Bayernwerk Netz GmbH',
    portalUrl: 'https://www.bayernwerk-netz.de/einspeiser-portal',
    portalTyp: 'online',
    anleitung: [
      '1. Registrieren Sie sich im Einspeiser-Portal',
      '2. Wählen Sie "Neue Anmeldung" → "Erzeugungsanlage"',
      '3. Laden Sie die vorausgefüllten Dokumente hoch',
      '4. Digitale Signatur ist im Portal möglich',
      '5. Status-Tracking im Portal verfügbar',
    ],
    besonderheiten: [
      'Schnelle Online-Bearbeitung (meist 2 Wochen)',
      'Digitale Signatur akzeptiert',
      'Push-Benachrichtigungen bei Statusänderung',
    ],
    uploadFormate: ['PDF', 'JPG', 'PNG'],
    maxDateigroesse: '10 MB',
    kontakt: { email: 'einspeiser@bayernwerk.de', telefon: '0800 0800 800' },
  },
  'netze-bw': {
    nbId: 'netze-bw',
    nbName: 'Netze BW GmbH',
    portalUrl: 'https://www.netze-bw.de/netzanschluss-online',
    portalTyp: 'online',
    anleitung: [
      '1. Login mit Installateurszugang',
      '2. Neues Projekt anlegen',
      '3. Installateursausweis hochladen (Pflicht!)',
      '4. Technische Daten eingeben',
      '5. Dokumente hochladen',
    ],
    besonderheiten: [
      'Installateursausweis zwingend erforderlich',
      'Strenge Prüfung der Unterlagen',
      'NA-Schutz-Prüfer muss akkreditiert sein',
    ],
    uploadFormate: ['PDF'],
    maxDateigroesse: '5 MB',
    kontakt: { email: 'einspeiser@netze-bw.de', telefon: '0800 3629 359' },
  },
  // ... weitere NB können hinzugefügt werden
};

/**
 * Generiert NB-spezifische Anleitung
 */
export function generierePortalAnleitung(nbId: string): NBPortalInfo | null {
  const key = String(nbId || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const [id, info] of Object.entries(NB_PORTAL_INFO)) {
    if (key.includes(id.replace(/-/g, ''))) {
      return info;
    }
  }
  return null;
}

/**
 * Exportiert alle Daten als JSON für API/Portal
 */
export function exportiereAlsJSON(data: WizardData): string {
  const exportData = {
    version: '1.0',
    erstellt: new Date().toISOString(),
    betreiber: {
      name: `${data.step6.vorname} ${data.step6.nachname}`,
      email: data.step6.email,
      telefon: data.step6.telefon,
      kundentyp: data.step6.kundentyp,
    },
    standort: {
      strasse: data.step2.strasse,
      hausnummer: data.step2.hausnummer,
      plz: data.step2.plz,
      ort: data.step2.ort,
      bundesland: data.step2.bundesland,
      flurstueck: data.step2.flurstueck,
    },
    netzbetreiber: {
      name: data.step4.netzbetreiberName,
      id: data.step4.netzbetreiberId,
    },
    anlage: {
      kategorie: data.step1.kategorie,
      komponenten: data.step1.komponenten,
      vorgangsart: data.step1.vorgangsart,
      dachflaechen: data.step5.dachflaechen,
      wechselrichter: data.step5.wechselrichter,
      speicher: data.step5.speicher,
      wallboxen: data.step5.wallboxen,
      waermepumpen: data.step5.waermepumpen,
      gesamtleistungKwp: data.step5.gesamtleistungKwp,
      einspeiseart: data.step5.einspeiseart,
    },
    installateur: COMPANY,
  };
  
  return JSON.stringify(exportData, null, 2);
}

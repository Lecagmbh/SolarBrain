// ═══════════════════════════════════════════════════════════════════════════
// Baunity WIZARD V2 - UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

import type { 
  WizardData, 
  PlzMapping, 
  DokumentTyp,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateWizardId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `NA-${year}${month}${day}-${random}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLZ CONFIDENCE CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePlzConfidence(mapping: PlzMapping): number {
  // Admin-verifiziert = 100%
  if (mapping.source === 'admin_verified') return 100;
  
  // Importiert aus offizieller Quelle = 80%
  if (mapping.source === 'imported') return 80;
  
  // Aus MaStR-Standort des NB = 70%
  if (mapping.source === 'mastr_location') return 70;
  
  // Kundeneingaben mit Bestätigungen
  const total = (mapping.confirmations ?? 0) + (mapping.rejections ?? 0);
  if (total === 0) return 0;
  
  const ratio = (mapping.confirmations ?? 0) / total;
  const baseConfidence = ratio * 70; // Max 70% ohne Verifizierung
  
  // Bonus für viele Bestätigungen (max 25%)
  const volumeBonus = Math.min(total * 2.5, 25);
  
  // Malus wenn Ablehnungen
  const rejectionPenalty = (mapping.rejections ?? 0) > 0 ? ((mapping.rejections ?? 0) / total) * 20 : 0;
  
  return Math.min(Math.max(baseConfidence + volumeBonus - rejectionPenalty, 0), 95);
}

export function findBestPlzMapping(plz: string, mappings: PlzMapping[]): PlzMapping | null {
  const matches = mappings
    .filter(m => m.plz === plz)
    .map(m => ({ ...m, confidence: calculatePlzConfidence(m) }))
    .sort((a, b) => b.confidence - a.confidence);
  
  return matches.length > 0 ? matches[0] : null;
}

export function shouldAutoSelectNb(mapping: PlzMapping | null): boolean {
  if (!mapping) return false;
  return (mapping.confidence ?? 0) >= 100; // Nur bei 100% automatisch
}

export function shouldSuggestNb(mapping: PlzMapping | null): boolean {
  if (!mapping) return false;
  return (mapping.confidence ?? 0) >= 70 && (mapping.confidence ?? 0) < 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIC CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePvTotals(data: WizardData): {
  gesamtKwp: number;
  gesamtWrKw: number;
  dcAcRatio: number;
  anzahlModule: number;
} {
  if (!data.pv) {
    return { gesamtKwp: 0, gesamtWrKw: 0, dcAcRatio: 0, anzahlModule: 0 };
  }
  
  // Module: Summe (Anzahl × Wp)
  const anzahlModule = data.pv.module.reduce((sum, m) => sum + m.anzahl, 0);
  const gesamtWp = data.pv.module.reduce((sum, m) => sum + (m.anzahl * m.wpProModul), 0);
  const gesamtKwp = gesamtWp / 1000;
  
  // Wechselrichter: Summe (Anzahl × kW)
  const gesamtWrKw = data.pv.wechselrichter.reduce((sum, wr) => sum + (wr.anzahl * (wr.kwAc ?? 0)), 0);
  
  // DC/AC Ratio
  const dcAcRatio = gesamtWrKw > 0 ? gesamtKwp / gesamtWrKw : 0;
  
  return { gesamtKwp, gesamtWrKw, dcAcRatio, anzahlModule };
}

export function calculateStorageTotals(data: WizardData): {
  gesamtKwh: number;
  gesamtKw: number;
} {
  if (!data.speicher) {
    return { gesamtKwh: 0, gesamtKw: 0 };
  }
  
  const gesamtKwh = data.speicher.einheiten.reduce(
    (sum, e) => sum + (e.anzahl * (e.kwhProEinheit ?? 0)), 0
  );
  const gesamtKw = data.speicher.einheiten.reduce(
    (sum, e) => sum + (e.anzahl * (e.kwProEinheit ?? 0)), 0
  );
  
  return { gesamtKwh, gesamtKw };
}

export function calculateWallboxTotals(data: WizardData): {
  gesamtKw: number;
  anzahlLadepunkte: number;
} {
  if (!data.wallbox) {
    return { gesamtKw: 0, anzahlLadepunkte: 0 };
  }
  
  const gesamtKw = data.wallbox.ladepunkte.reduce(
    (sum, lp) => sum + (lp.anzahl * (lp.kwProPunkt ?? 0)), 0
  );
  const anzahlLadepunkte = data.wallbox.ladepunkte.reduce(
    (sum, lp) => sum + lp.anzahl, 0
  );
  
  return { gesamtKw, anzahlLadepunkte };
}

export function calculateRequirements(data: WizardData): WizardData['berechnet'] {
  const pvTotals = calculatePvTotals(data);
  const storageTotals = calculateStorageTotals(data);
  const wallboxTotals = calculateWallboxTotals(data);
  
  const gesamtKwp = pvTotals.gesamtKwp;
  
  // Anforderungen nach VDE-AR-N 4105 / 4110
  const naSchutzErforderlich = gesamtKwp > 10;
  const einspeisemanagementErforderlich = gesamtKwp > 25;
  const nvpErforderlich = gesamtKwp > 30;
  const einheitenzertifikatErforderlich = gesamtKwp > 135;
  const anlagenzertifikatErforderlich = gesamtKwp > 500;
  const direktvermarktungErforderlich = gesamtKwp > 100;
  
  // Genehmigungspflicht
  const genehmigungspflichtig = 
    wallboxTotals.gesamtKw > 11 ||
    gesamtKwp > 30;
  
  // Messkonzept ermitteln
  const messkonzept = determineMeasurementConcept(data);
  
  // Pflichtdokumente
  const pflichtdokumente = determinePflichtdokumente(data, gesamtKwp);
  
  // Anmeldekategorie
  let anmeldekategorie: 'vereinfacht' | 'standard' | 'erweitert' | 'individuell';
  if (gesamtKwp <= 10.8) {
    anmeldekategorie = 'vereinfacht';
  } else if (gesamtKwp <= 30) {
    anmeldekategorie = 'standard';
  } else if (gesamtKwp <= 135) {
    anmeldekategorie = 'erweitert';
  } else {
    anmeldekategorie = 'individuell';
  }
  
  return {
    gesamtKwp,
    gesamtSpeicherKwh: storageTotals.gesamtKwh,
    gesamtWallboxKw: wallboxTotals.gesamtKw,
    naSchutzErforderlich,
    einspeisemanagementErforderlich,
    nvpErforderlich,
    einheitenzertifikatErforderlich,
    anlagenzertifikatErforderlich,
    direktvermarktungErforderlich,
    genehmigungspflichtig,
    messkonzept,
    pflichtdokumente,
    anmeldekategorie,
  };
}

function determineMeasurementConcept(data: WizardData): string {
  const hasPv = data.pv && data.pv.module.length > 0;
  const hasStorage = data.speicher && data.speicher.einheiten.length > 0;
  const einspeiseart = data.pv?.einspeiseart;
  
  if (!hasPv) return 'standard';
  
  if (einspeiseart === 'volleinspeisung') {
    if (hasStorage) return 'MK3'; // Volleinspeisung mit Speicher
    return 'MK2'; // Reine Volleinspeisung
  }
  
  if (einspeiseart === 'nulleinspeisung') {
    return 'MK9'; // Eigenverbrauch ohne Einspeisung
  }
  
  // Überschusseinspeisung
  if (hasStorage) {
    const kopplung = data.speicher?.einheiten[0]?.kopplung;
    if (kopplung === 'dc') return 'MK7'; // DC-gekoppelt
    return 'MK8'; // AC-gekoppelt
  }
  
  return 'MK1'; // Standard Überschuss ohne Speicher
}

function determinePflichtdokumente(data: WizardData, gesamtKwp: number): DokumentTyp[] {
  const docs: DokumentTyp[] = ['lageplan', 'schaltplan'];
  
  // PV Dokumente
  if (data.pv && data.pv.module.length > 0) {
    docs.push('datenblatt_module');
    docs.push('datenblatt_wechselrichter');
    
    if (gesamtKwp > 10) {
      docs.push('na_schutz_zertifikat');
      docs.push('konformitaetserklaerung');
    }
    
    if (gesamtKwp > 135) {
      docs.push('einheitenzertifikat');
    }
    
    if (gesamtKwp > 500) {
      docs.push('anlagenzertifikat');
    }
  }
  
  // Speicher Dokumente
  if (data.speicher && data.speicher.einheiten.length > 0) {
    docs.push('datenblatt_speicher');
  }
  
  // Wallbox Dokumente
  if (data.wallbox && data.wallbox.ladepunkte.length > 0) {
    docs.push('datenblatt_wallbox');
  }
  
  // Eigentum
  if (data.eigentum.verhaeltnis === 'mieter') {
    docs.push('vermieter_zustimmung');
  }
  
  // Vollmacht
  docs.push('vollmacht');
  
  return docs;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export function validateStep(step: number, data: WizardData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  
  switch (step) {
    case 1: // Was wird angemeldet
      if (!data.kategorie) {
        errors['kategorie'] = 'Bitte wählen Sie eine Kategorie';
      }
      if (!data.vorgangsart) {
        errors['vorgangsart'] = 'Bitte wählen Sie die Vorgangsart';
      }
      break;
      
    case 2: // Standort
      if (!data.standort.strasse) {
        errors['standort.strasse'] = 'Bitte geben Sie die Straße ein';
      }
      if (!data.standort.hausnummer) {
        errors['standort.hausnummer'] = 'Bitte geben Sie die Hausnummer ein';
      }
      if (!data.standort.plz) {
        errors['standort.plz'] = 'Bitte geben Sie die Postleitzahl ein';
      } else if (!/^\d{5}$/.test(data.standort.plz)) {
        errors['standort.plz'] = 'Die PLZ muss 5-stellig sein';
      }
      if (!data.standort.ort) {
        errors['standort.ort'] = 'Bitte geben Sie den Ort ein';
      }
      break;
      
    case 3: // Eigentum
      if (!data.eigentum.verhaeltnis) {
        errors['eigentum.verhaeltnis'] = 'Bitte geben Sie Ihr Eigentumsverhältnis an';
      }
      if (data.eigentum.verhaeltnis === 'mieter' && data.eigentum.vermieterZustimmung === undefined) {
        errors['eigentum.vermieterZustimmung'] = 'Bitte geben Sie an, ob die Zustimmung vorliegt';
      }
      break;
      
    case 4: // Netzbetreiber - KEINE PFLICHT
      // NB ist optional, System lernt
      break;
      
    case 5: // Technische Daten
      if (data.kategorie === 'pv' || data.kategorie === 'pv_speicher') {
        if (!data.pv || data.pv.module.length === 0) {
          errors['pv.module'] = 'Bitte fügen Sie mindestens ein Modul hinzu';
        } else {
          data.pv.module.forEach((m, i) => {
            if (!m.anzahl || m.anzahl <= 0) {
              errors[`pv.module.${i}.anzahl`] = 'Anzahl erforderlich';
            }
            if (!m.wpProModul || m.wpProModul <= 0) {
              errors[`pv.module.${i}.wpProModul`] = 'Leistung pro Modul erforderlich';
            }
          });
        }
        
        if (!data.pv || data.pv.wechselrichter.length === 0) {
          errors['pv.wechselrichter'] = 'Bitte fügen Sie mindestens einen Wechselrichter hinzu';
        }
        
        // DC/AC Ratio Warnung
        const pvTotals = calculatePvTotals(data);
        if (pvTotals.dcAcRatio > 1.5) {
          warnings.push(`DC/AC Ratio von ${pvTotals.dcAcRatio.toFixed(2)} ist hoch. Üblich sind 1.0-1.3`);
        }
        if (pvTotals.dcAcRatio < 0.8 && pvTotals.dcAcRatio > 0) {
          warnings.push(`DC/AC Ratio von ${pvTotals.dcAcRatio.toFixed(2)} ist niedrig. Wechselrichter evtl. überdimensioniert.`);
        }
      }
      
      if (data.kategorie === 'speicher' || data.kategorie === 'pv_speicher') {
        if (!data.speicher || data.speicher.einheiten.length === 0) {
          errors['speicher.einheiten'] = 'Bitte fügen Sie mindestens einen Speicher hinzu';
        }
      }
      
      if (data.kategorie === 'wallbox') {
        if (!data.wallbox || data.wallbox.ladepunkte.length === 0) {
          errors['wallbox.ladepunkte'] = 'Bitte fügen Sie mindestens einen Ladepunkt hinzu';
        }
      }
      break;
      
    case 6: // Persönliche Daten
      if (!data.kunde.typ) {
        errors['kunde.typ'] = 'Bitte wählen Sie Privat oder Gewerbe';
      }
      
      if (data.kunde.typ === 'privat') {
        if (!data.kunde.vorname) errors['kunde.vorname'] = 'Vorname erforderlich';
        if (!data.kunde.nachname) errors['kunde.nachname'] = 'Nachname erforderlich';
      } else if (data.kunde.typ === 'gewerbe') {
        if (!data.kunde.firmenname) errors['kunde.firmenname'] = 'Firmenname erforderlich';
      }
      
      if (!data.kunde.email) {
        errors['kunde.email'] = 'E-Mail erforderlich';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.kunde.email)) {
        errors['kunde.email'] = 'Ungültige E-Mail-Adresse';
      }
      break;
      
    case 7: // Installateur - OPTIONAL
      break;
      
    case 8: // Dokumente
      // Pflichtdokumente prüfen, aber Nachreichung erlauben
      const pflichtDocs = data.berechnet?.pflichtdokumente || ['lageplan', 'schaltplan'];
      pflichtDocs.forEach(docTyp => {
        const doc = data.dokumente.find(d => d.typ === docTyp);
        if (!doc || (doc.status === 'fehlend' && !doc.wirdNachgereicht && !doc.wirdVonGridnetzErstellt)) {
          warnings.push(`${getDocumentLabel(docTyp)} fehlt noch`);
        }
      });
      break;
      
    case 9: // Vollmacht
      if (!data.vollmacht.erteilt) {
        errors['vollmacht'] = 'Bitte erteilen Sie die Vollmacht';
      }
      break;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LABELS
// ─────────────────────────────────────────────────────────────────────────────

export const KATEGORIE_LABELS: Record<string, string> = {
  pv: 'Photovoltaik-Anlage',
  speicher: 'Batteriespeicher',
  pv_speicher: 'PV + Speicher',
  wallbox: 'Wallbox / Ladestation',
  waermepumpe: 'Wärmepumpe',
  bhkw: 'Blockheizkraftwerk',
  sonstige: 'Sonstige Anlage',
};

export const VORGANGSART_LABELS: Record<string, string> = {
  neuanlage: 'Neuanlage',
  erweiterung: 'Erweiterung',
  aenderung: 'Änderung',
  inbetriebnahme: 'Inbetriebnahme',
  stilllegung: 'Stilllegung',
};

export const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  in_installation: 'In Installation',
  installiert: 'Bereits installiert',
};

export const EIGENTUM_LABELS: Record<string, string> = {
  eigentuemer: 'Eigentümer',
  mieter: 'Mieter',
  verwalter: 'Verwalter',
};

export const EINSPEISEART_LABELS: Record<string, string> = {
  ueberschuss: 'Überschusseinspeisung',
  volleinspeisung: 'Volleinspeisung',
  nulleinspeisung: 'Nulleinspeisung / Insel',
};

export function getDocumentLabel(typ: DokumentTyp): string {
  const labels: Record<string, string> = {
    lageplan: 'Lageplan',
    schaltplan: 'Übersichtsschaltplan',
    datenblatt_module: 'Datenblatt Module',
    datenblatt_wechselrichter: 'Datenblatt Wechselrichter',
    datenblatt_speicher: 'Datenblatt Speicher',
    datenblatt_wallbox: 'Datenblatt Wallbox',
    na_schutz_zertifikat: 'NA-Schutz Zertifikat',
    einheitenzertifikat: 'Einheitenzertifikat',
    anlagenzertifikat: 'Anlagenzertifikat',
    konformitaetserklaerung: 'Konformitätserklärung',
    vollmacht: 'Vollmacht',
    personalausweis: 'Personalausweis',
    grundbuchauszug: 'Grundbuchauszug',
    mietvertrag: 'Mietvertrag',
    vermieter_zustimmung: 'Vermieter-Zustimmung',
    angebot_rechnung: 'Angebot / Rechnung',
    foto_anlage: 'Foto der Anlage',
    foto_zaehler: 'Foto Zähler',
    stromrechnung: 'Stromrechnung',
    messkonzept: 'Messkonzept',
    sonstiges: 'Sonstiges Dokument',
  };
  return labels[typ] || typ;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatKwp(kwp: number): string {
  return `${kwp.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWp`;
}

export function formatKwh(kwh: number): string {
  return `${kwh.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWh`;
}

export function formatKw(kw: number): string {
  return `${kw.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kW`;
}

export function formatWp(wp: number): string {
  return `${wp.toLocaleString('de-DE')} Wp`;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────

export function createInitialWizardData(): WizardData {
  return {
    id: generateWizardId(),
    status: 'entwurf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    standort: {},
    eigentum: {},
    netzbetreiber: { isConfirmed: false },
    kunde: {},
    dokumente: [],
    vollmacht: { erteilt: false },
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

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPATIBILITY - Aliases
// ─────────────────────────────────────────────────────────────────────────────

// English aliases
export const CATEGORY_LABELS = KATEGORIE_LABELS;
export const TYPE_LABELS = STATUS_LABELS;
export const PROCESS_TYPE_LABELS = VORGANGSART_LABELS;

// Document type labels (English alias)
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  lageplan: 'Lageplan',
  schaltplan: 'Übersichtsschaltplan',
  datenblatt_module: 'Datenblatt Module',
  datenblatt_wechselrichter: 'Datenblatt Wechselrichter',
  datenblatt_speicher: 'Datenblatt Speicher',
  datenblatt_wallbox: 'Datenblatt Wallbox',
  na_schutz_zertifikat: 'NA-Schutz Zertifikat',
  einheitenzertifikat: 'Einheitenzertifikat',
  anlagenzertifikat: 'Anlagenzertifikat',
  konformitaetserklaerung: 'Konformitätserklärung',
  vollmacht: 'Vollmacht',
  personalausweis: 'Personalausweis',
  grundbuchauszug: 'Grundbuchauszug',
  mietvertrag: 'Mietvertrag',
  vermieter_zustimmung: 'Vermieter-Zustimmung',
  angebot_rechnung: 'Angebot / Rechnung',
  foto_anlage: 'Foto der Anlage',
  foto_zaehler: 'Foto Zähler',
  stromrechnung: 'Stromrechnung',
  messkonzept: 'Messkonzept',
  sonstiges: 'Sonstiges Dokument',
};

// Condition fields for rules engine
export const CONDITION_FIELDS: Array<{ key: string; label: string; type: string }> = [
  { key: 'kategorie', label: 'Anlagenkategorie', type: 'select' },
  { key: 'gesamtKwp', label: 'PV-Leistung (kWp)', type: 'number' },
  { key: 'gesamtSpeicherKwh', label: 'Speicherkapazität (kWh)', type: 'number' },
  { key: 'gesamtWallboxKw', label: 'Wallbox-Leistung (kW)', type: 'number' },
  { key: 'einspeiseart', label: 'Einspeiseart', type: 'select' },
  { key: 'bundesland', label: 'Bundesland', type: 'select' },
  { key: 'eigentum', label: 'Eigentumsverhältnis', type: 'select' },
  { key: 'kundentyp', label: 'Kundentyp', type: 'select' },
];

// Get required documents based on wizard data
export function getRequiredDocuments(data: WizardData): Array<{ documentType: DokumentTyp; required: boolean; name: string }> {
  const docs: Array<{ documentType: DokumentTyp; required: boolean; name: string }> = [
    { documentType: 'lageplan', required: true, name: 'Lageplan' },
    { documentType: 'schaltplan', required: true, name: 'Übersichtsschaltplan' },
  ];
  
  if (data.kategorie === 'pv' || data.kategorie === 'pv_speicher') {
    docs.push({ documentType: 'datenblatt_module', required: false, name: 'Datenblatt Module' });
    docs.push({ documentType: 'datenblatt_wechselrichter', required: false, name: 'Datenblatt Wechselrichter' });
  }
  
  if (data.kategorie === 'speicher' || data.kategorie === 'pv_speicher') {
    docs.push({ documentType: 'datenblatt_speicher', required: false, name: 'Datenblatt Speicher' });
  }
  
  if (data.eigentum.verhaeltnis === 'mieter') {
    docs.push({ documentType: 'vermieter_zustimmung', required: true, name: 'Vermieter-Zustimmung' });
  }
  
  return docs;
}

// Get required custom fields based on wizard data
export function getRequiredFields(_data: WizardData, _gridOperatorId?: string): Array<{
  fieldId: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}> {
  // Placeholder - would be populated from grid operator specific requirements
  return [];
}

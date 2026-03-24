/**
 * Baunity Intelligence - Messkonzept Engine V2
 * ==========================================
 * Basierend auf Westnetz Standard Messkonzepte NS (Stand 17.06.2024)
 * 
 * MK0: Standardfall ohne EEG/KWKG (nur Bezug)
 * MK1: Volleinspeisung - Kaskadenmessung mit 2 Zählern
 * MK2: Überschusseinspeisung - Ein Zweirichtungszähler (Standard PV)
 * MK3: PV-Selbstverbrauch mit Erzeugungsmessung (für Marktintegration/EEG 2009-2012)
 * MK4: KWK-Untermessung (für BHKW)
 * MK5: Kaufmännisch-bilanzielle Weitergabe (Ausnahmefall)
 * MK6: Mehrere Erzeugungsanlagen
 * MK8: PV + steuerbare Verbrauchseinrichtung §14a (WP/Wallbox)
 */

import type { WizardData } from '../../types/wizard.types';

export type MesskonzeptTyp = 'MK0' | 'MK1' | 'MK2' | 'MK3' | 'MK4' | 'MK5' | 'MK6' | 'MK8';

export interface MesskonzeptInfo {
  typ: MesskonzeptTyp;
  name: string;
  beschreibung: string;
  anzahlZaehler: number;
  zaehlerTypen: string[];
  anwendung: string;
  hinweise: string[];
  diagrammUrl?: string;
}

const MESSKONZEPTE: Record<MesskonzeptTyp, MesskonzeptInfo> = {
  'MK0': {
    typ: 'MK0',
    name: 'Standardfall ohne EEG/KWKG',
    beschreibung: 'Nur Bezugszähler, keine Erzeugung',
    anzahlZaehler: 1,
    zaehlerTypen: ['Z1: Bezug (mME)'],
    anwendung: 'Reine Verbrauchsanlagen, §14a Geräte ohne PV',
    hinweise: ['Zwei-Energierichtungszähler, aber nur Bezug abgerechnet']
  },
  'MK1': {
    typ: 'MK1',
    name: 'Volleinspeisung',
    beschreibung: 'Kaskadenmessung mit separatem Erzeugungszähler',
    anzahlZaehler: 2,
    zaehlerTypen: ['Z1: Bezug Haushalt (mME)', 'Z2: Erzeugung + Bezug Anlage'],
    anwendung: 'PV-Volleinspeisung, höhere EEG-Vergütung (12,87 ct/kWh)',
    hinweise: ['Separate Stromlieferverträge für Z1 und Z2', 'BGH EnVR 104/19: Bilanzielle Zuordnungspflicht']
  },
  'MK2': {
    typ: 'MK2',
    name: 'Überschusseinspeisung',
    beschreibung: 'Standard-PV mit Eigenverbrauch, ein Zweirichtungszähler',
    anzahlZaehler: 1,
    zaehlerTypen: ['Z1: Bezug + Einspeisung (mME Zweirichtung)'],
    anwendung: 'Standard für PV mit Eigenverbrauch bis 30 kVA',
    hinweise: ['Selbstverbrauch wird nicht separat gemessen', 'Bei Speicher: EnFluRi erforderlich wenn Netzbezug möglich']
  },
  'MK3': {
    typ: 'MK3',
    name: 'PV-Selbstverbrauchsmessung',
    beschreibung: 'Erzeugung wird separat gemessen für Abrechnung',
    anzahlZaehler: 2,
    zaehlerTypen: ['Z1: Überlagerter Haupt-ZP', 'Z2: Erzeugung'],
    anwendung: 'EEG 2009-2012 Anlagen, Marktintegrationsmodell, Biomasse',
    hinweise: ['Selbstverbrauch = Einspeisung Z2 – Einspeisung Z1', 'Z1 und Z2 einheitlich SLP oder RLM']
  },
  'MK4': {
    typ: 'MK4',
    name: 'KWK-Untermessung',
    beschreibung: 'BHKW mit Selbstverbrauchsmessung nach §14 KWKG',
    anzahlZaehler: 2,
    zaehlerTypen: ['Z1: Überlagerter Haupt-ZP', 'Z2: KWK-Erzeugung'],
    anwendung: 'BHKW / KWK-Anlagen mit KWK-Zuschlag',
    hinweise: ['Selbstverbrauch für KWKG-Abrechnung benötigt']
  },
  'MK5': {
    typ: 'MK5',
    name: 'Kaufm.-bilanzielle Weitergabe',
    beschreibung: 'Untereinspeisung wird bilanziell wie Volleinspeisung behandelt',
    anzahlZaehler: 2,
    zaehlerTypen: ['Z1: Überlagerter Haupt-ZP (RLM)', 'Z2: Erzeugung (RLM)'],
    anwendung: 'Ausnahmefall wenn MK1 nicht baulich möglich',
    hinweise: ['Bezug = Bezug Z1 + Einspeisung Z2 – Einspeisung Z1', 'Nur RLM-Zähler']
  },
  'MK6': {
    typ: 'MK6',
    name: 'Mehrere Erzeugungsanlagen',
    beschreibung: 'Zwei oder mehr Erzeugungsanlagen unterschiedlicher Energiearten',
    anzahlZaehler: 4,
    zaehlerTypen: ['Z1: Haupt-ZP', 'Z2: Überschuss', 'Z3: Erzeugung 1', 'Z4: Erzeugung 2'],
    anwendung: 'PV + BHKW, PV + Wind, mehrere PV-Anlagen mit unterschiedlichem EEG-Jahr',
    hinweise: ['Entfall von Z3/Z4 unter bestimmten Bedingungen möglich']
  },
  'MK8': {
    typ: 'MK8',
    name: 'PV + §14a Verbrauchseinrichtung',
    beschreibung: 'Erzeugungsanlage mit steuerbarer Verbrauchseinrichtung (WP/Wallbox)',
    anzahlZaehler: 3,
    zaehlerTypen: ['Z1: Haupt-ZP §14a', 'Z2: Haushalt', 'Z3: Erzeugung (optional)'],
    anwendung: 'PV mit Wärmepumpe oder Wallbox unter §14a EnWG',
    hinweise: ['Zwei separate Stromlieferverträge', 'Z3 nur wenn Selbstverbrauch für Abrechnung benötigt', 'Netzentgeltreduzierung §14a']
  }
};

/**
 * Ermittelt das passende Messkonzept basierend auf Anlagenkonfiguration
 */
export function ermittleMesskonzept(data: WizardData): MesskonzeptInfo {
  const { step1, step5 } = data;
  const { kategorie, komponenten } = step1;
  
  const hatPV = komponenten.includes('pv') || kategorie === 'einspeiser';
  const hatSpeicher = komponenten.includes('speicher') || kategorie === 'speicher';
  const hatWallbox = komponenten.includes('wallbox');
  const hatWP = komponenten.includes('waermepumpe');
  const hatBHKW = komponenten.includes('bhkw');
  const hat14aGeraet = hatWallbox || hatWP;
  
  const einspeiseart = step5.einspeiseart;
  const istVolleinspeisung = einspeiseart === 'volleinspeisung';
  const mehrereAnlagen = step5.mehrereAnlagen || (hatPV && hatBHKW);
  
  // Mehrere Erzeugungsanlagen → MK6
  if (mehrereAnlagen) {
    return MESSKONZEPTE['MK6'];
  }
  
  // BHKW → MK4
  if (hatBHKW && !hatPV) {
    return MESSKONZEPTE['MK4'];
  }
  
  // PV + §14a Gerät → MK8
  if (hatPV && hat14aGeraet) {
    return MESSKONZEPTE['MK8'];
  }
  
  // Volleinspeisung → MK1
  if (hatPV && istVolleinspeisung) {
    return MESSKONZEPTE['MK1'];
  }
  
  // Standard PV (Überschuss) → MK2
  if (hatPV) {
    return MESSKONZEPTE['MK2'];
  }
  
  // Nur Speicher → MK2 (behandelt wie Erzeugung)
  if (hatSpeicher && !hatPV) {
    return MESSKONZEPTE['MK2'];
  }
  
  // Nur §14a ohne PV → MK0
  if (hat14aGeraet && !hatPV) {
    return MESSKONZEPTE['MK0'];
  }
  
  // Standard (Netzanschluss, etc.) → MK0
  return MESSKONZEPTE['MK0'];
}

/**
 * Gibt alle verfügbaren Messkonzepte zurück
 */
export function getAlleMesskonzepte(): MesskonzeptInfo[] {
  return Object.values(MESSKONZEPTE);
}

/**
 * Gibt ein spezifisches Messkonzept zurück
 */
export function getMesskonzept(typ: MesskonzeptTyp): MesskonzeptInfo {
  return MESSKONZEPTE[typ];
}

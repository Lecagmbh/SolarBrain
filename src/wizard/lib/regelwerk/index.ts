/**
 * Baunity Wizard - Regelwerk Engine V3
 * ==================================
 * Vollständige Dokument-Anforderungen basierend auf:
 * - VDE-AR-N 4105/4110
 * - §14a EnWG
 * - EEG 2024
 */

import type { WizardData } from '../../types/wizard.types';
import type { AnmeldeSzenario } from '../intelligence/types';
import { detectSzenario } from '../intelligence/detector';

// ═══════════════════════════════════════════════════════════════════════════
// GRENZWERTE
// ═══════════════════════════════════════════════════════════════════════════

export const GRENZWERTE = {
  BALKON_MAX_WR_VA: 800,
  BALKON_MAX_MODUL_WP: 2000,
  MINI_PV_MAX_KVA: 4.6,
  VEREINFACHT_MAX_KVA: 30,
  NA_SCHUTZ_AB_KVA: 30,
  MITTELSPANNUNG_AB_KVA: 135,
  DIREKTVERMARKTUNG_AB_KWP: 100,
  STEUERBAR_AB_KW: 4.2,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// DOKUMENT-DEFINITIONEN
// ═══════════════════════════════════════════════════════════════════════════

export interface DokumentAnforderung {
  id: string;
  name: string;
  beschreibung: string;
  pflicht: boolean;
  nachreichbar: boolean;
  kategorie: 'vde' | 'technik' | 'sonstige' | '14a';
  ausProduktDB?: boolean;
  hinweis?: string;
}

// Basis-Dokumente
const D = {
  // VDE Formulare
  E1: { id: 'E1', name: 'Anmeldung (E.1)', beschreibung: 'VDE-AR-N Anmeldeformular', pflicht: true, nachreichbar: false, kategorie: 'vde' as const },
  E2: { id: 'E2', name: 'Datenblatt (E.2)', beschreibung: 'Technische Anlagendaten', pflicht: true, nachreichbar: false, kategorie: 'vde' as const },
  E3: { id: 'E3', name: 'IBN-Protokoll (E.3)', beschreibung: 'Nach Installation', pflicht: true, nachreichbar: true, kategorie: 'vde' as const },
  E4: { id: 'E4', name: 'Einheitenzertifikat (E.4)', beschreibung: 'ZEREZ-Nachweis WR', pflicht: true, nachreichbar: false, kategorie: 'vde' as const, ausProduktDB: true },
  E5: { id: 'E5', name: 'Speicher-Datenblatt (E.5)', beschreibung: 'Batteriespeicher', pflicht: true, nachreichbar: false, kategorie: 'vde' as const, ausProduktDB: true },
  E6: { id: 'E6', name: 'NA-Schutz (E.6)', beschreibung: 'Ab 30 kVA', pflicht: true, nachreichbar: false, kategorie: 'vde' as const },
  E8: { id: 'E8', name: '§14a Anmeldung (E.8)', beschreibung: 'Steuerbare VE', pflicht: true, nachreichbar: false, kategorie: '14a' as const },
  
  // Technische Unterlagen
  SCHALTPLAN: { id: 'SCHALT', name: 'Übersichtsschaltplan', beschreibung: 'Einpolig', pflicht: true, nachreichbar: true, kategorie: 'technik' as const },
  LAGEPLAN: { id: 'LAGE', name: 'Lageplan', beschreibung: 'Maßstabsgetreu', pflicht: true, nachreichbar: true, kategorie: 'technik' as const },
  STRINGPLAN: { id: 'STRING', name: 'Stringplan', beschreibung: 'Modulverschaltung', pflicht: true, nachreichbar: true, kategorie: 'technik' as const },
  MESSKONZEPT: { id: 'MESS', name: 'Messkonzept', beschreibung: 'Zähleraufbau', pflicht: true, nachreichbar: false, kategorie: 'technik' as const },
  
  // Datenblätter (aus Produkt-DB)
  DB_MODUL: { id: 'DB_MOD', name: 'Modul-Datenblatt', beschreibung: 'PV-Module', pflicht: true, nachreichbar: false, kategorie: 'technik' as const, ausProduktDB: true },
  DB_WR: { id: 'DB_WR', name: 'WR-Datenblatt', beschreibung: 'Wechselrichter', pflicht: true, nachreichbar: false, kategorie: 'technik' as const, ausProduktDB: true },
  DB_SPEICHER: { id: 'DB_SP', name: 'Speicher-Datenblatt', beschreibung: 'Batterie', pflicht: true, nachreichbar: false, kategorie: 'technik' as const, ausProduktDB: true },
  DB_WALLBOX: { id: 'DB_WB', name: 'Wallbox-Datenblatt', beschreibung: 'Ladestation', pflicht: true, nachreichbar: false, kategorie: 'technik' as const, ausProduktDB: true },
  DB_WP: { id: 'DB_WP', name: 'WP-Datenblatt', beschreibung: 'Wärmepumpe', pflicht: true, nachreichbar: false, kategorie: 'technik' as const, ausProduktDB: true },
  
  // Sonstige
  VOLLMACHT: { id: 'VOLLM', name: 'Vollmacht', beschreibung: 'Für Baunity', pflicht: true, nachreichbar: false, kategorie: 'sonstige' as const },
  EIGENTUEMER: { id: 'EIGENT', name: 'Eigentümerzustimmung', beschreibung: 'Bei Miete', pflicht: true, nachreichbar: false, kategorie: 'sonstige' as const },
  INSTALLATEURAUSWEIS: { id: 'INST', name: 'Installateurausweis', beschreibung: 'ZEREZ-Eintrag', pflicht: true, nachreichbar: false, kategorie: 'sonstige' as const },
  GEWERBE: { id: 'GEW', name: 'Gewerbeanmeldung', beschreibung: 'Bei Gewerbe', pflicht: true, nachreichbar: false, kategorie: 'sonstige' as const },
  ANLAGENZERT: { id: 'ZERT', name: 'Anlagenzertifikat Typ B', beschreibung: 'Ab 135 kVA', pflicht: true, nachreichbar: false, kategorie: 'vde' as const },
  NETZVERTR: { id: 'NETZ', name: 'Netzverträglichkeit', beschreibung: 'MS-Anschluss', pflicht: true, nachreichbar: false, kategorie: 'technik' as const },
};

// ═══════════════════════════════════════════════════════════════════════════
// DOKUMENTE PRO SZENARIO
// ═══════════════════════════════════════════════════════════════════════════

const SZENARIO_DOCS: Record<AnmeldeSzenario, DokumentAnforderung[]> = {
  // BALKON - Minimal
  'BALKON_PV': [D.E1, D.VOLLMACHT],
  
  // MINI PV
  'MINI_PV_EINPHASIG': [D.E1, D.E2, D.E3, D.E4, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // KLEIN PV Standard
  'KLEIN_PV_STANDARD': [D.E1, D.E2, D.E3, D.E4, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // KLEIN PV + Speicher
  'KLEIN_PV_MIT_SPEICHER': [D.E1, D.E2, D.E3, D.E4, D.E5, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.DB_SPEICHER, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Volleinspeisung
  'KLEIN_PV_VOLLEINSPEISUNG': [D.E1, D.E2, D.E3, D.E4, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Mittel mit NA-Schutz
  'MITTEL_PV_NA_SCHUTZ': [D.E1, D.E2, D.E3, D.E4, D.E6, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // Groß mit Direktvermarktung
  'GROSS_PV_DIREKTVERMARKTUNG': [D.E1, D.E2, D.E3, D.E4, D.E6, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // Mittelspannung
  'GROSS_PV_MITTELSPANNUNG': [D.E1, D.E2, D.E3, D.E4, D.E6, D.MESSKONZEPT, D.ANLAGENZERT, D.NETZVERTR, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // Speicher Nachrüstung DC
  'SPEICHER_NACHRUESTUNG_DC': [D.E1, D.E2, D.E3, D.E5, D.SCHALTPLAN, D.DB_WR, D.DB_SPEICHER, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Speicher Nachrüstung AC
  'SPEICHER_NACHRUESTUNG_AC': [D.E1, D.E2, D.E3, D.E5, D.SCHALTPLAN, D.DB_SPEICHER, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Speicher Standalone
  'SPEICHER_STANDALONE': [D.E1, D.E2, D.E3, D.E5, D.SCHALTPLAN, D.DB_SPEICHER, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Wallbox klein
  'WALLBOX_UNTER_4KW': [D.E1, D.DB_WALLBOX, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Wallbox §14a
  'WALLBOX_STEUERBAR': [D.E1, D.E2, D.E3, D.E8, D.SCHALTPLAN, D.DB_WALLBOX, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Wärmepumpe §14a
  'WAERMEPUMPE_STEUERBAR': [D.E1, D.E2, D.E3, D.E8, D.SCHALTPLAN, D.DB_WP, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Wallbox + WP
  'WALLBOX_UND_WP_STEUERBAR': [D.E1, D.E2, D.E3, D.E8, D.SCHALTPLAN, D.DB_WALLBOX, D.DB_WP, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // PV + Wallbox (MK8)
  'WALLBOX_MIT_PV': [D.E1, D.E2, D.E3, D.E4, D.E8, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.DB_WALLBOX, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // PV + WP (MK8)
  'WP_MIT_PV': [D.E1, D.E2, D.E3, D.E4, D.E8, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.DB_WP, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Komplettsystem
  'KOMPLETT_SYSTEM': [D.E1, D.E2, D.E3, D.E4, D.E5, D.E8, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.DB_SPEICHER, D.DB_WALLBOX, D.DB_WP, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Hausanschluss
  'HAUSANSCHLUSS_NEU': [D.E1, D.LAGEPLAN, D.VOLLMACHT],
  
  // Baustrom
  'BAUSTROM_TEMPORAER': [D.E1, D.LAGEPLAN, D.VOLLMACHT],
  
  // BHKW klein
  'BHKW_KLEIN': [D.E1, D.E2, D.E3, D.MESSKONZEPT, D.SCHALTPLAN, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // BHKW groß
  'BHKW_GROSS': [D.E1, D.E2, D.E3, D.E6, D.MESSKONZEPT, D.ANLAGENZERT, D.SCHALTPLAN, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // Windkraft
  'WINDKRAFT_KLEIN': [D.E1, D.E2, D.E3, D.E4, D.SCHALTPLAN, D.LAGEPLAN, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Inselanlage
  'INSELANLAGE': [D.VOLLMACHT],
  
  // Nulleinspeisung
  'NULLEINSPEISUNG': [D.E1, D.E2, D.E3, D.E4, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
  
  // Mehrere Anlagen (MK6)
  'MEHRERE_ANLAGEN': [D.E1, D.E2, D.E3, D.E4, D.E6, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // Mieterstrom
  'MIETERSTROMMODELL': [D.E1, D.E2, D.E3, D.E4, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT, D.GEWERBE],
  
  // Energy Sharing
  'EIGENVERBRAUCHSGEMEINSCHAFT': [D.E1, D.E2, D.E3, D.E4, D.MESSKONZEPT, D.SCHALTPLAN, D.LAGEPLAN, D.STRINGPLAN, D.DB_MODUL, D.DB_WR, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],

  // Phase 2: Neue Prozesse
  'DEMONTAGE_ANLAGE': [D.E1, D.VOLLMACHT, D.INSTALLATEURAUSWEIS],
  'ZAEHLER_PROZESS': [D.VOLLMACHT],
  'FERTIGMELDUNG': [D.E3, D.INSTALLATEURAUSWEIS, D.VOLLMACHT],
};

// ═══════════════════════════════════════════════════════════════════════════
// HAUPTFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ermittelt alle erforderlichen Dokumente
 */
export function ermittleErforderlicheDokumente(data: WizardData): DokumentAnforderung[] {
  const szenario = detectSzenario(data);
  const baseDocs = SZENARIO_DOCS[szenario] || SZENARIO_DOCS['KLEIN_PV_STANDARD'];
  
  // Kopieren um Mutation zu vermeiden
  const docs = baseDocs.map(d => ({ ...d }));
  
  // Eigentümerzustimmung wenn Mieter
  if (data.step3.istEigentuemer === false) {
    docs.push({ ...D.EIGENTUEMER });
  }
  
  // Hinweise für Produkt-DB Dokumente
  docs.forEach(doc => {
    const ersteDachflaeche = data.step5.dachflaechen?.[0];
    const ersterWR = data.step5.wechselrichter?.[0];
    const ersterSpeicher = data.step5.speicher?.[0];
    const ersteWallbox = data.step5.wallboxen?.[0];
    const ersteWP = data.step5.waermepumpen?.[0];
    
    if (doc.id === 'DB_MOD' && (ersteDachflaeche?.modulHersteller || data.step5.pvModule?.hersteller)) {
      doc.hinweis = '✓ Aus Produktdatenbank';
    }
    if (doc.id === 'DB_WR' && ersterWR?.hersteller) {
      doc.hinweis = '✓ Aus Produktdatenbank';
    }
    if (doc.id === 'DB_SP' && ersterSpeicher?.hersteller) {
      doc.hinweis = '✓ Aus Produktdatenbank';
    }
    if (doc.id === 'DB_WB' && ersteWallbox?.hersteller) {
      doc.hinweis = '✓ Aus Produktdatenbank';
    }
    if (doc.id === 'DB_WP' && ersteWP?.hersteller) {
      doc.hinweis = '✓ Aus Produktdatenbank';
    }
    if (doc.id === 'E4' && ersterWR?.hersteller) {
      doc.hinweis = '✓ ZEREZ aus Produktdatenbank';
    }
  });
  
  return docs;
}

/**
 * Größenklasse ermitteln
 */
export function ermittleGroessenklasse(kwp: number, kva: number): string {
  const leistung = Math.max(kwp, kva);
  if (leistung <= 0.8 && kwp <= 2) return 'balkon';
  if (leistung <= 4.6) return 'mini';
  if (leistung <= 10) return 'klein';
  if (leistung <= 30) return 'mittel';
  if (leistung <= 100) return 'gross';
  return 'gewerbe';
}

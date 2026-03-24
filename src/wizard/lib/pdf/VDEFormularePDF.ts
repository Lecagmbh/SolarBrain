/**
 * Baunity VDE-AR-N 4105 PDF Generator - UNIFIED WRAPPER
 * =======================================================
 * Diese Datei existiert für Rückwärtskompatibilität.
 *
 * VERWENDET: /src/lib/generators/VDEFormulareGenerator.ts
 */

import type { WizardData } from '../../types/wizard.types';
import {
  generateE1,
  generateE2,
  generateE3,
  generateE8,
  fromWizardData,
  type GeneratedDocument,
} from '../../../lib/generators';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

export type VDEFormularTyp = 'E1' | 'E2' | 'E3' | 'E8';

export interface VDEGeneratorOptions {
  isAdmin?: boolean;
  showInstallerBadge?: boolean;
}

export interface GeneratedVDEPDF {
  typ: VDEFormularTyp;
  name: string;
  blob: Blob;
  filename: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE PDF GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert ein einzelnes VDE-Formular
 */
export function generateSingleVDEPDF(
  data: WizardData,
  typ: VDEFormularTyp,
  options?: VDEGeneratorOptions
): GeneratedVDEPDF | null {
  const unified = fromWizardData(data);
  const opts = {
    isAdmin: options?.isAdmin,
    showInstallerBadge: options?.showInstallerBadge ?? options?.isAdmin,
  };

  let doc: GeneratedDocument | null = null;

  switch (typ) {
    case 'E1':
      doc = generateE1(unified, opts);
      break;
    case 'E2':
      doc = generateE2(unified, opts);
      break;
    case 'E3':
      doc = generateE3(unified, opts);
      break;
    case 'E8':
      doc = generateE8(unified, opts);
      break;
  }

  if (!doc) return null;

  return {
    typ,
    name: doc.name,
    blob: doc.blob,
    filename: doc.filename,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL PDFs GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert alle VDE-Formulare
 */
export function generateAllVDEPDFs(
  data: WizardData,
  options?: VDEGeneratorOptions
): GeneratedVDEPDF[] {
  const unified = fromWizardData(data);
  const opts = {
    isAdmin: options?.isAdmin,
    showInstallerBadge: options?.showInstallerBadge ?? options?.isAdmin,
  };

  const docs: GeneratedVDEPDF[] = [];

  // E.1 - Antragstellung
  const e1 = generateE1(unified, opts);
  docs.push({
    typ: 'E1',
    name: e1.name,
    blob: e1.blob,
    filename: e1.filename,
  });

  // E.2 - Datenblatt Erzeugungsanlagen
  const e2 = generateE2(unified, opts);
  docs.push({
    typ: 'E2',
    name: e2.name,
    blob: e2.blob,
    filename: e2.filename,
  });

  // E.3 - Datenblatt Speicher (nur wenn Speicher vorhanden)
  const e3 = generateE3(unified, opts);
  if (e3) {
    docs.push({
      typ: 'E3',
      name: e3.name,
      blob: e3.blob,
      filename: e3.filename,
    });
  }

  // E.8 - IBN-Protokoll
  const e8 = generateE8(unified, opts);
  docs.push({
    typ: 'E8',
    name: e8.name,
    blob: e8.blob,
    filename: e8.filename,
  });

  return docs;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (für bestehenden Code)
// ═══════════════════════════════════════════════════════════════════════════

/** @deprecated Use generateSingleVDEPDF instead */
export const generateVDEFormularPDF = generateSingleVDEPDF;

/** @deprecated Use generateAllVDEPDFs instead */
export const generateAllVDEFormulare = generateAllVDEPDFs;

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY TYPES (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

export type GeneratorOptionen = VDEGeneratorOptions;
export type GeneratedPDF = GeneratedVDEPDF;

export interface ProduktDBDaten {
  wechselrichter: WechselrichterMitDB[];
  speicher: SpeicherMitDB[];
  pvModule: PVModulMitDB[];
}

export interface WechselrichterMitDB {
  hersteller: string;
  modell: string;
  leistungKva: number;
  anzahl: number;
  zerezId?: string;
}

export interface SpeicherMitDB {
  hersteller: string;
  modell: string;
  kapazitaetKwh: number;
  kopplung: 'ac' | 'dc';
  zerezId?: string;
}

export interface PVModulMitDB {
  hersteller: string;
  modell: string;
  leistungWp: number;
  anzahl: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY FUNCTIONS (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

export function generateE1PDF(data: WizardData, options?: VDEGeneratorOptions): GeneratedVDEPDF | null {
  return generateSingleVDEPDF(data, 'E1', options);
}

export function generateE2PDF(data: WizardData, options?: VDEGeneratorOptions): GeneratedVDEPDF | null {
  return generateSingleVDEPDF(data, 'E2', options);
}

export function generateE3PDF(data: WizardData, options?: VDEGeneratorOptions): GeneratedVDEPDF | null {
  return generateSingleVDEPDF(data, 'E3', options);
}

export function generateE8PDF(data: WizardData, options?: VDEGeneratorOptions): GeneratedVDEPDF | null {
  return generateSingleVDEPDF(data, 'E8', options);
}

export function getVerfuegbareVDEFormulare(data: WizardData): VDEFormularTyp[] {
  const formulare: VDEFormularTyp[] = ['E1', 'E2', 'E8'];
  const unified = fromWizardData(data);
  if (unified.speicherKapazitaetKwh > 0) {
    formulare.push('E3');
  }
  return formulare;
}

export function getInstallateurNr(): string | undefined {
  const { COMPANY } = require('../../../../config/company');
  return COMPANY.installateurNr;
}

export function getEingetragenerNetzbetreiber(): string | undefined {
  return undefined; // Nicht mehr benötigt
}

export async function enrichWithProduktDB(data: WizardData): Promise<ProduktDBDaten> {
  // ProduktDB-Anreicherung ist jetzt im unified System
  const unified = fromWizardData(data);
  return {
    wechselrichter: unified.wechselrichter.map(w => ({
      hersteller: w.hersteller,
      modell: w.modell,
      leistungKva: w.leistungKva,
      anzahl: w.anzahl,
      zerezId: w.zerezId,
    })),
    speicher: unified.speicher.map(s => ({
      hersteller: s.hersteller,
      modell: s.modell,
      kapazitaetKwh: s.kapazitaetKwh,
      kopplung: s.kopplung,
      zerezId: s.zerezId,
    })),
    pvModule: unified.pvModule.map(m => ({
      hersteller: m.hersteller,
      modell: m.modell,
      leistungWp: m.leistungWp,
      anzahl: m.anzahl,
    })),
  };
}

export const BAUNITY_EINTRAGUNG = {
  name: 'Baunity',
  version: '4.0',
};

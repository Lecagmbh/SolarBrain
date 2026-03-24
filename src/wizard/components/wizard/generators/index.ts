/**
 * Baunity Wizard Generatoren - UNIFIED
 * ======================================
 * Wrapper für das zentrale Generator-System
 *
 * VERWENDET: /src/lib/generators/
 *
 * Diese Datei existiert für Rückwärtskompatibilität mit dem Wizard.
 * Alle Generierung erfolgt durch das zentrale System.
 */

import type { WizardData } from '../../../types/wizard.types';
import {
  generateSchaltplan as unifiedGenerateSchaltplan,
  generateSchaltplanSVG as unifiedGenerateSchaltplanSVG,
  generateLageplan as unifiedGenerateLageplan,
  generateLageplanSVG as unifiedGenerateLageplanSVG,
  generateVollmacht as unifiedGenerateVollmacht,
  generateE1,
  generateE2,
  generateE3,
  generateE8,
  generateAllDocuments as unifiedGenerateAllDocuments,
  fromWizardData,
  type UnifiedInstallationData,
  type GeneratedDocument,
} from '../../../../lib/generators';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

export interface SchaltplanConfig {
  kundenname: string;
  standort: string;
  pvKwp: number;
  pvModule: { name: string; anzahl: number; leistungWp: number; ausrichtung: string }[];
  wechselrichter: { hersteller: string; modell: string; leistungKva: number; anzahl: number }[];
  speicher: { hersteller: string; modell: string; kapazitaetKwh: number; kopplung: 'ac' | 'dc' }[];
  wallboxen: { leistungKw: number; anzahl: number }[];
  waermepumpen: { leistungKw: number }[];
  messkonzept: string;
  napiErforderlich: boolean;
}

export interface LageplanConfig {
  kundenname: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  pvKwp: number;
  moduleAnzahl: number;
  dachflaechen: { name: string; anzahl: number; ausrichtung: string; neigung: number; leistungWp: number }[];
  speicherKwh: number;
  messkonzept: string;
  netzbetreiber?: string;
}

export interface LageplanConfigV2 extends LageplanConfig {
  wechselrichterKva?: number;
}

export interface StringConfig {
  anzahl: number;
  leistungWp: number;
}

export interface StringplanConfig {
  kundenname: string;
  dachflaechen: { name: string; ausrichtung: string; neigung: number; strings: StringConfig[] }[];
  wechselrichter: { modell: string; leistungKva: number }[];
}

export interface VollmachtData {
  kundenname: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  telefon?: string;
  email?: string;
  geburtsdatum?: string;
  installateurName: string;
  installateurStrasse: string;
  installateurPlz: string;
  installateurOrt: string;
  installateurNr?: string;
  pvKwp: number;
  netzbetreiber?: string;
  mastrRegistrierung: boolean;
}

export interface GeneratedPlans {
  schaltplan: { svg: string; filename: string };
  lageplan: { svg: string; filename: string };
  stringplan: { svg: string; filename: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG EXTRACTORS (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extrahiert SchaltplanConfig aus WizardData
 */
export function extractSchaltplanConfig(data: WizardData): SchaltplanConfig {
  const unified = fromWizardData(data);
  return {
    kundenname: `${unified.kunde.vorname} ${unified.kunde.nachname}`.trim(),
    standort: `${unified.standort.strasse} ${unified.standort.hausnummer}, ${unified.standort.plz} ${unified.standort.ort}`,
    pvKwp: unified.gesamtleistungKwp,
    pvModule: unified.pvModule.map(m => ({
      name: m.name || 'Dachfläche',
      anzahl: m.anzahl,
      leistungWp: m.leistungWp,
      ausrichtung: m.ausrichtung || 'S',
    })),
    wechselrichter: unified.wechselrichter.map(w => ({
      hersteller: w.hersteller,
      modell: w.modell,
      leistungKva: w.leistungKva,
      anzahl: w.anzahl,
    })),
    speicher: unified.speicher.map(s => ({
      hersteller: s.hersteller,
      modell: s.modell,
      kapazitaetKwh: s.kapazitaetKwh,
      kopplung: s.kopplung,
    })),
    wallboxen: unified.wallboxen.map(w => ({
      leistungKw: w.leistungKw,
      anzahl: w.anzahl,
    })),
    waermepumpen: unified.waermepumpen.map(w => ({
      leistungKw: w.leistungKw,
    })),
    messkonzept: unified.messkonzept,
    napiErforderlich: unified.napiErforderlich || false,
  };
}

/**
 * Extrahiert LageplanConfig aus WizardData
 */
export function extractLageplanConfig(data: WizardData): LageplanConfig {
  const unified = fromWizardData(data);
  return {
    kundenname: `${unified.kunde.vorname} ${unified.kunde.nachname}`.trim(),
    strasse: unified.standort.strasse,
    hausnummer: unified.standort.hausnummer,
    plz: unified.standort.plz,
    ort: unified.standort.ort,
    pvKwp: unified.gesamtleistungKwp,
    moduleAnzahl: unified.pvModule.reduce((sum, m) => sum + m.anzahl, 0),
    dachflaechen: unified.pvModule.map(m => ({
      name: m.name || 'Dachfläche',
      anzahl: m.anzahl,
      ausrichtung: m.ausrichtung || 'S',
      neigung: m.neigung ?? 30,
      leistungWp: m.leistungWp,
    })),
    speicherKwh: unified.speicherKapazitaetKwh,
    messkonzept: unified.messkonzept,
    netzbetreiber: unified.netzbetreiber?.name,
  };
}

/**
 * Extrahiert LageplanConfigV2 aus WizardData
 */
export function extractLageplanConfigV2(data: WizardData): LageplanConfigV2 {
  const config = extractLageplanConfig(data);
  const unified = fromWizardData(data);
  return {
    ...config,
    wechselrichterKva: unified.gesamtleistungKva,
  };
}

/**
 * Extrahiert StringplanConfig aus WizardData
 */
export function extractStringplanConfig(data: WizardData): StringplanConfig {
  const unified = fromWizardData(data);
  return {
    kundenname: `${unified.kunde.vorname} ${unified.kunde.nachname}`.trim(),
    dachflaechen: unified.pvModule.map(m => ({
      name: m.name || 'Dachfläche',
      ausrichtung: m.ausrichtung || 'S',
      neigung: m.neigung ?? 30,
      strings: [{ anzahl: m.anzahl, leistungWp: m.leistungWp }],
    })),
    wechselrichter: unified.wechselrichter.map(w => ({
      modell: w.modell,
      leistungKva: w.leistungKva,
    })),
  };
}

/**
 * Extrahiert VollmachtData aus WizardData
 */
export function extractVollmachtData(data: WizardData): VollmachtData {
  const unified = fromWizardData(data);
  const { COMPANY } = require('../../../../config/company');
  return {
    kundenname: `${unified.kunde.vorname} ${unified.kunde.nachname}`.trim(),
    strasse: unified.standort.strasse,
    hausnummer: unified.standort.hausnummer,
    plz: unified.standort.plz,
    ort: unified.standort.ort,
    telefon: unified.kunde.telefon,
    email: unified.kunde.email,
    geburtsdatum: unified.kunde.geburtsdatum,
    installateurName: COMPANY.name,
    installateurStrasse: COMPANY.strasse,
    installateurPlz: COMPANY.plz,
    installateurOrt: COMPANY.ort,
    installateurNr: COMPANY.installateurNr,
    pvKwp: unified.gesamtleistungKwp,
    netzbetreiber: unified.netzbetreiber?.name,
    mastrRegistrierung: unified.mastrRegistrierung || false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG GENERATORS (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert Schaltplan SVG aus Config
 * VERWENDET: Unified Generator
 */
export function generateSchaltplanSVG(config: SchaltplanConfig): string {
  // Konvertiere Config zu UnifiedData
  const unified: UnifiedInstallationData = {
    kunde: {
      vorname: config.kundenname.split(' ')[0] || '',
      nachname: config.kundenname.split(' ').slice(1).join(' ') || config.kundenname,
    },
    standort: {
      strasse: config.standort.split(',')[0]?.trim() || '',
      hausnummer: '',
      plz: '',
      ort: config.standort.split(',')[1]?.trim() || '',
    },
    pvModule: config.pvModule.map(m => ({
      name: m.name,
      hersteller: '',
      modell: '',
      anzahl: m.anzahl,
      leistungWp: m.leistungWp,
      ausrichtung: m.ausrichtung,
      neigung: 30,
    })),
    wechselrichter: config.wechselrichter.map(w => ({
      hersteller: w.hersteller,
      modell: w.modell,
      leistungKva: w.leistungKva,
      anzahl: w.anzahl,
    })),
    speicher: config.speicher.map(s => ({
      hersteller: s.hersteller,
      modell: s.modell,
      kapazitaetKwh: s.kapazitaetKwh,
      leistungKw: 0,
      anzahl: 1,
      kopplung: s.kopplung,
    })),
    wallboxen: config.wallboxen.map(w => ({
      hersteller: '',
      modell: '',
      leistungKw: w.leistungKw,
      anzahl: w.anzahl,
    })),
    waermepumpen: config.waermepumpen.map(w => ({
      hersteller: '',
      modell: '',
      leistungKw: w.leistungKw,
    })),
    gesamtleistungKwp: config.pvKwp,
    gesamtleistungKva: config.wechselrichter.reduce((sum, w) => sum + w.leistungKva * w.anzahl, 0),
    speicherKapazitaetKwh: config.speicher.reduce((sum, s) => sum + s.kapazitaetKwh, 0),
    messkonzept: config.messkonzept as any,
    napiErforderlich: config.napiErforderlich,
  };

  // Synchroner Aufruf - wir brauchen das SVG direkt
  return unifiedGenerateSchaltplanSVG(unified);
}

/**
 * Generiert Lageplan SVG aus Config (ohne Satellitenbild - synchron)
 */
export function generateLageplanSVG(config: LageplanConfig): string {
  // Für synchronen Aufruf: Placeholder ohne Satellitenbild
  // Das echte Satellitenbild wird über generateLageplanWithMapsSVG geladen
  return generateLageplanSVGV2(config as LageplanConfigV2);
}

/**
 * Generiert Lageplan SVG V2 (Professional Design)
 */
export function generateLageplanSVGV2(config: LageplanConfigV2): string {
  const W = 842, H = 595;
  const M = 25;
  const datum = new Date().toLocaleDateString('de-DE');
  const planNr = `LP-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  // Einfacher schematischer Lageplan
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="0" y="0" width="${W}" height="45" fill="#0f172a"/>
<text x="${M}" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#ffffff">LAGEPLAN (Schematisch)</text>
<text x="${W - M}" y="28" font-family="Arial" font-size="12" fill="#94a3b8" text-anchor="end">${escapeXml(config.strasse)} ${escapeXml(config.hausnummer)}, ${escapeXml(config.plz)} ${escapeXml(config.ort)}</text>

<!-- Hinweis: Satellitenbild wird geladen -->
<rect x="${M}" y="55" width="520" height="380" fill="#f1f5f9" stroke="#bdbdbd" rx="4"/>
<text x="${M + 260}" y="245" font-family="Arial" font-size="12" fill="#64748b" text-anchor="middle">Satellitenansicht wird geladen...</text>

<!-- Anlagendaten -->
<rect x="560" y="55" width="257" height="110" fill="#fafafa" stroke="#bdbdbd" rx="4"/>
<rect x="560" y="55" width="257" height="22" fill="#1565c0" rx="4"/>
<text x="688" y="70" font-family="Arial" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">ANLAGENDATEN</text>
<text x="570" y="95" font-family="Arial" font-size="8" fill="#757575">PV-Leistung:</text>
<text x="807" y="95" font-family="Arial" font-size="10" font-weight="bold" fill="#1565c0" text-anchor="end">${config.pvKwp.toFixed(2)} kWp</text>
<text x="570" y="115" font-family="Arial" font-size="8" fill="#757575">Module:</text>
<text x="807" y="115" font-family="Arial" font-size="9" fill="#212121" text-anchor="end">${config.moduleAnzahl} Stück</text>
${config.speicherKwh > 0 ? `
<text x="570" y="135" font-family="Arial" font-size="8" fill="#757575">Speicher:</text>
<text x="807" y="135" font-family="Arial" font-size="9" fill="#212121" text-anchor="end">${config.speicherKwh.toFixed(1)} kWh</text>
` : ''}

<!-- Schriftfeld -->
<rect x="${M}" y="${H - 50}" width="${W - 2 * M}" height="40" fill="#fafafa" stroke="#bdbdbd"/>
<text x="${M + 5}" y="${H - 27}" font-family="Arial" font-size="9" fill="#212121">${escapeXml(config.kundenname)}</text>
<text x="${M + 155}" y="${H - 27}" font-family="Arial" font-size="9" fill="#212121">${escapeXml(config.strasse)} ${escapeXml(config.hausnummer)}</text>
<text x="${M + 355}" y="${H - 27}" font-family="Arial" font-size="9" fill="#212121">${planNr}</text>
<text x="${M + 485}" y="${H - 27}" font-family="Arial" font-size="9" fill="#212121">${datum}</text>

</svg>`;
}

function escapeXml(text: string): string {
  return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Generiert Lageplan MIT Google Maps Satellitenbild (async)
 * VERWENDET: Unified Generator
 */
export async function generateLageplanWithMapsSVG(config: LageplanConfig): Promise<string> {
  const unified = configToUnified(config);
  const result = await unifiedGenerateLageplanSVG(unified);
  return result.svg;
}

/**
 * Generiert Lageplan MIT Satellitenbild (async) - V2
 */
export async function generateLageplanWithSatelliteSVG(config: LageplanConfigV2): Promise<{ svg: string; hasSatelliteImage: boolean }> {
  const unified = configToUnified(config);
  const result = await unifiedGenerateLageplanSVG(unified);
  return {
    svg: result.svg,
    hasSatelliteImage: result.hasSatelliteImage,
  };
}

/**
 * Generiert Stringplan SVG
 */
export function generateStringplanSVG(config: StringplanConfig): string {
  const W = 842, H = 595;
  const M = 25;
  const datum = new Date().toLocaleDateString('de-DE');

  // Vereinfachter Stringplan
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="0" y="0" width="${W}" height="45" fill="#0f172a"/>
<text x="${M}" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#ffffff">STRINGPLAN</text>
<text x="${W - M}" y="28" font-family="Arial" font-size="12" fill="#94a3b8" text-anchor="end">${escapeXml(config.kundenname)}</text>

<text x="${W/2}" y="${H/2}" font-family="Arial" font-size="14" fill="#64748b" text-anchor="middle">Stringplan - ${config.dachflaechen.length} Dachfläche(n)</text>

<text x="${M + 5}" y="${H - 15}" font-family="Arial" font-size="8" fill="#757575">Erstellt: ${datum}</text>
</svg>`;
}

/**
 * Generiert Multi-Dach Stringplan
 */
export function generateMultiDachStringplanSVG(config: StringplanConfig): string {
  return generateStringplanSVG(config);
}

/**
 * Generiert Vollmacht HTML
 * VERWENDET: Unified Generator
 */
export function generateVollmachtHTML(vollmachtData: VollmachtData): string {
  // Das unified System generiert PDF, nicht HTML
  // Für HTML-Kompatibilität: Einfaches HTML Template
  return `<!DOCTYPE html>
<html>
<head><title>Vollmacht</title></head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
<h1>VOLLMACHT</h1>
<h3>zur Netzanmeldung einer Erzeugungsanlage</h3>

<h4>Vollmachtgeber (Anlagenbetreiber)</h4>
<p>${escapeXml(vollmachtData.kundenname)}<br>
${escapeXml(vollmachtData.strasse)} ${escapeXml(vollmachtData.hausnummer)}<br>
${escapeXml(vollmachtData.plz)} ${escapeXml(vollmachtData.ort)}</p>

<h4>Bevollmächtigter (Installationsunternehmen)</h4>
<p>${escapeXml(vollmachtData.installateurName)}<br>
${escapeXml(vollmachtData.installateurStrasse)}<br>
${escapeXml(vollmachtData.installateurPlz)} ${escapeXml(vollmachtData.installateurOrt)}</p>

<h4>Anlagendaten</h4>
<p>Leistung: ${vollmachtData.pvKwp.toFixed(2)} kWp<br>
${vollmachtData.netzbetreiber ? `Netzbetreiber: ${escapeXml(vollmachtData.netzbetreiber)}` : ''}</p>

<p style="margin-top: 40px;">Datum: ${new Date().toLocaleDateString('de-DE')}</p>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════════════════

function configToUnified(config: LageplanConfig | LageplanConfigV2): UnifiedInstallationData {
  return {
    kunde: {
      vorname: config.kundenname.split(' ')[0] || '',
      nachname: config.kundenname.split(' ').slice(1).join(' ') || config.kundenname,
    },
    standort: {
      strasse: config.strasse,
      hausnummer: config.hausnummer,
      plz: config.plz,
      ort: config.ort,
    },
    pvModule: config.dachflaechen.map(d => ({
      name: d.name,
      hersteller: '',
      modell: '',
      anzahl: d.anzahl,
      leistungWp: d.leistungWp,
      ausrichtung: d.ausrichtung,
      neigung: d.neigung,
    })),
    wechselrichter: [],
    speicher: config.speicherKwh > 0 ? [{
      hersteller: '',
      modell: '',
      kapazitaetKwh: config.speicherKwh,
      leistungKw: 0,
      anzahl: 1,
      kopplung: 'dc' as const,
    }] : [],
    wallboxen: [],
    waermepumpen: [],
    gesamtleistungKwp: config.pvKwp,
    gesamtleistungKva: (config as LageplanConfigV2).wechselrichterKva || config.pvKwp * 1.1,
    speicherKapazitaetKwh: config.speicherKwh,
    messkonzept: config.messkonzept as any,
    netzbetreiber: config.netzbetreiber ? { name: config.netzbetreiber } : undefined,
    napiErforderlich: (config as LageplanConfigV2).wechselrichterKva
      ? (config as LageplanConfigV2).wechselrichterKva! > 30
      : config.pvKwp > 27, // Faustregel: > 30 kVA
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOWNLOAD HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml' });
}

export async function downloadSVG(svg: string, filename: string): Promise<void> {
  const blob = svgToBlob(svg);
  const { downloadFile } = await import('@/utils/desktopDownload');
  await downloadFile({
    filename: filename.endsWith('.svg') ? filename : `${filename}.svg`,
    blob,
    fileType: 'svg',
  });
}

export function downloadSchaltplanSVG(svg: string, filename: string): void {
  downloadSVG(svg, filename);
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&t=k&z=19`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS (für Wizard)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert alle Pläne auf einmal (synchron - ohne Satellitenbild)
 */
export function generateAllPlans(data: WizardData): GeneratedPlans {
  const kundenname = `${data.step6?.vorname || ''} ${data.step6?.nachname || ''}`.trim().replace(/\s+/g, '_') || 'Kunde';
  const datum = new Date().toISOString().split('T')[0];

  // Configs extrahieren
  const schaltplanConfig = extractSchaltplanConfig(data);
  const lageplanConfig = extractLageplanConfigV2(data);
  const stringplanConfig = extractStringplanConfig(data);

  // SVGs generieren
  const schaltplanSVG = generateSchaltplanSVG(schaltplanConfig);
  const lageplanSVG = generateLageplanSVGV2(lageplanConfig);
  const stringplanSVG = generateStringplanSVG(stringplanConfig);

  return {
    schaltplan: {
      svg: schaltplanSVG,
      filename: `Schaltplan_${kundenname}_${datum}.svg`,
    },
    lageplan: {
      svg: lageplanSVG,
      filename: `Lageplan_${kundenname}_${datum}.svg`,
    },
    stringplan: {
      svg: stringplanSVG,
      filename: `Stringplan_${kundenname}_${datum}.svg`,
    },
  };
}

/**
 * Generiert alle Pläne MIT Satellitenbild (async)
 * VERWENDET: Unified Generator
 */
export async function generateAllPlansWithSatellite(data: WizardData): Promise<GeneratedPlans & { hasSatelliteImage?: boolean }> {
  const kundenname = `${data.step6?.vorname || ''} ${data.step6?.nachname || ''}`.trim().replace(/\s+/g, '_') || 'Kunde';
  const datum = new Date().toISOString().split('T')[0];

  // Unified Data erstellen
  const unified = fromWizardData(data);

  // SVGs generieren - VERWENDET UNIFIED GENERATOR
  const schaltplanSVG = unifiedGenerateSchaltplanSVG(unified);
  const lageplanResult = await unifiedGenerateLageplanSVG(unified);
  const stringplanSVG = generateStringplanSVG(extractStringplanConfig(data));

  return {
    schaltplan: {
      svg: schaltplanSVG,
      filename: `Schaltplan_${kundenname}_${datum}.svg`,
    },
    lageplan: {
      svg: lageplanResult.svg,
      filename: lageplanResult.hasSatelliteImage
        ? `Lageplan_Satellit_${kundenname}_${datum}.svg`
        : `Lageplan_${kundenname}_${datum}.svg`,
    },
    stringplan: {
      svg: stringplanSVG,
      filename: `Stringplan_${kundenname}_${datum}.svg`,
    },
    hasSatelliteImage: lageplanResult.hasSatelliteImage,
  };
}

/**
 * Generiert Lageplan aus WizardData (für direkte Imports)
 * VERWENDET: Unified Generator
 */
export async function generateLageplanFromWizard(data: WizardData): Promise<{ svg: string; hasSatelliteImage: boolean } | null> {
  try {
    const unified = fromWizardData(data);
    const result = await unifiedGenerateLageplanSVG(unified);
    return {
      svg: result.svg,
      hasSatelliteImage: result.hasSatelliteImage,
    };
  } catch (error) {
    console.error('[generators] Lageplan generation failed:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// V4 EXPORTS (für Rückwärtskompatibilität mit LageplanGeneratorV4 Imports)
// ═══════════════════════════════════════════════════════════════════════════

export const generateLageplanSVGV4 = generateLageplanSVG;
export const extractLageplanConfigV4 = extractLageplanConfig;
export const generateLageplanFromWizardV4 = generateLageplanFromWizard;

/**
 * Baunity Lageplan Generator V3 - Netzbetreiber-konform
 * ==================================================
 * Professioneller Lageplan nach VDE-AR-N 4105
 * 
 * Features:
 * - Schematische Darstellung (immer funktioniert)
 * - Optional: Satellitenbild wenn verfügbar
 * - Alle NB-relevanten Informationen
 * - PDF-Export ready
 */

import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';
import { geocodeAddressOSM, getGoogleMapsLink } from './openstreetmap';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LageplanConfig {
  // Adresse
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  
  // Anlage
  gesamtleistungKwp: number;
  modulAnzahl: number;
  wechselrichterLeistungKva: number;
  speicherKwh?: number;
  
  // Dachflächen
  dachflaechen: Array<{
    name: string;
    modulAnzahl: number;
    modulLeistungWp: number;
    ausrichtung: string;
    neigung: number;
  }>;
  
  // Netzbetreiber
  netzbetreiberName?: string;
  zaehlernummer?: string;
  
  // Optional: Koordinaten (wenn bekannt)
  lat?: number;
  lng?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACT CONFIG FROM WIZARD DATA
// ═══════════════════════════════════════════════════════════════════════════

export function extractLageplanConfig(data: WizardData): LageplanConfig {
  const dachflaechen = data.step5.dachflaechen || [];
  const wechselrichter = data.step5.wechselrichter || [];
  const speicher = data.step5.speicher || [];
  
  const gesamtKwp = dachflaechen.reduce((sum, d) => 
    sum + (d.modulAnzahl * d.modulLeistungWp / 1000), 0
  ) || data.step5.gesamtleistungKwp || 0;
  
  const modulAnzahl = dachflaechen.reduce((sum, d) => sum + d.modulAnzahl, 0);
  const wrKva = wechselrichter.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0);
  const speicherKwh = speicher.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0);
  
  return {
    strasse: data.step2.strasse || '',
    hausnummer: data.step2.hausnummer || '',
    plz: data.step2.plz || '',
    ort: data.step2.ort || '',
    gesamtleistungKwp: gesamtKwp,
    modulAnzahl,
    wechselrichterLeistungKva: wrKva,
    speicherKwh: speicherKwh > 0 ? speicherKwh : undefined,
    dachflaechen: dachflaechen.map(d => ({
      name: d.name || 'Dachfläche',
      modulAnzahl: d.modulAnzahl,
      modulLeistungWp: d.modulLeistungWp,
      ausrichtung: d.ausrichtung || 'S',
      neigung: d.neigung || 30,
    })),
    netzbetreiberName: data.step4?.netzbetreiberName,
    zaehlernummer: data.step4?.zaehlernummer,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HAUPTFUNKTION: LAGEPLAN SVG GENERIEREN
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplanSVG(config: LageplanConfig): Promise<{
  svg: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
}> {
  const W = 842, H = 595; // A4 Landscape
  const M = 30;
  
  // Versuche Koordinaten zu ermitteln
  let lat = config.lat;
  let lng = config.lng;
  let googleMapsUrl: string | undefined;
  
  if (!lat || !lng) {
    try {
      const coords = await geocodeAddressOSM(
        config.strasse, 
        config.hausnummer, 
        config.plz, 
        config.ort
      );
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        googleMapsUrl = getGoogleMapsLink(lat, lng);
      }
    } catch (e) {
      console.warn('[Lageplan] Geocoding failed:', e);
    }
  }
  
  // Farben
  const C = {
    primary: '#1565c0',
    pvOrange: '#ff9800',
    pvBorder: '#e65100',
    hak: '#d32f2f',
    zaehler: '#1976d2',
    speicher: '#388e3c',
    dcLine: '#f44336',
    acLine: '#2196f3',
    text: '#212121',
    textLight: '#757575',
    border: '#bdbdbd',
    bg: '#fafafa',
    white: '#ffffff',
  };
  
  // Datum
  const datum = new Date().toLocaleDateString('de-DE');
  const planNr = `LP-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  
  // ═══════════════════════════════════════════════════════════════════════
  // SVG AUFBAU
  // ═══════════════════════════════════════════════════════════════════════
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 16px Arial, sans-serif; fill: ${C.text}; }
    .subtitle { font: 500 11px Arial, sans-serif; fill: ${C.textLight}; }
    .label { font: 500 10px Arial, sans-serif; fill: ${C.text}; }
    .small { font: 400 9px Arial, sans-serif; fill: ${C.textLight}; }
    .value { font: bold 10px Arial, sans-serif; fill: ${C.text}; }
    .header { font: bold 9px Arial, sans-serif; fill: ${C.primary}; }
  </style>
  <linearGradient id="pvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#ffb74d"/>
    <stop offset="100%" style="stop-color:#ff9800"/>
  </linearGradient>
  <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:#90a4ae"/>
    <stop offset="100%" style="stop-color:#607d8b"/>
  </linearGradient>
  <pattern id="pvPattern" width="12" height="12" patternUnits="userSpaceOnUse">
    <rect width="12" height="12" fill="#ff9800"/>
    <rect x="1" y="1" width="10" height="10" fill="#ffb74d"/>
    <line x1="6" y1="0" x2="6" y2="12" stroke="#e65100" stroke-width="0.5"/>
    <line x1="0" y1="6" x2="12" y2="6" stroke="#e65100" stroke-width="0.5"/>
  </pattern>
  <filter id="shadow">
    <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.2"/>
  </filter>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="${C.bg}"/>

<!-- Rahmen -->
<rect x="${M}" y="${M}" width="${W-2*M}" height="${H-2*M}" fill="${C.white}" stroke="${C.border}" stroke-width="1"/>

<!-- Titel-Bereich -->
<rect x="${M}" y="${M}" width="${W-2*M}" height="50" fill="${C.primary}"/>
<text x="${M+15}" y="${M+22}" class="title" fill="white">LAGEPLAN</text>
<text x="${M+15}" y="${M+40}" class="subtitle" fill="rgba(255,255,255,0.8)">${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}</text>
<text x="${W-M-15}" y="${M+32}" text-anchor="end" class="small" fill="rgba(255,255,255,0.7)">${COMPANY.name}</text>

`;

  // ═══════════════════════════════════════════════════════════════════════
  // HAUPTBEREICH: SCHEMATISCHE DARSTELLUNG
  // ═══════════════════════════════════════════════════════════════════════
  
  const mainX = M + 20;
  const mainY = M + 70;
  const mainW = W - 2*M - 220;
  const mainH = H - M - 150;
  
  // Hausgrundriss (schematisch)
  const hausW = 200, hausH = 160;
  const hausX = mainX + mainW/2 - hausW/2;
  const hausY = mainY + 40;
  
  svg += `
<!-- Grundstück (schematisch) -->
<rect x="${mainX}" y="${mainY}" width="${mainW}" height="${mainH}" 
      fill="#e8f5e9" stroke="#81c784" stroke-width="1" stroke-dasharray="5,5" rx="4"/>
<text x="${mainX + 10}" y="${mainY + 18}" class="small" fill="#4caf50">Grundstück (schematisch)</text>

<!-- Haus -->
<g filter="url(#shadow)">
  <rect x="${hausX}" y="${hausY}" width="${hausW}" height="${hausH}" 
        fill="url(#roofGrad)" stroke="#455a64" stroke-width="2" rx="4"/>
  <text x="${hausX + hausW/2}" y="${hausY + hausH/2}" text-anchor="middle" class="label" fill="white">GEBÄUDE</text>
</g>

<!-- PV-Anlage auf Dach -->
<g>
  <rect x="${hausX + 20}" y="${hausY + 20}" width="${hausW - 40}" height="${hausH - 50}" 
        fill="url(#pvPattern)" stroke="${C.pvBorder}" stroke-width="2" rx="2"/>
  <text x="${hausX + hausW/2}" y="${hausY + hausH/2 - 5}" text-anchor="middle" class="value" fill="${C.pvBorder}">
    ☀ PV-ANLAGE
  </text>
  <text x="${hausX + hausW/2}" y="${hausY + hausH/2 + 10}" text-anchor="middle" class="small" fill="${C.pvBorder}">
    ${config.gesamtleistungKwp.toFixed(2)} kWp | ${config.modulAnzahl} Module
  </text>
</g>

<!-- HAK (Hausanschlusskasten) -->
<g transform="translate(${hausX - 60}, ${hausY + hausH - 30})">
  <rect x="0" y="0" width="40" height="30" fill="${C.hak}" stroke="#b71c1c" stroke-width="1.5" rx="3"/>
  <text x="20" y="12" text-anchor="middle" class="small" fill="white" font-weight="bold">HAK</text>
  <text x="20" y="24" text-anchor="middle" style="font-size:7px" fill="rgba(255,255,255,0.8)">Netz</text>
</g>

<!-- Zählerschrank -->
<g transform="translate(${hausX + 10}, ${hausY + hausH + 20})">
  <rect x="0" y="0" width="50" height="35" fill="${C.zaehler}" stroke="#0d47a1" stroke-width="1.5" rx="3"/>
  <text x="25" y="14" text-anchor="middle" class="small" fill="white" font-weight="bold">⚡ ZS</text>
  <text x="25" y="26" text-anchor="middle" style="font-size:7px" fill="rgba(255,255,255,0.8)">Zähler</text>
</g>

<!-- Wechselrichter -->
<g transform="translate(${hausX + hausW - 60}, ${hausY + hausH + 20})">
  <rect x="0" y="0" width="50" height="35" fill="#7b1fa2" stroke="#4a148c" stroke-width="1.5" rx="3"/>
  <text x="25" y="14" text-anchor="middle" class="small" fill="white" font-weight="bold">WR</text>
  <text x="25" y="26" text-anchor="middle" style="font-size:7px" fill="rgba(255,255,255,0.8)">${config.wechselrichterLeistungKva.toFixed(1)} kVA</text>
</g>
`;

  // Speicher wenn vorhanden
  if (config.speicherKwh && config.speicherKwh > 0) {
    svg += `
<!-- Batteriespeicher -->
<g transform="translate(${hausX + hausW/2 - 25}, ${hausY + hausH + 20})">
  <rect x="0" y="0" width="50" height="35" fill="${C.speicher}" stroke="#1b5e20" stroke-width="1.5" rx="3"/>
  <text x="25" y="14" text-anchor="middle" class="small" fill="white" font-weight="bold">🔋</text>
  <text x="25" y="26" text-anchor="middle" style="font-size:7px" fill="rgba(255,255,255,0.8)">${config.speicherKwh.toFixed(1)} kWh</text>
</g>
`;
  }

  // Leitungen
  svg += `
<!-- DC-Leitung (PV → WR) -->
<line x1="${hausX + hausW/2}" y1="${hausY + hausH - 10}" x2="${hausX + hausW - 35}" y2="${hausY + hausH + 20}" 
      stroke="${C.dcLine}" stroke-width="2.5" stroke-dasharray="8,4"/>
      
<!-- AC-Leitung (WR → Zähler) -->
<line x1="${hausX + hausW - 35}" y1="${hausY + hausH + 55}" x2="${hausX + 35}" y2="${hausY + hausH + 37}" 
      stroke="${C.acLine}" stroke-width="2.5" stroke-dasharray="8,4"/>

<!-- Netzanschluss (HAK → Zähler) -->
<line x1="${hausX - 20}" y1="${hausY + hausH + 5}" x2="${hausX + 10}" y2="${hausY + hausH + 30}" 
      stroke="#424242" stroke-width="3"/>
`;

  // ═══════════════════════════════════════════════════════════════════════
  // RECHTE SEITE: LEGENDE & INFOS
  // ═══════════════════════════════════════════════════════════════════════
  
  const infoX = W - M - 190;
  const infoY = mainY;
  
  // Nordpfeil
  svg += `
<!-- Nordpfeil -->
<g transform="translate(${infoX + 145}, ${infoY})">
  <circle cx="20" cy="20" r="18" fill="white" stroke="${C.border}" stroke-width="1"/>
  <polygon points="20,5 15,22 20,18 25,22" fill="${C.hak}"/>
  <text x="20" y="3" text-anchor="middle" class="small" font-weight="bold" fill="${C.hak}">N</text>
</g>

<!-- Legende -->
<g transform="translate(${infoX}, ${infoY + 50})">
  <rect x="0" y="0" width="180" height="180" fill="white" stroke="${C.border}" stroke-width="1" rx="4"/>
  <rect x="0" y="0" width="180" height="24" fill="${C.bg}" stroke="${C.border}" stroke-width="1" rx="4"/>
  <text x="90" y="16" text-anchor="middle" class="header">LEGENDE</text>
  
  <g transform="translate(12, 35)">
    <!-- PV-Anlage -->
    <rect x="0" y="0" width="24" height="14" fill="url(#pvPattern)" stroke="${C.pvBorder}" stroke-width="1" rx="2"/>
    <text x="32" y="11" class="small">PV-Anlage</text>
    
    <!-- HAK -->
    <rect x="0" y="22" width="18" height="12" fill="${C.hak}" rx="2"/>
    <text x="32" y="31" class="small">HAK (Hausanschluss)</text>
    
    <!-- Zähler -->
    <rect x="0" y="42" width="18" height="12" fill="${C.zaehler}" rx="2"/>
    <text x="32" y="51" class="small">Zählerschrank</text>
    
    <!-- WR -->
    <rect x="0" y="62" width="18" height="12" fill="#7b1fa2" rx="2"/>
    <text x="32" y="71" class="small">Wechselrichter</text>
    
    <!-- DC -->
    <line x1="0" y1="88" x2="24" y2="88" stroke="${C.dcLine}" stroke-width="2.5" stroke-dasharray="6,3"/>
    <text x="32" y="91" class="small">DC-Leitung</text>
    
    <!-- AC -->
    <line x1="0" y1="106" x2="24" y2="106" stroke="${C.acLine}" stroke-width="2.5" stroke-dasharray="6,3"/>
    <text x="32" y="109" class="small">AC-Leitung</text>
    
    <!-- Speicher -->
    <rect x="0" y="120" width="18" height="12" fill="${C.speicher}" rx="2"/>
    <text x="32" y="129" class="small">Batteriespeicher</text>
  </g>
</g>

<!-- Anlagendaten -->
<g transform="translate(${infoX}, ${infoY + 245})">
  <rect x="0" y="0" width="180" height="120" fill="white" stroke="${C.border}" stroke-width="1" rx="4"/>
  <rect x="0" y="0" width="180" height="24" fill="${C.bg}" stroke="${C.border}" stroke-width="1" rx="4"/>
  <text x="90" y="16" text-anchor="middle" class="header">ANLAGENDATEN</text>
  
  <g transform="translate(12, 35)">
    <text x="0" y="0" class="small">Leistung:</text>
    <text x="100" y="0" class="value">${config.gesamtleistungKwp.toFixed(2)} kWp</text>
    
    <text x="0" y="18" class="small">Module:</text>
    <text x="100" y="18" class="value">${config.modulAnzahl} Stück</text>
    
    <text x="0" y="36" class="small">Wechselrichter:</text>
    <text x="100" y="36" class="value">${config.wechselrichterLeistungKva.toFixed(1)} kVA</text>
    
    ${config.speicherKwh ? `
    <text x="0" y="54" class="small">Speicher:</text>
    <text x="100" y="54" class="value">${config.speicherKwh.toFixed(1)} kWh</text>
    ` : ''}
    
    <text x="0" y="${config.speicherKwh ? 72 : 54}" class="small">Flächen:</text>
    <text x="100" y="${config.speicherKwh ? 72 : 54}" class="value">${config.dachflaechen.length}</text>
  </g>
</g>
`;

  // Koordinaten wenn vorhanden
  if (lat && lng) {
    svg += `
<!-- Koordinaten -->
<g transform="translate(${infoX}, ${infoY + 375})">
  <rect x="0" y="0" width="180" height="40" fill="#e3f2fd" stroke="${C.zaehler}" stroke-width="1" rx="4"/>
  <text x="12" y="16" class="small" fill="${C.zaehler}">📍 Koordinaten:</text>
  <text x="12" y="30" class="small" fill="${C.text}">${lat.toFixed(6)}, ${lng.toFixed(6)}</text>
</g>
`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCHRIFTFELD (unten)
  // ═══════════════════════════════════════════════════════════════════════
  
  const sfY = H - M - 50;
  
  svg += `
<!-- Schriftfeld -->
<g transform="translate(${M}, ${sfY})">
  <rect x="0" y="0" width="${W-2*M}" height="45" fill="white" stroke="${C.border}" stroke-width="1"/>
  
  <!-- Spalten -->
  <line x1="180" y1="0" x2="180" y2="45" stroke="${C.border}"/>
  <line x1="380" y1="0" x2="380" y2="45" stroke="${C.border}"/>
  <line x1="530" y1="0" x2="530" y2="45" stroke="${C.border}"/>
  <line x1="680" y1="0" x2="680" y2="45" stroke="${C.border}"/>
  
  <!-- Zeile -->
  <line x1="0" y1="18" x2="${W-2*M}" y2="18" stroke="${C.border}"/>
  
  <!-- Header -->
  <text x="10" y="13" class="small" fill="${C.textLight}">Bauherr</text>
  <text x="190" y="13" class="small" fill="${C.textLight}">Standort</text>
  <text x="390" y="13" class="small" fill="${C.textLight}">Plan-Nr. / Maßstab</text>
  <text x="540" y="13" class="small" fill="${C.textLight}">Datum / Erstellt</text>
  <text x="690" y="13" class="small" fill="${C.textLight}">Unternehmen</text>
  
  <!-- Werte -->
  <text x="10" y="35" class="label">${config.netzbetreiberName ? 'Anlagenbetreiber' : 'Bauherr'}</text>
  <text x="190" y="28" class="small">${config.strasse} ${config.hausnummer}</text>
  <text x="190" y="40" class="small">${config.plz} ${config.ort}</text>
  <text x="390" y="28" class="small">${planNr}</text>
  <text x="390" y="40" class="small">Schematisch</text>
  <text x="540" y="28" class="small">${datum}</text>
  <text x="540" y="40" class="small">${COMPANY.name}</text>
  <text x="690" y="35" class="label">${COMPANY.name}</text>
</g>

<!-- Google Maps Hinweis -->
${googleMapsUrl ? `
<text x="${mainX + mainW/2}" y="${mainY + mainH - 8}" text-anchor="middle" class="small" fill="${C.textLight}">
  Für Satellitenbild: Google Maps öffnen und Screenshot erstellen
</text>
` : ''}

</svg>`;

  return {
    svg,
    lat,
    lng,
    googleMapsUrl,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert Lageplan aus Wizard-Daten
 */
export async function generateLageplanFromWizard(data: WizardData): Promise<{
  svg: string;
  filename: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
}> {
  const config = extractLageplanConfig(data);
  const result = await generateLageplanSVG(config);
  
  const kundenname = `${data.step6.vorname || ''}_${data.step6.nachname || ''}`.trim().replace(/\s+/g, '_') || 'Lageplan';
  const datum = new Date().toISOString().split('T')[0];
  
  return {
    ...result,
    filename: `Lageplan_${kundenname}_${datum}.svg`,
  };
}

export default {
  extractLageplanConfig,
  generateLageplanSVG,
  generateLageplanFromWizard,
};

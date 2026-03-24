/**
 * Baunity Lageplan Generator V5 - Clean OpenStreetMap Style
 * ========================================================
 * Professioneller Lageplan nach VDE-AR-N 4105
 * 
 * NEU in V5:
 * - Clean OpenStreetMap Kartenstil (keine Satellitenbilder)
 * - Keine PV-Paneele eingezeichnet (nur Marker für Standort)
 * - Professionelles, minimalistisches Design
 * - Höhere Auflösung
 */

import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';
import { geocodeAddress } from './maptiler';
import { getGoogleMapsLink } from './openstreetmap';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LageplanConfig {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  gesamtleistungKwp: number;
  modulAnzahl: number;
  wechselrichterLeistungKva: number;
  speicherKwh?: number;
  dachflaechen: Array<{
    name: string;
    modulAnzahl: number;
    modulLeistungWp: number;
    ausrichtung: string;
    neigung: number;
  }>;
  netzbetreiberName?: string;
  zaehlernummer?: string;
  kundenName?: string;
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
    kundenName: `${data.step6?.vorname || ''} ${data.step6?.nachname || ''}`.trim(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENSTREETMAP TILE URL - Clean Style
// ═══════════════════════════════════════════════════════════════════════════

function getOpenStreetMapTileUrl(lat: number, lng: number, zoom: number = 18): string {
  // OpenStreetMap Standard Tiles (kostenlos, keine API Key nötig)
  // Alternative: CartoDB Positron für noch cleaneren Look
  const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  // CartoDB Positron - sehr clean und professionell
  return `https://a.basemaps.cartocdn.com/light_all/${zoom}/${tileX}/${tileY}.png`;
}

// Berechne mehrere Tiles für größeren Kartenausschnitt
function getMapTilesForArea(lat: number, lng: number, zoom: number = 18, tilesX: number = 3, tilesY: number = 3): string[] {
  const centerTileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const centerTileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  const tiles: string[] = [];
  const offsetX = Math.floor(tilesX / 2);
  const offsetY = Math.floor(tilesY / 2);
  
  for (let dy = -offsetY; dy <= offsetY; dy++) {
    for (let dx = -offsetX; dx <= offsetX; dx++) {
      const x = centerTileX + dx;
      const y = centerTileY + dy;
      tiles.push(`https://a.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`);
    }
  }
  
  return tiles;
}

// ═══════════════════════════════════════════════════════════════════════════
// HAUPTFUNKTION: LAGEPLAN MIT OPENSTREETMAP STYLE
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplanSVG(config: LageplanConfig): Promise<{
  svg: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  hasMap: boolean;
}> {
  const W = 842, H = 595; // A4 Landscape
  const M = 20;
  
  // Versuche Koordinaten zu holen
  let lat = config.lat;
  let lng = config.lng;
  let googleMapsUrl: string | undefined;
  let mapImageUrl: string | null = null;
  
  try {
    const coords = await geocodeAddress(
      config.strasse, 
      config.hausnummer, 
      config.plz, 
      config.ort
    );
    
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
      googleMapsUrl = getGoogleMapsLink(lat, lng);
      
      // OpenStreetMap Static Image URL (via externe Services)
      // Wir nutzen einen Static Map Service
      const zoom = 18;
      mapImageUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=500x350&maptype=mapnik&markers=${lat},${lng},red`;
      
      // Map URL generated
    }
  } catch (e) {
    console.warn('[LageplanV5] Geocoding failed:', e);
  }
  
  // Farben - Clean & Professional
  const C = {
    primary: '#1e40af',      // Tiefes Blau
    accent: '#3b82f6',       // Helleres Blau
    success: '#059669',      // Grün für PV
    warning: '#d97706',      // Orange
    danger: '#dc2626',       // Rot für HAK
    text: '#1e293b',
    textLight: '#64748b',
    border: '#cbd5e1',
    borderLight: '#e2e8f0',
    bg: '#f8fafc',
    white: '#ffffff',
    mapBg: '#f1f5f9',
  };
  
  const datum = new Date().toLocaleDateString('de-DE');
  const planNr = `LP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  
  // Kartenbereich
  const mapX = M + 10;
  const mapY = 75;
  const mapW = 520;
  const mapH = 380;
  
  // ═══════════════════════════════════════════════════════════════════════
  // SVG AUFBAU
  // ═══════════════════════════════════════════════════════════════════════
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap');
    .title { font: 700 16px 'Inter', sans-serif; fill: ${C.white}; }
    .subtitle { font: 500 11px 'Inter', sans-serif; fill: rgba(255,255,255,0.85); }
    .label { font: 600 10px 'Inter', sans-serif; fill: ${C.text}; }
    .small { font: 400 9px 'Inter', sans-serif; fill: ${C.textLight}; }
    .value { font: 600 10px 'Inter', sans-serif; fill: ${C.text}; }
    .header { font: 700 9px 'Inter', sans-serif; fill: ${C.primary}; text-transform: uppercase; letter-spacing: 0.5px; }
    .mono { font: 500 9px 'SF Mono', 'Monaco', monospace; fill: ${C.text}; }
  </style>
  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" style="stop-color:${C.primary}"/>
    <stop offset="100%" style="stop-color:${C.accent}"/>
  </linearGradient>
  <linearGradient id="pvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#34d399"/>
    <stop offset="100%" style="stop-color:#059669"/>
  </linearGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
  </filter>
  <filter id="shadowSmall" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.08"/>
  </filter>
  <clipPath id="mapClip">
    <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" rx="12"/>
  </clipPath>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="${C.bg}"/>

<!-- Header -->
<rect x="${M}" y="${M}" width="${W - 2*M}" height="50" rx="12" fill="url(#headerGrad)" filter="url(#shadow)"/>
<text x="${M + 20}" y="${M + 24}" class="title">📍 LAGEPLAN</text>
<text x="${M + 20}" y="${M + 40}" class="subtitle">${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}</text>

<!-- Kartenbereich -->
<rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" rx="12" fill="${C.white}" stroke="${C.border}" filter="url(#shadow)"/>

<!-- Karteninhalt -->
<g clip-path="url(#mapClip)">
  ${mapImageUrl ? `
    <!-- OpenStreetMap Karte -->
    <image href="${mapImageUrl}" x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" preserveAspectRatio="xMidYMid slice"/>
  ` : `
    <!-- Fallback: Stilisierte Kartenansicht -->
    <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" fill="#e8f4ea"/>
    
    <!-- Stilisierte Straßen -->
    <g stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round">
      <path d="M${mapX + 50},${mapY + mapH - 50} Q${mapX + mapW/3},${mapY + mapH/2} ${mapX + mapW - 100},${mapY + 80}"/>
      <path d="M${mapX + 100},${mapY + 50} L${mapX + mapW/2 + 50},${mapY + mapH - 80}"/>
      <path d="M${mapX},${mapY + mapH/2} L${mapX + mapW},${mapY + mapH/2 - 30}"/>
    </g>
    <g stroke="#d1d5db" stroke-width="6" fill="none" stroke-linecap="round">
      <path d="M${mapX + 50},${mapY + mapH - 50} Q${mapX + mapW/3},${mapY + mapH/2} ${mapX + mapW - 100},${mapY + 80}"/>
      <path d="M${mapX + 100},${mapY + 50} L${mapX + mapW/2 + 50},${mapY + mapH - 80}"/>
      <path d="M${mapX},${mapY + mapH/2} L${mapX + mapW},${mapY + mapH/2 - 30}"/>
    </g>
    
    <!-- Stilisierte Gebäude -->
    <g fill="#d1d5db" stroke="#9ca3af" stroke-width="1">
      <rect x="${mapX + 150}" y="${mapY + 100}" width="60" height="50" rx="2"/>
      <rect x="${mapX + 280}" y="${mapY + 150}" width="80" height="60" rx="2"/>
      <rect x="${mapX + 100}" y="${mapY + 250}" width="70" height="45" rx="2"/>
      <rect x="${mapX + 350}" y="${mapY + 80}" width="50" height="40" rx="2"/>
      <rect x="${mapX + 400}" y="${mapY + 200}" width="55" height="55" rx="2"/>
    </g>
  `}
</g>

<!-- Standort-Marker (Mittelpunkt) -->
<g transform="translate(${mapX + mapW/2}, ${mapY + mapH/2})">
  <!-- Pulsierender Ring -->
  <circle cx="0" cy="0" r="35" fill="${C.success}" fill-opacity="0.15"/>
  <circle cx="0" cy="0" r="25" fill="${C.success}" fill-opacity="0.25"/>
  
  <!-- Pin -->
  <g transform="translate(-16, -40)">
    <path d="M16 0 C7.16 0 0 7.16 0 16 C0 28 16 40 16 40 C16 40 32 28 32 16 C32 7.16 24.84 0 16 0Z" 
          fill="${C.success}" filter="url(#shadowSmall)"/>
    <circle cx="16" cy="14" r="6" fill="${C.white}"/>
    <text x="16" y="18" text-anchor="middle" style="font: bold 10px sans-serif; fill: ${C.success};">⚡</text>
  </g>
  
  <!-- Label -->
  <g transform="translate(0, 20)">
    <rect x="-50" y="0" width="100" height="24" rx="12" fill="${C.white}" stroke="${C.success}" stroke-width="2" filter="url(#shadowSmall)"/>
    <text x="0" y="16" text-anchor="middle" style="font: 600 10px 'Inter', sans-serif; fill: ${C.success};">PV-Anlage</text>
  </g>
</g>

<!-- Kompass -->
<g transform="translate(${mapX + mapW - 45}, ${mapY + 20})">
  <circle cx="20" cy="20" r="18" fill="${C.white}" stroke="${C.border}" stroke-width="1.5" filter="url(#shadowSmall)"/>
  <polygon points="20,6 16,20 20,17 24,20" fill="${C.danger}"/>
  <polygon points="20,34 16,20 20,23 24,20" fill="${C.textLight}"/>
  <text x="20" y="5" text-anchor="middle" style="font: bold 8px sans-serif; fill: ${C.danger};">N</text>
</g>

<!-- Maßstab -->
<g transform="translate(${mapX + 15}, ${mapY + mapH - 30})">
  <rect x="0" y="0" width="100" height="20" rx="4" fill="rgba(255,255,255,0.9)" filter="url(#shadowSmall)"/>
  <line x1="10" y1="10" x2="90" y2="10" stroke="${C.text}" stroke-width="2"/>
  <line x1="10" y1="6" x2="10" y2="14" stroke="${C.text}" stroke-width="2"/>
  <line x1="90" y1="6" x2="90" y2="14" stroke="${C.text}" stroke-width="2"/>
  <text x="50" y="16" text-anchor="middle" class="small">~50m</text>
</g>

<!-- Copyright -->
<text x="${mapX + mapW - 10}" y="${mapY + mapH - 8}" text-anchor="end" style="font: 7px sans-serif; fill: ${C.textLight};">© OpenStreetMap</text>
`;

  // ═══════════════════════════════════════════════════════════════════════
  // RECHTE SEITE: INFO-PANELS
  // ═══════════════════════════════════════════════════════════════════════
  
  const infoX = mapX + mapW + 20;
  const infoY = mapY;
  const infoW = W - infoX - M - 5;
  
  svg += `
<!-- Anlagendaten Panel -->
<g transform="translate(${infoX}, ${infoY})">
  <rect x="0" y="0" width="${infoW}" height="145" rx="10" fill="${C.white}" stroke="${C.border}" filter="url(#shadow)"/>
  <rect x="0" y="0" width="${infoW}" height="32" rx="10" fill="${C.bg}"/>
  <rect x="0" y="22" width="${infoW}" height="10" fill="${C.bg}"/>
  <text x="${infoW/2}" y="21" text-anchor="middle" class="header">⚡ ANLAGENDATEN</text>
  
  <g transform="translate(15, 45)">
    <text x="0" y="0" class="small">Gesamtleistung</text>
    <text x="${infoW - 30}" y="0" text-anchor="end" class="value">${config.gesamtleistungKwp.toFixed(2)} kWp</text>
    
    <line x1="0" y1="8" x2="${infoW - 30}" y2="8" stroke="${C.borderLight}" stroke-dasharray="2,2"/>
    
    <text x="0" y="24" class="small">Module</text>
    <text x="${infoW - 30}" y="24" text-anchor="end" class="value">${config.modulAnzahl} Stück</text>
    
    <line x1="0" y1="32" x2="${infoW - 30}" y2="32" stroke="${C.borderLight}" stroke-dasharray="2,2"/>
    
    <text x="0" y="48" class="small">Wechselrichter</text>
    <text x="${infoW - 30}" y="48" text-anchor="end" class="value">${config.wechselrichterLeistungKva.toFixed(1)} kVA</text>
    
    ${config.speicherKwh ? `
    <line x1="0" y1="56" x2="${infoW - 30}" y2="56" stroke="${C.borderLight}" stroke-dasharray="2,2"/>
    
    <text x="0" y="72" class="small">Batteriespeicher</text>
    <text x="${infoW - 30}" y="72" text-anchor="end" class="value">${config.speicherKwh.toFixed(1)} kWh</text>
    ` : ''}
    
    <line x1="0" y1="${config.speicherKwh ? 80 : 56}" x2="${infoW - 30}" y2="${config.speicherKwh ? 80 : 56}" stroke="${C.borderLight}" stroke-dasharray="2,2"/>
    
    <text x="0" y="${config.speicherKwh ? 96 : 72}" class="small">Dachflächen</text>
    <text x="${infoW - 30}" y="${config.speicherKwh ? 96 : 72}" text-anchor="end" class="value">${config.dachflaechen.length}</text>
  </g>
</g>

<!-- Standort Panel -->
<g transform="translate(${infoX}, ${infoY + 160})">
  <rect x="0" y="0" width="${infoW}" height="110" rx="10" fill="${C.white}" stroke="${C.border}" filter="url(#shadow)"/>
  <rect x="0" y="0" width="${infoW}" height="32" rx="10" fill="${C.bg}"/>
  <rect x="0" y="22" width="${infoW}" height="10" fill="${C.bg}"/>
  <text x="${infoW/2}" y="21" text-anchor="middle" class="header">📍 STANDORT</text>
  
  <g transform="translate(15, 45)">
    <text x="0" y="0" class="label">${config.strasse} ${config.hausnummer}</text>
    <text x="0" y="16" class="label">${config.plz} ${config.ort}</text>
    
    ${lat && lng ? `
    <line x1="0" y1="28" x2="${infoW - 30}" y2="28" stroke="${C.borderLight}"/>
    <text x="0" y="44" class="small">Koordinaten</text>
    <text x="0" y="58" class="mono">${lat.toFixed(6)}, ${lng.toFixed(6)}</text>
    ` : ''}
  </g>
</g>

<!-- Netzbetreiber Panel -->
${config.netzbetreiberName ? `
<g transform="translate(${infoX}, ${infoY + 285})">
  <rect x="0" y="0" width="${infoW}" height="70" rx="10" fill="${C.white}" stroke="${C.border}" filter="url(#shadow)"/>
  <rect x="0" y="0" width="${infoW}" height="32" rx="10" fill="${C.bg}"/>
  <rect x="0" y="22" width="${infoW}" height="10" fill="${C.bg}"/>
  <text x="${infoW/2}" y="21" text-anchor="middle" class="header">🔌 NETZBETREIBER</text>
  
  <g transform="translate(15, 45)">
    <text x="0" y="0" class="label" style="font-size: 9px;">${config.netzbetreiberName.length > 28 ? config.netzbetreiberName.substring(0, 28) + '...' : config.netzbetreiberName}</text>
    ${config.zaehlernummer ? `<text x="0" y="16" class="small">Zähler: ${config.zaehlernummer}</text>` : ''}
  </g>
</g>
` : ''}

<!-- Google Maps Link Hinweis -->
${googleMapsUrl ? `
<g transform="translate(${infoX}, ${infoY + (config.netzbetreiberName ? 368 : 285)})">
  <rect x="0" y="0" width="${infoW}" height="32" rx="8" fill="#dbeafe" stroke="#93c5fd"/>
  <text x="${infoW/2}" y="14" text-anchor="middle" style="font: 500 8px 'Inter', sans-serif; fill: ${C.primary};">🗺️ Satellitenbild verfügbar auf</text>
  <text x="${infoW/2}" y="26" text-anchor="middle" style="font: 600 9px 'Inter', sans-serif; fill: ${C.accent}; text-decoration: underline;">Google Maps</text>
</g>
` : ''}
`;

  // ═══════════════════════════════════════════════════════════════════════
  // SCHRIFTFELD (Footer)
  // ═══════════════════════════════════════════════════════════════════════
  
  const sfY = H - M - 52;
  
  svg += `
<!-- Schriftfeld -->
<g transform="translate(${M}, ${sfY})">
  <rect x="0" y="0" width="${W - 2*M}" height="47" rx="8" fill="${C.white}" stroke="${C.border}" filter="url(#shadow)"/>
  
  <!-- Spalten -->
  <line x1="180" y1="0" x2="180" y2="47" stroke="${C.borderLight}"/>
  <line x1="380" y1="0" x2="380" y2="47" stroke="${C.borderLight}"/>
  <line x1="520" y1="0" x2="520" y2="47" stroke="${C.borderLight}"/>
  <line x1="660" y1="0" x2="660" y2="47" stroke="${C.borderLight}"/>
  
  <!-- Header Zeile -->
  <line x1="0" y1="18" x2="${W - 2*M}" y2="18" stroke="${C.borderLight}"/>
  
  <!-- Labels -->
  <text x="10" y="13" class="small">Anlagenbetreiber</text>
  <text x="190" y="13" class="small">Anlagenstandort</text>
  <text x="390" y="13" class="small">Plan-Nr.</text>
  <text x="530" y="13" class="small">Datum</text>
  <text x="670" y="13" class="small">Erstellt von</text>
  
  <!-- Werte -->
  <text x="10" y="35" class="label">${config.kundenName || 'Anlagenbetreiber'}</text>
  <text x="190" y="28" class="small" style="fill: ${C.text};">${config.strasse} ${config.hausnummer}</text>
  <text x="190" y="42" class="small" style="fill: ${C.text};">${config.plz} ${config.ort}</text>
  <text x="390" y="35" class="mono">${planNr}</text>
  <text x="530" y="35" class="label">${datum}</text>
  <text x="670" y="35" class="label">${COMPANY.name}</text>
</g>

</svg>`;

  return {
    svg,
    lat,
    lng,
    googleMapsUrl,
    hasMap: !!mapImageUrl,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT HELPER
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplanFromWizard(data: WizardData): Promise<{
  svg: string;
  filename: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  hasMap: boolean;
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

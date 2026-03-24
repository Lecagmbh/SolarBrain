/**
 * Baunity Lageplan Generator
 * ========================
 * Generiert NB-konforme Lagepläne als SVG
 * 
 * Optionen:
 * 1. Mit Google Maps Satellit als Hintergrund
 * 2. Schematische Darstellung mit Maßen
 * 
 * NB-Anforderungen:
 * - Grundstücksgrenzen
 * - Gebäudeposition
 * - PV-Module Position auf Dach
 * - Nordpfeil
 * - HAK (Hausanschlusskasten) Position
 * - Zählerschrank Position
 * - Maßstab
 */

import type { WizardData } from '../../../types/wizard.types';

export interface LageplanConfig {
  // Adresse
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  
  // Grundstück (optional - für schematisch)
  grundstueckBreite?: number;  // Meter
  grundstueckTiefe?: number;   // Meter
  
  // Gebäude
  gebaeudeName?: string;
  gebaeudeLaenge?: number;     // Meter
  gebaeudeBreite?: number;     // Meter
  gebaeudeDrehung?: number;    // Grad (0 = Nord)
  
  // PV-Anlage
  pvPosition: 'nord' | 'sued' | 'ost' | 'west' | 'flach';
  pvFlaeche?: number;          // m²
  modulAnzahl: number;
  
  // Technik-Positionen
  hakPosition?: 'nord' | 'sued' | 'ost' | 'west';
  zaehlerImHaus?: boolean;
  
  // Darstellung
  mapsImageUrl?: string;       // Google Maps Static API URL
  mapsImageBase64?: string;    // Base64 encoded image
  
  // Meta
  kundenname: string;
  datum: string;
  massstab?: string;
}

export function extractLageplanConfig(data: WizardData): LageplanConfig {
  const modulAnzahl = data.step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || 0;
  const pvFlaeche = data.step5.dachflaechen?.reduce((s, d) => s + (d.modulAnzahl * 2), 0) || 0; // ~2m² pro Modul
  
  // Hauptausrichtung ermitteln
  const hauptDach = data.step5.dachflaechen?.[0];
  let pvPosition: LageplanConfig['pvPosition'] = 'sued';
  if (hauptDach?.ausrichtung) {
    const azimut = String(hauptDach.ausrichtung || '').toLowerCase();
    if (azimut.includes('nord')) pvPosition = 'nord';
    else if (azimut.includes('ost')) pvPosition = 'ost';
    else if (azimut.includes('west')) pvPosition = 'west';
    else if (hauptDach.neigung === 0) pvPosition = 'flach';
  }
  
  return {
    strasse: data.step2.strasse || '',
    hausnummer: data.step2.hausnummer || '',
    plz: data.step2.plz || '',
    ort: data.step2.ort || '',
    pvPosition,
    pvFlaeche,
    modulAnzahl,
    hakPosition: 'sued', // Default
    zaehlerImHaus: true,
    kundenname: `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim(),
    datum: new Date().toLocaleDateString('de-DE'),
    massstab: '1:200',
  };
}

/**
 * Generiert Google Maps Static API URL
 */
export function generateMapsUrl(config: LageplanConfig, apiKey: string): string {
  const address = encodeURIComponent(
    `${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}, Germany`
  );
  
  return `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${address}` +
    `&zoom=19` +
    `&size=600x400` +
    `&maptype=satellite` +
    `&key=${apiKey}`;
}

/**
 * Generiert schematischen Lageplan als SVG (ohne Maps)
 */
export function generateLageplanSVG(config: LageplanConfig): string {
  const W = 842, H = 595; // A4 Landscape
  const M = 50; // Margin
  
  // Farben
  const C = {
    grund: '#e8f5e9',      // Hellgrün für Grundstück
    gebaeude: '#90a4ae',   // Grau für Gebäude
    dach: '#78909c',       // Dunkelgrau für Dach
    pv: '#ff9800',         // Orange für PV
    hak: '#f44336',        // Rot für HAK
    zaehler: '#2196f3',    // Blau für Zähler
    text: '#37474f',
    border: '#546e7a',
  };
  
  // Grundstück skalieren
  const grundBreite = config.grundstueckBreite || 20;
  const grundTiefe = config.grundstueckTiefe || 30;
  const scale = Math.min((W - 2*M - 200) / grundBreite, (H - 2*M - 120) / grundTiefe);
  
  const gW = grundBreite * scale;
  const gH = grundTiefe * scale;
  const gX = M + 50;
  const gY = M + 30;
  
  // Gebäude (zentriert im Grundstück)
  const gebL = (config.gebaeudeLaenge || 12) * scale;
  const gebB = (config.gebaeudeBreite || 10) * scale;
  const gebX = gX + (gW - gebL) / 2;
  const gebY = gY + gH * 0.3;
  
  // PV-Fläche auf Dach
  const pvW = gebL * 0.7;
  const pvH = gebB * 0.5;
  let pvX = gebX + (gebL - pvW) / 2;
  let pvY = gebY + 10;
  
  // Position basierend auf Ausrichtung
  if (config.pvPosition === 'sued') pvY = gebY + gebB - pvH - 10;
  else if (config.pvPosition === 'ost') { pvX = gebX + gebL - pvW - 10; pvY = gebY + (gebB - pvH) / 2; }
  else if (config.pvPosition === 'west') { pvX = gebX + 10; pvY = gebY + (gebB - pvH) / 2; }
  
  // HAK Position
  let hakX = gebX + gebL / 2;
  let hakY = gebY + gebB + 20;
  if (config.hakPosition === 'nord') hakY = gebY - 30;
  else if (config.hakPosition === 'ost') { hakX = gebX + gebL + 20; hakY = gebY + gebB / 2; }
  else if (config.hakPosition === 'west') { hakX = gebX - 30; hakY = gebY + gebB / 2; }
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 16px Arial; fill: ${C.text}; }
    .label { font: 11px Arial; fill: ${C.text}; }
    .small { font: 9px Arial; fill: ${C.text}; }
    .dim { font: 10px Arial; fill: #666; }
  </style>
  <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 z" fill="${C.border}"/>
  </marker>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="white"/>
<rect x="${M}" y="${M}" width="${W-2*M}" height="${H-2*M}" fill="none" stroke="${C.border}" stroke-width="0.5"/>

<!-- Titel -->
<text x="${M + 10}" y="${M + 20}" class="title">Lageplan - ${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}</text>

<!-- Nordpfeil -->
<g transform="translate(${W - M - 60}, ${M + 50})">
  <circle cx="20" cy="20" r="18" fill="none" stroke="${C.border}" stroke-width="1"/>
  <polygon points="20,5 15,25 20,20 25,25" fill="${C.border}"/>
  <text x="20" y="45" text-anchor="middle" class="label" font-weight="bold">N</text>
</g>

<!-- Grundstück -->
<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${C.grund}" stroke="${C.border}" stroke-width="2" stroke-dasharray="10,5"/>
<text x="${gX + gW/2}" y="${gY - 8}" text-anchor="middle" class="small">Grundstücksgrenze</text>

<!-- Maße Grundstück -->
<line x1="${gX}" y1="${gY + gH + 15}" x2="${gX + gW}" y2="${gY + gH + 15}" stroke="${C.border}" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
<text x="${gX + gW/2}" y="${gY + gH + 28}" text-anchor="middle" class="dim">${grundBreite} m</text>

<line x1="${gX + gW + 15}" y1="${gY}" x2="${gX + gW + 15}" y2="${gY + gH}" stroke="${C.border}" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
<text x="${gX + gW + 30}" y="${gY + gH/2}" text-anchor="middle" class="dim" transform="rotate(90, ${gX + gW + 30}, ${gY + gH/2})">${grundTiefe} m</text>

<!-- Gebäude -->
<rect x="${gebX}" y="${gebY}" width="${gebL}" height="${gebB}" fill="${C.gebaeude}" stroke="${C.border}" stroke-width="2"/>
<text x="${gebX + gebL/2}" y="${gebY + gebB/2 + 4}" text-anchor="middle" class="label">${config.gebaeudeName || 'Wohngebäude'}</text>

<!-- PV-Module -->
<rect x="${pvX}" y="${pvY}" width="${pvW}" height="${pvH}" fill="${C.pv}" fill-opacity="0.7" stroke="#e65100" stroke-width="2"/>
<text x="${pvX + pvW/2}" y="${pvY + pvH/2 - 5}" text-anchor="middle" class="small" fill="white" font-weight="bold">PV-Anlage</text>
<text x="${pvX + pvW/2}" y="${pvY + pvH/2 + 8}" text-anchor="middle" class="small" fill="white">${config.modulAnzahl} Module</text>
<text x="${pvX + pvW/2}" y="${pvY + pvH/2 + 20}" text-anchor="middle" class="small" fill="white">~${config.pvFlaeche} m²</text>

<!-- HAK -->
<rect x="${hakX - 8}" y="${hakY - 8}" width="16" height="16" fill="${C.hak}" stroke="#c62828" stroke-width="1"/>
<text x="${hakX}" y="${hakY + 4}" text-anchor="middle" class="small" fill="white" font-weight="bold">H</text>
<text x="${hakX}" y="${hakY + 25}" text-anchor="middle" class="small">HAK</text>

<!-- Zählerschrank (im Gebäude) -->
${config.zaehlerImHaus ? `
<rect x="${gebX + 10}" y="${gebY + gebB - 25}" width="20" height="15" fill="${C.zaehler}" stroke="#1565c0" stroke-width="1"/>
<text x="${gebX + 20}" y="${gebY + gebB - 14}" text-anchor="middle" class="small" fill="white" font-weight="bold">Z</text>
` : ''}

<!-- Legende -->
<g transform="translate(${W - M - 180}, ${H - M - 130})">
  <rect x="0" y="0" width="170" height="120" fill="white" stroke="${C.border}" stroke-width="1"/>
  <text x="85" y="18" text-anchor="middle" class="label" font-weight="bold">Legende</text>
  <line x1="10" y1="25" x2="160" y2="25" stroke="${C.border}" stroke-width="0.5"/>
  
  <rect x="15" y="35" width="20" height="12" fill="${C.pv}" fill-opacity="0.7"/>
  <text x="45" y="45" class="small">PV-Module</text>
  
  <rect x="15" y="55" width="12" height="12" fill="${C.hak}"/>
  <text x="45" y="65" class="small">HAK (Hausanschluss)</text>
  
  <rect x="15" y="75" width="12" height="12" fill="${C.zaehler}"/>
  <text x="45" y="85" class="small">Zählerschrank</text>
  
  <rect x="15" y="95" width="20" height="12" fill="none" stroke="${C.border}" stroke-dasharray="3,2"/>
  <text x="45" y="105" class="small">Grundstücksgrenze</text>
</g>

<!-- Schriftfeld -->
<g transform="translate(${M}, ${H - M - 60})">
  <rect x="0" y="0" width="300" height="50" fill="none" stroke="${C.border}" stroke-width="1"/>
  <line x1="150" y1="0" x2="150" y2="50" stroke="${C.border}" stroke-width="0.5"/>
  <line x1="0" y1="25" x2="150" y2="25" stroke="${C.border}" stroke-width="0.5"/>
  
  <text x="5" y="15" class="small">Bauherr:</text>
  <text x="5" y="38" class="small" font-weight="bold">${config.kundenname}</text>
  
  <text x="155" y="15" class="small">Datum: ${config.datum}</text>
  <text x="155" y="38" class="small">Maßstab: ${config.massstab || '1:200'}</text>
</g>

<!-- Maßstabsbalken -->
<g transform="translate(${M + 320}, ${H - M - 45})">
  <rect x="0" y="0" width="100" height="8" fill="white" stroke="${C.border}"/>
  <rect x="0" y="0" width="50" height="8" fill="${C.border}"/>
  <text x="0" y="20" class="small">0</text>
  <text x="50" y="20" text-anchor="middle" class="small">5m</text>
  <text x="100" y="20" text-anchor="end" class="small">10m</text>
</g>

</svg>`;

  return svg;
}

/**
 * Generiert Lageplan mit Maps-Hintergrund als SVG
 * Das Maps-Bild muss als Base64 übergeben werden
 */
export function generateLageplanWithMapsSVG(config: LageplanConfig): string {
  const W = 842, H = 595;
  const M = 50;
  
  const C = {
    pv: '#ff9800',
    hak: '#f44336',
    zaehler: '#2196f3',
    text: '#37474f',
    border: '#546e7a',
    overlay: 'rgba(255,255,255,0.9)',
  };
  
  // Maps Bild Bereich
  const mapW = W - 2*M - 200;
  const mapH = H - 2*M - 80;
  const mapX = M;
  const mapY = M + 30;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 16px Arial; fill: ${C.text}; }
    .label { font: 11px Arial; fill: ${C.text}; }
    .small { font: 9px Arial; fill: ${C.text}; }
  </style>
</defs>

<rect width="100%" height="100%" fill="white"/>

<!-- Titel -->
<text x="${M + 10}" y="${M + 20}" class="title">Lageplan - ${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}</text>

<!-- Maps Bild Platzhalter -->
<rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" fill="#e0e0e0" stroke="${C.border}" stroke-width="1"/>
${config.mapsImageBase64 ? `
<image x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" 
       xlink:href="data:image/png;base64,${config.mapsImageBase64}" 
       preserveAspectRatio="xMidYMid slice"/>
` : `
<text x="${mapX + mapW/2}" y="${mapY + mapH/2}" text-anchor="middle" class="label" fill="#999">
  Google Maps Satellitenbild hier einfügen
</text>
<text x="${mapX + mapW/2}" y="${mapY + mapH/2 + 20}" text-anchor="middle" class="small" fill="#999">
  (Screenshot von maps.google.com)
</text>
`}

<!-- Overlay für PV-Markierung (zentriert als Beispiel) -->
<rect x="${mapX + mapW/2 - 40}" y="${mapY + mapH/2 - 30}" width="80" height="60" 
      fill="${C.pv}" fill-opacity="0.5" stroke="#e65100" stroke-width="2" stroke-dasharray="5,3"/>
<text x="${mapX + mapW/2}" y="${mapY + mapH/2}" text-anchor="middle" class="small" fill="#e65100" font-weight="bold">PV</text>

<!-- Nordpfeil -->
<g transform="translate(${W - M - 60}, ${M + 50})">
  <circle cx="20" cy="20" r="18" fill="white" stroke="${C.border}" stroke-width="1"/>
  <polygon points="20,5 15,25 20,20 25,25" fill="${C.border}"/>
  <text x="20" y="45" text-anchor="middle" class="label" font-weight="bold">N</text>
</g>

<!-- Legende -->
<g transform="translate(${W - M - 180}, ${mapY + 80})">
  <rect x="0" y="0" width="170" height="100" fill="${C.overlay}" stroke="${C.border}" stroke-width="1"/>
  <text x="85" y="18" text-anchor="middle" class="label" font-weight="bold">Legende</text>
  <line x1="10" y1="25" x2="160" y2="25" stroke="${C.border}" stroke-width="0.5"/>
  
  <rect x="15" y="35" width="20" height="12" fill="${C.pv}" fill-opacity="0.5" stroke="#e65100" stroke-dasharray="3,2"/>
  <text x="45" y="45" class="small">PV-Anlage (${config.modulAnzahl} Module)</text>
  
  <rect x="15" y="55" width="12" height="12" fill="${C.hak}"/>
  <text x="45" y="65" class="small">HAK</text>
  
  <rect x="15" y="75" width="12" height="12" fill="${C.zaehler}"/>
  <text x="45" y="85" class="small">Zählerplatz</text>
</g>

<!-- Info -->
<g transform="translate(${W - M - 180}, ${mapY + 200})">
  <rect x="0" y="0" width="170" height="60" fill="${C.overlay}" stroke="${C.border}" stroke-width="1"/>
  <text x="10" y="18" class="small" font-weight="bold">Hinweis:</text>
  <text x="10" y="35" class="small">PV-Position auf Satelliten-</text>
  <text x="10" y="48" class="small">bild einzeichnen</text>
</g>

<!-- Schriftfeld -->
<g transform="translate(${M}, ${H - M - 45})">
  <rect x="0" y="0" width="300" height="35" fill="white" stroke="${C.border}" stroke-width="1"/>
  <line x1="150" y1="0" x2="150" y2="35" stroke="${C.border}" stroke-width="0.5"/>
  <text x="5" y="15" class="small">Bauherr: ${config.kundenname}</text>
  <text x="5" y="28" class="small">Adresse: ${config.strasse} ${config.hausnummer}</text>
  <text x="155" y="15" class="small">Datum: ${config.datum}</text>
  <text x="155" y="28" class="small">Erstellt mit Baunity</text>
</g>

</svg>`;

  return svg;
}

export default {
  extractLageplanConfig,
  generateLageplanSVG,
  generateLageplanWithMapsSVG,
  generateMapsUrl,
};

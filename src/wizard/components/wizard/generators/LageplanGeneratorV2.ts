/**
 * Baunity Lageplan Generator V2 - PROFESSIONAL EDITION
 * ==================================================
 * NB-konformer Lageplan nach VDE-AR-N 4105
 * 
 * Features:
 * - DIN 6771-1 konformes Schriftfeld
 * - Mehrere Dachflächen
 * - Kabelverläufe (DC/AC)
 * - Realistische Proportionen
 * - Himmelsrichtungen
 * - Abstandsmarkierungen
 * - Straße mit Bürgersteig
 * - MapTiler Satellitenbild Integration
 */

import type { WizardData } from '../../../types/wizard.types';
import { COMPANY } from '../../../types/wizard.types';
import { fetchSatelliteImageForAddress } from '../../../lib/maps/maptiler';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LageplanConfigV2 {
  // Adresse
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  bundesland?: string;
  
  // Grundstück
  grundstueckBreite: number;   // Meter
  grundstueckTiefe: number;    // Meter
  
  // Gebäude
  gebaeude: GebaeudeConfig[];
  
  // Dachflächen mit PV
  dachflaechen: DachflaecheConfig[];
  
  // Technik
  hakPosition: Position;
  zaehlerPosition: Position;
  wechselrichterPosition?: Position;
  
  // Kabelverläufe
  dcKabelLaenge?: number;      // Meter (Dach → WR)
  acKabelLaenge?: number;      // Meter (WR → Zähler)
  
  // Meta
  kundenname: string;
  plannummer?: string;
  datum: string;
  massstab: string;
  gezeichnetVon?: string;
  
  // Options
  showKabelwege?: boolean;
  showMasse?: boolean;
  showKompass?: boolean;
  satellitenBild?: string;     // Base64
}

interface GebaeudeConfig {
  name: string;
  breite: number;             // Meter
  laenge: number;             // Meter
  x: number;                  // Position auf Grundstück (0-1)
  y: number;
  drehung?: number;           // Grad
  typ: 'wohnhaus' | 'garage' | 'carport' | 'nebengebaeude';
}

interface DachflaecheConfig {
  gebaeudeIndex: number;      // Welches Gebäude
  name: string;
  ausrichtung: string;        // "Süd", "Ost-West", etc.
  neigung: number;            // Grad
  modulAnzahl: number;
  modulLeistungWp: number;
  flaeche: number;            // m²
  position: 'nord' | 'sued' | 'ost' | 'west' | 'mitte';
}

interface Position {
  x: number;                  // 0-1 relativ zum Grundstück
  y: number;
  label?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════

export function extractLageplanConfigV2(data: WizardData): LageplanConfigV2 {
  // Dachflächen extrahieren
  const dachflaechen: DachflaecheConfig[] = (data.step5.dachflaechen || []).map((d, i) => {
    let position: DachflaecheConfig['position'] = 'sued';
    const az = (d.ausrichtung || '').toLowerCase();
    if (az.includes('nord')) position = 'nord';
    else if (az.includes('ost')) position = 'ost';
    else if (az.includes('west')) position = 'west';
    else if (d.neigung === 0) position = 'mitte';
    
    return {
      gebaeudeIndex: 0,
      name: d.name || `Dachfläche ${i + 1}`,
      ausrichtung: d.ausrichtung || 'Süd',
      neigung: d.neigung || 30,
      modulAnzahl: d.modulAnzahl || 0,
      modulLeistungWp: d.modulLeistungWp || 400,
      flaeche: (d.modulAnzahl || 0) * 2, // ~2m² pro Modul
      position,
    };
  });
  
  // Gesamtleistung (für spätere Verwendung verfügbar)
  // const gesamtKwp = dachflaechen.reduce((s, d) => s + (d.modulAnzahl * d.modulLeistungWp / 1000), 0);
  
  return {
    strasse: data.step2.strasse || 'Musterstraße',
    hausnummer: data.step2.hausnummer || '1',
    plz: data.step2.plz || '12345',
    ort: data.step2.ort || 'Musterstadt',
    
    grundstueckBreite: 20,
    grundstueckTiefe: 35,
    
    gebaeude: [{
      name: 'Wohnhaus',
      breite: 10,
      laenge: 12,
      x: 0.5,
      y: 0.4,
      typ: 'wohnhaus',
    }],
    
    dachflaechen,
    
    hakPosition: { x: 0.5, y: 1.0, label: 'HAK' },
    zaehlerPosition: { x: 0.35, y: 0.45, label: 'Zähler' },
    wechselrichterPosition: { x: 0.4, y: 0.45, label: 'WR' },
    
    dcKabelLaenge: 15,
    acKabelLaenge: 8,
    
    kundenname: `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim() || 'Kunde',
    plannummer: `LP-${Date.now().toString(36).toUpperCase()}`,
    datum: new Date().toLocaleDateString('de-DE'),
    massstab: '1:200',
    gezeichnetVon: COMPANY.name,
    
    showKabelwege: true,
    showMasse: true,
    showKompass: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateLageplanSVGV2(config: LageplanConfigV2): string {
  const W = 842, H = 595; // A4 Landscape
  const M = 40;           // Margin
  
  // Farben - Professionelle Palette
  const C = {
    // Grundstück
    gras: '#c8e6c9',
    grundGrenze: '#2e7d32',
    
    // Gebäude
    gebaeude: '#eceff1',
    gebaeudeStroke: '#455a64',
    dach: '#90a4ae',
    
    // PV
    pv: '#ff6f00',
    pvStroke: '#e65100',
    pvText: '#ffffff',
    
    // Technik
    hak: '#c62828',
    zaehler: '#1565c0',
    wr: '#6a1b9a',
    
    // Kabel
    dcKabel: '#f44336',
    acKabel: '#2196f3',
    
    // Straße
    strasse: '#78909c',
    buergersteig: '#b0bec5',
    
    // Text
    text: '#263238',
    textLight: '#546e7a',
    
    // Schriftfeld
    schriftfeld: '#fafafa',
    schriftfeldBorder: '#90a4ae',
  };
  
  // Berechnung der Skalierung
  const zeichenBreite = W - 2*M - 220; // Platz für Legende rechts
  const zeichenHoehe = H - 2*M - 100;  // Platz für Schriftfeld unten
  const scale = Math.min(zeichenBreite / config.grundstueckBreite, zeichenHoehe / config.grundstueckTiefe) * 0.85;
  
  // Grundstück Position
  const gW = config.grundstueckBreite * scale;
  const gH = config.grundstueckTiefe * scale;
  const gX = M + 30;
  const gY = M + 50;
  
  // Straße (unter dem Grundstück)
  const strasseY = gY + gH;
  const strasseH = 40;
  
  // ═══════════════════════════════════════════════════════════════════════
  // SVG START
  // ═══════════════════════════════════════════════════════════════════════
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap');
    .title { font: 600 14px Inter, Arial; fill: ${C.text}; }
    .subtitle { font: 500 11px Inter, Arial; fill: ${C.textLight}; }
    .label { font: 500 10px Inter, Arial; fill: ${C.text}; }
    .small { font: 400 9px Inter, Arial; fill: ${C.textLight}; }
    .dim { font: 400 8px Inter, Arial; fill: ${C.textLight}; }
    .schrift { font: 400 9px Inter, Arial; fill: ${C.text}; }
    .schrift-bold { font: 600 9px Inter, Arial; fill: ${C.text}; }
  </style>
  
  <!-- Marker für Pfeile -->
  <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 z" fill="${C.textLight}"/>
  </marker>
  <marker id="arrowTail" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
    <path d="M8,0 L0,4 L8,8 z" fill="${C.textLight}"/>
  </marker>
  
  <!-- Muster für Gras -->
  <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="20" height="20">
    <rect width="20" height="20" fill="${C.gras}"/>
    <circle cx="5" cy="5" r="1" fill="#a5d6a7" opacity="0.5"/>
    <circle cx="15" cy="15" r="1" fill="#a5d6a7" opacity="0.5"/>
  </pattern>
  
  <!-- Muster für Dach -->
  <pattern id="roofPattern" patternUnits="userSpaceOnUse" width="10" height="10">
    <rect width="10" height="10" fill="${C.dach}"/>
    <line x1="0" y1="10" x2="10" y2="0" stroke="#78909c" stroke-width="0.5"/>
  </pattern>
  
  <!-- Gradient für PV-Module -->
  <linearGradient id="pvGradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#ffb300"/>
    <stop offset="100%" style="stop-color:#ff6f00"/>
  </linearGradient>
  
  <!-- Schatten -->
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.2"/>
  </filter>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="#ffffff"/>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- TITEL -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<text x="${M}" y="${M + 20}" class="title">LAGEPLAN</text>
<text x="${M}" y="${M + 35}" class="subtitle">${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}</text>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STRAßE -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="${gX - 30}" y="${strasseY}" width="${gW + 60}" height="${strasseH}" fill="${C.strasse}"/>
<rect x="${gX - 30}" y="${strasseY}" width="${gW + 60}" height="8" fill="${C.buergersteig}"/>
<line x1="${gX - 30}" y1="${strasseY + 20}" x2="${gX + gW + 30}" y2="${strasseY + 20}" 
      stroke="#fff" stroke-width="2" stroke-dasharray="20,15"/>
<text x="${gX + gW/2}" y="${strasseY + strasseH - 8}" text-anchor="middle" class="small" fill="#fff">
  ${config.strasse}
</text>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- GRUNDSTÜCK -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="url(#grassPattern)" filter="url(#shadow)"/>
<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="none" 
      stroke="${C.grundGrenze}" stroke-width="2.5" stroke-dasharray="12,6"/>

<!-- Grundstück-Maße -->
${config.showMasse ? `
<!-- Breite unten -->
<line x1="${gX}" y1="${strasseY - 8}" x2="${gX + gW}" y2="${strasseY - 8}" 
      stroke="${C.textLight}" stroke-width="1" marker-start="url(#arrowTail)" marker-end="url(#arrowHead)"/>
<rect x="${gX + gW/2 - 25}" y="${strasseY - 18}" width="50" height="14" fill="white"/>
<text x="${gX + gW/2}" y="${strasseY - 6}" text-anchor="middle" class="dim">${config.grundstueckBreite} m</text>

<!-- Tiefe rechts -->
<line x1="${gX + gW + 8}" y1="${gY}" x2="${gX + gW + 8}" y2="${gY + gH}" 
      stroke="${C.textLight}" stroke-width="1" marker-start="url(#arrowTail)" marker-end="url(#arrowHead)"/>
<text x="${gX + gW + 20}" y="${gY + gH/2}" text-anchor="middle" class="dim" 
      transform="rotate(90, ${gX + gW + 20}, ${gY + gH/2})">${config.grundstueckTiefe} m</text>
` : ''}`;

  // ═══════════════════════════════════════════════════════════════════════
  // GEBÄUDE
  // ═══════════════════════════════════════════════════════════════════════
  
  config.gebaeude.forEach((geb, i) => {
    const gebW = geb.breite * scale;
    const gebL = geb.laenge * scale;
    const gebX = gX + gW * geb.x - gebW/2;
    const gebY = gY + gH * geb.y - gebL/2;
    
    // Rotation wenn definiert
    const rotation = geb.drehung ? `transform="rotate(${geb.drehung}, ${gebX + gebW/2}, ${gebY + gebL/2})"` : '';
    
    svg += `
<!-- Gebäude: ${geb.name} -->
<g ${rotation}>
  <!-- Gebäude-Schatten -->
  <rect x="${gebX + 4}" y="${gebY + 4}" width="${gebW}" height="${gebL}" fill="rgba(0,0,0,0.1)" rx="2"/>
  
  <!-- Gebäude-Körper -->
  <rect x="${gebX}" y="${gebY}" width="${gebW}" height="${gebL}" 
        fill="${C.gebaeude}" stroke="${C.gebaeudeStroke}" stroke-width="2" rx="2"/>
  
  <!-- Dach-Schraffur -->
  <rect x="${gebX + 5}" y="${gebY + 5}" width="${gebW - 10}" height="${gebL - 10}" 
        fill="url(#roofPattern)" opacity="0.5"/>
  
  <!-- Gebäude-Name -->
  <text x="${gebX + gebW/2}" y="${gebY + gebL/2 + 4}" text-anchor="middle" class="label">${geb.name}</text>
</g>`;
    
    // ═══════════════════════════════════════════════════════════════════════
    // PV-MODULE AUF DIESEM GEBÄUDE
    // ═══════════════════════════════════════════════════════════════════════
    
    const gebDachflaechen = config.dachflaechen.filter(d => d.gebaeudeIndex === i);
    
    gebDachflaechen.forEach((dach) => {
      const pvW = gebW * 0.7;
      const pvH = gebL * 0.4;
      let pvX = gebX + (gebW - pvW) / 2;
      let pvY = gebY + 15;
      
      // Position basierend auf Ausrichtung
      if (dach.position === 'sued') pvY = gebY + gebL - pvH - 15;
      else if (dach.position === 'nord') pvY = gebY + 15;
      else if (dach.position === 'ost') { pvX = gebX + gebW - pvW - 15; pvY = gebY + (gebL - pvH) / 2; }
      else if (dach.position === 'west') { pvX = gebX + 15; pvY = gebY + (gebL - pvH) / 2; }
      
      // Modul-Raster berechnen
      const modulBreite = 1.0 * scale;   // ~1m Modul
      const modulHoehe = 1.7 * scale;    // ~1.7m Modul
      const cols = Math.floor(pvW / (modulBreite + 2));
      const rows = Math.floor(pvH / (modulHoehe + 2));
      
      svg += `
<!-- PV-Fläche: ${dach.name} -->
<g>
  <!-- PV-Rahmen -->
  <rect x="${pvX}" y="${pvY}" width="${pvW}" height="${pvH}" 
        fill="url(#pvGradient)" fill-opacity="0.85" 
        stroke="${C.pvStroke}" stroke-width="2" rx="3"/>
  
  <!-- Modul-Raster -->
  ${Array.from({length: Math.min(rows * cols, dach.modulAnzahl)}, (_, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const mx = pvX + 5 + col * (modulBreite + 2);
    const my = pvY + 5 + row * (modulHoehe + 2);
    return `<rect x="${mx}" y="${my}" width="${modulBreite}" height="${modulHoehe}" 
                  fill="#1a237e" fill-opacity="0.3" stroke="#303f9f" stroke-width="0.5" rx="1"/>`;
  }).join('\n  ')}
  
  <!-- PV-Info -->
  <text x="${pvX + pvW/2}" y="${pvY + pvH/2 - 8}" text-anchor="middle" 
        class="label" fill="${C.pvText}" font-weight="600">☀ ${dach.name}</text>
  <text x="${pvX + pvW/2}" y="${pvY + pvH/2 + 5}" text-anchor="middle" 
        class="small" fill="${C.pvText}">${dach.modulAnzahl} Module</text>
  <text x="${pvX + pvW/2}" y="${pvY + pvH/2 + 17}" text-anchor="middle" 
        class="small" fill="${C.pvText}">${(dach.modulAnzahl * dach.modulLeistungWp / 1000).toFixed(2)} kWp</text>
</g>`;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TECHNISCHE EINRICHTUNGEN
  // ═══════════════════════════════════════════════════════════════════════
  
  // HAK (Hausanschlusskasten)
  const hakX = gX + gW * config.hakPosition.x;
  const hakY = gY + gH * config.hakPosition.y;
  
  svg += `
<!-- HAK (Hausanschlusskasten) -->
<g>
  <rect x="${hakX - 12}" y="${hakY - 12}" width="24" height="24" 
        fill="${C.hak}" stroke="#7f0000" stroke-width="2" rx="3" filter="url(#shadow)"/>
  <text x="${hakX}" y="${hakY + 4}" text-anchor="middle" class="small" fill="white" font-weight="bold">HAK</text>
  <text x="${hakX}" y="${hakY + 35}" text-anchor="middle" class="small">Hausanschluss</text>
</g>`;

  // Zählerschrank
  const zaehlerX = gX + gW * config.zaehlerPosition.x;
  const zaehlerY = gY + gH * config.zaehlerPosition.y;
  
  svg += `
<!-- Zählerschrank -->
<g>
  <rect x="${zaehlerX - 10}" y="${zaehlerY - 8}" width="20" height="16" 
        fill="${C.zaehler}" stroke="#0d47a1" stroke-width="1.5" rx="2"/>
  <text x="${zaehlerX}" y="${zaehlerY + 4}" text-anchor="middle" class="small" fill="white" font-weight="bold">Z</text>
</g>`;

  // Wechselrichter (wenn vorhanden)
  if (config.wechselrichterPosition) {
    const wrX = gX + gW * config.wechselrichterPosition.x;
    const wrY = gY + gH * config.wechselrichterPosition.y;
    
    svg += `
<!-- Wechselrichter -->
<g>
  <rect x="${wrX - 10}" y="${wrY - 8}" width="20" height="16" 
        fill="${C.wr}" stroke="#4a148c" stroke-width="1.5" rx="2"/>
  <text x="${wrX}" y="${wrY + 4}" text-anchor="middle" class="small" fill="white" font-weight="bold">WR</text>
</g>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KABELVERLÄUFE
  // ═══════════════════════════════════════════════════════════════════════
  
  if (config.showKabelwege) {
    // DC-Kabel (vom PV zum WR) - gestrichelt rot
    const gebX = gX + gW * config.gebaeude[0].x;
    const gebY = gY + gH * config.gebaeude[0].y;
    const wrX = config.wechselrichterPosition ? gX + gW * config.wechselrichterPosition.x : zaehlerX;
    const wrY = config.wechselrichterPosition ? gY + gH * config.wechselrichterPosition.y : zaehlerY;
    
    svg += `
<!-- Kabelverläufe -->
<g>
  <!-- DC-Kabel (Dach → WR) -->
  <path d="M ${gebX} ${gebY - 30} L ${gebX} ${wrY - 20} L ${wrX} ${wrY - 20} L ${wrX} ${wrY}" 
        fill="none" stroke="${C.dcKabel}" stroke-width="2" stroke-dasharray="6,3" opacity="0.7"/>
  <text x="${gebX + 5}" y="${wrY - 25}" class="dim" fill="${C.dcKabel}">DC ${config.dcKabelLaenge || '~15'}m</text>
  
  <!-- AC-Kabel (WR → Zähler) -->
  <path d="M ${wrX + 10} ${wrY} L ${zaehlerX - 10} ${zaehlerY}" 
        fill="none" stroke="${C.acKabel}" stroke-width="2" stroke-dasharray="6,3" opacity="0.7"/>
  <text x="${(wrX + zaehlerX)/2}" y="${zaehlerY - 8}" class="dim" fill="${C.acKabel}">AC ${config.acKabelLaenge || '~8'}m</text>
  
  <!-- Netzanschluss (Zähler → HAK) -->
  <path d="M ${zaehlerX} ${zaehlerY + 8} L ${zaehlerX} ${hakY - 20} L ${hakX} ${hakY - 12}" 
        fill="none" stroke="#333" stroke-width="2" opacity="0.5"/>
</g>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KOMPASS / NORDPFEIL
  // ═══════════════════════════════════════════════════════════════════════
  
  if (config.showKompass) {
    svg += `
<!-- Nordpfeil -->
<g transform="translate(${W - M - 60}, ${M + 60})">
  <circle cx="25" cy="25" r="24" fill="white" stroke="${C.textLight}" stroke-width="1.5" filter="url(#shadow)"/>
  <circle cx="25" cy="25" r="20" fill="none" stroke="${C.textLight}" stroke-width="0.5"/>
  
  <!-- Kreuz -->
  <line x1="25" y1="8" x2="25" y2="42" stroke="${C.textLight}" stroke-width="0.5"/>
  <line x1="8" y1="25" x2="42" y2="25" stroke="${C.textLight}" stroke-width="0.5"/>
  
  <!-- Nord-Pfeil -->
  <polygon points="25,6 20,25 25,20 30,25" fill="${C.hak}"/>
  <polygon points="25,44 20,25 25,30 30,25" fill="${C.textLight}" fill-opacity="0.3"/>
  
  <!-- Beschriftung -->
  <text x="25" y="2" text-anchor="middle" class="label" font-weight="bold" fill="${C.hak}">N</text>
  <text x="25" y="58" text-anchor="middle" class="dim">S</text>
  <text x="2" y="28" text-anchor="middle" class="dim">W</text>
  <text x="48" y="28" text-anchor="middle" class="dim">O</text>
</g>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEGENDE
  // ═══════════════════════════════════════════════════════════════════════
  
  const legX = W - M - 180;
  const legY = M + 130;
  
  svg += `
<!-- Legende -->
<g transform="translate(${legX}, ${legY})">
  <rect x="0" y="0" width="170" height="180" fill="white" stroke="${C.schriftfeldBorder}" stroke-width="1" rx="4" filter="url(#shadow)"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="170" height="24" fill="${C.schriftfeld}" stroke="${C.schriftfeldBorder}" stroke-width="1" rx="4"/>
  <text x="85" y="16" text-anchor="middle" class="label" font-weight="600">Legende</text>
  
  <!-- Items -->
  <g transform="translate(12, 35)">
    <!-- PV-Anlage -->
    <rect x="0" y="0" width="24" height="14" fill="url(#pvGradient)" rx="2"/>
    <text x="32" y="11" class="small">PV-Anlage</text>
    
    <!-- HAK -->
    <rect x="0" y="22" width="16" height="14" fill="${C.hak}" rx="2"/>
    <text x="32" y="33" class="small">HAK (Hausanschluss)</text>
    
    <!-- Zähler -->
    <rect x="0" y="44" width="16" height="14" fill="${C.zaehler}" rx="2"/>
    <text x="32" y="55" class="small">Zählerschrank</text>
    
    <!-- WR -->
    <rect x="0" y="66" width="16" height="14" fill="${C.wr}" rx="2"/>
    <text x="32" y="77" class="small">Wechselrichter</text>
    
    <!-- DC-Kabel -->
    <line x1="0" y1="95" x2="24" y2="95" stroke="${C.dcKabel}" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="32" y="99" class="small">DC-Kabel</text>
    
    <!-- AC-Kabel -->
    <line x1="0" y1="115" x2="24" y2="115" stroke="${C.acKabel}" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="32" y="119" class="small">AC-Kabel</text>
    
    <!-- Grundstück -->
    <rect x="0" y="130" width="24" height="14" fill="none" stroke="${C.grundGrenze}" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="32" y="141" class="small">Grundstücksgrenze</text>
  </g>
</g>`;

  // ═══════════════════════════════════════════════════════════════════════
  // SCHRIFTFELD (DIN 6771-1 angelehnt)
  // ═══════════════════════════════════════════════════════════════════════
  
  const sfX = M;
  const sfY = H - M - 60;
  const sfW = W - 2*M;
  const sfH = 55;
  
  // Gesamtleistung berechnen
  const gesamtKwp = config.dachflaechen.reduce((s, d) => s + (d.modulAnzahl * d.modulLeistungWp / 1000), 0);
  
  svg += `
<!-- Schriftfeld -->
<g transform="translate(${sfX}, ${sfY})">
  <rect x="0" y="0" width="${sfW}" height="${sfH}" fill="${C.schriftfeld}" stroke="${C.schriftfeldBorder}" stroke-width="1"/>
  
  <!-- Vertikale Trennlinien -->
  <line x1="180" y1="0" x2="180" y2="${sfH}" stroke="${C.schriftfeldBorder}" stroke-width="0.5"/>
  <line x1="360" y1="0" x2="360" y2="${sfH}" stroke="${C.schriftfeldBorder}" stroke-width="0.5"/>
  <line x1="520" y1="0" x2="520" y2="${sfH}" stroke="${C.schriftfeldBorder}" stroke-width="0.5"/>
  <line x1="650" y1="0" x2="650" y2="${sfH}" stroke="${C.schriftfeldBorder}" stroke-width="0.5"/>
  
  <!-- Horizontale Trennlinie -->
  <line x1="0" y1="28" x2="${sfW}" y2="28" stroke="${C.schriftfeldBorder}" stroke-width="0.5"/>
  
  <!-- Bauherr -->
  <text x="5" y="12" class="dim">Bauherr / Betreiber</text>
  <text x="5" y="45" class="schrift-bold">${config.kundenname}</text>
  
  <!-- Adresse -->
  <text x="185" y="12" class="dim">Anlagenstandort</text>
  <text x="185" y="28" class="schrift">${config.strasse} ${config.hausnummer}</text>
  <text x="185" y="45" class="schrift">${config.plz} ${config.ort}</text>
  
  <!-- Anlage -->
  <text x="365" y="12" class="dim">PV-Anlage</text>
  <text x="365" y="28" class="schrift">${gesamtKwp.toFixed(2)} kWp</text>
  <text x="365" y="45" class="schrift">${config.dachflaechen.reduce((s, d) => s + d.modulAnzahl, 0)} Module</text>
  
  <!-- Plan-Info -->
  <text x="525" y="12" class="dim">Plan-Nr. / Maßstab</text>
  <text x="525" y="28" class="schrift">${config.plannummer || '-'}</text>
  <text x="525" y="45" class="schrift">M ${config.massstab}</text>
  
  <!-- Erstellt -->
  <text x="655" y="12" class="dim">Datum / Erstellt von</text>
  <text x="655" y="28" class="schrift">${config.datum}</text>
  <text x="655" y="45" class="schrift">${config.gezeichnetVon || COMPANY.name}</text>
</g>`;

  // ═══════════════════════════════════════════════════════════════════════
  // MAßSTABSBALKEN
  // ═══════════════════════════════════════════════════════════════════════
  
  const meterInPixel = scale;
  const balkenLaenge = 10 * meterInPixel; // 10m
  
  svg += `
<!-- Maßstabsbalken -->
<g transform="translate(${M + 350}, ${H - M - 75})">
  <rect x="0" y="0" width="${balkenLaenge}" height="8" fill="white" stroke="${C.textLight}" stroke-width="1"/>
  <rect x="0" y="0" width="${balkenLaenge/2}" height="8" fill="${C.text}"/>
  
  <text x="0" y="18" class="dim">0</text>
  <text x="${balkenLaenge/2}" y="18" text-anchor="middle" class="dim">5m</text>
  <text x="${balkenLaenge}" y="18" text-anchor="end" class="dim">10m</text>
</g>

</svg>`;

  return svg;
}

// ═══════════════════════════════════════════════════════════════════════════
// LAGEPLAN MIT SATELLITENBILD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert Lageplan mit MapTiler Satellitenbild als Hintergrund
 */
export async function generateLageplanWithSatelliteSVG(config: LageplanConfigV2): Promise<string> {
  const W = 842, H = 595;
  const M = 40;
  
  // Satellitenbild holen
  let satelliteBase64: string | null = null;
  let lat = 0, lng = 0;
  
  try {
    const result = await fetchSatelliteImageForAddress(
      config.strasse,
      config.hausnummer,
      config.plz,
      config.ort,
      { zoom: 19, width: 800, height: 500 }
    );
    
    if (result) {
      satelliteBase64 = result.imageBase64;
      lat = result.lat;
      lng = result.lng;
    }
  } catch (e) {
    console.warn('Failed to fetch satellite image:', e);
  }
  
  // Farben
  const C = {
    pv: '#ff6f00',
    pvStroke: '#e65100',
    hak: '#c62828',
    zaehler: '#1565c0',
    text: '#263238',
    textLight: '#546e7a',
    overlay: 'rgba(255,255,255,0.95)',
    border: '#90a4ae',
  };
  
  // Bildbereich
  const imgX = M;
  const imgY = M + 50;
  const imgW = W - 2*M - 200;
  const imgH = H - 2*M - 120;
  
  // Gesamtleistung
  const gesamtKwp = config.dachflaechen.reduce((s, d) => s + (d.modulAnzahl * d.modulLeistungWp / 1000), 0);
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: 600 14px Arial, sans-serif; fill: ${C.text}; }
    .subtitle { font: 500 11px Arial, sans-serif; fill: ${C.textLight}; }
    .label { font: 500 10px Arial, sans-serif; fill: ${C.text}; }
    .small { font: 400 9px Arial, sans-serif; fill: ${C.textLight}; }
    .dim { font: 400 8px Arial, sans-serif; fill: ${C.textLight}; }
  </style>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
  </filter>
  <linearGradient id="pvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#ffb300"/>
    <stop offset="100%" style="stop-color:#ff6f00"/>
  </linearGradient>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="#f5f5f5"/>

<!-- Titel -->
<text x="${M}" y="${M + 20}" class="title">LAGEPLAN MIT SATELLITENBILD</text>
<text x="${M}" y="${M + 38}" class="subtitle">${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}</text>

<!-- Satellitenbild Bereich -->
<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="#e0e0e0" stroke="${C.border}" stroke-width="1" rx="4"/>
${satelliteBase64 ? `
<image x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" 
       xlink:href="data:image/png;base64,${satelliteBase64}" 
       preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 4px)"/>
` : `
<text x="${imgX + imgW/2}" y="${imgY + imgH/2 - 10}" text-anchor="middle" class="label" fill="#999">
  Satellitenbild wird geladen...
</text>
<text x="${imgX + imgW/2}" y="${imgY + imgH/2 + 10}" text-anchor="middle" class="small" fill="#999">
  Falls nicht verfügbar: Bitte Screenshot von Google Maps einfügen
</text>
`}

<!-- PV-Markierung auf Bild (zentriert) -->
<g transform="translate(${imgX + imgW/2 - 50}, ${imgY + imgH/2 - 35})">
  <rect x="0" y="0" width="100" height="70" fill="url(#pvGrad)" fill-opacity="0.6" 
        stroke="${C.pvStroke}" stroke-width="3" stroke-dasharray="8,4" rx="4"/>
  <text x="50" y="30" text-anchor="middle" class="label" fill="white" font-weight="bold">☀ PV-ANLAGE</text>
  <text x="50" y="45" text-anchor="middle" class="small" fill="white">${gesamtKwp.toFixed(2)} kWp</text>
  <text x="50" y="58" text-anchor="middle" class="small" fill="white">${config.dachflaechen.reduce((s, d) => s + d.modulAnzahl, 0)} Module</text>
</g>

<!-- Koordinaten (wenn verfügbar) -->
${lat && lng ? `
<text x="${imgX + imgW - 5}" y="${imgY + imgH - 8}" text-anchor="end" class="dim" fill="white" 
      style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
  📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
</text>
` : ''}

<!-- Nordpfeil -->
<g transform="translate(${W - M - 60}, ${M + 70})">
  <circle cx="25" cy="25" r="24" fill="white" stroke="${C.border}" stroke-width="1.5" filter="url(#shadow)"/>
  <polygon points="25,6 20,28 25,22 30,28" fill="${C.hak}"/>
  <text x="25" y="2" text-anchor="middle" class="label" font-weight="bold" fill="${C.hak}">N</text>
</g>

<!-- Legende -->
<g transform="translate(${W - M - 180}, ${M + 130})">
  <rect x="0" y="0" width="170" height="160" fill="${C.overlay}" stroke="${C.border}" stroke-width="1" rx="4" filter="url(#shadow)"/>
  
  <rect x="0" y="0" width="170" height="24" fill="#fafafa" stroke="${C.border}" stroke-width="1" rx="4"/>
  <text x="85" y="16" text-anchor="middle" class="label" font-weight="600">Legende</text>
  
  <g transform="translate(12, 35)">
    <rect x="0" y="0" width="24" height="14" fill="url(#pvGrad)" fill-opacity="0.6" stroke="${C.pvStroke}" stroke-dasharray="4,2" rx="2"/>
    <text x="32" y="11" class="small">PV-Anlage</text>
    
    <rect x="0" y="24" width="16" height="14" fill="${C.hak}" rx="2"/>
    <text x="32" y="35" class="small">HAK (Hausanschluss)</text>
    
    <rect x="0" y="48" width="16" height="14" fill="${C.zaehler}" rx="2"/>
    <text x="32" y="59" class="small">Zählerschrank</text>
    
    <line x1="0" y1="78" x2="24" y2="78" stroke="#f44336" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="32" y="82" class="small">DC-Leitung</text>
    
    <line x1="0" y1="98" x2="24" y2="98" stroke="#2196f3" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="32" y="102" class="small">AC-Leitung</text>
  </g>
</g>

<!-- Info Box -->
<g transform="translate(${W - M - 180}, ${M + 310})">
  <rect x="0" y="0" width="170" height="80" fill="${C.overlay}" stroke="${C.border}" stroke-width="1" rx="4"/>
  <text x="10" y="18" class="label" font-weight="600">Anlagendaten</text>
  <line x1="10" y1="25" x2="160" y2="25" stroke="${C.border}" stroke-width="0.5"/>
  <text x="10" y="42" class="small">Leistung: ${gesamtKwp.toFixed(2)} kWp</text>
  <text x="10" y="56" class="small">Module: ${config.dachflaechen.reduce((s, d) => s + d.modulAnzahl, 0)} Stück</text>
  <text x="10" y="70" class="small">Flächen: ${config.dachflaechen.length}</text>
</g>

<!-- Schriftfeld -->
<g transform="translate(${M}, ${H - M - 55})">
  <rect x="0" y="0" width="${W - 2*M}" height="50" fill="#fafafa" stroke="${C.border}" stroke-width="1"/>
  
  <line x1="180" y1="0" x2="180" y2="50" stroke="${C.border}" stroke-width="0.5"/>
  <line x1="380" y1="0" x2="380" y2="50" stroke="${C.border}" stroke-width="0.5"/>
  <line x1="550" y1="0" x2="550" y2="50" stroke="${C.border}" stroke-width="0.5"/>
  <line x1="0" y1="25" x2="${W - 2*M}" y2="25" stroke="${C.border}" stroke-width="0.5"/>
  
  <text x="5" y="12" class="dim">Bauherr</text>
  <text x="5" y="40" class="label" font-weight="500">${config.kundenname}</text>
  
  <text x="185" y="12" class="dim">Standort</text>
  <text x="185" y="28" class="small">${config.strasse} ${config.hausnummer}</text>
  <text x="185" y="42" class="small">${config.plz} ${config.ort}</text>
  
  <text x="385" y="12" class="dim">Plan-Nr. / Maßstab</text>
  <text x="385" y="28" class="small">${config.plannummer || 'LP-SAT-001'}</text>
  <text x="385" y="42" class="small">Satellitenbild</text>
  
  <text x="555" y="12" class="dim">Datum / Erstellt</text>
  <text x="555" y="28" class="small">${config.datum}</text>
  <text x="555" y="42" class="small">${COMPANY.name}</text>
</g>

<!-- MapTiler Attribution -->
<text x="${imgX + 5}" y="${imgY + imgH - 5}" class="dim" fill="white" style="text-shadow: 1px 1px 1px rgba(0,0,0,0.5);">
  © MapTiler © OpenStreetMap contributors
</text>

</svg>`;

  return svg;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  extractLageplanConfigV2,
  generateLageplanSVGV2,
  generateLageplanWithSatelliteSVG,
};

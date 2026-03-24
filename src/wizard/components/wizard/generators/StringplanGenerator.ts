/**
 * Baunity Stringplan Generator
 * ==========================
 * Generiert Stringpläne als SVG
 * Zeigt Modulanordnung auf Dach mit String-Zuordnung
 * 
 * NB-Anforderungen:
 * - Dachaufsicht mit Modulanordnung
 * - String-Zuordnung (Farben/Nummern)
 * - Kabelwege
 * - Wechselrichter-Zuordnung
 * - Maße
 */

import type { WizardData, DachflaecheData, WechselrichterData } from '../../../types/wizard.types';

export interface StringplanConfig {
  dachflaechen: DachflaecheData[];
  wechselrichter: WechselrichterData[];
  
  // Modul-Details
  modulBreite: number;   // mm
  modulHoehe: number;    // mm
  
  // String-Konfiguration (wird automatisch aus WR ermittelt)
  strings: StringConfig[];
  
  // Meta
  kundenname: string;
  standort: string;
  datum: string;
}

export interface StringConfig {
  id: string;
  name: string;
  mppTracker: number;      // MPP 1, 2, 3...
  wechselrichterId: string;
  wechselrichterName: string;
  modulAnzahl: number;
  farbe: string;
}

// Farben für Strings
const STRING_COLORS = [
  '#2196f3', // Blau
  '#4caf50', // Grün
  '#ff9800', // Orange
  '#e91e63', // Pink
  '#9c27b0', // Lila
  '#00bcd4', // Cyan
  '#ff5722', // Deep Orange
  '#795548', // Braun
];

export function extractStringplanConfig(data: WizardData): StringplanConfig {
  const strings: StringConfig[] = [];
  let stringIndex = 0;
  
  // Strings aus Wechselrichter-Konfiguration ableiten
  data.step5.wechselrichter?.forEach((wr, wrIdx) => {
    // Annahme: Module gleichmäßig auf MPP-Tracker verteilen (basierend auf Leistung)
    const mppCount = wr.leistungKva > 10 ? 3 : wr.leistungKva > 5 ? 2 : 1;
    const totalModules = data.step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || 0;
    const modulesPerWR = Math.ceil(totalModules / (data.step5.wechselrichter?.length || 1));
    const modulesPerMPP = Math.ceil(modulesPerWR / mppCount);
    
    for (let mpp = 1; mpp <= mppCount; mpp++) {
      strings.push({
        id: `string-${wrIdx + 1}-${mpp}`,
        name: `String ${stringIndex + 1}`,
        mppTracker: mpp,
        wechselrichterId: wr.id,
        wechselrichterName: `${wr.hersteller} ${wr.modell}`,
        modulAnzahl: modulesPerMPP,
        farbe: STRING_COLORS[stringIndex % STRING_COLORS.length],
      });
      stringIndex++;
    }
  });
  
  // Falls keine WR definiert, Default-String
  if (strings.length === 0) {
    const totalModules = data.step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || 0;
    strings.push({
      id: 'string-1',
      name: 'String 1',
      mppTracker: 1,
      wechselrichterId: '',
      wechselrichterName: 'Wechselrichter',
      modulAnzahl: totalModules,
      farbe: STRING_COLORS[0],
    });
  }
  
  return {
    dachflaechen: data.step5.dachflaechen || [],
    wechselrichter: data.step5.wechselrichter || [],
    modulBreite: 1134,  // Standard ~1134mm
    modulHoehe: 1722,   // Standard ~1722mm
    strings,
    kundenname: `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim(),
    standort: `${data.step2.strasse || ''} ${data.step2.hausnummer || ''}, ${data.step2.plz || ''} ${data.step2.ort || ''}`.trim(),
    datum: new Date().toLocaleDateString('de-DE'),
  };
}

export function generateStringplanSVG(config: StringplanConfig): string {
  const W = 842, H = 595; // A4 Landscape
  const M = 40; // Margin
  
  const C = {
    bg: '#f5f5f5',
    dach: '#90a4ae',
    text: '#37474f',
    border: '#546e7a',
    kabel: '#424242',
  };
  
  // Berechne Gesamtmodule und Layout
  const totalModules = config.dachflaechen.reduce((s, d) => s + d.modulAnzahl, 0);
  
  // Berechne optimales Grid
  const cols = Math.ceil(Math.sqrt(totalModules * 1.5)); // Mehr Spalten als Zeilen (Querformat)
  const rows = Math.ceil(totalModules / cols);
  
  // Modul-Größe in SVG (skaliert)
  const availableW = W - 2*M - 200; // Platz für Legende
  // availableH für zukünftige Erweiterungen reserviert
  
  const modW = Math.min(40, availableW / cols - 4);
  const modH = modW * 1.5; // Proportion
  const gap = 4;
  
  const gridW = cols * (modW + gap);
  const gridH = rows * (modH + gap);
  const startX = M + (availableW - gridW) / 2;
  const startY = M + 50;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 16px Arial; fill: ${C.text}; }
    .subtitle { font: 12px Arial; fill: #666; }
    .label { font: 11px Arial; fill: ${C.text}; }
    .small { font: 9px Arial; fill: ${C.text}; }
    .mod-num { font: bold 7px Arial; fill: white; }
  </style>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="white"/>
<rect x="${M}" y="${M}" width="${W-2*M}" height="${H-2*M}" fill="none" stroke="${C.border}" stroke-width="0.5"/>

<!-- Titel -->
<text x="${M + 10}" y="${M + 20}" class="title">Stringplan - Modulanordnung</text>
<text x="${M + 10}" y="${M + 38}" class="subtitle">${config.standort}</text>

<!-- Dachfläche Hintergrund -->
<rect x="${startX - 10}" y="${startY - 10}" width="${gridW + 20}" height="${gridH + 20}" 
      fill="${C.bg}" stroke="${C.dach}" stroke-width="2" rx="4"/>
<text x="${startX + gridW/2}" y="${startY - 20}" text-anchor="middle" class="small">
  Dachaufsicht (${config.dachflaechen[0]?.name || 'Dachfläche 1'})
</text>

<!-- Module -->
`;

  // Module zeichnen mit String-Zuordnung
  let moduleIndex = 0;
  let currentStringIndex = 0;
  let modulesInCurrentString = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (moduleIndex >= totalModules) break;
      
      // String wechseln wenn nötig
      if (modulesInCurrentString >= config.strings[currentStringIndex]?.modulAnzahl) {
        currentStringIndex++;
        modulesInCurrentString = 0;
      }
      
      const currentString = config.strings[currentStringIndex] || config.strings[0];
      const x = startX + col * (modW + gap);
      const y = startY + row * (modH + gap);
      
      svg += `
<g>
  <rect x="${x}" y="${y}" width="${modW}" height="${modH}" 
        fill="${currentString.farbe}" fill-opacity="0.8" stroke="${currentString.farbe}" stroke-width="1.5" rx="2"/>
  <text x="${x + modW/2}" y="${y + modH/2 + 3}" text-anchor="middle" class="mod-num">${moduleIndex + 1}</text>
</g>`;
      
      moduleIndex++;
      modulesInCurrentString++;
    }
  }
  
  // Kabelwege (vereinfacht)
  svg += `
<!-- Kabelsammelpunkt -->
<circle cx="${startX + gridW + 30}" cy="${startY + gridH/2}" r="15" fill="white" stroke="${C.kabel}" stroke-width="2"/>
<text x="${startX + gridW + 30}" y="${startY + gridH/2 + 4}" text-anchor="middle" class="small" font-weight="bold">DC</text>

<!-- Kabel zu WR -->
<path d="M${startX + gridW + 45} ${startY + gridH/2} L${startX + gridW + 80} ${startY + gridH/2}" 
      stroke="${C.kabel}" stroke-width="3" fill="none"/>
<text x="${startX + gridW + 95}" y="${startY + gridH/2 + 4}" class="small">→ WR</text>
`;

  // Legende
  const legX = W - M - 180;
  const legY = M + 50;
  
  svg += `
<!-- Legende -->
<g transform="translate(${legX}, ${legY})">
  <rect x="0" y="0" width="170" height="${60 + config.strings.length * 22}" fill="white" stroke="${C.border}" stroke-width="1"/>
  <text x="85" y="18" text-anchor="middle" class="label" font-weight="bold">String-Zuordnung</text>
  <line x1="10" y1="28" x2="160" y2="28" stroke="${C.border}" stroke-width="0.5"/>
`;

  config.strings.forEach((str, idx) => {
    svg += `
  <rect x="15" y="${38 + idx * 22}" width="20" height="14" fill="${str.farbe}" fill-opacity="0.8" rx="2"/>
  <text x="45" y="${50 + idx * 22}" class="small">${str.name} (${str.modulAnzahl} Module)</text>
`;
  });
  
  svg += `</g>`;
  
  // String-Info Box
  svg += `
<g transform="translate(${legX}, ${legY + 80 + config.strings.length * 22})">
  <rect x="0" y="0" width="170" height="100" fill="white" stroke="${C.border}" stroke-width="1"/>
  <text x="10" y="18" class="label" font-weight="bold">Technische Daten</text>
  <line x1="10" y1="25" x2="160" y2="25" stroke="${C.border}" stroke-width="0.5"/>
  <text x="10" y="42" class="small">Module gesamt: ${totalModules}</text>
  <text x="10" y="57" class="small">Strings: ${config.strings.length}</text>
  <text x="10" y="72" class="small">Modulmaß: ${config.modulBreite}×${config.modulHoehe}mm</text>
  <text x="10" y="87" class="small">Dachflächen: ${config.dachflaechen.length}</text>
</g>`;

  // Wechselrichter-Zuordnung
  if (config.wechselrichter.length > 0) {
    svg += `
<g transform="translate(${legX}, ${legY + 200 + config.strings.length * 22})">
  <rect x="0" y="0" width="170" height="${30 + config.wechselrichter.length * 18}" fill="white" stroke="${C.border}" stroke-width="1"/>
  <text x="10" y="18" class="label" font-weight="bold">Wechselrichter</text>
`;
    config.wechselrichter.forEach((wr, idx) => {
      svg += `<text x="10" y="${35 + idx * 18}" class="small">WR${idx + 1}: ${wr.hersteller} ${wr.modell}</text>`;
    });
    svg += `</g>`;
  }

  // Schriftfeld
  svg += `
<g transform="translate(${M}, ${H - M - 50})">
  <rect x="0" y="0" width="300" height="40" fill="none" stroke="${C.border}" stroke-width="1"/>
  <line x1="150" y1="0" x2="150" y2="40" stroke="${C.border}" stroke-width="0.5"/>
  <line x1="0" y1="20" x2="150" y2="20" stroke="${C.border}" stroke-width="0.5"/>
  
  <text x="5" y="14" class="small">Bauherr: ${config.kundenname}</text>
  <text x="5" y="34" class="small">Zeichnung: Stringplan</text>
  
  <text x="155" y="14" class="small">Datum: ${config.datum}</text>
  <text x="155" y="34" class="small">Erstellt mit Baunity</text>
</g>

<!-- Hinweis -->
<text x="${startX + gridW/2}" y="${startY + gridH + 40}" text-anchor="middle" class="small" fill="#666">
  Nummerierung entspricht der physischen Reihenfolge der Module
</text>

</svg>`;

  return svg;
}

/**
 * Generiert detaillierten Stringplan für mehrere Dachflächen
 */
export function generateMultiDachStringplanSVG(config: StringplanConfig): string {
  // Falls mehrere Dachflächen, jede separat darstellen
  if (config.dachflaechen.length <= 1) {
    return generateStringplanSVG(config);
  }
  
  const W = 842, H = 595;
  const M = 40;
  const C = { bg: '#f5f5f5', dach: '#90a4ae', text: '#37474f', border: '#546e7a' };
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 16px Arial; fill: ${C.text}; }
    .subtitle { font: 12px Arial; fill: #666; }
    .label { font: 11px Arial; fill: ${C.text}; }
    .small { font: 9px Arial; fill: ${C.text}; }
    .mod-num { font: bold 6px Arial; fill: white; }
  </style>
</defs>

<rect width="100%" height="100%" fill="white"/>
<text x="${M + 10}" y="${M + 20}" class="title">Stringplan - Mehrere Dachflächen</text>
<text x="${M + 10}" y="${M + 38}" class="subtitle">${config.standort}</text>
`;

  // Dachflächen nebeneinander anordnen
  const dachCount = config.dachflaechen.length;
  const availableW = W - 2*M - 180;
  const dachW = availableW / dachCount - 20;
  
  let globalModuleIndex = 0;
  let currentStringIndex = 0;
  let modulesInCurrentString = 0;
  
  config.dachflaechen.forEach((dach, dachIdx) => {
    const dachX = M + 10 + dachIdx * (dachW + 20);
    const dachY = M + 60;
    const dachH = H - M - 150;
    
    // Modul-Grid für diese Dachfläche
    const cols = Math.ceil(Math.sqrt(dach.modulAnzahl * 1.2));
    const modW = Math.min(25, (dachW - 20) / cols - 2);
    const modH = modW * 1.5;
    
    svg += `
<g>
  <rect x="${dachX}" y="${dachY}" width="${dachW}" height="${dachH}" fill="${C.bg}" stroke="${C.dach}" stroke-width="2" rx="4"/>
  <text x="${dachX + dachW/2}" y="${dachY - 8}" text-anchor="middle" class="small" font-weight="bold">${dach.name}</text>
  <text x="${dachX + dachW/2}" y="${dachY + dachH + 15}" text-anchor="middle" class="small">${dach.ausrichtung} • ${dach.neigung}° • ${dach.modulAnzahl} Module</text>
`;
    
    // Module
    for (let i = 0; i < dach.modulAnzahl; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      if (modulesInCurrentString >= (config.strings[currentStringIndex]?.modulAnzahl || 999)) {
        currentStringIndex++;
        modulesInCurrentString = 0;
      }
      
      const str = config.strings[currentStringIndex] || config.strings[0];
      const x = dachX + 10 + col * (modW + 2);
      const y = dachY + 10 + row * (modH + 2);
      
      svg += `<rect x="${x}" y="${y}" width="${modW}" height="${modH}" fill="${str.farbe}" fill-opacity="0.8" rx="1"/>`;
      
      globalModuleIndex++;
      modulesInCurrentString++;
    }
    
    svg += `</g>`;
  });
  
  // Legende
  const legX = W - M - 170;
  svg += `
<g transform="translate(${legX}, ${M + 60})">
  <rect x="0" y="0" width="160" height="${50 + config.strings.length * 20}" fill="white" stroke="${C.border}" stroke-width="1"/>
  <text x="80" y="18" text-anchor="middle" class="label" font-weight="bold">Strings</text>
`;
  config.strings.forEach((str, idx) => {
    svg += `
  <rect x="10" y="${30 + idx * 20}" width="15" height="12" fill="${str.farbe}" fill-opacity="0.8"/>
  <text x="32" y="${40 + idx * 20}" class="small">${str.name} (${str.modulAnzahl})</text>
`;
  });
  svg += `</g>`;
  
  // Schriftfeld
  svg += `
<g transform="translate(${M}, ${H - M - 45})">
  <rect x="0" y="0" width="280" height="35" fill="none" stroke="${C.border}" stroke-width="1"/>
  <text x="5" y="14" class="small">Bauherr: ${config.kundenname}</text>
  <text x="5" y="28" class="small">Stringplan | ${config.datum} | Baunity</text>
</g>
</svg>`;

  return svg;
}

export default {
  extractStringplanConfig,
  generateStringplanSVG,
  generateMultiDachStringplanSVG,
};

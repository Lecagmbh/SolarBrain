/**
 * DEPRECATED: Replaced by new unified Übersichtsschaltplan generator
 * ===================================================================
 * Schaltpläne werden jetzt zentral im Backend via Python/reportlab generiert.
 * Dieser Wizard-Generator wird nicht mehr aktiv verwendet.
 *
 * --- Ursprüngliche Beschreibung ---
 * Baunity Professioneller Schaltplan-Generator V3
 * Generiert VDE-konforme Übersichtsschaltpläne als SVG
 */

import type { WizardData, DachflaecheData, WechselrichterData, SpeicherData } from '../../../types/wizard.types';
import { COMPANY } from '../../../types/wizard.types';

export interface SchaltplanConfig {
  dachflaechen: DachflaecheData[];
  wechselrichter: WechselrichterData[];
  pvLeistungKwp: number;
  pvLeistungKva: number;
  speicher: SpeicherData[];
  speicherKwh: number;
  speicherKopplung: 'dc' | 'ac' | null;
  hatWallbox: boolean;
  wallboxKw: number;
  hatWaermepumpe: boolean;
  waermepumpeKw: number;
  naSchutzErforderlich: boolean;
  istDreiphasig: boolean;
  messkonzept: string;
  kundenname: string;
  standort: string;
  zaehlernummer?: string;
  netzbetreiber?: string;
}

export function extractSchaltplanConfig(data: WizardData): SchaltplanConfig {
  const pvKwp = data.step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) ||
                data.step5.gesamtleistungKwp || 0;
  const pvKva = data.step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) ||
                data.step5.gesamtleistungKva || 0;
  const speicherKwh = data.step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0;
  const wallboxKw = data.step5.wallboxen?.reduce((s, w) => s + (w.leistungKw * w.anzahl), 0) || 0;
  const wpKw = data.step5.waermepumpen?.reduce((s, w) => s + w.leistungKw, 0) || 0;

  return {
    dachflaechen: data.step5.dachflaechen || [],
    wechselrichter: data.step5.wechselrichter || [],
    pvLeistungKwp: pvKwp,
    pvLeistungKva: pvKva,
    speicher: data.step5.speicher || [],
    speicherKwh,
    speicherKopplung: data.step5.speicher?.[0]?.kopplung || null,
    hatWallbox: data.step1.komponenten.includes('wallbox') || (data.step5.wallboxen?.length || 0) > 0,
    wallboxKw,
    hatWaermepumpe: data.step1.komponenten.includes('waermepumpe') || (data.step5.waermepumpen?.length || 0) > 0,
    waermepumpeKw: wpKw,
    naSchutzErforderlich: data.step5.naSchutzErforderlich || pvKva > 30,
    istDreiphasig: pvKva > 4.6,
    messkonzept: data.step5.messkonzept || 'zweirichtung',
    kundenname: `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim(),
    standort: `${data.step2.strasse || ''} ${data.step2.hausnummer || ''}, ${data.step2.plz || ''} ${data.step2.ort || ''}`.trim(),
    zaehlernummer: data.step4.zaehlernummer,
    netzbetreiber: data.step4.netzbetreiberName,
  };
}

export function generateSchaltplanSVG(config: SchaltplanConfig): string {
  const W = 842, H = 595; // A4 Landscape
  const M = 25; // Margin

  // Farbpalette
  const C = {
    primary: '#1565c0',
    netz: '#212121',
    ac: '#2196f3',
    dc: '#ff5722',
    pv: '#ff9800',
    speicher: '#9c27b0',
    wallbox: '#4caf50',
    wp: '#f44336',
    text: '#212121',
    textLight: '#757575',
    border: '#bdbdbd',
    bg: '#fafafa',
    white: '#ffffff',
    gridBg: '#f5f5f5',
  };

  const datum = new Date().toLocaleDateString('de-DE');
  const planNr = `SP-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 14px Arial, sans-serif; fill: ${C.text}; }
    .subtitle { font: 500 11px Arial, sans-serif; fill: ${C.textLight}; }
    .label { font: 600 9px Arial, sans-serif; fill: ${C.text}; }
    .small { font: 400 8px Arial, sans-serif; fill: ${C.textLight}; }
    .value { font: bold 10px Arial, sans-serif; fill: ${C.text}; }
    .component { font: bold 11px Arial, sans-serif; }
    .spec { font: 400 8px Arial, sans-serif; fill: ${C.textLight}; }
  </style>

  <!-- Gradients -->
  <linearGradient id="pvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#ffb74d"/>
    <stop offset="100%" style="stop-color:#ff9800"/>
  </linearGradient>
  <linearGradient id="acGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:#42a5f5"/>
    <stop offset="100%" style="stop-color:#1976d2"/>
  </linearGradient>
  <linearGradient id="dcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:#ff7043"/>
    <stop offset="100%" style="stop-color:#e64a19"/>
  </linearGradient>
  <linearGradient id="spGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:#ba68c8"/>
    <stop offset="100%" style="stop-color:#7b1fa2"/>
  </linearGradient>

  <!-- Shadow Filter -->
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.2"/>
  </filter>
  <filter id="shadowSm" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.15"/>
  </filter>

  <!-- PV Module Symbol -->
  <symbol id="pvModule" viewBox="0 0 60 80">
    <rect x="2" y="2" width="56" height="76" rx="3" fill="#1a237e" stroke="#0d47a1" stroke-width="2"/>
    <rect x="6" y="6" width="48" height="68" fill="#283593"/>
    <line x1="30" y1="6" x2="30" y2="74" stroke="#1a237e" stroke-width="1"/>
    <line x1="6" y1="25" x2="54" y2="25" stroke="#1a237e" stroke-width="0.5"/>
    <line x1="6" y1="44" x2="54" y2="44" stroke="#1a237e" stroke-width="0.5"/>
    <line x1="6" y1="63" x2="54" y2="63" stroke="#1a237e" stroke-width="0.5"/>
    <!-- Glanz -->
    <rect x="6" y="6" width="48" height="20" fill="url(#pvGrad)" fill-opacity="0.3"/>
  </symbol>

  <!-- Wechselrichter Symbol -->
  <symbol id="wrSymbol" viewBox="0 0 80 60">
    <rect x="2" y="2" width="76" height="56" rx="4" fill="${C.white}" stroke="${C.ac}" stroke-width="2.5"/>
    <text x="40" y="18" text-anchor="middle" style="font: bold 14px Arial; fill: ${C.dc};">⎓</text>
    <line x1="15" y1="30" x2="65" y2="30" stroke="${C.border}" stroke-width="1.5"/>
    <text x="40" y="48" text-anchor="middle" style="font: bold 14px Arial; fill: ${C.ac};">∿</text>
  </symbol>

  <!-- Zähler Symbol -->
  <symbol id="meterSymbol" viewBox="0 0 60 50">
    <rect x="2" y="2" width="56" height="46" rx="3" fill="${C.white}" stroke="${C.netz}" stroke-width="2"/>
    <circle cx="30" cy="18" r="8" fill="none" stroke="${C.netz}" stroke-width="1.5"/>
    <text x="30" y="22" text-anchor="middle" style="font: bold 8px Arial; fill: ${C.netz};">kWh</text>
    <rect x="12" y="32" width="36" height="10" fill="${C.gridBg}" stroke="${C.border}" stroke-width="0.5" rx="2"/>
  </symbol>

  <!-- Batterie Symbol -->
  <symbol id="batterySymbol" viewBox="0 0 50 70">
    <rect x="15" y="2" width="20" height="6" fill="${C.speicher}" rx="1"/>
    <rect x="5" y="8" width="40" height="60" rx="4" fill="${C.white}" stroke="${C.speicher}" stroke-width="2.5"/>
    <rect x="10" y="15" width="30" height="12" fill="${C.speicher}" fill-opacity="0.3" rx="2"/>
    <rect x="10" y="30" width="30" height="12" fill="${C.speicher}" fill-opacity="0.5" rx="2"/>
    <rect x="10" y="45" width="30" height="12" fill="${C.speicher}" fill-opacity="0.8" rx="2"/>
    <text x="25" y="40" text-anchor="middle" style="font: bold 10px Arial; fill: ${C.speicher};">+</text>
  </symbol>

  <!-- Wallbox Symbol -->
  <symbol id="wallboxSymbol" viewBox="0 0 50 60">
    <rect x="5" y="5" width="40" height="50" rx="5" fill="${C.white}" stroke="${C.wallbox}" stroke-width="2.5"/>
    <circle cx="25" cy="25" r="10" fill="none" stroke="${C.wallbox}" stroke-width="2"/>
    <circle cx="25" cy="25" r="4" fill="${C.wallbox}"/>
    <path d="M 15 42 L 35 42" stroke="${C.wallbox}" stroke-width="3" stroke-linecap="round"/>
  </symbol>

  <!-- Wärmepumpe Symbol -->
  <symbol id="heatpumpSymbol" viewBox="0 0 50 60">
    <rect x="5" y="5" width="40" height="50" rx="5" fill="${C.white}" stroke="${C.wp}" stroke-width="2.5"/>
    <circle cx="25" cy="30" r="12" fill="none" stroke="${C.wp}" stroke-width="1.5"/>
    <path d="M 18 30 Q 25 20 32 30 Q 25 40 18 30" fill="${C.wp}" fill-opacity="0.3" stroke="${C.wp}" stroke-width="1"/>
  </symbol>

  <!-- Verbraucher Symbol -->
  <symbol id="loadSymbol" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="17" fill="${C.white}" stroke="${C.netz}" stroke-width="2"/>
    <line x1="20" y1="8" x2="20" y2="32" stroke="${C.netz}" stroke-width="1.5"/>
    <line x1="8" y1="20" x2="32" y2="20" stroke="${C.netz}" stroke-width="1.5"/>
  </symbol>

  <!-- HAK Symbol -->
  <symbol id="hakSymbol" viewBox="0 0 50 40">
    <rect x="2" y="2" width="46" height="36" rx="3" fill="${C.white}" stroke="${C.netz}" stroke-width="2.5"/>
    <line x1="10" y1="20" x2="40" y2="20" stroke="${C.netz}" stroke-width="2"/>
    <circle cx="15" cy="20" r="4" fill="${C.netz}"/>
    <circle cx="25" cy="20" r="4" fill="${C.netz}"/>
    <circle cx="35" cy="20" r="4" fill="${C.netz}"/>
  </symbol>
</defs>

<!-- Hintergrund -->
<rect width="100%" height="100%" fill="${C.bg}"/>

<!-- Hauptrahmen -->
<rect x="${M}" y="${M}" width="${W-2*M}" height="${H-2*M}" fill="${C.white}" stroke="${C.border}" stroke-width="1" rx="4"/>

<!-- Titel-Header -->
<rect x="${M}" y="${M}" width="${W-2*M}" height="50" fill="${C.primary}" rx="4"/>
<rect x="${M}" y="${M+40}" width="${W-2*M}" height="10" fill="${C.primary}"/>
<text x="${M+15}" y="${M+22}" class="title" fill="white">⚡ ÜBERSICHTSSCHALTPLAN - Photovoltaikanlage</text>
<text x="${M+15}" y="${M+40}" class="subtitle" fill="rgba(255,255,255,0.85)">${config.kundenname} | ${config.standort}</text>
<text x="${W-M-15}" y="${M+32}" text-anchor="end" class="small" fill="rgba(255,255,255,0.7)">${COMPANY.name}</text>

`;

  // ═══════════════════════════════════════════════════════════════════════════
  // HAUPTSCHALTBILD
  // ═══════════════════════════════════════════════════════════════════════════

  const startY = M + 70;
  const centerX = 280;

  // ─── NETZANSCHLUSS (oben) ───────────────────────────────────────────────────
  svg += `
<!-- ══════ NETZANSCHLUSS ══════ -->
<g transform="translate(${centerX - 60}, ${startY})">
  <!-- Netz-Box -->
  <rect x="0" y="0" width="120" height="45" rx="6" fill="${C.netz}" filter="url(#shadow)"/>
  <text x="60" y="20" text-anchor="middle" class="component" fill="white">⚡ NETZ</text>
  <text x="60" y="35" text-anchor="middle" class="spec" fill="rgba(255,255,255,0.8)">${config.istDreiphasig ? '400V 3~ 50Hz' : '230V 1~ 50Hz'}</text>
</g>

<!-- Verbindung Netz → HAK -->
<line x1="${centerX}" y1="${startY + 45}" x2="${centerX}" y2="${startY + 65}" stroke="${C.netz}" stroke-width="3"/>
`;

  // ─── HAK ────────────────────────────────────────────────────────────────────
  const hakY = startY + 65;
  svg += `
<!-- ══════ HAK (Hausanschlusskasten) ══════ -->
<g transform="translate(${centerX - 35}, ${hakY})" filter="url(#shadowSm)">
  <use href="#hakSymbol" width="70" height="50"/>
</g>
<text x="${centerX}" y="${hakY + 62}" text-anchor="middle" class="label">HAK</text>

<!-- Verbindung HAK → Zähler -->
<line x1="${centerX}" y1="${hakY + 50}" x2="${centerX}" y2="${hakY + 80}" stroke="${C.netz}" stroke-width="3"/>
`;

  // ─── ZÄHLER ─────────────────────────────────────────────────────────────────
  const meterY = hakY + 80;
  svg += `
<!-- ══════ ZÄHLER ══════ -->
<g transform="translate(${centerX - 40}, ${meterY})" filter="url(#shadowSm)">
  <use href="#meterSymbol" width="80" height="60"/>
</g>
<text x="${centerX}" y="${meterY + 72}" text-anchor="middle" class="label">Zweirichtungszähler</text>
<text x="${centerX}" y="${meterY + 84}" text-anchor="middle" class="spec">${config.zaehlernummer || 'Nr. wird vergeben'}</text>

<!-- Hauptsammelschiene -->
<line x1="${centerX}" y1="${meterY + 60}" x2="${centerX}" y2="${meterY + 100}" stroke="${C.ac}" stroke-width="4"/>
`;

  // ─── SAMMELSCHIENE ──────────────────────────────────────────────────────────
  const busY = meterY + 100;
  const busWidth = 450;
  const busStartX = centerX - busWidth/2 + 50;

  svg += `
<!-- ══════ AC-SAMMELSCHIENE ══════ -->
<rect x="${busStartX}" y="${busY - 4}" width="${busWidth}" height="8" rx="2" fill="url(#acGrad)" filter="url(#shadowSm)"/>
<text x="${busStartX + busWidth + 10}" y="${busY + 4}" class="spec" fill="${C.ac}">AC-Bus</text>
`;

  // ─── VERBRAUCHER (rechts oben) ──────────────────────────────────────────────
  const loadX = busStartX + busWidth - 30;
  svg += `
<!-- Abzweig zu Verbraucher -->
<line x1="${loadX}" y1="${busY}" x2="${loadX}" y2="${meterY + 30}" stroke="${C.netz}" stroke-width="2"/>

<!-- ══════ VERBRAUCHER ══════ -->
<g transform="translate(${loadX - 25}, ${meterY - 10})" filter="url(#shadowSm)">
  <use href="#loadSymbol" width="50" height="50"/>
</g>
<text x="${loadX}" y="${meterY + 52}" text-anchor="middle" class="label">Verbraucher</text>
<text x="${loadX}" y="${meterY + 64}" text-anchor="middle" class="spec">Haushaltsgeräte</text>
`;

  // ─── WALLBOX (links) ────────────────────────────────────────────────────────
  if (config.hatWallbox) {
    const wbX = busStartX + 30;
    svg += `
<!-- Abzweig zu Wallbox -->
<line x1="${wbX}" y1="${busY}" x2="${wbX}" y2="${busY + 40}" stroke="${C.wallbox}" stroke-width="2"/>

<!-- ══════ WALLBOX ══════ -->
<g transform="translate(${wbX - 25}, ${busY + 40})" filter="url(#shadowSm)">
  <use href="#wallboxSymbol" width="50" height="60"/>
</g>
<text x="${wbX}" y="${busY + 110}" text-anchor="middle" class="label" fill="${C.wallbox}">Wallbox</text>
<text x="${wbX}" y="${busY + 122}" text-anchor="middle" class="spec">${config.wallboxKw || 11} kW</text>
`;
  }

  // ─── WÄRMEPUMPE ─────────────────────────────────────────────────────────────
  if (config.hatWaermepumpe) {
    const wpX = busStartX + 100;
    svg += `
<!-- Abzweig zu Wärmepumpe -->
<line x1="${wpX}" y1="${busY}" x2="${wpX}" y2="${busY + 40}" stroke="${C.wp}" stroke-width="2"/>

<!-- ══════ WÄRMEPUMPE ══════ -->
<g transform="translate(${wpX - 25}, ${busY + 40})" filter="url(#shadowSm)">
  <use href="#heatpumpSymbol" width="50" height="60"/>
</g>
<text x="${wpX}" y="${busY + 110}" text-anchor="middle" class="label" fill="${C.wp}">Wärmepumpe</text>
<text x="${wpX}" y="${busY + 122}" text-anchor="middle" class="spec">${config.waermepumpeKw} kW</text>
`;
  }

  // ─── AC-SPEICHER ────────────────────────────────────────────────────────────
  if (config.speicherKwh > 0 && config.speicherKopplung === 'ac') {
    const spX = busStartX + 180;
    svg += `
<!-- Abzweig zu AC-Speicher -->
<line x1="${spX}" y1="${busY}" x2="${spX}" y2="${busY + 35}" stroke="${C.speicher}" stroke-width="2"/>

<!-- ══════ AC-SPEICHER ══════ -->
<g transform="translate(${spX - 25}, ${busY + 35})" filter="url(#shadowSm)">
  <use href="#batterySymbol" width="50" height="70"/>
</g>
<text x="${spX}" y="${busY + 115}" text-anchor="middle" class="label" fill="${C.speicher}">Speicher</text>
<text x="${spX}" y="${busY + 127}" text-anchor="middle" class="spec">${config.speicherKwh} kWh (AC)</text>
`;
  }

  // ─── WECHSELRICHTER ─────────────────────────────────────────────────────────
  const wrX = centerX;
  const wrY = busY + 50;

  svg += `
<!-- Verbindung Bus → WR -->
<line x1="${wrX}" y1="${busY}" x2="${wrX}" y2="${wrY}" stroke="${C.ac}" stroke-width="3"/>

<!-- ══════ WECHSELRICHTER ══════ -->
<g transform="translate(${wrX - 50}, ${wrY})" filter="url(#shadow)">
  <use href="#wrSymbol" width="100" height="70"/>
</g>
<text x="${wrX}" y="${wrY + 82}" text-anchor="middle" class="label">Wechselrichter</text>
<text x="${wrX}" y="${wrY + 95}" text-anchor="middle" class="value" fill="${C.ac}">${config.pvLeistungKva.toFixed(1)} kVA</text>
`;

  // ─── DC-SPEICHER ────────────────────────────────────────────────────────────
  if (config.speicherKwh > 0 && config.speicherKopplung === 'dc') {
    const dcSpX = wrX + 100;
    svg += `
<!-- DC-Verbindung zu Speicher -->
<line x1="${wrX + 50}" y1="${wrY + 35}" x2="${dcSpX}" y2="${wrY + 35}" stroke="${C.dc}" stroke-width="2" stroke-dasharray="8,4"/>
<line x1="${dcSpX}" y1="${wrY + 35}" x2="${dcSpX}" y2="${wrY + 50}" stroke="${C.speicher}" stroke-width="2"/>

<!-- ══════ DC-SPEICHER ══════ -->
<g transform="translate(${dcSpX - 25}, ${wrY + 50})" filter="url(#shadowSm)">
  <use href="#batterySymbol" width="50" height="70"/>
</g>
<text x="${dcSpX}" y="${wrY + 130}" text-anchor="middle" class="label" fill="${C.speicher}">Speicher</text>
<text x="${dcSpX}" y="${wrY + 142}" text-anchor="middle" class="spec">${config.speicherKwh} kWh (DC)</text>
`;
  }

  // ─── DC-BUS & PV-MODULE ─────────────────────────────────────────────────────
  const dcBusY = wrY + 110;
  const numStrings = Math.max(config.dachflaechen.length, 1);
  const stringSpacing = Math.min(100, 350 / (numStrings + 1));
  const stringsStartX = wrX - ((numStrings - 1) * stringSpacing) / 2;

  svg += `
<!-- DC-Verbindung WR → DC-Bus -->
<line x1="${wrX}" y1="${wrY + 70}" x2="${wrX}" y2="${dcBusY}" stroke="${C.dc}" stroke-width="3" stroke-dasharray="8,4"/>

<!-- ══════ DC-SAMMELSCHIENE ══════ -->
<rect x="${stringsStartX - 40}" y="${dcBusY - 3}" width="${(numStrings - 1) * stringSpacing + 80}" height="6" rx="2" fill="url(#dcGrad)"/>
<text x="${stringsStartX + (numStrings - 1) * stringSpacing + 50}" y="${dcBusY + 3}" class="spec" fill="${C.dc}">DC-Bus</text>
`;

  // ─── PV-STRINGS ─────────────────────────────────────────────────────────────
  const moduleY = dcBusY + 30;
  const dachflaechen = config.dachflaechen.length > 0
    ? config.dachflaechen
    : [{ name: 'Dachfläche 1', modulAnzahl: Math.round(config.pvLeistungKwp * 1000 / 400), modulLeistungWp: 400, ausrichtung: 'S' as const, neigung: 30, id: '', modulHersteller: '', modulModell: '' }];

  dachflaechen.forEach((dach, i) => {
    const stringX = stringsStartX + i * stringSpacing;
    const leistung = (dach.modulAnzahl * dach.modulLeistungWp / 1000).toFixed(2);

    svg += `
<!-- String ${i + 1}: ${dach.name} -->
<line x1="${stringX}" y1="${dcBusY}" x2="${stringX}" y2="${moduleY}" stroke="${C.dc}" stroke-width="2" stroke-dasharray="6,3"/>

<g transform="translate(${stringX - 25}, ${moduleY})" filter="url(#shadowSm)">
  <use href="#pvModule" width="50" height="65"/>
</g>
<text x="${stringX}" y="${moduleY + 78}" text-anchor="middle" class="label" fill="${C.pv}">${dach.name}</text>
<text x="${stringX}" y="${moduleY + 90}" text-anchor="middle" class="spec">${dach.modulAnzahl}x ${dach.modulLeistungWp}Wp</text>
<text x="${stringX}" y="${moduleY + 102}" text-anchor="middle" class="spec">${leistung} kWp | ${String(dach.ausrichtung || 'S').toUpperCase()}</text>
`;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECHTE SEITE: INFO-PANELS
  // ═══════════════════════════════════════════════════════════════════════════

  const infoX = W - M - 195;
  const infoW = 180;

  // ─── LEGENDE ────────────────────────────────────────────────────────────────
  svg += `
<!-- ══════ LEGENDE ══════ -->
<g transform="translate(${infoX}, ${M + 60})">
  <rect x="0" y="0" width="${infoW}" height="130" fill="${C.white}" stroke="${C.border}" stroke-width="1" rx="6" filter="url(#shadowSm)"/>
  <rect x="0" y="0" width="${infoW}" height="22" fill="${C.gridBg}" rx="6"/>
  <rect x="0" y="14" width="${infoW}" height="8" fill="${C.gridBg}"/>
  <text x="${infoW/2}" y="15" text-anchor="middle" class="label" fill="${C.primary}">LEGENDE</text>

  <g transform="translate(12, 35)">
    <!-- AC -->
    <line x1="0" y1="5" x2="25" y2="5" stroke="${C.ac}" stroke-width="3"/>
    <text x="32" y="9" class="small" fill="${C.text}">AC-Leitung (230/400V)</text>

    <!-- DC -->
    <line x1="0" y1="25" x2="25" y2="25" stroke="${C.dc}" stroke-width="3" stroke-dasharray="6,3"/>
    <text x="32" y="29" class="small" fill="${C.text}">DC-Leitung (PV)</text>

    <!-- Speicher -->
    <line x1="0" y1="45" x2="25" y2="45" stroke="${C.speicher}" stroke-width="3"/>
    <text x="32" y="49" class="small" fill="${C.text}">Speicher</text>

    <!-- Verbraucher -->
    <circle cx="12" cy="65" r="8" fill="none" stroke="${C.netz}" stroke-width="1.5"/>
    <line x1="12" y1="59" x2="12" y2="71" stroke="${C.netz}" stroke-width="1"/>
    <line x1="6" y1="65" x2="18" y2="65" stroke="${C.netz}" stroke-width="1"/>
    <text x="32" y="69" class="small" fill="${C.text}">Verbraucher</text>

    <!-- PV -->
    <rect x="2" y="80" width="20" height="14" fill="#283593" stroke="#1a237e" stroke-width="1" rx="1"/>
    <text x="32" y="91" class="small" fill="${C.text}">PV-Module</text>
  </g>
</g>
`;

  // ─── ANLAGENDATEN ───────────────────────────────────────────────────────────
  const anlagenY = M + 200;
  let dataRows = [
    ['Anlagenleistung', `${config.pvLeistungKwp.toFixed(2)} kWp`],
    ['WR-Leistung', `${config.pvLeistungKva.toFixed(1)} kVA`],
    ['Modulanzahl', `${config.dachflaechen.reduce((s, d) => s + d.modulAnzahl, 0)} Stk.`],
    ['Anschluss', config.istDreiphasig ? '3-phasig' : '1-phasig'],
  ];

  if (config.speicherKwh > 0) {
    dataRows.push(['Speicher', `${config.speicherKwh} kWh (${config.speicherKopplung?.toUpperCase()})`]);
  }
  if (config.hatWallbox) {
    dataRows.push(['Wallbox', `${config.wallboxKw} kW`]);
  }
  if (config.hatWaermepumpe) {
    dataRows.push(['Wärmepumpe', `${config.waermepumpeKw} kW`]);
  }

  const dataHeight = 32 + dataRows.length * 18;

  svg += `
<!-- ══════ ANLAGENDATEN ══════ -->
<g transform="translate(${infoX}, ${anlagenY})">
  <rect x="0" y="0" width="${infoW}" height="${dataHeight}" fill="${C.white}" stroke="${C.border}" stroke-width="1" rx="6" filter="url(#shadowSm)"/>
  <rect x="0" y="0" width="${infoW}" height="22" fill="${C.gridBg}" rx="6"/>
  <rect x="0" y="14" width="${infoW}" height="8" fill="${C.gridBg}"/>
  <text x="${infoW/2}" y="15" text-anchor="middle" class="label" fill="${C.primary}">ANLAGENDATEN</text>

  <g transform="translate(10, 32)">
`;

  dataRows.forEach((row, i) => {
    svg += `    <text x="0" y="${i * 18}" class="small" fill="${C.textLight}">${row[0]}:</text>
    <text x="${infoW - 20}" y="${i * 18}" text-anchor="end" class="value">${row[1]}</text>
`;
  });

  svg += `  </g>
</g>
`;

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHRIFTFELD (unten)
  // ═══════════════════════════════════════════════════════════════════════════

  const sfY = H - M - 48;

  svg += `
<!-- ══════ SCHRIFTFELD ══════ -->
<g transform="translate(${M}, ${sfY})">
  <rect x="0" y="0" width="${W-2*M}" height="43" fill="${C.white}" stroke="${C.border}" stroke-width="1" rx="4"/>

  <!-- Spaltenlinien -->
  <line x1="180" y1="0" x2="180" y2="43" stroke="${C.border}"/>
  <line x1="360" y1="0" x2="360" y2="43" stroke="${C.border}"/>
  <line x1="500" y1="0" x2="500" y2="43" stroke="${C.border}"/>
  <line x1="640" y1="0" x2="640" y2="43" stroke="${C.border}"/>

  <!-- Zeilenline -->
  <line x1="0" y1="16" x2="${W-2*M}" y2="16" stroke="${C.border}"/>

  <!-- Header -->
  <text x="8" y="12" class="small" fill="${C.textLight}">Bauherr / Betreiber</text>
  <text x="188" y="12" class="small" fill="${C.textLight}">Standort</text>
  <text x="368" y="12" class="small" fill="${C.textLight}">Plan-Nr.</text>
  <text x="508" y="12" class="small" fill="${C.textLight}">Datum</text>
  <text x="648" y="12" class="small" fill="${C.textLight}">Erstellt von</text>

  <!-- Werte -->
  <text x="8" y="32" class="label">${config.kundenname || 'Anlagenbetreiber'}</text>
  <text x="188" y="26" class="small" fill="${C.text}">${config.standort.split(',')[0] || ''}</text>
  <text x="188" y="38" class="small" fill="${C.text}">${config.standort.split(',')[1]?.trim() || ''}</text>
  <text x="368" y="32" class="label">${planNr}</text>
  <text x="508" y="32" class="label">${datum}</text>
  <text x="648" y="32" class="label">${COMPANY.name}</text>
</g>

</svg>`;

  return svg;
}

export async function downloadSchaltplanSVG(config: SchaltplanConfig, filename?: string): Promise<void> {
  const svg = generateSchaltplanSVG(config);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const { downloadFile } = await import('@/utils/desktopDownload');
  await downloadFile({
    filename: filename || `Uebersichtsschaltplan_${config.kundenname.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.svg`,
    blob,
    fileType: 'svg',
  });
}

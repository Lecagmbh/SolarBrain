/**
 * DEPRECATED: Replaced by new unified Übersichtsschaltplan generator
 * ===================================================================
 * Schaltpläne werden jetzt zentral im Backend via Python/reportlab generiert.
 * Dieser Frontend-Generator wird nicht mehr aktiv verwendet.
 * Backend-Endpoint: POST /api/documents/generate/:installationId
 *
 * --- Ursprüngliche Beschreibung ---
 * Baunity Unified Schaltplan Generator
 * Professioneller VDE-konformer Übersichtsschaltplan (SVG → PDF)
 */

import { jsPDF } from 'jspdf';
import type { UnifiedInstallationData, GeneratedDocument, GeneratorOptions } from './types';
import { COMPANY } from '../../config/company';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
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
};

// ═══════════════════════════════════════════════════════════════════════════
// SVG SYMBOLS (DIN/IEC-konform)
// ═══════════════════════════════════════════════════════════════════════════

const SYMBOLS = {
  pvModule: (x: number, y: number, w: number, h: number) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="${COLORS.pv}" stroke="#e65100" stroke-width="1.5" rx="2"/>
      <line x1="0" y1="${h * 0.33}" x2="${w}" y2="${h * 0.33}" stroke="#e65100" stroke-width="0.5"/>
      <line x1="0" y1="${h * 0.66}" x2="${w}" y2="${h * 0.66}" stroke="#e65100" stroke-width="0.5"/>
      <line x1="${w * 0.5}" y1="0" x2="${w * 0.5}" y2="${h}" stroke="#e65100" stroke-width="0.5"/>
      <text x="${w / 2}" y="${h + 12}" class="small" text-anchor="middle">PV</text>
    </g>
  `,

  inverter: (x: number, y: number, w: number, h: number, label: string) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="${COLORS.white}" stroke="${COLORS.primary}" stroke-width="2" rx="3"/>
      <text x="${w / 2}" y="${h / 2 - 5}" class="label" text-anchor="middle" fill="${COLORS.primary}">~</text>
      <text x="${w / 2}" y="${h / 2 + 10}" class="small" text-anchor="middle">${label}</text>
      <line x1="5" y1="${h - 8}" x2="${w - 5}" y2="${h - 8}" stroke="${COLORS.dc}" stroke-width="1.5"/>
      <line x1="5" y1="8" x2="${w - 5}" y2="8" stroke="${COLORS.ac}" stroke-width="1.5"/>
    </g>
  `,

  meter: (x: number, y: number, r: number) => `
    <g transform="translate(${x}, ${y})">
      <circle cx="0" cy="0" r="${r}" fill="${COLORS.white}" stroke="${COLORS.netz}" stroke-width="2"/>
      <text x="0" y="4" class="small" text-anchor="middle" fill="${COLORS.netz}">kWh</text>
      <line x1="${-r * 0.7}" y1="${-r * 0.7}" x2="${r * 0.7}" y2="${r * 0.7}" stroke="${COLORS.netz}" stroke-width="1"/>
    </g>
  `,

  battery: (x: number, y: number, w: number, h: number, label: string) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="${COLORS.white}" stroke="${COLORS.speicher}" stroke-width="2" rx="3"/>
      <rect x="${w * 0.3}" y="-4" width="${w * 0.4}" height="4" fill="${COLORS.speicher}"/>
      <text x="${w / 2}" y="${h / 2 + 4}" class="small" text-anchor="middle">${label}</text>
    </g>
  `,

  wallbox: (x: number, y: number, w: number, h: number, label: string) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="${COLORS.white}" stroke="${COLORS.wallbox}" stroke-width="2" rx="3"/>
      <circle cx="${w / 2}" cy="${h / 2 - 5}" r="8" fill="none" stroke="${COLORS.wallbox}" stroke-width="1.5"/>
      <text x="${w / 2}" y="${h / 2 + 12}" class="small" text-anchor="middle">${label}</text>
    </g>
  `,

  heatpump: (x: number, y: number, w: number, h: number, label: string) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="${COLORS.white}" stroke="${COLORS.wp}" stroke-width="2" rx="3"/>
      <path d="M${w * 0.3},${h * 0.3} L${w * 0.5},${h * 0.5} L${w * 0.7},${h * 0.3}" fill="none" stroke="${COLORS.wp}" stroke-width="1.5"/>
      <path d="M${w * 0.3},${h * 0.5} L${w * 0.5},${h * 0.7} L${w * 0.7},${h * 0.5}" fill="none" stroke="${COLORS.wp}" stroke-width="1.5"/>
      <text x="${w / 2}" y="${h + 12}" class="small" text-anchor="middle">${label}</text>
    </g>
  `,

  hak: (x: number, y: number, w: number, h: number) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="#d32f2f" stroke="#b71c1c" stroke-width="2" rx="2"/>
      <text x="${w / 2}" y="${h / 2 + 4}" class="label" text-anchor="middle" fill="${COLORS.white}">HAK</text>
    </g>
  `,

  load: (x: number, y: number, w: number, h: number) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="${COLORS.bg}" stroke="${COLORS.border}" stroke-width="1.5" rx="3"/>
      <text x="${w / 2}" y="${h / 2 + 4}" class="small" text-anchor="middle">Verbraucher</text>
    </g>
  `,
};

// ═══════════════════════════════════════════════════════════════════════════
// SVG GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function generateSchaltplanSVG(data: UnifiedInstallationData, options?: GeneratorOptions): string {
  const W = 842, H = 595; // A4 Landscape in pixels
  const M = 25;

  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');
  const planNr = options?.customPlanNumber || `SP-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  const hatPV = data.pvModule.length > 0 || data.gesamtleistungKwp > 0;
  const hatSpeicher = data.speicher.length > 0 || data.speicherKapazitaetKwh > 0;
  const hatWallbox = data.wallboxen.length > 0;
  const hatWP = data.waermepumpen.length > 0;

  const kundenname = `${data.kunde.vorname} ${data.kunde.nachname}`.trim() || 'Anlagenbetreiber';
  const standort = `${data.standort.strasse} ${data.standort.hausnummer}, ${data.standort.plz} ${data.standort.ort}`;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>
    .title { font: bold 14px Arial, sans-serif; fill: ${COLORS.text}; }
    .subtitle { font: 500 11px Arial, sans-serif; fill: ${COLORS.textLight}; }
    .label { font: 600 10px Arial, sans-serif; fill: ${COLORS.text}; }
    .small { font: 400 8px Arial, sans-serif; fill: ${COLORS.textLight}; }
    .value { font: 600 9px Arial, sans-serif; fill: ${COLORS.text}; }
    .ac-line { stroke: ${COLORS.ac}; stroke-width: 2.5; fill: none; }
    .dc-line { stroke: ${COLORS.dc}; stroke-width: 2; fill: none; stroke-dasharray: 8,4; }
  </style>
  <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="${COLORS.netz}"/>
  </marker>
</defs>

<!-- Hintergrund -->
<rect width="${W}" height="${H}" fill="${COLORS.white}"/>

<!-- Rahmen -->
<rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}" fill="none" stroke="${COLORS.border}" stroke-width="1"/>

<!-- Header -->
<rect x="${M}" y="${M}" width="${W - 2 * M}" height="40" fill="${COLORS.bg}"/>
<text x="${M + 15}" y="${M + 18}" class="title">ÜBERSICHTSSCHALTPLAN</text>
<text x="${M + 15}" y="${M + 32}" class="subtitle">nach VDE-AR-N 4105 | ${standort}</text>
<rect x="${W - M - 100}" y="${M + 5}" width="90" height="30" fill="${COLORS.primary}" rx="3"/>
<text x="${W - M - 55}" y="${M + 25}" class="label" text-anchor="middle" fill="${COLORS.white}">${COMPANY.name}</text>
<line x1="${M}" y1="${M + 40}" x2="${W - M}" y2="${M + 40}" stroke="${COLORS.border}" stroke-width="1"/>

<!-- Hauptzeichenbereich -->
`;

  // Zeichenbereich Koordinaten
  const drawY = M + 60;
  const centerY = drawY + 180;
  const leftX = M + 60;

  // NETZ Symbol (links)
  svg += `
<!-- Netz -->
<g transform="translate(${leftX}, ${centerY - 30})">
  <line x1="0" y1="0" x2="0" y2="60" stroke="${COLORS.netz}" stroke-width="3"/>
  <line x1="-8" y1="0" x2="8" y2="0" stroke="${COLORS.netz}" stroke-width="3"/>
  <line x1="-8" y1="60" x2="8" y2="60" stroke="${COLORS.netz}" stroke-width="3"/>
  <text x="0" y="-15" class="label" text-anchor="middle">NETZ</text>
  <text x="0" y="-5" class="small" text-anchor="middle">230/400V 50Hz</text>
  <text x="0" y="78" class="small" text-anchor="middle">3~ TN-C-S</text>
</g>
`;

  // HAK
  const hakX = leftX + 60;
  svg += `
<!-- HAK -->
<line x1="${leftX + 10}" y1="${centerY}" x2="${hakX - 20}" y2="${centerY}" class="ac-line"/>
${SYMBOLS.hak(hakX - 20, centerY - 25, 40, 50)}
`;

  // Zähler
  const meterX = hakX + 80;
  svg += `
<!-- Zähler -->
<line x1="${hakX + 20}" y1="${centerY}" x2="${meterX - 25}" y2="${centerY}" class="ac-line"/>
${SYMBOLS.meter(meterX, centerY, 22)}
<text x="${meterX}" y="${centerY - 35}" class="label" text-anchor="middle">ZÄHLER</text>
<text x="${meterX}" y="${centerY + 40}" class="small" text-anchor="middle">2-Richtung</text>
${data.zaehlernummer ? `<text x="${meterX}" y="${centerY + 52}" class="small" text-anchor="middle">${data.zaehlernummer}</text>` : ''}
`;

  // Hauptverteiler (Sammelschiene)
  const busX = meterX + 80;
  const busH = 280;
  const busY = centerY - busH / 2;
  svg += `
<!-- Hauptverteiler / Sammelschiene -->
<line x1="${meterX + 25}" y1="${centerY}" x2="${busX}" y2="${centerY}" class="ac-line"/>
<rect x="${busX}" y="${busY}" width="8" height="${busH}" fill="${COLORS.netz}"/>
<text x="${busX + 4}" y="${busY - 10}" class="label" text-anchor="middle">VERTEILER</text>
`;

  // Komponenten rechts vom Verteiler
  const compX = busX + 80;
  let compY = busY + 20;
  const compW = 80;
  const compH = 50;
  const compGap = 20;

  // PV-Anlage
  if (hatPV) {
    const pvKwp = data.gesamtleistungKwp.toFixed(2);
    const moduleCount = data.pvModule.reduce((sum, m) => sum + m.anzahl, 0);
    const wrKva = data.gesamtleistungKva.toFixed(1);

    svg += `
<!-- PV-Anlage -->
<line x1="${busX + 8}" y1="${compY + compH / 2}" x2="${compX - 10}" y2="${compY + compH / 2}" class="ac-line"/>
${SYMBOLS.inverter(compX - 10, compY, compW, compH, `${wrKva} kVA`)}
<line x1="${compX + compW - 10}" y1="${compY + compH / 2}" x2="${compX + compW + 40}" y2="${compY + compH / 2}" class="dc-line"/>
${SYMBOLS.pvModule(compX + compW + 40, compY + 5, 60, 40)}
<text x="${compX + compW + 70}" y="${compY + 65}" class="value" text-anchor="middle">${pvKwp} kWp</text>
<text x="${compX + compW + 70}" y="${compY + 78}" class="small" text-anchor="middle">${moduleCount} Module</text>
`;
    compY += compH + compGap;
  }

  // Speicher
  if (hatSpeicher) {
    const speicherKwh = data.speicherKapazitaetKwh.toFixed(1);
    const kopplung = data.speicher[0]?.kopplung || 'dc';

    svg += `
<!-- Speicher -->
<line x1="${busX + 8}" y1="${compY + compH / 2}" x2="${compX}" y2="${compY + compH / 2}" class="${kopplung === 'ac' ? 'ac-line' : 'dc-line'}"/>
${SYMBOLS.battery(compX, compY, compW, compH, `${speicherKwh} kWh`)}
<text x="${compX + compW / 2}" y="${compY + compH + 15}" class="small" text-anchor="middle">${kopplung.toUpperCase()}-gekoppelt</text>
`;
    compY += compH + compGap;
  }

  // Wallbox
  if (hatWallbox) {
    const wallboxKw = data.wallboxen.reduce((sum, w) => sum + (w.leistungKw * w.anzahl), 0);
    svg += `
<!-- Wallbox -->
<line x1="${busX + 8}" y1="${compY + compH / 2}" x2="${compX}" y2="${compY + compH / 2}" class="ac-line"/>
${SYMBOLS.wallbox(compX, compY, compW, compH, `${wallboxKw} kW`)}
`;
    compY += compH + compGap;
  }

  // Wärmepumpe
  if (hatWP) {
    const wpKw = data.waermepumpen.reduce((sum, w) => sum + w.leistungKw, 0);
    svg += `
<!-- Wärmepumpe -->
<line x1="${busX + 8}" y1="${compY + compH / 2}" x2="${compX}" y2="${compY + compH / 2}" class="ac-line"/>
${SYMBOLS.heatpump(compX, compY, compW, compH, `${wpKw} kW`)}
`;
    compY += compH + compGap;
  }

  // Verbraucher (immer)
  svg += `
<!-- Verbraucher -->
<line x1="${busX + 8}" y1="${compY + compH / 2}" x2="${compX}" y2="${compY + compH / 2}" class="ac-line"/>
${SYMBOLS.load(compX, compY, compW, compH)}
`;

  // Legende
  const legendX = W - M - 180;
  const legendY = drawY + 20;
  svg += `
<!-- Legende -->
<rect x="${legendX}" y="${legendY}" width="160" height="120" fill="${COLORS.bg}" stroke="${COLORS.border}" rx="3"/>
<text x="${legendX + 10}" y="${legendY + 18}" class="label">LEGENDE</text>
<line x1="${legendX + 10}" y1="${legendY + 35}" x2="${legendX + 40}" y2="${legendY + 35}" class="ac-line"/>
<text x="${legendX + 50}" y="${legendY + 38}" class="small">AC-Leitung</text>
<line x1="${legendX + 10}" y1="${legendY + 55}" x2="${legendX + 40}" y2="${legendY + 55}" class="dc-line"/>
<text x="${legendX + 50}" y="${legendY + 58}" class="small">DC-Leitung</text>
<rect x="${legendX + 10}" y="${legendY + 68}" width="15" height="15" fill="${COLORS.pv}" stroke="#e65100" rx="1"/>
<text x="${legendX + 50}" y="${legendY + 80}" class="small">PV-Module</text>
<rect x="${legendX + 10}" y="${legendY + 90}" width="15" height="15" fill="${COLORS.white}" stroke="${COLORS.speicher}" rx="1"/>
<text x="${legendX + 50}" y="${legendY + 102}" class="small">Speicher</text>
`;

  // Technische Daten Box
  const dataX = legendX;
  const dataY = legendY + 140;
  svg += `
<!-- Technische Daten -->
<rect x="${dataX}" y="${dataY}" width="160" height="100" fill="${COLORS.bg}" stroke="${COLORS.border}" rx="3"/>
<text x="${dataX + 10}" y="${dataY + 18}" class="label">ANLAGENDATEN</text>
<text x="${dataX + 10}" y="${dataY + 38}" class="small">PV-Leistung:</text>
<text x="${dataX + 150}" y="${dataY + 38}" class="value" text-anchor="end">${data.gesamtleistungKwp.toFixed(2)} kWp</text>
<text x="${dataX + 10}" y="${dataY + 53}" class="small">WR-Leistung:</text>
<text x="${dataX + 150}" y="${dataY + 53}" class="value" text-anchor="end">${data.gesamtleistungKva.toFixed(1)} kVA</text>
${hatSpeicher ? `<text x="${dataX + 10}" y="${dataY + 68}" class="small">Speicher:</text><text x="${dataX + 150}" y="${dataY + 68}" class="value" text-anchor="end">${data.speicherKapazitaetKwh.toFixed(1)} kWh</text>` : ''}
<text x="${dataX + 10}" y="${dataY + 83}" class="small">Messkonzept:</text>
<text x="${dataX + 150}" y="${dataY + 83}" class="value" text-anchor="end">${data.messkonzept}</text>
`;

  // Schriftfeld (Footer)
  const sfY = H - M - 45;
  const sfH = 40;
  svg += `
<!-- Schriftfeld -->
<rect x="${M}" y="${sfY}" width="${W - 2 * M}" height="${sfH}" fill="${COLORS.bg}" stroke="${COLORS.border}"/>
<line x1="${M + 140}" y1="${sfY}" x2="${M + 140}" y2="${H - M}" stroke="${COLORS.border}"/>
<line x1="${M + 340}" y1="${sfY}" x2="${M + 340}" y2="${H - M}" stroke="${COLORS.border}"/>
<line x1="${M + 480}" y1="${sfY}" x2="${M + 480}" y2="${H - M}" stroke="${COLORS.border}"/>
<line x1="${M + 600}" y1="${sfY}" x2="${M + 600}" y2="${H - M}" stroke="${COLORS.border}"/>
<line x1="${M}" y1="${sfY + 15}" x2="${W - M}" y2="${sfY + 15}" stroke="${COLORS.border}"/>

<text x="${M + 5}" y="${sfY + 11}" class="small">Betreiber</text>
<text x="${M + 145}" y="${sfY + 11}" class="small">Anlagenstandort</text>
<text x="${M + 345}" y="${sfY + 11}" class="small">Plan-Nr.</text>
<text x="${M + 485}" y="${sfY + 11}" class="small">Datum</text>
<text x="${M + 605}" y="${sfY + 11}" class="small">Erstellt von</text>

<text x="${M + 5}" y="${sfY + 32}" class="value">${kundenname}</text>
<text x="${M + 145}" y="${sfY + 32}" class="value">${standort}</text>
<text x="${M + 345}" y="${sfY + 32}" class="value">${planNr}</text>
<text x="${M + 485}" y="${sfY + 32}" class="value">${datum}</text>
<text x="${M + 605}" y="${sfY + 32}" class="value">${COMPANY.name}</text>

</svg>`;

  return svg;
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateSchaltplan(
  data: UnifiedInstallationData,
  options?: GeneratorOptions
): Promise<GeneratedDocument> {
  const svg = generateSchaltplanSVG(data, options);
  const blob = await svgToPdf(svg);

  const kundenname = `${data.kunde.nachname}`.replace(/\s+/g, '_') || 'Anlage';
  const datum = new Date().toISOString().split('T')[0];

  return {
    typ: 'schaltplan',
    kategorie: 'SCHALTPLAN',
    name: 'Übersichtsschaltplan',
    filename: `Uebersichtsschaltplan_${kundenname}_${datum}.pdf`,
    blob,
    mimeType: 'application/pdf',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: SVG to PDF
// ═══════════════════════════════════════════════════════════════════════════

async function svgToPdf(svgString: string): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const W = 297, H = 210;

  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 842;
      canvas.height = 595;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, W, H);

      URL.revokeObjectURL(url);
      resolve(pdf.output('blob'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };

    img.src = url;
  });
}

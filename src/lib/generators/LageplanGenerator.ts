/**
 * Baunity Unified Lageplan Generator
 * ====================================
 * Premium Design nach Wizard-Designsystem
 * Google Maps Terrain + schön gestaltete Daten (volle Breite)
 */

import { jsPDF } from 'jspdf';
import type { UnifiedInstallationData, GeneratedDocument, GeneratorOptions } from './types';
import { COMPANY } from '../../config/company';

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE MAPS
// ═══════════════════════════════════════════════════════════════════════════

const GOOGLE_MAPS_API_KEY = 'AIzaSyDJW-h3CzLD_Tf36q1vQdBckXtNtLuhj0I';

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
  } catch (e) { /* ignore */ }

  // Fallback OSM
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Baunity/1.0' } });
    const data = await response.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) { /* ignore */ }

  return null;
}

async function fetchGoogleMapsImage(lat: number, lng: number): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=640x400&scale=2&maptype=terrain&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size < 5000) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) { return null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM (Wizard-konform)
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  // Backgrounds
  bgDark: '#0f172a',
  bgCard: '#1e293b',
  bgElevated: '#334155',

  // Accents
  accent: '#638bff',
  success: '#22c55e',
  warning: '#f59e0b',

  // Text
  textPrimary: '#f5f5f7',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.4)',

  // Borders
  border: 'rgba(148,163,184,0.25)',
  borderLight: 'rgba(148,163,184,0.12)',
};

function esc(text: string): string {
  return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplanSVG(
  data: UnifiedInstallationData,
  options?: GeneratorOptions
): Promise<{ svg: string; hasSatelliteImage: boolean }> {
  const W = 842, H = 595;
  const M = 16;

  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');
  const planNr = options?.customPlanNumber || `LP-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Daten
  const kundenname = esc(`${data.kunde.vorname} ${data.kunde.nachname}`.trim() || 'Anlagenbetreiber');
  const strasse = esc(`${data.standort.strasse} ${data.standort.hausnummer}`);
  const plzOrt = esc(`${data.standort.plz} ${data.standort.ort}`);
  const telefon = esc(data.kunde.telefon || '');
  const email = esc(data.kunde.email || '');
  const companyName = esc(COMPANY.name);
  const netzbetreiber = esc(data.netzbetreiber?.name || 'Wird ermittelt');

  // Technische Daten
  const moduleCount = data.pvModule.reduce((sum, m) => sum + m.anzahl, 0);
  const pvKwp = data.gesamtleistungKwp.toFixed(2);
  const wrKva = data.gesamtleistungKva.toFixed(1);
  const speicherKwh = data.speicherKapazitaetKwh;
  const hatSpeicher = speicherKwh > 0;
  const hatWallbox = data.wallboxen.length > 0;
  const hatWP = data.waermepumpen.length > 0;
  const wbKw = data.wallboxen.reduce((s, w) => s + w.leistungKw * w.anzahl, 0);
  const wpKw = data.waermepumpen.reduce((s, w) => s + w.leistungKw, 0);

  // Google Maps
  const addressFull = `${data.standort.strasse} ${data.standort.hausnummer}, ${data.standort.plz} ${data.standort.ort}, Germany`;
  const geo = await geocodeAddress(addressFull);
  let mapImage: string | null = null;
  if (geo) mapImage = await fetchGoogleMapsImage(geo.lat, geo.lng);

  // Dachflächen
  const dachflaechen = data.pvModule.length > 0 ? data.pvModule : [
    { name: 'Dachfläche 1', ausrichtung: 'S', neigung: 30, anzahl: moduleCount || 20, leistungWp: 400 }
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // SVG START
  // ═══════════════════════════════════════════════════════════════════════

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#0f172a"/>
    <stop offset="100%" stop-color="#1e293b"/>
  </linearGradient>
  <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#638bff"/>
    <stop offset="100%" stop-color="#4f7bff"/>
  </linearGradient>
  <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#22c55e"/>
    <stop offset="100%" stop-color="#16a34a"/>
  </linearGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
  </filter>
</defs>

<!-- Hintergrund -->
<rect width="${W}" height="${H}" fill="#020617"/>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- HEADER -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="0" y="0" width="${W}" height="52" fill="url(#headerGrad)"/>
<text x="${M + 8}" y="34" font-family="Inter, Arial" font-size="20" font-weight="700" fill="${COLORS.textPrimary}">LAGEPLAN</text>
<text x="135" y="34" font-family="Inter, Arial" font-size="11" fill="${COLORS.textMuted}">Photovoltaikanlage nach VDE-AR-N 4105</text>

<!-- Company Badge -->
<rect x="${W - M - 130}" y="12" width="120" height="28" rx="14" fill="url(#accentGrad)" filter="url(#shadow)"/>
<text x="${W - M - 70}" y="31" font-family="Inter, Arial" font-size="11" font-weight="600" fill="${COLORS.textPrimary}" text-anchor="middle">${companyName}</text>

`;

  // ═══════════════════════════════════════════════════════════════════════
  // HAUPTBEREICH
  // ═══════════════════════════════════════════════════════════════════════

  const contentY = 62;
  const mapW = 440;
  const mapH = 260;
  const rightPanelX = M + mapW + 12;
  const rightPanelW = W - rightPanelX - M;

  // KARTE
  svg += `
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- GOOGLE MAPS KARTE -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="${M}" y="${contentY}" width="${mapW}" height="${mapH}" rx="12" fill="${COLORS.bgCard}" stroke="${COLORS.border}" filter="url(#shadow)"/>
`;

  if (mapImage) {
    svg += `<image x="${M + 4}" y="${contentY + 4}" width="${mapW - 8}" height="${mapH - 8}" href="${mapImage}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 10px)"/>
<rect x="${M + mapW - 90}" y="${contentY + mapH - 24}" width="82" height="18" rx="4" fill="rgba(0,0,0,0.7)"/>
<text x="${M + mapW - 49}" y="${contentY + mapH - 11}" font-family="Inter, Arial" font-size="9" fill="${COLORS.textSecondary}" text-anchor="middle">© Google Maps</text>
`;
  } else {
    svg += `<text x="${M + mapW/2}" y="${contentY + mapH/2}" font-family="Inter, Arial" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Kartenansicht wird geladen...</text>`;
  }

  // Adresse unter Karte
  svg += `<text x="${M + mapW/2}" y="${contentY + mapH + 18}" font-family="Inter, Arial" font-size="11" font-weight="500" fill="${COLORS.textSecondary}" text-anchor="middle">${strasse}, ${plzOrt}</text>`;

  // ═══════════════════════════════════════════════════════════════════════
  // RECHTE SPALTE - INFO PANELS
  // ═══════════════════════════════════════════════════════════════════════

  let panelY = contentY;
  const panelH1 = 80;
  const panelH2 = 70;
  const panelGap = 10;

  // ANLAGENBETREIBER
  svg += `
<!-- Anlagenbetreiber -->
<rect x="${rightPanelX}" y="${panelY}" width="${rightPanelW}" height="${panelH1}" rx="10" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
<rect x="${rightPanelX}" y="${panelY}" width="${rightPanelW}" height="26" rx="10" fill="url(#accentGrad)"/>
<rect x="${rightPanelX}" y="${panelY + 20}" width="${rightPanelW}" height="6" fill="url(#accentGrad)"/>
<text x="${rightPanelX + 12}" y="${panelY + 17}" font-family="Inter, Arial" font-size="10" font-weight="600" fill="${COLORS.textPrimary}">ANLAGENBETREIBER</text>

<text x="${rightPanelX + 12}" y="${panelY + 44}" font-family="Inter, Arial" font-size="12" font-weight="600" fill="${COLORS.textPrimary}">${kundenname}</text>
${telefon ? `<text x="${rightPanelX + 12}" y="${panelY + 60}" font-family="Inter, Arial" font-size="10" fill="${COLORS.textSecondary}">Tel: ${telefon}</text>` : ''}
${email ? `<text x="${rightPanelX + 12}" y="${panelY + 73}" font-family="Inter, Arial" font-size="9" fill="${COLORS.textMuted}">${email}</text>` : ''}
`;
  panelY += panelH1 + panelGap;

  // ANLAGENSTANDORT
  svg += `
<!-- Anlagenstandort -->
<rect x="${rightPanelX}" y="${panelY}" width="${rightPanelW}" height="${panelH2}" rx="10" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
<rect x="${rightPanelX}" y="${panelY}" width="${rightPanelW}" height="26" rx="10" fill="${COLORS.bgDark}"/>
<rect x="${rightPanelX}" y="${panelY + 20}" width="${rightPanelW}" height="6" fill="${COLORS.bgDark}"/>
<text x="${rightPanelX + 12}" y="${panelY + 17}" font-family="Inter, Arial" font-size="10" font-weight="600" fill="${COLORS.textPrimary}">ANLAGENSTANDORT</text>

<text x="${rightPanelX + 12}" y="${panelY + 44}" font-family="Inter, Arial" font-size="11" font-weight="500" fill="${COLORS.textPrimary}">${strasse}</text>
<text x="${rightPanelX + 12}" y="${panelY + 60}" font-family="Inter, Arial" font-size="11" fill="${COLORS.textSecondary}">${plzOrt}</text>
`;
  panelY += panelH2 + panelGap;

  // NETZBETREIBER
  svg += `
<!-- Netzbetreiber -->
<rect x="${rightPanelX}" y="${panelY}" width="${rightPanelW}" height="55" rx="10" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
<rect x="${rightPanelX}" y="${panelY}" width="${rightPanelW}" height="26" rx="10" fill="#D4A843"/>
<rect x="${rightPanelX}" y="${panelY + 20}" width="${rightPanelW}" height="6" fill="#D4A843"/>
<text x="${rightPanelX + 12}" y="${panelY + 17}" font-family="Inter, Arial" font-size="10" font-weight="600" fill="${COLORS.textPrimary}">NETZBETREIBER</text>
<text x="${rightPanelX + 12}" y="${panelY + 44}" font-family="Inter, Arial" font-size="11" font-weight="500" fill="${COLORS.textPrimary}">${netzbetreiber}</text>
`;

  // ═══════════════════════════════════════════════════════════════════════
  // TECHNISCHE DATEN (VOLLE BREITE)
  // ═══════════════════════════════════════════════════════════════════════

  const techY = contentY + mapH + 35;
  const techH = 75;
  const fullW = W - 2 * M;

  // Dynamische Spalten berechnen
  const techItems = [
    { label: 'PV-LEISTUNG', value: `${pvKwp} kWp`, color: '#f59e0b' },
    { label: 'MODULE', value: `${moduleCount} Stück`, color: '#638bff' },
    { label: 'WECHSELRICHTER', value: `${wrKva} kVA`, color: '#EAD068' },
    { label: 'MESSKONZEPT', value: data.messkonzept || 'Zweirichtung', color: '#06b6d4' },
  ];
  if (hatSpeicher) techItems.push({ label: 'SPEICHER', value: `${speicherKwh.toFixed(1)} kWh`, color: '#22c55e' });
  if (hatWallbox) techItems.push({ label: 'WALLBOX', value: `${wbKw} kW`, color: '#ec4899' });
  if (hatWP) techItems.push({ label: 'WÄRMEPUMPE', value: `${wpKw} kW`, color: '#ef4444' });

  const colCount = techItems.length;
  const colW = (fullW - (colCount - 1) * 8) / colCount;

  svg += `
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- TECHNISCHE DATEN -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="${M}" y="${techY}" width="${fullW}" height="${techH}" rx="12" fill="${COLORS.bgCard}" stroke="${COLORS.border}" filter="url(#shadow)"/>
<rect x="${M}" y="${techY}" width="${fullW}" height="28" rx="12" fill="url(#successGrad)"/>
<rect x="${M}" y="${techY + 22}" width="${fullW}" height="6" fill="url(#successGrad)"/>
<text x="${M + 16}" y="${techY + 19}" font-family="Inter, Arial" font-size="11" font-weight="700" fill="${COLORS.textPrimary}">TECHNISCHE DATEN</text>
`;

  techItems.forEach((item, i) => {
    const x = M + i * (colW + 8);
    svg += `
<rect x="${x + 4}" y="${techY + 34}" width="${colW - 8}" height="34" rx="6" fill="rgba(255,255,255,0.03)"/>
<text x="${x + colW/2}" y="${techY + 48}" font-family="Inter, Arial" font-size="8" font-weight="500" fill="${COLORS.textMuted}" text-anchor="middle" style="letter-spacing:0.05em">${item.label}</text>
<text x="${x + colW/2}" y="${techY + 63}" font-family="Inter, Arial" font-size="13" font-weight="700" fill="${item.color}" text-anchor="middle">${item.value}</text>
`;
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODULFLÄCHEN
  // ═══════════════════════════════════════════════════════════════════════

  const modY = techY + techH + 12;
  const modH = 60;
  const dfCount = Math.min(dachflaechen.length, 4);
  const dfColW = (fullW - (dfCount - 1) * 8) / dfCount;

  svg += `
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- MODULFLÄCHEN -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="${M}" y="${modY}" width="${fullW}" height="${modH}" rx="12" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
<rect x="${M}" y="${modY}" width="${fullW}" height="26" rx="12" fill="#f59e0b"/>
<rect x="${M}" y="${modY + 20}" width="${fullW}" height="6" fill="#f59e0b"/>
<text x="${M + 16}" y="${modY + 17}" font-family="Inter, Arial" font-size="10" font-weight="700" fill="${COLORS.textPrimary}">MODULFLÄCHEN</text>
`;

  dachflaechen.slice(0, 4).forEach((df, i) => {
    const x = M + i * (dfColW + 8);
    const dfKwp = ((df.anzahl * df.leistungWp) / 1000).toFixed(2);
    const dfName = esc(df.name || `Fläche ${i + 1}`);
    svg += `
<text x="${x + 12}" y="${modY + 42}" font-family="Inter, Arial" font-size="10" font-weight="600" fill="${COLORS.textPrimary}">${dfName}</text>
<text x="${x + 12}" y="${modY + 54}" font-family="Inter, Arial" font-size="9" fill="${COLORS.textMuted}">${df.anzahl} Module • ${df.ausrichtung || 'S'} • ${df.neigung || 30}°</text>
<text x="${x + dfColW - 8}" y="${modY + 48}" font-family="Inter, Arial" font-size="12" font-weight="700" fill="#f59e0b" text-anchor="end">${dfKwp} kWp</text>
`;
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SCHRIFTFELD
  // ═══════════════════════════════════════════════════════════════════════

  const sfY = H - 42;
  const sfH = 34;

  svg += `
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SCHRIFTFELD -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<rect x="${M}" y="${sfY}" width="${fullW}" height="${sfH}" rx="8" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>

<!-- Trennlinien -->
<line x1="${M + 160}" y1="${sfY}" x2="${M + 160}" y2="${sfY + sfH}" stroke="${COLORS.borderLight}"/>
<line x1="${M + 420}" y1="${sfY}" x2="${M + 420}" y2="${sfY + sfH}" stroke="${COLORS.borderLight}"/>
<line x1="${M + 540}" y1="${sfY}" x2="${M + 540}" y2="${sfY + sfH}" stroke="${COLORS.borderLight}"/>
<line x1="${M + 680}" y1="${sfY}" x2="${M + 680}" y2="${sfY + sfH}" stroke="${COLORS.borderLight}"/>

<!-- Labels -->
<text x="${M + 8}" y="${sfY + 12}" font-family="Inter, Arial" font-size="7" fill="${COLORS.textMuted}" style="letter-spacing:0.05em">BETREIBER</text>
<text x="${M + 168}" y="${sfY + 12}" font-family="Inter, Arial" font-size="7" fill="${COLORS.textMuted}" style="letter-spacing:0.05em">STANDORT</text>
<text x="${M + 428}" y="${sfY + 12}" font-family="Inter, Arial" font-size="7" fill="${COLORS.textMuted}" style="letter-spacing:0.05em">PLAN-NR.</text>
<text x="${M + 548}" y="${sfY + 12}" font-family="Inter, Arial" font-size="7" fill="${COLORS.textMuted}" style="letter-spacing:0.05em">DATUM</text>
<text x="${M + 688}" y="${sfY + 12}" font-family="Inter, Arial" font-size="7" fill="${COLORS.textMuted}" style="letter-spacing:0.05em">ERSTELLT VON</text>

<!-- Werte -->
<text x="${M + 8}" y="${sfY + 26}" font-family="Inter, Arial" font-size="10" font-weight="500" fill="${COLORS.textPrimary}">${kundenname}</text>
<text x="${M + 168}" y="${sfY + 26}" font-family="Inter, Arial" font-size="10" font-weight="500" fill="${COLORS.textPrimary}">${strasse}, ${plzOrt}</text>
<text x="${M + 428}" y="${sfY + 26}" font-family="Inter, Arial" font-size="10" font-weight="600" fill="${COLORS.accent}">${planNr}</text>
<text x="${M + 548}" y="${sfY + 26}" font-family="Inter, Arial" font-size="10" font-weight="500" fill="${COLORS.textPrimary}">${datum}</text>
<text x="${M + 688}" y="${sfY + 26}" font-family="Inter, Arial" font-size="10" font-weight="500" fill="${COLORS.textPrimary}">${companyName}</text>

</svg>`;

  return { svg, hasSatelliteImage: !!mapImage };
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplan(
  data: UnifiedInstallationData,
  options?: GeneratorOptions
): Promise<GeneratedDocument> {
  const result = await generateLageplanSVG(data, options);
  const blob = await svgToPdf(result.svg);

  const kundenname = `${data.kunde.nachname}`.replace(/\s+/g, '_') || 'Anlage';
  const datum = new Date().toISOString().split('T')[0];

  return {
    typ: 'lageplan',
    kategorie: 'LAGEPLAN',
    name: 'Lageplan',
    filename: `Lageplan_${kundenname}_${datum}.pdf`,
    blob,
    mimeType: 'application/pdf',
  };
}

async function svgToPdf(svgString: string): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;

  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 842 * 2; // Higher resolution
      canvas.height = 595 * 2;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.scale(2, 2);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 842, 595);
      ctx.drawImage(img, 0, 0, 842, 595);

      const imgData = canvas.toDataURL('image/png', 1.0);
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

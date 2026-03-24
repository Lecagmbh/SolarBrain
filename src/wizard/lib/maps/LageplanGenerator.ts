/**
 * Baunity Lageplan Generator - NB-KONFORM
 * =====================================
 * Automatische Generierung von Lageplänen mit Google Maps Satellitenbild
 * 
 * WICHTIG: Folgende Google APIs müssen aktiviert sein:
 * 1. Geocoding API
 * 2. Maps Static API
 */

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDJW-h3CzLD_Tf36q1vQdBckXtNtLuhj0I';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LageplanConfig {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  anlagenleistungKwp: number;
  modulAnzahl: number;
  modulLeistungWp: number;
  kundenname: string;
  lat?: number;
  lng?: number;
  hatSpeicher?: boolean;
  speicherKwh?: number;
}

export interface LageplanResult {
  svg: string;
  lat: number;
  lng: number;
  mapImageBase64: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOCODING - Mit Fallback auf Nominatim (OpenStreetMap)
// ═══════════════════════════════════════════════════════════════════════════

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // 1. Versuche Google Geocoding API
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    
    console.warn('[Lageplan] Google Geocoding Status:', data.status, data.error_message || '');
  } catch (error) {
    console.warn('[Lageplan] Google Geocoding Fehler:', error);
  }
  
  // 2. Fallback: Nominatim (OpenStreetMap) - kostenlos, keine API-Key nötig
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'Baunity-Wizard/1.0' }
    });
    const data = await response.json();
    
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      return { lat, lng };
    }
  } catch (error) {
    console.error('[Lageplan] Nominatim Fehler:', error);
  }
  
  console.error('[Lageplan] Geocoding komplett fehlgeschlagen');
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SATELLITENBILD - Mit Fallback auf OpenStreetMap
// ═══════════════════════════════════════════════════════════════════════════

async function fetchSatelliteImage(lat: number, lng: number, zoom: number = 19): Promise<string | null> {
  // 1. Versuche Google Maps Static API
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=640x480&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(googleUrl);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      // Prüfe ob wir wirklich ein Bild bekommen haben (nicht eine Fehler-JSON)
      if (contentType && contentType.includes('image')) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        console.warn('[Lageplan] Google Maps API hat kein Bild geliefert');
      }
    } else {
      console.warn('[Lageplan] Google Maps API Fehler:', response.status);
    }
  } catch (error) {
    console.warn('[Lageplan] Google Maps Fehler:', error);
  }
  
  // 2. Fallback: OpenStreetMap Tile (Straßenkarte, kein Satellit, aber besser als nichts)
  try {
    // OSM Tile berechnen
    const osmZoom = 18;
    const n = Math.pow(2, osmZoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    
    const osmUrl = `https://tile.openstreetmap.org/${osmZoom}/${x}/${y}.png`;
    
    const response = await fetch(osmUrl, {
      headers: { 'User-Agent': 'Baunity-Wizard/1.0' }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.warn('[Lageplan] OSM Fallback Fehler:', error);
  }
  
  // 3. Letzter Fallback: Generiere ein Platzhalter-Bild
  console.warn('[Lageplan] Verwende Platzhalter-Bild');
  return generatePlaceholderImage(lat, lng);
}

// Generiert ein einfaches Platzhalter-Bild mit Koordinaten
function generatePlaceholderImage(lat: number, lng: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Hintergrund
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, 640, 480);
    
    // Grid
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let i = 0; i < 640; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 480);
      ctx.stroke();
    }
    for (let i = 0; i < 480; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(640, i);
      ctx.stroke();
    }
    
    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Satellitenbild nicht verfügbar', 320, 220);
    
    ctx.font = '16px Arial';
    ctx.fillText(`Koordinaten: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 320, 260);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Bitte Google Maps API aktivieren', 320, 300);
  }
  
  return canvas.toDataURL('image/png');
}

// ═══════════════════════════════════════════════════════════════════════════
// MASSTAB BERECHNUNG
// ═══════════════════════════════════════════════════════════════════════════

function calculateScale(lat: number, zoom: number): { metersPerPixel: number; scaleText: string } {
  const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
  const imageWidthMeters = metersPerPixel * 640;
  const scale = Math.round(imageWidthMeters / 0.64);
  
  let roundedScale: number;
  if (scale < 300) roundedScale = 250;
  else if (scale < 400) roundedScale = 300;
  else if (scale < 600) roundedScale = 500;
  else if (scale < 800) roundedScale = 750;
  else if (scale < 1200) roundedScale = 1000;
  else roundedScale = Math.round(scale / 500) * 500;
  
  return {
    metersPerPixel,
    scaleText: `ca. 1:${roundedScale}`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateLageplanSVG(config: LageplanConfig, mapImageBase64: string, lat: number, lng: number): string {
  const zoom = 19;
  const { scaleText } = calculateScale(lat, zoom);
  
  const width = 842;
  const height = 595;
  const margin = 20;
  const mapX = margin;
  const mapY = 60;
  const mapWidth = 580;
  const mapHeight = 435;
  const datum = new Date().toLocaleDateString('de-DE');
  const adresse = `${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}`;
  
  // Positionen
  const pvX = mapX + 0.35 * mapWidth;
  const pvY = mapY + 0.3 * mapHeight;
  const pvW = 0.3 * mapWidth;
  const pvH = 0.25 * mapHeight;
  const hakX = mapX + 0.25 * mapWidth;
  const hakY = mapY + 0.7 * mapHeight;
  const wrX = mapX + 0.6 * mapWidth;
  const wrY = mapY + 0.65 * mapHeight;
  const spX = mapX + 0.65 * mapWidth;
  const spY = mapY + 0.65 * mapHeight;
  
  // Legende Y-Positionen
  const dcLineY = config.hatSpeicher ? 138 : 116;
  const dcTextY = config.hatSpeicher ? 142 : 120;
  const acLineY = config.hatSpeicher ? 158 : 136;
  const acTextY = config.hatSpeicher ? 162 : 140;
  
  // Legende X
  const legendX = mapX + mapWidth + 20;
  const legendTextX = mapX + mapWidth + 30;
  const legendValueX = mapX + mapWidth + 200;
  const legendLineEndX = mapX + mapWidth + 54;
  const legendLabelX = mapX + mapWidth + 62;
  const legendCircleX = mapX + mapWidth + 42;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">
  
  <defs>
    <pattern id="pvPattern" patternUnits="userSpaceOnUse" width="12" height="8">
      <rect width="12" height="8" fill="#1565c0"/>
      <rect x="0.5" y="0.5" width="5" height="3" fill="#1976d2" stroke="#0d47a1" stroke-width="0.3"/>
      <rect x="6" y="0.5" width="5" height="3" fill="#1976d2" stroke="#0d47a1" stroke-width="0.3"/>
      <rect x="0.5" y="4" width="5" height="3" fill="#1976d2" stroke="#0d47a1" stroke-width="0.3"/>
      <rect x="6" y="4" width="5" height="3" fill="#1976d2" stroke="#0d47a1" stroke-width="0.3"/>
    </pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <rect x="0" y="0" width="${width}" height="50" fill="#1565c0"/>
  <text x="${width/2}" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">LAGEPLAN</text>
  <text x="${width/2}" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">${adresse}</text>
  
  <rect x="${mapX-2}" y="${mapY-2}" width="${mapWidth+4}" height="${mapHeight+4}" fill="none" stroke="#333" stroke-width="2" rx="4"/>
  <image x="${mapX}" y="${mapY}" width="${mapWidth}" height="${mapHeight}" 
         xlink:href="${mapImageBase64}" preserveAspectRatio="xMidYMid slice"/>
  
  <rect x="${pvX}" y="${pvY}" width="${pvW}" height="${pvH}" 
        fill="url(#pvPattern)" fill-opacity="0.7" stroke="#ff9800" stroke-width="3" stroke-dasharray="8,4"/>
  <text x="${pvX + pvW/2}" y="${pvY + pvH/2}" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white"
        style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">PV-ANLAGE</text>
  <text x="${pvX + pvW/2}" y="${pvY + pvH/2 + 14}" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="9" fill="white"
        style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${config.anlagenleistungKwp.toFixed(2)} kWp</text>
  
  <circle cx="${hakX}" cy="${hakY}" r="14" fill="#d32f2f" stroke="white" stroke-width="2" filter="url(#shadow)"/>
  <text x="${hakX}" y="${hakY+1}" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="white">HAK</text>
  
  <circle cx="${wrX}" cy="${wrY}" r="12" fill="#7b1fa2" stroke="white" stroke-width="2" filter="url(#shadow)"/>
  <text x="${wrX}" y="${wrY+1}" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="white">WR</text>`;
  
  if (config.hatSpeicher) {
    svg += `
  <circle cx="${spX}" cy="${spY}" r="12" fill="#388e3c" stroke="white" stroke-width="2" filter="url(#shadow)"/>
  <text x="${spX}" y="${spY+1}" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="white">SP</text>`;
  }
  
  svg += `
  <line x1="${pvX + pvW/2}" y1="${pvY + pvH}" x2="${wrX}" y2="${wrY - 12}" 
        stroke="#ff9800" stroke-width="2" stroke-dasharray="5,3"/>
  <line x1="${wrX}" y1="${wrY + 12}" x2="${hakX}" y2="${hakY - 14}" 
        stroke="#4caf50" stroke-width="2"/>`;
  
  if (config.hatSpeicher) {
    svg += `
  <line x1="${wrX + 12}" y1="${wrY}" x2="${spX - 12}" y2="${spY}" 
        stroke="#2196f3" stroke-width="2" stroke-dasharray="3,2"/>`;
  }
  
  svg += `
  <g transform="translate(${mapX + 25}, ${mapY + 35})">
    <circle cx="0" cy="0" r="22" fill="white" stroke="#333" stroke-width="1.5" filter="url(#shadow)"/>
    <polygon points="0,-18 -6,8 0,2 6,8" fill="#d32f2f"/>
    <polygon points="0,18 -6,-8 0,-2 6,-8" fill="#333"/>
    <text x="0" y="-8" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">N</text>
  </g>
  
  <g transform="translate(${mapX + mapWidth - 120}, ${mapY + mapHeight - 25})">
    <rect x="0" y="0" width="100" height="8" fill="white" stroke="#333" stroke-width="1"/>
    <rect x="0" y="0" width="50" height="8" fill="#333"/>
    <text x="0" y="18" font-family="Arial, sans-serif" font-size="8" fill="#333">0</text>
    <text x="50" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#333">5m</text>
    <text x="100" y="18" text-anchor="end" font-family="Arial, sans-serif" font-size="8" fill="#333">10m</text>
  </g>
  
  <rect x="${legendX}" y="${mapY}" width="200" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="1" rx="6"/>
  <text x="${legendTextX}" y="${mapY + 22}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#333">LEGENDE</text>
  <line x1="${legendTextX}" y1="${mapY + 30}" x2="${legendValueX}" y2="${mapY + 30}" stroke="#ddd"/>
  
  <rect x="${legendTextX}" y="${mapY + 42}" width="24" height="14" fill="url(#pvPattern)" stroke="#ff9800" stroke-width="1.5"/>
  <text x="${legendLabelX}" y="${mapY + 53}" font-family="Arial, sans-serif" font-size="10" fill="#333">PV-Modulflaeche</text>
  
  <circle cx="${legendCircleX}" cy="${mapY + 75}" r="8" fill="#d32f2f"/>
  <text x="${legendLabelX}" y="${mapY + 79}" font-family="Arial, sans-serif" font-size="10" fill="#333">Hausanschlusskasten</text>
  
  <circle cx="${legendCircleX}" cy="${mapY + 97}" r="8" fill="#7b1fa2"/>
  <text x="${legendLabelX}" y="${mapY + 101}" font-family="Arial, sans-serif" font-size="10" fill="#333">Wechselrichter</text>`;
  
  if (config.hatSpeicher) {
    svg += `
  <circle cx="${legendCircleX}" cy="${mapY + 119}" r="8" fill="#388e3c"/>
  <text x="${legendLabelX}" y="${mapY + 123}" font-family="Arial, sans-serif" font-size="10" fill="#333">Batteriespeicher</text>`;
  }
  
  svg += `
  <line x1="${legendTextX}" y1="${mapY + dcLineY}" x2="${legendLineEndX}" y2="${mapY + dcLineY}" stroke="#ff9800" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="${legendLabelX}" y="${mapY + dcTextY}" font-family="Arial, sans-serif" font-size="10" fill="#333">DC-Leitung</text>
  
  <line x1="${legendTextX}" y1="${mapY + acLineY}" x2="${legendLineEndX}" y2="${mapY + acLineY}" stroke="#4caf50" stroke-width="2"/>
  <text x="${legendLabelX}" y="${mapY + acTextY}" font-family="Arial, sans-serif" font-size="10" fill="#333">AC-Leitung</text>
  
  <rect x="${legendX}" y="${mapY + 195}" width="200" height="120" fill="#e3f2fd" stroke="#1565c0" stroke-width="1" rx="6"/>
  <text x="${legendTextX}" y="${mapY + 217}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1565c0">ANLAGENDATEN</text>
  <line x1="${legendTextX}" y1="${mapY + 225}" x2="${legendValueX}" y2="${mapY + 225}" stroke="#1565c0" stroke-opacity="0.3"/>
  
  <text x="${legendTextX}" y="${mapY + 245}" font-family="Arial, sans-serif" font-size="10" fill="#333">Anlagenleistung:</text>
  <text x="${legendValueX}" y="${mapY + 245}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">${config.anlagenleistungKwp.toFixed(2)} kWp</text>
  
  <text x="${legendTextX}" y="${mapY + 262}" font-family="Arial, sans-serif" font-size="10" fill="#333">Modulanzahl:</text>
  <text x="${legendValueX}" y="${mapY + 262}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">${config.modulAnzahl} Stueck</text>
  
  <text x="${legendTextX}" y="${mapY + 279}" font-family="Arial, sans-serif" font-size="10" fill="#333">Modulleistung:</text>
  <text x="${legendValueX}" y="${mapY + 279}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">${config.modulLeistungWp} Wp</text>`;
  
  if (config.hatSpeicher) {
    svg += `
  <text x="${legendTextX}" y="${mapY + 296}" font-family="Arial, sans-serif" font-size="10" fill="#333">Speicherkapazitaet:</text>
  <text x="${legendValueX}" y="${mapY + 296}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">${config.speicherKwh?.toFixed(1) || '—'} kWh</text>`;
  }
  
  svg += `
  <rect x="${legendX}" y="${mapY + 330}" width="200" height="45" fill="#fff3e0" stroke="#ff9800" stroke-width="1" rx="6"/>
  <text x="${legendTextX}" y="${mapY + 350}" font-family="Arial, sans-serif" font-size="9" fill="#333">Koordinaten: ${lat.toFixed(6)}, ${lng.toFixed(6)}</text>
  <text x="${legendTextX}" y="${mapY + 365}" font-family="Arial, sans-serif" font-size="9" fill="#333">Massstab: ${scaleText}</text>
  
  <rect x="${margin}" y="${height - 70}" width="${width - 2*margin}" height="55" fill="none" stroke="#333" stroke-width="1"/>
  <line x1="${margin + 200}" y1="${height - 70}" x2="${margin + 200}" y2="${height - 15}" stroke="#333"/>
  <line x1="${margin + 400}" y1="${height - 70}" x2="${margin + 400}" y2="${height - 15}" stroke="#333"/>
  <line x1="${margin + 600}" y1="${height - 70}" x2="${margin + 600}" y2="${height - 15}" stroke="#333"/>
  <line x1="${margin}" y1="${height - 45}" x2="${width - margin}" y2="${height - 45}" stroke="#333"/>
  
  <text x="${margin + 5}" y="${height - 55}" font-family="Arial, sans-serif" font-size="8" fill="#666">Bauvorhaben / Standort</text>
  <text x="${margin + 205}" y="${height - 55}" font-family="Arial, sans-serif" font-size="8" fill="#666">Bauherr</text>
  <text x="${margin + 405}" y="${height - 55}" font-family="Arial, sans-serif" font-size="8" fill="#666">Massstab</text>
  <text x="${margin + 605}" y="${height - 55}" font-family="Arial, sans-serif" font-size="8" fill="#666">Datum / Erstellt von</text>
  
  <text x="${margin + 5}" y="${height - 32}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">${config.strasse} ${config.hausnummer}</text>
  <text x="${margin + 5}" y="${height - 20}" font-family="Arial, sans-serif" font-size="10" fill="#333">${config.plz} ${config.ort}</text>
  
  <text x="${margin + 205}" y="${height - 32}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">${config.kundenname}</text>
  
  <text x="${margin + 405}" y="${height - 32}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#333">${scaleText}</text>
  
  <text x="${margin + 605}" y="${height - 32}" font-family="Arial, sans-serif" font-size="10" fill="#333">${datum}</text>
  <text x="${margin + 605}" y="${height - 20}" font-family="Arial, sans-serif" font-size="9" fill="#333">Baunity</text>

  <text x="${width - margin}" y="${height - 5}" text-anchor="end" font-family="Arial, sans-serif" font-size="7" fill="#999">Erstellt mit Baunity Wizard - Satellitenbild: Google Maps</text>
</svg>`;

  return svg;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplan(config: LageplanConfig): Promise<LageplanResult | null> {
  let lat = config.lat;
  let lng = config.lng;
  
  if (!lat || !lng) {
    const address = `${config.strasse} ${config.hausnummer}, ${config.plz} ${config.ort}, Deutschland`;
    const coords = await geocodeAddress(address);
    
    if (!coords) {
      console.error('[Lageplan] Geocoding fehlgeschlagen');
      return null;
    }
    
    lat = coords.lat;
    lng = coords.lng;
  }
  
  const mapImageBase64 = await fetchSatelliteImage(lat, lng, 19);
  
  if (!mapImageBase64) {
    console.error('[Lageplan] Satellitenbild konnte nicht geladen werden');
    return null;
  }
  
  const svg = generateLageplanSVG(config, mapImageBase64, lat, lng);

  return { svg, lat, lng, mapImageBase64 };
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateLageplanFromWizard(wizardData: any): Promise<LageplanResult | null> {
  const { step2, step5, step6 } = wizardData;
  
  let modulAnzahl = 0;
  let modulLeistungWp = 0;
  
  step5.dachflaechen?.forEach((df: any) => {
    modulAnzahl += df.modulAnzahl || 0;
    if (df.modulLeistungWp) modulLeistungWp = df.modulLeistungWp;
  });
  
  const hatSpeicher = step5.speicher && step5.speicher.length > 0;
  const speicherKwh = hatSpeicher 
    ? step5.speicher.reduce((sum: number, sp: any) => sum + (sp.kapazitaetKwh || 0) * (sp.anzahl || 1), 0)
    : 0;
  
  const config: LageplanConfig = {
    strasse: step2.strasse || '',
    hausnummer: step2.hausnummer || '',
    plz: step2.plz || '',
    ort: step2.ort || '',
    anlagenleistungKwp: step5.gesamtleistungKwp || 0,
    modulAnzahl,
    modulLeistungWp: modulLeistungWp || 400,
    kundenname: `${step6.vorname || ''} ${step6.nachname || ''}`.trim() || 'Kunde',
    hatSpeicher,
    speicherKwh,
  };
  
  return generateLageplan(config);
}

export default generateLageplan;

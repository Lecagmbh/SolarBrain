/**
 * Baunity MapTiler Integration
 * =========================
 * Holt Satellitenbilder für Lagepläne
 * 
 * API: https://docs.maptiler.com/cloud/api/static-maps/
 */

// MapTiler API Key - HTTP freigegeben
export const MAPTILER_API_KEY = 'CiyrC70Ze81K5xXNqHP1';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MapTilerConfig {
  lat: number;
  lng: number;
  zoom?: number;          // 1-22, default 19 für Häuser
  width?: number;         // Pixel, default 600
  height?: number;        // Pixel, default 400
  style?: 'satellite' | 'hybrid' | 'streets' | 'outdoor';
  marker?: boolean;       // Marker auf Position setzen
  format?: 'png' | 'jpg' | 'webp';
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOCODING: Adresse → Koordinaten
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wandelt eine Adresse in Koordinaten um
 */
export async function geocodeAddress(
  strasse: string,
  hausnummer: string,
  plz: string,
  ort: string
): Promise<GeocodingResult | null> {
  const address = `${strasse} ${hausnummer}, ${plz} ${ort}, Germany`;
  const encoded = encodeURIComponent(address);
  
  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encoded}.json?key=${MAPTILER_API_KEY}&limit=1`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error('[MapTiler] Geocoding failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;
      
      return {
        lat,
        lng,
        displayName: feature.place_name || address,
        confidence: feature.relevance || 0,
      };
    }
    
    console.warn('[MapTiler] No results for address');
    return null;
  } catch (error) {
    console.error('[MapTiler] Geocoding error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATIC MAP URL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert die URL für ein statisches Satellitenbild
 */
export function getStaticMapUrl(config: MapTilerConfig): string {
  const {
    lat,
    lng,
    zoom = 19,
    width = 600,
    height = 400,
    style = 'satellite',
    format = 'png',
  } = config;
  
  // MapTiler Static Maps API
  // https://api.maptiler.com/maps/{style}/static/{lng},{lat},{zoom}/{width}x{height}.{format}?key={key}
  
  const styleMap: Record<string, string> = {
    satellite: 'satellite',
    hybrid: 'hybrid',
    streets: 'streets-v2',
    outdoor: 'outdoor-v2',
  };
  
  const mapStyle = styleMap[style] || 'satellite';
  
  return `https://api.maptiler.com/maps/${mapStyle}/static/${lng},${lat},${zoom}/${width}x${height}.${format}?key=${MAPTILER_API_KEY}`;
}

/**
 * Generiert URL mit Marker
 */
export function getStaticMapUrlWithMarker(config: MapTilerConfig): string {
  const {
    lat,
    lng,
    zoom = 19,
    width = 600,
    height = 400,
    style = 'satellite',
    format = 'png',
  } = config;
  
  const styleMap: Record<string, string> = {
    satellite: 'satellite',
    hybrid: 'hybrid',
    streets: 'streets-v2',
    outdoor: 'outdoor-v2',
  };
  
  const mapStyle = styleMap[style] || 'satellite';
  
  // Mit Marker-Pin
  // marker-{color}({lng},{lat})
  const marker = `pin-s+ff6600(${lng},${lat})`;
  
  return `https://api.maptiler.com/maps/${mapStyle}/static/${marker}/${lng},${lat},${zoom}/${width}x${height}.${format}?key=${MAPTILER_API_KEY}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH IMAGE AS BASE64
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Holt das Satellitenbild und gibt es als Base64 zurück
 */
export async function fetchMapImageBase64(config: MapTilerConfig): Promise<string | null> {
  const url = getStaticMapUrl(config);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      // Keine zusätzlichen Headers um CORS zu vermeiden
    });
    
    if (!response.ok) {
      console.error('[MapTiler] Map fetch failed:', response.status, response.statusText);
      
      // Versuche Fehlerdetails zu lesen
      try {
        const errorText = await response.text();
        console.error('[MapTiler] Error details:', errorText);
      } catch {}
      
      return null;
    }
    
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Entferne "data:image/png;base64," Prefix für reines Base64
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (e) => {
        console.error('[MapTiler] FileReader error:', e);
        reject(e);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[MapTiler] Map fetch error:', error);
    return null;
  }
}

/**
 * Holt Satellitenbild für eine Adresse
 */
export async function fetchSatelliteImageForAddress(
  strasse: string,
  hausnummer: string,
  plz: string,
  ort: string,
  options?: Partial<MapTilerConfig>
): Promise<{ imageBase64: string | null; lat: number; lng: number } | null> {
  // 1. Geocode Adresse
  const coords = await geocodeAddress(strasse, hausnummer, plz, ort);
  
  if (!coords) {
    console.error('[MapTiler] Could not geocode address');
    return null;
  }
  
  // 2. Hole Satellitenbild
  const imageBase64 = await fetchMapImageBase64({
    lat: coords.lat,
    lng: coords.lng,
    zoom: options?.zoom || 19,
    width: options?.width || 800,
    height: options?.height || 600,
    style: 'satellite',
    format: 'png',
  });
  
  if (!imageBase64) {
    console.error('[MapTiler] Could not fetch satellite image');
    // Trotzdem Koordinaten zurückgeben
    return {
      imageBase64: null,
      lat: coords.lat,
      lng: coords.lng,
    };
  }
  
  return {
    imageBase64,
    lat: coords.lat,
    lng: coords.lng,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  geocodeAddress,
  getStaticMapUrl,
  getStaticMapUrlWithMarker,
  fetchMapImageBase64,
  fetchSatelliteImageForAddress,
  MAPTILER_API_KEY,
};

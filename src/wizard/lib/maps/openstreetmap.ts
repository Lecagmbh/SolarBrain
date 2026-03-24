/**
 * Baunity OpenStreetMap Integration
 * ==============================
 * Kostenlose Kartenbilder ohne API Key!
 * 
 * Nutzt:
 * - Nominatim für Geocoding (kostenlos, Open Source)
 * - OpenStreetMap Static Tiles (kostenlos)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  confidence: number;
}

export interface StaticMapConfig {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOMINATIM GEOCODING (OpenStreetMap)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Geocoding mit Nominatim (kostenlos, keine API Key nötig)
 */
export async function geocodeAddressOSM(
  strasse: string,
  hausnummer: string,
  plz: string,
  ort: string
): Promise<GeocodingResult | null> {
  const address = `${strasse} ${hausnummer}, ${plz} ${ort}, Germany`;
  const encoded = encodeURIComponent(address);
  
  try {
    // Nominatim API (OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Baunity-Wizard/1.0 (contact@baunity.de)',
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error('[OSM] Geocoding failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        confidence: parseFloat(result.importance) || 0.5,
      };
    }
    
    console.warn('[OSM] No results for address');
    return null;
  } catch (error) {
    console.error('[OSM] Geocoding error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATIC MAP URL GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert URL für OpenStreetMap Static Image
 * Nutzt geoapify.com (kostenloses Kontingent: 3000/Tag)
 */
export function getOSMStaticMapUrl(config: StaticMapConfig): string {
  const { lat, lng, zoom = 18, width = 600, height = 400 } = config;
  
  // Option 1: Geoapify (3000 free/day, no key for basic)
  // return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${lng},${lat}&zoom=${zoom}`;
  
  // Option 2: OpenStreetMap Tile Server direkt
  // Wir generieren ein Tile-Grid und fügen es zusammen
  // Für Einzelbild nutzen wir einen Static Map Service
  
  // Option 3: staticmapmaker.com (public, free)
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
}

/**
 * Alternative: Google Maps Static (falls du einen Key hast)
 */
export function getGoogleStaticMapUrl(lat: number, lng: number, apiKey: string): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=600x400&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH IMAGE AS BASE64
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Holt Kartenbild als Base64
 */
export async function fetchOSMMapBase64(config: StaticMapConfig): Promise<string | null> {
  const url = getOSMStaticMapUrl(config);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[OSM] Map fetch failed:', response.status);
      return null;
    }
    
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[OSM] Map fetch error:', error);
    return null;
  }
}

/**
 * Hauptfunktion: Holt Karte für eine Adresse
 */
export async function fetchMapForAddress(
  strasse: string,
  hausnummer: string,
  plz: string,
  ort: string,
  options?: Partial<StaticMapConfig>
): Promise<{ imageBase64: string | null; lat: number; lng: number; mapUrl: string } | null> {
  // 1. Geocode
  const coords = await geocodeAddressOSM(strasse, hausnummer, plz, ort);
  
  if (!coords) {
    console.error('[OSM] Could not geocode');
    return null;
  }
  
  // 2. Generiere Map URL
  const mapConfig: StaticMapConfig = {
    lat: coords.lat,
    lng: coords.lng,
    zoom: options?.zoom || 18,
    width: options?.width || 800,
    height: options?.height || 500,
  };
  
  const mapUrl = getOSMStaticMapUrl(mapConfig);
  
  // 3. Versuche Bild zu laden
  const imageBase64 = await fetchOSMMapBase64(mapConfig);
  
  return {
    imageBase64,
    lat: coords.lat,
    lng: coords.lng,
    mapUrl, // Falls Base64 fehlschlägt, kann man die URL direkt nutzen
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EMBED MAP HTML (Alternative wenn Static nicht funktioniert)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert einen einbettbaren OpenStreetMap iframe
 */
export function getOSMEmbedUrl(lat: number, lng: number, zoom: number = 18): string {
  const delta = 0.01 / zoom; // Zoom-abhängiger Ausschnitt
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-delta},${lat-delta},${lng+delta},${lat+delta}&layer=mapnik&marker=${lat},${lng}`;
}

/**
 * Generiert Google Maps Embed URL
 */
export function getGoogleMapsEmbedUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=19&output=embed`;
}

/**
 * Generiert einen Link zu Google Maps für Screenshot
 */
export function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@${lat},${lng},19z/data=!3m1!1e3`;
}

export default {
  geocodeAddressOSM,
  getOSMStaticMapUrl,
  fetchOSMMapBase64,
  fetchMapForAddress,
  getOSMEmbedUrl,
  getGoogleMapsLink,
};

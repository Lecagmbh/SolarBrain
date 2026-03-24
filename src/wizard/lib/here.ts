/**
 * Baunity Address Autocomplete Service
 * =====================================
 * Verwendet Photon API (kostenlos, OpenStreetMap-basiert)
 * Fallback auf Nominatim bei Bedarf
 */

export interface AddressSuggestion {
  id: string;
  street: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  label: string;
}

export interface SearchResult {
  suggestions: AddressSuggestion[];
  error?: string;
}

// Photon API (schnell, kostenlos, gut für Deutschland)
const PHOTON_API = 'https://photon.komoot.io/api/';

// Cache für wiederholte Anfragen
const cache = new Map<string, AddressSuggestion[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
const cacheTimestamps = new Map<string, number>();

/**
 * Straßen-Suche mit Autocomplete
 */
export async function searchStreets(
  query: string,
  plz?: string,
  limit: number = 6
): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  // Cache-Key erstellen
  const cacheKey = `${query.toLowerCase()}_${plz || ''}_${limit}`;

  // Cache prüfen
  const cachedResult = cache.get(cacheKey);
  const cachedTime = cacheTimestamps.get(cacheKey);
  if (cachedResult && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    return { suggestions: cachedResult };
  }

  try {
    // Suchtext mit PLZ kombinieren für bessere Ergebnisse
    const searchText = plz ? `${query}, ${plz}` : query;

    const params = new URLSearchParams({
      q: searchText,
      limit: String(limit + 2), // Etwas mehr holen für Filterung
      lang: 'de',
      lat: '51.1657', // Zentrum Deutschland
      lon: '10.4515',
      location_bias_scale: '0.5',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${PHOTON_API}?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('Photon API error:', response.status);
      return { suggestions: [], error: 'API nicht erreichbar' };
    }

    const data = await response.json();

    // Ergebnisse in unser Format umwandeln
    const suggestions: AddressSuggestion[] = [];
    const seenStreets = new Set<string>();

    for (const feature of data.features || []) {
      const props = feature.properties || {};

      // Nur deutsche Ergebnisse
      if (props.country && props.country !== 'Germany' && props.country !== 'Deutschland') {
        continue;
      }

      // Straßenname extrahieren
      const street = props.street || props.name;
      if (!street) continue;

      // PLZ-Filter wenn angegeben
      if (plz && props.postcode && !props.postcode.startsWith(plz.slice(0, 2))) {
        continue;
      }

      // Duplikate vermeiden (gleiche Straße + Stadt)
      const streetKey = `${street.toLowerCase()}_${(props.city || props.locality || '').toLowerCase()}`;
      if (seenStreets.has(streetKey)) continue;
      seenStreets.add(streetKey);

      const city = props.city || props.locality || props.town || props.village || props.municipality || '';
      const state = props.state || '';

      suggestions.push({
        id: feature.properties?.osm_id?.toString() || `${Date.now()}_${suggestions.length}`,
        street: street,
        houseNumber: props.housenumber,
        postalCode: props.postcode,
        city: city,
        state: state,
        country: 'Deutschland',
        lat: feature.geometry?.coordinates?.[1],
        lng: feature.geometry?.coordinates?.[0],
        label: formatLabel(street, props.housenumber, props.postcode, city),
      });

      if (suggestions.length >= limit) break;
    }

    // Cache aktualisieren
    cache.set(cacheKey, suggestions);
    cacheTimestamps.set(cacheKey, Date.now());

    return { suggestions };
  } catch (error) {
    console.error('Address search error:', error);
    return { suggestions: [], error: 'Suche fehlgeschlagen' };
  }
}

/**
 * Vollständige Adress-Suche (Straße + PLZ + Ort)
 */
export async function searchFullAddress(
  query: string,
  limit: number = 5
): Promise<SearchResult> {
  if (!query || query.length < 3) {
    return { suggestions: [] };
  }

  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      lang: 'de',
      lat: '51.1657',
      lon: '10.4515',
    });

    const response = await fetch(`${PHOTON_API}?${params}`);

    if (!response.ok) {
      return { suggestions: [], error: 'API nicht erreichbar' };
    }

    const data = await response.json();

    const suggestions: AddressSuggestion[] = (data.features || [])
      .filter((f: any) => {
        const country = f.properties?.country;
        return !country || country === 'Germany' || country === 'Deutschland';
      })
      .map((feature: any, index: number) => {
        const props = feature.properties || {};
        const street = props.street || props.name || '';
        const city = props.city || props.locality || props.town || props.village || '';

        return {
          id: props.osm_id?.toString() || `${Date.now()}_${index}`,
          street: street,
          houseNumber: props.housenumber,
          postalCode: props.postcode,
          city: city,
          state: props.state,
          country: 'Deutschland',
          lat: feature.geometry?.coordinates?.[1],
          lng: feature.geometry?.coordinates?.[0],
          label: formatLabel(street, props.housenumber, props.postcode, city),
        };
      });

    return { suggestions };
  } catch (error) {
    console.error('Full address search error:', error);
    return { suggestions: [], error: 'Suche fehlgeschlagen' };
  }
}

/**
 * Reverse Geocoding (Koordinaten zu Adresse)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<AddressSuggestion | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      lang: 'de',
    });

    const response = await fetch(`${PHOTON_API}reverse?${params}`);

    if (!response.ok) return null;

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature) return null;

    const props = feature.properties || {};
    const street = props.street || props.name || '';
    const city = props.city || props.locality || props.town || '';

    return {
      id: props.osm_id?.toString() || 'reverse',
      street: street,
      houseNumber: props.housenumber,
      postalCode: props.postcode,
      city: city,
      state: props.state,
      country: 'Deutschland',
      lat: lat,
      lng: lng,
      label: formatLabel(street, props.housenumber, props.postcode, city),
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Helper: Label formatieren
 */
function formatLabel(
  street?: string,
  houseNumber?: string,
  postcode?: string,
  city?: string
): string {
  const parts: string[] = [];

  if (street) {
    parts.push(houseNumber ? `${street} ${houseNumber}` : street);
  }

  if (postcode || city) {
    const location = [postcode, city].filter(Boolean).join(' ');
    if (location) parts.push(location);
  }

  return parts.join(', ');
}

/**
 * Cache leeren (z.B. bei Logout)
 */
export function clearAddressCache(): void {
  cache.clear();
  cacheTimestamps.clear();
}

/**
 * Baunity HERE API Service - Adress-Autocomplete
 * ============================================
 * Straßensuche mit HERE Autocomplete API
 * 
 * Free Tier: 1.000 Anfragen/Tag
 */

// HERE API Credentials
const HERE_API_KEY = 'iejuO4-lYOXiY49w7badVbmicJ6ENLDpBUYVnUgjv60';

export interface AddressSuggestion {
  id: string;
  title: string;           // Vollständige Adresse
  street: string;          // Nur Straßenname
  houseNumber?: string;    // Hausnummer (falls vorhanden)
  postalCode?: string;     // PLZ
  city?: string;           // Ort
  state?: string;          // Bundesland
  country?: string;        // Land
  position?: {
    lat: number;
    lng: number;
  };
}

export interface AutocompleteResult {
  suggestions: AddressSuggestion[];
  error?: string;
}

/**
 * Sucht Straßen/Adressen basierend auf Eingabe
 * 
 * @param query - Suchbegriff (z.B. "Vogesenbl")
 * @param plz - Optional: PLZ für bessere Ergebnisse
 * @param limit - Max. Anzahl Ergebnisse (default: 5)
 */
export async function searchStreets(
  query: string,
  plz?: string,
  limit: number = 5
): Promise<AutocompleteResult> {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  try {
    // Query zusammenbauen
    let searchQuery = query;
    if (plz) {
      searchQuery = `${query}, ${plz}`;
    }

    const params = new URLSearchParams({
      q: searchQuery,
      in: 'countryCode:DEU',  // Nur Deutschland
      limit: limit.toString(),
      lang: 'de',
      apiKey: HERE_API_KEY,
    });

    const response = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[HERE] API Error:', response.status);
      return { suggestions: [], error: `API Error: ${response.status}` };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return { suggestions: [] };
    }

    // Ergebnisse parsen
    const suggestions: AddressSuggestion[] = data.items.map((item: any) => {
      const address = item.address || {};
      
      return {
        id: item.id || Math.random().toString(36),
        title: item.title || '',
        street: address.street || item.title?.split(',')[0] || '',
        houseNumber: address.houseNumber,
        postalCode: address.postalCode,
        city: address.city,
        state: address.state,
        country: address.countryName || 'Deutschland',
        position: item.position ? {
          lat: item.position.lat,
          lng: item.position.lng,
        } : undefined,
      };
    });

    return { suggestions };

  } catch (error) {
    console.error('[HERE] Error:', error);
    return { suggestions: [], error: String(error) };
  }
}

/**
 * Geocoding - Adresse zu Koordinaten
 */
export async function geocodeAddress(
  street: string,
  houseNumber: string,
  plz: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = `${street} ${houseNumber}, ${plz} ${city}, Deutschland`;
    
    const params = new URLSearchParams({
      q: query,
      in: 'countryCode:DEU',
      limit: '1',
      apiKey: HERE_API_KEY,
    });

    const response = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?${params}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.items && data.items.length > 0 && data.items[0].position) {
      return {
        lat: data.items[0].position.lat,
        lng: data.items[0].position.lng,
      };
    }

    return null;
  } catch (error) {
    console.error('[HERE] Geocode error:', error);
    return null;
  }
}

export default {
  searchStreets,
  geocodeAddress,
  HERE_API_KEY,
};

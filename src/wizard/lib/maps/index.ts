// MapTiler
export { 
  geocodeAddress,
  getStaticMapUrl,
  getStaticMapUrlWithMarker,
  fetchMapImageBase64,
  fetchSatelliteImageForAddress,
  MAPTILER_API_KEY,
} from './maptiler';
export type { MapTilerConfig, GeocodingResult as MapTilerGeocodingResult } from './maptiler';
export { default as maptiler } from './maptiler';

// OpenStreetMap
export { 
  geocodeAddressOSM,
  getOSMStaticMapUrl,
  fetchOSMMapBase64,
  fetchMapForAddress,
  getOSMEmbedUrl,
  getGoogleMapsLink,
  getGoogleStaticMapUrl,
} from './openstreetmap';
export type { GeocodingResult as OSMGeocodingResult, StaticMapConfig } from './openstreetmap';
export { default as openstreetmap } from './openstreetmap';

// Lageplan V3 (schematisch)
export { 
  generateLageplanSVG as generateLageplanSVGV3,
  extractLageplanConfig as extractLageplanConfigV3,
  generateLageplanFromWizard as generateLageplanFromWizardV3,
} from './LageplanGeneratorV3';
export type { LageplanConfig as LageplanConfigV3 } from './LageplanGeneratorV3';
export { default as LageplanGeneratorV3 } from './LageplanGeneratorV3';

// Lageplan V4 (MIT Satellitenbild - EMPFOHLEN!)
export { 
  generateLageplanSVG as generateLageplanSVGV4,
  extractLageplanConfig as extractLageplanConfigV4,
  generateLageplanFromWizard as generateLageplanFromWizardV4,
} from './LageplanGeneratorV4';
export type { LageplanConfig as LageplanConfigV4 } from './LageplanGeneratorV4';
export { default as LageplanGeneratorV4 } from './LageplanGeneratorV4';

// Default: V4 als primärer Lageplan Generator
export { 
  generateLageplanSVG, 
  extractLageplanConfig, 
  generateLageplanFromWizard,
} from './LageplanGeneratorV4';
export type { LageplanConfig } from './LageplanGeneratorV4';

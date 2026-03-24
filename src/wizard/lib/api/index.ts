/**
 * Baunity API Module - Index
 * ========================
 * Zentrale Exports für alle API-Funktionen
 */

// Core Client
export { api } from './client';

// Wizard API
export { 
  wizardApi, 
  dokumentApi,
  transformWizardData, 
  transformToWizardData,
  type WizardSubmitPayload,
  type InstallationResponse,
  type InstallationDetail,
} from './wizard';

// Netzbetreiber API
export { 
  netzbetreiberApi, 
  searchNetzbetreiberLocal,
  type NetzbetreiberDB,
  type NetzbetreiberLookupResult,
  type NetzbetreiberCreatePayload,
} from './netzbetreiber';

// Produkte API
export { 
  produkteApi, 
  trackProductUsage,
  type HerstellerDB,
  type PvModulDB,
  type WechselrichterDB,
  type SpeicherDB,
  type WallboxDB,
  type WaermepumpeDB,
} from './produkte';

// Legacy Exports (für Backwards-Compatibility mit altem Client)
export { produktApi } from './client';

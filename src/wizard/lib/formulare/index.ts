/**
 * Baunity Formulare Module
 * =====================
 * Automatische Generierung aller erforderlichen Dokumente
 */

// HTML-Formulare (Legacy)
export {
  generateVDEFormulare,
  generateSingleFormular,
  type GeneratedFormular,
  type FormularSet,
} from './vdeGenerator';

// PDF-Formulare V4 (NEU - mit Admin-Only Feldern + ProduktDB)
export {
  generateAllVDEPDFs,
  generateSingleVDEPDF,
  generateE1PDF,
  generateE2PDF,
  generateE3PDF,
  generateE8PDF,
  getVerfuegbareVDEFormulare,
  getInstallateurNr,
  getEingetragenerNetzbetreiber,
  enrichWithProduktDB,
  BAUNITY_EINTRAGUNG,
  type VDEFormularTyp,
  type GeneratorOptionen,
  type GeneratedPDF,
  type ProduktDBDaten,
  type WechselrichterMitDB,
  type SpeicherMitDB,
  type PVModulMitDB,
} from '../pdf/VDEFormularePDF';

// Projektmappe
export {
  generateProjektmappe,
  type ProjektmappeConfig,
  type ProjektmappeResult,
} from './projektmappeGenerator';

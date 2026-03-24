/**
 * PDF Generator Index
 * Alle PDF-Generatoren für Baunity Wizard
 */

// VDE Formulare V4 (mit Admin-Only Feldern + ProduktDB-Integration)
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
} from './VDEFormularePDF';

// Lageplan
export { generateLageplanPDF } from './LageplanPDF';

// Schaltplan
export { generateSchaltplanPDF } from './SchaltplanPDF';

// Vollmacht
export { 
  generateVollmachtPDF, 
  generateVollmachtFromWizard,
  extractVollmachtPDFData,
  type VollmachtPDFData,
} from './VollmachtPDF';

// Projektmappe
export { generateProjektmappePDF } from './ProjektmappePDF';

// PDF Generator V1 (Legacy)
export { 
  htmlToPdf as htmlToPdfV1,
  blobToFile as blobToFileV1,
  type PDFConfig as PDFConfigV1,
} from './pdfGenerator';

// PDF Generator V2
export { 
  htmlToPdf,
  blobToFile,
  generateLageplanPDF as generateLageplanPDFV2,
  generateSchaltplanPDF as generateSchaltplanPDFV2,
  type PDFConfig,
} from './pdfGeneratorV2';

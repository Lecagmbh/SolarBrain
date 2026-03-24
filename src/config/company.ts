/**
 * Baunity Company Configuration
 * ==============================
 * Zentrale Konfiguration für alle Firmendaten.
 * Alle Werte werden aus VITE_ Umgebungsvariablen geladen.
 *
 * Konfiguration: Werte in .env oder .env.production setzen:
 *   VITE_COMPANY_NAME=Baunity GmbH
 *   VITE_COMPANY_STRASSE=Hauptstraße
 *   VITE_COMPANY_HAUSNUMMER=42
 *   ... etc.
 */

export interface CompanyConfig {
  name: string;
  shortName: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  land: string;
  telefon: string;
  email: string;
  website: string;
  agbUrl: string;
  datenschutzUrl: string;
  impressumUrl: string;
  hrNr: string;
  amtsgericht: string;
  ustId: string;
  steuerNr: string;
  geschaeftsfuehrer: string;
  bank: string;
  iban: string;
  bic: string;
  installateurNr: string;
}

export interface InstallerRegistration {
  nr: string;
  netzbetreiber: string;
}

function env(key: string, fallback: string = ''): string {
  // Support both Vite (import.meta.env) and Next.js (process.env)
  // Check process.env first (works in Next.js and Node)
  if (typeof process !== 'undefined' && process.env) {
    // Next.js: VITE_* -> NEXT_PUBLIC_* mapping
    const nextKey = key.replace('VITE_', 'NEXT_PUBLIC_');
    if (process.env[nextKey]) return process.env[nextKey] as string;
    if (process.env[key]) return process.env[key] as string;
  }
  // Vite - use dynamic access to avoid TypeScript errors in non-Vite environments
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (import.meta as any);
    if (meta?.env?.[key]) return meta.env[key] as string;
  } catch {
    // Not in Vite environment
  }
  return fallback;
}

/**
 * Baunity Firmendaten
 * Konfigurierbar über VITE_COMPANY_* Umgebungsvariablen.
 */
export const COMPANY: CompanyConfig = {
  name: env('VITE_COMPANY_NAME', 'Baunity'),
  shortName: env('VITE_COMPANY_SHORT_NAME', 'Baunity'),
  strasse: env('VITE_COMPANY_STRASSE'),
  hausnummer: env('VITE_COMPANY_HAUSNUMMER'),
  plz: env('VITE_COMPANY_PLZ'),
  ort: env('VITE_COMPANY_ORT'),
  land: env('VITE_COMPANY_LAND', 'Deutschland'),
  telefon: env('VITE_COMPANY_TELEFON'),
  email: env('VITE_COMPANY_EMAIL'),
  website: env('VITE_COMPANY_WEBSITE', 'https://baunity.de'),
  agbUrl: env('VITE_COMPANY_AGB_URL', 'https://baunity.de/agb'),
  datenschutzUrl: env('VITE_COMPANY_DATENSCHUTZ_URL', 'https://baunity.de/datenschutz'),
  impressumUrl: env('VITE_COMPANY_IMPRESSUM_URL', 'https://baunity.de/impressum'),
  hrNr: env('VITE_COMPANY_HR_NR'),
  amtsgericht: env('VITE_COMPANY_AMTSGERICHT'),
  ustId: env('VITE_COMPANY_UST_ID'),
  steuerNr: env('VITE_COMPANY_STEUER_NR'),
  geschaeftsfuehrer: env('VITE_COMPANY_GESCHAEFTSFUEHRER'),
  bank: env('VITE_COMPANY_BANK'),
  iban: env('VITE_COMPANY_IBAN'),
  bic: env('VITE_COMPANY_BIC'),
  installateurNr: env('VITE_COMPANY_INSTALLATEUR_NR'),
};

/**
 * Installateurausweise pro Netzbetreiber.
 * Konfigurierbar über VITE_INSTALLER_REGISTRATIONS als JSON-String:
 *   VITE_INSTALLER_REGISTRATIONS='{"UEWM":{"nr":"0366-471-01","netzbetreiber":"Überlandwerk Mittelbaden"}}'
 */
function loadInstallerRegistrations(): Record<string, InstallerRegistration> {
  const jsonStr = env('VITE_INSTALLER_REGISTRATIONS');
  if (jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch {
      console.warn('VITE_INSTALLER_REGISTRATIONS ist kein gültiges JSON, verwende leere Registrierungen');
    }
  }
  return {};
}

export const INSTALLER_REGISTRATIONS: Record<string, InstallerRegistration> = loadInstallerRegistrations();

/**
 * @deprecated Use INSTALLER_REGISTRATIONS instead
 */
export const LECA_EINTRAGUNG = INSTALLER_REGISTRATIONS;

/**
 * @deprecated Use COMPANY instead - kept for backwards compatibility
 */
export const BAUNITY_FIRMA = COMPANY;

/**
 * @deprecated Use COMPANY instead - will be removed after full migration
 */
export const LECA_FIRMA = COMPANY;

export default COMPANY;

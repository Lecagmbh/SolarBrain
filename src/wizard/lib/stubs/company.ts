/**
 * Company Config Stubs for Wizard
 * Local version of config/company exports
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
  if (typeof process !== 'undefined' && process.env) {
    const nextKey = key.replace('VITE_', 'NEXT_PUBLIC_');
    if (process.env[nextKey]) return process.env[nextKey] as string;
    if (process.env[key]) return process.env[key] as string;
  }
  return fallback;
}

export const COMPANY: CompanyConfig = {
  name: env('VITE_COMPANY_NAME', 'LeCa GmbH & Co. KG'),
  shortName: env('VITE_COMPANY_SHORT_NAME', 'Baunity'),
  strasse: env('VITE_COMPANY_STRASSE', ''),
  hausnummer: env('VITE_COMPANY_HAUSNUMMER', ''),
  plz: env('VITE_COMPANY_PLZ', ''),
  ort: env('VITE_COMPANY_ORT', ''),
  land: env('VITE_COMPANY_LAND', 'Deutschland'),
  telefon: env('VITE_COMPANY_TELEFON', ''),
  email: env('VITE_COMPANY_EMAIL', ''),
  website: env('VITE_COMPANY_WEBSITE', 'https://baunity.de'),
  agbUrl: env('VITE_COMPANY_AGB_URL', 'https://baunity.de/agb'),
  datenschutzUrl: env('VITE_COMPANY_DATENSCHUTZ_URL', 'https://baunity.de/datenschutz'),
  impressumUrl: env('VITE_COMPANY_IMPRESSUM_URL', 'https://baunity.de/impressum'),
  hrNr: env('VITE_COMPANY_HR_NR', ''),
  amtsgericht: env('VITE_COMPANY_AMTSGERICHT', ''),
  ustId: env('VITE_COMPANY_UST_ID', ''),
  steuerNr: env('VITE_COMPANY_STEUER_NR', ''),
  geschaeftsfuehrer: env('VITE_COMPANY_GESCHAEFTSFUEHRER', ''),
  bank: env('VITE_COMPANY_BANK', ''),
  iban: env('VITE_COMPANY_IBAN', ''),
  bic: env('VITE_COMPANY_BIC', ''),
  installateurNr: env('VITE_COMPANY_INSTALLATEUR_NR', ''),
};

export const INSTALLER_REGISTRATIONS: Record<string, InstallerRegistration> = {};

/** @deprecated Use INSTALLER_REGISTRATIONS instead */
export const LECA_EINTRAGUNG = INSTALLER_REGISTRATIONS;

/** @deprecated Use COMPANY instead */
export const BAUNITY_FIRMA = COMPANY;

/** @deprecated Use COMPANY instead */
export const LECA_FIRMA = COMPANY;

export default COMPANY;

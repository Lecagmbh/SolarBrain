/**
 * ProduktAutocomplete - Re-Export aus modularer Struktur
 *
 * Die Implementierung wurde in ./produktsuche/ aufgeteilt.
 * Dieser Re-Export hält bestehende Imports kompatibel.
 */
export { ProduktAutocomplete, syncProduktToDb } from './produktsuche';
export type { ProduktDBItem, ProduktTyp } from './produktsuche';

import { ProduktAutocomplete } from './produktsuche';
export default ProduktAutocomplete;

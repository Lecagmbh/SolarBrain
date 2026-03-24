// src/api/types.ts

export type StatusCode = "ERFASSUNG_LECA" | "IN_BEARBEITUNG" | "ABGESCHLOSSEN";

export interface AnlageListItem {
  id: number;
  bezeichnung?: string | null;
  betreiber_name?: string | null;
  netzbetreiber_name?: string | null;
  status?: string | null;
  status_code?: StatusCode | null;
  angelegt_am?: string | null;
}

export interface TechnikItemRow extends Array<string | null> {}

export interface TechnikInfo {
  module?: TechnikItemRow[];
  wechselrichter?: TechnikItemRow[];
  speicher?: TechnikItemRow[];
  wallboxen?: TechnikItemRow[];
}

export interface SteuerbareVerbraucher {
  vorhanden?: "ja" | "nein" | string;
  geraete?: TechnikItemRow[];
}

export interface AnlageDetail {
  id: number;
  bezeichnung?: string | null;
  projekt_betreiber?: string | null;
  adresse?: string | null;
  zaehlpunktnummer?: string | null;
  leistung_kwp?: number | null;
  interne_projektnummer?: string | null;
  netzbetreiber_name?: string | null;
  messkonzept?: string | null;
  angelegt_am?: string | null;
  status?: string | null;
  status_code?: StatusCode | null;
  technik?: TechnikInfo;
  steuerbare_verbraucher?: SteuerbareVerbraucher;
}

export interface Dokument {
  id: number;
  kategorie?: string | null;
  dateiname?: string | null;
  dateityp?: string | null;
  dateigroesse?: number | null;
  erstellt_am?: string | null;
}

export interface Rechnung {
  id: number;
  anlage_id: number;
  rechnungsnummer?: string | null;
  beschreibung?: string | null;
  betrag_gesamt?: number | null;
  status?: string | null;
  faellig_am?: string | null;
  erstellt_am?: string | null;
}

export interface User {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
  kunde_name?: string | null;
  kunde_id?: number | null;
  active: boolean;
}

export interface Kunde {
  id: number;
  name: string;
  // kannst du später erweitern
}

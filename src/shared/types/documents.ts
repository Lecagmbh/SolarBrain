/**
 * Document Definitions for Baunity Wizard
 * Compatible version with proper type imports
 */

import type {
  DokumentTyp,
  Dokument,
  Vorgangsart,
  AnlagenKategorie,
  AnmeldungKategorisierung,
  Groessenklasse,
  DokumentDefinition
} from './index';

// Re-export types for consumers
export type {
  DokumentTyp,
  Dokument,
  Vorgangsart,
  AnlagenKategorie,
  AnmeldungKategorisierung,
  Groessenklasse,
  DokumentDefinition
};

/**
 * Complete document definitions for all document types
 */
export const DOKUMENT_DEFINITIONEN: Record<DokumentTyp, DokumentDefinition> = {
  // Site & Technical Plans
  lageplan: {
    typ: 'lageplan',
    name: 'Lageplan',
    beschreibung: 'Übersichtskarte mit Standort der Anlage',
    hilfeText: 'Bitte laden Sie einen Lageplan hoch, der den Standort der PV-Anlage zeigt',
    akzeptierteFormate: ['pdf', 'jpg', 'png'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: true,
    kannNachgereicht: false
  },
  anlagenschema: {
    typ: 'anlagenschema',
    name: 'Anlagenschema',
    beschreibung: 'Technisches Schema der Anlage',
    hilfeText: 'Schematische Darstellung der elektrischen Anlage',
    akzeptierteFormate: ['pdf', 'dwg', 'jpg', 'png'],
    maxGroesseMb: 15,
    kannAutomatischErstellt: true,
    kannNachgereicht: true
  },
  schaltplan: {
    typ: 'schaltplan',
    name: 'Schaltplan',
    beschreibung: 'Elektrischer Schaltplan',
    hilfeText: 'Detaillierter elektrischer Schaltplan der Anlage',
    akzeptierteFormate: ['pdf', 'dwg'],
    maxGroesseMb: 15,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  uebersichtsschaltplan: {
    typ: 'uebersichtsschaltplan',
    name: 'Übersichtsschaltplan',
    beschreibung: 'Vereinfachter Übersichtsschaltplan',
    hilfeText: 'Übersichtsschaltplan nach VDE-AR-N 4105',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: true,
    kannNachgereicht: true
  },
  installationsnachweis: {
    typ: 'installationsnachweis',
    name: 'Installationsnachweis',
    beschreibung: 'Nachweis der fachgerechten Installation',
    hilfeText: 'Vom Installateur unterschriebener Installationsnachweis',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  inbetriebnahmeprotokoll: {
    typ: 'inbetriebnahmeprotokoll',
    name: 'Inbetriebnahmeprotokoll',
    beschreibung: 'Protokoll der Inbetriebnahme',
    hilfeText: 'Dokumentation der Inbetriebnahme mit Messwerten',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Equipment Datasheets
  wechselrichterDatenblatt: {
    typ: 'wechselrichterDatenblatt',
    name: 'Wechselrichter-Datenblatt',
    beschreibung: 'Technisches Datenblatt des Wechselrichters',
    hilfeText: 'Herstellerdatenblatt mit allen technischen Spezifikationen',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  modulDatenblatt: {
    typ: 'modulDatenblatt',
    name: 'Modul-Datenblatt',
    beschreibung: 'Technisches Datenblatt der PV-Module',
    hilfeText: 'Herstellerdatenblatt mit allen technischen Spezifikationen',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  naSchutzZertifikat: {
    typ: 'naSchutzZertifikat',
    name: 'NA-Schutz-Zertifikat',
    beschreibung: 'Zertifikat für den Netz- und Anlagenschutz',
    hilfeText: 'Konformitätsnachweis nach VDE-AR-N 4105',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  speicherDatenblatt: {
    typ: 'speicherDatenblatt',
    name: 'Speicher-Datenblatt',
    beschreibung: 'Technisches Datenblatt des Batteriespeichers',
    hilfeText: 'Herstellerdatenblatt mit Kapazität und Leistungsdaten',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  wallboxDatenblatt: {
    typ: 'wallboxDatenblatt',
    name: 'Wallbox-Datenblatt',
    beschreibung: 'Technisches Datenblatt der Ladestation',
    hilfeText: 'Herstellerdatenblatt mit Ladeleistung und Steckertyp',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  waermepumpeDatenblatt: {
    typ: 'waermepumpeDatenblatt',
    name: 'Wärmepumpe-Datenblatt',
    beschreibung: 'Technisches Datenblatt der Wärmepumpe',
    hilfeText: 'Herstellerdatenblatt mit Leistungsdaten und COP',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  
  // Legacy snake_case variants
  datenblatt_module: {
    typ: 'datenblatt_module',
    name: 'Datenblatt Module',
    beschreibung: 'Technisches Datenblatt der PV-Module',
    hilfeText: 'Herstellerdatenblatt mit allen technischen Spezifikationen',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  datenblatt_wechselrichter: {
    typ: 'datenblatt_wechselrichter',
    name: 'Datenblatt Wechselrichter',
    beschreibung: 'Technisches Datenblatt des Wechselrichters',
    hilfeText: 'Herstellerdatenblatt mit allen technischen Spezifikationen',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  datenblatt_speicher: {
    typ: 'datenblatt_speicher',
    name: 'Datenblatt Speicher',
    beschreibung: 'Technisches Datenblatt des Batteriespeichers',
    hilfeText: 'Herstellerdatenblatt mit Kapazität und Leistungsdaten',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  datenblatt_wallbox: {
    typ: 'datenblatt_wallbox',
    name: 'Datenblatt Wallbox',
    beschreibung: 'Technisches Datenblatt der Ladestation',
    hilfeText: 'Herstellerdatenblatt mit Ladeleistung und Steckertyp',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  na_schutz_zertifikat: {
    typ: 'na_schutz_zertifikat',
    name: 'NA-Schutz-Zertifikat',
    beschreibung: 'Zertifikat für den Netz- und Anlagenschutz',
    hilfeText: 'Konformitätsnachweis nach VDE-AR-N 4105',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Certificates
  konformitaetserklaerung: {
    typ: 'konformitaetserklaerung',
    name: 'Konformitätserklärung',
    beschreibung: 'EU-Konformitätserklärung der Komponenten',
    hilfeText: 'CE-Konformitätserklärung des Herstellers',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  einheitenzertifikat: {
    typ: 'einheitenzertifikat',
    name: 'Einheitenzertifikat',
    beschreibung: 'Zertifikat nach VDE-AR-N 4105',
    hilfeText: 'Einheitenzertifikat für Erzeugungsanlagen ab 135 kVA',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  anlagenzertifikat: {
    typ: 'anlagenzertifikat',
    name: 'Anlagenzertifikat',
    beschreibung: 'Anlagenzertifikat nach VDE-AR-N 4110',
    hilfeText: 'Zertifikat für größere Anlagen',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Identity & Ownership
  personalausweis: {
    typ: 'personalausweis',
    name: 'Personalausweis',
    beschreibung: 'Kopie des Personalausweises',
    hilfeText: 'Zur Identitätsprüfung, Vorder- und Rückseite',
    akzeptierteFormate: ['pdf', 'jpg', 'png'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: false
  },
  handelsregisterauszug: {
    typ: 'handelsregisterauszug',
    name: 'Handelsregisterauszug',
    beschreibung: 'Aktueller Handelsregisterauszug',
    hilfeText: 'Bei gewerblichen Antragstellern erforderlich',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  grundbuchauszug: {
    typ: 'grundbuchauszug',
    name: 'Grundbuchauszug',
    beschreibung: 'Aktueller Grundbuchauszug',
    hilfeText: 'Nachweis der Eigentumsverhältnisse',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  vermieter_zustimmung: {
    typ: 'vermieter_zustimmung',
    name: 'Vermieter-Zustimmung',
    beschreibung: 'Schriftliche Zustimmung des Vermieters',
    hilfeText: 'Bei Mietobjekten erforderlich',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: true,
    kannNachgereicht: true
  },
  eigentuemernachweis: {
    typ: 'eigentuemernachweis',
    name: 'Eigentümernachweis',
    beschreibung: 'Nachweis des Eigentums',
    hilfeText: 'Grundbuchauszug oder Kaufvertrag',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Energy Documents
  stromrechnung: {
    typ: 'stromrechnung',
    name: 'Stromrechnung',
    beschreibung: 'Aktuelle Stromrechnung',
    hilfeText: 'Zur Ermittlung des Netzbetreibers und Zählernummer',
    akzeptierteFormate: ['pdf', 'jpg', 'png'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: false
  },
  einspeisezusage: {
    typ: 'einspeisezusage',
    name: 'Einspeisezusage',
    beschreibung: 'Einspeisezusage des Netzbetreibers',
    hilfeText: 'Zusage zur Einspeisung vom Netzbetreiber',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Photos
  foto_anlage: {
    typ: 'foto_anlage',
    name: 'Foto Anlage',
    beschreibung: 'Foto der installierten Anlage',
    hilfeText: 'Übersichtsfoto der fertigen Installation',
    akzeptierteFormate: ['jpg', 'png', 'heic'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  foto_zaehler: {
    typ: 'foto_zaehler',
    name: 'Foto Zähler',
    beschreibung: 'Foto des Stromzählers',
    hilfeText: 'Gut lesbare Aufnahme der Zählernummer',
    akzeptierteFormate: ['jpg', 'png', 'heic'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  foto_zaehlerschrank: {
    typ: 'foto_zaehlerschrank',
    name: 'Foto Zählerschrank',
    beschreibung: 'Foto des gesamten Zählerschranks',
    hilfeText: 'Übersichtsfoto des Zählerschranks',
    akzeptierteFormate: ['jpg', 'png', 'heic'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  foto_hak: {
    typ: 'foto_hak',
    name: 'Foto HAK',
    beschreibung: 'Foto des Hausanschlusskastens',
    hilfeText: 'Foto des Hausanschlusskastens (HAK)',
    akzeptierteFormate: ['jpg', 'png', 'heic'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Forms
  vollmacht: {
    typ: 'vollmacht',
    name: 'Vollmacht',
    beschreibung: 'Vollmacht für Baunity',
    hilfeText: 'Berechtigung zur Anmeldung im Namen des Anlagenbetreibers',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: true,
    kannNachgereicht: false
  },
  datenblatt_netzbetreiber: {
    typ: 'datenblatt_netzbetreiber',
    name: 'Datenblatt Netzbetreiber',
    beschreibung: 'Ausgefülltes Datenblatt des Netzbetreibers',
    hilfeText: 'Netzbetreiber-spezifisches Formular',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: true,
    kannNachgereicht: true
  },
  anmeldung_netzbetreiber: {
    typ: 'anmeldung_netzbetreiber',
    name: 'Anmeldung Netzbetreiber',
    beschreibung: 'Anmeldeformular für den Netzbetreiber',
    hilfeText: 'Wird von Baunity automatisch erstellt',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: true,
    kannNachgereicht: false
  },
  anmeldung_mastr: {
    typ: 'anmeldung_mastr',
    name: 'Anmeldung MaStR',
    beschreibung: 'Marktstammdatenregister-Anmeldung',
    hilfeText: 'Wird von Baunity automatisch eingereicht',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: true,
    kannNachgereicht: false
  },

  // Financial
  angebot_rechnung: {
    typ: 'angebot_rechnung',
    name: 'Angebot/Rechnung',
    beschreibung: 'Angebot oder Rechnung des Installateurs',
    hilfeText: 'Zur Dokumentation der Anlagenkosten',
    akzeptierteFormate: ['pdf'],
    maxGroesseMb: 10,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },
  bankverbindung: {
    typ: 'bankverbindung',
    name: 'Bankverbindung',
    beschreibung: 'Nachweis der Bankverbindung',
    hilfeText: 'Für die Einspeisevergütung',
    akzeptierteFormate: ['pdf', 'jpg', 'png'],
    maxGroesseMb: 5,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  },

  // Other
  sonstiges: {
    typ: 'sonstiges',
    name: 'Sonstiges',
    beschreibung: 'Sonstige Dokumente',
    hilfeText: 'Weitere relevante Unterlagen',
    akzeptierteFormate: ['pdf', 'jpg', 'png', 'doc', 'docx'],
    maxGroesseMb: 20,
    kannAutomatischErstellt: false,
    kannNachgereicht: true
  }
};

/**
 * Get document definition by type
 */
export function getDokumentDefinition(typ: DokumentTyp): DokumentDefinition {
  return DOKUMENT_DEFINITIONEN[typ];
}

/**
 * Get required documents based on categorization
 * Note: vorgangsart parameter kept for future use
 */
export function getRequiredDocuments(
  kategorie: AnlagenKategorie,
  _vorgangsart: Vorgangsart,
  groessenklasse: Groessenklasse
): DokumentTyp[] {
  const docs: DokumentTyp[] = ['lageplan', 'vollmacht'];
  
  if (kategorie === 'pv' || kategorie === 'pv_speicher') {
    docs.push('anlagenschema', 'wechselrichterDatenblatt', 'modulDatenblatt');
    
    if (groessenklasse !== 'mini' && groessenklasse !== 'klein') {
      docs.push('naSchutzZertifikat');
    }
    
    if (groessenklasse === 'grossanlage') {
      docs.push('anlagenzertifikat');
    }
  }
  
  if (kategorie === 'speicher' || kategorie === 'pv_speicher') {
    docs.push('speicherDatenblatt');
  }
  
  if (kategorie === 'wallbox') {
    docs.push('wallboxDatenblatt');
  }
  
  if (kategorie === 'waermepumpe') {
    docs.push('waermepumpeDatenblatt');
  }
  
  return docs;
}

/**
 * Get optional documents based on categorization
 * Note: kategorie parameter kept for future use
 */
export function getOptionalDocuments(
  _kategorie: AnlagenKategorie,
  eigentumsverhaeltnis: 'eigentuemer' | 'mieter' | 'pacht' | 'wohnungseigentum'
): DokumentTyp[] {
  const docs: DokumentTyp[] = ['stromrechnung', 'foto_anlage', 'foto_zaehler'];
  
  if (eigentumsverhaeltnis === 'mieter' || eigentumsverhaeltnis === 'pacht') {
    docs.push('vermieter_zustimmung');
  }
  
  if (eigentumsverhaeltnis === 'wohnungseigentum') {
    docs.push('eigentuemernachweis');
  }
  
  return docs;
}

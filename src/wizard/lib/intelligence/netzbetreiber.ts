/**
 * Baunity Intelligence - Netzbetreiber-spezifische Anforderungen
 * Jeder NB hat eigene Formulare, Portale, Bearbeitungszeiten, Besonderheiten
 */

import type { NBAnforderung } from './types';

export const NB_ANFORDERUNGEN: Record<string, NBAnforderung> = {
  'bayernwerk': {
    nbId: 'bayernwerk', nbName: 'Bayernwerk Netz GmbH',
    besonderheiten: [
      'Online-Portal "Netzanschluss-Portal" bevorzugt',
      'E.1-E.6 Formulare im Portal integriert',
      'Digitale Signatur im Portal möglich',
      'Schnelle Bearbeitung bei vollständigen Unterlagen',
      'Eigenes Zählerprogramm für Kaskadenmessung',
    ],
    portalUrl: 'https://www.bayernwerk-netz.de/de/energie-anschliessen/einspeiser.html',
    formulare: ['E.1', 'E.2', 'E.3', 'E.4', 'E.5', 'E.6'],
    bearbeitungszeit: '2-4 Wochen',
    kontakt: { email: 'einspeiser@bayernwerk.de', telefon: '0800 0800 800' },
  },

  'netze-bw': {
    nbId: 'netze-bw', nbName: 'Netze BW GmbH',
    besonderheiten: [
      'Online-Portal "Netzanschluss Online" Pflicht',
      'Strenge Prüfung der Installateur-Berechtigung',
      'Installateur-Ausweis muss hochgeladen werden',
      'NA-Schutz-Prüfung durch akkreditierten Prüfer',
      'Besondere Anforderungen an Schaltpläne',
    ],
    portalUrl: 'https://www.netze-bw.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3', 'Installateursausweis'],
    bearbeitungszeit: '3-5 Wochen',
    kontakt: { email: 'einspeiser@netze-bw.de', telefon: '0800 3629 359' },
  },

  'westnetz': {
    nbId: 'westnetz', nbName: 'Westnetz GmbH',
    besonderheiten: [
      'Sehr großes Netzgebiet in NRW',
      'Portal "Westnetz Netzanschluss"',
      'Automatische Netzverträglichkeitsprüfung im Portal',
      'Schnelle Online-Freigabe bei Standardanlagen',
      'Besondere Regelung für PV > 30 kVA',
    ],
    portalUrl: 'https://www.westnetz.de/de/netzanschluss/einspeiser.html',
    formulare: ['E.1', 'E.2', 'E.3', 'Inbetriebnahmeprotokoll'],
    bearbeitungszeit: '2-4 Wochen',
    kontakt: { email: 'einspeiser@westnetz.de', telefon: '0800 4 112 112' },
  },

  'e-dis': {
    nbId: 'e-dis', nbName: 'E.DIS Netz GmbH',
    besonderheiten: [
      'Netzgebiet Brandenburg und Mecklenburg-Vorpommern',
      'Portal "E.DIS Netzanschluss"',
      'Besondere Anforderungen bei schwachen Netzen',
      'Ggf. Netzausbau erforderlich',
      'Längere Bearbeitungszeiten in ländlichen Gebieten',
    ],
    portalUrl: 'https://www.e-dis-netz.de/de/einspeiser.html',
    formulare: ['E.1', 'E.2', 'E.3', 'Netzverträglichkeitsnachweis'],
    bearbeitungszeit: '4-8 Wochen',
    kontakt: { email: 'einspeiser@e-dis-netz.de', telefon: '0800 0800 500' },
  },

  'avacon': {
    nbId: 'avacon', nbName: 'Avacon Netz GmbH',
    besonderheiten: [
      'Netzgebiet Niedersachsen und Sachsen-Anhalt',
      'Eigene Formulare zusätzlich zu VDE',
      'Strenge NA-Schutz-Anforderungen',
      'Blindleistungsbereitstellung ab 25 kVA',
      'Besondere Prüfung bei Speichern',
    ],
    portalUrl: 'https://www.avacon-netz.de/de/einspeiser.html',
    formulare: ['E.1', 'E.2', 'E.3', 'Avacon-Zusatzformular'],
    bearbeitungszeit: '3-6 Wochen',
    kontakt: { email: 'einspeiser@avacon-netz.de', telefon: '0800 2 282 266' },
  },

  'mitnetz': {
    nbId: 'mitnetz', nbName: 'MITNETZ STROM mbH',
    besonderheiten: [
      'Netzgebiet Sachsen, Sachsen-Anhalt, Thüringen, Brandenburg',
      'Portal "MITNETZ Netzanschluss"',
      'Gute digitale Abwicklung',
      'Schnelle Bearbeitung im Portal',
      'Eigenes Zählerkonzept',
    ],
    portalUrl: 'https://www.mitnetz-strom.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '2-4 Wochen',
    kontakt: { email: 'einspeiser@mitnetz-strom.de', telefon: '0800 0800 500' },
  },

  'sh-netz': {
    nbId: 'sh-netz', nbName: 'Schleswig-Holstein Netz AG',
    besonderheiten: [
      'Netzgebiet Schleswig-Holstein',
      'Hoher PV-Anteil im Netz',
      'Häufiger Einspeisemanagement',
      'Portal "SH Netz Einspeiser"',
      'Gute Online-Abwicklung',
    ],
    portalUrl: 'https://www.sh-netz.com/de/einspeiser.html',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '2-4 Wochen',
    kontakt: { email: 'einspeiser@sh-netz.com', telefon: '0800 1 900 800' },
  },

  'stromnetz-berlin': {
    nbId: 'stromnetz-berlin', nbName: 'Stromnetz Berlin GmbH',
    besonderheiten: [
      'Nur Berlin',
      'Dichtes städtisches Netz',
      'Wenig Netzengpässe',
      'Portal "Stromnetz Berlin Einspeiser"',
      'Schnelle Bearbeitung',
    ],
    portalUrl: 'https://www.stromnetz.berlin/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '2-3 Wochen',
    kontakt: { email: 'einspeiser@stromnetz-berlin.de', telefon: '030 492 02-0' },
  },

  'stromnetz-hamburg': {
    nbId: 'stromnetz-hamburg', nbName: 'Stromnetz Hamburg GmbH',
    besonderheiten: [
      'Nur Hamburg',
      'Städtisches Netz',
      'Portal "Stromnetz Hamburg Online"',
      'Gute digitale Prozesse',
      'Schnelle Rückmeldung',
    ],
    portalUrl: 'https://www.stromnetz-hamburg.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '2-3 Wochen',
    kontakt: { email: 'einspeiser@stromnetz-hamburg.de', telefon: '040 49 20 94-0' },
  },

  'syna': {
    nbId: 'syna', nbName: 'Syna GmbH',
    besonderheiten: [
      'Netzgebiet Hessen und angrenzend',
      'Gehört zu Süwag',
      'Portal "Syna Einspeiser"',
      'Gute Bearbeitungszeiten',
      'Besondere Hinweise für Speicher',
    ],
    portalUrl: 'https://www.syna.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '3-4 Wochen',
    kontakt: { email: 'einspeiser@syna.de', telefon: '069 3107-0' },
  },

  'ewe-netz': {
    nbId: 'ewe-netz', nbName: 'EWE NETZ GmbH',
    besonderheiten: [
      'Netzgebiet Nordwest-Niedersachsen',
      'Viel ländliches Gebiet',
      'Teilweise schwache Netze',
      'Ggf. längere Prüfung',
      'Portal "EWE Netz Einspeiser"',
    ],
    portalUrl: 'https://www.ewe-netz.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '3-6 Wochen',
    kontakt: { email: 'einspeiser@ewe-netz.de', telefon: '0800 0800 800' },
  },

  'enercity': {
    nbId: 'enercity', nbName: 'enercity Netz GmbH',
    besonderheiten: [
      'Netzgebiet Hannover und Umland',
      'Städtisches Netz',
      'Portal "enercity Netzanschluss"',
      'Gute digitale Abwicklung',
      'Schnelle Bearbeitung',
    ],
    portalUrl: 'https://www.enercity-netz.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '2-4 Wochen',
    kontakt: { email: 'einspeiser@enercity-netz.de', telefon: '0511 430-0' },
  },

  'bnnetze': {
    nbId: 'bnnetze', nbName: 'bnNETZE GmbH',
    besonderheiten: [
      'Netzgebiet Südbaden',
      'Gehört zu Badenova',
      'Portal "bnNETZE Einspeiser"',
      'Regional gute Betreuung',
      'Schnelle Abwicklung',
    ],
    portalUrl: 'https://www.bnnetze.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '2-4 Wochen',
    kontakt: { email: 'einspeiser@bnnetze.de', telefon: '0761 2790-0' },
  },

  'netz-suedwest': {
    nbId: 'netz-suedwest', nbName: 'Netz Südwest GmbH',
    besonderheiten: [
      'Netzgebiet Pfalz und Saarland',
      'Portal "Netz Südwest Online"',
      'Gute Zusammenarbeit mit Installateuren',
      'Standard-Bearbeitungszeit',
    ],
    portalUrl: 'https://www.pfalzwerke-netz.de/einspeiser',
    formulare: ['E.1', 'E.2', 'E.3'],
    bearbeitungszeit: '3-4 Wochen',
    kontakt: { email: 'einspeiser@netz-suedwest.de', telefon: '0621 585-0' },
  },

  'default': {
    nbId: 'default', nbName: 'Standard Netzbetreiber',
    besonderheiten: [
      'VDE-Formulare E.1-E.6 verwenden',
      'Schriftliche Anmeldung per Post/E-Mail',
      'Ggf. eigenes Portal vorhanden',
      'Bei Fragen direkt beim NB anfragen',
    ],
    formulare: ['E.1', 'E.2', 'E.3', 'E.4', 'E.5', 'E.6'],
    bearbeitungszeit: '4-6 Wochen',
  },
};

export function getNBAnforderungen(nbId: string): NBAnforderung {
  const key = String(nbId || '').toLowerCase().replace(/[^a-z]/g, '');
  
  // Versuche zu matchen
  for (const [id, anf] of Object.entries(NB_ANFORDERUNGEN)) {
    if (id === 'default') continue;
    if (key.includes(id.replace(/-/g, '')) || id.replace(/-/g, '').includes(key)) {
      return anf;
    }
  }
  
  // Default zurückgeben wenn nichts passt
  return { ...NB_ANFORDERUNGEN.default, nbId, nbName: nbId };
}

export function getNBBesonderheiten(nbId: string): string[] {
  return getNBAnforderungen(nbId).besonderheiten;
}

export function getNBPortalUrl(nbId: string): string | undefined {
  return getNBAnforderungen(nbId).portalUrl;
}
